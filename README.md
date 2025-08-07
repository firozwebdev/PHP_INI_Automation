# PHP INI Automation

🚀 **Automated PHP ini configuration tool for Laravel and other PHP projects across multiple environments**

[![npm version](https://badge.fury.io/js/php-ini-automation.svg)](https://badge.fury.io/js/php-ini-automation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Multi-Environment Support**: Works with Laragon, XAMPP, WAMP, and PVM
- ✅ **Laravel Ready**: Automatically enables all required Laravel extensions
- ✅ **Version Specific**: Supports different PHP versions
- ✅ **Smart Detection**: Automatically finds your PHP installation
- ✅ **Customizable**: Add your own PHP settings
- ✅ **TypeScript**: Full TypeScript support with type definitions

## Supported Environments

| Environment | Support | Path Detection |
|-------------|---------|----------------|
| **Laragon** | ✅ | `LARAGON_PATH` env var |
| **XAMPP** | ✅ | `XAMPP_PATH` env var |
| **WAMP** | ✅ | `WAMP_PATH` env var |
| **PVM** | ✅ | `PVM_PATH` env var |
| **Custom** | ✅ | `DEFAULT_PATH` env var |

## Installation

### Global Installation (Recommended)

```bash
npm install -g php-ini-automation
```

### Local Installation

```bash
npm install php-ini-automation
```

## Usage

### Command Line Interface

```bash
# Use default PHP version
php-ini-automation

# Specify PHP version
php-ini-automation 8.2

# With environment variables
LARAGON_PATH="C:/laragon" php-ini-automation 8.1
```

### Programmatic Usage

```typescript
import { updatePhpIni, customizePhpIni } from 'php-ini-automation';

// Update PHP ini for default version
await updatePhpIni();

// Update PHP ini for specific version
await updatePhpIni('8.2');

// Custom settings
await customizePhpIni('/path/to/php.ini', '/path/to/ext', {
    memory_limit: '1G',
    max_execution_time: 300
});
```

## Environment Variables

Set these environment variables to help the tool locate your PHP installation:

```bash
# For Laragon
LARAGON_PATH=C:/laragon

# For XAMPP
XAMPP_PATH=C:/xampp

# For WAMP
WAMP_PATH=C:/wamp64

# For PVM (PHP Version Manager)
PVM_PATH=C:/tools/php

# Custom PHP installation
DEFAULT_PATH=C:/php
```

## Extensions Enabled

The tool automatically enables these PHP extensions required by Laravel:

- curl
- pdo_sqlite
- sqlite3
- openssl
- pdo_mysql
- mbstring
- tokenizer
- json
- fileinfo
- ctype
- xml
- bcmath
- gd
- zip

## Default Settings Applied

```ini
max_execution_time = 120
memory_limit = 512M
output_buffering = Off
zlib_output_compression = Off
```

## Development

### Prerequisites

- Node.js 16+
- TypeScript 5+

### Setup

```bash
git clone https://github.com/yourusername/php-ini-automation.git
cd php-ini-automation
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## API Reference

### `updatePhpIni(version?: string): Promise<void>`

Updates the php.ini configuration for the specified PHP version.

**Parameters:**
- `version` (optional): PHP version to update for (e.g., '8.2', '8.1')

### `customizePhpIni(filePath: string, extensionsDir: string, customSettings?: Record<string, string | number>): Promise<void>`

Customizes a specific php.ini file with extensions and settings.

**Parameters:**
- `filePath`: Path to the php.ini file
- `extensionsDir`: Directory containing PHP extensions
- `customSettings` (optional): Additional PHP settings to apply

### `determinePhpIniPaths(version?: string): { iniPath: string, extensionDir: string }`

Determines the appropriate paths for php.ini and extensions directory.

**Parameters:**
- `version` (optional): PHP version

**Returns:**
- Object with `iniPath` and `extensionDir` properties

### `validateSourceFile(filePath: string): void`

Validates that a php.ini file exists at the specified path.

**Parameters:**
- `filePath`: Path to validate

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report Issues](https://github.com/yourusername/php-ini-automation/issues)
- 💡 [Request Features](https://github.com/yourusername/php-ini-automation/issues)
- 📖 [Documentation](https://github.com/yourusername/php-ini-automation#readme)
