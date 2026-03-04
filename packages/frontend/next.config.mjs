import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    images: {
        domains: ['hashscan.io'],
    },
    transpilePackages: ['@walletconnect/modal', '@walletconnect/modal-ui', '@walletconnect/modal-core'],

    webpack: (config) => {
        return config;
    },
};

export default nextConfig;
