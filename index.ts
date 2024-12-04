import fs from 'fs-extra';
import path from 'path';

// Constants
const DEFAULT_PATH = process.env.DEFAULT_PATH; // Default PHP directory if none is set

/**
 * Determines the appropriate paths for php.ini and extensions directory.
 *
 * @param {string} version - PHP version (optional).
 * @returns {object} - Paths for php.ini and extensions directory.
 * @throws {Error} - If no valid PHP environment is found.
 */
function determinePhpIniPaths(version = '') {
    let iniPath = '';
    let extensionDir = '';

    if (process.env.PVM_PATH) {
        iniPath = path.join(process.env.PVM_PATH, 'sym', 'php.ini');
        extensionDir = path.join(process.env.PVM_PATH, 'php', version || 'version', 'ext');
    } else if (process.env.LARAGON_PATH) {
        iniPath = path.join(process.env.LARAGON_PATH, 'php', version, 'php.ini');
        extensionDir = path.join(process.env.LARAGON_PATH, 'php', version, 'ext');
    } else if (process.env.XAMPP_PATH) {
        iniPath = path.join(process.env.XAMPP_PATH, 'php.ini');
        extensionDir = 'path.join(process.env.XAMPP_PATH, 'ext')';
    } else if (process.env.WAMP_PATH) {
        iniPath = path.join(process.env.WAMP_PATH, 'php', version, 'php.ini');
        extensionDir = path.join(process.env.WAMP_PATH, 'php', version, 'ext');
    } else {
        iniPath = path.join(DEFAULT_PATH, 'php.ini');
        extensionDir = '';
    }

    if (!fs.existsSync(iniPath)) {
        throw new Error('No valid PHP environment found. Please check your configurations.');
    }

    return { iniPath, extensionDir };
}

/**
 * Updates the php.ini configuration for the specified PHP version.
 *
 * @param {string} version - PHP version to update for (default: '').
 */
async function updatePhpIni(version = '') {
    console.log(`Starting php.ini update for PHP version: ${version || 'default'}`);

    try {
        const { iniPath, extensionDir } = determinePhpIniPaths(version);

        console.log(`php.ini path: ${iniPath}`);
        console.log(`Extensions directory: ${extensionDir}`);

        validateSourceFile(iniPath); // Validate if the file exists
        await customizePhpIni(iniPath, extensionDir);

        console.log(`php.ini for PHP version ${version || 'default'} has been successfully customized!`);
    } catch (error) {
        console.error("Failed to update php.ini:", error.message);
    }
}

/**
 * Validates that the source php.ini file exists.
 *
 * @param {string} filePath - Path to the php.ini file.
 * @throws {Error} - If the file does not exist.
 */
function validateSourceFile(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`php.ini file not found at: ${filePath}`);
    }
}

/**
 * Customizes the php.ini file by enabling extensions and optionally updating extension_dir.
 *
 * @param {string} filePath - Path to the php.ini file to be customized.
 * @param {string} extensionsDir - Directory containing PHP extensions.
 */
async function customizePhpIni(filePath, extensionsDir) {
    console.log(`Customizing php.ini at: ${filePath}`);
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

    try {
        let content = await fs.readFile(filePath, 'utf8');

        // Update extension_dir only if a custom directory is provided
        if (extensionsDir) {
            content = content.replace(
                /;?extension_dir\s*=\s*".*?"/,
                `extension_dir = "${extensionsDir.replace(/\\/g, '\\\\')}"`
            );
        }

        // Enable extensions
        EXTENSIONS.forEach(extension => {
            const pattern = new RegExp(`;extension=${extension}`, 'g');
            content = content.replace(pattern, `extension=${extension}`);
        });

        await fs.writeFile(filePath, content, 'utf8');
        console.log("php.ini has been successfully customized with the necessary extensions.");
    } catch (error) {
        throw new Error(`Failed to customize php.ini: ${error.message}`);
    }
}

// Command-line arguments
const phpVersion = process.argv[2] || ''; // Use default PHP version if none is provided

console.log(`PHP Version specified: ${phpVersion || 'default'}`);

// Execute the update
updatePhpIni(phpVersion);
