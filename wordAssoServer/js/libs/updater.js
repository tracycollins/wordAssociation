/*jslint node: true */
"use strict";

const DEFAULT_KEYWORD_VALUE = 100; // on scale of 1-100

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;

let defaultKeywordsFile = "keywords.json";

const compactDateTimeFormat = "YYYYMMDD HHmmss";

let initGroupsReady = false;

require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const debug = require("debug")("ud");
const debugKeyword = require("debug")("kw");
const moment = require("moment");
const os = require("os");
const equal = require("deep-equal");
const async = require("async");
const chalk = require("chalk");
const chalkRed = chalk.red;
const chalkInfo = chalk.gray;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkLog = chalk.black;

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
const dbConnection = wordAssoDb();

let Word;

dbConnection.on("error", console.error.bind(console, "connection error:"));
dbConnection.once("open", function() {
  console.log("CONNECT: wordAssoServer UPDATER Mongo DB default connection open");
  Word = mongoose.model("Word", wordModel.WordSchema);
});

const wordServer = require("@threeceelabs/word-server-controller");

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

let localKeywordHashMap = {};
let newKeywordsHashMap = {};


let statsObj = {};
statsObj.db = {};
statsObj.db.totalHashtags = 0;
statsObj.db.totalMedia = 0;
statsObj.db.totalPlaces = 0;
statsObj.db.totalUrls = 0;

const jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
};

const quit = function(message) {
  let msg = "";

  if (message) {
    msg = message;
  }

  console.log(process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | UPDATER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  process.exit();
};

// ==================================================================
// DROPBOX
// ==================================================================
const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
const DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
const DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;

debug("UPDATER: DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
debug("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
debug("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

const dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

let keywordUpdateInterval;
let keywordsUpdateReady = true;

const getTimeStamp = function(inputTime) {

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
};

const sendKeywords = function(callback){

  debug(chalkInfo("sendKeywords START"));

  const words = Object.keys(newKeywordsHashMap);

  let keywordsSent = 0;

  async.eachSeries(

    words,

    function(word, cb) {

      debugKeyword(chalkInfo("sendKeywords\nword: " + jsonPrint(word)));

      let kwObj = newKeywordsHashMap[word];
      kwObj.keywordId = word;

      let updaterObj = {};
      updaterObj.type = "keyword";
      updaterObj.pid = process.pid;
      updaterObj.keyword = {};
      updaterObj.keyword = kwObj;

      process.send(updaterObj, function(err){
        if (err){
          console.log(chalkError("sendKeywords ERROR\n" + err));
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

        console.log(chalkError("sendKeywords ERROR! " + err));
        callback(err, null);

      }
      else {

        if (words.length > 0) {

          debug(chalkInfo("SEND KEYWORDS COMPLETE | " + words.length + " KEYWORDS"));

          process.send({ type: "sendKeywordsComplete", pid: process.pid , keywords: words.length}, function(err){
            if (err) {
              console.log(chalkError("*** UPDATER SEND KEYWORDS ERROR"
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
};

let prevKeywordModifiedMoment = moment("2010-01-01");

function saveFile (path, file, jsonObj, callback){

  const fullPath = path + "/" + file;

  debug(chalkInfo("LOAD FOLDER " + path));
  debug(chalkInfo("LOAD FILE " + file));
  debug(chalkInfo("FULL PATH " + fullPath));

  let options = {};

  options.contents = JSON.stringify(jsonObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(response){
      debug(chalkLog("SAVED DROPBOX JSON | " + options.path));
      callback(null, response);
    })
    .catch(function(error){
      if (error.status === 429) {
        console.log(chalkAlert("TOO MANY DROPBOX WRITES"));
      }
      else {
        console.log(chalkError(moment().format(compactDateTimeFormat) 
          + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
          + "\nERROR: " + error
          + "\nERROR: " + jsonPrint(error)
          // + "\nERROR\n" + jsonPrint(error)
        ));
      }
      callback(error, null);
    });
}

const keywordUpdate = function(w, kwObj, callback) {

  // debug("keywordUpdate | w: " + w + " | " + jsonPrint(kwObj));
  debug("keywordUpdate | " + w);

  let wd = w.toLowerCase();
  wd = wd.replace(/\./g, "");  // KLUDGE:  better way to handle "." in keywords?

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

  if (localKeywordHashMap[wd] !== undefined) {

    debug(chalkAlert("* KW HM HIT | " + wd));

    const prevKeywordObj = localKeywordHashMap[wd];

    if (equal(prevKeywordObj, wordObj.keywords)){
      debug(chalkAlert("--- WORD UNCHANGED ... SKIPPING | " + wd));
      callback(null, wordObj);
    }
    else {
      console.log(chalkAlert("+++ WORD CHANGED"
        + " | " + wd
        + "\nPREV\n" + jsonPrint(prevKeywordObj)
        + "\nNEW\n" + jsonPrint(wordObj.keywords)
      ));

      debug(chalkInfo("UPDATER: UPDATING KEYWORD | " + wd + ": " + jsonPrint(wordObj)));

      newKeywordsHashMap[wordObj.nodeId] = wordObj.keywords;
      localKeywordHashMap[wordObj.nodeId] = wordObj.keywords;

      wordServer.findOneWord(wordObj, {noInc: true}, function(err, updatedWordObj) {
        if (err){
          console.log(chalkError("ERROR: UPDATING KEYWORD | " + wd + ": " + kwObj));
          callback(err, wordObj);
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
          callback(null, updatedWordObj);
        }
      });
    }
  }
  else {
    debug(chalkInfo("UPDATER: UPDATING KEYWORD"
      + " | " + wd
      + ": " + jsonPrint(wordObj)
    ));

    newKeywordsHashMap[wordObj.nodeId] = wordObj.keywords;
    localKeywordHashMap[wordObj.nodeId] = wordObj.keywords;

    wordServer.findOneWord(wordObj, {noInc: true}, function(err, updatedWordObj) {
      if (err){
        console.log(chalkError("ERROR: UPDATING KEYWORD | " + wd + ": " + kwObj));
        callback(err, wordObj);
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
        callback(null, updatedWordObj);
      }
    });
  }
};

// ???? TO DO: break up into filesGetMetadata check and filesDownload if need to update
// causes error now: RangeError: Maximum call stack size exceeded

function getFileMetadata (path, callback){
  debug(chalkLog("GET FILE METADATA " + path));
  dropboxClient.filesGetMetadata({path: path})
    .then(function(response){
      callback(null, response);
    })
    .catch(function(err) {
      console.log(chalkError(new Error("GET FILE METADATA ERROR\n" + jsonPrint(err))));
      callback(err, path);
    });
}

const updateKeywords = function(folder, file, callback){

  newKeywordsHashMap = {};

  const fullPath = folder + "/" + file;

  debug(chalkLog("UPDATE KEYWORDS " + fullPath));

  getFileMetadata(fullPath, function(err, metaData){

    const keywordFileClientModifiedMoment = moment(new Date(metaData.client_modified));

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

      dropboxClient.filesDownload({path: fullPath})
        .then(function(data){
          console.log(chalkLog(getTimeStamp()
            + " | LOADING FILE FROM DROPBOX: " + fullPath
          ));
          return data.fileBinary;
        })
        .then(function(data){
          try {
            return JSON.parse(data);
          }
          catch(err){
            console.log(chalkError("JSON PARSE ERROR: " , err));
          }
        })
        .then(function(kwordsObj){

          const words = Object.keys(kwordsObj);

          console.log(chalkInfo("UPDATER | LOADED"
            + " | " + words.length + " WORDS"
            + " | " + fullPath
          ));

          async.eachSeries(words,

            function(w, cb) {

              let kwObj = kwordsObj[w];  // kwObj = { "negative": 10, "right": 7 }

              keywordUpdate(w, kwObj, function(err, updatedWord){
                if (err) {
                  console.log(chalkError("keywordUpdate ERROR! " + err));
                }
                cb(err);
              });

            },

            function(err) {
              if (err) {
                console.log(chalkError("initKeywords ERROR! " + err));
                callback(err, null);
              }
              else {
                console.log(chalkInfo("=== KEYWORD UPDATE COMPLETE"
                  + " | " + getTimeStamp()
                  + " | TOTAL KEYWORDS: " + Object.keys(newKeywordsHashMap).length
                ));

                callback(null, Object.keys(newKeywordsHashMap).length);
              }
            }
          );
        })
        .catch(function(err) {
          console.log(chalkError(new Error("DROPBOX FILE DOWNLOAD ERROR\n" + jsonPrint(err))));
          console.log(chalkError(new Error("DROPBOX FILE DOWNLOAD ERROR ", err)));
          callback(err, null);
        });
    }

  });

};

const initKeywordUpdateInterval = function(options){

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
          console.log(chalkError("UPDATER UPDATE KEYWORDS ERROR: " + err));
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
};

process.on("message", function(m) {

  debug(chalkInfo("RX MESSAGE\n" + jsonPrint(m)));

  let options;

  switch (m.op) {

    case "INIT":

      clearInterval(keywordUpdateInterval);
 
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
    break;

    case "UPDATE":

      console.log(chalkInfo("UPDATER UPDATE"
        + " | UPDATE TYPE: " + m.updateType
        + " | KEYWORD FILE: " + m.keywordFile
      ));

      updateKeywords("", m.keywordsFile, function(err, count){
        if (err) {
          console.log(chalkError("UPDATER UPDATE KEYWORDS ERROR: " + err));
        }
        else {
          debug("update keywords: " + count);
          sendKeywords(function(){
            debug("sent updated keywords: " + count);
          });
        }
      });
    break;

    case "UPDATE_KEYWORD":
      console.log(chalkInfo("UPDATER UPDATE_KEYWORD"
        + " | WORD: " + m.word
        + " | KWs\n" + jsonPrint(m.keywords)
      ));
      keywordUpdate(m.word, m.keywords, function(err, wordObj){

        saveFile("", defaultKeywordsFile, localKeywordHashMap, function(err, results){});
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
          console.log(chalkError("*** UPDATER SEND ERROR"
            + " | " + err
          ));
        }
      });
    break;

    default:
    console.log(chalkError("??? UPDATER RX UNKNOWN MESSAGE\n" + jsonPrint(m)));

  }
});

process.on("SIGHUP", function() {
  quit("SIGHUP");
});

process.on("SIGINT", function() {
  quit("SIGINT");
});

console.log(
  "====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n" 
  + process.argv[1] 
  + "\nPROCESS ID  " + process.pid 
  + "\nSTARTED     " + moment().format(compactDateTimeFormat) 
  + "\n" + "====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "===================================================================================================="
);

if (debug.enabled) {
  console.log("UPDATER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

