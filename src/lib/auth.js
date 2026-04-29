'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CREDENTIALS_DIR = path.join(os.homedir(), '.insighta');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');

function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

function generateCodeVerifier() {
  return crypto.randomBytes(48).toString('base64url').slice(0, 64);
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function ensureCredentialsDir() {
  if (!fs.existsSync(CREDENTIALS_DIR)) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  }
}

function saveCredentials(credentials) {
  ensureCredentialsDir();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), {
    mode: 0o600,
  });
}

function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function deleteCredentials() {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
}

module.exports = {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  saveCredentials,
  loadCredentials,
  deleteCredentials,
  CREDENTIALS_FILE,
};
