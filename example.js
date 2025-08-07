#!/usr/bin/env node

// Enhanced example showcasing php-ini-automation v2.0 features

import { scanPhpInstallations, updatePhpIni } from './dist/index.js';

async function demonstrateFeatures() {
    console.log('🚀 PHP INI Automation v2.0 - Enhanced Features Demo\n');

    // Example 1: Scan for PHP installations
    console.log('📝 Example 1: Scanning for PHP installations');
    try {
        const installations = scanPhpInstallations();
        if (installations.length > 0) {
            console.log(`✅ Found ${installations.length} PHP installation(s):`);
            installations.forEach((install, index) => {
                console.log(`   ${index + 1}. ${install.environment} PHP ${install.version} at ${install.path}`);
            });
        } else {
            console.log('ℹ️  No PHP installations detected');
        }
    } catch (error) {
        console.log('❌ Error scanning:', error.message);
    }
    console.log('');

    // Example 2: Non-interactive update
    console.log('📝 Example 2: Non-interactive PHP configuration');
    try {
        await updatePhpIni('', false); // Non-interactive mode
        console.log('✅ Configuration completed successfully!\n');
    } catch (error) {
        console.log('ℹ️  Configuration result:', error.message);
        console.log('💡 This is expected if no PHP installation is found\n');
    }

    // Example 3: Custom settings example
    console.log('📝 Example 3: Custom PHP settings');
    console.log('You can customize PHP settings like this:');
    console.log(`
    import { customizePhpIni } from 'php-ini-automation';

    await customizePhpIni('/path/to/php.ini', '/path/to/ext', {
        memory_limit: '1G',
        max_execution_time: 300,
        'opcache.enable': 1,
        'xdebug.mode': 'debug'
    });
    `);

    // Example 4: CLI usage examples
    console.log('📝 Example 4: CLI Usage Examples');
    console.log('Command line usage:');
    console.log('   php-ini-automation              # Auto-detect and configure');
    console.log('   php-ini-automation 8.2          # Configure specific version');
    console.log('   php-ini-automation --list       # List installations');
    console.log('   php-ini-automation --help       # Show help');
    console.log('   php-ini-automation --non-interactive  # No prompts');

    console.log('\n🎯 New Features in v2.0:');
    console.log('   ✅ Automatic PHP detection across multiple environments');
    console.log('   ✅ Interactive installation selection');
    console.log('   ✅ Professional CLI with colors and formatting');
    console.log('   ✅ Detailed extension and settings reporting');
    console.log('   ✅ Automatic backup creation');
    console.log('   ✅ Enhanced error handling and troubleshooting');
    console.log('   ✅ Support for optional extensions');
    console.log('   ✅ Optimized Laravel development settings');

    console.log('\n🌟 Supported Environments:');
    console.log('   • Laragon (multi-version support)');
    console.log('   • XAMPP (single version)');
    console.log('   • WAMP (multi-version support)');
    console.log('   • PVM (PHP Version Manager)');
    console.log('   • Custom PHP installations');
}

demonstrateFeatures().catch(console.error);
