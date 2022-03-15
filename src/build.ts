import chokidar from 'chokidar';
import { build, BuildOptions, BuildResult } from 'esbuild';
import glob from 'fast-glob';
import path from 'path';
import { writeFile } from 'fs/promises';

import {
  cleanupModule,
  collectDependencies,
  graphAsDotString,
  moduleName,
  setCurrentModule,
} from './modules';
import { DirectedGraph } from 'graphology';

const dependencyGraph = new DirectedGraph<{ updated: number }>();

const buildOptions: BuildOptions = {
  outdir: 'dist',
  format: 'cjs',
  platform: 'node',
  metafile: true,
  outbase: './',
};

const filePattern = (root: string) => `${root}/**/*.ts*`;
const ignoredPaths = (root: string) => [
  `${root}/node_modules/**`,
  `${root}/dist/**`,
];

export async function buildSite(root: string) {
  const buildResult = await build({
    ...buildOptions,
    entryPoints: await glob(filePattern(root), {
      ignore: ignoredPaths(root),
    }),
  });

  onBuild(buildResult, path.join(root, 'dist'), true);
}

export async function watchAndBuildChanges(root: string) {
  chokidar
    .watch(filePattern(root), {
      ignored: ignoredPaths(root),
    })
    .on('change', async (file) => {
      const buildResult = await build({
        ...buildOptions,
        entryPoints: [file],
      });

      onBuild(buildResult, path.join(root, 'dist'), false);
    });
}

async function onBuild(
  result: BuildResult | null,
  rootFolder: string,
  initial: boolean,
) {
  if (!result) {
    console.error('Failed to build modules.');
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

  if (initial) {
    cleanupModule('index');

    console.log('Loading application');
    setCurrentModule('index');
    const mainFun = require(path.join(rootFolder, 'index.js')).default;
    await mainFun();
    setCurrentModule(null);
  }

  for (const file of siteFiles) {
    cleanupModule(moduleName(file, rootFolder));
    delete require.cache[require.resolve(file)];
  }

  for (const file of siteFiles) {
    try {
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

  await writeFile(
    './dist/dependency_graph.dot',
    'digraph G {\n' + graphAsDotString(dependencyGraph) + '}',
  );
}
