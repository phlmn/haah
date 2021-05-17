import { join } from 'path';
import http, { IncomingMessage, ServerResponse } from 'http';
import glob from 'glob';
import fs from 'fs';
import mime from 'mime';

import * as io from 'socket.io';
const esbuild = require('esbuild'); // TODO: why cant we import this???

import {
  createAllNewPatch,
  globalState,
  PatchType,
  updateStateHooks,
} from '..';
import { applyStatePatch } from '../state';
import React from 'react';

async function buildFrontend(siteRoot: string) {
  let haahEsbuildPlugin = {
    name: 'haah',
    setup(build: any) {
      build.onResolve({ filter: /^site_root$/ }, (args: any) => {
        return { path: 'site_root', namespace: 'site_root' };
      });
      build.onLoad(
        { filter: /^site_root$/, namespace: 'site_root' },
        async (args: any) => {
          let imports = glob
            .sync(`${siteRoot}/**/*.ts*`)
            .map((f, i) => `import '${f}';\n`)
            .join('');
          return {
            contents: imports,
            loader: 'ts',
            resolveDir: '/',
          };
        },
      );
      build.onResolve({ filter: /^haah$/ }, (args: any) => {
        return { path: join(__dirname, 'haah_frontend.tsx') };
      });
      build.onResolve({ filter: /^react$/ }, (args: any) => {
        // we have to rewrite all react instances to our own
        // otherwise we have two distinct react instances because of hygienic js modules
        // this for example breaks hooks
        return { path: join(__dirname, '../../node_modules/react/index.js') };
      });
    },
  };

  return await esbuild.build({
    entryPoints: [join(__dirname, 'www/index.tsx')],
    plugins: [haahEsbuildPlugin],
    sourcemap: true,
    outdir: '/',
    bundle: true,
    write: false,
  });
}

async function startServer(
  port: number,
  buildResult: { path: string; contents: Uint8Array }[],
) {
  const server = http.createServer((req, res) => {
    const prepare = (res: ServerResponse) => {
      res.setHeader('Content-Type', `${mime.getType(req.url)}; charset=utf-8`);
      res.writeHead(200);
    };
    const inMemoryFile = buildResult.find((f) => f.path == req.url);
    if (inMemoryFile) {
      prepare(res);
      res.end(inMemoryFile.contents);
    } else {
      if (req.url == '/') {
        req.url = '/index.html';
      }
      fs.readFile(join(__dirname, 'www', req.url), function (err, data) {
        if (!err) {
          prepare(res);
          res.end(data);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ err, url: req.url }));
        }
      });
    }
  });

  const socket = new io.Server(server);
  socket.on('connect', (connection) => {
    connection.emit('patch_server', createAllNewPatch(globalState.inner));

    let last_patch = +new Date();
    connection.on('patch_ui', (patch: PatchType) => {
      console.log(patch);
      try {
        last_patch = +new Date();
        applyStatePatch(patch);
      } catch (_e) {
        setTimeout(() => {
          if (+new Date() - last_patch > 500) {
            connection.emit(
              'patch_server',
              createAllNewPatch(globalState.inner),
            );
            setTimeout(() => {
              connection.emit('patch_outdated');
            }, 100);
          }
        }, 500);
      }
    });
  });

  updateStateHooks.push((patch) => {
    socket.emit('patch_server', patch);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`WebUi is running on http://0.0.0.0:${port}`);
  });
}

export async function initWebui(
  port = 1235,
  siteRoot: string = `${process.cwd()}/site`,
) {
  const buildResult = await buildFrontend(siteRoot);
  await startServer(port, buildResult.outputFiles);
}

export function webuiWidget<T>(name: string, widget: React.FunctionComponent) {}
