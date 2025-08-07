import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

// Enhanced interfaces
export interface PhpInstallation {
    version: string;
    path: string;
    iniPath: string;
    extensionDir: string;
    environment: string;
    phpExecutable: string;
    isActive: boolean;
}

export interface PhpPaths {
    iniPath: string;
    extensionDir: string;
}

interface EnvironmentConfig {
    name: string;
    basePaths: string[];
    iniPattern: string[];
    extPattern: string[];
    versionPattern?: string[];
}

// Common PHP installation paths for different environments
const ENVIRONMENT_CONFIGS: EnvironmentConfig[] = [
    {
        name: 'Laragon',
        basePaths: [
            process.env.LARAGON_PATH || '',
            'C:/laragon',
            'D:/laragon',
            'E:/laragon'
        ],
        iniPattern: ['php', '{version}', 'php.ini'],
        extPattern: ['php', '{version}', 'ext'],
        versionPattern: ['php', '*']
    },
    {
        name: 'XAMPP',
        basePaths: [
            process.env.XAMPP_PATH || '',
            'C:/xampp',
            'D:/xampp',
            'E:/xampp'
        ],
        iniPattern: ['php', 'php.ini'],
        extPattern: ['php', 'ext']
    },
    {
        name: 'WAMP',
        basePaths: [
            process.env.WAMP_PATH || '',
            'C:/wamp',
            'C:/wamp64',
            'D:/wamp',
            'D:/wamp64'
        ],
        iniPattern: ['bin', 'php', 'php{version}', 'php.ini'],
        extPattern: ['bin', 'php', 'php{version}', 'ext'],
        versionPattern: ['bin', 'php', 'php*']
    },
    {
        name: 'PVM',
        basePaths: [
            process.env.PVM_PATH || '',
            'C:/tools/php'
        ],
        iniPattern: ['sym', 'php.ini'],
        extPattern: ['php', '{version}', 'ext']
    },
    {
        name: 'Custom',
        basePaths: [
            process.env.DEFAULT_PATH || '',
            'C:/php',
            'C:/Program Files/PHP',
            'C:/Program Files (x86)/PHP'
        ],
        iniPattern: ['php.ini'],
        extPattern: ['ext']
    }
];

/**
 * Gets PHP version from php.exe if available
 */
function getPhpVersionFromExecutable(phpPath: string): string | null {
    try {
        const result = execSync(`"${phpPath}" -v`, { encoding: 'utf8', timeout: 5000 });
        const match = result.match(/PHP (\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Scans for PHP installations across all known environments
 */
export function scanPhpInstallations(): PhpInstallation[] {
    const installations: PhpInstallation[] = [];

    console.log('🔍 Scanning for PHP installations...');

    for (const config of ENVIRONMENT_CONFIGS) {
        for (const basePath of config.basePaths) {
            if (!basePath || !fs.existsSync(basePath)) continue;

            try {
                if (config.versionPattern) {
                    // Multi-version environment (Laragon, WAMP)
                    const versionDirs = findVersionDirectories(basePath, config.versionPattern);

                    for (const versionDir of versionDirs) {
                        const installation = createInstallation(basePath, versionDir, config);
                        if (installation) installations.push(installation);
                    }
                } else {
                    // Single version environment (XAMPP, Custom)
                    const installation = createInstallation(basePath, '', config);
                    if (installation) installations.push(installation);
                }
            } catch (error) {
                // Continue scanning other paths
            }
        }
    }

    return installations;
}

/**
 * Finds version directories in multi-version environments
 */
function findVersionDirectories(basePath: string, versionPattern: string[]): string[] {
    const versions: string[] = [];

    try {
        let currentPath = basePath;

        for (let i = 0; i < versionPattern.length - 1; i++) {
            currentPath = path.join(currentPath, versionPattern[i]);
            if (!fs.existsSync(currentPath)) return versions;
        }

        const pattern = versionPattern[versionPattern.length - 1];
        const entries = fs.readdirSync(currentPath);

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry);
            if (fs.statSync(fullPath).isDirectory()) {
                if (pattern === '*' || entry.match(pattern.replace('*', '.*'))) {
                    versions.push(entry);
                }
            }
        }
    } catch {
        // Return empty array if scanning fails
    }

    return versions;
}

/**
 * Creates a PHP installation object
 */
function createInstallation(basePath: string, version: string, config: EnvironmentConfig): PhpInstallation | null {
    try {
        const iniPath = buildPath(basePath, config.iniPattern, version);
        const extensionDir = buildPath(basePath, config.extPattern, version);

        if (!fs.existsSync(iniPath)) return null;

        // Find PHP executable
        const phpExecutable = findPhpExecutable(basePath, version, config);
        const detectedVersion = version || getPhpVersionFromExecutable(phpExecutable) || 'unknown';

        return {
            version: detectedVersion,
            path: basePath,
            iniPath,
            extensionDir,
            environment: config.name,
            phpExecutable,
            isActive: false // Will be determined later
        };
    } catch {
        return null;
    }
}

/**
 * Builds a path from pattern, replacing {version} placeholder
 */
function buildPath(basePath: string, pattern: string[], version: string): string {
    const parts = pattern.map(part =>
        part.replace('{version}', version).replace('*', version)
    );
    return path.join(basePath, ...parts);
}

/**
 * Finds PHP executable in the installation
 */
function findPhpExecutable(basePath: string, version: string, config: EnvironmentConfig): string {
    const possiblePaths = [
        path.join(basePath, 'php.exe'),
        path.join(basePath, 'bin', 'php.exe'),
        path.join(basePath, 'php', version, 'php.exe'),
        path.join(basePath, 'bin', 'php', `php${version}`, 'php.exe'),
        path.join(basePath, 'sym', 'php.exe')
    ];

    for (const phpPath of possiblePaths) {
        if (fs.existsSync(phpPath)) return phpPath;
    }

    return '';
}

/**
 * Determines the appropriate paths for php.ini and extensions directory.
 * Enhanced version with automatic detection.
 */
export function determinePhpIniPaths(version: string = ''): PhpPaths {
    const installations = scanPhpInstallations();

    if (installations.length === 0) {
        throw new Error('No PHP installations found. Please install PHP or set environment variables.');
    }

    // If version specified, find matching installation
    if (version) {
        const matching = installations.find(inst =>
            inst.version.startsWith(version) ||
            inst.version.includes(version) ||
            inst.path.includes(version)
        );

        if (matching) {
            return {
                iniPath: matching.iniPath,
                extensionDir: matching.extensionDir
            };
        }
    }

    // Return first available installation
    const first = installations[0];
    return {
        iniPath: first.iniPath,
        extensionDir: first.extensionDir
    };
}
