import { mqttActuator } from 'haah';

import { philippsRoom } from '.';

function colorTemp() {
  if (philippsRoom.brightness < 0.2) {
    return 500;
  } else {
    return 290 + ((1 - philippsRoom.brightness) * 100);
  }
}

mqttActuator('zigbee2mqtt/philipp/desk/set', () => {
  if (!philippsRoom.lightOn) {
    return { state: 'off', brightness: 0, transition: 0.3 };
  }

  return {
    state: 'on',
    brightness: 130 * (philippsRoom.brightness * 0.7 + 0.3),
    transition: 0.3,
    color_temp: colorTemp(),
  };
});
