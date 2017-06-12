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
var listDescriptorsFlag = false;
var OFFLINE_MODE = false;

var moment = require("moment");

var configuration = {};
var statsObj = {};
statsObj.metrics = {};
statsObj.metrics.deleted = {};
statsObj.metrics.hashtag = {};
statsObj.metrics.word = {};
statsObj.metrics.user = {};
statsObj.metrics.entity = {};
statsObj.startTime = moment().valueOf();
statsObj.elapsed = msToTime(moment().valueOf() - statsObj.startTime);

var tssServer;
var tmsServer;

var MIN_WORD_METER_COUNT = 10;
var MIN_METRIC_VALUE = 5;

var CUSTOM_GOOGLE_APIS_PREFIX = "custom.googleapis.com";

var enableGoogleMetrics = process.env.ENABLE_GOOGLE_METRICS || false;

var Monitoring = require("@google-cloud/monitoring");
var googleMonitoringClient = Monitoring.v3().metricServiceClient();

var defaults = require("object.defaults");
var chalk = require("chalk");
var prompt = require('prompt');

var config = require("./config/config");
var arrayContains = require("array-contains");
var util = require("util");
var fs = require("fs");
var S = require("string");
var os = require("os");
var async = require("async");
// var HashMap = require("hashmap").HashMap;
var Dropbox = require("dropbox");
var unirest = require("unirest");
var debug = require("debug")("wa");
var commandLineArgs = require("command-line-args");

var mongoose = require("./config/mongoose");
var db = mongoose();

var Hashtag = require("mongoose").model("Hashtag");
var Word = require("mongoose").model("Word");
var User = require("mongoose").model("User");

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


var deletedMetricsHashmap = {};

var jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
};

function getTimeStamp(inputTime) {
  var currentTimeStamp ;

  if (typeof inputTime === 'undefined') {
    currentTimeStamp = moment().format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else if (moment.isMoment(inputTime)) {
    currentTimeStamp = moment(inputTime).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else {
    currentTimeStamp = moment(parseInt(inputTime)).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
}

function msToTime(duration) {
  var seconds = parseInt((duration / 1000) % 60);
  var minutes = parseInt((duration / (1000 * 60)) % 60);
  var hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  var days = parseInt(duration / (1000 * 60 * 60 * 24));

  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return days + ":" + hours + ":" + minutes + ":" + seconds;
}

function showStats(options){
  statsObj.elapsed = msToTime(moment().valueOf() - statsObj.startTime);
  if (options) {
    console.log("STATS\n================================" );
    Object.keys(statsObj).forEach(function(prop){
      if (prop !== "entities") {
        if (typeof statsObj[prop] === "object") {
          console.log(prop + "\n" + jsonPrint(statsObj[prop]));
        }
        else {
          console.log(prop + ": " + statsObj[prop]);
        }
      }
    });
  }
  else {
    console.log(chalkLog("STATS"
      + " | ELAPSED: " + statsObj.elapsed
      + " | START: " + statsObj.startTime
      + " | DELETED METRICS: " + Object.keys(statsObj.metrics.deleted).length
      + "\nDELETED METRICS\n" + jsonPrint(statsObj.metrics.deleted)
    ));
  }
}

function quit(message) {
  var msg = "";
  console.log("\n... QUITTING ...");
  if (typeof updater !== "undefined") { updater.kill("SIGHUP"); }


 console.log(chalkInfo("DELETED METRICS THIS SESSION\n" + jsonPrint(statsObj.metrics.deleted)));

  saveFile(configFolder, deletedMetricsFile, deletedMetricsHashmap, function(status){
    console.log(chalkInfo("SAVED DELETED METRICS HASHMAP | " + Object.keys(deletedMetricsHashmap).length));
    showStats();

    if (message) {msg = message;}
    console.log("QUIT MESSAGE\n" + msg);
    process.exit();

  });

}

process.on("SIGINT", function() {
  quit("SIGINT");
});


var stdin;

// var enableStdin = { name: "enableStdin", alias: "i", type: Boolean, defaultValue: true};
var quitOnError = { name: "quitOnError", alias: "q", type: Boolean, defaultValue: false};
var listDescriptorsFlag = { name: "listDescriptorsFlag", alias: "L", type: Boolean, defaultValue: false};
var deleteArray = { name: "deleteArray", alias: "D", type: String, multiple: true };

var optionDefinitions = [ deleteArray, quitOnError, listDescriptorsFlag];

var commandLineConfig = commandLineArgs(optionDefinitions);

console.log(chalkInfo("COMMAND LINE CONFIG\n" + jsonPrint(optionDefinitions)));

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


var DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);

var dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

var configFolder = "/config/utility/" + hostname;
var deletedMetricsFile = "deletedMetrics.json";


function saveFile(folder, file, obj, callback) {

  var fullPath = folder + "/" + file;

  console.log(chalkInfo("SAVE FOLDER " + folder));
  console.log(chalkInfo("SAVE FILE " + file));
  console.log(chalkInfo("FULL PATH " + folder + "/" + file));

  if (OFFLINE_MODE) {

    fs.exists(fullPath, function(exists) {
      if (exists) {
        fs.stat(fullPath, function(error, stats) {
          if (error) { return(callback(error, stats)); }
          fs.open(fullPath, "w", function(error, fd) {
            if (error) { return(callback(error, fd)); }
            fs.writeFile(path, statsObj, function(error) {
              if (error) { return(callback(error, path)); }
              callback("OK");
              fs.close(fd);
            });
          });
        });
      }
    });
  } 
  else {

  var options = {};

  options.contents = JSON.stringify(obj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(){
      console.log(chalkLog(moment().format(compactDateTimeFormat)
        + " | SAVED DROPBOX JSON | " + options.path
      ));
      callback("OK");
    })
    .catch(function(error){
      console.log(chalkError(moment().format(compactDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + options.path 
        + " ERROR: " + error.error_summary
      ));
      callback(error);
    });

  }
}

function loadFile(folder, file, callback) {

  console.log(chalkInfo("LOAD FOLDER " + folder));
  console.log(chalkInfo("LOAD FILE " + file));
  console.log(chalkInfo("FULL PATH " + folder + "/" + file));

  var fileExists = false;

  dropboxClient.filesListFolder({path: folder})
    .then(function(response) {

        async.each(response.entries, function(folderFile, cb) {

          debug("FOUND FILE " + folderFile.name);

          if (folderFile.name == file) {
            debug(chalkRedBold("SOURCE FILE EXISTS: " + file));
            fileExists = true;
          }

          cb();

        }, function(err) {

          if (fileExists) {

            dropboxClient.filesDownload({path: folder + "/" + file})
              .then(function(data) {
                console.log(chalkLog(getTimeStamp()
                  + " | LOADING FILE FROM DROPBOX: " + folder + "/" + file
                  // + "\n" + jsonPrint(data)
                ));

                var payload = data.fileBinary;

                debug(payload);

                if (file.match(/\.json$/gi)) {
                  debug("FOUND JSON FILE: " + file);
                  var fileObj = JSON.parse(payload);
                  return(callback(null, fileObj));
                }
                else if (file.match(/\.yml/gi)) {
                  var fileObj = yaml.load(payload);
                  debug(chalkAlert("FOUND YAML FILE: " + file));
                  debug("FOUND YAML FILE\n" + jsonPrint(fileObj));
                  debug("FOUND YAML FILE\n" + jsonPrint(payload));
                  return(callback(null, fileObj));
                }

               })
              .catch(function(error) {
                console.log(chalkAlert("DROPBOX loadFile ERROR: " + file + "\n" + error));
                console.log(chalkError("!!! DROPBOX READ " + file + " ERROR"));
                console.log(chalkError(jsonPrint(error)));

                if (error["status"] === 404) {
                  console.error(chalkError("!!! DROPBOX READ FILE " + file + " NOT FOUND ... SKIPPING ..."));
                  return(callback(null, null));
                }
                if (error["status"] === 0) {
                  console.error(chalkError("!!! DROPBOX NO RESPONSE ... NO INTERNET CONNECTION? ... SKIPPING ..."));
                  return(callback(null, null));
                }
                return(callback(error, null));
              });
          }
          else {
            console.error(chalkError("*** FILE DOES NOT EXIST: " + folder + "/" + file));
            console.log(chalkError("*** FILE DOES NOT EXIST: " + folder + "/" + file));
            var err = {};
            err.code = 404;
            err.status = "FILE DOES NOT EXIST";
            return(callback(err, null));
          }
        });
    })
    .catch(function(error) {
      console.error("DROPBOX LOAD FILE ERROR\n" + jsonPrint(error));
      return(callback(error, null));
    });
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

  if (cnf.listDescriptorsFlag) { 
    listDescriptorsFlag = true; 
    console.log("listDescriptorsFlag: " + listDescriptorsFlag);
  }
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

  loadFile(configFolder, deletedMetricsFile, function(err, deletedMetricsObj){
    if (err) {
      if (err.code !== 404) {
        console.error("LOAD DELETED METRICS FILE ERROR\n" + err);
        callback(err, null);
      }
      else {
        callback(null, null);
      }
    }
    else {
      Object.keys(deletedMetricsObj).forEach(function(metricName){
        deletedMetricsHashmap[metricName] = deletedMetricsObj[metricName];
        console.log(chalkAlert("+ DELETED METRIC | " + metricName ));
      });
      console.log(chalkAlert("LOADED DELETED METRICS | " + Object.keys(deletedMetricsObj).length ));
      callback(null, null);
    }
   });
}

var top10descriptorArray = [];

function deleteMetric(descriptor, callback){

  var deleteRequest = {
    name: googleMonitoringClient.metricDescriptorPath(process.env.GOOGLE_PROJECT_ID, descriptor.type)
  };

  googleMonitoringClient.deleteMetricDescriptor(deleteRequest)
    .then(function(results){
      console.log(chalkInfo("GOOGLE METRIC DELETE"));

      var nameArray = descriptor.name.split("/");
      var name = nameArray.pop().toLowerCase();

      deletedMetricsHashmap[name] = descriptor.name;
      callback();
    })
    .catch(function(error){
      console.log(chalkError("*** ERROR GOOGLE METRIC DELETE"
        // + " | ERR CODE: " + results.code
        // + " | META DATA: " + results.metadata
        // + " | META NODE: " + results.note
        + "\n" + jsonPrint(error)
      ));
      callback(error);
    });
}

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

        if (descriptor.name.includes("custom.googleapis.com")) {

          var nameArray = descriptor.name.split("/");
          var word = nameArray.pop().toLowerCase();
          
          debug(chalkInfo("WORD: " + word
           // + " | DESCRIPTOR: " + descriptor.name
          ));

          async.parallel(
            {
              word : function(callback) {
                Word.findOne({ nodeId: word }, function(err, wordObj) {
                  if (err) {
                    console.log(chalkError("WORD (DB) ERROR"
                      + " | " + word
                      + "\n" + jsonPrint(err)
                    ));
                    callback(err, null);
                  }
                  else if (wordObj) {
                    debug(chalkInfo("WORD   "
                      + " | " + wordObj.nodeId
                      + " | Ms: " + wordObj.mentions
                      // + "\n" + jsonPrint(wordObj)
                    ));
                    statsObj.metrics.word[wordObj.nodeId] = wordObj.mentions;
                    callback(null, {"descriptor": descriptor, "word": word, "mentions": wordObj.mentions});
                  }
                  else  {
                    debug(chalkAlert("WORD   "
                      + " | " + word
                      + " | Ms: --"
                    ));
                    statsObj.metrics.word[word] = 0;
                    callback(null, {"descriptor": descriptor, "word": word, "mentions": 0});
                  }
                });
              },

              hashtag: function(callback) { 
                Hashtag.findOne({ nodeId: word }, function(err, htObj) {
                  if (err) {
                    console.log(chalkError("HASHTAG (DB) ERROR"
                      + " | " + word
                      + "\n" + jsonPrint(err)
                    ));
                    callback(err, null);
                  }
                  else if (htObj) {
                    debug(chalkInfo("HASHTAG"
                      + " | " + htObj.nodeId
                      + " | Ms: " + htObj.mentions
                      // + "\n" + jsonPrint(wordObj)
                    ));
                    statsObj.metrics.hashtag[htObj.nodeId] = htObj.mentions;
                    callback(null, {"descriptor": descriptor, "hashtag": word, "mentions": htObj.mentions});
                  }
                  else  {
                    debug(chalkAlert("HASHTAG"
                      + " | " + word
                      + " | Ms: --"
                    ));
                    statsObj.metrics.hashtag[word] = 0;
                    callback(null, {"descriptor": descriptor, "hashtag": word, "mentions": 0});
                  }
                });
              },

              user: function(callback) { 
                User.findOne({ screenName: word }, function(err, usObj) {
                  if (err) {
                    console.log(chalkError("USER (DB) ERROR"
                      + " | " + word
                      + "\n" + jsonPrint(err)
                    ));
                    callback(err, null);
                  }
                  else if (usObj) {
                    debug(chalkInfo("USER"
                      + " | " + usObj.screenName
                      + " | " + usObj.name
                      + " | Ms: " + usObj.mentions
                      // + "\n" + jsonPrint(wordObj)
                    ));
                    statsObj.metrics.hashtag[usObj.screenName.toLowerCase()] = usObj.mentions;
                    callback(null, {"descriptor": descriptor, "user": word, "mentions": usObj.mentions});
                  }
                  else  {
                    debug(chalkAlert("USER"
                      + " | " + word
                      + " | Ms: --"
                    ));
                    statsObj.metrics.user[word] = 0;
                    callback(null, {"descriptor": descriptor, "user": word, "mentions": 0});
                  }
                });
              }

            }, 
            function(err, dbResults) {

              var wordMentionPadSpaces = 9 - dbResults.word.mentions.toString().length;
              var htMentionPadSpaces = 9 - dbResults.hashtag.mentions.toString().length;
              var usMentionPadSpaces = 9 - dbResults.user.mentions.toString().length;

              var wordMentions = (new Array(wordMentionPadSpaces).join("\xa0")) + dbResults.word.mentions.toString();
              var htMentions = (new Array(htMentionPadSpaces).join("\xa0")) + dbResults.hashtag.mentions.toString();
              var userMentions = (new Array(usMentionPadSpaces).join("\xa0")) + dbResults.user.mentions.toString();

              var chalkVal = chalkInfo;

              if ((dbResults.word.mentions === 0) 
                && (dbResults.hashtag.mentions === 0)
                && (dbResults.user.mentions === 0)){
                chalkVal = chalkRedBold;
              }
              else if ((dbResults.word.mentions === 0) 
                || (dbResults.hashtag.mentions === 0)
                || (dbResults.user.mentions === 0)){
                chalkVal = chalk.blue.bold;
              }
              else if ((dbResults.word.mentions < 100) 
                && (dbResults.hashtag.mentions < 100)
                && (dbResults.user.mentions < 100)){
                chalkVal = chalk.green.bold;
              }


              console.log(chalkVal(wordMentions
               + " | " + htMentions
               + " | " + userMentions
               + " | " + dbResults.word.word
              ));

              if (configuration.listDescriptorsFlag) {
                if (arrayContains(configuration.deleteArray, dbResults.word.word)) {
                  console.log(chalkAlert("DELETE ARRAY: " + dbResults.word.word));
                  deleteMetric(dbResults.word.descriptor, function(err){
                    statsObj.metrics.deleted[dbResults.word.word] = {
                      word: dbResults.word.mentions, 
                      hashtag: dbResults.hashtag.mentions,
                      user: dbResults.user.mentions
                    };
                    cb(err);
                  });
                }
                else {
                  cb();
                }
              }
              else {
                prompt.get(['DELETE'], function (err, result) {
                  // console.log('Command-line input received:');
                  // console.log('  DELETE: ' + result.DELETE);

                  switch (result.DELETE) {
                    case "d":
                      console.log(chalkAlert("DELETE\n" + jsonPrint(dbResults.word.descriptor)));
                      deleteMetric(dbResults.word.descriptor, function(err){
                        statsObj.metrics.deleted[dbResults.word.word] = {
                          word: dbResults.word.mentions, 
                          hashtag: dbResults.hashtag.mentions,
                          user: dbResults.user.mentions
                        };

                        cb(err);
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
            }
          );

        }
        else {
          cb();
        }
      }, function(err) {
        if (err) {
          console.log(chalkAlert("QUIT | " + err));
        }
        console.log("END");
        quit();
        // console.log(chalkInfo("DELETED METRICS THIS SESSION\n" + jsonPrint(statsObj.metrics.deleted)));

        // saveFile(configFolder, deletedMetricsFile, deletedMetricsHashmap, function(status){
        //   console.log(chalkInfo("SAVED DELETED METRICS HASHMAP | " + Object.keys(deletedMetricsHashmap).length));
        //   quit();
        // });
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
