import MQTT from 'async-mqtt';
import { registerActuator } from '..';

export let mqttClient: MQTT.AsyncClient = null;
export async function initMqtt(brokerUri: string) {
  mqttClient = await MQTT.connectAsync(brokerUri);
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
  mqttClient.on('message', (messageTopic, message) => {
    if (messageTopic === topic) {
      console.debug(topic, message.toString());

      try {
        handler(JSON.parse(message.toString()));
      } catch (e) {
        console.error(`Error in sensor mqtt://${topic}`, e);
      }
    }
  });
}
