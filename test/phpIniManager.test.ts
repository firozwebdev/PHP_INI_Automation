import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import fs from "fs-extra";
import path from "path";
import {
  backupPhpIni,
  customizePhpIni,
  listPhpIniBackups,
  restorePhpIniBackup,
  validateSourceFile,
} from "../phpIniManager.js";

const TEST_DIR = path.join("test");
const TEST_INI_PATH = path.join(TEST_DIR, "test-php.ini");
const TEMP_INI_PATH = path.join(TEST_DIR, "temp-php.ini");

// Create a dummy php.ini for testing
beforeAll(async () => {
  await fs.writeFile(
    TEST_INI_PATH,
    ";extension=curl\n;extension=mbstring\n",
    "utf8"
  );
});

afterAll(async () => {
  await fs.remove(TEST_INI_PATH);
  await fs.remove(TEMP_INI_PATH);
  // Remove all backups
  const dir = path.dirname(TEST_INI_PATH);
  const base = path.basename(TEST_INI_PATH, ".ini");
  const files = await fs.readdir(dir);
  for (const f of files) {
    if (f.startsWith(base + ".backup.") && f.endsWith(".ini")) {
      await fs.remove(path.join(dir, f));
    }
  }
});

beforeEach(async () => {
  // Reset temp file before each test
  await fs.copy(TEST_INI_PATH, TEMP_INI_PATH);
});

describe("phpIniManager", () => {
  it("validateSourceFile throws if file does not exist", () => {
    expect(() =>
      validateSourceFile(path.join(TEST_DIR, "nonexistent.ini"))
    ).toThrow("php.ini file not found");
  });

  it("validateSourceFile does not throw if file exists", () => {
    expect(() => validateSourceFile(TEST_INI_PATH)).not.toThrow();
  });

  it("customizePhpIni enables extensions and updates settings", async () => {
    await customizePhpIni(TEMP_INI_PATH, "", { max_execution_time: 999 });
    const content = await fs.readFile(TEMP_INI_PATH, "utf8");
    expect(content).toContain("extension=curl");
    expect(content).toContain("extension=mbstring");
    expect(content).toContain("max_execution_time = 999");
  });

  it("backupPhpIni creates a backup file", async () => {
    const backupPath = await backupPhpIni(TEMP_INI_PATH);
    expect(await fs.pathExists(backupPath)).toBe(true);
    const backups = await listPhpIniBackups(TEMP_INI_PATH);
    expect(backups).toContain(backupPath);
  });

  it("restorePhpIniBackup restores a backup", async () => {
    // Change the file, back it up, then modify and restore
    await fs.writeFile(TEMP_INI_PATH, "original_content", "utf8");
    const backupPath = await backupPhpIni(TEMP_INI_PATH);
    await fs.writeFile(TEMP_INI_PATH, "changed_content", "utf8");
    await restorePhpIniBackup(backupPath, TEMP_INI_PATH);
    const restored = await fs.readFile(TEMP_INI_PATH, "utf8");
    expect(restored).toBe("original_content");
  });

  // Additional tests for customizePhpIni can be added with more advanced mocking or using a temp file
});
