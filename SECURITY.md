# Security Policy

## Supported Versions

This project is a personal financial application. Security updates are provided for the latest version only.

| Version  | Supported          |
| -------- | ------------------ |
| Latest   | :white_check_mark: |
| < Latest | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in this project, please report it privately:

### How to Report

1. **GitHub Security Advisories (Preferred)**
   - Go to the [Security tab](https://github.com/showzky/financialapp/security/advisories)
   - Click "Report a vulnerability"
   - Provide detailed information about the vulnerability

2. **Email (Alternative)**
   - Contact: @showzky via GitHub
   - Include:
     - Description of the vulnerability
     - Steps to reproduce
     - Potential impact
     - Suggested fix (if any)

### What to Include

- **Type of vulnerability** (e.g., XSS, SQL injection, authentication bypass)
- **Location** (file path, line number, component)
- **Steps to reproduce** (detailed, step-by-step instructions)
- **Proof of concept** (if applicable)
- **Impact** (what an attacker could do)
- **Suggested remediation** (optional)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 14 days
  - Low: 30 days

### Security Best Practices for Contributors

1. **Dependencies**: Run `pnpm audit` before submitting PRs
2. **Secrets**: Never commit API keys, tokens, or credentials
3. **Input Validation**: Always validate and sanitize user input
4. **Dependencies**: Keep dependencies up to date
5. **Code Review**: All PRs require review before merging

## Security Features

This repository implements the following security measures:

- **Dependabot**: Automated dependency updates and security alerts
- **CodeQL Analysis**: Automated code scanning for vulnerabilities
- **Branch Protection**: Main branch requires PR reviews and status checks
- **Secret Scanning**: Automated detection of committed secrets
- **Signed Commits**: Required for all commits (optional but recommended)

## Scope

This security policy covers:

- The codebase in this repository
- Dependencies listed in package.json
- Build and deployment processes
- GitHub Actions workflows

Out of scope:

- Third-party integrations (Vercel, external APIs)
- User data (this is a personal project)
- Infrastructure (handled by Vercel)

## Disclosure Policy

- Vulnerabilities will be disclosed after a fix is available
- Credit will be given to security researchers (if desired)
- A security advisory will be published on GitHub

## Thank You

Thank you for helping keep this project secure!
