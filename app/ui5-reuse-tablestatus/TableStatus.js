sap.ui.define(
  ['sap/m/ObjectStatus', 'sap/ui/mdc/actiontoolbar/ActionToolbarAction'],
  function (ObjectStatus, ActionToolbarAction) {
    'use strict';

  // 1) Include the CSS only once per session
  (function() {
      // Build the resource URL to your CSS file based on the AMD module path
      var cssUrl = sap.ui.require.toUrl('ui5-reuse-tablestatus/TableStatus.css');

    // Check if not already loaded
    if (!document.getElementById("tableStatusCss")) {
      // Create a <link> to your CSS and append it to the <head>
      var link = document.createElement("link");
      link.id = "tableStatusCss";
      link.rel = "stylesheet";
      link.href = cssUrl;
      document.head.appendChild(link);
    }
  })();

    /**
     * A helper module to create and insert an ObjectStatus
     * wrapped in an ActionToolbarAction into the specified
     * Fiori Elements table toolbar, with optional WebSocket support.
     */
    return {
      /**
       * Creates an ObjectStatus inside an ActionToolbarAction
       * and inserts it into the toolbar identified by toolbarId.
       *
       * @param {object} controller - The current controller (usually "this" in the calling context).
       * @param {string} toolbarId - ID of the toolbar in which to add the action.
       * @param {function} pressCallback - Function to be called on press event of the ObjectStatus.
       * @returns {sap.m.ObjectStatus} The created ObjectStatus control.
       */
      createToolbarAction: function (controller, toolbarId, pressCallback) {
        // Create ObjectStatus control with press event
        const objectStatus = new ObjectStatus({
          text: 'Data is current',
          state: 'Success',
          icon: 'sap-icon://message-success',
          active: true,
          inverted: true,
          press: pressCallback,
        });

        // Add a custom style class to suppress focus outline
        objectStatus.addStyleClass('noFocusOutline');

        // Wrap ObjectStatus in an ActionToolbarAction
        const toolbarAction = new ActionToolbarAction({
          layoutInformation: {
            aggregationName: 'between',
            alignment: 'Begin',
          },
          action: objectStatus,
        });

        // Retrieve the toolbar and add the action
        const actionToolbar = controller.getView().byId(toolbarId);
        console.log('ActionToolbar found:', actionToolbar);

        if (actionToolbar) {
          actionToolbar.addBegin(toolbarAction);
          console.log('Action added to toolbar');
          console.log('Current toolbar content:', actionToolbar.getContent());
        } else {
          console.error('Toolbar not found!');
        }

        return objectStatus;
      },

      /**
       * Initializes a WebSocket connection for real-time updates
       *
       * @param {object} controller - The controller instance
       * @param {string} entity - The entity name to subscribe to
       * @param {string} wsEndpoint - The WebSocket endpoint path (e.g., '/ws/usage-plugin')
       * @param {function} updateCallback - Function to call when updates are received
       * @returns {object} WebSocket connection and helper methods
       */
      initWebSocket: function (controller, entity, wsEndpoint, updateCallback) {
        // Generate a unique client ID for this instance
        const clientId =
          'client_' + Math.random().toString(36).substring(2, 15);

        // Create WebSocket URL based on current protocol
        let wsUrl = '';
        if (document.location.protocol === 'https:') {
          wsUrl = 'wss://' + document.location.host + wsEndpoint;
        } else {
          wsUrl = 'ws://' + document.location.host + wsEndpoint;
        }

        // Create WebSocket connection
        const ws = new WebSocket(wsUrl);

        // Set up message handler
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          const msgType = message.event; // e.g. "entityUpdated"
          const msgData = message.data; // { entity, operation, data: {...}, keys: {...} }

          // Check for 'entityUpdated' event and filter by entity
          if (msgType === 'entityUpdated') {
            // Only process updates for the current entity we're viewing
            if (msgData.entity === entity) {
              console.log(
                `Received update for ${entity}: ${msgData.operation}`
              );
                // For INSERT operations, skip the current view check
                if (msgData.operation === 'INSERT') {
                  console.log(`Processing INSERT operation immediately without view check`);
                  if (typeof updateCallback === 'function') {
                    updateCallback(true, msgData);
                  }
                } else {
                  // For DELETE operations, check if the record is in current view
                  const isInCurrentView = controller._isRecordInCurrentView ? 
                    controller._isRecordInCurrentView(msgData.keys || msgData.data) : true;

                  console.log(`Is in current view: ${isInCurrentView}`);

                  // Only call the update callback if the record is in the current view
                  if (isInCurrentView && typeof updateCallback === 'function') {
                    updateCallback(true, msgData);
                  }
                }
            }
          }
        };

        // Set up connection handlers
        ws.onopen = () => {
          console.log(
            `[TableStatus.js] WebSocket connection open, subscribing to ${entity} updates`
          );
          // Subscribe to entity updates
          subscribeToEntity(ws, entity, clientId);
        };

        ws.onclose = () => {
          console.log('[TableStatus.js] WebSocket connection closed');
        };

        // Helper function to subscribe to entity updates
        function subscribeToEntity(ws, entity, clientId) {
          if (ws && ws.readyState === WebSocket.OPEN) {
            // Send subscription request
            const subscriptionMsg = {
              event: 'subscribe',
              data: {
                entity: entity,
                clientId: clientId,
              },
            };
            ws.send(JSON.stringify(subscriptionMsg));
            console.log(`Subscribed to updates for entity: ${entity}`);
          } else {
            console.error('WebSocket not open, cannot subscribe');
          }
        }

        // Helper function to unsubscribe from entity updates
        function unsubscribeFromEntity(ws, entity, clientId) {
          if (ws && ws.readyState === WebSocket.OPEN) {
            // Send unsubscribe request
            const unsubscribeMsg = {
              event: 'unsubscribe',
              data: {
                entity: entity,
                clientId: clientId,
              },
            };
            ws.send(JSON.stringify(unsubscribeMsg));
            console.log(`Unsubscribed from updates for entity: ${entity}`);
          }
        }

        // Return WebSocket and helper methods
        return {
          ws: ws,
          clientId: clientId,
          subscribe: function () {
            subscribeToEntity(ws, entity, clientId);
          },
          unsubscribe: function () {
            unsubscribeFromEntity(ws, entity, clientId);
          },
          close: function () {
            if (ws) {
              unsubscribeFromEntity(ws, entity, clientId);
              ws.close();
            }
          },
        };
      },

      /**
       * Sets up a full real-time integration:
       *  - Initializes and subscribes to a WebSocket
       *  - Creates an ObjectStatus in the specified toolbar
       *  - If desired, keeps track of updates and can refresh tables automatically
       *
       * @param {object} controller - The SAPUI5 controller instance
       * @param {string} entity - The entity name to subscribe to
       * @param {string} wsEndpoint - WebSocket endpoint path (e.g. '/ws/usage-plugin')
       * @param {string} toolbarId - The ID of the toolbar for inserting ObjectStatus
       * @param {function} refreshFn - (Optional) A function that refreshes the table
       */
      createRealTimeIntegration: function (
        controller,
        entity,
        wsEndpoint,
        toolbarId,
        refreshFn
      ) {
        // 1) Initialize WebSocket
        const wsConnection = this.initWebSocket(
          controller,
          entity,
          wsEndpoint,
          (hasChanges, data) => {
            // If there's a callback on the objectStatus, call that to update text/state
            if (controller._updateDataStatus) {
              controller._updateDataStatus(hasChanges);
            }
          }
        );

        // Keep reference so we can clean it up on exit
        controller._wsConnection = wsConnection;

        // 2) Create the ObjectStatus in the specified toolbar
        // Press callback to refresh table, then reset status
        const pressCallback = function () {
          if (typeof refreshFn === 'function') {
            refreshFn();
          }
          if (controller._updateDataStatus) {
            controller._updateDataStatus(false);
          }
        };

        const objectStatus = this.createToolbarAction(
          controller,
          toolbarId,
          pressCallback
        );

        // 3) Store a function on the controller to update the status text/icons
        controller._updateDataStatus = (hasChanges) => {
          objectStatus.setText(
            hasChanges
              ? 'New data available - Click to refresh'
              : 'Data is current'
          );
          objectStatus.setState(hasChanges ? 'Warning' : 'Success');
          objectStatus.setIcon(
            hasChanges
              ? 'sap-icon://message-warning'
              : 'sap-icon://message-success'
          );
        };

        // Add helper method to the controller to check if a record is in the current view
        controller._isRecordInCurrentView = (recordData) => {
          // Default to true if we can't determine the visible records
          if (!recordData) return true;
          
          const tableId = controller._tableId; // This needs to be set in the controller
          if (!tableId) return true;
          
          const table = controller.getView().byId(tableId);
          if (!table) return true;
          
          const binding = table.getBinding('items');
          if (!binding) return true;
          
          const contexts = binding.getCurrentContexts();
          if (!contexts || contexts.length === 0) return false;

          const currentEntity = controller.base.getCurrentEntitySet();
          const metaModel = controller.getView().getModel().getMetaModel()
          const metaModelData = metaModel.getData()
          const path = binding.getPath();
          const entityTypeName = metaModel.getObject(path)["$Type"];
          const keysArray = metaModelData[entityTypeName]["$Key"];
          // Only remove IsActiveEntity if it exists in the keysArray
          const isActiveIndex = keysArray.indexOf('IsActiveEntity');
          if (isActiveIndex !== -1) {
            keysArray.splice(isActiveIndex, 1);
          }

          // Check if any of the visible records match the updated record
          const isInCurrentView = contexts.some(context => {
            const contextData = context.getObject();
            // Only compare the keys from keysArray
            const isMatch = keysArray.some(key => 
              contextData && recordData && 
              recordData[key] !== undefined && 
              contextData[key] === recordData[key]);
            return isMatch;
          });
          return isInCurrentView;
        };

        // 4) Return cleanup function for controller to use in onExit
        return {
          cleanup: function () {
            if (wsConnection) {
              wsConnection.close();
            }
          },
          // Also return a reference to the connection if needed
          connection: wsConnection,
        };
      },

      /**
       * Creates a standard table refresh function that can be reused across applications
       *
       * @param {object} controller - The controller instance
       * @param {string} tableId - The ID of the table to refresh
       * @returns {function} A function that refreshes the table's binding
       */
      createTableRefreshFunction: function (controller, tableId) {
        return function () {
          const table = controller.getView().byId(tableId);
          if (table) {
            const binding = table.getBinding('items');
            if (binding) {
              binding.refresh();
            }
          }
        };
      },
    };
  }
);
