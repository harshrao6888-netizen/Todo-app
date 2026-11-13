import { defineConfig, devices } from '@playwright/test';

const API_PORT = 5055;
const WEB_PORT = 5174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    ...devices['Pixel 7'],
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm start',
      cwd: '../server',
      port: API_PORT,
      reuseExistingServer: false,
      env: {
        PORT: String(API_PORT),
        MONGODB_URI: process.env.E2E_MONGODB_URI || 'mongodb://127.0.0.1:27018/todo-app-e2e',
      },
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      port: WEB_PORT,
      reuseExistingServer: false,
      env: { API_PROXY: `http://localhost:${API_PORT}` },
    },
  ],
});
