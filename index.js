// peer.js
const net = require('net');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');

if (process.argv.length < 3) {
  console.error('Usage: node peer.js <port> [peerHost:peerPort…]');
  process.exit(1);
}

const myPort = parseInt(process.argv[2], 10);
const initialPeers = process.argv.slice(3);

const peers = new Set();       // net.Socket objects
const seen = new Set();        // message UUIDs

// Start listening server
const server = net.createServer(socket => {
  setupSocket(socket);
});
server.listen(myPort, () => {
  console.log(`Peer listening on port ${myPort}`);
});

// Connect to any initial peers
initialPeers.forEach(addr => {
  const [host, port] = addr.split(':');
  const sock = net.connect(parseInt(port), host, () => {
    setupSocket(sock);
  });
});

// Handle incoming/outgoing on a socket
function setupSocket(socket) {
  peers.add(socket);
  socket.on('data', chunk => {
    let msg;
    try {
      msg = JSON.parse(chunk.toString());
    } catch (e) {
      return;
    }
    if (seen.has(msg.id)) return;      // already handled
    seen.add(msg.id);
    console.log(`📨 ${msg.from}: ${msg.text}`);
    // forward to others
    broadcast(msg, socket);
  });
  socket.on('close', () => peers.delete(socket));
}

// Broadcast a JSON message to all peers except `exceptSocket`
function broadcast(msg, exceptSocket = null) {
  const raw = JSON.stringify(msg);
  for (let p of peers) {
    if (p !== exceptSocket) p.write(raw);
  }
}

// Readline: send out messages
const rl = readline.createInterface({
  input: process.stdin, output: process.stdout
});
rl.setPrompt('> ');
rl.prompt();
rl.on('line', line => {
  const msg = {
    id: uuidv4(),
    from: `:${myPort}`,
    text: line.trim()
  };
  seen.add(msg.id);
  broadcast(msg);
  rl.prompt();
});
