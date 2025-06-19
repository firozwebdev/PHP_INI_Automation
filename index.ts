import { determinePhpIniPaths } from './phpEnvironmentUtils.js';
import { validateSourceFile, customizePhpIni } from './phpIniManager.js';

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

// Command-line arguments
const phpVersion = process.argv[2] || ''; // Use default PHP version if none is provided

console.log(`PHP Version specified: ${phpVersion || 'default'}`);

// Execute the update
updatePhpIni(phpVersion);
