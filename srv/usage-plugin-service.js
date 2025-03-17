const cds = require("@sap/cds");
const { INSERT } = require("@sap/cds/lib/ql/cds-ql");
const LOG = cds.log("usage-plugin-service");

module.exports = (srv) => {

  // Monitor entity changes and notify subscribers
  srv.on(["UPDATE", "INSERT"], "*", async (req, next) => {
    LOG.info(`Received data: ${JSON.stringify(req.data)}`);
    
    // Check if it's an INSERT operation
    const isInsert = !!req.query?.INSERT;
    // Check if it's an UPDATE operation
    const isUpdate = !!req.query?.UPDATE;

    let targetEntity = "";
    let entityName = "";
    
    if (isInsert) {
      targetEntity = req.query.INSERT.into.ref[0];
      // Extract the entity name after the dot
      entityName = targetEntity.split('.').pop();
      LOG.info(`INSERT operation on target: ${targetEntity}, entity: ${entityName}`);
    } else if (isUpdate) {
      targetEntity = req.query.UPDATE.entity.ref[0];
      // Extract the entity name after the dot
      entityName = targetEntity.split('.').pop();
      LOG.info(`UPDATE operation on target: ${targetEntity}, entity: ${entityName}`);
    }

    // Broadcast entity update event
    if (isInsert || isUpdate) {
      LOG.info(`Broadcasting update for entity: ${entityName}`);
      
      // Send the entityUpdated event with just the entity name (after the dot)
      srv.emit("entityUpdated", {
        entity: entityName,
        operation: isInsert ? "INSERT" : "UPDATE",
        data: req.data
      });
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

  srv.on("memory", async (req, next) => {
    LOG.info(`Received memory usage: ${req.data.usage}`);
    await INSERT.into("UsageData").entries({
      type: "memory",
      usage: req.data.usage,
    });
    next();
  });
};
