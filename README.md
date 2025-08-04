# 🚀 PHP INI Automation Pro

**The Ultimate Professional CLI Tool for PHP Configuration Management**

A robust, user-friendly command-line interface that automatically detects PHP installations and provides comprehensive INI file management with beautiful visual feedback and unbeatable functionality.

```
██████╗ ██╗  ██╗██████╗     ██║████╗  ██║██║    ██████╗ ██████╗  ██████╗
██╔══██╗██║  ██║██╔══██╗    ██║██╔██╗ ██║██║    ██╔══██╗██╔══██╗██╔═══██╗
██████╔╝███████║██████╔╝    ██║██║╚██╗██║██║    ██████╔╝██████╔╝██║   ██║
██╔═══╝ ██╔══██║██╔═══╝     ██║██║ ╚████║██║    ██╔═══╝ ██╔══██╗██║   ██║
██║     ██║  ██║██║         ██║██║  ╚═══╝██║    ██║     ██║  ██║╚██████╔╝
╚═╝     ╚═╝  ╚═╝╚═╝         ╚═╝╚═╝       ╚═╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝
```

## ✨ Features

🔍 **Smart Auto-Detection**: Automatically finds PHP installations from PVM, Laragon, XAMPP, WAMP, and custom paths
🎨 **Beautiful CLI Interface**: Stunning visual feedback with colors, tables, and progress indicators
🧩 **Extension Management**: Enable/disable 50+ PHP extensions with detailed descriptions
💾 **Backup & Restore**: Automatic backups with timestamped restore points
⚡ **Quick Setup**: One-command configuration with recommended settings
🎛️ **Custom Configuration**: Granular control over performance, security, and development settings
📊 **Configuration Viewer**: Beautiful display of current PHP settings and extensions
🔄 **Interactive Mode**: User-friendly prompts and selections
🛡️ **Safe Operations**: Always creates backups before making changes

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
bun install

# Make executable (optional)
chmod +x index.ts
```

### Basic Usage

```bash
# Interactive mode (recommended for first-time users)
bun start

# Quick setup with recommended settings
bun run quick

# List all PHP environments
bun run list

# Manage extensions
bun run extensions

# View current configuration
bun run view

# Backup management
bun run backup
```

## 🎯 Usage Examples

### 1. Interactive Mode (Recommended)

```bash
bun start
```

- Beautiful welcome screen with ASCII art
- Automatic PHP environment detection
- Interactive menu with clear options
- Step-by-step guidance

### 2. Quick Setup

```bash
# Quick setup for default PHP
bun run quick

# Quick setup for specific PHP version
bun run quick --version 8.2
```

**What it does:**

- ✅ Creates automatic backup
- ✅ Enables essential extensions (curl, mbstring, openssl, pdo, etc.)
- ✅ Optimizes performance settings
- ✅ Configures development-friendly settings

### 3. List PHP Environments

```bash
bun run list
```

**Output:**

```
┌───────────────┬────────────┬──────────┬────────────────────────────────────────┬──────────────────────────────┐
│ Environment   │ Version    │ Status   │ INI Path                               │ Extensions Dir               │
├───────────────┼────────────┼──────────┼────────────────────────────────────────┼──────────────────────────────┤
│ PVM 8.3.15    │ 8.3.15     │ ✅ active│ C:\Users\User\pvm\sym\php.ini          │ C:\Users\User\pvm\php\8.3... │
│ PVM 8.2.28    │ 8.2.28     │ ✅ active│ C:\Users\User\pvm\sym\php.ini          │ C:\Users\User\pvm\php\8.2... │
│ XAMPP         │ 8.1.10     │ ✅ active│ C:\xampp\php\php.ini                   │ C:\xampp\php\ext             │
└───────────────┴────────────┴──────────┴────────────────────────────────────────┴──────────────────────────────┘
```

### 4. Extension Management

```bash
bun run extensions
```

**Features:**

- 📋 Interactive checklist of 50+ extensions
- 📝 Detailed descriptions for each extension
- ✅ Pre-selected essential extensions
- 🔄 Enable/disable multiple extensions at once

### 5. Backup Management

```bash
# List all backups
bun run backup --list

# Create a backup
bun run backup --create

# Restore from backup
bun run backup --restore backup-file.ini
```

### 6. View Configuration

```bash
bun run view
```

**Shows:**

- 📄 File information (path, size, last modified)
- ⚙️ Key settings (memory limit, execution time, error reporting)
- 🧩 Enabled extensions count and list

## 🎛️ Advanced Usage

### Custom Configuration Areas

When using interactive mode, you can customize specific areas:

- **🧩 PHP Extensions**: Enable/disable extensions
- **⚡ Performance Settings**: Memory limits, execution time, OPcache
- **🐛 Development Settings**: Error reporting, debugging, Xdebug
- **🔒 Security Settings**: Disable dangerous functions, secure sessions
- **📝 Error Reporting**: Logging configuration
- **💾 Memory & Limits**: Resource allocation settings

### Command Line Options

```bash
# Target specific PHP version
bun start --version 8.2

# Quick commands with version
bun run quick --version 8.1
bun run view --version 8.3
bun run backup --version 8.2 --create
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file to configure PHP installation paths:

```env
# PHP Installation Paths
PVM_PATH="C:/Users/Username/pvm/"
LARAGON_PATH="C:/laragon/bin/"
XAMPP_PATH="C:/xampp/php/"
WAMP_PATH="C:/wamp64/bin/"
DEFAULT_PATH="C:/php/"
```

### Supported PHP Environments

- **PVM**: PHP Version Manager installations
- **Laragon**: Laragon development environment
- **XAMPP**: XAMPP web server stack
- **WAMP**: WampServer installations
- **Custom**: Any custom PHP installation

## 📋 Available Commands

| Command                  | Description            | Example                       |
| ------------------------ | ---------------------- | ----------------------------- |
| `bun start`              | Interactive mode       | `bun start`                   |
| `bun run quick`          | Quick setup            | `bun run quick --version 8.2` |
| `bun run list`           | List PHP environments  | `bun run list`                |
| `bun run extensions`     | Manage extensions      | `bun run extensions`          |
| `bun run backup`         | Backup management      | `bun run backup --list`       |
| `bun run view`           | View configuration     | `bun run view --version 8.1`  |
| `bun run fix`            | Fix PHP config issues  | `bun run fix`                 |
| `bun run fix-extensions` | Fix missing extensions | `bun run fix-extensions`      |
| `bun run doctor`         | Complete health check  | `bun run doctor`              |

## 🩺 PHP Doctor - Automatic Issue Detection & Fixing

**NEW!** Advanced troubleshooting tools that automatically detect and fix common PHP configuration issues:

### Quick Fix Commands

```bash
# Fix general PHP configuration issues
bun run fix

# Fix missing extension issues
bun run fix-extensions

# Complete health check and fix everything
bun run doctor
```

### What Gets Fixed Automatically

- ✅ **Duplicate Extensions**: Removes duplicate extension declarations
- ✅ **OPcache Configuration**: Fixes `extension=opcache` to `zend_extension=opcache`
- ✅ **Built-in Extensions**: Comments out built-in extensions that don't need DLLs
- ✅ **Missing Extensions**: Comments out extensions with missing DLL files
- ✅ **Extension Directory**: Ensures proper extension_dir configuration
- ✅ **Core Extensions**: Adds missing core extensions when needed

### Example: Before & After

**Before running `bun run doctor`:**

```
PHP Warning: Module "zip" is already loaded in Unknown on line 0
PHP Warning: PHP Startup: Unable to load dynamic library 'json'...
PHP Warning: PHP Startup: Invalid library (appears to be a Zend Extension, try loading using zend_extension=opcache from php.ini)
```

**After running `bun run doctor`:**

```
PHP 8.2.28 (cli) (built: Mar 11 2025 18:37:30) (ZTS Visual C++ 2019 x64)
Copyright (c) The PHP Group
Zend Engine v4.2.28, Copyright (c) Zend Technologies
    with Zend OPcache v8.2.28, Copyright (c), by Zend Technologies
```

## 🛡️ Safety Features

- **🔒 Automatic Backups**: Every change creates a timestamped backup
- **✅ Validation**: INI syntax validation before applying changes
- **🔄 Easy Restore**: One-command restore from any backup
- **📝 Change Tracking**: Clear indication of what will be modified
- **⚠️ Confirmation Prompts**: Confirms destructive operations

## 🎨 Visual Features

- **🌈 Colorful Output**: Syntax highlighting and color-coded status
- **📊 Beautiful Tables**: Clean, organized data presentation
- **⏳ Progress Indicators**: Animated spinners for long operations
- **🎯 Interactive Menus**: Easy navigation with arrow keys
- **📦 Boxed Information**: Important information in styled boxes
- **✨ ASCII Art**: Professional branding and visual appeal

## 🏆 Why Choose PHP INI Automation Pro?

✅ **Saves Time**: What takes hours manually, takes minutes with our tool
✅ **Reduces Errors**: Automated validation prevents configuration mistakes
✅ **Increases Confidence**: Visual feedback and backups give peace of mind
✅ **Improves Productivity**: Focus on coding, not configuration management
✅ **Enhances Learning**: Understand PHP configuration through guided setup

---

**Ready to revolutionize your PHP configuration management?**

```bash
bun start
```

_Experience the difference of a truly professional PHP INI management tool._
