import express from "express";
import fs from "fs-extra";
import { determinePhpIniPaths } from "../../phpEnvironmentUtils.js";
import { customizePhpIni, validateSourceFile } from "../../phpIniManager.js";

const router = express.Router();

interface IniSection {
  name: string;
  settings: { [key: string]: string | boolean | number };
  comments: string[];
}

interface IniContent {
  sections: IniSection[];
  globalSettings: { [key: string]: string | boolean | number };
  extensions: {
    enabled: string[];
    disabled: string[];
    available: string[];
  };
}

/**
 * Parse INI file content into structured format
 */
function parseIniContent(content: string): IniContent {
  const lines = content.split("\n");
  const sections: IniSection[] = [];
  const globalSettings: { [key: string]: string | boolean | number } = {};
  const enabledExtensions: string[] = [];
  const disabledExtensions: string[] = [];

  let currentSection: IniSection | null = null;
  let currentComments: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }

    // Handle comments
    if (trimmedLine.startsWith(";")) {
      currentComments.push(trimmedLine.substring(1).trim());
      continue;
    }

    // Handle section headers
    if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        name: trimmedLine.slice(1, -1),
        settings: {},
        comments: [...currentComments],
      };
      currentComments = [];
      continue;
    }

    // Handle key-value pairs
    const equalIndex = trimmedLine.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();

      // Parse value
      let parsedValue: string | boolean | number = value;
      if (value.toLowerCase() === "on" || value.toLowerCase() === "true") {
        parsedValue = true;
      } else if (
        value.toLowerCase() === "off" ||
        value.toLowerCase() === "false"
      ) {
        parsedValue = false;
      } else if (!isNaN(Number(value)) && value !== "") {
        parsedValue = Number(value);
      } else {
        // Remove quotes if present
        parsedValue = value.replace(/^["']|["']$/g, "");
      }

      // Handle extensions
      if (key === "extension") {
        enabledExtensions.push(parsedValue as string);
      } else if (key.startsWith(";extension")) {
        const extName = key.substring(1); // Remove semicolon
        if (extName === "extension") {
          disabledExtensions.push(parsedValue as string);
        }
      } else {
        // Regular setting
        if (currentSection) {
          currentSection.settings[key] = parsedValue;
        } else {
          globalSettings[key] = parsedValue;
        }
      }
    }

    // Clear comments after processing
    currentComments = [];
  }

  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    sections,
    globalSettings,
    extensions: {
      enabled: enabledExtensions,
      disabled: disabledExtensions,
      available: [...enabledExtensions, ...disabledExtensions],
    },
  };
}

/**
 * GET /api/ini/:version/content
 * Get parsed INI file content for a specific PHP version
 */
router.get("/:version/content", async (req, res) => {
  try {
    const { version } = req.params;
    const { iniPath } = determinePhpIniPaths(version);

    validateSourceFile(iniPath);

    const content = await fs.readFile(iniPath, "utf8");
    const parsedContent = parseIniContent(content);

    res.json({
      iniPath,
      content: parsedContent,
      rawContent: content,
      lastModified: (await fs.stat(iniPath)).mtime,
    });
  } catch (error) {
    console.error("Error reading INI file:", error);
    res.status(500).json({
      error: {
        message: "Failed to read INI file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * GET /api/ini/:version/raw
 * Get raw INI file content
 */
router.get("/:version/raw", async (req, res) => {
  try {
    const { version } = req.params;
    const { iniPath } = determinePhpIniPaths(version);

    validateSourceFile(iniPath);

    const content = await fs.readFile(iniPath, "utf8");

    res.json({
      iniPath,
      content,
      lastModified: (await fs.stat(iniPath)).mtime,
    });
  } catch (error) {
    console.error("Error reading INI file:", error);
    res.status(500).json({
      error: {
        message: "Failed to read INI file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * POST /api/ini/:version/update
 * Update INI file with new content
 */
router.post("/:version/update", async (req, res) => {
  try {
    const { version } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: { message: "Content is required" },
      });
    }

    const { iniPath } = determinePhpIniPaths(version);
    validateSourceFile(iniPath);

    // Create backup before updating
    const backupPath = `${iniPath}.backup.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ini`;
    await fs.copy(iniPath, backupPath);

    // Write new content
    await fs.writeFile(iniPath, content, "utf8");

    res.json({
      success: true,
      message: "INI file updated successfully",
      backupPath,
      lastModified: (await fs.stat(iniPath)).mtime,
    });
  } catch (error) {
    console.error("Error updating INI file:", error);
    res.status(500).json({
      error: {
        message: "Failed to update INI file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * POST /api/ini/:version/customize
 * Apply predefined customizations to INI file
 */
router.post("/:version/customize", async (req, res) => {
  try {
    const { version } = req.params;
    const { customSettings = {} } = req.body;

    const { iniPath, extensionDir } = determinePhpIniPaths(version);
    validateSourceFile(iniPath);

    await customizePhpIni(iniPath, extensionDir, customSettings);

    res.json({
      success: true,
      message: "INI file customized successfully",
      iniPath,
      extensionDir,
      lastModified: (await fs.stat(iniPath)).mtime,
    });
  } catch (error) {
    console.error("Error customizing INI file:", error);
    res.status(500).json({
      error: {
        message: "Failed to customize INI file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * POST /api/ini/:version/validate
 * Validate INI file syntax
 */
router.post("/:version/validate", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: { message: "Content is required for validation" },
      });
    }

    // Basic INI syntax validation
    const errors: string[] = [];
    const warnings: string[] = [];
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      if (!line || line.startsWith(";")) continue;

      // Check section headers
      if (line.startsWith("[")) {
        if (!line.endsWith("]")) {
          errors.push(`Line ${lineNumber}: Unclosed section header`);
        }
        continue;
      }

      // Check key-value pairs
      if (line.includes("=")) {
        const parts = line.split("=");
        if (parts.length < 2) {
          errors.push(`Line ${lineNumber}: Invalid key-value pair`);
        } else if (parts[0].trim() === "") {
          errors.push(`Line ${lineNumber}: Empty key name`);
        }
      } else {
        warnings.push(`Line ${lineNumber}: Line may not be properly formatted`);
      }
    }

    res.json({
      isValid: errors.length === 0,
      errors,
      warnings,
    });
  } catch (error) {
    console.error("Error validating INI content:", error);
    res.status(500).json({
      error: {
        message: "Failed to validate INI content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

export default router;
