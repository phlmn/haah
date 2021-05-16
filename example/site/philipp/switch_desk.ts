import { mqttSensor, updateState } from 'haah';

import { philippsRoom } from '.';

mqttSensor('zigbee2mqtt/philipp/switch_desk', (payload) => {
  if (payload.action === 'on') {
    updateState(philippsRoom, (state) => {
      state.deskPower = true;
    });
  }

  if (payload.action === 'off') {
    updateState(philippsRoom, (state) => {
      state.deskPower = false;
    });
  }
});
