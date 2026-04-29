const Table = require('cli-table3');
const chalk = require('chalk');

function displayProfilesTable(profiles, pagination) {
  if (!profiles || profiles.length === 0) {
    console.log(chalk.yellow('No profiles found.'));
    return;
  }

  const table = new Table({
    head: ['Name', 'Gender', 'Age', 'Age Group', 'Country', 'G.Prob', 'C.Prob'].map(h => chalk.cyan(h)),
    colWidths: [22, 10, 6, 12, 8, 8, 8],
    style: { 'padding-left': 1, 'padding-right': 1 }
  });

  profiles.forEach(p => {
    table.push([
      p.name,
      p.gender,
      p.age,
      p.age_group,
      p.country_id,
      p.gender_probability?.toFixed(2) || '-',
      p.country_probability?.toFixed(2) || '-'
    ]);
  });

  console.log(table.toString());

  if (pagination) {
    console.log(chalk.gray(
      `\nPage ${pagination.page} of ${pagination.total_pages || Math.ceil(pagination.total / pagination.limit)} (${pagination.total} total)`
    ));
  }
}

function displayProfile(profile) {
  if (!profile) {
    console.log(chalk.yellow('No profile data.'));
    return;
  }

  const table = new Table({ style: { 'padding-left': 1, 'padding-right': 1 } });
  const fields = [
    ['ID', profile.id],
    ['Name', profile.name],
    ['Gender', profile.gender],
    ['Gender Probability', profile.gender_probability],
    ['Age', profile.age],
    ['Age Group', profile.age_group],
    ['Country ID', profile.country_id],
    ['Country Name', profile.country_name],
    ['Country Probability', profile.country_probability],
    ['Created At', profile.created_at]
  ];

  fields.forEach(([key, val]) => {
    table.push({ [chalk.cyan(key)]: val || '-' });
  });

  console.log(table.toString());
}

function displayUser(user) {
  const table = new Table({ style: { 'padding-left': 1, 'padding-right': 1 } });
  const fields = [
    ['Username', user.username],
    ['Email', user.email || '-'],
    ['Role', user.role],
    ['Active', user.is_active ? 'Yes' : 'No'],
    ['Last Login', user.last_login_at || '-'],
    ['Created At', user.created_at || '-']
  ];

  fields.forEach(([key, val]) => {
    table.push({ [chalk.cyan(key)]: val });
  });

  console.log(table.toString());
}

function displayError(message) {
  console.error(chalk.red(`Error: ${message}`));
}

module.exports = { displayProfilesTable, displayProfile, displayUser, displayError };
