'use strict';

const http = require('http');
const url = require('url');
const { API_BASE_URL } = require('../lib/config');
const {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  saveCredentials,
  loadCredentials,
  deleteCredentials,
} = require('../lib/auth');
const { authenticatedRequest } = require('../lib/api');
const { userInfoTable, handleError } = require('../utils/display');

function registerAuthCommands(program) {
  program
    .command('login')
    .description('Authenticate with Insighta via GitHub')
    .action(async () => {
      const chalk = (await import('chalk')).default;
      const ora = (await import('ora')).default;
      const open = (await import('open')).default;

      const state = generateState();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      const spinner = ora('Waiting for browser authentication...').start();

      try {
        const token = await new Promise((resolve, reject) => {
          const server = http.createServer((req, res) => {
            const parsed = url.parse(req.url, true);

            if (parsed.pathname === '/callback') {
              const { access_token, refresh_token, username, state: callbackState } = parsed.query;

              if (callbackState && callbackState !== state) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end('<html><body><h1>Authentication failed</h1><p>State mismatch. Please try again.</p></body></html>');
                reject(new Error('State mismatch'));
                server.close();
                return;
              }

              if (!access_token) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end('<html><body><h1>Authentication failed</h1><p>No token received.</p></body></html>');
                reject(new Error('No access token received'));
                server.close();
                return;
              }

              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('<html><body><h1>Authentication successful!</h1><p>You can close this tab and return to the terminal.</p></body></html>');

              resolve({ access_token, refresh_token, username });
              server.close();
            }
          });

          server.listen(0, () => {
            const port = server.address().port;
            const redirectUri = `http://localhost:${port}/callback`;
            const authUrl =
              `${API_BASE_URL}/auth/github` +
              `?redirect_uri=${encodeURIComponent(redirectUri)}` +
              `&state=${state}` +
              `&code_challenge=${codeChallenge}` +
              `&source=cli`;

            open(authUrl).catch(() => {
              spinner.info(`Open this URL in your browser:\n${authUrl}`);
            });
          });

          server.on('error', reject);

          setTimeout(() => {
            server.close();
            reject(new Error('Authentication timed out after 120 seconds'));
          }, 120_000);
        });

        saveCredentials(token);
        spinner.succeed(chalk.green(`Logged in as @${token.username}`));
      } catch (err) {
        spinner.fail(chalk.red(`Login failed: ${err.message}`));
        process.exit(1);
      }
    });

  program
    .command('logout')
    .description('Log out of Insighta')
    .action(async () => {
      const chalk = (await import('chalk')).default;
      const ora = (await import('ora')).default;

      const credentials = loadCredentials();
      if (!credentials) {
        console.log(chalk.yellow('Not currently logged in.'));
        return;
      }

      const spinner = ora('Logging out...').start();

      try {
        await authenticatedRequest('POST', '/auth/logout', {
          body: { refresh_token: credentials.refresh_token },
        });
      } catch {
        // proceed with local logout even if server call fails
      }

      deleteCredentials();
      spinner.succeed(chalk.green('Logged out'));
    });

  program
    .command('whoami')
    .description('Show current authenticated user')
    .action(async () => {
      const chalk = (await import('chalk')).default;
      const ora = (await import('ora')).default;

      const spinner = ora('Fetching user info...').start();

      try {
        const res = await authenticatedRequest('GET', '/auth/me');

        if (res.status !== 200) {
          spinner.fail(chalk.red('Failed to fetch user info.'));
          process.exit(1);
        }

        spinner.stop();
        console.log(userInfoTable(res.data));
      } catch (err) {
        spinner.fail();
        await handleError(err);
      }
    });
}

module.exports = { registerAuthCommands };
