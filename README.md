# PHP INI Automation v3.0 🚀

**The Ultimate PHP Configuration Tool - Intelligent, Powerful, Unbeatable**

[![npm version](https://badge.fury.io/js/php-ini-automation.svg)](https://badge.fury.io/js/php-ini-automation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/php-ini-automation.svg)](https://npmjs.org/package/php-ini-automation)

> **Revolutionary PHP detection and configuration tool that automatically finds and configures ALL your PHP installations across ANY environment. From Laragon to XAMPP, PVM to WAMP - we detect them all!**

## 🌟 Revolutionary Features

### 🔍 **Intelligent Detection System**
- **🎯 Multi-Method Detection**: System PATH, Windows Registry, Deep Scanning, Environment Variables
- **🏗️ Universal Environment Support**: Laragon, XAMPP, WAMP, PVM, MAMP, Uniform Server, Bitnami, Custom
- **🔄 Multi-Version Detection**: Automatically finds ALL PHP versions in each environment
- **📊 Comprehensive Analysis**: Architecture, Thread Safety, Build Date, Configuration details

### ⚡ **Professional CLI Experience**
- **🎨 Beautiful Interface**: Colored output, formatted tables, progress indicators
- **🤖 Interactive Selection**: Choose from detected installations with smart defaults
- **📋 Detailed Reporting**: Real-time feedback on extensions and settings
- **🛡️ Validation System**: Pre-flight checks and troubleshooting suggestions

### 🚀 **Advanced Configuration**
- **📦 Smart Extension Management**: Validates extension files before enabling
- **⚙️ Laravel-Optimized Settings**: Performance, security, and development settings
- **💾 Automatic Backup**: Timestamped backups before any changes
- **🔧 Custom Settings Support**: Add your own PHP configurations

## 🏗️ Supported Environments

| Environment | Multi-Version | Auto-Detection | Deep Scan | Priority |
|-------------|---------------|----------------|-----------|----------|
| **System PATH** | ✅ | ✅ | ✅ | 🥇 Highest |
| **Laragon** | ✅ | ✅ | ✅ | 🥈 High |
| **PVM** | ✅ | ✅ | ✅ | 🥉 High |
| **WAMP/WAMP64** | ✅ | ✅ | ✅ | 🏅 Medium |
| **XAMPP** | ✅ | ✅ | ✅ | 🏅 Medium |
| **MAMP** | ✅ | ✅ | ✅ | 🏅 Medium |
| **Uniform Server** | ✅ | ✅ | ✅ | 🏅 Medium |
| **Bitnami** | ✅ | ✅ | ✅ | 🏅 Medium |
| **Custom/Manual** | ✅ | ✅ | ✅ | 🏅 Low |

### 🔍 **Detection Methods**
1. **System PATH Scanning** - Finds active PHP installations
2. **Windows Registry** - Discovers registered PHP installations
3. **Environment Variables** - Respects manual configurations
4. **Deep Directory Scanning** - Recursively searches common paths
5. **Intelligent Pattern Matching** - Recognizes PHP directory structures

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
