import fs from 'fs-extra';

/**
 * Validates that the source php.ini file exists.
 *
 * @param {string} filePath - Path to the php.ini file.
 * @throws {Error} - If the file does not exist.
 */
export function validateSourceFile(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`php.ini file not found at: ${filePath}`);
    }
}

/**
 * Enables PHP extensions in the php.ini file content.
 *
 * @param {string} content - The php.ini file content.
 * @param {Array<string>} extensions - List of PHP extensions to enable.
 * @returns {string} - Updated php.ini content.
 */
function enableExtensions(content, extensions) {
    extensions.forEach(extension => {
        const pattern = new RegExp(`;extension=${extension}`, 'g');
        content = content.replace(pattern, `extension=${extension}`);
    });
    return content;
}

/**
 * Adds or updates custom settings in the php.ini file content.
 *
 * @param {string} content - The php.ini file content.
 * @param {Object} settings - Key-value pairs of php.ini settings.
 * @returns {string} - Updated php.ini content.
 */
function addCustomSettings(content, settings) {
    for (const [key, value] of Object.entries(settings)) {
        const pattern = new RegExp(`^;?${key}\\s*=.*`, 'm'); // Match existing setting
        const settingLine = `${key} = ${value}`;

        if (pattern.test(content)) {
            // Update existing setting
            content = content.replace(pattern, settingLine);
        } else {
            // Add new setting
            content += `\n${settingLine}`;
        }
    }
    return content;
}

/**
 * Customizes the php.ini file by enabling extensions, updating extension_dir, and adding custom settings.
 *
 * @param {string} filePath - Path to the php.ini file to be customized.
 * @param {string} extensionsDir - Directory containing PHP extensions.
 * @param {Object} customSettings - Key-value pairs of additional php.ini settings to add/update.
 */
export async function customizePhpIni(filePath, extensionsDir, customSettings = {}) {
    console.log(`Customizing php.ini at: ${filePath}`);

    // Laravel wants these extensions enabled
    const EXTENSIONS = [
        'curl',
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
        'zip',
    ];

    // Service-specific settings
    const DEFAULT_SETTINGS = {
        //max_execution_time: 120,
        memory_limit: '1024',
        //post_max_size: '50M',
        //upload_max_filesize: '50M',
        // short_open_tag: 'On',
        // date: { timezone: 'UTC' },
        // error_reporting: 'E_ALL',
        // display_errors: 'Off',
        // log_errors: 'On',
        // error_log: '/var/log/php_errors.log',
        // 'session.save_handler': 'files',
        // 'session.save_path': '"/tmp"',
        // 'session.gc_maxlifetime': 1440,
        // realpath_cache_size: '4096K',
        // realpath_cache_ttl: 600,
        //zend_extension=xdebug,

        
        //xdebug.mode=debug,
        //xdebug.start_with_request=yes,
        //xdebug.client_port=9003,
        //xdebug.client_host=127.0.0.1,
        //xdebug.idekey=VSCODE,
        //xdebug.log=/var/log/xdebug.log,
    };

    // Merge default and custom settings
    const mergedSettings = { ...DEFAULT_SETTINGS, ...customSettings };

    try {
        let content = await fs.readFile(filePath, 'utf8');

        // Update extension_dir if provided
        if (extensionsDir) {
            content = content.replace(
                /;?extension_dir\s*=\s*".*?"/,
                `extension_dir = "${extensionsDir.replace(/\\/g, '\\\\')}"`
            );
        }

        // Enable PHP extensions
        content = enableExtensions(content, EXTENSIONS);

        // Add or update custom settings
        content = addCustomSettings(content, mergedSettings);

        // Save updated php.ini
        await fs.writeFile(filePath, content, 'utf8');
        console.log("php.ini has been successfully customized with the necessary extensions and settings.");
    } catch (error) {
        console.error(`Failed to customize php.ini: ${error.stack}`);
        throw new Error(`Failed to customize php.ini: ${error.message}`);
    }
}
