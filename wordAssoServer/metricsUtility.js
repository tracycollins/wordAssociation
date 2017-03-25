/*jslint node: true */
"use strict";

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var ONE_SECOND = 1000;
var ONE_MINUTE = ONE_SECOND * 60;
var ONE_HOUR = ONE_MINUTE * 60;
var ONE_DAY = ONE_HOUR * 24;
var quitOnErrorFlag = false;

var configuration = {};

var tssServer;
var tmsServer;

var MIN_WORD_METER_COUNT = 10;
var MIN_METRIC_VALUE = 5;

var CUSTOM_GOOGLE_APIS_PREFIX = "custom.googleapis.com";

var enableGoogleMetrics = (typeof process.env.ENABLE_GOOGLE_METRICS !== "undefined") ? process.env.ENABLE_GOOGLE_METRICS : false;

var Monitoring = require("@google-cloud/monitoring");
var googleMonitoringClient = Monitoring.v3().metricServiceClient();

var defaults = require("object.defaults");
var chalk = require("chalk");
var moment = require("moment");
var prompt = require('prompt');

var config = require("./config/config");
var util = require("util");
var fs = require("fs");
var S = require("string");
var os = require("os");
var async = require("async");
var HashMap = require("hashmap").HashMap;
var Dropbox = require("dropbox");
var unirest = require("unirest");
var debug = require("debug")("wa");
var commandLineArgs = require("command-line-args");

// ==================================================================
// SESSION MODES: STREAM  ( session.config.mode )
// ==================================================================

var chalkRedBold = chalk.bold.red;
var chalkTwitter = chalk.blue;
var chalkWapi = chalk.red;
var chalkViewer = chalk.cyan;
var chalkUser = chalk.green;
var chalkUtil = chalk.blue;
var chalkRed = chalk.red;
var chalkAdmin = chalk.bold.cyan;
var chalkConnect = chalk.green;
var chalkDisconnect = chalk.red;
var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.red;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;
var chalkSession = chalk.blue;
var chalkResponse = chalk.blue;
var chalkBht = chalk.gray;
var chalkMw = chalk.yellow;
var chalkDb = chalk.gray;

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

// var enableStdin = { name: "enableStdin", alias: "i", type: Boolean, defaultValue: true};
var quitOnError = { name: "quitOnError", alias: "q", type: Boolean, defaultValue: false};

var optionDefinitions = [quitOnError];

var commandLineConfig = commandLineArgs(optionDefinitions);

console.log(chalkInfo("COMMAND LINE CONFIG\n" + jsonPrint(commandLineConfig)));
console.log("COMMAND LINE OPTIONS\n" + jsonPrint(commandLineConfig));


// ==================================================================
// NODE MODULE DECLARATIONS
// ==================================================================

var compactDateTimeFormat = "YYYYMMDD HHmmss";
var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

// ==================================================================
// SERVER STATUS
// ==================================================================

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

  if (cnf.quitOnError) { quitOnErrorFlag = true; }

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

var top10descriptorArray = [];

initializeConfiguration(configuration, function(err, results){
  console.log(chalkInfo("INIT COMPLETE"));
  prompt.start();

  var googleRequest = {
    name: googleMonitoringClient.projectPath("graphic-tangent-627")
    // filter: starts_with("custom.googleapis.com/word/top10")
  };

  googleMonitoringClient.listMetricDescriptors(googleRequest)
    .then(function(results){

      const descriptors = results[0];

      console.log(chalkInfo("METRICS"
        + " | " + descriptors.length
      ));

      async.eachSeries(descriptors, function(descriptor, cb) {

        if (descriptor.name.includes("top10")) {

          console.log(chalkInfo("DESCRIPTOR: " + descriptor.name));

          prompt.get(['DELETE'], function (err, result) {
            // console.log('Command-line input received:');
            // console.log('  DELETE: ' + result.DELETE);

            switch (result.DELETE) {
              case "d":
                console.log(chalkAlert("DELETE\n" + jsonPrint(descriptor)));

                  const deleteRequest = {
                    name: googleMonitoringClient.metricDescriptorPath(process.env.GOOGLE_PROJECT_ID, descriptor.type)
                  };

                  googleMonitoringClient.deleteMetricDescriptor(deleteRequest)
                  .then(function(results){
                    console.log(chalkInfo("GOOGLE METRIC DELETE"));
                    cb();
                  })
                  .catch(function(results){
                    console.log(chalkError("*** ERROR GOOGLE METRIC DELETE"
                      // + " | ERR CODE: " + results.code
                      // + " | META DATA: " + results.metadata
                      // + " | META NODE: " + results.note
                      + "\n" + jsonPrint(results)
                    ));
                    cb();
                  });
              break;
              case "q":
                // console.log(chalkAlert("QUIT"));
                cb(result.DELETE);
              break;
              default:
                // console.log(chalkAlert("DEFAULT"));
                cb();
            }
          });

        }
        else {
          cb();
        }
      }, function(err) {
        if (err) {
          console.log(chalkAlert("QUIT | " + err));
        }
        console.log("END");
      });
    })
    .catch(function(results){
      if (results.code !== 8) {
        console.log(chalkError("*** ERROR GOOGLE METRICS"
          + " | ERR CODE: " + results.code
          + " | META DATA: " + results.metadata
          + " | META NODE: " + results.note
        ));
      }
    });

});
