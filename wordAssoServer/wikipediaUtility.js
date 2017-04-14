/*jslint node: true */
"use strict";


// ==================================================================
// GLOBAL VARIABLES
// ==================================================================

var os = require("os");
var hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

var ONE_SECOND = 1000;
var ONE_MINUTE = ONE_SECOND * 60;
var ONE_HOUR = ONE_MINUTE * 60;
var ONE_DAY = ONE_HOUR * 24;
var quitOnErrorFlag = false;

var compactDateTimeFormat = "YYYYMMDD HHmmss";
var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var configuration = {};

const wiki = require('wikijs').default; 


var defaults = require("object.defaults");
var chalk = require("chalk");
var moment = require("moment");

var config = require("./config/config");
var util = require("util");
var async = require("async");
var HashMap = require("hashmap").HashMap;
var debug = require("debug")("wa");
var commandLineArgs = require("command-line-args");

var mongoose = require("./config/mongoose");
var db = mongoose();

var Word = require("mongoose").model("Word");
var Group = require("mongoose").model("Group");
var Entity = require("mongoose").model("Entity");

var wordServer = require("./app/controllers/word.server.controller");
var groupServer = require("./app/controllers/group.server.controller");
var entityServer = require("./app/controllers/entity.server.controller");

// ==================================================================
// SESSION MODES: STREAM  ( session.config.mode )
// ==================================================================

var chalkRedBold = chalk.bold.red;
var chalkTwitter = chalk.blue;
var chalkRed = chalk.red;
var chalkConnect = chalk.green;
var chalkDisconnect = chalk.red;
var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.red;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;
var chalkDb = chalk.gray;

var statsObj = {};

var jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
};

function quit(message) {
  console.log("\n... QUITTING ...");
  if (typeof updater !== "undefined") { updater.kill("SIGHUP"); }
  var msg = "";
  if (message) {msg = message;}
  console.log("QUIT MESSAGE\n" + msg);
  process.exit();
}

process.on("SIGINT", function() {
  quit("SIGINT");
});


var stdin;
var enableStdin = { name: "enableStdin", alias: "i", type: Boolean, defaultValue: true};
var quitOnError = { name: "quitOnError", alias: "q", type: Boolean, defaultValue: false};
var optionDefinitions = [enableStdin, quitOnError];
var commandLineConfig = commandLineArgs(optionDefinitions);

console.log(chalkInfo("COMMAND LINE CONFIG\n" + jsonPrint(commandLineConfig)));
console.log("COMMAND LINE OPTIONS\n" + jsonPrint(commandLineConfig));

console.log(
  "\n\n====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n" 
  + process.argv[1] 
  + "\nHOST           " + hostname
  + "\nPROCESS ID     " + process.pid 
  + "\nSTARTED        " + Date()
  + "\n" + "====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n\n"
);

// ==================================================================
// ENV INIT
// ==================================================================

if (debug.enabled) {
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";

console.log("NODE_ENV : " + process.env.NODE_ENV);
console.log("CLIENT HOST + PORT: " + "http://localhost:" + config.port);

function showStats(options){
  console.log(chalkInfo("\nSTATS"
    + "\n" + jsonPrint(statsObj)
  ));
}

function initializeConfiguration(cnf, callback) {

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | initializeConfiguration ..."));

  var commandArgs = Object.keys(commandLineConfig);

  commandArgs.forEach(function(arg){
    cnf[arg] = commandLineConfig[arg];
    console.log("--> COMMAND LINE CONFIG | " + arg + ": " + cnf[arg]);
  });

  var configArgs = Object.keys(cnf);
  configArgs.forEach(function(arg){
    console.log("FINAL CONFIG | " + arg + ": " + cnf[arg]);
  });

  if (cnf.quitOnError) { 
    quitOnErrorFlag = true;
  }

  if (cnf.enableStdin){

    console.log("STDIN ENABLED");

    stdin = process.stdin;
    if (typeof stdin.setRawMode !== "undefined") { stdin.setRawMode(true); }
    stdin.resume();
    stdin.setEncoding( "utf8" );
    stdin.on( "data", function( key ){

      switch (key) {
        case "\u0003":
          process.exit();
        break;
        case "q":
          quit();
        break;
        case "Q":
          quit();
        break;
        case "s":
          showStats();
        break;
        case "S":
          showStats(true);
        break;
        default:
          console.log(
            "\n" + "q/Q: quit"
            + "\n" + "s: showStats"
            + "\n" + "S: showStats verbose"
          );
      }
    });
  }

  callback(null, null);
}

initializeConfiguration(configuration, function(err, results){
  console.log(chalkInfo("INIT COMPLETE"));

  // wiki().page('Batman')
  //     .then(page => page.info('alter_ego'))
  //     .then(console.log); // Bruce Wayne 

  wiki()
    .search('trump')
    // .then(data => console.log(data.results.length));
    .then(function(data){
      console.log(chalkInfo(data.results.length + " RESULTS"));
      console.log(chalkInfo(jsonPrint(data.results)));
      // data.next().then(function(nData){
      //   console.log(chalkInfo(nData.results.length + " RESULTS"));
      //   console.log(chalkInfo(jsonPrint(nData.results)));
      // });
    })
    .catch(function(err){
      console.log(chalkError("ERROR\n" + jsonPrint(err)));
    });

});
