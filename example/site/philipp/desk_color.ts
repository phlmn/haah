import { mqttActuator } from 'haah';

import { philippsRoom } from '.';
import { isDaylight } from '../environment_state';

const productiveColor = { r: 255, g: 225, b: 140 };
const defaultColor = { h: 30, s: 255, l: 255 };
const cozyColor = { r: 100, g: 40, b: 0 };

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
    brightness: 40 + 215 * philippsRoom.brightness,
    color: color(),
    transition: 0.3,
  };
});
