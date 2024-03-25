
// external modules
const fs = require('fs');
const tmp = require('tmp');
const child_process = require('child_process');

// Writes the content synchronously to the filename
function myWrite(content, filename) {
  fs.writeFileSync(filename, content, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
      return err;
    }
  
    console.log('Wrote content to file:', filename);
  });
};

// Writes the content synchronously to a temporary file
// with extension fileext
function tmpWrite(content, fileext = ".yaml") {
  filepath = tmp.fileSync({postfix: fileext});
  myWrite(
    content,
    filepath.name
  );
  return filepath.name
};

// Runs a command synchronously and outputs stdoutput and stderr to the
// console after finishing
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

// overwrites the keys in originalObject with values
// from matching keys in overrideObject. Used to allow
// override configuration of the vm_type in AC config
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

// Converts a value to an array if it is not one
function toArray(value) {
  return Array.isArray(value) ? value : [value];
};


// Converts snake casing to kebab casing
// Used because snake casing is standard for ansible,
// but can't be used for hostnames
function snakeToKebab(str) {
  return str.replace(/_/g, '-');
};

// Streams the stdout and stderr of the proc in realtime
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

// Similar to logChanges, but sends the output to the provided
// wsConn as on object containing the stdout data and a processType
// tag
// The tag is used when the data is passed to processLogs
const logChangesWebsocket = async (proc, wsConn, processType) => {

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', function(data) {
    // Send stdout    
    wsConn.send(JSON.stringify({
      type: "stdout",
      processType: processType,
      message: data
    }));

  });

  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', function(data) {
    // Send stderr
    wsConn.send(JSON.stringify({
      type: "stderr",
      processType: processType,
      message: data
    }));

  });

  proc.on('close', (code) => {
    // Exit code is sent as well
    wsConn.send(JSON.stringify({
      type: "exit",
      processType: processType,
      message: code
    }));
  });

};

// Replaces undefined values with repl
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