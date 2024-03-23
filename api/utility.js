
// external modules
const fs = require('fs');
const tmp = require('tmp');
const child_process = require('child_process');


function myWrite(content, filename) {
  fs.writeFileSync(filename, content, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
      return err;
    }
  
    console.log('Wrote content to file:', filename);
  });
};

function tmpWrite(content, fileext = ".yaml") {
  filepath = tmp.fileSync({postfix: fileext});
  myWrite(
    content,
    filepath.name
  );
  return filepath.name
};

// https://stackoverflow.com/questions/14332721/node-js-spawn-child-process-and-get-terminal-output-live
function execSync(command, args) {
  var child = child_process.spawnSync(command, args, { encoding : 'utf8' });
  console.log("Process finished.");
  if(child.error) {
      console.log("ERROR: ",child.error);
      process.exit(1);
  }
  console.log("stdout: ",child.stdout);
  console.log("stderr: ",child.stderr);
  console.log("exit code: ",child.status);
  return child;
};


function overrideValues(originalObject, overrideObject) {
  // Clone the original object to avoid modifying it directly
  const result = { ...originalObject };

  // Iterate over the keys of the override object
  Object.keys(overrideObject).forEach((key) => {
    // Update the value in the result object
    result[key] = overrideObject[key];
  });

  return result;
};

function toArray(value) {
  return Array.isArray(value) ? value : [value];
};


// Because ansible likes snake and vagrant likes kebab.
function snakeToKebab(str) {
  return str.replace(/_/g, '-');
};

const logChanges = async (proc) => {

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', function(data) {
      //Here is where the output goes

      console.log('stdout: ' + data);

  });

  proc.stderr.on('data', function(data) {
    //Here is where the output goes

    console.log('stderr: ' + data);

  });

  proc.on('close', (code) => {
    console.log(`process exited with code ${code}`);
  });

};

const logChangesWebsocket = async (proc, wsConn, processType) => {

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', function(data) {
      //Here is where the output goes

      wsConn.send(JSON.stringify({
        type: "stdout",
        processType: processType,
        message: data
      }));

  });

  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', function(data) {
    //Here is where the output goes

    wsConn.send(JSON.stringify({
      type: "stderr",
      processType: processType,
      message: data
    }));

  });

  proc.on('close', (code) => {
    wsConn.send(JSON.stringify({
      type: "exit",
      processType: processType,
      message: code
    }));
  });

};

function replaceEmpty(val, repl = "") {
  if(val !== undefined) {
    return val
  } else {
    return repl
  }
};

module.exports = {
  myWrite,
  tmpWrite,
  execSync,
  overrideValues,
  toArray,
  snakeToKebab,
  logChanges,
  logChangesWebsocket,
  replaceEmpty
};