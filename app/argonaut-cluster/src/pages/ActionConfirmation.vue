<template>
  <q-dialog
      v-model='fullWidth'
      @hide='onDialogHide'
    >
    <q-card
      bg-color='gold-offwhite'
    >
      <q-card-section>
        <div class="text-h6">Action Confirmation</div>
      </q-card-section>
      <div class = 'q-pa-md'>
        <div class='row'>
          <div class='col-12'>
            <ActionInputs />
          </div>
        </div>
        <div class='row q-gutter-xs justify-end'>
          <q-btn
            v-for='(button, buttonId) in buttons'
            :key='buttonId'
            :aria-label='button.ariaLabel'
            :disable='button.isDisabled'
            :icon='button.icon'
            @click='button.handleClick()'
          >
            <div class='q-px-sm'>
              {{ button.label }}
            </div>
          </q-btn>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script lang='ts'>

import { defineComponent } from 'vue';
import { ref } from 'vue';
import ActionInputs from 'components/ActionInputs.vue'

import { useClusterActionsStore } from 'src/stores/cluster-actions';
import { useArgonautClusterStore } from 'src/stores/argonaut-cluster';

export default defineComponent({
  name: 'App',
  data() {
    return {
      actionToPlaybookCalls: {
        "/actions/syncCluster": async (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          this.$router.go(-1);

          await acStore.runPlaybook(
            this.$api,
            "vagrant-up",
            {
              reqBody: {
                vms: action.inputs.vms.value
              },
              queryNoClientId: {
                provision: action.inputs.provision.value
              }
            }
          );

          acStore.$state.invalidate['vagrant-status'] = true;
          acStore.$state.invalidate['vm-health'] = true;

        },
        "/actions/destroyCluster": async (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          this.$router.go(-1);

          await acStore.runPlaybook(
            this.$api,
            "vagrant-destroy",
            {
              reqBody: {
                vms: action.inputs.vms.value
              },
              queryNoClientId: {
                graceful: action.inputs.graceful.value
              }
            }
          );

          acStore.$state.invalidate['vagrant-status'] = true;
          acStore.$state.invalidate['vm-health'] = true;

        },
        "/actions/reloadCluster": async (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          this.$router.go(-1);

          await acStore.runPlaybook(
            this.$api,
            "vagrant-reload",
            {
              reqBody: {
                vms: action.inputs.vms.value
              },
              queryNoClientId: {
                provision: action.inputs.provision.value,
                force: action.inputs.force.value
              }
            }
          );

          acStore.$state.invalidate['vagrant-status'] = true;
          acStore.$state.invalidate['vm-health'] = true;

        },
        "/actions/haltCluster": async (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          this.$router.go(-1);

          await acStore.runPlaybook(
            this.$api,
            "vagrant-halt",
            {
              reqBody: {
                vms: action.inputs.vms.value
              },
              queryNoClientId: {
                force: action.inputs.force.value
              }
            }
          );

          acStore.$state.invalidate['vagrant-status'] = true;
          acStore.$state.invalidate['vm-health'] = true;

        },
        "/actions/suspendCluster": async (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          this.$router.go(-1);

          await acStore.runPlaybook(
            this.$api,
            "vagrant-suspend",
            {
              reqBody: {
                vms: action.inputs.vms.value
              },
              queryNoClientId: {}
            }
          );

          acStore.$state.invalidate['vagrant-status'] = true;
          acStore.$state.invalidate['vm-health'] = true;

        },
        "/actions/resumeCluster": async (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          this.$router.go(-1);

          await acStore.runPlaybook(
            this.$api,
            "vagrant-resume",
            {
              reqBody: {
                vms: action.inputs.vms.value
              },
              queryNoClientId: {
                provision: action.inputs.provision.value
              }
            }
          );

          acStore.$state.invalidate['vagrant-status'] = true;
          acStore.$state.invalidate['vm-health'] = true;

        },
        "/actions/snapshotCluster": async (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          this.$router.go(-1);

          await acStore.runPlaybook(
            this.$api,
            "vagrant-snapshot-save",
            {
              reqBody: {
                vms: action.inputs.vms.value
              },
              queryNoClientId: {
                snapshotName: action.inputs.snapshotName.value
              }
            }
          );

          acStore.listSnapshots(this.$api);
          
        },
        "/actions/restoreCluster": async (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          this.$router.go(-1);
          
          await acStore.runPlaybook(
            this.$api,
            "vagrant-snapshot-restore",
            {
              reqBody: {
                vms: action.inputs.vms.value
              },
              queryNoClientId: {
                snapshotName: action.inputs.snapshot.value
              }
            }
          );

          acStore.$state.invalidate['vagrant-status'] = true;
          acStore.$state.invalidate['vm-health'] = true;

        },
        "/actions/killVagrantProcesses": (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          acStore.runPlaybook(
            this.$api,
            "kill-vagrant-processes",
            {
              reqBody: {
                nodes: action.inputs.nodes.value
              },
              queryNoClientId: {
                
              }
            }
          );

          this.$router.go(-1);
        },
        "/actions/runPlaybooks": (caStore) => {
          const action = caStore.$state.currentAction;
          const acStore = useArgonautClusterStore();

          acStore.runPlaybook(
            this.$api,
            "run-playbook",
            {
              reqBody: {

              },
              queryNoClientId: {
                playbookName: action.inputs.playbooks.value,
                become: action.inputs.become.value
              }
            }
          );

          this.$router.go(-1);
        }
      },
      buttons: {
        cancel: {
          label: "Cancel",
          ariaLabel: "Cancel the action",
          isDisabled: false,
          icon: 'fa-solid fa-x',
          handleClick: () => {
            this.$router.go(-1);
          }
        },
        execute: {
          label: "Execute",
          ariaLabel: "Execute the action",
          isDisabled: false,
          icon: 'fa-solid fa-check',
          handleClick: () => {
            const caStore = useClusterActionsStore();

            this.$data.actionToPlaybookCalls[this.$route.path](caStore);
            console.log(0);
          }
        }
      }
    }
  },
  setup() {
    
    return {
      fullWidth: ref(true)
    }
  },
  created() {
    const acStore = useArgonautClusterStore();
    acStore.listPlaybooks(this.$api);
  },
  methods: {
    onDialogHide() {
      this.$router.go(-1);
    }
  },
  components: {
    ActionInputs
  }
});

</script>

<style scoped>
.q-card {
  width: 60%
}
</style>
