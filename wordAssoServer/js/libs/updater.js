/*jslint node: true */
"use strict";

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;

const compactDateTimeFormat = "YYYYMMDD HHmmss";

let updateStatsCountsInterval;

let initGroupsReady = false;
let statsCountsComplete = true;

const DEFAULT_KEYWORD_VALUE = 100; // on scale of 1-100

const debug = require("debug")("wa");
const debugKeyword = require("debug")("kw");
const moment = require("moment");
const os = require("os");
const equal = require("deep-equal");

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

let prevKeywordModifiedMoment = moment("2010-01-01");

let statsObj = {};
statsObj.db = {};
statsObj.db.totalSessions = 0;
statsObj.db.totalAdmins = 0;
statsObj.db.totalUsers = 0;
statsObj.db.totalViewers = 0;
statsObj.db.totalHashtags = 0;
statsObj.db.totalMedia = 0;
statsObj.db.totalPlaces = 0;
statsObj.db.totalUrls = 0;

let jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
};

function quit(message) {

  let msg = "";

  if (message) {
    msg = message;
  }

  console.error(process.argv[1]
    + " | UPDATER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  process.exit();
}

process.on("SIGHUP", function() {
  quit("SIGHUP");
});

process.on("SIGINT", function() {
  quit("SIGINT");
});


const async = require("async");
const HashMap = require("hashmap").HashMap;

const localKeywordHashMap = new HashMap();
const newKeywordsHashMap = new HashMap();

const mongoose = require("../../config/mongoose");

const db = mongoose();

const Admin = require("mongoose").model("Admin");
const Viewer = require("mongoose").model("Viewer");
const User = require("mongoose").model("User");
const Word = require("mongoose").model("Word");

const wordServer = require("../../app/controllers/word.server.controller");


console.log(
  "\n\n====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n" 
  + process.argv[1] 
  + "\nPROCESS ID  " + process.pid 
  + "\nSTARTED     " + moment().format(compactDateTimeFormat) 
  + "\n" + "====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n\n"
);

const chalk = require("chalk");
const chalkRed = chalk.red;
const chalkInfo = chalk.gray;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkLog = chalk.black;


if (debug.enabled) {
  console.log("UPDATER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

// ==================================================================
// DROPBOX
// ==================================================================
const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
const DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
const DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;

const Dropbox = require("dropbox");

console.log("UPDATER: DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
debug("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
debug("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

const dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

let keywordUpdateInterval;
let keywordsUpdateReady = true;

function getTimeStamp(inputTime) {

  let currentTimeStamp;

  if (inputTime === undefined) {
    currentTimeStamp = moment();
  } 
  else if (moment.isMoment(inputTime)) {
    currentTimeStamp = moment(inputTime);
  } 
  else {
    currentTimeStamp = moment(parseInt(inputTime));
  }
  return currentTimeStamp.format(compactDateTimeFormat);
}

function getFileMetadata(path, file, callback) {

  const fullPath = path + "/" + file;
  debug(chalkInfo("FOLDER " + path));
  debug(chalkInfo("FILE " + file));
  debug(chalkInfo("FULL PATH " + fullPath));

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

  const fullPath = path + "/" + file;

  debug(chalkInfo("LOAD FOLDER " + path));
  debug(chalkInfo("LOAD FILE " + file));
  debug(chalkInfo("FULL PATH " + fullPath));

  dropboxClient.filesDownload({path: fullPath})
    .then(function(data) {
      console.log(chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX: " + fullPath
      ));

      const payload = data.fileBinary;

      debug(payload);

      try {
        const fileObj = JSON.parse(payload);
        debug("fileObj\n" + jsonPrint(fileObj));
        callback(null, fileObj);
      } 
      catch (err) {
        console.error(chalkError("ERROR: LOAD FILE: DROPBOX JSON PARSE ERROR: FILE: " + fullPath + " | ERROR: " + err));
        console.error(chalkError("ERROR\n" + jsonPrint(err)));
        callback(err, fullPath);
      }

     })
    .catch(function(err) {
      console.error(chalkAlert("DROPBOX loadFile ERROR: " + file + "\n" + err));
      console.error(chalkError("!!! DROPBOX READ " + file + " ERROR: " + err.error));
      console.error(chalkError(jsonPrint(err)));

      if (err.status === 404) {
        console.error(chalkError("!!! DROPBOX READ FILE " + file + " NOT FOUND ... SKIPPING ..."));
        return(callback(null, null));
      }
      if (err.status === 0) {
        console.error(chalkError("!!! DROPBOX NO RESPONSE ... NO INTERNET CONNECTION? ... SKIPPING ..."));
        return(callback(null, null));
      }
      return(callback(err, null));
  });
}

function sendKeywords(callback){

  debug(chalkInfo("sendKeywords START"));

  const words = newKeywordsHashMap.keys();
  let keywordsSent = 0;

  async.eachSeries(

    words,

    function(word, cb) {

      debugKeyword(chalkInfo("sendKeywords\nword: " + jsonPrint(word)));

      let kwObj = newKeywordsHashMap.get(word);
      kwObj.keywordId = word;

      let updaterObj = {};
      updaterObj.type = "keyword";
      updaterObj.pid = process.pid;
      updaterObj.keyword = {};
      updaterObj.keyword = kwObj;

      process.send(updaterObj, function(err){
        if (err){
          console.error(chalkError("sendKeywords ERROR\n" + err));
          cb(err);
        }
        else {
          keywordsSent += 1;
          debugKeyword(chalkInfo("UPDATER SEND KEYWORD"
            + " | " + word
            + " | " + jsonPrint(updaterObj)
          ));
          if (keywordsSent%500 === 0) { console.log(chalkInfo("SENT " + keywordsSent + "/" + words.length + " KEYWORDS")); }
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

        if (words.length > 0) {

          debug(chalkInfo("SEND KEYWORDS COMPLETE | " + words.length + " KEYWORDS"));

          process.send({ type: "sendKeywordsComplete", pid: process.pid , keywords: words.length}, function(err){
            if (err) {
              console.error(chalkError("*** UPDATER SEND KEYWORDS ERROR"
                + " | " + err
              ));
              callback(err, null);
            }
            else {
              console.log(chalkInfo(getTimeStamp()
                + " | SEND KEYWORDS COMPLETE"
                + " | " + words.length + " KEYWORDS"
              ));
              callback(null, words.length);
            }
          });
        }
        else {
          callback(null, words.length);
        }

      }
    }
  );
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

    const keywordFileClientModifiedMoment = moment(new Date(response.client_modified));

    if (keywordFileClientModifiedMoment.isSameOrBefore(prevKeywordModifiedMoment)){
      debug(chalk.blue("KEYWORD FILE BEFORE OR EQUAL"
        + " | PREV: " + prevKeywordModifiedMoment.format(compactDateTimeFormat)
        + " | " + keywordFileClientModifiedMoment.format(compactDateTimeFormat)
      ));
      callback(null, 0);
    }
    else {
      console.log(chalk.blue("=K= KEYWORD FILE AFTER"
        + " | PREV: " + prevKeywordModifiedMoment.format(compactDateTimeFormat)
        + " | " + keywordFileClientModifiedMoment.format(compactDateTimeFormat)
      ));

      console.log(chalkInfo("=K= UPDATING KEYWORDS | " + folder + "/" + file));

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

          const words = Object.keys(kwordsObj);

          // stack overflow issues ????
          // async.eachSeries(words,  
          async.each(words,

            function(w, cb) {

              let wd = w.toLowerCase();
              wd = wd.replace(/\./g, "");  // KLUDGE:  better way to handle "." in keywords?

              let kwObj = kwordsObj[w];  // kwObj = { "negative": 10, "right": 7 }

              let wordObj = new Word();

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

                const prevKeywordObj = localKeywordHashMap.get(wd);

                if (equal(prevKeywordObj, wordObj.keywords)){
                  debug(chalkAlert("--- WORD UNCHANGED ... SKIPPING | " + wd));
                  cb();
                }
                else {
                  console.log(chalkAlert("+++ WORD CHANGED"
                    + " | " + wd
                    + "\nPREV\n" + jsonPrint(prevKeywordObj)
                    + "\nNEW\n" + jsonPrint(wordObj.keywords)
                  ));

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
                }
              }
              else {
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
              }

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
          );
        }
      });
    }
  });
}

function initKeywordUpdateInterval(options){

  clearInterval(keywordUpdateInterval);
  keywordsUpdateReady = true;

  console.log(chalkLog("UPDATER: *** START UPDATE KEYWORDS INTERVAL | " + options.interval + " MS"
    + "\n" + jsonPrint(options)
  ));

  keywordUpdateInterval = setInterval(function() {

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

  console.log(chalkLog("INIT UPDATE STATS COUNTS " + interval + " MS"));
  clearInterval(updateStatsCountsInterval);

  updateStatsCountsInterval = setInterval(function(){
    if (statsCountsComplete){
      statsCountsComplete = false;
      updateStatsCounts(function(err, results){
        if (err) { console.error(chalkError("STATS COUNTS ERROR\n" + jsonPrint(err))); }
        debug(chalkRed("STATS COUNTS\n" + jsonPrint(results)));
        process.send({ type: "stats", pid: process.pid, db: results}, function(err){
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

process.on("message", function(m) {

  debug(chalkInfo("RX MESSAGE\n" + jsonPrint(m)));

  let options;

  switch (m.op) {

    case "INIT":

      clearInterval(keywordUpdateInterval);
      clearInterval(updateStatsCountsInterval);

      statsCountsComplete = true;

      prevKeywordModifiedMoment = moment("2010-01-01");

      console.log(chalkInfo("UPDATE INIT"
        + " | FOLDER: " + m.folder
        + " | KEYWORD FILE: " + m.keywordFile
        + " | INTERVAL: " + m.interval
      ));

      options = {
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

        process.send({ type: "stats", pid: process.pid, db: results}, function(err){
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

      updateKeywords("", m.keywordsFile, function(err, count){
        if (err) {
          console.error("UPDATER UPDATE KEYWORDS ERROR: " + err);
        }
        else {
          debug("update keywords: " + count);
          sendKeywords(function(){
            debug("sent updated keywords: " + count);
          });
        }
      });

    break;

    case "PING":
      debug(chalkInfo("<UPDATER PING"
        + " | " + m.timeStamp
        + " | MESSAGE: " + m.message
        + " | READY: " + initGroupsReady
      ));

      process.send({type: "pong", pid: process.pid, timeStamp: m.timeStamp}, function(err){
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