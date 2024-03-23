<template>
  <div v-for='(input, inputKey) in currentAction.inputs' :key='inputKey'>
    <q-table
      v-if='input.inputType=="table"'
      flat bordered
      :title="input.label"
      dense
      :rows="snapshotRows"
      :columns="input.columns"
      row-key="name"
    />
    <q-select
      v-if='input.inputType==="selectSnapshot"'
      :options='snapshotOptions'
      :label='input.label'
      v-model='input.value'
      :aria-label='input.ariaLabel'
    >
      <q-tooltip>
        {{ input.tooltipText }}
      </q-tooltip>
    </q-select>
    <q-checkbox 
      v-if='input.inputType==="checkbox"'
      v-model='input.value'
      :aria-label='input.ariaLabel'
    >
      <q-tooltip>
        {{ input.tooltipText }}
      </q-tooltip>
      {{ input.label }}
    </q-checkbox>
    <q-select
      v-if='input.inputType==="selectMultiple"'
      multiple
      :options='input.options'
      :label='input.label'
      v-model='input.value'
      :aria-label='input.ariaLabel'
    >
      <q-tooltip>
        {{ input.tooltipText }}
      </q-tooltip>
    </q-select>
    <q-select
      v-if='input.inputType==="select"'
      :options='input.options'
      :label='input.label'
      v-model='input.value'
      :aria-label='input.ariaLabel'
    >
      <q-tooltip>
        {{ input.tooltipText }}
      </q-tooltip>
    </q-select>
    <q-input 
      v-if='input.inputType==="text"'
      v-model="input.value" 
      :label='input.label'
    >
      <q-tooltip>
        {{ input.tooltipText }}
      </q-tooltip>
    </q-input>
  </div>
</template>

<script>
import { useArgonautClusterStore } from 'stores/argonaut-cluster';
import { useClusterActionsStore } from 'src/stores/cluster-actions';
import { storeToRefs } from 'pinia';
import { filter, map, includes, every, uniq } from 'lodash';

export default {
  name: 'ActionInputs',
  // component options
  // data() {

  // },
  methods: {
    handleClick(button) {
      this.$router.push(button.route);
    }
  },
  computed: {
    currentAction() {
      const caStore = useClusterActionsStore();
      const { getCurrentAction } = storeToRefs(caStore);

      caStore.$state.currentAction = getCurrentAction.value(this.$route.params.action);

      return caStore.$state.currentAction;
    },
    snapshotOptions() {
      const acStore = useArgonautClusterStore();
      const caStore = useClusterActionsStore();

      // When the options update, reset the input value
      caStore.$state.currentAction.inputs.snapshot.value = null;

      const vms = caStore.$state.currentAction.inputs.vms.value;
      const snapshotNames = map(acStore.$state.snapshotRows, (x) => x.snapshot);

      const snapshotToVms = {};
      for(const nm of snapshotNames) {
        let rowsSavedTo = filter(
          acStore.$state.snapshotRows,
          (x) => { return nm === x.snapshot }
        )
        snapshotToVms[nm] = map(rowsSavedTo, (x) => x.vm)
      }
      
      const includesAll = [];
      for(const nm in snapshotToVms) {
        if(every(vms, elem => includes(snapshotToVms[nm], elem))) {
          includesAll.push(nm)
        }
      }
      // For each snapshot name, get the list of VMs the snapshot is saved to. Only include those for which the snapshot name includes all selected VMs.

      return uniq(includesAll);

    },
    snapshotRows() {
      const acStore = useArgonautClusterStore();
      return acStore.$state.snapshotRows;
    }
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped>

</style>
