#!/usr/bin/env node
const { program } = require('commander');
const { fork } = require('child_process');
const { resolve } = require('path');
const { exit } = require('process');

const { EXITCODE_RESTART } = require('./lib/build');

program
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .helpOption(false)
  .parse();

function launch() {
  const child = fork(resolve(__dirname, 'cli.js'), program.args);

  child.on('close', (code) => {
    if (code == EXITCODE_RESTART) {
      console.log(`Reloading application…`);
      launch();
    } else {
      exit(code);
    }
  });
}

launch();
