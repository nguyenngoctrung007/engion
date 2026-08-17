import http from 'http';

const server = http.createServer((req, res) => {
  console.log('Received request:', req.url);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Server working!</h1>');
});

server.listen(49152, '127.0.0.1', () => {
  console.log('Test server listening on http://127.0.0.1:49152');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
