import { run, initMqtt, initWebui } from 'haah';

async function main() {
  await initMqtt('tcp://automate.local:1883');
  await initWebui();

  // this function collects all typescript files from the `site/` folder and runs them.
  // this might feel a bit 'magic' at first but is rather handy when adding / removing code.
  run();
}

// we need to create a main function and imidiately call it, because node.js does not support
// top level await.
main();
