import { mqttActuator } from 'haah';

import { philippsRoom } from '.';

mqttActuator('zigbee2mqtt/philipp/desk/set', () => {
  if (!philippsRoom.lightOn || philippsRoom.brightness < 0.2) {
    return { state: 'off', brightness: 0, transition: 0.3 };
  }

  return {
    state: 'on',
    brightness: 130,
    transition: 0.3,
    color_temp: 290,
  };
});
