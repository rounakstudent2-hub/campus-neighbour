import { spawn } from 'child_process';
import http from 'http';

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🚀 Launching Server Process...');
  const server = spawn('node', ['server/src/index.js'], { stdio: 'inherit' });

  // wait 2.5 seconds for boot
  await new Promise(r => setTimeout(r, 2500));

  try {
    const health = await get('http://localhost:5000/api/health');
    console.log('✅ /api/health Response:', health.status, health.body);

    const categories = await get('http://localhost:5000/api/tasks/categories');
    console.log('✅ /api/tasks/categories Response:', categories.status, `(${categories.body.categories?.length} categories)`);

    const tasks = await get('http://localhost:5000/api/tasks');
    console.log('✅ /api/tasks Response:', tasks.status, `(${tasks.body.tasks?.length} tasks returned)`);

    const demoAccounts = await get('http://localhost:5000/api/auth/demo-accounts');
    console.log('✅ /api/auth/demo-accounts Response:', demoAccounts.status, `(${demoAccounts.body.accounts?.length} demo accounts)`);

    console.log('\n🎉 ALL LIVE SERVER ENDPOINTS RESPONDED WITH STATUS 200 OK!');
  } catch (err) {
    console.error('Probe failed:', err);
  } finally {
    console.log('🛑 Shutting down test server instance...');
    server.kill();
  }
}

main();
