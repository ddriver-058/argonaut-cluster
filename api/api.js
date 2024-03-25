console.log("Starting");

// external requirements
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const websockify = require('koa-websocket');
const cors = require('@koa/cors');
const yaml = require('js-yaml');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv').config();

// internal requirements
const ansible = require('./ansible');
const vagrant = require('./vagrant');
const argonautCluster = require('./argonautCluster');
const utility = require('./utility');

// initialize HTTP app
const app = new Koa();
app.use(bodyParser());
const router = new Router();

// Cache of websocket connections
const wsConnections = new Map();

// WebSocket route
const wsApp = websockify(new Koa());
wsApp.ws.use(async (ctx, next) => {
  console.log('ws connected');
  
  // Display received messages (no use for these currently)
  ctx.websocket.on('message', (message) => {
    
    console.log(`Received: ${message}`);

  });

  // Generate a clientID for looking up cached ws connections
  const clientId = Date.now().toString();
  wsConnections.set(clientId, ctx.websocket); // cache the connection

  // Send a confirmation message, supplying clientId to the recipient
  ctx.websocket.send(
    JSON.stringify(
      {
        "type": "connectionConfirmation",
        "clientId": clientId,
        "message": "Websocket connected and cached with this clientId."
      }
    )
  );

  await next();
});


// Initialization steps
ansible.initializeAnsible(); // Runs the localhost test playbook
ansible.setAnsibleInventory(argonautCluster.readArgonautClusterConfig()); // Sets /etc/ansible/hosts
argonautCluster.clusterInit(); // Runs the AC startup script
console.log('Finished initialization.');

// Health check endpoint
router.get('/', async ctx => {
  ctx.body = "0";
});

// Write a new argonaut_cluster.yaml
router.post('/argonaut-cluster-yaml', async ctx => {
  if(Object.keys(ctx.request.body).length > 0) {
    utility.myWrite(ctx.request.body[0], "templating/argonaut_cluster.yaml");
  }
  ctx.body = "0";
})

// Initializes the ac state object in the Vue app
router.post('/initialize-ac-state', async ctx => {

  acConfig = argonautCluster.readArgonautClusterConfig();

  acActualState = await argonautCluster.initializeAcState(
    acConfig
  );
  ctx.body = acActualState;
});

// Generates the graph configuration for the Vue app's v-network-graph
// representation of the AC.
router.post('/generate-ac-graph-configurations', async ctx => {
  let acConfig;
  if(Object.keys(ctx.request.body).length > 0) {
    acConfig = ctx.request.body;
  } else {
    acConfig = argonautCluster.readArgonautClusterConfig();
  }

  acActualState = await argonautCluster.generateAcGraphConfiguration(
    acConfig
  );
  ctx.body = acActualState;
});

// GET CLUSTER DATA //

// Gets vmState
router.get('/vagrant-status', async ctx => {
  // Query string params
  const clientId = ctx.query.clientId;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.vagrantStatus(ws);
  }
  ctx.body = "sending output to websocket";
});

// Returns the Vagrantfiles generated from the Argonaut Cluster config
router.post('/vagrant-files', async ctx => {
  // Catch errors to be displayed in the app's editor
  try {
    const vf = argonautCluster.getVagrantFiles(
      acConfig = ctx.request.body
    );
    ctx.body = vf;
  } catch (error) {
    ctx.status = 500; // Internal Server Error
    ctx.body = error.message; // Set the error message in the response body
  }
  
});

router.get('/vm-health', async ctx => {

  const clientId = ctx.query.clientId;
  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    argonautCluster.checkVmHealth(ws);
  }

  ctx.body = "sending output to websocket";

});

router.get('/node-health', async ctx => {

  const clientId = ctx.query.clientId;
  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    argonautCluster.checkNodeHealth(ws);
  }

  ctx.body = "sending output to websocket";

});

// Return argonaut cluster config as text
router.get('/argonaut-cluster-yaml', async ctx => {
  const yamlData = fs.readFileSync("templating/argonaut_cluster.yaml");
  ctx.body = yamlData;
});

router.get('/playbooks', async ctx => {
  ctx.body = ansible.listPlaybooks();
});

router.get('/snapshots', async ctx => {
  ctx.body = vagrant.vagrantSnapshotList()
});

// END GET CLUSTER DATA //

// PROCESS LOG DATA //

// Processes Ansible playbook logs for data like vmState, etc.
router.post('/process-logs', ctx => {
  const processType = ctx.query.processType;
  const logs = ctx.request.body;

  const out = argonautCluster.processLogOutput(logs, processType);

  ctx.body = out;

});

// END PROCESS LOG DATA //

// VAGRANT COMMAND ENDPOINTS //

router.post('/vagrant-up', async ctx => {

    // Query string params
    const clientId = ctx.query.clientId;
    const vms = ctx.request.body.vms;
    const provision = ctx.query.provision;

    if(clientId !== undefined) {
      ws = wsConnections.get(clientId);
      vagrant.vagrantUp(
        ws, 
        vms,
        provision == 'true'
      );
    }
    ctx.body = "sending output to websocket";

});

router.post('/vagrant-destroy', async ctx => {

  // Query string params
  const clientId = ctx.query.clientId;
  const vms = ctx.request.body.vms;
  const graceful = ctx.query.graceful;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.vagrantDestroy(
      ws, 
      vms, 
      graceful == 'true'
    );
  }
  ctx.body = "sending output to websocket";

});

router.post('/vagrant-halt', async ctx => {

  // Query string params
  const clientId = ctx.query.clientId;
  const vms = ctx.request.body.vms;
  const force = ctx.query.force;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.vagrantHalt(
      ws, 
      vms, 
      force == 'true'
    );
  }
  ctx.body = "sending output to websocket";

});

router.post('/vagrant-suspend', async ctx => {

  // Query string params
  const clientId = ctx.query.clientId;
  const vms = ctx.request.body.vms;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.vagrantSuspend(
      ws, 
      vms
    );
  }
  ctx.body = "sending output to websocket";

});

router.post('/vagrant-resume', async ctx => {

  // Query string params
  const clientId = ctx.query.clientId;
  const vms = ctx.request.body.vms;
  const provision = ctx.query.provision;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.vagrantResume(
      ws, 
      vms,
      provision == 'true'
    );
  }
  ctx.body = "sending output to websocket";

});

router.post('/vagrant-reload', async ctx => {

  // Query string params
  const clientId = ctx.query.clientId;
  const vms = ctx.request.body.vms;
  const provision = ctx.query.provision;
  const force = ctx.query.force;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.vagrantReload(
      ws, 
      vms,
      provision == 'true',
      force == 'true'
    );
  }
  ctx.body = "sending output to websocket";

});

router.post('/vagrant-snapshot-save', async ctx => {

  // Query string params
  const clientId = ctx.query.clientId;
  const vms = ctx.request.body.vms;
  const snapshotName = ctx.query.snapshotName;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.vagrantSnapshotSave(
      ws, 
      vms,
      snapshotName
    );
  }
  ctx.body = "sending output to websocket";

});

router.post('/vagrant-snapshot-delete', async ctx => {

  // Query string params
  const clientId = ctx.query.clientId;
  const vms = ctx.request.body.vms;
  const snapshotName = ctx.query.snapshotName;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.vagrantSnapshotDelete(
      ws, 
      vms,
      snapshotName
    );
  }
  ctx.body = "sending output to websocket";

});

router.post('/vagrant-snapshot-restore', async ctx => {

  // Query string params
  const clientId = ctx.query.clientId;
  const vms = ctx.request.body.vms;
  const snapshotName = ctx.query.snapshotName;
  const provision = ctx.query.provision;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.vagrantSnapshotRestore(
      ws, 
      vms,
      snapshotName,
      provision == 'true'
    );
  }
  ctx.body = "sending output to websocket";

});

// END VAGRANT COMMAND ENDPOINTS //

// OTHER COMMAND ENDPOINTS //

// Kills vagrant and ruby processes on the specified nodes.
// Useful if you need to clear out Vagrant processes to run a new one.
router.post('/kill-vagrant-processes', async ctx => {

  // Query string params
  const clientId = ctx.query.clientId;
  const nodes = ctx.request.body.nodes;

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    vagrant.killVagrantProcesses(
      ws, 
      nodes
    );
  }
  ctx.body = "sending output to websocket";

});

// Run a custom playbook.
router.post('/run-playbook', async ctx => {
  const clientId = ctx.query.clientId;
  const playbookName = ctx.query.playbookName;
  let varsPath; // unused
  let becomePath;
  if(ctx.query.become === 'true') {
    becomePath = ansible.getBecomePassPath();
  }

  if(clientId !== undefined) {
    ws = wsConnections.get(clientId);
    ansible.runPlaybookWebsocket(
      ws, 
      playbookName,
      varsPath,
      becomePath
    );
  }

  ctx.body = "sending output to websocket";

})

// END OTHER COMMAND ENDPOINTS //

// Update ansible inventory by providing it in the request body
router.post('/ansible-inventory', async ctx => {
  const ai = ansible.setAnsibleInventory(
    ctx.request.body,
    ctx.query.dryRun == 'true'
  );
  ctx.body = ai;
});

// AUTH MIDDLEWARE //
const secretKey = crypto.randomBytes(32).toString('hex');
router.get('/login', async ctx => {

  const username = ctx.query.username;
  const password = ctx.query.password;

  // Set these in the docker_compose.yaml
  const validUsername = process.env.AC_USERNAME;
  const validPassword = process.env.AC_PASSWORD;

  const allow = username == validUsername && password == validPassword;

  if(allow) {
    const token = jwt.sign({ username }, secretKey, { expiresIn: '4h' });

    // Send the token as part of the response
    ctx.body = {
      token: token,
      expirationHours: 4
    };
  } else {
    ctx.status = 401;
    ctx.body = 'Unauthorized';
  }

});

const authenticationMiddleware = async (ctx, next) => {
  // Exclude the /login route from authentication check
  if (ctx.path === '/login') {
    await next();
    return;
  }

  // All other http endpoints will have the bearer token checked
  const token = ctx.request.headers.authorization.replace('Bearer ', '');

  try {
    // Verify the token
    const decoded = jwt.verify(token, secretKey);

    // Attach the user information to the context for further processing
    ctx.state.user = decoded;

    await next();
  } catch (error) {
    // Handle invalid or expired token
    ctx.status = 401;
    ctx.body = 'Unauthorized';
  }
};

router.get('/check-token', async ctx => {
  // implicitly calls bearer token check
  ctx.body = 'OK';
})

// END AUTH MIDDLEWARE //

// API SERVER CONFIG

app.use(cors()); // Since we don't know which host will run AC, disable CORS
app.use(authenticationMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

// For ease of proxying, the http and ws will run on separate ports.
const appPromise = new Promise((resolve) => {
  app.listen(3000);
});

const wsPromise = new Promise((resolve) => {
  wsApp.listen(3001);
});

// Start both servers concurrently
Promise.all([appPromise, wsPromise])
    .then(() => {
        console.log('Both servers started successfully.');
    })
    .catch((error) => {
        console.error('Error starting servers:', error);
    });