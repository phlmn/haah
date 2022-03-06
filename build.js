const { build } = require('esbuild');
const glob = require('fast-glob');
const { Project } = require('ts-morph');

async function run() {
  const outDir = 'lib';
  const files = await glob('src/**/*.ts');

  const tsProject = new Project({
    compilerOptions: { outDir, emitDeclarationOnly: true },
    tsConfigFilePath: './tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
  tsProject.addSourceFilesAtPaths(files);
  await tsProject.emit();

  await build({
    entryPoints: files,
    outdir: outDir,
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
  });
}

run();
