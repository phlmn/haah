import {
  mqttSensor,
  state,
  updateState,
  registerActuator,
  mqttActuator,
} from 'haah';
import { differenceInMinutes } from 'date-fns';

import { telegram } from '../telegraf';
import { environmentState } from '../environment_state';
import { telegramChatId } from '../../secrets';

function isHeatingTime() {
  if (environmentState.time.getHours() > 23) {
    return false;
  }

  if (environmentState.time.getHours() < 7) {
    return false;
  }

  return true;
}

const bathroomState = state('bathroom', {
  window: {
    closed: true,
    changed: new Date(),
  },
});

mqttSensor('zigbee2mqtt/bathroom/window', (payload) => {
  updateState(bathroomState, (state) => {
    if (state.window.closed !== payload.contact) {
      state.window.changed = new Date();
    }

    state.window.closed = payload.contact;
  });
});

registerActuator(
  () => {
    return (
      !bathroomState.window.closed &&
      differenceInMinutes(environmentState.time, bathroomState.window.changed) >
        5
    );
  },
  (state) => {
    if (state) {
      telegram.sendMessage(telegramChatId, 'Wär nice, wenn jemand das Fenster im Bad zu maked.');
      telegram.sendMessage(telegramChatId, '🥶');
    }
  },
  'telegram://bathroom/window-message',
);

mqttActuator('zigbee2mqtt/bathroom/thermostat/set', () => {
  if (bathroomState.window.closed && isHeatingTime()) {
    return {
      current_heating_setpoint: 21,
    };
  } else {
    return {
      current_heating_setpoint: 5,
    };
  }
});
