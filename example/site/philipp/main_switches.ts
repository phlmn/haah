import { mqttSensor, updateState } from 'haah';

import { philippsRoom } from '.';

function clamp(min: number, max: number) {
  return (value: number) => Math.max(min, Math.min(value, max));
}

function defaultSwitch(payload: any) {
  if (payload.action === 'on-press') {
    updateState(philippsRoom, (state) => {
      if (!state.lightOn) {
        state.lightOn = true;
        state.productive = false;
      } else {
        state.brightness = 1.0;
        state.productive = false;
      }
    });
  }

  // productivity mode
  if (payload.action === 'on-hold') {
    updateState(philippsRoom, (state) => {
      state.lightOn = true;
      state.productive = true;
      state.brightness = 1.0;
    });
  }

  // turn off light
  if (payload.action === 'off-press') {
    updateState(philippsRoom, (state) => {
      state.lightOn = false;
    });
  }

  // dimm mode
  if (payload.action === 'off-hold') {
    updateState(philippsRoom, (state) => {
      state.lightOn = true;
      state.brightness = 0.1;
      state.productive = false;
    });
  }

  // increase brightness
  if (payload.action === 'up-press' || payload.action === 'up-hold') {
    updateState(philippsRoom, (state) => {
      state.lightOn = true;
      state.brightness = clamp(0, 1.0)(state.brightness + 0.1);
      state.productive = false;
    });
  }

  // reduce brightness
  if (payload.action === 'down-press' || payload.action === 'down-hold') {
    updateState(philippsRoom, (state) => {
      state.lightOn = true;
      state.brightness = clamp(0, 1.0)(state.brightness - 0.1);
      state.productive = false;
    });
  }
}

mqttSensor('zigbee2mqtt/philipp/switch_bed', defaultSwitch);
mqttSensor('zigbee2mqtt/philipp/switch_door', defaultSwitch);
