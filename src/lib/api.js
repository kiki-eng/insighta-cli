const { API_BASE_URL } = require('./config');
const { loadCredentials, saveCredentials, clearCredentials } = require('./auth');
const chalk = require('chalk');

async function apiFetch(path, options = {}) {
  const creds = loadCredentials();
  if (!creds || !creds.access_token) {
    console.error(chalk.red('Not authenticated. Run "insighta login" first.'));
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${creds.access_token}`,
    ...options.headers
  };

  if (path.startsWith('/api/')) {
    headers['X-API-Version'] = '1';
  }

  const url = `${API_BASE_URL}${path}`;

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    console.error(chalk.red(`Network error: ${err.message}`));
    process.exit(1);
  }

  if (res.status === 401) {
    const refreshed = await tryRefresh(creds);
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed.access_token}`;
      try {
        res = await fetch(url, { ...options, headers });
      } catch (err) {
        console.error(chalk.red(`Network error: ${err.message}`));
        process.exit(1);
      }
    } else {
      console.error(chalk.red('Session expired. Run "insighta login" to re-authenticate.'));
      clearCredentials();
      process.exit(1);
    }
  }

  return res;
}

async function tryRefresh(creds) {
  if (!creds.refresh_token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: creds.refresh_token })
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.access_token && data.refresh_token) {
      const updated = {
        ...creds,
        access_token: data.access_token,
        refresh_token: data.refresh_token
      };
      saveCredentials(updated);
      return updated;
    }
  } catch {
    return null;
  }
  return null;
}

module.exports = { apiFetch, API_BASE_URL };
