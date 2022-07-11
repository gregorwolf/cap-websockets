/* eslint-disable no-console */
const cds = require("@sap/cds");
const { parse } = require("url");
const { WebSocketServer } = require("ws");
var CronJob = require("cron").CronJob;
const passport = require("passport");
const xsenv = require("@sap/xsenv");

if (process.env.NODE_ENV === "production" || cds.env.env === "hybrid") {
  try {
    console.info("Setup @sap/xssec JWTStrategy");
    xsenv.loadEnv();
    const JWTStrategy = require("@sap/xssec").JWTStrategy;
    const services = xsenv.getServices({ xsuaa: { tags: "xsuaa" } });
    xsuaaCredentials = services.xsuaa;
    const jwtStrategy = new JWTStrategy(xsuaaCredentials);
    passport.use(jwtStrategy);
    global.JWTStrategy = JWTStrategy;
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
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "hybrid"
  ) {
    app.use(jwtLogger);
    await app.use(passport.initialize());
    await app.use(passport.authenticate("JWT", { session: false }));
  }
});

cds.on("listening", ({ server }) => {
  console.log("--> listening");

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url);
    if (pathname === "/ws") {
      authenticate(request, function next(err, client) {
        if (err || !client) {
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
  const auth = global.JWTStrategy(request, {});
  console.log(request.headers);
  next(true);
}
