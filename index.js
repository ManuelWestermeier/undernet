import BroadNet from "./lib/broadcast-net";

const isU1 = false;

const u1 = "mwp://localhost:8777";
const u2 = "mwp://localhost:8778";

const bn = new BroadNet(isU1 ? u1 : u2, [isU1 ? u2 : u1]);
