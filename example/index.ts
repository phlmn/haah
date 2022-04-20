import { initMqtt, initWebui } from 'haah';

export default async function main() {
  await initMqtt('tcp://localhost:1883');
  await initWebui();
}
