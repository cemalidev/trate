# Contributing to trate

Thank you for your interest in contributing to trate!

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/trate.git
   cd trate
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/my-new-feature
   ```

## Development Workflow

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check lint
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format with Prettier
npx prettier --write src tests
```

### Testing

All new features should include tests:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Type Safety

We use TypeScript with strict mode:

```bash
npm run typecheck
```

### Building

```bash
npm run build
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Build process or auxiliary tool changes

Example:
```
feat: add Spanish translation
fix: handle network timeout gracefully
docs: update README with new commands
```

## Pull Request Process

1. Update the README.md if you add new features
2. Update CHANGELOG.md under "Unreleased"
3. Ensure all tests pass
4. Ensure lint passes
5. Update the version in package.json if applicable
6. The PR will be reviewed and merged

## Adding Translations

To add a new language:

1. Create a new file in `src/i18n/` (e.g., `pt.ts`)
2. Copy the structure from `en.ts`
3. Translate all strings
4. Update `src/i18n/index.ts`:
   - Add to imports
   - Add to `translations` object
   - Add to `supportedLocales` array
5. Add tests for the new language

## Reporting Issues

Please include:
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages if applicable

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
