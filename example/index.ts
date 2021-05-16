import { run, initMqtt, initWebui } from 'haah';

async function main() {
  await initMqtt('tcp://automate.local:1883');
  await initWebui();
  run();
}
main();
