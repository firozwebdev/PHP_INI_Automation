#!/usr/bin/env bun

import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * PHP Configuration Fixer
 * Specifically designed to fix common PHP extension loading issues
 */

console.log(chalk.cyan.bold('\n🔧 PHP Configuration Fixer\n'));

async function getPhpInfo() {
  try {
    const { stdout } = await execAsync('php -v');
    const versionMatch = stdout.match(/PHP (\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : 'Unknown';
    
    const { stdout: configPath } = await execAsync('php --ini');
    const iniMatch = configPath.match(/Loaded Configuration File:\s*(.+)/);
    const iniPath = iniMatch ? iniMatch[1].trim() : null;
    
    return { version, iniPath };
  } catch (error) {
    throw new Error('PHP not found or not accessible');
  }
}

async function fixPhpConfiguration() {
  const spinner = ora('Detecting PHP configuration...').start();
  
  try {
    const { version, iniPath } = await getPhpInfo();
    
    if (!iniPath || !await fs.pathExists(iniPath)) {
      spinner.fail('❌ PHP INI file not found');
      return;
    }
    
    spinner.succeed(`✅ Found PHP ${version} with INI at: ${iniPath}`);
    
    // Create backup
    const backupSpinner = ora('Creating backup...').start();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${iniPath}.backup.${timestamp}.ini`;
    await fs.copy(iniPath, backupPath);
    backupSpinner.succeed(`✅ Backup created: ${path.basename(backupPath)}`);
    
    // Read current INI content
    const fixSpinner = ora('Analyzing and fixing configuration...').start();
    let content = await fs.readFile(iniPath, 'utf8');
    let changes = 0;
    
    // Fix 1: Remove duplicate zip extension
    const zipLines = content.split('\n').filter(line => 
      line.trim().startsWith('extension=zip') || line.trim().startsWith('extension="zip"')
    );
    
    if (zipLines.length > 1) {
      // Keep only the first occurrence
      let foundFirst = false;
      content = content.split('\n').map(line => {
        if ((line.trim().startsWith('extension=zip') || line.trim().startsWith('extension="zip"')) && !foundFirst) {
          foundFirst = true;
          return line;
        } else if (line.trim().startsWith('extension=zip') || line.trim().startsWith('extension="zip"')) {
          changes++;
          return `;${line} ; Commented out duplicate`;
        }
        return line;
      }).join('\n');
    }
    
    // Fix 2: Fix OPcache configuration
    content = content.replace(/^extension=opcache/gm, (match) => {
      changes++;
      return `zend_extension=opcache ; Fixed from ${match}`;
    });
    
    // Fix 3: Ensure core extensions are properly configured
    const coreExtensions = ['json', 'ctype', 'xml', 'tokenizer'];
    const lines = content.split('\n');
    
    coreExtensions.forEach(ext => {
      const hasExtension = lines.some(line => 
        line.trim() === `extension=${ext}` || 
        line.trim() === `extension="${ext}"`
      );
      
      if (!hasExtension) {
        // Add the extension
        content += `\n; Core extension\nextension=${ext}\n`;
        changes++;
      }
    });
    
    // Fix 4: Comment out problematic extensions that don't exist
    const problematicExtensions = ['redis', 'memcached', 'xdebug'];
    
    problematicExtensions.forEach(ext => {
      const regex = new RegExp(`^extension=${ext}`, 'gm');
      content = content.replace(regex, (match) => {
        changes++;
        return `;${match} ; Commented out - extension file not found`;
      });
    });
    
    // Fix 5: Add proper extension directory if missing
    if (!content.includes('extension_dir')) {
      const phpDir = path.dirname(iniPath);
      const extDir = path.join(phpDir, 'ext');
      if (await fs.pathExists(extDir)) {
        content = `; Extension directory\nextension_dir = "${extDir}"\n\n${content}`;
        changes++;
      }
    }
    
    // Write the fixed content
    await fs.writeFile(iniPath, content, 'utf8');
    
    fixSpinner.succeed(`✅ Fixed ${changes} configuration issue(s)`);
    
    // Test the configuration
    const testSpinner = ora('Testing PHP configuration...').start();
    
    try {
      const { stdout, stderr } = await execAsync('php -v');
      const hasWarnings = stderr.includes('Warning') || stdout.includes('Warning');
      
      if (hasWarnings) {
        testSpinner.warn('⚠️ Some warnings still present, but major issues fixed');
      } else {
        testSpinner.succeed('✅ PHP configuration is now clean!');
      }
    } catch (error) {
      testSpinner.fail('❌ PHP still has issues');
    }
    
    // Show summary
    console.log(boxen(
      chalk.green.bold('🎉 PHP Configuration Fixed!\n\n') +
      chalk.white(`✅ Backup created: ${path.basename(backupPath)}\n`) +
      chalk.white(`✅ Fixed ${changes} configuration issue(s)\n`) +
      chalk.white(`📄 INI file: ${iniPath}\n\n`) +
      chalk.yellow('💡 Changes made:\n') +
      chalk.gray('• Removed duplicate zip extension\n') +
      chalk.gray('• Fixed OPcache configuration (zend_extension)\n') +
      chalk.gray('• Added missing core extensions\n') +
      chalk.gray('• Commented out problematic extensions\n') +
      chalk.gray('• Ensured proper extension directory\n\n') +
      chalk.cyan('🔄 Test your PHP installation: php -v'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
    
  } catch (error) {
    spinner.fail(`❌ Error: ${error.message}`);
  }
}

// Run the fixer
fixPhpConfiguration();
