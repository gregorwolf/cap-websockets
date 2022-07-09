/* eslint-disable no-console */
const cds = require("@sap/cds");
const { WebSocketServer } = require("ws");
var CronJob = require("cron").CronJob;
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
cds.on("listening", ({ server }) => {
  console.log("--> listening");

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log("WSS HandleUpgrade");
      wss.emit("connection", ws, request);
    });
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
