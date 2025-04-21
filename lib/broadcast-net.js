import Node, { Address } from "./net.js";

export default class BroadNet {
  /**
   * @type {Address[]}
   */
  connections = [];

  /**
   * @type {Node}
   */
  you;

  /**
   * @param {string} you      — your own mwp://… address
   * @param {string[]} others — initial bootstrap peers
   */
  constructor(you = "mwp://localhost:8777", others = []) {
    // parse and store initial peer list
    this.connections = others.map((addr) => new Address(addr));

    // create your node and hook up its events
    this.you = new Node(you);
    this.you.onInit(() => {
      console.log(
        `→ Listening on ${this.you.address.host}:${this.you.address.port}`
      );
    });
    this.you.onMessage((msg, rinfo) =>
      this._handleRaw(JSON.parse(new TextDecoder().decode(msg)), rinfo)
    );
  }

  /** start listening on your port */
  listen() {
    this.you.listen();
  }

  /** stop listening */
  dontListen() {
    this.you.dontListen();
  }

  /** broadcast your intent to join the mesh */
  join() {
    const joinMsg = { type: "join", address: this.you.address };
    this._broadcastRaw(joinMsg);
  }

  /**
   * application‑level broadcast: every peer gets `{ type: "message", from, payload }`
   * @param {any} payload
   */
  broadcast(payload) {
    const msg = { type: "message", from: this.you.address, payload };
    this._broadcastRaw(msg);
  }

  /**
   * low‑level send to a single Address
   * @param {Address} addr
   * @param {object} msgObj
   */
  _sendTo(addr, msgObj) {
    const buf = new TextEncoder().encode(JSON.stringify(msgObj));
    return new Promise((res, rej) => {
      this.you.client.send(buf, addr.port, addr.host, (err) =>
        err ? rej(err) : res()
      );
    });
  }

  /**
   * low‑level broadcast to all known peers,
   * optionally excluding some addrs
   * @param {object} msgObj
   * @param {Address[]} [exclude=[]]
   */
  _broadcastRaw(msgObj, exclude = []) {
    this.connections.forEach((addr) => {
      if (!exclude.find((x) => x.host === addr.host && x.port === addr.port)) {
        this._sendTo(addr, msgObj);
      }
    });
  }

  /**
   * entry point for all incoming messages
   * @param {{type:string, ...}} obj
   * @param {*} rinfo
   */
  _handleRaw(obj, rinfo) {
    switch (obj.type) {
      case "join":
        return this._onJoin(
          new Address(`mwp://${obj.address.host}:${obj.address.port}`)
        );
      case "connections":
        return this._onConnections(obj.connections);
      case "message":
        return console.log(
          `[${obj.from.host}:${obj.from.port}] →`,
          obj.payload
        );
    }
  }

  /**
   * somebody new wants to join:
   *  • add them
   *  • tell your other peers about them
   *  • send them back your full mesh
   */
  _onJoin(newAddr) {
    // 1) add if not present
    if (
      !this.connections.find(
        (a) => a.host === newAddr.host && a.port === newAddr.port
      )
    ) {
      this.connections.push(newAddr);
    }

    // 2) let your other peers know
    this._broadcastRaw({ type: "join", address: newAddr }, [newAddr]);

    // 3) send them back your current mesh
    this._sendTo(newAddr, {
      type: "connections",
      connections: [...this.connections, this.you.address],
    });
  }

  /** merge in a peer list from someone else */
  _onConnections(list) {
    list.forEach((a) => {
      const addr = new Address(`mwp://${a.host}:${a.port}`);
      if (
        !this.connections.find(
          (x) => x.host === addr.host && x.port === addr.port
        ) &&
        !(
          addr.host === this.you.address.host &&
          addr.port === this.you.address.port
        )
      ) {
        this.connections.push(addr);
      }
    });
  }

  /** clean up */
  close() {
    this.you.close();
  }
}
