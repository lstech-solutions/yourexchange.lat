// This file helps Netlify determine which files to include in the function bundle
// Only include what's absolutely necessary for the functions to run
module.exports = [
  // Include the built Next.js pages
  '.next/server/pages/**/*.js',
  '.next/server/chunks/**/*',
  '.next/static/chunks/pages/**/*.js',
  
  // Include public assets
  'public/**/*',
  
  // Include environment variables
  '.env*',
  
  // Include package files
  'package.json',
  'package-lock.json',
  
  // Include Next.js config
  'next.config.js',
  
  // Include any other necessary files
  'src/**/*',
  'components/**/*',
  'lib/**/*',
  'middleware.js',
  'tailwind.config.js',
  'postcss.config.js',
  'tsconfig.json'
]
