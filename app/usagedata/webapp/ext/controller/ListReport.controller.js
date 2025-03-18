sap.ui.define(
  [
    'sap/ui/core/mvc/ControllerExtension',
    'ui5-reuse-tablestatus/TableStatus',
  ],
  function (ControllerExtension, TableStatus) {
    'use strict';

    return ControllerExtension.extend(
      'cap.websockets.usagedata.ext.controller.ListReport',
      {
        // this section allows to extend lifecycle hooks or hooks provided by Fiori elements
        override: {
          /**
           * Called when a controller is instantiated and its View controls (if available) are already created.
           * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
           * @memberOf cap.websockets.usagedata.ext.controller.ListReport
           */
          onInit: function () {
            // Get the current entity set from the controller
            const entity = this.base.getCurrentEntitySet();
            
            // Create the table ID
            const tableId = 'cap.websockets.usagedata::UsageDataList--fe::table::UsageData::LineItem-innerTable';
            
            // Create a standard refresh function using the helper
            const refreshFunction = TableStatus.createTableRefreshFunction(this, tableId);
            
            // Call TableStatus helper to setup real-time integration
            const integration = TableStatus.createRealTimeIntegration(
              this,
              entity,
              '/ws/usage-plugin',
              'cap.websockets.usagedata::UsageDataList--fe::table::UsageData::LineItem-toolbar',
              refreshFunction // pass the created refresh function
            );
            
            // Store the cleanup function for onExit
            this._tableStatusCleanup = integration.cleanup;
          },

          // Clean up when controller is destroyed
          onExit: function () {
            // Use the stored cleanup function
            if (this._tableStatusCleanup) {
              this._tableStatusCleanup();
            }
          },
        }
      }
    );
  }
);
