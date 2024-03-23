
// external modules
const yaml = require('js-yaml');
const tmp = require('tmp');
const fs = require('fs');
const tstream = require('tailing-stream');
const dataForge = require('data-forge');

// internal modules
const argonautCluster = require('./argonautCluster');
const utility = require('./utility');
const ansible = require('./ansible');

const streamVagrantProcessPipe = async(
  wsConn,
  playbookVars,
  playbookName
) => {
  // Since vagrant up is often long-running, we will pipe the stdout
  // of the process to the same WS connection
  let stdoutPath;
  let pipeStream;
  for(host of playbookVars.hosts) {
    stdoutPath = `logs/${host}-${playbookName}-stdout`
    utility.myWrite('', stdoutPath);
    pipeStream = tstream.createReadStream(stdoutPath, {timeout: 0});

    pipeStream.on('data', (data) => {
      // Send data to connected WebSocket clients
      wsConn.send(JSON.stringify({
        type: "stdout",
        processType: playbookName,
        message: data.toString()
      }));
    });
  }
}

const vagrantUp = async (wsConn, vms, provision = true) => {

  // form vagrantfiles
  playbookVars = argonautCluster.getVagrantFiles();
  // vm only exists on a subset of the hosts
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;

  // set provision argument. default is false in vagrant
  if(provision) {
    playbookVars.provisionArg = "--provision"
  } else {
    playbookVars.provisionArg = "--no-provision"
  }

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
      wsConn,
      "vagrant-up",
      varsPath
  );

  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-up"
  )

};
  
const vagrantDestroy = async (wsConn, vms, graceful = false) => {

  playbookVars = argonautCluster.getVagrantFiles();
  
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;

  // set provision argument. default is false in vagrant
  if(graceful) {
    playbookVars.gracefulArg = "--graceful"
  } else {
    playbookVars.gracefulArg = ""
  }

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-destroy",
    varsPath
  );

  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-destroy"
  );

};

const vagrantHalt = async (wsConn, vms, force = false) => {

  playbookVars = argonautCluster.getVagrantFiles();
  
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;

  // set provision argument. default is false in vagrant
  if(force) {
    playbookVars.forceArg = "--force"
  } else {
    playbookVars.forceArg = ""
  }

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-halt",
    varsPath
  );

  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-halt"
  );

};
  
const vagrantSuspend = async (wsConn, vms) => {

  playbookVars = argonautCluster.getVagrantFiles();
  
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-suspend",
    varsPath
  );

  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-suspend"
  );

};
  
const vagrantResume = async (wsConn, vms, provision = false) => {

  playbookVars = argonautCluster.getVagrantFiles();
  
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;

  if(provision) {
    playbookVars.provisionArg = "--provision"
  } else {
    playbookVars.provisionArg = "--no-provision"
  }

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-resume",
    varsPath
  );

  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-resume"
  );

};
  
const vagrantReload = async (wsConn, vms, provision = false, force = false) => {

  playbookVars = argonautCluster.getVagrantFiles();
  
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;

  if(provision) {
    playbookVars.provisionArg = "--provision"
  } else {
    playbookVars.provisionArg = "--no-provision"
  }

  if(force) {
    playbookVars.forceArg = "--provision"
  } else {
    playbookVars.forceArg = "--no-provision"
  }

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-reload",
    varsPath
  );

  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-reload"
  );

};
  
// const vagrantValidate = async () => {

//   playbookVars = argonautCluster.getVagrantFiles();
//   delete playbookVars.acState; // avoid unnecessary writing

//   varsPath = utility.tmpWrite(yaml.dump(playbookVars));
//   tmpBecomePass = ansible.getBecomePassPath();

//   ansible.runPlaybook(
//     "vagrant-validate",
//     varsPath,
//     tmpBecomePass
//   )

// };

const vagrantStatus = async (wsConn) => {

  playbookVars = argonautCluster.getVagrantFiles();
  delete playbookVars.acState; // avoid unnecessary writing

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-status",
    varsPath
  );

};

const vagrantSnapshotSave = async (
  wsConn,
  vms,
  snapshotName
) => {

  playbookVars = argonautCluster.getVagrantFiles();
  
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;
  playbookVars.snapshotName = snapshotName;

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-snapshot-save",
    varsPath
  );

  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-snapshot-save"
  );

};
  
const vagrantSnapshotDelete = async (
  wsConn,
  vms,
  snapshotName
) => {

  playbookVars = argonautCluster.getVagrantFiles();
  
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;
  playbookVars.snapshotName = snapshotName;

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-snapshot-delete",
    varsPath
  );

  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-snapshot-delete"
  );

};
  
const vagrantSnapshotRestore = async (
  wsConn,
  vms,
  snapshotName,
  provision = false
) => {

  playbookVars = argonautCluster.getVagrantFiles();
  
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;
  playbookVars.snapshotName = snapshotName;

  // set provision argument. default is true in vagrant
  if(provision) {
    playbookVars.provisionArg = "--provision"
  } else {
    playbookVars.provisionArg = "--no-provision"
  }

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-snapshot-restore",
    varsPath
  );

  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-snapshot-restore"
  );

};

// Unused -- was once meant to compare staged vs. actual configs
const getActualVagrantFiles = (
  acConfig = argonautCluster.readArgonautClusterConfig()
) => {

  const nodes = Object.keys(acConfig.cluster.nodes);
  const out = {};

  for(node of nodes) {
    let vfTmp = tmp.fileSync({});
    try {
      utility.execSync(
        'scp',
        [
          `${acConfig.cluster.inventory_vars.ansible_user}@${node}:${acConfig.cluster.vagrant_dir}/Vagrantfile`,
          `${vfTmp.name}`
        ]
      );
      out[node] = fs.readFileSync(vfTmp.name, 'utf-8');
    } catch (error) {

    }
  }

  return out;
};

const vagrantSnapshotList = (
  acConfig = argonautCluster.readArgonautClusterConfig()
) => {

  const nodes = Object.keys(acConfig.cluster.nodes);
  let snapshotCsv = "";
  let child;
  for(node of nodes) {
    try {
      child = utility.execSync(
        'ssh',
        [
          `${acConfig.cluster.inventory_vars.ansible_user}@${node}`,
          // escaping the directory name below to allow for spaces in paths
          `cd ${acConfig.cluster.vagrant_dir.replace(/ /g, '\\ ')}; vagrant snapshot list --machine-readable`
        ]
      );
      snapshotCsv = [snapshotCsv, child.stdout].join('\n');
    } catch (error) {
      
    }
    
  }
  const df = dataForge.fromCSV(snapshotCsv);
  // Get relevant column names
  const detailColumn = df.getColumnNames()[3];
  const snapshotRows = df.where(
    row => row[detailColumn] == 'detail'
  );

  const out = [];
  for(const row of snapshotRows.toRows()) {
    out.push({
      vm: row[1],
      snapshot: row[4]
    })
  };

  return out;
  
};

const killVagrantProcesses = (
  wsConn,
  nodes
) => {
  const playbookVars = {hosts: nodes};

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  ansible.runPlaybookWebsocket(
    wsConn,
    "kill-vagrant-processes",
    varsPath
  );
};

module.exports = {
  vagrantUp,
  vagrantDestroy,
  vagrantHalt,
  vagrantSuspend,
  vagrantResume,
  vagrantReload,
  // vagrantValidate,
  vagrantStatus,
  vagrantSnapshotSave,
  vagrantSnapshotDelete,
  vagrantSnapshotRestore,
  vagrantSnapshotList,
  getActualVagrantFiles,
  killVagrantProcesses
};