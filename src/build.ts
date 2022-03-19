import chokidar from 'chokidar';
import { build, BuildOptions, BuildResult } from 'esbuild';
import glob from 'fast-glob';
import path from 'path';
import { writeFile } from 'fs/promises';

import {
  getAllDependents,
  dependencyGraphAsDotString,
  loadModuleFiles,
  moduleName,
  sourceFile,
} from './modules';
import { exit } from 'process';

export const EXITCODE_RESTART = 42;
const TARGET_FOLDER = '.cache';

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

export async function buildSite(
  root: string,
  { watch }: { watch?: boolean } = {},
) {
  const filePattern = `${root}/**/*.ts*`;
  const ignoredPaths = [
    `${root}/node_modules/**`,
    `${root}/${TARGET_FOLDER}/**`,
  ];

  const buildResult = await build({
    ...buildOptions(root),
    entryPoints: await glob(filePattern, {
      ignore: ignoredPaths,
    }),
  });

  onBuild(buildResult, path.join(root, TARGET_FOLDER), true);

  if (watch) {
    chokidar
      .watch(filePattern, {
        ignored: ignoredPaths,
      })
      .on('change', async (file) => {
        // rebuild module and all of its dependents
        const dependents = await Promise.all(
          getAllDependents(moduleName(file, root)).map((module) =>
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
}

async function onBuild(
  result: BuildResult,
  buildRoot: string,
  initial: boolean,
) {
  const processedFiles = Object.keys(result.metafile.outputs)
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.resolve(file));

  const siteFiles = processedFiles.filter((file) =>
    file.startsWith(path.join(buildRoot, 'site/')),
  );

  const initializationFile = path.join(buildRoot, 'index.js');
  if (processedFiles.includes(initializationFile)) {
    if (initial) {
      console.log('Initializing application');
      const initFn = require(initializationFile).default;
      await initFn();
    } else {
      // we can not hot module replace index.ts, so we trigger a restart with a special exit code
      exit(EXITCODE_RESTART);
    }
  }

  console.log('Loading modules:');
  console.log(
    siteFiles.map((file) => `    ${moduleName(file, buildRoot)}`).join('\n'),
    '\n',
  );
  await loadModuleFiles(siteFiles, buildRoot);

  await writeFile(
    path.join(buildRoot, 'dependency_graph.dot'),
    'digraph G {\n' + dependencyGraphAsDotString() + '}',
  );
}
