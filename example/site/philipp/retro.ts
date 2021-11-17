import { mqttActuator } from 'haah';

import { philippsRoom } from '.';

mqttActuator('zigbee2mqtt/philipp/retro/set', () => {
  if (!philippsRoom.lightOn || philippsRoom.brightness > 0.5) {
    return { state: 'off' };
  }

  return { state: 'on' };
});
