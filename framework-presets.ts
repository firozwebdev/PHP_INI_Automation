#!/usr/bin/env bun

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import fs from 'fs-extra';
import { detectAllPhpEnvironments } from './phpEnvironmentUtils.js';
import { backupPhpIni, addCustomSettings, enableExtensions } from './phpIniManager.js';

/**
 * Framework-Specific PHP Configuration Presets
 * Intelligent, optimized configurations for popular frameworks
 */

interface FrameworkPreset {
  name: string;
  description: string;
  icon: string;
  category: string;
  extensions: string[];
  settings: { [key: string]: string | number };
  recommendations: string[];
  performance: 'high' | 'medium' | 'balanced';
  security: 'strict' | 'balanced' | 'permissive';
}

const FRAMEWORK_PRESETS: { [key: string]: FrameworkPreset } = {
  laravel: {
    name: 'Laravel',
    description: 'Optimized for Laravel applications with Eloquent, Artisan, and modern PHP features',
    icon: '🔥',
    category: 'Full-Stack Framework',
    extensions: [
      'curl', 'mbstring', 'openssl', 'pdo', 'pdo_mysql', 'pdo_sqlite', 'pdo_pgsql',
      'tokenizer', 'xml', 'json', 'fileinfo', 'zip', 'gd', 'bcmath', 'intl',
      'redis', 'memcached', 'opcache'
    ],
    settings: {
      'memory_limit': '512M',
      'max_execution_time': 300,
      'max_input_vars': 3000,
      'post_max_size': '100M',
      'upload_max_filesize': '100M',
      'max_file_uploads': 50,
      'session.gc_maxlifetime': 7200,
      'opcache.enable': 1,
      'opcache.memory_consumption': 256,
      'opcache.max_accelerated_files': 20000,
      'opcache.revalidate_freq': 0,
      'opcache.validate_timestamps': 1,
      'realpath_cache_size': '4096K',
      'realpath_cache_ttl': 600,
      'display_errors': 'On',
      'log_errors': 'On',
      'error_reporting': 'E_ALL'
    },
    recommendations: [
      'Enable Redis for session and cache storage',
      'Use Horizon for queue management',
      'Configure proper error logging',
      'Enable OPcache for production performance'
    ],
    performance: 'high',
    security: 'balanced'
  },

  wordpress: {
    name: 'WordPress',
    description: 'Optimized for WordPress sites with media handling and plugin compatibility',
    icon: '📝',
    category: 'CMS',
    extensions: [
      'curl', 'mbstring', 'openssl', 'pdo', 'pdo_mysql', 'mysqli',
      'xml', 'json', 'fileinfo', 'zip', 'gd', 'imagick', 'exif',
      'opcache', 'intl'
    ],
    settings: {
      'memory_limit': '256M',
      'max_execution_time': 300,
      'max_input_vars': 5000,
      'post_max_size': '64M',
      'upload_max_filesize': '64M',
      'max_file_uploads': 20,
      'session.gc_maxlifetime': 1440,
      'opcache.enable': 1,
      'opcache.memory_consumption': 128,
      'opcache.max_accelerated_files': 10000,
      'opcache.revalidate_freq': 2,
      'allow_url_fopen': 'On',
      'auto_prepend_file': '',
      'auto_append_file': '',
      'display_errors': 'Off',
      'log_errors': 'On',
      'error_reporting': 'E_ALL & ~E_DEPRECATED & ~E_STRICT'
    },
    recommendations: [
      'Use object caching for better performance',
      'Enable Imagick for better image processing',
      'Configure proper file upload limits',
      'Use Redis or Memcached for object caching'
    ],
    performance: 'balanced',
    security: 'balanced'
  },

  codeigniter: {
    name: 'CodeIgniter',
    description: 'Lightweight configuration for CodeIgniter framework',
    icon: '🚀',
    category: 'MVC Framework',
    extensions: [
      'curl', 'mbstring', 'openssl', 'pdo', 'pdo_mysql', 'mysqli',
      'xml', 'json', 'fileinfo', 'zip', 'gd', 'opcache'
    ],
    settings: {
      'memory_limit': '128M',
      'max_execution_time': 120,
      'max_input_vars': 1000,
      'post_max_size': '32M',
      'upload_max_filesize': '32M',
      'max_file_uploads': 10,
      'session.gc_maxlifetime': 1440,
      'opcache.enable': 1,
      'opcache.memory_consumption': 64,
      'opcache.max_accelerated_files': 4000,
      'opcache.revalidate_freq': 2,
      'display_errors': 'On',
      'log_errors': 'On',
      'error_reporting': 'E_ALL'
    },
    recommendations: [
      'Keep configuration lightweight',
      'Use database caching for better performance',
      'Enable error logging for debugging',
      'Consider using Composer for dependencies'
    ],
    performance: 'medium',
    security: 'balanced'
  },

  symfony: {
    name: 'Symfony',
    description: 'Enterprise-grade configuration for Symfony applications',
    icon: '🎼',
    category: 'Full-Stack Framework',
    extensions: [
      'curl', 'mbstring', 'openssl', 'pdo', 'pdo_mysql', 'pdo_pgsql', 'pdo_sqlite',
      'tokenizer', 'xml', 'json', 'fileinfo', 'zip', 'gd', 'bcmath', 'intl',
      'opcache', 'apcu', 'redis'
    ],
    settings: {
      'memory_limit': '512M',
      'max_execution_time': 300,
      'max_input_vars': 3000,
      'post_max_size': '100M',
      'upload_max_filesize': '100M',
      'max_file_uploads': 50,
      'session.gc_maxlifetime': 3600,
      'opcache.enable': 1,
      'opcache.memory_consumption': 256,
      'opcache.max_accelerated_files': 20000,
      'opcache.revalidate_freq': 0,
      'opcache.validate_timestamps': 1,
      'realpath_cache_size': '4096K',
      'realpath_cache_ttl': 600,
      'display_errors': 'Off',
      'log_errors': 'On',
      'error_reporting': 'E_ALL'
    },
    recommendations: [
      'Use APCu for application caching',
      'Configure Doctrine for database operations',
      'Enable Symfony profiler in development',
      'Use Redis for session storage in production'
    ],
    performance: 'high',
    security: 'strict'
  },

  drupal: {
    name: 'Drupal',
    description: 'Robust configuration for Drupal CMS with high performance',
    icon: '💧',
    category: 'CMS',
    extensions: [
      'curl', 'mbstring', 'openssl', 'pdo', 'pdo_mysql', 'pdo_pgsql',
      'xml', 'json', 'fileinfo', 'zip', 'gd', 'opcache', 'apcu'
    ],
    settings: {
      'memory_limit': '512M',
      'max_execution_time': 240,
      'max_input_vars': 5000,
      'post_max_size': '100M',
      'upload_max_filesize': '100M',
      'max_file_uploads': 50,
      'session.gc_maxlifetime': 2000,
      'opcache.enable': 1,
      'opcache.memory_consumption': 256,
      'opcache.max_accelerated_files': 20000,
      'opcache.revalidate_freq': 0,
      'display_errors': 'Off',
      'log_errors': 'On',
      'error_reporting': 'E_ALL & ~E_DEPRECATED'
    },
    recommendations: [
      'Use Redis or Memcached for caching',
      'Configure proper file permissions',
      'Enable clean URLs',
      'Use Drush for command-line operations'
    ],
    performance: 'high',
    security: 'strict'
  },

  magento: {
    name: 'Magento',
    description: 'High-performance configuration for Magento e-commerce',
    icon: '🛒',
    category: 'E-commerce',
    extensions: [
      'curl', 'mbstring', 'openssl', 'pdo', 'pdo_mysql', 'mysqli',
      'xml', 'json', 'fileinfo', 'zip', 'gd', 'bcmath', 'intl',
      'opcache', 'soap', 'xsl', 'redis'
    ],
    settings: {
      'memory_limit': '2G',
      'max_execution_time': 1800,
      'max_input_vars': 10000,
      'post_max_size': '100M',
      'upload_max_filesize': '100M',
      'max_file_uploads': 50,
      'session.gc_maxlifetime': 7200,
      'opcache.enable': 1,
      'opcache.memory_consumption': 512,
      'opcache.max_accelerated_files': 60000,
      'opcache.revalidate_freq': 0,
      'opcache.validate_timestamps': 1,
      'realpath_cache_size': '10M',
      'realpath_cache_ttl': 7200,
      'display_errors': 'Off',
      'log_errors': 'On',
      'error_reporting': 'E_ALL & ~E_DEPRECATED & ~E_STRICT'
    },
    recommendations: [
      'Use Redis for session and cache storage',
      'Enable Varnish for full-page caching',
      'Configure Elasticsearch for search',
      'Use RabbitMQ for message queuing'
    ],
    performance: 'high',
    security: 'strict'
  },

  development: {
    name: 'Development Environment',
    description: 'Developer-friendly configuration with debugging and profiling tools',
    icon: '🛠️',
    category: 'Development',
    extensions: [
      'curl', 'mbstring', 'openssl', 'pdo', 'pdo_mysql', 'pdo_sqlite', 'pdo_pgsql',
      'xml', 'json', 'fileinfo', 'zip', 'gd', 'xdebug', 'opcache'
    ],
    settings: {
      'memory_limit': '1G',
      'max_execution_time': 0,
      'max_input_vars': 10000,
      'post_max_size': '100M',
      'upload_max_filesize': '100M',
      'max_file_uploads': 50,
      'display_errors': 'On',
      'display_startup_errors': 'On',
      'log_errors': 'On',
      'error_reporting': 'E_ALL',
      'html_errors': 'On',
      'opcache.enable': 1,
      'opcache.validate_timestamps': 1,
      'opcache.revalidate_freq': 0,
      'xdebug.mode': 'debug,develop,profile',
      'xdebug.start_with_request': 'yes',
      'xdebug.client_port': 9003,
      'xdebug.max_nesting_level': 512
    },
    recommendations: [
      'Configure Xdebug for step debugging',
      'Use profiling tools for performance analysis',
      'Enable all error reporting',
      'Use development-specific logging'
    ],
    performance: 'medium',
    security: 'permissive'
  },

  production: {
    name: 'Production Environment',
    description: 'Secure, high-performance configuration for production servers',
    icon: '🏭',
    category: 'Production',
    extensions: [
      'curl', 'mbstring', 'openssl', 'pdo', 'pdo_mysql',
      'xml', 'json', 'fileinfo', 'zip', 'gd', 'opcache', 'apcu'
    ],
    settings: {
      'memory_limit': '256M',
      'max_execution_time': 30,
      'max_input_vars': 1000,
      'post_max_size': '32M',
      'upload_max_filesize': '32M',
      'max_file_uploads': 20,
      'display_errors': 'Off',
      'display_startup_errors': 'Off',
      'log_errors': 'On',
      'error_reporting': 'E_ALL & ~E_DEPRECATED & ~E_STRICT',
      'expose_php': 'Off',
      'allow_url_fopen': 'Off',
      'allow_url_include': 'Off',
      'session.cookie_httponly': 1,
      'session.cookie_secure': 1,
      'session.use_strict_mode': 1,
      'opcache.enable': 1,
      'opcache.memory_consumption': 128,
      'opcache.max_accelerated_files': 10000,
      'opcache.revalidate_freq': 60,
      'opcache.validate_timestamps': 0
    },
    recommendations: [
      'Disable unnecessary extensions',
      'Use secure session configuration',
      'Enable OPcache with validation disabled',
      'Configure proper error logging'
    ],
    performance: 'high',
    security: 'strict'
  }
};

export { FRAMEWORK_PRESETS, FrameworkPreset };
