const http2 = require('http2');
const fs = require('fs');
const WebSocket = require('ws');

// const serverOptions = {
//   key: fs.readFileSync('server.key'),
//   cert: fs.readFileSync('server.crt')
// };

const server = http2.createSecureServer(/*serverOptions*/);

server.on('stream', (stream, headers) => {
  const path = headers[':path'];
  const method = headers[':method'];

  if (path === '/ping' && method === 'GET') {
    setTimeout(() => {
      stream.respond({
        'content-type': 'text/plain',
        ':status': 200
      });
      stream.end('Pong after delay!');
    }, 5000);
  } else {
    stream.respond({ ':status': 404 });
    stream.end('Not found');
  }
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', ws => {
  ws.send('WebSocket connected!');
  ws.on('message', message => {
    console.log('Received:', message);
    ws.send(`Echo: ${message}`);
  });
});

server.listen(3000, () => {
  console.log('HTTP/2 server running on https://localhost:3000');
});
