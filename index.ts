#!/usr/bin/env node

import fs from 'fs-extra';
import { createInterface } from 'readline';
import { determinePhpIniPaths, PhpInstallation, scanPhpInstallations, validatePhpInstallation } from './phpEnvironmentUtils';
import { customizePhpIni, validateSourceFile } from './phpIniManager';

// ANSI color codes for better CLI experience
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

/**
 * Displays a formatted header
 */
function displayHeader(): void {
    console.log(`${colors.cyan}${colors.bright}`);
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    PHP INI AUTOMATION                       ║');
    console.log('║              Professional PHP Configuration Tool             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}\n`);
}

/**
 * Displays detected PHP installations in an enhanced formatted table
 */
function displayPhpInstallations(installations: PhpInstallation[]): void {
    console.log(`${colors.bright}${colors.green}✅ Found ${installations.length} PHP installation(s):${colors.reset}\n`);

    console.log(`${colors.bright}┌─────┬─────────────┬──────────────────┬─────────────────────────────────────────────────┬────────┐${colors.reset}`);
    console.log(`${colors.bright}│ No. │   Version   │   Environment    │                    Path                         │ Status │${colors.reset}`);
    console.log(`${colors.bright}├─────┼─────────────┼──────────────────┼─────────────────────────────────────────────────┼────────┤${colors.reset}`);

    installations.forEach((installation, index) => {
        const num = (index + 1).toString().padStart(3);
        const version = installation.version.padEnd(11);
        const env = installation.environment.padEnd(16);
        const installPath = installation.path.length > 45 ?
            '...' + installation.path.slice(-42) :
            installation.path.padEnd(45);

        // Status indicators
        let status = '';
        if (installation.isActive) {
            status = `${colors.green}ACTIVE${colors.reset}`;
        } else if (installation.iniPath && fs.existsSync(installation.iniPath)) {
            status = `${colors.cyan}READY${colors.reset} `;
        } else {
            status = `${colors.yellow}NEEDS${colors.reset} `;
        }

        console.log(`${colors.bright}│ ${num} │ ${colors.yellow}${version}${colors.reset}${colors.bright} │ ${colors.cyan}${env}${colors.reset}${colors.bright} │ ${colors.white}${installPath}${colors.reset}${colors.bright} │ ${status}${colors.bright} │${colors.reset}`);

        // Show additional info for detailed view
        if (installation.architecture || installation.threadSafety !== undefined) {
            const arch = installation.architecture ? ` ${installation.architecture}` : '';
            const ts = installation.threadSafety !== undefined ?
                (installation.threadSafety ? ' TS' : ' NTS') : '';
            const details = `${arch}${ts}`.trim();

            if (details) {
                console.log(`${colors.bright}│     │             │                  │ ${colors.white}${details.padEnd(45)}${colors.reset}${colors.bright} │        │${colors.reset}`);
            }
        }
    });

    console.log(`${colors.bright}└─────┴─────────────┴──────────────────┴─────────────────────────────────────────────────┴────────┘${colors.reset}\n`);

    // Show legend
    console.log(`${colors.bright}Legend:${colors.reset} ${colors.green}ACTIVE${colors.reset} = In system PATH, ${colors.cyan}READY${colors.reset} = Configured, ${colors.yellow}NEEDS${colors.reset} = Needs setup`);
    console.log(`${colors.bright}Info:${colors.reset} TS = Thread Safe, NTS = Non-Thread Safe\n`);
}

/**
 * Prompts user to select a PHP installation
 */
async function selectPhpInstallation(installations: PhpInstallation[]): Promise<PhpInstallation> {
    return new Promise((resolve) => {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const prompt = `${colors.bright}${colors.blue}Select PHP installation (1-${installations.length}) or press Enter for #1: ${colors.reset}`;

        rl.question(prompt, (answer) => {
            rl.close();

            const selection = answer.trim();
            let index = 0;

            if (selection) {
                const num = parseInt(selection);
                if (num >= 1 && num <= installations.length) {
                    index = num - 1;
                } else {
                    console.log(`${colors.yellow}⚠️  Invalid selection. Using first installation.${colors.reset}\n`);
                }
            }

            resolve(installations[index]);
        });
    });
}

/**
 * Enhanced PHP ini update function with better UX
 */
async function updatePhpIni(version: string = '', interactive: boolean = true): Promise<void> {
    displayHeader();

    console.log(`${colors.bright}🔍 Scanning for PHP installations...${colors.reset}`);

    try {
        const installations = scanPhpInstallations();

        if (installations.length === 0) {
            console.log(`${colors.red}${colors.bright}❌ No PHP installations found!${colors.reset}\n`);
            console.log(`${colors.yellow}💡 Suggestions:${colors.reset}`);
            console.log('   • Install PHP using Laragon, XAMPP, or WAMP');
            console.log('   • Set environment variables: LARAGON_PATH, XAMPP_PATH, WAMP_PATH');
            console.log('   • Install PHP manually to C:/php');
            console.log('   • Use: php-ini-automation --help for more options\n');
            process.exit(1);
        }

        displayPhpInstallations(installations);

        let selectedInstallation: PhpInstallation;

        if (version) {
            // Find specific version
            const matching = installations.find(inst =>
                inst.version.startsWith(version) ||
                inst.version.includes(version) ||
                inst.path.includes(version)
            );

            if (matching) {
                selectedInstallation = matching;
                console.log(`${colors.green}✅ Found matching PHP ${version}: ${matching.environment} (${matching.version})${colors.reset}\n`);
            } else {
                console.log(`${colors.yellow}⚠️  PHP ${version} not found. Available installations:${colors.reset}\n`);
                selectedInstallation = interactive ? await selectPhpInstallation(installations) : installations[0];
            }
        } else {
            // Interactive selection or use first
            selectedInstallation = interactive && process.stdin.isTTY ?
                await selectPhpInstallation(installations) :
                installations[0];
        }

        console.log(`${colors.bright}🎯 Selected: ${colors.green}${selectedInstallation.environment} PHP ${selectedInstallation.version}${colors.reset}`);
        console.log(`${colors.bright}📁 INI Path: ${colors.white}${selectedInstallation.iniPath}${colors.reset}`);
        console.log(`${colors.bright}📂 Extensions: ${colors.white}${selectedInstallation.extensionDir}${colors.reset}`);
        console.log(`${colors.bright}🔧 Executable: ${colors.white}${selectedInstallation.phpExecutable}${colors.reset}`);

        // Show additional details
        if (selectedInstallation.architecture) {
            console.log(`${colors.bright}🏗️  Architecture: ${colors.white}${selectedInstallation.architecture}${colors.reset}`);
        }
        if (selectedInstallation.threadSafety !== undefined) {
            const tsStatus = selectedInstallation.threadSafety ? 'Thread Safe' : 'Non-Thread Safe';
            console.log(`${colors.bright}🧵 Thread Safety: ${colors.white}${tsStatus}${colors.reset}`);
        }
        console.log('');

        // Validate installation before proceeding
        console.log(`${colors.bright}🔍 Validating PHP installation...${colors.reset}`);
        const validation = validatePhpInstallation(selectedInstallation);

        if (!validation.isValid) {
            console.log(`${colors.red}❌ Installation validation failed:${colors.reset}`);
            validation.issues.forEach(issue => {
                console.log(`   • ${colors.red}${issue}${colors.reset}`);
            });
            console.log(`\n${colors.yellow}💡 Suggestions:${colors.reset}`);
            validation.suggestions.forEach(suggestion => {
                console.log(`   • ${suggestion}`);
            });
            console.log('');
            process.exit(1);
        }

        console.log(`${colors.green}✅ Installation validation passed${colors.reset}`);

        if (validation.needsSudo) {
            console.log(`${colors.cyan}🔐 Elevated permissions required - using sudo for file operations${colors.reset}`);
        }

        console.log(`${colors.bright}🔧 Customizing php.ini configuration...${colors.reset}`);

        validateSourceFile(selectedInstallation.iniPath, validation.needsSudo);
        await customizePhpIni(selectedInstallation.iniPath, selectedInstallation.extensionDir, {}, validation.needsSudo, selectedInstallation.phpExecutable);

        console.log(`\n${colors.green}${colors.bright}🎉 SUCCESS! PHP configuration updated successfully!${colors.reset}`);
        console.log(`${colors.bright}📋 Summary:${colors.reset}`);
        console.log(`   • Environment: ${selectedInstallation.environment}`);
        console.log(`   • PHP Version: ${selectedInstallation.version}`);
        console.log(`   • Extensions enabled for Laravel development`);
        console.log(`   • Performance settings optimized\n`);

    } catch (error: any) {
        console.log(`\n${colors.red}${colors.bright}❌ Error: ${error.message}${colors.reset}\n`);

        if (error.message.includes('not found')) {
            console.log(`${colors.yellow}💡 Troubleshooting:${colors.reset}`);
            console.log('   • Check if the php.ini file exists');
            console.log('   • Verify PHP installation is complete');
            console.log('   • Try running as administrator');
        }

        process.exit(1);
    }
}

/**
 * Displays version information
 */
function displayVersion(): void {
    const version = '4.1.0'; // Current version
    console.log(`${colors.bright}PHP INI Automation${colors.reset} v${colors.green}${version}${colors.reset}`);
    console.log(`${colors.cyan}Cross-platform PHP configuration tool${colors.reset}\n`);

    console.log(`${colors.bright}Platform:${colors.reset} ${process.platform} ${process.arch}`);
    console.log(`${colors.bright}Node.js:${colors.reset} ${process.version}`);
    console.log(`${colors.bright}Author:${colors.reset} PHP INI Automation Team\n`);

    console.log(`${colors.yellow}💡 Quick commands:${colors.reset}`);
    console.log(`  ${colors.cyan}php-ini-automation${colors.reset}        # Configure PHP`);
    console.log(`  ${colors.cyan}pia${colors.reset}                       # Short alias`);
    console.log(`  ${colors.cyan}pia -l${colors.reset}                    # List installations`);
    console.log(`  ${colors.cyan}pia -v${colors.reset}                    # Show version`);
    console.log(`  ${colors.cyan}pia -h${colors.reset}                    # Show help\n`);
}

/**
 * Displays help information
 */
function displayHelp(): void {
    console.log(`${colors.cyan}${colors.bright}PHP INI Automation - Professional PHP Configuration Tool${colors.reset}\n`);

    console.log(`${colors.bright}USAGE:${colors.reset}`);
    console.log('  php-ini-automation [version] [options]\n');

    console.log(`${colors.bright}EXAMPLES:${colors.reset}`);
    console.log('  php-ini-automation              # Auto-detect and configure PHP');
    console.log('  php-ini-automation 8.2          # Configure specific PHP version');
    console.log('  php-ini-automation --list       # List all detected PHP installations');
    console.log('  php-ini-automation --help       # Show this help\n');

    console.log(`${colors.bright}OPTIONS:${colors.reset}`);
    console.log('  --list, -l         List all detected PHP installations');
    console.log('  --version, -v      Show version information');
    console.log('  --help, -h         Show this help message');
    console.log('  --non-interactive  Run without user prompts\n');

    console.log(`${colors.bright}ENVIRONMENT VARIABLES:${colors.reset}`);
    console.log('  LARAGON_PATH   Path to Laragon installation (e.g., C:/laragon)');
    console.log('  XAMPP_PATH     Path to XAMPP installation (e.g., C:/xampp)');
    console.log('  WAMP_PATH      Path to WAMP installation (e.g., C:/wamp64)');
    console.log('  PVM_PATH       Path to PVM installation (e.g., C:/tools/php)');
    console.log('  DEFAULT_PATH   Path to custom PHP installation (e.g., C:/php)\n');

    console.log(`${colors.bright}FEATURES:${colors.reset}`);
    console.log('  ✅ Auto-detects PHP installations (Laragon, XAMPP, WAMP, PVM)');
    console.log('  ✅ Enables Laravel-required extensions');
    console.log('  ✅ Optimizes performance settings');
    console.log('  ✅ Supports multiple PHP versions');
    console.log('  ✅ Interactive selection interface\n');
}

/**
 * Lists all detected PHP installations
 */
async function listInstallations(): Promise<void> {
    displayHeader();
    console.log(`${colors.bright}🔍 Scanning for PHP installations...${colors.reset}\n`);

    const installations = scanPhpInstallations();

    if (installations.length === 0) {
        console.log(`${colors.red}❌ No PHP installations found.${colors.reset}\n`);
        console.log(`${colors.yellow}💡 Install PHP using Laragon, XAMPP, WAMP, or manually.${colors.reset}`);
        return;
    }

    displayPhpInstallations(installations);

    console.log(`${colors.bright}📋 Installation Details:${colors.reset}\n`);
    installations.forEach((installation, index) => {
        console.log(`${colors.bright}${colors.cyan}[${index + 1}] ${installation.environment} PHP ${installation.version}${colors.reset}`);
        console.log(`    📁 Path: ${installation.path}`);
        console.log(`    📄 INI: ${installation.iniPath}`);
        console.log(`    📂 Extensions: ${installation.extensionDir}`);
        console.log(`    🔧 Executable: ${installation.phpExecutable || 'Not found'}\n`);
    });
}

// Export for programmatic use
export { customizePhpIni, determinePhpIniPaths, scanPhpInstallations, updatePhpIni, validateSourceFile };

// CLI execution - check if this file is being run directly
const isMainModule = process.argv[1] && (
    process.argv[1].endsWith('index.js') ||
    process.argv[1].endsWith('index.ts') ||
    process.argv[1].includes('php-ini-automation')
);

if (isMainModule) {
    const args = process.argv.slice(2);
    const hasHelp = args.includes('--help') || args.includes('-h');
    const hasVersion = args.includes('--version') || args.includes('-v');
    const hasList = args.includes('--list') || args.includes('-l');
    const nonInteractive = args.includes('--non-interactive');

    // Filter out flags to get version
    const phpVersion = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-')) || '';

    if (hasHelp) {
        displayHelp();
    } else if (hasVersion) {
        displayVersion();
    } else if (hasList) {
        listInstallations().catch(console.error);
    } else {
        // Execute the update
        updatePhpIni(phpVersion, !nonInteractive).catch(console.error);
    }
}
