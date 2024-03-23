<template>
  <q-layout class='isometric-bg'>
    <q-page-container>
      <div class='row justify-center q-px-sm'>
        <q-img
          class='logo'
          src='logo.png'
          spinner-color='white'
        />
      </div>
      <router-view name='processDrawer'></router-view>
      <router-view name='dialog'></router-view>
      <router-view></router-view>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { Notify, LocalStorage } from 'quasar';

export default defineComponent({
  name: 'MainLayout',

  data() {

    // Set up a watcher to check token expiration every 10s
    // doing this in data so that 'this' is available
    const pollInterval = setInterval(async () => {
      let allow;
      try {
        await this.$api.get('/check-token');
        allow = true;
      } catch (error) {
        console.log(error);
      }

      if(allow) {
        // do nothing
      } else {
        LocalStorage.set('authentication', {});
        this.$router.push('/login');
      }


    }, 10000);
    
    return {};

  },

  components: {
    
  },
});
</script>

<style>
.isometric-bg {
  background-color: #ffecb2;
  opacity: 0.8;
  background-image:  linear-gradient(30deg, #ffe493 12%, transparent 12.5%, transparent 87%, #ffe493 87.5%, #ffe493), linear-gradient(150deg, #ffe493 12%, transparent 12.5%, transparent 87%, #ffe493 87.5%, #ffe493), linear-gradient(30deg, #ffe493 12%, transparent 12.5%, transparent 87%, #ffe493 87.5%, #ffe493), linear-gradient(150deg, #ffe493 12%, transparent 12.5%, transparent 87%, #ffe493 87.5%, #ffe493), linear-gradient(60deg, #ffe49377 25%, transparent 25.5%, transparent 75%, #ffe49377 75%, #ffe49377), linear-gradient(60deg, #ffe49377 25%, transparent 25.5%, transparent 75%, #ffe49377 75%, #ffe49377);
  background-size: 80px 140px;
  background-position: 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px;
}
.logo {
  max-width: 160px;
}
.text-gold-offwhite {
  color: #fff9e6 !important;
}
.bg-gold-offwhite {
  background: #fff9e6 !important;
}
</style>