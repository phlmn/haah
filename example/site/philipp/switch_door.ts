import { updateState, mqttSensor } from 'haah';

import { philippsRoom } from '.';

mqttSensor('zigbee2mqtt/philipp/switch_door', (payload) => {
  if (payload.action === 'on-press') {
    updateState(philippsRoom, (state) => {
      state.lightOn = true;
      state.brightness = 1.0;
      state.productive = false;
    });
  }

  if (payload.action === 'off-press') {
    updateState(philippsRoom, (state) => {
      state.lightOn = false;
    });
  }

  if (payload.action === 'up-press') {
    updateState(philippsRoom, (state) => {
      state.lightOn = true;
      state.brightness = 1.0;
      state.productive = true;
    });
  }

  if (payload.action === 'down-press') {
    updateState(philippsRoom, (state) => {
      state.lightOn = true;
      state.brightness = 0.1;
      state.productive = false;
    });
  }
});
