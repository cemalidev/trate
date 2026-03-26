# Architecture

## Overview

Trate is a terminal-based currency tracker that provides real-time exchange rates for fiat currencies, cryptocurrencies, and precious metals.

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript
- **Build**: esbuild
- **CLI Framework**: Commander.js
- **Config Storage**: conf (node-config)
- **HTTP**: node-fetch

## Project Structure

```
trate/
├── src/
│   ├── index.ts           # Main CLI entry point
│   ├── convert.ts          # Currency conversion logic
│   ├── config/             # Configuration management
│   ├── i18n/              # Internationalization
│   ├── dashboard.ts        # Favorites dashboard
│   ├── logo.ts            # ASCII logo
│   ├── ui.ts              # UI utilities
│   ├── types/              # TypeScript types
│   └── utils/             # Utility functions
├── dist/                   # Compiled output
├── tests/                  # Test files
└── docs/                  # Documentation
```

## Data Flow

```
User Input → Commander.js → index.ts → convert.ts → API → Response
                                            ↓
                                      config.ts (cached rates)
```

## API Integration

Trate uses the trate-api backend for fetching rates:

- `/v1/latest` - Fiat exchange rates
- `/v1/crypto` - Cryptocurrency prices
- `/v1/metals` - Precious metals prices

## Configuration

User preferences are stored using the `conf` package:
- Base currency
- Favorites list
- Language preference
- Custom aliases
