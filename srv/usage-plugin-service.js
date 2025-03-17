const cds = require("@sap/cds");
const { INSERT, DELETE } = require("@sap/cds/lib/ql/cds-ql");
const LOG = cds.log("usage-plugin-service");

module.exports = (srv) => {

  // Monitor entity changes and notify subscribers
  srv.on(["UPDATE", "INSERT", "DELETE"], "*", async (req, next) => {
    LOG.info(`Received data: ${JSON.stringify(req.data)}`);
    
    // Check if it's an INSERT operation
    const isInsert = !!req.query?.INSERT;
    // Check if it's an UPDATE operation
    const isUpdate = !!req.query?.UPDATE;
    // Check if it's a DELETE operation
    const isDelete = !!req.query?.DELETE;

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
    } else if (isDelete) {
      targetEntity = req.query.DELETE.from.ref[0];
      // Extract the entity name after the dot
      entityName = targetEntity.split('.').pop();
      LOG.info(`DELETE operation on target: ${targetEntity}, entity: ${entityName}`);
    }

    // Broadcast entity update event
    if (isInsert || isUpdate || isDelete) {
      LOG.info(`Broadcasting update for entity: ${entityName}`);
      
      // Send the entityUpdated event with just the entity name (after the dot)
      srv.emit("entityUpdated", {
        entity: entityName,
        operation: isInsert ? "INSERT" : (isUpdate ? "UPDATE" : "DELETE"),
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

  // New handler for systemStatus event from server.js
  srv.on("systemStatus", async (req, next) => {
    LOG.info(`Received system status metrics: ${req.data.metrics.length} items`);
    
    // First, delete existing records to keep only the latest data
    try {
      await DELETE.from('SystemStatus');
      LOG.info('Cleared previous system status records');
    } catch (err) {
      LOG.error('Error clearing system status records:', err);
    }
    
    // Insert all the new metrics
    for (const metric of req.data.metrics) {
      try {
        await INSERT.into("SystemStatus").entries({
          category: metric.category,
          name: metric.name,
          value: metric.value,
          numericValue: metric.numericValue,
          unit: metric.unit,
          status: metric.status
        });
      } catch (err) {
        LOG.error(`Error inserting metric ${metric.category}.${metric.name}:`, err);
      }
    }
    
    // Broadcast that SystemStatus has been updated
    // srv.emit("entityUpdated", {
    //   entity: "SystemStatus",
    //   operation: "UPDATE",
    //   data: { metrics: req.data.metrics.length }
    // });
    
    next();
  });
};
