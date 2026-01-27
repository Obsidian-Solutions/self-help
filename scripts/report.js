/**
 * MindFull Build Reporter
 * Provides a clean summary of build results.
 */

const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function logHeader(text) {
  console.log(`\n${colors.bright}${colors.blue}==> ${text}${colors.reset}`);
}

function run(command, name) {
  try {
    process.stdout.write(`${colors.cyan}  → Running ${name}... ${colors.reset}`);
    execSync(command, { stdio: 'ignore' });
    console.log(`${colors.green}PASSED${colors.reset}`);
    return true;
  } catch (err) {
    console.log(`${colors.red}FAILED${colors.reset}`);
    return false;
  }
}

console.log(`${colors.bright}${colors.blue}--- MindFull Health Check ---${colors.reset}`);

const steps = [
  { name: 'JavaScript Linting', cmd: 'npm run lint:js' },
  { name: 'Markdown Linting', cmd: 'npm run lint:md' },
  { name: 'Code Formatting', cmd: 'npm run format:check' },
  { name: 'Tailwind Build', cmd: 'npm run build:css' },
  { name: 'Hugo Production Build', cmd: 'HUGO_ENV=production hugo --minify' },
];

let allPassed = true;
steps.forEach(step => {
  const passed = run(step.cmd, step.name);
  if (!passed) allPassed = false;
});

console.log('\n-----------------------------------');
if (allPassed) {
  console.log(
    `${colors.green}${colors.bright}✅ ALL SYSTEMS GO - Project is healthy!${colors.reset}`,
  );
  process.exit(0);
} else {
  console.log(
    `${colors.red}${colors.bright}❌ ISSUES FOUND - Check logs above for details.${colors.reset}`,
  );
  process.exit(1);
}
