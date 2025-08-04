import fs from "fs-extra";
import path from "path";

// Constants
export const DEFAULT_PATH = process.env.DEFAULT_PATH || "C:/php"; // Default PHP directory

/**
 * Determines the appropriate paths for php.ini and extensions directory.
 *
 * @param {string} version - PHP version (optional).
 * @returns {object} - Paths for php.ini and extensions directory.
 * @throws {Error} - If no valid PHP environment is found.
 */
export function determinePhpIniPaths(version = "") {
  const paths = [
    {
      base: process.env.PVM_PATH,
      ini: ["sym", "php.ini"],
      ext: ["php", version || "version", "ext"],
    },
    {
      base: process.env.LARAGON_PATH,
      ini: ["php", version, "php.ini"],
      ext: ["php", version, "ext"],
    },
    { base: process.env.XAMPP_PATH, ini: ["php.ini"], ext: ["ext"] },
    {
      base: process.env.WAMP_PATH,
      ini: ["php", version, "php.ini"],
      ext: ["php", version, "ext"],
    },
  ];

  for (const { base, ini, ext } of paths) {
    if (base) {
      const iniPath = path.join(base, ...ini);
      const extensionDir = path.join(base, ...ext);
      if (fs.existsSync(iniPath)) {
        return { iniPath, extensionDir };
      }
    }
  }

  // Default fallback
  const iniPath = path.join(DEFAULT_PATH, "php.ini");
  const extensionDir = "";
  if (fs.existsSync(iniPath)) {
    return { iniPath, extensionDir };
  }

  throw new Error(
    "No valid PHP environment found. Please check your configurations."
  );
}

/**
 * Detect all available PHP environments
 * @returns {Promise<Array>} - Array of detected PHP environments
 */
export async function detectAllPhpEnvironments() {
  const environments = [];
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  // Helper function to get PHP version
  async function getPhpVersion(phpPath) {
    try {
      const { stdout } = await execAsync(`"${phpPath}" -v`);
      const versionMatch = stdout.match(/PHP (\d+\.\d+\.\d+)/);
      return versionMatch ? versionMatch[1] : null;
    } catch (error) {
      return null;
    }
  }

  // Helper function to check if PHP executable works
  async function checkPhpExecutable(phpPath) {
    try {
      await execAsync(`"${phpPath}" -v`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Environment configurations
  const envConfigs = [
    {
      name: "PVM",
      basePath: process.env.PVM_PATH,
      hasVersions: true,
      phpPath: (base, version) =>
        path.join(
          base,
          "php",
          version,
          process.platform === "win32" ? "php.exe" : "bin/php"
        ),
      iniPath: (base, version) => path.join(base, "sym", "php.ini"),
      extPath: (base, version) => path.join(base, "php", version, "ext"),
    },
    {
      name: "Laragon",
      basePath: process.env.LARAGON_PATH,
      hasVersions: true,
      phpPath: (base, version) =>
        path.join(
          base,
          "php",
          version,
          process.platform === "win32" ? "php.exe" : "bin/php"
        ),
      iniPath: (base, version) => path.join(base, "php", version, "php.ini"),
      extPath: (base, version) => path.join(base, "php", version, "ext"),
    },
    {
      name: "XAMPP",
      basePath: process.env.XAMPP_PATH,
      hasVersions: false,
      phpPath: (base) =>
        path.join(base, process.platform === "win32" ? "php.exe" : "bin/php"),
      iniPath: (base) => path.join(base, "php.ini"),
      extPath: (base) => path.join(base, "ext"),
    },
    {
      name: "WAMP",
      basePath: process.env.WAMP_PATH,
      hasVersions: true,
      phpPath: (base, version) =>
        path.join(
          base,
          "php",
          version,
          process.platform === "win32" ? "php.exe" : "bin/php"
        ),
      iniPath: (base, version) => path.join(base, "php", version, "php.ini"),
      extPath: (base, version) => path.join(base, "php", version, "ext"),
    },
    {
      name: "Default",
      basePath:
        process.env.DEFAULT_PATH ||
        (process.platform === "win32" ? "C:/php" : "/usr/local/php"),
      hasVersions: false,
      phpPath: (base) =>
        path.join(base, process.platform === "win32" ? "php.exe" : "bin/php"),
      iniPath: (base) => path.join(base, "php.ini"),
      extPath: (base) => path.join(base, "ext"),
    },
  ];

  for (const config of envConfigs) {
    if (!config.basePath || !fs.existsSync(config.basePath)) {
      continue;
    }

    try {
      if (config.hasVersions) {
        // Check for version-specific installations
        const phpDir = path.join(config.basePath, "php");
        if (fs.existsSync(phpDir)) {
          const versions = fs.readdirSync(phpDir).filter((item) => {
            const versionPath = path.join(phpDir, item);
            return fs.statSync(versionPath).isDirectory();
          });

          for (const version of versions) {
            const phpExe = config.phpPath(config.basePath, version);

            if (fs.existsSync(phpExe)) {
              const isWorking = await checkPhpExecutable(phpExe);
              const detectedVersion = await getPhpVersion(phpExe);

              environments.push({
                name: `${config.name} ${version}`,
                path: path.dirname(phpExe),
                version: detectedVersion || version,
                iniPath: config.iniPath(config.basePath, version),
                extensionDir: config.extPath(config.basePath, version),
                status: isWorking ? "active" : "error",
              });
            }
          }
        }
      } else {
        // Check single installation
        const phpExe = config.phpPath(config.basePath);
        if (fs.existsSync(phpExe)) {
          const isWorking = await checkPhpExecutable(phpExe);
          const detectedVersion = await getPhpVersion(phpExe);

          environments.push({
            name: config.name,
            path: path.dirname(phpExe),
            version: detectedVersion || "Unknown",
            iniPath: config.iniPath(config.basePath),
            extensionDir: config.extPath(config.basePath),
            status: isWorking ? "active" : "error",
          });
        }
      }
    } catch (error) {
      console.error(`Error detecting ${config.name} environment:`, error);
    }
  }

  return environments;
}
