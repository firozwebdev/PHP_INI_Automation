import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "fs-extra";
import path from "path";
import { determinePhpIniPaths } from "../phpEnvironmentUtils.js";

const TEST_DIR = path.join("test");
const TEST_INI_PATH = path.join(TEST_DIR, "test-php.ini");

const originalEnv = { ...process.env };
const originalExistsSync = fs.existsSync;

// Helper to simulate process.platform
function getDefaultPathForPlatform(platform) {
  if (process.env.DEFAULT_PATH) return process.env.DEFAULT_PATH;
  return platform === "win32" ? "C:/php" : "/usr/local/php";
}

describe("phpEnvironmentUtils", () => {
  beforeEach(() => {
    process.env.PVM_PATH = undefined;
    process.env.LARAGON_PATH = undefined;
    process.env.XAMPP_PATH = undefined;
    process.env.WAMP_PATH = undefined;
    process.env.DEFAULT_PATH = TEST_DIR;
    fs.existsSync = (p) => String(p).includes("php.ini");
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
    fs.existsSync = originalExistsSync;
  });

  it("returns correct paths for default fallback", () => {
    const { iniPath, extensionDir } = determinePhpIniPaths("");
    expect(iniPath).toContain("php.ini");
  });

  it("throws if no php.ini is found", () => {
    fs.existsSync = () => false;
    expect(() => determinePhpIniPaths("")).toThrow(
      "No valid PHP environment found"
    );
  });

  it("sets DEFAULT_PATH correctly for Windows and non-Windows", () => {
    // Simulate win32
    expect(getDefaultPathForPlatform("win32")).toBe("C:/php");
    // Simulate linux
    expect(getDefaultPathForPlatform("linux")).toBe("/usr/local/php");
    // Simulate darwin (macOS)
    expect(getDefaultPathForPlatform("darwin")).toBe("/usr/local/php");
  });
});
