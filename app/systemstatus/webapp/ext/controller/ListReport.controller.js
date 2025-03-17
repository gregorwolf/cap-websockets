sap.ui.define(
  [
    'sap/ui/core/mvc/ControllerExtension',
    'ui5-control-tablestatus/TableStatus',
  ],
  function (ControllerExtension, TableStatus) {
    'use strict';

    return ControllerExtension.extend(
      'systemstatus.ext.controller.ListReport',
      {
        // this section allows to extend lifecycle hooks or hooks provided by Fiori elements
        override: {
          /**
           * Called when a controller is instantiated and its View controls (if available) are already created.
           * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
           * @memberOf systemstatus.ext.controller.ListReport
           */
          onInit: function () {
            // you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
            var oModel = this.base.getExtensionAPI().getModel();
            
            // Get the current entity set from the controller
            const entity = this.base.getCurrentEntitySet();
            
            // Instead, call our new TableStatus helper
            TableStatus.createRealTimeIntegration(
              this,
              entity,
              '/ws/usage-plugin',
              'systemstatus::SystemStatusList--fe::table::SystemStatus::LineItem-toolbar',
              this.refreshTable.bind(this) // pass refresh function
            );
          },
          
          // Clean up when controller is destroyed
          onExit: function () {
            // Close WebSocket connection when leaving the page
            if (this._wsConnection) {
              this._wsConnection.close();
            }
          },
        },

        // Add a helper method to refresh the table data
        refreshTable: function () {
          const table = this.getView().byId(
            'systemstatus::SystemStatusList--fe::table::SystemStatus::LineItem-innerTable'
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
