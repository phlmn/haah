import { mqttActuator } from 'haah';

import { philippsRoom } from '.';
import { isDaylight } from '../environment_state';

mqttActuator('zigbee2mqtt/philipp/color_door/set', () => {
  if (!philippsRoom.lightOn || philippsRoom.brightness < 0.15) {
    return { state: 'off', brightness: 0, transition: 0.3 };
  }

  return {
    state: 'on',
    brightness: (isDaylight() ? 180 : 100) * philippsRoom.brightness,
    transition: 0.3,
    color: isDaylight()
      ? { r: 86, g: 155, b: 142 }
      : { r: 200, g: 155, b: 100 },
  };
});
