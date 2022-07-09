const cds = require("@sap/cds");
var osu = require("node-os-utils");
var cpu = osu.cpu;

module.exports = function () {
  this.on("READ", "cpu", async (req) => {
    return { usage: await cpu.usage(100) };
  });
};
