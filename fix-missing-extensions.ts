#!/usr/bin/env bun

import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log(chalk.cyan.bold('\n🔧 Missing Extensions Fixer\n'));

async function fixMissingExtensions() {
  const spinner = ora('Analyzing PHP configuration...').start();
  
  try {
    // Get PHP info
    const { stdout: configInfo } = await execAsync('php --ini');
    const iniMatch = configInfo.match(/Loaded Configuration File:\s*(.+)/);
    const iniPath = iniMatch ? iniMatch[1].trim() : null;
    
    if (!iniPath || !await fs.pathExists(iniPath)) {
      spinner.fail('❌ PHP INI file not found');
      return;
    }
    
    spinner.succeed(`✅ Found INI file: ${iniPath}`);
    
    // Find extension directory
    const phpDir = path.dirname(iniPath);
    const possibleExtDirs = [
      path.join(phpDir, 'ext'),
      path.join(phpDir, '..', 'ext'),
      path.join(phpDir, 'extensions'),
    ];
    
    let extDir = null;
    for (const dir of possibleExtDirs) {
      if (await fs.pathExists(dir)) {
        extDir = dir;
        break;
      }
    }
    
    if (!extDir) {
      console.log(chalk.yellow('⚠️ Extension directory not found. Checking available extensions...'));
    } else {
      console.log(chalk.green(`✅ Extension directory: ${extDir}`));
    }
    
    // Create backup
    const backupSpinner = ora('Creating backup...').start();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${iniPath}.backup.${timestamp}.ini`;
    await fs.copy(iniPath, backupPath);
    backupSpinner.succeed(`✅ Backup created: ${path.basename(backupPath)}`);
    
    // Read and analyze INI content
    const analyzeSpinner = ora('Analyzing extension configuration...').start();
    let content = await fs.readFile(iniPath, 'utf8');
    
    // Core extensions that are built-in and don't need DLL files in modern PHP
    const builtInExtensions = [
      'json',      // Built-in since PHP 8.0
      'ctype',     // Built-in since PHP 7.2
      'tokenizer', // Built-in since PHP 4.3
      'xml',       // Built-in core extension
      'pdo',       // Built-in since PHP 5.1
    ];
    
    let changes = 0;
    
    // Check which extensions exist as DLL files
    const availableExtensions = [];
    if (extDir) {
      try {
        const files = await fs.readdir(extDir);
        const dllFiles = files.filter(file => file.endsWith('.dll'));
        availableExtensions.push(...dllFiles.map(file => file.replace(/^php_/, '').replace(/\.dll$/, '')));
      } catch (error) {
        console.log(chalk.yellow('⚠️ Could not read extension directory'));
      }
    }
    
    analyzeSpinner.succeed(`✅ Found ${availableExtensions.length} available extension(s)`);
    
    // Fix the configuration
    const fixSpinner = ora('Fixing extension configuration...').start();
    
    const lines = content.split('\n');
    const newLines = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this is an extension line
      if (trimmedLine.startsWith('extension=')) {
        const extName = trimmedLine.replace('extension=', '').replace(/['"]/g, '');
        
        if (builtInExtensions.includes(extName)) {
          // Comment out built-in extensions
          newLines.push(`;${line} ; Built-in extension - no DLL needed`);
          changes++;
        } else if (extDir && !availableExtensions.includes(extName)) {
          // Comment out missing extensions
          newLines.push(`;${line} ; Extension DLL not found`);
          changes++;
        } else {
          // Keep valid extensions
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }
    
    // Add a note about built-in extensions
    const noteSection = `
; ============================================================================
; NOTE: The following extensions are built-in to PHP ${await getPhpVersion()} and do not need
; to be loaded explicitly. They have been commented out to prevent warnings.
; Built-in extensions: json, ctype, tokenizer, xml, pdo
; ============================================================================
`;
    
    const updatedContent = noteSection + '\n' + newLines.join('\n');
    
    // Write the fixed content
    await fs.writeFile(iniPath, updatedContent, 'utf8');
    
    fixSpinner.succeed(`✅ Fixed ${changes} extension configuration(s)`);
    
    // Test the configuration
    const testSpinner = ora('Testing PHP configuration...').start();
    
    try {
      const { stdout, stderr } = await execAsync('php -v');
      const hasWarnings = stderr.includes('Warning') || stdout.includes('Warning');
      
      if (hasWarnings) {
        testSpinner.warn('⚠️ Some warnings may still be present');
        console.log(chalk.yellow('\n📝 Remaining warnings (if any) may be due to:'));
        console.log(chalk.gray('• Extensions that need to be installed separately'));
        console.log(chalk.gray('• Custom extensions not in the standard location'));
        console.log(chalk.gray('• Version-specific compatibility issues'));
      } else {
        testSpinner.succeed('✅ PHP configuration is now clean!');
      }
    } catch (error) {
      testSpinner.fail('❌ PHP still has issues');
    }
    
    // Show summary
    console.log(boxen(
      chalk.green.bold('🎉 Extension Configuration Fixed!\n\n') +
      chalk.white(`✅ Backup created: ${path.basename(backupPath)}\n`) +
      chalk.white(`✅ Fixed ${changes} extension issue(s)\n`) +
      chalk.white(`📄 INI file: ${iniPath}\n`) +
      (extDir ? chalk.white(`📁 Extension dir: ${extDir}\n`) : '') +
      chalk.white(`📦 Available extensions: ${availableExtensions.length}\n\n`) +
      chalk.yellow('💡 Changes made:\n') +
      chalk.gray('• Commented out built-in extensions (json, ctype, tokenizer, xml, pdo)\n') +
      chalk.gray('• Commented out missing extension DLLs\n') +
      chalk.gray('• Added explanatory notes\n\n') +
      chalk.cyan('🔄 Test your PHP installation: php -v'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
    
    if (availableExtensions.length > 0) {
      console.log(chalk.cyan('\n📦 Available extensions you can enable:'));
      availableExtensions.slice(0, 10).forEach(ext => {
        console.log(chalk.white(`  • ${ext}`));
      });
      if (availableExtensions.length > 10) {
        console.log(chalk.gray(`  ... and ${availableExtensions.length - 10} more`));
      }
    }
    
  } catch (error) {
    spinner.fail(`❌ Error: ${error.message}`);
  }
}

async function getPhpVersion() {
  try {
    const { stdout } = await execAsync('php -v');
    const versionMatch = stdout.match(/PHP (\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

// Run the fixer
fixMissingExtensions();
