'use strict';

const fs = require('fs');
const path = require('path');
const { authenticatedRequest } = require('../lib/api');
const { profileTable, profileDetail, handleError } = require('../utils/display');

function registerProfileCommands(program) {
  const profiles = program
    .command('profiles')
    .description('Manage profiles');

  profiles
    .command('list')
    .description('List profiles with optional filters')
    .option('--gender <gender>', 'Filter by gender')
    .option('--country <country>', 'Filter by country')
    .option('--age-group <ageGroup>', 'Filter by age group')
    .option('--min-age <minAge>', 'Minimum age', parseInt)
    .option('--max-age <maxAge>', 'Maximum age', parseInt)
    .option('--min-gender-probability <prob>', 'Min gender probability', parseFloat)
    .option('--min-country-probability <prob>', 'Min country probability', parseFloat)
    .option('--sort-by <field>', 'Sort by field')
    .option('--order <order>', 'Sort order (asc/desc)')
    .option('--page <page>', 'Page number', parseInt, 1)
    .option('--limit <limit>', 'Results per page', parseInt, 20)
    .action(async (options) => {
      const chalk = (await import('chalk')).default;
      const ora = (await import('ora')).default;

      const spinner = ora('Fetching profiles...').start();

      try {
        const params = buildQueryParams(options);
        const res = await authenticatedRequest('GET', `/api/profiles?${params}`);

        if (res.status !== 200) {
          spinner.fail(chalk.red(`Failed to fetch profiles (${res.status})`));
          process.exit(1);
        }

        spinner.stop();

        const data = res.data;
        const items = data.data || data.profiles || data.items || (Array.isArray(data) ? data : []);

        if (items.length === 0) {
          console.log(chalk.yellow('No profiles found.'));
          return;
        }

        console.log(profileTable(items));

        const totalPages = data.totalPages || data.total_pages;
        const total = data.total || data.totalCount;
        const currentPage = data.page || options.page;

        if (totalPages) {
          console.log(
            chalk.dim(`Page ${currentPage} of ${totalPages} (total: ${total})`)
          );
        }
      } catch (err) {
        spinner.fail();
        await handleError(err);
      }
    });

  profiles
    .command('get <id>')
    .description('Get a profile by ID')
    .action(async (id) => {
      const chalk = (await import('chalk')).default;
      const ora = (await import('ora')).default;

      const spinner = ora('Fetching profile...').start();

      try {
        const res = await authenticatedRequest('GET', `/api/profiles/${id}`);

        if (res.status !== 200) {
          spinner.fail(chalk.red(`Profile not found (${res.status})`));
          process.exit(1);
        }

        spinner.stop();
        const profile = res.data.data || res.data;
        console.log(profileDetail(profile));
      } catch (err) {
        spinner.fail();
        await handleError(err);
      }
    });

  profiles
    .command('search <query>')
    .description('Search profiles by name')
    .action(async (query) => {
      const chalk = (await import('chalk')).default;
      const ora = (await import('ora')).default;

      const spinner = ora('Searching profiles...').start();

      try {
        const res = await authenticatedRequest(
          'GET',
          `/api/profiles/search?q=${encodeURIComponent(query)}`
        );

        if (res.status !== 200) {
          spinner.fail(chalk.red(`Search failed (${res.status})`));
          process.exit(1);
        }

        spinner.stop();

        const data = res.data;
        const items = data.data || data.profiles || data.items || (Array.isArray(data) ? data : []);

        if (items.length === 0) {
          console.log(chalk.yellow('No profiles found.'));
          return;
        }

        console.log(profileTable(items));
      } catch (err) {
        spinner.fail();
        await handleError(err);
      }
    });

  profiles
    .command('create')
    .description('Create a new profile')
    .requiredOption('--name <name>', 'Profile name')
    .action(async (options) => {
      const chalk = (await import('chalk')).default;
      const ora = (await import('ora')).default;

      const spinner = ora('Creating profile...').start();

      try {
        const res = await authenticatedRequest('POST', '/api/profiles', {
          body: { name: options.name },
        });

        if (res.status !== 201 && res.status !== 200) {
          spinner.fail(chalk.red(`Failed to create profile (${res.status})`));
          process.exit(1);
        }

        spinner.stop();
        const profile = res.data.data || res.data;
        console.log(chalk.green('Profile created:'));
        console.log(profileDetail(profile));
      } catch (err) {
        spinner.fail();
        await handleError(err);
      }
    });

  profiles
    .command('export')
    .description('Export profiles to a file')
    .option('--format <format>', 'Export format (csv)', 'csv')
    .option('--gender <gender>', 'Filter by gender')
    .option('--country <country>', 'Filter by country')
    .option('--age-group <ageGroup>', 'Filter by age group')
    .option('--min-age <minAge>', 'Minimum age', parseInt)
    .option('--max-age <maxAge>', 'Maximum age', parseInt)
    .action(async (options) => {
      const chalk = (await import('chalk')).default;
      const ora = (await import('ora')).default;

      const spinner = ora('Exporting profiles...').start();

      try {
        const filterParams = buildQueryParams(options);
        const formatParam = `format=${encodeURIComponent(options.format)}`;
        const queryString = filterParams ? `${formatParam}&${filterParams}` : formatParam;

        const res = await authenticatedRequest('GET', `/api/profiles/export?${queryString}`, {
          raw: true,
        });

        if (res.status !== 200) {
          spinner.fail(chalk.red(`Export failed (${res.status})`));
          process.exit(1);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `profiles_${timestamp}.${options.format}`;
        const filepath = path.join(process.cwd(), filename);

        fs.writeFileSync(filepath, res.body);

        spinner.succeed(chalk.green(`Exported to ${filename}`));
      } catch (err) {
        spinner.fail();
        await handleError(err);
      }
    });
}

function buildQueryParams(options) {
  const mapping = {
    gender: 'gender',
    country: 'country',
    ageGroup: 'age_group',
    minAge: 'min_age',
    maxAge: 'max_age',
    minGenderProbability: 'min_gender_probability',
    minCountryProbability: 'min_country_probability',
    sortBy: 'sort_by',
    order: 'order',
    page: 'page',
    limit: 'limit',
  };

  const params = new URLSearchParams();

  for (const [key, paramName] of Object.entries(mapping)) {
    if (options[key] !== undefined && options[key] !== null) {
      params.set(paramName, String(options[key]));
    }
  }

  return params.toString();
}

module.exports = { registerProfileCommands };
