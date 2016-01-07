/*jslint node: true */
"use strict";

console.log(
  '\n\n====================================================================================================\n' 
  +   '========================================= ***START*** ==============================================\n' 
  +   '====================================================================================================\n' 
  +    process.argv[1] + '\nSTARTED ' + Date() + '\n'
  +   '====================================================================================================\n' 
  +   '========================================= ***START*** ==============================================\n' 
  +   '====================================================================================================\n\n'
  );

process.on("message", function(msg) {
  if (msg == 'shutdown') {
    console.log('\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n');
    setTimeout(function() {
      console.log('**** Finished closing connections ****\n\n ***** RELOADING blm.js NOW *****\n\n');
      process.exit(0);
    }, 1500);
  }
});

var ONE_SECOND = 1000 ;
var ONE_MINUTE = ONE_SECOND*60 ;
var ONE_HOUR = ONE_MINUTE*60 ;
var ONE_DAY = ONE_HOUR*24 ;

var currentTime = Date.now();
var startTime = currentTime;
var runTime = 0;

var totalSessions = 0;
var totalUsers = 0;
var totalWords = 0;


var currentTimeInteval = setInterval(function () {
  var d = new Date();
  currentTime = d.getTime();
}, 10);


// ==================================================================
// TEST CONFIG
// ==================================================================
var testMode = false ;

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var chalk = require('chalk');

var chalkGreen = chalk.green;
var chalkAdmin = chalk.bold.cyan;
var chalkConnectAdmin = chalk.bold.cyan;
var chalkConnect = chalk.green;
var chalkDisconnect = chalk.blue;
var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.yellow;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;
var chalkPrompt = chalk.bold.blue;
var chalkResponse = chalk.bold.blue;
var chalkBht = chalk.red;
var chalkDb = chalk.gray;

var serverReady = false ;
var internetReady = false ;

var serverSessionConfig = {};
var configChangeFlag = false ;

// ==================================================================
// NODE MODULE DECLARATIONS
// ==================================================================

var moment = require('moment');

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

var numberPromptsSent = 0;
var numberResponsesReceived = 0;

var bigHugeLabsApiKey = "e1b4564ec38d2db399dabdf83a8beeeb";
var bigHugeThesaurusUrl = "http://words.bighugelabs.com/api/2/" + bigHugeLabsApiKey + "/";
var bhtOverLimitTime = 0;
var BHT_REQUEST_LIMIT = 100000;
var numberBhtRequests = 0;
var bhtLimitResetTime = 0;
var bhtTimeToReset ;


// ==================================================================
// DROPBOX
// ==================================================================
var DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
var DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY ;
var DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;
var DROPBOX_WORD_ASSO_STATS_FILE = process.env.DROPBOX_WORD_ASSO_STATS_FILE;

var Dropbox = require("dropbox");

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var dropboxClient = new Dropbox.Client({
    token: DROPBOX_WORD_ASSO_ACCESS_TOKEN,
    key: DROPBOX_WORD_ASSO_APP_KEY,
    secret: DROPBOX_WORD_ASSO_APP_SECRET
});


dropboxClient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));

dropboxClient.getAccountInfo(function(error, accountInfo) {
  if (error) {
    console.error("\n*** DROPBOX getAccountInfo ERROR ***\n" + JSON.stringify(error, null, 3));
    return error;  // Something went wrong.
  }
  debug(chalkInfo("DROPBOX ACCOUNT INFO: " + JSON.stringify(accountInfo,null,3) ));
  console.log(chalkInfo("DROPBOX ACCOUNT INFO: " + accountInfo.name ));
});

function dropboxWriteArrayToFile(filePath, dataArray, callback){

  if (typeof filePath === 'undefined'){
    console.error(chalkError(getTimeStamp() + " | !!! DROPBOX WRITE FILE ERROR: FILE PATH UNDEFINED"));
    callback('FILE PATH UNDEFINED', null);
  }

  var dataString = dataArray.join('\n');

  dropboxClient.writeFile(filePath, dataString, function(error, stat) {
    if (error) {
      console.error(chalkError(getTimeStamp() + " | !!! DROPBOX WRITE FILE ERROR: " + error));
      callback(error, filePath);
    }
    else {
      debug(chalkInfo(getTimeStamp() + " | DROPBOX FILE WRITE: " + filePath));
      callback(null, stat);
    }
  });
}

dropboxClient.readFile(DROPBOX_WORD_ASSO_STATS_FILE, function(err, statsJson, callback) {

  if (err) {
    console.error(chalkError("!!! DROPBOX READ DROPBOX_WORD_ASSO_STATS_FILE ERROR: " + err));
    return; //It's important to return so that the task callback isn't called twice
  }

  console.log(chalkInfo(getTimeStamp() 
    + " | ... LOADING STATS FROM DROPBOX FILE: " + DROPBOX_WORD_ASSO_STATS_FILE
  ));

  var statsObj = JSON.parse(statsJson);

  console.log("statsJson\n" + JSON.stringify(statsObj, null, 3));

  console.log(chalkInfo(getTimeStamp() + " | FOUND " + statsObj.name));

  // statsObj.locations.forEach(function(stat){
  //   debug("stat\n" + JSON.stringify(stat, null, 3));
  // });

});


// ==================================================================
// ENV INIT
// ==================================================================
var debug = require('debug')('wordAsso');

if (debug.enabled){
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

debug('WORDASSO_NODE_ENV BEFORE: ' + process.env.WORDASSO_NODE_ENV);
process.env.WORDASSO_NODE_ENV = process.env.WORDASSO_NODE_ENV || 'development';
console.log('WORDASSO_NODE_ENV : ' + process.env.WORDASSO_NODE_ENV);

console.log('... SERVER WORDASSO_NODE_ENV: ' + process.env.WORDASSO_NODE_ENV );
console.log('... CLIENT HOST + PORT: ' + 'http://localhost:' + config.port);

// ==================================================================
// MONGO DATABASE CONFIG
// ==================================================================

console.log("\n------------------------\nMONGO DATABASE CONFIG");

var db = mongoose();

var Admin = require('mongoose').model('Admin');
var Client = require('mongoose').model('Client');

var User = require('mongoose').model('User');
var Session = require('mongoose').model('Session');
var Word = require('mongoose').model('Word');

var words = require('./app/controllers/word.server.controller');

// ==================================================================
// APP HTTP IO DNS CONFIG -- ?? order is important.
// ==================================================================
var app = express(); 

var http = require('http');
var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer);
var dns = require('dns');
var path = require('path');
var net = require('net');
var client = new net.Socket();

var EventEmitter2 = require('eventemitter2').EventEmitter2;
var EventEmitter = require("events").EventEmitter;

var configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

var Queue = require('queue-fifo');
var socketQueue = new Queue();

var wordHashMap = new HashMap();
var sessionHashMap = new HashMap();

var promptArray = ["black"];

// ==================================================================
// FUNCTIONS
// ==================================================================
function msToTime(duration) {
  var milliseconds = parseInt((duration%1000)/100)
      , seconds = parseInt((duration/1000)%60)
      , minutes = parseInt((duration/(1000*60))%60)
      , hours = parseInt((duration/(1000*60*60))%24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds ;
}

function msToMinutes(duration) {
  var minutes = parseInt((duration/(1000*60))%60);
  return minutes ;
}

function getTimeNow() {
  var d = new Date();
  return d.getTime();
}

function getTimeStamp(inputTime) {
  var currentTimeStamp ;
  var options = {
    // weekday: "long", year: "numeric", month: "short",
    weekday: "none", year: "numeric", month: "numeric",
    day: "numeric", hour: "2-digit", hour12: false,  minute: "2-digit"
  };

  if (typeof inputTime === 'undefined') {
    currentTimeStamp = moment();
    // currentDate = new Date().toDateString("en-US", options);
    // currentTime = new Date().toTimeString('en-US', options);
  }
  else if (moment.isMoment(inputTime)) {
    // console.log("getTimeStamp: inputTime: " + inputTime + " | NOW: " + Date.now());
    currentTimeStamp = moment(inputTime);
    // currentDate = new Date().toDateString("en-US", options);
    // currentTime = new Date().toTimeString('en-US', options);
  }
  else {
    currentTimeStamp = moment(parseInt(inputTime));
    // var d = new Date(inputTime);
    // currentDate = new Date(d).toDateString("en-US", options);
    // currentTime = new Date(d).toTimeString('en-US', options);
  }
  return currentTimeStamp.format("YYYY-MM-DD HH:mm:ss ZZ");
}

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

var randomIntFromInterval = function (min,max) {
  return Math.floor(Math.random()*(max-min+1)+min);
}

function readFileIntoArray (path, callback) {

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
            callback(error, dataArray) ;
            fs.close(fd);
          });
        });   
      });
    }
    else {
      console.error("??? FILE DOES NOT EXIST ??? " + path);
    }
  });
}

function dnsReverseLookup(ip, callback) {
  if (localHostHashMap.has(ip)) {
    debug("dnsReverseLookup: DEVELOPMENT HOST: " + os.hostname() + " | " + ip);
    var domains =[];
    domains.push('threeceelabs.com');
    domains.push('threeceemedia.com');
    callback(null, domains);
  }
  else if (dnsHostHashMap.has(ip)) {
    var domains = dnsHostHashMap.get(ip) ;
    debug("dnsReverseLookup: HOST IN HASHMAP : " + os.hostname() + " | " + ip + " | " + domains);
    callback(null, domains);
  }
  else {
    dns.reverse(ip, function(err, domains){
      if (err){
        console.error('\n\n***** ERROR: DNS REVERSE IP: ' + ip + '\n' + err + '\n');
        callback(err, null);
      }
      else {
        debug('DNS REVERSE IP: ' + ip);
        dnsHostHashMap.set(ip, domains);
        domains.forEach(function(domain){
          debug("DOMAIN: " + domain);
        });
        callback(null, domains);
      }
    });
  }
}

function updateSessionViews(sessionUpdateObj){

  Word.count({}, function(err,count){
    if (!err){ 
      debug("TOTAL WORDS: " + count);
      totalWords = count ;
    } 
    else {
      console.error(chalkError("\n*** DB Word.count ERROR *** | " + getTimeStamp() + "\n" + err));
    }
  });

  console.log(chalkInfo(">>> TX SESSION_UPDATE"
    + " | " + sessionUpdateObj.sourceWord.nodeId
    + " --> " + sessionUpdateObj.targetWord.nodeId
  ));


  clientSocketIdHashMap.forEach(function(clientObj, sId) {
    if (clientObj.referer == 'SESSIONVIEW') {
      debug(">>> TX SESSION_UPDATE"
        + " | SID: " + sId 
        + " | SRC: " + sessionUpdateObj.sourceWord.nodeId
        + " | TGT: " + sessionUpdateObj.targetWord.nodeId
      );
      io.to(sId).emit("SESSION_UPDATE", sessionUpdateObj);
    }
  });
}

var simpleChain = function(chain){
  var chainArray = [];
  for (var i=0; i<chain.length; i++){
    chainArray.push(chain[i].nodeId);
  }
  return chainArray;
}

function sendPromptWord(clientObj, promptWordObj){
  var currentSession = sessionHashMap.get(clientObj.socketId);

  debug(chalkInfo("currentSession.wordChain [" + currentSession.wordChain.length + "]\n" 
    + simpleChain(currentSession.wordChain)));

  if (currentSession.wordChain.length >= 2) {
    var previousResponse = currentSession.wordChain[currentSession.wordChain.length-2];
    debug(chalkPrompt(previousResponse.nodeId + " --> " + promptWordObj.nodeId + " | " + clientObj.socketId));
  } else {
    debug(chalkPrompt("--> " + promptWordObj.nodeId + " | " + clientObj.socketId));
  }

  if (clientObj.clientConfig.mode == "NORMAL") {
    io.to(clientObj.socketId).emit("PROMPT_WORD",promptWordObj.nodeId);
  }
  else if (clientObj.clientConfig.mode == "WORD_OBJ"){
    io.to(clientObj.socketId).emit("PROMPT_WORD_OBJ",promptWordObj);
  }

  numberPromptsSent++ ;
}

function readSocketQueue(){

  var socketObj = {};

  if (!socketQueue.isEmpty()){

    socketObj = socketQueue.dequeue();

    debug("\n%%% DEQUEUE socketQueue: socketObj: " + socketObj.type 
      + " | SOCKET ID: " + socketObj.socketId 
      + " | IP: " + socketObj.ip 
      + " | REFERER: " + socketObj.referer 
      + " | CONNECTED: " + socketObj.connected
      + " | CONNECT TIME: " + socketObj.connectTime
      + " | DISCONNECT TIME: " + socketObj.disconnectTime
      + "\n"
    );

    if (typeof socketObj.socket !== 'undefined'){
      debug("... CONNECT STATE: " + socketObj.socket.connected + " | CLIENT OBJ CONN: " + socketObj.connected);
    }
    else if (socketObj.connected){
      debug("??? MISMATCH ??? DISCONNECTED STATE: CLIENT OBJ CONN: " + socketObj.connected);      
    }
    else{
      debug(chalkDisconnect("... DISCONNECT DE-Q : CLIENT OBJ CONN: " + socketObj.socketId));      
    }

    if (socketObj.connected) {

      async.waterfall(
        [
          function(callback) {
            dnsReverseLookup(socketObj.ip, function(err, domains){
              if (err){
                console.error(chalkError("\n\n***** ERROR: dnsReverseLookup: " + socketObj.ip + " ERROR: " + err));
              }
              else {
                debug("DNS REVERSE LOOKUP: " + socketObj.ip + " | DOMAINS: " + domains);
                socketObj.domain = domains[0];
              }
              callback(err, socketObj);
            });
          },

          function(socketObj, callback) {
            clientConnectDb(socketObj, function(err, cl){
              if (err){
                console.error(chalkError("\n\n***** ERROR: clientConnectDb: " + err));
                callback(err, socketObj);
              }
              else {
                debug("--- CLIENT DB UPDATED: "
                  + cl.ip
                  + " | S: " + cl.socketId 
                  + " | D: " + cl.domain
                  + " | R: " + cl.referer
                  + " | CREATED AT: " + getTimeStamp(cl.createdAt)
                  + " | LAST SEEN: " + getTimeStamp(cl.lastSeen)
                  + " | CONNECTIONS: " + cl.numberOfConnections
                );
                callback(null, cl);
              }
            });
          },

          function(socketObj, callback) {
            clientSocketIdHashMap.set(socketObj.socketId, socketObj);
            clientIpHashMap.set(socketObj.ip, socketObj);
            callback(null, socketObj);
          }
        ], 
        function(err, socketObj){
          if (err){
            clientSocketIdHashMap.remove(socketObj.socketId);
            socketObj.connected = false ;
            socketObj.disconnectTime = currentTime ;
            console.error(chalkError("\n *** CL CONNECT ERROR *** " 
              + "[" + numberClientsConnected + "] " 
              + " | " + getTimeStamp() 
              + " | S: " + socketObj.socketId 
              + " | I: " + socketObj.ip 
              + " | D: " + socketObj.domain
              + " | R: " + socketObj.referer
              + "\n" + err
            ));
          }
          else if (socketObj.referer == 'SESSION') {
            socketObj.connected = true ;
            socketObj.connectTime = currentTime ;
            socketObj.sessions = [] ;
            io.of('/admin').emit('CLIENT SESSION', JSON.stringify({connected: true, clientObj: socketObj}));

            console.log(chalkTest("CL CONNECT SESSION VIEW "
              + getTimeStamp() 
              + " | S: " + socketObj.socketId 
              + " | I: " + socketObj.ip 
              + " | D: " + socketObj.domain
              + " | R: " + socketObj.referer
            ));
          }
          else if (socketObj.referer == 'TEST') {
            socketObj.connected = true ;
            socketObj.connectTime = currentTime ;
            socketObj.sessions = [] ;
            io.of('/admin').emit('CLIENT SESSION', JSON.stringify({connected: true, clientObj: socketObj}));

            console.log(chalkTest("TEST CL CONNECT    "
              + "[" + numberTestClients + "] " 
              + getTimeStamp() 
              + " | S: " + socketObj.socketId 
              + " | I: " + socketObj.ip 
              + " | D: " + socketObj.domain
              + " | R: " + socketObj.referer
            ));
          }
          else {
            socketObj.connected = true ;
            socketObj.connectTime = currentTime ;
            socketObj.sessions = [] ;
            io.of('/admin').emit('CLIENT SESSION', JSON.stringify({connected: true, clientObj: socketObj}));

            console.log(chalkConnect("CL CONNECT    "
              + "[" + numberClientsConnected + "] " 
              + getTimeStamp() 
              + " | S: " + socketObj.socketId 
              + " | I: " + socketObj.ip 
              + " | D: " + socketObj.domain
              + " | R: " + socketObj.referer
            ));
          }
        }
      );
    }

    else {

      debug("@@@ DISCONNECT SOCKET " + socketObj.socketId + " | " + socketObj.connected);

      clientSocketIdHashMap.remove(socketObj.socketId);

      clientDisconnectDb(socketObj, function(err, cl){
        if (err){
          console.error(chalkError("\n\n***** ERROR: clientDisconnectDb: " + err));
          // clientSocketIdHashMap.remove(socketObj.socketId);
          clientIpHashMap.set(socketObj.ip, socketObj);
        }
        else {
          debug("--- CLIENT DB UPDATED: "
            + cl.ip
            + " | SOCKET ID: " + cl.socketId 
            + " | " + cl.domain
            + " | CREATED AT: " + getTimeStamp(cl.createdAt)
            + " | LAST SEEN: " + getTimeStamp(cl.lastSeen)
            + " | CONNECTIONS: " + cl.numberOfConnections
          );
          // debug(JSON.stringify(cl, null, 3));

          cl.connected = false ;
          cl.disconnectTime = currentTime ;
          cl.sessions = [] ;
          io.of('/admin').emit('CLIENT SESSION', JSON.stringify({connected: false, clientObj: cl}));

          // clientSocketIdHashMap.remove(cl.socketId);
          // clientIpHashMap.set(cl.ip, cl);

          console.log(chalkDisconnect("CL DISCONNECT " 
              + "[" + numberClientsConnected + "] " 
            + getTimeStamp() 
            + " | S: " + cl.socketId 
            + " | I: " + cl.ip 
            + " | D: " + cl.domain 
            + " | R: " + cl.referer
            ));
          }
      });
    }

  }
}

function findClientsSocket(namespace) {
  var res = new HashMap();
  var ns = io.of(namespace ||"/");    // the default namespace is "/"

  if (ns) {
    for (var id in ns.connected) {
      res.set(id, ns.connected[id]);
    }
  }
  return res;
}

// BHT
var wordTypes = [ 'noun', 'verb', 'adjective', 'adverb' ];
var wordVariations = [ 'syn', 'ant', 'rel', 'sim', ];

function addWordToDb(wordObj, callback){
  words.findOneWord(wordObj, false, function(err, word){
    if (!err) {
      debug("--- DB UPDATE | " + word.nodeId + " | MNS: " + word.mentions );
      debug(JSON.stringify(word, null, 3));

      if (!word.bhtSearched) {  // not yet bht searched
        debug("word.bhtSearched: " + word.bhtSearched);

        bhtSearchWord(word, function(err, bhtResponseObj){
          if (err){
            console.log(chalkError("bhtSearchWord ERROR: " + JSON.stringify(err)));
            callback(err, bhtResponseObj);
          }
          else if (bhtResponseObj.bhtFound){
            console.log(chalkBht("--- BHT HIT   | " + bhtResponseObj.nodeId));
            wordHashMap.set(bhtResponseObj.nodeId, bhtResponseObj);
            callback(null, bhtResponseObj);
          }
          else {
            console.log(chalkBht("--- BHT HIT   | " + bhtResponseObj.nodeId));
            wordHashMap.set(bhtResponseObj.nodeId, bhtResponseObj);
            callback(null, bhtResponseObj);
          }
        });
      }

      else { // already bht searched
        console.log(chalkLog("--- PREV BHT [" + numberBhtRequests + "] " + word.nodeId));
        wordHashMap.set(word.nodeId, word);
        callback(null, word);
      }
    }
  });
}

function loadBhtResponseHash(bhtResponseObj, callback){

  var bhtWordHashMap = new HashMap();

  wordTypes.forEach(function(wordType){
    debug("wordType: " + wordType);
    if ((typeof  bhtResponseObj[wordType] !== 'undefined')
        && (bhtResponseObj[wordType] != null)){
      debug("FOUND wordType: " + wordType);
      wordVariations.forEach(function(wordVariation){
        debug("wordVariation: " + wordVariation);
        if ((typeof bhtResponseObj[wordType][wordVariation] !== 'undefined') 
          && (bhtResponseObj[wordType][wordVariation] != null)){
          debug("FOUND wordVariation: " + wordVariation);
          var wordArry = bhtResponseObj[wordType][wordVariation] ;
          wordArry.forEach(function(word){
            bhtWordHashMap.set(word, bhtResponseObj.nodeId);
            debug(bhtResponseObj.nodeId 
              + " | " + wordType
              + " | " + wordVariation
              + " | " + word
            );
          })
        }
      })
    }
  });
  callback(bhtWordHashMap);
}

function generateResponse(wordObj, callback){

  bhtSearchWord(wordObj, function(err, bhtResponseObj){
    if (err){
      console.log(chalkError("bhtSearchWord ERROR: " + JSON.stringify(err)));
      callback(bhtResponseObj);
    }
    else if (!bhtResponseObj.bhtFound){
      console.log(chalkError("BHT MISS: " + bhtResponseObj.nodeId));
      callback(bhtResponseObj);
    }
    else {
      loadBhtResponseHash(bhtResponseObj, function(bhtWordHashMap){

        var bhtWordHashMapKeys = bhtWordHashMap.keys();
        var randomIndex = randomInt(0, bhtWordHashMapKeys.length);
        var responseWord = bhtWordHashMapKeys[randomIndex].toLowerCase();

        console.log(  "--- GEN RSPNS | " + bhtResponseObj.nodeId + " --> " + responseWord);

        if (wordHashMap.has(responseWord)){

          console.log("--- HASH HIT  | " + responseWord);

          responseWordObj = wordHashMap.get(responseWord);
          responseWordObj.lastSeen = dateNow;

          words.findOneWord(responseWordObj, false, function(err, word){
            if (!err) {
              console.log("--- DB UPDATE | " + word.nodeId + " | MNS: " + word.mentions );
              debug(JSON.stringify(word, null, 3));

              if (!word.bhtSearched) {  // not yet bht searched
                debug("word.bhtSearched: " + word.bhtSearched);

                bhtSearchWord(word, function(err, bhtResponseObj){
                  if (err){
                    console.log(chalkError("bhtSearchWord ERROR: " + JSON.stringify(err)));
                    callback(bhtResponseObj);
                  }
                  else if (bhtResponseObj.bhtFound){
                    console.log(chalkBht("--- BHT HIT   | " + bhtResponseObj.nodeId));
                    wordHashMap.set(bhtResponseObj.nodeId, bhtResponseObj);
                    callback(bhtResponseObj);
                  }
                  else {
                    console.log(chalkBht("--- BHT MISS  | " + bhtResponseObj.nodeId));
                    wordHashMap.set(bhtResponseObj.nodeId, bhtResponseObj);
                    callback(bhtResponseObj);
                  }
                });
              }

              else { // already bht searched
                wordHashMap.set(word.nodeId, word);
                callback(bhtResponseObj);
              }
            }
          });
        }
        else {

          console.log("--- HASH MISS | " + responseWord);
          var dateNow = Date.now();

          var responseWordObj = new Word ({
            nodeId: responseWord,
            lastSeen: dateNow
          });

          words.findOneWord(responseWordObj, false, function(err, word){
            if (!err) {
              console.log("--- DB UPDATE | " + word.nodeId 
                + " | MNS: " + word.mentions
              );
              debug(JSON.stringify(word, null, 3));

              if (!word.bhtSearched) {  // not yet bht searched
                debug("word.bhtSearched: " + word.bhtSearched);

                bhtSearchWord(word, function(err, bhtResponseObj){
                  if (err){
                    console.log(chalkError("bhtSearchWord ERROR: " + JSON.stringify(err)));
                  }
                  else if (bhtResponseObj.bhtFound){
                    console.log(chalkBht("--- BHT HIT   | " + bhtResponseObj.nodeId));
                    wordHashMap.set(bhtResponseObj.nodeId, bhtResponseObj);
                    callback(bhtResponseObj);
                  }
                  else {
                    console.log(chalkBht("--- BHT MISS  | " + bhtResponseObj.nodeId));
                    wordHashMap.set(bhtResponseObj.nodeId, bhtResponseObj);
                    callback(bhtResponseObj);
                  }
                });
              }

              else {
                wordHashMap.set(word.nodeId, word);
                callback(bhtResponseObj);
              }
            }
          });
        }
      });
    }
  });
}

function bhtSearchWord (wordObj, callback){


  if (bhtOverLimitTime && moment().isBefore(bhtLimitResetTime)) {

    bhtTimeToReset = moment.utc(bhtLimitResetTime);
    bhtTimeToReset.subtract(moment.utc());

    console.log(chalkError("bhtSearchWord: *** OVER LIMIT ***"
      + " | " + bhtOverLimitTime.format("YYYY-MM-DD HH:mm:ss ZZ")
      + " | RESETS: " + bhtLimitResetTime.format("YYYY-MM-DD HH:mm:ss ZZ")
      + " | T MINUS: " + bhtTimeToReset.format("HH:mm:ss")
      + " | " + numberBhtRequests + " REQUESTS" 
    ));
    
    callback({error: 500, timeStamp: bhtOverLimitTime}, wordObj);
    return ;
  }
  else {
    bhtOverLimitTime = 0 ;
  }

  if (wordObj.bhtFound) {
    callback(null, wordObj);
    return ;
  }

  numberBhtRequests++ ;

  var bhtHost = "words.bighugelabs.com";
  var path = "/api/2/" + bigHugeLabsApiKey + "/" + encodeURI(wordObj.nodeId) + "/json";

  http.get({host: bhtHost, path: path}, function(response) {

    debug("bhtSearchWord: " + bhtHost + "/" + path);
    
    var body = '';

    if (response.statusCode == 404) {
      debug("bhtSearchWord: \'" + wordObj.nodeId + "\' NOT FOUND");
      wordObj.bhtSearched = true ;
      wordObj.bhtFound = false ;
      words.findOneWord(wordObj, true, function(err, wordUpdatedObj){
        debug(chalkBht("bhtSearchWord: --- DB UPDATE | " + wordUpdatedObj.nodeId 
          + " | MNS: " + wordUpdatedObj.mentions
        ));
        debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
        callback(null, wordUpdatedObj);
        return ;
      });
    }
    else if (response.statusCode == 500) {
      console.log(chalkError("bhtSearchWord: *** OVER LIMIT *** | " + numberBhtRequests + " REQUESTS"));

      bhtOverLimitTime = moment.utc();
      bhtOverLimitTime.utcOffset("-08:00");

      bhtLimitResetTime = moment.utc();
      bhtLimitResetTime.utcOffset("-08:00");
      bhtLimitResetTime.endOf("day");

      bhtTimeToReset = moment.utc(bhtLimitResetTime);
      bhtTimeToReset.subtract(bhtOverLimitTime);

      numberBhtRequests = 0 ;

      callback({error: 500, timeStamp: bhtOverLimitTime}, wordObj);
      return ;
    }
    else {
      response.on('data', function(d) {
        body += d;
      });

      response.on('end', function() {
      
        if (body != ''){
          var parsed = JSON.parse(body);
          debug("bhtSearchWord: " + JSON.stringify(parsed, null, 3));
          if (typeof parsed.noun !== null) wordObj.noun = parsed.noun ;
          if (typeof parsed.verb !== null) wordObj.verb = parsed.verb ;
          if (typeof parsed.adjective !== null) wordObj.adjective = parsed.adjective ;
          if (typeof parsed.adverb !== null) wordObj.adverb = parsed.adverb ;
          wordObj.bhtSearched = true ;
          wordObj.bhtFound = true ;
        }
        else {
          debug("bhtSearchWord: \'" + wordObj.nodeId + "\' NOT FOUND");
          wordObj.bhtSearched = true ;
          wordObj.bhtFound = false ;
        }

        words.findOneWord(wordObj, true, function(err, wordUpdatedObj){
          debug(chalkBht("bhtSearchWord: --- DB UPDATE | " 
            + wordUpdatedObj.nodeId 
            + " | MNS: " + wordUpdatedObj.mentions
          ));
          debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
          callback(null, wordUpdatedObj);
          return;
        });
      });

      response.on('error', function(e) {
        console.log(chalkError("bhtSearchWord ERROR " + JSON.stringify(e, null, 3)));
        callback(e, wordObj);
      });
    }
  });
}

function createClientSocket (socket){

  var clientsHashMap = findClientsSocket('/');
  var referer = 'CLIENT';

  debug("\nSOCKET NAMESPACE\n" + util.inspect(socket.nsp, {showHidden: false, depth: 1}));

  // ????? KLUDGE: cannot get socket.io namespaces to work, so this is a hack
  // to distinguish connections based on the referring page
  
  if (socket.nsp.name.indexOf('admin') >= 0) {
    referer = 'ADMIN';
    debug("@@@ ADMIN CONNECTED: " + getTimeStamp() 
      + " | " + socket.id 
      + " | NAMESPACE: " + socket.nsp.name
      ); 
      return 1;   
  }
  else if (socket.nsp.name.indexOf('test') >= 0) {
    referer = 'TEST';
    debug("@@@ TEST CLIENT CONNECTED: " + getTimeStamp() 
      + " | " + socket.id 
      + " | NAMESPACE: " + socket.nsp.name
      ); 
  }
  else if (socket.nsp.name.indexOf('stats') >= 0) {
    referer = 'CLIENT';
    debug("@@@ CLIENT CONNECTED: " + getTimeStamp() 
      + " | " + socket.id 
      + " | NAMESPACE: " + socket.nsp.name
      ); 
  }
  else if (typeof socket.handshake.headers.referer !== 'undefined'){
    if (socket.handshake.headers.referer.indexOf('admin') >= 0) {
      referer = 'ADMIN';
      debug("@@@ ADMIN CONNECTED: " + getTimeStamp() 
        + " | " + socket.id 
        + " | REFERER: " + socket.handshake.headers.referer
        );
      // not a client connection. quit
      return 1;   
    }
    else if (socket.handshake.headers.referer.indexOf('session') >= 0) {
      referer = 'SESSIONVIEW';
      console.log("@@@ SESSION VIEW CLIENT CONNECTED: " + getTimeStamp() 
        + " | " + socket.id 
        + " | REFERER: " + socket.handshake.headers.referer
        ); 
    }
    else if (socket.handshake.headers.referer.indexOf('test') >= 0) {
      referer = 'TEST';
      debug("@@@ TEST CLIENT CONNECTED: " + getTimeStamp() 
        + " | " + socket.id 
        + " | REFERER: " + socket.handshake.headers.referer
        ); 
    }
    else {
      console.log("@@@ CONNECT: " + getTimeStamp() 
        + " | " + socket.id 
        + " | REFERER: " + socket.handshake.headers.referer
        + " | NAMESPACE: " + socket.nsp.name
      ); 
    }
  }
  else {
    referer = 'CLIENT';
    debug(">>> CLIENT CONNECTED: " + getTimeStamp() 
      + " | " + socket.id 
      + " | REFERER: " + 'CLIENT'
      ); 
  }

  numberClientsConnected = io.of('/').sockets.length;

  var socketId = socket.id;
  var clientIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;

  // check for IPV6 address
  if (clientIp.indexOf(':') >= 0){
    var ipParts = clientIp.split(':');
    var clientIp4 = ipParts.pop();

    if (clientIp4 == '1'){
      clientIp4 = '127.0.0.1';
    }

    console.log("CONVERTING IPV6 IP " + clientIp + " TO IPV4: " + clientIp4);
    clientIp = clientIp4 ;
  }

  var clientHostname = socket.handshake.headers.host ;
  var clientDomain ;

  var clientObj = {
    type: 'CLIENT',  
    ip: clientIp, 
    domain: clientDomain,
    socketId: socketId,
    socket: socket,
    referer: referer,
    connected: true, 
    connectTime: currentTime, 
    // disconnectTime: currentTime
  };

  // adding also after enqueue; adding early to so add will show up earlier
  clientSocketIdHashMap.set(socketId, clientObj);  

  if (referer == 'SESSIONVIEW') {
  }
  else {

    var sessionObj = {
      sessionId: socketId,
      userId: clientIp + "_" + socketId,
      createAt: Date.now(),
      wordChain: []
    }
    sessionHashMap.set(sessionObj.sessionId, sessionObj);  
    console.log("CREATED sessionObj | " + sessionObj.sessionId 
    );
  }

  socketQueue.enqueue(clientObj);

  readSocketQueue();

  socket.on("error", function(err){
    console.error(chalkError(getTimeStamp() + " | *** SOCKET ERROR: " + err));
    // console.error(chalkError("\nSOCKET ERROR" + util.inspect(socket, {showHidden: false, depth: 1})));
  });

  socket.on("disconnect", function(){

    var socketId = socket.id ;

    debug(chalkDisconnect("\nDISCONNECTED SOCKET " + util.inspect(socket, {showHidden: false, depth: 1})));

    if (clientSocketIdHashMap.has(socketId)) {

      var clientObj = clientSocketIdHashMap.get(socketId);

      clientObj.type = 'CLIENT';
      clientObj.connected = false;
      clientObj.disconnectTime = currentTime;

      debug("--- DISCONNECT: FOUND SOCKET IN HASH: " + clientObj.ip + " " + clientObj.socketId);
      debug("clientSocketIdHashMap count: " + clientSocketIdHashMap.count());

      socketQueue.enqueue(clientObj);
      readSocketQueue();
      clientSocketIdHashMap.remove(socketId);
    }
    else {
      clientSocketIdHashMap.remove(socketId);
      debug("??? SOCKET NOT FOUND IN HASH ... " + socketId);      
      debug("clientSocketIdHashMap count: " + clientSocketIdHashMap.count());
    }

    readSocketQueue();
  });

  socket.on("CLIENT_READY", function(clientConfig){

    var clientObj = clientSocketIdHashMap.get(socket.id);
    clientObj.config = clientConfig ;

    console.log(">>> CLIENT READY | CONFIG TYPE: " + clientObj.config.type + " | " + socket.id);

    if (clientConfig) {
      debug("CLIENT CONFIG\n" + JSON.stringify(clientConfig, null, 3));
      clientObj.clientConfig = clientConfig ;
      clientSocketIdHashMap.set(socket.id, clientObj);
    }

    words.getRandomWord(function(err, randomWord){
      if (!err) {

        debug("randomWord\n" + JSON.stringify(randomWord, null, 3));

        wordHashMap.set(randomWord.nodeId, randomWord);

        var currentSession = sessionHashMap.get(socket.id);

        currentSession.wordChain.push(randomWord) ;

        sendPromptWord(clientObj, randomWord);

        var sessionUpdateObj = {
          sessionId: socketId,
          sourceWord: randomWord,
          targetWord: randomWord
        };

        updateSessionViews(sessionUpdateObj);

      }
    });
  })


  socket.on("RESPONSE_WORD_OBJ", function(rwObj){

    numberResponsesReceived++;

    var dateNow = Date.now();
    var socketId = socket.id;
    var clientObj = clientSocketIdHashMap.get(socket.id);

    var currentSession = sessionHashMap.get(socketId);
    var promptWord ;
    var previousPrompt = currentSession.wordChain[currentSession.wordChain.length-1] ;

    console.log(chalkResponse(rwObj.nodeId + " <-- " + previousPrompt.nodeId + " | " + socketId));

    var responseWordObj;

    if (wordHashMap.has(rwObj.nodeId)){

      console.log("--- HASH HIT  | " + rwObj.nodeId);

      responseWordObj = wordHashMap.get(rwObj.nodeId);
      responseWordObj.lastSeen = dateNow;

      wordHashMap.set(responseWordObj.nodeId, responseWordObj);
      currentSession.wordChain.push(responseWordObj) ;

      var sessionUpdateObj = {
        sessionId: socketId,
        sourceWord: currentSession.wordChain[currentSession.wordChain.length-2],
        targetWord: currentSession.wordChain[currentSession.wordChain.length-1]
      };

      updateSessionViews(sessionUpdateObj);

      generateResponse(responseWordObj, function(promptWordObj){

        if (!promptWordObj.bhtFound){
          words.getRandomWord(function(err, randomWordObj){
            if (!err) {
              console.log(chalkResponse(socketId + " | " + responseWordObj.nodeId + " --> " + randomWordObj.nodeId));

              wordHashMap.set(randomWordObj.nodeId, randomWordObj);
              currentSession.wordChain.push(randomWordObj) ;

              // sendPromptWord(socket.id, randomWordObj.nodeId);
              sendPromptWord(clientObj, randomWord);

              var sessionUpdateObj = {
                sessionId: socketId,
                sourceWord: currentSession.wordChain[currentSession.wordChain.length-2],
                targetWord: currentSession.wordChain[currentSession.wordChain.length-1]
              };

              updateSessionViews(sessionUpdateObj);
            }
          });
        }
        else {
          console.log(chalkResponse(socketId + " | " + responseWordObj.nodeId + " --> " + promptWordObj.nodeId));

          wordHashMap.set(promptWordObj.nodeId, promptWordObj);
          currentSession.wordChain.push(promptWordObj) ;

          // sendPromptWord(socket.id, promptWordObj.nodeId);
          sendPromptWord(clientObj, promptWordObj);

          var sessionUpdateObj = {
            sessionId: socketId,
            sourceWord: currentSession.wordChain[currentSession.wordChain.length-2],
            targetWord: currentSession.wordChain[currentSession.wordChain.length-1]
          };

          updateSessionViews(sessionUpdateObj);
        }

      });
    }
    else {

      console.log("--- HASH MISS | " + rwObj.nodeId);

      responseWordObj = rwObj ;

      addWordToDb(rwObj, function(err, wordDbObj){
        if (!err) {
          console.log("->- DB UPDATE | " + wordDbObj.nodeId 
            + " | MNS: " + wordDbObj.mentions
            );
          currentSession.wordChain.push(wordDbObj) ;

          var sessionUpdateObj = {
            sessionId: socketId,
            sourceWord: currentSession.wordChain[currentSession.wordChain.length-2],
            targetWord: currentSession.wordChain[currentSession.wordChain.length-1]
          };

          updateSessionViews(sessionUpdateObj);
        }
        else {
          console.error("addWordToDb: *** ERROR ***\n" + err);
        }
      })

      // wordHashMap.set(rwObj.nodeId, rwObj);
      // currentSession.wordChain.push(rwObj) ;

      // var sessionUpdateObj = {
      //   sessionId: socketId,
      //   sourceWord: currentSession.wordChain[currentSession.wordChain.length-2],
      //   targetWord: currentSession.wordChain[currentSession.wordChain.length-1]
      // };

      // updateSessionViews(sessionUpdateObj);

      generateResponse(responseWordObj, function(promptWordObj){

        if (!promptWordObj.bhtFound){
          words.getRandomWord(function(err, randomWordObj){
            if (!err) {
              console.log(chalkResponse(socketId + " | " + responseWordObj.nodeId + " --> " + randomWordObj.nodeId));

              wordHashMap.set(randomWordObj.nodeId, randomWordObj);
              currentSession.wordChain.push(randomWordObj) ;

              // sendPromptWord(socket.id, randomWordObj.nodeId);
              sendPromptWord(clientObj, randomWordObj);

              var sessionUpdateObj = {
                sessionId: socketId,
                sourceWord: currentSession.wordChain[currentSession.wordChain.length-2],
                targetWord: currentSession.wordChain[currentSession.wordChain.length-1]
              };

              updateSessionViews(sessionUpdateObj);
            }
          });
        }
        else {
          console.log(chalkResponse(socketId + " | " + responseWordObj.nodeId + " --> " + promptWordObj.nodeId));

          wordHashMap.set(promptWordObj.nodeId, promptWordObj);
          currentSession.wordChain.push(promptWordObj) ;

          // sendPromptWord(socket.id, promptWordObj.nodeId);
          sendPromptWord(clientObj, promptWordObj);

          var sessionUpdateObj = {
            sessionId: socketId,
            sourceWord: currentSession.wordChain[currentSession.wordChain.length-2],
            targetWord: currentSession.wordChain[currentSession.wordChain.length-1]
          };

          updateSessionViews(sessionUpdateObj);
        }
      });
    }

  });
}

function adminConnectDb (adminObj, callback) {

  debug("adminConnectDb: adminObj: " + JSON.stringify(adminObj, null, 3));

  var query = { ip: adminObj.ip };
  var update = { 
          $inc: { "numberOfConnections": 1 }, 
          $set: { 
            "socketId": adminObj.socketId,
            "connectTime": currentTime,
            "disconnectTime": currentTime,
            "domain": adminObj.domain, 
            "lastSeen": currentTime 
          },
          $push: { "sessions": { 
                      "socketId": adminObj.socketId,
                      "connectedAt": currentTime
                    }
                  } 
          };
  var options = { upsert: true, new: true };

  Admin.findOneAndUpdate(
    query,
    update,
    options,
    function(err, ad) {
      if (err) {
        console.error("!!! ADMIN FINDONE ERROR: " 
          + getTimeStamp()
          + " | " + adminObj.ip 
          + "\n" + err);
        getErrorMessage(err);
        callback(err, adminObj);
      }
      else {
        debug(">>> ADMIN CONNECT UPDATED " 
          + " | " + ad.ip
          + " | DOMAIN: " + ad.domain 
          + " | SOCKET ID: " + ad.socketId 
          // + " | CONNECTED: " + ad.connected 
          + " | CONNECTIONS: " + ad.numberOfConnections 
          + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
          );
        callback(null, ad);
      }
    }
  );
}

function clientConnectDb (clientObj, callback) {

  // debug("clientConnectDb: clientObj: " + JSON.stringify(clientObj, null, 3));
  // debug("clientConnectDb: clientObj: " + util.inspect(clientObj, {showHidden: false, depth: 1}));
    if (typeof clientObj.socket !== 'undefined'){
      debug("clientConnectDb CONNECT STATE: " + clientObj.socket.connected + " | CLIENT OBJ CONN: " + clientObj.connected);
    }
    else{
      debug("??? DISCONNECTED STATE: CLIENT OBJ CONN: " + clientObj.connected);      
    }

  var query = { ip: clientObj.ip };
  var update = { 
          $inc: { "numberOfConnections": 1 }, 
          $set: { 
            "socketId": clientObj.socketId,
            "referer": clientObj.referer,
            "connectTime": currentTime,
            "disconnectTime": currentTime,
            "domain": clientObj.domain, 
            "lastSeen": currentTime 
          },
          $push: { "sessions": { 
                      "socketId": clientObj.socketId,
                      "connectedAt": currentTime
                    }
                  } 
          };
  var options = { upsert: true, new: true };

  Client.findOneAndUpdate(
    query,
    update,
    options,
    function(err, cl) {
      if (err) {
        console.error("!!! CLIENT FINDONE ERROR: " 
          + getTimeStamp()
          + " | " + clientObj.ip 
          + "\n" + err);
        getErrorMessage(err);
        callback(err, clientObj);
      }
      else {
        debug(">>> CLIENT UPDATED" 
          + " | I: " + cl.ip
          + " | D: " + cl.domain 
          + " | S: " + cl.socketId 
          + " | R: " + cl.referer 
          + " | CONS: " + cl.numberOfConnections 
          + " | LAST: " + getTimeStamp(cl.lastSeen)
          );
        callback(null, cl);
      }
    }
  );
}

function adminDisconnectDb (adminObj, callback) {

  debug("adminDisconnectDb: admin: " + JSON.stringify(adminObj, null, 3));

  var query = { ip: adminObj.ip };
  var update = { 
          $set: { 
            "domain": adminObj.domain, 
            "lastSeen": currentTime,
            "socketId" : adminObj.socketId, 
            "disconnectTime": currentTime
           }
          // $push: { "sessions": { 
          //             "socketId": adminObj.socketId,
          //             "disconnectedAt": currentTime
          //           }
          //         } 
          };
  var options = { upsert: true, new: true };

  Admin.findOneAndUpdate(
    query,
    update,
    options,
    function(err, ad) {
      if (err) {
        console.error("!!! ADMIN FINDONE ERROR: " 
          + getTimeStamp()
          + " | " + adminObj.ip 
          + "\n" + err);
        getErrorMessage(err);
        callback(err, adminObj);
      }
      else {
        debug(">>> ADMIN DISCONNECT UPDATED " 
          + " | " + ad.ip
          + " | DOMAIN: " + ad.domain 
          + " | SOCKET ID: " + ad.socketId 
          // + " | CONNECTED: " + ad.connected 
          + " | DISCONNECT TIME: " + ad.disconnectTime 
          + " | CONNECTIONS: " + ad.numberOfConnections 
          + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
          );
        callback(null, ad);
      }

    }
  );
}

function clientDisconnectDb (clientObj, callback) {

  debug("clientDisconnectDb: clientObj: " + clientObj.socketId + " | " + clientObj.ip);

  var query = { ip: clientObj.ip };
  var update = { 
          $set: { 
            "referer": clientObj.referer, 
            "domain": clientObj.domain, 
            "lastSeen": currentTime,
            "socketId" : clientObj.socketId, 
            "disconnectTime": currentTime
           },
          };
  var options = { upsert: true, new: true };

  Client.findOneAndUpdate(
    query,
    update,
    options,
    function(err, cl) {
      if (err) {
        console.error("!!! CLIENT FINDONE ERROR: " 
          + getTimeStamp()
          + " | " + clientObj.ip 
          + "\n" + err);
        getErrorMessage(err);
        callback(err, clientObj);
      }
      else {
        debug(">>> CLIENT DISCONNECT UPDATED" 
          + " | IP: " + cl.ip
          + " | DOMAIN: " + cl.domain 
          + " | REFERER: " + cl.referer 
          + " | SOCKET ID: " + cl.socketId 
          + " | DISCONNECT TIME: " + cl.disconnectTime 
          + " | CONNECTIONS: " + cl.numberOfConnections 
          + " | LAST SEEN: " + getTimeStamp(cl.lastSeen)
          );
        callback(null, cl);
      }

    }
  );
}

function adminFindAllDb (options, callback) {

  debug("\n=============================\nADMINS IN DB\nOPTIONS");
  debug(options);

  var query = {};
  var projections = {
    ip: true,
    domain: true,
    socketId: true,
    lastSeen: true,
    // connected: true,
    connectTime: true,
    disconnectTime: true,
    numberOfConnections: true
  };

  Admin.find(query, projections, function(err, admins) {

    admins.forEach(function(admin) {
        debug("IP: " + admin.ip 
        + " | SOCKET: " + admin.socketId
        + " | DOMAIN: " + admin.domain
        + " | LAST SEEN: " + admin.lastSeen
        // + " | CONNECTED: " + admin.connected
        + " | CONNECT TIME: " + admin.connectTime
        + " | DISCONNECT TIME: " + admin.disconnectTime
        + " | NUM SESSIONS: " + admin.numberOfConnections
        );
      adminIpHashMap.set(admin.ip, admin);
      adminSocketIdHashMap.set(admin.socketId, admin);
    });

    debug(adminIpHashMap.count() + " KNOWN ADMINS");
    callback(adminIpHashMap.count());
  });
}

function clientFindAllDb (options, callback) {

  debug("\n=============================\nCLIENTS IN DB\nOPTIONS");
  debug(options);

  var query = {};
  var projections = {
    ip: true,
    domain: true,
    socketId: true,
    lastSeen: true,
    referer: true,
    connectTime: true,
    disconnectTime: true,
    numberOfConnections: true
  };

  Client.find(query, projections, options, function(err, clients) {

    clients.forEach(function(client) {
        debug("IP: " + client.ip 
        + " | SOCKET: " + client.socketId
        + " | DOMAIN: " + client.domain
        + " | REFERER: " + client.referer
        + " | LAST SEEN: " + client.lastSeen
        + " | CONNECT TIME: " + client.connectTime
        + " | DISCONNECT TIME: " + client.disconnectTime
        + " | NUM SESSIONS: " + client.numberOfConnections
        );
      clientIpHashMap.set(client.ip, client);
    });
    debug(clientIpHashMap.count() + " KNOWN CLIENTS");
    callback(clientIpHashMap.count());
  });
}

var getErrorMessage = function(err) {
  var message = '';
  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
      console.error("... DB ERROR ..." 
        + " | " + getTimeStamp() 
        + "\n" +  JSON.stringify(err));
        break;
      default:
        message = 'Something went wrong';
    }
  }
  else {
    for (var errName in err.errors) {
      if (err.errors[errName].message)
        message = err.errors[errName].message;
    }
  }

  return message;
};

function dumpIoStats(){
  debug("\n-------------\nIO\n-------------"
    + "\nIO SOCKETS NAME: " + io.sockets.name
    + "\nSERVER:          " + util.inspect(io.sockets.server, {showHidden: false, depth: 2})
    + "\nCONNECTED:       " + util.inspect(io.sockets.connected, {showHidden: false, depth: 2})
    + "\nFNS:             " + io.sockets.fns
    + "\nIDS:             " + io.sockets.ids
    + "\nACKS:            " + util.inspect(io.sockets.acks, {showHidden: false, depth: 2})
    + "\n----------------------------");
}

function initializeConfiguration() {

  console.log(chalkInfo(getTimeStamp() + " | initializeConfiguration ..."));

  async.series([

    // DATABASE INIT
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | START DATABASE INIT"));

      async.parallel(
        [
          // CLIENT IP INIT
          function(callbackParallel) {
            console.log(chalkInfo(getTimeStamp() + " | CLIENT IP INIT"));
            clientFindAllDb(null, function(numberOfClientIps){
              console.log(chalkInfo(getTimeStamp() + " | CLIENT UNIQUE IP ADDRESSES: " + numberOfClientIps));
              callbackParallel();
            });
          },
          // ADMIN IP INIT
          function(callbackParallel) {
            console.log(chalkInfo(getTimeStamp() + " | ADMIN IP INIT"));
            adminFindAllDb(null, function(numberOfAdminIps){
              console.log(chalkInfo(getTimeStamp() + " | ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps));
              callbackParallel();
            });
          }
        ],
        function(err){
          if (err) {
            console.error(chalkError("\n" + getTimeStamp() + "!!! DATABASE INIT ERROR: " + err));
            callbackSeries(err);
            // return;
          }
          else {
            console.log(chalkInfo(getTimeStamp() + " | DATABASE INIT COMPLETE"));
            configEvents.emit('DATABASE_INIT_COMPLETE', getTimeStamp());
            callbackSeries();
          }
        }
      );
    },

    // APP ROUTING INIT
    function(callbackSeries){
      debug(chalkInfo(getTimeStamp() + " | APP ROUTING INIT"));
      initAppRouting();
      callbackSeries();
    },

    // SOCKET INIT
    // function(callbackSeries){
    //   console.log(chalkInfo(getTimeStamp() + " | SOCKET INIT"));
    //   client.connect(80, 'www.google.com', function() {
    //     console.log('CONNECTED TO GOOGLE: OK');
    //   });

    //   client.on('data', function(data) {
    //     console.log('RX GOOGLE CONNECTION: ' + data);
    //     // client.destroy(); // kill client after server's response
    //   });

    //   client.on('close', function() {
    //     console.log('GOOGLE CONNECTION CLOSED');
    //   });
    //   callbackSeries();
    // },

    // CONFIG EVENT
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | INIT CONFIG COMPLETE"));
      serverSessionConfig = { 
        testMode: testMode
      };
      debug("SESSION CONFIGURATION\n" + JSON.stringify(serverSessionConfig, null, 3) + "\n");
      callbackSeries();
    },

    // SERVER READY
    function(callbackSeries){

      console.log("... CHECKING INTERNET CONNECTION ...");

      client.connect(80, 'www.google.com', function() {
        console.log(chalkInfo(getTimeStamp() + ' | CONNECTED TO GOOGLE: OK'));
        console.log(chalkInfo(getTimeStamp() + " | SEND SERVER_READY"));
        internetReady = true ;
        configEvents.emit("SERVER_READY");
        client.destroy();
        callbackSeries();
      });

    }
  ]);
}

// ==================================================================
// ADMIN
// ==================================================================

var adminIpHashMap = new HashMap();
var adminSocketIdHashMap = new HashMap();

var numberAdminsTotal = 0;
var numberAdminsConnected = 0;

var clientIpHashMap = new HashMap();
var clientSocketIdHashMap = new HashMap();

var numberClientsConnected = 0;
var numberTestClients = 0;


var dnsHostHashMap = new HashMap();
var localHostHashMap = new HashMap();
localHostHashMap.set('::ffff:127.0.0.1', 1);
localHostHashMap.set('127.0.0.1', 1);
localHostHashMap.set('::1', 1);
localHostHashMap.set('::1', 1);

localHostHashMap.set('macpro.local', 1);
localHostHashMap.set('macpro2.local', 1);
localHostHashMap.set('mbp.local', 1);
localHostHashMap.set('mbp2.local', 1);
localHostHashMap.set('macminiserver0.local', 1);
localHostHashMap.set('macminiserver1.local', 1);
localHostHashMap.set('macminiserver2.local', 1);
localHostHashMap.set('mms0.local', 1);
localHostHashMap.set('mms1.local', 1);
localHostHashMap.set('mms2.local', 1);

localHostHashMap.set('::ffff:10.0.1.4', 1);
localHostHashMap.set('::ffff:10.0.1.10', 1);
localHostHashMap.set('::ffff:10.0.1.27', 1);
localHostHashMap.set('::ffff:10.0.1.45', 1);
localHostHashMap.set('10.0.1.4', 1);
localHostHashMap.set('10.0.1.10', 1);
localHostHashMap.set('10.0.1.27', 1);

configEvents.on('newListener', function(data){
  console.log("*** NEW CONFIG EVENT LISTENER: " + data);
})

// ==================================================================
// CONNECT TO INTERNET, START SERVER HEARTBEAT
// ==================================================================
configEvents.on("SERVER_READY", function () {

  serverReady = true ;

  console.log(chalkInfo(getTimeStamp() + " | SERVER_READY EVENT"));

  httpServer.on("reconnect", function(){
    internetReady = true ;
    console.log(chalkConnect(getTimeStamp() + ' | PORT RECONNECT: ' + config.port));
    initializeConfiguration();
  });

  httpServer.on("connect", function(){
    internetReady = true ;
    console.log(chalkConnect(getTimeStamp() + ' | PORT CONNECT: ' + config.port));

    httpServer.on("disconnect", function(){
      internetReady = false ;
      console.error(chalkError('\n***** PORT DISCONNECTED | ' + getTimeStamp() + ' | ' + config.port));
    });
  });

  httpServer.listen(config.port, function(){
    console.log(chalkInfo(getTimeStamp() + " | LISTENING ON PORT " + config.port));
  });

  httpServer.on("error", function (err) {
    internetReady = false ;
    console.error(chalkError('??? HTTP ERROR | ' + getTimeStamp() + '\n' + err));
    if (err.code == 'EADDRINUSE') {
      console.error(chalkError('??? HTTP ADDRESS IN USE: ' + config.port + ' ... RETRYING...'));
      setTimeout(function () {
        httpServer.listen(config.port, function(){
          console.log('LISTENING ON PORT ' + config.port);
        });
      }, 5000);
    }
  });


  //----------------------
  //  SERVER HEARTBEAT
  //----------------------

  var tempDateTime = new Date();
  var txHeartbeat = { };

  var maxNumberClientsConnected = 0;
  var maxNumberClientsConnectedTime = currentTime;

  var serverHeartbeatInterval = setInterval(function () {

    numberAdminsConnected = io.of('/admin').sockets.length;
    numberClientsConnected = io.of('/').sockets.length - io.of('/admin').sockets.length;

    if (numberClientsConnected > maxNumberClientsConnected) {
      maxNumberClientsConnected = numberClientsConnected;
      maxNumberClientsConnectedTime = currentTime;
      console.log(chalkAlert(getTimeStamp() + " | NEW MAX CLIENTS CONNECTED: " + maxNumberClientsConnected));
    }

    numberTestClients = 0;

    clientSocketIdHashMap.forEach(function(clientObj, ip) {
      if ((clientObj.referer == 'TEST') || (clientObj.config.type == 'TEST')) {
        numberTestClients++;
      }
    });

    runTime =  getTimeNow() - startTime ;

    //
    // SERVER HEARTBEAT
    //

    if (internetReady){

      txHeartbeat = { 
        serverHostName : os.hostname(), 
        timeStamp : getTimeNow(), 
        startTime : startTime, 
        upTime : os.uptime() * 1000, 
        runTime : runTime, 

        numberAdmins : numberAdminsConnected,
        numberClients : numberClientsConnected,
        maxNumberClients : maxNumberClientsConnected,
        maxNumberClientsTime : maxNumberClientsConnectedTime,

        totalWords : totalWords,
        numberBhtRequests : numberBhtRequests,

        totalSessions : totalSessions,
        totalUsers : totalUsers,

        numberPromptsSent : numberPromptsSent,
        numberResponsesReceived : numberResponsesReceived,

        numberTestClients : numberTestClients
      } ;

      io.emit('HEARTBEAT', txHeartbeat);
      io.of('/admin').emit('HEARTBEAT', txHeartbeat);
      io.of('/test').emit('HEARTBEAT', txHeartbeat);
    }
    else {
      tempDateTime = new Date() ;
      if (tempDateTime.getSeconds()%10 == 0){
        console.error(chalkError("!!!! INTERNET DOWN?? !!!!! " + getTimeStamp()));
      }
    }
  }, 1000 );

  configEvents.emit("CONFIG_CHANGE", serverSessionConfig );
});

// ==================================================================
// CONFIGURATION CHANGE HANDLER
// ==================================================================
configEvents.on("CONFIG_CHANGE", function (serverSessionConfig) {

  console.log(chalkAlert(getTimeStamp() + " | CONFIG_CHANGE EVENT"));
  debug("==> CONFIG_CHANGE EVENT: " + JSON.stringify(serverSessionConfig, null, 3));

  if (typeof serverSessionConfig.testMode !== 'undefined') {
    console.log(chalkAlert("   ---> CONFIG_CHANGE: testMode: " + serverSessionConfig.testMode));
    io.of("/admin").emit('CONFIG_CHANGE',  {testMode: serverSessionConfig.testMode});
    io.emit('CONFIG_CHANGE',  {testMode: serverSessionConfig.testMode});
  }

  console.log(chalkInfo(getTimeStamp() + ' | >>> SENT CONFIG_CHANGE'));
});

//=================================
//  SERVER READY
//=================================
io.of("/test").on("connect", function(socket){
  debug("\n\n===================================\nTEST CONNECT\n" 
    + util.inspect(socket.nsp.name, {showHidden: false, depth: 1})
    + "\n========================================\n"
  );
  createClientSocket(socket);
});

io.of("/admin").on("connect", function(socket){

  var adminsHashMap = findClientsSocket('/admin');

  adminsHashMap.forEach(function(value, key) {
    debug("\n\n===================================\nADMIN SOCKET\n" 
      + "KEY: " + key + "\n"
      + util.inspect(value, {showHidden: false, depth: 1})
      + "\n========================================\n"
    );
  });

  debug("\n\n===================================\nADMIN CONNECT\n" 
    + util.inspect(io.of('/admin').sockets, {showHidden: false, depth: 1})
    + "\n========================================\n"
  );

  numberAdminsConnected = io.of('/admin').sockets.length;

  console.log(chalkConnect("ADMIN CONNECTED [" + numberAdminsConnected + "] " 
    + socket.id 
    + " | " + getTimeStamp()
    + " | " + socket.connected
  ));
  
  // debug(chalkConnectAdmin(util.inspect(socket, {showHidden: false, depth: 1})));

  var socketId = socket.id ;
  var adminIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;
  var adminHostname = socket.handshake.headers.host ;
  var adminDomain ;

  var adminObj = {  
          connected: true, 
          connectTime: getTimeNow(), 
          disconnectTime: getTimeNow(), 
          referer: 'ADMIN',
          ip: adminIp, 
          domain: adminDomain,
          socketId: socketId
  } ;

  console.log("SENDING serverSessionConfig to ADMIN " + socketId + "\n" + JSON.stringify(serverSessionConfig));
  socket.emit('ADMIN_CONFIG', JSON.stringify(serverSessionConfig));

  socket.on("REQ ADMIN SESSION", function(options){
    console.log("\n>>> RX REQ ADMIN SESSION\n" 
      + "OPTIONS\n"+ JSON.stringify(options, null, 3)
    );
    switch (options.sessionType) {

      case 'ALL':
        console.log("... FINDING ALL ADMINS + CLIENTS IN DB ...")

        clientFindAllDb(options, function(numberOfClientIps){
          console.log(chalkInfo("CLIENT UNIQUE IP ADDRESSES: " + numberOfClientIps));
          clientIpHashMap.forEach(function(value, key) {
            value.sessions = [] ;
            io.of('/admin').emit('CLIENT IP', JSON.stringify(value));
          });  

          console.log(chalkInfo("CLIENT SOCKET COUNT: " + clientSocketIdHashMap.count()));

          var numberSessionsTxd = 0;

          clientSocketIdHashMap.forEach(function(value, key) {

            if (typeof value.connected !== 'undefined'){
              if ((value.domain.indexOf("googleusercontent") < 0) || (numberSessionsTxd < MAX_TX_SESSIONS)){
                console.log(">>> TX SESSION: CLIENT " 
                  + value.domain 
                  + " | I: " + value.ip 
                  + " | S: " + value.socketId
                  + " | R: " + value.referer
                  + " | CONNECTED: " + value.connected
                  );
                value.sessions = [] ;
                io.of('/admin').emit('CLIENT SESSION', 
                  JSON.stringify({
                    clientObj: {
                      ip: value.ip,
                      socketId: value.socketId,
                      referer: value.referer,
                      domain: value.domain,
                      connected: value.connected, 
                      connectTime: value.connectTime,
                      disconnectTime: value.disconnectTime
                    }
                  })
                );
                numberSessionsTxd++;
              }
              else {
                console.log("... SKIPPING TX SESSION: TEST CLIENT (googleusercontent)");
              }
            }
            else{
              console.log("... SKIPPING TX SESSION: " + numberSessionsTxd + " TXD | " + MAX_TX_SESSIONS + " MAX");
            }
          });  
        });

        adminFindAllDb(options, function(numberOfAdminIps){
          console.log("ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps);
          adminIpHashMap.forEach(function(value, key) {
            value.sessions = [] ;
            io.of('/admin').emit('ADMIN IP', JSON.stringify(value));
          }); 

          console.log("ADMIN SOCKET COUNT: " + adminSocketIdHashMap.count());

          var numberSessionsTxd = 0;
          adminSocketIdHashMap.forEach(function(value, key) {
            if ((numberSessionsTxd < MAX_TX_SESSIONS) && (typeof value.connected !== 'undefined')){
              value.sessions = [] ;
              // io.of('/admin').emit('ADMIN SESSION', JSON.stringify({connected: value.connected, adminObj: value}));
              io.of('/admin').emit('ADMIN SESSION', 
                JSON.stringify({
                  adminObj: {
                    ip: value.ip,
                    socketId: value.socketId,
                    domain: value.domain,
                    connected: value.connected, 
                    connectTime: value.connectTime,
                    disconnectTime: value.disconnectTime
                  }
                })
              );
              numberSessionsTxd++;
            }
            else{
              debug("... SKIPPING TX SESSION: " + numberSessionsTxd + " TXD | " + MAX_TX_SESSIONS + " MAX");
            }
          });  
        });
      break;

      case 'ADMIN':
        console.log("... FINDING ADMINS IN DB ...");
        adminFindAllDb(options, function(numberOfAdminIps){
          console.log("ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps);
          adminIpHashMap.forEach(function(value, key) {
            value.sessions = [] ;
            io.of('/admin').emit('ADMIN IP',
              JSON.stringify({
                connected: value.connected, 
                adminObj: {
                  domain: value.domain,
                  ip: value.ip
                }
              })
            );
          });  
          adminSocketIdHashMap.forEach(function(value, key) {
            if (typeof value.connected !== 'undefined'){
              value.sessions = [] ;
              io.of('/admin').emit('ADMIN SESSION', 
                JSON.stringify({
                  adminObj: {
                    ip: value.ip,
                    socketId: value.socketId,
                    domain: value.domain,
                    connected: value.connected, 
                    connectTime: value.connectTime,
                    disconnectTime: value.disconnectTime
                  }
                })
              );
            }
          });  
        });
      break;

      case 'CLIENT':
        console.log("... FINDING CLIENTS IN DB ...");
        clientFindAllDb(options, function(numberOfClientIps){
          console.log("CLIENT UNIQUE IP ADDRESSES: " + numberOfClientIps);
          clientIpHashMap.forEach(function(value, key) {
            value.sessions = [] ;
            io.of('/admin').emit('CLIENT IP',
              JSON.stringify({
                connected: value.connected, 
                clientObj: {
                  domain: value.domain,
                  referer: value.referer,
                  ip: value.ip
                }
              })
            );
          });
          clientSocketIdHashMap.forEach(function(value, key) {
            if (typeof value.connected !== 'undefined'){
              value.sessions = [] ;
              io.of('/admin').emit('CLIENT SESSION', 
                JSON.stringify({
                  clientObj: {
                    ip: value.ip,
                    socketId: value.socketId,
                    domain: value.domain,
                    referer: value.referer,
                    connected: value.connected, 
                    connectTime: value.connectTime,
                    disconnectTime: value.disconnectTime
                  }
                })
              );
            }
          });  
        });
      break;

      default:
        // console.error(chalkError("\n\n*** UNKNOWN REQ ADMIN SESSION TYPE: " + options.sessionType));
        console.error(chalkError("\n\n*** UNKNOWN REQ ADMIN SESSION TYPE"));
      break;
    }
  });

  async.waterfall([

      function(callback) {
        debug('async.series: dnsReverseLookup');
        dnsReverseLookup(adminObj.ip, function(err, domains){
          if (err){
            console.error(chalkError("\n\n***** ERROR: dnsReverseLookup: " + adminObj.ip + " ERROR: " + err));
          }
          else {
            debug("DNS REVERSE LOOKUP: " + adminObj.ip + " | DOMAINS: " + domains);
            adminObj.domain = domains[0];
          }
          callback(err, adminObj);
        });
      },

      function(adminObj, callback) {
        adminConnectDb(adminObj, function(err, ad){
          if (err){
            console.error(chalkError("\n\n***** ERROR: adminConnectDb: " + err));
            callback(err, adminObj);
          }
          else {
            debug("--- ADMIN DB UPDATED: "
              + ad.ip
              + " | SOCKET ID: " + ad.socketId 
              + " | " + ad.domain
              + " | CREATED AT: " + getTimeStamp(ad.createdAt)
              + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
              + " | CONNECTIONS: " + ad.numberOfConnections
            );

            // debug(JSON.stringify(ad, null, 3));

            callback(null, ad);
          }
        });
      },

      function(adminObj, callback) {
        adminIpHashMap.set(adminObj.ip, adminObj);
        adminSocketIdHashMap.set(adminObj.socketId, adminObj);
        callback(null, adminObj);
      }
    ], 
    function(err, adminObj){
      adminObj.connected = true ;
      adminObj.sessions = [] ;
      io.of('/admin').emit('ADMIN SESSION', 
        JSON.stringify({
          adminObj: {
            ip: adminObj.ip,
            socketId: adminObj.socketId,
            domain: adminObj.domain,
            connected: adminObj.connected, 
            connectTime: adminObj.connectTime,
            disconnectTime: currentTime
          }
        })
      );
    }
  );
  
  socket.on("CONFIG", function(msg){
  
    var rxAdminConfig = JSON.parse(msg) ;
    var previousProperty ;
  
    console.log("\n*** RX ADMIN CONFIG ***\n" 
      + "IP: " + adminIp 
      + " | SOCKET: " + socketId 
      + JSON.stringify(rxAdminConfig, null, 3));
  

    console.log("\nPREVIOUS serverSessionConfig:\n" + JSON.stringify(serverSessionConfig, null, 3));

    for(var configPropertyName in rxAdminConfig) {
      console.log("configPropertyName: " + configPropertyName + " | " + rxAdminConfig[configPropertyName]);
      previousProperty = serverSessionConfig[configPropertyName];
      serverSessionConfig[configPropertyName] = rxAdminConfig[configPropertyName];
      console.log(configPropertyName + " was: " + previousProperty + " | now: " + serverSessionConfig[configPropertyName]);
    }

    console.log("\nNEW serverSessionConfig:\n" + JSON.stringify(serverSessionConfig, null, 3));

    configEvents.emit("CONFIG_CHANGE", serverSessionConfig);
  });

  socket.on("disconnect", function(){

    numberAdminsConnected = io.of('/admin').sockets.length;

    adminObj.disconnectTime = currentTime;

    adminDisconnectDb(adminObj, function(err, ad){
      if (err){
        console.error(chalkError("\n\n***** ERROR: adminDisconnectDb: " + err));
      }
      else {
        debug("--- ADMIN DB UPDATED: "
          + ad.ip
          + " | SOCKET ID: " + ad.socketId 
          + " | " + ad.domain
          + " | CREATED AT: " + getTimeStamp(ad.createdAt)
          + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
          + " | CONNECTIONS: " + ad.numberOfConnections
        );

        adminIpHashMap.set(ad.ip, ad);

        adminSocketIdHashMap.remove(ad.socketId);

        var adminDisconnectedString = '--- ADMIN DISCONNECTED AT ' + getTimeStamp() 
          + ' | ' + ad.ip 
          + ' | socketId: ' + ad.socketId
          + ' | domain: ' + ad.domain
          + ' | ' + numberAdminsTotal + ' ADMINS UNIQUE IP'
          + ' | ' + numberAdminsConnected + ' ADMINS CONNECTED'
           ;

        console.log(adminDisconnectedString);

        adminObj.sessions = [] ;

        io.of('/admin').emit('ADMIN SESSION', 
          JSON.stringify({
            adminObj: {
              ip: ad.ip,
              socketId: ad.socketId,
              domain: ad.domain,
              connected: false, 
              connectTime: ad.connectTime,
              disconnectTime: ad.disconnectTime
            }
          })
        );
      }

    });
  });
});

io.on("disconnect", function(){
  console.log("\n\n**** IO (NGINX?) DISCONNECTED ***\nCLEARING SOCKET HASHMAPS AND QUEUES");

  clientSocketIdHashMap.clear();
  clientIpHashMap.clear();

  adminIpHashMap.clear();
  adminSocketIdHashMap.clear();

  socketQueue.clear();
});

io.on("connect", function(socket){
  createClientSocket(socket);
});

io.on("reconnecting", function(reconnectAttemptNum){
  console.warn(chalkWarn("... SKT RECONNECTING: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + " | " + reconnectAttemptNum + " RECONNECT ATTEMPTS"
  ));

  // if (debug.enabled) {
  //   dumpIoStats();
  // }
});

io.on("reconnect", function(reconnectAttemptNum){
  console.warn(chalkWarn("+-- SKT RECONNECTED: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + " | " + reconnectAttemptNum + " RECONNECT ATTEMPTS"
  ));
});

io.on("error", function(errorObj){
  console.error(chalkError("\n*** SKT ERROR: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});

io.on("reconnect_error", function(errorObj){
  console.error(chalkError("\n*** SKT RECONNECT ERROR: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});

io.on("reconnect_failed", function(errorObj){
  console.error(chalkError("\n*** SKT RECONNECT FAILED: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});

io.on("connect_error", function(errorObj){
  console.error(chalkError("\n*** SKT CONNECT ERROR: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});

io.on("connect_timeout", function(errorObj){
  console.error(chalkError("\n*** SKT CONNECT TIMEOUT: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});


var databaseEnabled = false ;

configEvents.on("DATABASE_INIT_COMPLETE", function(tweetCount){
  databaseEnabled = true ;
  console.log(chalkInfo(getTimeStamp() + " | DATABASE ENABLED"));
});


//=================================
//  REMOVE DISCONNECTED CLIENT SOCKETS FROM HASH MAP
//=================================
var clientSocketCheckInterval = setInterval(function () {

  var clientSockets = findClientsSocket('/');

  clientSocketIdHashMap.forEach(function(clientObj, socketId) {
    if (clientSockets.has(socketId)){
     }
    else{
      console.warn(chalkWarn("??? DISCONNECTED STATE: CLIENT OBJ CONN: " + clientObj.connected + " ... REMOVING FROM HASH ..."));  
      clientSocketIdHashMap.remove(socketId);    
    }
  });
}, 1000);


//=================================
// INIT APP ROUTING
//=================================

function initAppRouting(){

  console.log(chalkInfo(getTimeStamp() + " | INIT APP ROUTING"));

  app.get('/', function(req, res){
    console.log("LOADING PAGE: /");
    res.sendFile(__dirname + '/index.html');
    return;
  });

  app.get('/test', function(req, res){
    console.log(chalkAlert("TEST PAGE REQUEST ... RETURNING index.html ..."));
    res.sendFile(__dirname + '/index.html');
    return;
  });

  app.get('/wordAssoClient.js', function(req, res){
    console.log("LOADING PAGE: /wordAssoClient.js");
    res.sendFile(__dirname + '/wordAssoClient.js');
    return;
  });

  app.get('/session', function(req, res){
    console.log("LOADING FILE: /session.html");
    res.sendFile(__dirname + '/session.html');
  });

  app.get('/js/libs/sessionView.js', function(req, res){
    console.log("LOADING FILE: sessionView.js");
    res.sendFile(__dirname + '/js/libs/sessionView.js');
  });

  app.get('/admin/admin.html', function(req, res){
    console.log("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + '/admin/admin.html');
    return;
  });


  app.get('/css/main.css', function(req, res){
    res.sendFile(__dirname + '/css/main.css');
    return;
  });

  app.get('/css/style.css', function(req, res){
    res.sendFile(__dirname + '/css/style.css');
    return;
  });

  app.get('/css/base.css', function(req, res){
    res.sendFile(__dirname + '/css/base.css');
    return;
  });


  app.get('/node_modules/async/lib/async.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/async/lib/async.js');
    return;
  });


  app.get('/js/libs/Queue.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/Queue.js');
    return;
  });


  app.get('/node_modules/hashmap/hashmap.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/hashmap/hashmap.js');
    return;
  });

  app.get('/threecee.pem', function(req, res){
    debug("LOADING FILE: threecee.pem");
    res.sendFile(__dirname + '/threecee.pem');
    return;
  });


  app.get('/favicon.ico', function(req, res){
    debug("LOADING PAGE: /favicon.ico");
    res.sendFile(__dirname + '/favicon.png');
  });

  app.get('/favicon.png', function(req, res){
    debug("LOADING PAGE: /favicon.png");
    res.sendFile(__dirname + '/favicon.png');
  });
}

initializeConfiguration();

User.count({}, function(err,count){
  if (!err){ 
    console.log("TOTAL USERS: " + count);
    totalUsers = count ;
  } 
  else {
    console.error(chalkError("\n*** DB User.count ERROR *** | " + getTimeStamp() + "\n" + err));
  }
});

Session.count({}, function(err,count){
  if (!err){ 
    console.log("TOTAL SESSIONS: " + count);
    totalSessions = count ;
  } 
  else {
    console.error(chalkError("\n*** DB Session.count ERROR *** | " + getTimeStamp() + "\n" + err));
  }
});

Word.count({}, function(err,count){
  if (!err){ 
    console.log("TOTAL WORDS: " + count);
    totalWords = count ;
  } 
  else {
    console.error(chalkError("\n*** DB Word.count ERROR *** | " + getTimeStamp() + "\n" + err));
  }
});


module.exports = {
 app: app,
 io:io, 
 http: httpServer
}


