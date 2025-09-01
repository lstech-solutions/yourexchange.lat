/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Configure for Supabase compatibility
  // Configure for Supabase compatibility
  experimental: {
    serverComponentsExternalPackages: [
      '@supabase/ssr',
      '@supabase/realtime-js',
    ],
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  
  // Explicitly transpile Supabase packages
  transpilePackages: [
    '@supabase/realtime-js',
    '@supabase/ssr',
    '@supabase/auth-helpers-nextjs'
  ],

  // Webpack configuration
  webpack: (config, { isServer, dev, webpack }) => {
    // Handle Node.js modules that should be ignored in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        // These modules are server-side only
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }

    // Add custom webpack configurations
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Ensure consistent module resolution
        '@': path.resolve(__dirname, './src'),
      },
      // Ensure .js extensions are resolved for ESM modules
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx']
      },
      // Add module directories
      modules: [path.resolve(__dirname, 'src'), 'node_modules']
    };

    // Important: return the modified config

    return config;
  },

  // Output standalone for Docker support
  output: 'standalone',

  // File tracing configuration
  outputFileTracingRoot: path.join(__dirname, '../../'),
  outputFileTracingExcludes: {
    '*': [
      '**/.git/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/.cache/**',
      '**/cypress/**',
      '**/test/**',
      '**/tests/**',
      '**/__tests__/**',
      '**/coverage/**',
      '**/dist/**',
      '**/build/**',
      '**/.vercel/**',
      '**/.netlify/**',
      '**/CHANGELOG.md',
      '**/*.md',
      '**/*.mdx',
      '**/*.test.ts',
      '**/*.test.js',
      '**/*.spec.ts',
      '**/*.spec.js',
      '**/tsconfig.json',
      '**/tsconfig.*.json',
      '**/next-env.d.ts',
    ],
  },

  // Transpile required packages
  transpilePackages: [
    '@radix-ui/*',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'framer-motion'
  ],

  // Image optimization
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true, // Disable Image Optimization API
  },

  // Experimental features
  experimental: {
    externalDir: true
  },
  // Disable X-Powered-By header
  poweredByHeader: false,
  // Enable compression
  compress: true,
  // Externalize large dependencies
  serverExternalPackages: [
    '@supabase/auth-helpers-nextjs',
    '@supabase/functions-js',
  ],
  webpack: (config, { isServer, dev }) => {
    // Ignore Deno-related files and imports
    const { IgnorePlugin } = require('webpack');
    config.plugins.push(
      new IgnorePlugin({
        resourceRegExp: /^https:\/\/deno\.land\/.*$/
      })
    );

    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: [
        /node_modules/,
        /\.next/
      ]
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        worker_threads: false,
      };
    }

    return config;
  },
};

// Only apply Sentry in production
if (process.env.NODE_ENV === 'production') {
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  });
} else {
  module.exports = nextConfig;
}