# Repository Security Configuration Guide

This guide provides step-by-step instructions for hardening the `showzky/financialapp` repository.

## Table of Contents
1. [Branch Protection Rules](#branch-protection-rules)
2. [Secret Scanning](#secret-scanning)
3. [Dependabot Security Updates](#dependabot-security-updates)
4. [Vercel Deployment Setup](#vercel-deployment-setup)
5. [Validation Checklist](#validation-checklist)

---

## Branch Protection Rules

### Why: Prevents accidental or unauthorized changes to production code

### Step-by-Step Configuration for `main` Branch

1. **Navigate to Settings**
   - Go to: https://github.com/showzky/financialapp/settings/branches
   - Click "Add branch protection rule"

2. **Branch Name Pattern**
   - Enter: `main`

3. **Require a Pull Request Before Merging** ✅
   - **Why**: Ensures all changes are reviewed before merging
   - Check: ✅ "Require a pull request before merging"
   - Set: **Required approvals: 1**
   - Check: ✅ "Dismiss stale pull request approvals when new commits are pushed"
     - **Why**: New code needs fresh review
   - Check: ✅ "Require review from Code Owners"
     - **Why**: Ensures @showzky reviews all changes

4. **Require Status Checks to Pass** ✅
   - **Why**: Prevents merging broken code
   - Check: ✅ "Require status checks to pass before merging"
   - Check: ✅ "Require branches to be up to date before merging"
     - **Why**: Ensures changes are tested against latest code
   - **Select these required status checks**:
     - `lint` (from CI workflow)
     - `test` (from CI workflow)
     - `build` (from CI workflow)
     - `analyze` (from CodeQL workflow)

5. **Require Conversation Resolution** ✅
   - **Why**: Ensures all review comments are addressed
   - Check: ✅ "Require conversation resolution before merging"

6. **Require Signed Commits** ✅ (OPTIONAL but RECOMMENDED)
   - **Why**: Verifies commit authenticity and prevents impersonation
   - Check: ✅ "Require signed commits"
   - **Setup**: See [GitHub's GPG key guide](https://docs.github.com/en/authentication/managing-commit-signature-verification)

7. **Require Linear History** ✅
   - **Why**: Keeps git history clean and easy to understand
   - Check: ✅ "Require linear history"

8. **Require Deployments to Succeed** (OPTIONAL)
   - **Why**: Ensures Vercel deployment succeeds before merging
   - If you want this: Check ✅ "Require deployments to succeed before merging"
   - Select: `Production – showzky/financialapp`

9. **Do NOT Allow Bypassing Settings** ⛔
   - **Why**: Even admins must follow the rules
   - Leave UNCHECKED: ❌ "Allow specified actors to bypass required pull requests"
   - **This is critical for security**

10. **Lock Branch** (OPTIONAL - for extra safety)
    - **Why**: Makes main branch completely read-only
    - Check: ✅ "Lock branch" (ONLY if you want extreme protection)
    - **Warning**: You won't be able to push to main at all

11. **Restrict Who Can Push** (OPTIONAL)
    - **Why**: Limits who can push directly
    - If you want this: Check ✅ "Restrict pushes that create matching branches"
    - Add: @showzky to the allowed list

12. **Rules Applied to Everyone**
    - Check: ✅ "Do not allow bypassing the above settings"
    - **This ensures even admins follow the rules**

13. **Click "Create" or "Save changes"**

---

## Secret Scanning

### Why: Automatically detects committed secrets like API keys and passwords

### Configuration Steps

1. **Navigate to Settings → Code security and analysis**
   - URL: https://github.com/showzky/financialapp/settings/security_analysis

2. **Enable Secret Scanning** ✅
   - Click "Enable" for "Secret scanning"
   - **Why**: Detects committed secrets automatically

3. **Enable Push Protection** ✅
   - Click "Enable" for "Push protection"
   - **Why**: Prevents secrets from being pushed in the first place

4. **Secret Scanning Alerts**
   - View alerts at: https://github.com/showzky/financialapp/security/secret-scanning
   - You'll be notified via email when secrets are detected

### Best Practices

- **Never commit**:
  - API keys
  - OAuth tokens
  - Private keys
  - Passwords
  - Database credentials
  - `.env` files with secrets

- **Use environment variables**:
  - Store secrets in Vercel's environment variables
  - Use `.env.example` files (without actual values) for documentation
  - Add `.env*` to `.gitignore` (already done)

- **If you accidentally commit a secret**:
  1. **Revoke/rotate the secret immediately**
  2. Close the secret scanning alert
  3. Update the secret in Vercel or wherever it's used
  4. Never reuse the exposed secret

---

## Dependabot Security Updates

### Why: Automatically keeps dependencies updated and secure

### Configuration (Already Done via `.github/dependabot.yml`)

Dependabot is configured to:
- Check for updates weekly (every Monday)
- Group minor/patch updates together
- Separate PRs for major updates
- Auto-label PRs with "dependencies"
- Limit to 10 open PRs max

### Best Practices

1. **Review Dependabot PRs Weekly**
   - Check: https://github.com/showzky/financialapp/pulls?q=is%3Aopen+is%3Apr+label%3Adependencies

2. **Security Updates (Priority: HIGH)**
   - Marked with "security" label
   - Review and merge ASAP
   - Test locally if changes seem significant

3. **Regular Updates (Priority: MEDIUM)**
   - Review release notes for breaking changes
   - Run tests locally if uncertain
   - Merge when tests pass

4. **Auto-Merge Setup** (OPTIONAL)
   - For trusted updates only (e.g., patch versions)
   - Use GitHub's auto-merge feature with branch protection

5. **Monitor for Vulnerabilities**
   - Check: https://github.com/showzky/financialapp/security/dependabot
   - Enable email notifications for security updates

### Commands

```bash
# Check for vulnerabilities locally
pnpm audit

# Fix vulnerabilities automatically (use with caution)
pnpm audit --fix

# View outdated packages
pnpm outdated
```

---

## Vercel Deployment Setup

### Why: Ensures proper deployment strategy (main = production, development = preview)

### Configuration Steps

1. **Navigate to Vercel Project Settings**
   - Go to: https://vercel.com/showzky/financialapp/settings

2. **Git Configuration**
   - Tab: "Git"
   - **Production Branch**: `main`
     - **Why**: Only main branch deploys to production
   - **Enable Automatic Deployments**: ✅ ON
     - **Why**: Auto-deploy on push

3. **Branch Deploy Settings**
   - **Production Deployments** (main branch):
     - Trigger: On push to `main`
     - Domain: `financialapp.vercel.app` (or your custom domain)
   
   - **Preview Deployments** (all other branches):
     - Trigger: On push to any branch (including `development`)
     - Domain: `financialapp-git-<branch>-showzky.vercel.app`
     - **Why**: Test changes before merging to main

4. **Environment Variables**
   - Tab: "Environment Variables"
   - Add separate variables for each environment:
     - **Production**: Used by `main` branch
     - **Preview**: Used by all preview deployments
     - **Development**: Used locally
   - **Important**: Never commit these values to git

5. **Deployment Protection** (OPTIONAL)
   - Tab: "Deployment Protection"
   - Options:
     - **Vercel Authentication**: Require login to view previews
     - **Password Protection**: Add password for previews
   - **Why**: Prevents public access to in-development features

6. **Ignored Build Step** (OPTIONAL)
   - Tab: "Git"
   - Add build check: Only build if files changed
   - Command example: `git diff HEAD^ HEAD --quiet . || exit 1`
   - **Why**: Saves build minutes

### Verification

1. **Test Production Deploy**:
   - Push to `main` branch
   - Check: https://vercel.com/showzky/financialapp/deployments
   - Verify: Deployment status = "Production"

2. **Test Preview Deploy**:
   - Push to `development` branch
   - Check: https://vercel.com/showzky/financialapp/deployments
   - Verify: Deployment status = "Preview"
   - Open preview URL and test changes

3. **Check Build Status in CI**:
   - Verify CI workflow passes before Vercel deploys
   - If using "Require deployments to succeed" in branch protection

---

## Validation Checklist

Use this checklist to confirm everything is properly secured:

### GitHub Repository Settings

- [ ] **Branch Protection for `main`**
  - [ ] Requires pull request before merging
  - [ ] Requires 1 approval
  - [ ] Dismisses stale reviews on new commits
  - [ ] Requires review from Code Owners (@showzky)
  - [ ] Requires status checks: `lint`, `test`, `build`, `analyze`
  - [ ] Requires branches to be up to date
  - [ ] Requires conversation resolution
  - [ ] Requires linear history
  - [ ] Requires signed commits (optional but recommended)
  - [ ] Does NOT allow bypassing (admins included)

- [ ] **Secret Scanning**
  - [ ] Secret scanning enabled
  - [ ] Push protection enabled
  - [ ] No secrets currently detected

- [ ] **Code Security**
  - [ ] Dependabot alerts enabled
  - [ ] Dependabot security updates enabled
  - [ ] CodeQL workflow running on schedule
  - [ ] No open security alerts

### Files Created

- [ ] **`.github/CODEOWNERS`**
  - [ ] @showzky is the default owner
  - [ ] Critical paths explicitly listed

- [ ] **`.github/pull_request_template.md`**
  - [ ] Includes security checklist
  - [ ] Covers all change types
  - [ ] Requires testing confirmation

- [ ] **`SECURITY.md`**
  - [ ] Clear reporting instructions
  - [ ] Response timeline defined
  - [ ] Private reporting encouraged for vulnerabilities

- [ ] **`.github/ISSUE_TEMPLATE/bug_report.yml`**
  - [ ] Structured bug reporting
  - [ ] Required fields present

- [ ] **`.github/ISSUE_TEMPLATE/security_concern.yml`**
  - [ ] Warns about private reporting for serious issues
  - [ ] Structured security reporting

- [ ] **`.github/workflows/ci.yml`**
  - [ ] Runs on push to main and development
  - [ ] Runs on pull requests
  - [ ] Includes lint, test, build jobs
  - [ ] Uses pnpm with frozen lockfile

- [ ] **`.github/workflows/codeql.yml`**
  - [ ] Analyzes JavaScript/TypeScript
  - [ ] Runs on schedule (weekly)
  - [ ] Uses security-and-quality queries

- [ ] **`.github/dependabot.yml`**
  - [ ] Weekly dependency updates
  - [ ] Groups minor/patch updates
  - [ ] Includes GitHub Actions updates
  - [ ] Auto-assigns to @showzky

### Vercel Configuration

- [ ] **Production Deployment**
  - [ ] `main` branch deploys to production
  - [ ] Custom domain configured (if applicable)
  - [ ] Environment variables set

- [ ] **Preview Deployments**
  - [ ] `development` branch creates previews
  - [ ] All PRs create preview deployments
  - [ ] Preview URLs accessible

- [ ] **Build Configuration**
  - [ ] Build command: `pnpm build`
  - [ ] Output directory: `dist`
  - [ ] Install command: `pnpm install --frozen-lockfile`
  - [ ] Node.js version: 20.x

### Testing

- [ ] **CI Workflow**
  - [ ] Push to development triggers CI
  - [ ] All jobs (lint, test, build) pass
  - [ ] CodeQL analysis completes successfully

- [ ] **Local Development**
  - [ ] `pnpm install` works
  - [ ] `pnpm dev` starts dev server
  - [ ] `pnpm lint` passes
  - [ ] `pnpm test` passes
  - [ ] `pnpm build` succeeds

- [ ] **Pull Request Flow**
  - [ ] Create PR from development to main
  - [ ] PR template auto-populates
  - [ ] Required status checks appear
  - [ ] Cannot merge without approval
  - [ ] Cannot merge until checks pass

### Security Hardening Complete ✅

- [ ] All checklist items above are completed
- [ ] No security alerts in GitHub Security tab
- [ ] Dependabot PRs are being created
- [ ] CI/CD pipeline is green
- [ ] Documentation is up to date

---

## Additional Security Recommendations

### 1. Enable Two-Factor Authentication (2FA)
- **Why**: Protects your GitHub account from unauthorized access
- **Setup**: https://github.com/settings/security

### 2. Use SSH Keys for Git Operations
- **Why**: More secure than HTTPS passwords
- **Setup**: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### 3. Review Access Regularly
- **Why**: Ensures only authorized users have access
- **Check**: https://github.com/showzky/financialapp/settings/access

### 4. Monitor Security Advisories
- **Why**: Stay informed about new vulnerabilities
- **Subscribe**: Watch the repository and enable security alerts

### 5. Regular Security Audits
- **Schedule**: Monthly review of:
  - Open Dependabot alerts
  - CodeQL findings
  - Secret scanning alerts
  - Access permissions

---

## Troubleshooting

### Cannot Merge PR Due to Branch Protection
- **Solution**: Ensure all required status checks pass
- **Check**: CI workflow logs for failures
- **Fix**: Address failing tests/lints/builds

### Dependabot PR Conflicts
- **Solution**: Rebase the PR or close and let Dependabot recreate it
- **Command**: `@dependabot rebase` in PR comment

### CodeQL Analysis Fails
- **Solution**: Check workflow logs for errors
- **Common fix**: Update `@github/codeql-action` to latest version

### Secret Accidentally Committed
1. **Immediately revoke** the secret
2. **Rotate** with a new secret
3. **Update** in Vercel environment variables
4. **Never reuse** the exposed secret

---

## Questions or Issues?

If you encounter any issues with this security setup:
1. Check the [GitHub documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features)
2. Review workflow logs for errors
3. Create an issue using the bug report template

**Remember**: Security is an ongoing process, not a one-time setup. Review and update these settings regularly.
