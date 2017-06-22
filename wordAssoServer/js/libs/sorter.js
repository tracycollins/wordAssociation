/*jslint node: true */
"use strict";

const compactDateTimeFormat = "YYYYMMDD HHmmss";

const moment = require("moment");
const debug = require("debug")("wa");
const os = require("os");
const chalk = require("chalk");
const chalkGreen = chalk.green;
const chalkInfo = chalk.gray;
const chalkError = chalk.bold.red;
const chalkLog = chalk.black;

let hostname = os.hostname();
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

console.log(
  "\n\n====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n" 
  + process.argv[1] 
  + "\nPROCESS ID  " + process.pid 
  // + "\nSTARTED     " + Date() 
  + "\n" + "====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n\n"
);

const quit = function (message) {
  let msg = "";
  if (message) {msg = message;}

  console.error(process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | SORTER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );
  process.exit();
};

process.on("SIGUSR2", function() {
  quit("SIGUSR2");
});

process.on("SIGHUP", function() {
  quit("SIGHUP");
});

process.on("SIGINT", function() {
  quit("SIGINT");
});

if (debug.enabled) {
  console.log("SORTER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

// ==================================================================
// FUNCTIONS
// ==================================================================

const sortedObjectValues = function(params) {

  return new Promise(function(resolve, reject) {

    const keys = Object.keys(params.obj);

    const sortedKeys = keys.sort(function(a,b){
      const objA = params.obj[a];
      const objB = params.obj[b];
      return objB[params.sortKey] - objA[params.sortKey];
    });

    if (keys.length !== undefined) {
      resolve({sortKey: params.sortKey, sortedKeys: sortedKeys.slice(0,params.max)});
    }
    else {
      reject(new Error("ERROR"));
    }

  });
};

const sendSorted = function(params) {

  return new Promise(function(resolve, reject) {

    process.send({ op: "SORTED", sortKey: params.sortKey, sortedKeys: params.sortedKeys}, function(err){
      if (err) {
        console.log(chalkError("!!! SORTER SEND ERR: " + err));
        reject(new Error("SEND KEYWORDS ERROR: " + err));
      }
      else {
        resolve(params.sortedKeys.length);
      }
    });

  });
};

process.on("message", function(m) {

  debug(chalkInfo("SORTER RX MESSAGE"
    + " | OP: " + m.op
    // + "\n" + jsonPrint(m)
  ));

  let params = {};

  switch (m.op) {

    case "INIT":
      console.log(chalkLog("SORTER INIT"
      ));
    break;

    case "SORT":

      params.sortKey = m.sortKey;
      params.obj = m.obj;
      params.max = m.max;

      debug(chalkGreen("SORTER SORT"
        + " | OBJ KEYS: " + Object.keys(m.obj).length
      ));

      sortedObjectValues(params).then(sendSorted).then(function(response){
        debug(chalkError("SORTER KEYS SENT: " + response));
      }, function(err){
        console.log(chalkError("SORTER ERROR: " + err));
      });


    break;

    default:
      console.log(chalkError("UNKNOWN SORTER OP???"
        + " | " + m.op
      ));
      process.send({ error: "ERROR", message: "UNKNOWN SORTER OP" + m.op }, function(err){
        if (err) {
          console.log(chalkError("!!! SORTER SEND ERR: " + err));
          // quit(err);
        }
      });
  }
});