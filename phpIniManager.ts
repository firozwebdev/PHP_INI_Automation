import fs from 'fs-extra';
import path from 'path';

// ANSI color codes for consistent styling
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

/**
 * Validates that the source php.ini file exists and is readable (with sudo support).
 *
 * @param filePath - Path to the php.ini file.
 * @param useSudo - Whether to use sudo for file operations.
 * @throws If the file does not exist or is not readable.
 */
export function validateSourceFile(filePath: string, useSudo: boolean = false): void {
    if (!fs.existsSync(filePath)) {
        throw new Error(`php.ini file not found at: ${filePath}`);
    }

    try {
        // Try normal read access first
        fs.accessSync(filePath, fs.constants.R_OK);
    } catch {
        if (useSudo && process.platform !== 'win32') {
            // On Unix with sudo, we can still proceed
            console.log(`${colors.yellow}ℹ️  File requires elevated permissions - will use sudo for operations${colors.reset}`);
            return;
        }
        throw new Error(`php.ini file is not readable: ${filePath}`);
    }

    console.log(`${colors.green}✅ php.ini file validated: ${filePath}${colors.reset}`);
}

/**
 * Checks if an extension file exists in the extensions directory (cross-platform)
 */
function extensionExists(extensionDir: string, extension: string): boolean {
    if (!extensionDir) return false;

    const isWindows = process.platform === 'win32';
    const possibleExtensions = isWindows ? [
        `php_${extension}.dll`,
        `${extension}.dll`
    ] : [
        `${extension}.so`,
        `php_${extension}.so`,
        `${extension}.dylib`, // macOS
        `lib${extension}.so`
    ];

    // Check in the specified extension directory
    const existsInDir = possibleExtensions.some(ext =>
        fs.existsSync(path.join(extensionDir, ext))
    );

    if (existsInDir) return true;

    // On Linux, also check if it's a built-in module or available via package manager
    if (!isWindows) {
        return isBuiltInOrAvailableExtension(extension);
    }

    return false;
}

/**
 * Checks if an extension is built-in or available via package manager on Linux
 */
function isBuiltInOrAvailableExtension(extension: string): boolean {
    const builtInExtensions = [
        'ctype', 'fileinfo', 'tokenizer', 'json', 'pcre', 'spl', 'standard',
        'date', 'hash', 'filter', 'reflection', 'session', 'xml', 'exif',
        'openssl', 'ftp' // These are often built-in
    ];

    // Check if it's a built-in extension (don't enable these)
    if (builtInExtensions.includes(extension)) {
        return false; // Return false so we don't try to enable built-ins
    }

    // Check if extension package is installed via apt
    try {
        const { execSync } = require('child_process');
        const packageName = `php-${extension}`;

        // Check if package is installed
        execSync(`dpkg -l | grep -q "^ii.*${packageName}"`, {
            stdio: 'ignore',
            timeout: 3000
        });
        return true;
    } catch {
        // Package not installed or command failed
        return false;
    }
}

/**
 * Checks if a PHP extension package is installed on Linux
 */
function isExtensionPackageInstalled(extension: string): boolean {
    try {
        const { execSync } = require('child_process');

        // Check if the extension package is installed
        execSync(`dpkg -l | grep -q "^ii.*php-${extension}"`, {
            stdio: 'ignore',
            timeout: 3000
        });
        return true;
    } catch {
        // Package not installed
        return false;
    }
}

/**
 * Gets list of already loaded PHP modules to prevent duplicates
 */
function getLoadedModules(phpExecutable: string): string[] {
    try {
        const { execSync } = require('child_process');
        const isWindows = process.platform === 'win32';
        const nullDevice = isWindows ? '2>nul' : '2>/dev/null';

        const result = execSync(`"${phpExecutable}" -m ${nullDevice}`, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: ['pipe', 'pipe', 'ignore']
        });

        return result.split('\n')
            .map((line: string) => line.trim().toLowerCase())
            .filter((line: string) => line && !line.startsWith('['));
    } catch {
        return [];
    }
}

/**
 * Special extensions that require zend_extension instead of extension
 */
const ZEND_EXTENSIONS = ['opcache', 'xdebug'];

/**
 * Removes problematic extension lines from php.ini content
 */
function removeProblematicExtensions(content: string, phpExecutable: string): string {
    if (!phpExecutable) return content;

    try {
        const { execSync } = require('child_process');

        // Get PHP startup errors to identify problematic extensions
        const result = execSync(`${phpExecutable} -v 2>&1`, {
            encoding: 'utf8',
            timeout: 5000
        });

        // Find extensions that can't be loaded
        const problematicExtensions: string[] = [];
        const duplicateExtensions: string[] = [];
        const lines = result.split('\n');

        for (const line of lines) {
            if (line.includes('Unable to load dynamic library')) {
                const match = line.match(/'([^']+)'/);
                if (match) {
                    problematicExtensions.push(match[1]);
                }
            } else if (line.includes('Module') && line.includes('is already loaded')) {
                const match = line.match(/Module "([^"]+)" is already loaded/);
                if (match) {
                    duplicateExtensions.push(match[1]);
                }
            }
        }

        console.log(`${colors.yellow}🔧 Found ${problematicExtensions.length} problematic extensions: ${problematicExtensions.join(', ')}${colors.reset}`);
        console.log(`${colors.yellow}🔧 Found ${duplicateExtensions.length} duplicate extensions: ${duplicateExtensions.join(', ')}${colors.reset}`);

        // Remove problematic extension lines
        const allProblematic = [...problematicExtensions, ...duplicateExtensions];
        for (const ext of allProblematic) {
            const patterns = [
                new RegExp(`^\\s*extension\\s*=\\s*${ext}\\s*$`, 'gm'),
                new RegExp(`^\\s*zend_extension\\s*=\\s*${ext}\\s*$`, 'gm')
            ];

            for (const pattern of patterns) {
                content = content.replace(pattern, `;extension=${ext} ; Disabled by PHP INI Automation - ${problematicExtensions.includes(ext) ? 'package not installed' : 'built-in module'}`);
            }
        }

        if (allProblematic.length > 0) {
            console.log(`${colors.green}✅ Disabled ${allProblematic.length} problematic extensions${colors.reset}`);
        }

        return content;
    } catch (error) {
        console.log(`${colors.yellow}⚠️  Could not detect problematic extensions: ${error}${colors.reset}`);
        return content;
    }
}

/**
 * Enables PHP extensions in the php.ini file content with better detection.
 *
 * @param content - The php.ini file content.
 * @param extensions - List of PHP extensions to enable.
 * @param extensionDir - Directory containing extension files.
 * @param phpExecutable - Path to PHP executable for checking loaded modules.
 * @returns Object with updated content and statistics.
 */
function enableExtensions(content: string, extensions: string[], extensionDir: string, phpExecutable: string = ''): {
    content: string;
    enabled: string[];
    missing: string[];
    alreadyEnabled: string[];
    alreadyLoaded: string[];
} {
    const enabled: string[] = [];
    const missing: string[] = [];
    const alreadyEnabled: string[] = [];
    const alreadyLoaded: string[] = [];

    // Get list of already loaded modules to prevent duplicates
    const loadedModules = phpExecutable ? getLoadedModules(phpExecutable) : [];

    extensions.forEach(extension => {
        // Skip if module is already loaded to prevent duplicates
        if (loadedModules.includes(extension.toLowerCase())) {
            alreadyLoaded.push(extension);
            return;
        }
        // Check if extension is already enabled (check both extension= and zend_extension=)
        const enabledPattern = new RegExp(`^extension\\s*=\\s*${extension}`, 'm');
        const zendEnabledPattern = new RegExp(`^zend_extension\\s*=\\s*${extension}`, 'm');
        if (enabledPattern.test(content) || zendEnabledPattern.test(content)) {
            alreadyEnabled.push(extension);
            return;
        }

        // Try to enable commented extension (check both extension= and zend_extension=)
        const isZendExtension = ['opcache', 'xdebug'].includes(extension);
        const commentedPattern = new RegExp(`;\\s*extension\\s*=\\s*${extension}`, 'g');
        const commentedZendPattern = new RegExp(`;\\s*zend_extension\\s*=\\s*${extension}`, 'g');

        if (commentedPattern.test(content)) {
            const replacement = isZendExtension ? `zend_extension=${extension}` : `extension=${extension}`;
            content = content.replace(commentedPattern, replacement);
            enabled.push(extension);
            return;
        }

        if (commentedZendPattern.test(content)) {
            content = content.replace(commentedZendPattern, `zend_extension=${extension}`);
            enabled.push(extension);
            return;
        }

        // For Linux, check if extension package is actually installed
        // For Windows, check if extension file exists
        let canEnable = false;

        if (process.platform !== 'win32') {
            // On Linux, only enable if package is installed
            canEnable = isExtensionPackageInstalled(extension);
            if (!canEnable) {
                console.log(`${colors.yellow}⚠️  Skipping ${extension}: package php-${extension} not installed${colors.reset}`);
            }
        } else {
            // On Windows, check if extension file exists
            canEnable = extensionExists(extensionDir, extension);
        }

        if (canEnable) {
            // Add extension at the end of the extensions section
            const extensionSection = content.indexOf('[PHP]') !== -1 ? '[PHP]' :
                                   content.indexOf('; Dynamic Extensions') !== -1 ? '; Dynamic Extensions' :
                                   content.indexOf('extension=') !== -1 ? 'extension=' : null;

            if (extensionSection) {
                const sectionIndex = content.indexOf(extensionSection);
                const nextSectionIndex = content.indexOf('\n[', sectionIndex + 1);
                const insertIndex = nextSectionIndex !== -1 ? nextSectionIndex : content.length;

                const beforeInsert = content.substring(0, insertIndex);
                const afterInsert = content.substring(insertIndex);

                // Use zend_extension for special extensions
                const isZendExtension = ['opcache', 'xdebug'].includes(extension);
                const extensionLine = isZendExtension ? `zend_extension=${extension}` : `extension=${extension}`;

                content = beforeInsert + `\n${extensionLine}` + afterInsert;
                enabled.push(extension);
            } else {
                // Add to end of file
                const isZendExtension = ['opcache', 'xdebug'].includes(extension);
                const extensionLine = isZendExtension ? `zend_extension=${extension}` : `extension=${extension}`;

                content += `\n${extensionLine}`;
                enabled.push(extension);
            }
        } else {
            missing.push(extension);
        }
    });

    return { content, enabled, missing, alreadyEnabled, alreadyLoaded };
}

/**
 * Adds or updates custom settings in the php.ini file content with better organization.
 *
 * @param content - The php.ini file content.
 * @param settings - Key-value pairs of php.ini settings.
 * @returns Object with updated content and statistics.
 */
function addCustomSettings(content: string, settings: Record<string, string | number>): {
    content: string;
    updated: string[];
    added: string[];
} {
    const updated: string[] = [];
    const added: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
        // Escape special regex characters in key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`^;?\\s*${escapedKey}\\s*=.*`, 'm');
        const settingLine = `${key} = ${value}`;

        if (pattern.test(content)) {
            // Update existing setting
            content = content.replace(pattern, settingLine);
            updated.push(key);
        } else {
            // Add new setting to appropriate section
            const phpSection = content.indexOf('[PHP]');
            if (phpSection !== -1) {
                // Find end of [PHP] section
                const nextSection = content.indexOf('\n[', phpSection + 1);
                const insertIndex = nextSection !== -1 ? nextSection : content.length;

                const beforeInsert = content.substring(0, insertIndex);
                const afterInsert = content.substring(insertIndex);

                content = beforeInsert + `\n${settingLine}` + afterInsert;
            } else {
                // Add to end of file
                content += `\n${settingLine}`;
            }
            added.push(key);
        }
    }

    return { content, updated, added };
}

/**
 * Creates a backup of the original php.ini file with sudo support
 */
async function createBackup(filePath: string, useSudo: boolean = false): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;

    try {
        if (useSudo && process.platform !== 'win32') {
            // Use sudo for backup on Unix systems
            const { execSync } = require('child_process');
            execSync(`sudo cp "${filePath}" "${backupPath}"`, {
                stdio: ['pipe', 'pipe', 'ignore'] // Suppress output
            });
            console.log(`${colors.cyan}📋 Backup created with sudo: ${backupPath}${colors.reset}`);
        } else {
            await fs.copy(filePath, backupPath);
            console.log(`${colors.cyan}📋 Backup created: ${backupPath}${colors.reset}`);
        }
        return backupPath;
    } catch (error: any) {
        if (useSudo && process.platform !== 'win32') {
            // Try with sudo if regular backup failed
            try {
                const { execSync } = require('child_process');
                execSync(`sudo cp "${filePath}" "${backupPath}"`, {
                    stdio: ['pipe', 'pipe', 'ignore']
                });
                console.log(`${colors.cyan}📋 Backup created with sudo: ${backupPath}${colors.reset}`);
                return backupPath;
            } catch {
                console.log(`${colors.yellow}⚠️  Could not create backup (continuing without backup)${colors.reset}`);
                return '';
            }
        } else {
            console.log(`${colors.yellow}⚠️  Could not create backup: ${error.message}${colors.reset}`);
            return '';
        }
    }
}

/**
 * Reads file with sudo support on Unix systems
 */
async function readFileWithSudo(filePath: string, useSudo: boolean = false): Promise<string> {
    if (useSudo && process.platform !== 'win32') {
        // Use sudo to read file on Unix systems
        const { execSync } = require('child_process');
        try {
            const result = execSync(`sudo cat "${filePath}"`, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            });
            return result;
        } catch (error) {
            // Fallback to normal read
            return await fs.readFile(filePath, 'utf8');
        }
    } else {
        // Regular file read
        return await fs.readFile(filePath, 'utf8');
    }
}

/**
 * Writes file with sudo support on Unix systems
 */
async function writeFileWithSudo(filePath: string, content: string, useSudo: boolean = false): Promise<void> {
    if (useSudo && process.platform !== 'win32') {
        // Use sudo to write file on Unix systems
        const { execSync } = require('child_process');
        const tempFile = `/tmp/php-ini-automation-${Date.now()}.tmp`;

        // Write to temp file first
        await fs.writeFile(tempFile, content, 'utf8');

        // Move with sudo
        execSync(`sudo mv "${tempFile}" "${filePath}"`, { stdio: 'inherit' });
        console.log(`${colors.green}✅ php.ini updated with sudo${colors.reset}`);
    } else {
        // Regular file write
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`${colors.green}✅ php.ini updated${colors.reset}`);
    }
}

/**
 * Enhanced PHP ini customization with detailed feedback and automatic sudo handling.
 *
 * @param filePath - Path to the php.ini file to be customized.
 * @param extensionsDir - Directory containing PHP extensions.
 * @param customSettings - Key-value pairs of additional php.ini settings to add/update.
 * @param useSudo - Whether to use sudo for file operations (auto-detected on Unix).
 * @param phpExecutable - Path to PHP executable for checking loaded modules.
 */
export async function customizePhpIni(
    filePath: string,
    extensionsDir: string,
    customSettings: Record<string, string | number> = {},
    useSudo: boolean = false,
    phpExecutable: string = ''
): Promise<void> {
    console.log(`${colors.bright}🔧 Customizing php.ini for Laravel development...${colors.reset}`);

    // Essential Laravel extensions (Laravel 10+ requirements)
    const ESSENTIAL_EXTENSIONS: string[] = [
        // Core Laravel requirements
        'curl',           // HTTP client, API calls
        'mbstring',       // String manipulation
        'openssl',        // Encryption, HTTPS
        'tokenizer',      // PHP tokenization
        'xml',            // XML processing
        'ctype',          // Character type checking
        'json',           // JSON handling
        'fileinfo',       // File type detection

        // Database support
        'pdo_mysql',      // MySQL PDO driver
        'pdo_sqlite',     // SQLite PDO driver
        'pdo_pgsql',      // PostgreSQL PDO driver
        'mysqli',         // MySQL improved extension
        'sqlite3',        // SQLite3 support

        // Laravel features
        'bcmath',         // Arbitrary precision mathematics
        'gd',             // Image manipulation
        'zip',            // Archive handling
        'intl',           // Internationalization
        'soap',           // SOAP protocol support
        'xsl',            // XSL transformations
        'ldap',           // LDAP directory access
        'exif',           // Image metadata

        // Performance & caching
        'opcache',        // PHP opcode caching
        'apcu'            // User cache
    ];

    // Advanced Laravel extensions (optional but recommended)
    const OPTIONAL_EXTENSIONS: string[] = [
        // Caching & performance
        'redis',          // Redis cache driver
        'memcached',      // Memcached support

        // Image processing
        'imagick',        // Advanced image manipulation
        'gmagick',        // GraphicsMagick support

        // Development & debugging
        'xdebug',         // Debugging and profiling
        'pcov',           // Code coverage

        // Additional features
        'imap',           // Email processing
        'ftp',            // FTP support
        'ssh2',           // SSH2 protocol
        'mongodb',        // MongoDB driver
        'amqp',           // RabbitMQ support
        'swoole',         // High-performance async framework
        'yaml'            // YAML parsing
    ];

    // Laravel-optimized settings for maximum performance and compatibility
    const DEFAULT_SETTINGS: Record<string, string | number> = {
        // === PERFORMANCE SETTINGS ===
        max_execution_time: 300,           // Extended for Artisan commands
        memory_limit: '1G',                // Generous for Composer, migrations
        max_input_vars: 5000,              // Large forms, complex data
        max_input_time: 300,               // File uploads, data processing

        // === FILE UPLOAD SETTINGS ===
        post_max_size: '256M',             // Large file uploads
        upload_max_filesize: '256M',       // Individual file size
        max_file_uploads: 100,             // Multiple file uploads
        file_uploads: 'On',                // Enable file uploads

        // === OUTPUT & COMPRESSION ===
        output_buffering: 8192,            // Optimized buffer size
        zlib_output_compression: 'On',     // Compress output
        zlib_output_compression_level: 6,  // Balanced compression

        // === ERROR HANDLING (Development) ===
        error_reporting: 'E_ALL & ~E_DEPRECATED & ~E_STRICT',
        display_errors: 'On',              // Show errors in development
        display_startup_errors: 'On',      // Show startup errors
        log_errors: 'On',                  // Log errors
        log_errors_max_len: 8192,          // Error log length
        ignore_repeated_errors: 'On',      // Avoid spam

        // === SESSION SETTINGS ===
        'session.gc_maxlifetime': 14400,   // 4 hours session lifetime
        'session.cookie_lifetime': 0,      // Session cookies
        'session.cookie_httponly': 'On',   // Security
        'session.use_strict_mode': 'On',   // Security
        'session.cookie_samesite': 'Lax',  // CSRF protection

        // === OPCACHE OPTIMIZATION ===
        'opcache.enable': 1,                    // Enable OPcache
        'opcache.enable_cli': 1,                // Enable for CLI (Artisan)
        'opcache.memory_consumption': 512,      // 512MB for OPcache
        'opcache.interned_strings_buffer': 64,  // String optimization
        'opcache.max_accelerated_files': 32531, // Max cached files
        'opcache.revalidate_freq': 0,           // Always check in dev
        'opcache.validate_timestamps': 1,       // Check file changes
        'opcache.save_comments': 1,             // Keep docblocks
        'opcache.fast_shutdown': 1,             // Faster shutdown

        // === REALPATH CACHE ===
        realpath_cache_size: '8M',         // Path resolution cache
        realpath_cache_ttl: 7200,          // 2 hours TTL

        // === SECURITY SETTINGS ===
        expose_php: 'Off',                 // Hide PHP version
        allow_url_fopen: 'On',             // Laravel needs this
        allow_url_include: 'Off',          // Security

        // === DATE/TIME ===
        'date.timezone': 'UTC',            // Default timezone

        // === MBSTRING SETTINGS ===
        'mbstring.language': 'English',
        'mbstring.internal_encoding': 'UTF-8',
        'mbstring.http_output': 'UTF-8'
    };

    // Merge default and custom settings
    const mergedSettings = { ...DEFAULT_SETTINGS, ...customSettings };

    try {
        // Create backup with sudo support (try sudo first on Linux)
        if (useSudo && process.platform !== 'win32') {
            await createBackup(filePath, true);
        } else {
            await createBackup(filePath, useSudo);
        }

        let content = await readFileWithSudo(filePath, useSudo);
        console.log(`${colors.green}✅ php.ini file loaded (${content.length} bytes)${colors.reset}`);

        // Clean up problematic extensions first
        console.log(`${colors.cyan}🧹 Cleaning up problematic extensions...${colors.reset}`);
        const originalContent = content;
        content = removeProblematicExtensions(content, phpExecutable);

        // Remove duplicate built-in extensions
        const builtInExtensions = ['ctype', 'fileinfo', 'tokenizer', 'exif'];
        for (const ext of builtInExtensions) {
            const patterns = [
                new RegExp(`^\\s*extension\\s*=\\s*${ext}\\s*$`, 'gm'),
                new RegExp(`^\\s*zend_extension\\s*=\\s*${ext}\\s*$`, 'gm')
            ];

            for (const pattern of patterns) {
                content = content.replace(pattern, `;extension=${ext} ; Disabled - built-in module`);
            }
        }

        // Fix OPcache and XDebug to use zend_extension instead of extension
        const zendExtensions = ['opcache', 'xdebug'];
        for (const ext of zendExtensions) {
            const wrongPattern = new RegExp(`^\\s*extension\\s*=\\s*${ext}\\s*$`, 'gm');
            if (wrongPattern.test(content)) {
                content = content.replace(wrongPattern, `zend_extension=${ext}`);
                console.log(`${colors.green}🔧 Fixed ${ext}: converted extension= to zend_extension=${colors.reset}`);
            }
        }

        // If content changed, save it immediately to fix the issues
        if (content !== originalContent) {
            console.log(`${colors.yellow}💾 Saving cleanup changes with sudo...${colors.reset}`);
            await writeFileWithSudo(filePath, content, true);
            console.log(`${colors.green}✅ Cleanup changes saved successfully${colors.reset}`);
        }

        // Update extension_dir if provided
        if (extensionsDir && fs.existsSync(extensionsDir)) {
            const normalizedPath = extensionsDir.replace(/\\/g, '/');
            const extensionDirPattern = /;?\s*extension_dir\s*=\s*".*?"/;

            if (extensionDirPattern.test(content)) {
                content = content.replace(extensionDirPattern, `extension_dir = "${normalizedPath}"`);
                console.log(`${colors.green}✅ Extension directory updated: ${normalizedPath}${colors.reset}`);
            } else {
                content = `extension_dir = "${normalizedPath}"\n` + content;
                console.log(`${colors.green}✅ Extension directory added: ${normalizedPath}${colors.reset}`);
            }
        }

        // Enable essential extensions
        console.log(`${colors.bright}📦 Processing extensions...${colors.reset}`);
        const extensionResult = enableExtensions(content, ESSENTIAL_EXTENSIONS, extensionsDir, phpExecutable);
        content = extensionResult.content;

        // Try optional extensions
        const optionalResult = enableExtensions(content, OPTIONAL_EXTENSIONS, extensionsDir, phpExecutable);
        content = optionalResult.content;

        // Report extension results with better categorization
        const totalEnabled = extensionResult.enabled.concat(optionalResult.enabled);
        const totalMissing = extensionResult.missing.concat(optionalResult.missing);
        const totalAlreadyEnabled = extensionResult.alreadyEnabled.concat(optionalResult.alreadyEnabled);
        const totalAlreadyLoaded = extensionResult.alreadyLoaded.concat(optionalResult.alreadyLoaded);

        // Separate essential vs optional missing extensions
        const essentialMissing = extensionResult.missing;
        const optionalMissing = optionalResult.missing;

        if (totalEnabled.length > 0) {
            console.log(`${colors.green}✅ Enabled extensions: ${totalEnabled.join(', ')}${colors.reset}`);
        }

        if (totalAlreadyEnabled.length > 0) {
            console.log(`${colors.cyan}ℹ️  Already enabled: ${totalAlreadyEnabled.join(', ')}${colors.reset}`);
        }

        if (totalAlreadyLoaded.length > 0) {
            console.log(`${colors.blue}🔄 Already loaded (skipped duplicates): ${totalAlreadyLoaded.join(', ')}${colors.reset}`);
        }

        if (essentialMissing.length > 0) {
            console.log(`${colors.yellow}⚠️  Missing Laravel extensions: ${essentialMissing.join(', ')}${colors.reset}`);
            console.log(`${colors.yellow}   💡 Install with: sudo apt install ${essentialMissing.map(ext => `php-${ext}`).join(' ')}${colors.reset}`);
            console.log(`${colors.yellow}   🔄 Run 'pia' again after installation to verify${colors.reset}`);
        }

        if (optionalMissing.length > 0) {
            console.log(`${colors.cyan}ℹ️  Optional extensions not found: ${optionalMissing.join(', ')}${colors.reset}`);
            console.log(`${colors.cyan}   💡 Install with: sudo apt install ${optionalMissing.map(ext => `php-${ext}`).join(' ')}${colors.reset}`);
        }

        // Add or update custom settings
        console.log(`${colors.bright}⚙️  Applying configuration settings...${colors.reset}`);
        const settingsResult = addCustomSettings(content, mergedSettings);
        content = settingsResult.content;

        if (settingsResult.updated.length > 0) {
            console.log(`${colors.green}✅ Updated settings: ${settingsResult.updated.join(', ')}${colors.reset}`);
        }

        if (settingsResult.added.length > 0) {
            console.log(`${colors.green}✅ Added settings: ${settingsResult.added.join(', ')}${colors.reset}`);
        }

        // Save updated php.ini with sudo support
        await writeFileWithSudo(filePath, content, useSudo);

        // Summary
        console.log(`\n${colors.bright}📊 Configuration Summary:${colors.reset}`);
        console.log(`   • Extensions enabled: ${totalEnabled.length + totalAlreadyEnabled.length}/${ESSENTIAL_EXTENSIONS.length + OPTIONAL_EXTENSIONS.length}`);
        console.log(`   • Settings configured: ${settingsResult.updated.length + settingsResult.added.length}`);
        console.log(`   • File size: ${content.length} bytes`);

    } catch (error: any) {
        console.error(`${colors.red}❌ Failed to customize php.ini: ${error.message}${colors.reset}`);
        throw new Error(`Failed to customize php.ini: ${error.message}`);
    }
}
