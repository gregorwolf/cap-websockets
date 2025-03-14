/* eslint-disable no-console */
const cds = require("@sap/cds");
var CronJob = require("cron").CronJob;

var osu = require("node-os-utils");
var cpu = osu.cpu;

var job = new CronJob(
  "*/5 * * * * *",
  async function () {
    const usagePluginService = await cds.connect.to("UsagePluginService");
    const cpuUsage = await cpu.usage(100);
    console.log(`The cpuUsage was ${cpuUsage} %`);
    usagePluginService.send("cpu", { usage: cpuUsage });
  },
  null,
  false,
  "Europe/Berlin"
);
// react on bootstrapping events...
cds.on("bootstrap", async (app) => {
  console.log("--> bootstrap");
});

cds.on("listening", ({ server }) => {
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
