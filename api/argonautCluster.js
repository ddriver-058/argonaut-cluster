
// external modules
const fs = require('fs');
const yaml = require('js-yaml');
const handlebars = require('handlebars');
const tmp = require('tmp');
const _ = require('lodash');
const assert = require('assert');

// internal modules
const utility = require('./utility');
const ansible = require('./ansible');

// define handlebars helpers
handlebars.registerHelper('eq', function (arg1, arg2, options) {
  return arg1 === arg2;
})

// Asserts properties of the argonaut cluster config
// Can set whether to stop in error or return empty on failure
// Currently checks:
//   - unique node hostnames
//   - unique vm hostnames
function validateArgonautCluster(acObj, stop = true) {
  const nodeHostnames = Object.keys(acObj.cluster.nodes);
  const vmHostnames = _.flatten(_.map(acObj.cluster.nodes, (value) => {
    return Object.keys(value.vms)
  }));

  const hasUniqueNodeHostnames = _.isEqual(nodeHostnames, _.uniq(nodeHostnames));
  const hasUniqueVmHostnames = _.isEqual(vmHostnames, _.uniq(vmHostnames));

  if(stop) {
    assert.deepStrictEqual(hasUniqueNodeHostnames, true, 'Node hostnames not unique');
    assert.deepStrictEqual(hasUniqueVmHostnames, true, 'VM hostnames not unique');
  } else {
    if(!hasUniqueNodeHostnames | !hasUniqueVmHostnames) {
      console.warn('Warning: Node or VM hostnames not unique -- using empty Argonaut Cluster config');
      return {};
    } else {
      return acObj;
    }
  }

};

// Reads AC config from standard location, validates it, and returns the object
function readArgonautClusterConfig() {
  const yamlData = fs.readFileSync("templating/argonaut_cluster.yaml");
  const out = validateArgonautCluster(yaml.load(yamlData), false);
  return out;
};

// Templates out Vagrantfiles from the Argonaut Cluster config
// Returns an object that enables lookup of Vagrantfiles by node hostname
// The configuration generated from the node types (acState) is also returned
function getVagrantFiles(acConfig = readArgonautClusterConfig()) {

  validateArgonautCluster(acConfig, true);
  const acState = structuredClone(acConfig); // the state actually passed to playbooks

  // TODO: Check for existence of cluster.inventory_variables.ansible_user
  let currentVm;
  try {
    // Rename vm hostname keys from snake to kebab case
    // This allows the user's acConfig to work in case they adopt
    // ansible-style casing for vm hostnames
    Object.entries(acState.cluster.nodes).map(([nodeKey, nodeValue]) => {
      Object.entries(nodeValue.vms).map(([vmKey, vmValue]) => {
        currentVm = vmKey;
        if (utility.snakeToKebab(vmKey) !== vmKey) {
          acState.cluster.nodes[nodeKey].vms[utility.snakeToKebab(vmKey)] = vmValue;
          delete acState.cluster.nodes[nodeKey].vms[vmKey];
        }
      });
    });

  } catch (error) {
    throw new Error(`
      Error iterating through the VM hostnames to replace snake with kebab case on vm ${currentVm}. 
      Are the VMs defined under cluster.nodes.yourhostname.vms?
      ${error.message}
    `)
  }

  try {
    // Transform the vm configurations into the full specification
    // passed into the template by applying the vm_type
    Object.entries(acState.cluster.nodes).map(([nodeKey, nodeValue]) => {
      Object.entries(nodeValue.vms).map(([vmKey, vmValue]) => {
        currentVm = vmKey;
        vmState = structuredClone(vmValue);

        // initialize vm config with values from the type
        vmState.config = acConfig.vm_types[vmValue.type];

        // override values from the config
        if(vmValue.config !== undefined) {
          vmState.config = utility.overrideValues(vmState.config, vmValue.config);
        }

        // render the values in the startup scripts
        vmState.config.provisioning.shell_scripts = vmState.config.provisioning.shell_scripts.map((script) => {
          const startupTemplate = handlebars.compile(script);
          return startupTemplate(acState);
        });


        // update acState with the vmState
        acState.cluster.nodes[nodeKey].vms[vmKey] = vmState;
      });
    });

  } catch (error) {

    throw new Error(`
      Error forming vm configurations on vm ${currentVm}. 
      Are the VMs defined as expected? Are there issues in the vm types?
      ${error.message}
    `)

  }
  

  // render vagrant files and append to the acState
  // pass in the node value and user vars to Vagrantfile.hbs
  // (I don't think passing user vars is actually necessary / would do anything, so will need to test)
  let currentNode;
  try {
    vagrantFileObj = Object.entries(acState.cluster.nodes).reduce((acc, [nodeKey, nodeValue]) => {

      templateInput = acState.cluster.nodes[nodeKey];
      templateInput.user_variables = acConfig.user_variables;
  
      vagrantfileTemplatePath = "templating/Vagrantfile.hbs";
      vagrantFileTemplate = handlebars.compile(
        fs.readFileSync(vagrantfileTemplatePath, 'utf-8')
      );
  
      // now render the template
      vagrantfile = vagrantFileTemplate(templateInput);
  
      // Create a temporary file to pass the vagrant file and vagrant dir to host
      //   via a vars.yaml argument to ansible-playbook
      // The playbook will write the vagrant file and execute vagrant up
      acc[nodeKey] = {
        vagrantDir: acConfig.cluster.vagrant_dir,
        vagrantfile: vagrantfile
      };
  
      return acc;
  
    }, {});
  } catch(error) {
    throw new Error(`
      Error rendering vagrantfile for node ${currentNode}. 
      Are there issues in the nodes, vms, or user_variables?
      ${error.message}
    `)
  }
  
  // We will also append the ac state to the vagrantFileObj
  vagrantFileObj.acState = acState;

  return vagrantFileObj
};
  

// Given an array of VMs, look up the nodes hosting those VMs
// Returns an object where VMs can be looked up by node hostname
function getTargetHosts(acState, targetVms) {

  // Initialize output object
  let hostToVms = {};

  // If targetVms is supplied, then iterate through
  // the nodes & vms to add relevant entries
  if(targetVms !== undefined) {

    for(node in acState.cluster.nodes) {
      hostToVms[node] = []; // initialize vms array

      // Check each vm from targetVms to see if it is specified as belonging
      // to iterated node
      for(vm of targetVms) {
        if(Object.keys(acState.cluster.nodes[node].vms).includes(vm)) {
          hostToVms[node].push(vm);
        }
      }
    }

    // Filter to non-empty vm arrays
    hostToVms = _.pickBy(hostToVms, value => value.length > 0);

  // Otherwise, supply an empty string as lookup, as this will
  // match all vms in Vagrant CLI calls
  } else {

    for(node in acState.cluster.nodes) {
      hostToVms[node] = ''; // supply all nodes with all-matching vm string
    }

  }

  return hostToVms;
};

// Reads the AC config, validating it (returning empty if failure), 
// and runs the startup script
const clusterInit = async() => {
  try {
    const acConfig = readArgonautClusterConfig(); // validates with stop=false
    const startupScriptPath = tmp.fileSync({postfix: '.sh'});
    utility.myWrite(
      acConfig.cluster.startup_script,
      startupScriptPath.name
    )
  
    utility.execSync(
      "sh",
      [
        startupScriptPath.name
      ]
    );
  } catch(error) {
    console.log(`clusterInit failed with: ${error}`)
  }

};

// Given the AC config object, returns the AC graph object passed to the Vue app
const generateAcGraphConfiguration = async(argonautClusterObj) => {
  nodeHorizontalSpacing = -150;
  nodeVerticalSpacing = -80;

  // First, we'll get a layout object of (blank) positions for each node
  vmLayouts = {};
  vmNames = {};
  for(node in argonautClusterObj.cluster.nodes) {
    for(vmName in argonautClusterObj.cluster.nodes[node].vms) {
      vmLayouts[vmName] = {x: 0, y: 0};
      vmNames[vmName] = { name: vmName }
    }
  }


  // now get nodes
  nodeLayouts = {};
  nodeNames = {};
  for(node in argonautClusterObj.cluster.nodes) {
    nodeLayouts[node] = { x: 0, y: 0 };
    nodeNames[node] = { name: node };
  }

  // lastly, the cluster is defined statically
  clusterLayout = {cluster: {x: 0, y: 0}}
  clusterName = {cluster: { name: "cluster" }}

  // Space VMs evenly apart
  xpos = 0;
  for(vm in vmLayouts) {
    vmLayouts[vm].x = xpos;
    xpos += nodeHorizontalSpacing;
  }

  // space nodes between the VMs
  for(node in nodeLayouts) {
    nVms = 0;
    for(vm in vmLayouts) {
      if(Object.keys(argonautClusterObj.cluster.nodes[node].vms).includes(vm)) {
        nVms += 1;
      }
    }

    xpos = 0;
    for(vm in vmLayouts) {
      if(Object.keys(argonautClusterObj.cluster.nodes[node].vms).includes(vm)) {
        xpos += vmLayouts[vm].x
      }
    }

    nodeLayouts[node].x = xpos / nVms;
    nodeLayouts[node].y = nodeLayouts[node].y + nodeVerticalSpacing

  }

  // space cluster between the nodes
  nNodes = Object.keys(nodeLayouts).length;
  xpos = 0;
  for(node in nodeLayouts) {
    xpos += nodeLayouts[node].x;
  }
  clusterLayout.cluster.x = xpos / nNodes;
  clusterLayout.cluster.y = clusterLayout.cluster.y + nodeVerticalSpacing*2;

  // form layout obj
  layouts = {
    ...clusterLayout,
    ...nodeLayouts,
    ...vmLayouts
  };

  names = {
    ...clusterName,
    ...nodeNames,
    ...vmNames
  }

  // form edges
  edges = {};
  edgeIndex = 0;

  // Edges from cluster -> nodes
  for(node in nodeLayouts) {
    edges["edge"+edgeIndex] = {
      source: "cluster",
      target: node
    };
    edgeIndex += 1;
  }

  // Edges from nodes -> vms
  for(node in nodeLayouts) {
    for(vm in vmLayouts) {
      if(Object.keys(argonautClusterObj.cluster.nodes[node].vms).includes(vm)) {
        edges["edge"+edgeIndex] = {
          source: node,
          target: vm
        };
        edgeIndex += 1;
      }
    }
  }

  return {
    layouts: { nodes: layouts },
    names: names,
    edges: edges
  }

}

// Return state objects for the cluster, node, and VM stores of
// the Vue app
initializeAcState = async(argonautClusterObj) => {

  clusterTemplate = {
    type: 'cluster',
    syncStatus: 'Unknown',
    healthStatus: 'Unknown',
    childNodes: [

    ]
  }

  nodeTemplate = {
    type: 'node',
    syncStatus: 'Unknown',
    healthStatus: 'Unknown',
    childVms: [

    ]
  };

  vmTemplate = {
    type: 'vm',
    syncStatus: 'Unknown',
    healthStatus: 'Unknown',
    vmState: 'Unknown',
    parentNode: ''
  };

  // Set child nodes in cluster obj
  clusterTemplate.childNodes = Object.keys(argonautClusterObj.cluster.nodes);

  // Initialize node and VM state objects
  nodes = {};
  vms = {};

  // Iterate through nodes and VMs to set child / parent objects
  // and keys, which represent the node / vm
  for(node in argonautClusterObj.cluster.nodes) {
    nodeEntry = structuredClone(nodeTemplate);
    nodeEntry.childVms = Object.keys(argonautClusterObj.cluster.nodes[node].vms);
    nodes[node] = nodeEntry;
    for(vm in argonautClusterObj.cluster.nodes[node].vms) {

      vmEntry = structuredClone(vmTemplate);

      vmEntry.parentNode = node;
      vms[vm] = vmEntry;

    }
  }

  return {
    cluster: clusterTemplate,
    nodes: nodes,
    vms: vms
  };
};

// Run the VM health check playbook and stream output in realtime
// to provided wsConn
const checkVmHealth = (
  wsConn,
  acConfig = readArgonautClusterConfig()
) => {

  // initialize variables used by the playbook
  const playbookVars = {
    hosts: Object.keys(acConfig.cluster.nodes), // nodes to iterate over
    vagrantDir: acConfig.cluster.vagrant_dir,
    vms: {}
  };

  // Supply vms, which will be looked up via node hostname
  for(host of playbookVars.hosts) {
    playbookVars.vms[host] = Object.keys(acConfig.cluster.nodes[host].vms);
  };

  const varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "check-vm-health",
    varsPath
  );

};

// Run the node healthcheck playbook, streaming to the provided
// wsConn
const checkNodeHealth = (wsConn) => {

  ansible.runPlaybookWebsocket(
    wsConn,
    "check-node-health"
  );

};

// Processes log output from playbooks to relevant
// cluster metadata, switching on processType,
// which is usually the playbook name
const processLogOutput = (logs, processType) => {

  // Helper functions
  // Given 2 arrays, output an object where
  // arr1 are the keys to the values of arr2
  const arraysToObj = (arr1, arr2) => {
    const out = {};
    for(let i = 0; i < arr1.length; i++) {
      if(arr1[i]) {
        out[arr1[i]] = arr2[i];
      }
    };
    return out;
  };

  // Return an array of only the unique values
  // in arr. 
  // TODO: replace with _.uniq
  const uniqueArray = (arr) => {
    const arrSet = new Set(arr);
    return [...arrSet]
  };

  // Call arr.match using provided regex,
  // outputing only first match
  const getFirstMatch = (arr, regex) => {
    let out;
    if(arr) {
      out = arr.match(regex);
    }
    
    if(out) {
      return out[0];
    }
  };

  // initialize output and logs object
  let out;
  const logsJn = logs.join('\n');
  
  // Will match certain regex from the logsJn based
  // on the processType
  switch (processType) {
    case 'vagrant-status': {
      const regexp = /[^,]*,state\-human\-short,.*/g; // pulls frm vagrant status machine-readable output
      const mtchArray = uniqueArray(logsJn.match(regexp));
      const stateRe = /[^,]*$/;
      const stateArray = mtchArray.map((x) => x.match(stateRe)[0]);
      const keysRe = /[^,]*/;
      const keysArray = mtchArray.map((x) => x.match(keysRe)[0]);
      out = arraysToObj(keysArray, stateArray);
      break;
    }
    case 'vm-health': {
      // Will treat failures and successes separately
      const failedRegex = /failed:.*changed=false/g; // Pulls from ansible playbook status, looking for failed changes
      const failedLines = logsJn.match(failedRegex);
      const failedKeyRegex = /(?<=item=)[^\)]*/;
      let failedKeys;
      let failedValues;
      if(failedLines) {
        failedKeys = failedLines.map((x) => getFirstMatch(x, failedKeyRegex));
        failedValues = failedLines.map(() => 'unhealthy');
      } else {
        failedKeys = [];
        failedValues = []
      }
      
      const successRegex = /changed:.*/g; // looks for successful changes in playbook output
      const successLines = logsJn.match(successRegex);
      const successKeyRegex = /(?<=item=)[^\)]*/;
      let successKeys;
      let successValues;
      if(successLines) {
        successKeys = successLines.map((x) => getFirstMatch(x, successKeyRegex));
        successValues = successLines.map((x) => 'healthy');
      } else {
        successKeys = [],
        successValues = [];
      }

      out = arraysToObj(
        [...failedKeys, ...successKeys], 
        [...failedValues, ...successValues]
      );
      break;
    }
    case 'node-health': {
      console.log(0);
      const summaryRegex = /.*ok.*changed.*/g; // isolates to lines relating to playbook status
      const summaryLines = logsJn.match(summaryRegex);
      const successRegex = /.*changed=1.*/; // indicates succesful change, i.e. task run
      const failedRegex = /.*changed=0.*/; // indicates failed change, i.e. task run
      const successLines = summaryLines.map((x) => getFirstMatch(x, successRegex));
      const failedLines = summaryLines.map((x) => getFirstMatch(x, failedRegex));

      let successKeys;
      let successValues;
      if(successLines) {
        successKeys = successLines.map((x) => getFirstMatch(x, /[^ ]*/));
        successValues = successLines.map((x) => 'healthy');
      } else {
        successKeys = [];
        successValues = [];
      }

      let failedKeys;
      let failedValues;
      if(failedLines) {
        failedKeys = failedLines.map((x) => getFirstMatch(x, /[^ ]*/));
        failedValues = failedLines.map((x) => 'unhealthy');
      } else {
        failedKeys = [];
        failedValues = [];
      }

      out = arraysToObj(
        [...failedKeys, ...successKeys], 
        [...failedValues, ...successValues]
      );
      break;
    }
      
  }
  
  return out;

}

module.exports = {
  readArgonautClusterConfig,
  getVagrantFiles,
  getTargetHosts,
  clusterInit,
  generateAcGraphConfiguration,
  initializeAcState,
  checkVmHealth,
  checkNodeHealth,
  processLogOutput
};