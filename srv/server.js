/* eslint-disable no-console */
const cds = require("@sap/cds");
const nodeOs = require("os");
var CronJob = require("cron").CronJob;

var { OSUtils } = require("node-os-utils");

const osutils = new OSUtils();

var job = new CronJob(
  "*/60 * * * * *",
  async function () {
    const usagePluginService = await cds.connect.to("UsagePluginService");

    try {
      // Get CPU usage
      const cpuUsage = toFixedNumber(
        await readMetricResult(osutils.cpu.usage(), "cpu usage")
      );
      console.log(`The cpuUsage was ${cpuUsage} %`);
      usagePluginService.send("cpu", { usage: cpuUsage });

      // Get memory usage
      const memInfo = await readMetricResult(osutils.memory.info(), "memory info");
      const memUsage = Math.round(memInfo.usagePercentage);
      console.log(`The memoryUsage was ${memUsage} %`);
      // usagePluginService.send("memory", { usage: memUsage });

      // NEW: Collect system status metrics
      const systemStatus = [...initialSystemStatus]; // Include the initial OS metrics

      // Add CPU metrics to system status
      systemStatus.push({
        category: 'cpu',
        name: 'usage',
        value: `${cpuUsage}%`,
        numericValue: cpuUsage,
        unit: '%',
        status: cpuUsage > 80 ? 'critical' : cpuUsage > 60 ? 'warning' : 'normal'
      });

      // Add memory metrics to system status
      systemStatus.push({
        category: 'memory',
        name: 'usage',
        value: `${memUsage}%`,
        numericValue: memUsage,
        unit: '%',
        status: memUsage > 80 ? 'critical' : memUsage > 60 ? 'warning' : 'normal'
      });

      const freeMemMb = toUnit(bytesFromDataSize(memInfo.available), "MB");
      const totalMemMb = toUnit(bytesFromDataSize(memInfo.total), "MB");

      systemStatus.push({
        category: 'memory',
        name: 'free',
        value: `${freeMemMb} MB`,
        numericValue: freeMemMb,
        unit: 'MB',
        status: 'normal'
      });

      systemStatus.push({
        category: 'memory',
        name: 'total',
        value: `${totalMemMb} MB`,
        numericValue: totalMemMb,
        unit: 'MB',
        status: 'normal'
      });

      // Add disk metrics to system status
      const diskInfo = await readMetricResult(osutils.disk.spaceOverview(), "disk overview");
      const diskUsage = toFixedNumber(diskInfo.usagePercentage);
      const freeDiskGb = toUnit(bytesFromDataSize(diskInfo.available), "GB");
      const totalDiskGb = toUnit(bytesFromDataSize(diskInfo.total), "GB");

      systemStatus.push({
        category: 'disk',
        name: 'usage',
        value: `${diskUsage}%`,
        numericValue: diskUsage,
        unit: '%',
        status: diskUsage > 90 ? 'critical' : diskUsage > 75 ? 'warning' : 'normal'
      });

      systemStatus.push({
        category: 'disk',
        name: 'free',
        value: `${freeDiskGb} GB`,
        numericValue: freeDiskGb,
        unit: 'GB',
        status: 'normal'
      });

      systemStatus.push({
        category: 'disk',
        name: 'total',
        value: `${totalDiskGb} GB`,
        numericValue: totalDiskGb,
        unit: 'GB',
        status: 'normal'
      });

      // Add network info
      try {
        const networkOverview = await readMetricResult(osutils.network.overview(), "network overview");
        const inputBytes = bytesFromDataSize(networkOverview.totalRxBytes);
        const outputBytes = bytesFromDataSize(networkOverview.totalTxBytes);

        if (inputBytes) {
          systemStatus.push({
            category: 'network',
            name: 'input',
            value: `${formatBytes(inputBytes)}`,
            numericValue: inputBytes,
            unit: 'B',
            status: 'normal'
          });
        }

        if (outputBytes) {
          systemStatus.push({
            category: 'network',
            name: 'output',
            value: `${formatBytes(outputBytes)}`,
            numericValue: outputBytes,
            unit: 'B',
            status: 'normal'
          });
        }
      } catch (netErr) {
        console.error("Error getting network stats:", netErr);
      }

      // Send all system status metrics to the service
      console.log(`Sending ${systemStatus.length} system status metrics`);
      usagePluginService.send("systemStatus", { metrics: systemStatus });

    } catch (error) {
      console.error("Error collecting system metrics:", error);
    }
  },
  null,
  false,
  "Europe/Berlin",
);

async function readMetricResult(metricPromise, label) {
  const result = await metricPromise;
  if (!result?.success) {
    throw new Error(`Unable to read ${label}`);
  }
  return result.data;
}

function bytesFromDataSize(value) {
  if (!value) return 0;
  if (typeof value.toBytes === "function") return value.toBytes();
  if (typeof value.bytes === "number") return value.bytes;
  return Number(value) || 0;
}

function toUnit(bytes, unit) {
  const divisor = unit === "GB" ? 1024 ** 3 : 1024 ** 2;
  return toFixedNumber(bytes / divisor);
}

function toFixedNumber(value, decimals = 2) {
  return Number(Number(value).toFixed(decimals));
}

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Initialize OS and uptime info once at server start
const initialOsInfo = {
  platform: nodeOs.platform(),
  uptime: formatUptime(nodeOs.uptime()),
  uptimeSeconds: nodeOs.uptime()
};

// Add the initial OS info to system status on server start
let initialSystemStatus = [];

// Add OS info to system status - these won't be updated in the cron job
initialSystemStatus.push({
  category: 'os',
  name: 'platform',
  value: initialOsInfo.platform,
  numericValue: 0,
  unit: '',
  status: 'normal'
});

initialSystemStatus.push({
  category: 'os',
  name: 'uptime',
  value: initialOsInfo.uptime,
  numericValue: initialOsInfo.uptimeSeconds,
  unit: 'seconds',
  status: 'normal'
});

// react on bootstrapping events...
cds.on("bootstrap", async (app) => {
  console.log("--> bootstrap");
});

cds.on("listening", ({ server }) => {
  job.start();

  // Send the initial OS metrics when the server starts
  cds.connect.to("UsagePluginService").then(usagePluginService => {
    usagePluginService.send("systemStatus", { metrics: initialSystemStatus });
    console.log("Sent initial OS and uptime information");
  }).catch(err => {
    console.error("Error sending initial metrics:", err);
  });
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
