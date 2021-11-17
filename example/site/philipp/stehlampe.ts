import { mqttActuator } from 'haah';

import { philippsRoom } from '.';

function colorTemp() {
  if (philippsRoom.brightness < 0.2) {
    return 500;
  } else {
    return 290 + ((1 - philippsRoom.brightness) * 100);
  }
}

mqttActuator('zigbee2mqtt/philipp/stehlampe/set', () => {
  if (!philippsRoom.lightOn) {
    return { state: 'off', brightness: 0 };
  }

  return {
    state: 'on',
    brightness: Math.max(50, 255 * philippsRoom.brightness),
    color_temp: colorTemp(),
  };
});
