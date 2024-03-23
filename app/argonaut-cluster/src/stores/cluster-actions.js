import { defineStore } from 'pinia';

//const apiUtils = require('services/apiUtils');
// import * as WebSocket from 'ws';
import { storeToRefs } from 'pinia';

import { useArgonautClusterStore } from 'stores/argonaut-cluster';

export const useClusterActionsStore = defineStore('ClusterActions', {
  state: () => {

    return {
      currentAction: {}
    }
  },
  getters: {
    getCurrentAction: (state) => {

      return (action) => {
        const acStore = useArgonautClusterStore();
        const { getGraphNodesOfType, getAllGraphNodesOfType } = storeToRefs(acStore);
        
        const allActions = {
          syncCluster: {
            inputs: {
              vms: {
                inputType: 'selectMultiple',
                label: 'VMs',
                options: getAllGraphNodesOfType.value('vm'),
                value: getGraphNodesOfType.value(acStore.$state.selectedNodes, 'vm'),
                tooltipText: 'The VMs to be synced.'
              },
              provision: {
                inputType: 'checkbox',
                label: 'Provision',
                tooltipText: 'Whether to re-provision existing VMs.',
                value: true
              }
            }
          },
          destroyCluster: {
            inputs: {
              vms: {
                inputType: 'selectMultiple',
                label: 'VMs',
                options: getAllGraphNodesOfType.value('vm'),
                value: getGraphNodesOfType.value(acStore.$state.selectedNodes, 'vm'),
                tooltipText: 'The VMs to be destroyed.'
              },
              graceful: {
                inputType: 'checkbox',
                label: 'Graceful',
                tooltipText: 'Whether the VMs should exit gracefully.',
                value: true
              }
            }
          },
          reloadCluster: {
            inputs: {
              vms: {
                inputType: 'selectMultiple',
                label: 'VMs',
                options: getAllGraphNodesOfType.value('vm'),
                value: getGraphNodesOfType.value(acStore.$state.selectedNodes, 'vm'),
                tooltipText: 'The VMs to be reloaded.'
              },
              provision: {
                inputType: 'checkbox',
                label: 'Provision',
                tooltipText: 'Whether to re-provision the reloaded VMs.',
                value: true
              },
              force: {
                inputType: 'checkbox',
                label: 'Force',
                tooltipText: 'Whether to force shutdown the VMs.',
                value: false
              }
            }
          },
          haltCluster: {
            inputs: {
              vms: {
                inputType: 'selectMultiple',
                label: 'VMs',
                options: getAllGraphNodesOfType.value('vm'),
                value: getGraphNodesOfType.value(acStore.$state.selectedNodes, 'vm'),
                tooltipText: 'The VMs to be halted.'
              },
              force: {
                inputType: 'checkbox',
                label: 'Force',
                tooltipText: 'Whether to force-shutdown the VMs.',
                value: false
              }
            }
          },
          suspendCluster: {
            inputs: {
              vms: {
                inputType: 'selectMultiple',
                label: 'VMs',
                options: getAllGraphNodesOfType.value('vm'),
                value: getGraphNodesOfType.value(acStore.$state.selectedNodes, 'vm'),
                tooltipText: 'The VMs to be suspended.'
              }
            }
          },
          resumeCluster: {
            inputs: {
              vms: {
                inputType: 'selectMultiple',
                label: 'VMs',
                options: getAllGraphNodesOfType.value('vm'),
                value: getGraphNodesOfType.value(acStore.$state.selectedNodes, 'vm'),
                tooltipText: 'The VMs to be resumed.'
              },
              provision: {
                inputType: 'checkbox',
                label: 'Provision',
                tooltipText: 'Whether to re-provision the resumed VMs.',
                value: true
              }
            }
          },
          snapshotCluster: {
            inputs: {
              vms: {
                inputType: 'selectMultiple',
                label: 'VMs',
                options: getAllGraphNodesOfType.value('vm'),
                value: getGraphNodesOfType.value(acStore.$state.selectedNodes, 'vm'),
                tooltipText: 'The VMs to be resumed.'
              },
              snapshotName: {
                inputType: 'text',
                label: 'Snapshot Name',
                value: Date.now()
              }
            }
          },
          restoreCluster: {
            inputs: {
              vms: {
                inputType: 'selectMultiple',
                label: 'VMs',
                options: getAllGraphNodesOfType.value('vm'),
                value: getGraphNodesOfType.value(acStore.$state.selectedNodes, 'vm'),
                tooltipText: 'The VMs to restore from snapshot.'
              },
              snapshotTable: {
                inputType: 'table',
                label: 'Snapshots',
                columns: [
                  {
                    name: 'vm',
                    label: 'VM',
                    align: 'center',
                    field: row => row.vm,
                    format: val => `${val}`,
                  },
                  {
                    name: 'snapshot',
                    label: 'Snapshot',
                    align: 'center',
                    field: row => row.snapshot,
                    format: val => `${val}`,
                  }
                ]
              },
              snapshot: {
                inputType: 'selectSnapshot',
                label: 'Snapshot',
                tooltipText: 'The snapshot to restore to the VMs.',
                value: null
              },
              provision: {
                inputType: 'checkbox',
                label: 'Provision',
                tooltipText: 'Whether to re-provision the restored VMs.',
                value: true
              }
            }
          },
          runPlaybooks: {
            inputs: {
              playbooks: {
                inputType: 'select',
                label: 'Playbooks',
                options: acStore.$state.playbooks,
                value: null,
                tooltipText: 'The playbooks to run.'
              },
              become: {
                inputType: 'checkbox',
                label: 'Pass in become password',
                tooltipText: ['Whether to pass the become password (API container env. ',
                              'var ANSIBLE_BECOME_PASS) to the playbook as a temporary file. ',
                              'Not needed in some passwordless SSH scenarios or if playbook has ',
                              'no become: true.'].join(''),
                value: false
              }
              // {
              //   inputType: 'codemirror',
              //   label: 'Variables',
              // }
            }
          },
          killVagrantProcesses: {
            inputs: {
              nodes: {
                inputType: 'selectMultiple',
                label: 'Nodes',
                options: getAllGraphNodesOfType.value('node'),
                value: getGraphNodesOfType.value(acStore.$state.selectedNodes, 'node'),
                tooltipText: 'The nodes to run playbooks on.'
              }
            }
          }
        };

        return allActions[action];
      }
    }

  },
  actions: {
    
  }
});
