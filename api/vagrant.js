
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

// Streams the output of a vagrant process via tailing-stream to wsConn
// The playbook pipes the output of an ssh command running the playbook
// to a file that tstream reads from
const streamVagrantProcessPipe = async(
  wsConn,
  playbookVars,
  playbookName
) => {
  // Since vagrant processes are often long-running, we will pipe the stdout
  // of the WS connection
  let stdoutPath;
  let pipeStream;

  // Each node has a separate log file, so iterate through
  // each of them to stream the output
  for(host of playbookVars.hosts) {
    stdoutPath = `logs/${host}-${playbookName}-stdout`
    utility.myWrite('', stdoutPath); // reinitialize log file
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

// Call vagrant up and stream the output to the wsConn
// provision controls whether the provisioning scripts are run
const vagrantUp = async (wsConn, vms, provision = true) => {

  // form vagrantfiles
  playbookVars = argonautCluster.getVagrantFiles();
  // vms only exist on a subset of the hosts
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

  // Playbook reads vars from a temporary file
  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
      wsConn,
      "vagrant-up",
      varsPath
  );

  // stream vagrant output from inner ssh process
  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-up"
  )

};

// calls vagrant destroy on the provided vms, streaming output to wsConn
// graceful controls whether VMs are shut down gracefully or forcefully
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

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-destroy",
    varsPath
  );

  // stream vagrant output from inner ssh process
  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-destroy"
  );

};

// Runs vagrant halt on the provided vms, streaming output to wsconn
// force controls whether the VM is forcefully shut down
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

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-halt",
    varsPath
  );

  // stream vagrant output from inner ssh process
  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-halt"
  );

};
  
// Calls vagrant suspend on provided vms, streaming output to wsConn
const vagrantSuspend = async (wsConn, vms) => {

  playbookVars = argonautCluster.getVagrantFiles();
  
  hostToVms = argonautCluster.getTargetHosts(playbookVars.acState, vms);

  delete playbookVars.acState; // avoid unnecessary writing
  playbookVars.hosts = Object.keys(hostToVms);
  playbookVars.hostToVms = hostToVms;

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-suspend",
    varsPath
  );

  // stream vagrant output from inner ssh process
  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-suspend"
  );

};

// Calls vagrant resume on provided vms, streaming output to wsConn
// provision controls whether provisioning scripts are run
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

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-resume",
    varsPath
  );

  // stream vagrant output from inner ssh process
  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-resume"
  );

};

// Calls vagrant reload on provided vms, streaming output to wsConn
// provision controls whether provisioning scripts are run
// force controls whether the VMs are shut down forcefully or gracefully
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
    playbookVars.forceArg = "--force"
  } else {
    playbookVars.forceArg = ""
  }

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-reload",
    varsPath
  );

  // stream vagrant output from inner ssh process
  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-reload"
  );

};

// Unused -- calls vagrant validate to check Vagrantfile output
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

// Calls vagrant status on provided vms, streaming output to wsConn
const vagrantStatus = async (wsConn) => {

  playbookVars = argonautCluster.getVagrantFiles();
  delete playbookVars.acState; // avoid unnecessary writing

  varsPath = utility.tmpWrite(yaml.dump(playbookVars));

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-status",
    varsPath
  );

};

// Calls vagrant snapshot save on provided vms, streaming output to wsConn
// the snapshot is saved to snapshotName
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

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-snapshot-save",
    varsPath
  );

  // stream vagrant output from inner ssh process
  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-snapshot-save"
  );

};

// Calls vagrant snapshot delete on provided vms, streaming output to wsConn
// the deleted snapshot is specified as snapshotName
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

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-snapshot-delete",
    varsPath
  );

  // stream vagrant output from inner ssh process
  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-snapshot-delete"
  );

};

// Calls vagrant snapshot restore on provided vms, streaming output to wsConn
// the restored snapshot is specified as snapshotName
// provision controls whether the provisioning scripts are run
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

  // Stream ansible output from process
  ansible.runPlaybookWebsocket(
    wsConn,
    "vagrant-snapshot-restore",
    varsPath
  );

  // stream vagrant output from inner ssh process
  streamVagrantProcessPipe(
    wsConn,
    playbookVars,
    "vagrant-snapshot-restore"
  );

};

// Unused -- was once meant to compare staged vs. actual configs
// const getActualVagrantFiles = (
//   acConfig = argonautCluster.readArgonautClusterConfig()
// ) => {

//   const nodes = Object.keys(acConfig.cluster.nodes);
//   const out = {};

//   for(node of nodes) {
//     let vfTmp = tmp.fileSync({});
//     try {
//       utility.execSync(
//         'scp',
//         [
//           `${acConfig.cluster.inventory_vars.ansible_user}@${node}:${acConfig.cluster.vagrant_dir}/Vagrantfile`,
//           `${vfTmp.name}`
//         ]
//       );
//       out[node] = fs.readFileSync(vfTmp.name, 'utf-8');
//     } catch (error) {

//     }
//   }

//   return out;
// };

// Lists vagrant snapshots by calling an SSH process
// returns an output object of rows to be passed to the Vue app
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

// Runs the kill vagrant processes playbook on provided nodes, which runs pkill vagrant; pkill ruby
// Useful for clearing out existing Vagrant processes to let new ones run
// Streams output to wsConn
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
  // getActualVagrantFiles,
  killVagrantProcesses
};