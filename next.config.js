/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        domains: ['images.unsplash.com'],
    },
    transpilePackages: ['framer-motion'],
    experimental: {
        esmExternals: 'loose'
    }
};

export default nextConfig;