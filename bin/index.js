#!/usr/bin/env node

const { program } = require('commander');
const { login, logout, whoami } = require('../src/commands/auth');
const { list, get, search, create, exportProfiles } = require('../src/commands/profiles');

program
  .name('insighta')
  .description('Insighta Labs+ CLI - Profile Intelligence Platform')
  .version('1.0.0');

program.command('login').description('Authenticate with GitHub').action(login);
program.command('logout').description('Log out and invalidate tokens').action(logout);
program.command('whoami').description('Show current user info').action(whoami);

const profiles = program.command('profiles').description('Manage profiles');

profiles
  .command('list')
  .description('List profiles with filters')
  .option('--gender <gender>', 'Filter by gender')
  .option('--country <code>', 'Filter by country code')
  .option('--age-group <group>', 'Filter by age group')
  .option('--min-age <age>', 'Minimum age', parseInt)
  .option('--max-age <age>', 'Maximum age', parseInt)
  .option('--min-gender-probability <prob>', 'Min gender probability', parseFloat)
  .option('--min-country-probability <prob>', 'Min country probability', parseFloat)
  .option('--sort-by <field>', 'Sort by field (age, created_at, gender_probability)')
  .option('--order <order>', 'Sort order (asc, desc)')
  .option('--page <num>', 'Page number', parseInt)
  .option('--limit <num>', 'Results per page', parseInt)
  .action(list);

profiles
  .command('get <id>')
  .description('Get a profile by ID')
  .action(get);

profiles
  .command('search <query>')
  .description('Natural language search')
  .action(search);

profiles
  .command('create')
  .description('Create a new profile (admin only)')
  .requiredOption('--name <name>', 'Profile name')
  .action(create);

profiles
  .command('export')
  .description('Export profiles to CSV')
  .requiredOption('--format <format>', 'Export format (csv)')
  .option('--gender <gender>', 'Filter by gender')
  .option('--country <code>', 'Filter by country code')
  .option('--age-group <group>', 'Filter by age group')
  .option('--min-age <age>', 'Minimum age', parseInt)
  .option('--max-age <age>', 'Maximum age', parseInt)
  .option('--sort-by <field>', 'Sort by field')
  .option('--order <order>', 'Sort order')
  .action(exportProfiles);

program.parse();
