const http = require('http');
const chalk = require('chalk');
const ora = require('ora');
const { API_BASE_URL } = require('../lib/config');
const {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  saveCredentials,
  loadCredentials,
  clearCredentials
} = require('../lib/auth');
const { displayUser, displayError } = require('../utils/display');

async function login() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const port = 9876 + Math.floor(Math.random() * 100);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);

    if (url.pathname === '/callback') {
      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');
      const username = url.searchParams.get('username');
      const returnedState = url.searchParams.get('state');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h2>Authentication successful!</h2><p>You can close this window and return to the terminal.</p></body></html>');

      if (accessToken && refreshToken) {
        saveCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
          username: username || 'unknown'
        });
        console.log(chalk.green(`\n✓ Logged in as @${username || 'unknown'}`));
      } else {
        console.error(chalk.red('\n✗ Authentication failed: no tokens received'));
      }

      server.close();
    }
  });

  server.listen(port, async () => {
    const redirectUri = `http://localhost:${port}/callback`;
    const authUrl = `${API_BASE_URL}/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&source=cli`;

    console.log(chalk.blue('Opening browser for GitHub authentication...'));
    console.log(chalk.gray(`If the browser doesn't open, visit:\n${authUrl}\n`));

    try {
      const open = require('open');
      await open(authUrl);
    } catch {
      console.log(chalk.yellow('Could not open browser automatically.'));
    }

    const spinner = ora('Waiting for authentication...').start();

    setTimeout(() => {
      if (server.listening) {
        spinner.fail('Authentication timed out (60s). Try again.');
        server.close();
        process.exit(1);
      }
    }, 60000);

    server.on('close', () => {
      spinner.stop();
    });
  });
}

async function logout() {
  const creds = loadCredentials();

  if (!creds) {
    console.log(chalk.yellow('Not logged in.'));
    return;
  }

  const spinner = ora('Logging out...').start();

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creds.access_token}`
      },
      body: JSON.stringify({ refresh_token: creds.refresh_token })
    });
  } catch {
    // Ignore network errors during logout
  }

  clearCredentials();
  spinner.succeed('Logged out successfully');
}

async function whoami() {
  const creds = loadCredentials();
  if (!creds) {
    console.log(chalk.red('Not authenticated. Run "insighta login" first.'));
    process.exit(1);
  }

  const spinner = ora('Fetching user info...').start();

  try {
    const { apiFetch } = require('../lib/api');
    const res = await apiFetch('/auth/me');
    const data = await res.json();

    spinner.stop();

    if (data.status === 'success') {
      displayUser(data.data);
    } else {
      displayError(data.message || 'Failed to get user info');
    }
  } catch (err) {
    spinner.fail('Failed to fetch user info');
    displayError(err.message);
  }
}

module.exports = { login, logout, whoami };
