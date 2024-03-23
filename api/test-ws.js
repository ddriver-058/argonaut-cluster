const { HttpError } = require('koa');
const WebSocket = require('ws');
const axios = require('axios');

let ws = new WebSocket('ws://localhost:3001/asdf');
var clientId = 0;

ws.on('open', () => {
  console.log('WebSocket connection opened');

  // Send a message to the WebSocket server
  ws.send('Hello, WebSocket server!');
});

ws.on('message', async (message) => {
  messageJson = JSON.parse(message);

  switch (messageJson.type) {
    case "connectionConfirmation":
      clientId = messageJson.clientId;
      console.log("Setting client ID");
      // console.log("get GET response");
    default:
      console.log(messageJson.message);
  }

  // You can add your own logic to handle the received messages
});

// setTimeout(async () => {
//   console.log(clientId);
//   const resp = await axios.post(
//     "http://localhost:3000/vagrant-status", {}, {
//       params: {
//         "clientId": messageJson.clientId
//       }
//     }
//   );
//   console.log(resp);
// }, 2000)