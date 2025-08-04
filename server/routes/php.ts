import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { determinePhpIniPaths } from '../../phpEnvironmentUtils.js';

const router = express.Router();
const execAsync = promisify(exec);

interface PhpEnvironment {
  name: string;
  path: string;
  version?: string;
  iniPath?: string;
  extensionDir?: string;
  status: 'active' | 'inactive' | 'error';
  isDefault?: boolean;
}

interface PhpInstallation {
  environments: PhpEnvironment[];
  activeEnvironment?: PhpEnvironment;
  systemInfo: {
    platform: string;
    architecture: string;
  };
}

/**
 * Get PHP version from executable
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
 * Detect PHP environments from common installation paths
 */
async function detectPhpEnvironments(): Promise<PhpEnvironment[]> {
  const environments: PhpEnvironment[] = [];
  
  const commonPaths = [
    { name: 'PVM', basePath: process.env.PVM_PATH, hasVersions: true },
    { name: 'Laragon', basePath: process.env.LARAGON_PATH, hasVersions: true },
    { name: 'XAMPP', basePath: process.env.XAMPP_PATH, hasVersions: false },
    { name: 'WAMP', basePath: process.env.WAMP_PATH, hasVersions: true },
    { name: 'Default', basePath: process.env.DEFAULT_PATH || (process.platform === 'win32' ? 'C:/php' : '/usr/local/php'), hasVersions: false },
  ];

  for (const envConfig of commonPaths) {
    if (!envConfig.basePath) continue;

    try {
      if (envConfig.hasVersions) {
        // Check for version-specific installations
        const phpDir = path.join(envConfig.basePath, 'php');
        if (await fs.pathExists(phpDir)) {
          const versions = await fs.readdir(phpDir);
          for (const version of versions) {
            const versionPath = path.join(phpDir, version);
            const phpExe = path.join(versionPath, process.platform === 'win32' ? 'php.exe' : 'bin/php');
            
            if (await fs.pathExists(phpExe)) {
              const isWorking = await checkPhpExecutable(phpExe);
              const detectedVersion = await getPhpVersion(phpExe);
              
              try {
                const { iniPath, extensionDir } = determinePhpIniPaths(version);
                environments.push({
                  name: `${envConfig.name} ${version}`,
                  path: versionPath,
                  version: detectedVersion || version,
                  iniPath,
                  extensionDir,
                  status: isWorking ? 'active' : 'error',
                });
              } catch (error) {
                environments.push({
                  name: `${envConfig.name} ${version}`,
                  path: versionPath,
                  version: detectedVersion || version,
                  status: 'error',
                });
              }
            }
          }
        }
      } else {
        // Check single installation
        const phpExe = path.join(envConfig.basePath, process.platform === 'win32' ? 'php.exe' : 'bin/php');
        if (await fs.pathExists(phpExe)) {
          const isWorking = await checkPhpExecutable(phpExe);
          const detectedVersion = await getPhpVersion(phpExe);
          
          try {
            const { iniPath, extensionDir } = determinePhpIniPaths('');
            environments.push({
              name: envConfig.name,
              path: envConfig.basePath,
              version: detectedVersion || 'Unknown',
              iniPath,
              extensionDir,
              status: isWorking ? 'active' : 'error',
            });
          } catch (error) {
            environments.push({
              name: envConfig.name,
              path: envConfig.basePath,
              version: detectedVersion || 'Unknown',
              status: 'error',
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error detecting ${envConfig.name} environment:`, error);
    }
  }

  return environments;
}

/**
 * GET /api/php/environments
 * Get all detected PHP environments
 */
router.get('/environments', async (req, res) => {
  try {
    const environments = await detectPhpEnvironments();
    
    // Determine active environment (first working one)
    const activeEnvironment = environments.find(env => env.status === 'active');
    
    const response: PhpInstallation = {
      environments,
      activeEnvironment,
      systemInfo: {
        platform: process.platform,
        architecture: process.arch,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error detecting PHP environments:', error);
    res.status(500).json({
      error: {
        message: 'Failed to detect PHP environments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/php/version/:version/info
 * Get detailed information about a specific PHP version
 */
router.get('/version/:version/info', async (req, res) => {
  try {
    const { version } = req.params;
    const { iniPath, extensionDir } = determinePhpIniPaths(version);
    
    // Check if ini file exists
    const iniExists = await fs.pathExists(iniPath);
    
    // Get ini file stats if it exists
    let iniStats = null;
    if (iniExists) {
      const stats = await fs.stat(iniPath);
      iniStats = {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
      };
    }

    res.json({
      version,
      iniPath,
      extensionDir,
      iniExists,
      iniStats,
    });
  } catch (error) {
    console.error('Error getting PHP version info:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get PHP version information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/php/validate
 * Validate PHP installation and configuration
 */
router.post('/validate', async (req, res) => {
  try {
    const { phpPath, version } = req.body;
    
    if (!phpPath) {
      return res.status(400).json({
        error: { message: 'PHP path is required' },
      });
    }

    const isValid = await checkPhpExecutable(phpPath);
    const detectedVersion = await getPhpVersion(phpPath);
    
    let iniInfo = null;
    try {
      const { iniPath, extensionDir } = determinePhpIniPaths(version || '');
      const iniExists = await fs.pathExists(iniPath);
      iniInfo = { iniPath, extensionDir, iniExists };
    } catch (error) {
      // INI detection failed
    }

    res.json({
      isValid,
      detectedVersion,
      iniInfo,
    });
  } catch (error) {
    console.error('Error validating PHP installation:', error);
    res.status(500).json({
      error: {
        message: 'Failed to validate PHP installation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
