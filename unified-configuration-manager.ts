#!/usr/bin/env bun

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { IntelligentPresetManager } from './intelligent-preset-manager.js';
import { EnhancedExtensionManager } from './enhanced-extension-manager.js';

/**
 * Unified Configuration Manager
 * Two distinct modes: Preset (framework-based) and Manual (extension-by-extension)
 */

class UnifiedConfigurationManager {
  
  async initialize() {
    console.clear();
    
    // Beautiful banner
    const banner = figlet.textSync('PHP CONFIG PRO', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted'
    });
    
    console.log(gradient.rainbow(banner));
    
    console.log(boxen(
      chalk.white.bold('🚀 Ultimate PHP Configuration Manager\n') +
      chalk.gray('Choose your preferred configuration approach\n') +
      chalk.cyan('🎯 Smart Presets • 🧩 Manual Control • 🛡️ Always Safe'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: 'black'
      }
    ));
  }

  async showMainMenu() {
    const choices = [
      new inquirer.Separator(chalk.green.bold('🎯 SMART PRESET MODE (Recommended for most users)')),
      {
        name: '🔥 Framework Presets - Laravel, WordPress, Symfony, etc.',
        value: 'preset_mode',
        short: 'Framework Presets'
      },
      {
        name: '⚡ Quick Setup - Development, Production, Performance',
        value: 'environment_preset',
        short: 'Environment Presets'
      },
      
      new inquirer.Separator(chalk.blue.bold('🧩 MANUAL EXTENSION MODE (For advanced users)')),
      {
        name: '🔍 Browse Extensions by Category - Network, Database, Graphics, etc.',
        value: 'browse_extensions',
        short: 'Browse Extensions'
      },
      {
        name: '⭐ Popular Extensions - Most used PHP extensions',
        value: 'popular_extensions',
        short: 'Popular Extensions'
      },
      {
        name: '🔎 Search Extensions - Find specific extensions',
        value: 'search_extensions',
        short: 'Search Extensions'
      },
      {
        name: '🎯 Framework-Specific Extensions - Extensions for your framework',
        value: 'framework_extensions',
        short: 'Framework Extensions'
      },
      
      new inquirer.Separator(chalk.yellow.bold('🛠️ ADVANCED TOOLS')),
      {
        name: '🩺 PHP Doctor - Auto-fix configuration issues',
        value: 'php_doctor',
        short: 'PHP Doctor'
      },
      {
        name: '📊 View Current Configuration - See what\'s enabled',
        value: 'view_config',
        short: 'View Config'
      },
      {
        name: '💾 Backup Management - Manage INI backups',
        value: 'backup_management',
        short: 'Backup Management'
      },
      
      new inquirer.Separator(),
      {
        name: '❌ Exit',
        value: 'exit',
        short: 'Exit'
      }
    ];

    const { selectedMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedMode',
        message: '🚀 How would you like to configure PHP?',
        choices,
        pageSize: 20
      }
    ]);

    return selectedMode;
  }

  async showModeExplanation() {
    console.log(boxen(
      chalk.cyan.bold('🎯 PRESET MODE vs 🧩 MANUAL MODE\n\n') +
      
      chalk.green.bold('🎯 PRESET MODE (Recommended)\n') +
      chalk.white('Perfect for: Beginners, quick setup, standard configurations\n') +
      chalk.gray('• One-click framework optimization (Laravel, WordPress, etc.)\n') +
      chalk.gray('• Pre-configured extension bundles\n') +
      chalk.gray('• Optimized settings for your specific use case\n') +
      chalk.gray('• No technical knowledge required\n') +
      chalk.gray('• Safe, tested configurations\n\n') +
      
      chalk.blue.bold('🧩 MANUAL MODE (Advanced)\n') +
      chalk.white('Perfect for: Advanced users, custom setups, learning\n') +
      chalk.gray('• Choose individual extensions with detailed info\n') +
      chalk.gray('• Learn what each extension does\n') +
      chalk.gray('• See code examples and use cases\n') +
      chalk.gray('• Fine-grained control over configuration\n') +
      chalk.gray('• Educational approach to PHP configuration\n\n') +
      
      chalk.yellow('💡 You can always switch between modes!'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    ));

    const { showMenu } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'showMenu',
        message: 'Ready to choose your configuration mode?',
        default: true
      }
    ]);

    return showMenu;
  }

  async handlePresetMode() {
    console.log(boxen(
      chalk.green.bold('🎯 PRESET MODE ACTIVATED\n\n') +
      chalk.white('You\'ll get framework-optimized configurations with:\n') +
      chalk.gray('• All necessary extensions pre-selected\n') +
      chalk.gray('• Performance settings optimized for your framework\n') +
      chalk.gray('• Security settings configured\n') +
      chalk.gray('• Best practices automatically applied\n\n') +
      chalk.cyan('Perfect for Laravel, WordPress, Symfony, and more!'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));

    const manager = new IntelligentPresetManager();
    await manager.run();
  }

  async handleManualMode() {
    console.log(boxen(
      chalk.blue.bold('🧩 MANUAL MODE ACTIVATED\n\n') +
      chalk.white('You\'ll get detailed control with:\n') +
      chalk.gray('• Individual extension information and examples\n') +
      chalk.gray('• Performance and security impact details\n') +
      chalk.gray('• Framework compatibility information\n') +
      chalk.gray('• Pro tips and best practices\n') +
      chalk.gray('• Code examples for each extension\n\n') +
      chalk.cyan('Perfect for learning and custom configurations!'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    ));

    const manager = new EnhancedExtensionManager();
    await manager.run();
  }

  async handleAdvancedTools(tool: string) {
    switch (tool) {
      case 'php_doctor':
        console.log(chalk.cyan('🩺 Launching PHP Doctor...'));
        // Import and run PHP doctor tools
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
          await execAsync('bun run doctor');
        } catch (error) {
          console.error(chalk.red('❌ PHP Doctor failed:', error.message));
        }
        break;
        
      case 'view_config':
        console.log(chalk.cyan('📊 Viewing current configuration...'));
        // Implementation for viewing config
        break;
        
      case 'backup_management':
        console.log(chalk.cyan('💾 Managing backups...'));
        // Implementation for backup management
        break;
    }
  }

  async run() {
    try {
      await this.initialize();
      
      // Show explanation of modes
      const showMenu = await this.showModeExplanation();
      if (!showMenu) return;

      while (true) {
        const selectedMode = await this.showMainMenu();
        
        switch (selectedMode) {
          case 'preset_mode':
          case 'environment_preset':
            await this.handlePresetMode();
            break;
            
          case 'browse_extensions':
          case 'popular_extensions':
          case 'search_extensions':
          case 'framework_extensions':
            await this.handleManualMode();
            break;
            
          case 'php_doctor':
          case 'view_config':
          case 'backup_management':
            await this.handleAdvancedTools(selectedMode);
            break;
            
          case 'exit':
            console.log(chalk.green('👋 Thank you for using PHP Config Pro!'));
            return;
        }
        
        // Ask if user wants to continue
        const { continueConfig } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueConfig',
            message: 'Would you like to perform another configuration?',
            default: true
          }
        ]);
        
        if (!continueConfig) {
          console.log(chalk.green('👋 Configuration complete! Your PHP is optimized.'));
          break;
        }
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
    }
  }
}

export { UnifiedConfigurationManager };
