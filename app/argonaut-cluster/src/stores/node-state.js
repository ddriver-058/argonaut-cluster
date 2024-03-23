import { defineStore } from 'pinia';

//const apiUtils = require('services/apiUtils');
// import * as WebSocket from 'ws';

export const useNodeStore = defineStore('NodeState', {
  state: () => ({

  }),
  getters: {

  },
  actions: {
    async connectWebsocket() {
      return new Promise ((resolve) => {
        const ws = new WebSocket(`${ window.location.origin }/wss`.replace('https', 'wss'));

        ws.addEventListener('message', async (message) => {
          console.log(message.data);
          const messageJson = JSON.parse(message.data);
        
          switch (messageJson.type) {
            case 'connectionConfirmation':
              resolve({
                clientId: messageJson.clientId,
                connection: ws
              });
            default:
              console.log(messageJson.message);
          }
        });

      });
    }
  },
});
