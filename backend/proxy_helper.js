const net = require('net');
const s = net.createServer((c) => {
  const r = net.connect(5432, '172.23.8.65', () => {
    c.pipe(r);
    r.pipe(c);
  });
  c.on('error', () => r.destroy());
  r.on('error', () => c.destroy());
});
s.listen(5432, '127.0.0.1', () => console.log('Proxy 5432 OK'));
