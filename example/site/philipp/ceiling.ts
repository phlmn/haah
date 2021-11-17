import { mqttActuator } from 'haah';

import { philippsRoom } from '.';

mqttActuator('zigbee2mqtt/philipp/ceiling/set', () => {
  if (!philippsRoom.lightOn || philippsRoom.brightness < 0.3) {
    return { state: 'off', brightness: 0 };
  }

  return {
    state: 'on',
    brightness: (philippsRoom.productive ? 255 : 180) * philippsRoom.brightness,
  };
});

mqttActuator('zigbee2mqtt/philipp/ceiling_fillers/set', () => {
  if (!philippsRoom.lightOn || philippsRoom.brightness < 0.3) {
    return { state: 'off' };
  }

  return {
    state: 'on'
  };
});
