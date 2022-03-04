export * from './state';
export * from './io';
export * from './webui';

import { build, BuildFailure, BuildResult } from 'esbuild';
import glob from 'glob-promise';
import { enablePatches } from 'immer';
import path from 'path';
import { cleanupModule, setCurrentModule } from './modules';
import { readState, saveState, saveStateSync } from './persist_state';
import { onExit } from './process';
import { globalState } from './state';

enablePatches();

async function onBuild(error: BuildFailure | null, result: BuildResult | null) {
  if (error || !result) {
    console.error("Failed to build modules.");
    console.error(error);
    return
  }

  const processedFiles = Object.keys(result.metafile.outputs);

  const siteFiles = processedFiles.filter((file) =>
    file.startsWith('dist/site/'),
  );

  console.log('Found modules:');
  console.log(siteFiles.map((file) => `    ${moduleName(file)}`).join('\n'));
  console.log();

  cleanupModule('index');

  console.log('Loading application');
  setCurrentModule(moduleName('dist/index.js'));
  require(path.join(process.cwd(), 'dist/index.js'));
  setCurrentModule(null);
  console.log();

  // HACK: wait until the application is initialized before loading site modules
  await new Promise((resolve) => {
    setTimeout(resolve, 100)
  });

  for (const file of siteFiles) {
    cleanupModule(moduleName(file));
    const modulePath = path.join(process.cwd(), file);
    delete require.cache[require.resolve(modulePath)];
  }

  for (const file of siteFiles) {
    try {
      const modulePath = path.join(process.cwd(), file);
      console.debug(`Loading module '${moduleName(file)}'`);
      setCurrentModule(moduleName(file));
      require(modulePath);
      setCurrentModule(null);
    } catch (e) {
      console.error(`Failed to load module '${moduleName(file)}'\n `, e, '\n');
      cleanupModule(moduleName(file));
    }
  }
}

export async function run(siteRoot: string = `${process.cwd()}/site`) {
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

  const files = await glob(`${process.cwd()}/**/*.ts*`, {
    ignore: [`${process.cwd()}/node_modules/**`, `${process.cwd()}/dist/**`],
  });

  const buildResult = await build({
    entryPoints: files,
    outdir: 'dist',
    format: 'cjs',
    platform: 'node',
    metafile: true,
    incremental: true,
    watch: {
      onRebuild: onBuild,
    },
  });

  onBuild(null, buildResult);
}

const asdasd = 'dist/site/';

function moduleName(fileName: string) {
  return fileName.substring(asdasd.length, fileName.length - '.js'.length);
}
