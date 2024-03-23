<template>
  <codemirror
    v-model='code'
    placeholder='Code goes here...'
    :style='{ height: "400px" }'
    :autofocus='true'
    :indent-with-tab='true'
    :tab-size='2'
    :extensions='extensions'
    :disabled='true'
    @ready='handleReady'
    @change='log("change", $event)'
    @focus='log("focus", $event)'
    @blur='log("blur", $event)'
  />
  <q-select 
    @mouseover='getPreviewOptions'
    filled
    bg-color='gold-offwhite'
    v-model='selectedPreview'
    :options='options'
    label='Config Item'
  />
</template>

<script>
import { defineComponent, ref, shallowRef } from 'vue'
import { storeToRefs } from 'pinia';

import { Codemirror } from 'vue-codemirror';
import {StreamLanguage} from '@codemirror/language';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark';
import axios from 'axios';

import { useClusterEditorStore } from 'stores/cluster-editor';

export default {
  name: 'EditorPreview',
  // component options
  setup () {

    const extensions = [StreamLanguage.define(ruby), oneDark];

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
      handleReady,
      log: console.log,
      options: ref([])
    }
  },
  components: {
    Codemirror
  },
  computed: {
    code() {
      const ceStore = useClusterEditorStore();
      return ceStore.$state.previewContent;        
    },
    extensions() {
      const ceStore = useClusterEditorStore();
      if(ceStore.$state.selectedPreview === 'Ansible Inventory') {
        return [yaml(), oneDark];
      } else {
        return [StreamLanguage.define(ruby), oneDark]
      }
    },
    selectedPreview: {
      get() {
        const ceStore = useClusterEditorStore();

        return ceStore.$state.selectedPreview;
      },
      set(newValue) {
        const ceStore = useClusterEditorStore();
        ceStore.$state.selectedPreview = newValue;
        ceStore.$state.previewContent = '';
        ceStore.renderUserInput(this.$api);
      }
    }
  },
  methods: {
    async getPreviewOptions() {
      const ceStore = useClusterEditorStore();
      const { userInputHosts } = storeToRefs(ceStore);

      const configuredHosts = userInputHosts.value;
      const vagrantfileOptions = [];
      for(const host of configuredHosts) {
        vagrantfileOptions.push(`Vagrantfile (${host})`);
      }

      this.options = [...vagrantfileOptions, 'Ansible Inventory'];
      return [...vagrantfileOptions, 'Ansible Inventory'];
    }
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped>
</style>
