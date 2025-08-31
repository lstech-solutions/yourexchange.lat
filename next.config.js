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
    images: {
        domains: ['images.unsplash.com'],
    },
    transpilePackages: ['framer-motion'],
    experimental: {
        esmExternals: 'loose',
        serverComponentsExternalPackages: ['@supabase/supabase-js']
    },
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