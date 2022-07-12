/* eslint-disable no-console */
const cds = require("@sap/cds");
const { parse } = require("url");
const { WebSocketServer } = require("ws");
var CronJob = require("cron").CronJob;
const xsenv = require("@sap/xsenv");

if (process.env.NODE_ENV === "production" || cds.env.env === "hybrid") {
  try {
    console.info("Setup @sap/xssec JWTStrategy");
    xsenv.loadEnv();
    const JWTStrategy = require("@sap/xssec").JWTStrategy;
    const services = xsenv.getServices({ xsuaa: { tags: "xsuaa" } });
    xsuaaCredentials = services.xsuaa;
    const jwtStrategy = new JWTStrategy(xsuaaCredentials);
    global.jwtStrategy = jwtStrategy;
  } catch (error) {
    console.warn(error.message);
  }
}

var osu = require("node-os-utils");
var cpu = osu.cpu;

var job = new CronJob(
  "*/5 * * * * *",
  async function () {
    const cpuUsage = await cpu.usage(100);
    console.log(`The cpuUsage was ${cpuUsage} %`);
    sendMessageToConnectedClients({ usage: cpuUsage });
  },
  null,
  false,
  "Europe/Berlin"
);
// WebSocket library
const wss = new WebSocketServer({ noServer: true });

// react on bootstrapping events...
cds.on("bootstrap", async (app) => {
  console.log("--> bootstrap");
});

cds.on("listening", ({ server }) => {
  console.log("--> listening");

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url);
    if (pathname === "/ws" || pathname === "/index.html/ws") {
      authenticate(request, function next(err, client) {
        if (err) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
          console.log("WSS HandleUpgrade");
          wss.emit("connection", ws, request);
        });
      });
    } else {
      console.warn(`Pathname ${pathname} not allowed for WebSocket connection`);
      socket.destroy();
    }
  });

  global.wss = wss;

  // Use this if the 4th param is default value(false)
  job.start();
});

cds.on("shutdown", () => {
  console.log("--> shutdown");
  job.stop();
});

// handle and override options
module.exports = (options) => {
  // delegate to default server.js
  return cds.server(options);
};

function sendMessageToConnectedClients(messageContent) {
  // Loop through all connected clients
  for (const client of global.wss.clients) {
    client.send(JSON.stringify(messageContent));
  }
}

function authenticate(request, next) {
  console.log("authenticate WebSocket request");
  try {
    const auth = global.jwtStrategy.authenticate(request, {});
    return next(false);
  } catch (error) {
    console.log("authentication failed");
    return next(true);
  }
}
