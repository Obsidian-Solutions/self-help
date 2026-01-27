const { spawn } = require('child_process');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

async function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const check = async (attempts = 0) => {
      try {
        const response = await axios.get('http://127.0.0.1:4040/api/tunnels');
        const url = response.data.tunnels[0].public_url;
        resolve(url);
      } catch (err) {
        if (attempts > 10) reject(new Error('Ngrok timed out.'));
        else setTimeout(() => check(attempts + 1), 1000);
      }
    };
    check();
  });
}

async function start() {
  console.log('🚀 Starting Unified Public Development Environment (Ngrok CLI)...');

  const GATEWAY_PORT = 4242;
  const HUGO_PORT = 1313;
  const CMS_PORT = 3000;

  try {
    // 1. Start the Unified Gateway (Reverse Proxy)
    const app = express();
    app.use(
      '/api',
      createProxyMiddleware({
        target: `http://localhost:${CMS_PORT}`,
        changeOrigin: true,
        logLevel: 'silent',
      }),
    );
    app.use(
      '/',
      createProxyMiddleware({
        target: `http://localhost:${HUGO_PORT}`,
        changeOrigin: true,
        ws: true,
        logLevel: 'silent',
      }),
    );
    const server = app.listen(GATEWAY_PORT);
    console.log(`✅ Unified Gateway running on port ${GATEWAY_PORT}`);

    // 2. Start Ngrok CLI
    const ngrokProcess = spawn('npx', ['ngrok', 'http', GATEWAY_PORT.toString()], {
      stdio: 'ignore',
      shell: true,
    });

    console.log('⏳ Waiting for Ngrok URL...');
    const publicUrl = await getNgrokUrl();

    console.log('\n=================================================');
    console.log(`🔗 SHAREABLE URL: ${publicUrl}`);
    console.log('=================================================\n');

    // 3. Start Services via Concurrently for beautiful logs
    const { concurrently } = require('concurrently');

    const { result } = concurrently(
      [
        { command: 'npm run watch:css', name: 'CSS', prefixColor: 'magenta' },
        {
          command: `npm run dev --prefix cms`,
          name: 'CMS',
          prefixColor: 'green',
          env: { ...process.env, FRONTEND_URL: publicUrl, CMS_PORT: CMS_PORT },
        },
        {
          command: `hugo server -D --port ${HUGO_PORT} --baseURL ${publicUrl} --appendPort=false --liveReloadPort=443 --bind 0.0.0.0`,
          name: 'HUGO',
          prefixColor: 'blue',
        },
      ],
      {
        prefix: '[{name}]',
        killOthers: ['failure', 'success'],
      },
    );

    process.on('SIGINT', async () => {
      console.log('\n👋 Shutting down...');
      server.close();
      ngrokProcess.kill();
      process.exit();
    });
  } catch (err) {
    console.error('❌ Error starting pubdev:', err.message);
    process.exit(1);
  }
}

start();
