/*jslint node: true */
"use strict";

var OFFLINE_MODE = false;
var debug = require('debug')('wa');
var moment = require('moment');

var jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } else {
    return obj;
  }
}

function quit(message) {
  console.log("\n... QUITTING ...");
  var msg = '';
  if (message) msg = message;
  console.log("QUIT MESSAGE\n" + msg);
  process.exit();
}

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

var groupHashMap = new HashMap();
var entityChannelGroupHashMap = new HashMap();
var keywordHashMap = new HashMap();

var mongoose = require('../../config/mongoose');
var db = mongoose();
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
var chalkLog = chalk.gray;


// ==================================================================
// ENV INIT
// ==================================================================
if (debug.enabled) {
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

// ==================================================================
// DROPBOX
// ==================================================================
var DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
var DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
var DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;

var Dropbox = require("dropbox");

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
debug("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
debug("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

// var dropboxClient = new Dropbox.Client({
//   token: DROPBOX_WORD_ASSO_ACCESS_TOKEN,
//   key: DROPBOX_WORD_ASSO_APP_KEY,
//   secret: DROPBOX_WORD_ASSO_APP_SECRET
// });

var groupsConfigFile;
var entityChannelGroupsConfigFile;
var keywordFile;

var statsObj = {};
statsObj.group = {};
statsObj.group.errors = 0;
statsObj.group.hashMiss = {};
statsObj.group.allHashMisses = {};
statsObj.entityChannelGroup = {};
statsObj.entityChannelGroup.hashMiss = {};
statsObj.entityChannelGroup.allHashMisses = {};

process.on('message', function(m) {

  console.log(chalkRed("RX MESSAGE\n" + jsonPrint(m)));

  groupsConfigFile = m.groupsConfigFile;
  entityChannelGroupsConfigFile = m.entityChannelGroupsConfigFile;
  keywordFile = m.keywordFile;

  updateGroupsInterval(groupsConfigFile, m.interval);

});

function updateGroups(configFile, callback){

  console.log(chalkWarn("UPDATE GROUPS " + configFile));

  initGroups(configFile, function(err, groups){
    if (err){
      console.log(chalkError("*** ERROR initEntityChannelGroups"
        + " | CONFIG FILE: " + configFile
        + "\n" + jsonPrint(err)
      ));
    }
    else {
      console.log(chalkLog("GROUPS CONFIG INIT COMPLETE"
        + " | " + groupIds.length + " GROUPS"
      ));

      var groupIds = Object.keys(groups) ;

      async.forEach(groupIds, 

        function(groupId, cb){

          if (groupHashMap.has(groupId)){
            groupHashMap.set(groupId, groups[groupId]);
            delete statsObj.group.hashMiss[groupId];
            cb(null, "HIT " + groupId);
            return;
          }

          else {
            groupHashMap.set(groupId, groups[groupId]);
            debug(chalkLog("+++ ADDED GROUP  "
              + " | " + groupId
              + " | " + groupHashMap.get(groupId).name
            ));
            statsObj.group.hashMiss[groupId] = 1;
            statsObj.group.allHashMisses[groupId] = 1;
            cb(null, "MISS " + groupId);
            return;
          }

        },

        function(err) {
          if (err) {
            console.error("*** ERROR  updateGroups: " + err);
            callback(err, null);
            return;
          } else {
            console.log(chalkLog("FOUND " + groupIds.length + " GROUPS"));
            console.log(chalkLog("GROUPS CONFIG UPDATE COMPLETE"
            ));

            updateEntityChannelGroups(entityChannelGroupsConfigFile, function(err, results){
              callback(null, groupIds.length);
              return;
            });

          }
        }
      );

    }
  });  
}

function updateEntityChannelGroups(configFile, callback){

  initEntityChannelGroups(configFile, function(err, entityChannelGroups){
    if (err){
      console.log(chalkError("*** ERROR initEntityChannelGroups"
        + " | CONFIG FILE: " + configFile
        + "\n" + jsonPrint(err)
      ));

      callback(err, null);
    }
    else {

      var entityChannelIds = Object.keys(entityChannelGroups) ;

      async.forEach(entityChannelIds, 

        function(entityChannelId, cb){

          if (entityChannelGroupHashMap.has(entityChannelId)){

            entityChannelGroupHashMap.set(entityChannelId, entityChannelGroups[entityChannelId]);

            delete statsObj.entityChannelGroup.hashMiss[entityChannelId];

            // console.log(chalkRed("--- UPDATED ENTITY CHANNEL"
            //   + " | " + entityChannelId
            //   + " | " + entityChannelGroupHashMap.get(entityChannelId).groupId
            //   + " | " + entityChannelGroupHashMap.get(entityChannelId).name
            //   // + " | " + jsonPrint(entityChannelGroupHashMap.get(entityChannelId))
            // ));

            if (groupHashMap.has(entityChannelGroupHashMap.get(entityChannelId).groupId)){
              cb(null, "HIT");
              return;
            }
            else{
              cb(err, "GROUP NOT FOUND: " + entityChannelGroupHashMap.get(entityChannelId).groupId);
              return;
            }

          }

          else {

            entityChannelGroupHashMap.set(entityChannelId, entityChannelGroups[entityChannelId]);

            // console.log(chalkLog("+++ ADDED ENTITY CHANNEL  "
            //   + " | " + entityChannelId
            //   + " | GROUP ID: " + entityChannelGroupHashMap.get(entityChannelId).groupId
            //   + " | ENTITY NAME: " + entityChannelGroupHashMap.get(entityChannelId).name
            //   // + "\n" + jsonPrint(entityChannelGroupHashMap.get(entityChannelId))
            // ));

            if (groupHashMap.has(entityChannelGroupHashMap.get(entityChannelId).groupId)){
              cb(null, "MISS");
              return;
            }
            else{
              cb(err, "GROUP NOT FOUND: " + entityChannelGroupHashMap.get(entityChannelId).groupId);
              return;
            }
          }

        },

        function(err) {
          if (err) {
            console.error("*** ERROR  updateEntityChannelGroups: " + err);
            callback(err, null);
            return;
          } else {
            debug("FOUND " + entityChannelIds.length + " ENTITIY CHANNELS");
            console.log(chalkLog("ENTITY CHANNEL GROUPS CONFIG INIT COMPLETE"
              // + "\n" + jsonPrint(entityChannelGroups)
            ));
            callback(null, entityChannelIds.length);
            return;
          }
        }
      );

    }
  });  
}

function sendHashMaps(callback){
  sendGroups(function(){
    sendEntities(function(){
      sendKeywords(function(){
        callback();
      });
    });
  });
}


function sendGroups(callback){

  var groupIds = groupHashMap.keys();

  async.forEachSeries(groupIds, function(groupId, cb) {

      var groupObj = groupHashMap.get(groupId);

      setTimeout(function(){
        process.send({ type: 'group', groupId: groupId, group: groupObj});
        debug(chalkAlert("UPDATER SENT GROUP"
          + " | " + groupId
        ));

        cb();
      }, 10);

    },

    function(err) {
      if (err) {
        console.log(chalkError("sendGroups ERROR! " + err));
        callback(err, null);
      }
      else {
        console.log(chalkInfo("sendGroups COMPLETE"));
        callback(null, null);
      }
    }
  )
}

function sendEntities(callback){

  var entityIds = entityChannelGroupHashMap.keys();

  async.forEachSeries(entityIds, function(entityId, cb) {

      var entityObj = entityChannelGroupHashMap.get(entityId);

      setTimeout(function(){
        process.send({ type: 'entity', entityId: entityId, entity: entityObj});
        debug(chalkAlert("UPDATER SENT ENTITY"
          + " | " + entityId
        ));

        cb();
      }, 10);

    },

    function(err) {
      if (err) {
        console.log(chalkError("sendEntities ERROR! " + err));
        callback(err, null);
      }
      else {
        console.log(chalkInfo("sendEntities COMPLETE"));
        callback(null, null);
      }
    }
  )
}

function sendKeywords(callback){

  var words = keywordHashMap.keys();

  async.forEachSeries(words, function(word, cb) {

      var keyWordType = keywordHashMap.get(word);

      setTimeout(function(){
        process.send({ type: 'keyword', keyword: word, keyWordType: keyWordType});
        debug(chalkAlert("UPDATER SEND KEYWORD"
          + " | " + word
          + " | " + keyWordType
        ));

        cb();
      }, 10);

    },

    function(err) {
      if (err) {
        console.log(chalkError("sendKeywords ERROR! " + err));
        callback(err, null);
      }
      else {
        console.log(chalkInfo("sendKeywords COMPLETE"));
        callback(null, null);
      }
    }
  )
}

var initGroupsInterval;
var initGroupsReady = true;

function updateGroupsInterval(file, interval){

  clearInterval(initGroupsInterval);

  console.log(chalkRed("updateGroupsInterval"
    + " | INTERVAL: " + interval
  ));

  updateGroups(file, function(err, results){
    initKeywords(keywordFile, function(err, results2){
      sendHashMaps(function(err, results3){
        initGroupsReady = true;
      });
    });
  });

  initGroupsInterval = setInterval(function() {

    if (initGroupsReady) {
      initGroupsReady = false;
      updateGroups(file, function(err, results){
        initKeywords(keywordFile, function(err, results2){
          sendHashMaps(function(err, results3){
            initGroupsReady = true;
          });
        });
      });
    }
  }, interval);
}

function initKeywords(file, callback){
  loadConfig(file, function(err, kwordsObj){

    if (!err) {

      console.log(chalkRed("UPDATER | LOADED"
        + " | " + file
      ));

      var words = Object.keys(kwordsObj);

      async.forEach(words,

        function(w, cb) {

          var wd = w.toLowerCase();
          var keyWordType = kwordsObj[w];

          debug(chalkRed("UPDATING KEYWORD | " + wd + ": " + keyWordType));

          var wordObj = new Word();

          wordObj.nodeId = wd;
          wordObj.isKeyword = true;
          wordObj.keywords[keyWordType] = true;
          keywordHashMap.set(wordObj.nodeId, keyWordType);

          wordServer.findOneWord(wordObj, false, function(err, updatedWordObj) {
            if (err){
              console.log(chalkError("ERROR: UPDATING KEYWORD | " + wd + ": " + kwordsObj[wd]));
              cb(err);
            }
            else {
              // console.log(chalkLog("+++ UPDATED KEYWORD"
              //   + " | " + updatedWordObj.nodeId 
              //   + " | " + updatedWordObj.raw 
              //   + " | M " + updatedWordObj.mentions 
              //   + " | I " + updatedWordObj.isIgnored 
              //   + " | K " + updatedWordObj.isKeyword 
              //   + " | K " + jsonPrint(updatedWordObj.keywords) 
              // ));
              cb();
            }
          });

        },

        function(err) {
          if (err) {
            console.log(chalkError("initKeywords ERROR! " + err));
            callback(err, null);
          }
          else {
            console.log(chalkInfo("initKeywords COMPLETE"));
            callback(null, words.length);
          }
        }
      )
    }
  });
}


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

function msToMinutes(duration) {
  var minutes = parseInt((duration / (1000 * 60)) % 60);
  return minutes;
}

function getTimeNow() {
  var d = new Date();
  return d.getTime();
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
  return currentTimeStamp.format("YYYY-MM-DD HH:mm:ss ZZ");
}

function loadConfig(file, callback){

  console.log(chalkWarn("LOADING CONFIG " + file));

  var options = {};
  options.path = '/' + file;

  dropboxClient.filesDownload(options)
    .then(function(configJson) {
      console.log(chalkLog(getTimeStamp()
        + " | LOADING CONFIG FROM DROPBOX FILE: " + file
      ));

      var configObj = JSON.parse(configJson.fileBinary);

      // console.log("DROPBOX CONFIG\n" + JSON.stringify(configObj, null, 3));

      debug(chalkLog(getTimeStamp() + " | FOUND " + configObj.timeStamp));

      return(callback(null, configObj));
    })
    .catch(function(error) {
      console.error(chalkError("!!! DROPBOX READ " + file + " ERROR"));
      console.error(error);
      return(callback(error, null));
    });
}

function saveDropboxJsonFile(file, jsonObj, callback){

  var options = {};

  options.contents = jsonObj;
  options.path = file;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(response){
      debug(chalkLog("... SAVED DROPBOX JSON | " + file));
      callback('OK');
    })
    .catch(function(error){
      console.error(chalkError(moment().format(defaultDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + file 
        + " ERROR: " + error));
      callback(error);
    });

  // dropboxClient.writeFile(file, JSON.stringify(jsonObj, null, 2), function(error, stat) {
  //   if (error) {
  //     console.error(chalkError(moment().format(defaultDateTimeFormat) 
  //       + " | !!! ERROR DROBOX JSON WRITE | FILE: " + file 
  //       + " ERROR: " + error));
  //     callback(error);
  //   } else {
  //     debug(chalkLog("... SAVED DROPBOX JSON | " + file));
  //     callback('OK');
  //   }
  // });
}

function loadDropboxJsonFile(file, callback){

  // dropboxClient.readFile(file, function(err, dropboxFileData) {
  dropboxClient.filesDownload({path: file})
    .then(function(dropboxFileData) {
      console.log(chalkLog(getTimeStamp()
        + " | LOADING DROPBOX JSON FILE: " + file
      ));

      var dropboxFileObj = JSON.parse(dropboxFileData);

      debug("DROPBOX JSON\n" + JSON.stringify(dropboxFileObj, null, 3));

      return(callback(null, dropboxFileObj));
    })
    .catch(function(error){
      console.error(chalkError("!!! DROPBOX READ JSON FILE ERROR: " + file));
      debug(chalkError(jsonPrint(error)));
      return(callback(error, null));
    });

    // if (err) {
    //   console.error(chalkError("!!! DROPBOX READ JSON FILE ERROR: " + file));
    //   debug(chalkError(jsonPrint(err)));
    //   return(callback(err, null));
    // }

    // console.log(chalkLog(getTimeStamp()
    //   + " | LOADING DROPBOX JSON FILE: " + file
    // ));

    // var dropboxFileObj = JSON.parse(dropboxFileData);

    // debug("DROPBOX JSON\n" + JSON.stringify(dropboxFileObj, null, 3));

    // return(callback(null, dropboxFileObj));

  // });
}

function initGroups(dropboxConfigFile, callback){

  console.log(chalkWarn("INIT GROUPS"));

  loadConfig(dropboxConfigFile, function(err, loadedConfigObj){
    if (!err) {
      console.log(chalkAlert("UPDATER | LOADED"
        + " | " + dropboxConfigFile
      ));
      return(callback(err, loadedConfigObj));
    }
    else {
      console.error(dropboxConfigFile + "\n" + jsonPrint(err));
      return(callback(err, loadedConfigObj));
     }
  });
}

function initEntityChannelGroups(dropboxConfigFile, callback){
  loadConfig(dropboxConfigFile, function(err, loadedConfigObj){
    if (!err) {
      console.log(chalkAlert("UPDATER | LOADED"
        + " | " + dropboxConfigFile
      ));
      return(callback(err, loadedConfigObj));
    }
    else {
      console.error(dropboxConfigFile + "\n" + jsonPrint(err));
      return(callback(err, loadedConfigObj));
     }
  });
}

//=================================
// BEGIN !!
//=================================
