/* eslint-disable no-console */
const cds = require("@sap/cds");
var CronJob = require("cron").CronJob;

var osu = require("node-os-utils");
var cpu = osu.cpu;
var mem = osu.mem;
var os = osu.os;
var netstat = osu.netstat;
var drive = osu.drive;

var job = new CronJob(
  "*/10 * * * * *",
  async function () {
    const usagePluginService = await cds.connect.to("UsagePluginService");
    
    try {
      // Get CPU usage
      const cpuUsage = await cpu.usage(100);
      console.log(`The cpuUsage was ${cpuUsage} %`);
      usagePluginService.send("cpu", { usage: cpuUsage });
      
      // Get memory usage
      const memInfo = await mem.info();
      const memUsage = Math.round(memInfo.usedMemPercentage);
      console.log(`The memoryUsage was ${memUsage} %`);
      usagePluginService.send("memory", { usage: memUsage });
      
      // NEW: Collect system status metrics
      const systemStatus = [];
      
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
      
      systemStatus.push({
        category: 'memory',
        name: 'free',
        value: `${memInfo.freeMemMb} MB`,
        numericValue: memInfo.freeMemMb,
        unit: 'MB',
        status: 'normal'
      });
      
      systemStatus.push({
        category: 'memory',
        name: 'total',
        value: `${memInfo.totalMemMb} MB`,
        numericValue: memInfo.totalMemMb,
        unit: 'MB',
        status: 'normal'
      });
      
      // Add disk metrics to system status
      const diskInfo = await drive.info();
      systemStatus.push({
        category: 'disk',
        name: 'usage',
        value: `${diskInfo.usedPercentage}%`,
        numericValue: diskInfo.usedPercentage,
        unit: '%',
        status: diskInfo.usedPercentage > 90 ? 'critical' : diskInfo.usedPercentage > 75 ? 'warning' : 'normal'
      });
      
      systemStatus.push({
        category: 'disk',
        name: 'free',
        value: `${diskInfo.freeGb} GB`,
        numericValue: diskInfo.freeGb,
        unit: 'GB',
        status: 'normal'
      });
      
      systemStatus.push({
        category: 'disk',
        name: 'total',
        value: `${diskInfo.totalGb} GB`,
        numericValue: diskInfo.totalGb,
        unit: 'GB',
        status: 'normal'
      });
      
      // Add OS info to system status
      systemStatus.push({
        category: 'os',
        name: 'platform',
        value: os.platform(),
        numericValue: 0,
        unit: '',
        status: 'normal'
      });
      
      systemStatus.push({
        category: 'os',
        name: 'uptime',
        value: formatUptime(os.uptime()),
        numericValue: os.uptime(),
        unit: 'seconds',
        status: 'normal'
      });
      
      // Add network info
      try {
        const networkStats = await netstat.stats();
        const inputData = networkStats.find(stat => stat.inputBytes);
        const outputData = networkStats.find(stat => stat.outputBytes);
        
        if (inputData) {
          systemStatus.push({
            category: 'network',
            name: 'input',
            value: `${formatBytes(inputData.inputBytes)}`,
            numericValue: inputData.inputBytes,
            unit: 'B',
            status: 'normal'
          });
        }
        
        if (outputData) {
          systemStatus.push({
            category: 'network',
            name: 'output',
            value: `${formatBytes(outputData.outputBytes)}`,
            numericValue: outputData.outputBytes,
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
  "Europe/Berlin"
);

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
