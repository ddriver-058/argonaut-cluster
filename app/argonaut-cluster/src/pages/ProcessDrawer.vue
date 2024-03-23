<template>
  <q-dialog 
    v-model='isShown.isShown'
    seamless 
    position="bottom"
  >
    <q-card class='fixed-top-right process-card'>
      <q-card-section class="row">
        <q-expansion-item
          expand-separator
          style="width: 100%"
        >
          <template v-slot:header>
            <q-item-section avatar>
              <q-spinner
                v-if='processSummary.nCompleted !== processSummary.nProcesses'
                color="primary"
                size="2em"
                :thickness="2"
              />
              <q-icon
                v-if='processSummary.nCompleted === processSummary.nProcesses'
                color="green"
                name='fa-solid fa-check'
              />
            </q-item-section>
            <q-item-section>
              {{ processSummary.nCompleted }}/{{ processSummary.nProcesses }} Processes Completed
            </q-item-section>
          </template>
          <q-card style="width: 100%">
            <q-card-section style="padding: 0px">
              <ProcessDropdown />
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang='ts'>

// import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import ProcessDropdown from 'components/ProcessDropdown.vue';
import { useProcessStore } from 'stores/processes';

export default {
  computed: {
    
    processSummary() {
      const processStore = useProcessStore();
      const { nRunning, nCompleted, nProcesses } = storeToRefs(processStore);
      return {
        nRunning: nRunning.value,
        nCompleted: nCompleted.value,
        nProcesses: nProcesses.value
      }
    },

    isShown() {
      const processStore = useProcessStore();
      const { nProcesses } = storeToRefs(processStore);

      return {
        isShown: nProcesses.value > 0
      }
    }
    
  },
  components: {
    ProcessDropdown
  }
}

</script>

<style scoped>
.q-card {
  width: 60%
}
.process-card {
  background: #ffff;
}
</style>
