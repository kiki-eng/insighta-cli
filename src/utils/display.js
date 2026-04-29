'use strict';

const Table = require('cli-table3');

function profileTable(profiles) {
  const table = new Table({
    head: ['ID', 'Name', 'Gender', 'Country', 'Age Group'],
    style: { head: ['cyan'] },
    wordWrap: true,
  });

  for (const p of profiles) {
    table.push([
      p.id || '',
      p.name || '',
      p.gender || '',
      p.country || '',
      p.age_group || p.ageGroup || '',
    ]);
  }

  return table.toString();
}

function profileDetail(profile) {
  const table = new Table({
    style: { head: ['cyan'] },
  });

  const fields = [
    ['ID', profile.id],
    ['Name', profile.name],
    ['Gender', profile.gender],
    ['Gender Probability', profile.gender_probability ?? profile.genderProbability],
    ['Country', profile.country],
    ['Country Probability', profile.country_probability ?? profile.countryProbability],
    ['Age Group', profile.age_group ?? profile.ageGroup],
    ['Age', profile.age],
  ];

  for (const [key, value] of fields) {
    if (value !== undefined && value !== null) {
      table.push({ [key]: String(value) });
    }
  }

  return table.toString();
}

function userInfoTable(user) {
  const table = new Table({
    style: { head: ['cyan'] },
  });

  for (const [key, value] of Object.entries(user)) {
    if (value !== undefined && value !== null) {
      table.push({ [key]: String(value) });
    }
  }

  return table.toString();
}

async function handleError(err) {
  const chalk = (await import('chalk')).default;
  if (err.code === 'ECONNREFUSED') {
    console.error(chalk.red('Could not connect to the API server. Is it running?'));
  } else {
    console.error(chalk.red(`Error: ${err.message || err}`));
  }
  process.exit(1);
}

module.exports = { profileTable, profileDetail, userInfoTable, handleError };
