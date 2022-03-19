#!/usr/bin/env node
const { program } = require('commander');
const path = require('path');

const { run } = require('./lib/index.js');

program
  .argument(
    '[config_folder]',
    "the folder with the configuration, containing the 'site' folder",
    '.',
  )
  .action((folder) => {
    const absPath = path.resolve(folder);
    run(absPath);
  });

program.parse();
