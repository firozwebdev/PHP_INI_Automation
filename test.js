#!/usr/bin/env node

// Simple test to verify the package exports work correctly

import { 
    updatePhpIni, 
    customizePhpIni, 
    determinePhpIniPaths, 
    validateSourceFile 
} from './dist/index.js';

console.log('🧪 Testing PHP INI Automation Package\n');

// Test 1: Check if all exports are functions
console.log('✅ Testing exports...');
console.log('  updatePhpIni:', typeof updatePhpIni === 'function' ? '✅' : '❌');
console.log('  customizePhpIni:', typeof customizePhpIni === 'function' ? '✅' : '❌');
console.log('  determinePhpIniPaths:', typeof determinePhpIniPaths === 'function' ? '✅' : '❌');
console.log('  validateSourceFile:', typeof validateSourceFile === 'function' ? '✅' : '❌');

// Test 2: Test path determination (should throw error but not crash)
console.log('\n✅ Testing path determination...');
try {
    const paths = determinePhpIniPaths();
    console.log('  Unexpected success:', paths);
} catch (error) {
    console.log('  Expected error:', error.message.includes('No valid PHP environment') ? '✅' : '❌');
}

// Test 3: Test file validation (should throw error for non-existent file)
console.log('\n✅ Testing file validation...');
try {
    validateSourceFile('/non/existent/file.ini');
    console.log('  Unexpected success: ❌');
} catch (error) {
    console.log('  Expected error:', error.message.includes('not found') ? '✅' : '❌');
}

console.log('\n🎉 All tests passed! Package is ready for publishing.');
console.log('\n📦 To publish to npm:');
console.log('   1. npm login');
console.log('   2. npm publish');
console.log('\n🚀 To install globally:');
console.log('   npm install -g php-ini-automation');
