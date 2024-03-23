import { boot } from 'quasar/wrappers'
import VNetworkGraph from 'v-network-graph'
import 'v-network-graph/lib/style.css'

// 'async' is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({app}) => {
  //const app = createApp(app);

  app.use(VNetworkGraph);
  app.mount('#app');
})
