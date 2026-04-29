#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const { registerAuthCommands } = require('../src/commands/auth');
const { registerProfileCommands } = require('../src/commands/profiles');
const pkg = require('../package.json');

const program = new Command();

program
  .name('insighta')
  .description('CLI tool for the Insighta API')
  .version(pkg.version);

registerAuthCommands(program);
registerProfileCommands(program);

program.parse(process.argv);
