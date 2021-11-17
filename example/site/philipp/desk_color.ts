import { mqttActuator } from 'haah';

import { philippsRoom } from '.';
import { isDaylight } from '../environment_state';

const productiveColor = { r: 255, g: 225, b: 140 };
const defaultColor = { r: 255, g: 225, b: 140 };
const cozyColor = { r: 190, g: 135, b: 50 };

function color() {
  if (philippsRoom.brightness < 0.2) {
    return cozyColor;
  }

  if (isDaylight() || philippsRoom.productive) {
    return productiveColor;
  } else {
    return defaultColor;
  }
}

mqttActuator('zigbee2mqtt/philipp/desk_color/set', () => {
  if (!philippsRoom.lightOn) {
    return { state: 'off', brightness: 0, transition: 0.3 };
  }

  return {
    state: 'on',
    brightness: 200 * philippsRoom.brightness,
    color: color(),
    transition: 0.3,
  };
});
