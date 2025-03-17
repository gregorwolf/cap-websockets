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

            // Call TableStatus helper instead of creating our own WebSocket
            TableStatus.createRealTimeIntegration(
              this,
              entity,
              '/ws/usage-plugin',
              'cap.websockets.usagedata::UsageDataList--fe::table::UsageData::LineItem-toolbar',
              this.refreshTable.bind(this) // pass refresh function
            );
          },

          // Clean up when controller is destroyed
          onExit: function () {
            // If TableStatus created a connection, close it here
            if (this._wsConnection) {
              this._wsConnection.close();
            }
          },
        },

        // Add a helper method to refresh the table data
        refreshTable: function () {
          const table = this.getView().byId(
            'cap.websockets.usagedata::UsageDataList--fe::table::UsageData::LineItem-innerTable'
          );
          if (table) {
            const binding = table.getBinding('items');
            if (binding) {
              binding.refresh();
            }
          }
        },
      }
    );
  }
);
