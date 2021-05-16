import { mqttActuator } from 'haah';

import { philippsRoom } from '.';

mqttActuator('zigbee2mqtt/philipp/retro/set', () => {
  if (!philippsRoom.lightOn) {
    return { state: 'off' };
  }

  return { state: 'on' };
});
