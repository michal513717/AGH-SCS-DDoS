const http2 = require('http2');
const fs = require('fs');

const serverOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./certificate.pem'),
  allowHTTP1: true
};

const metrics = {
  activeStreams: 0,
  totalRequests: 0,
  resetStreams: 0,
  connectionsCount: 0,
  startTime: Date.now()
};

const server = http2.createSecureServer(serverOptions);

server.on('stream', (stream, headers) => {
  metrics.activeStreams++;
  metrics.totalRequests++;

  const path = headers[':path'];
  const method = headers[':method'];

  console.log(`[${new Date().toISOString()}] ${method} ${path} - Active streams: ${metrics.activeStreams}`);

  if (path === '/slow' && method === 'GET') {
    const timeout = setTimeout(() => {
      try {
        stream.respond({
          'content-type': 'application/json',
          ':status': 200
        });
        stream.end(JSON.stringify({ 
          message: 'Slow response completed',
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        console.log('Stream already closed:', err.message);
      }
      metrics.activeStreams--;
    }, 10000);

    stream.on('close', () => {
      clearTimeout(timeout);
      metrics.activeStreams--;
      metrics.resetStreams++;
      console.log(`Stream reset! Total resets: ${metrics.resetStreams}`);
    });

    stream.on('error', (err) => {
      clearTimeout(timeout);
      metrics.activeStreams--;
      console.log('Stream error:', err.message);
    });

    return;
  }

  if (path === '/metrics' && method === 'GET') {
    const currentMetrics = {
      ...metrics,
      memoryUsage: process.memoryUsage(),
      uptime: Date.now() - metrics.startTime
    };

    stream.respond({
      'content-type': 'application/json',
      ':status': 200
    });
    stream.end(JSON.stringify(currentMetrics, null, 2));
    metrics.activeStreams--;
    return;
  }

  if (path === '/' && method === 'GET') {
    stream.respond({
      'content-type': 'text/plain',
      ':status': 200
    });
    stream.end('HTTP/2 Rapid Reset Demo Server\nEndpoints:\n/slow - slow response\n/metrics - server statistics');
    metrics.activeStreams--;
    return;
  }

  stream.respond({ ':status': 404 });
  stream.end('Not found');
  metrics.activeStreams--;
});

server.on('session', (session) => {
  metrics.connectionsCount++;
  console.log(`New HTTP/2 session. Total connections: ${metrics.connectionsCount}`);
  
  session.on('close', () => {
    metrics.connectionsCount--;
    console.log(`Session closed. Active connections: ${metrics.connectionsCount}`);
  });
});

server.listen(3000, () => {
  console.log('HTTP/2 Rapid Reset Demo Server');
  console.log('Running on https://localhost:3000');
  console.log('Metrics available at /metrics');
  console.log('Slow endpoint at /slow');
  console.log('');
  console.log('WARNING: Educational demo - use locally only!');
});
