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
 * Validates that the source php.ini file exists and is readable.
 *
 * @param filePath - Path to the php.ini file.
 * @throws If the file does not exist or is not readable.
 */
export function validateSourceFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
        throw new Error(`php.ini file not found at: ${filePath}`);
    }

    try {
        fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
        throw new Error(`php.ini file is not readable/writable: ${filePath}`);
    }

    console.log(`${colors.green}✅ php.ini file validated: ${filePath}${colors.reset}`);
}

/**
 * Checks if an extension file exists in the extensions directory
 */
function extensionExists(extensionDir: string, extension: string): boolean {
    if (!extensionDir) return false;

    const possibleExtensions = [
        `php_${extension}.dll`,
        `${extension}.dll`,
        `php_${extension}.so`,
        `${extension}.so`
    ];

    return possibleExtensions.some(ext =>
        fs.existsSync(path.join(extensionDir, ext))
    );
}

/**
 * Enables PHP extensions in the php.ini file content with better detection.
 *
 * @param content - The php.ini file content.
 * @param extensions - List of PHP extensions to enable.
 * @param extensionDir - Directory containing extension files.
 * @returns Object with updated content and statistics.
 */
function enableExtensions(content: string, extensions: string[], extensionDir: string): {
    content: string;
    enabled: string[];
    missing: string[];
    alreadyEnabled: string[];
} {
    const enabled: string[] = [];
    const missing: string[] = [];
    const alreadyEnabled: string[] = [];

    extensions.forEach(extension => {
        // Check if extension is already enabled
        const enabledPattern = new RegExp(`^extension\\s*=\\s*${extension}`, 'm');
        if (enabledPattern.test(content)) {
            alreadyEnabled.push(extension);
            return;
        }

        // Try to enable commented extension
        const commentedPattern = new RegExp(`;\\s*extension\\s*=\\s*${extension}`, 'g');
        if (commentedPattern.test(content)) {
            content = content.replace(commentedPattern, `extension=${extension}`);
            enabled.push(extension);
            return;
        }

        // Check if extension file exists before adding
        if (extensionExists(extensionDir, extension)) {
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

                content = beforeInsert + `\nextension=${extension}` + afterInsert;
                enabled.push(extension);
            } else {
                // Add to end of file
                content += `\nextension=${extension}`;
                enabled.push(extension);
            }
        } else {
            missing.push(extension);
        }
    });

    return { content, enabled, missing, alreadyEnabled };
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
 * Creates a backup of the original php.ini file
 */
async function createBackup(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;

    try {
        await fs.copy(filePath, backupPath);
        console.log(`${colors.cyan}📋 Backup created: ${backupPath}${colors.reset}`);
        return backupPath;
    } catch (error: any) {
        console.log(`${colors.yellow}⚠️  Could not create backup: ${error.message}${colors.reset}`);
        return '';
    }
}

/**
 * Enhanced PHP ini customization with detailed feedback and better error handling.
 *
 * @param filePath - Path to the php.ini file to be customized.
 * @param extensionsDir - Directory containing PHP extensions.
 * @param customSettings - Key-value pairs of additional php.ini settings to add/update.
 */
export async function customizePhpIni(
    filePath: string,
    extensionsDir: string,
    customSettings: Record<string, string | number> = {}
): Promise<void> {
    console.log(`${colors.bright}🔧 Customizing php.ini...${colors.reset}`);

    // Essential Laravel extensions
    const ESSENTIAL_EXTENSIONS: string[] = [
        'curl',
        'pdo_sqlite',
        'sqlite3',
        'openssl',
        'pdo_mysql',
        'mbstring',
        'tokenizer',
        'json',
        'fileinfo',
        'ctype',
        'xml',
        'bcmath',
        'gd',
        'zip'
    ];

    // Additional useful extensions
    const OPTIONAL_EXTENSIONS: string[] = [
        'redis',
        'imagick',
        'intl',
        'soap',
        'xsl',
        'exif',
        'mysqli',
        'pdo_pgsql',
        'ldap'
    ];

    // Optimized settings for Laravel development
    const DEFAULT_SETTINGS: Record<string, string | number> = {
        // Performance settings
        max_execution_time: 120,
        memory_limit: '512M',
        max_input_vars: 3000,

        // Output settings
        output_buffering: 'Off',
        zlib_output_compression: 'Off',

        // Upload settings
        post_max_size: '100M',
        upload_max_filesize: '100M',
        max_file_uploads: 20,

        // Error reporting (development-friendly)
        error_reporting: 'E_ALL',
        display_errors: 'On',
        display_startup_errors: 'On',
        log_errors: 'On',

        // Session settings
        'session.gc_maxlifetime': 1440,
        'session.cookie_lifetime': 0,

        // OPcache settings (if available)
        'opcache.enable': 1,
        'opcache.memory_consumption': 128,
        'opcache.max_accelerated_files': 4000,
        'opcache.revalidate_freq': 2,

        // Realpath cache
        realpath_cache_size: '4096K',
        realpath_cache_ttl: 600
    };

    // Merge default and custom settings
    const mergedSettings = { ...DEFAULT_SETTINGS, ...customSettings };

    try {
        // Create backup
        await createBackup(filePath);

        let content = await fs.readFile(filePath, 'utf8');
        console.log(`${colors.green}✅ php.ini file loaded (${content.length} bytes)${colors.reset}`);

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
        const extensionResult = enableExtensions(content, ESSENTIAL_EXTENSIONS, extensionsDir);
        content = extensionResult.content;

        // Try optional extensions
        const optionalResult = enableExtensions(content, OPTIONAL_EXTENSIONS, extensionsDir);
        content = optionalResult.content;

        // Report extension results with better categorization
        const totalEnabled = extensionResult.enabled.concat(optionalResult.enabled);
        const totalMissing = extensionResult.missing.concat(optionalResult.missing);
        const totalAlreadyEnabled = extensionResult.alreadyEnabled.concat(optionalResult.alreadyEnabled);

        // Separate essential vs optional missing extensions
        const essentialMissing = extensionResult.missing;
        const optionalMissing = optionalResult.missing;

        if (totalEnabled.length > 0) {
            console.log(`${colors.green}✅ Enabled extensions: ${totalEnabled.join(', ')}${colors.reset}`);
        }

        if (totalAlreadyEnabled.length > 0) {
            console.log(`${colors.cyan}ℹ️  Already enabled: ${totalAlreadyEnabled.join(', ')}${colors.reset}`);
        }

        if (essentialMissing.length > 0) {
            console.log(`${colors.yellow}⚠️  Missing Laravel extensions: ${essentialMissing.join(', ')}${colors.reset}`);
            console.log(`${colors.yellow}   💡 These are required for Laravel - consider installing them${colors.reset}`);
        }

        if (optionalMissing.length > 0) {
            console.log(`${colors.cyan}ℹ️  Optional extensions not found: ${optionalMissing.join(', ')}${colors.reset}`);
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

        // Save updated php.ini
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`${colors.green}${colors.bright}✅ php.ini successfully updated!${colors.reset}`);

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
