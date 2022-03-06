import MQTT, { IClientOptions } from 'async-mqtt';
import { registerActuator } from '..';
import { registerModuleCleanup } from '../modules';

export let mqttClient: MQTT.AsyncClient = null;
export async function initMqtt(brokerUri: string, opts: IClientOptions = {}) {
  mqttClient = await MQTT.connectAsync(brokerUri, opts);
}

export function mqttActuator(topic: string, fn: () => any) {
  if (!mqttClient) {
    throw new Error('call initMqtt() first!');
  }

  registerActuator(
    fn,
    async (result: any) => {
      await mqttClient.publish(topic, JSON.stringify(result));
    },
    `mqtt://${topic}`,
  );
}

export function mqttSensor(topic: string, handler: (payload: any) => void) {
  if (!mqttClient) {
    throw new Error('call initMqtt() first!');
  }

  mqttClient.subscribe(topic);

  const listener = (messageTopic: string, message: any) => {
    if (messageTopic === topic) {
      console.debug(topic, message.toString());

      try {
        handler(JSON.parse(message.toString()));
      } catch (e) {
        console.error(`Error in sensor mqtt://${topic}`, e);
      }
    }
  };

  mqttClient.on('message', listener);

  registerModuleCleanup(() => {
    mqttClient.removeListener('message', listener);
  });
}
