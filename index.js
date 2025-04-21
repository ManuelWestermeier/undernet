import BroadNet from "./lib/broadcast-net.js";
import user from "./user.js";

const ports = [8777, 8778, 8779, 8780, 8781];

if (user < 0 || user >= ports.length) {
  console.error("❌ Invalid user index:", user);
  process.exit(1);
}

const port = ports[user];
const you = `mwp://localhost:${port}`;
const others = ports
  .filter((p) => p !== port)
  .map((p) => `mwp://localhost:${p}`);

const bn = new BroadNet(you, others);

bn.you.onInit(() => {
  console.log(`🟢 Node@${port} listening`);
  bn.join(); // auto-join on init
});

bn.you.onMessage((msgObj) => {
  if (msgObj.type === "message") {
    console.log(
      `📨 Node@${port} got message from ${msgObj.from.host}:${msgObj.from.port}:`,
      msgObj.payload
    );
  }
});

bn.listen();

setTimeout(() => {
  const msg = `Hello from ${port}`;
  console.log(`📣 Broadcasting: "${msg}"`);
  bn.broadcast(msg);
}, 1000 * user + 1);
