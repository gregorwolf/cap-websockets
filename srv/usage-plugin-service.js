const cds = require("@sap/cds");
const { INSERT, DELETE, SELECT, UPDATE } = require("@sap/cds/lib/ql/cds-ql");
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
      targetEntity = req.path;
      // Extract the entity name after the dot
      entityName = targetEntity.split(".").pop();
      LOG.info(
        `INSERT operation on target: ${targetEntity}, entity: ${entityName}`
      );
    } else if (isUpdate) {
      targetEntity = req.path;
      // Extract the entity name after the dot
      entityName = targetEntity.split(".").pop();
      LOG.info(
        `UPDATE operation on target: ${targetEntity}, entity: ${entityName}`
      );
    } else if (isDelete) {
      targetEntity = req.path;
      // Extract the entity name after the dot
      entityName = targetEntity.split(".").pop();
      LOG.info(
        `DELETE operation on target: ${targetEntity}, entity: ${entityName}`
      );
    }

    // Broadcast entity update event
    if (isInsert || isUpdate || isDelete) {
      LOG.info(`Broadcasting update for entity: ${entityName}`);

      // Extract key fields from the data
      // This is a generic approach to find key fields in the data
      const keyFields = {};
      
      // For SAP CDS entities, key fields are typically available in metadata
      // But for simplicity, we'll include all fields as potential keys
      // TODO: Implement a more efficient way to extract key fields from metadata
      if (req.data) {
        Object.assign(keyFields, req.data);
      }

      // Send the entityUpdated event with just the entity name (after the dot)
      srv.emit("entityUpdated", {
        entity: entityName,
        operation: isInsert ? "INSERT" : isUpdate ? "UPDATE" : "DELETE",
        data: req.data,
        keys: keyFields  // Include the key fields
      });
    }

    next();
  });

  srv.on("cpu", async (req, next) => {
    LOG.info(`Received cpu usage: ${req.data.usage}`);
    const usagePluginService = await cds.connect.to("UsagePluginService");
    await usagePluginService.run(
      INSERT.into("UsageData").entries({
        type: "cpu",
        usage: req.data.usage,
      })
    );
    next();
  });

  srv.on("memory", async (req, next) => {
    LOG.info(`Received memory usage: ${req.data.usage}`);
    await INSERT.into("UsagePluginService.UsageData").entries({
      type: "memory",
      usage: req.data.usage,
    });
    next();
  });

  // New handler for systemStatus event from server.js
  srv.on("systemStatus", async (req, next) => {
    LOG.info(
      `Received system status metrics: ${req.data.metrics.length} items`
    );

    // Get service connection
    const usagePluginService = await cds.connect.to("UsagePluginService");
    
    // Process all the metrics
    for (const metric of req.data.metrics) {
      try {
        // Special case for OS uptime - only insert once, never update
        if (metric.category === "os" && metric.name === "uptime") {
          // Check if it already exists
          const existingUptime = await usagePluginService.run(
            SELECT.from("SystemStatus")
              .where({ category: "os", name: "uptime" })
          );
          
          // Only insert if it doesn't exist yet
          if (!existingUptime || existingUptime.length === 0) {
            await usagePluginService.run(
              INSERT.into("SystemStatus").entries({
                category: metric.category,
                name: metric.name,
                value: metric.value,
                numericValue: metric.numericValue,
                unit: metric.unit,
                status: metric.status,
              })
            );
            LOG.info(`Inserted initial os uptime metric`);
          } else {
            LOG.info(`Skipping update for os uptime metric as it's meant to be static`);
          }
          continue; // Skip to next metric
        }
        
        // For all other metrics, check if they exist
        const existingRecord = await usagePluginService.run(
          SELECT.from("SystemStatus")
            .where({ category: metric.category, name: metric.name })
        );
        
        if (existingRecord && existingRecord.length > 0) {
          // Update existing record - using ID instead of composite keys
          await usagePluginService.run(
            UPDATE("SystemStatus")
              .set({
                value: metric.value,
                numericValue: metric.numericValue,
                unit: metric.unit,
                status: metric.status
              })
              .where({ ID: existingRecord[0].ID })
          );
          LOG.info(`Updated metric ${metric.category}.${metric.name} with ID: ${existingRecord[0].ID}`);
        } else {
          // Insert new record if it doesn't exist
          await usagePluginService.run(
            INSERT.into("SystemStatus").entries({
              category: metric.category,
              name: metric.name,
              value: metric.value,
              numericValue: metric.numericValue,
              unit: metric.unit,
              status: metric.status,
            })
          );
          LOG.info(`Inserted new metric ${metric.category}.${metric.name}`);
        }
      } catch (err) {
        LOG.error(
          `Error processing metric ${metric.category}.${metric.name}:`,
          err
        );
      }
    }

    next();
  });
};
