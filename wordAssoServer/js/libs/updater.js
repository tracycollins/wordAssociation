/*jslint node: true */
"use strict";

var ONE_SECOND = 1000;
var ONE_MINUTE = ONE_SECOND * 60;
var ONE_HOUR = ONE_MINUTE * 60;
var ONE_DAY = ONE_HOUR * 24;

var compactDateTimeFormat = "YYYYMMDD HHmmss";

var initGroupsInterval;
var updateStatsCountsInterval;

var initGroupsReady = false;
var statsCountsComplete = true;

var DEFAULT_KEYWORD_VALUE = 100 // on scale of 1-100
var deleteKeywordsEnabled = false;

var sendingHashMapsFlag = false;

var OFFLINE_MODE = false;
var debug = require('debug')('wa');
var debugKeyword = require('debug')('kw');
var moment = require('moment');
var os = require('os');
var equal = require('deep-equal');

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, '');
hostname = hostname.replace(/.home/g, '');
hostname = hostname.replace(/.fios-router.home/g, '');
hostname = hostname.replace(/word0-instance-1/g, 'google');

var prevKeywordModifiedMoment = moment("2010-01-01");

var statsObj = {};
statsObj.db = {};
statsObj.db.totalSessions = 0;
statsObj.db.totalAdmins = 0;
statsObj.db.totalUsers = 0;
statsObj.db.totalViewers = 0;
statsObj.db.totalHashtags = 0;
statsObj.db.totalMedia = 0;
statsObj.db.totalPlaces = 0;
statsObj.db.totalUrls = 0;

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
  console.error(process.argv[1]
    + " | UPDATER: **** QUITTING"
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


var async = require('async');
var HashMap = require('hashmap').HashMap;

var localKeywordHashMap = new HashMap();
var newKeywordsHashMap = new HashMap();

var mongoose = require('../../config/mongoose');

var db = mongoose();

var Admin = require("mongoose").model("Admin");
var Viewer = require("mongoose").model("Viewer");
var User = require("mongoose").model("User");
var Tweet = require("mongoose").model("Tweet");
var Hashtag = require("mongoose").model("Hashtag");
var Media = require("mongoose").model("Media");
var Url = require("mongoose").model("Url");
var Place = require('mongoose').model('Place');
var Word = require('mongoose').model('Word');

var wordServer = require('../../app/controllers/word.server.controller');


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

var chalk = require('chalk');
var chalkRed = chalk.red;
var chalkGreen = chalk.green;
var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.red;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.black;


if (debug.enabled) {
  console.log("UPDATER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

// ==================================================================
// DROPBOX
// ==================================================================
var DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
var DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
var DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;

var Dropbox = require("dropbox");

console.log("UPDATER: DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
debug("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
debug("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

var groupsConfigFile;
var entityChannelGroupsConfigFile;
var keywordsFile;


var keywordUpdateInterval;

process.on('message', function(m) {

  debug(chalkInfo("RX MESSAGE\n" + jsonPrint(m)));

  switch (m.op) {

    case "INIT":

      clearInterval(keywordUpdateInterval);
      clearInterval(updateStatsCountsInterval);

      statsCountsComplete = true;
      sendingHashMapsFlag = false;

      prevKeywordModifiedMoment = moment("2010-01-01");

      console.log(chalkInfo("UPDATE INIT"
        + " | FOLDER: " + m.folder
        + " | KEYWORD FILE: " + m.keywordFile
        + " | INTERVAL: " + m.interval
      ));

      keywordsFile = m.keywordFile;

      var options = {
        folder: m.folder,
        keywordsFile: m.keywordFile,
        interval: m.interval
      };

      initKeywordUpdateInterval(options);

      updateStatsCounts(function(err, results){
        if (err) { 
          console.error(chalkError("STATS COUNTS ERROR\n" + jsonPrint(err)));
          return;
        }

        debug(chalkRed("STATS COUNTS\n" + jsonPrint(results)));

        process.send({ type: 'stats', db: results}, function(err){
          statsCountsComplete = true;
          if (err){
            console.error(chalkError("STATS SEND ERROR\n" + err));
          }
          else {
            debug(chalkInfo("UPDATER SENT STATS"
            ));
          }
        });
      });
      initUpdateStatsCountsInterval(5*ONE_MINUTE);
    break;

    case "UPDATE":

      console.log(chalkInfo("UPDATER UPDATE"
        + " | UPDATE TYPE: " + m.updateType
        + " | KEYWORD FILE: " + m.keywordFile
        // + " | " + jsonPrint(m)
      ));

      updateKeywords("", m.keywordsFile, function(){
        if (err) {
          console.error("UPDATER UPDATE KEYWORDS ERROR: " + err);
        }
        else {
          debug("update keywords: " + count);
          sendKeywords(function(){});
        }
      });

    break;

    case "PING":
      debug(chalkInfo("<UPDATER PING"
        + " | " + m.timeStamp
        + " | MESSAGE: " + m.message
        + " | READY: " + initGroupsReady
      ));

      process.send({type: "pong", timeStamp: m.timeStamp}, function(err){
        if (err) {
          console.error(chalkError("*** UPDATER SEND ERROR"
            + " | " + err
          ));
        }
      });
    break;

    default:
    console.error(chalkError("??? UPDATER RX UNKNOWN MESSAGE\n" + jsonPrint(m)));

  }
});

function getFileMetadata(path, file, callback) {

  var fullPath = path + "/" + file;
  debug(chalkInfo("FOLDER " + path));
  debug(chalkInfo("FILE " + file));
  debug(chalkInfo("FULL PATH " + fullPath));

  var fileExists = false;

  dropboxClient.filesGetMetadata({path: fullPath})
    .then(function(response) {
      debug(chalkInfo("FILE META\n" + jsonPrint(response)));
      return(callback(null, response));
    })
    .catch(function(err) {
      console.error(chalkError("GET FILE METADATA" 
        + " | PATH: " + fullPath
        + "\n" + jsonPrint(err)
      ));
      console.error(chalkError("GET FILE METADATA ERROR\n" + jsonPrint(err)));
      return(callback(err, null));
    });
}

function loadFile(path, file, callback) {

  var fullPath = path + "/" + file;

  debug(chalkInfo("LOAD FOLDER " + path));
  debug(chalkInfo("LOAD FILE " + file));
  debug(chalkInfo("FULL PATH " + fullPath));

  var fileExists = false;

  dropboxClient.filesDownload({path: fullPath})
    .then(function(data) {
      console.log(chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX: " + fullPath
      ));

      var payload = data.fileBinary;

      debug(payload);

      try {
        var fileObj = JSON.parse(payload);
        return(callback(null, fileObj));
      } 
      catch (err) {
        console.error(chalkError("ERROR: LOAD FILE: DROPBOX JSON PARSE ERROR: FILE: " + fullPath + " | ERROR: " + err));
        console.error(chalkError("PAYLOAD\n" + jsonPrint(payload)));
        return(callback(err, fullPath));
      }

     })
    .catch(function(err) {
      console.error(chalkAlert("DROPBOX loadFile ERROR: " + file + "\n" + err));
      console.error(chalkError("!!! DROPBOX READ " + file + " ERROR: " + err.error));
      console.error(chalkError(jsonPrint(err)));

      if (err["status"] === 404) {
        console.error(chalkError("!!! DROPBOX READ FILE " + file + " NOT FOUND ... SKIPPING ..."));
        return(callback(null, null));
      }
      if (err["status"] === 0) {
        console.error(chalkError("!!! DROPBOX NO RESPONSE ... NO INTERNET CONNECTION? ... SKIPPING ..."));
        return(callback(null, null));
      }
      return(callback(err, null));
  });
}

function updateKeywords(folder, file, callback){

  newKeywordsHashMap.clear();

  debug(chalkLog("UPDATE KEYWORDS " + file));

  getFileMetadata(folder, file, function(err, response){

    if (err) {
      console.error(moment().format(compactDateTimeFormat)
        + " | " + "updateKeywords getFileMetadata ERROR"
        + "\n" + jsonPrint(err)
      );
      return(callback(err, null));
    }

    var keywordFileClientModifiedMoment = moment(new Date(response.client_modified));

    if (keywordFileClientModifiedMoment.isSameOrBefore(prevKeywordModifiedMoment)){
      console.log(chalk.blue("KEYWORD FILE BEFORE OR EQUAL"
        + " | PREV: " + prevKeywordModifiedMoment.format(compactDateTimeFormat)
        + " | " + keywordFileClientModifiedMoment.format(compactDateTimeFormat)
      ));
      callback(null, 0);
    }
    else {
      console.log(chalk.blue("=== KEYWORD FILE AFTER"
        + " | PREV: " + prevKeywordModifiedMoment.format(compactDateTimeFormat)
        + " | " + keywordFileClientModifiedMoment.format(compactDateTimeFormat)
      ));

      console.log(chalkInfo("=== UPDATING KEYWORDS | " + folder + "/" + file));

      prevKeywordModifiedMoment = moment(keywordFileClientModifiedMoment);

      loadFile(folder, file, function(err, kwordsObj){

        if (err) {
          console.error(chalkError("LOAD FILE ERROR"
            + " | " + file
            + " | " + err
          ));
          callback(null, null);
        }
        else {

          console.log(chalkInfo("UPDATER | LOADED"
            + " | " + folder + "/" + file
          ));

          var words = Object.keys(kwordsObj);

          async.eachSeries(words,

            function(w, cb) {

              var wd = w.toLowerCase();
              wd = wd.replace(/\./g, "");  // KLUDGE:  better way to handle '.' in keywords?

              var kwObj = kwordsObj[w];  // kwObj = { "negative": 10, "right": 7 }

              var wordObj = new Word();

              wordObj.nodeId = wd;
              wordObj.isKeyword = true;

              // KLUDEGE: OVERWRITES ANY PREVIOUS KEYWORD SETTINGS FOR NOW
              wordObj.keywords = {};

              if (typeof kwObj === "string") {  // old style keyword: true/false; convert to new style
                wordObj.keywords[kwObj.toLowerCase()] = DEFAULT_KEYWORD_VALUE;
                wordObj.keywords.keywordId = wd;
              }
              else {
                wordObj.keywords = kwObj;
                wordObj.keywords.keywordId = wd;
              }

              if (localKeywordHashMap.has(wd)) {

                debug(chalkAlert("* KW HM HIT | " + wd));

                var prevKeywordObj = localKeywordHashMap.get(wd);

                if (equal(prevKeywordObj, wordObj.keywords)){
                  debug(chalkAlert("--- WORD UNCHANGED ... SKIPPING | " + wd));
                  // cb();
                  return(cb());
                }
                else {
                  console.log(chalkAlert("+++ WORD CHANGED"
                    + " | " + wd
                    + "\nPREV\n" + jsonPrint(prevKeywordObj)
                    + "\nNEW\n" + jsonPrint(wordObj.keywords)
                  ));
                }
              }

              debug(chalkInfo("UPDATER: UPDATING KEYWORD | " + wd + ": " + jsonPrint(wordObj)));

              newKeywordsHashMap.set(wordObj.nodeId, wordObj.keywords);
              localKeywordHashMap.set(wordObj.nodeId, wordObj.keywords);

              wordServer.findOneWord(wordObj, false, function(err, updatedWordObj) {
                if (err){
                  console.error(chalkError("ERROR: UPDATING KEYWORD | " + wd + ": " + kwordsObj[wd]));
                  cb(err);
                }
                else {
                  debug(chalkLog("+++ UPDATED KEYWORD"
                    + " | " + updatedWordObj.nodeId 
                    + " | " + updatedWordObj.raw 
                    + " | M " + updatedWordObj.mentions 
                    + " | I " + updatedWordObj.isIgnored 
                    + " | K " + updatedWordObj.isKeyword 
                    + " | K " + jsonPrint(updatedWordObj.keywords) 
                  ));
                  cb();
                }
              });

            },

            function(err) {
              if (err) {
                console.error(chalkError("initKeywords ERROR! " + err));
                callback(err, null);
              }
              else {
                console.log(chalkInfo("=== KEYWORD UPDATE COMPLETE"
                  + " | TOTAL KEYWORDS:   " + newKeywordsHashMap.count()
                ));

                callback(null, newKeywordsHashMap.count());
              }
            }
          )
        }
      });
    }
  });
}

function sendKeywords(callback){

  debug(chalkInfo("sendKeywords START"));

  var words = newKeywordsHashMap.keys();
  var keywordsSent = 0;

  async.forEachSeries(

    words,

    function(word, cb) {

      debugKeyword(chalkInfo("sendKeywords\nword: " + jsonPrint(word)));

      var kwObj = newKeywordsHashMap.get(word);
      kwObj.keywordId = word;

      var updaterObj = {};
      updaterObj.type = "keyword";
      updaterObj.keyword = {};
      updaterObj.keyword = kwObj;

      process.send(updaterObj, function(err){
        if (err){
          console.error(chalkError("sendKeywords ERROR\n" + err));
          cb(err);
        }
        else {
          keywordsSent++;
          debugKeyword(chalkInfo("UPDATER SEND KEYWORD"
            + " | " + word
            + " | " + jsonPrint(updaterObj)
          ));
          if (keywordsSent%500 === 0) { console.log("SENT " + keywordsSent + "/" + words.length + " KEYWORDS"); }
          cb();
        }
      });

    },

    function(err) {
      if (err) {
        console.error(chalkError("sendKeywords ERROR! " + err));
        callback(err, null);
      }
      else {
        debug(chalkInfo("SEND KEYWORDS COMPLETE | " + words.length + " KEYWORDS"));
        process.send({ type: 'sendKeywordsComplete'}, function(err){
          if (err) {
            console.error(chalkError("*** UPDATER SEND KEYWORDS ERROR"
              + " | " + err
            ));
            callback(err, null);
          }
          else {
            callback(null, words.length);
            console.log(chalkInfo(getTimeStamp()
              + " | SEND KEYWORDS COMPLETE"
              + " | " + words.length + " KEYWORDS"
            ));
          }
        });
      }
    }
  );
}

var keywordsUpdateReady = true;
var keywordsInterval;
function initKeywordUpdateInterval(options){

  clearInterval(keywordsInterval);
  keywordsUpdateReady = true;

  console.log(chalkLog("UPDATER: *** START UPDATE KEYWORDS INTERVAL | " + options.interval + " MS"
    + "\n" + jsonPrint(options)
  ));

  keywordsInterval = setInterval(function() {

    debug(chalk.blue(moment().format(compactDateTimeFormat) + " | UPDATER KEYWORDS INTERVAL"));

    if (keywordsUpdateReady) {

      keywordsUpdateReady = false;

      updateKeywords("", options.keywordsFile, function(err, count){
        if (err) {
          console.error("UPDATER UPDATE KEYWORDS ERROR: " + err);
          keywordsUpdateReady = true;
        }
        else {
          debug("update keywords: " + count);
          sendKeywords(function(){
            keywordsUpdateReady = true;
          });
        }
      });
    }

  }, options.interval);
}

function getTimeStamp(inputTime) {

  var currentTimeStamp;
  var options = {
    weekday: "none",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit"
  };

  if (typeof inputTime === 'undefined') {
    currentTimeStamp = moment();
  } else if (moment.isMoment(inputTime)) {
    currentTimeStamp = moment(inputTime);
  } else {
    currentTimeStamp = moment(parseInt(inputTime));
  }
  return currentTimeStamp.format(compactDateTimeFormat);
}

function loadConfig(file, callback){

  console.log(chalkInfo("LOADING CONFIG " + file));

  var options = {};
  options.path = '/' + file;

  dropboxClient.filesDownload(options)
    .then(function(configJson) {
      console.log(chalkLog(getTimeStamp()
        + " | LOADING CONFIG FROM DROPBOX FILE: " + options.path
      ));

      try {
        var configObj = JSON.parse(configJson.fileBinary);
        debug(chalkLog(getTimeStamp() + " | FOUND " + configObj.timeStamp));
        return(callback(null, configObj));
      } 
      catch (err) {
        console.error(chalkError("ERROR: LOAD CONFIG: DROPBOX JSON PARSE ERROR: FILE: " + file + " | ERROR: " + err));
        return(callback(err, fileObj));
      }

    })
    .catch(function(error) {
      if (error.status == 409) {
        console.error(chalkError("!!! DROPBOX READ " + file + " ERROR: FILE NOT FOUND"));
        return(callback("FILE NOT FOUND: " + file, null));
      }
      else {
        console.error(chalkError("!!! DROPBOX READ " + file + " ERROR\n" + jsonPrint(error)));
        return(callback(error, null));
      }
    });
}

function updateStatsCounts(callback) {

  async.parallel({
    totalAdmins: function (cb) {
      Admin.count({}, function(err, count) {
        if (err) {
          console.error(chalkError("DB ADMIN COUNTER ERROR\n" + jsonPrint(err)));
          cb(err, null);
        }
        else {
          statsObj.db.totalAdmins = count;
          cb(null, count);
        }
      });
    },
    totalUsers: function (cb) {
      User.count({}, function(err, count) {
        if (err) {
          console.error(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
          cb(err, null);
        }
        else {
          statsObj.db.totalUsers = count;
          cb(null, count);
        }
      });
    },
    totalViewers: function (cb) {
      Viewer.count({}, function(err, count) {
        if (err) {
          console.error(chalkError("DB VIEWER COUNTER ERROR\n" + jsonPrint(err)));
          cb(err, null);
        }
        else {
          statsObj.db.totalViewers = count;
          cb(null, count);
        }
      });
    },
    totalWords: function (cb) {
      Word.count({}, function(err, count) {
        if (err) {
          console.error(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
          cb(err, null);
        }
        else {
          statsObj.db.totalWords = count;
          cb(null, count);
        }
      });
    }
  },
  function(err, results) { //async.parallel callback
    if (err) {
      console.error(chalkError("\n" + moment().format(compactDateTimeFormat) 
        + "!!! UPDATE STATS COUNTS ERROR: " + err));
      statsCountsComplete = true;
      if (callback !== undefined) { callback(err, null); }
    } 
    else {
      debug(chalkInfo(moment().format(compactDateTimeFormat) + " | UPDATE STATS COUNTS COMPLETE"
       + "\n" + jsonPrint(results)
      ));
      // configEvents.emit("UPDATE_STATS_COUNTS_COMPLETE", moment().format(compactDateTimeFormat));
      statsCountsComplete = true;
      if (callback !== undefined) { callback(null, results); }
    }
  });
}

function initUpdateStatsCountsInterval(interval){

  console.log(chalkRed("INIT UPDATE STATS COUNTS " + interval + " MS"));
  clearInterval(updateStatsCountsInterval);

  updateStatsCountsInterval = setInterval(function(){
    if (statsCountsComplete){
      statsCountsComplete = false;
      updateStatsCounts(function(err, results){
        if (err) { console.error(chalkError("STATS COUNTS ERROR\n" + jsonPrint(err))); }
        debug(chalkRed("STATS COUNTS\n" + jsonPrint(results)));
        process.send({ type: 'stats', db: results}, function(err){
          statsCountsComplete = true;
          if (err){
            console.error(chalkError("UPDATER STATS SEND ERROR\n" + err));
            console.error(chalkError("UPDATER STATS SEND ERROR\n" + err));
          }
          else {
            debug(chalkInfo("UPDATER SENT STATS"
            ));
          }
        });
      });
    }
  }, interval);
}

// setTimeout(function(){
//   console.log(chalkRed("TEST KILLING UPDATER"));
//   console.log(chalkRed("UNDEFINED VAR " + thisIsNotDefined));
// }, 10000);
