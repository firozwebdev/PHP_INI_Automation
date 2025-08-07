# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-08-07

### 🚀 Major Features Added

- **Automatic PHP Detection**: Scans and detects PHP installations across multiple environments
- **Interactive CLI**: Professional command-line interface with colors and formatted output
- **Multi-Environment Support**: Enhanced support for Laragon, XAMPP, WAMP, PVM, and custom installations
- **Smart Extension Management**: Detects available extensions and provides detailed feedback
- **Automatic Backup**: Creates timestamped backups before making changes

### ✨ New Features

- **Interactive Selection**: Choose from multiple detected PHP installations
- **Non-Interactive Mode**: `--non-interactive` flag for automated scripts
- **List Command**: `--list` to view all detected PHP installations
- **Help System**: Comprehensive `--help` with usage examples
- **Version Detection**: Automatically detects PHP versions from executables
- **Extension Validation**: Checks if extension files exist before enabling
- **Enhanced Settings**: Optimized Laravel development settings
- **Progress Feedback**: Real-time feedback during configuration process

### 🔧 Improvements

- **Better Error Handling**: Detailed error messages with troubleshooting suggestions
- **Professional UI**: Formatted tables, colors, and progress indicators
- **Comprehensive Logging**: Detailed reporting of changes made
- **Type Safety**: Full TypeScript implementation with proper types
- **Performance**: Optimized scanning and configuration process

### 📦 Extensions

#### Essential Extensions (Laravel Required)
- curl, pdo_sqlite, sqlite3, openssl, pdo_mysql
- mbstring, tokenizer, json, fileinfo, ctype
- xml, bcmath, gd, zip

#### Optional Extensions (Auto-detected)
- redis, imagick, intl, soap, xsl
- exif, mysqli, pdo_pgsql, ldap

### ⚙️ Configuration Settings

#### Performance Optimizations
- `max_execution_time: 120`
- `memory_limit: 512M`
- `max_input_vars: 3000`
- `opcache.enable: 1`
- `realpath_cache_size: 4096K`

#### Development Settings
- `error_reporting: E_ALL`
- `display_errors: On`
- `log_errors: On`

#### Upload Settings
- `post_max_size: 100M`
- `upload_max_filesize: 100M`
- `max_file_uploads: 20`

### 🛠️ CLI Commands

```bash
# Auto-detect and configure PHP
php-ini-automation

# Configure specific PHP version
php-ini-automation 8.2

# List all detected installations
php-ini-automation --list

# Show help
php-ini-automation --help

# Non-interactive mode
php-ini-automation --non-interactive
```

### 🔍 Environment Detection

- **Laragon**: Multi-version support with automatic version detection
- **XAMPP**: Single version with extension directory detection
- **WAMP**: Multi-version support for WAMP64
- **PVM**: PHP Version Manager support
- **Custom**: Manual PHP installations

### 📋 Breaking Changes

- Minimum Node.js version: 16.0.0
- TypeScript source files (no more mixed JS/TS)
- New CLI interface (old simple execution replaced with interactive mode)
- Enhanced error messages (more detailed, different format)

### 🐛 Bug Fixes

- Fixed module resolution issues
- Improved path handling on Windows
- Better extension directory detection
- Resolved TypeScript compilation errors

---

## [1.0.0] - 2025-08-07

### Initial Release

- Basic PHP ini configuration
- Laravel extension enablement
- Simple CLI interface
- Support for environment variables
- Basic error handling
