const cds = require("@sap/cds");
const { INSERT } = require("@sap/cds/lib/ql/cds-ql");
const LOG = cds.log("usage-plugin-service");

module.exports = (srv) => {
  srv.on(["UPDATE", "INSERT"], "*", async (req, next) => {
    LOG.info(`Received data: ${JSON.stringify(req.data)}`);
    if (req.query?.INSERT) {
      LOG.info(`Target: ${req.query.INSERT.into.ref[0]}`);
    }
    next();
  });

  srv.on("cpu", async (req, next) => {
    LOG.info(`Received cpu usage: ${req.data.usage}`);
    await INSERT.into("UsageData").entries({
      type: "cpu",
      usage: req.data.usage,
    });
    next();
  });
};
