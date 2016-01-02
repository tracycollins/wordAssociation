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
    // Your process is going to be reloaded
    // You have to close all database/socket.io/* connections

    console.log('\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n');

    // You will have 4000ms to close all connections before
    // the reload mechanism will try to do its job

    setTimeout(function() {
      console.log('**** Finished closing connections ****\n\n ***** RELOADING blm.js NOW *****\n\n');
      // This timeout means that all connections have been closed
      // Now we can exit to let the reload mechanism do its job
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

var chalkConnect = chalk.bold.green;
var chalkDisconnect = chalk.bold.blue;

var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.yellow;

var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;

var serverReady = false ;
var internetReady = false ;

var sessionConfig = {};
var configChangeFlag = false ;

// ==================================================================
// NODE MODULE DECLARATIONS
// ==================================================================

// var kerberos = require('kerberos');
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

// e1b4564ec38d2db399dabdf83a8beeeb
var Synonymator = require('synonymator');
var API_KEY = "e1b4564ec38d2db399dabdf83a8beeeb";
 
var syn = new Synonymator(API_KEY);

// var Dictionary = require('mw-dictionary');
  
//   //pass the constructor a config object with your key
// var dict = new Dictionary({
//     key: "b652e4a5-4906-4bce-95e7-dde2acd02362"
//   });

// ==================================================================
// ENV INIT
// ==================================================================
var debug = require('debug')('wordAsso');

if (debug.enabled){
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}


debug('NODE_ENV BEFORE: ' + process.env.NODE_ENV);
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
console.log('NODE_ENV : ' + process.env.NODE_ENV);

console.log('... SERVER NODE_ENV: ' + process.env.NODE_ENV );
console.log('... CLIENT HOST + PORT: ' + 'http://localhost:' + config.port);

// ==================================================================
// MONGO DATABASE CONFIG
// ==================================================================

console.log("\n------------------------\nMONGO DATABASE CONFIG");

var db = mongoose();

var Admin = require('mongoose').model('Admin');
var Client = require('mongoose').model('Client');


// ==================================================================
// APP HTTP IO DNS CONFIG -- ?? order is important.
// ==================================================================
var app = express(); 

var http = require('http').Server(app);
var io = require('socket.io')(http);
var dns = require('dns');
var path = require('path');

var EventEmitter2 = require('eventemitter2').EventEmitter2;
var EventEmitter = require("events").EventEmitter;

var configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

var Queue = require('queue-fifo');
var socketQueue = new Queue();

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

function sendWordResponse(wordIn){
  var srvrObj = {
    "timeStamp" : getTimeStamp(),
    "response" : wordIn
  }
  io.emit("WORD_OUT",srvrObj);
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
    // debug(util.inspect(socketObj, {showHidden: false, depth: 1}));
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

            // debug('async.series: dnsReverseLookup');

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
                // debug(JSON.stringify(cl, null, 3));
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
          else{
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
    else if (socket.handshake.headers.referer.indexOf('test') >= 0) {
      referer = 'TEST';
      debug("@@@ TEST CLIENT CONNECTED: " + getTimeStamp() 
        + " | " + socket.id 
        + " | REFERER: " + socket.handshake.headers.referer
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

  socket.on("WORD_IN", function(wordInValue){

    console.log(chalkInfo("WORD_IN: " + wordInValue));

    syn.synonyms(wordInValue).then((data) => {
      console.log(data);
      var dataIndex = randomIntFromInterval(0,data.length-1);
      console.log("TX RESPONSE: " + data[dataIndex]);
      sendWordResponse(data[dataIndex]);
    });


  });
}


function adminConnectDb (adminObj, callback) {

  debug("adminConnectDb: adminObj: " + JSON.stringify(adminObj, null, 3));

  var query = { ip: adminObj.ip };
  var update = { 
          $inc: { "numberOfConnections": 1 }, 
          $set: { 
            "socketId": adminObj.socketId,
            // "connected": true,
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
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | SOCKET INIT"));
      callbackSeries();
    },

    // CONFIG EVENT
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | INIT CONFIG COMPLETE"));
      sessionConfig = { 
        testMode: testMode
      };
      debug("SESSION CONFIGURATION\n" + JSON.stringify(sessionConfig, null, 3) + "\n");
      callbackSeries();
    },

    // SERVER READY
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | SEND SERVER_READY"));
      configEvents.emit("SERVER_READY");
      callbackSeries();
    }
  ]);
}



// ==================================================================
// CHECK FOR INTERNET CONNECTION AND SOCKET IO
// ==================================================================

console.log("... CHECKING INTERNET CONNECTION ...");
dns.resolve('www.google.com', function(err, addresses) {
  if (err){
    console.error("\n????? INTERNET DOWN ????? | " + getTimeStamp());
  } 
  else{
    internetReady = true ;
    console.log(chalkInfo(getTimeStamp() + " | INTERNET CONNECTION OK"));
    debug('DNS IP RESOLVE www.google.com: ' + JSON.stringify(addresses));

    dns.reverse(addresses[0], function(err, domains){
      debug('DNS REVERSE IP: ' + addresses[0] + ' | DOMAINS: ' + JSON.stringify(domains, null, 3));
    });
  }
});

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

  http.on("reconnect", function(){
    internetReady = true ;
    console.log(chalkConnect(getTimeStamp() + ' | PORT RECONNECT: ' + config.port));
    initializeConfiguration();
  });

  http.on("connect", function(){
    internetReady = true ;
    console.log(chalkConnect(getTimeStamp() + ' | PORT CONNECT: ' + config.port));

    http.on("disconnect", function(){
      internetReady = false ;
      console.error(chalkError('\n***** PORT DISCONNECTED | ' + getTimeStamp() + ' | ' + config.port));
    });
  });

  http.listen(config.port, function(){
    console.log(chalkInfo(getTimeStamp() + " | LISTENING ON PORT " + config.port));
  });

  http.on("error", function (err) {
    internetReady = false ;
    console.error(chalkError('??? HTTP ERROR | ' + getTimeStamp() + '\n' + err));
    if (err.code == 'EADDRINUSE') {
      console.error(chalkError('??? HTTP ADDRESS IN USE: ' + config.port + ' ... RETRYING...'));
      setTimeout(function () {
        http.listen(config.port, function(){
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
      if (clientObj.referer == 'TEST') {
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

  configEvents.emit("CONFIG_CHANGE", sessionConfig );
});


// ==================================================================
// CONFIGURATION CHANGE HANDLER
// ==================================================================
configEvents.on("CONFIG_CHANGE", function (sessionConfig) {

  console.log(chalkAlert(getTimeStamp() + " | CONFIG_CHANGE EVENT"));
  debug("==> CONFIG_CHANGE EVENT: " + JSON.stringify(sessionConfig, null, 3));

  if (typeof sessionConfig.testMode !== 'undefined') {
    console.log(chalkAlert("   ---> CONFIG_CHANGE: testMode: " + sessionConfig.testMode));
    io.of("/admin").emit('CONFIG_CHANGE',  {testMode: sessionConfig.testMode});
    io.emit('CONFIG_CHANGE',  {testMode: sessionConfig.testMode});
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

  console.log("SENDING sessionConfig to ADMIN " + socketId + "\n" + JSON.stringify(sessionConfig));
  socket.emit('ADMIN_CONFIG', JSON.stringify(sessionConfig));

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
        // debug("async admin hash stage: " + JSON.stringify(adminObj, null, 3));
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
  

    console.log("\nPREVIOUS sessionConfig:\n" + JSON.stringify(sessionConfig, null, 3));

    for(var configPropertyName in rxAdminConfig) {
      console.log("configPropertyName: " + configPropertyName + " | " + rxAdminConfig[configPropertyName]);
      previousProperty = sessionConfig[configPropertyName];
      sessionConfig[configPropertyName] = rxAdminConfig[configPropertyName];
      console.log(configPropertyName + " was: " + previousProperty + " | now: " + sessionConfig[configPropertyName]);
    }

    console.log("\nNEW sessionConfig:\n" + JSON.stringify(sessionConfig, null, 3));

    configEvents.emit("CONFIG_CHANGE", sessionConfig);
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

        // debug(JSON.stringify(ad, null, 3));

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

  app.get('/wordAssoClient.js', function(req, res){
    console.log("LOADING PAGE: /wordAssoClient.js");
    res.sendFile(__dirname + '/wordAssoClient.js');
    return;
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

  // app.get('/*', function(req, res){
  //   console.log("??? UNKNOWN REQ ??? :");
  //   // console.log(req);
  //   // res.status(404).send('what???');
  //   return;
  // });
}

initializeConfiguration();

syn.synonyms("time").then((data) => {
  console.log(data);
});


module.exports = {
 app: app,
 io:io, 
 http: http
}


