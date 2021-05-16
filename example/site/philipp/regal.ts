import { mqttActuator } from 'haah';

import { philippsRoom } from '.';

mqttActuator('zigbee2mqtt/philipp/regal/set', () => {
  if (!philippsRoom.lightOn) {
    return { state: 'off' };
  }

  return {
    state: 'on',
    brightness: 100 + 100 * philippsRoom.brightness,
    color: { r: 100, g: 40, b: 0 },
  };
});
