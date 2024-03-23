<template>
  <codemirror
    v-model="code"
    placeholder="Code goes here..."
    :style="{ height: '400px' }"
    :autofocus="true"
    :indent-with-tab="true"
    :tab-size="2"
    :extensions="extensions"
    @ready="handleReady"
    @change="log('change', $event)"
    @focus="log('focus', $event)"
    @blur="log('blur', $event)"
  />
</template>

<script>
import { defineComponent, ref, shallowRef } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { useClusterEditorStore } from 'stores/cluster-editor';

export default {
  name: 'YamlEditor',
  // component options
  components: {
    Codemirror
  },
  setup() {
    const extensions = [yaml(), oneDark]

    // Codemirror EditorView instance ref
    const view = shallowRef()
    const handleReady = (payload) => {
      view.value = payload.view
    }

    // Status is available at all times via Codemirror EditorView
    const getCodemirrorStates = () => {
      const state = view.value.state
      const ranges = state.selection.ranges
      const selected = ranges.reduce((r, range) => r + range.to - range.from, 0)
      const cursor = ranges[0].anchor
      const length = state.doc.length
      const lines = state.doc.lines
      // more state info ...
      // return ...
    }

    return {
      extensions,
      handleReady,
      isInitialized: false,
      log: console.log
    }
  },
  async created() {
    if(!this.isInitialized) {
      const ceStore = useClusterEditorStore();
      ceStore.getArgonautClusterYaml(this.$api);
      this.isInitialized = true;
    }
  },
  computed: {
    code: {
      get() {
        const ceStore = useClusterEditorStore();

        return ceStore.$state.userInput;
      },
      set(newValue) {
        const ceStore = useClusterEditorStore();

        ceStore.$state.userInput = newValue;
      }
    }
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped>

</style>
