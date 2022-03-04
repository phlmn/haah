let currentModule: string | null = null;
export function setCurrentModule(mod: string | null) {
  currentModule = mod;
}

type CleanupFn = () => void | Promise<void>;
let cleanupFns: Array<{ fn: CleanupFn, module: string }> = [];

export function registerModuleCleanup(fn: () => void | Promise<void>) {
  if (!currentModule) {
    // TODO: print warning? or collect cleanup that do not belong to a module?
    return;
  }

  cleanupFns.push({ module: currentModule, fn });
}

export async function cleanupModule(mod: string) {
  const toExecute = cleanupFns.filter(fn => fn.module === mod);
  cleanupFns = cleanupFns.filter(fn => fn.module !== mod);

  for (const fn of toExecute) {
    try {
      await fn.fn();
    } catch (e) {
      console.error(`Failed to execute cleanup function for '${fn.module}'.`);
      console.error(e);
    }
  }
}
