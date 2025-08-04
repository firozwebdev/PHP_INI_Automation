import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { determinePhpIniPaths } from '../../phpEnvironmentUtils.js';

const router = express.Router();

interface ExtensionInfo {
  name: string;
  displayName: string;
  description: string;
  category: string;
  enabled: boolean;
  available: boolean;
  required: boolean;
  dependencies?: string[];
  conflicts?: string[];
  phpVersions?: string[];
}

// Comprehensive extension database with descriptions and metadata
const EXTENSION_DATABASE: { [key: string]: Omit<ExtensionInfo, 'name' | 'enabled' | 'available'> } = {
  // Core Extensions
  'curl': {
    displayName: 'cURL',
    description: 'Client URL library for HTTP requests and file transfers',
    category: 'Network',
    required: false,
    phpVersions: ['5.0+'],
  },
  'mbstring': {
    displayName: 'Multibyte String',
    description: 'Multibyte string handling functions for Unicode support',
    category: 'String',
    required: true,
    phpVersions: ['4.0+'],
  },
  'openssl': {
    displayName: 'OpenSSL',
    description: 'Cryptographic functions and SSL/TLS support',
    category: 'Security',
    required: false,
    phpVersions: ['4.0+'],
  },
  'pdo': {
    displayName: 'PDO',
    description: 'PHP Data Objects - database abstraction layer',
    category: 'Database',
    required: true,
    phpVersions: ['5.1+'],
  },
  'pdo_mysql': {
    displayName: 'PDO MySQL',
    description: 'MySQL driver for PDO',
    category: 'Database',
    required: false,
    dependencies: ['pdo'],
    phpVersions: ['5.1+'],
  },
  'pdo_sqlite': {
    displayName: 'PDO SQLite',
    description: 'SQLite driver for PDO',
    category: 'Database',
    required: false,
    dependencies: ['pdo'],
    phpVersions: ['5.1+'],
  },
  'pdo_pgsql': {
    displayName: 'PDO PostgreSQL',
    description: 'PostgreSQL driver for PDO',
    category: 'Database',
    required: false,
    dependencies: ['pdo'],
    phpVersions: ['5.1+'],
  },
  'mysqli': {
    displayName: 'MySQLi',
    description: 'MySQL Improved extension',
    category: 'Database',
    required: false,
    phpVersions: ['5.0+'],
  },
  'gd': {
    displayName: 'GD',
    description: 'Image processing and manipulation library',
    category: 'Graphics',
    required: false,
    phpVersions: ['4.0+'],
  },
  'imagick': {
    displayName: 'ImageMagick',
    description: 'Advanced image processing with ImageMagick',
    category: 'Graphics',
    required: false,
    conflicts: ['gmagick'],
    phpVersions: ['5.1+'],
  },
  'zip': {
    displayName: 'ZIP',
    description: 'ZIP archive reading and writing',
    category: 'Archive',
    required: false,
    phpVersions: ['5.2+'],
  },
  'xml': {
    displayName: 'XML',
    description: 'XML parsing and manipulation',
    category: 'Data',
    required: true,
    phpVersions: ['4.0+'],
  },
  'json': {
    displayName: 'JSON',
    description: 'JavaScript Object Notation data interchange',
    category: 'Data',
    required: true,
    phpVersions: ['5.2+'],
  },
  'session': {
    displayName: 'Session',
    description: 'Session handling functions',
    category: 'Core',
    required: true,
    phpVersions: ['4.0+'],
  },
  'fileinfo': {
    displayName: 'File Information',
    description: 'File type detection using magic numbers',
    category: 'File',
    required: false,
    phpVersions: ['5.3+'],
  },
  'intl': {
    displayName: 'Internationalization',
    description: 'Internationalization functions (ICU)',
    category: 'Localization',
    required: false,
    phpVersions: ['5.3+'],
  },
  'bcmath': {
    displayName: 'BC Math',
    description: 'Arbitrary precision mathematics',
    category: 'Math',
    required: false,
    phpVersions: ['4.0+'],
  },
  'gmp': {
    displayName: 'GMP',
    description: 'GNU Multiple Precision arithmetic',
    category: 'Math',
    required: false,
    phpVersions: ['4.0+'],
  },
  'soap': {
    displayName: 'SOAP',
    description: 'Simple Object Access Protocol client and server',
    category: 'Network',
    required: false,
    dependencies: ['libxml'],
    phpVersions: ['5.0+'],
  },
  'xsl': {
    displayName: 'XSL',
    description: 'XSL transformation support',
    category: 'Data',
    required: false,
    dependencies: ['libxml'],
    phpVersions: ['5.0+'],
  },
  'redis': {
    displayName: 'Redis',
    description: 'Redis client for caching and data structures',
    category: 'Cache',
    required: false,
    phpVersions: ['5.3+'],
  },
  'memcached': {
    displayName: 'Memcached',
    description: 'Memcached client for distributed caching',
    category: 'Cache',
    required: false,
    phpVersions: ['5.2+'],
  },
  'opcache': {
    displayName: 'OPcache',
    description: 'Opcode caching for improved performance',
    category: 'Performance',
    required: false,
    phpVersions: ['5.5+'],
  },
  'xdebug': {
    displayName: 'Xdebug',
    description: 'Debugging and profiling extension',
    category: 'Development',
    required: false,
    phpVersions: ['4.3+'],
  },
};

/**
 * Get available extensions from extension directory
 */
async function getAvailableExtensions(extensionDir: string): Promise<string[]> {
  if (!extensionDir || !await fs.pathExists(extensionDir)) {
    return [];
  }
  
  try {
    const files = await fs.readdir(extensionDir);
    const extensions = files
      .filter(file => file.endsWith('.dll') || file.endsWith('.so'))
      .map(file => path.basename(file, path.extname(file)))
      .filter(name => name.startsWith('php_') ? name.substring(4) : name);
    
    return extensions;
  } catch (error) {
    console.error('Error reading extension directory:', error);
    return [];
  }
}

/**
 * Parse enabled/disabled extensions from INI content
 */
function parseExtensionsFromIni(content: string): { enabled: string[]; disabled: string[] } {
  const lines = content.split('\n');
  const enabled: string[] = [];
  const disabled: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Enabled extension
    if (trimmedLine.startsWith('extension=')) {
      const extName = trimmedLine.substring(10).replace(/['"]/g, '');
      if (extName) enabled.push(extName);
    }
    
    // Disabled extension (commented out)
    if (trimmedLine.startsWith(';extension=')) {
      const extName = trimmedLine.substring(11).replace(/['"]/g, '');
      if (extName) disabled.push(extName);
    }
  }
  
  return { enabled, disabled };
}

/**
 * GET /api/extension/:version/list
 * Get all extensions with their status and information
 */
router.get('/:version/list', async (req, res) => {
  try {
    const { version } = req.params;
    const { iniPath, extensionDir } = determinePhpIniPaths(version);
    
    // Get available extensions from directory
    const availableExtensions = await getAvailableExtensions(extensionDir);
    
    // Parse INI file for enabled/disabled extensions
    let enabled: string[] = [];
    let disabled: string[] = [];
    
    if (await fs.pathExists(iniPath)) {
      const iniContent = await fs.readFile(iniPath, 'utf8');
      const parsed = parseExtensionsFromIni(iniContent);
      enabled = parsed.enabled;
      disabled = parsed.disabled;
    }
    
    // Combine all known extensions
    const allExtensions = new Set([
      ...Object.keys(EXTENSION_DATABASE),
      ...availableExtensions,
      ...enabled,
      ...disabled,
    ]);
    
    const extensions: ExtensionInfo[] = Array.from(allExtensions).map(name => {
      const dbInfo = EXTENSION_DATABASE[name] || {
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        description: `${name} extension`,
        category: 'Other',
        required: false,
      };
      
      return {
        name,
        ...dbInfo,
        enabled: enabled.includes(name),
        available: availableExtensions.includes(name) || enabled.includes(name) || disabled.includes(name),
      };
    });
    
    // Sort by category, then by name
    extensions.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.displayName.localeCompare(b.displayName);
    });
    
    res.json({
      extensions,
      summary: {
        total: extensions.length,
        enabled: enabled.length,
        disabled: disabled.length,
        available: availableExtensions.length,
      },
      extensionDir,
    });
  } catch (error) {
    console.error('Error listing extensions:', error);
    res.status(500).json({
      error: {
        message: 'Failed to list extensions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/extension/:version/toggle
 * Enable or disable an extension
 */
router.post('/:version/toggle', async (req, res) => {
  try {
    const { version } = req.params;
    const { extensionName, enable } = req.body;
    
    if (!extensionName) {
      return res.status(400).json({
        error: { message: 'Extension name is required' },
      });
    }
    
    const { iniPath } = determinePhpIniPaths(version);
    
    if (!await fs.pathExists(iniPath)) {
      return res.status(404).json({
        error: { message: 'INI file not found' },
      });
    }
    
    // Create backup before modifying
    const backupPath = `${iniPath}.backup.${new Date().toISOString().replace(/[:.]/g, '-')}.ini`;
    await fs.copy(iniPath, backupPath);
    
    let content = await fs.readFile(iniPath, 'utf8');
    const lines = content.split('\n');
    
    let modified = false;
    const extensionLine = `extension=${extensionName}`;
    const commentedLine = `;extension=${extensionName}`;
    
    // Find and modify existing lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === extensionLine || line === commentedLine) {
        lines[i] = enable ? extensionLine : commentedLine;
        modified = true;
        break;
      }
    }
    
    // If not found, add new line
    if (!modified) {
      const newLine = enable ? extensionLine : commentedLine;
      
      // Find a good place to insert (after other extensions or at the end)
      let insertIndex = lines.length;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith('extension=') || lines[i].trim().startsWith(';extension=')) {
          insertIndex = i + 1;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, newLine);
    }
    
    // Write back to file
    await fs.writeFile(iniPath, lines.join('\n'), 'utf8');
    
    res.json({
      success: true,
      message: `Extension ${extensionName} ${enable ? 'enabled' : 'disabled'} successfully`,
      extensionName,
      enabled: enable,
      backupPath,
    });
  } catch (error) {
    console.error('Error toggling extension:', error);
    res.status(500).json({
      error: {
        message: 'Failed to toggle extension',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/extension/:name/info
 * Get detailed information about a specific extension
 */
router.get('/:name/info', async (req, res) => {
  try {
    const { name } = req.params;
    
    const extensionInfo = EXTENSION_DATABASE[name];
    if (!extensionInfo) {
      return res.status(404).json({
        error: { message: 'Extension information not found' },
      });
    }
    
    res.json({
      name,
      ...extensionInfo,
    });
  } catch (error) {
    console.error('Error getting extension info:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get extension information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/extension/:version/bulk-toggle
 * Enable or disable multiple extensions at once
 */
router.post('/:version/bulk-toggle', async (req, res) => {
  try {
    const { version } = req.params;
    const { extensions } = req.body; // Array of { name: string, enable: boolean }
    
    if (!Array.isArray(extensions)) {
      return res.status(400).json({
        error: { message: 'Extensions array is required' },
      });
    }
    
    const { iniPath } = determinePhpIniPaths(version);
    
    if (!await fs.pathExists(iniPath)) {
      return res.status(404).json({
        error: { message: 'INI file not found' },
      });
    }
    
    // Create backup before modifying
    const backupPath = `${iniPath}.backup.${new Date().toISOString().replace(/[:.]/g, '-')}.ini`;
    await fs.copy(iniPath, backupPath);
    
    let content = await fs.readFile(iniPath, 'utf8');
    const lines = content.split('\n');
    
    const results: { name: string; success: boolean; enabled: boolean }[] = [];
    
    for (const { name, enable } of extensions) {
      try {
        let modified = false;
        const extensionLine = `extension=${name}`;
        const commentedLine = `;extension=${name}`;
        
        // Find and modify existing lines
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line === extensionLine || line === commentedLine) {
            lines[i] = enable ? extensionLine : commentedLine;
            modified = true;
            break;
          }
        }
        
        // If not found, add new line
        if (!modified) {
          const newLine = enable ? extensionLine : commentedLine;
          
          // Find a good place to insert
          let insertIndex = lines.length;
          for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim().startsWith('extension=') || lines[i].trim().startsWith(';extension=')) {
              insertIndex = i + 1;
              break;
            }
          }
          
          lines.splice(insertIndex, 0, newLine);
        }
        
        results.push({ name, success: true, enabled: enable });
      } catch (error) {
        results.push({ name, success: false, enabled: false });
      }
    }
    
    // Write back to file
    await fs.writeFile(iniPath, lines.join('\n'), 'utf8');
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `Successfully processed ${successCount}/${extensions.length} extensions`,
      results,
      backupPath,
    });
  } catch (error) {
    console.error('Error bulk toggling extensions:', error);
    res.status(500).json({
      error: {
        message: 'Failed to bulk toggle extensions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
