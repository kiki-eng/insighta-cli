'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');
const { API_BASE_URL } = require('./config');
const { loadCredentials, saveCredentials } = require('./auth');

function request(method, urlPath, { body, headers: extraHeaders, raw } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, API_BASE_URL);
    const transport = url.protocol === 'https:' ? https : http;

    const headers = { ...extraHeaders };

    if (urlPath.startsWith('/api/')) {
      headers['X-API-Version'] = '1';
    }

    if (body && !raw) {
      headers['Content-Type'] = 'application/json';
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = transport.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString();
        if (raw) {
          resolve({ status: res.statusCode, headers: res.headers, body: responseBody });
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(responseBody);
        } catch {
          parsed = responseBody;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on('error', reject);

    if (body && !raw) {
      req.write(JSON.stringify(body));
    } else if (body && raw) {
      req.write(body);
    }

    req.end();
  });
}

async function refreshToken(credentials) {
  const res = await request('POST', '/auth/refresh', {
    body: { refresh_token: credentials.refresh_token },
    headers: { Authorization: `Bearer ${credentials.access_token}` },
  });

  if (res.status === 200 && res.data && res.data.access_token) {
    const updated = {
      ...credentials,
      access_token: res.data.access_token,
      refresh_token: res.data.refresh_token || credentials.refresh_token,
    };
    saveCredentials(updated);
    return updated;
  }

  return null;
}

async function authenticatedRequest(method, urlPath, options = {}) {
  const chalk = (await import('chalk')).default;
  let credentials = loadCredentials();

  if (!credentials) {
    console.error(chalk.red("Not logged in. Run 'insighta login' first."));
    process.exit(1);
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${credentials.access_token}`,
  };

  let res = await request(method, urlPath, { ...options, headers });

  if (res.status === 401) {
    const newCreds = await refreshToken(credentials);
    if (!newCreds) {
      console.error(
        chalk.red("Session expired. Run 'insighta login' to re-authenticate.")
      );
      process.exit(1);
    }
    headers.Authorization = `Bearer ${newCreds.access_token}`;
    res = await request(method, urlPath, { ...options, headers });
  }

  return res;
}

module.exports = { request, authenticatedRequest };
