import express from "express";
import fs from "fs-extra";
import path from "path";
import { determinePhpIniPaths } from "../../phpEnvironmentUtils.js";
import {
  backupPhpIni,
  listPhpIniBackups,
  restorePhpIniBackup,
} from "../../phpIniManager.js";

const router = express.Router();

interface BackupInfo {
  filename: string;
  fullPath: string;
  timestamp: Date;
  size: number;
  description?: string;
  version?: string;
}

/**
 * Parse backup filename to extract metadata
 */
function parseBackupFilename(filename: string): {
  timestamp: Date;
  version?: string;
} {
  // Expected format: php.backup.2024-06-19T12-00-00-000Z.ini
  const match = filename.match(/php\.backup\.(.+)\.ini$/);
  if (match) {
    const timestampStr = match[1]
      .replace(/[-]/g, ":")
      .replace(/T/, "T")
      .replace(/Z$/, "Z");
    try {
      const timestamp = new Date(timestampStr);
      return { timestamp };
    } catch (error) {
      // Fallback to file stats
    }
  }
  return { timestamp: new Date(0) };
}

/**
 * GET /api/backup/:version/list
 * List all backups for a specific PHP version
 */
router.get("/:version/list", async (req, res) => {
  try {
    const { version } = req.params;
    const { iniPath } = determinePhpIniPaths(version);

    const backupFiles = await listPhpIniBackups(iniPath);
    const backupInfos: BackupInfo[] = [];

    for (const backupFile of backupFiles) {
      try {
        const stats = await fs.stat(backupFile);
        const filename = path.basename(backupFile);
        const { timestamp } = parseBackupFilename(filename);

        backupInfos.push({
          filename,
          fullPath: backupFile,
          timestamp: timestamp.getTime() > 0 ? timestamp : stats.mtime,
          size: stats.size,
          version,
        });
      } catch (error) {
        console.error(`Error getting stats for backup ${backupFile}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    backupInfos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    res.json({
      backups: backupInfos,
      totalCount: backupInfos.length,
      totalSize: backupInfos.reduce((sum, backup) => sum + backup.size, 0),
    });
  } catch (error) {
    console.error("Error listing backups:", error);
    res.status(500).json({
      error: {
        message: "Failed to list backups",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * POST /api/backup/:version/create
 * Create a new backup of the current INI file
 */
router.post("/:version/create", async (req, res) => {
  try {
    const { version } = req.params;
    const { description } = req.body;

    const { iniPath } = determinePhpIniPaths(version);

    // Check if INI file exists
    if (!(await fs.pathExists(iniPath))) {
      return res.status(404).json({
        error: { message: "INI file not found" },
      });
    }

    const backupPath = await backupPhpIni(iniPath);
    const stats = await fs.stat(backupPath);

    // If description provided, create a metadata file
    if (description) {
      const metadataPath = `${backupPath}.meta.json`;
      await fs.writeJson(metadataPath, {
        description,
        created: new Date().toISOString(),
        originalPath: iniPath,
        version,
      });
    }

    res.json({
      success: true,
      message: "Backup created successfully",
      backup: {
        filename: path.basename(backupPath),
        fullPath: backupPath,
        timestamp: stats.mtime,
        size: stats.size,
        description,
        version,
      },
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    res.status(500).json({
      error: {
        message: "Failed to create backup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * POST /api/backup/:version/restore
 * Restore INI file from a backup
 */
router.post("/:version/restore", async (req, res) => {
  try {
    const { version } = req.params;
    const { backupPath, createBackupBeforeRestore = true } = req.body;

    if (!backupPath) {
      return res.status(400).json({
        error: { message: "Backup path is required" },
      });
    }

    const { iniPath } = determinePhpIniPaths(version);

    // Check if backup file exists
    if (!(await fs.pathExists(backupPath))) {
      return res.status(404).json({
        error: { message: "Backup file not found" },
      });
    }

    // Create backup of current INI before restoring
    let currentBackupPath = null;
    if (createBackupBeforeRestore && (await fs.pathExists(iniPath))) {
      currentBackupPath = await backupPhpIni(iniPath);
    }

    // Restore from backup
    await restorePhpIniBackup(backupPath, iniPath);

    res.json({
      success: true,
      message: "INI file restored successfully",
      restoredFrom: backupPath,
      currentBackup: currentBackupPath,
      lastModified: (await fs.stat(iniPath)).mtime,
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    res.status(500).json({
      error: {
        message: "Failed to restore backup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * DELETE /api/backup/:version/delete
 * Delete a specific backup file
 */
router.delete("/:version/delete", async (req, res) => {
  try {
    const { backupPath } = req.body;

    if (!backupPath) {
      return res.status(400).json({
        error: { message: "Backup path is required" },
      });
    }

    // Check if backup file exists
    if (!(await fs.pathExists(backupPath))) {
      return res.status(404).json({
        error: { message: "Backup file not found" },
      });
    }

    // Delete backup file
    await fs.remove(backupPath);

    // Delete metadata file if it exists
    const metadataPath = `${backupPath}.meta.json`;
    if (await fs.pathExists(metadataPath)) {
      await fs.remove(metadataPath);
    }

    res.json({
      success: true,
      message: "Backup deleted successfully",
      deletedPath: backupPath,
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    res.status(500).json({
      error: {
        message: "Failed to delete backup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * GET /api/backup/:version/content
 * Get content of a specific backup file
 */
router.get("/:version/content", async (req, res) => {
  try {
    const { backupPath } = req.query;

    if (!backupPath || typeof backupPath !== "string") {
      return res.status(400).json({
        error: { message: "Backup path is required" },
      });
    }

    // Check if backup file exists
    if (!(await fs.pathExists(backupPath))) {
      return res.status(404).json({
        error: { message: "Backup file not found" },
      });
    }

    const content = await fs.readFile(backupPath, "utf8");
    const stats = await fs.stat(backupPath);

    // Check for metadata
    let metadata = null;
    const metadataPath = `${backupPath}.meta.json`;
    if (await fs.pathExists(metadataPath)) {
      metadata = await fs.readJson(metadataPath);
    }

    res.json({
      content,
      metadata,
      stats: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      },
    });
  } catch (error) {
    console.error("Error reading backup content:", error);
    res.status(500).json({
      error: {
        message: "Failed to read backup content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * POST /api/backup/:version/cleanup
 * Clean up old backup files
 */
router.post("/:version/cleanup", async (req, res) => {
  try {
    const { version } = req.params;
    const { keepCount = 10, olderThanDays = 30 } = req.body;

    const { iniPath } = determinePhpIniPaths(version);
    const backupFiles = await listPhpIniBackups(iniPath);

    const backupInfos: BackupInfo[] = [];
    for (const backupFile of backupFiles) {
      try {
        const stats = await fs.stat(backupFile);
        const filename = path.basename(backupFile);
        const { timestamp } = parseBackupFilename(filename);

        backupInfos.push({
          filename,
          fullPath: backupFile,
          timestamp: timestamp.getTime() > 0 ? timestamp : stats.mtime,
          size: stats.size,
          version,
        });
      } catch (error) {
        console.error(`Error getting stats for backup ${backupFile}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    backupInfos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const deletedFiles: string[] = [];
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    );

    // Delete files older than cutoff date, but keep at least keepCount files
    for (let i = keepCount; i < backupInfos.length; i++) {
      const backup = backupInfos[i];
      if (backup.timestamp < cutoffDate) {
        try {
          await fs.remove(backup.fullPath);

          // Delete metadata file if it exists
          const metadataPath = `${backup.fullPath}.meta.json`;
          if (await fs.pathExists(metadataPath)) {
            await fs.remove(metadataPath);
          }

          deletedFiles.push(backup.filename);
        } catch (error) {
          console.error(`Error deleting backup ${backup.fullPath}:`, error);
        }
      }
    }

    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedFiles.length} backup files.`,
      deletedFiles,
      remainingCount: backupInfos.length - deletedFiles.length,
    });
  } catch (error) {
    console.error("Error cleaning up backups:", error);
    res.status(500).json({
      error: {
        message: "Failed to cleanup backups",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

export default router;
