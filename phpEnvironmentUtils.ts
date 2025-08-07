import { execSync } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
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

// Enhanced interfaces
export interface PhpInstallation {
    version: string;
    path: string;
    iniPath: string;
    extensionDir: string;
    environment: string;
    phpExecutable: string;
    isActive: boolean;
    architecture?: string;
    threadSafety?: boolean;
    configureCommand?: string;
    buildDate?: string;
    priority: number; // For sorting by preference
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
    phpExePattern?: string[];
    priority: number;
    deepScan?: boolean;
    maxDepth?: number;
}

interface DetectionResult {
    installations: PhpInstallation[];
    activePhp?: PhpInstallation;
    systemPhp?: PhpInstallation;
}

// Cross-platform PHP environment configurations
const getEnvironmentConfigs = (): EnvironmentConfig[] => {
    const isWindows = process.platform === 'win32';
    const phpExe = isWindows ? 'php.exe' : 'php';

    const configs: EnvironmentConfig[] = [];

    if (isWindows) {
        // Windows-specific environments
        configs.push(
            {
                name: 'Laragon',
                priority: 1,
                deepScan: true,
                maxDepth: 3,
                basePaths: [
                    process.env.LARAGON_PATH || '',
                    'C:/laragon',
                    'D:/laragon',
                    'E:/laragon',
                    'F:/laragon',
                    path.join(os.homedir(), 'laragon'),
                    'C:/laragon/bin',
                    'D:/laragon/bin'
                ],
                iniPattern: ['php', '{version}', 'php.ini'],
                extPattern: ['php', '{version}', 'ext'],
                phpExePattern: ['php', '{version}', phpExe],
                versionPattern: ['php', '*']
            },
            {
                name: 'PVM',
                priority: 2,
                deepScan: true,
                maxDepth: 4,
                basePaths: [
                    process.env.PVM_PATH || '',
                    'C:/tools/php',
                    'C:/pvm',
                    'D:/pvm',
                    path.join(os.homedir(), 'pvm'),
                    path.join(os.homedir(), '.pvm'),
                    'C:/Users/*/pvm',
                    'C:/dev/php',
                    'C:/tools/pvm'
                ],
                iniPattern: ['sym', 'php.ini'],
                extPattern: ['php', '{version}', 'ext'],
                phpExePattern: ['sym', phpExe],
                versionPattern: ['php', '*']
            },
            {
                name: 'WAMP',
                priority: 3,
                deepScan: true,
                maxDepth: 4,
                basePaths: [
                    process.env.WAMP_PATH || '',
                    process.env.WAMPP_PATH || '',
                    'C:/wamp',
                    'C:/wamp64',
                    'D:/wamp',
                    'D:/wamp64',
                    'E:/wamp64',
                    'C:/wampserver',
                    'D:/wampserver'
                ],
                iniPattern: ['bin', 'php', 'php{version}', 'php.ini'],
                extPattern: ['bin', 'php', 'php{version}', 'ext'],
                phpExePattern: ['bin', 'php', 'php{version}', phpExe],
                versionPattern: ['bin', 'php', 'php*']
            },
            {
                name: 'XAMPP',
                priority: 4,
                deepScan: false,
                basePaths: [
                    process.env.XAMPP_PATH || '',
                    'C:/xampp',
                    'D:/xampp',
                    'E:/xampp',
                    'C:/xampp/php',
                    'D:/xampp/php'
                ],
                iniPattern: ['php.ini'],
                extPattern: ['ext'],
                phpExePattern: [phpExe]
            },
            {
                name: 'MAMP',
                priority: 5,
                deepScan: true,
                maxDepth: 3,
                basePaths: [
                    'C:/MAMP',
                    'D:/MAMP',
                    'C:/Applications/MAMP'
                ],
                iniPattern: ['bin', 'php', 'php{version}', 'conf', 'php.ini'],
                extPattern: ['bin', 'php', 'php{version}', 'lib', 'php', 'extensions'],
                phpExePattern: ['bin', 'php', 'php{version}', phpExe],
                versionPattern: ['bin', 'php', 'php*']
            },
            {
                name: 'Uniform Server',
                priority: 6,
                deepScan: true,
                maxDepth: 3,
                basePaths: [
                    'C:/UniServer',
                    'D:/UniServer',
                    'C:/UniServerZ'
                ],
                iniPattern: ['core', 'php{version}', 'php.ini'],
                extPattern: ['core', 'php{version}', 'ext'],
                phpExePattern: ['core', 'php{version}', phpExe],
                versionPattern: ['core', 'php*']
            },
            {
                name: 'Bitnami',
                priority: 7,
                deepScan: true,
                maxDepth: 4,
                basePaths: [
                    'C:/Bitnami',
                    'D:/Bitnami',
                    'C:/Program Files/Bitnami'
                ],
                iniPattern: ['php', 'etc', 'php.ini'],
                extPattern: ['php', 'lib', 'php', 'extensions'],
                phpExePattern: ['php', 'bin', phpExe],
                versionPattern: ['*']
            },
            {
                name: 'Custom/System',
                priority: 8,
                deepScan: true,
                maxDepth: 2,
                basePaths: [
                    process.env.DEFAULT_PATH || '',
                    'C:/php',
                    'D:/php',
                    'C:/Program Files/PHP',
                    'C:/Program Files (x86)/PHP',
                    'C:/tools/php',
                    'C:/dev/php',
                    path.join(os.homedir(), 'php')
                ],
                iniPattern: ['php.ini'],
                extPattern: ['ext'],
                phpExePattern: [phpExe]
            }
        );
    } else {
        // Linux/Unix-specific environments
        configs.push(
            {
                name: 'System Package Manager',
                priority: 1,
                deepScan: false,
                basePaths: [
                    '/usr/bin',
                    '/usr/local/bin',
                    '/opt/php',
                    '/etc/php'
                ],
                iniPattern: ['php.ini'],
                extPattern: ['extensions'],
                phpExePattern: [phpExe]
            },
            {
                name: 'Ubuntu/Debian APT',
                priority: 2,
                deepScan: true,
                maxDepth: 3,
                basePaths: [
                    '/etc/php',
                    '/usr/lib/php',
                    '/usr/bin'
                ],
                iniPattern: ['{version}', 'cli', 'php.ini'],
                extPattern: ['{version}', 'mods-available'],
                phpExePattern: [phpExe],
                versionPattern: ['*']
            },
            {
                name: 'CentOS/RHEL',
                priority: 3,
                deepScan: true,
                maxDepth: 2,
                basePaths: [
                    '/etc',
                    '/usr/lib64/php',
                    '/usr/share/php'
                ],
                iniPattern: ['php.ini'],
                extPattern: ['modules'],
                phpExePattern: [phpExe]
            },
            {
                name: 'Homebrew',
                priority: 4,
                deepScan: true,
                maxDepth: 4,
                basePaths: [
                    '/usr/local/etc/php',
                    '/opt/homebrew/etc/php',
                    '/usr/local/Cellar/php',
                    '/opt/homebrew/Cellar/php'
                ],
                iniPattern: ['{version}', 'php.ini'],
                extPattern: ['{version}', 'pecl'],
                phpExePattern: ['{version}', 'bin', phpExe],
                versionPattern: ['*']
            },
            {
                name: 'Custom/Compiled',
                priority: 5,
                deepScan: true,
                maxDepth: 3,
                basePaths: [
                    process.env.PHP_PATH || '',
                    '/usr/local/php',
                    '/opt/php',
                    path.join(os.homedir(), 'php'),
                    path.join(os.homedir(), '.local/php')
                ],
                iniPattern: ['php.ini'],
                extPattern: ['lib', 'php', 'extensions'],
                phpExePattern: ['bin', phpExe]
            },
            {
                name: 'System Package Manager',
                priority: 1,
                deepScan: false,
                basePaths: [
                    '/usr/bin',
                    '/usr/local/bin',
                    '/opt/php',
                    '/etc/php'
                ],
                iniPattern: ['php.ini'],
                extPattern: ['extensions'],
                phpExePattern: [phpExe]
            },
            {
                name: 'Ubuntu/Debian APT',
                priority: 2,
                deepScan: true,
                maxDepth: 3,
                basePaths: [
                    '/etc/php',
                    '/usr/lib/php',
                    '/var/lib/php'
                ],
                iniPattern: ['{version}', 'apache2', 'php.ini'],
                extPattern: ['{version}', 'mods-available'],
                phpExePattern: ['{version}', 'bin', phpExe],
                versionPattern: ['*']
            },
            {
                name: 'CentOS/RHEL YUM/DNF',
                priority: 3,
                deepScan: true,
                maxDepth: 3,
                basePaths: [
                    '/etc/php.ini',
                    '/etc/php.d',
                    '/usr/lib64/php',
                    '/usr/share/php'
                ],
                iniPattern: ['php.ini'],
                extPattern: ['modules'],
                phpExePattern: [phpExe]
            },
            {
                name: 'Homebrew (macOS/Linux)',
                priority: 4,
                deepScan: true,
                maxDepth: 4,
                basePaths: [
                    '/usr/local/etc/php',
                    '/opt/homebrew/etc/php',
                    '/usr/local/Cellar/php',
                    '/opt/homebrew/Cellar/php',
                    path.join(os.homedir(), '.brew/etc/php')
                ],
                iniPattern: ['{version}', 'php.ini'],
                extPattern: ['{version}', 'pecl'],
                phpExePattern: ['{version}', 'bin', phpExe],
                versionPattern: ['*']
            },
            {
                name: 'Docker/Container',
                priority: 5,
                deepScan: true,
                maxDepth: 2,
                basePaths: [
                    '/usr/local/etc/php',
                    '/etc/php',
                    '/var/www/html'
                ],
                iniPattern: ['php.ini'],
                extPattern: ['extensions'],
                phpExePattern: [phpExe]
            },
            {
                name: 'Compiled/Custom',
                priority: 6,
                deepScan: true,
                maxDepth: 3,
                basePaths: [
                    process.env.PHP_PATH || '',
                    '/usr/local/php',
                    '/opt/php',
                    '/home/*/php',
                    path.join(os.homedir(), 'php'),
                    path.join(os.homedir(), '.local/php'),
                    '/usr/local/src/php'
                ],
                iniPattern: ['php.ini'],
                extPattern: ['lib', 'php', 'extensions'],
                phpExePattern: ['bin', phpExe],
                versionPattern: ['*']
            }
        );
    }

    return configs;
};

/**
 * Gets php.ini path directly from PHP executable
 */
function getPhpIniPathFromExecutable(phpPath: string): string[] {
    try {
        const isWindows = process.platform === 'win32';
        const nullDevice = isWindows ? '2>nul' : '2>/dev/null';

        // Get loaded configuration file path
        const result = execSync(`"${phpPath}" -r "echo php_ini_loaded_file();" ${nullDevice}`, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: ['pipe', 'pipe', 'ignore']
        });

        const iniPath = result.trim();
        if (iniPath && iniPath !== '' && fs.existsSync(iniPath)) {
            return [iniPath];
        }

        // Try alternative method
        const configResult = execSync(`"${phpPath}" --ini ${nullDevice}`, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: ['pipe', 'pipe', 'ignore']
        });

        const loadedMatch = configResult.match(/Loaded Configuration File:\s*(.+)/);
        if (loadedMatch && loadedMatch[1] && loadedMatch[1].trim() !== '(none)') {
            const loadedPath = loadedMatch[1].trim();
            if (fs.existsSync(loadedPath)) {
                return [loadedPath];
            }
        }

        // Extract scan directories
        const scanMatch = configResult.match(/Scan for additional \.ini files in:\s*(.+)/);
        if (scanMatch && scanMatch[1] && scanMatch[1].trim() !== '(none)') {
            const scanDirs = scanMatch[1].trim().split(/[,;:]/);
            return scanDirs.map(dir => path.join(dir.trim(), 'php.ini')).filter(p => fs.existsSync(p));
        }

    } catch {
        // Failed to get ini path from PHP
    }

    return [];
}

/**
 * Gets extension directory path directly from PHP executable
 */
function getPhpExtensionDirFromExecutable(phpPath: string): string[] {
    try {
        const isWindows = process.platform === 'win32';
        const nullDevice = isWindows ? '2>nul' : '2>/dev/null';

        // Get extension directory from PHP
        const result = execSync(`"${phpPath}" -r "echo ini_get('extension_dir');" ${nullDevice}`, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: ['pipe', 'pipe', 'ignore']
        });

        const extDir = result.trim();
        if (extDir && extDir !== '' && fs.existsSync(extDir)) {
            return [extDir];
        }

    } catch {
        // Failed to get extension dir from PHP
    }

    return [];
}

/**
 * Gets comprehensive PHP information from executable (cross-platform)
 */
function getPhpInfoFromExecutable(phpPath: string): Partial<PhpInstallation> | null {
    try {
        const isWindows = process.platform === 'win32';
        const nullDevice = isWindows ? '2>nul' : '2>/dev/null';

        // Suppress PHP warnings and errors during detection
        const versionResult = execSync(`"${phpPath}" -v ${nullDevice}`, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr
        });

        const configResult = execSync(`"${phpPath}" -i ${nullDevice}`, {
            encoding: 'utf8',
            timeout: 10000,
            stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr
        });

        // Extract version
        const versionMatch = versionResult.match(/PHP (\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : 'unknown';

        // Extract additional info
        const architectureMatch = configResult.match(/Architecture => (.+)/);
        const threadSafetyMatch = configResult.match(/Thread Safety => (.+)/);
        const buildDateMatch = configResult.match(/Build Date => (.+)/);
        const configureMatch = configResult.match(/Configure Command => (.+)/);

        return {
            version,
            architecture: architectureMatch ? architectureMatch[1].trim() : undefined,
            threadSafety: threadSafetyMatch ? threadSafetyMatch[1].trim() === 'enabled' : undefined,
            buildDate: buildDateMatch ? buildDateMatch[1].trim() : undefined,
            configureCommand: configureMatch ? configureMatch[1].trim() : undefined
        };
    } catch {
        // Fallback to simple version detection
        try {
            const isWindows = process.platform === 'win32';
            const nullDevice = isWindows ? '2>nul' : '2>/dev/null';

            const result = execSync(`"${phpPath}" -v ${nullDevice}`, {
                encoding: 'utf8',
                timeout: 5000,
                stdio: ['pipe', 'pipe', 'ignore']
            });
            const match = result.match(/PHP (\d+\.\d+\.\d+)/);
            return match ? { version: match[1] } : null;
        } catch {
            return null;
        }
    }
}

/**
 * Detects PHP installations from Windows Registry (Windows only)
 */
function detectFromRegistry(): PhpInstallation[] {
    const installations: PhpInstallation[] = [];

    if (process.platform !== 'win32') return installations;

    try {
        // Check common registry paths for PHP installations
        const registryPaths = [
            'HKEY_LOCAL_MACHINE\\SOFTWARE\\PHP',
            'HKEY_CURRENT_USER\\SOFTWARE\\PHP',
            'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\PHP'
        ];

        for (const regPath of registryPaths) {
            try {
                const result = execSync(`reg query "${regPath}" /s 2>nul`, {
                    encoding: 'utf8',
                    timeout: 5000,
                    stdio: ['pipe', 'pipe', 'ignore'] // Suppress error output
                });

                // Parse registry output for PHP paths
                const pathMatches = result.match(/InstallDir\s+REG_SZ\s+(.+)/g);
                if (pathMatches) {
                    for (const match of pathMatches) {
                        const pathMatch = match.match(/InstallDir\s+REG_SZ\s+(.+)/);
                        if (pathMatch) {
                            const phpPath = pathMatch[1].trim();
                            const installation = createInstallationFromPath(phpPath, 'Registry');
                            if (installation) installations.push(installation);
                        }
                    }
                }
            } catch {
                // Continue with next registry path silently
            }
        }
    } catch {
        // Registry detection failed, continue with other methods
    }

    return installations;
}

/**
 * Detects PHP from system PATH (cross-platform)
 */
function detectFromPath(): PhpInstallation[] {
    const installations: PhpInstallation[] = [];

    try {
        const isWindows = process.platform === 'win32';
        const command = isWindows ? 'where php 2>nul' : 'which php 2>/dev/null';

        const result = execSync(command, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: ['pipe', 'pipe', 'ignore'] // Suppress error output
        });

        const phpPaths = result.split('\n').filter(line => line.trim());

        for (const phpPath of phpPaths) {
            const cleanPath = phpPath.trim();
            if (fs.existsSync(cleanPath)) {
                const installation = createInstallationFromPath(path.dirname(cleanPath), 'System PATH');
                if (installation) {
                    installation.isActive = true; // PATH PHP is considered active
                    installations.push(installation);
                }
            }
        }
    } catch {
        // PATH detection failed silently
    }

    return installations;
}

/**
 * Deep recursive scan for PHP installations (cross-platform)
 */
function deepScanDirectory(basePath: string, maxDepth: number = 3, currentDepth: number = 0): string[] {
    const phpPaths: string[] = [];

    if (currentDepth >= maxDepth || !fs.existsSync(basePath)) {
        return phpPaths;
    }

    try {
        const entries = fs.readdirSync(basePath);
        const isWindows = process.platform === 'win32';
        const phpExeName = isWindows ? 'php.exe' : 'php';

        for (const entry of entries) {
            const fullPath = path.join(basePath, entry);

            try {
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // Check if this directory contains PHP executable
                    const phpExePath = path.join(fullPath, phpExeName);
                    if (fs.existsSync(phpExePath)) {
                        phpPaths.push(fullPath);
                    }

                    // Recursively scan subdirectories
                    if (currentDepth < maxDepth - 1) {
                        phpPaths.push(...deepScanDirectory(fullPath, maxDepth, currentDepth + 1));
                    }
                }
            } catch {
                // Skip inaccessible directories
            }
        }
    } catch {
        // Skip inaccessible directories
    }

    return phpPaths;
}

/**
 * Creates installation object from a directory path (cross-platform)
 */
function createInstallationFromPath(phpDir: string, environment: string): PhpInstallation | null {
    try {
        const isWindows = process.platform === 'win32';
        const phpExeName = isWindows ? 'php.exe' : 'php';
        const phpExePath = path.join(phpDir, phpExeName);

        if (!fs.existsSync(phpExePath)) return null;

        const phpInfo = getPhpInfoFromExecutable(phpExePath);
        if (!phpInfo || !phpInfo.version) return null;

        // Find php.ini (cross-platform paths)
        const possibleIniPaths = isWindows ? [
            path.join(phpDir, 'php.ini'),
            path.join(phpDir, 'conf', 'php.ini'),
            path.join(phpDir, 'etc', 'php.ini'),
            path.join(phpDir, '..', 'php.ini')
        ] : [
            // Try to get actual php.ini path from PHP itself
            ...getPhpIniPathFromExecutable(phpExePath),
            // Common Linux/Unix paths
            `/etc/php/${phpInfo.version}/apache2/php.ini`,
            `/etc/php/${phpInfo.version}/cli/php.ini`,
            `/etc/php/${phpInfo.version}/fpm/php.ini`,
            `/etc/php/${phpInfo.version}/php.ini`,
            '/etc/php.ini',
            '/usr/local/etc/php.ini',
            `/usr/local/etc/php/${phpInfo.version}/php.ini`,
            path.join(phpDir, 'php.ini'),
            path.join(phpDir, '..', 'etc', 'php.ini'),
            path.join(phpDir, '..', 'lib', 'php.ini')
        ];

        let iniPath = '';
        for (const iniCandidate of possibleIniPaths) {
            if (fs.existsSync(iniCandidate)) {
                iniPath = iniCandidate;
                break;
            }
        }

        // Find extension directory (cross-platform)
        const possibleExtDirs = isWindows ? [
            path.join(phpDir, 'ext'),
            path.join(phpDir, 'extensions'),
            path.join(phpDir, 'lib', 'php', 'extensions'),
            path.join(phpDir, 'modules')
        ] : [
            // Try to get actual extension dir from PHP
            ...getPhpExtensionDirFromExecutable(phpExePath),
            // Common Linux/Unix extension paths
            `/usr/lib/php/${phpInfo.version}`,
            `/usr/lib/php/${phpInfo.version.split('.').slice(0, 2).join('.')}`,
            '/usr/lib/php/modules',
            '/usr/lib/php/extensions',
            `/usr/local/lib/php/extensions/no-debug-non-zts-${phpInfo.version}`,
            `/usr/local/lib/php/extensions`,
            path.join(phpDir, '..', 'lib', 'php', 'extensions'),
            path.join(phpDir, '..', 'lib', 'php', 'modules'),
            path.join(phpDir, 'extensions'),
            path.join(phpDir, 'modules')
        ];

        let extensionDir = '';
        for (const extCandidate of possibleExtDirs) {
            if (fs.existsSync(extCandidate)) {
                extensionDir = extCandidate;
                break;
            }
        }

        return {
            version: phpInfo.version,
            path: phpDir,
            iniPath,
            extensionDir,
            environment,
            phpExecutable: phpExePath,
            isActive: false,
            architecture: phpInfo.architecture,
            threadSafety: phpInfo.threadSafety,
            buildDate: phpInfo.buildDate,
            configureCommand: phpInfo.configureCommand,
            priority: environment === 'System PATH' ? 1 : 5
        };
    } catch {
        return null;
    }
}

/**
 * Comprehensive PHP installation scanner with streamlined feedback
 */
export function scanPhpInstallations(): PhpInstallation[] {
    const installations: PhpInstallation[] = [];
    const foundPaths = new Set<string>(); // Prevent duplicates
    const foundExecutables = new Set<string>(); // Prevent duplicate executables

    console.log('🔍 Scanning for PHP installations...');

    // Method 1: Detect from system PATH (highest priority)
    const pathInstallations = detectFromPath();
    for (const installation of pathInstallations) {
        const key = `${installation.path}|${installation.phpExecutable}`;
        if (!foundPaths.has(key) && !foundExecutables.has(installation.phpExecutable)) {
            installations.push(installation);
            foundPaths.add(key);
            foundExecutables.add(installation.phpExecutable);
        }
    }

    // Method 2: Detect from Windows Registry (Windows only)
    if (process.platform === 'win32') {
        const registryInstallations = detectFromRegistry();
        for (const installation of registryInstallations) {
            const key = `${installation.path}|${installation.phpExecutable}`;
            if (!foundPaths.has(key) && !foundExecutables.has(installation.phpExecutable)) {
                installations.push(installation);
                foundPaths.add(key);
                foundExecutables.add(installation.phpExecutable);
            }
        }
    }

    // Method 3: Scan known environment configurations (limited on Linux to avoid duplicates)
    const ENVIRONMENT_CONFIGS = getEnvironmentConfigs();
    const isLinux = process.platform === 'linux';

    for (const config of ENVIRONMENT_CONFIGS) {
        // Skip problematic configs on Linux to avoid duplicates
        if (isLinux && (
            config.name.includes('CentOS') ||
            config.name.includes('X11') ||
            config.name.includes('Ubuntu/Debian APT')
        )) {
            continue;
        }

        for (const basePath of config.basePaths) {
            if (!basePath || basePath.includes('*')) {
                // Handle wildcard paths
                if (basePath.includes('*')) {
                    const expandedPaths = expandWildcardPath(basePath);
                    for (const expandedPath of expandedPaths) {
                        scanEnvironmentPath(expandedPath, config, installations, foundPaths, foundExecutables);
                    }
                }
                continue;
            }

            scanEnvironmentPath(basePath, config, installations, foundPaths, foundExecutables);
        }
    }

    // Method 4: Deep scan common directories (cross-platform, limited to avoid duplicates)
    const isWindows = process.platform === 'win32';
    if (isWindows) {
        // Only deep scan on Windows where it's more useful
        const commonDirs = ['C:/', 'D:/', 'E:/'];
        for (const dir of commonDirs) {
            if (fs.existsSync(dir)) {
                const deepPaths = deepScanDirectory(dir, 2);
                for (const phpPath of deepPaths) {
                    if (!foundPaths.has(phpPath)) {
                        const installation = createInstallationFromPath(phpPath, 'Deep Scan');
                        if (installation && installation.iniPath) {
                            installations.push(installation);
                            foundPaths.add(phpPath);
                        }
                    }
                }
            }
        }
    }

    // Sort by priority and version
    installations.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.version.localeCompare(a.version, undefined, { numeric: true });
    });

    // Mark the most likely active installation
    if (installations.length > 0 && !installations.some(i => i.isActive)) {
        installations[0].isActive = true;
    }

    return installations;
}

/**
 * Expands wildcard paths like C:/Users/star/pvm (where star = *)
 */
function expandWildcardPath(wildcardPath: string): string[] {
    const paths: string[] = [];
    const parts = wildcardPath.split(path.sep);

    try {
        let currentPaths = [''];

        for (const part of parts) {
            if (part === '*') {
                const newPaths: string[] = [];
                for (const currentPath of currentPaths) {
                    if (fs.existsSync(currentPath)) {
                        const entries = fs.readdirSync(currentPath);
                        for (const entry of entries) {
                            const fullPath = path.join(currentPath, entry);
                            if (fs.statSync(fullPath).isDirectory()) {
                                newPaths.push(fullPath);
                            }
                        }
                    }
                }
                currentPaths = newPaths;
            } else {
                currentPaths = currentPaths.map(p => path.join(p, part));
            }
        }

        paths.push(...currentPaths.filter(p => fs.existsSync(p)));
    } catch {
        // Wildcard expansion failed
    }

    return paths;
}

/**
 * Scans a specific environment path
 */
function scanEnvironmentPath(
    basePath: string,
    config: EnvironmentConfig,
    installations: PhpInstallation[],
    foundPaths: Set<string>,
    foundExecutables: Set<string>
): void {
    if (!fs.existsSync(basePath)) return;

    try {
        if (config.versionPattern) {
            // Multi-version environment
            const versionDirs = findVersionDirectories(basePath, config.versionPattern);

            for (const versionDir of versionDirs) {
                const installation = createInstallation(basePath, versionDir, config);
                if (installation) {
                    const key = `${installation.path}|${installation.phpExecutable}`;
                    if (!foundPaths.has(key) && !foundExecutables.has(installation.phpExecutable)) {
                        installations.push(installation);
                        foundPaths.add(key);
                        foundExecutables.add(installation.phpExecutable);
                    }
                }
            }
        } else {
            // Single version environment
            const installation = createInstallation(basePath, '', config);
            if (installation) {
                const key = `${installation.path}|${installation.phpExecutable}`;
                if (!foundPaths.has(key) && !foundExecutables.has(installation.phpExecutable)) {
                    installations.push(installation);
                    foundPaths.add(key);
                    foundExecutables.add(installation.phpExecutable);
                }
            }
        }

        // Deep scan if enabled
        if (config.deepScan) {
            const deepPaths = deepScanDirectory(basePath, config.maxDepth || 3);
            for (const phpPath of deepPaths) {
                const installation = createInstallationFromPath(phpPath, config.name);
                if (installation && installation.iniPath) {
                    const key = `${installation.path}|${installation.phpExecutable}`;
                    if (!foundPaths.has(key) && !foundExecutables.has(installation.phpExecutable)) {
                        installations.push(installation);
                        foundPaths.add(key);
                        foundExecutables.add(installation.phpExecutable);
                    }
                }
            }
        }
    } catch {
        // Continue with next path
    }
}

/**
 * Enhanced version directory finder with intelligent pattern matching
 */
function findVersionDirectories(basePath: string, versionPattern: string[]): string[] {
    const versions: string[] = [];

    try {
        let currentPath = basePath;

        // Navigate to the directory containing version folders
        for (let i = 0; i < versionPattern.length - 1; i++) {
            currentPath = path.join(currentPath, versionPattern[i]);
            if (!fs.existsSync(currentPath)) return versions;
        }

        const pattern = versionPattern[versionPattern.length - 1];
        const entries = fs.readdirSync(currentPath);

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry);

            try {
                if (fs.statSync(fullPath).isDirectory()) {
                    let matches = false;

                    if (pattern === '*') {
                        // Accept any directory that looks like a PHP version
                        matches = /^(php)?[\d\.\-]+/i.test(entry) ||
                                 /^\d+\.\d+/.test(entry) ||
                                 entry.toLowerCase().includes('php');
                    } else {
                        // Use pattern matching
                        const regex = new RegExp(pattern.replace('*', '.*'), 'i');
                        matches = regex.test(entry);
                    }

                    if (matches) {
                        // Verify this directory actually contains PHP
                        const phpExePath = findPhpExecutableInDir(fullPath);
                        if (phpExePath) {
                            versions.push(entry);
                        }
                    }
                }
            } catch {
                // Skip inaccessible directories
            }
        }
    } catch {
        // Return empty array if scanning fails
    }

    // Sort versions in descending order (newest first)
    return versions.sort((a, b) => {
        const versionA = extractVersionNumber(a);
        const versionB = extractVersionNumber(b);
        return versionB.localeCompare(versionA, undefined, { numeric: true });
    });
}

/**
 * Extracts version number from directory name
 */
function extractVersionNumber(dirName: string): string {
    const match = dirName.match(/(\d+\.\d+(?:\.\d+)?)/);
    return match ? match[1] : dirName;
}

/**
 * Enhanced installation creator with better detection
 */
function createInstallation(basePath: string, version: string, config: EnvironmentConfig): PhpInstallation | null {
    try {
        const iniPath = buildPath(basePath, config.iniPattern, version);
        const extensionDir = buildPath(basePath, config.extPattern, version);

        // More flexible ini path detection
        let finalIniPath = iniPath;
        if (!fs.existsSync(iniPath)) {
            // Try alternative ini locations
            const alternatives = [
                path.join(path.dirname(iniPath), 'php.ini-development'),
                path.join(path.dirname(iniPath), 'php.ini-production'),
                path.join(basePath, 'php.ini'),
                path.join(basePath, 'conf', 'php.ini')
            ];

            for (const alt of alternatives) {
                if (fs.existsSync(alt)) {
                    finalIniPath = alt;
                    break;
                }
            }

            // If still no ini file found, skip this installation
            if (!fs.existsSync(finalIniPath)) return null;
        }

        // Find PHP executable with enhanced patterns
        const phpExecutable = findPhpExecutable(basePath, version, config);
        if (!phpExecutable) return null;

        // Get comprehensive PHP info
        const phpInfo = getPhpInfoFromExecutable(phpExecutable);
        const detectedVersion = phpInfo?.version || version || 'unknown';

        return {
            version: detectedVersion,
            path: basePath,
            iniPath: finalIniPath,
            extensionDir,
            environment: config.name,
            phpExecutable,
            isActive: false,
            architecture: phpInfo?.architecture,
            threadSafety: phpInfo?.threadSafety,
            buildDate: phpInfo?.buildDate,
            configureCommand: phpInfo?.configureCommand,
            priority: config.priority
        };
    } catch {
        return null;
    }
}

/**
 * Enhanced path builder with smart replacements
 */
function buildPath(basePath: string, pattern: string[], version: string): string {
    const parts = pattern.map(part => {
        let result = part;

        // Replace version placeholders
        result = result.replace('{version}', version);
        result = result.replace('*', version);

        // Handle php{version} pattern (like php8.2)
        if (result.includes('php{') || result.includes('php*')) {
            result = result.replace('php{version}', `php${version}`);
            result = result.replace('php*', `php${version}`);
        }

        return result;
    });

    return path.join(basePath, ...parts);
}

/**
 * Enhanced PHP executable finder with comprehensive search patterns
 */
function findPhpExecutable(basePath: string, version: string, config: EnvironmentConfig): string {
    // Build paths from config patterns first
    const configPaths: string[] = [];
    if (config.phpExePattern) {
        configPaths.push(buildPath(basePath, config.phpExePattern, version));
    }

    // Common PHP executable locations
    const possiblePaths = [
        ...configPaths,
        path.join(basePath, 'php.exe'),
        path.join(basePath, 'bin', 'php.exe'),
        path.join(basePath, 'php', version, 'php.exe'),
        path.join(basePath, 'php', `php${version}`, 'php.exe'),
        path.join(basePath, 'bin', 'php', `php${version}`, 'php.exe'),
        path.join(basePath, 'sym', 'php.exe'),
        path.join(basePath, 'core', `php${version}`, 'php.exe'),
        path.join(basePath, version, 'php.exe'),
        path.join(basePath, `php-${version}`, 'php.exe')
    ];

    for (const phpPath of possiblePaths) {
        if (fs.existsSync(phpPath)) {
            return phpPath;
        }
    }

    // Deep search in the base directory
    return findPhpExecutableInDir(basePath);
}

/**
 * Recursively searches for PHP executable in a directory (cross-platform)
 */
function findPhpExecutableInDir(dir: string, maxDepth: number = 2, currentDepth: number = 0): string {
    if (currentDepth >= maxDepth || !fs.existsSync(dir)) {
        return '';
    }

    try {
        const isWindows = process.platform === 'win32';
        const phpExeName = isWindows ? 'php.exe' : 'php';
        const phpExePath = path.join(dir, phpExeName);

        if (fs.existsSync(phpExePath)) {
            return phpExePath;
        }

        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            try {
                if (fs.statSync(fullPath).isDirectory()) {
                    const found = findPhpExecutableInDir(fullPath, maxDepth, currentDepth + 1);
                    if (found) return found;
                }
            } catch {
                // Skip inaccessible directories
            }
        }
    } catch {
        // Directory not accessible
    }

    return '';
}

/**
 * Determines the appropriate paths for php.ini and extensions directory.
 * Enhanced version with intelligent matching and fallbacks.
 */
export function determinePhpIniPaths(version: string = ''): PhpPaths {
    const installations = scanPhpInstallations();

    if (installations.length === 0) {
        throw new Error('No PHP installations found. Please install PHP or set environment variables.');
    }

    // If version specified, find best matching installation
    if (version) {
        // Try exact version match first
        let matching = installations.find(inst => inst.version === version);

        // Try version prefix match
        if (!matching) {
            matching = installations.find(inst => inst.version.startsWith(version));
        }

        // Try partial version match
        if (!matching) {
            matching = installations.find(inst => inst.version.includes(version));
        }

        // Try path-based match
        if (!matching) {
            matching = installations.find(inst =>
                inst.path.toLowerCase().includes(version.toLowerCase())
            );
        }

        if (matching) {
            return {
                iniPath: matching.iniPath,
                extensionDir: matching.extensionDir
            };
        }
    }

    // Return highest priority installation (active or first)
    const activeInstallation = installations.find(inst => inst.isActive);
    const selectedInstallation = activeInstallation || installations[0];

    return {
        iniPath: selectedInstallation.iniPath,
        extensionDir: selectedInstallation.extensionDir
    };
}

/**
 * Gets detailed detection results including active and system PHP
 */
export function getDetailedPhpDetection(): DetectionResult {
    const installations = scanPhpInstallations();

    const activePhp = installations.find(inst => inst.isActive);
    const systemPhp = installations.find(inst => inst.environment === 'System PATH');

    return {
        installations,
        activePhp,
        systemPhp
    };
}

/**
 * Validates a PHP installation with automatic permission handling
 */
export function validatePhpInstallation(installation: PhpInstallation): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
    needsSudo: boolean;
} {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let needsSudo = false;

    // Check PHP executable
    if (!installation.phpExecutable || !fs.existsSync(installation.phpExecutable)) {
        issues.push('PHP executable not found');
        suggestions.push('Reinstall PHP or check installation integrity');
    }

    // Check php.ini
    if (!installation.iniPath || !fs.existsSync(installation.iniPath)) {
        issues.push('php.ini file not found');
        suggestions.push('Create php.ini file or copy from php.ini-development');
    }

    // Check extension directory
    if (!installation.extensionDir || !fs.existsSync(installation.extensionDir)) {
        issues.push('Extension directory not found');
        suggestions.push('Check PHP installation or create extensions directory');
    }

    // Check if php.ini is writable (with automatic permission handling for Unix)
    if (installation.iniPath && fs.existsSync(installation.iniPath)) {
        try {
            fs.accessSync(installation.iniPath, fs.constants.W_OK);
        } catch {
            const isUnix = process.platform !== 'win32';
            if (isUnix) {
                // On Unix systems, we can use sudo
                needsSudo = true;
                console.log(`${colors.yellow}ℹ️  php.ini requires elevated permissions - will use sudo automatically${colors.reset}`);
            } else {
                issues.push('php.ini file is not writable');
                suggestions.push('Run as administrator or change file permissions');
            }
        }
    }

    return {
        isValid: issues.length === 0,
        issues,
        suggestions,
        needsSudo
    };
}

/**
 * Finds the best PHP installation for a specific use case
 */
export function findBestPhpInstallation(criteria: {
    version?: string;
    environment?: string;
    minVersion?: string;
    architecture?: string;
    threadSafety?: boolean;
}): PhpInstallation | null {
    const installations = scanPhpInstallations();

    let candidates = installations;

    // Filter by criteria
    if (criteria.version) {
        candidates = candidates.filter(inst =>
            inst.version.startsWith(criteria.version!) ||
            inst.version.includes(criteria.version!)
        );
    }

    if (criteria.environment) {
        candidates = candidates.filter(inst =>
            inst.environment.toLowerCase().includes(criteria.environment!.toLowerCase())
        );
    }

    if (criteria.minVersion) {
        candidates = candidates.filter(inst =>
            inst.version.localeCompare(criteria.minVersion!, undefined, { numeric: true }) >= 0
        );
    }

    if (criteria.architecture) {
        candidates = candidates.filter(inst =>
            inst.architecture?.toLowerCase().includes(criteria.architecture!.toLowerCase())
        );
    }

    if (criteria.threadSafety !== undefined) {
        candidates = candidates.filter(inst => inst.threadSafety === criteria.threadSafety);
    }

    // Return highest priority candidate
    return candidates.length > 0 ? candidates[0] : null;
}
