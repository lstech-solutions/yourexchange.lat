// Only include essential files for serverless functions
module.exports = [
  // Only include API routes and their direct dependencies
  '.next/server/pages/api/**/*.js',
  '.next/server/chunks/**/*.js',
  
  // Configuration
  'next.config.js',
  'package.json',
  
  // Only include necessary source files
  'src/app/api/**/*',
  'src/lib/supabase/**/*',
  
  // Explicitly exclude large dependencies
  '!**/node_modules/**/*',
  '!**/.next/cache/**',
  '!**/.next/static/chunks/**',
  '!**/public/**',
  '!**/cypress/**',
  '!**/test/**',
  '!**/tests/**',
  '!**/__tests__/**',
  '!**/coverage/**',
  '!**/dist/**',
  '!**/build/**',
  '!**/.vercel/**'
].filter(Boolean);
