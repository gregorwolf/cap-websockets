sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
  ],
  function (UIComponent, Dialog, Text, Button, Label, Input) {
    "use strict";

    return UIComponent.extend("cap.websockets.shellplugin.Component", {
      metadata: {
        manifest: "json",
      },

      /**
       * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
       * @public
       * @override
       */
      init: function () {
        var rendererPromise = this._getRenderer();
        rendererPromise.then(
          function (oRenderer) {
            oRenderer.addHeaderEndItem(
              {
                icon: "sap-icon://add",
                tooltip: "Add bookmark",
                press: function () {
                  var oDialog = new Dialog({
                    contentWidth: "25rem",
                    title: "Whats new",
                    type: "Message",
                    content: new Text({
                      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                    }),
                    beginButton: new Button({
                      type: "Emphasized",
                      text: "Ok",
                      press: function () {
                        oDialog.close();
                      },
                    }),
                    afterClose: function () {
                      oDialog.destroy();
                    },
                  });
                  oDialog.open();
                },
              },
              true
            );
            var sServiceUrl = this.getModel().sServiceUrl;
            sServiceUrl = sServiceUrl.replace("../../../../../..", "");
            sServiceUrl = sServiceUrl.replace("../", "/");
            sServiceUrl = sServiceUrl.replace("/usage", "");
            sServiceUrl = sServiceUrl.replace("~/", "~");
            var input = new Input({
              id: "CPUusage",
              value: "0 %",
              width: "200px",
            });
            var oAddSubHeaderProperties = {
              controlType: "sap.m.Bar",
              oControlProperties: {
                id: "testBar",
                contentRight: [
                  new Label({
                    id: "CPUusageLabel",
                    text: "CPU Usage",
                    labelFor: "CPUusage",
                  }),
                  input,
                ],
              },
              bIsVisible: true,
              bCurrentState: false,
            };
            this.createWebSocketConnection(sServiceUrl, input);
            oRenderer.addShellSubHeader(oAddSubHeaderProperties);
          }.bind(this)
        );
      },

      createWebSocketConnection: function (pathname, input) {
        let wsUrl = "";

        if (pathname === "shellplugin/webapp/") {
          pathname = "";
        }

        // Initiallize the WebSocket connection
        if (document.location.protocol === "https:") {
          wsUrl = "wss://" + document.location.host + pathname + "/ws";
        } else {
          wsUrl = "ws://" + document.location.host + pathname + "/ws";
        }

        let ws = new WebSocket(wsUrl);

        // Event handler for on open
        ws.onopen = function (event) {
          console.log("WebSocket connection open", event.data);
        };

        // event handler for when an event was received from the server
        ws.onmessage = function (event) {
          console.log("WebSocket message received: " + event.data);
          let data = JSON.parse(event.data);
          input.setValue(data.usage + " %");

          // update the web page with the received message
          // setOutput(event.data);
        };

        // event handler for when the connection is closed
        ws.onclose = function (event) {
          console.log("WebSocket connection closed", event.data);
        };
      },

      _getRenderer: function () {
        var that = this,
          oDeferred = new jQuery.Deferred(),
          oRenderer;

        that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
        if (!that._oShellContainer) {
          oDeferred.reject(
            "Illegal state: shell container not available; this component must be executed in a unified shell runtime context."
          );
        } else {
          // UserInfo service
          that._oShellContainer
            .getServiceAsync("UserInfo")
            .then(function (oUserInfo) {
              console.log(
                "oUserInfo",
                oUserInfo,
                oUserInfo.getUser(),
                oUserInfo.getUser().getId()
              );
              that._oUser = oUserInfo;
            });
          oRenderer = that._oShellContainer.getRenderer();
          if (oRenderer) {
            oDeferred.resolve(oRenderer);
          } else {
            // renderer not initialized yet, listen to rendererCreated event
            that._onRendererCreated = function (oEvent) {
              oRenderer = oEvent.getParameter("renderer");
              if (oRenderer) {
                oDeferred.resolve(oRenderer);
              } else {
                oDeferred.reject(
                  "Illegal state: shell renderer not available after recieving 'rendererLoaded' event."
                );
              }
            };
            that._oShellContainer.attachRendererCreatedEvent(
              that._onRendererCreated
            );
          }
        }
        return oDeferred.promise();
      },
    });
  }
);
