import { updateState, mqttActuator, mqttSensor } from 'haah';

import { philippsRoom } from '.';

mqttSensor('zigbee2mqtt/philipp/switch_desk/set', (payload) => {
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

mqttActuator('zigbee2mqtt/philipp/desk_power/set', () => {
  return {
    state: philippsRoom.deskPower ? 'on' : 'off',
  };
});
