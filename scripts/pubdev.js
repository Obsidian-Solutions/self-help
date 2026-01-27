const ngrok = require('ngrok');
const { spawn } = require('child_process');
const path = require('path');

async function start() {
  console.log('🚀 Starting Public Development Environment...');

  try {
    // 1. Start Ngrok Tunnels
    // Hugo (Frontend)
    const hugoUrl = await ngrok.connect(1313);
    console.log(`🔗 Hugo Frontend Public URL: ${hugoUrl}`);

    // CMS (Backend)
    const cmsUrl = await ngrok.connect(3000);
    console.log(`🔗 CMS Backend Public URL: ${cmsUrl}`);

    console.log('\n--- Press Ctrl+C to stop all services ---\n');

    // 2. Start Services

    // Tailwind CSS Watcher
    const tailwind = spawn('npm', ['run', 'watch:css'], { stdio: 'inherit', shell: true });

    // CMS Backend
    // We pass the public URLs as environment variables
    const cms = spawn('npm', ['run', 'dev', '--prefix', 'cms'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        FRONTEND_URL: hugoUrl,
        CMS_PORT: 3000,
      },
    });

    // Hugo Server
    // We pass the public Hugo URL as baseURL and the CMS URL as a param
    const hugo = spawn(
      'hugo',
      [
        'server',
        '-D',
        '--baseURL',
        hugoUrl,
        '--appendPort=false',
        '--liveReloadPort=443', // Often needed for ngrok https
        '--bind',
        '0.0.0.0',
        '--params',
        `cms_url=${cmsUrl}`,
      ],
      { stdio: 'inherit', shell: true },
    );

    // Handle Cleanup
    process.on('SIGINT', async () => {
      console.log('\n👋 Shutting down...');
      tailwind.kill();
      cms.kill();
      hugo.kill();
      await ngrok.kill();
      process.exit();
    });
  } catch (err) {
    console.error('❌ Error starting pubdev:', err);
    process.exit(1);
  }
}

start();
