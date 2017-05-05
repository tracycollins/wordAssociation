/*jslint node: true */
"use strict";

var compactDateTimeFormat = "YYYYMMDD HHmmss";

var OFFLINE_MODE = false;
var debug = require('debug')('wa');
var debugKeyword = require('debug')('kw');
var moment = require('moment');
var os = require('os');

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, '');
hostname = hostname.replace(/.fios-router.home/g, '');
hostname = hostname.replace(/word0-instance-1/g, 'google');

var jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } else {
    return obj;
  }
}

function quit(message) {
  var msg = '';
  if (message) msg = message;
  console.log(process.argv[1]
    + " | DB SORTER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );
  process.exit();
}

process.on('SIGHUP', function() {
  quit('SIGHUP');
});

process.on('SIGINT', function() {
  quit('SIGINT');
});


// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var ONE_SECOND = 1000;
var ONE_MINUTE = ONE_SECOND * 60;
var ONE_HOUR = ONE_MINUTE * 60;
var ONE_DAY = ONE_HOUR * 24;


// ==================================================================
// NODE MODULE DECLARATIONS
// ==================================================================

var async = require('async');
var HashMap = require('hashmap').HashMap;

console.log(
  '\n\n====================================================================================================\n' 
  + '========================================= ***START*** ==============================================\n' 
  + '====================================================================================================\n' 
  + process.argv[1] 
  + '\nPROCESS ID  ' + process.pid 
  + '\nSTARTED     ' + Date() 
  + '\n' + '====================================================================================================\n' 
  + '========================================= ***START*** ==============================================\n' 
  + '====================================================================================================\n\n'
);

// ==================================================================
// LOGS, STATS
// ==================================================================
var chalk = require('chalk');

var chalkRed = chalk.red;
var chalkGreen = chalk.green;
var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.red;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.black;


// ==================================================================
// ENV INIT
// ==================================================================
if (debug.enabled) {
  console.log("SORTER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

var statsObj = {};
var cnf = {};

var sorterInterval;
      
process.on('message', function(m) {

  console.log(chalkInfo("SORTER RX MESSAGE"
    + " | OP: " + m.op
    // + "\n" + jsonPrint(m)
  ));

  switch (m.op) {

    case "INIT":
      console.log(chalkInfo("SORTER INIT"
      ));
    break;

    case "SORT":

      var params = {
        sortKey: m.sortKey,
        obj: m.obj,
        max: m.max
      };

      console.log(chalkInfo("SORTER SORT"
        + " | OBJ KEYS: " + Object.keys(m.obj).length
      ));
      sortedObjectValues(params, function(sortedKeys){
        process.send({ op: "SORTED", sortKey: params.sortKey, sortedKeys: sortedKeys});
      });

    break;

    default:
      console.log(chalkError("UNKNOWN SORTER OP???"
        + " | " + m.op
      ));
      process.send({ error: "ERROR", message: "UNKNOWN SORTER OP" + m.op });
  }
});

// ==================================================================
// FUNCTIONS
// ==================================================================

function sortedObjectValues(params, callback) {

  var keys = Object.keys(params.obj);

  var sortedKeys = keys.sort(function(a,b){
    var objA = params.obj[a];
    var objB = params.obj[b];
    return objB[params.sortKey] - objA[params.sortKey];
  });

  var endIndex = sortedKeys.length < params.max ? sortedKeys.length : params.max;
  var i;

  // console.log(chalkLog("SORT ---------------------"));

  // for (i=0; i<endIndex; i += 1){
  //   console.log(chalkLog(params.obj[sortedKeys[i]][params.sortKey].toFixed(3)
  //     + " | "  + sortedKeys[i] 
  //   ));
  // }

  callback(sortedKeys.slice(0,params.max));
}