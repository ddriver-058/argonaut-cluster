<template>
  <div class='row justify-center'>
    <div class='col-auto'>
      <div class="q-pa-s">
        <div class="q-gutter-xs row justify-center">
          <q-btn
            v-for='(button, buttonId) in vagrantButtons'
            :key='buttonId'
            color='gold-offwhite'
            text-color="black"
            :aria-label='button.ariaLabel'
            :disable='button.isDisabled'
            :icon='button.icon'
            @click='handleClick(button)'
          >
            <q-tooltip>
              {{ button.tooltipText }}
            </q-tooltip>
          </q-btn>
        </div>
        <hr class='hr-hide'/>
      </div>
    </div>
  </div>
  <div class='row justify-center'>
    <div class='col-auto'>
      <div class="q-pa-s">
        <div class="q-gutter-xs">
          <q-btn
            v-for='(button, buttonId) in utilityButtons'
            :key='buttonId'
            color='gold-offwhite'
            text-color='black'
            :aria-label='button.ariaLabel'
            :disable='button.isDisabled'
            :icon='button.icon'
            @click='handleClick(button)'
          >
            <q-tooltip>
              {{ button.tooltipText }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ArgonautClusterToolbar',
  // component options
  data() {
    return {
      vagrantButtons: {
        editCluster: {
          tooltipText: 'Edit your Argonaut Cluster configuration.',
          ariaLabel: 'Edit your Argonaut Cluster configuration.',
          isDisabled: false,
          icon: 'fa-solid fa-pencil',
          route: '/edit'
        },
        syncCluster: {
          tooltipText: 'Sync your configuration to the selected elements via "vagrant up".',
          ariaLabel: 'Sync your configuration to your cluster.',
          isDisabled: false,
          icon: 'fa-solid fa-rotate',
          route: '/actions/syncCluster'
        },
        destroyCluster: {
          tooltipText: 'Destroy the selected VMs via "vagrant destroy".',
          ariaLabel: 'Destroy the selected VMs.',
          isDisabled: false,
          icon: 'fa-solid fa-trash',
          route: '/actions/destroyCluster'
        },
        reloadCluster: {
          tooltipText: 'Power off and restart the selected VMs via "vagrant reload".',
          ariaLabel: 'Power off and restart the selected VMs.',
          isDisabled: false,
          icon: 'fa-solid fa-up-down',
          route: '/actions/reloadCluster'
        },
        haltCluster: {
          tooltipText: 'Power off the selected VMs via "vagrant halt".',
          ariaLabel: 'Power off the selected VMs.',
          isDisabled: false,
          icon: 'fa-solid fa-power-off',
          route: '/actions/haltCluster'
        },
        suspendCluster: {
          tooltipText: 'Suspend the selected VMs via "vagrant suspend".',
          ariaLabel: 'Suspend the selected VMs.',
          isDisabled: false,
          icon: 'fa-solid fa-pause',
          route: '/actions/suspendCluster'
        },
        resumeCluster: {
          tooltipText: 'Power on the selected VMs from suspension via "vagrant resume".',
          ariaLabel: 'Power on the selected VMs from suspension.',
          isDisabled: false,
          icon: 'fa-solid fa-play',
          route: '/actions/resumeCluster'
        },
        snapshotCluster: {
          tooltipText: 'Save a snapshot of the selected VMs via "vagrant snapshot save".',
          ariaLabel: 'Save a snapshot of the selected VMs.',
          isDisabled: false,
          icon: 'fa-solid fa-floppy-disk',
          route: '/actions/snapshotCluster'
        },
        restoreCluster: {
          tooltipText: 'Restore a snapshot to the selected VMs via "vagrant snapshot restore".',
          ariaLabel: 'Restore a snapshot to the selected VMs.',
          isDisabled: false,
          icon: 'fa-solid fa-backward-fast',
          route: '/actions/restoreCluster'
        }
      },
      utilityButtons: {
        runPlaybooks: {
          tooltipText: 'Choose an Ansible playbook to run on the selected nodes.',
          ariaLabel: 'Run an Ansible playbook on the selected nodes.',
          isDisabled: false,
          icon: 'fa-solid fa-book-open',
          route: '/actions/runPlaybooks'
        },
        killVagrantProcesses: {
          tooltipText: 'Kill all Vagrant processes on the selected nodes to unblock future processes.',
          ariaLabel: 'Kill all vagrant processes on selected nodes.',
          isDisabled: false,
          icon: 'fa-solid fa-x',
          route: '/actions/killVagrantProcesses'
        }
      }
    }
  },
  methods: {
    handleClick(button) {
      this.$router.push(button.route);
    }
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped>
.hr-hide {
  border: none;
}
</style>
