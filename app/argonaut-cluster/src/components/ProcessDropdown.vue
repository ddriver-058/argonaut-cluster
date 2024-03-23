<template>
  <div 
    class='row no-wrap'
    v-for='(task, key) in tasks'
    :key='key'
  >
    <div class='col-2'>
      <q-btn
        v-if='task.status.match("exit")'
        @click='dismissProcess(key)'
        style='padding-top: 13px; padding-bottom: 13px'
        flat
        icon='fa-solid fa-x'
      >
      </q-btn>
    </div>
    <div class='col-10'>
      <q-expansion-item
        expand-separator
        :label='key'
        :icon='task.icon'
      >
        <div class='row' style='height: 250px; overflow-y: auto'>
          <div v-for="logEntrySplit in task.logs.map(replaceNewLines)" :key="logEntrySplit"
          >
            <p v-for="log in logEntrySplit" :key="log"
            >
              {{ log }}
            </p>
          </div>
        </div>
        <div class = 'row q-pa-sm justify-end'>
          <q-btn
            :aria-label='copyButton.ariaLabel'
            :icon='copyButton.icon'
            @click='copyLogs(task)'
            >
            <q-tooltip>
              {{ copyButton.tooltipText }}
            </q-tooltip>
          </q-btn>
        </div>
      </q-expansion-item>
    </div>
  </div>
</template>

<script>
import { storeToRefs } from 'pinia';
import { useProcessStore } from 'stores/processes';
import { copyToClipboard, Notify } from 'quasar';

export default {
  name: 'ProcessDropdown',
  setup() {
    const processStore = useProcessStore();
    const { getProcessIcon } = storeToRefs(processStore);

    processStore.$subscribe((mutation, store) => {
      Object.keys(store).map(
        (key) => {
          store[key].icon = getProcessIcon.value(key);
        }
      )
    });

  },
  data() {

    const processStore = useProcessStore();

    return {
      tasks: processStore.$state,
      copyButton: {
        // :aria-label='copyButton.ariaLabel'
        //     :disable='copyButton.isDisabled'
        //     :icon='copyButton.icon'
        'aria-label': 'Copy logs to the clipboard.',
        tooltipText: 'Copy logs to the clipboard.',
        icon: 'fa-solid fa-copy'
      }
    }
  },
  methods: {
    replaceNewLines(txt) {
      if(typeof txt === 'string') {
        return txt.split('\n').flat();
      }
    },
    dismissProcess(processId) {
      const processStore = useProcessStore();
      delete processStore.$state[processId];
    },
    copyLogs(task) {
      const logsJn = task.logs.join('\n');
      copyToClipboard(logsJn)
        .then(() => {
          Notify.create('Logs copied to clipboard.')
        })
        .catch(() => {
          Notify.create('Error copying logs -- try again.')
        })
    }
  }
}
</script>