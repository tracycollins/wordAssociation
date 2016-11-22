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

debug("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
debug("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
debug("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var dropboxClient = new Dropbox.Client({
  token: DROPBOX_WORD_ASSO_ACCESS_TOKEN,
  key: DROPBOX_WORD_ASSO_APP_KEY,
  secret: DROPBOX_WORD_ASSO_APP_SECRET
});

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

  initGroups(configFile, function(err, groups){
    if (err){
      console.log(chalkError("*** ERROR initEntityChannelGroups"
        + " | CONFIG FILE: " + configFile
        + "\n" + jsonPrint(err)
      ));
    }
    else {
      console.log(chalkLog("GROUPS CONFIG INIT COMPLETE"
        // + "\n" + jsonPrint(entityChannelGroups)
      ));

      var groupIds = Object.keys(groups) ;

      async.forEach(groupIds, 

        function(groupId, cb){

          if (groupHashMap.has(groupId)){
            groupHashMap.set(groupId, groups[groupId]);
            delete statsObj.group.hashMiss[groupId];
            cb(null, "HIT");
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
            cb(null, "MISS");
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
              // process.send({ 
              //   groupHashMap: groupHashMap, 
              //   entityChannelGroupHashMap: entityChannelGroupHashMap,
              //   keywordHashMap: keywordHashMap
              // });
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

var initGroupsInterval;
function updateGroupsInterval(configFile, interval){

  clearInterval(initGroupsInterval);

  console.log(chalkLog("updateGroupsInterval"
    + " | INTERVAL: " + interval
    + " | " + configFile
  ));

  initGroupsInterval = setInterval(function() {
    updateGroups(configFile, function(err, results){
      initKeywords(keywordFile, function(err, results2){
        // process.send()
        process.send({ 
          groupHashMap: groupHashMap, 
          entityChannelGroupHashMap: entityChannelGroupHashMap,
          keywordHashMap: keywordHashMap
        });
      });
    });
  }, interval);
}

function initKeywords(file, callback){
  loadDropboxJsonFile(file, function(err, kwordsObj){

    if (!err) {

      var words = Object.keys(kwordsObj);

      async.forEach(words,

        function(w, cb) {

          var wd = w.toLowerCase();
          var keyWordType = kwordsObj[w];

          // console.log(chalkRed("UPDATING KEYWORD | " + wd + ": " + keyWordType));

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

// var DROPBOX_WA_GROUPS_CONFIG_FILE = process.env.DROPBOX_WA_GROUPS_CONFIG_FILE || 'groups.json';
// var DROPBOX_WA_KEYWORDS_FILE = process.env.DROPBOX_WA_KEYWORDS_FILE || 'keywords.json';
// var DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE = process.env.DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE || 'entityChannelGroups.json';

// var defaultDropboxGroupsConfigFile = DROPBOX_WA_GROUPS_CONFIG_FILE;
// var defaultDropboxKeywordFile = DROPBOX_WA_KEYWORDS_FILE;

// var dropboxGroupsConfigFile = os.hostname() +  "_" + DROPBOX_WA_GROUPS_CONFIG_FILE;

// var defaultDropboxEntityChannelGroupsConfigFile = DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE;
// var dropboxEntityChannelGroupsConfigFile = os.hostname() +  "_" + DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE;

function loadConfig(file, callback){

  dropboxClient.readFile(file, function(err, configJson) {

    if (err) {
      console.error(chalkError("!!! DROPBOX READ " + file + " ERROR"));
      debug(chalkError(jsonPrint(err)));
      return(callback(err, null));
    }

    console.log(chalkLog(getTimeStamp()
      + " | LOADING CONFIG FROM DROPBOX FILE: " + file
    ));

    var configObj = JSON.parse(configJson);

    debug("DROPBOX CONFIG\n" + JSON.stringify(configObj, null, 3));

    debug(chalkLog(getTimeStamp() + " | FOUND " + configObj.timeStamp));

    return(callback(null, configObj));

  });
}

function saveDropboxJsonFile(file, jsonObj, callback){

  dropboxClient.writeFile(file, JSON.stringify(jsonObj, null, 2), function(error, stat) {
    if (error) {
      console.error(chalkError(moment().format(defaultDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + file 
        + " ERROR: " + error));
      callback(error);
    } else {
      debug(chalkLog("... SAVED DROPBOX JSON | " + file));
      callback('OK');
    }
  });
}

function loadDropboxJsonFile(file, callback){

  dropboxClient.readFile(file, function(err, dropboxFileData) {

    if (err) {
      console.error(chalkError("!!! DROPBOX READ JSON FILE ERROR: " + file));
      debug(chalkError(jsonPrint(err)));
      return(callback(err, null));
    }

    console.log(chalkLog(getTimeStamp()
      + " | LOADING DROPBOX JSON FILE: " + file
    ));

    var dropboxFileObj = JSON.parse(dropboxFileData);

    debug("DROPBOX JSON\n" + JSON.stringify(dropboxFileObj, null, 3));

    return(callback(null, dropboxFileObj));

  });
}

function initGroups(dropboxConfigFile, callback){
  loadConfig(dropboxConfigFile, function(err, loadedConfigObj){
    if (!err) {
      console.log("LOADED "
        + " | " + dropboxConfigFile
        );
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
      console.log("LOADED "
        + " | " + dropboxConfigFile
        );
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
