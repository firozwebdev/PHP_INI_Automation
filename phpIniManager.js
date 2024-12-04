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
 * Customizes the php.ini file by enabling extensions and optionally updating extension_dir.
 *
 * @param {string} filePath - Path to the php.ini file to be customized.
 * @param {string} extensionsDir - Directory containing PHP extensions.
 */
export async function customizePhpIni(filePath, extensionsDir) {
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
