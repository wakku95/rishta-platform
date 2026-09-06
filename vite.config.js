process.env.NAPI_RS_FORCE_WASI = 'true';

import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { Scanner } from '@tailwindcss/oxide';
import fs from 'node:fs';
import path from 'node:path';

// Fix for Windows WASI environment:
// The Rust-based Oxide scanner in WASI mode cannot traverse Windows drive paths directly.
// We enhance Scanner.prototype.scan to collect project template files using Node fs
// and extract candidates via the Oxide WASM engine's scanFiles() method.
const originalScan = Scanner.prototype.scan;
Scanner.prototype.scan = function () {
    const results = originalScan.call(this);
    if (results && results.length > 0) {
        return results;
    }

    const files = [];
    const scanDirs = [
        path.resolve(process.cwd(), 'resources'),
    ];

    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'vendor') {
                    walk(fullPath);
                }
            } else if (/\.(jsx?|tsx?|blade\.php|html)$/i.test(entry.name)) {
                try {
                    files.push({
                        content: fs.readFileSync(fullPath, 'utf8'),
                        extension: path.extname(entry.name).slice(1),
                    });
                } catch {}
            }
        }
    }

    for (const dir of scanDirs) {
        walk(dir);
    }

    return this.scanFiles(files);
};

export default defineConfig({
    plugins: [
        tailwindcss(),
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.jsx'],
            refresh: true,
        }),
        react(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
