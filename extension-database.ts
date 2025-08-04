#!/usr/bin/env bun

/**
 * Comprehensive PHP Extension Database
 * Detailed information about PHP extensions with descriptions, use cases, and dependencies
 */

export interface ExtensionInfo {
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  useCase: string[];
  frameworks: string[];
  dependencies: string[];
  conflicts: string[];
  phpVersions: string;
  performance: 'low' | 'medium' | 'high';
  security: 'safe' | 'caution' | 'risk';
  size: 'small' | 'medium' | 'large';
  popularity: number; // 1-10
  documentation: string;
  examples: string[];
  tips: string[];
}

export const EXTENSION_DATABASE: { [key: string]: ExtensionInfo } = {
  curl: {
    name: 'curl',
    displayName: 'cURL',
    description: 'Client URL library for making HTTP requests, downloading files, and API communication',
    category: 'Network & HTTP',
    icon: '🌐',
    useCase: [
      'Making HTTP/HTTPS requests to APIs',
      'Downloading files from remote servers',
      'OAuth authentication flows',
      'Payment gateway integrations',
      'Social media API connections'
    ],
    frameworks: ['Laravel', 'Symfony', 'WordPress', 'CodeIgniter', 'All'],
    dependencies: [],
    conflicts: [],
    phpVersions: 'PHP 5.0+',
    performance: 'medium',
    security: 'safe',
    size: 'medium',
    popularity: 10,
    documentation: 'https://www.php.net/manual/en/book.curl.php',
    examples: [
      '$ch = curl_init("https://api.example.com/data");',
      'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);',
      '$response = curl_exec($ch);'
    ],
    tips: [
      'Always set CURLOPT_RETURNTRANSFER to get response as string',
      'Use CURLOPT_SSL_VERIFYPEER for secure HTTPS connections',
      'Set timeout values to prevent hanging requests'
    ]
  },

  mbstring: {
    name: 'mbstring',
    displayName: 'Multibyte String',
    description: 'Handles multibyte character encodings (UTF-8, Unicode) for international applications',
    category: 'Text & Encoding',
    icon: '🌍',
    useCase: [
      'Processing UTF-8 text and emojis',
      'International character support',
      'String manipulation in multiple languages',
      'Email handling with special characters',
      'Database content with Unicode'
    ],
    frameworks: ['Laravel', 'Symfony', 'WordPress', 'Drupal', 'All'],
    dependencies: [],
    conflicts: [],
    phpVersions: 'PHP 4.0+',
    performance: 'low',
    security: 'safe',
    size: 'medium',
    popularity: 9,
    documentation: 'https://www.php.net/manual/en/book.mbstring.php',
    examples: [
      'mb_strlen("Hello 世界", "UTF-8"); // Correct length',
      'mb_substr("Hello 世界", 0, 5, "UTF-8");',
      'mb_convert_encoding($text, "UTF-8", "ISO-8859-1");'
    ],
    tips: [
      'Always specify encoding parameter in mb_ functions',
      'Use mb_strlen() instead of strlen() for UTF-8 strings',
      'Essential for any international application'
    ]
  },

  openssl: {
    name: 'openssl',
    displayName: 'OpenSSL',
    description: 'Cryptographic functions for encryption, decryption, digital signatures, and certificates',
    category: 'Security & Encryption',
    icon: '🔐',
    useCase: [
      'HTTPS/SSL connections',
      'Data encryption and decryption',
      'Digital signatures and certificates',
      'Password hashing (bcrypt, Argon2)',
      'JWT token generation and validation'
    ],
    frameworks: ['Laravel', 'Symfony', 'All'],
    dependencies: [],
    conflicts: [],
    phpVersions: 'PHP 4.0+',
    performance: 'medium',
    security: 'safe',
    size: 'large',
    popularity: 10,
    documentation: 'https://www.php.net/manual/en/book.openssl.php',
    examples: [
      'openssl_encrypt($data, "AES-256-CBC", $key, 0, $iv);',
      'openssl_random_pseudo_bytes(32); // Generate random bytes',
      'password_hash($password, PASSWORD_ARGON2ID);'
    ],
    tips: [
      'Use strong encryption algorithms like AES-256',
      'Always use random IVs for encryption',
      'Keep private keys secure and never expose them'
    ]
  },

  pdo: {
    name: 'pdo',
    displayName: 'PDO (PHP Data Objects)',
    description: 'Database abstraction layer providing consistent interface for multiple databases',
    category: 'Database',
    icon: '🗄️',
    useCase: [
      'Database connections (MySQL, PostgreSQL, SQLite)',
      'Prepared statements for security',
      'Transaction management',
      'Cross-database compatibility',
      'ORM foundations (Eloquent, Doctrine)'
    ],
    frameworks: ['Laravel', 'Symfony', 'CodeIgniter', 'All'],
    dependencies: [],
    conflicts: [],
    phpVersions: 'PHP 5.1+',
    performance: 'high',
    security: 'safe',
    size: 'medium',
    popularity: 10,
    documentation: 'https://www.php.net/manual/en/book.pdo.php',
    examples: [
      '$pdo = new PDO("mysql:host=localhost;dbname=test", $user, $pass);',
      '$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");',
      '$stmt->execute([$userId]);'
    ],
    tips: [
      'Always use prepared statements to prevent SQL injection',
      'Enable error mode: PDO::ERRMODE_EXCEPTION',
      'Use transactions for multiple related operations'
    ]
  },

  gd: {
    name: 'gd',
    displayName: 'GD Graphics',
    description: 'Image processing library for creating, manipulating, and converting images',
    category: 'Graphics & Media',
    icon: '🖼️',
    useCase: [
      'Image resizing and thumbnails',
      'Watermarking and image overlays',
      'CAPTCHA generation',
      'Chart and graph creation',
      'Image format conversion (JPEG, PNG, GIF)'
    ],
    frameworks: ['WordPress', 'Laravel', 'All'],
    dependencies: [],
    conflicts: ['imagick'],
    phpVersions: 'PHP 4.0+',
    performance: 'medium',
    security: 'caution',
    size: 'large',
    popularity: 8,
    documentation: 'https://www.php.net/manual/en/book.image.php',
    examples: [
      '$image = imagecreatefromjpeg("photo.jpg");',
      '$resized = imagescale($image, 300, 200);',
      'imagejpeg($resized, "thumbnail.jpg", 85);'
    ],
    tips: [
      'Always check if image functions exist before using',
      'Set memory_limit high for large image processing',
      'Use imagick for advanced image operations'
    ]
  },

  zip: {
    name: 'zip',
    displayName: 'ZIP Archive',
    description: 'Create, read, and extract ZIP archives for file compression and packaging',
    category: 'File & Archive',
    icon: '📦',
    useCase: [
      'Creating backup archives',
      'File downloads as ZIP packages',
      'Plugin/theme packaging',
      'Log file compression',
      'Bulk file operations'
    ],
    frameworks: ['WordPress', 'Laravel', 'All'],
    dependencies: [],
    conflicts: [],
    phpVersions: 'PHP 5.2+',
    performance: 'medium',
    security: 'caution',
    size: 'medium',
    popularity: 7,
    documentation: 'https://www.php.net/manual/en/book.zip.php',
    examples: [
      '$zip = new ZipArchive();',
      '$zip->open("archive.zip", ZipArchive::CREATE);',
      '$zip->addFile("document.pdf", "files/document.pdf");'
    ],
    tips: [
      'Check return values - ZipArchive methods can fail',
      'Use ZIPARCHIVE::CREATE | ZIPARCHIVE::OVERWRITE for new files',
      'Be careful with file paths to prevent directory traversal'
    ]
  },

  redis: {
    name: 'redis',
    displayName: 'Redis',
    description: 'High-performance in-memory data structure store for caching and sessions',
    category: 'Caching & Performance',
    icon: '⚡',
    useCase: [
      'Session storage for scalability',
      'Application caching (Laravel Cache)',
      'Queue management (Laravel Horizon)',
      'Real-time data storage',
      'Rate limiting and counters'
    ],
    frameworks: ['Laravel', 'Symfony', 'CodeIgniter'],
    dependencies: ['Redis server'],
    conflicts: [],
    phpVersions: 'PHP 5.3+',
    performance: 'high',
    security: 'safe',
    size: 'medium',
    popularity: 9,
    documentation: 'https://github.com/phpredis/phpredis',
    examples: [
      '$redis = new Redis();',
      '$redis->connect("127.0.0.1", 6379);',
      '$redis->set("key", "value", 3600); // TTL 1 hour'
    ],
    tips: [
      'Configure Redis server before enabling extension',
      'Use Redis for Laravel cache and sessions in production',
      'Monitor Redis memory usage and set maxmemory policy'
    ]
  },

  xdebug: {
    name: 'xdebug',
    displayName: 'Xdebug',
    description: 'Powerful debugging and profiling tool for PHP development',
    category: 'Development & Debugging',
    icon: '🐛',
    useCase: [
      'Step-by-step debugging in IDE',
      'Performance profiling and analysis',
      'Code coverage analysis for testing',
      'Stack trace enhancement',
      'Variable inspection and monitoring'
    ],
    frameworks: ['Development Only'],
    dependencies: [],
    conflicts: ['opcache'],
    phpVersions: 'PHP 7.2+',
    performance: 'low',
    security: 'risk',
    size: 'large',
    popularity: 8,
    documentation: 'https://xdebug.org/docs/',
    examples: [
      'xdebug_break(); // Breakpoint in code',
      'var_dump($variable); // Enhanced output',
      'xdebug_start_trace(); // Start execution trace'
    ],
    tips: [
      'NEVER enable Xdebug in production - major performance impact',
      'Configure IDE (VS Code, PhpStorm) for remote debugging',
      'Use xdebug.mode=debug,develop for development'
    ]
  },

  opcache: {
    name: 'opcache',
    displayName: 'OPcache',
    description: 'Opcode cache that dramatically improves PHP performance by caching compiled scripts',
    category: 'Performance & Optimization',
    icon: '🚀',
    useCase: [
      'Production performance optimization',
      'Reducing CPU usage and response time',
      'Caching compiled PHP bytecode',
      'Improving application scalability',
      'Essential for high-traffic websites'
    ],
    frameworks: ['All (Production)'],
    dependencies: [],
    conflicts: ['xdebug'],
    phpVersions: 'PHP 5.5+',
    performance: 'high',
    security: 'safe',
    size: 'medium',
    popularity: 10,
    documentation: 'https://www.php.net/manual/en/book.opcache.php',
    examples: [
      'opcache_reset(); // Clear cache',
      'opcache_get_status(); // Check cache status',
      'opcache_compile_file("/path/to/script.php");'
    ],
    tips: [
      'Essential for production - can improve performance by 2-3x',
      'Set opcache.validate_timestamps=0 in production',
      'Monitor opcache hit ratio and memory usage'
    ]
  },

  imagick: {
    name: 'imagick',
    displayName: 'ImageMagick',
    description: 'Advanced image processing library with support for 200+ image formats',
    category: 'Graphics & Media',
    icon: '🎨',
    useCase: [
      'Advanced image manipulation',
      'PDF thumbnail generation',
      'Image format conversion',
      'Image effects and filters',
      'Vector graphics processing'
    ],
    frameworks: ['WordPress', 'Laravel'],
    dependencies: ['ImageMagick system library'],
    conflicts: [],
    phpVersions: 'PHP 5.1+',
    performance: 'medium',
    security: 'caution',
    size: 'large',
    popularity: 7,
    documentation: 'https://www.php.net/manual/en/book.imagick.php',
    examples: [
      '$image = new Imagick("photo.jpg");',
      '$image->resizeImage(300, 200, Imagick::FILTER_LANCZOS, 1);',
      '$image->writeImage("resized.jpg");'
    ],
    tips: [
      'More powerful than GD but requires ImageMagick installed',
      'Better for complex image operations and PDF handling',
      'Can be memory intensive for large images'
    ]
  }
};

export const EXTENSION_CATEGORIES = {
  'Network & HTTP': ['curl', 'soap'],
  'Database': ['pdo', 'pdo_mysql', 'pdo_sqlite', 'pdo_pgsql', 'mysqli'],
  'Text & Encoding': ['mbstring', 'iconv', 'intl'],
  'Security & Encryption': ['openssl', 'hash', 'sodium'],
  'Graphics & Media': ['gd', 'imagick', 'exif'],
  'File & Archive': ['zip', 'fileinfo', 'ftp'],
  'Caching & Performance': ['opcache', 'apcu', 'redis', 'memcached'],
  'Development & Debugging': ['xdebug'],
  'XML & Data': ['xml', 'json', 'simplexml', 'xmlreader'],
  'Math & Science': ['bcmath', 'gmp'],
  'System & Process': ['pcntl', 'posix', 'shmop']
};

export function getExtensionsByCategory(category: string): ExtensionInfo[] {
  const extensionNames = EXTENSION_CATEGORIES[category] || [];
  return extensionNames
    .map(name => EXTENSION_DATABASE[name])
    .filter(ext => ext !== undefined);
}

export function searchExtensions(query: string): ExtensionInfo[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(EXTENSION_DATABASE).filter(ext =>
    ext.name.toLowerCase().includes(lowerQuery) ||
    ext.displayName.toLowerCase().includes(lowerQuery) ||
    ext.description.toLowerCase().includes(lowerQuery) ||
    ext.useCase.some(use => use.toLowerCase().includes(lowerQuery)) ||
    ext.frameworks.some(fw => fw.toLowerCase().includes(lowerQuery))
  );
}

export function getPopularExtensions(): ExtensionInfo[] {
  return Object.values(EXTENSION_DATABASE)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 10);
}

export function getFrameworkExtensions(framework: string): ExtensionInfo[] {
  return Object.values(EXTENSION_DATABASE).filter(ext =>
    ext.frameworks.includes(framework) || ext.frameworks.includes('All')
  );
}
