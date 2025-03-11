const cds = require("@sap/cds");
const { INSERT } = require("@sap/cds/lib/ql/cds-ql");
const LOG = cds.log("usage-plugin-service");

module.exports = (srv) => {
  srv.on("cpu", async (req, next) => {
    LOG.info(`Received cpu usage: ${req.data.usage}`);
    await INSERT.into("UsageData").entries({
      type: "cpu",
      usage: req.data.usage,
    });
    next();
  });
};
