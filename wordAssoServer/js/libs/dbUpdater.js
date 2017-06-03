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
  var msg = "";
  var exitCode = 0;
  if (message) {
    msg = message;
    exitCode = 1;
  }
  console.error(process.argv[1]
    + " | DB UPDATER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );
  process.exit(exitCode);
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

var mongoose = require('../../config/mongoose');
var db = mongoose();
var Word = require('mongoose').model('Word');
var Group = require('mongoose').model('Group');
var Entity = require('mongoose').model('Entity');

var wordServer = require('../../app/controllers/word.server.controller');
var groupServer = require("../../app/controllers/group.server.controller");
var entityServer = require("../../app/controllers/entity.server.controller");

var dbUpdateQueue = [];
var dbUpdateQueueReady = true;

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
  console.log("UPDATER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

var statsObj = {};
var cnf = {};

var dbUpdateQueueInterval;
      
process.on('message', function(m) {

  debug(chalkAlert("DB UPDATER RX MESSAGE"
    + " | OP: " + m.op
    + "\n" + jsonPrint(m)
  ));

  switch (m.op) {

    case "INIT":
      cnf.updateInterval = m.interval;
      console.log(chalkInfo("DB UPDATER INIT"
        + " | INTERVAL: " + m.interval
      ));
      initDbUpdateQueueInterval(cnf.updateInterval);
    break;

    case "UPDATE":
      switch (m.updateType) {
        case "tweet":
        case "user":
        case "hashtag":
        case "media":
        case "url":
        case "place":
        case "word":
        case "group":
        case "entity":
          dbUpdateQueue.push(m);
          debug(chalk.blue("DB UPDATE"
            + " [" + dbUpdateQueue.length + "]"
            + " | T: " + m.updateType
          ));
          break;

        default:
          console.log(chalkError("UNKNOWN UPDATE TYPE\n" + jsonPrint(m)));
      }
    break;

    default:

  }
});

// ==================================================================
// FUNCTIONS
// ==================================================================
function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24),
    days = parseInt(duration / (1000 * 60 * 60 * 24));

  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return days + ":" + hours + ":" + minutes + ":" + seconds;
}


function initDbUpdateQueueInterval(interval){

  console.log(chalkInfo("initDbUpdateQueueInterval | " + interval + " MS"));

  clearInterval(dbUpdateQueueInterval);

  dbUpdateQueueInterval = setInterval(function(){

    if (dbUpdateQueueReady && (dbUpdateQueue.length > 0)){

      dbUpdateQueueReady = false;

      var updateObj = dbUpdateQueue.shift();

      debug(chalkInfo("updateObj\n" + jsonPrint(updateObj)));

      switch (updateObj.updateType) {
        
        case "word":
          debug(chalkInfo("DB UPDATE WORD"
            + " | " + updateObj.word.nodeId
            + " | MODE: " + updateObj.mode
            + " | INC M: " + updateObj.incMentions
          ));
          wordServer.findOneWord(updateObj.word, updateObj.incMentions, function(err, updatedWordObj){
            if (err) {
              console.log(chalkError("DB UPDATE ERROR\n" + jsonPrint(err)));
            }
            else if (updatedWordObj){
              debug(chalkRed("DB UPDATED WORD"
                + " | " + updatedWordObj.nodeId
                + " | SID: " + updatedWordObj.sessionId
                + " | Ms: " + updatedWordObj.mentions
              ));
              if (updateObj.mode === "return") {
                process.send({ op: "UPDATED", updateType: "word", word: updatedWordObj}, function(err){
                  if (err) {
                    console.log(chalkError("!!! DB UPDATER SEND ERR: " + err));
                    // quit(err);
                  }
                });
              }
            }
            dbUpdateQueueReady = true;
          });
        break;

        default:
          console.log(chalkError("UNKNOWN UPDATE TYPE\n" + jsonPrint(updateObj)));
          dbUpdateQueueReady = true;

      }
    }
  }, interval);
}


// setTimeout(function(){
//   console.log(chalkRed("TEST KILLING DB UPDATER"));
//   console.log(chalkRed("UNDEFINED VAR " + thisIsNotDefined));
// }, 10000);

