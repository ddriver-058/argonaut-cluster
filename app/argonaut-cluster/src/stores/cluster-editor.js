import { defineStore } from 'pinia';

//const apiUtils = require('services/apiUtils');
// import * as WebSocket from 'ws';
import axios from 'axios';
import { load } from 'js-yaml';
import { Notify } from 'quasar';

export const useClusterEditorStore = defineStore('ClusterEditorStore', {
  state: () => ({
    userInput: 'hello: world',
    previewContent: '',
    selectedPreview: 'NA',
    vagrantFiles: {},
    ansibleInventory: ''
  }),
  getters: {
    userInputObj: (state) => {
      let out = {};
      try {
        out = load(state.userInput);
      } catch(error) {
        console.log(`Caught error loading YAML: ${error}`);
      }
      return out;
    },
    userInputHosts: (state) => {
      const userInput = state.userInputObj;
      let hosts = ['NA'];
      try {
        hosts = Object.keys(userInput.cluster.nodes)
      } catch(error) {
        console.log(`Caught error: ${error}`);
      }
      return hosts;
    }
  },
  actions: {
    async getVagrantFiles(api) {

      return new Promise(async (resolve) => {
        try {
          const resp = await api.post('/vagrant-files',
            this.userInputObj
          );
          
          this.$state.vagrantFiles = resp.data;
          resolve(resp.data);
        } catch (error) {
          Notify.create(`${error.response.status}: ${error.response.data}`);
        }
        
      });

    },
    async setAnsibleInventory(api) {

      return new Promise(async (resolve) => {
        const resp = await api.post('/ansible-inventory',
          this.userInputObj,
          {
            params: {
              dryRun: false
            }
          }
        );
        
        this.$state.ansibleInventory = resp.data;
        resolve(resp.data);
      });

    },
    async getAnsibleInventory(api) {

      return new Promise(async (resolve) => {
        const resp = await api.post('/ansible-inventory',
          this.userInputObj,
          {
            params: {
              dryRun: true
            }
          }
        );
        
        this.$state.ansibleInventory = resp.data;
        resolve(resp.data);
      });

    },
    async getArgonautClusterYaml(api) {
      return new Promise(async (resolve) => {
        const resp = await api.get('/argonaut-cluster-yaml');
        
        this.$state.userInput = resp.data;
        resolve(resp.data);
      });
    },
    async renderUserInput(api) {
      let errorNotif = 'null';

      try {

        const hosts = this.userInputHosts;
        const selPreview = this.selectedPreview;
        const previewTypeMatch = selPreview.match(/Vagrantfile|Ansible Inventory|NA/);

        // get userInputHosts, 
        // switch on the matched value via q-model select, ['Vagrantfile', 'Ansible Inventory']
        // if VF, then match hostname from userInputHosts, and pull that from API result
        // if AI, then get inventory from API and display as YAML

        switch (previewTypeMatch[0]) {
          case 'Vagrantfile': 
            await this.getVagrantFiles(api);
            const hostnameMatch = selPreview.match(hosts.join('|'));
            const vf = this.vagrantFiles[hostnameMatch[0]].vagrantfile;
            this.previewContent = vf;
            break;
          case 'Ansible Inventory':
            await this.getAnsibleInventory(api);
            const ai = this.ansibleInventory;
            this.previewContent = ai;
            break;
            
        }

        return 0;
      } catch (error) {
        errorNotif = error;
      }
      Notify.create(errorNotif.message);
    }
  },
});
