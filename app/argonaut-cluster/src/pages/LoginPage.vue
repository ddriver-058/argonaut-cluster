<template>
  <q-page-container>
    <div class='q-pa-md'>
      <div class='row justify-center'>
        <div class='col-auto'>
          <q-input outlined class='white-bg' v-model="usernameInput" label='Username' />
          <q-input 
            outlined 
            class='white-bg'
            :type="isPwd ? 'password' : 'text'" 
            @keydown.enter.prevent="submit"
            v-model="passwordInput" 
            label='Password'
          >
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>
          <q-btn class='white-bg' @click='submit' label='Submit'/>
        </div>
      </div>
    </div>
  </q-page-container>
</template>

<script lang='ts'>

import { defineComponent, ref } from 'vue';
import { Notify, LocalStorage } from 'quasar';
import { useAuthenticationStore } from 'stores/authentication';

export default defineComponent({
  name: 'LoginPage',
  data() {
    return {
      usernameInput: '',
      passwordInput: '',
      isPwd: ref(true)
    }
  },
  methods: {
    async submit() {
      const authStore = useAuthenticationStore();

      let resp;
      try {
        resp = await this.$axios.get('/api/login', 
        { 
          params: {
            username: this.usernameInput,
            password: this.passwordInput
          }
        });
      } catch (error) {
        resp = {status: 401};

      }

      if(resp.status !== 401) {
        LocalStorage.set('authentication', {
          isAuthenticated: true,
          token: resp.data.token,
          expiresAt: Date.now() + resp.data.expirationHours*60*60*1000
        });

        this.$router.push('/');
      } else {
        Notify.create("Login failed");
      }
    }
  }
});

</script>

<style scoped>
.white-bg {
  background: white;
}
</style>