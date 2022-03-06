export * from './state';
export * from './io';
export * from './webui';

import chokidar from 'chokidar';
import { build, BuildFailure, BuildResult } from 'esbuild';
import glob from 'fast-glob';
import { enablePatches } from 'immer';
import path from 'path';
import { DirectedGraph } from 'graphology';

import { cleanupModule, setCurrentModule } from './modules';
import { readState, saveState, saveStateSync } from './persist_state';
import { onExit } from './process';
import { globalState } from './state';
import { writeFile } from 'fs/promises';

enablePatches();

const dependencyGraph = new DirectedGraph<{ updated: number }>();

async function onBuild(
  error: BuildFailure | null,
  result: BuildResult | null,
  rootFolder: string,
) {
  if (error || !result) {
    console.error('Failed to build modules.');
    console.error(error);
    return;
  }

  const processedFiles = Object.keys(result.metafile.outputs)
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.resolve(file));

  const siteFiles = processedFiles.filter((file) =>
    file.startsWith(path.join(rootFolder, 'site/')),
  );

  console.log('Found modules:');
  console.log(
    siteFiles.map((file) => `    ${moduleName(file, rootFolder)}`).join('\n'),
  );
  console.log();

  cleanupModule('index');

  console.log('Loading application');
  setCurrentModule(moduleName('index.js', rootFolder));
  const mainFun = require(path.join(rootFolder, 'index.js')).default;
  await mainFun();
  setCurrentModule(null);
  console.log();

  // // HACK: wait until the application is initialized before loading site modules
  // await new Promise((resolve) => {
  //   setTimeout(resolve, 100);
  // });

  for (const file of siteFiles) {
    cleanupModule(moduleName(file, rootFolder));
    delete require.cache[require.resolve(file)];
  }

  for (const file of siteFiles) {
    try {
      // const modulePath = path.join(process.cwd(), file);
      console.debug(`Loading module '${moduleName(file, rootFolder)}'`);
      setCurrentModule(moduleName(file, rootFolder));
      require(file);
      setCurrentModule(null);

      const moduleInfo = require.cache[require.resolve(file)];

      collectDependencies(dependencyGraph, moduleInfo, Date.now(), rootFolder);
    } catch (e) {
      console.error(
        `Failed to load module '${moduleName(file, rootFolder)}'\n `,
        e,
        '\n',
      );
      cleanupModule(moduleName(file, rootFolder));
    }
  }

  let dotString = '';
  dependencyGraph.forEachDirectedEdge((edge, attrs, source, target) => {
    dotString += `"${source}" -> "${target}"\n`;
  });

  // To directly assign the positions to the nodes:
  await writeFile('./graph.dot', 'digraph G {\n' + dotString + '}');
}

function collectDependencies(
  graph: DirectedGraph<{ updated: number }>,
  moduleInfo: NodeModule,
  iteration: number,
  rootFolder: string,
  parent?: NodeModule,
) {
  const filePath = moduleInfo.id;

  if (filePath.includes('node_modules') || filePath.startsWith(__dirname))
    return;

  const nodeId = moduleName(filePath, rootFolder);

  const alreadyCollected =
    graph.hasNode(nodeId) &&
    graph.getNodeAttribute(nodeId, 'updated') == iteration;

  if (graph.hasNode(nodeId)) {
    graph.updateNodeAttribute(nodeId, 'updated', () => iteration);
  } else {
    graph.addNode(nodeId, {
      updated: iteration,
    });
  }

  if (parent?.id && !graph.hasEdge(moduleName(parent.id, rootFolder), nodeId)) {
    graph.addDirectedEdge(moduleName(parent.id, rootFolder), nodeId);
  }

  if (!alreadyCollected) {
    // drop old information
    graph.forEachDirectedEdge((edge, _attrs, source) => {
      if (source == nodeId) {
        graph.dropEdge(edge);
      }
    });

    // add edges to dependencies
    moduleInfo.children.forEach((childInfo) => {
      collectDependencies(graph, childInfo, iteration, rootFolder, moduleInfo);
    });
  }
}

export async function run(root: string = process.cwd()) {
  // try to load state from file, fall back to default state
  try {
    globalState.inner = await readState();
  } catch {
    //
    globalState.inner = {};
  }

  // save state before application exits
  onExit(() => {
    saveStateSync(globalState.inner);
  });

  // save state every 15 minutes
  setInterval(async () => {
    await saveState(globalState.inner);
  }, 1000 * 60 * 15);

  // const files = await glob(`${siteRoot}/**/*.ts*`);

  const ignoredPaths = [`${root}/node_modules/**`, `${root}/dist/**`];
  const filePattern = `${root}/**/*.ts*`;

  const files = await glob(filePattern, {
    ignore: ignoredPaths,
  });

  const buildResult = await build({
    entryPoints: files,
    outdir: 'dist',
    format: 'cjs',
    platform: 'node',
    metafile: true,
    outbase: './',
  });

  chokidar
    .watch(filePattern, {
      ignored: ignoredPaths,
    })
    .on('change', async (file) => {
      console.log(moduleName(file, root));
      console.log(dependencyGraph.hasNode(path));
      const buildResult2 = await build({
        entryPoints: [file],
        outdir: 'dist',
        format: 'cjs',
        platform: 'node',
        metafile: true,
        outbase: './',
      });

      onBuild(null, buildResult2, path.join(root, 'dist'));
    });

  onBuild(null, buildResult, path.join(root, 'dist'));
}

function moduleName(fileName: string, rootFolder: string) {
  return path
    .resolve(fileName)
    .substring(
      path.resolve(rootFolder).length + 1,
      fileName.length - '.js'.length,
    );
}
