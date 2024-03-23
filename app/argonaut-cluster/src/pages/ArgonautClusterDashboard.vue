<template>
  <q-page-container>
    <div class='row justify-center'>
      <div class='col-auto'>
        <b>Cluster</b> <span class='grey-text'>(To add to or remove selections, hold shift)</span>
        <ArgonautClusterGraph />
      </div>
    </div>
    <ArgonautClusterToolbar />
  </q-page-container>
</template>

<script lang='ts'>

import { defineComponent, watch } from 'vue';
import ArgonautClusterToolbar from 'components/ArgonautClusterToolbar.vue';
import ArgonautClusterGraph from 'components/ArgonautClusterGraph.vue';
import { useArgonautClusterStore } from 'stores/argonaut-cluster';
import { useAuthenticationStore } from 'stores/authentication';

export default defineComponent({
  name: 'App',
  async created() {
    const store = useArgonautClusterStore();
    const authStore = useAuthenticationStore();
    
    if(!store.$state.isInitialized) {
      watch(() => store.$state.invalidate, async (oldVal, newVal) => {
        const store2 = useArgonautClusterStore();

        for(const key in newVal) { 
          // If true, fire off associated action
          if(newVal[key]) {
            switch (key) {
              case 'vagrant-status':
                store2.getDataFromPlaybook(this.$api, 'vagrant-status');
                store2.$state.invalidate[key] = false;
                break;
              case 'vm-health':
                store2.getDataFromPlaybook(this.$api, 'vm-health');
                store2.$state.invalidate[key] = false;
                break;
              case 'node-health':
                store2.getDataFromPlaybook(this.$api, 'node-health');
                store2.$state.invalidate[key] = false;
                break;
            }
          }
        }
      }, { deep: true });

      await store.initializeState(this.$api);
      store.getGraphNodeConfiguration(this.$api);
      store.getDataFromPlaybook(this.$api, 'vagrant-status');
      store.getDataFromPlaybook(this.$api, 'vm-health');
      store.listSnapshots(this.$api);
      await store.getDataFromPlaybook(this.$api, 'node-health');
      store.updateClusterHealth();
    }
    
  },
  components: {
    ArgonautClusterToolbar,
    ArgonautClusterGraph
  }
});

</script>
<style scoped>
.grey-text {
  color: grey;
}
</style>