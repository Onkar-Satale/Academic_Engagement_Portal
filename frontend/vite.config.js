import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: {
      port: 3000,
      open: false,
    },
    define: {
      'process.env': {
        ...Object.keys(env).reduce((prev, curr) => {
          if (curr.startsWith('REACT_APP_') || curr.startsWith('VITE_') || curr === 'NODE_ENV') {
            prev[curr] = env[curr];
          }
          return prev;
        }, {
          NODE_ENV: mode,
          REACT_APP_BACKEND_URL: env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
          REACT_APP_WEB3FORMS_KEY: env.REACT_APP_WEB3FORMS_KEY || '7c30012f-a14c-4141-b8af-64707af29229',
        }),
      },
    },
  };
});
