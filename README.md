# Insighta Labs+ CLI

Command-line interface for the Insighta Labs+ Profile Intelligence Platform.

## Installation

```bash
# Clone and link globally
git clone https://github.com/kiki-eng/insighta-cli.git
cd insighta-cli
npm install
npm link
```

After linking, `insighta` is available globally from any directory.

## Configuration

Set the backend API URL (defaults to the deployed Railway instance):
```bash
export INSIGHTA_API_URL=https://hng-stage0-backend-production-68c6.up.railway.app
```

## Authentication

### Login
```bash
insighta login
```
Opens your browser for GitHub OAuth authentication. Tokens are stored at `~/.insighta/credentials.json`.

### Logout
```bash
insighta logout
```

### Check Current User
```bash
insighta whoami
```

## Profile Commands

### List Profiles
```bash
insighta profiles list
insighta profiles list --gender male
insighta profiles list --country NG --age-group adult
insighta profiles list --min-age 25 --max-age 40
insighta profiles list --sort-by age --order desc
insighta profiles list --page 2 --limit 20
```

### Get Profile by ID
```bash
insighta profiles get <uuid>
```

### Natural Language Search
```bash
insighta profiles search "young males from nigeria"
insighta profiles search "females above 30"
insighta profiles search "adult males from kenya"
```

### Create Profile (Admin only)
```bash
insighta profiles create --name "Harriet Tubman"
```

### Export to CSV
```bash
insighta profiles export --format csv
insighta profiles export --format csv --gender male --country NG
```

## Token Handling

- Access tokens expire in 3 minutes
- Refresh tokens expire in 5 minutes
- The CLI auto-refreshes expired access tokens
- If refresh fails, you are prompted to `insighta login` again
- Credentials stored at `~/.insighta/credentials.json`

## Auth Flow (PKCE)

1. CLI generates `state`, `code_verifier`, and `code_challenge`
2. CLI opens browser to backend OAuth endpoint
3. User authenticates on GitHub
4. Backend exchanges code, creates/updates user, issues tokens
5. Backend redirects to CLI's local callback with tokens
6. CLI stores tokens locally
