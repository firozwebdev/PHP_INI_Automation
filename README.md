# 🚀 PHP INI Automation Pro v3.0

**The Most Intelligent & User-Friendly PHP Configuration Tool Ever Created**

🧠 **Smart Framework Detection** • 🎯 **One-Click Presets** • 🛡️ **100% Safe** • ⚡ **Lightning Fast**

A revolutionary CLI tool that automatically detects your framework (Laravel, WordPress, Symfony, etc.) and applies optimized PHP configurations with zero technical knowledge required.

```
██████╗ ██╗  ██╗██████╗     ██║████╗  ██║██║    ██████╗ ██████╗  ██████╗
██╔══██╗██║  ██║██╔══██╗    ██║██╔██╗ ██║██║    ██╔══██╗██╔══██╗██╔═══██╗
██████╔╝███████║██████╔╝    ██║██║╚██╗██║██║    ██████╔╝██████╔╝██║   ██║
██╔═══╝ ██╔══██║██╔═══╝     ██║██║ ╚████║██║    ██╔═══╝ ██╔══██╗██║   ██║
██║     ██║  ██║██║         ██║██║  ╚═══╝██║    ██║     ██║  ██║╚██████╔╝
╚═╝     ╚═╝  ╚═╝╚═╝         ╚═╝╚═╝       ╚═╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝
```

## 🧠 Revolutionary Smart Features

### 🎯 **Intelligent Framework Detection & One-Click Configuration**

- **Auto-Detects**: Laravel, WordPress, Symfony, CodeIgniter, Drupal, Magento
- **Smart Presets**: Framework-specific optimized configurations
- **Zero Knowledge Required**: Just select your framework and go!
- **Production Ready**: Separate presets for development and production

### 🚀 **What Makes It Unbeatable**

🧠 **Intelligent**: Automatically detects your framework and suggests optimal settings
🎯 **One-Click Setup**: Laravel? WordPress? Just click and it's perfectly configured
🛡️ **100% Safe**: Every change creates automatic backups - never lose your config
⚡ **Lightning Fast**: Powered by Bun runtime for instant configuration
🎨 **Beautiful Interface**: Rainbow gradients, icons, and professional layouts
📚 **Educational**: Learn what each setting does with detailed explanations
🔄 **Reversible**: Undo any change with one command
🎛️ **Multi-Environment**: Handle multiple PHP versions effortlessly

### 🎯 **Framework-Specific Presets**

- **🔥 Laravel**: Eloquent, Artisan, Redis, Queue optimization
- **📝 WordPress**: Media handling, plugin compatibility, security
- **🎼 Symfony**: Enterprise-grade, Doctrine, APCu caching
- **🚀 CodeIgniter**: Lightweight, fast, minimal configuration
- **💧 Drupal**: Robust CMS, high performance, clean URLs
- **🛒 Magento**: E-commerce optimized, high memory, Redis
- **🛠️ Development**: Xdebug, error reporting, unlimited execution
- **🏭 Production**: Secure, optimized, error logging only

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
# 🧠 SMART MODE (NEW - Recommended!)
bun start                    # Auto-detects your framework and configures perfectly

# 🎯 FRAMEWORK SHORTCUTS
bun run preset               # Choose from framework presets
bun run laravel             # Quick Laravel setup
bun run wordpress           # Quick WordPress setup

# 🛠️ ADVANCED MODES
bun run interactive         # Advanced interactive configuration
bun run quick               # Quick setup with recommended settings
bun run list                # List all PHP environments
bun run view                # View current configuration

# 🩺 TROUBLESHOOTING
bun run doctor              # Fix all PHP configuration issues automatically
```

## 🎯 Usage Examples

### 1. 🧠 Smart Mode (NEW - Most Intelligent!)

```bash
bun start
```

**What happens:**

1. 🎨 **Beautiful Rainbow Banner**: Professional gradient welcome screen
2. 🔍 **Auto-Detection**: Scans your project directory for framework files
3. 🎯 **Smart Suggestions**: Shows detected frameworks at the top with special badges
4. 📋 **Detailed Preview**: See exactly what will be configured before applying
5. ⚡ **One-Click Apply**: Select framework → Choose PHP version → Done!

**Example Output:**

```
🎯 AUTO-DETECTED IN CURRENT DIRECTORY
🔥 Laravel (DETECTED) - Optimized for Laravel applications with Eloquent, Artisan...

🔥 POPULAR FRAMEWORKS
🎼 Symfony - Enterprise-grade configuration for Symfony applications
🚀 CodeIgniter - Lightweight configuration for CodeIgniter framework

📝 CONTENT MANAGEMENT
📝 WordPress - Optimized for WordPress sites with media handling...
💧 Drupal - Robust configuration for Drupal CMS with high performance
```

### 2. Framework-Specific Quick Setup

```bash
# Laravel developers
bun run laravel              # Instantly configure for Laravel

# WordPress developers
bun run wordpress            # Perfect WordPress configuration

# Any framework
bun run preset               # Choose from all available presets
```

### 3. Traditional Interactive Mode

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

### 🧠 Smart & Framework Commands

| Command             | Description                                  | Example             |
| ------------------- | -------------------------------------------- | ------------------- |
| `bun start`         | 🧠 Smart framework detection & configuration | `bun start`         |
| `bun run preset`    | 🎯 Framework preset selection                | `bun run preset`    |
| `bun run laravel`   | 🔥 Quick Laravel configuration               | `bun run laravel`   |
| `bun run wordpress` | 📝 Quick WordPress configuration             | `bun run wordpress` |
| `bun run symfony`   | 🎼 Quick Symfony configuration               | `bun run symfony`   |

### 🛠️ Advanced Commands

| Command               | Description                         | Example                       |
| --------------------- | ----------------------------------- | ----------------------------- |
| `bun run interactive` | 🎛️ Advanced interactive mode        | `bun run interactive`         |
| `bun run quick`       | ⚡ Quick setup with recommendations | `bun run quick --version 8.2` |
| `bun run list`        | 📋 List PHP environments            | `bun run list`                |
| `bun run extensions`  | 🧩 Manage extensions                | `bun run extensions`          |
| `bun run backup`      | 💾 Backup management                | `bun run backup --list`       |
| `bun run view`        | 📊 View configuration               | `bun run view --version 8.1`  |

### 🩺 Troubleshooting Commands

| Command                  | Description                    | Example                  |
| ------------------------ | ------------------------------ | ------------------------ |
| `bun run fix`            | 🔧 Fix PHP config issues       | `bun run fix`            |
| `bun run fix-extensions` | 🧩 Fix missing extensions      | `bun run fix-extensions` |
| `bun run doctor`         | 🩺 Complete health check & fix | `bun run doctor`         |

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
