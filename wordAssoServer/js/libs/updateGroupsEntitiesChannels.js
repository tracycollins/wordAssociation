/*jslint node: true */
"use strict";

var ONE_SECOND = 1000;
var ONE_MINUTE = ONE_SECOND * 60;
var ONE_HOUR = ONE_MINUTE * 60;
var ONE_DAY = ONE_HOUR * 24;

var compactDateTimeFormat = "YYYYMMDD HHmmss";

var initGroupsInterval;
var updateStatsCountsInterval;

var initGroupsReady = true;
var statsCountsComplete = true;

var DEFAULT_KEYWORD_VALUE = 100 // on scale of 1-100
var deleteKeywordsEnabled = false;

var sendingHashMapsFlag = false;

var OFFLINE_MODE = false;
var debug = require('debug')('wa');
var debugKeyword = require('debug')('kw');
var moment = require('moment');
var os = require('os');

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, '');
hostname = hostname.replace(/.fios-router.home/g, '');
hostname = hostname.replace(/word0-instance-1/g, 'google');

var prevKeywordModifiedMoment = moment("2010-01-01");
var prevGroupsModifiedMoment = moment("2010-01-01");
var prevEntitiesFileClientModifiedMoment = moment("2010-01-01");

var statsObj = {};
statsObj.db = {};
statsObj.db.totalSessions = 0;
statsObj.db.totalAdmins = 0;
statsObj.db.totalUsers = 0;
statsObj.db.totalViewers = 0;
statsObj.db.totalGroups = 0;
statsObj.db.totalEntities = 0;
statsObj.db.totalWords = 0;
statsObj.group = {};
statsObj.group.errors = 0;
statsObj.group.hashMiss = {};
statsObj.group.allHashMisses = {};
statsObj.entityChannelGroup = {};
statsObj.entityChannelGroup.hashMiss = {};
statsObj.entityChannelGroup.allHashMisses = {};

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
  console.log("UPDATER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    + "\n" + process.argv[1] 
    
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

var groupHashMap = new HashMap();
var serverGroupHashMap = new HashMap();

var entityChannelGroupHashMap = new HashMap();
var serverEntityChannelGroupHashMap = new HashMap();

var keywordHashMap = new HashMap();

var mongoose = require('../../config/mongoose');

var db = mongoose();

var Admin = require("mongoose").model("Admin");
var Viewer = require("mongoose").model("Viewer");
var User = require("mongoose").model("User");
var Group = require("mongoose").model("Group");
var Entity = require("mongoose").model("Entity");
var Session = require("mongoose").model("Session");
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


process.on('message', function(m) {

  debug(chalkInfo("RX MESSAGE\n" + jsonPrint(m)));

  switch (m.op) {

    case "INIT":

      clearInterval(initGroupsInterval);
      clearInterval(updateStatsCountsInterval);

      statsCountsComplete = true;
      initGroupsReady = true;
      sendingHashMapsFlag = false;

      prevKeywordModifiedMoment = moment("2010-01-01");
      prevGroupsModifiedMoment = moment("2010-01-01");
      prevEntitiesFileClientModifiedMoment = moment("2010-01-01");

      console.log(chalkInfo("UPDATE GROUP ENTITIES CHANNELS INIT"
        + " | FOLDER: " + m.folder
        + " | GROUP FILE: " + m.groupsConfigFile
        + " | ENTITY FILE: " + m.entityChannelGroupsConfigFile
        + " | KEYWORD FILE: " + m.keywordFile
        + " | INTERVAL: " + m.interval
        // + " | " + jsonPrint(m)
      ));

      groupsConfigFile = m.groupsConfigFile;
      entityChannelGroupsConfigFile = m.entityChannelGroupsConfigFile;
      keywordsFile = m.keywordFile;

      var options = {
        folder: m.folder,
        groupsFile: m.groupsConfigFile,
        entitiesFile: m.entityChannelGroupsConfigFile,
        keywordsFile: m.keywordFile,
        interval: m.interval
      };

      updateStatsCounts(function(err, results){
        if (err) { console.log(chalkError("STATS COUNTS ERROR\n" + jsonPrint(err))); }
        debug(chalkRed("STATS COUNTS\n" + jsonPrint(results)));
        process.send({ type: 'stats', db: results}, function(err){
          statsCountsComplete = true;
          if (err){
            console.log(chalkError("STATS SEND ERROR\n" + err));
          }
          else {
            debug(chalkInfo("UPDATER SENT STATS"
            ));
          }
        });
      });
      initUpdateStatsCountsInterval(5*ONE_MINUTE);
      updateGroupsInterval(options);
      break;

    case "UPDATE":

      console.log(chalkInfo("UPDATE"
        + " | UPDATE TYPE: " + m.updateType
        + " | KEYWORD FILE: " + m.keywordFile
        // + " | " + jsonPrint(m)
      ));

      switch (m.updateType) {
        case "KEYWORDS":
          updateKeywords("", m.keywordsFile, function(){
            sendKeywords(function(){});
          });
          break;

        default:
        console.log(chalkError("??? updateGroupsEntitiesKeywords RX UNKNOWN UPDATE TYPE\n" + jsonPrint(m)));
      }

      break;

    default:
    console.log(chalkError("??? updateGroupsEntitiesKeywords RX UNKNOWN MESSAGE\n" + jsonPrint(m)));

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
    .catch(function(error) {
      console.log(chalkError("GET FILE METADATA ERROR\n" + error));
      return(callback(error, null));
    });
}

function loadFile(path, file, callback) {

  debug(chalkInfo("LOAD FOLDER " + path));
  debug(chalkInfo("LOAD FILE " + file));
  debug(chalkInfo("FULL PATH " + path + "/" + file));

  var fileExists = false;

  dropboxClient.filesDownload({path: path + "/" + file})
    .then(function(data) {
      console.log(chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX FILE: " + path + "/" + file
      ));

      var payload = data.fileBinary;

      debug(payload);

      var fileObj = JSON.parse(payload);

      return(callback(null, fileObj));
     })
    .catch(function(error) {
      console.log(chalkAlert("DROPBOX loadFile ERROR: " + file + "\n" + error));
      console.log(chalkError("!!! DROPBOX READ " + file + " ERROR: " + error.error));
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

var updateGroups = function (path, configFile, callback){

  debug(chalkInfo("UPDATE GROUPS " + configFile));

  getFileMetadata(path, configFile, function(err, response){

    var groupsFileClientModifiedMoment = moment(new Date(response.client_modified));
  
    if (groupsFileClientModifiedMoment.isSameOrBefore(prevGroupsModifiedMoment)){
      debug(chalkInfo("GROUPS FILE BEFORE OR EQUAL"
        + " | PREV: " + prevGroupsModifiedMoment.format(compactDateTimeFormat)
        + " | " + groupsFileClientModifiedMoment.format(compactDateTimeFormat)
      ));

      // callback(null, "GROUPS FILE " + path + "/" + configFile + " NOT MODIFIED");
      callback(null, {groups: 0});
    }
    else {
      debug(chalkInfo("GROUPS FILE AFTER"
        + " | PREV: " + prevGroupsModifiedMoment.format(compactDateTimeFormat)
        + " | " + groupsFileClientModifiedMoment.format(compactDateTimeFormat)
      ));

      console.log(chalkInfo("UPDATING GROUPS | " + path + "/" + configFile));

      prevGroupsModifiedMoment = moment(groupsFileClientModifiedMoment);

      initGroups(configFile, function(err, groups){
        if (err){
          console.log(chalkError("*** ERROR initEntityChannelGroups"
            + " | CONFIG FILE: " + configFile
            + " | " + err
          ));
        }
        else {

          var groupIds = Object.keys(groups) ;

          debug(chalkLog("GROUPS CONFIG INIT COMPLETE"
            + " | " + groupIds.length + " GROUPS"
          ));

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
                console.log(chalkLog("GROUPS CONFIG UPDATE COMPLETE"));
                callback(null, {groups: groupIds.length});
              }
            }
          );
        }
      });
    }
  });
}

var updateEntityChannelGroups = function (path, configFile, callback){

  debug(chalkInfo("UPDATE ENTITIES " + configFile));

  getFileMetadata(path, configFile, function(err, response){

    var entitiesFileClientModifiedMoment = moment(new Date(response.client_modified));
  
    if (entitiesFileClientModifiedMoment.isSameOrBefore(prevEntitiesFileClientModifiedMoment)){
      debug(chalkInfo("ENTITIES FILE BEFORE OR EQUAL"
        + " | PREV: " + prevEntitiesFileClientModifiedMoment.format(compactDateTimeFormat)
        + " | " + entitiesFileClientModifiedMoment.format(compactDateTimeFormat)
      ));

      // callback(null, "ENTITIES FILE " + path + "/" + configFile + " NOT MODIFIED");
      callback(null, {entities: 0});
    }
    else {
      console.log(chalkInfo("ENTITIES FILE AFTER"
        + " | PREV: " + prevEntitiesFileClientModifiedMoment.format(compactDateTimeFormat)
        + " | CURRENT: " + entitiesFileClientModifiedMoment.format(compactDateTimeFormat)
      ));

      console.log(chalkInfo("UPDATING ENTITIES | " + path + "/" + configFile));

      prevEntitiesFileClientModifiedMoment = moment(entitiesFileClientModifiedMoment);

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
                callback(null, { entities: entityChannelIds.length });
                return;
              }
            }
          );

        }
      });  
    }
  });
}

var updateKeywords = function (folder, file, callback){

  var kwHashMap = new HashMap();
  var prevKwHashMap = new HashMap();

  kwHashMap.copy(keywordHashMap);
  debug(chalkInfo("UPDATE KEYWORDS " + file));

  getFileMetadata(folder, file, function(err, response){

    var keywordFileClientModifiedMoment = moment(new Date(response.client_modified));

    if (keywordFileClientModifiedMoment.isSameOrBefore(prevKeywordModifiedMoment)){
      debug(chalkInfo("KEYWORD FILE BEFORE OR EQUAL"
        + " | PREV: " + prevKeywordModifiedMoment.format(compactDateTimeFormat)
        + " | " + keywordFileClientModifiedMoment.format(compactDateTimeFormat)
      ));

      // callback(null, "KEYWORD FILE " + folder + "/" + file + " NOT MODIFIED");
      callback(null, {keywords: 0});
    }
    else {
      console.log(chalkInfo("=== KEYWORD FILE AFTER"
        + " | PREV: " + prevKeywordModifiedMoment.format(compactDateTimeFormat)
        + " | " + keywordFileClientModifiedMoment.format(compactDateTimeFormat)
      ));

      console.log(chalkInfo("=== UPDATING KEYWORDS | " + folder + "/" + file));

      prevKeywordModifiedMoment = moment(keywordFileClientModifiedMoment);

      loadFile(folder, file, function(err, kwordsObj){

        if (err) {
          console.log(chalkError("LOAD FILE ERROR"
            + " | " + file
            + " | " + err
          ));
          callback(null, null);
        }
        else {

          console.log(chalkInfo("UPDATER | LOADED"
            + " | " + file
          ));

          var words = Object.keys(kwordsObj);

          kwHashMap.clear();

          async.forEach(words,

            function(w, cb) {

              var wd = w.toLowerCase();
              wd = wd.replace(/\./g, "");  // KLUDGE:  better way to handle '.' in keywords?

              var kwObj = kwordsObj[w];  // kwObj = { "negative": 10, "right": 7 }

              // debug(chalkInfo("UPDATING KEYWORD | " + wd + ": " + keyWordType));
              debug(chalkInfo("UPDATER: UPDATING KEYWORD | " + wd + ": " + jsonPrint(kwObj)));

              var wordObj = new Word();

              wordObj.nodeId = wd;
              wordObj.isKeyword = true;

              // KLUDEGE: OVERWRITES ANY PREVIOUS KEYWORD SETTINGS FOR NOW
              wordObj.keywords = {};

              if (typeof kwObj === "string") {  // old style keyword: true/false; convert to new style
                wordObj.keywords[kwObj.toLowerCase()] = DEFAULT_KEYWORD_VALUE;
              }
              else {
                wordObj.keywords = kwObj;
              }

              kwHashMap.set(wordObj.nodeId, wordObj.keywords);

              wordServer.findOneWord(wordObj, false, function(err, updatedWordObj) {
                if (err){
                  console.log(chalkError("ERROR: UPDATING KEYWORD | " + wd + ": " + kwordsObj[wd]));
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
                console.log(chalkError("initKeywords ERROR! " + err));
                callback(err, null);
              }
              else {
                console.log(chalkInfo("=== KEYWORD UPDATE COMPLETE"
                  + " | TOTAL KEYWORDS:   " + kwHashMap.count()
                ));

                keywordHashMap.copy(kwHashMap);
                callback(null, { keywords: words.length });
              }
            }
          )
        }
      });
    }
  });
}

function updateGroupsEntitiesKeywords(options, callback){
  async.series([
    function(cb){ updateGroups("", options.groupsFile, cb) },
    function(cb){ updateEntityChannelGroups("", options.entitiesFile, cb) },
    function(cb){ updateKeywords("", options.keywordsFile, cb) }
  ],
    function(err, results){
      if (err) {
        console.log(chalkError("updateGroupsEntitiesKeywords ERROR\n" + err));
      }
      else {
        debug(chalkInfo("updateGroupsEntitiesKeywords COMPLETE"
          // + "\n" + jsonPrint(results)
        ));
      }
      callback(err, results);
    });
}

function sendHashMaps(results, callback){

  debug(chalkInfo("START SEND HASHMAPS"
    // + "\n" + jsonPrint(results)
  ));
  async.eachSeries(results, function(result, cb) {
    var resultKeys = Object.keys(result);
    if (result[resultKeys[0]] === 0){
      debug(chalkInfo("NO UPDATES FOR " + resultKeys[0] + " SKIPPING ..."));
      // console.log(chalkInfo("NO UPDATES FOR " + jsonPrint(results)));
      cb();
    }
    else {
      switch (resultKeys[0]) {
        case "groups":
          debug(chalkInfo("UPDATE GROUPS " + result[resultKeys[0]]));
          sendGroups(function(){ cb(); });
        break;
        case "entities":
          debug(chalkInfo("UPDATE ENTITIES " + result[resultKeys[0]]));
          sendEntities(function(){ cb(); });
        break;
        case "keywords":
          debug(chalkInfo("UPDATE KEYWORDS " + result[resultKeys[0]]));
          sendKeywords(function(){ cb(); });
        break;
        default:
          debug(chalkError("UNKNOWN DATA TYPE " + resultKeys[0] + " " + result[resultKeys[0]]));
          cb(resultKeys[0]);
      }
    }
  },
  function(err){
    if (err) {
      console.log(chalkError("sendHashMaps ERROR! " + err));
      callback(err, null);
    }
    else {
      debug(chalkInfo("sendHashMaps COMPLETE"
        + " | G: " + results[0].groups
        + " | E: " + results[0].entities
        + " | K: " + results[0].keywords
        // + "\n" + jsonPrint(results)
      ));
      callback(err, null);
    }
  });
}

function sendGroups(callback){

  debug(chalkInfo("sendGroups START"));

  var groupIds = groupHashMap.keys();

  async.forEachSeries(groupIds, function(groupId, cb) {

      var groupObj = groupHashMap.get(groupId);

      setTimeout(function(){
        process.send({ type: 'group', groupId: groupId, group: groupObj}, function(err){
          if (err){
            console.log(chalkError("sendGroups ERROR\n" + err));
            cb(err);
          }
          else {
            debug(chalkInfo("UPDATER SENT GROUP"
              + " | " + groupId
            ));
            cb();
          }
        });

      }, 20);

    },

    function(err) {
      if (err) {
        console.log(chalkError("sendGroups ERROR! " + err));
        callback(err, null);
      }
      else {
        debug(chalkInfo("sendGroups COMPLETE | " + groupIds.length + " KEYWORDS"));
        process.send({ type: 'sendGroupsComplete'});
        callback(null, null);
      }
    }
  );
}

function sendEntities(callback){

  debug(chalkInfo("sendEntities START"));

  var entityIds = entityChannelGroupHashMap.keys();
  // var serverEntityIds = serverEntityChannelGroupHashMap.keys();

  async.forEachSeries(entityIds, function(entityId, cb) {

      var entityObj = entityChannelGroupHashMap.get(entityId);

      setTimeout(function(){
        process.send({ type: 'entity', entityId: entityId, entity: entityObj});
        debug(chalkInfo("UPDATER SENT ENTITY"
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
        debug(chalkInfo("sendEntities COMPLETE | " + entityIds.length + " KEYWORDS"));
        process.send({ type: 'sendEntitiesComplete'});
        callback(null, null);
      }
    }
  );
}

function sendKeywords(callback){

  debug(chalkInfo("sendKeywords START"));

  var words = keywordHashMap.keys();

  async.forEachSeries(

    words,

    function(word, cb) {

      debugKeyword(chalkInfo("sendKeywords\nword: " + jsonPrint(word)));

      // updaterObj = {
      //  "type" : "keyword",
      //  "target" : "server",
      //  "keyword: {
      //    "keywordId": obama",
      //    "positive": 10, 
      //    "left": 7
      //   }
      // };

      var kwObj = keywordHashMap.get(word);
      kwObj.keywordId = word;

      var updaterObj = {};
      updaterObj.type = "keyword";
      updaterObj.keyword = {};
      updaterObj.keyword = kwObj;

      setTimeout(function(){
        process.send(updaterObj);
        debugKeyword(chalkInfo("UPDATER SEND KEYWORD"
          + " | " + word
          + " | " + jsonPrint(updaterObj)
        ));

        cb();
      }, 20);

    },

    function(err) {
      if (err) {
        console.log(chalkError("sendKeywords ERROR! " + err));
        callback(err, null);
      }
      else {
        debug(chalkInfo("sendKeywords COMPLETE | " + words.length + " KEYWORDS"));
        process.send({ type: 'sendKeywordsComplete'});
        callback(null, null);
      }
    }
  );
}

function updateGroupsInterval(options){

  clearInterval(initGroupsInterval);

  console.log(chalkInfo("UPDATER: *** START updateGroupsInterval"
    + "\n" + jsonPrint(options)
  ));

  updateGroupsEntitiesKeywords(options, function(err, results){
    debug(chalk.blue("UPDATER: ===> updateGroupsInterval <==="
      + "\n" + jsonPrint(options)
    ));
    initGroupsReady = false;
    if (err) {
      initGroupsReady = true;
    }
    else {
      sendHashMaps(results, function(err2, results2){
        initGroupsReady = true;
      });
    }
  });

  initGroupsInterval = setInterval(function() {

    if (initGroupsReady) {
      debug(chalk.blue("UPDATER: ===> updateGroupsInterval <==="
        + "\n" + jsonPrint(options)
      ));
      initGroupsReady = false;
      updateGroupsEntitiesKeywords(options, function(err, results){
        if (err) {
          initGroupsReady = true;
        }
        else {
          sendHashMaps(results, function(err2, results2){
            initGroupsReady = true;
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
  return currentTimeStamp.format("YYYY-MM-DD HH:mm:ss ZZ");
}

function loadConfig(file, callback){

  console.log(chalkInfo("LOADING CONFIG " + file));

  var options = {};
  options.path = '/' + file;

  dropboxClient.filesDownload(options)
    .then(function(configJson) {
      console.log(chalkLog(getTimeStamp()
        + " | LOADING CONFIG FROM DROPBOX FILE: " + file
      ));

      var configObj = JSON.parse(configJson.fileBinary);

      // console.log("UPDATER: DROPBOX CONFIG\n" + JSON.stringify(configObj, null, 3));

      debug(chalkLog(getTimeStamp() + " | FOUND " + configObj.timeStamp));

      return(callback(null, configObj));
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
          console.log(chalkError("DB ADMIN COUNTER ERROR\n" + jsonPrint(err)));
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
          console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
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
          console.log(chalkError("DB VIEWER COUNTER ERROR\n" + jsonPrint(err)));
          cb(err, null);
        }
        else {
          statsObj.db.totalViewers = count;
          cb(null, count);
        }
      });
    },
    totalSessions: function (cb) {
      Session.count({}, function(err, count) {
        if (err) {
          console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
          cb(err, null);
        }
        else {
          statsObj.db.totalSessions = count;
          cb(null, count);
        }
      });
    },
    totalWords: function (cb) {
      Word.count({}, function(err, count) {
        if (err) {
          console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
          cb(err, null);
        }
        else {
          statsObj.db.totalWords = count;
          cb(null, count);
        }
      });
    },
    totalGroups: function (cb) {
      Group.count({}, function(err, count) {
        if (err) {
          console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
          cb(err, null);
        }
        else {
          statsObj.db.totalGroups = count;
          cb(null, count);
        }
      });
    },
    totalEntities: function (cb) {
      Entity.count({}, function(err, count) {
        if (err) {
          console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
          cb(err, null);
        }
        else {
          statsObj.db.totalEntities = count;
          cb(null, count);
        }
      });
    }
  },
  function(err, results) { //async.parallel callback
    if (err) {
      console.log(chalkError("\n" + moment().format(compactDateTimeFormat) 
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
        if (err) { console.log(chalkError("STATS COUNTS ERROR\n" + jsonPrint(err))); }
        debug(chalkRed("STATS COUNTS\n" + jsonPrint(results)));
        process.send({ type: 'stats', db: results}, function(err){
          statsCountsComplete = true;
          if (err){
            console.log(chalkError("STATS SEND ERROR\n" + err));
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

function initGroups(dropboxConfigFile, callback){

  debug(chalkInfo("INIT GROUPS"));

  loadConfig(dropboxConfigFile, function(err, loadedConfigObj){
    if (!err) {
      console.log(chalkInfo("UPDATER | LOADED"
        + " | " + dropboxConfigFile
      ));
      return(callback(err, loadedConfigObj));
    }
    else {
      // console.error(dropboxConfigFile + "\n" + jsonPrint(err));
      return(callback(err, loadedConfigObj));
     }
  });
}

function initEntityChannelGroups(dropboxConfigFile, callback){
  loadConfig(dropboxConfigFile, function(err, loadedConfigObj){
    if (!err) {
      console.log(chalkInfo("UPDATER | LOADED"
        + " | " + dropboxConfigFile
      ));
      return(callback(err, loadedConfigObj));
    }
    else {
      return(callback(err, loadedConfigObj));
     }
  });
}
