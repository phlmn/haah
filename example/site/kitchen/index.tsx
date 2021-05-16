import React from 'react';
import { Switch } from 'antd';

import {
  mqttActuator,
  mqttSensor,
  state,
  updateState,
  webuiWidget,
} from 'haah';

const kitchen = state('kitchen', {
  lightOn: false,
  cinema: false,
});

webuiWidget('Kitchen', kitchen, (state) => {
  return (
    <Switch
      checked={state.lightOn}
      onChange={(checked) =>
        updateState(state, (state) => {
          state.lightOn = checked;
          state.cinema = false;
        })
      }
    />
  );
});

mqttSensor('zigbee2mqtt/kitchen/switch', (payload) =>
  updateState(kitchen, (kitchen) => {
    const actions = {
      'off-press': () => {
        kitchen.lightOn = false;
      },

      'down-press': () => {
        kitchen.lightOn = true;
        kitchen.cinema = true;
      },

      'on-press': () => {
        kitchen.lightOn = true;
        kitchen.cinema = false;
      },
    };
    actions[payload.action as keyof typeof actions]();
  }),
);

mqttActuator('zigbee2mqtt/kitchen/deckenfluter/set', () => {
  if (!kitchen.lightOn || kitchen.cinema) {
    return { state: 'off' };
  }

  return {
    state: 'on',
    brightness: 255,
  };
});

mqttActuator('zigbee2mqtt/kitchen/kuchenzeile/set', () => {
  console.log(kitchen.lightOn);
  if (!kitchen.lightOn) {
    return { state: 'off' };
  }

  return {
    state: 'on',
  };
});

mqttActuator('zigbee2mqtt/kitchen/table/set', () => {
  if (!kitchen.lightOn || kitchen.cinema) {
    return { state: 'off', };
  }

  return {
    state: 'on',
    brightness: 120,
  };
});
