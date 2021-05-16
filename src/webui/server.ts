import path from 'path';
import Bundler from 'parcel-bundler';
import Io from 'socket.io';
import { registerActuator, StateSlice, globalState, updateActuators } from '..';
import { stringify } from '../persist_state';

const widgets: Record<string, { stateSlice: string; fn: string }> = {};
const states: Record<string, object> = {};
let socket: Io.Server = null;

export async function initWebui(port = 8080) {
  const bundler = new Bundler(path.join(__dirname, 'index.html'), {});
  const http = await bundler.serve(port);
  socket = new Io.Server(http);

  socket.on('connect', (connection) => {
    connection.emit('state', states);
    connection.emit('widgets', widgets);

    let last_patch = +new Date();
    connection.on('patch', (patch) => {
      if (
        JSON.stringify(globalState[patch.key]) ===
        JSON.stringify(patch.oldSlice)
      ) {
        last_patch = +new Date();
        globalState[patch.key] = patch.newSlice;
        updateActuators(
          patch.patches.map((p: any) => `${patch.key}.${p.path[0]}`),
        );
      } else {
        setTimeout(() => {
          if (+new Date() - last_patch > 500) {
            console.log('patch_outdated');
            connection.emit('state', states);
            connection.emit('patch_outdated');
          }
        }, 500);
      }
    });
  });
}

export function webuiWidget<T>(
  name: string,
  stateSlice: StateSlice<T>,
  widgetFunction: (state: StateSlice<T>) => any,
) {
  registerActuator(
    () => stringify(stateSlice),
    (state) => {
      console.log(state);
      states[stateSlice.__key] = state;
      if (!socket) {
        throw Error('call initWebui first!');
      }
      socket.emit('state', { [stateSlice.__key]: state });
    },
    name,
  );
  widgets[name] = {
    stateSlice: stateSlice.__key,
    fn: widgetFunction.toString(),
  };
}
