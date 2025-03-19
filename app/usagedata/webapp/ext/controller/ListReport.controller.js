sap.ui.define(
  ['sap/ui/core/mvc/ControllerExtension', 'ui5-reuse-tablestatus/TableStatus'],
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
            const tableId =
              'cap.websockets.usagedata::UsageDataList--fe::table::UsageData::LineItem-innerTable';

            // Create a standard refresh function using the helper
            const refreshFunction = TableStatus.createTableRefreshFunction(
              this,
              tableId
            );

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
          routing: {
            onAfterBinding: function () {
              console.log('onAfterBinding');

              // Get reference to the search button
              const searchButton = this.getView().byId(
                'cap.websockets.usagedata::UsageDataList--fe::FilterBar::UsageData-btnSearch'
              );

              // Check if button exists before attaching event
              if (searchButton) {
                // Attach press event handler
                searchButton.attachPress(this.onSearchButtonPressed.bind(this));
                console.log('Search button event handler attached');
              } else {
                console.warn('Search button not found');
              }
            },
          },
        },
        /**
         * Handler for search button press event
         * @param {sap.ui.base.Event} oEvent The press event object
         */
        onSearchButtonPressed: function (oEvent) {
          console.log('Search button pressed');
          
          // Reset the ObjectStatus to "Data is current" just like when pressing it directly
          if (this._updateDataStatus) {
            this._updateDataStatus(false);
          }
        },

        /**
         * Handle the table binding when it's available
         * @param {sap.ui.model.odata.v4.ODataListBinding} binding The table binding
         * @private
         */
        _handleTableBinding: function(binding) {
          console.log('Processing binding:', binding);
          
          // Remove any existing handler to avoid duplicates
          binding.detachDataReceived(this._onBindingDataReceived, this);
          
          // Attach to dataReceived event which fires when data is successfully fetched
          binding.attachDataReceived(this._onBindingDataReceived, this);
          
          // Store the current binding for use in checking visible records
          this._currentBinding = binding;
        },

        /**
         * Handler for binding's dataReceived event
         * @param {sap.ui.base.Event} oEvent The dataReceived event object
         * @private
         */
        _onBindingDataReceived: function(oEvent) {
          console.log('Data received event fired');
          // Now you can safely work with the binding data
          const binding = oEvent.getSource();
          const bindingContext = binding.getContext();
          const data = binding.getCurrentContexts();
          
          console.log('Number of records:', data.length);
          
          // Store the current contexts for real-time update filtering
          this._currentContexts = data;
          
          // Log the keys of visible records for debugging
          if (data && data.length > 0) {
            console.log('Currently visible records:');
            data.forEach(context => {
              const record = context.getObject();
              if (record) {
                console.log('Record ID:', record.ID || 'Unknown');
              }
            });
          }
        },

        /**
         * Determines if a record is in the current view
         * @param {object} recordData The record data including keys
         * @returns {boolean} True if the record is in the current view
         * @private
         */
        _isRecordInCurrentView: function(recordData) {
          if (!this._currentContexts || !recordData) {
            return false;
          }
          
          // Check if the record with the given keys is in current contexts
          return this._currentContexts.some(context => {
            const contextData = context.getObject();
            if (!contextData) return false;
            
            // In a real implementation, you would compare only key fields
            // For example: return contextData.ID === recordData.ID;
            
            // Here's a more generic implementation for any entity
            // We'll compare each property in recordData to see if at least one visible record matches
            return Object.keys(recordData).some(key => 
              contextData[key] === recordData[key]);
          });
        },
      }
    );
  }
);
