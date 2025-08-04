#!/usr/bin/env bun

import boxen from "boxen";
import chalk from "chalk";
import { exec } from "child_process";
import Table from "cli-table3";
import { Command } from "commander";
import figlet from "figlet";
import gradient from "gradient-string";
import inquirer from "inquirer";
import ora from "ora";
import { promisify } from "util";

import fs from "fs-extra";
import path from "path";
import { EnhancedExtensionManager } from "./enhanced-extension-manager.js";
import { IntelligentPresetManager } from "./intelligent-preset-manager.js";
import { detectAllPhpEnvironments } from "./phpEnvironmentUtils.js";
import {
  addCustomSettings,
  backupPhpIni,
  customizePhpIni,
  enableExtensions,
  listPhpIniBackups,
  restorePhpIniBackup,
} from "./phpIniManager.js";
import { UnifiedConfigurationManager } from "./unified-configuration-manager.js";

const execAsync = promisify(exec);

// CLI Program setup
const program = new Command();

program
  .name("php-ini-pro")
  .description("🚀 Professional PHP INI Configuration Manager")
  .version("3.0.0");

/**
 * Display welcome banner
 */
function displayBanner() {
  console.clear();

  const title = figlet.textSync("PHP INI PRO", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  console.log(gradient.rainbow(title));

  console.log(
    boxen(
      chalk.white.bold("🚀 Professional PHP INI Configuration Manager\n") +
        chalk.gray(
          "Automatically detect PHP installations and manage configurations\n"
        ) +
        chalk.cyan("Version 2.0.0 - Built for developers, by developers"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
        backgroundColor: "#1e1e1e",
      }
    )
  );
}

/**
 * Detect PHP version from executable
 */
async function getPhpVersion(phpPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`"${phpPath}" -v`);
    const versionMatch = stdout.match(/PHP (\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if PHP executable exists and is working
 */
async function checkPhpExecutable(phpPath: string): Promise<boolean> {
  try {
    await execAsync(`"${phpPath}" -v`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Enhanced PHP environment detection
 */
async function detectPhpEnvironments() {
  const spinner = ora("🔍 Scanning for PHP installations...").start();

  try {
    const environments = await detectAllPhpEnvironments();
    spinner.succeed(`✅ Found ${environments.length} PHP installation(s)`);
    return environments;
  } catch (error) {
    spinner.fail("❌ Failed to detect PHP environments");
    throw error;
  }
}

/**
 * Display PHP environments in a nice table
 */
function displayEnvironments(environments: any[]) {
  if (environments.length === 0) {
    console.log(
      boxen(
        chalk.yellow.bold("⚠️  No PHP installations found!\n\n") +
          chalk.white("Please ensure PHP is installed and accessible.\n") +
          chalk.gray(
            "Supported environments: PVM, Laragon, XAMPP, WAMP, Custom installations"
          ),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "yellow",
        }
      )
    );
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan.bold("Environment"),
      chalk.cyan.bold("Version"),
      chalk.cyan.bold("Status"),
      chalk.cyan.bold("INI Path"),
      chalk.cyan.bold("Extensions Dir"),
    ],
    colWidths: [15, 12, 10, 40, 30],
    wordWrap: true,
  });

  environments.forEach((env) => {
    const statusIcon =
      env.status === "active" ? "✅" : env.status === "error" ? "❌" : "⚠️";
    const statusColor =
      env.status === "active"
        ? chalk.green
        : env.status === "error"
        ? chalk.red
        : chalk.yellow;

    table.push([
      chalk.white.bold(env.name),
      chalk.blue(env.version || "Unknown"),
      statusColor(`${statusIcon} ${env.status}`),
      chalk.gray(env.iniPath || "Not found"),
      chalk.gray(env.extensionDir || "Not found"),
    ]);
  });

  console.log("\n" + table.toString());
}

/**
 * Interactive PHP environment selection
 */
async function selectPhpEnvironment(environments: any[]) {
  if (environments.length === 0) {
    throw new Error("No PHP environments available");
  }

  if (environments.length === 1) {
    console.log(
      chalk.green(
        `\n✅ Using the only available PHP environment: ${environments[0].name}`
      )
    );
    return environments[0];
  }

  const choices = environments.map((env) => ({
    name: `${env.name} (PHP ${env.version || "Unknown"}) - ${env.status}`,
    value: env,
    short: env.name,
  }));

  const { selectedEnv } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedEnv",
      message: "🎯 Select PHP environment to configure:",
      choices,
      pageSize: 10,
    },
  ]);

  return selectedEnv;
}

/**
 * Main interactive configuration
 */
async function interactiveConfig() {
  displayBanner();

  try {
    // Detect PHP environments
    const environments = await detectPhpEnvironments();
    displayEnvironments(environments);

    if (environments.length === 0) {
      process.exit(1);
    }

    // Select environment
    const selectedEnv = await selectPhpEnvironment(
      environments.filter((env) => env.status === "active")
    );

    console.log(
      boxen(
        chalk.green.bold(`🎯 Selected Environment: ${selectedEnv.name}\n`) +
          chalk.white(`📍 PHP Version: ${selectedEnv.version}\n`) +
          chalk.white(`📄 INI File: ${selectedEnv.iniPath}\n`) +
          chalk.white(`📁 Extensions: ${selectedEnv.extensionDir}`),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );

    // Configuration options
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "🛠️  What would you like to do?",
        choices: [
          {
            name: "🚀 Quick Setup (Recommended extensions + settings)",
            value: "quick",
          },
          { name: "🎛️  Custom Configuration", value: "custom" },
          { name: "🧩 Manage Extensions Only", value: "extensions" },
          { name: "💾 Backup Management", value: "backup" },
          { name: "📊 View Current Configuration", value: "view" },
          { name: "🔄 Restore from Backup", value: "restore" },
        ],
      },
    ]);

    await handleAction(action, selectedEnv);
  } catch (error) {
    console.error(chalk.red.bold("\n❌ Error:"), chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Handle different actions
 */
async function handleAction(action: string, environment: any) {
  switch (action) {
    case "quick":
      await quickSetup(environment);
      break;
    case "custom":
      await customConfiguration(environment);
      break;
    case "extensions":
      await manageExtensions(environment);
      break;
    case "backup":
      await backupManagement(environment);
      break;
    case "view":
      await viewConfiguration(environment);
      break;
    case "restore":
      await restoreConfiguration(environment);
      break;
  }
}

/**
 * Quick setup with recommended configuration
 */
async function quickSetup(environment: any) {
  console.log(chalk.cyan.bold("\n🚀 Starting Quick Setup...\n"));

  const spinner = ora("Creating backup...").start();

  try {
    // Create backup first
    await backupPhpIni(environment.iniPath);
    spinner.succeed("✅ Backup created");

    // Apply recommended configuration
    spinner.start("Applying recommended configuration...");
    await customizePhpIni(environment.iniPath, environment.extensionDir);
    spinner.succeed("✅ Configuration applied successfully");

    console.log(
      boxen(
        chalk.green.bold("🎉 Quick Setup Complete!\n\n") +
          chalk.white("✅ Essential extensions enabled\n") +
          chalk.white("✅ Performance settings optimized\n") +
          chalk.white("✅ Development settings configured\n") +
          chalk.white("✅ Backup created for safety\n\n") +
          chalk.yellow("💡 Restart your web server to apply changes"),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );
  } catch (error) {
    spinner.fail("❌ Setup failed");
    throw error;
  }
}

/**
 * Custom configuration with user choices
 */
async function customConfiguration(environment: any) {
  console.log(chalk.cyan.bold("\n🎛️  Custom Configuration\n"));

  const { configType } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "configType",
      message: "📋 Select configuration areas to customize:",
      choices: [
        { name: "🧩 PHP Extensions", value: "extensions" },
        { name: "⚡ Performance Settings", value: "performance" },
        { name: "🐛 Development Settings", value: "development" },
        { name: "🔒 Security Settings", value: "security" },
        { name: "📝 Error Reporting", value: "errors" },
        { name: "💾 Memory & Limits", value: "memory" },
      ],
    },
  ]);

  if (configType.length === 0) {
    console.log(
      chalk.yellow("No configuration selected. Returning to main menu.")
    );
    return;
  }

  const spinner = ora("Creating backup...").start();

  try {
    // Create backup first
    await backupPhpIni(environment.iniPath);
    spinner.succeed("✅ Backup created");

    // Apply selected configurations
    for (const config of configType) {
      await applySpecificConfig(config, environment);
    }

    console.log(
      boxen(
        chalk.green.bold("🎉 Custom Configuration Complete!\n\n") +
          chalk.white(
            `✅ Applied ${configType.length} configuration area(s)\n`
          ) +
          chalk.white("✅ Backup created for safety\n\n") +
          chalk.yellow("💡 Restart your web server to apply changes"),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );
  } catch (error) {
    spinner.fail("❌ Configuration failed");
    throw error;
  }
}

/**
 * Apply specific configuration based on type
 */
async function applySpecificConfig(configType: string, environment: any) {
  const spinner = ora(`Configuring ${configType}...`).start();

  try {
    let customSettings = {};

    switch (configType) {
      case "performance":
        customSettings = {
          max_execution_time: 300,
          memory_limit: "512M",
          max_input_vars: 3000,
          post_max_size: "64M",
          upload_max_filesize: "64M",
          "opcache.enable": 1,
          "opcache.memory_consumption": 128,
          "opcache.max_accelerated_files": 4000,
          "opcache.revalidate_freq": 60,
        };
        break;

      case "development":
        customSettings = {
          display_errors: "On",
          display_startup_errors: "On",
          error_reporting: "E_ALL",
          log_errors: "On",
          html_errors: "On",
          "xdebug.mode": "debug",
          "xdebug.start_with_request": "yes",
          "xdebug.client_port": 9003,
        };
        break;

      case "security":
        customSettings = {
          expose_php: "Off",
          allow_url_fopen: "Off",
          allow_url_include: "Off",
          "session.cookie_httponly": 1,
          "session.cookie_secure": 1,
          "session.use_strict_mode": 1,
        };
        break;

      case "errors":
        customSettings = {
          log_errors: "On",
          error_log: "/var/log/php_errors.log",
          ignore_repeated_errors: "On",
          ignore_repeated_source: "On",
        };
        break;

      case "memory":
        customSettings = {
          memory_limit: "1024M",
          max_execution_time: 600,
          max_input_time: 300,
          post_max_size: "128M",
          upload_max_filesize: "128M",
        };
        break;
    }

    if (configType === "extensions") {
      // Handle extensions separately
      await manageExtensions(environment);
    } else {
      const content = await fs.readFile(environment.iniPath, "utf8");
      const updatedContent = addCustomSettings(content, customSettings);
      await fs.writeFile(environment.iniPath, updatedContent, "utf8");
    }

    spinner.succeed(`✅ ${configType} configured`);
  } catch (error) {
    spinner.fail(`❌ Failed to configure ${configType}`);
    throw error;
  }
}

/**
 * Manage PHP extensions
 */
async function manageExtensions(environment: any) {
  console.log(chalk.cyan.bold("\n🧩 Extension Management\n"));

  const commonExtensions = [
    { name: "curl", description: "Client URL library for HTTP requests" },
    { name: "mbstring", description: "Multibyte string handling" },
    { name: "openssl", description: "OpenSSL cryptographic functions" },
    { name: "pdo", description: "PHP Data Objects database abstraction" },
    { name: "pdo_mysql", description: "MySQL driver for PDO" },
    { name: "pdo_sqlite", description: "SQLite driver for PDO" },
    { name: "gd", description: "Image processing library" },
    { name: "zip", description: "ZIP archive handling" },
    { name: "xml", description: "XML parsing and manipulation" },
    { name: "json", description: "JSON data interchange" },
    { name: "fileinfo", description: "File type detection" },
    { name: "intl", description: "Internationalization functions" },
    { name: "bcmath", description: "Arbitrary precision mathematics" },
    { name: "soap", description: "SOAP protocol support" },
    { name: "xsl", description: "XSL transformation support" },
    { name: "redis", description: "Redis client for caching" },
    { name: "memcached", description: "Memcached client" },
    { name: "opcache", description: "Opcode caching for performance" },
    { name: "xdebug", description: "Debugging and profiling" },
  ];

  const { selectedExtensions } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedExtensions",
      message: "🧩 Select extensions to enable:",
      choices: commonExtensions.map((ext) => ({
        name: `${ext.name} - ${chalk.gray(ext.description)}`,
        value: ext.name,
        checked: [
          "curl",
          "mbstring",
          "openssl",
          "pdo",
          "json",
          "fileinfo",
        ].includes(ext.name),
      })),
      pageSize: 15,
    },
  ]);

  if (selectedExtensions.length === 0) {
    console.log(chalk.yellow("No extensions selected."));
    return;
  }

  const spinner = ora("Enabling selected extensions...").start();

  try {
    const content = await fs.readFile(environment.iniPath, "utf8");
    const updatedContent = enableExtensions(content, selectedExtensions);
    await fs.writeFile(environment.iniPath, updatedContent, "utf8");

    spinner.succeed(`✅ Enabled ${selectedExtensions.length} extension(s)`);

    console.log(chalk.green("\n📋 Enabled Extensions:"));
    selectedExtensions.forEach((ext) => {
      console.log(chalk.white(`  ✅ ${ext}`));
    });
  } catch (error) {
    spinner.fail("❌ Failed to enable extensions");
    throw error;
  }
}

/**
 * Backup management
 */
async function backupManagement(environment: any) {
  console.log(chalk.cyan.bold("\n💾 Backup Management\n"));

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "💾 Select backup action:",
      choices: [
        { name: "📦 Create New Backup", value: "create" },
        { name: "📋 List All Backups", value: "list" },
        { name: "🔄 Restore from Backup", value: "restore" },
        { name: "🗑️  Clean Old Backups", value: "clean" },
      ],
    },
  ]);

  switch (action) {
    case "create":
      await createBackup(environment);
      break;
    case "list":
      await listBackups(environment);
      break;
    case "restore":
      await restoreConfiguration(environment);
      break;
    case "clean":
      await cleanBackups(environment);
      break;
  }
}

/**
 * Create backup
 */
async function createBackup(environment: any) {
  const spinner = ora("Creating backup...").start();

  try {
    const backupPath = await backupPhpIni(environment.iniPath);
    spinner.succeed("✅ Backup created successfully");

    console.log(
      boxen(
        chalk.green.bold("📦 Backup Created!\n\n") +
          chalk.white(`📄 Original: ${environment.iniPath}\n`) +
          chalk.white(`💾 Backup: ${backupPath}\n\n`) +
          chalk.gray(
            "You can restore this backup anytime using the restore option."
          ),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );
  } catch (error) {
    spinner.fail("❌ Failed to create backup");
    throw error;
  }
}

/**
 * List backups
 */
async function listBackups(environment: any) {
  const spinner = ora("Scanning for backups...").start();

  try {
    const backups = await listPhpIniBackups(environment.iniPath);
    spinner.succeed(`✅ Found ${backups.length} backup(s)`);

    if (backups.length === 0) {
      console.log(
        chalk.yellow("\n📭 No backups found for this PHP installation.")
      );
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan.bold("Backup File"),
        chalk.cyan.bold("Created"),
        chalk.cyan.bold("Size"),
      ],
      colWidths: [50, 25, 15],
    });

    for (const backup of backups) {
      const stats = await fs.stat(backup);
      const size = (stats.size / 1024).toFixed(2) + " KB";
      const created = stats.mtime.toLocaleString();

      table.push([
        chalk.white(path.basename(backup)),
        chalk.gray(created),
        chalk.blue(size),
      ]);
    }

    console.log("\n📋 Available Backups:");
    console.log(table.toString());
  } catch (error) {
    spinner.fail("❌ Failed to list backups");
    throw error;
  }
}

/**
 * Restore configuration from backup
 */
async function restoreConfiguration(environment: any) {
  console.log(chalk.cyan.bold("\n🔄 Restore Configuration\n"));

  const spinner = ora("Scanning for backups...").start();

  try {
    const backups = await listPhpIniBackups(environment.iniPath);
    spinner.stop();

    if (backups.length === 0) {
      console.log(
        chalk.yellow("📭 No backups found for this PHP installation.")
      );
      return;
    }

    const choices = backups.map((backup) => {
      const stats = fs.statSync(backup);
      return {
        name: `${path.basename(backup)} (${stats.mtime.toLocaleString()})`,
        value: backup,
        short: path.basename(backup),
      };
    });

    const { selectedBackup } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedBackup",
        message: "🔄 Select backup to restore:",
        choices,
        pageSize: 10,
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: chalk.yellow(
          "⚠️  This will overwrite your current php.ini. Continue?"
        ),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("Restore cancelled."));
      return;
    }

    const restoreSpinner = ora("Restoring backup...").start();

    // Create backup of current file before restoring
    await backupPhpIni(environment.iniPath);
    await restorePhpIniBackup(selectedBackup, environment.iniPath);

    restoreSpinner.succeed("✅ Configuration restored successfully");

    console.log(
      boxen(
        chalk.green.bold("🔄 Restore Complete!\n\n") +
          chalk.white(`📄 Restored from: ${path.basename(selectedBackup)}\n`) +
          chalk.white("✅ Current configuration backed up\n\n") +
          chalk.yellow("💡 Restart your web server to apply changes"),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );
  } catch (error) {
    spinner.fail("❌ Failed to restore configuration");
    throw error;
  }
}

/**
 * View current configuration
 */
async function viewConfiguration(environment: any) {
  console.log(chalk.cyan.bold("\n📊 Current Configuration\n"));

  const spinner = ora("Reading configuration...").start();

  try {
    const content = await fs.readFile(environment.iniPath, "utf8");
    const stats = await fs.stat(environment.iniPath);

    spinner.succeed("✅ Configuration loaded");

    // Parse basic info
    const lines = content.split("\n");
    const enabledExtensions = lines
      .filter(
        (line) =>
          line.trim().startsWith("extension=") && !line.trim().startsWith(";")
      )
      .map((line) => line.replace("extension=", "").trim());

    const memoryLimit =
      content.match(/memory_limit\s*=\s*(.+)/)?.[1]?.trim() || "Not set";
    const maxExecTime =
      content.match(/max_execution_time\s*=\s*(.+)/)?.[1]?.trim() || "Not set";
    const errorReporting =
      content.match(/error_reporting\s*=\s*(.+)/)?.[1]?.trim() || "Not set";

    console.log(
      boxen(
        chalk.white.bold("📊 PHP Configuration Summary\n\n") +
          chalk.cyan("📄 File Information:\n") +
          chalk.white(`  Path: ${environment.iniPath}\n`) +
          chalk.white(`  Size: ${(stats.size / 1024).toFixed(2)} KB\n`) +
          chalk.white(`  Modified: ${stats.mtime.toLocaleString()}\n\n`) +
          chalk.cyan("⚙️  Key Settings:\n") +
          chalk.white(`  Memory Limit: ${memoryLimit}\n`) +
          chalk.white(`  Max Execution Time: ${maxExecTime}\n`) +
          chalk.white(`  Error Reporting: ${errorReporting}\n\n`) +
          chalk.cyan("🧩 Extensions:\n") +
          chalk.white(`  Enabled: ${enabledExtensions.length} extension(s)\n`) +
          (enabledExtensions.length > 0
            ? chalk.gray(
                `  ${enabledExtensions.slice(0, 5).join(", ")}${
                  enabledExtensions.length > 5 ? "..." : ""
                }`
              )
            : chalk.gray("  No extensions explicitly enabled")),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "cyan",
        }
      )
    );
  } catch (error) {
    spinner.fail("❌ Failed to read configuration");
    throw error;
  }
}

/**
 * Clean old backups
 */
async function cleanBackups(environment: any) {
  const spinner = ora("Scanning for backups...").start();

  try {
    const backups = await listPhpIniBackups(environment.iniPath);
    spinner.succeed(`✅ Found ${backups.length} backup(s)`);

    if (backups.length <= 5) {
      console.log(
        chalk.yellow("\n📭 Not enough backups to clean (keeping minimum 5).")
      );
      return;
    }

    // Sort by modification time (newest first)
    const sortedBackups = backups
      .map((backup) => ({
        path: backup,
        stats: fs.statSync(backup),
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

    const oldBackups = sortedBackups.slice(5); // Keep 5 newest, mark rest for deletion

    if (oldBackups.length === 0) {
      console.log(chalk.yellow("\n📭 No old backups to clean."));
      return;
    }

    console.log(
      chalk.yellow(`\n🗑️  Found ${oldBackups.length} old backup(s) to clean:`)
    );
    oldBackups.forEach((backup) => {
      console.log(
        chalk.gray(
          `  - ${path.basename(
            backup.path
          )} (${backup.stats.mtime.toLocaleDateString()})`
        )
      );
    });

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: chalk.yellow(`Delete ${oldBackups.length} old backup(s)?`),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("Cleanup cancelled."));
      return;
    }

    const cleanSpinner = ora("Cleaning old backups...").start();

    for (const backup of oldBackups) {
      await fs.remove(backup.path);
    }

    cleanSpinner.succeed(`✅ Cleaned ${oldBackups.length} old backup(s)`);
  } catch (error) {
    spinner.fail("❌ Failed to clean backups");
    throw error;
  }
}

// CLI Commands

// Unified Configuration Manager (NEW - default command)
program
  .command("config")
  .alias("c")
  .description(
    "🚀 Unified configuration manager - Choose preset or manual mode"
  )
  .action(async () => {
    const manager = new UnifiedConfigurationManager();
    await manager.run();
  });

// Smart Preset mode
program
  .command("smart")
  .alias("s")
  .description("🧠 Smart framework detection and configuration")
  .action(async () => {
    const manager = new IntelligentPresetManager();
    await manager.run();
  });

// Framework presets shortcut
program
  .command("preset")
  .alias("p")
  .description("🎯 Quick framework preset selection")
  .action(async () => {
    const manager = new IntelligentPresetManager();
    await manager.run();
  });

program
  .command("interactive")
  .alias("i")
  .description("🎛️ Advanced interactive configuration mode")
  .action(async () => {
    await interactiveConfig();
  });

program
  .command("quick")
  .alias("q")
  .description("🚀 Quick setup with recommended settings")
  .option("-v, --version <version>", "PHP version to configure")
  .action(async (options) => {
    displayBanner();

    try {
      const environments = await detectPhpEnvironments();

      if (environments.length === 0) {
        console.log(chalk.red("❌ No PHP environments found."));
        process.exit(1);
      }

      let selectedEnv;
      if (options.version) {
        selectedEnv = environments.find(
          (env) => env.version === options.version
        );
        if (!selectedEnv) {
          console.log(
            chalk.red(`❌ PHP version ${options.version} not found.`)
          );
          process.exit(1);
        }
      } else {
        selectedEnv =
          environments.find((env) => env.status === "active") ||
          environments[0];
      }

      await quickSetup(selectedEnv);
    } catch (error) {
      console.error(chalk.red.bold("\n❌ Error:"), chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("list")
  .alias("ls")
  .description("📋 List all PHP environments")
  .action(async () => {
    displayBanner();

    try {
      const environments = await detectPhpEnvironments();
      displayEnvironments(environments);
    } catch (error) {
      console.error(chalk.red.bold("\n❌ Error:"), chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("backup")
  .description("💾 Backup management")
  .option("-c, --create", "Create a new backup")
  .option("-l, --list", "List all backups")
  .option("-r, --restore <file>", "Restore from backup file")
  .option("-v, --version <version>", "PHP version to target")
  .action(async (options) => {
    displayBanner();

    try {
      const environments = await detectPhpEnvironments();

      if (environments.length === 0) {
        console.log(chalk.red("❌ No PHP environments found."));
        process.exit(1);
      }

      let selectedEnv;
      if (options.version) {
        selectedEnv = environments.find(
          (env) => env.version === options.version
        );
        if (!selectedEnv) {
          console.log(
            chalk.red(`❌ PHP version ${options.version} not found.`)
          );
          process.exit(1);
        }
      } else {
        selectedEnv =
          environments.find((env) => env.status === "active") ||
          environments[0];
      }

      if (options.create) {
        await createBackup(selectedEnv);
      } else if (options.list) {
        await listBackups(selectedEnv);
      } else if (options.restore) {
        // Restore specific backup
        const spinner = ora("Restoring backup...").start();
        await backupPhpIni(selectedEnv.iniPath); // Backup current first
        await restorePhpIniBackup(options.restore, selectedEnv.iniPath);
        spinner.succeed("✅ Backup restored successfully");
      } else {
        await backupManagement(selectedEnv);
      }
    } catch (error) {
      console.error(chalk.red.bold("\n❌ Error:"), chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("extensions")
  .alias("ext")
  .description("🧩 Enhanced extension management with detailed information")
  .option("-v, --version <version>", "PHP version to configure")
  .action(async (options) => {
    const manager = new EnhancedExtensionManager();
    await manager.run();
  });

program
  .command("view")
  .description("📊 View current PHP configuration")
  .option("-v, --version <version>", "PHP version to view")
  .action(async (options) => {
    displayBanner();

    try {
      const environments = await detectPhpEnvironments();

      if (environments.length === 0) {
        console.log(chalk.red("❌ No PHP environments found."));
        process.exit(1);
      }

      let selectedEnv;
      if (options.version) {
        selectedEnv = environments.find(
          (env) => env.version === options.version
        );
        if (!selectedEnv) {
          console.log(
            chalk.red(`❌ PHP version ${options.version} not found.`)
          );
          process.exit(1);
        }
      } else {
        selectedEnv =
          environments.find((env) => env.status === "active") ||
          environments[0];
      }

      await viewConfiguration(selectedEnv);
    } catch (error) {
      console.error(chalk.red.bold("\n❌ Error:"), chalk.red(error.message));
      process.exit(1);
    }
  });

// Default action (unified configuration manager)
if (process.argv.length === 2) {
  const manager = new UnifiedConfigurationManager();
  manager.run();
} else {
  program.parse();
}
