export function timeSensor() { }
export function weatherSensor() { }
export function mqttSensor() { }
export function mqttActuator() { }

export {state, updateState } from '../state';

import { io } from 'socket.io-client';
import React, { useEffect, useState } from 'react';
import { applyStatePatch, lastPatchProducer, PatchType, updateStateHooks, usedTracker } from '../state';
import { enablePatches } from 'immer';

enablePatches();

function initSocketIo() {
  const socket = io();
  (window as any).socket = socket;

  socket.on('disconnect', reason => console.log("disconnect", reason));
  socket.on('connect', () => console.log("connect"));

  socket.on('patch_server', (patch: PatchType) => {
    (patch as any).fromServer = true;
    applyStatePatch(patch, true);
  });
  socket.on('patch_outdated', () => {
    socket.emit('patch_ui', lastPatchProducer());
    console.log('patch outdated');
  })
  updateStateHooks.push(patch => {
    if ((patch as any).fromServer) {
      return;  // we dont send the patches we received back to the
    }
    socket.emit('patch_ui', patch);
  })
}
initSocketIo();


export const widgets: Record<string, React.ComponentType> = {};
export function webuiWidget<T>(
  name: string,
  widget: React.FunctionComponent,
) {
  widgets[name] = () => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      updateStateHooks.push(() => {
        setCount(count => count + 1);
      })
    }, []);

    const [toReturn, dependencies] = usedTracker.withUsedTracker(() => widget({}));
    // TODO: do something with dependency information (partial re-render? partial subscription?)
    return toReturn;
  };
}
