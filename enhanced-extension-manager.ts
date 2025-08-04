#!/usr/bin/env bun

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import fs from 'fs-extra';
import { 
  EXTENSION_DATABASE, 
  EXTENSION_CATEGORIES, 
  ExtensionInfo,
  getExtensionsByCategory,
  searchExtensions,
  getPopularExtensions,
  getFrameworkExtensions
} from './extension-database.js';
import { detectAllPhpEnvironments } from './phpEnvironmentUtils.js';
import { backupPhpIni, enableExtensions } from './phpIniManager.js';

/**
 * Enhanced Extension Manager with detailed single extension information
 */

class EnhancedExtensionManager {
  private environments: any[] = [];
  private selectedEnvironment: any = null;

  async initialize() {
    console.clear();
    
    // Beautiful banner
    const banner = figlet.textSync('PHP EXTENSIONS', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted'
    });
    
    console.log(gradient.rainbow(banner));
    
    console.log(boxen(
      chalk.white.bold('🧩 Enhanced PHP Extension Manager\n') +
      chalk.gray('Detailed information and smart management for PHP extensions\n') +
      chalk.cyan('📚 Educational • 🎯 Precise • 🛡️ Safe • ⚡ Fast'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: 'black'
      }
    ));

    // Detect PHP environments
    const spinner = ora('🔍 Scanning for PHP installations...').start();
    try {
      this.environments = await detectAllPhpEnvironments();
      spinner.succeed(`✅ Found ${this.environments.length} PHP installation(s)`);
    } catch (error) {
      spinner.fail('❌ Failed to detect PHP environments');
      throw error;
    }
  }

  async selectEnvironment() {
    if (this.environments.length === 1) {
      this.selectedEnvironment = this.environments[0];
      return this.selectedEnvironment;
    }

    const choices = this.environments.map(env => ({
      name: `${env.status === 'active' ? '✅' : '❌'} ${env.name} (PHP ${env.version}) - ${env.status}`,
      value: env,
      short: env.name
    }));

    const { selectedEnv } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedEnv',
        message: '🎯 Select PHP environment:',
        choices
      }
    ]);

    this.selectedEnvironment = selectedEnv;
    return selectedEnv;
  }

  async showMainMenu() {
    const choices = [
      {
        name: '🔍 Browse Extensions by Category',
        value: 'browse_category',
        short: 'Browse by Category'
      },
      {
        name: '⭐ Popular Extensions',
        value: 'popular',
        short: 'Popular Extensions'
      },
      {
        name: '🔎 Search Extensions',
        value: 'search',
        short: 'Search Extensions'
      },
      {
        name: '🎯 Framework-Specific Extensions',
        value: 'framework',
        short: 'Framework Extensions'
      },
      {
        name: '📋 Bulk Extension Management',
        value: 'bulk',
        short: 'Bulk Management'
      },
      new inquirer.Separator(),
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        short: 'Back'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '🧩 What would you like to do?',
        choices,
        pageSize: 10
      }
    ]);

    return action;
  }

  async browseByCategory() {
    const categories = Object.keys(EXTENSION_CATEGORIES);
    const choices = categories.map(category => {
      const extensions = getExtensionsByCategory(category);
      const icons = {
        'Network & HTTP': '🌐',
        'Database': '🗄️',
        'Text & Encoding': '🌍',
        'Security & Encryption': '🔐',
        'Graphics & Media': '🖼️',
        'File & Archive': '📦',
        'Caching & Performance': '⚡',
        'Development & Debugging': '🐛',
        'XML & Data': '📄',
        'Math & Science': '🔢',
        'System & Process': '⚙️'
      };
      
      return {
        name: `${icons[category] || '📦'} ${category} (${extensions.length} extensions)`,
        value: category,
        short: category
      };
    });

    const { selectedCategory } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCategory',
        message: '📂 Select extension category:',
        choices,
        pageSize: 12
      }
    ]);

    await this.showCategoryExtensions(selectedCategory);
  }

  async showCategoryExtensions(category: string) {
    const extensions = getExtensionsByCategory(category);
    
    if (extensions.length === 0) {
      console.log(chalk.yellow('⚠️ No extensions found in this category'));
      return;
    }

    const choices = extensions.map(ext => ({
      name: `${ext.icon} ${ext.displayName} - ${ext.description.substring(0, 60)}...`,
      value: ext.name,
      short: ext.displayName
    }));

    choices.push(new inquirer.Separator());
    choices.push({
      name: '🔙 Back to Categories',
      value: 'back',
      short: 'Back'
    });

    const { selectedExtension } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedExtension',
        message: `📦 ${category} Extensions:`,
        choices,
        pageSize: 15
      }
    ]);

    if (selectedExtension === 'back') {
      await this.browseByCategory();
      return;
    }

    await this.showExtensionDetails(selectedExtension);
  }

  async showExtensionDetails(extensionName: string) {
    const ext = EXTENSION_DATABASE[extensionName];
    if (!ext) {
      console.log(chalk.red('❌ Extension not found'));
      return;
    }

    // Performance indicator
    const performanceColors = {
      'low': chalk.red,
      'medium': chalk.yellow,
      'high': chalk.green
    };

    // Security indicator
    const securityColors = {
      'safe': chalk.green,
      'caution': chalk.yellow,
      'risk': chalk.red
    };

    // Size indicator
    const sizeIcons = {
      'small': '📦',
      'medium': '📫',
      'large': '📮'
    };

    console.log(boxen(
      chalk.cyan.bold(`${ext.icon} ${ext.displayName}\n\n`) +
      chalk.white(`📝 ${ext.description}\n\n`) +
      
      chalk.yellow('📊 Extension Information:\n') +
      chalk.gray(`  • Category: ${ext.category}\n`) +
      chalk.gray(`  • PHP Versions: ${ext.phpVersions}\n`) +
      chalk.gray(`  • Performance Impact: ${performanceColors[ext.performance](ext.performance.toUpperCase())}\n`) +
      chalk.gray(`  • Security Level: ${securityColors[ext.security](ext.security.toUpperCase())}\n`) +
      chalk.gray(`  • Size: ${sizeIcons[ext.size]} ${ext.size.toUpperCase()}\n`) +
      chalk.gray(`  • Popularity: ${'⭐'.repeat(Math.min(ext.popularity, 5))} (${ext.popularity}/10)\n\n`) +
      
      chalk.yellow('🎯 Use Cases:\n') +
      chalk.gray(ext.useCase.map(use => `  • ${use}`).join('\n')) + '\n\n' +
      
      chalk.yellow('🔧 Compatible Frameworks:\n') +
      chalk.gray(ext.frameworks.map(fw => `  • ${fw}`).join('\n')) + '\n\n' +
      
      (ext.dependencies.length > 0 ? 
        chalk.yellow('📋 Dependencies:\n') +
        chalk.gray(ext.dependencies.map(dep => `  • ${dep}`).join('\n')) + '\n\n' : '') +
      
      (ext.conflicts.length > 0 ? 
        chalk.red('⚠️ Conflicts with:\n') +
        chalk.gray(ext.conflicts.map(conf => `  • ${conf}`).join('\n')) + '\n\n' : '') +
      
      chalk.yellow('💡 Pro Tips:\n') +
      chalk.gray(ext.tips.map(tip => `  • ${tip}`).join('\n')),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    ));

    // Show code examples if available
    if (ext.examples.length > 0) {
      console.log(boxen(
        chalk.green.bold('💻 Code Examples:\n\n') +
        chalk.white(ext.examples.map((example, index) => 
          `${index + 1}. ${chalk.cyan(example)}`
        ).join('\n')),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'green'
        }
      ));
    }

    await this.showExtensionActions(ext);
  }

  async showExtensionActions(ext: ExtensionInfo) {
    const choices = [
      {
        name: `✅ Enable ${ext.displayName}`,
        value: 'enable',
        short: 'Enable'
      },
      {
        name: `❌ Disable ${ext.displayName}`,
        value: 'disable',
        short: 'Disable'
      },
      {
        name: '📚 View Documentation',
        value: 'docs',
        short: 'Documentation'
      },
      {
        name: '🔍 Check Current Status',
        value: 'status',
        short: 'Status'
      },
      new inquirer.Separator(),
      {
        name: '🔙 Back to Extension List',
        value: 'back',
        short: 'Back'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `🛠️ What would you like to do with ${ext.displayName}?`,
        choices
      }
    ]);

    switch (action) {
      case 'enable':
        await this.enableExtension(ext);
        break;
      case 'disable':
        await this.disableExtension(ext);
        break;
      case 'docs':
        console.log(chalk.cyan(`📚 Documentation: ${ext.documentation}`));
        await this.showExtensionActions(ext);
        break;
      case 'status':
        await this.checkExtensionStatus(ext);
        await this.showExtensionActions(ext);
        break;
      case 'back':
        return;
    }
  }

  async enableExtension(ext: ExtensionInfo) {
    if (!this.selectedEnvironment) {
      await this.selectEnvironment();
    }

    // Show warnings if any
    if (ext.conflicts.length > 0) {
      console.log(boxen(
        chalk.yellow.bold('⚠️ Warning: Potential Conflicts\n\n') +
        chalk.white(`${ext.displayName} may conflict with:\n`) +
        chalk.gray(ext.conflicts.map(conf => `  • ${conf}`).join('\n')) + '\n\n' +
        chalk.white('Please ensure these extensions are not enabled simultaneously.'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'yellow'
        }
      ));

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Do you want to proceed anyway?',
          default: false
        }
      ]);

      if (!proceed) {
        console.log(chalk.yellow('⚠️ Extension enabling cancelled'));
        return;
      }
    }

    // Check dependencies
    if (ext.dependencies.length > 0) {
      console.log(boxen(
        chalk.blue.bold('📋 Dependencies Required\n\n') +
        chalk.white(`${ext.displayName} requires:\n`) +
        chalk.gray(ext.dependencies.map(dep => `  • ${dep}`).join('\n')) + '\n\n' +
        chalk.white('Please ensure these are installed on your system.'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'blue'
        }
      ));
    }

    const spinner = ora(`🧩 Enabling ${ext.displayName}...`).start();
    
    try {
      // Create backup first
      await backupPhpIni(this.selectedEnvironment.iniPath);
      
      // Enable the extension
      await enableExtensions(
        this.selectedEnvironment.iniPath, 
        [ext.name], 
        this.selectedEnvironment.extensionDir
      );
      
      spinner.succeed(`✅ ${ext.displayName} enabled successfully`);
      
      // Show success message with tips
      console.log(boxen(
        chalk.green.bold(`🎉 ${ext.displayName} Enabled!\n\n`) +
        chalk.white('💡 Next steps:\n') +
        chalk.gray(ext.tips.slice(0, 3).map(tip => `  • ${tip}`).join('\n')) + '\n\n' +
        chalk.cyan('🔄 Restart your web server to apply changes'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'green'
        }
      ));
      
    } catch (error) {
      spinner.fail(`❌ Failed to enable ${ext.displayName}`);
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }

  async disableExtension(ext: ExtensionInfo) {
    // Implementation for disabling extension
    console.log(chalk.yellow(`⚠️ Disabling ${ext.displayName} - Feature coming soon`));
  }

  async checkExtensionStatus(ext: ExtensionInfo) {
    if (!this.selectedEnvironment) {
      await this.selectEnvironment();
    }

    const spinner = ora(`🔍 Checking ${ext.displayName} status...`).start();
    
    try {
      const content = await fs.readFile(this.selectedEnvironment.iniPath, 'utf8');
      const isEnabled = content.includes(`extension=${ext.name}`) && 
                       !content.includes(`;extension=${ext.name}`);
      
      spinner.succeed(`✅ Status checked`);
      
      console.log(boxen(
        chalk.cyan.bold(`📊 ${ext.displayName} Status\n\n`) +
        chalk.white(`Environment: ${this.selectedEnvironment.name}\n`) +
        chalk.white(`Status: ${isEnabled ? chalk.green('✅ ENABLED') : chalk.red('❌ DISABLED')}\n`) +
        chalk.white(`INI File: ${this.selectedEnvironment.iniPath}`),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: isEnabled ? 'green' : 'red'
        }
      ));
      
    } catch (error) {
      spinner.fail(`❌ Failed to check status`);
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.selectEnvironment();
      
      while (true) {
        const action = await this.showMainMenu();
        
        if (action === 'back') {
          break;
        }
        
        switch (action) {
          case 'browse_category':
            await this.browseByCategory();
            break;
          case 'popular':
            await this.showPopularExtensions();
            break;
          case 'search':
            await this.searchExtensions();
            break;
          case 'framework':
            await this.showFrameworkExtensions();
            break;
          case 'bulk':
            console.log(chalk.yellow('📋 Bulk management - Feature coming soon'));
            break;
        }
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
    }
  }

  async showPopularExtensions() {
    const extensions = getPopularExtensions();
    
    const choices = extensions.map(ext => ({
      name: `${ext.icon} ${ext.displayName} ${'⭐'.repeat(Math.min(ext.popularity, 5))} - ${ext.description.substring(0, 50)}...`,
      value: ext.name,
      short: ext.displayName
    }));

    choices.push(new inquirer.Separator());
    choices.push({
      name: '🔙 Back to Main Menu',
      value: 'back',
      short: 'Back'
    });

    const { selectedExtension } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedExtension',
        message: '⭐ Popular PHP Extensions:',
        choices,
        pageSize: 12
      }
    ]);

    if (selectedExtension !== 'back') {
      await this.showExtensionDetails(selectedExtension);
    }
  }

  async searchExtensions() {
    const { query } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: '🔎 Search extensions (name, description, or use case):',
        validate: (input) => input.length > 0 || 'Please enter a search term'
      }
    ]);

    const results = searchExtensions(query);
    
    if (results.length === 0) {
      console.log(chalk.yellow(`⚠️ No extensions found matching "${query}"`));
      return;
    }

    const choices = results.map(ext => ({
      name: `${ext.icon} ${ext.displayName} - ${ext.description.substring(0, 60)}...`,
      value: ext.name,
      short: ext.displayName
    }));

    choices.push(new inquirer.Separator());
    choices.push({
      name: '🔙 Back to Main Menu',
      value: 'back',
      short: 'Back'
    });

    const { selectedExtension } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedExtension',
        message: `🔎 Search Results for "${query}" (${results.length} found):`,
        choices,
        pageSize: 12
      }
    ]);

    if (selectedExtension !== 'back') {
      await this.showExtensionDetails(selectedExtension);
    }
  }

  async showFrameworkExtensions() {
    const frameworks = ['Laravel', 'WordPress', 'Symfony', 'CodeIgniter', 'Drupal', 'Magento'];
    
    const { selectedFramework } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFramework',
        message: '🎯 Select framework:',
        choices: frameworks.map(fw => ({
          name: fw,
          value: fw
        }))
      }
    ]);

    const extensions = getFrameworkExtensions(selectedFramework);
    
    const choices = extensions.map(ext => ({
      name: `${ext.icon} ${ext.displayName} - ${ext.description.substring(0, 60)}...`,
      value: ext.name,
      short: ext.displayName
    }));

    choices.push(new inquirer.Separator());
    choices.push({
      name: '🔙 Back to Main Menu',
      value: 'back',
      short: 'Back'
    });

    const { selectedExtension } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedExtension',
        message: `🎯 ${selectedFramework} Extensions:`,
        choices,
        pageSize: 12
      }
    ]);

    if (selectedExtension !== 'back') {
      await this.showExtensionDetails(selectedExtension);
    }
  }
}

export { EnhancedExtensionManager };
