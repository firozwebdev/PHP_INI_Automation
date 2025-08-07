# 🐧 PHP INI Automation - Linux/Ubuntu Guide

## 🎉 **Enhanced Linux Support in v4.0.1**

The latest version includes improved Linux detection that should resolve the php.ini and extension directory issues you encountered!

### 🔄 **Update to Latest Version**

```bash
# Update to the latest version with Linux improvements
npm install -g php-ini-automation@latest

# Verify the version
php-ini-automation --help
```

### 🔍 **Enhanced Linux Detection**

The tool now includes:
- **Direct PHP querying** for php.ini and extension paths
- **Ubuntu/Debian APT** package detection
- **Multiple php.ini locations** (cli, apache2, fpm)
- **System extension directories** detection

### 📁 **Common Linux PHP Paths**

#### **Ubuntu/Debian (APT)**
```bash
# PHP ini files
/etc/php/8.1/cli/php.ini          # CLI version
/etc/php/8.1/apache2/php.ini      # Apache version
/etc/php/8.1/fpm/php.ini          # FPM version

# Extension directories
/usr/lib/php/20210902              # Extensions
/usr/lib/php/modules               # Alternative location
```

#### **CentOS/RHEL**
```bash
# PHP ini files
/etc/php.ini                      # Main config
/etc/php.d/                       # Additional configs

# Extension directories
/usr/lib64/php/modules             # Extensions
```

### 🛠️ **Manual Setup (if needed)**

If the tool still can't find your php.ini, you can help it by:

#### **1. Find your php.ini location:**
```bash
php --ini
```

#### **2. Find your extension directory:**
```bash
php -r "echo ini_get('extension_dir');"
```

#### **3. Create missing php.ini (if needed):**
```bash
# Copy from template
sudo cp /etc/php/8.1/cli/php.ini-development /etc/php/8.1/cli/php.ini

# Or create basic one
sudo touch /etc/php/8.1/cli/php.ini
```

#### **4. Set environment variable (optional):**
```bash
export PHP_PATH="/etc/php/8.1"
php-ini-automation
```

### 🚀 **Try the Updated Tool**

```bash
# Update and test
npm install -g php-ini-automation@latest
php-ini-automation --list

# Should now properly detect php.ini and extensions
php-ini-automation
```

### 📋 **Expected Output (Fixed)**

```bash
✅ Found 1 PHP installation(s):

┌─────┬─────────────┬──────────────────┬─────────────────────────────────────────────────┬────────┐
│ No. │   Version   │   Environment    │                    Path                         │ Status │
├─────┼─────────────┼──────────────────┼─────────────────────────────────────────────────┼────────┤
│   1 │ 8.1.27      │ System PATH      │ /usr/bin                                      │ READY  │
│     │             │                  │ NTS                                           │        │
└─────┴─────────────┴──────────────────┴─────────────────────────────────────────────────┴────────┘

🎯 Selected: System PATH PHP 8.1.27
📁 INI Path: /etc/php/8.1/cli/php.ini
📂 Extensions: /usr/lib/php/20210902
🔧 Executable: /usr/bin/php

✅ Installation validation passed
🔧 Customizing php.ini configuration...
```

### 🐛 **Still Having Issues?**

If you're still experiencing problems:

1. **Check PHP installation:**
   ```bash
   which php
   php --version
   php --ini
   ```

2. **Install PHP development files:**
   ```bash
   sudo apt update
   sudo apt install php-dev php-cli
   ```

3. **Run with verbose output:**
   ```bash
   php-ini-automation --list
   ```

4. **Manual configuration:**
   ```bash
   # Find and edit php.ini manually
   sudo nano $(php --ini | grep "Loaded Configuration File" | cut -d: -f2 | xargs)
   ```

### 📞 **Support**

If you continue to have issues, please report them at:
- GitHub: https://github.com/yourusername/php-ini-automation/issues
- Include your OS version, PHP version, and error output

The v4.0.1 update should resolve the Linux detection issues you encountered! 🚀
