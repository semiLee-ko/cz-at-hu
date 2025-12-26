export default {
    base: '/',
    build: {
        outDir: 'dist'
    },
    server: {
        proxy: {
            '/api/nominatim': {
                target: 'https://nominatim.openstreetmap.org',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
                headers: {
                    'User-Agent': 'LittleTrip/1.0 (dev-env)'
                }
            }
        }
    }
}
