const ngrok = require('ngrok');
const { spawn } = require('child_process');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

async function start() {
  console.log('🚀 Starting Unified Public Development Environment (Free Tier Friendly)...');

  const GATEWAY_PORT = 4242; // Uncommon port
  const HUGO_PORT = 1313;
  const CMS_PORT = 3000;

  try {
    // 1. Start the Unified Gateway (Reverse Proxy)
    // This allows us to use ONE ngrok tunnel for both Frontend and Backend
    const app = express();

    // Route /api to CMS
    app.use(
      '/api',
      createProxyMiddleware({
        target: `http://localhost:${CMS_PORT}`,
        changeOrigin: true,
        logLevel: 'silent',
      }),
    );

    // Route everything else to Hugo
    app.use(
      '/',
      createProxyMiddleware({
        target: `http://localhost:${HUGO_PORT}`,
        changeOrigin: true,
        ws: true, // Support Hugo LiveReload WebSockets
        logLevel: 'silent',
      }),
    );

    const server = app.listen(GATEWAY_PORT);
    console.log(`✅ Unified Gateway running on port ${GATEWAY_PORT}`);

    // 2. Start ONE Ngrok Tunnel
    const publicUrl = await ngrok.connect(GATEWAY_PORT);

    console.log('\n=================================================');
    console.log(`🔗 SHAREABLE URL: ${publicUrl}`);
    console.log('=================================================\n');

    // 3. Start Services

    // Tailwind CSS Watcher
    const tailwind = spawn('npm', ['run', 'watch:css'], { stdio: 'inherit', shell: true });

    // CMS Backend
    const cms = spawn('npm', ['run', 'dev', '--prefix', 'cms'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        FRONTEND_URL: publicUrl,
        CMS_PORT: CMS_PORT,
      },
    });

    // Hugo Server
    const hugo = spawn(
      'hugo',
      [
        'server',
        '-D',
        '--port',
        HUGO_PORT.toString(),
        '--baseURL',
        publicUrl,
        '--appendPort=false',
        '--liveReloadPort=443',
        '--bind',
        '0.0.0.0',
      ],
      { stdio: 'inherit', shell: true },
    );

    // Handle Cleanup
    process.on('SIGINT', async () => {
      console.log('\n👋 Shutting down...');
      tailwind.kill();
      cms.kill();
      hugo.kill();
      server.close();
      await ngrok.kill();
      process.exit();
    });
  } catch (err) {
    console.error('❌ Error starting pubdev:', err.message);
    process.exit(1);
  }
}

start();
