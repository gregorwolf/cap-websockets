/* eslint-disable no-console */
const cds = require("@sap/cds");
const { WebSocketServer } = require("ws");

// WebSocket library
const wss = new WebSocketServer({ noServer: true });

// react on bootstrapping events...
cds.on("listening", ({ server }) => {
	console.log("--> listening");

	server.on("upgrade", (request, socket, head) => {

		wss.handleUpgrade(request, socket, head, ws => {
			console.log("WSS HandleUpgrade");
			wss.emit("connection", ws, request);
		});

	});

	global.wss = wss;

});

// handle and override options
module.exports = (options) => {
	// delegate to default server.js
	return cds.server(options);
};