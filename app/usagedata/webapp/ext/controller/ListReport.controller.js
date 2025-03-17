sap.ui.define(
  [
    'sap/ui/core/mvc/ControllerExtension',
    'sap/m/ObjectStatus',
    'sap/ui/mdc/actiontoolbar/ActionToolbarAction',
  ],
  function (ControllerExtension, ObjectStatus, ActionToolbarAction) {
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

            // Generate a unique client ID for this instance
            this._clientId =
              'client_' + Math.random().toString(36).substring(2, 15);

            // 1. Create a WebSocket connection to the same endpoint used in Component.js
            let wsUrl = '';
            if (document.location.protocol === 'https:') {
              wsUrl = 'wss://' + document.location.host + '/ws/usage-plugin';
            } else {
              wsUrl = 'ws://' + document.location.host + '/ws/usage-plugin';
            }

            this._ws = new WebSocket(wsUrl);

            // 2. Listen for messages
            this._ws.onmessage = (event) => {
              const message = JSON.parse(event.data);
              const msgType = message.event; // e.g. "entityUpdated"
              const msgData = message.data; // { entity, operation, data: {...} }

              // 3. Check for our 'entityUpdated' event and filter by entity
              if (msgType === 'entityUpdated') {
                // Only process updates for the current entity we're viewing
                if (msgData.entity === entity) {
                  console.log(
                    `Received update for ${entity}: ${msgData.operation}`
                  );

                  // Update the UI to reflect new data
                  this._updateDataStatus(true);
                }
              }
            };

            this._ws.onopen = () => {
              console.log(
                `[ListReport.controller.js] WebSocket connection open, subscribing to ${entity} updates`
              );
              // Subscribe to the entity updates when connection is established
              this.subscribeToEntity(entity);
            };

            this._ws.onclose = () => {
              console.log(
                '[ListReport.controller.js] WebSocket connection closed'
              );
            };
          },

          // Unsubscribe from entity updates
          unsubscribeFromEntity: function (entity) {
            if (this._ws && this._ws.readyState === WebSocket.OPEN) {
              // Send unsubscribe request
              const unsubscribeMsg = {
                event: 'unsubscribe',
                data: {
                  entity: entity,
                  clientId: this._clientId,
                },
              };
              this._ws.send(JSON.stringify(unsubscribeMsg));
              console.log(`Unsubscribed from updates for entity: ${entity}`);
            }
          },

          // Clean up when controller is destroyed
          onExit: function () {
            // Unsubscribe and close WebSocket when leaving the page
            const entity = this.base.getCurrentEntitySet();
            this.unsubscribeFromEntity(entity);

            if (this._ws) {
              this._ws.close();
            }
          },

          routing: {
            // Method to handle the binding context set up after navigation to this view.
            onAfterBinding: async function (bindingContext, parameters) {
              const that = this;
              
              // Create ObjectStatus control with press event
              const objectStatus = new ObjectStatus({
                text: "Data is current",
                state: "Success",
                icon: "sap-icon://message-success",
                active: true, // Make it clickable
                press: function() {
                  // Refresh the table when clicked
                  that.refreshTable();
                  
                  // Reset the status to "Data is current"
                  that._updateDataStatus(false);
                }
              });

              // Wrap ObjectStatus in ActionToolbarAction
              const toolbarAction = new ActionToolbarAction({
                layoutInformation: {
                  aggregationName: "between",
                  alignment: "Begin"
                },
                action: objectStatus
              });

              // Get the toolbar and add the action using addAction
              const actionToolbar = this.getView().byId("cap.websockets.usagedata::UsageDataList--fe::table::UsageData::LineItem-toolbar");
              
              // Debug to verify toolbar is found
              console.log("ActionToolbar found:", actionToolbar);
              
              if (actionToolbar) {
                actionToolbar.addBegin(toolbarAction);  // Using addBetween instead of addAction
                console.log("Action added to toolbar");
                console.log("Current toolbar content:", actionToolbar.getContent());
              } else {
                console.error("Toolbar not found!");
              }

              // Example: Update status when data changes (you'll need to implement your actual change detection)
              // This could be triggered by your websocket or other backend notification
              this._updateDataStatus = (hasChanges) => {
                objectStatus.setText(hasChanges ? "New data available - Click to refresh" : "Data is current");
                objectStatus.setState(hasChanges ? "Warning" : "Success");
                objectStatus.setIcon(hasChanges ? "sap-icon://message-warning" : "sap-icon://message-success");
              };
            },
          },
        },
        // Subscribe to entity updates
        subscribeToEntity: function (entity) {
          if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            // Send subscription request
            const subscriptionMsg = {
              event: 'subscribe',
              data: {
                entity: entity,
                clientId: this._clientId,
              },
            };
            this._ws.send(JSON.stringify(subscriptionMsg));
            console.log(`Subscribed to updates for entity: ${entity}`);
          } else {
            console.error('WebSocket not open, cannot subscribe');
          }
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
