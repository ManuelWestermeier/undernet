import dgram from "dgram";

export class Address {
  host = "localhost";
  port = 8777;

  constructor(str = "") {
    if (!str) return;
    const url = new URL(str);
    if (url.protocol !== "mwp:") {
      throw new Error("URL protocol isn't mwp: " + str);
    }
    this.host = url.hostname;
    this.port = parseInt(url.port) || 8777;
  }
}

export default class Node {
  client = dgram.createSocket("udp4");
  address;
  isListening = false;

  messageCallback = (msg, rinfo) => {};
  initCallback = () => {};

  constructor(address) {
    this.address = new Address(address);
  }

  onMessage(callback = (msg, rinfo) => {}) {
    this.messageCallback = callback;
  }

  onInit(callback = () => {}) {
    this.initCallback = callback;
  }

  listen() {
    if (this.isListening) return;
    this.client.bind(this.address.port, this.address.host, () => {
      this.isListening = true;
      this.initCallback();
    });

    this.client.on("message", (msg, rinfo) => {
      this.messageCallback(msg, rinfo);
    });
  }

  dontListen() {
    if (!this.isListening) return;
    this.client.removeAllListeners("message");
    this.isListening = false;
  }

  close() {
    this.dontListen();
    this.client.close();
  }

  send(data, other = "adress") {
    const message =
      data instanceof Uint8Array
        ? data
        : new TextEncoder().encode(String(data));

    const address = new Address(other);

    return new Promise((resolve, reject) => {
      this.client.send(message, address.port, address.host, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
