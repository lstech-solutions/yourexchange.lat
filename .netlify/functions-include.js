// Only include essential files for serverless functions
module.exports = [
  // Next.js server files
  '.next/server/pages/**/*.js',
  '.next/server/chunks/**/*.js',
  '.next/static/chunks/pages/**/*.js',
  
  // Public assets (be specific)
  'public/assets/**/*',
  'public/logo*.svg',
  
  // Configuration
  'next.config.js',
  'package.json',
  'tsconfig.json',
  
  // Source code (be specific to API routes and server components)
  'src/app/api/**/*',
  'src/app/**/page.tsx',
  'src/app/**/layout.tsx',
  'src/lib/supabase/**/*',
  'src/middleware.ts'
]
