import { stat } from 'fs/promises';
import { DirectedGraph } from 'graphology';
import { bfsFromNode } from 'graphology-traversal';
import path from 'path';

const dependencyGraph = new DirectedGraph<{ updated: number }>();

let currentModule: string | null = null;
export function setCurrentModule(mod: string | null) {
  currentModule = mod;
}

export function getCurrentModule() {
  return currentModule;
}

type CleanupFn = () => void | Promise<void>;
let cleanupFns: Array<{ fn: CleanupFn; module: string }> = [];

export function registerCleanup(fn: () => void | Promise<void>) {
  if (!currentModule) {
    // TODO: print warning? or collect cleanup that do not belong to a module?
    return;
  }

  cleanupFns.push({ module: currentModule, fn });
}

export async function cleanupModule(mod: string) {
  const toExecute = cleanupFns.filter((fn) => fn.module === mod);
  cleanupFns = cleanupFns.filter((fn) => fn.module !== mod);

  for (const fn of toExecute) {
    try {
      await fn.fn();
    } catch (e) {
      console.error(`Failed to execute cleanup function for '${fn.module}'.`);
      console.error(e);
    }
  }
}

function collectDependencies(
  moduleInfo: NodeModule,
  iteration: number,
  rootFolder: string,
  parent?: NodeModule,
) {
  const filePath = moduleInfo.id;
  const graph = dependencyGraph;

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
      collectDependencies(childInfo, iteration, rootFolder, moduleInfo);
    });
  }
}

export function getAllDependents(module: string): string[] {
  if (!dependencyGraph.hasNode(module)) {
    return [];
  }

  const dependents: string[] = [];

  bfsFromNode(
    dependencyGraph,
    module,
    (node) => {
      dependents.push(node);
    },
    { mode: 'in' },
  );

  return dependents;
}

export function dependencyGraphAsDotString() {
  let dotString = '';

  dependencyGraph.forEachDirectedEdge((_edge, _attrs, source, target) => {
    dotString += `"${source}" -> "${target}"\n`;
  });

  return dotString;
}

export function moduleName(fileName: string, rootFolder: string) {
  return path
    .resolve(fileName)
    .substring(
      path.resolve(rootFolder).length + 1,
      fileName.length - '.js'.length,
    );
}

const EXTENSIONS = ['ts', 'tsx'];
export async function sourceFile(module: string, rootFolder: string) {
  const base = path.join(rootFolder, module);

  for (let ext of EXTENSIONS) {
    const filePath = base + '.' + ext;
    try {
      await stat(base + '.' + ext);
      return filePath;
    } catch {
      // no-op
    }
  }

  throw Error('Source file not found');
}

export async function loadModuleFiles(siteFiles: string[], buildRoot: string) {
  for (const file of siteFiles) {
    await cleanupModule(moduleName(file, buildRoot));
    delete require.cache[require.resolve(file)];
  }

  for (const file of siteFiles) {
    try {
      console.debug(`Loading module '${moduleName(file, buildRoot)}'`);
      require(file);

      const moduleInfo = require.cache[require.resolve(file)];
      collectDependencies(moduleInfo, Date.now(), buildRoot);
    } catch (e) {
      console.error(
        `Failed to load module '${moduleName(file, buildRoot)}'\n `,
        e,
        '\n',
      );
      cleanupModule(moduleName(file, buildRoot));
    }
  }
}
