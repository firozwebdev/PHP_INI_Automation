import fs from "fs-extra";
import path from "path";

/**
 * Validates that the source php.ini file exists.
 *
 * @param {string} filePath - Path to the php.ini file.
 * @throws {Error} - If the file does not exist.
 */
export function validateSourceFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`php.ini file not found at: ${filePath}`);
  }
}

/**
 * Enables PHP extensions in the php.ini file content.
 *
 * @param {string} content - The php.ini file content.
 * @param {Array<string>} extensions - List of PHP extensions to enable.
 * @returns {string} - Updated php.ini content.
 */
function enableExtensions(content, extensions) {
  extensions.forEach((extension) => {
    const pattern = new RegExp(`;extension=${extension}`, "g");
    content = content.replace(pattern, `extension=${extension}`);
  });
  return content;
}

/**
 * Adds or updates custom settings in the php.ini file content.
 *
 * @param {string} content - The php.ini file content.
 * @param {Object} settings - Key-value pairs of php.ini settings.
 * @returns {string} - Updated php.ini content.
 */
function addCustomSettings(content, settings) {
  for (const [key, value] of Object.entries(settings)) {
    const pattern = new RegExp(`^;?${key}\\s*=.*`, "m"); // Match existing setting
    const settingLine = `${key} = ${value}`;

    if (pattern.test(content)) {
      // Update existing setting
      content = content.replace(pattern, settingLine);
    } else {
      // Add new setting
      content += `\n${settingLine}`;
    }
  }
  return content;
}

/**
 * Customizes the php.ini file by enabling extensions, updating extension_dir, and adding custom settings.
 *
 * @param {string} filePath - Path to the php.ini file to be customized.
 * @param {string} extensionsDir - Directory containing PHP extensions.
 * @param {Object} customSettings - Key-value pairs of additional php.ini settings to add/update.
 */
export async function customizePhpIni(
  filePath,
  extensionsDir,
  customSettings = {}
) {
  console.log(`Customizing php.ini at: ${filePath}`);

  // Laravel wants these extensions enabled
  const EXTENSIONS = [
    "curl",
    "pdo_sqlite",
    "sqlite3",
    "openssl",
    "pdo_mysql",
    "mbstring",
    "tokenizer",
    "json",
    "fileinfo",
    "ctype",
    "xml",
    "bcmath",
    "gd",
    "zip",
  ];

  // Service-specific settings
  const DEFAULT_SETTINGS = {
    max_execution_time: 120,
    memory_limit: "512M",
    output_buffering: "Off",
    zlib_output_compression: "Off",
    //post_max_size: '50M',
    //upload_max_filesize: '50M',
    // short_open_tag: 'On',
    // date: { timezone: 'UTC' },
    // error_reporting: 'E_ALL',
    // display_errors: 'Off',
    // log_errors: 'On',
    // error_log: '/var/log/php_errors.log',
    // 'session.save_handler': 'files',
    // 'session.save_path': '"/tmp"',
    // 'session.gc_maxlifetime': 1440,
    // realpath_cache_size: '4096K',
    // realpath_cache_ttl: 600,
    //zend_extension=xdebug,

    //xdebug.mode=debug,
    //xdebug.start_with_request=yes,
    //xdebug.client_port=9003,
    //xdebug.client_host=127.0.0.1,
    //xdebug.idekey=VSCODE,
    //xdebug.log=/var/log/xdebug.log,
  };

  // Merge default and custom settings
  const mergedSettings = { ...DEFAULT_SETTINGS, ...customSettings };

  try {
    let content = await fs.readFile(filePath, "utf8");

    // Update extension_dir if provided
    if (extensionsDir) {
      content = content.replace(
        /;?extension_dir\s*=\s*".*?"/,
        `extension_dir = "${extensionsDir.replace(/\\/g, "\\\\")}"`
      );
    }

    // Enable PHP extensions
    content = enableExtensions(content, EXTENSIONS);

    // Add or update custom settings
    content = addCustomSettings(content, mergedSettings);

    // Save updated php.ini
    await fs.writeFile(filePath, content, "utf8");
    console.log(
      "php.ini has been successfully customized with the necessary extensions and settings."
    );
  } catch (error) {
    console.error(`Failed to customize php.ini: ${error.stack}`);
    throw new Error(`Failed to customize php.ini: ${error.message}`);
  }
}

/**
 * Create a backup of the php.ini file
 * @param {string} filePath - Path to the php.ini file
 * @returns {Promise<string>} - Path to the backup file
 */
export async function backupPhpIni(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${filePath}.backup.${timestamp}.ini`;

  await fs.copy(filePath, backupPath);
  console.log(`Backup created: ${backupPath}`);

  return backupPath;
}

/**
 * List all backup files for a php.ini file
 * @param {string} filePath - Path to the original php.ini file
 * @returns {Promise<string[]>} - Array of backup file paths
 */
export async function listPhpIniBackups(filePath) {
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath);

  try {
    const files = await fs.readdir(dir);
    const backups = files
      .filter(
        (file) =>
          file.startsWith(`${baseName}.backup.`) && file.endsWith(".ini")
      )
      .map((file) => path.join(dir, file))
      .sort((a, b) => {
        // Sort by modification time (newest first)
        const statsA = fs.statSync(a);
        const statsB = fs.statSync(b);
        return statsB.mtime.getTime() - statsA.mtime.getTime();
      });

    return backups;
  } catch (error) {
    console.error("Error listing backups:", error);
    return [];
  }
}

/**
 * Restore php.ini from a backup file
 * @param {string} backupPath - Path to the backup file
 * @param {string} targetPath - Path where to restore the backup
 */
export async function restorePhpIniBackup(backupPath, targetPath) {
  if (!(await fs.pathExists(backupPath))) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  await fs.copy(backupPath, targetPath);
  console.log(`Restored from backup: ${backupPath} -> ${targetPath}`);
}

/**
 * Enable specific extensions in php.ini content
 * @param {string} content - Current php.ini content
 * @param {string[]} extensions - Array of extension names to enable
 * @returns {string} - Updated php.ini content
 */
export function enableExtensions(content, extensions) {
  let lines = content.split("\n");

  extensions.forEach((extension) => {
    const extensionLine = `extension=${extension}`;
    const commentedLine = `;extension=${extension}`;

    // Check if extension is already enabled
    const enabledIndex = lines.findIndex(
      (line) => line.trim() === extensionLine
    );
    if (enabledIndex !== -1) {
      return; // Already enabled
    }

    // Check if extension is commented out
    const commentedIndex = lines.findIndex(
      (line) => line.trim() === commentedLine
    );
    if (commentedIndex !== -1) {
      lines[commentedIndex] = extensionLine;
      return;
    }

    // Add new extension line
    const extensionSectionIndex = lines.findIndex(
      (line) => line.includes("[") && line.toLowerCase().includes("extension")
    );

    if (extensionSectionIndex !== -1) {
      // Insert after the extension section header
      lines.splice(extensionSectionIndex + 1, 0, extensionLine);
    } else {
      // Find a good place to add extensions
      const lastExtensionIndex = lines.findLastIndex(
        (line) =>
          line.trim().startsWith("extension=") ||
          line.trim().startsWith(";extension=")
      );

      if (lastExtensionIndex !== -1) {
        lines.splice(lastExtensionIndex + 1, 0, extensionLine);
      } else {
        // Add at the end
        lines.push("", `; ${extension} extension`, extensionLine);
      }
    }
  });

  return lines.join("\n");
}

/**
 * Add custom settings to php.ini content
 * @param {string} content - Current php.ini content
 * @param {Object} settings - Key-value pairs of settings to add/update
 * @returns {string} - Updated php.ini content
 */
export function addCustomSettings(content, settings) {
  let lines = content.split("\n");

  Object.entries(settings).forEach(([key, value]) => {
    const settingLine = `${key} = ${value}`;

    // Find existing setting
    const existingIndex = lines.findIndex((line) => {
      const trimmed = line.trim();
      return trimmed.startsWith(`${key}=`) || trimmed.startsWith(`${key} =`);
    });

    if (existingIndex !== -1) {
      // Update existing setting
      lines[existingIndex] = settingLine;
    } else {
      // Add new setting
      lines.push("", `; ${key} setting`, settingLine);
    }
  });

  return lines.join("\n");
}
