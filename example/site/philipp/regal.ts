import { mqttActuator } from 'haah';

import { philippsRoom } from '.';

mqttActuator('zigbee2mqtt/philipp/regal/set', () => {
  if (!philippsRoom.lightOn) {
    return { state: 'off', brightness: 0 };
  }

  return {
    state: 'on',
    brightness: 80 * philippsRoom.brightness,
  };
});
