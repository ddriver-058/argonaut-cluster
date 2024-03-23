import { defineStore } from 'pinia';

//const apiUtils = require('services/apiUtils');
// import * as WebSocket from 'ws';
// import axios from 'axios';
// import { resolve } from 'dns';
// import { Stats, stat } from 'fs';

export const useProcessStore = defineStore('useProcessStore', {
  state: () => ({

  }),
  getters: {
    getProcessIcon: (state) => {
      return (processId) => {
        const status = state.$state[processId].status;
        if(status.match('exit')) {
          return 'fa-solid fa-check'
        } else if(status.match('InProgress')) {
          return 'fa-solid fa-clock'
        } else {
          return 'fa-solid fa-question'
        }
      } 
    },
    nRunning: (state) => {
      let out = 0;
      for(const processId in state.$state) {
        if(state.$state[processId].status === 'InProgress') {
          out++;
        }
      }
      return out;
    },
    nCompleted: (state) => {
      let out = 0;
      for(const processId in state.$state) {
        if(state.$state[processId].status.match('exit')) {
          out++;
        }
      }
      return out;
    },
    nProcesses: (state) => {
      let out = 0;
      for(const processId in state.$state) {
        out++;
      }
      return out;
    }
  },
  actions: {

  }
});
