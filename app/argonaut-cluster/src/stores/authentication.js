import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';

//const apiUtils = require('services/apiUtils');
// import * as WebSocket from 'ws';

export const useAuthenticationStore = defineStore('AuthenticationStore', {
  state: () => {

    return LocalStorage.getItem('authentication') || {};
  },
  getters: {

  },
  actions: {

  }
});
