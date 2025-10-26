import path from 'node:path';
import { fileURLToPath } from 'node:url';

// __dirname is not available in ESM; derive it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence workspace root warning by explicitly setting Turbopack root
  turbopack: {
    // Use the monorepo root (one directory up from /web)
    root: path.resolve(__dirname, '..'),
  },
};

export default nextConfig;
