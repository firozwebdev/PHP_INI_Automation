# PHP INI Automation v4.1 🚀

**The Ultimate Laravel-Optimized PHP Configuration Tool - Intelligent, Powerful, Laravel-Ready**

[![npm version](https://badge.fury.io/js/php-ini-automation.svg)](https://badge.fury.io/js/php-ini-automation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/php-ini-automation.svg)](https://npmjs.org/package/php-ini-automation)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue.svg)](https://npmjs.org/package/php-ini-automation)
[![Laravel](https://img.shields.io/badge/Laravel-10%2B%20Ready-red.svg)](https://laravel.com)

> **Revolutionary cross-platform PHP detection and configuration tool specifically optimized for Laravel development. Automatically finds and configures ALL your PHP installations with Laravel-specific extensions, performance settings, and security configurations across ANY environment and ANY operating system!**

🎯 **Quick Start**: `npm install -g php-ini-automation && pia`
🚀 **Laravel Ready**: Optimized for Laravel 10+ with all required extensions and performance settings

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

## 🎯 Laravel-Specific Optimizations

### 📦 **Essential Extensions (Auto-Enabled)**
- **Core Requirements**: curl, mbstring, openssl, tokenizer, xml, ctype, json, fileinfo
- **Database Support**: pdo_mysql, pdo_sqlite, pdo_pgsql, mysqli, sqlite3
- **Laravel Features**: bcmath, gd, zip, intl, soap, xsl, ldap, exif
- **Performance**: opcache, apcu

### ⚙️ **Performance Settings**
- **Memory**: 1GB limit for Composer and migrations
- **Execution Time**: 300 seconds for Artisan commands
- **File Uploads**: 256MB support for large files
- **OPcache**: Optimized for Laravel with 512MB cache
- **Realpath Cache**: 8MB cache for faster file resolution

### 🔒 **Security Configurations**
- **Session Security**: HTTPOnly, SameSite, Strict Mode
- **PHP Exposure**: Hidden version information
- **Error Handling**: Development-friendly error reporting
- **File Access**: Secure file upload and include settings

### 🎯 **Laravel-Ready Features**
- **Timezone**: UTC default for consistent timestamps
- **Encoding**: UTF-8 for international support
- **Artisan Support**: CLI optimizations for Artisan commands
- **Composer Ready**: Memory and time limits for package management

## 🌍 Cross-Platform Support

### 🪟 **Windows Environments**
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

### 🐧 **Linux Environments**
| Environment | Multi-Version | Auto-Detection | Deep Scan | Priority |
|-------------|---------------|----------------|-----------|----------|
| **System PATH** | ✅ | ✅ | ✅ | 🥇 Highest |
| **Ubuntu/Debian APT** | ✅ | ✅ | ✅ | 🥈 High |
| **CentOS/RHEL YUM/DNF** | ✅ | ✅ | ✅ | 🥉 High |
| **Homebrew** | ✅ | ✅ | ✅ | 🏅 Medium |
| **Custom/Compiled** | ✅ | ✅ | ✅ | 🏅 Low |

### 🍎 **macOS Environments**
| Environment | Multi-Version | Auto-Detection | Deep Scan | Priority |
|-------------|---------------|----------------|-----------|----------|
| **System PATH** | ✅ | ✅ | ✅ | 🥇 Highest |
| **Homebrew** | ✅ | ✅ | ✅ | 🥈 High |
| **MAMP** | ✅ | ✅ | ✅ | 🥉 High |
| **Custom/Compiled** | ✅ | ✅ | ✅ | 🏅 Low |

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

> 🎉 **After installation, you can use the short alias `pia` instead of `php-ini-automation`!**

### Local Installation

```bash
npm install php-ini-automation
```

## 🎯 Quick Reference

### ⚡ **Essential Shortcuts**
| Command | Description | Example |
|---------|-------------|---------|
| `pia` | Configure PHP (auto-detect) | `pia` |
| `pia -l` | List all PHP installations | `pia -l` |
| `pia -v` | Show version information | `pia -v` |
| `pia -h` | Show help | `pia -h` |
| `pia 8.2` | Configure specific PHP version | `pia 8.2` |

### 🔥 **One-Liner Examples**
```bash
# Quick setup for Laravel development
pia

# Check what PHP versions are available
pia -l

# Configure PHP 8.2 specifically
pia 8.2

# Get help and see all options
pia -h

# Check tool version
pia -v
```

## Usage

### 🚀 Quick Start Commands

#### **⚡ Super Quick (Recommended)**
```bash
# Configure PHP (auto-detect)
pia

# List all PHP installations
pia -l

# Show version information
pia -v

# Show help
pia -h

# Configure specific PHP version
pia 8.2
```

#### **📋 All Available Commands**
```bash
# Main commands
php-ini-automation              # Auto-detect and configure PHP
pia                             # Short alias (same as above)

# Version-specific
php-ini-automation 8.2          # Configure PHP 8.2
pia 8.2                         # Short form

# Information commands
php-ini-automation --list       # List all detected installations
pia -l                          # Short form

php-ini-automation --version    # Show version information
pia -v                          # Short form

php-ini-automation --help       # Show help
pia -h                          # Short form

# Advanced options
php-ini-automation --non-interactive  # Run without prompts
pia --non-interactive           # Short form
```

### Command Line Interface

```bash
# Use default PHP version
php-ini-automation
pia                             # Short alias

# Specify PHP version
php-ini-automation 8.2
pia 8.2                         # Short form

# With environment variables
LARAGON_PATH="C:/laragon" php-ini-automation 8.1
LARAGON_PATH="C:/laragon" pia 8.1  # Short form
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
