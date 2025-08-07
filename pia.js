#!/usr/bin/env node

// PHP INI Automation - Short alias (pia)
// This is a simple wrapper that calls the main index.js file

const { spawn } = require('child_process');
const path = require('path');

// Get the directory where this script is located
const scriptDir = __dirname;

// Path to the main index.js file
const mainScript = path.join(scriptDir, 'dist', 'index.js');

// Pass all arguments to the main script
const args = process.argv.slice(2);

// Spawn the main script with the same arguments
const child = spawn('node', [mainScript, ...args], {
    stdio: 'inherit',
    cwd: process.cwd()
});

// Exit with the same code as the child process
child.on('exit', (code) => {
    process.exit(code || 0);
});

// Handle errors
child.on('error', (error) => {
    console.error('Error running PHP INI Automation:', error.message);
    process.exit(1);
});
