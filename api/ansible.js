
// external modules
const tmp = require('tmp');
const fs = require('fs');
const yaml = require('js-yaml');
const child_process = require('child_process');
const dotenv = require('dotenv').config();

// internal modules
const utility = require('./utility');

// Get the become password as a temp file
function getBecomePassPath() {
  const pw = process.env.ANSIBLE_BECOME_PASS;
  const path = utility.tmpWrite(pw);
  return path;
};

  
// Synchronously checks that a localhost ansible playbook can be run.
function initializeAnsible() {
  
  utility.execSync(
    "ansible-playbook",
    [
      "playbooks/localhost-test/playbook.yaml"
    ]
  );

  console.log("initialization complete");
};

  
const setAnsibleInventory = (
  acConfig,
  dryRun = false
) => {

  // Forms an /etc/ansible/hosts file in YAML and writes it.
  // It generates it from the argonaut_cluster.yaml

  // Go across each node to get the inventory groups.
  groupArray = Object.entries(acConfig.cluster.nodes).map(([nodeKey, nodeValue]) => {

    // for each group, get necessary keys
    // if no groups, use ungrouped instead
    groups = nodeValue.inventory_groups;
    if(groups === undefined) {
      groups = 'ungrouped';
    }
    groups = utility.toArray(groups); // Ensures output is an array regardless of length
    
    // Assign the inventory variables to each group.
    // By assigning to the nodeKey, it also captures the group member nodes.
    groupEntries = groups.reduce((inventoryEntry, grp) => {
      inventoryEntry[grp] = {
        hosts: {}
      };
      inventoryEntry[grp].hosts[nodeKey] = nodeValue.inventory_vars
      return inventoryEntry;
    }, {});

    return groupEntries;

  }, {});

  // In the groupArray of objects, go across each group
  // and merge the values into an object to prevent duplicates.
  const inventory = groupArray.reduce((acc, obj) => {

    for(const key in obj) {
      value = obj[key];
      if (!acc[key]) {
        // If the key doesn't exist in the accumulator, create a new object
        acc[key] = value;
      } else {
        // If the key exists, merge the objects under that key
        acc[key].hosts = Object.assign({}, acc[key].hosts, value.hosts);
      }
    }

    return acc;
  }, {});
  

  // now add an all:vars entry using the cluster variables
  inventory['all'] = { vars: acConfig.cluster.inventory_vars };

  // write to ansible inventory location
  if(!dryRun) {
    fs.mkdirSync("/etc/ansible", { recursive: true })
    utility.myWrite(
      yaml.dump(inventory),
      "/etc/ansible/hosts"
    );
  }
  
  return yaml.dump(inventory);

};

// Read ansible inventory as text
const getAnsibleInventory = () => {
  
  return fs.readFileSync("/etc/ansible/hosts", "utf-8");

};

// Runs a playbook, streaming the output to the console.
const runPlaybook = async (
  playbookName,
  varsPath,
  becomePassPath
) => {
  // initialize args array with playbook path
  let args = [`playbooks/${playbookName}/playbook.yaml`]

  // pass arguments to ansible-playbook based on boolean function args
  if(becomePassPath) {
    args.push(
      `--become-password-file=${becomePassPath}`
    );
  }

  if(varsPath) {
    args.push(
      `--extra-vars=@${varsPath}`
    );
  }

  playbookProcess = child_process.spawn(
    "ansible-playbook",
    args
  );

  // Streams realtime output to console
  utility.logChanges(playbookProcess);

  await playbookProcess;

  return playbookProcess.stdout;

};

// Like runPlaybook, but streams the output to a websocket
const runPlaybookWebsocket = async (
  wsConn,
  playbookName,
  varsPath,
  becomePassPath
) => {
  // initialize args array with playbook path
  const args = [`playbooks/${playbookName}/playbook.yaml`];

  // pass arguments to ansible-playbook based on boolean function args
  if(becomePassPath) {
    args.push(
      `--become-password-file=${becomePassPath}`
    );
  }

  if(varsPath) {
    args.push(
      `--extra-vars=@${varsPath}`
    );
  }

  //args.push('-vvvv'); // can uncomment for verbose output -- add as app setting later?

  playbookProcess = child_process.spawn(
    "ansible-playbook",
    args
  );

  // default to using playbookName as processType
  // The processType is included in each WS method to be used for parsing
  utility.logChangesWebsocket(playbookProcess, wsConn, playbookName);

};

// List the folders in the /playbooks dir
const listPlaybooks = () => {
  return fs.readdirSync("playbooks");
};

module.exports = {
  getBecomePassPath,
  initializeAnsible,
  setAnsibleInventory,
  getAnsibleInventory,
  runPlaybook,
  runPlaybookWebsocket,
  listPlaybooks
};