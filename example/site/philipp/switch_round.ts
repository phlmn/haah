import { updateState, mqttSensor } from 'haah';

import { philippsRoom } from '.';

mqttSensor('zigbee2mqtt/philipp/switch_round', (payload) => {
  if (payload.action === 'toggle') {
    updateState(philippsRoom, (state) => {
      state.lightOn = !state.lightOn;
    });
  }
});
