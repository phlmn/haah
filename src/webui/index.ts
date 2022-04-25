import { join, relative } from 'path';
import http, { ServerResponse } from 'http';
import fs from 'fs';
import mime from 'mime';

import * as io from 'socket.io';
import * as esbuild from 'esbuild';

import { registerActuator } from '../state';
import { registerCleanup } from '../modules';

export async function initWebui(
  listenIp = '0.0.0.0',
  port = 1235,
  siteRoot: string = `${process.cwd()}/site`,
) {
  const buildResult = await buildFrontend(siteRoot);
  await startServer(listenIp, port, buildResult.outputFiles);
}

async function buildFrontend(siteRoot: string) {
  return await esbuild.build({
    stdin: {
      resolveDir: join(__dirname, '../../src/webui/www/'),
      contents: [
        ...Object.values(widgetFiles),
        join(__dirname, '../../src/webui/www/index.tsx'),
      ]
        .map((file) => relative(join(__dirname, '../../src/webui/www/'), file))
        .map((file) => `import "./${file}";`)
        .join('\n'),
    },
    outbase: join(__dirname, '../../src/webui/www/'),
    sourcemap: true,
    outdir: '/',
    bundle: true,
    write: false,
    minify: true,
  });
}

let socket: io.Server | undefined;

async function startServer(
  listenIp: string,
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
      const buffer = Buffer.from(inMemoryFile.contents);
      prepare(res);
      res.end(buffer);
    } else {
      if (req.url == '/') {
        req.url = '/index.html';
      }

      fs.readFile(
        join(__dirname, '../../src/webui/www', req.url),
        function (err, data) {
          if (!err) {
            prepare(res);
            res.end(data);
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ err, url: req.url }));
          }
        },
      );
    }
  });

  socket = new io.Server(server);

  server.listen(port, listenIp, () => {
    console.log(`WebUi is running on http://${listenIp}:${port}`);
  });
}

let orderCounter = 1;

export function webuiActuator(type: string, id: string, fn: () => any) {
  const order = orderCounter++;

  let lastMessage: any;

  const connectListener = (connection: io.Socket) => {
    if (lastMessage) {
      connection.emit('widget_state', lastMessage);
    }
  };

  socket.on('connection', connectListener);

  registerCleanup(() => {
    socket.off('connection', connectListener);
  });

  registerActuator(
    fn,
    (props) => {
      lastMessage = {
        id,
        type,
        order,
        props,
        root: true,
      };

      socket.emit('widget_state', lastMessage);
    },
    `webui://${id}`,
  );
}

export function webuiSensor(id: string, handler: (payload: any) => void) {
  const listener = (s: io.Socket) => {
    s.on('widget_event', (payload: any) => {
      console.log('listener', payload);
      if (payload.id == id) {
        handler(payload);
      }
    });
  };

  socket.on('connection', listener);

  registerCleanup(() => {
    socket.off('connection', listener);
  });
}

export function webuiWidget<T>(name: string, widget: React.FunctionComponent) {}

const widgetFiles: Record<string, string> = {};
export function registerWidgetRenderer(type: string, filename: string) {
  widgetFiles[type] = filename;
}
