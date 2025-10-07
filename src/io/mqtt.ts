import MQTT, { IClientOptions } from 'async-mqtt';
import { registerActuator } from '..';
import { registerCleanup } from '../modules';

export type MqttOptions = {
  clientOpts?: IClientOptions;
  readonly?: boolean;
};

let readonly = false;

export let mqttClient: MQTT.AsyncClient = null;
export async function initMqtt(brokerUri: string, opts: MqttOptions = {}) {
  if (opts.readonly) {
    readonly = true;
    console.log(`[mqtt] ${brokerUri} in readonly mode`);
  }

  mqttClient = await MQTT.connectAsync(brokerUri, opts.clientOpts);
  mqttClient.setMaxListeners(100000);
}

export function mqttActuator(topic: string, fn: () => any) {
  if (!mqttClient) {
    throw new Error('call initMqtt() first!');
  }

  registerActuator(
    fn,
    async (result: any) => {
      if (readonly) {
        return;
      }
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

  registerCleanup(() => {
    mqttClient.removeListener('message', listener);
  });
}
