import chokidar from 'chokidar';
import { build, BuildOptions, BuildResult } from 'esbuild';
import glob from 'fast-glob';
import path from 'path';
import { writeFile } from 'fs/promises';

import {
  cleanupModule,
  collectDependencies,
  getDependents,
  graphAsDotString,
  moduleName,
  setCurrentModule,
  sourceFile,
} from './modules';
import { DirectedGraph } from 'graphology';

const TARGET_FOLDER = '.cache';

const dependencyGraph = new DirectedGraph<{ updated: number }>();

const buildOptions: (root: string) => BuildOptions = (root) => ({
  outdir: path.join(root, TARGET_FOLDER),
  format: 'cjs',
  platform: 'node',
  metafile: true,
  outbase: './',
  banner: {
    js: `// Injected code for dependency tracking
var __haah_internal__haah = require('haah');
var __haah_internal__oldModule = __haah_internal__haah.__internal.getCurrentModule();
__haah_internal__haah.__internal.setCurrentModule(
  __haah_internal__haah.__internal.moduleName(__filename, '${path.join(
    root,
    TARGET_FOLDER,
  )}')
);
`,
  },
  footer: {
    js: `
// Injected code for dependency tracking
__haah_internal__haah.__internal.setCurrentModule(__haah_internal__oldModule);`,
  },
});

const filePattern = (root: string) => `${root}/**/*.ts*`;
const ignoredPaths = (root: string) => [
  `${root}/node_modules/**`,
  `${root}/${TARGET_FOLDER}/**`,
];

export async function buildSite(root: string) {
  const buildResult = await build({
    ...buildOptions(root),
    entryPoints: await glob(filePattern(root), {
      ignore: ignoredPaths(root),
    }),
  });

  onBuild(buildResult, path.join(root, TARGET_FOLDER), true);
}

export async function watchAndBuildChanges(root: string) {
  chokidar
    .watch(filePattern(root), {
      ignored: ignoredPaths(root),
    })
    .on('change', async (file) => {
      const dependents = await Promise.all(
        getDependents(dependencyGraph, moduleName(file, root)).map((module) =>
          sourceFile(module, root),
        ),
      );

      const buildResult = await build({
        ...buildOptions(root),
        entryPoints: [file, ...dependents],
      });

      onBuild(buildResult, path.join(root, TARGET_FOLDER), false);
    });
}

async function onBuild(
  result: BuildResult | null,
  buildRoot: string,
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
    file.startsWith(path.join(buildRoot, 'site/')),
  );

  console.log('Loading modules:');
  console.log(
    siteFiles.map((file) => `    ${moduleName(file, buildRoot)}`).join('\n'),
  );
  console.log();

  if (initial) {
    console.log('Loading application');
    const mainFun = require(path.join(buildRoot, 'index.js')).default;
    await mainFun();
  }

  for (const file of siteFiles) {
    await cleanupModule(moduleName(file, buildRoot));
    delete require.cache[require.resolve(file)];
  }

  for (const file of siteFiles) {
    try {
      console.debug(`Loading module '${moduleName(file, buildRoot)}'`);
      require(file);

      const moduleInfo = require.cache[require.resolve(file)];
      collectDependencies(dependencyGraph, moduleInfo, Date.now(), buildRoot);
    } catch (e) {
      console.error(
        `Failed to load module '${moduleName(file, buildRoot)}'\n `,
        e,
        '\n',
      );
      cleanupModule(moduleName(file, buildRoot));
    }
  }

  await writeFile(
    path.join(buildRoot, 'dependency_graph.dot'),
    'digraph G {\n' + graphAsDotString(dependencyGraph) + '}',
  );
}
