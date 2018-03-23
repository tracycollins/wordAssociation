/*jslint node: true */
"use strict";

const DEFAULT_CATEGORY_VALUE = 100; // on scale of 1-100

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;

let dropboxConfigDefaultFolder = "/config/utility/default";
let defaultCategoryFile = "classifiedUsers_manual.json";

const compactDateTimeFormat = "YYYYMMDD HHmmss";

let initGroupsReady = false;

require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;

const debug = require("debug")("ud");
const debugCategory = require("debug")("kw");
const moment = require("moment");
const os = require("os");
const async = require("async");
const chalk = require("chalk");
const chalkInfo = chalk.gray;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkLog = chalk.black;

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const hashtagModel = require("@threeceelabs/mongoose-twitter/models/hashtag.server.model");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
const dbConnection = wordAssoDb();

let Word;
let User;
let Hashtag;

dbConnection.on("error", console.error.bind(console, "connection error:"));
dbConnection.once("open", function() {
  console.log("CONNECT: wordAssoServer UPDATER Mongo DB default connection open");
  Word = mongoose.model("Word", wordModel.WordSchema);
  User = mongoose.model("User", userModel.UserSchema);
  Hashtag = mongoose.model("Hashtag", hashtagModel.HashtagSchema);
});

const hashtagServer = require("@threeceelabs/hashtag-server-controller");
const userServer = require("@threeceelabs/user-server-controller");
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
        ));
      }
      callback(error, null);
    });
}

function printCat(c){
  if (c === "left") { return "L"; }
  if (c === "neutral") { return "N"; }
  if (c === "right") { return "R"; }
  if (c === "positive") { return "+"; }
  if (c === "negative") { return "-"; }
  if (c === "none") { return "0"; }
  return ".";
}

const categoryUpdate = function(cObj, callback) {

  debug("categoryUpdate\n" + jsonPrint(cObj));

  let prevCategoryObj = {};
  prevCategoryObj.category = "";

  if (localCategoryHashMap[cObj.nodeId] !== undefined) {
    prevCategoryObj = localCategoryHashMap[cObj.nodeId];
  }

  if (prevCategoryObj.category === cObj.category){
    debug(chalkAlert("* CAT HM HIT | " + cObj.nodeId));
    console.log(chalkAlert("--- NODE CATEGORY UNCHANGED"
      + " | TYPE: " + prevCategoryObj.nodeType
      + " | ID: " + prevCategoryObj.nodeId
      + " | " + prevCategoryObj.display
      + " | PREV: " + prevCategoryObj.category
      + " | NEW: " + cObj.category
    ));
    return(callback(null, {updated: false, obj: prevCategoryObj}));
  }

  debug(chalkAlert("+++ NODE CATEGORY CHANGED"
    + " | ID: " + cObj.nodeId
    + " | PREV: " + prevCategoryObj.category
    + " | NEW: " + cObj.category
  ));

  let nodeObj;

  if (cObj.nodeType === undefined) {
    async.parallel({
        user: function(cb) {
          // User.findOne({screenName: cObj.nodeId.toLowerCase()}, function(err, user) {
          User.findOne({userId: cObj.nodeId}, function(err, user) {
            if (err) {
              console.log(chalkError("categoryUpdate: ERROR DB FIND ONE USER | " + err));
              cb(err, null);
            }
            else if (user) {
              debug(chalkInfo("categoryUpdate: USER DB HIT "
                + " | @" + user.screenName.toLowerCase()
              ));
              // nodeObj = new User();
              // nodeObj.nodeId = user.nodeId;
              // nodeObj.userId = user.userId;
              // nodeObj.screenName = user.screenName.toLowerCase();
              // nodeObj.display = "@" + user.screenName.toLowerCase();
              // nodeObj.isCategory = true;

              user.nodeId = user.userId;
              user.category = cObj.category;

              newCategoryHashMap[user.userId] = cObj.category;
              localCategoryHashMap[user.userId] = cObj.category; 

              cb(null, nodeObj);
            }
            else {
              debug(chalkInfo("categoryUpdate: USER DB MISS"
                + " | @" + cObj.nodeId.toLowerCase()
              ));
              cb(null, null);
            }
          });
        },
        hashtag: function(cb) {
          Hashtag.findOne({nodeId: cObj.nodeId.toLowerCase()}, function(err, hashtag){
            if (err) {
              console.log(chalkError("categoryUpdate: ERROR DB FIND ONE HASHTAG | " + err));
              cb(err, null);
            }
            else if (hashtag) {
              debug(chalkInfo("categoryUpdate: HASHTAG DB HIT "
                + " | " + cObj.nodeId.toLowerCase()
              ));
              nodeObj = new Hashtag();
              nodeObj.nodeId = hashtag.nodeId.toLowerCase();
              nodeObj.hashtagId = hashtag.nodeId.toLowerCase();
              nodeObj.text = hashtag.nodeId.toLowerCase();
              nodeObj.display = "#" + hashtag.nodeId.toLowerCase();
              nodeObj.isCategory = true;
              nodeObj.category = cObj.category;
              nodeObj.categoryAuto = cObj.categoryAuto;
              newCategoryHashMap[nodeObj.nodeId] = nodeObj.category;
              localCategoryHashMap[nodeObj.nodeId] = nodeObj.category;
              cb(null, nodeObj);
            }
            else{
              debug(chalkInfo("categoryUpdate: HASHTAG DB MISS"
                + " | #" + cObj.nodeId.toLowerCase()
              ));
              cb(null, null);
            }
          });
        },
        word: function(cb) {
          Word.findOne({nodeId: cObj.nodeId.toLowerCase()}, function(err, word){
            if (err) {
              console.log(chalkError("categoryUpdate: ERROR DB FIND ONE WORD | " + err));
              cb(err, null);
            }
            else if (word) {
              debug(chalkInfo("categoryUpdate: WORD DB HIT "
                + " | " + cObj.nodeId.toLowerCase()
              ));
              nodeObj = new Word();
              nodeObj.nodeId = word.nodeId.toLowerCase();
              nodeObj.wordId = word.nodeId.toLowerCase();
              nodeObj.display = word.nodeId.toLowerCase();
              nodeObj.isCategory = true;
              nodeObj.category = cObj.category;
              nodeObj.categoryAuto = cObj.categoryAuto;
              newCategoryHashMap[nodeObj.nodeId] = nodeObj.category;
              localCategoryHashMap[nodeObj.nodeId] = nodeObj.category;
              cb(null, nodeObj);
            }
            else{
              debug(chalkInfo("categoryUpdate: WORD DB MISS"
                + " | " + cObj.nodeId.toLowerCase()
              ));
              cb(null, null);
            }
          });
        }
    }, function(err, results) {
      if (err) {
        return(callback(err, null));
      }

      if (results.user) {
        // console.log("results.user\n" + jsonPrint(results.user));
        userServer.findOneUser(results.user, { noInc: true}, function(err, updatedUser){
          if (err){
            console.log(chalkError("ERROR: UPDATING CATEGORY"
              + " | " + results.user.nodeId 
              + " | " + results.user.category));
            callback(err, results.user);
          }
          else {
            console.log(chalkLog("+++ UPDATED CATEGORY"
              + " | C " + printCat(updatedUser.category) 
              + " | CA " + printCat(updatedUser.categoryAuto)
              + " | " + updatedUser.nodeId 
              + " | @" + updatedUser.screenName 
              + " | M " + updatedUser.mentions 
            ));
            callback(null, updatedUser);
          }
        });
      }
      else if (results.hashtag) {
        hashtagServer.findOneHashtag(results.hashtag, {noInc: true}, function(err, updatedHashtagObj) {
          if (err){
            console.log(chalkError("ERROR: UPDATING HASHTAG CATEGORY | " + results.hashtag.nodeId 
              + ": " + results.hashtag.category));
            callback(err, results.hashtag);
          }
          else {
            console.log(chalkLog("+++ UPDATED CATEGORY"
              + " | C " + printCat(updatedHashtagObj.category) 
              + " | CA " + printCat(updatedHashtagObj.category) 
              + " | #" + updatedHashtagObj.nodeId 
              + " | M " + updatedHashtagObj.mentions 
            ));
            callback(null, updatedHashtagObj);
          }
        });
      }
      else if (results.word) {
        wordServer.findOneWord(results.word, {noInc: true}, function(err, updatedWordObj) {
          if (err){
            console.log(chalkError("ERROR: UPDATING WORD CATEGORY | " + results.word.nodeId 
              + ": " + results.word.category));
            callback(err, results.word);
          }
          else {
            console.log(chalkLog("+++ UPDATED CATEGORY"
              + " | C " + printCat(updatedWordObj.category) 
              + " | CA " + printCat(updatedWordObj.category) 
              + " | " + updatedWordObj.nodeId 
              + " | M " + updatedWordObj.mentions 
            ));
            callback(null, updatedWordObj);
          }
        });
      }
      else {
        callback(null, null);
      }
    });
  }
  else {

    debug(chalkInfo("UPDATER: UPDATING CATEGORY | " + cObj.nodeId + ": " + cObj.category));

    newCategoryHashMap[cObj.nodeId] = cObj.category;
    localCategoryHashMap[cObj.nodeId] = cObj.category;

    if (cObj.nodeType === "user") {
      nodeObj = new User();
      nodeObj.nodeId = cObj.nodeId;
      nodeObj.screenName = cObj.screenName.toLowerCase();
      nodeObj.display = "@" + cObj.screenName;
      nodeObj.isCategory = true;
      nodeObj.category = cObj.category;
      userServer.findOneUser(nodeObj, {noInc: true}, function(err, updatedUser){
        if (err){
          console.log(chalkError("ERROR: UPDATING USER CATEGORY"
            + " | " + nodeObj.nodeId
            + " | @" + nodeObj.screenName
            + " | " + nodeObj.category
            + " | ERR: " + err
          ));
          callback(err, nodeObj);
        }
        else {
          debug(chalkLog("+++ UPDATED CATEGORY"
            + " | " + updatedUser.nodeId 
            + " | @" + updatedUser.screenName 
            + " | M " + updatedUser.mentions 
            + " | C " + updatedUser.category 
            + " | CA " + updatedUser.categoryAuto
          ));
          callback(null, updatedUser);
        }
      });
    }
    else if (cObj.nodeType === "hashtag") {
      nodeObj = new Hashtag();
      nodeObj.nodeId = cObj.nodeId;
      nodeObj.text = cObj.nodeId;
      nodeObj.display = "#" + cObj.nodeId;
      nodeObj.isCategory = true;
      nodeObj.category = cObj.category;
      hashtagServer.findOneHashtag(nodeObj, {noInc: true}, function(err, updatedHashtagObj) {
        if (err){
          console.log(chalkError("ERROR: UPDATING HASHTAG CATEGORY"
            + " | #" + nodeObj.nodeId
            + " | " + nodeObj.category
            + " | ERR: " + err
          ));
          callback(err, nodeObj);
        }
        else {
          debug(chalkLog("+++ UPDATED CATEGORY"
            + " | C " + updatedHashtagObj.category 
            + " | CA " + updatedHashtagObj.category 
            + " | " + updatedHashtagObj.nodeId 
            + " | " + updatedHashtagObj.raw 
            + " | M " + updatedHashtagObj.mentions 
          ));
          callback(null, updatedHashtagObj);
        }
      });
    }
    else if (cObj.nodeType === "word") {
      nodeObj = new Word();
      nodeObj.nodeId = cObj.nodeId;
      nodeObj.display = cObj.nodeId;
      nodeObj.isCategory = true;
      nodeObj.category = cObj.category;
      wordServer.findOneWord(nodeObj, {noInc: true}, function(err, updatedWordObj) {
        if (err){
          console.log(chalkError("ERROR: UPDATING WORD CATEGORY"
            + " | " + nodeObj.nodeId
            + " | " + nodeObj.category
            + " | ERR: " + err
          ));
          callback(err, nodeObj);
        }
        else {
          debug(chalkLog("+++ UPDATED CATEGORY"
            + " | " + updatedWordObj.nodeId 
            + " | " + updatedWordObj.raw 
            + " | M " + updatedWordObj.mentions 
            + " | C " + updatedWordObj.category 
            + " | CA " + updatedWordObj.category 
          ));
          callback(null, updatedWordObj);
        }
      });
    }
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

              categoryUpdate({nodeId: w, category: kwordsObj[w]}, function(err, updatedNodeObj){
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
  let sn = "";

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
      // op: "UPDATE_CATEGORY",
      // nodeType: "user",
      // nodeId: updatedUser.userId,
      // screenName: updatedUser.screenName.toLowerCase(),
      // category: categorizeObj.category
      sn = (m.nodeType === "user") ? (" | @" + m.screenName) : "";
      console.log(chalkInfo("UPDATER UPDATE_CATEGORY"
        + " | NODE TYPE: " + m.nodeType
        + " | NODE ID: " + m.nodeId
        + " | CAT: " + m.category.toUpperCase()
        + sn
      ));
      categoryUpdate(m, function(err, wordObj){
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

