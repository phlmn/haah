import React, { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

export const socket = io();

export function emitEvent(id: string, payload: any) {
  socket.emit('widget_event', {
    id,
    ...payload,
  });
}

export type WidgetProps<T> = {
  id: string;
  data: T;
};

const widgetRegistry: Record<
  string,
  React.ComponentType<WidgetProps<any>>
> = {};
export function registerWidget(
  type: string,
  component: React.ComponentType<WidgetProps<any>>,
) {
  widgetRegistry[type] = component;
}

export const WidgetStateContext = createContext<Record<string, any>>({});

export function DynamicWidget({ id }: { id: string }) {
  const state = useContext(WidgetStateContext)[id];

  if (!state) {
    console.warn(`No state found for widget with id '${id}'.`);
    return null;
  }

  const Component = widgetRegistry[state.type];

  if (!Component) {
    console.warn(`No component renderer found for type '${state.type}'.`);
    return null;
  }

  return <Component id={id} data={state.props} />;
}

