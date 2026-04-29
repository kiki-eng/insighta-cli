# @insighta/cli

A command-line tool for interacting with the Insighta API. Supports authentication via GitHub OAuth (PKCE flow) and full profile management.

## Installation

```bash
npm install -g @insighta/cli
```

For local development:

```bash
git clone <repo-url>
cd insighta-cli
npm install
npm link
```

## Configuration

Set the API base URL via environment variable:

```bash
export INSIGHTA_API_URL=http://localhost:5000
```

Defaults to `http://localhost:5000` if not set.

## Authentication

The CLI uses a PKCE-based OAuth flow through GitHub.

### Login

```bash
insighta login
```

Opens your browser to authenticate with GitHub. After successful authentication, tokens are stored locally at `~/.insighta/credentials.json`.

### Logout

```bash
insighta logout
```

Revokes your session and removes local credentials.

### Who Am I

```bash
insighta whoami
```

Displays information about the currently authenticated user.

## Profile Commands

### List Profiles

```bash
insighta profiles list
insighta profiles list --gender male --country US --page 2 --limit 10
insighta profiles list --min-age 18 --max-age 30 --sort-by name --order asc
```

**Options:**

| Flag | Description |
|------|-------------|
| `--gender <gender>` | Filter by gender |
| `--country <country>` | Filter by country |
| `--age-group <group>` | Filter by age group |
| `--min-age <age>` | Minimum age |
| `--max-age <age>` | Maximum age |
| `--min-gender-probability <p>` | Minimum gender probability |
| `--min-country-probability <p>` | Minimum country probability |
| `--sort-by <field>` | Sort by field |
| `--order <asc\|desc>` | Sort order |
| `--page <n>` | Page number (default: 1) |
| `--limit <n>` | Results per page (default: 20) |

### Get a Profile

```bash
insighta profiles get <id>
```

### Search Profiles

```bash
insighta profiles search "John"
```

### Create a Profile

```bash
insighta profiles create --name "Jane Doe"
```

### Export Profiles

```bash
insighta profiles export --format csv
insighta profiles export --format csv --country US --gender female
```

Saves the file to the current directory as `profiles_<timestamp>.csv`.

## Auth Flow Details

1. `insighta login` generates a PKCE code verifier and challenge
2. A temporary local HTTP server starts on a random port
3. Your browser opens to the Insighta auth endpoint with the PKCE challenge
4. After GitHub authentication, the backend redirects to the local server with tokens
5. Tokens are stored at `~/.insighta/credentials.json`
6. All subsequent API calls include the access token
7. If a token expires, the CLI automatically refreshes it

## License

MIT
