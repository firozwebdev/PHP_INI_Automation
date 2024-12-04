import fs from 'fs-extra';
import path from 'path';

// Constants
export const DEFAULT_PATH = process.env.DEFAULT_PATH || "C:/php"; // Default PHP directory

/**
 * Determines the appropriate paths for php.ini and extensions directory.
 *
 * @param {string} version - PHP version (optional).
 * @returns {object} - Paths for php.ini and extensions directory.
 * @throws {Error} - If no valid PHP environment is found.
 */
export function determinePhpIniPaths(version = '') {
    const paths = [
        { base: process.env.PVM_PATH, ini: ['sym', 'php.ini'], ext: ['php', version || 'version', 'ext'] },
        { base: process.env.LARAGON_PATH, ini: ['php', version, 'php.ini'], ext: ['php', version, 'ext'] },
        { base: process.env.XAMPP_PATH, ini: ['php.ini'], ext: ['ext'] },
        { base: process.env.WAMP_PATH, ini: ['php', version, 'php.ini'], ext: ['php', version, 'ext'] },
    ];

    for (const { base, ini, ext } of paths) {
        if (base) {
            const iniPath = path.join(base, ...ini);
            const extensionDir = path.join(base, ...ext);
            if (fs.existsSync(iniPath)) {
                return { iniPath, extensionDir };
            }
        }
    }

    // Default fallback
    const iniPath = path.join(DEFAULT_PATH, 'php.ini');
    const extensionDir = '';
    if (fs.existsSync(iniPath)) {
        return { iniPath, extensionDir };
    }

    throw new Error('No valid PHP environment found. Please check your configurations.');
}
