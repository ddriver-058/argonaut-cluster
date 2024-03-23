<template>
  <q-dialog
      v-model='fullWidth'
      @hide='onDialogHide'
    >
    <q-card>
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

export default defineComponent({
  name: 'App',
  data() {
    return {

    };
  },
  setup() {
    return {
      fullWidth: ref(true)
    }
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
