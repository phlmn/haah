export * from './state';
export * from './io';
export * from './webui';

import glob from 'glob';
import { readState, saveState, saveStateSync } from './persist_state';
import { onExit } from './process';
import { globalState } from './state';

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

  glob(`${siteRoot}/**/*.ts*`, function (err, files) {
    console.log(files);
    files.forEach((file) => require(file));
  });
}
