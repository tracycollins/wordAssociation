/*jslint node: true */
"use strict";

var debug = require('debug')('wa');
var debugAppGet = require('debug')('appGet');

var MAX_RESPONSE_QUEUE_SIZE = 250;
var OFFLINE_MODE = false;
var quitOnError = false;

var serverReady = false;
var internetReady = false;

var minServerResponseTime = 247;
var maxServerResponseTime = 1447;

var SESSION_CACHE_DEFAULT_TTL = 300; // seconds
var WORD_CACHE_TTL = 60; // seconds

var MAX_WORDCHAIN_LENGTH = 10;
var MIN_CHAIN_FREEZE_LENGTH = 20;
var MIN_CHAIN_FREEZE_UNIQUE_NODES = 10;

var BHT_REQUEST_LIMIT = 250000;
var MW_REQUEST_LIMIT = 250000;

var SESSION_WORDCHAIN_REQUEST_LIMIT = 25;

var saveStatsInterval = 10000; // millis

// ==================================================================
// TEST CONFIG
// ==================================================================
var testMode = false;
var bhtOverLimitTestFlag = false;

// ==================================================================
// SESSION MODES: RANDOM, ANTONYM, SYNONYM, SCRIPT, USER_USER, GROUP, STREAM  ( session.config.mode )
// ==================================================================

var sessionModes = ["RANDOM", "ANTONYM", "SYNONYM", "SCRIPT", "USER_USER", "GROUP"];
var enabledSessionModes = ["ANTONYM", "SYNONYM"];
// var enabledSessionModes = [ "USER_USER" ];

var DEFAULT_SESSION_MODE = 'RANDOM';
var defaultSessionMode = DEFAULT_SESSION_MODE;


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

var entityChannelGroupHashMap = new HashMap();

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
}, 10);

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
  "bhtWordsMiss": {},
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

statsObj.session.error = 0;
statsObj.session.previousPromptNotFound = 0;
statsObj.session.responseError = 0;

statsObj.socket.connects = 0;
statsObj.socket.reconnects = 0;
statsObj.socket.disconnects = 0;
statsObj.socket.errors = 0;

statsObj.entityChannelGroup = {};
statsObj.entityChannelGroup.hashMiss = {};
// ==================================================================
// LOGS, STATS
// ==================================================================
var chalk = require('chalk');

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

// ==================================================================
// BIG HUGE THESAURUS
// ==================================================================
var bigHugeLabsApiKey = "e1b4564ec38d2db399dabdf83a8beeeb";
var bigHugeThesaurusUrl = "http://words.bighugelabs.com/api/2/" + bigHugeLabsApiKey + "/";
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

console.log('WORDASSO_NODE_ENV BEFORE: ' + process.env.WORDASSO_NODE_ENV);

process.env.WORDASSO_NODE_ENV = process.env.WORDASSO_NODE_ENV || 'development';

console.log('WORDASSO_NODE_ENV : ' + process.env.WORDASSO_NODE_ENV);
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

var dropboxHostStatsFile = "/stats/" + os.hostname() + "_" + process.pid + "_" + WA_STATS_FILE;

var Dropbox = require("dropbox");

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var dropboxClient = new Dropbox.Client({
  token: DROPBOX_WORD_ASSO_ACCESS_TOKEN,
  key: DROPBOX_WORD_ASSO_APP_KEY,
  secret: DROPBOX_WORD_ASSO_APP_SECRET
});

if (OFFLINE_MODE) {
  statsFile = offlineStatsFile;
} else {
  statsFile = dropboxHostStatsFile;

  dropboxClient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));

  dropboxClient.getAccountInfo(function(error, accountInfo) {
    if (error) {
      console.error("\n*** DROPBOX getAccountInfo ERROR ***\n" + JSON.stringify(error, null, 3));
      return error; // Something went wrong.
    }
    console.log(chalkInfo("DROPBOX ACCOUNT INFO: " + JSON.stringify(accountInfo, null, 3)));
    console.log(chalkInfo("DROPBOX ACCOUNT INFO: " + accountInfo.name));
  });
}

function dropboxWriteArrayToFile(filePath, dataArray, callback) {

  if (typeof filePath === 'undefined') {
    console.log(chalkError(moment().format(defaultDateTimeFormat) 
      + " | !!! DROPBOX WRITE FILE ERROR: FILE PATH UNDEFINED"));
    callback('FILE PATH UNDEFINED', null);
  }

  var dataString = dataArray.join('\n');

  dropboxClient.writeFile(filePath, dataString, function(error, stat) {
    if (error) {
      console.error(chalkError(moment().format(defaultDateTimeFormat) 
        + " | !!! DROPBOX WRITE FILE ERROR: " + error));
      callback(error, filePath);
    } else {
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
        + " | DROPBOX FILE WRITE: " + filePath));
      callback(null, stat);
    }
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
    dropboxClient.writeFile(statsFile, JSON.stringify(statsObj, null, 2), function(error, stat) {
      if (error) {
        console.error(chalkError(moment().format(defaultDateTimeFormat) 
          + " | !!! ERROR STATUS WRITE | FILE: " + statsFile 
          + " ERROR: " + error));
        callback(error);
      } else {
        debug(chalkLog("... SAVED STATS | " + statsFile));
        callback('OK');
      }
    });
  }
}

function updateStats(updateObj) {
  for (var key in updateObj) {
    if (updateObj.hasOwnProperty(key)) {
      debug("UPDATING WORD ASSO STATUS | " + key + ": " + updateObj[key]);
      statsObj[key] = updateObj[key];
    }
  }
}

function loadStats(callback) {

  dropboxClient.readFile(statsFile, function(err, statsJson, callback) {

    if (err) {

      console.error(chalkError("!!! DROPBOX READ WA_STATS_FILE ERROR: " + statsFile));
      console.error(chalkError(jsonPrint(err)));

      if (err.status != 404) {
        console.error(chalkError(jsonPrint(err)));
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

      totalSessions: totalSessions,
      sessionUpdatesSent: sessionUpdatesSent,
      sessionCacheTtl: sessionCacheTtl,

      totalWords: totalWords,
      wordCacheHits: wordCache.getStats().hits,
      wordCacheMisses: wordCache.getStats().misses,
      wordCacheTtl: wordCacheTtl
    });

    saveStats(statsFile, statsObj, function(status) {
      if (status != 'OK') {
        console.log("!!! ERROR: SAVE STATUS | FILE: " + statsFile + "\n" + status);
      } else {
        debug(chalkLog("SAVE STATUS OK | FILE: " + statsFile));
      }
    });

  }, interval);
}

var initEntityChannelGroupsInterval;

function updateEntityChannelGroups(configFile){
  initEntityChannelGroups(configFile, function(err, entityChannelGroups){
    if (err){
      console.log(chalkError("*** ERROR initEntityChannelGroups"
        + " | CONFIG FILE: " + configFile
        + "\n" + jsonPrint(err)
      ));
    }
    else {
      console.log(chalkLog("ENTITY CHANNEL GROUPS CONFIG INIT COMPLETE"
        // + "\n" + jsonPrint(entityChannelGroups)
      ));
      Object.keys(entityChannelGroups).forEach(function(entityChannel) {
        var entityGroup = entityChannelGroups[entityChannel];

        if (entityChannelGroupHashMap.has(entityChannel)){
          entityChannelGroupHashMap.set(entityChannel, entityGroup);
          delete statsObj.entityChannelGroup.hashMiss[entityChannel];
          debug(chalkRed("--- UPDATED ENTITY CHANNEL"
            + " | " + entityChannel
            + " | " + entityChannelGroupHashMap.get(entityChannel)
          ));
        }
        else {
          entityChannelGroupHashMap.set(entityChannel, entityGroup);
          console.log(chalkLog("+++ ADDED ENTITY CHANNEL  "
            + " | " + entityChannel
            + " | " + entityChannelGroupHashMap.get(entityChannel)
          ));
        }

      });
    }
  });  
}

function updateEntityChannelGroupsInterval(configFile, interval){

  console.log(chalkLog("updateEntityChannelGroupsInterval"
    + " | INTERVAL: " + interval
    + " | " + configFile
  ));

  initEntityChannelGroupsInterval = setInterval(function() {
    updateEntityChannelGroups(configFile);
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
var Session = require('mongoose').model('Session');
var Word = require('mongoose').model('Word');

var words = require('./app/controllers/word.server.controller');
var Oauth2credential = require('mongoose').model('Oauth2credential');

// ==================================================================
// APP HTTP IO DNS CONFIG -- ?? order is important.
// ==================================================================
var app = express();

var http = require('http');
var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer, {
  reconnection: false
});
var dns = require('dns');
var path = require('path');
var net = require('net');
// var testClient = new net.Socket();

var googleOauthEvents = new EventEmitter();

var Queue = require('queue-fifo');
var socketQueue = new Queue();
var sessionQueue = new Queue();
var dbUpdateQueue = new Queue();

var MAX_WORD_HASH_MAP_COUNT = 20;
var wordArray = []; // used to keep wordHashMap.count() < MAX_WORD_HASH_MAP_COUNT

var NodeCache = require("node-cache");

var adminCache = new NodeCache();
var viewerCache = new NodeCache();
var userCache = new NodeCache();
var utilCache = new NodeCache();

var wordCache = new NodeCache({
  stdTTL: wordCacheTtl,
  checkperiod: 10
});

var sessionCache = new NodeCache({
  stdTTL: sessionCacheTtl,
  checkperiod: 30
});

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

var disableGoogleMetrics = false;
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


var adminNameSpace = io.of("/admin");
var utilNameSpace = io.of("/util");
var userNameSpace = io.of("/user");
var viewNameSpace = io.of("/view");
var testUsersNameSpace = io.of("/test-user");
var testViewersNameSpace = io.of("/test-view");



// ==================================================================
// FUNCTIONS
// ==================================================================
function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
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

var jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } else {
    return "UNDEFINED";
  }
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
        console.error('\n\n***** ERROR: DNS REVERSE IP: ' + ip + '\n' + err + '\n');
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
                return;
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

  while (updateSessionViewReady && (updateSessionViewQueue.length > 0)) {

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

    } else {
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
        wordChainIndex: sessionUpdateObj.source.wordChainIndex,
        links: {},
        mentions: sessionUpdateObj.source.mentions
      };

      if (sessionUpdateObj.target) {
        sessionSmallObj.target = {
          nodeId: sessionUpdateObj.target.nodeId,
          wordChainIndex: sessionUpdateObj.target.wordChainIndex,
          links: {},
          mentions: sessionUpdateObj.target.mentions
        };
      }

      if (sessionUpdateObj.target) {
        debug(chalkLog("S>" + " | " + sessionUpdateObj.userId
          // + " | " + sessionUpdateObj.sessionId
          // + " | WCI: " + sessionUpdateObj.wordChainIndex
          + " | " + sessionUpdateObj.source.nodeId 
          + " [" + sessionUpdateObj.source.wordChainIndex + "]" 
          + " > " + sessionUpdateObj.target.nodeId 
          + " [" + sessionUpdateObj.target.wordChainIndex + "]"
        ));
      } else {
        debug(chalkLog("SNT>" + " | " + sessionUpdateObj.userId
          // + " | " + sessionUpdateObj.sessionId
          // + " | WCI: " + sessionUpdateObj.wordChainIndex
          + " | " + sessionUpdateObj.source.nodeId + " [" + sessionUpdateObj.source.wordChainIndex + "]"
        ));
      }

    }

    viewNameSpace.emit("SESSION_UPDATE", sessionSmallObj);
    testViewersNameSpace.emit("SESSION_UPDATE", sessionSmallObj);
    sessionUpdatesSent++;
    updateStats({
      sessionUpdatesSent: sessionUpdatesSent
    });
    updatePromptResponseMetric(sessionUpdateObj);
    updateSessionViewReady = true;
  }
}, 50);


function updateSessionViews(sessionUpdateObj) {

  // console.log(chalkRed("updateSessionViews | sessionUpdateObj\n" + jsonPrint(sessionUpdateObj)));

  if (entityChannelGroupHashMap.has(sessionUpdateObj.tags.entity)){
    sessionUpdateObj.tags.group = entityChannelGroupHashMap.get(sessionUpdateObj.tags.entity);
    updateSessionViewQueue.push(sessionUpdateObj);
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

    var sourceWordObj;

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

            sessionUpdateObj.tags.group = entityChannelGroupHashMap.get(currentUser.tags.entity);
            // updateSessionViews(sessionUpdateObj);
          }
          else if (typeof currentSession.tags !== 'undefined'){
            sessionUpdateObj.tags.entity = currentSession.tags.entity;
            sessionUpdateObj.tags.channel = currentSession.tags.channel;
            sessionUpdateObj.tags.group = currentSession.tags.group;
            // updateSessionViews(sessionUpdateObj);
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
            sessionUpdateObj.tags.group = entityChannelGroupHashMap.get(currentUser.tags.entity);
            // updateSessionViews(sessionUpdateObj);
          }
          else if (typeof currentSession.tags !== 'undefined'){
            sessionUpdateObj.tags.entity = currentSession.tags.entity;
            sessionUpdateObj.tags.channel = currentSession.tags.channel;
            sessionUpdateObj.tags.group = currentSession.tags.group;
            // updateSessionViews(sessionUpdateObj);
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

          var promptWord = currentSession.wordChain[currentSession.wordChain.length - 1];
          var previousResponse = currentSession.wordChain[currentSession.wordChain.length - 2];

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

          var previousResponse = currentSession.wordChain[currentSession.wordChain.length - 1];

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

function dbUpdateWord(wordObj, incMentions, callback) {

  if ((wordObj.nodeId == null) || (typeof wordObj.nodeId === 'undefined')) {
    debug(chalkError("\n***** dbUpdateWord: NULL OR UNDEFINED nodeId\n" + jsonPrint(wordObj)));
    callback("NULL OR UNDEFINED nodeId", wordObj);
    return;
  }

  words.findOneWord(wordObj, incMentions, function(err, word) {
    if (err) {
      console.error(chalkError("dbUpdateWord -- > findOneWord ERROR" 
        + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(wordObj, null, 2)));
      callback(err, wordObj);
    } else {

      debug("dbUpdateWord ->- DB UPDATE | " 
        + word.nodeId 
        + " | MNS: " + word.mentions 
        + " | BHT SEARCHED: " + word.bhtSearched 
        + " | BHT FOUND: " + word.bhtFound);

      debug(JSON.stringify(word, null, 3));

      if (!word.bhtSearched) { // not yet bht searched
        debug("word.bhtSearched: " + word.bhtSearched);

        bhtSearchWord(word, function(status, bhtResponseObj) {
          if (status.indexOf("BHT_OVER_LIMIT") >= 0) {
            debug(chalkError("bhtSearchWord BHT OVER LIMI"));
            debug("Word CACHE SET1: " + word.nodeId);
            wordCache.set(word.nodeId, word);
            callback('BHT_OVER_LIMIT', word);
          } else if (status.indexOf("BHT_ERROR") >= 0) {
            debug(chalkError("bhtSearchWord dbUpdateWord findOneWord ERROR\n" + JSON.stringify(status)));
            debug("Word CACHE SET2: " + word.nodeId);
            wordCache.set(word.nodeId, word);
            callback('BHT_ERROR', word);
          } else if (bhtResponseObj.bhtFound) {
            debug(chalkBht("-*- BHT HIT   | " + bhtResponseObj.nodeId));
            debug("Word CACHE SET3: " + bhtResponseObj.nodeId);
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
            callback('BHT_HIT', bhtResponseObj);
          } else if (status == 'BHT_REDIRECT') {
            debug(chalkBht("-A- BHT REDIRECT  | " + wordObj.nodeId));
            debug("Word CACHE SET4: " + bhtResponseObj.nodeId);
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
            callback('BHT_REDIRECT', bhtResponseObj);
          } else {
            debug(chalkBht("-O- BHT MISS  | " + wordObj.nodeId));
            debug("Word CACHE SET5: " + bhtResponseObj.nodeId);
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
            bhtWordsMiss[word.nodeId] = word.nodeId;
            updateStats({
              bhtWordsMiss: bhtWordsMiss
            });
            callback('BHT_MISS', bhtResponseObj);
          }
        });
      } else if (word.bhtFound) {
        debug(chalkBht("-F- BHT FOUND | " + word.nodeId));
        debug("Word CACHE SET6: " + word.nodeId);
        wordCache.set(word.nodeId, word);
        callback('BHT_FOUND', word);
      } else {
        debug(chalkBht("-N- BHT NOT FOUND  | " + word.nodeId));
        debug("Word CACHE SET7: " + word.nodeId);
        wordCache.set(word.nodeId, word);
        bhtWordsNotFound[word.nodeId] = word.nodeId;
        updateStats({
          bhtWordsNotFound: bhtWordsNotFound
        });
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
    } else if ((response.statusCode == 500) && (response.statusMessage == 'Inactive key')) {
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
    } else if (bhtOverLimitTestFlag) {
      debug(chalkBht("BHT OVER LIMIT TEST FLAG SET"));
      bhtEvents.emit("BHT_OVER_LIMIT", bhtRequests);
      callback("BHT_OVER_LIMIT", wordObj);
      return;
    } else if (response.statusCode == 404) {
      debug("bhtHttpGet: \'" + wordObj.nodeId + "\' NOT FOUND");
      wordObj.bhtSearched = true;
      wordObj.bhtFound = false;
      words.findOneWord(wordObj, true, function(err, wordUpdatedObj) {
        debug(chalkBht("bhtHttpGet: ->- DB UPDATE | " + wordUpdatedObj.nodeId 
          + " | MNS: " + wordUpdatedObj.mentions));
        debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
        callback("BHT_NOT_FOUND", wordUpdatedObj);
        return;
      });
    } else if (response.statusCode == 303) {
      wordObj.bhtAlt = response.statusMessage;
      debug(chalkBht("BHT REDIRECT" + " | WORD: " + wordObj.nodeId 
      + " | ALT: " + response.statusMessage // alternative word
        + " | " + response.headers.location
      ));
      words.findOneWord(wordObj, true, function(err, wordUpdatedObj) {
        if (err) {
          console.error(chalkError("bhtHttpGet: findOneWord: DB ERROR\n" + "\n" + util.inspect(err, {
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
    } else if (response.statusCode != 200) {
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
    } else {
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

        words.findOneWord(wordObj, true, function(err, wordUpdatedObj) {
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
      words.getWordVariation(query.input, wordTypes, ['ant'], function(status, antWordObj) {
        if (status == 'BHT_VAR_HIT') {
          // debug("randomWordObj: " + randomWordObj.nodeId);
          debug("Word CACHE SET8: " + antWordObj.nodeId);
          wordCache.set(antWordObj.nodeId, antWordObj);
          callback('OK', antWordObj);
          return;
        } else if (status == 'BHT_VAR_MISS') {
          words.getRandomWord(function(err, randomWordObj) {
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
      words.getWordVariation(query.input, wordTypes, ['syn', 'sim'], function(status, synWordObj) {
        if (status == 'BHT_VAR_HIT') {
          // debug("randomWordObj: " + randomWordObj.nodeId);
          debug("Word CACHE SET10: " + synWordObj.nodeId);
          wordCache.set(synWordObj.nodeId, synWordObj);
          callback('OK', synWordObj);
          return;
        } else if (status == 'BHT_VAR_MISS') {
          words.getRandomWord(function(err, randomWordObj) {
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
      words.getRandomWord(function(err, randomWordObj) {
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
  } else if (bhtOverLimitFlag) {

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
  } else {

    incrementSocketBhtReqs(1);

    debug(chalkBht(">>> BHT SEARCH (before replace): " + wordObj.nodeId));

    wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, ' ');
    wordObj.nodeId = wordObj.nodeId.replace(/[\n\r\[\]\{\}\<\>\/\;\:\"\`\~\?\!\@\#\$\%\^\&\*\(\)\_\+\=\.\,]+/g, '');
    wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, ' ');
    wordObj.nodeId = wordObj.nodeId.replace(/^-+|-+$/g, '');
    wordObj.nodeId = wordObj.nodeId.replace(/^\s+|\s+$/g, '');
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
    console.log(chalkInfo("-#- BHT REQS: " + bhtRequests 
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
  // debug("sessionConnectDb: sessionObj: " + util.inspect(sessionObj, {showHidden: false, depth: 1}));

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
        console.error("!!! SESSION FINDONE ERROR: " + moment().format(defaultDateTimeFormat) 
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
        console.error(chalkError("!!! SESSION FINDONE ERROR: " 
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

function adminUpdateDb(adminObj, callback) {

  if (adminObj.ip && (typeof adminObj.domain === 'undefined')) {
    dnsReverseLookup(adminObj.ip, function(err, domains) {
      if (err) {
        adminObj.domain = 'DOMAIN NOT FOUND';
        console.error("adminUpdateDb: DOMAIN NOT FOUND"
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
        console.error("!!! ADMIN FINDONE ERROR: " 
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
        console.error("!!! VIEWER FINDONE ERROR: " 
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
        console.error(chalkError("*** dnsReverseLookup ERROR\n" + err));
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
      "screenName": userObj.screenName,
      "description": userObj.description,
      "url": userObj.url,
      "profileUrl": userObj.profileUrl,
      "profileImageUrl": userObj.profileImageUrl,
      "verified": userObj.verified,
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
        console.error("!!! USER FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat) 
          + " | " + userObj.userId 
          + "\n" + err
        );
        callback(err, userObj);
      } else {
        debug(chalkUser(">>> USER UPDATED" 
          + " | " + us.userId 
          + "\nSN:   " + us.screenName 
          + "\nNSP:  " + us.namespace 
          + "\nIP:   " + us.ip 
          + "\nDOM:  " + us.domain 
          + "\nSID:  " + us.sessionId
          + "\nVER:  " + us.verified 
          + "\nLS:   " + getTimeStamp(us.lastSeen) 
          + "\nSES:  " + us.sessions.length 
          + "\nLSES: " + us.lastSession 
          + "\nCON:  " + us.connected
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
      console.error(err, null);
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
            console.error("*** ERROR  adminFindAllDb: " + err);
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
            console.error("*** ERROR  viewerFindAllDb\n" + err);
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
            console.error("*** ERROR  userFindAllDb\n" + err);
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
            console.error("*** ERROR  ipAddressFindAllDb\n" + err);
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
      console.error(chalkError(moment().format(defaultDateTimeFormat) 
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
        console.error(chalkError(moment().format(defaultDateTimeFormat) 
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
        console.error(chalkError("!!! OAUTH2 CREDENTIAL FINDONE ERROR: " 
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
        console.error("!!! GOOGLE CLOUD MONITORING ERROR " 
          + " | " + moment().format(defaultDateTimeFormat) 
          + " | " + statArray 
          + "\n" + util.inspect(err, {
          showHidden: false,
          depth: 3
        }));

        if (err.code == 500) {
          console.error(chalkGoogle("??? GOOGLE CLOUD MONITORING INTERNAL SERVER ERROR (CODE: 500)"));
        }

        if (err.toString().indexOf("Daily Limit Exceeded") >= 0) {
          console.error(chalkGoogle("!!! GOOGLE CLOUD MONITORING DAILY LIMIT EXCEEDED ... DISABLING METRICS"));
          googleMetricsEnabled = false;
          googleOauthEvents.emit("DAILY LIMIT EXCEEDED");
        }
        if (err.toString().indexOf("socket hang up") >= 0) {
          console.error(chalkGoogle("!!! GOOGLE CLOUD MONITORING SOCKET HUNG UP ... DISABLING METRICS"));
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
        console.error(chalkError("\n\n***** ERROR: dnsReverseLookup: " + sessionObj.ip + " ERROR: " + err));
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
      debug(chalkSession(
        "*** ABT SESSION ABORTED" + " | ID: " + sesObj.sessionId
      ));

      io.to(sesObj.sessionId).emit('SESSION_ABORT', sesObj.sessionId);

      sesObj.sessionEvent = 'SESSION_DELETE';
      viewNameSpace.emit('SESSION_DELETE', sesObj);
      break;

    case 'SESSION_EXPIRED':
    case 'SOCKET_ERROR':
    case 'SOCKET_DISCONNECT':

      console.log(chalkSession(
        "XXX " + sesObj.sessionEvent 
        + " | " + moment().format(defaultDateTimeFormat) 
        + " | NSP: " + sesObj.session.namespace 
        + " | SID: " + sesObj.session.sessionId 
        + " | UID: " + sesObj.session.userId 
        + " | IP: " + sesObj.session.ip 
        + " | DOMAIN: " + sesObj.session.domain
      ));

      sesObj.sessionEvent = 'SESSION_DELETE';
      viewNameSpace.emit('SESSION_DELETE', sesObj);

      sessionCache.del(sesObj.session.sessionId);

      if (sesObj.session) {

        debug(sesObj.sessionEvent + "\n" + jsonPrint(sesObj));

        var currentAdmin = adminCache.get(sesObj.session.userId);
        var currentUser = userCache.get(sesObj.session.userId);
        var currentUtil = utilCache.get(sesObj.session.userId);
        var currentViewer = viewerCache.get(sesObj.session.userId);

        sesObj.session.disconnectTime = moment().valueOf();
        sessionUpdateDb(sesObj.session, function() {});

        sesObj.session.wordChain.forEach(function(word) {
          debug(chalkSession(">T< SET WORD " + word + " TTL: " + wordCacheTtl));
          wordCache.ttl(word, wordCacheTtl);
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
              console.error(chalkError("*** pairUser ERROR\n" + jsonPrint(err)));
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
          console.error(chalkError(
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
              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0]
              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1]
            ));
            sessionUpdatedObj.wordChain = sessionUpdatedObj.wordChain.slice(-MAX_WORDCHAIN_LENGTH);
            debug(chalkSession("NEW WC"
              + " | UID: " + sessionUpdatedObj.userId
              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0]
              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1]
            ));
            sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
          }
          else {
            sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
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
            // sessionUpdateObj.tags.entity = sessionUpdatedObj.userId.toLowerCase();

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
          console.error(chalkError("*** ERROR viewerUpdateDb\n" + jsonPrint(err)))
        } else {
          var viewerSessionKey = randomInt(1000000, 1999999);

          currentSession.viewerSessionKey = viewerSessionKey;
          updatedViewerObj.viewerSessionKey = viewerSessionKey;

          sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
            if (err) {
              console.error(chalkError("*** ERROR sessionUpdateDb\n" + jsonPrint(err)))
            } else {
              // viewerCache.set(sessionUpdatedObj.userId, sessionUpdatedObj.viewer);

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
        + " | TYPE: " + sesObj.session.config.type 
        + " | MODE: " + sesObj.session.config.mode 
        + "\nSID: " + sesObj.session.sessionId 
        + " | ENT: " + sesObj.user.tags.entity 
        + " | CH: " + sesObj.user.tags.channel 
        + " | UID: " + sesObj.user.userId 
        + " | IP: " + sesObj.session.ip 
        + " | DOM: " + sesObj.session.domain
        // + "\n" + jsonPrint(sesObj)
      ));

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

          if (sesObj.session.config.type == 'USER') {
            debug(chalkRed("TX USER SESSION (USER READY): " + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));
            adminNameSpace.emit('USER_SESSION', updatedUserObj);
          } else if (sesObj.session.config.type == 'UTIL') {
            debug(chalkRed("TX UTIL SESSION (UTIL READY): " + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));
            adminNameSpace.emit('UTIL_SESSION', updatedUserObj);
          }

          io.of(sesObj.session.namespace).to(sesObj.session.sessionId).emit('USER_READY_ACK', updatedUserObj.userId);

        } else {
          debug(chalkError("*** USER UPDATE DB ERROR\n" + jsonPrint(err)));
          if (quitOnError) quit(err);
        }
      });

      /*
          ROUTING OF PROMPT/RESPONSE BASED ON SESSION TYPE
      */

      sessionCache.set(currentSession.sessionId, currentSession, function(err, success) {
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
                      words.getRandomWord(function(err, randomWordObj) {
                        if (!err) {

                          randomWordObj.wordChainIndex = currentSession.wordChainIndex;

                          debug("Word CACHE SET13: " + randomWordObj.nodeId);
                          wordCache.set(randomWordObj.nodeId, randomWordObj);

                          currentSession.wordChain.push(randomWordObj.nodeId);
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
                          console.error(chalkError("*** pairUser ERROR\n" + jsonPrint(err)));
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

                    case 'STREAM':
                      debug(chalkSession("... STREAM USER " + currentSession.userId));
                      sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
                        if (!err) {
                          if (typeof sessionCache.wordChain !== 'undefined'
                            && (sessionCache.wordChain.length > MAX_WORDCHAIN_LENGTH)) {
                            console.log(chalkSession("SHORTEN WC TO " + MAX_WORDCHAIN_LENGTH
                              + " | UID: " + sessionUpdatedObj.userId
                              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
                              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0]
                              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1]
                            ));
                            sessionUpdatedObj.wordChain = sessionUpdatedObj.wordChain.slice(-MAX_WORDCHAIN_LENGTH);
                            console.log(chalkSession("NEW WC"
                              + " | UID: " + sessionUpdatedObj.userId
                              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
                              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0]
                              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1]
                            ));
                            sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                          }
                          else {
                            sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
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

    debug(chalkSession("----------\nREAD SESSION QUEUE" + " | " + sesObj.sessionEvent + "\n" + jsonPrint(sesObj)));

    handleSessionEvent(sesObj, function(rSesObj) {
      readSessionQueueReady = true;
    });

  }
}, 20);

var ready = true;

var readResponseQueue = setInterval(function() {

  if (ready && !responseQueue.isEmpty()) {

    ready = false;

    var rxInObj = responseQueue.dequeue();


    // console.log(chalkRed("rxInObj\n" + jsonPrint(rxInObj)));

    if ((typeof rxInObj.nodeId === 'undefined') || (typeof rxInObj.nodeId !== 'string')) {
      debug(chalkError("*** ILLEGAL RESPONSE ... SKIPPING" + "\nTYPE: " + typeof rxInObj.nodeId 
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
      console.log(chalkWarn("??? SESSION NOT IN CACHE ON RESPONSE Q READ" + " | responseQueue: " + responseQueue.size() 
        + " | " + socketId + " | ABORTING SESSION"));

      sessionQueue.enqueue({
        sessionEvent: "SESSION_ABORT",
        sessionId: socketId
      });
      ready = true;
      return;
    }

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
      // previousPrompt = currentSessionObj.wordChain[currentSessionObj.wordChainIndex - 1];
      previousPrompt = currentSessionObj.wordChain[currentSessionObj.wordChain.length - 1];
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

        // ready = true;
        // return;
      } else {
        debug(chalkResponse("... previousPromptObj: " + previousPromptObj.nodeId));
      }
    } else if (currentSessionObj.config.mode == 'STREAM') {
      previousPromptObj = {
        nodeId: 'STREAM'
      };
      debug(chalkWarn("STREAM WORD CHAIN\n" + jsonPrint(currentSessionObj.wordChain)));
    } else if (currentSessionObj.config.mode == 'USER_USER') {
      previousPromptObj = {
        nodeId: 'USER_USER'
      };
      debug(chalkWarn("USER_USER WORD CHAIN\n" + jsonPrint(currentSessionObj.wordChain)));
    } else {
      debug(chalkWarn("??? EMPTY WORD CHAIN ... PREVIOUS PROMPT NOT IN CACHE ... ABORTING SESSION" 
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

        currentSessionObj.wordChain.push(responseInObj.nodeId);
        // currentSessionObj.wordChainIndex++;

        previousPromptObj = {
          nodeId: previousPrompt
        };
        debug("Word CACHE SET14: " + previousPromptObj.nodeId);
        wordCache.set(previousPromptObj.nodeId, previousPrompt);
      } else {

      }
    }

    if (typeof responseInObj.tags === 'undefined') {
      responseInObj.tags = {};
      responseInObj.tags.entity = 'unknown_entity';
      responseInObj.tags.channel = 'unknown_channel';
    } else {
      if (typeof responseInObj.tags.entity === 'undefined') {
        responseInObj.tags.entity = 'unknown_entity';
      }
      else {
        responseInObj.tags.entity = responseInObj.tags.entity.toLowerCase();
      }
      if (typeof responseInObj.tags.channel === 'undefined') {
        responseInObj.tags.channel = 'unknown_channel';
      }
      else {
        responseInObj.tags.channel = responseInObj.tags.channel.toLowerCase();
      }
    }

    if (entityChannelGroupHashMap.has(responseInObj.tags.entity)){
      responseInObj.tags.group = entityChannelGroupHashMap.get(responseInObj.tags.entity);
    }
    else {
      responseInObj.tags.group = 'unknown_group';
    }

    console.log(chalkResponse("R<" 
      + " GRP: " + responseInObj.tags.group 
      // + " | U: " + currentSessionObj.userId
      + " | ENT: " + responseInObj.tags.entity 
      + " | CH: " + responseInObj.tags.channel 
      + " | NID: " + responseInObj.nodeId 
      + " [" + currentSessionObj.wordChainIndex + "]" 
      + " < " + previousPrompt
    ));

    var dbUpdateObj = {};
    dbUpdateObj.word = responseInObj;
    dbUpdateObj.session = currentSessionObj;
    dbUpdateObj.tags = {};

    if (responseInObj.tags){
      dbUpdateObj.tags.entity = responseInObj.tags.entity;
      dbUpdateObj.tags.channel = responseInObj.tags.channel;
      dbUpdateObj.tags.group = responseInObj.tags.group;
    }

    dbUpdateQueue.enqueue(dbUpdateObj);

    ready = true;
  }
}, 50);

var readDbUpdateQueue = setInterval(function() {

  if (!dbUpdateQueue.isEmpty()) {

    var dbUpdateObj = dbUpdateQueue.dequeue();


    var currentSessionObj = dbUpdateObj.session;

    dbUpdateObj.word.wordChainIndex = currentSessionObj.wordChainIndex;

    currentSessionObj.wordChain.push(dbUpdateObj.word.nodeId);
    currentSessionObj.wordChainIndex++;

    if (entityChannelGroupHashMap.has(dbUpdateObj.tags.entity)){
      currentSessionObj.tags.entity = dbUpdateObj.tags.entity;
      currentSessionObj.tags.channel = dbUpdateObj.tags.channel;
      currentSessionObj.tags.group = entityChannelGroupHashMap.get(dbUpdateObj.tags.entity);
    }


    dbUpdateWord(dbUpdateObj.word, true, function(status, updatedWordObj) {

      updatedWordObj.wordChainIndex = dbUpdateObj.word.wordChainIndex;
      // wordCache.set(updatedWordObj.nodeId, updatedWordObj);

      var previousPromptNodeId;
      var previousPromptObj;

      if (dbUpdateObj.word.wordChainIndex == 0) {
        previousPromptObj == null
        debug(chalkRed("CHAIN START"));
      } else if (currentSessionObj.wordChain.length > 1) {
        // previousPromptNodeId = currentSessionObj.wordChain[dbUpdateObj.word.wordChainIndex - 1];
        previousPromptNodeId = currentSessionObj.wordChain[currentSessionObj.wordChain.length - 2];
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


          // console.log(chalkRed("readDbUpdateQueue | currentSessionObj\n" + jsonPrint(currentSessionObj)));
          // console.log(chalkRed("readDbUpdateQueue | dbUpdateObj\n" + jsonPrint(dbUpdateObj)));

          var sessionUpdateObj = {
            action: 'RESPONSE',
            userId: currentSessionObj.userId,
            sessionId: currentSessionObj.sessionId,
            wordChainIndex: dbUpdateObj.word.wordChainIndex,
            source: updatedWordObj,
            target: previousPromptObj,
            tags: dbUpdateObj.tags
          };

          // if (updatedWordObj.tags) sessionUpdateObj.tags = updatedWordObj.tags;
          updateSessionViews(sessionUpdateObj);
        } else {
          debug(chalkError("*** SESSION CACHE SET ERROR" + "\n" + jsonPrint(err)));
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
    var currentResponse = currentSession.wordChain[currentSession.wordChain.length - 1].toLowerCase();


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

            currentSession.wordChain.push(responseObj.nodeId);
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

            currentSession.wordChain.push(responseObj.nodeId);
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

        words.findOneWord(currentResponseWordObj, true, function(err, responseWordObj) {
          if (err) {
            console.error(chalkError("**** USER_USER generatePrompt ERROR\n" + jsonPrint(err)))
          } else {

            responseWordObj.wordChainIndex = targetSession.wordChainIndex;

            debug("Word CACHE SET17: " + responseWordObj.nodeId);
            wordCache.set(responseWordObj.nodeId, responseWordObj);

            targetSession.wordChain.push(responseWordObj.nodeId);
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
      case 'STREAM':
        break;

      default:
        debug(chalkError("3  ????? UNKNOWN SESSION MODE: " + currentSession.config.mode));
        quit("3  ????? UNKNOWN SESSION MODE: " + currentSession.config.mode);
        break;
    }

  }
}, 50);


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
            }
          ],
          function(err, results) { //async.parallel callbac
            if (err) {
              console.error(chalkError("\n" + moment().format(defaultDateTimeFormat) 
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
      }
    ],
    function(err, results) {

      updateEntityChannelGroups(defaultDropboxEntityChannelGroupsConfigFile);
      updateEntityChannelGroupsInterval(defaultDropboxEntityChannelGroupsConfigFile, 5*ONE_MINUTE);

      updateStatsInterval(dropboxHostStatsFile, ONE_MINUTE);

      if (err) {
        console.error(chalkError("\n*** INITIALIZE CONFIGURATION ERROR ***\n" + jsonPrint(err) + "\n"));
        callback(err, null);
      } else {
        debug(chalkLog("\nINITIALIZE CONFIGURATION RESULTS\n" + jsonPrint(results) + "\n"));
        callback(null, results);
      }
    });
}



// ==================================================================
// CACHE HANDLERS
// ==================================================================
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
  debug(chalkRed("... CACHE SESS EXPIRED"
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

wordCache.on("expired", function(word, wordObj) {
  if (typeof wordObj !== 'undefined') {
    debug("CACHE WORD EXPIRED\n" + jsonPrint(wordObj));
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


// ==================================================================
// CONNECT TO INTERNET, START SERVER HEARTBEAT
// ==================================================================
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
      console.error(chalkError('??? HTTP ADDRESS IN USE: ' + config.port + ' ... RETRYING...'));
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

  var serverHeartbeatInterval = setInterval(function() {

    debug(util.inspect(userNameSpace.connected, {
      showHidden: false,
      depth: 1
    }))

    runTime = moment() - startTime;

    bhtTimeToReset = moment.utc().utcOffset("-07:00").endOf('day').valueOf() - moment.utc().utcOffset("-07:00").valueOf();

    //
    // SERVER HEARTBEAT
    //

    if (internetReady) {

      heartbeatsSent++;

      txHeartbeat = {
        serverHostName: os.hostname(),
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

    var socketId = socket.id;
    var sessionObj = sessionCache.get(socketId);

    if (!sessionObj) {
      debug(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON SESSION_KEEPALIVE | " + socketId 
        + " | CREATING SESSION" + "\n" + jsonPrint(userObj)));

      sessionObj = {
        namespace: "view",
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
          sessionObj.tags[tagKey] = userObj.tags[tagKey].toLowerCase();
          console.log(chalkRed("sessionObj " + tagKey + " > " + sessionObj.tags[tagKey]));
        }

        if (i == tagKeys) {
          createSession(sessionObj);
          return;
        }

      }
      else {
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

    statsObj.socket.USER_READYS++;

    console.log(chalkUser("USER READY"
      + " | NID: " + userObj.nodeId
      + " | UID: " + userObj.userId
      + " | SCN: " + userObj.screenName
      + " | ENT: " + userObj.tags.entity
      + " | CH: " + userObj.tags.channel
      + " | TYPE: " + userObj.type
      + " | MODE: " + userObj.mode
      // + "\n" + jsonPrint(userObj)
    ));

    var socketId = socket.id;
    var sessionObj = sessionCache.get(socketId);

    if (!sessionObj) {
      debug(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON USER READY | " + socketId));
      return;
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
            console.log(chalkRed("### ENTITY CHANNEL GROUP HASHMAP HIT"
              + " | " + sessionObj.tags.entity
              + " > " + entityChannelGroupHashMap.get(sessionObj.tags.entity)
            ));
          }
          else {
            statsObj.entityChannelGroup.hashMiss[sessionObj.tags.entity] = 1;
            console.log(chalkRed("--- ENTITY CHANNEL GROUP HASHMAP MISS"
              + " | " + sessionObj.tags.entity
              // + "\n" + jsonPrint(statsObj.entityChannelGroup.hashMiss)
            ));
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
      + "\nSESSION OBJ\n" + jsonPrint(sessionObj) 
      + "\nUSER OBJ\n" + jsonPrint(userObj)));

    sessionQueue.enqueue({
      sessionEvent: "USER_READY",
      session: sessionObj,
      user: userObj
    });
  });

  socket.on("RESPONSE_WORD_OBJ", function(rxInObj) {
    if (responseQueue.size() < MAX_RESPONSE_QUEUE_SIZE) {
      var responseInObj = rxInObj;
      responseInObj.socketId = socket.id;
      responseQueue.enqueue(responseInObj);
    }
  });

  socket.on("GET_RANDOM_WORD", function() {
    debug(chalkTest("RX GET_RANDOM_WORD | " + socket.id));

    var randWordSession = sessionCache.get(socket.id);

    words.getRandomWord(function(err, randomWordObj) {
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
                console.error("ERROR\n" + err);
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
    mode: "STREAM",
    tags: {}
  });
});

userNameSpace.on('connect', function(socket) {
  socket.setMaxListeners(0);
  debug(chalkAdmin("USER CONNECT"));
  createSession({
    namespace: "user",
    socket: socket,
    type: "USER",
    mode: "SYNONYM",
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

  numberAdmins = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUtils = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUsers = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestUsers = Object.keys(testUsersNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberViewers = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestViewers = Object.keys(testViewersNameSpace.connected).length; // userNameSpace.sockets.length ;

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
}, 1000);


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

var DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE = process.env.DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE || 'entityChannelGroups.json';
var defaultDropboxEntityChannelGroupsConfigFile = DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE;
var dropboxEntityChannelGroupsConfigFile = os.hostname() +  "_" + DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE;

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
// INIT APP ROUTING
//=================================

function initAppRouting(callback) {

  debugAppGet(chalkInfo(moment().format(defaultDateTimeFormat) + " | INIT APP ROUTING"));


  app.get('/js/require.js', function(req, res) {
    debugAppGet("LOADING FILE: /js/require.js");
    res.sendFile(__dirname + '/js/require.js');
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
    res.sendFile(__dirname + '/index.html');
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

  app.get('/session.js', function(req, res) {
    debugAppGet("LOADING FILE: /session.js");
    res.sendFile(__dirname + '/session.js');
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

  app.get('/js/libs/sessionViewTicker.js', function(req, res) {
    debugAppGet("LOADING FILE: sessionViewTicker.js");
    res.sendFile(__dirname + '/js/libs/sessionViewTicker.js');
    return;
  });

  app.get('/js/libs/sessionViewHistogram.js', function(req, res) {
    debugAppGet("LOADING FILE: sessionViewHistogram.js");
    res.sendFile(__dirname + '/js/libs/sessionViewHistogram.js');
    return;
  });

  app.get('/js/libs/sessionViewForce.js', function(req, res) {
    debugAppGet("LOADING FILE: sessionViewForce.js");
    res.sendFile(__dirname + '/js/libs/sessionViewForce.js');
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

  app.get('/js/libs/SpriteText2D.js', function(req, res) {
    debugAppGet("LOADING FILE: SpriteText2D.js");
    res.sendFile(__dirname + '/js/libs/SpriteText2D.js');
    return;
  });

  app.get('/js/libs/three-text2d.js', function(req, res) {
    debugAppGet("LOADING FILE: three-text2d.js");
    res.sendFile(__dirname + '/js/libs/three-text2d.js');
    return;
  });


  app.get('/js/libs/three.min.js', function(req, res) {
    debugAppGet("LOADING FILE: three.min.js");
    res.sendFile(__dirname + '/js/libs/three.min.js');
    return;
  });

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
    console.error(chalkError("*** INITIALIZE CONFIGURATION ERROR ***\n" + jsonPrint(err)));
  } else {
    debug(chalkLog("INITIALIZE CONFIGURATION COMPLETE\n" + jsonPrint(results)));
  }
});

updateStatsCounts();

module.exports = {
  app: app,
  io: io,
  http: httpServer
}
