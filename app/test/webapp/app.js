"use strict";

function initialize() {
  console.log("Initialize started");

  createWebSocketConnection();
}

/**
 * Create a WebSocket connection to the server
 */
function createWebSocketConnection() {
  let wsUrl = "";

  // Initiallize the WebSocket connection
  if (document.location.protocol === "https:") {
    wsUrl =
      "wss://" +
      document.location.host +
      document.location.pathname +
      "/ws/usage-plugin";
  } else {
    wsUrl = "ws://" + document.location.host + "/ws/usage-plugin";
  }

  let ws = new WebSocket(wsUrl);

  // Event handler for on open
  ws.onopen = function (event) {
    console.log("WebSocket connection open", event.data);
  };

  // event handler for when an event was received from the server
  ws.onmessage = function (event) {
    console.log("WebSocket message received: " + event.data);

    // update the web page with the received message
    setOutput(event.data);
  };

  // event handler for when the connection is closed
  ws.onclose = function (event) {
    console.log("WebSocket connection closed", event.data);
  };
}

/**
 * Writes the given message to the output area
 * @param {String} aText the text that should be updated in the web page
 */
function setOutput(aText) {
  // get the output element
  let el = document.getElementById("exampleOutput");

  // set the text of the output element
  el.innerHTML = aText;
}

initialize();
setOutput("Hello World");
