<template>
  <q-page-container>
    <div class='q-pa-md'>
      <div class='row q-col-gutter-sm justify-center'>
        <div class="col-6 style='height: 80%'">
          <span><b>Edit container's copy of api/templating/argonaut_cluster.yaml</b></span>
          <YamlEditor />
        </div>
        <div class="col-6 style='height: 80%'">
          <span><b>Preview</b></span>
          <EditorPreview />
        </div>
      </div>
      <div class='row justify-end q-gutter-sm'>
        <q-btn
          v-for='(button, buttonId) in buttons'
          :key='buttonId'
          color='gold-offwhite'
          text-color='black'
          :aria-label='button.ariaLabel'
          :disable='button.isDisabled'
          :icon='button.icon'
          @click='button.clickHandler()'
        >
          <q-tooltip>
            {{ button.tooltipText }}
          </q-tooltip>
          <div class='q-px-sm'>
            {{ button.label }}
          </div>
        </q-btn>
      </div>
    </div>
  </q-page-container>
</template>

<script lang='ts'>

import { defineComponent } from 'vue';
import { storeToRefs } from 'pinia';
import YamlEditor from 'components/YamlEditor.vue';
import EditorPreview from 'components/EditorPreview.vue';
import { Notify } from 'quasar';

import { useArgonautClusterStore } from 'stores/argonaut-cluster';
import { useClusterEditorStore } from 'stores/cluster-editor';
import { useNodeStore } from 'stores/node-state';
import { useVmStore } from 'stores/vm-state';

export default defineComponent({
  name: 'ClusterEditor',
  data() {
    return {
      buttons: {
        render: {
          label: 'Render',
          ariaLabel: 'Render the staged Argonaut Cluster configuration.',
          tooltipText: 'Render the staged Argonaut Cluster configuration.',
          isDisabled: false,
          icon: 'fa-solid fa-circle-up',
          clickHandler: async () => {
            const ceStore = useClusterEditorStore();
            ceStore.renderUserInput(this.$api);
          }
        },
        exit: {
          label: 'Exit',
          ariaLabel: 'Exit without saving.',
          tooltipText: 'Exit without saving.',
          icon: 'fa-solid fa-x',
          isDisabled: false,
          clickHandler: () => {
            this.$router.go(-1);
          }
        },
        save: {
          label: 'Save',
          ariaLabel: 'Save your configuration before syncing.',
          tooltipText: 'Save your configuration, staging it to be synced later.',
          icon: 'fa-solid fa-save',
          isDisabled: false,
          clickHandler: async () => {
            const acStore = useArgonautClusterStore();
            const ceStore = useClusterEditorStore();

            await acStore.writeVcYaml(this.$api, ceStore.userInput);
            ceStore.setAnsibleInventory(this.$api);

            acStore.$state.isInitialized = false;

            this.$router.go(-1);

          }
        }
      }
    }
  },
  components: {
    YamlEditor,
    EditorPreview
  }
});

</script>
<style scoped>

</style>