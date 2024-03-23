import { boot } from 'quasar/wrappers'
import VueCodemirror from 'vue-codemirror'

// 'async' is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({app}) => {
  //const app = createApp(app);

  app.use(VueCodemirror, {
    // optional default global options
  });

})
