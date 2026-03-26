# Release Guide

## Overview

This project uses GitHub Actions for automated releases. Every tag push triggers a release workflow that:

1. Updates `package.json` version from the tag
2. Runs tests
3. Builds the project
4. Publishes to npm
5. Creates a GitHub Release

## Release Process

### Standard Release (GitHub Actions)

```bash
# 1. Update version in package.json (or let workflow auto-update)
npm version patch --no-git-tag-version

# 2. Commit changes
git add .
git commit -m "v1.4.9"

# 3. Create and push tag (this triggers GitHub Actions)
git tag v1.4.9
git push origin v1.4.9
```

GitHub Actions will automatically:

- Publish to npm
- Create GitHub Release

### Manual Publish (No GitHub Actions)

If you need to publish manually without triggering GitHub Actions:

```bash
# 1. Build and publish without pushing tag
npm run build
npm publish --access public
```

**Warning:** Do NOT push tags to remote if manually publishing!

## Common Issues

### npm 409 Conflict Error

**Cause:** Both GitHub Actions and manual publish attempt to publish the same version.

**Solution:** Choose one method only.

### GitHub Action Failed

Check workflow run logs at:

```
https://github.com/cemalidev/trate/actions
```

## Setup

### NPM Token

1. Go to https://www.npmjs.com/settings/tokens
2. Create automation token
3. Add to GitHub repo: Settings → Secrets → Actions → `NPM_TOKEN`

### Local .npmrc (Optional)

```bash
//registry.npmjs.org/:_authToken=YOUR_TOKEN
```

**Security:** Add `.npmrc` to `.gitignore`!

## Deprecating Old Versions

To deprecate an old version on npm:

```bash
npm deprecate @cemalidev/trate@<version> "<reason>"
```

Example:

```bash
npm deprecate @cemalidev/trate@1.4.1 "Security vulnerability fixed in 1.4.2"
```

## Quick Reference

| Task              | Command                                               |
| ----------------- | ----------------------------------------------------- |
| Create release    | `git tag v1.4.9 && git push origin v1.4.9`            |
| Manual publish    | `npm publish --access public`                         |
| Check npm version | `npm show @cemalidev/trate version`                   |
| Deprecate version | `npm deprecate @cemalidev/trate@<version> "<reason>"` |
