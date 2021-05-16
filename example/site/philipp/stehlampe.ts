import { mqttActuator } from 'haah';

import { philippsRoom } from '.';

mqttActuator('zigbee2mqtt/philipp/stehlampe/set', () => {
  if (!philippsRoom.lightOn || philippsRoom.brightness < 0.2) {
    return { state: 'off', brightness: 0 };
  }

  return {
    state: 'on',
    brightness: 255,
    color_temp: 250,
  };
});
