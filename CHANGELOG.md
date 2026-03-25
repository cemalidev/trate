# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Multi-language support (English, Turkish, German, French, Spanish)
- System language auto-detection
- `set-lang` command for manual language selection
- Graceful shutdown handling (SIGINT/SIGTERM)
- Error handling with `TrateError` class
- Logging utility with levels (debug, info, warn, error)
- Vitest testing framework with 44 tests
- ESLint and Prettier configuration
- GitHub Actions CI/CD workflows
- Test coverage reporting

### Changed
- Refactored all hardcoded strings to use i18n system
- Updated config system to support locale preference
- Improved TypeScript strict mode compliance

### Fixed
- Removed unused React configuration from tsconfig.json
- Added missing `@types/figlet` dev dependency
- Fixed in-memory cache type safety

## [0.1.0] - Initial Release

### Added
- Basic currency conversion (fiat, crypto, metals, Turkish gold)
- Favorites dashboard
- Configuration persistence with `conf` package
- Multiple API fallbacks
- ASCII art logo
- 5-minute API cache
