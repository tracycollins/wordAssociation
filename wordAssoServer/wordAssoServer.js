/*jslint node: true */
"use strict";

var wapiForceSearch = true;

var ioReady = false
var groupsUpdateComplete = false;
var entitiesUpdateComplete = false;
var keywordsUpdateComplete = false;
var updateComplete = groupsUpdateComplete && entitiesUpdateComplete && keywordsUpdateComplete;

var serverHeartbeatInterval;
var pollGetTwitterFriendsInterval;

var cp = require('child_process');
var updater;

var Twit = require('twit');
var twit;
var twitterStream;
var twitterDirectMessageEnabled = false;

var unirest = require('unirest');

var debug = require('debug')('wa');
var debugWapi = require('debug')('wapi');
var debugAppGet = require('debug')('appGet');

var GROUP_UPDATE_INTERVAL = 60000;
var saveStatsInterval = 10000; // millis

var MAX_RESPONSE_QUEUE_SIZE = 250;

var OFFLINE_MODE = false;
var quitOnError = false;

var serverReady = false;
var internetReady = false;

var minServerResponseTime = 247;
var maxServerResponseTime = 1447;

var pollTwitterFriendsIntervalTime = 5*ONE_MINUTE;

var TRENDING_CACHE_DEFAULT_TTL = 300; // seconds
var GROUP_CACHE_DEFAULT_TTL = 300; // seconds
var ENTITY_CACHE_DEFAULT_TTL = 300; // seconds
var SESSION_CACHE_DEFAULT_TTL = 300; // seconds
var WORD_CACHE_TTL = 60; // seconds
var MONITOR_CACHE_TTL = 300; // seconds

var MAX_WORDCHAIN_LENGTH = 10;
var MIN_CHAIN_FREEZE_LENGTH = 20;
var MIN_CHAIN_FREEZE_UNIQUE_NODES = 10;

var BHT_REQUEST_LIMIT = 250000;
var MW_REQUEST_LIMIT = 250000;
var WAPI_REQUEST_LIMIT = 25000;
var WAPI_REQ_RESERVE_PRCNT = 0.30;


var SESSION_WORDCHAIN_REQUEST_LIMIT = 25;


// ==================================================================
// TEST CONFIG
// ==================================================================
var testMode = false;
var bhtOverLimitTestFlag = false;
var wapiOverLimitTestFlag = false;

// ==================================================================
// SESSION MODES: RANDOM, ANTONYM, SYNONYM, SCRIPT, USER_USER, GROUP, STREAM  ( session.config.mode )
// ==================================================================

var sessionModes = ["RANDOM", "ANTONYM", "SYNONYM", "SCRIPT", "USER_USER", "GROUP"];
var enabledSessionModes = ["ANTONYM", "SYNONYM"];
// var enabledSessionModes = [ "USER_USER" ];

var DEFAULT_SESSION_MODE = 'RANDOM';
var defaultSessionMode = DEFAULT_SESSION_MODE;

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

var moment = require('moment');

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var S = require('string');

var os = require('os');

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, '');
hostname = hostname.replace(/word0-instance-1/g, 'google');

var config = require('./config/config');
var util = require('util');

var express = require('./config/express');
var mongoose = require('./config/mongoose');

var request = require('request');
var fs = require('fs');
var yaml = require('yamljs');

var async = require('async');
var HashMap = require('hashmap').HashMap;

var EventEmitter2 = require('eventemitter2').EventEmitter2;
var EventEmitter = require("events").EventEmitter;

var groupHashMap = new HashMap();
var serverGroupHashMap = new HashMap(); // server specific keywords

var entityChannelGroupHashMap = new HashMap();
var serverEntityChannelGroupHashMap = new HashMap();

var keywordHashMap = new HashMap();
var serverKeywordHashMap = new HashMap(); // server specific keywords
var topicHashMap = new HashMap();

var serverGroupsJsonObj = {};
var serverKeywordsJsonObj = {};

// ==================================================================
// SERVER STATUS
// ==================================================================
var upTime = os.uptime() * 1000;
var memoryTotal = os.totalmem();
var memoryAvailable = os.freemem();

var currentTime = moment();
var startTime = moment();
var runTime = 0;

var currentTimeInteval = setInterval(function() {
  currentTime = moment();
}, 100);

var tempDateTime = moment();
var txHeartbeat = {};
var heartbeatsSent = 0;

var numberIpAddresses = 0;

var numberUsersMax = 0;
var numberUsersMaxTime = moment().valueOf();

var numberTestUsersMax = 0;
var numberTestUsersMaxTime = moment().valueOf();

var numberUsersTotalMax = 0;
var numberUsersTotalMaxTime = moment().valueOf();

var numberUtilsMax = 0;
var numberUtilsMaxTime = moment().valueOf();

var numberViewersMax = 0;
var numberViewersMaxTime = moment().valueOf();

var numberTestViewersMax = 0;
var numberTestViewersMaxTime = moment().valueOf();

var numberViewersTotalMax = 0;
var numberViewersTotalMaxTime = moment().valueOf();

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

console.log("OFFLINE_MODE: " + OFFLINE_MODE);


// ==================================================================
// WORD ASSO STATUS
// ==================================================================
var totalSessions = 0;
var totalUsers = 0;
var totalClients = 0;
var totalWords = 0;
var totalEntities = 0;
var totalGroups = 0;

var promptsSent = 0;
var responsesReceived = 0;
var sessionUpdatesSent = 0;

var bhtWordsMiss = {};
var bhtWordsNotFound = {};

var mwDictWordsMiss = {};
var mwDictWordsNotFound = {};

var mwThesWordsMiss = {};
var mwThesWordsNotFound = {};

var statsObj = {

  "name": "Word Association Server Status",
  "host": os.hostname(),
  "timeStamp": moment().format(defaultDateTimeFormat),
  "runTimeArgs": process.argv,

  "startTime": startTime,
  "runTime": runTime,

  "totalClients": 0,
  "totalUsers": 0,
  "totalSessions": 0,
  "totalWords": 0,

  "socket": {},

  "promptsSent": 0,
  "responsesReceived": 0,
  "deltaResponsesReceived": 0,
  "sessionUpdatesSent": 0,

  "bhtRequests": 0,
  "bhtWordsNotFound": {},

  "mwRequests": 0,
  "mwDictWordsMiss": {},
  "mwDictWordsNotFound": {},
  "mwThesWordsMiss": {},
  "mwThesWordsNotFound": {},

  "session": {},

  "chainFreezes": 0,

  "heartbeat": txHeartbeat
};

statsObj.wapi = {};
statsObj.wapi.totalRequests = 0;
statsObj.wapi.requestLimit = 25000;
statsObj.wapi.requestsRemaining = 25000;

statsObj.group = {};
statsObj.group.errors = 0;
statsObj.group.hashMiss = {};
statsObj.group.allHashMisses = {};

statsObj.session.errors = 0;
statsObj.session.previousPromptNotFound = 0;
statsObj.session.responseError = 0;

statsObj.socket.connects = 0;
statsObj.socket.reconnects = 0;
statsObj.socket.disconnects = 0;
statsObj.socket.errors = 0;

statsObj.entityChannelGroup = {};
statsObj.entityChannelGroup.hashMiss = {};
statsObj.entityChannelGroup.allHashMisses = {};
// ==================================================================
// LOGS, STATS
// ==================================================================
var chalk = require('chalk');

var chalkRedBold = chalk.bold.red;
var chalkTwitter = chalk.red;
var chalkWapi = chalk.red;
var chalkWapiBold = chalk.bold.red;
var chalkViewer = chalk.cyan;
var chalkUser = chalk.green;
var chalkUtil = chalk.blue;
var chalkRed = chalk.red;
var chalkGreen = chalk.green;
var chalkAdmin = chalk.bold.cyan;
var chalkConnectAdmin = chalk.bold.cyan;
var chalkConnect = chalk.green;
var chalkDisconnect = chalk.red;
var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.red;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;
var chalkSession = chalk.blue;
var chalkPrompt = chalk.blue;
var chalkResponse = chalk.blue;
var chalkBht = chalk.gray;
var chalkMw = chalk.yellow;
var chalkDb = chalk.gray;
var chalkGoogle = chalk.green;

var serverSessionConfig = {};
var configChangeFlag = false;


var configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on('newListener', function(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});


var adminIpHashMap = new HashMap();
var adminSocketIdHashMap = new HashMap();

var numberAdminsTotal = 0;
var numberAdmins = 0;

var numberUtils = 0;
var numberUsers = 0;
var numberViewers = 0;
var numberTestViewers = 0;
var numberTestUsers = 0;

var dnsHostHashMap = new HashMap();
var localHostHashMap = new HashMap();


// ==================================================================
// ADMIN
// ==================================================================

localHostHashMap.set('::ffff:127.0.0.1', 'threeceelabs.com');
localHostHashMap.set('127.0.0.1', 'threeceelabs.com');
localHostHashMap.set('::1', 'threeceelabs.com');
localHostHashMap.set('::1', 'threeceelabs.com');

localHostHashMap.set('macpro.local', 'threeceelabs.com');
localHostHashMap.set('macpro2.local', 'threeceelabs.com');
localHostHashMap.set('mbp.local', 'threeceelabs.com');
localHostHashMap.set('mbp2.local', 'threeceelabs.com');
localHostHashMap.set('macminiserver0.local', 'threeceelabs.com');
localHostHashMap.set('macminiserver1.local', 'threeceelabs.com');
localHostHashMap.set('macminiserver2.local', 'threeceelabs.com');
localHostHashMap.set('mms0.local', 'threeceelabs.com');
localHostHashMap.set('mms1.local', 'threeceelabs.com');
localHostHashMap.set('mms2.local', 'threeceelabs.com');

localHostHashMap.set('::ffff:10.0.1.4', 'threeceelabs.com');
localHostHashMap.set('::ffff:10.0.1.10', 'threeceelabs.com');
localHostHashMap.set('::ffff:10.0.1.27', 'threeceelabs.com');
localHostHashMap.set('::ffff:10.0.1.45', 'threeceelabs.com');
localHostHashMap.set('10.0.1.4', 'threeceelabs.com');
localHostHashMap.set('10.0.1.10', 'threeceelabs.com');
localHostHashMap.set('10.0.1.27', 'threeceelabs.com');

localHostHashMap.set('104.197.93.13', 'threeceelabs.com');

// ==================================================================
// WAPI WAPI_REQ_RESERVE_PRCNT
// ==================================================================
var wapiReqReservePercent = process.env.WAPI_REQ_RESERVE_PRCNT;

if (typeof wapiReqReservePercent === 'undefined') wapiReqReservePercent = WAPI_REQ_RESERVE_PRCNT;
console.log("WAPI_REQ_RESERVE_PRCNT: " + wapiReqReservePercent);


var NodeCache = require("node-cache");

var adminCache = new NodeCache();
var viewerCache = new NodeCache();
var userCache = new NodeCache();
var utilCache = new NodeCache();
// var monitorCache = new NodeCache();

// ==================================================================
// TWITTER TRENDING TOPIC CACHE
// ==================================================================
var trendingCacheTtl = process.env.TRENDING_CACHE_DEFAULT_TTL;

if (typeof trendingCacheTtl === 'undefined') trendingCacheTtl = TRENDING_CACHE_DEFAULT_TTL;
console.log("TRENDING CACHE TTL: " + trendingCacheTtl + " SECONDS");

// ==================================================================
// GROUP CACHE
// ==================================================================
var groupCacheTtl = process.env.GROUP_CACHE_DEFAULT_TTL;

if (typeof groupCacheTtl === 'undefined') groupCacheTtl = GROUP_CACHE_DEFAULT_TTL;
console.log("GROUP CACHE TTL: " + groupCacheTtl + " SECONDS");

// ==================================================================
// ENTITY CACHE
// ==================================================================
var entityCacheTtl = process.env.ENTITY_CACHE_DEFAULT_TTL;

if (typeof entityCacheTtl === 'undefined') entityCacheTtl = ENTITY_CACHE_DEFAULT_TTL;
console.log("ENTITY CACHE TTL: " + entityCacheTtl + " SECONDS");

// ==================================================================
// SESSION CACHE
// ==================================================================
var sessionCacheTtl = process.env.SESSION_CACHE_DEFAULT_TTL;

if (typeof sessionCacheTtl === 'undefined') sessionCacheTtl = SESSION_CACHE_DEFAULT_TTL;
console.log("SESSION CACHE TTL: " + sessionCacheTtl + " SECONDS");

// ==================================================================
// WORD CACHE
// ==================================================================
var wordCacheTtl = process.env.WORD_CACHE_TTL;

if (typeof wordCacheTtl === 'undefined') wordCacheTtl = WORD_CACHE_TTL;
console.log("WORD CACHE TTL: " + wordCacheTtl + " SECONDS");


var monitorHashMap = {};

var trendingCache = new NodeCache({
  stdTTL: trendingCacheTtl,
  checkperiod: 10
});

var wordCache = new NodeCache({
  stdTTL: wordCacheTtl,
  checkperiod: 10
});

var sessionCache = new NodeCache({
  useClones: false,
  stdTTL: sessionCacheTtl,
  checkperiod: 30
});

var entityCache = new NodeCache({
  stdTTL: entityCacheTtl,
  checkperiod: 30
});

var groupCache = new NodeCache({
  stdTTL: groupCacheTtl,
  checkperiod: 30
});

// ==================================================================
// CACHE HANDLERS
// ==================================================================
sessionCache.on("set", function(sessionId, sessionObj) {
  // console.log(chalkRedBold("sessionCache SET: "
  //   + sessionId 
  //   + " \n" + jsonPrint(sessionObj.tags)
  // ));
});

sessionCache.on("expired", function(sessionId, sessionObj) {
  sessionQueue.enqueue({
    sessionEvent: "SESSION_EXPIRED",
    sessionId: sessionId,
    session: sessionObj
  });

  io.of(sessionObj.namespace).to(sessionId).emit('SESSION_EXPIRED', sessionId);

  sessionObj.sessionEvent = 'SESSION_DELETE';

  viewNameSpace.emit("SESSION_DELETE", sessionObj);

  debug("CACHE SESSION EXPIRED\n" + jsonPrint(sessionObj));
  console.log(chalkInfo("... CACHE SESS EXPIRED"
    + " | " + sessionObj.sessionId 
    + " | NSP: " + sessionObj.namespace 
    + " | NOW: " + getTimeStamp() 
    + " | LS: " + getTimeStamp(sessionObj.lastSeen) 
    + " | " + msToTime(moment().valueOf() - sessionObj.lastSeen) 
    + " | WCI: " + sessionObj.wordChainIndex 
    + " | WCL: " + sessionObj.wordChain.length 
    + " | K: " + sessionCache.getStats().keys 
    + " | H: " + sessionCache.getStats().hits 
    + " | M: " + sessionCache.getStats().misses));
});

wordCache.on("set", function(word, wordObj) {
  // debugWapi("CACHE WORD EXPIRED\n" + jsonPrint(wordObj));
  debugWapi(chalkWapi("CACHE WORD SET"
    + " [ Q: " + wapiSearchQueue.size() 
    + " ] " + wordObj.nodeId 
    + " | LS: " + getTimeStamp(wordObj.lastSeen) 
    + " | " + msToTime(moment().valueOf() - wordObj.lastSeen) 
    + " | M: " + wordObj.mentions 
    + " | WAPIS: " + wordObj.wapiSearched 
    + " | WAPIF: " + wordObj.wapiFound 
    + " | K: " + wordCache.getStats().keys 
    + " | H: " + wordCache.getStats().hits 
    + " | M: " + wordCache.getStats().misses
  ));

  if (!wapiOverLimitFlag && (wapiForceSearch || !wordObj.wapiSearched)){
    wapiSearchQueue.enqueue(wordObj);
  }
});

wordCache.on("expired", function(word, wordObj) {
  if (typeof wordObj !== 'undefined') {
    // debug("CACHE WORD EXPIRED\n" + jsonPrint(wordObj));
    debug("... CACHE WORD EXPIRED"
      + " | " + wordObj.nodeId 
      + " | LS: " + getTimeStamp(wordObj.lastSeen) 
      + " | " + msToTime(moment().valueOf() - wordObj.lastSeen) 
      + " | M: " + wordObj.mentions 
      + " | K: " + wordCache.getStats().keys 
      + " | H: " + wordCache.getStats().hits 
      + " | M: " + wordCache.getStats().misses);
  } else {
    debug(chalkError("??? UNDEFINED wordObj on wordCache expired ???"));
  }
});

trendingCache.on( "expired", function(topic, topicObj){
  debug("CACHE TOPIC EXPIRED\n" + jsonPrint(topicObj));
  console.log("CACHE TOPIC EXPIRED | " + topicObj.name);
});



// ==================================================================
// WORDS API
// ==================================================================
var wordsApiKey = "e1b4564ec38d2db399dabdf83a8beeeb";
var wapiEvents = new EventEmitter();
var wapiErrors = 0;
var wapiRequests = 0;
var wapiOverLimits = 0;

var wapiOverLimitTime = moment.utc().endOf('day');
var wapiLimitResetTime = moment.utc().endOf('day');
var wapiTimeToReset = moment.utc().endOf('day').valueOf() - moment.utc().valueOf();
var wapiOverLimitFlag = false;

debug("WAPI OVER LIMIT TIME:  " + wapiOverLimitTime.format(defaultDateTimeFormat));
debug("WAPI OVER LIMIT RESET: " + wapiOverLimitTime.format(defaultDateTimeFormat));
debug("WAPI TIME TO RESET: " + msToTime(wapiTimeToReset));

var wapiOverLimitTimeOut = setTimeout(function() {
  wapiEvents.emit("WAPI_OVER_LIMIT_TIMEOUT");
}, wapiTimeToReset);


// ==================================================================
// BIG HUGE THESAURUS
// ==================================================================
var bigHugeLabsApiKey = "e1b4564ec38d2db399dabdf83a8beeeb";
// var bigHugeThesaurusUrl = "http://words.bighugelabs.com/api/2/" + bigHugeLabsApiKey + "/";
var bhtEvents = new EventEmitter();
var bhtErrors = 0;
var bhtRequests = 0;
var bhtOverLimits = 0;

var bhtOverLimitTime = moment.utc().utcOffset("-07:00").endOf('day');
var bhtLimitResetTime = moment.utc().utcOffset("-07:00").endOf('day');
var bhtTimeToReset = moment.utc().utcOffset("-07:00").endOf('day').valueOf() - moment.utc().utcOffset("-07:00").valueOf();
var bhtOverLimitFlag = false;

debug("BHT OVER LIMIT TIME:  " + bhtOverLimitTime.format(defaultDateTimeFormat));
debug("BHT OVER LIMIT RESET: " + bhtOverLimitTime.format(defaultDateTimeFormat));
debug("BHT TIME TO RESET: " + msToTime(bhtTimeToReset));

var bhtOverLimitTimeOut = setTimeout(function() {
  bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
}, bhtTimeToReset);


// ==================================================================
// MERRIAM-WEBSTER
// ==================================================================
var mwEvents = new EventEmitter();
var mwErrors = 0;
var mwRequests = 0;
var mwRequestLimit = MW_REQUEST_LIMIT;
var mwOverLimits = 0;

var mwOverLimitTime = moment.utc().utcOffset("-05:00").endOf('day');
var mwLimitResetTime = moment.utc().utcOffset("-05:00").endOf('day');
var mwTimeToReset = moment.utc().utcOffset("-05:00").endOf('day').valueOf() - moment.utc().utcOffset("-05:00").valueOf();
var mwOverLimitFlag = false;

debug("MW OVER LIMIT TIME:  " + mwOverLimitTime.format(defaultDateTimeFormat));
debug("MW OVER LIMIT RESET: " + mwOverLimitTime.format(defaultDateTimeFormat));
debug("MW TIME TO RESET: " + msToTime(mwTimeToReset));

var mwOverLimitTimeOut = setTimeout(function() {
  mwEvents.emit("MW_OVER_LIMIT_TIMEOUT");
}, mwTimeToReset);



// ==================================================================
// ENV INIT
// ==================================================================
// var debug = require('debug')('wa');
// var debugAppGet = require('debug')('wa:appGet');

if (debug.enabled) {
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

console.log('NODE_ENV BEFORE: ' + process.env.NODE_ENV);

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('NODE_ENV : ' + process.env.NODE_ENV);
console.log('CLIENT HOST + PORT: ' + 'http://localhost:' + config.port);



var statsFile;

// ==================================================================
// OFFLINE MODE
// ==================================================================
var OFFLINE_WORD_ASSO_STATS_FILE = process.env.OFFLINE_WORD_ASSO_STATS_FILE || 'wordAssociationStats.json';
console.log("OFFLINE_WORD_ASSO_STATS_FILE :" + OFFLINE_WORD_ASSO_STATS_FILE);
var offlineStatsFile = os.hostname() + "_" + OFFLINE_WORD_ASSO_STATS_FILE;
console.log("offlineStatsFile: " + offlineStatsFile);

// ==================================================================
// DROPBOX
// ==================================================================
var DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
var DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
var DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;
var WA_STATS_FILE = process.env.WA_STATS_FILE;

var dropboxHostStatsFile = "/stats/" + os.hostname() + "/" + os.hostname() + "_" + process.pid + "_" + WA_STATS_FILE;

var Dropbox = require("dropbox");

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var serverGroupsFile = hostname + '_groups.json';
var serverEntitiesFile = hostname + '_entities.json';
var serverKeywordsFile = hostname + '_keywords.json';

var dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

if (OFFLINE_MODE) {
  statsFile = offlineStatsFile;
} else {
  statsFile = dropboxHostStatsFile;
}

function loadYamlConfig(yamlFile, callback){
  console.log(chalkInfo("LOADING YAML CONFIG FILE: " + yamlFile));
  fs.exists(yamlFile, function(exists) {
    if (exists) {
      var cnf = yaml.load(yamlFile);
      console.log(chalkInfo("FOUND FILE " + yamlFile));
      callback(null, cnf);
    }
    else {
      var err = "FILE DOES NOT EXIST: " + yamlFile ;
      callback(err, null);
    }
  });
}

function loadFile(path, file, callback) {

  console.log(chalkInfo("LOAD FOLDER " + path));
  console.log(chalkInfo("LOAD FILE " + file));
  console.log(chalkInfo("FULL PATH " + path + "/" + file));

  var fileExists = false;

  dropboxClient.filesListFolder({path: path, recursive: false})
    .then(function(response) {

        async.each(response.entries, function(folderFile, cb) {

          if (folderFile.name == file) {
            console.log(chalkInfo("SOURCE FILE EXISTS: " + file));
            fileExists = true;
            return cb();
          }
          cb();

        }, function(err) {

          if (fileExists) {

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
                  console.log(chalkError("!!! DROPBOX READ FILE " + file + " NOT FOUND ... SKIPPING ..."));
                  return(callback(null, null));
                }
                if (error["status"] === 0) {
                  console.log(chalkError("!!! DROPBOX NO RESPONSE ... NO INTERNET CONNECTION? ... SKIPPING ..."));
                  return(callback(null, null));
                }
                return(callback(error, null));
              });
          }
          else {
            console.log(chalkError("*** FILE DOES NOT EXIST: " + path + "/" + file));
            var err = {};
            err.status = "FILE DOES NOT EXIST";
            return(callback(err, null));
          }
        });
    })
    .catch(function(error) {
      console.log(chalkError("LOAD FILE ERROR\n" + jsonPrint(error)));
      return(callback(error, null));
    });
}


function saveFile (path, file, jsonObj, callback){

  var fullPath = path + "/" + file;

  console.log(chalkInfo("LOAD FOLDER " + path));
  console.log(chalkInfo("LOAD FILE " + file));
  console.log(chalkInfo("FULL PATH " + fullPath));

  var options = {};

  options.contents = JSON.stringify(jsonObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(response){
      debug(chalkLog("... SAVED DROPBOX JSON | " + options.path));
      callback(null, response);
    })
    .catch(function(error){
      console.log(chalkError(moment().format(defaultDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
        + " ERROR: " + jsonPrint(error)));
      callback(error, null);
    });
}


function dropboxWriteArrayToFile(filePath, dataArray, callback) {

  if (typeof filePath === 'undefined') {
    console.log(chalkError(moment().format(defaultDateTimeFormat) 
      + " | !!! DROPBOX WRITE FILE ERROR: FILE PATH UNDEFINED"));
    callback('FILE PATH UNDEFINED', null);
  }

  var dataString = dataArray.join('\n');

  var options = {};

  options.contents = dataString;
  options.path = filePath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(response){
      debug(chalkLog("... SAVED DROPBOX JSON | " + options.path));
      callback(null, response);
    })
    .catch(function(error){
      console.log(chalkError(moment().format(defaultDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + file 
        + " ERROR: " + error));
      callback(error, null);
    });
}

function saveStats(statsFile, statsObj, callback) {
  if (OFFLINE_MODE) {

    fs.exists(statsFile, function(exists) {
      if (exists) {
        fs.stat(statsFile, function(error, stats) {
          fs.open(statsFile, "w", function(error, fd) {
            fs.writeFile(path, statsObj, function(error) {
              callback('OK');
              fs.close(fd);
            });
          });
        });
      }
    });
  } else {

  var options = {};

  options.contents = JSON.stringify(statsObj, null, 2);
  options.path = statsFile;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(response){
      debug(chalkLog("... SAVED DROPBOX JSON | " + options.path));
      callback('OK');
    })
    .catch(function(error){
      console.log(chalkError(moment().format(defaultDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + file 
        + " ERROR: " + error));
      callback(error);
    });

  }
}

function updateStats(updateObj) {
  for (var key in updateObj) {
    if (updateObj.hasOwnProperty(key)) {
      // debug("UPDATING WORD ASSO STATUS | " + key + ": " + updateObj[key]);
      statsObj[key] = updateObj[key];
    }
  }
}

function loadStats(callback) {
  dropboxClient.filesDownload({path: statsFile})
    .then(function(statsJson) {
      debug(chalkInfo("DROPBOX DROPBOX_NEW_SEARCH_TERMS_FILE\n" + jsonPrint(data)));
      var dataNoSpaces = data.fileBinary.toString().replace(/ /g, "");
      var dataConvertAccent = dataNoSpaces.toString().replace(/Ã©/g, "é");
      var dataConvertTilde = dataConvertAccent.toString().replace(/Ã£/g, "ã");
      var dataArray = dataConvertTilde.toString().split("\n");
      dataArray.forEach(function(searchTerm){
        if (!searchTermHashMap.has(searchTerm)
          && !S(searchTerm).startsWith('#')
          && !S(searchTerm).isEmpty()
          && !searchTerm.match(mangledRegEx)
        ){
          newSearchTermHashMap.set(searchTerm, 1);
          searchTermHashMap.set(searchTerm, 1);
          console.log("+def+ ADDED NEW SEARCH TERM [DROPBOX]: " + searchTerm);
        }
      });
      callbackSeries();
     })
    .catch(function(error) {
      console.log(chalkError("!!! DROPBOX READ WA_STATS_FILE ERROR: " + statsFile));
      console.log(chalkError(jsonPrint(err)));

      if (err.status != 404) {
        console.log(chalkError(jsonPrint(err)));
      } 
      else if (err.status = 404) {

        console.log(chalkError("FILE NOT FOUND ... TRYING DROPBOX READ OF DEFAULT WA_STATS_FILE " + WA_STATS_FILE));

        dropboxClient.filesDownload({path: WA_STATS_FILE})
          .then(function(statsJson) {
            console.log(chalkInfo(
              moment().format(defaultDateTimeFormat) 
              + " | ... LOADING STATS FROM DROPBOX FILE: " + WA_STATS_FILE
            ));

            var statsObj = JSON.parse(statsJson);

            debug("DROPBOX STATS\n" + JSON.stringify(statsObj, null, 3));

            if (typeof statsObj.name === 'undefined') statsObj.name = 'Word Assocition Server Status | ' + os.hostname()

            console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
              + " | FOUND " + statsObj.name));

            if (typeof statsObj.bhtRequests !== 'undefined') {
              console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
                + " | SET DAILY BHT REQUESTS: " + statsObj.bhtRequests));
              bhtRequests = statsObj.bhtRequests;
            }

            if (typeof statsObj.promptsSent !== 'undefined') {
              console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
                + " | SET PROMPTS SENT: " + statsObj.promptsSent));
              promptsSent = statsObj.promptsSent;
            }

            if (typeof statsObj.responsesReceived !== 'undefined') {
              console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
                + " | SET RESPONSES RECEIVED: " + statsObj.responsesReceived));
              responsesReceived = statsObj.responsesReceived;
            }

            statsObj.bhtRequests = bhtRequests;
            statsObj.promptsSent = promptsSent;
            statsObj.responsesReceived = responsesReceived;

            saveStats(statsFile, statsObj, function(status) {
              if (status != 'OK') {
                console.log("!!! ERROR: saveStats " + status);
              } else {
                console.log(chalkLog("UPDATE DROPBOX STATUS OK"));
              }
          });
          })
          .catch(function(error) {
            console.log(chalkError("DROPBOX READ ERROR " + WA_STATS_FILE + " ... SKIPPING"));
            console.log(chalkError(jsonPrint(error)));
            return(error);
          });

      }

      return; //It's important to return so that the task callback isn't called twice
  });

  dropboxClient.readFile(statsFile, function(err, statsJson, callback) {

    if (err) {

      console.log(chalkError("!!! DROPBOX READ WA_STATS_FILE ERROR: " + statsFile));
      console.log(chalkError(jsonPrint(err)));

      if (err.status != 404) {
        console.log(chalkError(jsonPrint(err)));
      } 
      else if (err.status = 404) {

        console.log(chalkError("FILE NOT FOUND ... TRYING DROPBOX READ OF DEFAULT WA_STATS_FILE " + WA_STATS_FILE));

        dropboxClient.readFile(WA_STATS_FILE, function(err, statsJson, callback) {

          if (err){
            console.log(chalkError("DROPBOX READ ERROR " + WA_STATS_FILE + " ... SKIPPING"));
            console.log(chalkError(jsonPrint(err)));
            return(err);
          }

          console.log(chalkInfo(
            moment().format(defaultDateTimeFormat) 
            + " | ... LOADING STATS FROM DROPBOX FILE: " + WA_STATS_FILE
          ));

          var statsObj = JSON.parse(statsJson);

          debug("DROPBOX STATS\n" + JSON.stringify(statsObj, null, 3));

          if (typeof statsObj.name === 'undefined') statsObj.name = 'Word Assocition Server Status | ' + os.hostname()

          console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
            + " | FOUND " + statsObj.name));

          if (typeof statsObj.bhtRequests !== 'undefined') {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
              + " | SET DAILY BHT REQUESTS: " + statsObj.bhtRequests));
            bhtRequests = statsObj.bhtRequests;
          }

          if (typeof statsObj.promptsSent !== 'undefined') {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
              + " | SET PROMPTS SENT: " + statsObj.promptsSent));
            promptsSent = statsObj.promptsSent;
          }

          if (typeof statsObj.responsesReceived !== 'undefined') {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
              + " | SET RESPONSES RECEIVED: " + statsObj.responsesReceived));
            responsesReceived = statsObj.responsesReceived;
          }

          statsObj.bhtRequests = bhtRequests;
          statsObj.promptsSent = promptsSent;
          statsObj.responsesReceived = responsesReceived;

          saveStats(statsFile, statsObj, function(status) {
            if (status != 'OK') {
              console.log("!!! ERROR: saveStats " + status);
            } else {
              console.log(chalkLog("UPDATE DROPBOX STATUS OK"));
            }
          });

        });

      }

      return; //It's important to return so that the task callback isn't called twice
    }

    console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
      + " | ... LOADING STATS FROM FILE: " + statsFile));

    var statsObj = JSON.parse(statsJson);

    console.log("DROPBOX STATS\n" + JSON.stringify(statsObj, null, 3));

    console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
      + " | FOUND " + statsObj.name));

    if (typeof statsObj.bhtRequests !== 'undefined') {
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
        + " | SET DAILY BHT REQUESTS: " + statsObj.bhtRequests));
      bhtRequests = statsObj.bhtRequests;
    }

    if (typeof statsObj.promptsSent !== 'undefined') {
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
        + " | SET PROMPTS SENT: " + statsObj.promptsSent));
      promptsSent = statsObj.promptsSent;
    }

    if (typeof statsObj.responsesReceived !== 'undefined') {
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
        + " | SET RESPONSES RECEIVED: " + statsObj.responsesReceived));
      responsesReceived = statsObj.responsesReceived;
    }

    statsObj.bhtRequests = bhtRequests;
    statsObj.promptsSent = promptsSent;
    statsObj.responsesReceived = responsesReceived;

    saveStats(statsFile, statsObj, function(status) {
      if (status != 'OK') {
        console.log("!!! ERROR: saveStats " + status);
      } else {
        console.log(chalkLog("UPDATE DROPBOX STATUS OK"));
      }
    });
  });
}

//=================================
//  UPDATE STATUS
//=================================
// if (OFFLINE_MODE) {

// } else {
//   loadStats(function(err, file){});
// }

var statsInterval;

function updateStatsInterval(statsFile, interval){

  clearInterval(statsInterval);

  statsInterval = setInterval(function() {
    updateStats({
      timeStamp: moment().format(defaultDateTimeFormat),
      upTime: msToTime(upTime),
      runTime: msToTime(runTime),
      heartbeat: txHeartbeat,

      numberAdmins: numberAdmins,

      numberUtils: numberUtils,
      numberUtilsMax: numberUtilsMax,
      numberUtilsMaxTime: numberUtilsMaxTime,

      numberUsers: numberUsers,
      numberUsersMax: numberUsersMax,
      numberUsersMaxTime: numberUsersMaxTime,

      numberTestUsers: numberTestUsers,
      numberTestUsersMax: numberTestUsersMax,
      numberTestUsersMaxTime: numberTestUsersMaxTime,

      numberUsersTotal: numberUsersTotal,
      numberUsersTotalMax: numberUsersTotalMax,
      numberUsersTotalMaxTime: numberUsersTotalMaxTime,

      numberViewers: numberViewers,
      numberViewersMax: numberViewersMax,
      numberViewersMaxTime: numberViewersMaxTime,

      numberTestViewers: numberTestViewers,
      numberTestViewersMax: numberTestViewersMax,
      numberTestViewersMaxTime: numberTestViewersMaxTime,

      numberViewersTotal: numberViewersTotal,
      numberViewersTotalMax: numberViewersTotalMax,
      numberViewersTotalMaxTime: numberViewersTotalMaxTime,

      promptsSent: promptsSent,
      responsesReceived: responsesReceived,

      bhtErrors: bhtErrors,
      bhtRequests: bhtRequests,
      bhtOverLimitFlag: bhtOverLimitFlag,

      mwErrors: mwErrors,
      mwRequests: mwRequests,

      totalEntities: totalEntities,
      entityCacheTtl: entityCacheTtl,

      totalGroups: totalGroups,
      groupCacheTtl: groupCacheTtl,

      totalSessions: totalSessions,
      sessionUpdatesSent: sessionUpdatesSent,
      sessionCacheTtl: sessionCacheTtl,

      totalWords: totalWords,
      wordCacheHits: wordCache.getStats().hits,
      wordCacheMisses: wordCache.getStats().misses,
      wordCacheTtl: wordCacheTtl
    });

    if (groupsUpdateComplete) {
      var gKeys = serverGroupHashMap.keys();

      async.each(gKeys, function(groupId, cb){
        serverGroupsJsonObj[groupId] = serverGroupHashMap.get(groupId);
        cb();
      },
        function(err){

          if (gKeys.length > 0) {
            saveFile("", serverGroupsFile, serverGroupsJsonObj, function(err, results){
              if (err){
                console.log(chalkError("SAVE SERVER GROUP FILE ERROR " + serverGroupsFile 
                  + "\n" + jsonPrint(err)
                ));
              }
              else {
                console.log(chalkRed("SAVE SERVER GROUP FILE " 
                  + serverGroupsFile 
                  + " | " + gKeys.length + " GROUPS"
                  // + "\n" + jsonPrint(results)
                ));
              }
            });
          }
          else {
            console.log(chalkRed("SKIPPED SAVE SERVER GROUP FILE " 
              + serverGroupsFile 
              + " | " + gKeys.length + " GROUPS"
              // + "\n" + jsonPrint(results)
            ));
          }

        }
      );
    }

    if (entitiesUpdateComplete) {
      var hmKeys = serverKeywordHashMap.keys();

      async.each(hmKeys, function(keyword, cb){
        serverKeywordsJsonObj[keyword] = serverKeywordHashMap.get(keyword);
        cb();
      },
        function(err){

          saveFile("", serverKeywordsFile, serverKeywordsJsonObj, function(err, results){
            if (err){
              console.log(chalkError("SAVE SERVER KEYWORD FILE ERROR " + serverKeywordsFile));
              if (err.status == 429) {
                console.log(chalkError("SAVE SERVER KEYWORD FILE ERROR: TOO MANY WRITES"));
              }
              else {
                console.log(chalkError(jsonPrint(err)));
              }
            }
            else {
              console.log(chalkInfo("SAVE SERVER KEYWORD FILE " 
                + serverKeywordsFile 
                // + "\n" + jsonPrint(results)
              ));
            }
          });

        }
      );
    }
  }, interval);

}


function updateGroups(configFile, callback){

  initGroups(configFile, function(err, groups){
    if (err){
      console.log(chalkError("*** ERROR initEntityChannelGroups"
        + " | CONFIG FILE: " + configFile
        + "\n" + jsonPrint(err)
      ));
    }
    else {

      var groupIds = Object.keys(groups) ;

      console.log(chalkLog("GROUPS CONFIG INIT COMPLETE"
        + " | " + groupIds.length + " GROUPS"
        // + "\n" + jsonPrint(entityChannelGroups)
      ));


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
            console.log("*** ERROR  updateGroups: " + err);
            callback(err, null);
            return;
          } else {
            debug("FOUND " + groups.length + " GROUPS");
            console.log(chalkLog("GROUPS CONFIG UPDATE COMPLETE"
            ));

            updateEntityChannelGroups(defaultDropboxEntityChannelGroupsConfigFile, function(err, results){
              callback(null, groups.length);
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

          var entity = entityChannelGroups[entityChannelId];

          if (entityChannelGroupHashMap.has(entityChannelId)){

            entityChannelGroupHashMap.set(entityChannelId, entity);

            delete statsObj.entityChannelGroup.hashMiss[entityChannelId];

            console.log(chalkInfo("--- UPDATED ENTITY CHANNEL"
              + " | ECID: " + entityChannelId
              + " | EGID: " + entityChannelGroupHashMap.get(entityChannelId).groupId
              + " | EGN: " + entityChannelGroupHashMap.get(entityChannelId).name
              // + " | " + jsonPrint(entityChannelGroupHashMap.get(entityChannelId))
            ));

            if (groupHashMap.has(entity.groupId)){
              cb(null, "ENTITY HIT: " + entityChannelId);
              return;
            }
            else if (!entity.groupId.match(hostname)) {
              statsObj.group.hashMiss[entity.groupId] = 1;
              statsObj.group.allHashMisses[entity.groupId] = 1;

              console.log(chalkInfo("-0- GROUP HASHMAP MISS"
                + " | " + entity.groupId
              ));

              configEvents.emit("HASH_MISS", {type: "group", value: entity.groupId});

              cb(err, "GROUP NOT FOUND: " + entity.groupId);
              return;
            }

          }

          else {

            entityChannelGroupHashMap.set(entityChannelId, entity);

            console.log(chalkLog("+++ ADDED ENTITY CHANNEL  "
              + " | ECID: " + entityChannelId
              + " | EGID " + entityChannelGroupHashMap.get(entityChannelId).groupId
              + " | EGN: " + entityChannelGroupHashMap.get(entityChannelId).name
              // + "\n" + jsonPrint(entityChannelGroupHashMap.get(entityChannelId))
            ));

            if (groupHashMap.has(entity.groupId)){
              cb(null, "ENTITY MISS: " + entityChannelId);
              return;
            }
            else if (!entity.groupId.match(hostname)) {
              statsObj.group.hashMiss[entity.groupId] = 1;
              statsObj.group.allHashMisses[entity.groupId] = 1;

              console.log(chalkInfo("-1- GROUP HASHMAP MISS"
                + " | " + entity.groupId
              ));

              configEvents.emit("HASH_MISS", {type: "group", value: entity.groupId});

              cb(err, "GROUP MISS: " + entity.groupId);
              return;
            }
          }

        },

        function(err) {
          if (err) {
            console.log("*** ERROR  updateEntityChannelGroups: " + err);
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

  console.log(chalkLog("updateGroupsInterval"
    + " | INTERVAL: " + interval
    + " | " + configFile
  ));

  initGroupsInterval = setInterval(function() {
    updateGroups(configFile, function(err, results){});
    // initKeywords(defaultDropboxKeywordFile, function(err, results){});
  }, interval);
}

var initEntityChannelGroupsInterval;
function updateEntityChannelGroupsInterval(configFile, interval){

  console.log(chalkLog("updateEntityChannelGroupsInterval"
    + " | INTERVAL: " + interval
    + " | " + configFile
  ));

  initEntityChannelGroupsInterval = setInterval(function() {
    updateEntityChannelGroups(configFile, function(err, results){

    });
  }, interval);
}


// ==================================================================
// MONGO DATABASE CONFIG
// ==================================================================

var db = mongoose();

var IpAddress = require('mongoose').model('IpAddress');

var Admin = require('mongoose').model('Admin');
var Viewer = require('mongoose').model('Viewer');
var User = require('mongoose').model('User');

var Group = require('mongoose').model('Group');
var Entity = require('mongoose').model('Entity');
var Session = require('mongoose').model('Session');
var Word = require('mongoose').model('Word');

var groupServer = require('./app/controllers/group.server.controller');
var entityServer = require('./app/controllers/entity.server.controller');
var wordServer = require('./app/controllers/word.server.controller');

var Oauth2credential = require('mongoose').model('Oauth2credential');

// ==================================================================
// APP HTTP IO DNS CONFIG -- ?? order is important.
// ==================================================================
var app = express();

var http = require('http');
var httpServer = require('http').Server(app);
// var io = require('socket.io')(httpServer, { reconnection: false });

var io;
var dns = require('dns');
var path = require('path');
var net = require('net');
// var testClient = new net.Socket();

var googleOauthEvents = new EventEmitter();

var Queue = require('queue-fifo');
var socketQueue = new Queue();
var sessionQueue = new Queue();
var dbUpdateGroupQueue = new Queue();
var dbUpdateEntityQueue = new Queue();
var dbUpdateSessionQueue = new Queue();
var dbUpdateWordQueue = new Queue();
var wapiSearchQueue = new Queue();
var updaterMessageQueue = new Queue();
var followerUpdateQueue = new Queue();

var MAX_WORD_HASH_MAP_COUNT = 20;
var wordArray = []; // used to keep wordHashMap.count() < MAX_WORD_HASH_MAP_COUNT

// var NodeCache = require("node-cache");

// var adminCache = new NodeCache();
// var viewerCache = new NodeCache();
// var userCache = new NodeCache();
// var utilCache = new NodeCache();
// // var monitorCache = new NodeCache();

// var monitorHashMap = {};

// var trendingCache = new NodeCache({
//   stdTTL: trendingCacheTtl,
//   checkperiod: 10
// });

// var wordCache = new NodeCache({
//   stdTTL: wordCacheTtl,
//   checkperiod: 10
// });

// var sessionCache = new NodeCache({
//   stdTTL: sessionCacheTtl,
//   checkperiod: 30
// });

// var entityCache = new NodeCache({
//   stdTTL: entityCacheTtl,
//   checkperiod: 30
// });

// var groupCache = new NodeCache({
//   stdTTL: groupCacheTtl,
//   checkperiod: 30
// });

var promptQueue = new Queue();
var responseQueue = new Queue();
var responseRate1minQ = new Queue();
var promptArray = ["black"];

var dnsReverseLookupQueue = new Queue();

// ==================================================================
// GOOGLE
// ==================================================================
// ==================================================================
// GOOGLE INIT
// ==================================================================
var googleapis = require('googleapis');

var GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
var GOOGLE_SERVICE_ACCOUNT_CLIENT_ID = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID;
var GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
var GOOGLE_SERVICE_ACCOUNT_KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
var GOOGLE_MONITORING_SCOPE = process.env.GOOGLE_MONITORING_SCOPE;

console.log("GOOGLE_PROJECT_ID: " + GOOGLE_PROJECT_ID);
console.log("GOOGLE_SERVICE_ACCOUNT_CLIENT_ID: " + GOOGLE_SERVICE_ACCOUNT_CLIENT_ID);
console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL: " + GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log("GOOGLE_SERVICE_ACCOUNT_KEY_FILE: " + GOOGLE_SERVICE_ACCOUNT_KEY_FILE);
console.log("GOOGLE_MONITORING_SCOPE: " + GOOGLE_MONITORING_SCOPE);

var disableGoogleMetrics = true;
if (process.env.GOOGLE_METRICS_DISABLE > 0) {
  disableGoogleMetrics = true;
  console.log("GOOGLE_METRICS_DISABLE: " + disableGoogleMetrics);
} else {
  console.log("GOOGLE_METRICS_DISABLE: " + disableGoogleMetrics);
}

var googleAuthorized = false;
var googleAuthCode = 0;
var googleAuthExpiryDate = new Date();
var googleMetricsEnabled = false;

var googleCheckDailyLimitInterval = 10 * ONE_MINUTE; // check every 10 minutes
var googleCheckSocketUpInterval = ONE_MINUTE;

var googleMonitoring;
var googleOauthClient;

if (!disableGoogleMetrics) {
  googleOauthClient = new googleapis.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
    null, [GOOGLE_MONITORING_SCOPE]
  );
}


var adminNameSpace;
var utilNameSpace;
var userNameSpace;
var viewNameSpace;
var testUsersNameSpace;
var testViewersNameSpace;



var initNameSpacesInterval = setInterval(function(){

  // if (updateComplete) {
  if (true) {

    console.log(chalkAlert("INIT SOCKET NAMESPACES"));

    io = require('socket.io')(httpServer, { reconnection: false });

    adminNameSpace = io.of("/admin");
    utilNameSpace = io.of("/util");
    userNameSpace = io.of("/user");
    viewNameSpace = io.of("/view");
    testUsersNameSpace = io.of("/test-user");
    testViewersNameSpace = io.of("/test-view");

    adminNameSpace.on('connect', function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("ADMIN CONNECT"));
      createSession({
        namespace: "admin",
        socket: socket,
        type: "ADMIN",
        tags: {}
      });
      socket.on('SET_WORD_CACHE_TTL', function(value) {
        setWordCacheTtl(value);
      });
    });

    utilNameSpace.on('connect', function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("UTIL CONNECT"));
      createSession({
        namespace: "util",
        socket: socket,
        type: "UTIL",
        mode: "UNKNOWN",
        tags: {}
      });
    });

    userNameSpace.on('connect', function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("USER CONNECT"));
      createSession({
        namespace: "user",
        socket: socket,
        type: "UTIL",
        mode: "UNKNOWN",
        tags: {}
      });
    });

    viewNameSpace.on('connect', function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("VIEWER CONNECT"));
      createSession({
        namespace: "view",
        socket: socket,
        type: "VIEWER",
        tags: {}
      });
    });

    testUsersNameSpace.on('connect', function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("TEST USER CONNECT"));
      createSession({
        namespace: "test-user",
        socket: socket,
        type: "TEST_USER",
        tags: {}
      });
    });

    testViewersNameSpace.on('connect', function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("TEST VIEWER CONNECT"));
      createSession({
        namespace: "test-view",
        socket: socket,
        type: "TEST_VIEWER",
        tags: {}
      });
    });

    clearInterval(initNameSpacesInterval);

    ioReady = true;
  }
}, 500);

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

function randomIntInc(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low);
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function readFileIntoArray(path, callback) {

  debug("PATH: " + path);

  fs.exists(path, function(exists) {
    if (exists) {
      fs.stat(path, function(error, stats) {
        fs.open(path, "r", function(error, fd) {
          var buffer = new Buffer(stats.size);

          fs.readFile(path, function(error, data) {
            debug(data);
            var dataNoSpaces = data.toString().replace(/ /g, "");
            var dataArray = dataNoSpaces.toString().split("\n");
            callback(error, dataArray);
            fs.close(fd);
          });
        });
      });
    } else {
      debug("??? FILE DOES NOT EXIST ??? " + path);
    }
  });
}

function dnsReverseLookup(ip, callback) {
  if (localHostHashMap.has(ip)) {
    debug("dnsReverseLookup: DEVELOPMENT HOST: " + os.hostname() + " | " + ip);
    var domains = [];
    domains.push(localHostHashMap.get(ip));
    callback(null, domains);
  } else if (dnsHostHashMap.has(ip)) {
    var domains = dnsHostHashMap.get(ip);
    debug("dnsReverseLookup: HOST IN HASHMAP : " + os.hostname() + " | " + ip + " | " + domains);
    callback(null, domains);
  } else {
    dns.reverse(ip, function(err, domains) {
      if (err) {
        console.log('\n\n***** ERROR: DNS REVERSE IP: ' + ip + '\n' + err + '\n');
        callback(err, null);
      } else {
        debug('DNS REVERSE IP: ' + ip);
        dnsHostHashMap.set(ip, domains);
        domains.forEach(function(domain) {
          debug("DOMAIN: " + domain);
        });
        callback(null, domains);
      }
    });
  }
}

function updatePromptResponseMetric(sessionUpdateObj) {
  debug("PROMPT-RESPONSE RATE FIFO PUSH: NOW: " + getTimeNow() 
    + " | PROMPT-RESPONSE SESSION: " + sessionUpdateObj.sessionId);
  responseRate1minQ.enqueue(moment.utc());
}

var statsCountsComplete = true;

function updateStatsCounts() {

  if (statsCountsComplete) {

    statsCountsComplete = false;

    var uComplete = false;
    var gComplete = false;
    var eComplete = false;
    var sComplete = false;
    var wComplete = false;

    User.count({}, function(err, count) {
      if (!err) {
        // debug("TOTAL USERS: " + count);
        totalUsers = count;
        updateStats({
          totalUsers: totalUsers
        });
        uComplete = true;

        Session.count({}, function(err, count) {
          if (!err) {
            // debug("TOTAL SESSIONS: " + count);
            totalSessions = count;
            updateStats({
              totalSessions: totalSessions
            });
            sComplete = true;

            Word.count({}, function(err, count) {
              statsCountsComplete = true;
              if (!err) {
                // debug("TOTAL WORDS: " + count);
                totalWords = count;
                updateStats({
                  totalWords: totalWords
                });
                wComplete = true;

                Group.count({}, function(err, count) {
                  statsCountsComplete = true;
                  if (!err) {
                    // debug("TOTAL WORDS: " + count);
                    totalGroups = count;
                    updateStats({
                      totalGroups: totalGroups
                    });
                    gComplete = true;

                    Entity.count({}, function(err, count) {
                      statsCountsComplete = true;
                      if (!err) {
                        // debug("TOTAL WORDS: " + count);
                        totalEntities = count;
                        updateStats({
                          totalEntities: totalEntities
                        });
                        eComplete = true;
                        return;
                      } else {
                        debug(chalkError("\n*** DB Entity.count ERROR *** | " 
                          + moment().format(defaultDateTimeFormat) + "\n" + err));
                        return;
                      }
                    });

                  } else {
                    debug(chalkError("\n*** DB Group.count ERROR *** | " 
                      + moment().format(defaultDateTimeFormat) + "\n" + err));
                    return;
                  }
                });

              } else {
                debug(chalkError("\n*** DB Word.count ERROR *** | " 
                  + moment().format(defaultDateTimeFormat) + "\n" + err));
                return;
              }
            });

          } else {
            debug(chalkError("\n*** DB Session.count ERROR *** | " 
              + moment().format(defaultDateTimeFormat) + "\n" + err));
            return;
          }
        });
      } else {
        debug(chalkError("\n*** DB User.count ERROR *** | " 
          + moment().format(defaultDateTimeFormat) + "\n" + err));
        return;
      }
    });

  }
}

var updateSessionViewQueue = [];

var updateSessionViewReady = true;

var readUpdateSessionViewQueue = setInterval(function() {
  if (updateSessionViewReady && (updateSessionViewQueue.length > 0)) {

    updateSessionViewReady = false;

    var sessionUpdateObj = updateSessionViewQueue.shift();

    updateStatsCounts();

    var sessionSmallObj;

    if (sessionUpdateObj.action == 'KEEPALIVE') {
      sessionSmallObj = {
        tags: {},
        action: sessionUpdateObj.action,
        userId: sessionUpdateObj.userId,
        sessionId: sessionUpdateObj.sessionId,
        wordChainIndex: sessionUpdateObj.wordChainIndex,
        source: {},
        target: {}
      };

      if (typeof sessionUpdateObj.tags !== 'undefined') {
        sessionSmallObj.tags = sessionUpdateObj.tags;
      }

      sessionSmallObj.source = {
        nodeId: sessionUpdateObj.userId,
        wordChainIndex: sessionUpdateObj.wordChainIndex,
        links: {},
        mentions: sessionUpdateObj.wordChainIndex
      };
    } 
    else {
      sessionSmallObj = {
        tags: {},
        action: sessionUpdateObj.action,
        userId: sessionUpdateObj.userId,
        sessionId: sessionUpdateObj.sessionId,
        wordChainIndex: sessionUpdateObj.wordChainIndex,
        source: {},
        target: {}
      };

      if (typeof sessionUpdateObj.tags !== 'undefined') {
        sessionSmallObj.tags = sessionUpdateObj.tags;
        // console.log("readUpdateSessionViewQueue | sessionSmallObj.tags\n" + jsonPrint(sessionSmallObj.tags));
      }

      sessionSmallObj.source = {
        nodeId: sessionUpdateObj.source.nodeId,
        raw: sessionUpdateObj.source.raw,
        isIgnored: sessionUpdateObj.source.isIgnored,
        isTrendingTopic: sessionUpdateObj.source.isTrendingTopic,
        // isKeyword: keywordHashMap.has(sessionUpdateObj.source.nodeId),
        isKeyword: sessionUpdateObj.source.isKeyword,
        keywords: {},
        url: sessionUpdateObj.source.url,
        wordChainIndex: sessionUpdateObj.source.wordChainIndex,
        links: {},
        mentions: sessionUpdateObj.source.mentions
      };

      if (keywordHashMap.has(sessionUpdateObj.source.nodeId)) {
        sessionSmallObj.source.keywords = keywordHashMap.get(sessionUpdateObj.source.nodeId);
      }

      if (sessionUpdateObj.source.antonym) {
        sessionSmallObj.source.antonym = sessionUpdateObj.source.antonym;
      }

      if (sessionUpdateObj.target) {
        sessionSmallObj.target = {
          nodeId: sessionUpdateObj.target.nodeId,
          raw: sessionUpdateObj.target.raw,
          isIgnored: sessionUpdateObj.target.isIgnored,
          isKeyword: sessionUpdateObj.target.isKeyword,
          isTrendingTopic: sessionUpdateObj.target.isTrendingTopic,
          keywords: {},
          url: sessionUpdateObj.target.url,
          wordChainIndex: sessionUpdateObj.target.wordChainIndex,
          links: {},
          mentions: sessionUpdateObj.target.mentions
        };

        if (sessionUpdateObj.target.keywords) {
          sessionSmallObj.target.keywords = sessionUpdateObj.target.keywords;
        }
      }


      if (sessionUpdateObj.target) {
        debug(chalkLog("S>" + " | " + sessionUpdateObj.userId
          // + " | " + sessionUpdateObj.sessionId
          // + " | WCI: " + sessionUpdateObj.wordChainIndex
          + " | URL: " + sessionUpdateObj.source.url
          + " | " + sessionUpdateObj.source.raw 
          + " [" + sessionUpdateObj.source.wordChainIndex + "]" 
          + " > " + sessionUpdateObj.target.raw 
          + " [" + sessionUpdateObj.target.wordChainIndex + "]"
        ));
      } 
      else {
        debug(chalkLog("SNT>" + " | " + sessionUpdateObj.userId
          // + " | " + sessionUpdateObj.sessionId
          // + " | WCI: " + sessionUpdateObj.wordChainIndex
          + " | URL: " + sessionUpdateObj.source.url
          + " | " + sessionUpdateObj.source.nodeId 
          + " [" + sessionUpdateObj.source.wordChainIndex + "]"
        ));
      }
    }

    viewNameSpace.emit("SESSION_UPDATE", sessionSmallObj);
    testViewersNameSpace.emit("SESSION_UPDATE", sessionSmallObj);

    var key = sessionUpdateObj.tags.entity + '_' + sessionUpdateObj.tags.channel;

    if (monitorHashMap[key] && sessionUpdateObj.action == "RESPONSE"){
      console.log(chalkInfo("R< M"
        + " | " + monitorHashMap[key].session.sessionId
        + " | " + sessionUpdateObj.source.nodeId
        + " | " + sessionUpdateObj.source.raw
        // + " | " + jsonPrint(monitorHashMap[key])
      ));
      utilNameSpace.to(monitorHashMap[key].session.sessionId).emit("SESSION_UPDATE",sessionSmallObj);
    }

    updateStats({ sessionUpdatesSent: sessionUpdatesSent });
    updatePromptResponseMetric(sessionUpdateObj);

    sessionUpdatesSent++;
    updateSessionViewReady = true;
  }
}, 20);


function updateSessionViews(sessionUpdateObj) {

  debug(chalkRed("updateSessionViews | sessionUpdateObj\n" + jsonPrint(sessionUpdateObj)));

  if (entityChannelGroupHashMap.has(sessionUpdateObj.tags.entity)){
    sessionUpdateObj.tags.group = entityChannelGroupHashMap.get(sessionUpdateObj.tags.entity);
    updateSessionViewQueue.push(sessionUpdateObj);
  }
  else if (typeof sessionUpdateObj.tags.entity !== 'undefined') {
    statsObj.entityChannelGroup.hashMiss[sessionUpdateObj.tags.entity] = 1;
    statsObj.entityChannelGroup.allHashMisses[sessionUpdateObj.tags.entity] = 1;
  }
}

var simpleChain = function(chain) {
  var chainArray = [];
  for (var i = 0; i < chain.length; i++) {
    chainArray.push(chain[i].nodeId);
  }
  return chainArray;
}

function sendPrompt(sessionObj, sourceWordObj) {

  // console.log("sendPrompt: sessionObj\n" + jsonPrint(sessionObj));

  var currentSession = sessionCache.get(sessionObj.sessionId);
  var currentUser = userCache.get(sessionObj.userId);

  if (!currentSession) {
    debug("sendPrompt | sessionObj.sessionId NOT FOUND IN SESSION CACHE ... SKIPPING | " + sessionObj.sessionId);
    return;
  } else if (!currentUser) {
    debug("sendPrompt | " 
      + sessionObj.userId + " NOT FOUND IN USER CACHE ... SKIPPING | " 
      + sessionObj.sessionId
      + "\n" + jsonPrint(currentUser)
      );
    return;
  } else {


    // console.log("sendPrompt: currentSession\n" + jsonPrint(currentSession));
    // console.log("sendPrompt: currentUser\n" + jsonPrint(currentUser));

    // var sourceWordObj;

    switch (sessionObj.config.mode) {
      case 'PROMPT':
      case 'RANDOM':
      case 'ANTONYM':
      case 'SYNONYM':

        if (currentSession.wordChainIndex >= 2) {

          // var targetWordId = currentSession.wordChain[currentSession.wordChainIndex - 2];
          var targetWordId = currentSession.wordChain[currentSession.wordChain.length - 2];
          var targetWordObj = wordCache.get(targetWordId);

          if (!targetWordObj) {
            console.log(chalkWarn("sendPrompt" 
              + " | " + sessionObj.sessionId 
              + " | " + targetWordId + " NOT FOUND IN WORD CACHE (EXPIRED?) ... SKIPPING"));
            return;
            // KLUDGE??? WILL THIS STALL SESSION?
          }

          // targetWordObj.wordChainIndex = currentSession.wordChainIndex - 2;
          targetWordObj.wordChainIndex = currentSession.wordChain.length - 2;
          debug("Word CACHE SET0: " + targetWordObj.nodeId);
          wordCache.set(targetWordId, targetWordObj);


          debug("CHAIN: " + currentSession.wordChain);

          console.log(chalkPrompt("P>" + " | " + currentUser.userId
            // + " | " + sessionObj.sessionId 
            // + " | TYPE: " + sessionObj.config.type 
            // + " | MODE: " + sessionObj.config.mode 
            + " | " + sourceWordObj.nodeId + " > " + targetWordObj.nodeId
          ));

          var sessionUpdateObj = {
            action: 'PROMPT',
            userId: currentUser.userId,
            sessionId: currentSession.sessionId,
            wordChainIndex: currentSession.wordChainIndex,
            source: sourceWordObj,
            target: targetWordObj
          };

          sessionUpdateObj.tags = {};

          if ((typeof currentUser.tags !== 'undefined') && (typeof currentSession.tags === 'undefined')){
            currentSession.tags = {};
            currentSession.tags.entity = currentUser.tags.entity;
            currentSession.tags.channel = currentUser.tags.channel;

            sessionUpdateObj.tags.entity = currentUser.tags.entity;
            sessionUpdateObj.tags.channel = currentUser.tags.channel;

            sessionUpdateObj.tags.group = entityChannelGroupHashMap.get(currentUser.tags.entity).groupId;
          }
          else if (typeof currentSession.tags !== 'undefined'){
            sessionUpdateObj.tags.entity = currentSession.tags.entity;
            sessionUpdateObj.tags.channel = currentSession.tags.channel;
            sessionUpdateObj.tags.group = currentSession.tags.group;
          }

        } 

        else {

          console.log(chalkPrompt("P>" + " | " + currentUser.userId
            // + " | " + sessionObj.sessionId 
            // + " | TYPE: " + sessionObj.config.type 
            // + " | MODE: " + sessionObj.config.mode 
            + " | START -> " + sourceWordObj.nodeId));

          var sessionUpdateObj = {
            action: 'PROMPT',
            userId: currentUser.userId,
            sessionId: currentSession.sessionId,
            wordChainIndex: currentSession.wordChainIndex,
            source: sourceWordObj,
            target: 0
          };

          sessionUpdateObj.tags = {};

          if ((typeof currentUser.tags !== 'undefined') && (typeof currentSession.tags === 'undefined')){
            currentSession.tags = {};
            currentSession.tags.entity = currentUser.tags.entity;
            currentSession.tags.channel = currentUser.tags.channel;

            sessionUpdateObj.tags.entity = currentUser.tags.entity;
            sessionUpdateObj.tags.channel = currentUser.tags.channel;
            sessionUpdateObj.tags.group = entityChannelGroupHashMap.get(currentUser.tags.entity).groupId;
          }
          else if (typeof currentSession.tags !== 'undefined'){
            sessionUpdateObj.tags.entity = currentSession.tags.entity;
            sessionUpdateObj.tags.channel = currentSession.tags.channel;
            sessionUpdateObj.tags.group = currentSession.tags.group;
          }

        }

        setTimeout(function() {

          io.of(currentSession.namespace).to(currentSession.sessionId).emit('PROMPT_WORD_OBJ', sourceWordObj);

          updateSessionViews(sessionUpdateObj);

          promptsSent++;
          deltaPromptsSent++;
          updateStats({
            promptsSent: promptsSent
          });

        }, randomInt(minServerResponseTime, maxServerResponseTime));

        break;

      case 'SCRIPT':
        break;

      case 'USER_USER':

        var currentSession = sessionCache.get(sessionObj.sessionId);
        var currentUser = userCache.get(sessionObj.userId);

        var targetSessionId = sessionRouteHashMap.get(currentSession.sessionId);
        var targetSession = sessionCache.get(targetSessionId);

        debug(chalkRed("currentSession\n" + jsonPrint(currentSession)));
        debug(chalkRed("targetSession\n" + jsonPrint(targetSession)));

        var promptWordObj;

        if (currentSession.wordChain.length >= 2) {

          var promptWord = currentSession.wordChain[currentSession.wordChain.length - 1].nodeId;
          var previousResponse = currentSession.wordChain[currentSession.wordChain.length - 2].nodeId;

          promptWordObj = wordCache.get(promptWord);
          var targetWordObj = wordCache.get(previousResponse);

          debug(chalkPrompt("P-> " + currentUser.userId 
            + " | " + sessionObj.sessionId 
            + " | TYPE: " + sessionObj.config.type 
            + " | MODE: " + sessionObj.config.mode 
            + " | " + targetWordObj.nodeId 
            + " --> " + promptWordObj.nodeId 
            + " | " + targetSessionId));

        } else if (currentSession.wordChainIndex >= 1) {

          var previousResponse = currentSession.wordChain[currentSession.wordChain.length - 1].nodeId;

          var targetWordObj = wordCache.get(previousResponse);
          promptWordObj = targetWordObj;

          debug(chalkPrompt("P-> " + currentUser.userId 
            + " | " + sessionObj.sessionId 
            + " | TYPE: " + sessionObj.config.type 
            + " | MODE: " + sessionObj.config.mode 
            + " | START --> " + targetWordObj.nodeId));

        } else {

          promptWordObj = {
            nodeId: "START"
          };

          debug(chalkPrompt("P-> " + currentUser.userId 
            + " | " + targetSession.sessionId 
            + " | TYPE: " + sessionObj.config.type 
            + " | MODE: " + sessionObj.config.mode 
            + " | START --> " + promptWordObj.nodeId));
        }

        sessionCache.set(currentSession.sessionId, currentSession);
        sessionCache.set(targetSession.sessionId, targetSession);

        io.of(currentSession.namespace).to(targetSession.sessionId).emit('PROMPT_WORD_OBJ', promptWordObj);

        promptsSent++;
        deltaPromptsSent++;

        var sessionUpdateObj = {
          action: 'PROMPT',
          tags: {},
          userId: currentUser.userId,
          sessionId: currentSession.sessionId,
          wordChainIndex: currentSession.wordChainIndex,
          source: promptWordObj,
          target: targetWordObj
        };

        // sessionUpdateObj.tags.entity = currentUser.userId.toLowerCase();
        sessionUpdateObj.tags = currentSession.tags;

        updateSessionViews(sessionUpdateObj);

        updateStats({
          promptsSent: promptsSent
        });
        break;

      case 'GROUP':
        break;
      default:
        debug(chalkError(" 1 ????? UNKNOWN SESSION TYPE: " + sessionObj.config.mode));
        quit(" 1 ????? UNKNOWN SESSION TYPE: " + sessionObj.config.mode);
        break;
    }

  }
}

// BHT
var wordTypes = ['noun', 'verb', 'adjective', 'adverb'];
var wordVariations = ['syn', 'ant', 'rel', 'sim', 'usr'];

function dbUpdateGroup(groupObj, incMentions, callback) {

  if ((groupObj.groupId == null) || (typeof groupObj.groupId === 'undefined')) {
    console.log(chalkError("\n***** dbUpdateGroup: NULL OR UNDEFINED groupId\n" + jsonPrint(groupObj)));
    callback("NULL OR UNDEFINED groupId", groupObj);
    return;
  }

  groupServer.findOneGroup(groupObj, incMentions, function(err, group) {
    if (err) {
      console.log(chalkError("dbUpdateGroup -- > findOneGroup ERROR" 
        + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(groupObj, null, 2)));
      callback(err, groupObj);
    } else {

      console.log(chalkInfo("->- DB GR" 
        + " | " + group.groupId 
        + " | NAME: " + group.name 
        + " | CREATED: " + moment(group.createdAt).format(defaultDateTimeFormat)
        + " | LAST: " + moment(group.lastSeen).format(defaultDateTimeFormat)
        + " | MNS: " + group.mentions 
        + "\nCHANNELS: " + group.channels
        + "\nENTITIES: " + group.entities
        // + "\nTAGS: " + jsonPrint(group.tags)
      ));

      callback(null, group);
    }
  });
}

function dbUpdateEntity(entityObj, incMentions, callback) {

  if ((entityObj.entityId == null) || (typeof entityObj.entityId === 'undefined')) {
    console.log(chalkError("\n***** dbUpdateEntity: NULL OR UNDEFINED entityId\n" + jsonPrint(entityObj)));
    callback("NULL OR UNDEFINED entityId", entityObj);
    return;
  }

  entityServer.findOneEntity(entityObj, incMentions, function(err, entity) {
    if (err) {
      console.log(chalkError("dbUpdateEntity -- > findOneEntity ERROR" 
        + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(entityObj, null, 2)));
      callback(err, entityObj);
    } else {

      console.log("->- DB EN" 
        + " | " + entity.entityId 
        + " | N: " + entity.name 
        + " | SN: " + entity.screenName 
        + " | GR: " + entity.groupId
        + " | CH: " + entity.tags.channel
        + " | SESS: " + entity.sessions 
        + " | Ws: " + entity.words 
        + " | CR: " + moment(entity.createdAt).format(defaultDateTimeFormat)
        + " | LAST: " + moment(entity.lastSeen).format(defaultDateTimeFormat)
        + " | Ms: " + entity.mentions 
      );

      callback(null, entity);
    }
  });
}

function dbUpdateWord(wordObj, incMentions, callback) {

  if ((wordObj.nodeId == null) || (typeof wordObj.nodeId === 'undefined')) {
    debug(chalkError("\n***** dbUpdateWord: NULL OR UNDEFINED nodeId\n" + jsonPrint(wordObj)));
    callback("NULL OR UNDEFINED nodeId", wordObj);
    return;
  }

  if (keywordHashMap.has(wordObj.nodeId)) {
    wordObj.isKeyword = true;
    var kw = keywordHashMap.get(wordObj.nodeId);
    wordObj.keywords = {};    
    wordObj.keywords[kw] = true;    
  }

  wordServer.findOneWord(wordObj, incMentions, function(err, word) {
    if (err) {
      console.log(chalkError("dbUpdateWord -- > findOneWord ERROR" 
        + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(wordObj, null, 2)));
      callback(err, wordObj);
    } else {

      debug("> DB UPDATE | " 
        + word.nodeId 
        + " | I: " + word.isIgnored 
        + " | K: " + word.isKeyword 
        + " | TT: " + word.isTrendingTopic 
        + " | MNS: " + word.mentions 
        + " | URL: " + word.url 
        + " | BHT SEARCHED: " + word.bhtSearched 
        + " FOUND: " + word.bhtFound
        + " | MWD SEARCHED: " + word.mwDictSearched 
        + " FOUND: " + word.mwDictFound
        + "\nKWs: " + jsonPrint(word.keywords) 
      );

      debug(JSON.stringify(word, null, 3));

      if (!word.bhtSearched) { // not yet bht searched
        debug("word.bhtSearched: " + word.bhtSearched);

        bhtSearchWord(word, function(status, bhtResponseObj) {
          if (status.indexOf("BHT_OVER_LIMIT") >= 0) {
            debug(chalkError("bhtSearchWord BHT OVER LIMI"));
            debug("Word CACHE SET1: " + word.nodeId);
            wordCache.set(word.nodeId, word);
            callback('BHT_OVER_LIMIT', word);
          } 
          else if (status.indexOf("BHT_ERROR") >= 0) {
            debug(chalkError("bhtSearchWord dbUpdateWord findOneWord ERROR\n" + JSON.stringify(status)));
            debug("Word CACHE SET2: " + word.nodeId);
            wordCache.set(word.nodeId, word);
            callback('BHT_ERROR', word);
          } 
          else if (bhtResponseObj.bhtFound) {
            debug(chalkBht("-*- BHT HIT   | " + bhtResponseObj.nodeId));
            debug("Word CACHE SET3: " + bhtResponseObj.nodeId);
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
            callback('BHT_HIT', bhtResponseObj);
          } 
          else if (status == 'BHT_REDIRECT') {
            debug(chalkBht("-A- BHT REDIRECT  | " + wordObj.nodeId));
            debug("Word CACHE SET4: " + bhtResponseObj.nodeId);
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
            callback('BHT_REDIRECT', bhtResponseObj);
          } 
          else {
            debug(chalkBht("-O- BHT MISS  | " + wordObj.nodeId));
            debug("Word CACHE SET5: " + bhtResponseObj.nodeId);
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
            bhtWordsMiss[word.nodeId] = word.nodeId;
            // updateStats({
            //   bhtWordsMiss: bhtWordsMiss
            // });
            callback('BHT_MISS', bhtResponseObj);
          }
        });
      } 
      else if (word.bhtFound) {
        debug(chalkBht("-F- BHT FOUND | " + word.nodeId));
        debug("Word CACHE SET6: " + word.nodeId);
        wordCache.set(word.nodeId, word);
        callback('BHT_FOUND', word);
      } 
      else {
        debug(chalkBht("-N- BHT NOT FOUND  | " + word.nodeId));
        debug("Word CACHE SET7: " + word.nodeId);
        wordCache.set(word.nodeId, word);
        bhtWordsNotFound[word.nodeId] = word.nodeId;
        // updateStats({
        //   bhtWordsNotFound: bhtWordsNotFound
        // });
        callback('BHT_NOT_FOUND', word);
      }
    }
  });
}

function loadBhtResponseHash(bhtResponseObj, callback) {

  var bhtWordHashMap = new HashMap();

  wordTypes.forEach(function(wordType) {
    debug("wordType: " + wordType);
    if ((typeof bhtResponseObj[wordType] !== 'undefined') && (bhtResponseObj[wordType] != null)) {
      debug("FOUND wordType: " + wordType);
      wordVariations.forEach(function(wordVariation) {
        debug("wordVariation: " + wordVariation);
        if ((typeof bhtResponseObj[wordType][wordVariation] !== 'undefined') && (bhtResponseObj[wordType][wordVariation] != null)) {
          debug("FOUND wordVariation: " + wordVariation);
          var wordArry = bhtResponseObj[wordType][wordVariation];
          wordArry.forEach(function(word) {
            bhtWordHashMap.set(word, bhtResponseObj.nodeId);
            debug(bhtResponseObj.nodeId + " | " + wordType + " | " + wordVariation + " | " + word);
          })
        }
      })
    }
  });
  callback(bhtWordHashMap);
}

function bhtHttpGet(host, path, wordObj, callback) {

  http.get({
    host: host,
    path: path
  }, function(response) {

    debug("bhtHttpGet: " + host + "/" + path);

    response.on('error', function(err) {
      bhtErrors++;
      debug(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors 
        + " | WORD: " + wordObj.nodeId 
        + " | STATUS CODE: " + response.statusCode 
        + " | STATUS MESSAGE: " + response.statusMessage 
        + "\n" + util.inspect(err, {
          showHidden: false,
          depth: 3
        })
      ));
      callback("BHT_ERROR | " + err, wordObj);
      return;
    });

    var body = '';
    var status = '';

    if ((response.statusCode == 500) && (response.statusMessage == 'Usage Exceeded')) {
      bhtErrors++;
      debug(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors 
        + " | WORD: " + wordObj.nodeId 
        + " | STATUS CODE: " + response.statusCode 
        + " | STATUS MESSAGE: " + response.statusMessage
        // + "\n" + util.inspect(response, {showHidden: false, depth: 3})
      ));
      bhtEvents.emit("BHT_OVER_LIMIT", bhtRequests);
      callback("BHT_OVER_LIMIT", wordObj);
      return;
    } 
    else if ((response.statusCode == 500) && (response.statusMessage == 'Inactive key')) {
      bhtErrors++;
      debug(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors 
        + " | WORD: " + wordObj.nodeId 
        + " | STATUS CODE: " + response.statusCode 
        + " | STATUS MESSAGE: " + response.statusMessage 
        + "\n" + util.inspect(response, {
        showHidden: false,
        depth: 3
      })));
      bhtEvents.emit("BHT_INACTIVE_KEY", bhtRequests);
      callback("BHT_INACTIVE_KEY", wordObj);
      return;
    } 
    else if (bhtOverLimitTestFlag) {
      debug(chalkBht("BHT OVER LIMIT TEST FLAG SET"));
      bhtEvents.emit("BHT_OVER_LIMIT", bhtRequests);
      callback("BHT_OVER_LIMIT", wordObj);
      return;
    } 
    else if (response.statusCode == 404) {
      debug("bhtHttpGet: \'" + wordObj.nodeId + "\' NOT FOUND");
      wordObj.bhtSearched = true;
      wordObj.bhtFound = false;
      wordServer.findOneWord(wordObj, true, function(err, wordUpdatedObj) {
        debug(chalkBht("bhtHttpGet: ->- DB UPDATE | " + wordUpdatedObj.nodeId 
          + " | MNS: " + wordUpdatedObj.mentions));
        debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
        callback("BHT_NOT_FOUND", wordUpdatedObj);
        return;
      });
    } 
    else if (response.statusCode == 303) {
      wordObj.bhtAlt = response.statusMessage;
      debug(chalkBht("BHT REDIRECT" + " | WORD: " + wordObj.nodeId 
      + " | ALT: " + response.statusMessage // alternative word
        + " | " + response.headers.location
      ));
      wordServer.findOneWord(wordObj, true, function(err, wordUpdatedObj) {
        if (err) {
          console.log(chalkError("bhtHttpGet: findOneWord: DB ERROR\n" + "\n" + util.inspect(err, {
            showHidden: false,
            depth: 3
          })));
          callback("BHT_ERROR | " + err, wordObj);
          return;
        } else {
          debug(chalkBht("bhtHttpGet: ->- DB ALT UPDATE | " + wordUpdatedObj.nodeId 
          + " | ALT: " + wordUpdatedObj.bhtAlt // alternative word
            + " | MNS: " + wordUpdatedObj.mentions
          ));
          debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
          callback('BHT_REDIRECT', wordUpdatedObj);
          return;
        }
      });
    } 
    else if (response.statusCode != 200) {
      bhtErrors++;
      debug(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors 
        + " | WORD: " + wordObj.nodeId 
        + " | STATUS CODE: " + response.statusCode 
        + " | STATUS MESSAGE: " + response.statusMessage 
        + "\n" + util.inspect(response, {
        showHidden: false,
        depth: 3
      })));
      bhtEvents.emit("BHT_UNKNOWN_STATUS", bhtRequests);
      callback("BHT_UNKNOWN_STATUS", wordObj);
      return;
    } 
    else {
      response.on('data', function(d) {
        body += d;
      });

      response.on('end', function() {

        if (body != '') {
          var parsed = JSON.parse(body);
          debug("bhtHttpGet: " + JSON.stringify(parsed, null, 3));
          if (typeof parsed.noun !== null) wordObj.noun = parsed.noun;
          if (typeof parsed.verb !== null) wordObj.verb = parsed.verb;
          if (typeof parsed.adjective !== null) wordObj.adjective = parsed.adjective;
          if (typeof parsed.adverb !== null) wordObj.adverb = parsed.adverb;
          status = "BHT_HIT";
          wordObj.bhtSearched = true;
          wordObj.bhtFound = true;
        } else {
          debug("bhtHttpGet: \'" + wordObj.nodeId + "\' NOT FOUND");
          status = "BHT_MISS";
          wordObj.bhtSearched = true;
          wordObj.bhtFound = false;
        }

        wordServer.findOneWord(wordObj, true, function(err, wordUpdatedObj) {
          debug(chalkBht("bhtHttpGet: ->- DB UPDATE | " + wordUpdatedObj.nodeId 
            + " | MNS: " + wordUpdatedObj.mentions));
          debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
          callback(status, wordUpdatedObj);
          return;
        });
      });
    }
  }).on('error', function(e) {
    bhtErrors++;
    debug(chalkError("BHT ERROR" 
      + " | TOTAL ERRORS: " + bhtErrors 
      + " | WORD: " + wordObj.nodeId
      // + " | STATUS CODE: " + response.statusCode
      // + " | STATUS MESSAGE: " + response.statusMessage
      + "\n" + util.inspect(e, {
        showHidden: false,
        depth: 3
      })
    ));
    callback("BHT_ERROR", wordObj);
  });
}

function generatePrompt(query, callback) {
  debug("->- GEN PROMPT | " + query.input + " | " + query.algorithm.toUpperCase());

  // wordVariations = [ 'syn', 'ant', 'rel', 'sim', 'usr' ]

  switch (query.algorithm) {
    case 'antonym':
      wordServer.getWordVariation(query.input, wordTypes, ['ant'], function(status, antWordObj) {
        if (status == 'BHT_VAR_HIT') {
          // debug("randomWordObj: " + randomWordObj.nodeId);
          debug("Word CACHE SET8: " + antWordObj.nodeId);
          wordCache.set(antWordObj.nodeId, antWordObj);
          callback('OK', antWordObj);
          return;
        } else if (status == 'BHT_VAR_MISS') {
          wordServer.getRandomWord(function(err, randomWordObj) {
            if (!err) {
              debug("-G- GEN RANDOM - ANT MISS: " + randomWordObj.nodeId);
              debug("Word CACHE SET9: " + randomWordObj.nodeId);
              wordCache.set(randomWordObj.nodeId, randomWordObj);
              callback('OK', randomWordObj);
              return;
            } else {
              debug("*** GENERATE PROMPT ERROR | " + status);
              callback('ERROR', status);
              return;
            }
          });
        } else {
          debug("*** GENERATE PROMPT ERROR | " + status);
          callback('ERROR', status);
          return;
        }
      });
      break;
    case 'synonym':
      wordServer.getWordVariation(query.input, wordTypes, ['syn', 'sim'], function(status, synWordObj) {
        if (status == 'BHT_VAR_HIT') {
          // debug("randomWordObj: " + randomWordObj.nodeId);
          debug("Word CACHE SET10: " + synWordObj.nodeId);
          wordCache.set(synWordObj.nodeId, synWordObj);
          callback('OK', synWordObj);
          return;
        } else if (status == 'BHT_VAR_MISS') {
          wordServer.getRandomWord(function(err, randomWordObj) {
            if (!err) {
              debug("-G- GEN RANDOM - SYN MISS: " + randomWordObj.nodeId);
              debug("Word CACHE SET11: " + randomWordObj.nodeId);
              wordCache.set(randomWordObj.nodeId, randomWordObj);
              callback('OK', randomWordObj);
              return;
            } else {
              debug("*** GENERATE PROMPT ERROR | " + status);
              callback('ERROR', status);
              return;
            }
          });
        } else {
          debug("*** GENERATE PROMPT ERROR | " + status);
          callback('ERROR', status);
          return;
        }
      });
      break;
    default: // 'random':
      wordServer.getRandomWord(function(err, randomWordObj) {
        if (!err) {
          // debug("randomWordObj: " + randomWordObj.nodeId);
          debug("Word CACHE SET12: " + randomWordObj.nodeId);
          wordCache.set(randomWordObj.nodeId, randomWordObj);
          callback('OK', randomWordObj);
          return;
        } else {
          callback('ERROR', err);
          return;
        }
      });
      break;
  }
}

wapiEvents.on("WAPI_OVER_LIMIT_TIMEOUT", function() {
  if (wapiOverLimitFlag) {
    debug(chalkWapi("*** WAPI_OVER_LIMIT_TIMEOUT END *** | " 
      + moment().format(defaultDateTimeFormat)));
  } else {
    debug(chalkWapi(" WAPI_OVER_LIMIT_TIMEOUT END (NO OVER LIMIT) | " 
      + moment().format(defaultDateTimeFormat)));
  }

  wapiOverLimitFlag = false;
  wapiOverLimitTestFlag = false;

  wapiOverLimitTime = moment.utc();

  wapiLimitResetTime = moment.utc();
  wapiLimitResetTime.endOf("day");

  updateStats({
    wapiRequests: wapiRequests,
    wapiOverLimitTime: wapiOverLimitTime,
    wapiLimitResetTime: wapiLimitResetTime,
    wapiOverLimitFlag: wapiOverLimitFlag
  });

  wapiTimeToReset = wapiLimitResetTime.valueOf() - wapiOverLimitTime.valueOf();

  clearTimeout(wapiOverLimitTimeOut);

  wapiOverLimitTimeOut = setTimeout(function() {
    wapiEvents.emit("WAPI_OVER_LIMIT_TIMEOUT");
  }, wapiTimeToReset);
});

wapiEvents.on("WAPI_OVER_LIMIT", function() {

  io.of(adminNameSpace).emit('WAPI_OVER_LIMIT', wapiRequests);
  io.of(utilNameSpace).emit('WAPI_OVER_LIMIT', wapiRequests);
  io.of(testUsersNameSpace).emit('WAPI_OVER_LIMIT', wapiRequests);
  io.of(userNameSpace).emit('WAPI_OVER_LIMIT', wapiRequests);

  wapiOverLimits++;
  wapiOverLimitFlag = true;
  wapiOverLimitTestFlag = false;

  wapiOverLimitTime = moment.utc();

  wapiLimitResetTime = moment.utc();
  wapiLimitResetTime.endOf("day");

  // wapiTimeToReset = moment(wapiLimitResetTime);
  // wapiTimeToReset.subtract(wapiOverLimitTime);
  wapiTimeToReset = wapiLimitResetTime.valueOf() - wapiOverLimitTime.valueOf();

  debug(chalkWapi("wapiSearchWord: *** OVER LIMIT *** | " + wapiRequests + " REQUESTS"));
  debug(chalkWapi("wapiSearchWord: *** OVER LIMIT *** | WAPI OVER LIMIT TIME:      " + wapiOverLimitTime.format(defaultDateTimeFormat)));
  debug(chalkWapi("wapiSearchWord: *** OVER LIMIT *** | WAPI LIMIT RESET TIME:     " + wapiLimitResetTime.format(defaultDateTimeFormat)));
  debug(chalkWapi("wapiSearchWord: *** OVER LIMIT *** | WAPI OVER LIMIT REMAINING: " + msToTime(wapiTimeToReset)));

  debug("SET WAPI REQUESTS TO LIMIT: " + statsObj.wapi.requestLimit);
  wapiRequests = statsObj.wapi.requestLimit;
  debug("SET wapiOverLimitTimeOut = " + msToTime(wapiTimeToReset) + " | " + wapiTimeToReset + " ms");

  updateStats({
    "wapiOverLimits": wapiOverLimits,
    "wapiOverLimitTime": wapiOverLimitTime,
    "wapiOverLimitFlag": wapiOverLimitFlag,
    "wapiRequests": statsObj.wapi.requestLimit
  });

  clearTimeout(wapiOverLimitTimeOut);

  wapiOverLimitTimeOut = setTimeout(function() {
    wapiEvents.emit("WAPI_OVER_LIMIT_TIMEOUT");
  }, wapiTimeToReset);
});

bhtEvents.on("BHT_OVER_LIMIT_TIMEOUT", function() {
  if (bhtOverLimitFlag) {
    debug(chalkBht("*** BHT_OVER_LIMIT_TIMEOUT END *** | " 
      + moment().format(defaultDateTimeFormat)));
  } else {
    debug(chalkBht(" BHT_OVER_LIMIT_TIMEOUT END (NO OVER LIMIT) | " 
      + moment().format(defaultDateTimeFormat)));
  }

  bhtOverLimitFlag = false;
  bhtOverLimitTestFlag = false;
  setBhtReqs(0);

  bhtOverLimitTime = moment.utc();
  bhtOverLimitTime.utcOffset("-07:00");

  bhtLimitResetTime = moment.utc();
  bhtLimitResetTime.utcOffset("-07:00");
  bhtLimitResetTime.endOf("day");

  updateStats({
    bhtRequests: bhtRequests,
    bhtOverLimitTime: bhtOverLimitTime,
    bhtLimitResetTime: bhtLimitResetTime,
    bhtOverLimitFlag: bhtOverLimitFlag
  });

  bhtTimeToReset = bhtLimitResetTime.valueOf() - bhtOverLimitTime.valueOf();

  clearTimeout(bhtOverLimitTimeOut);

  bhtOverLimitTimeOut = setTimeout(function() {
    bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
  }, bhtTimeToReset);
});

bhtEvents.on("BHT_OVER_LIMIT", function() {

  io.of(adminNameSpace).emit('BHT_OVER_LIMIT', bhtRequests);
  io.of(utilNameSpace).emit('BHT_OVER_LIMIT', bhtRequests);
  io.of(testUsersNameSpace).emit('BHT_OVER_LIMIT', bhtRequests);
  io.of(userNameSpace).emit('BHT_OVER_LIMIT', bhtRequests);

  bhtOverLimits++;
  bhtOverLimitFlag = true;
  bhtOverLimitTestFlag = false;

  bhtOverLimitTime = moment.utc();
  bhtOverLimitTime.utcOffset("-07:00");

  bhtLimitResetTime = moment.utc();
  bhtLimitResetTime.utcOffset("-07:00");
  bhtLimitResetTime.endOf("day");

  // bhtTimeToReset = moment(bhtLimitResetTime);
  // bhtTimeToReset.subtract(bhtOverLimitTime);
  bhtTimeToReset = bhtLimitResetTime.valueOf() - bhtOverLimitTime.valueOf();

  debug(chalkBht("bhtSearchWord: *** OVER LIMIT *** | " + bhtRequests + " REQUESTS"));
  debug(chalkBht("bhtSearchWord: *** OVER LIMIT *** | BHT OVER LIMIT TIME:      " + bhtOverLimitTime.format(defaultDateTimeFormat)));
  debug(chalkBht("bhtSearchWord: *** OVER LIMIT *** | BHT LIMIT RESET TIME:     " + bhtLimitResetTime.format(defaultDateTimeFormat)));
  debug(chalkBht("bhtSearchWord: *** OVER LIMIT *** | BHT OVER LIMIT REMAINING: " + msToTime(bhtTimeToReset)));

  debug("SET BHT REQUESTS TO LIMIT: " + BHT_REQUEST_LIMIT);
  bhtRequests = BHT_REQUEST_LIMIT;
  debug("SET bhtOverLimitTimeOut = " + msToTime(bhtTimeToReset) + " | " + bhtTimeToReset + " ms");

  updateStats({
    "bhtOverLimits": bhtOverLimits,
    "bhtOverLimitTime": bhtOverLimitTime,
    "bhtOverLimitFlag": bhtOverLimitFlag,
    "bhtRequests": BHT_REQUEST_LIMIT
  });

  clearTimeout(bhtOverLimitTimeOut);

  bhtOverLimitTimeOut = setTimeout(function() {
    bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
  }, bhtTimeToReset);
});

function bhtSearchWord(wordObj, callback) {

  if (wordObj.bhtFound) {
    callback("BHT_FOUND", wordObj);
    return;
  } 
  else if (bhtOverLimitFlag) {

    var now = moment.utc();
    now.utcOffset("-07:00");

    debug(chalkBht("*** BHT OVER LIMIT" 
      + " | LIMIT: " + BHT_REQUEST_LIMIT 
      + " | REQS: " + bhtRequests 
      + " | OVER: " + bhtOverLimitTime.format(defaultDateTimeFormat) 
      + " | RESET: " + bhtLimitResetTime.format(defaultDateTimeFormat) 
      + " | REMAIN: " + msToTime(bhtLimitResetTime.diff(now))
    ));
    callback("BHT_OVER_LIMIT", wordObj);
    return;
  } 
  else {

    incrementSocketBhtReqs(1);

    debug(chalkBht(">>> BHT SEARCH (before replace): " + wordObj.nodeId));

    wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, ' ');
    wordObj.nodeId = wordObj.nodeId.replace(/[\n\r\[\]\{\}\<\>\/\;\:\"\`\~\?\!\@\#\$\%\^\&\*\(\)\_\+\=\.\,]+/g, '');
    wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, ' ');
    wordObj.nodeId = wordObj.nodeId.replace(/^-+|-+$/g, '');
    wordObj.nodeId = wordObj.nodeId.replace(/^\s+|\s+$/g, '');
    wordObj.nodeId = wordObj.nodeId.replace(/^\'+/g, '');
    wordObj.nodeId = wordObj.nodeId.replace(/\'+/g, "'");
    wordObj.nodeId = wordObj.nodeId.toLowerCase();

    debug(chalkBht(">>> BHT SEARCH (after replace):  " + wordObj.nodeId));

    var bhtHost = "words.bighugelabs.com";
    var path = "/api/2/" + bigHugeLabsApiKey + "/" + encodeURI(wordObj.nodeId) + "/json";

    bhtHttpGet(bhtHost, path, wordObj, function(status, bhtResponseObj) {
      if (status == 'BHT_REDIRECT') {
        var pathRedirect = "/api/2/" + bigHugeLabsApiKey + "/" + encodeURI(bhtResponseObj.bhtAlt) + "/json";
        bhtHttpGet(bhtHost, pathRedirect, bhtResponseObj, function(statusRedirect, responseRedirectObj) {
          callback(statusRedirect, responseRedirectObj);
        });
      } else {
        callback(status, bhtResponseObj);
      }
    });
  }
}

function chainDeadEnd(chain) {

  debug(chalkError("chainDeadEnd\n" + jsonPrint(chain)));

  if (chain.length > MIN_CHAIN_FREEZE_LENGTH) {

    var uniqueNodes = [];
    var chainSegment = [];

    for (var i = chain.length - 1; i >= chain.length - MIN_CHAIN_FREEZE_LENGTH; i--) {

      chainSegment.push(chain[i]);

      // if (uniqueNodes.indexOf(chain[i]) == -1){

      if (uniqueNodes.length >= MIN_CHAIN_FREEZE_UNIQUE_NODES) {
        debug(chalkError("... NO CHAIN FREEZE\n" + uniqueNodes));
        return false;
      } else if (i == chain.length - MIN_CHAIN_FREEZE_LENGTH) {
        statsObj.chainFreezes++;
        debug(chalkError("*** CHAIN FREEZE" 
          + "\nSEG\n" + chainSegment 
          + "\nUNIQUE\n" + uniqueNodes
        ));
        return true;
      } else if (uniqueNodes.indexOf(chain[i]) == -1) {
        uniqueNodes.push(chain[i]);
        debug(chalkError("ADDED UNIQUE NODE\n" + uniqueNodes));
      }
      // }
    }
  } else {
    debug(chalkError("... NO CHAIN FREEZE\nCHAIN\n" + chain));
    return false;
  }
}

function incrementDeltaBhtReqs(delta) {
  var d = parseInt(delta);
  if (d == 0) {
    deltaBhtRequests = 0;
  } else {
    deltaBhtRequests += d;
  }
}

function incrementDeltaMwReqs(delta) {
  var d = parseInt(delta);
  if (d == 0) {
    deltaMwRequests = 0;
  } else {
    deltaMwRequests += d;
  }
}

function setWordCacheTtl(value) {
  debug(chalkWarn("SET WORD CACHE TTL: PREV: " + wordCacheTtl + " | NOW: " + value));
  wordCacheTtl = parseInt(value);
  updateStats({
    wordCacheTtl: wordCacheTtl
  });
}

function setBhtReqs(value) {
  debug(chalkInfo("SET BHT REQS: PREV: " + bhtRequests + " | NOW: " + value));
  bhtRequests = parseInt(value);
  updateStats({
    bhtRequests: bhtRequests
  });
}

function incrementSocketBhtReqs(delta) {

  if ((bhtRequests >= BHT_REQUEST_LIMIT) || ((bhtRequests + delta) > BHT_REQUEST_LIMIT)) {
    debug(chalkInfo("!!! incrementSocketBhtReqs: AT BHT_REQUEST_LIMIT: " + bhtRequests 
      + " | NOW: " + BHT_REQUEST_LIMIT));
    bhtRequests = BHT_REQUEST_LIMIT;
    io.of(adminNameSpace).emit('BHT_OVER_LIMIT', bhtRequests);
    io.of(utilNameSpace).emit('BHT_OVER_LIMIT', bhtRequests);
    io.of(testUsersNameSpace).emit('BHT_OVER_LIMIT', bhtRequests);
    io.of(userNameSpace).emit('BHT_OVER_LIMIT', bhtRequests);
  } else if (delta > 0) {
    bhtRequests += delta;
    var remain = BHT_REQUEST_LIMIT - bhtRequests;
    debug(chalkInfo("-#- BHT REQS: " + bhtRequests 
      + " | DELTA: " + delta 
      + " | LIMIT: " + BHT_REQUEST_LIMIT 
      + " | REMAIN: " + remain
    ));
    incrementDeltaBhtReqs(delta);
  }
}

function incrementSocketMwReqs(delta) {

  if ((mwRequests > MW_REQUEST_LIMIT) || ((mwRequests + delta) > MW_REQUEST_LIMIT)) {
    debug(chalkInfo("!!! incrementSocketMwReqs: AT MW_REQUEST_LIMIT: " + mwRequests 
      + " | NOW: " + MW_REQUEST_LIMIT));
    mwRequests = MW_REQUEST_LIMIT;
  } else if (delta > 0) {
    mwRequests += delta;
    var remain = MW_REQUEST_LIMIT - mwRequests;
    debug(chalkInfo("-#- MW  REQS: " + mwRequests 
      + " | DELTA: " + delta 
      + " | LIMIT: " + MW_REQUEST_LIMIT 
      + " | REMAIN: " + remain
    ));
    incrementDeltaMwReqs(delta);
  }
}

function sessionUpdateDb(sessionObj, callback) {

  debug(chalkSession("sessionUpdateDb"
    + " | UID: " + sessionObj.userId
    + " | WCI: " + sessionObj.wordChainIndex
    + " | WCL: " + sessionObj.wordChain.length
  ))

  // debug("sessionUpdateDb: sessionObj: " + JSON.stringify(sessionObj, null, 3));
  // console.log("sessionUpdateDb: sessionObj: " + util.inspect(sessionObj, {showHidden: false, depth: 2}));

  var query = {
    sessionId: sessionObj.sessionId
  };

  var update = {
    $set: {
      "config": sessionObj.config,
      "userId": sessionObj.userId,
      "tags": sessionObj.tags,
      "user": sessionObj.user,
      "namespace": sessionObj.namespace,
      "ip": sessionObj.ip,
      "domain": sessionObj.domain,
      "lastSeen": sessionObj.lastSeen,
      "connected": sessionObj.connected,
      "wordChainIndex": sessionObj.wordChainIndex,
      "wordChain": sessionObj.wordChain
    },
    $max: {
      "connectTime": sessionObj.connectTime,
      "disconnectTime": sessionObj.disconnectTime
    },
  };

  var options = {
    upsert: true,
    new: true
  };

  Session.findOneAndUpdate(
    query,
    update,
    options,
    function(err, ses) {
      if (err) {
        console.log("!!! SESSION FINDONE ERROR: " + moment().format(defaultDateTimeFormat) 
          + " | " + sessionObj.sessionId + "\n" + err);
        callback(err, sessionObj);
      } else {
        debug(chalkSession("SESSION UPDATED" 
          + " | " + ses.sessionId 
          + " | NSP: " + ses.namespace 
          + " | UID: " + ses.userId 
          + " | IP: " + ses.ip 
          + " | DOM: " + ses.domain 
          + " | CON: " + ses.connected 
          + " | WCI: " + ses.wordChainIndex 
          // + " | WCL: " + ses.wordChain.length 
          + "\nCONFIG\n" + jsonPrint(ses.config)
        ));
        callback(null, ses);
      }
    }
  );
}

function findSessionById(sessionId, callback) {

  var query = {
    sessionId: sessionId
  };

  Session.findOne(
    query,
    function(err, session) {
      if (err) {
        console.log(chalkError("!!! SESSION FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat) 
          + "\nSESSION ID: " + sessionId 
          + "\n" + err
        ));
        callback(err, null);
      } else if (session) {
        debug(chalkInfo(moment().format(defaultDateTimeFormat) 
          + " | SESSION FOUND\n" + jsonPrint(session)));
        callback(null, session);
      } else {
        debug(chalkAlert(moment().format(defaultDateTimeFormat) 
          + " | SESSION NOT FOUND"));
        callback(null, null);
      }
    }
  );
}

function groupFindAllDb(options, callback) {

  debug("\n=============================\nGROUPS IN DB\n----------");
  if (options) debug("OPTIONS\n" + jsonPrint(options));

  var query = {};

  Group.find(query, options, function(err, groups) {
    if (err) {
      callback(err, null);
      return;
    }
    if (groups) {

      async.forEach(

        groups,

        function(group, cb) {

          debug(chalkDb("GID: " + group.groupId 
            + " | N: " + group.name 
            + " | LS: " + getTimeStamp(group.lastSeen)
            + "\n" + jsonPrint(group)
          ));

          groupHashMap.set(group.groupId, group);
          cb(null);

        },

        function(err) {
          if (err) {
            console.log("*** ERROR  groupFindAllDb\n" + err);
            callback(err, null);
            return;
          } else {
            console.log("FOUND " + groups.length + " GROUPS");
            callback(null, groups.length);
            return;
          }
        }
      );

    } else {
      console.log("NO GROUPS FOUND");
      callback(null, 0);
      return;
    }
  });
}

function groupUpdateDb(userObj, callback){

  debug(chalkRed("groupUpdateDb\n" + jsonPrint(userObj)));

  var groupUpdateObj = new Group();

  if (entityChannelGroupHashMap.has(userObj.tags.entity.toLowerCase())) {

    var entityObj = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase());

    if ((typeof entityObj !== 'undefined') && groupHashMap.has(entityObj.groupId)) {

      var groupObj = groupHashMap.get(entityObj.groupId);

      groupObj.groupId = entityObj.groupId;

      groupUpdateObj.groupId = entityObj.groupId;
      groupUpdateObj.name = groupObj.name;
      groupUpdateObj.colors = groupObj.colors;
      groupUpdateObj.tags = userObj.tags;

      groupUpdateObj.addEntityArray = [];
      groupUpdateObj.addEntityArray.push(userObj.tags.entity.toLowerCase());
      groupUpdateObj.addChannelArray = [];
      groupUpdateObj.addChannelArray.push(userObj.tags.channel.toLowerCase());

      console.log(chalkDb("GROUP HASH HIT"
        + " | " + userObj.tags.entity.toLowerCase()
        + " | " + groupUpdateObj.groupId
        + " | " + groupUpdateObj.name
        + " | +ENT: " + groupUpdateObj.addEntityArray
        + " | +CH: " + groupUpdateObj.addChannelArray
      ));

      dbUpdateGroupQueue.enqueue(groupUpdateObj);

      callback(null, entityObj);
    }
    else if (
      (typeof entityObj !== 'undefined') 
      && (entityObj.groupId) 
      && !entityObj.groupId.match(hostname)) {

      console.log(chalkError("*** GROUP HASH MISS ... SKIPPING DB GROUP UPDATE"
        + " | GROUP HASH MISS"
        + " | " + entityObj.groupId
        + " | " + userObj.tags.entity.toLowerCase()
      ));

      statsObj.group.hashMiss[entityObj.groupId] = 1;
      statsObj.group.allHashMisses[entityObj.groupId] = 1;

      configEvents.emit("HASH_MISS", {type: "group", value: entityObj.groupId});

      callback(null, entityObj);
    }
    else if (typeof entityObj === 'undefined') {

      console.log(chalkError("*0* ENTITY HASH MISS ... SKIPPING DB GROUP UPDATE"
        + " | ENTITY HASH MISS"
        + " | " + userObj.tags.entity.toLowerCase()
      ));

      statsObj.entityChannelGroup.hashMiss[userObj.tags.entity.toLowerCase()] = 1;
      statsObj.entityChannelGroup.allHashMisses[userObj.tags.entity.toLowerCase()] = 1;

      configEvents.emit("HASH_MISS", {type: "entity", value: userObj.tags.entity.toLowerCase()});

      callback(null, entityObj);
    }
  }
  else {
    userObj.groupId = userObj.tags.entity.toLowerCase();

    configEvents.emit("HASH_MISS", {type: "entity", value: userObj.tags.entity.toLowerCase()});

    console.log(chalkError("*1* ENTITY HASH MISS ... SKIPPING DB GROUP UPDATE"
      + " | " + userObj.tags.entity.toLowerCase()
    ));

    callback(null, entityObj);
  }  
}

function entityFindAllDb(options, callback) {

  debug("\n=============================\nENTITIES IN DB\n----------");
  if (options) debug("OPTIONS\n" + jsonPrint(options));

  var query = {};

  Entity.find(query, options, function(err, entities) {
    if (err) {
      callback(err, null);
      return;
    }
    if (entities) {

      async.forEach(

        entities,

        function(entity, cb) {

          // console.log(chalkDb("GID: " + entity.entityId 
          //   + " | N: " + entity.name 
          //   + " | LS: " + getTimeStamp(entity.lastSeen)
          // ));

          entityChannelGroupHashMap.set(entity.entityId, entity);
          cb(null);

        },

        function(err) {
          if (err) {
            console.log("*** ERROR  entityFindAllDb\n" + err);
            callback(err, null);
            return;
          } else {
            console.log("FOUND " + entities.length + " ENTITIES");
            callback(null, entities.length);
            return;
          }
        }
      );

    } else {
      console.log("NO ENTITIES FOUND");
      callback(null, 0);
      return;
    }
  });
}

function entityUpdateDb(userObj, callback){

  debug(chalkRed("entityUpdateDb\n" + jsonPrint(userObj)));

  var entityObj = entityCache.get(userObj.tags.entity.toLowerCase());

  if (!entityObj) {

    entityObj = new Entity();
    entityObj.entityId = userObj.tags.entity.toLowerCase();
    entityObj.groupId = userObj.userId;
    entityObj.name = userObj.userId;
    entityObj.screenName = userObj.screenName;
    entityObj.tags = userObj.tags;

    if (entityChannelGroupHashMap.has(userObj.tags.entity.toLowerCase())){
      entityObj.name = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase()).name;
      entityObj.groupId = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase()).groupId;
    }

    console.log(chalkDb("ENTITY CACHE MISS ON USER READY"
      + " | EID: " + entityObj.entityId
      + " | GID: " + entityObj.groupId
      + " | N: " + entityObj.name
      + " | SN: " + entityObj.screenName
    ));

    dbUpdateEntityQueue.enqueue(entityObj);
    callback(null, entityObj);

  }
  else {
    entityObj.entityId = userObj.tags.entity.toLowerCase();
    entityObj.name = userObj.userId;
    entityObj.screenName = userObj.screenName;

    if (entityChannelGroupHashMap.has(userObj.tags.entity.toLowerCase())){
      entityObj.name = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase()).name;
      entityObj.groupId = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase()).groupId;
    }

    console.log(chalkDb("ENTITY CACHE HIT ON USER READY"
      + " | EID: " + entityObj.entityId
      + " | GID: " + entityObj.groupId
      + " | N: " + entityObj.name
      + " | SN: " + entityObj.screenName
    ));

    dbUpdateEntityQueue.enqueue(entityObj);
    callback(null, entityObj);
  }  
}

function adminUpdateDb(adminObj, callback) {

  if (adminObj.ip && (typeof adminObj.domain === 'undefined')) {
    dnsReverseLookup(adminObj.ip, function(err, domains) {
      if (err) {
        adminObj.domain = 'DOMAIN NOT FOUND';
        console.log("adminUpdateDb: DOMAIN NOT FOUND"
          + " | " + adminObj.ip 
          + " | " + adminObj.userId
        );
      } else if (domains[0]) {
        adminObj.domain = domains[0];
        debug("adminUpdateDb: UPDATED DOMAIN"
          + " | " + adminObj.userId 
          + " | " + adminObj.domain
        );
      }
    });
  }

  var query = {
    adminId: adminObj.adminId
  };
  var update = {
    $set: {
      "screenName": adminObj.screenName,
      "domain": adminObj.domain,
      "namespace": adminObj.namespace,
      "ip": adminObj.ip,
      "sessionId": adminObj.lastSession,
      "description": adminObj.description,
      "url": adminObj.url,
      "profileUrl": adminObj.profileUrl,
      "profileImageUrl": adminObj.profileImageUrl,
      "verified": adminObj.verified,
      "lastSeen": adminObj.lastSeen,
      "lastSession": adminObj.lastSession,
      "connected": adminObj.connected
    },
    $max: {
      "connectTime": adminObj.connectTime,
      "disconnectTime": adminObj.disconnectTime
    },
    $push: {
      "sessions": adminObj.lastSession
    }
  };
  var options = {
    upsert: true,
    new: true
  };

  Admin.findOneAndUpdate(
    query,
    update,
    options,
    function(err, ad) {
      if (err) {
        console.log("!!! ADMIN FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat) 
          + " | " + adminObj.adminId 
          + "\nQUERY: " + jsonPrint(query) 
          + "\nUPDATE: " + jsonPrint(update) 
          + "\nOPTIONS: " + jsonPrint(options) 
          + "\nERROR: " + jsonPrint(err)
        );
        callback(err, adminObj);
        return;
      } else {
        debug(">>> ADMIN UPDATED" 
          + " | " + ad.adminId 
          + " | IP: " + ad.ip 
          + " | DOM: " + ad.domain 
          + " | SID: " + ad.sessionId 
          + " | SN: " + ad.screenName
          + " | VER: " + ad.verified 
          + " | LS: " + getTimeStamp(ad.lastSeen) 
          + " | SES: " + ad.sessions.length 
          + " | LSES: " + ad.lastSession 
          + " | CON: " + ad.connected
        );
        callback(null, ad);
        return;
      }
    }
  );
}

function viewerUpdateDb(viewerObj, callback) {

  var query = {
    viewerId: viewerObj.viewerId
  };
  var update = {
    $set: {
      "namespace": viewerObj.namespace,
      "domain": viewerObj.domain,
      "ip": viewerObj.ip,
      "sessionId": viewerObj.lastSession,
      "screenName": viewerObj.screenName,
      "description": viewerObj.description,
      "url": viewerObj.url,
      "profileUrl": viewerObj.profileUrl,
      "profileImageUrl": viewerObj.profileImageUrl,
      "verified": viewerObj.verified,
      "lastSeen": moment(),
      "lastSession": viewerObj.lastSession,
      "connected": viewerObj.connected
    },
    $max: {
      "connectTime": viewerObj.connectTime,
      "disconnectTime": viewerObj.disconnectTime
    },
    $push: {
      "sessions": viewerObj.lastSession
    }
  };
  var options = {
    upsert: true,
    new: true
  };

  Viewer.findOneAndUpdate(
    query,
    update,
    options,
    function(err, vw) {
      if (err) {
        console.log("!!! VIEWER FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat) 
          + " | " + viewerObj.viewerId 
          + "\n" + err
        );
        callback(err, viewerObj);
      } else {
        debug(">>> VIEWER UPDATED" 
          + " | " + vw.viewerId 
          + " | SN: " + vw.screenName 
          + " | NSP: " + vw.namespace 
          + " | IP: " + vw.ip 
          + " | DOM: " + vw.domain 
          + " | SID: " + vw.sessionId
          + " | VER: " + vw.verified 
          + " | LS: " + getTimeStamp(vw.lastSeen) 
          + " | SES: " + vw.sessions.length 
          + " | LSES: " + vw.lastSession
        );
        callback(null, vw);
      }
    }
  );
}

function userUpdateDb(userObj, callback) {

  if (userObj.ip && (typeof userObj.domain === 'undefined')) {
    dnsReverseLookup(userObj.ip, function(err, domains) {
      if (err) {
        console.log(chalkError("*** dnsReverseLookup ERROR\n" + err));
      } else {
        if (domains[0]) {
          userObj.domain = domains[0];
          debug("userUpdateDb: UPDATED DOMAIN | " + userObj.userId + " | " + userObj.domain);
        }
      }
    });
  }

  var query = {
    userId: userObj.userId
  };
  var update = {
    $set: {
      "namespace": userObj.namespace,
      "domain": userObj.domain,
      "ip": userObj.ip,
      "sessionId": userObj.lastSession,
      "name": userObj.name,
      "screenName": userObj.screenName,
      "description": userObj.description,
      "url": userObj.url,
      "profileUrl": userObj.profileUrl,
      "profileImageUrl": userObj.profileImageUrl,
      "verified": userObj.verified,
      "tags": userObj.tags,
      "lastSeen": userObj.lastSeen,
      "lastSession": userObj.lastSession,
      "connected": userObj.connected
    },
    $max: {
      "connectTime": userObj.connectTime,
      "disconnectTime": userObj.disconnectTime
    },
    $push: {
      "sessions": userObj.lastSession
    }
  };
  var options = {
    upsert: true,
    new: true
  };

  User.findOneAndUpdate(
    query,
    update,
    options,
    function(err, us) {
      if (err) {
        console.log("!!! USER FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat) 
          + " | " + userObj.userId 
          + "\n" + err
        );
        callback(err, userObj);
      } else {
        console.log(chalkUser(">>> USER UPDATED" 
          + " | " + us.userId 
          + " | N: " + us.name 
          + " | SN:   " + us.screenName 
          + " | NSP:  " + us.namespace 
          + " | IP:   " + us.ip 
          + " | DOM:  " + us.domain 
          + "\nSID:  " + us.sessionId
          + " | VER:  " + us.verified 
          + " | LS:   " + getTimeStamp(us.lastSeen) 
          + " | SES:  " + us.sessions.length 
          + " | LSES: " + us.lastSession 
          + " | CON:  " + us.connected
          + " \nTAGS: " + jsonPrint(us.tags) 
        ));
        callback(null, us);
      }
    }
  );
}

function adminFindAllDb(options, callback) {

  debug("\n=============================\nADMINS IN DB\n----------");
  if (options) debug("OPTIONS\n" + jsonPrint(options));

  var query = {};
  var projections = {
    adminId: true,
    namespace: true,
    sessionId: true,
    ip: true,
    domain: true,
    screenName: true,
    description: true,
    url: true,
    profileUrl: true,
    profileImageUrl: true,
    verified: true,
    createdAt: true,
    lastSeen: true,
    lastSession: true,
    connected: true,
  };

  Admin.find(query, projections, options, function(err, admins) {
    if (err) {
      console.log(err, null);
      callback(err);
      return;
    }
    if (admins) {

      async.forEach(

        admins,

        function(adminObj, callback) {

          debug(chalkAdmin("UID: " + adminObj.adminId 
            + " | SN: " + adminObj.screenName 
            + " | LS: " + getTimeStamp(adminObj.lastSeen)
          ));

          if (!adminObj.adminId || typeof adminObj.adminId === 'undefined' || adminObj.adminId == null) {
            debug(chalkError("*** ERROR: adminFindAllDb: ADMIN ID UNDEFINED *** | SKIPPING ADD TO CACHE"));
            callback("ERROR: ADMIN ID UNDEFINED", null);
            return;
          } else {
            var addCacheResult = adminCache.set(adminObj.adminId, adminObj);
            callback(null, addCacheResult);
            return;
          }

        },

        function(err) {
          if (err) {
            console.log("*** ERROR  adminFindAllDb: " + err);
            callback(err, null);
            return;
          } else {
            debug("FOUND " + admins.length + " ADMINS");
            callback(null, admins.length);
            return;
          }
        }
      );

    } else {
      debug("NO ADMINS FOUND");
      callback(null, 0);
      return;
    }
  });
}

function viewerFindAllDb(options, callback) {

  debug("\n=============================\nVIEWERS IN DB\n----------");
  if (options) debug("OPTIONS\n" + jsonPrint(options));

  var query = {};
  var projections = {
    viewerId: true,
    namespace: true,
    screenName: true,
    description: true,
    url: true,
    profileUrl: true,
    profileImageUrl: true,
    verified: true,
    createdAt: true,
    lastSeen: true,
    lastSession: true,
    connected: true,
  };

  Viewer.find(query, projections, options, function(err, viewers) {
    if (err) {
      callback(err, null);
      return;
    }
    if (viewers) {

      async.forEach(

        viewers,

        function(viewer, callback) {

          debug(chalkViewer("UID: " + viewer.viewerId 
            + " | SN: " + viewer.screenName 
            + " | LS: " + getTimeStamp(viewer.lastSeen)
          ));

          viewerCache.set(viewer.viewerId, viewers);
          callback(null);

        },

        function(err) {
          if (err) {
            console.log("*** ERROR  viewerFindAllDb\n" + err);
            callback(err, null);
            return;
          } else {
            debug("FOUND " + viewers.length + " VIEWERS");
            callback(null, viewers.length);
            return;
          }
        }
      );

    } else {
      debug("NO VIEWERS FOUND");
      callback(null, 0);
      return;
    }
  });
}

function userFindAllDb(options, callback) {

  debug("\n=============================\nUSERS IN DB\n----------");
  if (options) debug("OPTIONS\n" + jsonPrint(options));

  var query = {};
  var projections = {
    userId: true,
    namespace: true,
    sessionId: true,
    ip: true,
    domain: true,
    screenName: true,
    description: true,
    url: true,
    profileUrl: true,
    profileImageUrl: true,
    verified: true,
    createdAt: true,
    lastSeen: true,
    lastSession: true,
    connected: true,
  };

  User.find(query, projections, options, function(err, users) {
    if (err) {
      callback(err, null);
      return;
    }
    if (users) {

      async.forEach(

        users,

        function(user, callback) {

          debug(chalkUser("UID: " + user.userId 
            + " | SN: " + user.screenName 
            + " | LS: " + getTimeStamp(user.lastSeen)
          ));

          userCache.set(user.userId, user);
          callback(null);

        },

        function(err) {
          if (err) {
            console.log("*** ERROR  userFindAllDb\n" + err);
            callback(err, null);
            return;
          } else {
            debug("FOUND " + users.length + " USERS");
            callback(null, users.length);
            return;
          }
        }
      );

    } else {
      debug("NO USERS FOUND");
      callback(null, 0);
      return;
    }
  });
}

function ipAddressFindAllDb(options, callback) {

  debug("\n=============================\nIP ADDRESSES IN DB\n----------");
  if (options) debug("OPTIONS\n" + jsonPrint(options));

  var query = {};
  var projections = {
    ipAddress: true,
    createdAt: true,
    lastSeen: true,
    lastSession: true,
    sessions: true
  };

  IpAddress.find(query, projections, options, function(err, ipAddressArray) {
    if (err) {
      callback(err, null);
      return;
    }
    if (ipAddressArray) {

      async.forEach(

        ipAddressArray,

        function(ipAddress, callback) {
          debug(chalkUser("IP: " + ipAddress.ip 
            + " | LSESS: " + ipAddress.lastSession 
            + " | LS: " + getTimeStamp(ipAddress.lastSeen) 
            + " | #SESS: " + ipAddress.sessions.length
          ));

          ipAddressCache.set(ipAddress.ip, ipAddress);
          callback(null);
        },

        function(err) {
          if (err) {
            console.log("*** ERROR  ipAddressFindAllDb\n" + err);
            callback(err, null);
            return;
          } else {
            debug("FOUND " + ipAddressArray.length + " IP ADDRESSES");
            callback(null, ipAddressArray.length);
            return;
          }
        }
      );

    } else {
      debug("NO IP ADDRESSES FOUND");
      callback(null, 0);
      return;
    }
  });
}

function dumpIoStats() {
  debug("\n-------------\nIO\n-------------" 
    + "\nIO SOCKETS NAME: " + io.sockets.name 
    + "\nSERVER:          " + util.inspect(io.sockets.server, {
        showHidden: false,
        depth: 2
      }) 
    + "\nCONNECTED:       " + util.inspect(io.sockets.connected, {
        showHidden: false,
        depth: 2
      }) 
    + "\nFNS:             " + io.sockets.fns 
    + "\nIDS:             " + io.sockets.ids 
    + "\nACKS:            " + util.inspect(io.sockets.acks, {
        showHidden: false,
        depth: 2
      }) 
    + "\n----------------------------");
}

function oauthExpiryTimer(endTime) {

  var remainingTime = msToTime(endTime - getTimeNow());

  debug("\nSET oauthExpiryTimer: " + getTimeStamp(endTime));
  debug(chalkInfo(moment().format(defaultDateTimeFormat) 
    + " | GOOGLE OAUTH2 CREDENTIAL EXPIRES IN: " + remainingTime + " AT " + endTime));

  var oauthInterval = setInterval(function() {

    remainingTime = msToTime(endTime - getTimeNow());

    if (endTime - getTimeNow() < 60000) {
      debug(chalkAlert(moment().format(defaultDateTimeFormat) 
        + " | GOOGLE OAUTH2 CREDENTIAL EXPIRING IN " + remainingTime));
    }

    if (getTimeNow() >= endTime) {
      debug(chalkAlert(moment().format(defaultDateTimeFormat) 
        + " | GOOGLE OAUTH2 CREDENTIAL EXPIRED: " 
        + " | " + getTimeStamp(endTime)));
      clearInterval(oauthInterval);
      googleAuthorized = false;
      googleMetricsEnabled = false;
      googleOauthEvents.emit('GOOGLE OAUTH2 CREDENTIAL EXPIRED');
      googleOauthEvents.emit('AUTHORIZE GOOGLE');
    }

  }, 10000);
}

function authorizeGoogle() {
  googleOauthClient.authorize(function(err, tokens) {
    if (err) {
      console.log(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ***** GOOGLE OAUTH ERROR: googleOauthClient " 
        + " | " + moment().format(defaultDateTimeFormat) 
        + "\n" + err + "\n"));
      googleOauthEvents.emit('GOOGLE OAUTH ERROR', err);
    } else {

      debug("GOOGLE TOKEN\n" + jsonPrint(tokens));
      googleAuthExpiryDate = tokens.expiry_date;

      googleMonitoring = googleapis.cloudmonitoring({
        version: 'v2beta2',
        auth: googleOauthClient
      });


      var credential = {
        credentialType: 'SERVICE ACCOUNT',
        clientId: GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
        emailAddress: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        expiryDate: googleAuthExpiryDate,
        lastSeen: currentTime
      }
      debug(chalkGoogle("\nGOOGLE OAUTH2 AUTHORIZED"
        + "\n----------------------\nCREDENTIAL\n" + JSON.stringify(tokens, null, 3)));

      findOneOauth2Credential(credential);
      googleAuthorized = true;
      googleMetricsEnabled = true;
      oauthExpiryTimer(tokens.expiry_date);

      debug(chalkInfo(moment().format(defaultDateTimeFormat) 
        + " | GOOGLE OAUTH2 AUTHORIZED: ExpiryDate: " + getTimeStamp(googleAuthExpiryDate)));
      googleOauthEvents.emit('GOOGLE AUTHORIZED', credential);
    }
  });
}

function findOneOauth2Credential(credential) {

  debug("findOneOauth2Credential: credential\n" + jsonPrint(credential));

  var query = {
    clientId: credential.clientId
  };
  var update = {
    $inc: {
      mentions: 1
    },
    $set: {
      credentialType: credential.credentialType,
      clientId: credential.clientId,
      clientSecret: credential.clientSecret,
      emailAddress: credential.emailAddress,
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
      tokenType: credential.tokenType,
      expiryDate: credential.expiryDate,
      lastSeen: currentTime
    }
  };
  var options = {
    upsert: true,
    new: true
  };

  Oauth2credential.findOneAndUpdate(
    query,
    update,
    options,
    function(err, cred) {
      if (err) {
        console.log(chalkError(moment().format(defaultDateTimeFormat) 
          + " | !!! OAUTH2 CREDENTIAL FINDONE ERROR" 
          + "\nCLIENT ID: " + credential.clientId 
          + "\nERROR" + err));
        return credential;
      } else {
        debug(chalkInfo(moment().format(defaultDateTimeFormat) 
          + " | GOOGLE CREDENTIAL UPDATED" 
          + " | EXPIRES AT " + cred.expiryDate
        ));
        debug(chalkGoogle("\n\n--- OAUTH2 CREDENTIAL UPDATED---" 
          + "\nCREDENTIAL TYPE: " + cred.credentialType 
          + "\nCLIENT ID:       " + cred.clientId 
          + "\nCLIENT SECRET:   " + cred.clientSecret 
          + "\nEMAIL ADDR:      " + cred.emailAddress 
          + "\nTOKEN TYPE:      " + cred.tokenType 
          + "\nACCESS TOKEN:    " + cred.accessToken 
          + "\nREFRESH TOKEN:   " + cred.refreshToken 
          + "\nEXPIRY DATE:     " + cred.expiryDate
          + "\nLAST SEEN:       " + cred.lastSeen 
          + "\nMENTIONS:        " + cred.mentions 
          + "\n--------------------------------\n\n"
        ));
        var mentionsString = cred.mentions.toString();
        cred.mentions = mentionsString;
        return cred;
      }

    }
  );
}

function findCredential(clientId, callback) {

  var query = {
    clientId: clientId
  };

  Oauth2credential.findOne(
    query,
    function(err, cred) {
      if (err) {
        console.log(chalkError("!!! OAUTH2 CREDENTIAL FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat) 
          + "\nCLIENT ID: " + clientId 
          + "\n" + err
        ));
        googleOauthEvents.emit('credential error', clientId + "\n" + err);
        callback(err);
        // return;    
      } else if (cred) {
        debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | GOOGLE OAUTH2 CREDENTIAL FOUND"));
        debug(chalkGoogle("GOOGLE OAUTH2 CREDENTIAL\n--------------------------------\n" 
          + "\nCREDENTIAL TYPE: " + cred.credentialType 
          + "\nCLIENT ID:       " + cred.clientId 
          + "\nCLIENT SECRET:   " + cred.clientSecret 
          + "\nEMAIL ADDR:      " + cred.emailAddress 
          + "\nTOKEN TYPE:      " + cred.tokenType 
          + "\nACCESS TOKEN:    " + cred.accessToken 
          + "\nREFRESH TOKEN:   " + cred.refreshToken 
          + "\nEXPIRY DATE:     " + cred.expiryDate 
          + "\nLAST SEEN:       " + getTimeStamp(cred.lastSeen) 
          + "\nMENTIONS:        " + cred.mentions 
          + "\n--------------------------------\n\n"));
        var mentionsString = cred.mentions.toString();
        cred.mentions = mentionsString;
        googleOauthEvents.emit('GOOGLE CREDENTIAL FOUND', cred);
        callback(cred);
      } else {
        debug(chalkAlert(moment().format(defaultDateTimeFormat) + " | GOOGLE OAUTH2 CREDENTIAL NOT FOUND"));
        googleOauthEvents.emit('GOOGLE CREDENTIAL NOT FOUND', clientId);
        callback(null);
      }

    }
  );
}

var deltaPromptsSent = 0;
var deltaResponsesReceived = 0;
var deltaBhtRequests = 0;
var deltaMwRequests = 0;
var metricDateStart = moment().toJSON();
var metricDateEnd = moment().toJSON();

function updateMetrics(googleMetricsUpdateFlag) {

  if (heartbeatsSent % 100 == 0) updateStatsCounts();

  metricDateStart = moment().toJSON();
  metricDateEnd = moment().toJSON();
  // hopefully will avoid Google metric error Timeseries data must be more recent than previously-written data

  debug(moment().format(defaultDateTimeFormat) 
    + " | updateMetrics USERS: " + numberUsers 
    + " | PTX: " + promptsSent 
    + " | RRX: " + responsesReceived 
    + " | STX: " + sessionUpdatesSent 
    + " | BHTR: " + bhtRequests);

  // name: custom.cloudmonitoring.googleapis.com/word-asso/clients/numberUsers
  // label key: custom.cloudmonitoring.googleapis.com/word-asso/clients/numberUsers

  var statArray = [
    numberUsers,
    numberTestUsers,
    numberViewers,
    numberTestViewers,
    wordCache.getStats().keys,
    wordCache.getStats().hits,
    wordCache.getStats().misses,
    promptsSent,
    deltaPromptsSent,
    responsesReceived,
    deltaResponsesReceived,
    deltaBhtRequests,
    bhtRequests,
    totalWords
  ];

  if (googleMetricsUpdateFlag && (typeof googleMonitoring !== 'undefined')) {
    googleMonitoring.timeseries.write({

      'project': GOOGLE_PROJECT_ID,

      'resource': {

        "timeseries": [

          {
            "point": {
              "int64Value": numberUsers,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/users/numberUsers": "NUMBER USERS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/users"
            }
          },

          {
            "point": {
              "int64Value": numberTestUsers,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/users/numberTestUsers": "NUMBER TEST USERS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/users"
            }
          },

          {
            "point": {
              "int64Value": numberViewers,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/viewers/numberViewers": "NUMBER VIEWERS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/viewers"
            }
          },

          {
            "point": {
              "int64Value": numberTestViewers,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/viewers/numberTestViewers": "NUMBER TEST VIEWERS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/viewers"
            }
          },

          {
            "point": {
              "int64Value": parseInt(100.0 * (memoryTotal - memoryAvailable) / memoryTotal),
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/memory/memoryUsed": "MEMORY USED"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/memory/memoryUsed"
            }
          },

          {
            "point": {
              "int64Value": wordCache.getStats().keys,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheKeys": "WORD CACHE KEYS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheKeys"
            }
          },

          {
            "point": {
              "int64Value": wordCache.getStats().hits,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheHits": "WORD CACHE HITS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache"
            }
          },

          {
            "point": {
              "int64Value": wordCache.getStats().misses,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheMisses": "WORD CACHE MISSES"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache"
            }
          },

          {
            "point": {
              "int64Value": parseInt(100 * wordCache.getStats().hits / (1 + wordCache.getStats().misses)),
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheHitMissRatio": "WORD CACHE HIT/MISS RATIO"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheHitMissRatio"
            }
          },

          {
            "point": {
              "int64Value": promptsSent,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/prompts/totalPromptsSent": "PROMPTS SENT"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/prompts/totalPromptsSent"
            }
          },

          {
            "point": {
              "int64Value": deltaPromptsSent,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/prompts/deltaPromptsSent": "DELTA PROMPTS SENT"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/prompts/deltaPromptsSent"
            }
          },

          {
            "point": {
              "int64Value": responsesReceived,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/responses/totalResponsesReceived": "RESPONSES RECEIVED"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/responses/totalResponsesReceived"
            }
          },

          {
            "point": {
              "int64Value": deltaResponsesReceived,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/responses/deltaResponsesReceived": "DELTA RESPONSES RECEIVED"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/responses/deltaResponsesReceived"
            }
          },

          {
            "point": {
              "int64Value": deltaMwRequests,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/mw/deltaMwRequests": "DELTA MW REQUESTS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/mw/deltaMwRequests"
            }
          },

          {
            "point": {
              "int64Value": mwRequests,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/mw/numberMwRequests": "TOTAL DAILY MW REQUESTS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/mw/numberMwRequests"
            }
          },

          {
            "point": {
              "int64Value": deltaBhtRequests,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/bht/deltaBhtRequests": "DELTA BHT REQUESTS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/bht/deltaBhtRequests"
            }
          },

          {
            "point": {
              "int64Value": bhtRequests,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/bht/numberBhtRequests": "TOTAL DAILY BHT REQUESTS"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/bht/numberBhtRequests"
            }
          },

          {
            "point": {
              "int64Value": totalWords,
              "start": metricDateStart,
              "end": metricDateEnd
            },
            "timeseriesDesc": {
              "labels": {
                "custom.cloudmonitoring.googleapis.com/word-asso/words/totalWords": "TOTAL WORDS IN DB"
              },
              "metric": "custom.cloudmonitoring.googleapis.com/word-asso/words/totalWords"
            }
          }

        ]
      }
    }, function(err, res) {
      if (err) {
        console.log("!!! GOOGLE CLOUD MONITORING ERROR " 
          + " | " + moment().format(defaultDateTimeFormat) 
          + " | " + statArray 
          + "\n" + util.inspect(err, {
          showHidden: false,
          depth: 3
        }));

        if (err.code == 500) {
          console.log(chalkGoogle("??? GOOGLE CLOUD MONITORING INTERNAL SERVER ERROR (CODE: 500)"));
        }

        if (err.toString().indexOf("Daily Limit Exceeded") >= 0) {
          console.log(chalkGoogle("!!! GOOGLE CLOUD MONITORING DAILY LIMIT EXCEEDED ... DISABLING METRICS"));
          googleMetricsEnabled = false;
          googleOauthEvents.emit("DAILY LIMIT EXCEEDED");
        }
        if (err.toString().indexOf("socket hang up") >= 0) {
          console.log(chalkGoogle("!!! GOOGLE CLOUD MONITORING SOCKET HUNG UP ... DISABLING METRICS"));
          googleMetricsEnabled = false;
          googleOauthEvents.emit("SOCKET HUNG UP");
        }
      } else {
        debug("GOOGLE MONITORING RESULT: " + jsonPrint(res));
      }
    });
  }

  updateStats({
    deltaResponsesReceived: deltaResponsesReceived
  });

  deltaPromptsSent = 0;
  deltaResponsesReceived = 0;
  incrementDeltaBhtReqs(0);
  incrementDeltaMwReqs(0);

}

var readDnsQueue = setInterval(function() {

  if (!dnsReverseLookupQueue.isEmpty()) {
    var sessionObj = dnsReverseLookupQueue.dequeue();

    dnsReverseLookup(sessionObj.ip, function(err, domains) {
      if (err) {
        console.log(chalkError("\n\n***** ERROR: dnsReverseLookup: " + sessionObj.ip + " ERROR: " + err));
      } else {
        debug("DNS REVERSE LOOKUP: " + sessionObj.ip + " | DOMAINS: " + domains);
        sessionObj.domain = domains[0];
      }

    });

  }
}, 20);

var unpairedUserHashMap = new HashMap();
var sessionRouteHashMap = new HashMap();

function pairUser(sessionObj, callback) {

  sessionObj.config.mode = 'USER_USER'; // should already be set
  debug(unpairedUserHashMap.count() + " PAIRING USER " + sessionObj.userId + " | SID: " + sessionObj.sessionId);

  if (unpairedUserHashMap.count() > 0) {

    var sessionIds = unpairedUserHashMap.keys();


    async.detect(

      sessionIds, // iterate over sessionId array

      function(sessionId, callback) {

        var userId = unpairedUserHashMap.get(sessionId);

        debug(chalkSession("UNPAIRED USER | " + userId + " | SID: " + sessionId));

        if (sessionId != sessionObj.sessionId) {
          callback(true);
        } else {
          callback(false);
        }

      },

      function(foundPairSessionId) {
        if (foundPairSessionId) {

          debug(chalkSession("PPP FOUND USER TO PAIR | A: " + foundPairSessionId 
            + " <-> B: " + sessionObj.sessionId));

          sessionObj.config.userB = sessionObj.sessionId;
          sessionObj.config.userA = foundPairSessionId;
          sessionObj.wordChain = [];
          sessionObj.wordChainIndex = 0;

          // add both A -> B and B -> A to sessionRouteHashMap

          sessionRouteHashMap.set(sessionObj.sessionId, foundPairSessionId);
          sessionRouteHashMap.set(foundPairSessionId, sessionObj.sessionId);

          unpairedUserHashMap.remove(sessionObj.sessionId);
          unpairedUserHashMap.remove(foundPairSessionId);


          sessionUpdateDb(sessionObj, function(err, updatedSessionObj) {
            sessionCache.set(updatedSessionObj.sessionId, updatedSessionObj);

            // update session for userA
            var sessionUserA = sessionCache.get(foundPairSessionId);
            sessionUserA.wordChain = [];
            sessionUserA.wordChainIndex = 0;

            debug("sessionUserA\n" + jsonPrint(sessionUserA));

            sessionUserA.config.userB = sessionObj.sessionId;
            sessionUserA.config.userA = foundPairSessionId;

            sessionUpdateDb(sessionUserA, function(err, updatedSessionObj) {
              sessionCache.set(updatedSessionObj.sessionId, updatedSessionObj);
              callback(null, sessionObj);
              return;
            });

          });
        } else {
          debug("NPF NO PAIR FOUND | " + sessionObj.sessionId);
          callback(null, sessionObj);
          return;
        }
      }
    );
  } 
  else {
    sessionObj.config.userA = sessionObj.sessionId;
    debug(chalkSession("NO UNPAIRED USER FOUND " + sessionObj.userId 
      + " | " + sessionObj.sessionId + " ... ADDING TO unpairedUserHashMap"));
    unpairedUserHashMap.set(sessionObj.sessionId, sessionObj.userId);
    sessionUpdateDb(sessionObj, function(err, updatedSessionObj) {
      sessionCache.set(updatedSessionObj.sessionId, updatedSessionObj);
      callback(null, sessionObj);
      return;
    });
  }
}

function handleSessionEvent(sesObj, callback) {


  switch (sesObj.sessionEvent) {

    case 'SESSION_ABORT':

      console.log(chalkRed("SESSION_ABORT sesObj\n" + jsonPrint(sesObj)));
      
      var socketId;

      var entityRegEx = /#(\w+)$/ ;
      var namespaceRegEx = /^\/(\w+)#/ ;

      var entity = sesObj.sessionId.match(entityRegEx)[1];
      var namespaceMatchArray = sesObj.sessionId.match(namespaceRegEx);

      var namespace;

      if (namespaceMatchArray[1] !== 'undefined') namespace = namespaceMatchArray[1];

      if (sesObj.sessionId.match(entityRegEx)) {
        socketId = sesObj.sessionId.replace(entityRegEx, '');
        // socketId = socketId.replace(namespaceRegEx, '');
      }
      else {
        socketId = sesObj.sessionId;
      }

      var abortObj = {};
      abortObj.entity = entity;

      // io.of(namespace).emit('SESSION_ABORT', sesObj.sessionId);
      utilNameSpace.to(sesObj.sessionId.replace(entityRegEx, '')).emit('SESSION_ABORT', entity);

      console.log(chalkWarn("ABORT SESSION"
        + " | NSP: " + namespace 
        + " | TX SOCKET: " + socketId 
        + " | ENTITY: " + entity 
        + " | SESS ID: " + sesObj.sessionId 
      ));

      sesObj.sessionEvent = 'SESSION_DELETE';
      viewNameSpace.emit('SESSION_DELETE', sesObj);

      // quit();
      break;

    case 'SESSION_EXPIRED':
    case 'SOCKET_ERROR':
    case 'SOCKET_DISCONNECT':

      console.log(chalkSession(
        "XXX " + sesObj.sessionEvent
        // + "\n" + jsonPrint(sesObj)
        + " | " + moment().format(defaultDateTimeFormat) 
        // + " | NSP: " + sesObj.session.namespace 
        + " | SID: " + sesObj.session.sessionId 
        + " | UID: " + sesObj.session.userId 
        // + " | IP: " + sesObj.session.ip 
        // + " | DOMAIN: " + sesObj.session.domain
      ));

      debug(chalkSession("SESSION\n" + jsonPrint(sesObj)));

      sesObj.sessionEvent = 'SESSION_DELETE';
      viewNameSpace.emit('SESSION_DELETE', sesObj);

      if (sesObj.session) {

        sessionCache.del(sesObj.session.sessionId);

        debug(sesObj.sessionEvent + "\n" + jsonPrint(sesObj));

        var currentAdmin = adminCache.get(sesObj.session.userId);
        var currentUser = userCache.get(sesObj.session.userId);
        var currentUtil = utilCache.get(sesObj.session.userId);
        var currentViewer = viewerCache.get(sesObj.session.userId);

        sesObj.session.disconnectTime = moment().valueOf();
        sessionUpdateDb(sesObj.session, function() {});

        sesObj.session.wordChain.forEach(function(wordObj) {
          debug(chalkSession(">T< SET WORD " + wordObj.nodeId + " TTL: " + wordCacheTtl));
          wordCache.ttl(wordObj, wordCacheTtl);
        });


        unpairedUserHashMap.remove(sesObj.session.config.userA);
        unpairedUserHashMap.remove(sesObj.session.config.userB);

        if (sessionRouteHashMap.has(sesObj.session.sessionId)) {
          debug(chalkWarn("FOUND SESSION IN ROUTE HASH: " + sesObj.session.sessionId 
            + "\n" + jsonPrint(sesObj) 
            + "\n" + jsonPrint(sessionRouteHashMap.get(sesObj.session.sessionId))));

          var unpairedSessionObj;

          if (sesObj.session.sessionId == sesObj.session.config.userA) {
            unpairedSessionObj = sessionCache.get(sesObj.session.config.userB);
            debug(chalkWarn(">>> TX PAIRED_USER_END TO USER B: " + sesObj.session.config.userB));
            io.of(sesObj.session.namespace).to(sesObj.session.config.userB).emit('PAIRED_USER_END', sesObj.session.config.userA);
          } else {
            unpairedSessionObj = sessionCache.get(sesObj.session.config.userA);
            debug(chalkWarn(">>> TX PAIRED_USER_END TO USER A: " + sesObj.session.config.userA));
            io.of(sesObj.session.namespace).to(sesObj.session.config.userA).emit('PAIRED_USER_END', sesObj.session.config.userB);
          }

          pairUser(unpairedSessionObj, function(err, updatedSessionObj) {
            if (err) {
              console.log(chalkError("*** pairUser ERROR\n" + jsonPrint(err)));
            } else if (updatedSessionObj.config.userA && updatedSessionObj.config.userB) {

              debug(chalkSession("U_U CREATED USER_USER PAIR" 
                + " | " + moment().valueOf() 
                + " | " + sesObj.session.sessionId 
                + "\n" + jsonPrint(updatedSessionObj.config)));

              io.of(updatedSessionObj.namespace).to(updatedSessionObj.config.userA).emit('PAIRED_USER', updatedSessionObj.config.userB);
              io.of(updatedSessionObj.namespace).to(updatedSessionObj.config.userB).emit('PAIRED_USER', updatedSessionObj.config.userA);

            } else {
              debug(chalkSession("U-? WAITING TO COMPLETE PAIR\n" + jsonPrint(updatedSessionObj.config)));
              return (callback(null, sesObj));
            }
          });
        }

        sessionRouteHashMap.remove(sesObj.session.config.userA);
        sessionRouteHashMap.remove(sesObj.session.config.userB);

        if (currentAdmin) {
          debug("currentAdmin\n" + jsonPrint(currentAdmin));
          adminCache.del(currentAdmin.adminId);

          currentAdmin.lastSeen = moment().valueOf();
          currentAdmin.disconnectTime = moment().valueOf();
          currentAdmin.connected = false;

          debug(chalkRed("CONNECTION DURATION: " + currentAdmin.adminId 
            + " | " + msToTime(moment().valueOf() - currentAdmin.connectTime)));

          adminUpdateDb(currentAdmin, function(err, updatedAdminObj) {
            if (!err) {
              debug(chalkRed("TX ADMIN SESSION (DISCONNECT): " 
                + updatedAdminObj.lastSession + " TO ADMIN NAMESPACE"));

              adminNameSpace.emit('ADMIN_SESSION', updatedAdminObj);
            }
          });
        }

        if (currentUser) {
          debug("currentUser\n" + jsonPrint(currentUser));
          userCache.del(currentUser.userId);

          currentUser.lastSeen = moment().valueOf();
          currentUser.connected = false;
          currentUser.disconnectTime = moment().valueOf();

          debug(chalkRed("CONNECTION DURATION: " + currentUser.userId 
            + " | " + msToTime(moment().valueOf() - currentUser.connectTime)));

          userUpdateDb(currentUser, function(err, updatedUserObj) {
            if (!err) {

              updatedUserObj.sessionId = updatedUserObj.lastSession;

              debug(chalkRed("TX USER SESSION (" + sesObj.sessionEvent + "): " + updatedUserObj.lastSession 
                + " TO ADMIN NAMESPACE"));

              adminNameSpace.emit('USER_SESSION', updatedUserObj);
            }
          });
        }

        if (currentUtil) {
          debug("currentUtil\n" + jsonPrint(currentUtil));
          utilCache.del(currentUtil.utilId);

          currentUtil.lastSeen = moment().valueOf();
          currentUtil.connected = false;
          currentUtil.disconnectTime = moment().valueOf();

          debug(chalkRed("CONNECTION DURATION: " + currentUtil.utilId 
            + " | " + msToTime(moment().valueOf() - currentUtil.connectTime)));

          utilUpdateDb(currentUtil, function(err, updatedUtilObj) {
            if (!err) {

              updatedUtilObj.sessionId = updatedUtilObj.lastSession;

              debug(chalkRed("TX UTIL SESSION (DISCONNECT): " 
                + updatedUtilObj.lastSession + " TO ADMIN NAMESPACE"));

              adminNameSpace.emit('UTIL_SESSION', updatedUtilObj);
            }
          });
        }

        if (currentViewer) {
          debug("currentViewer\n" + jsonPrint(currentViewer));
          viewerCache.del(currentViewer.viewerId);

          currentViewer.lastSeen = moment().valueOf();
          currentViewer.connected = false;
          currentViewer.disconnectTime = moment().valueOf();

          debug(chalkRed("CONNECTION DURATION: " + currentViewer.userId 
            + " | " + msToTime(moment().valueOf() - currentViewer.connectTime)));

          viewerUpdateDb(currentViewer, function(err, updatedViewerObj) {
            if (!err) {

              updatedViewerObj.sessionId = updatedViewerObj.lastSession;

              debug(chalkRed("TX VIEWER SESSION (DISCONNECT): " + updatedViewerObj.lastSession 
                + " TO ADMIN NAMESPACE"));

              adminNameSpace.emit('VIEWER_SESSION', updatedViewerObj);
            }
          });
        }
      }

      break;

    case 'REQ_ADMIN_SESSION':
      Object.keys(adminNameSpace.connected).forEach(function(adminSessionKey) {
        var adminSessionObj = sessionCache.get(adminSessionKey);
        if (adminSessionObj) {
          debug("FOUND ADMIN SESSION: " + adminSessionObj.sessionId);
          debug("TX ADMIN SESSION: " + adminSessionObj.sessionId 
            + " TO " + sesObj.options.requestNamespace 
            + "#" + sesObj.options.requestSocketId);
          adminNameSpace.to(sesObj.session.sessionId).emit('ADMIN_SESSION', adminSessionObj);
        }
      });
      break;

    case 'REQ_USER_SESSION':
      debug(chalkAlert("RX REQ_USER_SESSION\n" + jsonPrint(sesObj)));
      Object.keys(userNameSpace.connected).forEach(function(userSessionKey) {
        var userSessionObj = sessionCache.get(userSessionKey);
        if (userSessionObj) {
          debug("FOUND USER SESSION: " + userSessionObj.sessionId);
          debug(chalkRed("TX USER SESSION: " + userSessionObj.sessionId
            + " TO " + sesObj.session.namespace + "#" + sesObj.session.sessionId));
          delete userSessionObj.wordChain;

          if (sesObj.session.namespace == 'view') {
            viewNameSpace.to(sesObj.session.sessionId).emit('USER_SESSION', userSessionObj);
          }
          adminNameSpace.to(sesObj.session.sessionId).emit('USER_SESSION', userSessionObj);
        }
      });
      Object.keys(testUsersNameSpace.connected).forEach(function(userSessionKey) {
        var userSessionObj = sessionCache.get(userSessionKey);
        if (userSessionObj) {
          debug("FOUND TEST USER SESSION: " + userSessionObj.sessionId);
          debug(chalkRed("TX USER SESSION: " + userSessionObj.sessionId
            + " TO " + sesObj.session.namespace + "#" + sesObj.session.sessionId));
          delete userSessionObj.wordChain;

          if (sesObj.session.namespace == 'view') {
            viewNameSpace.to(sesObj.session.sessionId).emit('USER_SESSION', userSessionObj);
          }
          adminNameSpace.to(sesObj.session.sessionId).emit('USER_SESSION', userSessionObj);
        }
      });
      break;

    case 'REQ_VIEWER_SESSION':
      debug(chalkAlert("RX REQ_VIEWER_SESSION\n" + jsonPrint(sesObj)));
      Object.keys(viewNameSpace.connected).forEach(function(viewerSessionKey) {
        var viewerSessionObj = sessionCache.get(viewerSessionKey);
        if (viewerSessionObj) {
          debug("FOUND VIEWER SESSION: " + viewerSessionObj.sessionId);
          debug(chalkRed("TX VIEWER SESSION: " + viewerSessionObj.sessionId 
            + " TO " + sesObj.options.requestNamespace + "#" + sesObj.options.requestSocketId));
          delete viewerSessionObj.wordChain;

          adminNameSpace.to(sesObj.session.sessionId).emit('VIEWER_SESSION', viewerSessionObj);
        }
      });
      Object.keys(testViewersNameSpace.connected).forEach(function(viewerSessionKey) {
        var viewerSessionObj = sessionCache.get(viewerSessionKey);
        if (viewerSessionObj) {
          debug("FOUND TEST VIEWER SESSION: " + viewerSessionObj.sessionId);
          debug(chalkRed("TX VIEWER SESSION: " + viewerSessionObj.sessionId 
            + " TO " + sesObj.options.requestNamespace + "#" + sesObj.options.requestSocketId));
          delete viewerSessionObj.wordChain;

          adminNameSpace.to(sesObj.session.sessionId).emit('VIEWER_SESSION', viewerSessionObj);
        }
      });
      break;

    case 'REQ_UTIL_SESSION':
      debug(chalkAlert("RX REQ_UTIL_SESSION\n" + jsonPrint(sesObj)));

      Object.keys(utilNameSpace.connected).forEach(function(utilSessionKey) {

        var utilSessionObj = sessionCache.get(utilSessionKey);

        if (utilSessionObj) {
          debug("FOUND UTIL SESSION: " + utilSessionObj.sessionId);
          debug(chalkRed("TX UTIL SESSION: " + utilSessionObj.sessionId 
            + " TO " + sesObj.options.requestNamespace + "#" + sesObj.options.requestSocketId));
          delete utilSessionObj.wordChain;

          adminNameSpace.to(sesObj.session.sessionId).emit('UTIL_SESSION', utilSessionObj);
        }

      });
      break;

    case 'SESSION_KEEPALIVE':

      sessionUpdateDb(sesObj.session, function(err, sessionUpdatedObj) {
        if (err) {
          console.log(chalkError(
            "*** SESSION KEEPALIVE ERROR" 
            + " | SID: " + sessionUpdatedObj.sessionId 
            + " | IP: " + sessionUpdatedObj.ip + "\n" + jsonPrint(err)
          ));
        } 
        else {

          if (sessionUpdatedObj.wordChain.length > MAX_WORDCHAIN_LENGTH) {
            debug(chalkSession("SHORTEN WC TO " + MAX_WORDCHAIN_LENGTH
              + " | UID: " + sessionUpdatedObj.userId
              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0].nodeId
              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1].nodeId
            ));
            sessionUpdatedObj.wordChain = sessionUpdatedObj.wordChain.slice(-MAX_WORDCHAIN_LENGTH);
            debug(chalkSession("NEW WC"
              + " | UID: " + sessionUpdatedObj.userId
              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0].nodeId
              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1].nodeId
            ));

            if (typeof sessionUpdatedObj.subSessionId !== 'undefined') {
              sessionCache.set(sessionUpdatedObj.subSessionId, sessionUpdatedObj);
            }
            else {
              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
            }
          }
          else {
            if (typeof sessionUpdatedObj.subSessionId !== 'undefined') {
              sessionCache.set(sessionUpdatedObj.subSessionId, sessionUpdatedObj);
            }
            else {
              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
            }
          }

          // sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);

          if (!sessionUpdatedObj.userId) {
            debug(chalkError("SESSION_KEEPALIVE: UNDEFINED USER ID" 
              + "\nsessionUpdatedObj\n" + jsonPrint(sessionUpdatedObj)));
            debug(chalkError("SESSION_KEEPALIVE: UNDEFINED USER ID" 
              + "\nsesObj\n" + jsonPrint(sesObj)));
            quit("UNDEFINED USER ID: " + sessionUpdatedObj.sessionId);
          }

          userCache.set(sessionUpdatedObj.userId, sessionUpdatedObj.user, function(err, success) {});

          debug(chalkLog(
            "K>" + " | " + sessionUpdatedObj.userId 
            + " | SID " + sessionUpdatedObj.sessionId 
            + " | T " + sessionUpdatedObj.config.type 
            + " | M " + sessionUpdatedObj.config.mode 
            + " | NS " + sessionUpdatedObj.namespace 
            + " | SID " + sessionUpdatedObj.sessionId 
            + " | WCI " + sessionUpdatedObj.wordChainIndex 
            + " | IP " + sessionUpdatedObj.ip
            // + "\n" + jsonPrint(sessionUpdatedObj)
          ));

          if (sessionUpdatedObj.namespace != 'view') {
            var sessionUpdateObj = {
              action: 'KEEPALIVE',
              nodeId: sessionUpdatedObj.tags.entity + '_' + sessionUpdatedObj.tags.channel,
              tags: {},
              userId: sessionUpdatedObj.userId,
              sessionId: sessionUpdatedObj.sessionId,
              wordChainIndex: sessionUpdatedObj.wordChainIndex,
              source: {},
              target: 0
            };

            sessionUpdateObj.tags = sessionUpdatedObj.tags;

            io.of(sessionUpdatedObj.namespace).to(sessionUpdatedObj.sessionId).emit('KEEPALIVE_ACK', sessionUpdatedObj.nodeId);

            updateSessionViews(sessionUpdateObj);
          }
        }
      });

      break;

    case 'SESSION_CREATE':

      if (typeof sesObj.session.config.mode !== 'undefined') {
        debug(chalkSession("... SESSION MODE SET:    " + sesObj.session.config.mode));
      } else {
        sesObj.session.config.mode = enabledSessionModes[randomInt(0, enabledSessionModes.length)];
        debug(chalkSession("... SESSION MODE RANDOM: " + sesObj.session.config.mode));
      }

      // sesObj.session.config.mode = defaultSessionType ;

      if (typeof sesObj.session.tags === 'undefined') {
        sesObj.session.tags = {};
        sesObj.session.tags.entity = 'UNKNOWN_ENTITY';
        sesObj.session.tags.channel = 'UNKNOWN_CHANNEL';
      }

      console.log(chalkSession(
        ">>> SESS CREATE" 
        + " | " + moment().format(defaultDateTimeFormat) 
        + " | NSP: " + sesObj.session.namespace 
        + " | TYPE: " + sesObj.session.config.type 
        + " | MODE: " + sesObj.session.config.mode 
        + " | SID: " + sesObj.session.sessionId 
        + " | ENT: " + sesObj.session.tags.entity
        + " | CH: " + sesObj.session.tags.channel
        + " | SIP: " + sesObj.session.ip
      ));

      // SESSION TYPES: RANDOM, ANTONYM, SYNONYM, SCRIPT, USER_USER, GROUP 

      switch (sesObj.session.config.type) {
        case 'ADMIN':
          break;
        case 'USER':
          break;
        case 'UTIL':
          break;
        case 'VIEWER':
          break;
        case 'TEST_USER':
          break;
        case 'TEST_VIEWER':
          break;
        default:
          debug(chalkError(" 1 ????? UNKNOWN SESSION TYPE: " + sesObj.session.config.type));
          quit(" 1 ????? UNKNOWN SESSION TYPE: " + sesObj.session.config.type);
          break;
      }

      dnsReverseLookup(sesObj.session.ip, function(err, domains) {

        if (!err && domains.length > 0) {
          sesObj.session.domain = domains[0];
          debug(chalkSession("... SESSION CREATE | IP: " + sesObj.session.ip 
            + " | DOMAINS: " + domains.length + " | " + domains[0]));
        } else {
          sesObj.session.domain = 'UNKNOWN';
          debug(chalkSession("... SESSION CREATE | IP: " + sesObj.session.ip 
            + " | DOMAINS: UNKNOWN"));
        }

        sesObj.session.connected = true;

        sessionUpdateDb(sesObj.session, function(err, sessionUpdatedObj) {
          if (!err) {
            if (sessionUpdatedObj.namespace == 'admin') {
              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
            } else if (sessionUpdatedObj.namespace == 'view') {
              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
            } else if (sessionUpdatedObj.namespace == 'user') {
              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
            } else if (sessionUpdatedObj.namespace == 'test-user') {
              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
            } else if (sessionUpdatedObj.namespace == 'util') {
              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
            } else {
              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
            }
          }
        });
      });
      break;

    case 'SOCKET_RECONNECT':

      debug(chalkSession(
        "<-> SOCKET RECONNECT" 
        + " | " + moment().format(defaultDateTimeFormat) 
        + " | NSP: " + sesObj.session.namespace 
        + " | SID: " + sesObj.session.sessionId 
        + " | IP: " + sesObj.session.ip 
        + " | DOMAIN: " + sesObj.session.domain
      ));

      sessionCache.set(sesObj.session.sessionId, sesObj.session);
      sessionUpdateDb(sesObj.session, function() {});

      var currentUser = userCache.get(sesObj.session.userId);
      var currentViewer = viewerCache.get(sesObj.session.userId);
      var currentUtil = utilCache.get(sesObj.session.userId);

      if (currentUtil) {
        currentUtil.connected = true;

        utilUpdateDb(currentUtil, function(err, updatedUtilObj) {
          if (!err) {
            debug(chalkRed("TX UTIL SESSION (SOCKET ERROR): " + updatedUtilObj.lastSession + " TO ADMIN NAMESPACE"));
            adminNameSpace.emit('UTIL_SESSION', updatedUtilObj);
          }
        });
      } else if (currentUser) {
        currentUser.connected = true;

        userUpdateDb(currentUser, function(err, updatedUserObj) {
          if (!err) {
            debug(chalkRed("TX USER SESSION (SOCKET ERROR): " + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));
            adminNameSpace.emit('USER_SESSION', updatedUserObj);
          }
        });
      } else if (currentViewer) {
        currentViewer.connected = true;

        viewerUpdateDb(currentViewer, function(err, updatedViewerObj) {
          if (!err) {
            debug(chalkRed("TX VIEWER SESSION (SOCKET ERROR): " + updatedViewerObj.lastSession + " TO ADMIN NAMESPACE"));

            adminNameSpace.emit('VIEWER_SESSION', updatedViewerObj);
          }
        });
      }
      break;

    case 'ADMIN_READY':

      // ????? ADMIN VERIFICATION SHOULD HAPPEN HERE

      if (typeof sesObj.session.ip !== 'undefined') {
        if (dnsHostHashMap.has(sesObj.session.ip)) {
          sesObj.admin.domain = dnsHostHashMap.get(sesObj.session.ip);
          sesObj.session.domain = dnsHostHashMap.get(sesObj.session.ip);
        }
      }

      debug("ADMIN_READY\n" + jsonPrint(sesObj));

      debug(chalkSession(
        ">>> SESSION ADMIN READY" 
        + " | " + moment().format(defaultDateTimeFormat) 
        + " | SID: " + sesObj.session.sessionId 
        + " | UID: " + sesObj.admin.adminId 
        + " | NSP: " + sesObj.session.namespace 
        + " | IP: " + sesObj.session.ip 
        + " | DOMAIN: " + sesObj.session.domain
      ));

      var currentSession = sessionCache.get(sesObj.session.sessionId);


      if (!currentSession) {
        debug(chalkWarn("??? ADMIN SESSION NOT IN CACHE\n" + jsonPrint(sesObj)));
      } else {
        currentSession.userId = sesObj.admin.adminId;

        sesObj.admin.ip = sesObj.session.ip;
        sesObj.admin.domain = sesObj.session.domain;
        sesObj.admin.lastSession = sesObj.session.sessionId;
        sesObj.admin.lastSeen = moment().valueOf();
        sesObj.admin.connectTime = moment().valueOf();
        sesObj.admin.disconnectTime = moment().valueOf();
        sesObj.admin.connected = true;

        debug("adminUpdateDb\n" + jsonPrint(sesObj));

        adminUpdateDb(sesObj.admin, function(err, adminObj) {
          if (!err) {

            var adminSessionKey = randomInt(1000000, 1999999);

            currentSession.adminSessionKey = adminSessionKey;
            currentSession.connected = true;

            sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
              if (!err) {
                sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                debug(chalkInfo("-S- DB UPDATE" + " | " + sessionUpdatedObj.sessionId));
                debug("TX ADMIN_ACK", adminSessionKey);
                io.of(currentSession.namespace).to(currentSession.sessionId).emit('ADMIN_ACK', adminSessionKey);
              } else {
                debug(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
              }
            });
          }
        });
      }

      break;

    case 'VIEWER_READY':

      if (typeof sesObj.session.ip !== 'undefined') {
        if (dnsHostHashMap.has(sesObj.session.ip)) {
          sesObj.session.domain = dnsHostHashMap.get(sesObj.session.ip);
          sesObj.viewer.domain = dnsHostHashMap.get(sesObj.session.ip);
        }
      }

      debug("VIEWER_READY\n" + jsonPrint(sesObj));

      debug(chalkSession(
        ">>> SESSION VIEWER READY" 
        + " | " + moment().format(defaultDateTimeFormat) 
        + " | SID: " + sesObj.session.sessionId 
        + " | UID: " + sesObj.viewer.viewerId 
        + " | NSP: " + sesObj.session.namespace 
        + " | IP: " + sesObj.session.ip 
        + " | DOMAIN: " + sesObj.session.domain
      ));

      var currentSession = sessionCache.get(sesObj.session.sessionId);

      if (typeof currentSession === 'undefined') {
        currentSession = sesObj.session;
      }

      currentSession.userId = sesObj.viewer.viewerId;

      sesObj.viewer.ip = sesObj.session.ip;
      sesObj.viewer.domain = sesObj.session.domain;
      sesObj.viewer.namespace = sesObj.session.namespace;
      sesObj.viewer.lastSession = sesObj.session.sessionId;
      sesObj.viewer.lastSeen = moment().valueOf();
      sesObj.viewer.connected = true;
      sesObj.viewer.connectTime = moment().valueOf();
      sesObj.viewer.disconnectTime = 0;

      viewerCache.set(sesObj.viewer.viewerId, sesObj.viewer);

      viewerUpdateDb(sesObj.viewer, function(err, updatedViewerObj) {
        if (err) {
          console.log(chalkError("*** ERROR viewerUpdateDb\n" + jsonPrint(err)))
        } else {
          var viewerSessionKey = randomInt(1000000, 1999999);

          currentSession.viewerSessionKey = viewerSessionKey;
          updatedViewerObj.viewerSessionKey = viewerSessionKey;

          sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
            if (err) {
              console.log(chalkError("*** ERROR sessionUpdateDb\n" + jsonPrint(err)))
            } else {
              var viewer = viewerCache.get(sessionUpdatedObj.userId);

              debug("viewer\n" + jsonPrint(viewer));
              debug("viewer\n" + jsonPrint(viewer));

              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
              debug(chalkInfo("-S- DB UPDATE" 
                + " | " + sessionUpdatedObj.sessionId 
                + " | " + sessionUpdatedObj.userId 
                + "\n" + jsonPrint(sessionUpdatedObj)));
              debug("TX VIEWER_ACK", viewerSessionKey);
              io.of(currentSession.namespace).to(currentSession.sessionId).emit('VIEWER_ACK', viewerSessionKey);
              debug(chalkRed("TX VIEWER SESSION (VIEWER READY): " + updatedViewerObj.lastSession + " TO ADMIN NAMESPACE"));
              adminNameSpace.emit('VIEWER_SESSION', updatedViewerObj);
            }
          });
        }
      });
      break;

    case 'USER_READY':

      if (typeof sesObj.session.ip !== 'undefined') {
        if (dnsHostHashMap.has(sesObj.session.ip)) {
          sesObj.session.domain = dnsHostHashMap.get(sesObj.session.ip);
          sesObj.user.domain = dnsHostHashMap.get(sesObj.session.ip);
          debug(chalkUser("@@@ USER_READY SET DOMAIN: " + dnsHostHashMap.get(sesObj.session.ip)));
        }
      }

      console.log(chalkSession(
        ">>> USER READY" 
        + " | " + moment().format(defaultDateTimeFormat) 
        + " | NSP: " + sesObj.session.namespace 
        + " | UN: " + sesObj.user.name 
        + " | UID: " + sesObj.user.userId 
        + " | TYPE: " + sesObj.session.config.type 
        + " | MODE: " + sesObj.session.config.mode 
        + "\nSID: " + sesObj.session.sessionId 
        + " | UMODE: " + sesObj.user.tags.mode 
        + " | GRP: " + sesObj.user.tags.group 
        + " | ENT: " + sesObj.user.tags.entity 
        + " | CH: " + sesObj.user.tags.channel 
        + " | IP: " + sesObj.session.ip 
        + " | DOM: " + sesObj.session.domain
        // + "\n" + jsonPrint(sesObj)
      ));

      if (sesObj.session.config.mode == 'MUXSTREAM'){

        console.log(chalkInfo("MUXSTREAM"
          + " | " + sesObj.session.sessionId
        ));

      }

      if (sesObj.session.config.mode == 'SUBSTREAM'){

        sesObj.session.sessionId = sesObj.session.sessionId + "#" + sesObj.user.tags.entity;

        console.log(chalkInfo("SUBSTREAM"
          + " | " + sesObj.session.sessionId
        ));

      }

      if (sesObj.session.config.mode == 'MONITOR'){

        var key = sesObj.user.tags.entity + '_' + sesObj.user.tags.channel;

        monitorHashMap[key] = sesObj;
        console.log(chalkRed("ADDDED MONITOR"
          + " | " + key
          + " | " + sesObj.session.sessionId
        ));

      }

      userCache.set(sesObj.user.userId, sesObj.user, function(err, success) {
        debug(chalkLog("USER CACHE RESULTS" + "\n" + err + "\n" + success));
      });

      var currentSession = sessionCache.get(sesObj.session.sessionId);

      if (typeof currentSession !== 'undefined') {
        currentSession.config.type = sesObj.session.config.type;
        currentSession.config.mode = sesObj.session.config.mode;
        currentSession.nodeId = sesObj.user.tags.entity.toLowerCase() + '_' + sesObj.user.tags.channel.toLowerCase();
        currentSession.userId = sesObj.user.userId;
        currentSession.user = sesObj.user;
      } else {
        currentSession = {};
        currentSession = sesObj.session;
        currentSession.nodeId = sesObj.user.tags.entity.toLowerCase() + '_' + sesObj.user.tags.channel.toLowerCase();
        currentSession.userId = sesObj.user.userId;
        currentSession.user = sesObj.user;
      }

      sesObj.user.ip = sesObj.session.ip;
      sesObj.user.namespace = sesObj.session.namespace;
      sesObj.user.domain = sesObj.session.domain;
      sesObj.user.lastSession = sesObj.session.sessionId;
      sesObj.user.lastSeen = moment().valueOf();
      sesObj.user.connectTime = moment().valueOf();
      sesObj.user.disconnectTime = moment().valueOf();
      sesObj.user.connected = true;

      userUpdateDb(sesObj.user, function(err, updatedUserObj) {
        if (!err) {
          groupUpdateDb(updatedUserObj, function(err, entityObj){
            if (err){
              console.log(chalkError("GROUP UPDATE DB ERROR: " + err));
            }
            else if ((updatedUserObj.tags.mode !== 'undefined') && (updatedUserObj.tags.mode == 'substream')) {

              updatedUserObj.isMuxed = true;

              console.log(chalkInfo("TX UTIL SESSION (UTIL READY): " + updatedUserObj.lastSession  + " | " + updatedUserObj.userId + " TO ADMIN NAMESPACE"));
              adminNameSpace.emit('UTIL_SESSION', updatedUserObj);

              io.of(sesObj.session.namespace).to(sesObj.session.sessionId).emit('USER_READY_ACK', updatedUserObj.userId);
            }
            else {
              if (updatedUserObj.groupId === 'undefined') {
                if (sesObj.user.tags.group !== 'undefined') {
                  updatedUserObj.groupId = sesObj.user.tags.group.toLowerCase();
                }
                else {
                  updatedUserObj.groupId = 'unknown_group';
                }
              }

              entityUpdateDb(updatedUserObj, function(err, entityObj){
                if (err){
                  console.log(chalkError("ENTITY UPDATE DB ERROR: " + err));
                }
                else {
                  if (sesObj.session.config.type == 'USER') {
                    console.log(chalkInfo("TX USER SESSION (USER READY): " + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));
                    adminNameSpace.emit('USER_SESSION', updatedUserObj);
                  } else if (sesObj.session.config.type == 'UTIL') {
                    console.log(chalkInfo("TX UTIL SESSION (UTIL READY): " + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));
                    adminNameSpace.emit('UTIL_SESSION', updatedUserObj);
                  }

                  io.of(sesObj.session.namespace).to(sesObj.session.sessionId).emit('USER_READY_ACK', updatedUserObj.userId);
                }
              });
            }
          });
        } 
        else {
          console.log(chalkError("*** USER UPDATE DB ERROR\n" + jsonPrint(err)));
          if (quitOnError) quit(err);
        }
      });

      /*
          ROUTING OF PROMPT/RESPONSE BASED ON SESSION TYPE
      */

      var sessionCacheKey = currentSession.sessionId;

      if (typeof currentSession.subSessionId !== 'undefined') sessionCacheKey = currentSession.subSessionId;


      sessionCache.set(sessionCacheKey, currentSession, function(err, success) {
        if (!err && success) {

          userCache.set(currentSession.userId, sesObj.user, function(err, success) {
            if (!err && success) {

              switch (sesObj.session.config.type) {
                case 'USER':
                case 'TEST':
                case 'TEST_USER':
                  switch (sesObj.session.config.mode) {

                    // start with a random word for these session modes

                    case 'PROMPT':
                    case 'RANDOM':
                    case 'ANTONYM':
                    case 'SYNONYM':
                      wordServer.getRandomWord(function(err, randomWordObj) {
                        if (!err) {

                          randomWordObj.wordChainIndex = currentSession.wordChainIndex;

                          debug("Word CACHE SET13: " + randomWordObj.nodeId);
                          wordCache.set(randomWordObj.nodeId, randomWordObj);

                          currentSession.wordChain.push({nodeId: randomWordObj.nodeId, timeStamp:moment().valueOf()});
                          currentSession.wordChainIndex++;

                          sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
                            if (!err) {
                              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                              debug(chalkInfo("-S- DB UPDATE" 
                                + " | " + sessionUpdatedObj.sessionId 
                                + " | WCI: " + sessionUpdatedObj.wordChainIndex 
                                + " | WCL: " + sessionUpdatedObj.wordChain.length));
                              // sendPrompt(currentSession, randomWordObj);
                              sendPrompt(sessionUpdatedObj, randomWordObj);
                            } else {
                              debug(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
                            }
                          });
                        } else {
                          debug(chalkError("*** ERROR GET RANDOM WORD\n" + err));
                        }
                      });
                      break;

                    case 'SCRIPT':
                      break;

                    case 'USER_USER':

                      debug(chalkSession("... PAIRING USER " + currentSession.userId));

                      pairUser(currentSession, function(err, updatedSessionObj) {
                        if (err) {
                          console.log(chalkError("*** pairUser ERROR\n" + jsonPrint(err)));
                        } else if (updatedSessionObj.config.userA && updatedSessionObj.config.userB) {

                          debug(chalkSession("U_U CREATED USER_USER PAIR" 
                            + " | " + moment().valueOf() 
                            + " | " + sesObj.session.sessionId 
                            + "\n" + jsonPrint(updatedSessionObj.config)
                          ));

                          io.of(currentSession.namespace).to(updatedSessionObj.config.userA).emit('PAIRED_USER', updatedSessionObj.config.userB);
                          io.of(currentSession.namespace).to(updatedSessionObj.config.userB).emit('PAIRED_USER', updatedSessionObj.config.userA);

                        } else {
                          debug(chalkSession("U-? WAITING TO COMPLETE PAIR\n" + jsonPrint(updatedSessionObj.config)));
                          return (callback(null, sesObj));
                        }
                      });
                      break;

                    case 'GROUP':
                      break;

                    case 'MUXSTREAM':
                      console.log(chalkSession("... MULTIPLEXED STREAM USER " + currentSession.userId));

                      sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
                        if (!err) {
                          if (typeof sessionCache.wordChain !== 'undefined'
                            && (sessionCache.wordChain.length > MAX_WORDCHAIN_LENGTH)) {
                            console.log(chalkSession("SHORTEN WC TO " + MAX_WORDCHAIN_LENGTH
                              + " | UID: " + sessionUpdatedObj.userId
                              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
                              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0].nodeId
                              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1].nodeId
                            ));
                            sessionUpdatedObj.wordChain = sessionUpdatedObj.wordChain.slice(-MAX_WORDCHAIN_LENGTH);
                            console.log(chalkSession("NEW WC"
                              + " | UID: " + sessionUpdatedObj.userId
                              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
                              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0].nodeId
                              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1].nodeId
                            ));
                            // sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                            sessionCache.set(sessionCacheKey, sessionUpdatedObj);
                          }
                          else {
                            sessionCache.set(sessionCacheKey, sessionUpdatedObj);
                          }
                          console.log(chalkInfo("-S- DB UPDATE" 
                            + " | " + sessionUpdatedObj.sessionId 
                            + " | TYPE: " + sessionUpdatedObj.config.type 
                            + " | MODE: " + sessionUpdatedObj.config.mode 
                            + " | WCI: " + sessionUpdatedObj.wordChainIndex 
                            + " | WCL: " + sessionUpdatedObj.wordChain.length));
                        } else {
                          console.log(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
                        }
                      });
                      break;

                    case 'SUBSTREAM':
                    case 'STREAM':
                      debug(chalkSession("... STREAM USER " + currentSession.userId));
                      sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
                        if (!err) {
                          if (typeof sessionCache.wordChain !== 'undefined'
                            && (sessionCache.wordChain.length > MAX_WORDCHAIN_LENGTH)) {
                            console.log(chalkSession("SHORTEN WC TO " + MAX_WORDCHAIN_LENGTH
                              + " | UID: " + sessionUpdatedObj.userId
                              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
                              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0].nodeId
                              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1].nodeId
                            ));
                            sessionUpdatedObj.wordChain = sessionUpdatedObj.wordChain.slice(-MAX_WORDCHAIN_LENGTH);
                            console.log(chalkSession("NEW WC"
                              + " | UID: " + sessionUpdatedObj.userId
                              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
                              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0].nodeId
                              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1].nodeId
                            ));
                            sessionCache.set(sessionCacheKey, sessionUpdatedObj);
                          }
                          else {
                            sessionCache.set(sessionCacheKey, sessionUpdatedObj);
                          }
                          debug(chalkInfo("-S- DB UPDATE" 
                            + " | " + sessionUpdatedObj.sessionId 
                            + " | TYPE: " + sessionUpdatedObj.config.type 
                            + " | MODE: " + sessionUpdatedObj.config.mode 
                            + " | WCI: " + sessionUpdatedObj.wordChainIndex 
                            + " | WCL: " + sessionUpdatedObj.wordChain.length));
                        } else {
                          debug(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
                        }
                      });
                      break;

                    default:
                      debug(chalkError("2  ????? UNKNOWN SESSION MODE: " + sesObj.session.config.mode));
                      quit(" 2 ????? UNKNOWN SESSION TYPE: " + sesObj.session.config.type);
                      break;
                  }
                  break;

                case 'VIEWER':
                  break;

                case 'ADMIN':
                  break;

                case 'UTIL':
                  break;

                case 'TEST_VIEWER':
                  break;

                case 'SUBSTREAM':
                case 'STREAM':
                  break;

                default:
                  debug("???? UNKNOWN SESSION TYPE: " + sesObj.session.config.type);
                  quit("???? UNKNOWN SESSION TYPE: " + sesObj.session.config.type);
              }

            }
          });

        }
      });
      break;

    default:
      debug(chalkError("??? UNKNOWN SESSION EVENT\n" + jsonPrint(sesObj)));
  }

  return (callback(null, sesObj));
}

var readSessionQueueReady = true;

var readSessionQueue = setInterval(function() {

  var sesObj;

  if (!sessionQueue.isEmpty()) {

    readSessionQueueReady = false;

    sesObj = sessionQueue.dequeue();

    // debug(chalkSession("----------\nREAD SESSION QUEUE" + " | " + sesObj.sessionEvent + "\n" + jsonPrint(sesObj)));

    handleSessionEvent(sesObj, function(rSesObj) {
      readSessionQueueReady = true;
    });

  }
}, 20);

function getTags(wordObj, callback){
  if (!wordObj.tags || (typeof wordObj.tags === 'undefined')) {
    wordObj.tags = {};
    wordObj.tags.entity = 'unknown_entity';
    wordObj.tags.channel = 'unknown_channel';
    wordObj.tags.group = 'unknown_group';

    console.log(chalkError("SET UNKNOWN WORDOBJ TAGS\n" + jsonPrint(wordObj)));
    entityChannelGroupHashMap.set('unknown_entity', { groupId: 'unknown_group', name: 'UNKNOWN GROUP'});

    callback(wordObj);
  } 
  else {
    if (!wordObj.tags.entity || (typeof wordObj.tags.entity === 'undefined')) {
      wordObj.tags.entity = 'unknown_entity';
      console.log(chalkError("SET UNKNOWN WORDOBJ ENTITY\n" + jsonPrint(wordObj)));
    }
    else {
      wordObj.tags.entity = wordObj.tags.entity.toLowerCase();
    }

    if (!wordObj.tags.channel || (typeof wordObj.tags.channel === 'undefined')) {
      wordObj.tags.channel = 'unknown_channel';
      console.log(chalkError("SET UNKNOWN WORDOBJ CHANNEL\n" + jsonPrint(wordObj)));
    }
    else {
      wordObj.tags.channel = wordObj.tags.channel.toLowerCase();
    }

    if (entityChannelGroupHashMap.has(wordObj.tags.entity.toLowerCase())){
      wordObj.tags.group = entityChannelGroupHashMap.get(wordObj.tags.entity.toLowerCase()).groupId;
      callback(wordObj);
    }
    else {
      debug(chalkError("entityChannelGroupHashMap MISS \n" + jsonPrint(wordObj)));
      wordObj.tags.group = wordObj.tags.entity.toLowerCase();
      entityChannelGroupHashMap.set(wordObj.tags.entity.toLowerCase(), { groupId: wordObj.tags.group, name: wordObj.tags.entity.toLowerCase() } );
      callback(wordObj);
    }


  }
}

var ready = true;
var trendingTopicsArray = [];
var trendingTopicHitArray = [];

var readResponseQueue = setInterval(function() {

  if (ready && !responseQueue.isEmpty()) {

    ready = false;

    var rxInObj = responseQueue.dequeue();

    // console.log(chalkWarn("RXINOBJ\n" + jsonPrint(rxInObj)));

    if ((typeof rxInObj.nodeId === 'undefined') || (typeof rxInObj.nodeId !== 'string')) {
      console.log(chalkError("*** ILLEGAL RESPONSE ... SKIPPING" + "\nTYPE: " + typeof rxInObj.nodeId 
        + "\n" + jsonPrint(rxInObj)));
      ready = true;
      statsObj.session.error++;
      statsObj.session.responseError++;
      return;
    }

    var responseInObj = rxInObj;

    var socketId = responseInObj.socketId;
    var currentSessionObj = sessionCache.get(socketId);

    if (typeof currentSessionObj === 'undefined') {

      console.log(chalkWarn("??? SESSION NOT IN CACHE ON RESPONSE Q READ" 
        + " | responseQueue: " + responseQueue.size() 
        + " | " + socketId + " | ABORTING SESSION"
        + "\n" + jsonPrint(responseInObj)
      ));

      // var entity = socketId.match(entityRegEx)[1];

      configEvents.emit("UNKNOWN_SESSION", socketId);

      sessionQueue.enqueue({
        sessionEvent: "SESSION_ABORT",
        sessionId: socketId
      });
      ready = true;
      return;
    }
    // else {
    //   console.log(chalkError("currentSessionObj\n" + jsonPrint(currentSessionObj)));
    // }


    responseInObj.isKeyword = (typeof rxInObj.isKeyword !== 'undefined') ? rxInObj.isKeyword : false;
    responseInObj.isTrendingTopic = (typeof rxInObj.isTrendingTopic !== 'undefined') ? rxInObj.isTrendingTopic : false;


    trendingTopicsArray = trendingCache.keys();
    trendingTopicHitArray = [];

    async.each(trendingTopicsArray, function(topic, cb) {

      if (responseInObj.nodeId.toLowerCase().includes(topic.toLowerCase())){

        var topicObj = trendingCache.get(topic);

        trendingTopicHitArray.push(topic);

        if (typeof topicObj !== 'undefined'){ // may have expired out of cache, so check
          console.log(chalkRedBold("TOPIC HIT: " + topic));
          topicObj.hit = true;
          trendingCache.set(topic, topicObj);
          topicHashMap.set(topic.toLowerCase(), true);
          responseInObj.isTrendingTopic = true;
        }

        cb();

      }
      else {
        cb();
      }

    }, function(err) {

      debug(chalkBht(">>> RESPONSE (before replace): " + responseInObj.nodeId));
      responseInObj.nodeId = responseInObj.nodeId.replace(/\s+/g, ' ');
      responseInObj.nodeId = responseInObj.nodeId.replace(/[\n\r\[\]\{\}\<\>\/\;\:\"\'\`\~\?\!\@\#\$\%\^\&\*\(\)\_\+\=]+/g, '');
      responseInObj.nodeId = responseInObj.nodeId.replace(/\s+/g, ' ');
      responseInObj.nodeId = responseInObj.nodeId.replace(/^\s+|\s+$/g, '');
      responseInObj.nodeId = responseInObj.nodeId.replace(/^\,+|\,+$/g, '');
      responseInObj.nodeId = responseInObj.nodeId.replace(/^\.+|\.+$/g, '');
      responseInObj.nodeId = responseInObj.nodeId.replace(/^\-*|\-+$/g, '');
      responseInObj.nodeId = responseInObj.nodeId.toLowerCase();
      debug(chalkBht(">>> RESPONSE: " + responseInObj.nodeId));

      if (responseInObj.nodeId == '') {
        debug("EMPTY RESPONSE: " + responseInObj.nodeId);
        ready = true;
        return;
      }

      if (!responseInObj.mentions) responseInObj.mentions = 1;

      responsesReceived++;
      deltaResponsesReceived++;

      updateStats({
        responsesReceived: responsesReceived,
        deltaResponsesReceived: deltaResponsesReceived
      });

      currentSessionObj.lastSeen = moment().valueOf();

      var promptWordObj;
      var previousPrompt;
      var previousPromptObj;

      if ((typeof currentSessionObj.wordChain !== 'undefined') && (currentSessionObj.wordChainIndex > 0)) {

        previousPrompt = currentSessionObj.wordChain[currentSessionObj.wordChain.length - 1].nodeId;
        previousPromptObj = wordCache.get(previousPrompt);

        if (!previousPromptObj) {
          console.log(chalkError(socketId 
            + " | " + currentSessionObj.userId 
            + " | WCI: " + currentSessionObj.wordChainIndex 
            + " | WCL: " + currentSessionObj.wordChain.length
            + " | ??? previousPrompt NOT IN CACHE: " + previousPrompt
            // + " ... ABORTING SESSION"
          ));

          statsObj.session.error++;
          statsObj.session.previousPromptNotFound++;

          previousPromptObj = {
            nodeId: previousPrompt
          };

        } else {
          debug(chalkResponse("... previousPromptObj: " + previousPromptObj.nodeId));
        }
      } 
      else if (currentSessionObj.config.mode == 'STREAM') {
        previousPromptObj = {
          nodeId: 'STREAM'
        };
        debug(chalkWarn("STREAM WORD CHAIN\n" + jsonPrint(currentSessionObj.wordChain)));
      } 
      else if (currentSessionObj.config.mode == 'MUXSTREAM') {
        previousPromptObj = {
          nodeId: 'MUXSTREAM'
        };
        debug(chalkWarn("MUXSTREAM WORD CHAIN\n" + jsonPrint(currentSessionObj.wordChain)));
      } 
      else if (currentSessionObj.config.mode == 'SUBSTREAM') {
        previousPromptObj = {
          nodeId: 'SUBSTREAM'
        };
        debug(chalkWarn("SUBSTREAM WORD CHAIN\n" + jsonPrint(currentSessionObj.wordChain)));
      } 
      else if (currentSessionObj.config.mode == 'USER_USER') {
        previousPromptObj = {
          nodeId: 'USER_USER'
        };
        debug(chalkWarn("USER_USER WORD CHAIN\n" + jsonPrint(currentSessionObj.wordChain)));
      } 
      else {
        console.log(chalkWarn("??? EMPTY WORD CHAIN ... PREVIOUS PROMPT NOT IN CACHE ... ABORTING SESSION" 
          + " | " + socketId));

        ready = true;

        return;
      }


      if (currentSessionObj.config.mode == 'USER_USER') {

        debug(chalkResponse("---------- USER_USER ----------"));

        var respondentSessionId = currentSessionObj.sessionId;
        var targetSessionId = sessionRouteHashMap.get(currentSessionObj.sessionId);

        debug(chalkResponse("USER_USER ROUTE" + " | " + respondentSessionId + " -> " + targetSessionId));

        if ((typeof currentSessionObj.wordChain === 'undefined') || (currentSessionObj.wordChainIndex == 0)) {
          debug(chalkResponse("START OF USER_USER SESSION | ADDING " + responseInObj.nodeId + " TO WORDCHAIN"));

          previousPrompt = responseInObj.nodeId;

          currentSessionObj.wordChain.push({nodeId: responseInObj.nodeId, timeStamp:moment().valueOf()});

          previousPromptObj = {
            nodeId: previousPrompt
          };
          debug("Word CACHE SET14: " + previousPromptObj.nodeId);
          wordCache.set(previousPromptObj.nodeId, previousPrompt);
        } else {

        }
      }

 

      getTags(responseInObj, function(updatedWordObj){
        
        var dbUpdateObj = {};
        dbUpdateObj.word = updatedWordObj;
        dbUpdateObj.session = currentSessionObj;
        dbUpdateObj.tags = {};

        if (updatedWordObj.tags){

          if (!updatedWordObj.tags.group || (typeof updatedWordObj.tags.group === 'undefined')) {
            updatedWordObj.tags.group = updatedWordObj.tags.entity;
            dbUpdateObj.tags.group = updatedWordObj.tags.entity;
          }

          dbUpdateObj.tags.entity = updatedWordObj.tags.entity;
          dbUpdateObj.tags.channel = updatedWordObj.tags.channel;
          dbUpdateObj.tags.group = updatedWordObj.tags.group;

          console.log(chalkInfo("R_a<" 
            + " G: " + updatedWordObj.tags.group 
            // + " | U: " + currentSessionObj.userId
            + " E: " + updatedWordObj.tags.entity 
            + " C: " + updatedWordObj.tags.channel 
            + " KW: " + updatedWordObj.isKeyword 
            + " TT: " + updatedWordObj.isTrendingTopic 
            // + " | URL: " + updatedWordObj.url 
            + " [" + currentSessionObj.wordChainIndex + "]" 
            + " | " + updatedWordObj.nodeId 
            // + " < " + previousPrompt
          ));


          dbUpdateWordQueue.enqueue(dbUpdateObj);
          ready = true;

        }
        else {
          console.log(chalkInfo("R_b<" 
            + " G: " + updatedWordObj.tags.group 
            // + " | U: " + currentSessionObj.userId
            + " E: " + updatedWordObj.tags.entity 
            + " C: " + updatedWordObj.tags.channel 
            + " KW: " + updatedWordObj.isKeyword 
            + " TT: " + updatedWordObj.isTrendingTopic 
            // + " | URL: " + updatedWordObj.url 
            + " [" + currentSessionObj.wordChainIndex + "]" 
            + " | " + updatedWordObj.nodeId 
            // + " < " + previousPrompt
          ));

          // if (typeof updatedWordObj.tags.group === 'undefined') quit();

          dbUpdateWordQueue.enqueue(dbUpdateObj);
          ready = true;

        }

      });

    });
  }
}, 50);

var updaterMessageReady = true; 

var readUpdaterMessageQueue = setInterval(function() {

  if (updaterMessageReady && !updaterMessageQueue.isEmpty()) {

    updaterMessageReady = false;

    var updaterObj = updaterMessageQueue.dequeue();

    switch (updaterObj.type){
      case 'sendGroupsComplete':
        console.log(chalkRed("UPDATE GROUPS COMPLETE"));
        updaterMessageReady = true;
        groupsUpdateComplete = true;
      break;

      case 'sendEntitiesComplete':
        console.log(chalkRed("UPDATE ENTITIES COMPLETE"));
        updaterMessageReady = true;
        entitiesUpdateComplete = true;
      break;

      case 'sendKeywordsComplete':
        console.log(chalkRed("UPDATE KEYWORDS COMPLETE"));
        updaterMessageReady = true;
        keywordsUpdateComplete = true;
      break;

      case 'group':

        if ((typeof updaterObj.target !== 'undefined') && (updaterObj.target == 'server')) {
          console.log(chalkRed("UPDATER GROUP\n" + jsonPrint(updaterObj)));
          serverGroupHashMap.set(updaterObj.groupId, updaterObj.group);
          serverGroupsJsonObj[updaterObj.groupId] = updaterObj.group;
        }
        else {
          groupHashMap.set(updaterObj.groupId, updaterObj.group);
        }

        debug(chalkLog("UPDATE GROUP\n" + jsonPrint(updaterObj)));
        debug(chalkLog("UPDATE GROUP | " + updaterObj.groupId));
        updaterMessageReady = true;

      break;

      case 'entity':
        entityChannelGroupHashMap.set(updaterObj.entityId, updaterObj.entity);
        debug(chalkLog("UPDATE ENTITIY\n" + jsonPrint(updaterObj)));
        debug(chalkLog("UPDATE ENTITIY | " + updaterObj.entityId));
        updaterMessageReady = true;
      break;

      case 'keywordHashMapClear':
        keywordHashMap.clear();
        console.log(chalkLog("KEYWORD HASHMAP CLEAR"));
        updaterMessageReady = true;
      break;

      case 'keywordRemove':
        keywordHashMap.remove(updaterObj.keyword.toLowerCase());
        serverKeywordHashMap.remove(updaterObj.keyword.toLowerCase());
        console.log(chalkLog("KEYWORD REMOVE: " + updaterObj.keyword.toLowerCase()));
        updaterMessageReady = true;
      break;

      case 'keyword':

        var keywordId = updaterObj.keyword.toLowerCase();

        if ((typeof updaterObj.target !== 'undefined') && (updaterObj.target == 'server')) {
          serverKeywordHashMap.set(keywordId, updaterObj.keyWordType);
          serverKeywordsJsonObj[keywordId] = updaterObj.keyWordType;
        }
        else {
          keywordHashMap.set(keywordId, updaterObj.keyWordType);
        }

        debug(chalkError("UPDATE KEYWORD\n" + jsonPrint(updaterObj)));

        if (updaterObj.twitter) {

          console.log(chalkLog("UPDATE SERVER KEYWORD\n" + jsonPrint(updaterObj)));

          serverKeywordHashMap.set(keywordId, updaterObj.keyWordType);

          if (keywordsUpdateComplete) {
            var hmKeys = serverKeywordHashMap.keys();

            async.each(hmKeys, function(keyword, cb){
              serverKeywordsJsonObj[keyword] = serverKeywordHashMap.get(keyword);
              cb();
            },
              function(err){

                saveFile("", serverKeywordsFile, serverKeywordsJsonObj, function(err, results){
                  if (err){
                    console.log(chalkError("SAVE SERVER KEYWORD FILE ERROR " + serverKeywordsFile));
                    if (err.status == 429) {
                      console.log(chalkError("SAVE SERVER KEYWORD FILE ERROR: TOO MANY WRITES"));
                    }
                    else {
                      console.log(chalkError(jsonPrint(err)));
                    }
                  }
                  else {
                    console.log(chalkLog("SAVE SERVER KEYWORD FILE " 
                      + serverKeywordsFile 
                      // + "\n" + jsonPrint(results)
                    ));
                  }
                });

              }
            );
          }


          keywordUpdateDb(updaterObj, function(err, updatedWordObj){

            var dmString = "UPDATE KEYWORD"
              + "\n" + updatedWordObj.nodeId 
              + "\n" + updatedWordObj.mentions + " Ms" 
              + "\n" + jsonPrint(updatedWordObj.keywords);

            console.log(chalkLog(dmString));

            sendDirectMessage('threecee', dmString, function(err, res){
              if (!err) {
                console.log(chalkLog("SENT TWITTER DM: " + dmString));
              }
              else {
                switch (err.code) {
                  case 226:
                    console.log(chalkError("*** TWITTER DM SEND ERROR: LOOKS LIKE AUTOMATED TX: CODE: " + err.code));
                  break;
                  default:
                    console.log(chalkError("*** TWITTER DM SEND ERROR: " + jsonPrint(err)));
                  break;
                }
              }
            });

          });
        }

        updaterMessageReady = true;
      break;
      default:
        console.log(chalkError("??? UPDATE UNKNOWN TYPE\n" + jsonPrint(updaterObj)));
        updaterMessageReady = true;
      break;
    }

    updateComplete = groupsUpdateComplete && entitiesUpdateComplete && keywordsUpdateComplete;

  }
}, 10);

var dbUpdateGroupReady = true; 
var readDbUpdateGroupQueue = setInterval(function() {

  if (dbUpdateGroupReady && !dbUpdateGroupQueue.isEmpty()) {

    dbUpdateGroupReady = false;

    var groupObj = dbUpdateGroupQueue.dequeue();

    dbUpdateGroup(groupObj, true, function(status, updatedGroupObj) {

      groupCache.set(updatedGroupObj.groupId, updatedGroupObj, function(err, success) {
        if (!err && success) {

          dbUpdateGroupReady = true;

        } else {
          debug(chalkError("*** GROUP CACHE SET ERROR" + "\n" + jsonPrint(err)));

          dbUpdateGroupReady = true;
        }
      });

    });
  }
}, 50);

var dbUpdateEntityReady = true; 

var readDbUpdateEntityQueue = setInterval(function() {

  if (dbUpdateEntityReady && !dbUpdateEntityQueue.isEmpty()) {

    dbUpdateEntityReady = false;

    var entityObj = dbUpdateEntityQueue.dequeue();

    dbUpdateEntity(entityObj, true, function(status, updatedEntityObj) {

      entityCache.set(updatedEntityObj.entityId, updatedEntityObj, function(err, success) {
        if (!err && success) {

          dbUpdateEntityReady = true;

        } else {
          debug(chalkError("*** ENTITY CACHE SET ERROR" + "\n" + jsonPrint(err)));

          dbUpdateEntityReady = true;
        }
      });

    });
  }
}, 50);


var printWapiResults = function(results){
  if ( (typeof results.body === 'undefined')
    || (typeof results.body.results === 'undefined')
    || (typeof results.body.results[0] === 'undefined')
    || (!results.body.results[0])
    || (results.body.results.length == 0)
  ) {
    return "";
  }
  else {
    switch (results.variation){
      case "ALL":
        debugWapi(chalkRed("results.body.results[0]: " + jsonPrint(results.body.results[0])));
        return results.body.results[0].definition;
      break;
      case "antonyms":
        return results.body.results[0].antonyms;
      break;
    }
  }
}

var dbUpdateWordReady = true;
var readDbUpdateWordQueue = setInterval(function() {

  if (dbUpdateWordReady && !dbUpdateWordQueue.isEmpty()) {

    dbUpdateWordReady = false;

    var dbUpdateObj = dbUpdateWordQueue.dequeue();

    var currentSessionObj = dbUpdateObj.session;

    dbUpdateObj.word.wordChainIndex = currentSessionObj.wordChainIndex;

    currentSessionObj.wordChain.push({nodeId: dbUpdateObj.word.nodeId, timeStamp:moment().valueOf()});
    currentSessionObj.wordChainIndex++;

    if (entityChannelGroupHashMap.has(dbUpdateObj.tags.entity)){
      currentSessionObj.tags.entity = dbUpdateObj.tags.entity;
      currentSessionObj.tags.channel = dbUpdateObj.tags.channel;
      currentSessionObj.tags.group = entityChannelGroupHashMap.get(dbUpdateObj.tags.entity).groupId;
    }

    dbUpdateWord(dbUpdateObj.word, true, function(status, updatedWordObj) {

      if (status == 'BHT_FOUND'){
        wordTypes.forEach(function(wordType){
          if (updatedWordObj[wordType]){
                // console.log("updatedWordObj"
                //   + " | " + updatedWordObj.nodeId
                //   + " | TYPE: " + wordType
                //   + " | " + updatedWordObj[wordType]
                // );

            if (updatedWordObj[wordType].ant){
              updatedWordObj.antonym = updatedWordObj[wordType].ant[randomIntInc(0,updatedWordObj[wordType].ant.length-1)];
              updatedWordObj[wordType].ant.forEach(function(antonym){
                debug("updatedWordObj"
                  + " | " + updatedWordObj.nodeId
                  + " | TYPE: " + wordType
                  + " | ANT: " + antonym
                );
              });
            }
          }
        });
      }

      updatedWordObj.wordChainIndex = dbUpdateObj.word.wordChainIndex;

      var previousPromptNodeId;
      var previousPromptObj;

      if (dbUpdateObj.word.wordChainIndex == 0) {

        previousPromptObj == null
        debug(chalkRed("CHAIN START"));

      } 
      else if (currentSessionObj.wordChain.length > 1) {

        previousPromptNodeId = currentSessionObj.wordChain[currentSessionObj.wordChain.length - 2].nodeId;
        previousPromptObj = wordCache.get(previousPromptNodeId);
        if (!previousPromptObj) {
          debug(chalkWarn("??? PREVIOUS PROMPT NOT IN CACHE: " + previousPromptNodeId));
          if (quitOnError) quit("??? PREVIOUS PROMPT NOT IN CACHE: " + previousPromptNodeId);
        } else {
          previousPromptObj.wordChainIndex = dbUpdateObj.word.wordChainIndex - 1;
          debug(chalkRed("CHAIN previousPromptObj: " + previousPromptNodeId));
        }

      }

      sessionCache.set(currentSessionObj.sessionId, currentSessionObj, function(err, success) {
        if (!err && success) {

          promptQueue.enqueue(currentSessionObj.sessionId);

          var sessionUpdateObj = {
            action: 'RESPONSE',
            userId: currentSessionObj.userId,
            sessionId: currentSessionObj.sessionId,
            wordChainIndex: dbUpdateObj.word.wordChainIndex,
            source: updatedWordObj,
            target: previousPromptObj,
            tags: dbUpdateObj.tags
          };

          updateSessionViews(sessionUpdateObj);

          dbUpdateWordReady = true;

        } else {
          debug(chalkError("*** SESSION CACHE SET ERROR" + "\n" + jsonPrint(err)));

          dbUpdateWordReady = true;
        }
      });
    });

  }
}, 50);


var algorithms = ['antonym', 'synonym', 'related', 'similar', 'user'];
var currentAlgorithm = 'antonym'; // random, antonym, synonym, ??
// wordVariations = [ 'syn', 'ant', 'rel', 'sim', 'usr' ]


var generatePromptQueueInterval = setInterval(function() {

  if (!promptQueue.isEmpty()) {

    var currentSessionId = promptQueue.dequeue();

    var currentSession = sessionCache.get(currentSessionId);

    if (!currentSession || (typeof currentSession === 'undefined')) {
      console.log(chalkWarn("??? SESSION EXPIRED ??? ... SKIPPING SEND PROMPT | " + currentSessionId));
      return;
    }
    else if (currentSession.wordChain.length == 0) {
      console.log(chalkWarn("*** EMPTY SESSION WORDCHAIN *** ... SKIPPING SEND PROMPT" 
        + "\n" + jsonPrint(currentSession)
      ));
      return;
    }

    debug("generatePromptQueueInterval currentSession\n" + jsonPrint(currentSession));

    // var currentResponse = currentSession.wordChain[currentSession.wordChainIndex];
    // var currentResponse = currentSession.wordChain[currentSession.wordChainIndex - 1].toLowerCase();
    var currentResponse = currentSession.wordChain[currentSession.wordChain.length - 1].nodeId.toLowerCase();


    if (!currentResponse) {
      debug("??? currentResponse UNDEFINED" 
        + " | SID: " + currentSession.sessionId 
        + " | WCI: " + currentSession.wordChainIndex 
        + " | CHAIN\n" + jsonPrint(currentSession.wordChain));
      if (quitOnError) quit("??? currentResponse UNDEFINED " + currentSession.sessionId);
    }

    var targetWordObj = wordCache.get(currentResponse);
    /*
    This is where routing of response -> prompt happens
    */
    switch (currentSession.config.mode) {

      case 'RANDOM':
        var randomIndex = randomInt(0, algorithms.length);
        currentAlgorithm = algorithms[randomIndex];
        // debug("[-] CURRENT ALGORITHM: " + currentAlgorithm);

        var query = {
          input: currentResponse,
          algorithm: currentAlgorithm
        };

        generatePrompt(query, function(status, responseObj) {
          if (status == 'ERROR') {
            debug(chalkError("**** generatePrompt ERROR\n" + jsonPrint(responseObj)))
          } else if (status == 'OK') {

            responseObj.wordChainIndex = currentSession.wordChainIndex;

            debug("Word CACHE SET15: " + responseObj.nodeId);
            wordCache.set(responseObj.nodeId, responseObj);

            currentSession.wordChain.push({nodeId: responseObj.nodeId, timeStamp: moment().valueOf()});
            // currentSession.wordChain.push(responseObj.nodeId);
            currentSession.wordChainIndex++;

            sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
              if (!err) {
                sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                debug(chalkInfo("-S- DB UPDATE" 
                  + " | " + sessionUpdatedObj.sessionId 
                  + " | WCI: " + sessionUpdatedObj.wordChainIndex 
                  + " | WCL: " + sessionUpdatedObj.wordChainLength));
                sendPrompt(sessionUpdatedObj, responseObj);
              } else {
                debug(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
              }
            });
          }
        });
        break;

      case 'PROMPT':
      case 'ANTONYM':
      case 'SYNONYM':

        if (chainDeadEnd(currentSession.wordChain)) {
          currentAlgorithm = 'random';
          debug("[-] CHAIN DEADEND ... USING RANDOM ALGORITHM: " + currentAlgorithm);
        } else {
          debug("NO CHAIN DEADEND (last 10): " + currentSession.wordChain.slice(Math.max(currentSession.wordChain.length - 10, 1)));
          currentAlgorithm = currentSession.config.mode.toLowerCase();
        }


        var query = {
          input: currentResponse,
          algorithm: currentAlgorithm
        };

        generatePrompt(query, function(status, responseObj) {
          if (status == 'ERROR') {
            debug(chalkError("**** generatePrompt ERROR\n" + jsonPrint(responseObj)))
          } else if (status == 'OK') {

            responseObj.wordChainIndex = currentSession.wordChainIndex;

            debug("Word CACHE SET16: " + responseObj.nodeId);
            wordCache.set(responseObj.nodeId, responseObj);

            currentSession.wordChain.push({nodeId: responseObj.nodeId, timeStamp: moment().valueOf()});
            // currentSession.wordChain.push(responseObj.nodeId);
            currentSession.wordChainIndex++;

            sessionUpdateDb(currentSession, function(err, sessionUpdateObj) {

              if (!err) {

                sessionCache.set(sessionUpdateObj.sessionId, sessionUpdateObj);

                debug(chalkInfo("-S- DB UPDATE" 
                  + " | " + sessionUpdateObj.sessionId 
                  + " | WCI: " + sessionUpdateObj.wordChainIndex 
                  + " | WCL: " + sessionUpdateObj.wordChain.length));

                sendPrompt(sessionUpdateObj, responseObj);
              } else {
                debug(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
              }

            });
          }
        });
        break;

      case 'USER_USER':

        var targetSessionId = sessionRouteHashMap.get(currentSession.sessionId);
        var targetSession = sessionCache.get(targetSessionId);

        if (!targetSession || !targetSessionId) {
          debug(chalkWarn("??? TARGET SESSION EXPIRED ??? ... SKIPPING SEND PROMPT | CURRENT: " + currentSession.sessionId));
          return;
        }

        debug("USER_USER | SEND PROMPT" 
          + " | " + currentSession.sessionId 
          + " -> " + currentResponse 
          + " -> " + targetSessionId
          // + "\ncurrentSession\n" + jsonPrint(currentSession)
          // + "\ntargetSession\n" + jsonPrint(targetSession.sessionId)
        );

        var currentResponseWordObj = {};
        currentResponseWordObj.nodeId = currentResponse;

        wordServer.findOneWord(currentResponseWordObj, true, function(err, responseWordObj) {
          if (err) {
            console.log(chalkError("**** USER_USER generatePrompt ERROR\n" + jsonPrint(err)))
          } else {

            responseWordObj.wordChainIndex = targetSession.wordChainIndex;

            debug("Word CACHE SET17: " + responseWordObj.nodeId);
            wordCache.set(responseWordObj.nodeId, responseWordObj);

            targetSession.wordChain.push({nodeId: responseWordObj.nodeId, timeStamp: moment().valueOf()});
            // targetSession.wordChain.push(responseWordObj.nodeId);
            targetSession.wordChainIndex++;

            sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
              if (!err) {
                sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                debug(chalkInfo("-S- DB UPDATE SOURCE SESSION" 
                  + " | " + sessionUpdatedObj.sessionId 
                  + " | WCI: " + sessionUpdatedObj.wordChainIndex 
                  + " | WCL: " + sessionUpdatedObj.wordChain.length));

                sessionUpdateDb(targetSession, function(err, targetSessionUpdatedObj) {
                  if (!err) {
                    sessionCache.set(targetSessionUpdatedObj.sessionId, targetSessionUpdatedObj);
                    debug(chalkInfo("-S- DB UPDATE TARGET SESSION" 
                      + " | " + targetSessionUpdatedObj.sessionId 
                      + " | WCI: " + targetSessionUpdatedObj.wordChainIndex 
                      + " | WCL: " + targetSessionUpdatedObj.wordChain.length));

                    sendPrompt(sessionUpdatedObj, responseWordObj);

                  } else {
                    debug(chalkError("*** ERROR DB UPDATE TARGET SESSION\n" + err));
                  }
                });
              } else {
                debug(chalkError("*** ERROR DB UPDATE SOURCE SESSION\n" + err));
              }
            });
          }
        });
        break;

      case 'BHT_CRAWLER':
      case 'MW_CRAWLER':
        break;
      case 'SUBSTREAM':
      case 'STREAM':
        break;

      default:
        debug(chalkError("3  ????? UNKNOWN SESSION MODE: " + currentSession.config.mode));
        quit("3  ????? UNKNOWN SESSION MODE: " + currentSession.config.mode);
        break;
    }

  }
}, 50);


var getTwitterFriendsInterval;

function getTwitterFriends(callback){

  var nextCursorValid = false;
  var totalFriends = 0;
  var nextCursor = false;
  var count = 250;

  var twitPromise;

  clearInterval(getTwitterFriendsInterval);

  getTwitterFriendsInterval = setInterval(function() {

    var params = {};
    params.count = count;
    if (nextCursorValid) params.cursor = parseInt(nextCursor);

    twitPromise = twit.get('friends/list', params, function(err, data, response){

      if (err) {
        console.log(chalkError("*** ERROR GET TWITTER FRIENDS: " + err));
        clearInterval(getTwitterFriendsInterval);
        return(callback(err, null));
      }

      nextCursor = data.next_cursor_str;

      console.log(chalkRed("\nFRIENDS"
        + " | COUNT: " + count
        + " | TOTAL: " + totalFriends
        + " | NEXT CURSOR VALID: " + nextCursorValid
        + " | NEXT CURSOR: " + nextCursor
        + "\nparams: " + jsonPrint(params)
        // + "\ndata: " + jsonPrint(data)
        // + "\nresponse: " + jsonPrint(response)
      ));

      var friends = data.users;

      if (data.next_cursor_str > 0) {
        nextCursorValid = true;
      }
      else {
        nextCursorValid = false;
      }

      friends.forEach(function(friend){

        totalFriends++;

        console.log(chalkTwitter("FRIEND"
          + "[" + totalFriends + "]"
          + " " + friend.screen_name
          + " | " + friend.name
        ));

        var entityObj = new Entity();

        entityObj.entityId = friend.screen_name.toLowerCase();
        entityObj.name = friend.name;
        entityObj.userId = friend.screen_name.toLowerCase();
        entityObj.groupId = entityObj.entityId;
        entityObj.screenName = entityObj.entityId;
        entityObj.url = friend.url;
        entityObj.tags = {};
        entityObj.tags.entity = entityObj.entityId;
        entityObj.tags.channel = 'twitter';
        entityObj.tags.mode = 'substream';
        entityObj.tags.group = '';

        followerUpdateQueue.enqueue(entityObj);

      });

      if (!nextCursorValid) {
        console.log(chalkTwitter("END GET FRIENDS"
          + "[" + totalFriends + "]"
        ));
        console.log("FRIENDS NEXT CURSOR: " + nextCursor);
        clearInterval(getTwitterFriendsInterval);
        return callback(err, totalFriends);
      }

    });

  }, 1000);

}


function keywordUpdateDb(keywordObj, callback){

  console.log(chalkRed("UPDATING KEYWORD | " + keywordObj.keyword + ": " + keywordObj.keyWordType));

  var wordObj = new Word();

  wordObj.nodeId = keywordObj.keyword.toLowerCase();
  wordObj.isKeyword = true;
  wordObj.keywords[keywordObj.keyWordType] = true;

  keywordHashMap.set(wordObj.nodeId, keywordObj.keyWordType);
  serverKeywordHashMap.set(wordObj.nodeId, keywordObj.keyWordType);

  wordServer.findOneWord(wordObj, false, function(err, updatedWordObj) {
    if (err){
      console.log(chalkError("ERROR: UPDATING KEYWORD | " + wd + ": " + kwordsObj[wd]));
      callback(err, wordObj);
    }
    else {
      console.log(chalkLog("+++ UPDATED KEYWORD"
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

function initKeywords(file, kwHashMap, callback){

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
          kwHashMap.set(wordObj.nodeId, keyWordType);

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
          }
          else {
            console.log(chalkInfo("initKeywords COMPLETE"));
          }
        }
      )
    }
  });
}

function initializeConfiguration(callback) {

  debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | initializeConfiguration ..."));

  async.series([
      // DATABASE INIT
      function(callbackSeries) {
        debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | START DATABASE INIT"));

        async.parallel(
          [

            function(callbackParallel) {
              debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | ADMIN IP INIT"));
              adminFindAllDb(null, function(numberOfAdminIps) {
                debug(chalkInfo(moment().format(defaultDateTimeFormat) 
                  + " | ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps));
                callbackParallel();
              });
            },
            
            function(callbackParallel) {
              debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | GROUP HASHMAP INIT"));
              groupFindAllDb(null, function(err, numberOfGroups) {
                if (err){
                  console.log(chalkError(moment().format(defaultDateTimeFormat) 
                    + " | *** groupFindAllDb ERROR: " + err));
                  callbackParallel();
                }
                else {
                  console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
                    + " | GROUPS IN DB: " + numberOfGroups));
                  callbackParallel();
                }
               });
            },
            
            function(callbackParallel) {
              debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | ENTITIY HASHMAP INIT"));
              entityFindAllDb(null, function(err, numberOfEntities) {
                if (err){
                  console.log(chalkError(moment().format(defaultDateTimeFormat) 
                    + " | *** entityFindAllDb ERROR: " + err));
                  callbackParallel();
                }
                else {
                  console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
                    + " | ENTITIES IN DB: " + numberOfEntities));
                  callbackParallel();
                }
               });
            }
            
          ],
          function(err, results) { //async.parallel callbac
            if (err) {
              console.log(chalkError("\n" + moment().format(defaultDateTimeFormat) 
                + "!!! DATABASE INIT ERROR: " + err));
              callbackSeries(err, null);
              return;
            } else {
              debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | DATABASE INIT COMPLETE"));
              configEvents.emit('INIT_DATABASE_COMPLETE', moment().format(defaultDateTimeFormat));
              callbackSeries(null, 'INIT_DATABASE_COMPLETE');
            }
          }
        ); // async.parallel
      },

      // APP ROUTING INIT
      function(callbackSeries) {
        debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | APP ROUTING INIT"));
        initAppRouting(function(err, results) {
          callbackSeries(err, results);
        });
      },

      // CONFIG EVENT
      function(callbackSeries) {
        debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | INIT CONFIG COMPLETE"));
        var serverSessionConfig = {
          configOrigin: 'SERVER',
          testMode: testMode
        };
        debug("SESSION CONFIGURATION\n" + JSON.stringify(serverSessionConfig, null, 3) + "\n");
        callbackSeries(null, serverSessionConfig);
      },

      // SERVER READY
      function(callbackSeries) {

        if (OFFLINE_MODE) {
          debug(chalkInfo(moment().format(defaultDateTimeFormat) + ' | OFFLINE MODE ... SKIPPING SERVER READY'));
          debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | SEND SERVER_NOT_READY"));
          internetReady = true;
          configEvents.emit("SERVER_READY");
          callbackSeries(null, "SERVER_READY");
          return;
        }

        debug("... CHECKING INTERNET CONNECTION ...");

        // var testClient = new net.Socket();
        var testClient = net.createConnection(80, 'www.google.com');

        testClient.on('connect', function() {
          statsObj.socket.connects++;
          debug(chalkInfo(moment().format(defaultDateTimeFormat) + ' | CONNECTED TO GOOGLE: OK'));
          debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | SEND SERVER_READY"));
          internetReady = true;
          configEvents.emit("SERVER_READY");
          testClient.destroy();
          callbackSeries(null, "SERVER_READY");
        });

        testClient.on('error', function(err) {
          statsObj.socket.errors++;
          debug(chalkError(moment().format(defaultDateTimeFormat) + ' | **** GOOGLE CONNECT ERROR ****\n' + err));
          debug(chalkError(moment().format(defaultDateTimeFormat) + " | **** SERVER_NOT_READY ****"));
          internetReady = false;
          testClient.destroy();
          configEvents.emit("SERVER_NOT_READY");
          callbackSeries(err, null);
        });
      },

      // GOOGLE INIT
      function(callbackSeries) {
        if (!disableGoogleMetrics) {
          debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | GOOGLE INIT"));
          findCredential(GOOGLE_SERVICE_ACCOUNT_CLIENT_ID, function() {
            callbackSeries(null, "INIT_GOOGLE_METRICS_COMPLETE");
            return;
          });
        } else {
          debug(chalkInfo(moment().format(defaultDateTimeFormat) 
            + " | GOOGLE INIT *** SKIPPED *** | GOOGLE METRICS DISABLED"));
          callbackSeries(null, "INIT_GOOGLE_METRICS_SKIPPED");
        }
      },

      // TWIT FOR DM INIT
      function(callbackSeries) {

        loadYamlConfig(twitterYamlConfigFile, function(err, twitterConfig){

          if (err) {
            console.log(chalkError("*** LOADED TWITTER YAML CONFIG ERROR: FILE:  " + twitterYamlConfigFile));
            console.log(chalkError("*** LOADED TWITTER YAML CONFIG ERROR: ERROR: " + err));
            callbackSeries(null, "INIT_TWIT_FOR_DM_ERROR");
          }
          else {
            console.log(chalkTwitter("LOADED TWITTER YAML CONFIG\n" + jsonPrint(twitterConfig)));

            twit = new Twit({
              consumer_key: twitterConfig.CONSUMER_KEY,
              consumer_secret: twitterConfig.CONSUMER_SECRET,
              access_token: twitterConfig.TOKEN,
              access_token_secret: twitterConfig.TOKEN_SECRET
            });

            getTwitterFriends(function(err, totalFriends){});

            pollGetTwitterFriendsInterval = setInterval(function(){
              getTwitterFriends(function(err, totalFriends){
                if (err) {
                  console.log(chalkError("*** GET TWITTER FRIENDS ERROR: " + err));
                }
                else {
                  console.log(chalkError("TWITTER FRIENDS: " + totalFriends));
                }
              });
            }, pollTwitterFriendsIntervalTime);

            twitterStream = twit.stream('user');

            twitterStream.on('follow', function(followEvent){

              debug(chalkTwitter("FOLLOW EVENT\n" + jsonPrint(followEvent)));

              var entityObj = new Entity();

              entityObj.entityId = followEvent.target.screen_name.toLowerCase();
              entityObj.name = followEvent.target.name;
              entityObj.userId = followEvent.target.screen_name.toLowerCase();
              entityObj.groupId = entityObj.entityId;
              entityObj.screenName = entityObj.entityId;
              entityObj.url = followEvent.target.url;
              entityObj.tags = {};
              entityObj.tags.entity = entityObj.entityId;
              entityObj.tags.channel = 'twitter';
              entityObj.tags.mode = 'substream';
              entityObj.tags.group = '';

              followerUpdateQueue.enqueue(entityObj);

            });

            twitterStream.on('direct_message', function (message) {

              console.log(chalkTwitter("R< TWITTER DIRECT MESSAGE"
                + " | " + message.direct_message.sender_screen_name
                + " | " + message.direct_message.text
                // + "\nMESSAGE\n" + jsonPrint(message)
              ));

              if (message.direct_message.sender_screen_name == 'threecee') {

                if (message.direct_message.entities.hashtags.length > 0) {

                  var hashtags = message.direct_message.entities.hashtags;

                  var op = hashtags[0].text;

                  switch (op) {
                    case 'k':
                    case 'key':
                      if (hashtags.length == 3) {
                        var keyWordType = hashtags[1].text;
                        var keyword = hashtags[2].text;
                        console.log(chalkTwitter("ADD KEYWORD | " + keyWordType + " | " + keyword));
                        updaterMessageQueue.enqueue({ twitter: true, type: 'keyword', keyword: keyword, keyWordType: keyWordType});
                      }
                     break;
                    default:
                      console.log(chalkTwitter("??? UNKNOWN DM OP: " + op));
                    break;
                  }
                }

              }
            });

            twit.get('account/settings', function(err, data, response) {
              if (err){
                console.log('!!!!! TWITTER ACCOUNT ERROR | ' + getTimeStamp() + '\n' + jsonPrint(err));
                callbackSeries(null, "INIT_TWIT_FOR_DM_ERROR");
              }
              else {
                console.log(chalkInfo(getTimeStamp() + " | TWITTER ACCOUNT: " + data.screen_name))
                console.log(chalkTwitter('TWITTER ACCOUNT SETTINGS\n' 
                  + jsonPrint(data)));

                twit.get('application/rate_limit_status', function(err, data, response) {
                  if (err){
                    console.log('!!!!! TWITTER ACCOUNT ERROR | ' + getTimeStamp() 
                      + '\n' + jsonPrint(err));
                    callbackSeries(null, "INIT_TWIT_FOR_DM_ERROR");
                  }
                  else{
                    callbackSeries(null, "INIT_TWIT_FOR_DM_COMPLETE");
                    configEvents.emit("INIT_TWIT_FOR_DM_COMPLETE");
                  }
                });
              }
            });

          }

        });

      }
    ],
    function(err, results) {

      updateStatsInterval(dropboxHostStatsFile, ONE_MINUTE);

      if (err) {
        console.log(chalkError("\n*** INITIALIZE CONFIGURATION ERROR ***\n" + jsonPrint(err) + "\n"));
        callback(err, null);
      } else {
        debug(chalkLog("\nINITIALIZE CONFIGURATION RESULTS\n" + jsonPrint(results) + "\n"));
        callback(null, results);
      }
    });
}

var wapiSearchQueueReady = true;

var wapiSearchQueueInterval = setInterval(function() {

  if (!wapiOverLimitFlag && wapiSearchQueueReady && !wapiSearchQueue.isEmpty()) {

    wapiSearchQueueReady = false;

    var wordObj = wapiSearchQueue.dequeue();

    wapiSearch(wordObj.nodeId, "ALL", function(results){
      if (results.err){
        console.log(chalkError("WAPI ERROR:"
          // + " | " + word.toLowerCase() 
          + " | " + results.err
          // + " | " + results.variation
          + "\n" + jsonPrint(results)
        ));

        wapiSearchQueueReady = true;
      }
      else if (results.wapiFound) {
        debug(chalkWapi("* WAPI HIT"
          + " [ " + statsObj.wapi.totalRequests
          + " / " + statsObj.wapi.requestLimit
          + " | " + (100*(statsObj.wapi.totalRequests/statsObj.wapi.requestLimit)).toFixed(2) + "% ]"
          // + " | " + word.toLowerCase() 
          + " | " + results.word
          + " | " + results.variation
          // + " | " + printWapiResults(results)
          // + "\n" + jsonPrint(results.body)
        ));

        wordObj.wapiSearched = true;
        wordObj.wapiResults = results;
        wordObj.wapiFound = results.found ;

        wordServer.findOneWord(wordObj, false, function(err, word) {

          wapiSearchQueueReady = true;

          if (err) {
            console.log(chalkError("wapiSearch -- > findOneWord ERROR" 
              + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(wordObj, null, 2)));
            callback(err, wordObj);
          } 
          else {
            debug("WAPI > DB | " 
              + word.nodeId 
              + " | I: " + word.isIgnored 
              + " | K: " + word.isKeyword 
              + " | MNS: " + word.mentions 
              // + " | URL: " + word.url 
              + " | WAPI S: " + word.wapiSearched 
              + " F: " + word.wapiFound
              + " | BHT S: " + word.bhtSearched 
              + " F: " + word.bhtFound
              + " | MWD S: " + word.mwDictSearched 
              + " F: " + word.mwDictFound
              // + "\nKWs: " + jsonPrint(word.keywords) 
            );
          }
        });
      }
      else {
        debug(chalkWapi("- WAPI MISS"
          + " [ " + statsObj.wapi.totalRequests
          + " / " + statsObj.wapi.requestLimit
          + " | " + (100*(statsObj.wapi.totalRequests/statsObj.wapi.requestLimit)).toFixed(2) + "% ]"
          // + " | " + word.toLowerCase() 
          + " | " + results.word
          + " | " + results.variation
        ));

        wordObj.wapiSearched = true;
        wordObj.wapiFound = false ;

        wordServer.findOneWord(wordObj, false, function(err, word) {

          wapiSearchQueueReady = true;

          if (err) {
            console.log(chalkError("wapiSearch -- > findOneWord ERROR" 
              + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(wordObj, null, 2)));
            callback(err, wordObj);
          } 
          else {
            debug("WAPI > DB | " 
              + word.nodeId 
              + " | I: " + word.isIgnored 
              + " | K: " + word.isKeyword 
              + " | MNS: " + word.mentions 
              // + " | URL: " + word.url 
              + " | WAPI S: " + word.wapiSearched 
              + " F: " + word.wapiFound
              + " | BHT S: " + word.bhtSearched 
              + " F: " + word.bhtFound
              + " | MWD S: " + word.mwDictSearched 
              + " F: " + word.mwDictFound
              // + "\nKWs: " + jsonPrint(word.keywords) 
            );
          }
        });
        wapiSearchQueueReady = true;
      }
    });
  }

}, 50);

// // ==================================================================
// // CACHE HANDLERS
// // ==================================================================
// sessionCache.on("set", function(sessionId, sessionObj) {
//   console.log(chalkRedBold("sessionCache SET: " + sessionId + "\n" + jsonPrint(sessionObj)));
// });

// sessionCache.on("expired", function(sessionId, sessionObj) {
//   sessionQueue.enqueue({
//     sessionEvent: "SESSION_EXPIRED",
//     sessionId: sessionId,
//     session: sessionObj
//   });

//   io.of(sessionObj.namespace).to(sessionId).emit('SESSION_EXPIRED', sessionId);

//   sessionObj.sessionEvent = 'SESSION_DELETE';

//   viewNameSpace.emit("SESSION_DELETE", sessionObj);

//   debug("CACHE SESSION EXPIRED\n" + jsonPrint(sessionObj));
//   console.log(chalkInfo("... CACHE SESS EXPIRED"
//     + " | " + sessionObj.sessionId 
//     + " | NSP: " + sessionObj.namespace 
//     + " | NOW: " + getTimeStamp() 
//     + " | LS: " + getTimeStamp(sessionObj.lastSeen) 
//     + " | " + msToTime(moment().valueOf() - sessionObj.lastSeen) 
//     + " | WCI: " + sessionObj.wordChainIndex 
//     + " | WCL: " + sessionObj.wordChain.length 
//     + " | K: " + sessionCache.getStats().keys 
//     + " | H: " + sessionCache.getStats().hits 
//     + " | M: " + sessionCache.getStats().misses));
// });

// wordCache.on("set", function(word, wordObj) {
//   // debugWapi("CACHE WORD EXPIRED\n" + jsonPrint(wordObj));
//   debugWapi(chalkWapi("CACHE WORD SET"
//     + " [ Q: " + wapiSearchQueue.size() 
//     + " ] " + wordObj.nodeId 
//     + " | LS: " + getTimeStamp(wordObj.lastSeen) 
//     + " | " + msToTime(moment().valueOf() - wordObj.lastSeen) 
//     + " | M: " + wordObj.mentions 
//     + " | WAPIS: " + wordObj.wapiSearched 
//     + " | WAPIF: " + wordObj.wapiFound 
//     + " | K: " + wordCache.getStats().keys 
//     + " | H: " + wordCache.getStats().hits 
//     + " | M: " + wordCache.getStats().misses
//   ));

//   if (!wapiOverLimitFlag && (wapiForceSearch || !wordObj.wapiSearched)){
//     wapiSearchQueue.enqueue(wordObj);
//   }
// });

// wordCache.on("expired", function(word, wordObj) {
//   if (typeof wordObj !== 'undefined') {
//     // debug("CACHE WORD EXPIRED\n" + jsonPrint(wordObj));
//     debug("... CACHE WORD EXPIRED"
//       + " | " + wordObj.nodeId 
//       + " | LS: " + getTimeStamp(wordObj.lastSeen) 
//       + " | " + msToTime(moment().valueOf() - wordObj.lastSeen) 
//       + " | M: " + wordObj.mentions 
//       + " | K: " + wordCache.getStats().keys 
//       + " | H: " + wordCache.getStats().hits 
//       + " | M: " + wordCache.getStats().misses);
//   } else {
//     debug(chalkError("??? UNDEFINED wordObj on wordCache expired ???"));
//   }
// });

// trendingCache.on( "expired", function(topic, topicObj){
//   debug("CACHE TOPIC EXPIRED\n" + jsonPrint(topicObj));
//   console.log("CACHE TOPIC EXPIRED | " + topicObj.name);
// });


function updateTrends(){
  twit.get('trends/place', {id: 1}, function (err, data, response){
    if (err){
      console.log(chalkError("*** TWITTER ERROR ***"
        + " | " + err
      ));
    }
    else if (data){
      console.log(chalkInfo("... TWITTER TREND - WORLDWIDE"
        // + "\n" + jsonPrint(data)
      ));
      data.forEach(function(element){
        // console.log(chalkError("... TWITTER TREND - US"
          // + " | element\n" + jsonPrint(element)
        // ));
        element.trends.forEach(function(topic){
          console.log(chalkInfo(
            topic.name
          ));
          trendingCache.set(topic.name, topic);
        });
      });
    }
  });
  
  twit.get('trends/place', {id: 23424977}, function (err, data, response){
    if (err){
      console.log(chalkError("*** TWITTER ERROR ***"
        + " | " + err
      ));
    }
    else if (data){

      trendingCache.set("america", {name: "america"});

      console.log(chalkInfo("... TWITTER TREND - US"
        // + "\n" + jsonPrint(data)
      ));
      data.forEach(function(element){
        // console.log(chalkError("... TWITTER TREND - US"
          // + " | element\n" + jsonPrint(element)
        // ));
        element.trends.forEach(function(topic){
          console.log(chalkInfo(
            topic.name
          ));
          trendingCache.set(topic.name, topic);
        });
      });
    }
  });
}

var followerUpdateQueueReady = true;

function initFollowerUpdateQueueInterval(interval){

  console.log(chalkInfo("INIT FOLLOWER UPDATE QUEUE INTERVAL: " + interval + " ms"));

  setInterval(function () {

    if (followerUpdateQueueReady && !followerUpdateQueue.isEmpty()) {

      followerUpdateQueueReady = false;

      var entityObj = followerUpdateQueue.dequeue();

      console.log(chalkInfo("FOLLOWER"
        + " [ Q: " + followerUpdateQueue.size() + "]"
        + " | " + entityObj.screenName
        + " | " + entityObj.name
      ));

      var groupObj = new Group();

      async.waterfall([
        function(cb){

          if (entityChannelGroupHashMap.has(entityObj.entityId)) {

            console.log(chalkInfo("### ENTITY CHANNEL GROUP HASHMAP HIT"
              + " | " + entityObj.entityId
              + " | " + entityObj.name
              + " | GRP: " + entityObj.groupId
            ));

            if (groupHashMap.has(entityObj.groupId)) {

              var group = groupHashMap.get(entityObj.groupId);

              groupObj.groupId = group.groupId;
              groupObj.name = group.name;
              groupObj.colors = group.colors;
              groupObj.tags.entity = entityObj.entityId;
              groupObj.tags.channel = 'twitter';
              groupObj.tags.mode = 'substream';

              groupObj.addEntityArray = [];
              groupObj.addEntityArray.push(entityObj.entityId);
              groupObj.addChannelArray = [];
              groupObj.addChannelArray.push('twitter');

              console.log(chalkDb("GROUP HASH HIT"
                + " | ENT: " + entityObj.entityId
                + " | GRP: " + groupObj.groupId
                + " | GRP NAME: " + groupObj.name
                + " | +ENT: " + groupObj.addEntityArray
                + " | +CH: " + groupObj.addChannelArray
              ));

              console.log(chalkInfo("### GROUP HASHMAP HIT"
                + " | " + groupObj.groupId
                + " | " + groupObj.name
              ));

              cb(null, entityObj, groupObj);
            }
            else {

              console.log(chalkInfo("--- GROUP HASHMAP MISS"
                + " | " + entityObj.entityId
                + " | " + entityObj.name
              ));

              console.log(chalkInfo("+++ CREATING GROUP"
                + " | NEW GROUP: " + entityObj.entityId
                + " | " + entityObj.name
              ));

              groupObj.groupId = entityObj.entityId;
              groupObj.name = entityObj.name;
              groupObj.tags.entity = entityObj.entityId;
              groupObj.tags.channel = 'twitter';
              groupObj.tags.mode = 'substream';

              groupObj.addEntityArray = [];
              groupObj.addEntityArray.push(entityObj.entityId);
              groupObj.addChannelArray = [];
              groupObj.addChannelArray.push('twitter');

              groupHashMap.set(entityObj.entityId, groupObj);
              serverGroupHashMap.set(entityObj.entityId, groupObj);

              cb(null, entityObj, groupObj);

            }
          }
          else {
            console.log(chalkInfo("--- ENTITY CHANNEL GROUP HASHMAP MISS"
              + " | " + entityObj.entityId
              + " | " + entityObj.name
            ));

            console.log(chalkInfo("+++ CREATING ENTITY"
              + " | NEW ENTITY: " + entityObj.entityId
              + " | " + entityObj.name
            ));

            entityChannelGroupHashMap.set(entityObj.entityId, entityObj);
            serverEntityChannelGroupHashMap.set(entityObj.entityId, entityObj);

            if (groupHashMap.has(entityObj.groupId)) {

              var group = groupHashMap.get(entityObj.groupId);

              entityObj.tags.group = group.groupId;

              groupObj.groupId = group.groupId;
              groupObj.name = group.name;
              groupObj.colors = group.colors;
              groupObj.tags.entity = entityObj.entityId;
              groupObj.tags.channel = 'twitter';
              groupObj.tags.mode = 'substream';

              groupObj.addEntityArray = [];
              groupObj.addEntityArray.push(entityObj.entityId);
              groupObj.addChannelArray = [];
              groupObj.addChannelArray.push('twitter');

              console.log(chalkDb("GROUP HASH HIT"
                + " | ENT: " + entityObj.entityId
                + " | GRP: " + groupObj.groupId
                + " | GRP NAME: " + groupObj.name
                + " | +ENT: " + groupObj.addEntityArray
                + " | +CH: " + groupObj.addChannelArray
              ));

              console.log(chalkInfo("### GROUP HASHMAP HIT"
                + " | " + groupObj.groupId
                + " | " + groupObj.name
              ));

              cb(null, entityObj, groupObj);

            }
            else {

              console.log(chalkInfo("--- GROUP HASHMAP MISS"
                + " | " + entityObj.entityId
                + " | " + entityObj.name
              ));

              console.log(chalkInfo("+++ CREATING GROUP"
                + " | NEW GROUP: " + entityObj.entityId
                + " | " + entityObj.name
              ));

              entityObj.tags.group = entityObj.entityId;

              groupObj.groupId = entityObj.entityId;
              groupObj.name = entityObj.name;
              groupObj.tags.entity = entityObj.entityId;
              groupObj.tags.channel = 'twitter';
              groupObj.tags.mode = 'substream';

              groupObj.addEntityArray = [];
              groupObj.addEntityArray.push(entityObj.entityId);
              groupObj.addChannelArray = [];
              groupObj.addChannelArray.push('twitter');

              groupHashMap.set(entityObj.entityId, groupObj);
              serverGroupHashMap.set(entityObj.entityId, groupObj);

              cb(null, entityObj, groupObj);

            }
          }

        },
        function(entityObj, groupObj, cb){

          updateGroupEntity(entityObj, function(err, updatedEntityObj){
            cb(err, updatedEntityObj);
          });

        }
      ],
        function(err, results){
          debug(chalkTwitter("TWITTER_FOLLOW UPDATE COMPLETE"));

          followerUpdateQueueReady = true;

        }
      );


    }
  }, interval);
}

function initUpdateTrendsInterval(interval){
  setInterval(function () {
    updateTrends();
  }, interval);
}

// ==================================================================
// CONNECT TO INTERNET, START SERVER HEARTBEAT
// ==================================================================

function updateGroupEntity(entityObj, callback){

  debug("updateGroupEntity\n" + jsonPrint(entityObj));

  groupUpdateDb(entityObj, function(err, updatedEntityObj){
    if (err){
      console.log(chalkError("GROUP UPDATE DB ERROR: " + err));
      callback(err, entityObj);
    }
    else {

      debug("updateGroupEntity updatedEntityObj\n" + jsonPrint(updatedEntityObj));

      if (typeof updatedEntityObj.tags === 'undefined'){
        updatedEntityObj.tags = {};
        updatedEntityObj.tags.entity = entityObj.entityId;
        updatedEntityObj.tags.name = entityObj.name;
      } 

      entityUpdateDb(updatedEntityObj, function(err, updatedEntity2Obj){
        if (err){
          console.log(chalkError("ENTITY UPDATE DB ERROR: " + err));
          callback(err, updatedEntityObj);
        }
        else {
          console.log(chalkInfo("TX UTIL SESSION (UTIL READY): " + updatedEntity2Obj.lastSession + " TO ADMIN NAMESPACE"));
          adminNameSpace.emit('UTIL_SESSION', updatedEntity2Obj);
          callback(null, updatedEntity2Obj);
        }
      });

    }

  });
}

configEvents.on("TWITTER_FOLLOW", function(entityObj){

  console.log(chalkTwitter("TWITTER FOLLOW"
    + " | " + entityObj.screenName
    + " | " + entityObj.name
    // + "\n" + jsonPrint(entityObj)
  ));

  // var groupObj = new Group();

  // async.waterfall([
  //   function(cb){

  //     if (entityChannelGroupHashMap.has(entityObj.entityId)) {

  //       console.log(chalkInfo("### ENTITY CHANNEL GROUP HASHMAP HIT"
  //         + " | " + entityObj.entityId
  //         + " | " + entityObj.name
  //         + " | GRP: " + entityObj.groupId
  //       ));

  //       if (groupHashMap.has(entityObj.groupId)) {

  //         var group = groupHashMap.get(entityObj.groupId);

  //         groupObj.groupId = group.groupId;
  //         groupObj.name = group.name;
  //         groupObj.colors = group.colors;
  //         groupObj.tags.entity = entityObj.entityId;
  //         groupObj.tags.channel = 'twitter';
  //         groupObj.tags.mode = 'substream';

  //         groupObj.addEntityArray = [];
  //         groupObj.addEntityArray.push(entityObj.entityId);
  //         groupObj.addChannelArray = [];
  //         groupObj.addChannelArray.push('twitter');

  //         console.log(chalkDb("GROUP HASH HIT"
  //           + " | ENT: " + entityObj.entityId
  //           + " | GRP: " + groupObj.groupId
  //           + " | GRP NAME: " + groupObj.name
  //           + " | +ENT: " + groupObj.addEntityArray
  //           + " | +CH: " + groupObj.addChannelArray
  //         ));

  //         console.log(chalkInfo("### GROUP HASHMAP HIT"
  //           + " | " + groupObj.groupId
  //           + " | " + groupObj.name
  //         ));

  //         cb(null, entityObj, groupObj);
  //       }
  //       else {

  //         console.log(chalkInfo("--- GROUP HASHMAP MISS"
  //           + " | " + entityObj.entityId
  //           + " | " + entityObj.name
  //         ));

  //         console.log(chalkInfo("+++ CREATING GROUP"
  //           + " | NEW GROUP: " + entityObj.entityId
  //           + " | " + entityObj.name
  //         ));

  //         groupObj.groupId = entityObj.entityId;
  //         groupObj.name = entityObj.name;
  //         groupObj.tags.entity = entityObj.entityId;
  //         groupObj.tags.channel = 'twitter';
  //         groupObj.tags.mode = 'substream';

  //         groupObj.addEntityArray = [];
  //         groupObj.addEntityArray.push(entityObj.entityId);
  //         groupObj.addChannelArray = [];
  //         groupObj.addChannelArray.push('twitter');

  //         groupHashMap.set(entityObj.entityId, groupObj);

  //         cb(null, entityObj, groupObj);

  //       }
  //     }
  //     else {
  //       console.log(chalkInfo("--- ENTITY CHANNEL GROUP HASHMAP MISS"
  //         + " | " + entityObj.entityId
  //         + " | " + entityObj.name
  //       ));

  //       console.log(chalkInfo("+++ CREATING ENTITY"
  //         + " | NEW ENTITY: " + entityObj.entityId
  //         + " | " + entityObj.name
  //       ));

  //       entityChannelGroupHashMap.set(entityObj.entityId, entityObj);

  //       if (groupHashMap.has(entityObj.groupId)) {

  //         var group = groupHashMap.get(entityObj.groupId);

  //         entityObj.tags.group = group.groupId;

  //         groupObj.groupId = group.groupId;
  //         groupObj.name = group.name;
  //         groupObj.colors = group.colors;
  //         groupObj.tags.entity = entityObj.entityId;
  //         groupObj.tags.channel = 'twitter';
  //         groupObj.tags.mode = 'substream';

  //         groupObj.addEntityArray = [];
  //         groupObj.addEntityArray.push(entityObj.entityId);
  //         groupObj.addChannelArray = [];
  //         groupObj.addChannelArray.push('twitter');

  //         console.log(chalkDb("GROUP HASH HIT"
  //           + " | ENT: " + entityObj.entityId
  //           + " | GRP: " + groupObj.groupId
  //           + " | GRP NAME: " + groupObj.name
  //           + " | +ENT: " + groupObj.addEntityArray
  //           + " | +CH: " + groupObj.addChannelArray
  //         ));

  //         console.log(chalkInfo("### GROUP HASHMAP HIT"
  //           + " | " + groupObj.groupId
  //           + " | " + groupObj.name
  //         ));

  //         cb(null, entityObj, groupObj);

  //       }
  //       else {

  //         console.log(chalkInfo("--- GROUP HASHMAP MISS"
  //           + " | " + entityObj.entityId
  //           + " | " + entityObj.name
  //         ));

  //         console.log(chalkInfo("+++ CREATING GROUP"
  //           + " | NEW GROUP: " + entityObj.entityId
  //           + " | " + entityObj.name
  //         ));

  //         entityObj.tags.group = entityObj.entityId;

  //         groupObj.groupId = entityObj.entityId;
  //         groupObj.name = entityObj.name;
  //         groupObj.tags.entity = entityObj.entityId;
  //         groupObj.tags.channel = 'twitter';
  //         groupObj.tags.mode = 'substream';

  //         groupObj.addEntityArray = [];
  //         groupObj.addEntityArray.push(entityObj.entityId);
  //         groupObj.addChannelArray = [];
  //         groupObj.addChannelArray.push('twitter');

  //         groupHashMap.set(entityObj.entityId, groupObj);

  //         cb(null, entityObj, groupObj);

  //       }
  //     }

  //   },
  //   function(entityObj, groupObj, cb){

  //     updateGroupEntity(entityObj, function(err, updatedEntityObj){
  //       cb(err, updatedEntityObj);
  //     });

  //   }
  // ],
  //   function(err, results){
  //     console.log(chalkTwitter("TWITTER_FOLLOW UPDATE COMPLETE"));
  //   }
  // );


});

configEvents.on("INIT_TWIT_FOR_DM_COMPLETE", function() {

  var dmString = hostname 
    + '\nSTARTED wordAssoServer'
    + '\n' + getTimeStamp()
    + '\nPID: ' + process.pid
    + '\n' + 'http://threeceemedia.com';

  sendDirectMessage('threecee', dmString, function(err, res){
    if (!err) {
      console.log(chalkTwitter("SENT TWITTER DM: " + dmString));
    }
    else {
      switch (err.code) {
        case 226:
          console.log(chalkError("*** TWITTER DM SEND ERROR: LOOKS LIKE AUTOMATED TX: CODE: " + err.code));
        break;
        default:
          console.log(chalkError("*** TWITTER DM SEND ERROR: " + jsonPrint(err)));
        break;
      }
    }
  });
});

configEvents.on("UNKNOWN_SESSION", function(socketId) {

  var dmString = hostname + "\nwordAssoServer\nPID: " + process.pid + "\nUNKNOWN SESSION: " + socketId;

  if (typeof directMessageHash[socketId] === 'undefined') {

    directMessageHash[socketId] = socketId;

    sendDirectMessage('threecee', dmString, function(err, res){
      if (!err) {
        console.log(chalkTwitter("SENT TWITTER DM\n" + dmString + "\n" + jsonPrint(res)));
      }
      else {
        console.log(chalkError("DM SEND ERROR:" + err));
      }
    });
  }
  else {
    console.log(chalkError("SKIP DM ... PREV SENT UNKNOWN_SESSION | " + socketId));
  }
});

var directMessageHash = {};

configEvents.on("HASH_MISS", function(missObj) {

  console.log(chalkError("CONFIG EVENT - HASH_MISS\n" + jsonPrint(missObj)));

  var dmString = hostname
  + ' | wordAssoServer'
  + '\nMISS: ' + missObj.type.toUpperCase()
  // + '\nhttps://twitter.com/' + missObj.value
  + '\n@' + missObj.value;

  var sendDirectMessageHashKey = missObj.type + "-" + missObj.value;

  if (typeof directMessageHash[sendDirectMessageHashKey] === 'undefined') {
    directMessageHash[sendDirectMessageHashKey] = missObj;
    sendDirectMessage('threecee', dmString, function(err, res){
      if (!err) {
        console.log(chalkTwitter("SENT TWITTER DM\n" + dmString + "\n" + jsonPrint(res)));
      }
      else {
        console.log(chalkError("DM SEND ERROR:" + err));
      }
    });
  }
  else {
    console.log(chalkError("SKIP DM ... PREV SENT | " + missObj.type + " | " + sendDirectMessageHashKey));
  }
});

configEvents.on("SERVER_READY", function() {

  serverReady = true;

  debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | SERVER_READY EVENT"));

  httpServer.on("reconnect", function() {
    internetReady = true;
    console.log(chalkConnect(moment().format(defaultDateTimeFormat) + ' | PORT RECONNECT: ' + config.port));
    // initializeConfiguration();
  });

  httpServer.on('connect', function() {
    statsObj.socket.connects++;
    internetReady = true;
    console.log(chalkConnect(moment().format(defaultDateTimeFormat) + ' | PORT CONNECT: ' + config.port));

    httpServer.on("disconnect", function() {
      internetReady = false;
      console.log(chalkError('\n***** PORT DISCONNECTED | ' + moment().format(defaultDateTimeFormat) 
        + ' | ' + config.port));
    });
  });

  httpServer.listen(config.port, function() {
    console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | LISTENING ON PORT " + config.port));
  });

  httpServer.on("error", function(err) {
    statsObj.socket.errors++;
    internetReady = false;
    console.log(chalkError('??? HTTP ERROR | ' + moment().format(defaultDateTimeFormat) + '\n' + err));
    if (err.code == 'EADDRINUSE') {
      console.log(chalkError('??? HTTP ADDRESS IN USE: ' + config.port + ' ... RETRYING...'));
      setTimeout(function() {
        httpServer.listen(config.port, function() {
          debug('LISTENING ON PORT ' + config.port);
        });
      }, 5000);
    }
  });


  //----------------------
  //  SERVER HEARTBEAT
  //----------------------

  function logHeartbeat() {
    debug(chalkLog("HB " + heartbeatsSent 
      + " | " + getTimeStamp(txHeartbeat.timeStamp) 
      + " | ST: " + getTimeStamp(txHeartbeat.startTime) 
      + " | UP: " + msToTime(txHeartbeat.upTime) 
      + " | RN: " + msToTime(txHeartbeat.runTime) 
      + " | MWR: " + txHeartbeat.mwRequests 
      + " | BHTR: " + txHeartbeat.bhtRequests 
      + " | MEM: " + txHeartbeat.memoryAvailable 
      + "/" + txHeartbeat.memoryTotal));
  }

  serverHeartbeatInterval = setInterval(function() {

    // debug(util.inspect(userNameSpace.connected, {
    //   showHidden: false,
    //   depth: 1
    // }));

    runTime = moment() - startTime;

    bhtTimeToReset = moment.utc().utcOffset("-07:00").endOf('day').valueOf() - moment.utc().utcOffset("-07:00").valueOf();

    //
    // SERVER HEARTBEAT
    //

    if (internetReady && ioReady) {

      heartbeatsSent++;

      txHeartbeat = {
        serverHostName: hostname,
        timeStamp: getTimeNow(),
        startTime: startTime.valueOf(),
        upTime: upTime,
        runTime: runTime,
        heartbeatsSent: heartbeatsSent,
        memoryAvailable: memoryAvailable,
        memoryTotal: memoryTotal,

        wordCacheStats: wordCache.getStats(),
        wordCacheTtl: wordCacheTtl,

        numberAdmins: numberAdmins,

        numberUtils: numberUtils,
        numberUtilsMax: numberUtilsMax,
        numberUtilsMaxTime: numberUtilsMaxTime,

        numberViewers: numberViewers,
        numberViewersMax: numberViewersMax,
        numberViewersMaxTime: numberViewersMaxTime,

        numberTestViewers: numberTestViewers,
        numberTestViewersMax: numberTestViewersMax,
        numberTestViewersMaxTime: numberTestViewersMaxTime,

        numberViewersTotal: numberViewersTotal,
        numberViewersTotalMax: numberViewersTotalMax,
        numberViewersTotalMaxTime: numberViewersTotalMaxTime,

        numberUsersTotal: numberUsersTotal,
        numberUsersTotalMax: numberUsersTotalMax,
        numberUsersTotalMaxTime: numberUsersTotalMaxTime,

        numberUsers: numberUsers,
        numberUsersMax: numberUsersMax,
        numberUsersMaxTime: numberUsersMaxTime,

        numberTestUsers: numberTestUsers,
        numberTestUsersMax: numberTestUsersMax,
        numberTestUsersMaxTime: numberTestUsersMaxTime,

        totalWords: totalWords,

        mwRequestLimit: MW_REQUEST_LIMIT,
        mwRequests: mwRequests,
        mwOverLimitFlag: mwOverLimitFlag,
        mwLimitResetTime: mwLimitResetTime,
        mwOverLimitTime: mwOverLimitTime,
        mwTimeToReset: mwTimeToReset,

        bhtRequestLimit: BHT_REQUEST_LIMIT,
        bhtRequests: bhtRequests,
        bhtOverLimitFlag: bhtOverLimitFlag,
        bhtLimitResetTime: bhtLimitResetTime,
        bhtOverLimitTime: bhtOverLimitTime,
        bhtTimeToReset: bhtTimeToReset,

        totalSessions: totalSessions,
        totalUsers: totalUsers,

        promptsSent: promptsSent,
        deltaPromptsSent: deltaPromptsSent,
        deltaResponsesReceived: statsObj.deltaResponsesReceived,
        responsesReceived: responsesReceived

      };

      io.emit('HEARTBEAT', txHeartbeat);

      utilNameSpace.emit('HEARTBEAT', txHeartbeat);
      adminNameSpace.emit('HEARTBEAT', txHeartbeat);
      userNameSpace.emit('HEARTBEAT', txHeartbeat);
      viewNameSpace.emit('HEARTBEAT', txHeartbeat);
      testUsersNameSpace.emit('HEARTBEAT', txHeartbeat);
      testViewersNameSpace.emit('HEARTBEAT', txHeartbeat);

      if (heartbeatsSent % 60 == 0) {
        logHeartbeat();
      }


    } else {
      tempDateTime = moment();
      if (tempDateTime.seconds() % 10 == 0) {
        debug(chalkError("!!!! INTERNET DOWN?? !!!!! " + moment().format(defaultDateTimeFormat)));
      }
    }
  }, 1000);

  configEvents.emit("CONFIG_CHANGE", serverSessionConfig);
});

// ==================================================================
// CONFIGURATION CHANGE HANDLER
// ==================================================================
configEvents.on("CONFIG_CHANGE", function(serverSessionConfig) {

  debug(chalkAlert(moment().format(defaultDateTimeFormat) + " | CONFIG_CHANGE EVENT"));
  debug("==> CONFIG_CHANGE EVENT: " + JSON.stringify(serverSessionConfig, null, 3));

  if (typeof serverSessionConfig.testMode !== 'undefined') {
    debug(chalkAlert("--> CONFIG_CHANGE: testMode: " + serverSessionConfig.testMode));
    io.of("/admin").emit('CONFIG_CHANGE', {
      testMode: serverSessionConfig.testMode
    });
    io.of("/util").emit('CONFIG_CHANGE', {
      testMode: serverSessionConfig.testMode
    });
    io.emit('CONFIG_CHANGE', {
      testMode: serverSessionConfig.testMode
    });
    io.of("/test-user").emit('CONFIG_CHANGE', {
      testMode: serverSessionConfig.testMode
    });
    io.of("/test-view").emit('CONFIG_CHANGE', {
      testMode: serverSessionConfig.testMode
    });
  }

  debug(chalkInfo(moment().format(defaultDateTimeFormat) + ' | >>> SENT CONFIG_CHANGE'));
});


googleOauthEvents.on("AUTHORIZE GOOGLE", function() {
  authorizeGoogle();
});

googleOauthEvents.on("GOOGLE CREDENTIAL FOUND", function(credential) {

  var credentialExpiryDate = new Date(credential.expiryDate).getTime();
  var remainingTime = msToTime(credentialExpiryDate - currentTime);

  googleAuthExpiryDate = credential.expiryDate;

  debug(chalkGoogle("googleOauthEvents: GOOGLE CREDENTIAL FOUND: " + JSON.stringify(credential, null, 3)));

  debug("currentTime: " + currentTime + " | credentialExpiryDate: " + credentialExpiryDate);

  if (currentTime < credentialExpiryDate) {
    googleAuthorized = true;
    googleMetricsEnabled = true;
    googleOauthEvents.emit('GOOGLE AUTHORIZED');
    oauthExpiryTimer(credential.expiryDate);
    debug(chalkInfo(moment().format(defaultDateTimeFormat) 
      + " | GOOGLE OAUTH2 CREDENTIAL EXPIRES IN: " + remainingTime 
      + " AT " + credential.expiryDate + " ... AUTHORIZING ANYWAY ..."));
    googleOauthEvents.emit('AUTHORIZE GOOGLE');
  } else {
    debug(chalkAlert(moment().format(defaultDateTimeFormat) 
      + " | !!! GOOGLE OAUTH2 CREDENTIAL EXPIRED AT " + credential.expiryDate 
      + " | " + msToTime(currentTime - credential.expiryDate) + " AGO ... AUTHORIZING ..."));
    googleOauthEvents.emit('AUTHORIZE GOOGLE');
  }
});

googleOauthEvents.on("GOOGLE CREDENTIAL NOT FOUND", function(credentialId) {
  debug(chalkAlert(moment().format(defaultDateTimeFormat) + " | GOOGLE CREDENTIAL NOT FOUND: " + credentialId));
  googleOauthEvents.emit("AUTHORIZE GOOGLE");
});
// RE-ENABLE METRICS PERIODICALLY TO CHECK DAILY LIMIT
googleOauthEvents.on("DAILY LIMIT EXCEEDED", function() {
  debug(chalkGoogle("RE-ENABLING GOOGLE METRICS IN " + msToTime(googleCheckDailyLimitInterval)));
  setTimeout(function() {
    googleMetricsEnabled = true;
    debug("RE-ENABLED GOOGLE METRICS AFTER DAILY LIMIT EXCEEDED");
  }, googleCheckDailyLimitInterval);
});
// RE-ENABLE METRICS PERIODICALLY TO CHECK IF SOCKET IS UP
googleOauthEvents.on("SOCKET HUNG UP", function() {
  debug(chalkGoogle("GOOGLE SOCKET HUNG UP ... CLEARING TWEET RATE QUEUE " + moment().format(defaultDateTimeFormat)));
  debug(chalkGoogle("RE-TRYING GOOGLE METRICS IN " + msToTime(googleCheckSocketUpInterval)));

  setTimeout(function() {
    // googleMetricsEnabled = true ;
    googleOauthEvents.emit("AUTHORIZE GOOGLE");
    // debug(chalkGoogle("RE-ENABLING GOOGLE METRICS AFTER SOCKET HUNG UP..."));
  }, googleCheckSocketUpInterval);
});


//=================================
//  SERVER READY
//=================================
function createSession(newSessionObj) {

  debug(chalkSession("\nCREATE SESSION\n" + util.inspect(newSessionObj, {
    showHidden: false,
    depth: 1
  })));

  var namespace = newSessionObj.namespace;
  var socket = newSessionObj.socket;
  var socketId = newSessionObj.socket.id;
  var ipAddress = newSessionObj.socket.handshake.headers['x-real-ip'] || newSessionObj.socket.client.conn.remoteAddress;
  var hostname = newSessionObj.socket.handshake.headers.host;
  var domain = "UNKNOWN";

  numberAdmins = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUtils = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUsers = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestUsers = Object.keys(testUsersNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberViewers = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestViewers = Object.keys(testViewersNameSpace.connected).length; // userNameSpace.sockets.length ;

  var sessionObj = new Session({
    sessionId: socketId,
    tags: {},
    ip: ipAddress,
    namespace: namespace,
    createAt: moment().valueOf(),
    lastSeen: moment().valueOf(),
    connected: true,
    connectTime: moment().valueOf(),
    disconnectTime: 0
  });

  if (newSessionObj.tags) {
    sessionObj.tags = newSessionObj.tags;
  }

  if (newSessionObj.user) {
    sessionObj.userId = newSessionObj.user.userId;
  }

  sessionObj.config.type = newSessionObj.type;
  sessionObj.config.mode = newSessionObj.mode;

  sessionCache.set(sessionObj.sessionId, sessionObj);

  debug(chalkSession("\nNEW SESSION\n" + util.inspect(sessionObj, {
    showHidden: false,
    depth: 1
  })));

  sessionQueue.enqueue({
    sessionEvent: "SESSION_CREATE",
    session: sessionObj
  });

  socket.on('reconnect_error', function(errorObj) {
    statsObj.socket.reconnect_errors++;
    debug(chalkError(moment().format(defaultDateTimeFormat) 
      + " | SOCKET RECONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on('reconnect_failed', function(errorObj) {
    statsObj.socket.reconnect_fails++;
    debug(chalkError(moment().format(defaultDateTimeFormat) 
      + " | SOCKET RECONNECT FAILED: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on('connect_error', function(errorObj) {
    statsObj.socket.connect_errors++;
    debug(chalkError(moment().format(defaultDateTimeFormat) 
      + " | SOCKET CONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on('connect_timeout', function(errorObj) {
    statsObj.socket.connect_timeouts++;
    debug(chalkError(moment().format(defaultDateTimeFormat) 
      + " | SOCKET CONNECT TIMEOUT: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("error", function(error) {
    statsObj.socket.errors++;
    debug(chalkError(moment().format(defaultDateTimeFormat) 
      + " | *** SOCKET ERROR" + " | " + socket.id + " | " + error));
    sessionQueue.enqueue({
      sessionEvent: "SOCKET_ERROR",
      sessionId: socket.id,
      error: error
    });
  });

  socket.on("reconnect", function(err) {
    statsObj.socket.reconnects++;
    sessionObj.connected = true;
    debug(chalkConnect(moment().format(defaultDateTimeFormat) + " | SOCKET RECONNECT: " + socket.id));
    sessionQueue.enqueue({
      sessionEvent: "SOCKET_RECONNECT",
      sessionId: socket.id
    });
  });

  socket.on("disconnect", function(status) {
    statsObj.socket.disconnects++;
    debug(chalkDisconnect(moment().format(defaultDateTimeFormat) 
      + " | SOCKET DISCONNECT: " + socket.id + "\nstatus\n" + jsonPrint(status)));
    var sessionObj = sessionCache.get(socket.id);
    if (sessionObj) {
      sessionObj.connected = false;
      sessionQueue.enqueue({
        sessionEvent: "SOCKET_DISCONNECT",
        sessionId: socket.id,
        session: sessionObj
      });
      debug(chalkDisconnect("\nDISCONNECTED SOCKET " + util.inspect(socket, {
        showHidden: false,
        depth: 1
      })));
    } else {
      debug(chalkWarn("??? DISCONNECTED SOCKET NOT IN CACHE ... TIMED OUT? | " + socket.id));
    }
  });

  socket.on("REQ_ADMIN_SESSION", function(options) {
    debug(chalkAdmin(moment().format(defaultDateTimeFormat) 
      + " | REQ_ADMIN_SESSION: " + socketId 
      + " | IP: " + ipAddress 
      + " | SID: " + sessionObj.sessionId 
      + " | OPTIONS: " + jsonPrint(options)));

    sessionQueue.enqueue({
      sessionEvent: "REQ_ADMIN_SESSION",
      session: sessionObj,
      options: options
    });
  });

  socket.on("REQ_USER_SESSION", function(options) {
    debug(chalkUser(moment().format(defaultDateTimeFormat) 
      + " | REQ_USER_SESSION: " + socketId 
      + " | IP: " + ipAddress 
      + " | SID: " + sessionObj.sessionId 
      + " | NSP: " + sessionObj.namespace 
      + " | OPTIONS: " + jsonPrint(options)));

    sessionQueue.enqueue({
      sessionEvent: "REQ_USER_SESSION",
      session: sessionObj,
      options: options
    });
  });

  socket.on("REQ_VIEWER_SESSION", function(options) {
    debug(chalkViewer(moment().format(defaultDateTimeFormat) 
      + " | REQ_VIEWER_SESSION: " + socketId 
      + " | IP: " + ipAddress 
      + " | SID: " + sessionObj.sessionId 
      + " | OPTIONS: " + jsonPrint(options)));

    sessionQueue.enqueue({
      sessionEvent: "REQ_VIEWER_SESSION",
      session: sessionObj,
      options: options
    });
  });

  socket.on("REQ_UTIL_SESSION", function(options) {
    debug(chalkUtil(moment().format(defaultDateTimeFormat) 
      + " | REQ_UTIL_SESSION: " + socketId 
      + " | IP: " + ipAddress 
      + " | SID: " + sessionObj.sessionId 
      + " | OPTIONS: " + jsonPrint(options)));

    sessionQueue.enqueue({
      sessionEvent: "REQ_UTIL_SESSION",
      session: sessionObj,
      options: options
    });
  });

  socket.on("ADMIN_READY", function(adminObj) {

    debug(chalkAdmin("ADMIN READY\n" + jsonPrint(adminObj)));

    var socketId = socket.id;
    var sessionObj = sessionCache.get(socketId);

    if (!sessionObj) {
      debug(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON ADMIN READY | " + socketId));
      return;
    }

    debug(chalkConnect("--- ADMIN READY   | " + adminObj.adminId 
      + " | SID: " + sessionObj.sessionId + " | " + moment().format(defaultDateTimeFormat)));

    sessionQueue.enqueue({
      sessionEvent: "ADMIN_READY",
      session: sessionObj,
      admin: adminObj
    });
  });

  socket.on("VIEWER_READY", function(viewerObj) {

    debug(chalkViewer("VIEWER READY\n" + jsonPrint(viewerObj)));

    var socketId = socket.id;
    var sessionObj = sessionCache.get(socketId);

    if (!sessionObj) {
      debug(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON VIEWER READY | " + socketId));
      return;
    }
    debug(chalkConnect("--- VIEWER READY   | " + viewerObj.viewerId 
      + " | SID: " + sessionObj.sessionId 
      + " | " + moment().format(defaultDateTimeFormat)));

    sessionQueue.enqueue({
      sessionEvent: "VIEWER_READY",
      session: sessionObj,
      viewer: viewerObj
    });
  });

  socket.on("SESSION_KEEPALIVE", function(userObj) {
    statsObj.socket.SESSION_KEEPALIVES++;
    debug(chalkUser("SESSION_KEEPALIVE\n" + jsonPrint(userObj)));
    if (userObj.userId.match(/TMS_/g)){
      console.log(chalkRedBold("SESSION_KEEPALIVE" 
        + " | " + userObj.userId
        + " | " + moment().format(defaultDateTimeFormat)
        // + "\n" + jsonPrint(userObj)
      ));
    }
 
    var socketId = socket.id;
    var sessionObj = {};

    if ((typeof userObj.tags !== 'undefined')
      && (typeof userObj.tags.mode !== 'undefined') 
      && (userObj.tags.mode == 'substream')) {
      socketId = socket.id + "#" + userObj.tags.entity;
      debug(chalkRedBold("KEEPALIVE socketId: " + socketId));
      sessionObj = sessionCache.get(socketId);
    }
    else {
      debug(chalkRedBold("KEEPALIVE socketId: " + socketId));
      sessionObj = sessionCache.get(socketId);
    }

    if (!sessionObj) {
      debug(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON SESSION_KEEPALIVE | " + socketId 
        + " | CREATING SESSION" + "\n" + jsonPrint(userObj)));

      sessionObj = {
        namespace: userObj.namespace,
        socket: socket,
        type: userObj.type,
        mode: userObj.mode,
        user: userObj,
        tags: {}
      }

      if (typeof userObj.tags !== 'undefined') {

        var tagKeys = Object.keys(userObj.tags);

        var i = 0;

        for (i=0; i<tagKeys.length; i++){
          sessionObj.tags[tagKeys[i]] = userObj.tags[tagKeys[i]].toLowerCase();
          console.log(chalkRed("sessionObj " + tagKey + " > " + sessionObj.tags[tagKeys[i]]));
        }

        if (i == tagKeys.length) {
          debug(chalkInfo("SESSION_KEEPALIVE createSession"));
          createSession(sessionObj);
          return;
        }

      }
      else {
        debug(chalkInfo("SESSION_KEEPALIVE createSession"));
        createSession(sessionObj);
        return;
       }

    }
    debug(chalkLog("@@@ SESSION_KEEPALIVE"
      + " | " + userObj.userId 
      + " | " + sessionObj.sessionId 
      + " | " + moment().format(defaultDateTimeFormat)));

    if (typeof userObj.userId !== 'undefined') {
      sessionObj.userId = userObj.userId;
    }

    if (typeof userObj.tags !== 'undefined') {
      sessionObj.tags = userObj.tags;
    }

   if (typeof userObj.mode !== 'undefined') {
      debug("USER MODE: " + userObj.mode);
      sessionObj.config.type = userObj.mode;
    }

    sessionQueue.enqueue({
      sessionEvent: "SESSION_KEEPALIVE",
      session: sessionObj,
      user: userObj
    });
  });

  socket.on("USER_READY", function(userObj) {

  // entityUserObj.name = entity;
  // entityUserObj.tags = {};
  // entityUserObj.tags.entity = entity;
  // entityUserObj.tags.channel = channel;
  // entityUserObj.tags.mode = 'substream';
  // entityUserObj.userId = entity;
  // entityUserObj.screenName = entity;
  // entityUserObj.type = "UTIL";
  // entityUserObj.mode = "SUBSTREAM";
  // entityUserObj.nodeId = entityChannelId;

    var socketId = socket.id;
    var primarySessionObj = sessionCache.get(socket.id);
    // var sessionObj ;

    var sessionCacheKey = socket.id ;

    statsObj.socket.USER_READYS++;

    console.log(chalkUser(">RX USER_READY"
      + " | SID: " + socket.id
      + " | NID: " + userObj.nodeId
      + " | UID: " + userObj.userId
      + " | N: " + userObj.name
      + " | SCN: " + userObj.screenName
      + " | ENT: " + userObj.tags.entity
      + " | CH: " + userObj.tags.channel
      + " | TYPE: " + userObj.type
      + " | MODE: " + userObj.mode
      // + "\n" + jsonPrint(userObj)
    ));

    if ((typeof userObj.tags !== 'undefined')
      && (typeof userObj.tags.entity !== 'undefined') 
      && (typeof userObj.tags.mode !== 'undefined') 
      && (userObj.tags.mode.toLowerCase() == 'substream')) {

      sessionCacheKey = socket.id + "#" + userObj.tags.entity;
      // sessionCacheKey = userObj.tags.entity.toLowerCase();

      console.log(chalkRedBold("USER_READY SUBSTREAM sessionCacheKey: " + sessionCacheKey));
    }
    else {
      console.log(chalkRedBold("USER_READY sessionCacheKey: " + sessionCacheKey));
    }


    sessionCache.get(sessionCacheKey, function(err, sessionObj){
      if (err){
        console.log(chalkError(moment().format(defaultDateTimeFormat) 
          + " | ??? SESSION CACHE ERROR ON USER READY | " + err
        ));
      }
      else {
        if (!sessionObj) {

          var sessionObj = new Session({
            sessionId: sessionCacheKey,
            tags: {},
            // ip: ipAddress,
            namespace: "util",
            createAt: moment().valueOf(),
            lastSeen: moment().valueOf(),
            connected: true,
            connectTime: moment().valueOf(),
            disconnectTime: 0
          });

          sessionObj.config = {};

          console.log(chalkError(moment().format(defaultDateTimeFormat) 
            + " | ??? SESSION NOT FOUND ON USER READY | " + sessionCacheKey
          ));

          if (!primarySessionObj) {
            console.log(chalkError(moment().format(defaultDateTimeFormat) 
              + " | ??? PRIMARY SESSION NOT FOUND ON USER READY"
              + " | " + sessionCacheKey
              + " | SKIPPING "
            ));
            return;
          }
          else if (userObj.tags.mode.toLowerCase() == 'substream') {

            if (typeof userObj.type !== 'undefined') {
              sessionObj.config.type = userObj.type;
              sessionObj.type = userObj.type;
            }
            if (typeof userObj.mode !== 'undefined') {
              sessionObj.config.mode = userObj.mode;
              sessionObj.mode = userObj.mode;
            }

            sessionObj.namespace = "util";
            sessionObj.socket = socket;
            // sessionObj.user = userObj;
            sessionObj.tags.entity = userObj.tags.entity.toLowerCase();
            sessionObj.tags.channel = userObj.tags.channel.toLowerCase();

            sessionCache.set(sessionCacheKey, sessionObj);
          }
        }
        if (typeof userObj.tags !== 'undefined') {

          // console.log(chalkRed("userObj.tags\n" + jsonPrint(userObj)));

          if (typeof sessionObj.tags === 'undefined') {
            console.log(chalkRed("sessionObj.tags UNDEFINED"));
            sessionObj.tags = {};
            sessionObj.tags.entity = userObj.tags.entity.toLowerCase();
            sessionObj.tags.channel = userObj.tags.channel.toLowerCase();
          }
          else {
            if (typeof sessionObj.tags.entity !== 'undefined') {

              // console.log(chalkRed("sessionObj.tags.entity: " + sessionObj.tags.entity));
              sessionObj.tags.entity = sessionObj.tags.entity.toLowerCase();

              if (entityChannelGroupHashMap.has(sessionObj.tags.entity)){

                delete statsObj.entityChannelGroup.hashMiss[sessionObj.tags.entity];

                console.log(chalkInfo("### ENTITY CHANNEL GROUP HASHMAP HIT"
                  + " | " + sessionObj.tags.entity
                  + " > " + entityChannelGroupHashMap.get(sessionObj.tags.entity).groupId
                ));
              }
              else {
                statsObj.entityChannelGroup.hashMiss[sessionObj.tags.entity] = 1;
                statsObj.entityChannelGroup.allHashMisses[sessionObj.tags.entity] = 1;
                console.log(chalkInfo("-0- ENTITY CHANNEL GROUP HASHMAP MISS"
                  + " | " + sessionObj.tags.entity
                  // + "\n" + jsonPrint(statsObj.entityChannelGroup.hashMiss)
                ));

                configEvents.emit("HASH_MISS", {type: "entity", value: sessionObj.tags.entity.toLowerCase()});
                // configEvents.emit("HASH_MISS", {entity: sessionObj.tags.entity});
              }
            }
            else {
              // console.log(chalkRed("sessionObj.tags\n" + jsonPrint(sessionObj.tags)));
              sessionObj.tags.entity = userObj.tags.entity.toLowerCase();
            }
            if (typeof sessionObj.tags.channel !== 'undefined') {

              // console.log(chalkRed("sessionObj.tags.channel: " + sessionObj.tags.channel));
              sessionObj.tags.channel = sessionObj.tags.channel.toLowerCase();

            }
            else {
              // console.log(chalkRed("sessionObj.tags\n" + jsonPrint(sessionObj.tags)));
              sessionObj.tags.channel = userObj.tags.channel.toLowerCase();
            }
          }
        }
        if (typeof userObj.type !== 'undefined') {
          sessionObj.config.type = userObj.type;
        }
        if (typeof userObj.mode !== 'undefined') {
          sessionObj.config.mode = userObj.mode;
        }

        console.log(chalkConnect("--- USER READY   | " + userObj.userId 
          + " | SID: " + sessionObj.sessionId 
          + " | TYPE: " + sessionObj.config.type 
          + " | MODE: " + sessionObj.config.mode 
          + " | " + moment().format(defaultDateTimeFormat) 
          // + "\nSESSION OBJ\n" + jsonPrint(sessionObj) 
          // + "\nUSER OBJ\n" + jsonPrint(userObj)
        ));

        sessionQueue.enqueue({
          sessionEvent: "USER_READY",
          session: sessionObj,
          user: userObj
        });
      }
    });




  });

  socket.on("RESPONSE_WORD_OBJ", function(rxInObj) {
    // console.log("rxInObj\n" + jsonPrint(rxInObj));
    if (responseQueue.size() < MAX_RESPONSE_QUEUE_SIZE) {
      var responseInObj = rxInObj;
      if (rxInObj.tags.mode == 'substream') {
        responseInObj.socketId = socket.id + "#" + rxInObj.tags.entity;
        debug("SUBS" 
          // + " | " + jsonPrint(rxInObj.tags)
          + "\n" + jsonPrint(rxInObj.tags)
        );
      }
      else {
        responseInObj.socketId = socket.id;
      }
      responseQueue.enqueue(responseInObj);
    }
  });

  socket.on("GET_RANDOM_WORD", function() {
    debug(chalkTest("RX GET_RANDOM_WORD | " + socket.id));

    var randWordSession = sessionCache.get(socket.id);

    wordServer.getRandomWord(function(err, randomWordObj) {
      socket.emit("RANDOM_WORD", randomWordObj.nodeId);
    });
  });

  socket.on("GET_SESSION", function(sessionId) {

    var getSessionSession = sessionCache.get(socket.id);

    debug(chalkTest("RX GET_SESSION | " + sessionId 
      + " | CHAIN LIMIT: " + SESSION_WORDCHAIN_REQUEST_LIMIT));
    findSessionById(sessionId, function(err, sessionObj) {
      if (err) {

      } else if (sessionObj) {

        var wordChainIndex = 0;
        var wordChainSegment = sessionObj.wordChain.slice(-SESSION_WORDCHAIN_REQUEST_LIMIT);


        async.forEachOf(

          wordChainSegment, // iterate over wordChain array

          function(word, wordChainIndex, callback) {

            Word.find({
              nodeId: word
            }, function(err, wordArray) {
              if (err) {
                console.log("ERROR\n" + err);
                callback(err);
              } else if (!wordArray) {
                callback(null);
              }
              debug("FOUND CHAIN WORD[" + wordChainIndex + "]: " + wordArray[0].nodeId);
              var sessionUpdateObj = {
                sessionId: sessionObj.sessionId,
                wordChainIndex: wordChainIndex,
                wordChainLength: sessionObj.wordChain.length,
                wordChainSegmentLength: wordChainSegment.length,
                word: wordArray[0]
              };
              socket.emit("SESSION", sessionUpdateObj);
              callback(null);
            });

          },

          function(err) {
            if (!err) debug("TX SESSION COMPLETE: " + sessionId);
          }
        )

      }
    });
  });

  socket.on("BHT_REQUESTS", function(deltaReqs) {
    console.log(chalkBht("RX BHT_REQUESTS"
    + " | " + socket.id
    + " | DELTA: " + deltaReqs
    ));
    incrementSocketBhtReqs(deltaReqs)
  });

  socket.on("MW_REQUESTS", function(deltaReqs) {
    console.log(chalkMw("RX MW_REQUESTS"
    + " | " + socket.id
    + " | DELTA: " + deltaReqs
    ));
    incrementSocketMwReqs(deltaReqs)
  });

  socket.on("SOCKET_TEST_MODE", function(testMode) {

    var socketTestModeSession = sessionCache.get(socket.id);

    debug(chalkTest("RX SOCKET_TEST_MODE: " + testMode));
    serverSessionConfig.testMode = testMode;
    serverSessionConfig.socketId = socket.id;
    testUsersNameSpace.emit("SOCKET_TEST_MODE", serverSessionConfig);
  });
}

var databaseEnabled = false;

configEvents.on("INIT_DATABASE_COMPLETE", function(tweetCount) {
  databaseEnabled = true;
  debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | DATABASE ENABLED"));
});


//=================================
//  METRICS INTERVAL
//=================================
var numberUsersTotal = 0;
var numberViewersTotal = 0;

var metricsInterval = setInterval(function() {

  if (updateComplete) {
    numberAdmins = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberUtils = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberUsers = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberTestUsers = Object.keys(testUsersNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberViewers = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberTestViewers = Object.keys(testViewersNameSpace.connected).length; // userNameSpace.sockets.length ;
  }

  numberUsersTotal = numberUsers + numberTestUsers;
  numberViewersTotal = numberViewers + numberTestViewers;

  if (numberViewersTotal > numberViewersTotalMax) {
    numberViewersTotalMaxTime = moment().valueOf();
    numberViewersTotalMax = numberViewersTotal;
    debug(chalkAlert("... NEW TOTAL MAX VIEWERS" + " | " + moment().format(defaultDateTimeFormat)));
  }

  if (numberViewers > numberViewersMax) {
    numberViewersMaxTime = moment().valueOf();
    numberViewersMax = numberViewers;
    debug(chalkAlert("... NEW MAX VIEWERS" + " | " + moment().format(defaultDateTimeFormat)));
  }

  if (numberUsersTotal > numberUsersTotalMax) {
    numberUsersTotalMaxTime = moment().valueOf();
    numberUsersTotalMax = numberUsersTotal;
    debug(chalkAlert("... NEW TOTAL MAX USERS" + " | " + moment().format(defaultDateTimeFormat)));
  }

  if (numberUsers > numberUsersMax) {
    numberUsersMaxTime = moment().valueOf();
    numberUsersMax = numberUsers;
    debug(chalkAlert("... NEW MAX USERS" + " | " + moment().format(defaultDateTimeFormat)));
  }

  if (numberTestUsers > numberTestUsersMax) {
    numberTestUsersMaxTime = moment().valueOf();
    numberTestUsersMax = numberTestUsers;
    debug(chalkAlert("... NEW MAX TEST USERS" + " | " + moment().format(defaultDateTimeFormat)));
  }

  if (numberUtils > numberUtilsMax) {
    numberUtilsMaxTime = moment().valueOf();
    numberUtilsMax = numberUtils;
    debug(chalkAlert("... NEW MAX UTILS" + " | " + moment().format(defaultDateTimeFormat)));
  }

  var googleMetricsUpdateFlag = !disableGoogleMetrics && googleMetricsEnabled;
  updateMetrics(googleMetricsUpdateFlag);
}, 10000);


//=================================
//  RATE CALC
//=================================
var responseRateQhead;
var rateQinterval = setInterval(function() {

  if (!responseRate1minQ.isEmpty()) {
    responseRateQhead = new Date(responseRate1minQ.peek());
    if ((responseRateQhead.getTime() + 60000 < currentTime)) {
      debug("<<< --- responseRate1minQ deQ: " + responseRateQhead.getTime() + " | NOW: " + moment.utc().format());
      responseRateQhead = responseRate1minQ.dequeue();
      debug("responseRate1minQ Q size: " + responseRate1minQ.size());
    }
  }
}, 50);

var DROPBOX_WA_GROUPS_CONFIG_FILE = process.env.DROPBOX_WA_GROUPS_CONFIG_FILE || 'groups.json';
var DROPBOX_WA_KEYWORDS_FILE = process.env.DROPBOX_WA_KEYWORDS_FILE || 'keywords.json';
var DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE = process.env.DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE || 'entityChannelGroups.json';

var defaultDropboxGroupsConfigFile = DROPBOX_WA_GROUPS_CONFIG_FILE;
var defaultDropboxKeywordFile = DROPBOX_WA_KEYWORDS_FILE;

var dropboxGroupsConfigFile = os.hostname() +  "_" + DROPBOX_WA_GROUPS_CONFIG_FILE;

var defaultDropboxEntityChannelGroupsConfigFile = DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE;
var dropboxEntityChannelGroupsConfigFile = os.hostname() +  "_" + DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE;

var twitterYamlConfigFile = process.env.DEFAULT_TWITTER_CONFIG;

function loadConfig(file, callback){

  dropboxClient.readFile(file, function(err, configJson) {

    if (err) {
      console.error(chalkError("!!! DROPBOX READ " + file + " ERROR: " + err.error));
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
      console.log(chalkError(moment().format(defaultDateTimeFormat) 
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
      console.log(chalkError("!!! DROPBOX READ JSON FILE ERROR: " + file));
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
      console.log(dropboxConfigFile + "\n" + jsonPrint(err));
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
      console.log(dropboxConfigFile + "\n" + jsonPrint(err));
      return(callback(err, loadedConfigObj));
     }
  });
}


//=================================
// INIT APP ROUTING
//=================================

function initAppRouting(callback) {

  debugAppGet(chalkInfo(moment().format(defaultDateTimeFormat) + " | INIT APP ROUTING"));


  app.get('/js/require.js', function(req, res) {
    debugAppGet("LOADING FILE: /js/require.js");
    res.sendFile(__dirname + '/js/require.js');
    return;
  });

  app.get('/node_modules/util/util.js', function(req, res) {
    debugAppGet("LOADING FILE: /node_modules/util/util.js");
    res.sendFile(__dirname + '/node_modules/util/util.js');
    return;
  });

  app.get('/js/libs/d3.js', function(req, res) {
    debugAppGet("LOADING FILE: /js/libs/d3.jss");
    res.sendFile(__dirname + '/js/libs/d3.js');
    return;
  });

  app.get('/js/libs/stringmap.js', function(req, res) {
    debugAppGet("LOADING FILE: /js/libs/stringmap.jss");
    res.sendFile(__dirname + '/js/libs/stringmap.js');
    return;
  });

  app.get('/node_modules/moment/moment.js', function(req, res) {
    debugAppGet("LOADING FILE: /node_modules/moment/moment.js");
    res.sendFile(__dirname + '/node_modules/moment/moment.js');
    return;
  });

  app.get('/node_modules/moment/min/moment.min.js', function(req, res) {
    debugAppGet("LOADING FILE: /node_modules/moment/min/moment.min.js");
    res.sendFile(__dirname + '/node_modules/moment/min/moment.min.js');
    return;
  });

  app.get('/node_modules/node-cache/lib/node_cache.js', function(req, res) {
    debugAppGet("LOADING FILE: /node_modules/node-cache/lib/node_cache.js");
    res.sendFile(__dirname + '/node_modules/node-cache/lib/node_cache.js');
    return;
  });

  app.get('/node_modules/socket.io/lib/socket.js', function(req, res) {
    debugAppGet("LOADING FILE: /node_modules/socket.io/lib/socket.js");
    res.sendFile(__dirname + '/node_modules/socket.io/lib/socket.js');
    return;
  });

  app.get('/threecee.pem', function(req, res) {
    debugAppGet("LOADING FILE: threecee.pem");
    res.sendFile(__dirname + '/threecee.pem');
    return;
  });

  app.get('/instagram', function(req, res) {
    debugAppGet("LOADING PAGE: /instagram");
    // res.sendFile(__dirname + '/index.html');
    return;
  });

  app.get('/', function(req, res) {
    debugAppGet("LOADING PAGE: /");
    debugAppGet("LOADING FILE: /sessionModular.html");
    res.sendFile(__dirname + '/sessionModular.html');
    // res.sendFile(__dirname + '/index.html');
    return;
  });

  app.get('/controlPanel.html', function(req, res) {
    debugAppGet("LOADING PAGE: /controlPanel.html");
    res.sendFile(__dirname + '/controlPanel.html');
    return;
  });

  // app.get('/js/libs/controlPanel.js', function(req, res) {
  //   debugAppGet("LOADING PAGE: /js/libs/controlPanel.js");
  //   res.sendFile(__dirname + '/js/libs/controlPanel.js');
  //   return;
  // });

  app.get('/js/libs/controlPanel.js', function(req, res) {
    console.log("LOADING PAGE: /js/libs/controlPanel.js");

    fs.open(__dirname + '/js/libs/controlPanel.js', "r", function(error, fd) {
      fs.readFile(__dirname + '/js/libs/controlPanel.js', function(error, data) {
        // var newData = data.toString().replace(/REPLACE_THIS/g, "REPLACED THAT");
        var newData;
        if (os.hostname().includes('word')){
          newData = data.toString().replace(/==SOURCE==/g, "http://word.threeceelabs.com");
        }
        else {
          newData = data.toString().replace(/==SOURCE==/g, "http://localhost:9997");
        }
        res.send(newData);
        fs.close(fd);
      });
    });
    
    return;
  });

  app.get('/admin', function(req, res) {
    debugAppGet("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + '/admin/admin.html');
    return;
  });

  app.get('/admin/admin.html', function(req, res) {
    debugAppGet("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + '/admin/admin.html');
    return;
  });

  app.get('/js/libs/progressbar.js', function(req, res) {
    res.sendFile(__dirname + '/js/libs/progressbar.js');
    return;
  });

  app.get('/js/libs/progressbar.min.js', function(req, res) {
    res.sendFile(__dirname + '/js/libs/progressbar.min.js');
    return;
  });

  app.get('/node_modules/crosstab/src/crosstab.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/crosstab/src/crosstab.js');
    return;
  });

  app.get('/node_modules/lsbridge/src/lsbridge.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/lsbridge/src/lsbridge.js');
    return;
  });

  app.get('/css/rangeslider.css', function(req, res) {
    res.sendFile(__dirname + '/css/rangeslider.css');
    return;
  });

  app.get('/css/progressbar.css', function(req, res) {
    res.sendFile(__dirname + '/css/progressbar.css');
    return;
  });

  app.get('/node_modules/debug/node_modules/debug.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/debug/node_modules/debug.js');
    return;
  });

  app.get('/util', function(req, res) {
    debugAppGet(chalkAlert("UTIL PAGE REQUEST ... RETURNING index.html ..."));
    res.sendFile(__dirname + '/index.html');
    return;
  });

  app.get('/test-user', function(req, res) {
    debugAppGet(chalkAlert("TEST USER PAGE REQUEST ... RETURNING index.html ..."));
    res.sendFile(__dirname + '/index.html');
    return;
  });

  app.get('/wordAssoClient.js', function(req, res) {
    debugAppGet("LOADING PAGE: /wordAssoClient.js");
    res.sendFile(__dirname + '/wordAssoClient.js');
    return;
  });

  /*
  // var DEFAULT_SOURCE = "http://localhost:9997";
  // var DEFAULT_SOURCE = "http://word.threeceelabs.com";
  var DEFAULT_SOURCE = "==SOURCE==";
  */

  app.get('/session.js', function(req, res) {
    console.log("LOADING FILE: /session.js");

    fs.open(__dirname + '/session.js', "r", function(error, fd) {
      fs.readFile(__dirname + '/session.js', function(error, data) {
        // var newData = data.toString().replace(/REPLACE_THIS/g, "REPLACED THAT");
        var newData;
        if (os.hostname().includes('word')){
          newData = data.toString().replace(/==SOURCE==/g, "http://word.threeceelabs.com");
        }
        else {
          newData = data.toString().replace(/==SOURCE==/g, "http://localhost:9997");
        }
        res.send(newData);
        fs.close(fd);
      });
    });

    return;
  });

  app.get('/session', function(req, res) {
    debugAppGet("LOADING FILE: /sessionModular.html");
    res.sendFile(__dirname + '/sessionModular.html');
    return;
  });

  app.get('/sessionModular', function(req, res) {
    debugAppGet("LOADING FILE: /sessionModular.html");
    res.sendFile(__dirname + '/sessionModular.html');
    return;
  });

  app.get('/js/libs/sessionViewTicker_v4.js', function(req, res) {
    debugAppGet("LOADING FILE: sessionViewTicker_v4.js");
    res.sendFile(__dirname + '/js/libs/sessionViewTicker_v4.js');
    return;
  });

  app.get('/js/libs/sessionViewFlow.js', function(req, res) {
    debugAppGet("LOADING FILE: sessionViewFlow.js");
    res.sendFile(__dirname + '/js/libs/sessionViewFlow.js');
    return;
  });

  app.get('/js/libs/sessionViewHistogram.js', function(req, res) {
    debugAppGet("LOADING FILE: sessionViewHistogram.js");
    res.sendFile(__dirname + '/js/libs/sessionViewHistogram.js');
    return;
  });

  app.get('/js/libs/sessionViewForce_v4.js', function(req, res) {
    debugAppGet("LOADING FILE: sessionViewForce_v4.js");
    res.sendFile(__dirname + '/js/libs/sessionViewForce_v4.js');
    return;
  });

  app.get('/js/libs/sessionView3d.js', function(req, res) {
    debugAppGet("LOADING FILE: sessionView3d.js");
    res.sendFile(__dirname + '/js/libs/sessionView3d.js');
    return;
  });

  app.get('/js/libs/sessionView.js', function(req, res) {
    debugAppGet("LOADING FILE: sessionView.js");
    res.sendFile(__dirname + '/js/libs/sessionView.js');
    return;
  });

  // app.get('/js/libs/SpriteText2D.js', function(req, res) {
  //   debugAppGet("LOADING FILE: SpriteText2D.js");
  //   res.sendFile(__dirname + '/js/libs/SpriteText2D.js');
  //   return;
  // });

  // app.get('/js/libs/three-text2d.js', function(req, res) {
  //   debugAppGet("LOADING FILE: three-text2d.js");
  //   res.sendFile(__dirname + '/js/libs/three-text2d.js');
  //   return;
  // });


  // app.get('/js/libs/three.min.js', function(req, res) {
  //   debugAppGet("LOADING FILE: three.min.js");
  //   res.sendFile(__dirname + '/js/libs/three.min.js');
  //   return;
  // });

  app.get('/css/main.css', function(req, res) {
    res.sendFile(__dirname + '/css/main.css');
    return;
  });

  app.get('/css/style.css', function(req, res) {
    res.sendFile(__dirname + '/css/style.css');
    return;
  });

  app.get('/css/base.css', function(req, res) {
    res.sendFile(__dirname + '/css/base.css');
    return;
  });

  app.get('/node_modules/panzoom/dist/panzoom.min.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/panzoom/dist/panzoom.min.js');
    return;
  });

  app.get('/node_modules/async/lib/async.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/async/lib/async.js');
    return;
  });

  app.get('/js/libs/Queue.js', function(req, res) {
    res.sendFile(__dirname + '/js/libs/Queue.js');
    return;
  });

  app.get('/node_modules/hashmap/hashmap.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/hashmap/hashmap.js');
    return;
  });

  app.get('/favicon.ico', function(req, res) {
    debugAppGet("LOADING PAGE: /favicon.ico");
    res.sendFile(__dirname + '/favicon.png');
    return;
  });

  app.get('/favicon.png', function(req, res) {
    debugAppGet("LOADING PAGE: /favicon.png");
    res.sendFile(__dirname + '/favicon.png');
    return;
  });

  configEvents.emit("INIT_APP_ROUTING_COMPLETE");
  callback(null, "INIT_APP_ROUTING_COMPLETE");
}

var wordsApiKey = 'RWwyknmI1OmshYkPUYAQyHVv1Cbup1ptubzjsn2F19wbnAlSEf';
var wapiUrlRoot = 'https://wordsapiv1.p.mashape.com/words/';

function wapiSearch(word, variation, callback){

  if (wapiOverLimitFlag || (statsObj.wapi.requestsRemaining < wapiReqReservePercent * statsObj.wapi.requestLimit)) {
    if (!wapiOverLimitFlag) {
      wapiOverLimitFlag = true;
      wapiEvents.emit("WAPI_OVER_LIMIT", wapiRequests);
    }
    return(callback(
      {
        err: "WAPI_OVER_LIMIT", 
        totalRequests: statsObj.wapi.totalRequests, 
        requestsRemaining: statsObj.wapi.requestsRemaining, 
        requestLimit: statsObj.wapi.requestLimit
      }
    ));
  }

  var wapiUrl;

  if (variation == "ALL"){
    wapiUrl = wapiUrlRoot + word.toLowerCase();
  }
  else {
    wapiUrl = wapiUrlRoot + word.toLowerCase() + '/' + variation;
  }

  unirest.get(wapiUrl)
  .header("X-Mashape-Key", wordsApiKey)
  .header("Accept", "application/json")
  .end(function (response) {

    debugWapi(chalkWapi("WAPI RESPONSE\n" + jsonPrint(response.headers)));

    if (typeof response.headers['x-ratelimit-requests-limit'] !== 'undefined'){
      statsObj.wapi.requestLimit = parseInt(response.headers['x-ratelimit-requests-limit']);
      statsObj.wapi.requestsRemaining = parseInt(response.headers['x-ratelimit-requests-remaining']);
      if (statsObj.wapi.requestsRemaining > 0) {
        statsObj.wapi.totalRequests = statsObj.wapi.requestLimit - statsObj.wapi.requestsRemaining;
      }
      else {
        statsObj.wapi.totalRequests = statsObj.wapi.requestLimit + statsObj.wapi.requestsRemaining;
      }
    }

    if (statsObj.wapi.requestsRemaining < wapiReqReservePercent * statsObj.wapi.requestLimit) {
      return(callback({
        err: "WAPI_OVER_LIMIT", 
        totalRequests: statsObj.wapi.totalRequests, 
        requestsRemaining: statsObj.wapi.requestsRemaining,
        requestLimit: statsObj.wapi.requestLimit
      }));
    }

    var results = {};

    if (response.statusCode == 404){
      results.word = word;
      results.variation = variation;
      results.wapiSearched = true;
      results.wapiFound = false;

      debugWapi(chalkWapi("WAPI"
        + " [ " + statsObj.wapi.totalRequests 
        + " / " + statsObj.wapi.requestLimit 
        + " | " + (100*(statsObj.wapi.totalRequests/statsObj.wapi.requestLimit)).toFixed(2) + "% ]"
        // + "\n" + jsonPrint(results) 
        // + "\n" + jsonPrint(statsObj.wapi) 
      //   + " | " + response.body[variation]
      ));
      callback(results);
    }
    else {
      results.word = word;
      results.body = response.body;
      results.variation = variation;
      results.wapiSearched = true;
      results.wapiFound = true;

      debugWapi(chalkWapi("WAPI"
        + " [ " + statsObj.wapi.totalRequests 
        + " / " + statsObj.wapi.requestLimit 
        + " | " + (100*(statsObj.wapi.totalRequests/statsObj.wapi.requestLimit)).toFixed(2) + "% ]"
        // + "\n" + jsonPrint(results) 
        // + "\n" + jsonPrint(statsObj.wapi) 
      //   + " | " + response.body[variation]
      ));
      callback(results);
    }


  });
}

 
function sendDirectMessage(user, message, callback) {
  
  twit.post('direct_messages/new', {screen_name: user, text:message}, function(error, response){

    if(error) {
      debug(chalkError("!!!!! TWITTER SEND DIRECT MESSAGE ERROR: " 
        + getTimeStamp() 
        + '\nERROR\n'  + jsonPrint(error)
        + '\nRESPONSE\n'  + jsonPrint(response)
      ));
      callback(error, message) ;
    }
    else{
      debug(chalkTwitter(getTimeStamp() + " | SENT TWITTER DM TO " + user + ": " + response.text));
      callback(null, message) ;
    }

  });
}

//=================================
// PROCESS HANDLERS
//=================================

process.on("message", function(msg) {

  if ((msg == 'SIGINT') || (msg == 'shutdown')) {

    debug('\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n');
    debug("... SAVING STATS");

    saveStats(statsFile, statsObj, function(status) {
      if (status != 'OK') {
        debug("!!! ERROR: saveStats " + status);
      } else {
        debug(chalkLog("UPDATE STATUS OK"));
      }
    });

    setTimeout(function() {
      debug('**** Finished closing connections ****\n\n ***** RELOADING blm.js NOW *****\n\n');
      process.exit(0);
    }, 300);

  }
});

//=================================
// BEGIN !!
//=================================
initializeConfiguration(function(err, results) {

  if (err) {
    console.log(chalkError("*** INITIALIZE CONFIGURATION ERROR ***\n" + jsonPrint(err)));
  } 
  else {

    console.log(chalkLog("INITIALIZE CONFIGURATION COMPLETE\n" + jsonPrint(results)));


    updateTrends();
    initUpdateTrendsInterval(ONE_MINUTE);
    initFollowerUpdateQueueInterval(100);

    updater = cp.fork(`${__dirname}/js/libs/updateGroupsEntitiesChannels.js`);

    updater.on('message', function(m){
      debug(chalkWarn("UPDATER RX\n" + jsonPrint(m)));
      updaterMessageQueue.enqueue(m);
    });

    updater.send({
      folder: ".",
      groupsConfigFile: defaultDropboxGroupsConfigFile,
      entityChannelGroupsConfigFile: defaultDropboxEntityChannelGroupsConfigFile,
      keywordFile: defaultDropboxKeywordFile,
      interval: GROUP_UPDATE_INTERVAL
    });
  }
});

updateStatsCounts();

module.exports = {
  app: app,
  io: io,
  http: httpServer
}
