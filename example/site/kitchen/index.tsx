import React from 'react';
import { Form, Slider, Switch } from 'antd';

import {
  mqttActuator,
  mqttSensor,
  state,
  updateState,
  webuiWidget,
} from 'haah';

import { LabeledSwitch } from '../../util/frontend';

const kitchen = state('kitchen', {
  lightOn: false,
  cinema: false,
});

webuiWidget('Kitchen', () => {
  return <Form layout='horizontal'>
    <LabeledSwitch label="On" checked={kitchen.lightOn} onChange={value =>
      updateState(kitchen, (kitchen) => { kitchen.lightOn = value })
    }/>
    <LabeledSwitch label="Cinema" checked={kitchen.cinema} onChange={value =>
      updateState(kitchen, (kitchen) => { kitchen.cinema = value })
    }/>
  </Form>;
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
    brightness: 160,
  };
});
