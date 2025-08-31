/** @type {import('next').NextConfig} */
const path = require('path');

// Remove the custom babel config since we'll use SWC
const fs = require('fs');
if (fs.existsSync(path.join(process.cwd(), '.babelrc'))) {
    fs.renameSync(
        path.join(process.cwd(), '.babelrc'),
        path.join(process.cwd(), '.babelrc.bak')
    );
}

const nextConfig = {
    output: 'standalone',
    images: {
        domains: ['images.unsplash.com'],
        unoptimized: true, // Disable Image Optimization API
    },
    experimental: {
        outputFileTracingRoot: path.join(__dirname, '../../'),
        // Enable experimental features for better module resolution
        externalDir: true,
        serverComponentsExternalPackages: ['@radix-ui/*', 'class-variance-authority', 'clsx', 'tailwind-merge'],
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
        // Enable granular chunks for better caching
        granularChunks: true,
        // Disable source maps in production
        productionBrowserSourceMaps: false,
    },
    // Enable SWC minification
    swcMinify: true,
    // Disable X-Powered-By header
    poweredByHeader: false,
    // Enable compression
    compress: true,
    // Optimize package imports
    experimental: {
        optimizePackageImports: ['@supabase/ssr','framer-motion']
    },
    // Externalize large dependencies
    serverExternalPackages: [
        '@supabase/supabase-js',
        '@supabase/auth-helpers-nextjs',
    ],
    webpack: (config, { isServer, dev }) => {
        // Ignore Deno-related files and imports
        const { IgnorePlugin } = require('webpack');
        config.plugins.push(
            new IgnorePlugin({
                resourceRegExp: /^https:\/\/deno\.land\/.*$/
            })
        );

        // Ignore the supabase-functions directory completely
        config.plugins.push(
            new IgnorePlugin({
                checkResource(resource) {
                    // Skip in development to avoid excessive logging
                    if (dev) return false;

                    const isSupabaseFunction =
                        resource.includes('supabase-functions') ||
                        resource.includes('supabase/functions');

                    if (isSupabaseFunction) {
                        console.log('Ignoring Supabase function:', resource);
                        return true;
                    }
                    return false;
                }
            })
        );

        // Exclude supabase functions from TypeScript/JavaScript processing
        config.module.rules.push({
            test: /\.(ts|tsx|js|jsx)$/,
            exclude: [
                /node_modules/,
                /\.next/,
                /supabase-functions/,
                /supabase\/functions/
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