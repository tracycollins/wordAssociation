/*jslint node: true */
"use strict";

const DEFAULT_CATEGORY_VALUE = 100; // on scale of 1-100

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;

let dropboxConfigDefaultFolder = "/config/utility/default";
let defaultCategoryFile = "category.json";

const compactDateTimeFormat = "YYYYMMDD HHmmss";

let initGroupsReady = false;

require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
// const Dropbox = require("./dropbox").Dropbox;

const debug = require("debug")("ud");
const debugCategory = require("debug")("kw");
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

let localCategoryHashMap = {};
let newCategoryHashMap = {};


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

let categoryUpdateInterval;
let categoryUpdateReady = true;

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

const sendCategory = function(callback){

  debug(chalkInfo("sendCategory START"));

  const words = Object.keys(newCategoryHashMap);

  let categorySent = 0;

  async.eachSeries(words, function(word, cb) {

      debugCategory(chalkInfo("sendCategory\nword: " + jsonPrint(word)));

      let updaterObj = {};
      updaterObj.type = "category";
      updaterObj.pid = process.pid;
      updaterObj.nodeId = word;
      updaterObj.category = newCategoryHashMap[word];

      process.send(updaterObj, function(err){
        if (err){
          console.log(chalkError("sendCategory ERROR\n" + err));
          cb(err);
        }
        else {
          categorySent += 1;
          debugCategory(chalkInfo("UPDATER SEND CATEGORY"
            + " | " + word
            + " | " + jsonPrint(updaterObj)
          ));
          if (categorySent%500 === 0) { console.log(chalkInfo("SENT " + categorySent + "/" + words.length + " CATEGORY")); }
          cb();
        }
      });

    },

    function(err) {

      if (err) {

        console.log(chalkError("sendCategory ERROR! " + err));
        callback(err, null);

      }
      else {

        if (words.length > 0) {

          debug(chalkInfo("SEND CATEGORY COMPLETE | " + words.length + " CATEGORY"));

          process.send({ type: "sendCategoryComplete", pid: process.pid , category: words.length}, function(err){
            if (err) {
              console.log(chalkError("*** UPDATER SEND CATEGORY ERROR"
                + " | " + err
              ));
              callback(err, null);
            }
            else {
              console.log(chalkInfo(getTimeStamp()
                + " | SEND CATEGORY COMPLETE"
                + " | " + words.length + " CATEGORY"
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

let prevCategoryModifiedMoment = moment("2010-01-01");

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

const categoryUpdate = function(kwObj, callback) {

  debug("categoryUpdate\n" + jsonPrint(kwObj));

  // let wd = Object.keys(kwObj)[0];

  let wordObj = new Word();

  wordObj.nodeId = kwObj.nodeId;
  wordObj.isCategory = true;
  wordObj.category = kwObj.category;

  if (localCategoryHashMap[kwObj.nodeId] !== undefined) {

    debug(chalkAlert("* KW HM HIT | " + kwObj.nodeId));

    const prevCategoryObj = localCategoryHashMap[kwObj.nodeId];

    if (prevCategoryObj.category === kwObj.category){
      debug(chalkAlert("--- WORD UNCHANGED ... SKIPPING | " + kwObj.nodeId));
      callback(null, wordObj);
    }
    else {
      console.log(chalkAlert("+++ WORD CHANGED"
        + " | " + wordObj.nodeId
        + " | PREV: " + prevCategoryObj.category
        + " | NEW: " + wordObj.category
      ));

      debug(chalkInfo("UPDATER: UPDATING CATEGORY | " + wordObj.nodeId + ": " + wordObj.category));

      newCategoryHashMap[wordObj.nodeId] = wordObj.category;
      localCategoryHashMap[wordObj.nodeId] = wordObj.category;

      wordServer.findOneWord(wordObj, {noInc: true}, function(err, updatedWordObj) {
        if (err){
          console.log(chalkError("ERROR: UPDATING CATEGORY | " + kwObj.nodeId + ": " + kwObj.category));
          callback(err, wordObj);
        }
        else {
          debug(chalkLog("+++ UPDATED CATEGORY"
            + " | " + updatedWordObj.nodeId 
            + " | " + updatedWordObj.raw 
            + " | M " + updatedWordObj.mentions 
            + " | I " + updatedWordObj.isIgnored 
            + " | K " + updatedWordObj.isCategory 
            + " | CAT " + updatedWordObj.category 
            // + " | K " + jsonPrint(updatedWordObj.category) 
          ));
          callback(null, updatedWordObj);
        }
      });
    }
  }
  else {
    debug(chalkInfo("UPDATER: UPDATING CATEGORY"
      + " | " + wordObj.nodeId
      + ": " + wordObj.category
    ));

    newCategoryHashMap[wordObj.nodeId] = wordObj.category;
    localCategoryHashMap[wordObj.nodeId] = wordObj.category;

    wordServer.findOneWord(wordObj, {noInc: true}, function(err, updatedWordObj) {
      if (err){
        console.log(chalkError("ERROR: UPDATING CATEGORY"
          + " | " + wordObj.nodeId + ": " + wordObj.category
        ));
        callback(err, wordObj);
      }
      else {
        debug(chalkLog("+++ UPDATED CATEGORY"
          + " | " + updatedWordObj.nodeId 
          + " | " + updatedWordObj.raw 
          + " | M " + updatedWordObj.mentions 
          + " | I " + updatedWordObj.isIgnored 
          + " | K " + updatedWordObj.isCategory 
          + " | CAT " + updatedWordObj.category 
          + " | K " + jsonPrint(updatedWordObj.category) 
        ));
        callback(null, updatedWordObj);
      }
    });
  }
};

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

const updateCategory = function(folder, file, callback){

  newCategoryHashMap = {};

  const fullPath = folder + "/" + file;

  debug(chalkLog("UPDATE CATEGORY " + fullPath));

  getFileMetadata(fullPath, function(err, metaData){

    const categoryFileClientModifiedMoment = moment(new Date(metaData.client_modified));

    if (categoryFileClientModifiedMoment.isSameOrBefore(prevCategoryModifiedMoment)){
      debug(chalk.blue("CATEGORY FILE BEFORE OR EQUAL"
        + " | PREV: " + prevCategoryModifiedMoment.format(compactDateTimeFormat)
        + " | " + categoryFileClientModifiedMoment.format(compactDateTimeFormat)
      ));
      callback(null, 0);
    }
    else {
      console.log(chalk.blue("=K= CATEGORY FILE AFTER"
        + " | PREV: " + prevCategoryModifiedMoment.format(compactDateTimeFormat)
        + " | " + categoryFileClientModifiedMoment.format(compactDateTimeFormat)
      ));

      console.log(chalkInfo("=K= UPDATING CATEGORY | " + folder + "/" + file));

      prevCategoryModifiedMoment = moment(categoryFileClientModifiedMoment);

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
          catch(err1){
            console.log(chalkError("JSON PARSE ERROR: " , err1));
          }
        })
        .then(function(kwordsObj){

          const words = Object.keys(kwordsObj);

          console.log(chalkInfo("UPDATER | LOADED"
            + " | " + words.length + " WORDS"
            + " | " + fullPath
          ));

          async.eachSeries(words, function(w, cb) {

              categoryUpdate({nodeId: w, category: kwordsObj[w]}, function(err, updatedWord){
                if (err) {
                  console.log(chalkError("categoryUpdate ERROR! " + err));
                }
                async.setImmediate(function() {
                  cb(err);
                });
              });

            },

            function(err) {
              if (err) {
                console.log(chalkError("initCategory ERROR! " + err));
                callback(err, null);
              }
              else {
                console.log(chalkInfo("=== CATEGORY UPDATE COMPLETE"
                  + " | " + getTimeStamp()
                  + " | TOTAL CATEGORY: " + Object.keys(newCategoryHashMap).length
                ));

                callback(null, Object.keys(newCategoryHashMap).length);
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

const initCategoryUpdateInterval = function(options){

  clearInterval(categoryUpdateInterval);
  categoryUpdateReady = true;

  console.log(chalkLog("UPDATER: *** START UPDATE CATEGORY INTERVAL | " + options.interval + " MS"
    + "\n" + jsonPrint(options)
  ));

  categoryUpdateInterval = setInterval(function() {

    debug(chalk.blue(moment().format(compactDateTimeFormat) + " | UPDATER CATEGORY INTERVAL"));

    if (categoryUpdateReady) {

      categoryUpdateReady = false;

      updateCategory(options.folder, options.categoryFile, function(err, count){
        if (err) {
          console.log(chalkError("UPDATER UPDATE CATEGORY ERROR: " + err));
          categoryUpdateReady = true;
        }
        else {
          debug("update category: " + count);
          sendCategory(function(){
            categoryUpdateReady = true;
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

      clearInterval(categoryUpdateInterval);
 
      prevCategoryModifiedMoment = moment("2010-01-01");

      console.log(chalkInfo("UPDATE INIT"
        + " | FOLDER: " + m.folder
        + " | CATEGORY FILE: " + m.categoryFile
        + " | INTERVAL: " + m.interval
      ));

      options = {
        folder: m.folder,
        categoryFile: m.categoryFile,
        interval: m.interval
      };

      initCategoryUpdateInterval(options);
    break;

    case "UPDATE":

      console.log(chalkInfo("UPDATER UPDATE"
        + " | UPDATE TYPE: " + m.updateType
        + " | CATEGORY FILE: " + m.categoryFile
      ));

      updateCategory(m.folder, m.categoryFile, function(err, count){
        if (err) {
          console.log(chalkError("UPDATER UPDATE CATEGORY ERROR: " + err));
        }
        else {
          debug("update category: " + count);
          sendCategory(function(){
            debug("sent updated category: " + count);
          });
        }
      });
    break;

    case "UPDATE_CATEGORY":
      console.log(chalkInfo("UPDATER UPDATE_CATEGORY"
        + " | CATEGORY: " + jsonPrint(m.wordObj)
        // + " | KWs\n" + jsonPrint(m.category)
      ));
      // categoryUpdate(m.kwObj, function(err, wordObj){
      categoryUpdate({nodeId: m.wordObj.nodeId, category: m.wordObj.category}, function(err, wordObj){

        saveFile(dropboxConfigDefaultFolder, defaultCategoryFile, localCategoryHashMap, function(err, results){});
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

process.title = "node_updater";
console.log(
  "====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n" 
  + process.argv[1] 
  + "\nPROCESS TITLE  " + process.title 
  + "\nPROCESS ID     " + process.pid 
  + "\nSTARTED        " + moment().format(compactDateTimeFormat) 
  + "\n" + "====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "===================================================================================================="
);

if (debug.enabled) {
  console.log("UPDATER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

