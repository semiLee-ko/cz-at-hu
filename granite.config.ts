import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
    appName: 'cz-at-hu',
    brand: {
        displayName: 'Little Trip',
        primaryColor: '#4ecdc4',
        icon: 'https://static.toss.im/appsintoss/10277/224029a0-58fc-459d-9164-fb57fbda4734.png',
        bridgeColorMode: 'basic',
    },
    web: {
        host: '0.0.0.0',
        port: 5173,
        commands: {
            dev: 'vite',
            build: 'vite build',
        },
    },
    permissions: [],
    webViewProps: {
        type: 'partner',
    },
    outdir: 'dist',
});
