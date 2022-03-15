export * from './state';
export * from './io';
export * from './webui';

import { enablePatches } from 'immer';

import { readState, saveState, saveStateSync } from './persist_state';
import { onExit } from './process';
import { globalState } from './state';
import { buildSite, watchAndBuildChanges } from './build';
import { setCurrentModule, getCurrentModule, moduleName } from './modules';

// internal functions needed in generated code
export const __internal = {
  setCurrentModule,
  getCurrentModule,
  moduleName,
};

enablePatches();

export async function run(root: string = process.cwd()) {
  // try to load state from file, fall back to default state
  try {
    globalState.inner = await readState();
  } catch {
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

  // build site and watch for changes
  await buildSite(root);
  watchAndBuildChanges(root);
}
