import fs from 'fs-extra';
import path from 'path';
const { exec } = require('child_process');

// Constants
const DEFAULT_PATH = "C:\\php"; // Default PHP directory if PVM_PATH is not set

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

/**
 * Updates the php.ini configuration for the specified PHP version.
 *
 * @param {string} version - The PHP version to update for (default: 'default').
 */
async function updatePhpIni(version='') {
    console.log(`Starting php.ini update for PHP version: ${version}`);

    // Determine the base path and paths for ini file and extensions
    const PVM_PATH = process.env.PVM_PATH || ''; // Path to PVM or empty if not set
    const basePath = PVM_PATH || DEFAULT_PATH;
    const iniPath = PVM_PATH ? path.join(basePath, 'sym', 'php.ini') : path.join(basePath, 'php.ini');
    

    const extension_dir = version ? path.join(basePath, 'php', version, 'ext') : '';
    

    console.log(`Resolved php.ini path: ${iniPath}`);
    console.log(`Resolved extensions directory: ${extension_dir}`);
    
    try {
        validateSourceFile(iniPath); // Validate if the file exists
        await customizePhpIni(iniPath, extension_dir);

        console.log(`php.ini for PHP version ${version} has been successfully customized!`);
    } catch (error) {
        console.error("Failed to update php.ini:", error.message);
    }
}

/**
 * Validates that the source php.ini file exists.
 *
 * @param {string} filePath - Path to the php.ini template.
 * @throws {Error} If the file does not exist.
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
    try {
        let content = await fs.readFile(filePath, 'utf8');

        // Update extension_dir only if a custom directory is provided
        if (extensionsDir) {
            content = content.replace(
                /;extension_dir\s*=\s*".\/"/,
                `extension_dir = "${extensionsDir.replace(/\\/g, '\\\\')}"` // Escape backslashes for Windows
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
const phpVersion = process.argv[2]; // Use default PHP version if none is provided

console.log(`PHP Version specified: ${phpVersion}`);

// Execute the update
updatePhpIni(phpVersion);


/*
Command: 
bun start PHP-7.2.0
bun start PHP-7.4.33
bun start PHP-8.1.10
bun start PHP-8.1.10
bun start PHP-8.2.24
bun start PHP-8.3.12

*/