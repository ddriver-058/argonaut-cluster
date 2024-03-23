import { defineStore } from 'pinia';

//const apiUtils = require('services/apiUtils');
// import * as WebSocket from 'ws';
import { map, every } from 'lodash';
import { Notify } from 'quasar';

import { useNodeStore } from 'stores/node-state';
import { useVmStore } from 'stores/vm-state';
import { useProcessStore } from 'stores/processes';

export const useArgonautClusterStore = defineStore('ArgonautClusterStore', {
  state: () => {
    
    return {
      isInitialized: false,
      invalidate: {
        'vagrant-status': false,
        'vm-health': false,
        'node-health': false
      },
      graphNodeConfiguration: {
        nodes: {},

      },
      playbooks: ['please wait or return to main dashboard and try again'],
      selectedNodes: [],
      snapshotRows: [],
      clusterState: {
        healthStatus: 'unknown'
      }
    }
  },
  getters: {
    getAllGraphNodesOfType: (state) => {
      return (type) => {
        
        const acStore = useArgonautClusterStore();
        const nodeStore = useNodeStore();
        const vmStore = useVmStore();

        const clusterState = {
          cluster: acStore.$state.clusterState,
          ...nodeStore.$state,
          ...vmStore.$state
        };

        const out = [];
        for(const nodeId in clusterState) {
          if(clusterState[nodeId].type === type) {
            out.push(nodeId);
          }
        };
        return out;
      }
    },
    getGraphNodesOfType: (state) => {
      return (nodeIds, type) => {

        const acStore = useArgonautClusterStore();
        const nodeStore = useNodeStore();
        const vmStore = useVmStore();

        const clusterState = {
          cluster: acStore.$state.clusterState,
          ...nodeStore.$state,
          ...vmStore.$state
        };

        const out = [];
        for(const nodeId of nodeIds) {
          if(clusterState[nodeId].type === type) {
            out.push(nodeId);
          }
        };
        return out;
      }
    }
  },
  actions: {
    async connectWebsocket() {
      return new Promise ((resolve) => {
        const ws = new WebSocket(`${ window.location.origin }/wss`.replace('https', 'wss'));

        ws.addEventListener('message', async (message) => {
          const messageJson = JSON.parse(message.data);
        
          switch (messageJson.type) {
            case 'connectionConfirmation':
              resolve({
                clientId: messageJson.clientId,
                connection: ws
              });
            default:
              
          }
        });

      });
    },

    // Read Argonaut Cluster configuration and initialize the state
    async initializeState(api) {
      const nodeStore = useNodeStore();
      const vmStore = useVmStore();

      return new Promise(async (resolve) => {
        const resp = await api.post(
          '/initialize-ac-state', {}
        );

        this.$reset();
        this.$state.clusterState = resp.data.cluster;
        this.$state.isInitialized = true;

        for(const key of Object.keys(nodeStore.$state)) {
          delete nodeStore.$state[key];
        }
        nodeStore.$state = resp.data.nodes;
        for(const key of Object.keys(vmStore.$state)) {
          delete vmStore.$state[key];
        }
        vmStore.$state = resp.data.vms;
        

        resolve(0);
      })

    },

    async writeVcYaml(api, vcConfigLines) {

      return new Promise(async (resolve) => {
        const resp = await api.post(
          '/argonaut-cluster-yaml', [vcConfigLines]
        );

        resolve(0);
      })

    },

    async processLogOutput(api, logs, processType) {

      return new Promise(async (resolve) => {
        try {
          const resp = await api.post('/process-logs',
                        logs,
            {
              params: { processType: processType }
            }
          );
          
          resolve(resp.data);
        } catch (error) {
          Notify.create(`${error.response.status}: ${error.response.data}`);
        }
        
      });

    },

    // Start process to get results of 'vagrant status'
    async getDataFromPlaybook(
      api,
      processType // Should be the playbook / endpoint name
    ) {
      return new Promise(async (resolve) => {
        const processStore = useProcessStore();
        const vmStore = useVmStore();
        const nodeStore = useNodeStore();

        // Connect websocket
        const wsConn = await this.connectWebsocket();
        console.log(`got client ID: ${wsConn.clientId}`);

        // Create process in the state store
        const processId = `${processType}-${Date.now()}`;
        processStore.$state[processId] = {
          logs: [],
          status: 'InProgress'
        };

        const resp = await api.get(
          `/${processType}`, {
            params: {
              'clientId': wsConn.clientId
            }
          }
        );

        wsConn.connection.addEventListener('message', async (message) => {
          const messageJson = JSON.parse(message.data);

          switch(messageJson.type) {
            case 'exit':
              processStore.$state[processId].status = `exit-${messageJson.message}`;
              const logMetadata = await this.processLogOutput(
                api,
                processStore.$state[processId].logs,
                processType
              );

              switch(processType) {
                case 'vagrant-status':
                  for(const vm in logMetadata) {
                    vmStore.$state[vm].vmState = logMetadata[vm];
                  }
                  break;
                case 'vm-health':
                  for(const vm in logMetadata) {
                    vmStore.$state[vm].healthStatus = logMetadata[vm];
                  }
                  break;
                case 'node-health':
                  for(const node in logMetadata) {
                    nodeStore.$state[node].healthStatus = logMetadata[node];
                  }
              }

              resolve(0);
              

            default:
              processStore.$state[processId].logs.push(messageJson.message);
          }

        });
      });
      

    },

    async runPlaybook(
      api,
      playbookName,
      {
        reqBody,
        queryNoClientId
      }
    ) {
      return new Promise(async (resolve) => {
        const processStore = useProcessStore();
        const vmStore = useVmStore();
        const nodeStore = useNodeStore();

        // Connect websocket
        const wsConn = await this.connectWebsocket();
        console.log(`got client ID: ${wsConn.clientId}`);

        // Create process in the state store
        const processId = `${playbookName}-${Date.now()}`;
        processStore.$state[processId] = {
          logs: [],
          status: 'InProgress'
        };

        const resp = api.post(
          `/${playbookName}`, reqBody, {
            params: {
              'clientId': wsConn.clientId,
              ...queryNoClientId
            }
          }
        );

        
        wsConn.connection.addEventListener('message', async (message) => {
          const messageJson = JSON.parse(message.data);

          switch(messageJson.type) {
            case 'exit':
              processStore.$state[processId].status = `exit-${messageJson.message}`;
              resolve(0);
            default:
              processStore.$state[processId].logs.push(messageJson.message);

          }
        });
      });
      
    },
    
    async getGraphNodeConfiguration(api) {
      return new Promise(async (resolve) => {
        const resp = await api.post(
          '/generate-ac-graph-configurations',
          {}
        );

        const nodeConfig = resp.data;

        this.$state.graphNodeConfiguration.nodes =  nodeConfig.names;
        this.$state.graphNodeConfiguration.edges = nodeConfig.edges;
        this.$state.graphNodeConfiguration.layouts = nodeConfig.layouts;

        resolve(resp.data);
      });
    },

    async listPlaybooks(api) {
      return new Promise(async (resolve) => {
        const resp = await api.get(
          '/playbooks'
        );
        // Filter out default playbooks
        const filteredPlaybooks = resp.data.filter(
          (val) => {
            return ![
              'check-node-health',
              'check-vm-health',
              'common',
              'kill-vagrant-processes',
              'localhost-test',
              'vagrant-destroy',
              'vagrant-halt',
              'vagrant-reload',
              'vagrant-resume',
              'vagrant-snapshot-delete',
              'vagrant-snapshot-restore',
              'vagrant-snapshot-save',
              'vagrant-status',
              'vagrant-suspend',
              'vagrant-up',
              'vagrant-validate'
            ].includes(val)
          }
        );
        this.$state.playbooks = filteredPlaybooks;
        resolve(filteredPlaybooks);
      });
    },

    async listSnapshots(api) {
      return new Promise(async (resolve) => {
        const resp = await api.get(
          '/snapshots'
        );

        this.$state.snapshotRows = resp.data;
        resolve(resp.data);
      });
    },

    async updateClusterHealth() {
      const nodeStore = useNodeStore();

      const nodeHealths = map(Object.keys(nodeStore.$state), (nm) => {
        return {health: nodeStore.$state[nm].healthStatus}
      });

      const healths = map(nodeHealths, (x) => {
        return x.health;
      });

      if(every(healths, (x) => x == 'healthy')) {
        this.clusterState.healthStatus = 'healthy';
      } else {
        this.clusterState.healthStatus = 'unhealthy'
      }
      
    }
  }
});
