#!/usr/bin/env bun

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import fs from 'fs-extra';
import path from 'path';
import { FRAMEWORK_PRESETS, FrameworkPreset } from './framework-presets.js';
import { detectAllPhpEnvironments } from './phpEnvironmentUtils.js';
import { backupPhpIni, addCustomSettings, enableExtensions } from './phpIniManager.js';

/**
 * Intelligent Preset Manager
 * Smart framework detection and configuration
 */

class IntelligentPresetManager {
  private environments: any[] = [];

  async initialize() {
    console.clear();
    
    // Beautiful banner
    const banner = figlet.textSync('PHP INI PRO', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted'
    });
    
    console.log(gradient.rainbow(banner));
    
    console.log(boxen(
      chalk.white.bold('🧠 Intelligent Framework Configuration Manager\n') +
      chalk.gray('Automatically detect and configure PHP for your specific framework\n') +
      chalk.cyan('✨ Smart • 🚀 Fast • 🛡️ Safe • 🎯 Precise'),
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

  async detectFramework(projectPath?: string): Promise<string[]> {
    const detectedFrameworks: string[] = [];
    const searchPath = projectPath || process.cwd();

    const detectionRules = {
      laravel: [
        'artisan',
        'composer.json',
        'app/Http/Kernel.php',
        'config/app.php',
        'bootstrap/app.php'
      ],
      wordpress: [
        'wp-config.php',
        'wp-content',
        'wp-includes',
        'wp-admin',
        'index.php'
      ],
      codeigniter: [
        'system/CodeIgniter.php',
        'application/config',
        'index.php',
        'composer.json'
      ],
      symfony: [
        'symfony.lock',
        'config/bundles.php',
        'src/Kernel.php',
        'composer.json',
        'bin/console'
      ],
      drupal: [
        'core/INSTALL.txt',
        'sites/default',
        'modules',
        'themes',
        'composer.json'
      ],
      magento: [
        'app/etc/di.xml',
        'bin/magento',
        'composer.json',
        'pub/index.php',
        'setup'
      ]
    };

    for (const [framework, files] of Object.entries(detectionRules)) {
      let matches = 0;
      for (const file of files) {
        if (await fs.pathExists(path.join(searchPath, file))) {
          matches++;
        }
      }
      
      // If we find at least 60% of the signature files, consider it detected
      if (matches >= Math.ceil(files.length * 0.6)) {
        detectedFrameworks.push(framework);
      }
    }

    return detectedFrameworks;
  }

  async showPresetMenu() {
    const categories = {
      'detected': '🎯 Auto-Detected Frameworks',
      'frameworks': '🔥 Popular Frameworks',
      'cms': '📝 Content Management',
      'ecommerce': '🛒 E-commerce',
      'environment': '🛠️ Environment Types'
    };

    // Try to detect frameworks in current directory
    const detectedFrameworks = await this.detectFramework();
    
    const choices: any[] = [];

    // Add detected frameworks first
    if (detectedFrameworks.length > 0) {
      choices.push(new inquirer.Separator(chalk.green.bold('🎯 AUTO-DETECTED IN CURRENT DIRECTORY')));
      detectedFrameworks.forEach(framework => {
        const preset = FRAMEWORK_PRESETS[framework];
        if (preset) {
          choices.push({
            name: `${preset.icon} ${preset.name} ${chalk.green('(DETECTED)')} - ${preset.description}`,
            value: framework,
            short: preset.name
          });
        }
      });
      choices.push(new inquirer.Separator(' '));
    }

    // Add framework categories
    choices.push(new inquirer.Separator(chalk.cyan.bold('🔥 POPULAR FRAMEWORKS')));
    ['laravel', 'symfony', 'codeigniter'].forEach(key => {
      const preset = FRAMEWORK_PRESETS[key];
      if (!detectedFrameworks.includes(key)) {
        choices.push({
          name: `${preset.icon} ${preset.name} - ${preset.description}`,
          value: key,
          short: preset.name
        });
      }
    });

    choices.push(new inquirer.Separator(chalk.magenta.bold('📝 CONTENT MANAGEMENT')));
    ['wordpress', 'drupal'].forEach(key => {
      const preset = FRAMEWORK_PRESETS[key];
      if (!detectedFrameworks.includes(key)) {
        choices.push({
          name: `${preset.icon} ${preset.name} - ${preset.description}`,
          value: key,
          short: preset.name
        });
      }
    });

    choices.push(new inquirer.Separator(chalk.yellow.bold('🛒 E-COMMERCE')));
    ['magento'].forEach(key => {
      const preset = FRAMEWORK_PRESETS[key];
      choices.push({
        name: `${preset.icon} ${preset.name} - ${preset.description}`,
        value: key,
        short: preset.name
      });
    });

    choices.push(new inquirer.Separator(chalk.blue.bold('🛠️ ENVIRONMENT TYPES')));
    ['development', 'production'].forEach(key => {
      const preset = FRAMEWORK_PRESETS[key];
      choices.push({
        name: `${preset.icon} ${preset.name} - ${preset.description}`,
        value: key,
        short: preset.name
      });
    });

    const { selectedPreset } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPreset',
        message: '🎯 Select your framework or environment:',
        choices,
        pageSize: 15
      }
    ]);

    return selectedPreset;
  }

  async showPresetDetails(presetKey: string) {
    const preset = FRAMEWORK_PRESETS[presetKey];
    
    console.log(boxen(
      chalk.cyan.bold(`${preset.icon} ${preset.name} Configuration\n\n`) +
      chalk.white(`📝 ${preset.description}\n\n`) +
      chalk.yellow('📦 Extensions to be enabled:\n') +
      chalk.gray(preset.extensions.map(ext => `  • ${ext}`).join('\n')) + '\n\n' +
      chalk.yellow('⚙️ Key settings:\n') +
      chalk.gray(Object.entries(preset.settings).slice(0, 8).map(([key, value]) => 
        `  • ${key} = ${value}`
      ).join('\n')) + 
      (Object.keys(preset.settings).length > 8 ? chalk.gray('\n  ... and more') : '') + '\n\n' +
      chalk.yellow('💡 Recommendations:\n') +
      chalk.gray(preset.recommendations.map(rec => `  • ${rec}`).join('\n')) + '\n\n' +
      chalk.green(`🚀 Performance: ${preset.performance.toUpperCase()}\n`) +
      chalk.blue(`🛡️ Security: ${preset.security.toUpperCase()}`),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    ));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Apply ${preset.name} configuration?`,
        default: true
      }
    ]);

    return confirm;
  }

  async selectEnvironment() {
    if (this.environments.length === 1) {
      return this.environments[0];
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

    return selectedEnv;
  }

  async applyPreset(presetKey: string, environment: any) {
    const preset = FRAMEWORK_PRESETS[presetKey];
    
    console.log(boxen(
      chalk.green.bold(`🚀 Applying ${preset.name} Configuration\n\n`) +
      chalk.white(`📍 Environment: ${environment.name}\n`) +
      chalk.white(`📄 INI File: ${environment.iniPath}\n`) +
      chalk.white(`📁 Extensions: ${environment.extensionDir}`),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));

    // Create backup
    const backupSpinner = ora('💾 Creating backup...').start();
    try {
      await backupPhpIni(environment.iniPath);
      backupSpinner.succeed('✅ Backup created');
    } catch (error) {
      backupSpinner.fail('❌ Backup failed');
      throw error;
    }

    // Apply extensions
    const extSpinner = ora('🧩 Configuring extensions...').start();
    try {
      await enableExtensions(environment.iniPath, preset.extensions, environment.extensionDir);
      extSpinner.succeed(`✅ Enabled ${preset.extensions.length} extensions`);
    } catch (error) {
      extSpinner.fail('❌ Extension configuration failed');
      throw error;
    }

    // Apply settings
    const settingsSpinner = ora('⚙️ Applying framework settings...').start();
    try {
      const content = await fs.readFile(environment.iniPath, 'utf8');
      const updatedContent = addCustomSettings(content, preset.settings);
      await fs.writeFile(environment.iniPath, updatedContent, 'utf8');
      settingsSpinner.succeed(`✅ Applied ${Object.keys(preset.settings).length} settings`);
    } catch (error) {
      settingsSpinner.fail('❌ Settings configuration failed');
      throw error;
    }

    // Show success
    console.log(boxen(
      chalk.green.bold(`🎉 ${preset.name} Configuration Applied Successfully!\n\n`) +
      chalk.white('✅ Extensions configured\n') +
      chalk.white('✅ Performance settings optimized\n') +
      chalk.white('✅ Security settings applied\n') +
      chalk.white('✅ Framework-specific settings configured\n\n') +
      chalk.yellow('💡 Next steps:\n') +
      chalk.gray(preset.recommendations.map(rec => `  • ${rec}`).join('\n')) + '\n\n' +
      chalk.cyan('🔄 Restart your web server to apply changes'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
  }

  async run() {
    try {
      await this.initialize();
      
      const presetKey = await this.showPresetMenu();
      const confirmed = await this.showPresetDetails(presetKey);
      
      if (!confirmed) {
        console.log(chalk.yellow('⚠️ Configuration cancelled'));
        return;
      }

      const environment = await this.selectEnvironment();
      await this.applyPreset(presetKey, environment);
      
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
    }
  }
}

export { IntelligentPresetManager };
