import fs from 'fs-extra';
import path from 'path';

// Constants
const PHP_SYMLINK = "C:/Users/Sabuz/pvm/sym/php.ini"; // Path to active php.ini
const PHP_DIRECTORY = path.dirname(PHP_SYMLINK); // Directory containing php.ini templates

// Available extensions to enable
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
    'zip'
];

/**
 * Updates the php.ini configuration for the specified PHP version.
 *
 * @param {string} version - The PHP version to update for.
 */
async function updatePhpIni(version) {
    const sourceIni = path.join(PHP_DIRECTORY, 'php.ini');
    
    // Check if MY_PATH is set and not empty
    const myPath = process.env.MY_PATH;
    const updateExtensionDir = myPath && myPath.trim() !== ""; // Determine if we should update extension_dir

    try {
        validateSourceFile(sourceIni);
        console.log(`Customizing php.ini for PHP ${version}...`);
        
        await customizePhpIni(sourceIni, version, updateExtensionDir, myPath);
        
        console.log(`php.ini for PHP ${version} has been customized successfully!`);
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
        throw new Error(`Template php.ini file not found at ${filePath}`);
    }
}

/**
 * Customizes the php.ini file by enabling extensions and setting the extension directory.
 *
 * @param {string} filePath - Path to the php.ini file to be customized.
 * @param {string} version - The PHP version for the extensions.
 * @param {boolean} updateExtensionDir - Flag to determine if extension_dir should be updated.
 * @param {string} myPath - The path for the extensions directory.
 */
async function customizePhpIni(filePath, version, updateExtensionDir, myPath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');

        // Only update extension_dir if MY_PATH is set
        if (updateExtensionDir) {
            const extensionDir = `${myPath}/php/${version}/ext`;
            content = content.replace(
                /;extension_dir\s*=\s*".\/"/g, 
                `extension_dir = "${extensionDir}"`
            );
        }

        // Enable extensions dynamically based on the EXTENSIONS array
        EXTENSIONS.forEach(extension => {
            const pattern = new RegExp(`;extension=${extension}`, 'g');
            content = content.replace(pattern, `extension=${extension}`);
        });

        await fs.writeFile(filePath, content, 'utf8');
        console.log("php.ini has been customized with the necessary extensions.");
    } catch (error) {
        throw new Error(`Failed to customize php.ini: ${error.message}`);
    }
}

// Command-line arguments
const phpVersion = process.argv[2];

if (!phpVersion) {
    console.error("Usage: node updatePhpIni.js <version>");
    process.exit(1);
}

// Execute the update
updatePhpIni(phpVersion);



/*

bun run index.ts PHP-7.2.0
bun run index.ts PHP-7.4.33
bun run index.ts PHP-8.1.10
bun run index.ts PHP-8.1.10
bun run index.ts PHP-8.2.24
bun run index.ts PHP-8.3.12

*/