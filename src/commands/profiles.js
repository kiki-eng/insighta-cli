const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { apiFetch } = require('../lib/api');
const { displayProfilesTable, displayProfile, displayError } = require('../utils/display');

function buildQuery(opts) {
  const params = new URLSearchParams();
  if (opts.gender) params.set('gender', opts.gender);
  if (opts.country) params.set('country_id', opts.country);
  if (opts.ageGroup) params.set('age_group', opts.ageGroup);
  if (opts.minAge) params.set('min_age', opts.minAge);
  if (opts.maxAge) params.set('max_age', opts.maxAge);
  if (opts.minGenderProbability) params.set('min_gender_probability', opts.minGenderProbability);
  if (opts.minCountryProbability) params.set('min_country_probability', opts.minCountryProbability);
  if (opts.sortBy) params.set('sort_by', opts.sortBy);
  if (opts.order) params.set('order', opts.order);
  if (opts.page) params.set('page', opts.page);
  if (opts.limit) params.set('limit', opts.limit);
  return params.toString();
}

async function list(opts) {
  const spinner = ora('Fetching profiles...').start();

  try {
    const qs = buildQuery(opts);
    const res = await apiFetch(`/api/profiles${qs ? '?' + qs : ''}`);
    const data = await res.json();

    spinner.stop();

    if (data.status === 'success') {
      displayProfilesTable(data.data, {
        page: data.page,
        limit: data.limit,
        total: data.total,
        total_pages: data.total_pages
      });
    } else {
      displayError(data.message || 'Failed to list profiles');
    }
  } catch (err) {
    spinner.fail('Failed to fetch profiles');
    displayError(err.message);
  }
}

async function get(id) {
  const spinner = ora('Fetching profile...').start();

  try {
    const res = await apiFetch(`/api/profiles/${id}`);
    const data = await res.json();

    spinner.stop();

    if (data.status === 'success') {
      displayProfile(data.data);
    } else {
      displayError(data.message || 'Profile not found');
    }
  } catch (err) {
    spinner.fail('Failed to fetch profile');
    displayError(err.message);
  }
}

async function search(query) {
  const spinner = ora('Searching profiles...').start();

  try {
    const res = await apiFetch(`/api/profiles/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    spinner.stop();

    if (data.status === 'success') {
      displayProfilesTable(data.data, {
        page: data.page,
        limit: data.limit,
        total: data.total,
        total_pages: data.total_pages
      });
    } else {
      displayError(data.message || 'Search failed');
    }
  } catch (err) {
    spinner.fail('Search failed');
    displayError(err.message);
  }
}

async function create(opts) {
  const spinner = ora('Creating profile...').start();

  try {
    const res = await apiFetch('/api/profiles', {
      method: 'POST',
      body: JSON.stringify({ name: opts.name })
    });
    const data = await res.json();

    spinner.stop();

    if (data.status === 'success') {
      console.log(chalk.green('✓ Profile created successfully\n'));
      displayProfile(data.data);
    } else {
      displayError(data.message || 'Failed to create profile');
    }
  } catch (err) {
    spinner.fail('Failed to create profile');
    displayError(err.message);
  }
}

async function exportProfiles(opts) {
  const spinner = ora('Exporting profiles...').start();

  try {
    const params = new URLSearchParams();
    params.set('format', opts.format || 'csv');
    if (opts.gender) params.set('gender', opts.gender);
    if (opts.country) params.set('country_id', opts.country);
    if (opts.ageGroup) params.set('age_group', opts.ageGroup);
    if (opts.minAge) params.set('min_age', opts.minAge);
    if (opts.maxAge) params.set('max_age', opts.maxAge);
    if (opts.sortBy) params.set('sort_by', opts.sortBy);
    if (opts.order) params.set('order', opts.order);

    const res = await apiFetch(`/api/profiles/export?${params.toString()}`);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      spinner.fail('Export failed');
      displayError(data.message || `Server returned ${res.status}`);
      return;
    }

    const csv = await res.text();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `profiles_${timestamp}.csv`;
    const filepath = path.join(process.cwd(), filename);

    fs.writeFileSync(filepath, csv);
    spinner.succeed(`Exported to ${chalk.green(filename)}`);
  } catch (err) {
    spinner.fail('Export failed');
    displayError(err.message);
  }
}

module.exports = { list, get, search, create, exportProfiles };
