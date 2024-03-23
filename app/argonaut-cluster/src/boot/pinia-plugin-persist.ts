// Unused, but leaving configuration here for potential later uses
import { boot } from 'quasar/wrappers'
import piniaPersist from 'pinia-plugin-persist'
import { LocalStorage } from 'quasar';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ store }) => {
  store.use(piniaPersist);
  // Will also initialize authentication in local storage
  if(LocalStorage.getItem('authentication')) {
    // continue
  } else {
    LocalStorage.set('authentication', {
      token: '',
      isAuthenticated: false,
      expiresAt: 0
    })
  }
});