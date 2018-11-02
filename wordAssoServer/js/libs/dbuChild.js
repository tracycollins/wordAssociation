/*jslint node: true */
/*jshint sub:true*/
"use strict";

process.title = "node_databaseUpdate";

const DEFAULT_VERBOSE = false;
const DEFAULT_TEST_MODE = true;
const DEFAULT_USER_UPDATE_QUEUE_INTERVAL = 100;

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

const compactDateTimeFormat = "YYYYMMDD_HHmmss";

const os = require("os");
const moment = require("moment");
const treeify = require("treeify");
const util = require("util");
const debug = require("debug")("dbu");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");
const async = require("async");

const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkWarn = chalk.red;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word/g, "google");

let statsObj = {};

statsObj.status = "LOAD";
statsObj.hostname = hostname;
statsObj.pid = process.pid;
statsObj.dbConnectionReady = false;

statsObj.startTimeMoment = moment();
statsObj.startTime = moment().valueOf();
statsObj.elapsed = moment().valueOf() - statsObj.startTime;

statsObj.users = {};

statsObj.errors = {};
statsObj.errors.users = {};

process.on("unhandledRejection", function(err, promise) {
  console.trace("Unhandled rejection (promise: ", promise, ", reason: ", err, ").");
  process.exit();
});

process.on("SIGHUP", function processSigHup() {
  quit("SIGHUP");
});

process.on("SIGINT", function processSigInt() {
  quit("SIGINT");
});

process.on("disconnect", function processDisconnect() {
  quit("DISCONNECT");
});

function jsonPrint(obj) {
  if (obj) {
    return treeify.asTree(obj, true, true);
  } 
  else {
    return obj;
  }
}

function getTimeStamp(inputTime) {
  let currentTimeStamp ;

  if (inputTime  === undefined) {
    currentTimeStamp = moment().format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else if (moment.isMoment(inputTime)) {
    currentTimeStamp = moment(inputTime).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else if (moment.isDate(new Date(inputTime)) && moment(new Date(inputTime)).isValid()) {
    currentTimeStamp = moment(new Date(inputTime)).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else if (Number.isInteger(inputTime)) {
    currentTimeStamp = moment(parseInt(inputTime)).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else {
    return "NOT VALID TIMESTAMP: " + inputTime;
  }
}

// let User;

global.dbConnection = false;
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const wordAssoDb = require("@threeceelabs/mongoose-twitter");

const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");

let User = mongoose.model("User", userModel.UserSchema);



let UserServerController;
let userServerController;

let userServerControllerReady = false;

let configuration = {}; // merge of defaultConfiguration & hostConfiguration
configuration.processName = process.env.DBU_PROCESS_NAME || "node_databaseUpdate";
configuration.verbose = false;
configuration.testMode = false; // per tweet test mode

function msToTime(duration) {

  let sign = 1;

  if (duration < 0) {
    sign = -1;
    duration = -duration;
  }

  let seconds = parseInt((duration / 1000) % 60);
  let minutes = parseInt((duration / (1000 * 60)) % 60);
  let hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  let days = parseInt(duration / (1000 * 60 * 60 * 24));
  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  if (sign > 0) return days + ":" + hours + ":" + minutes + ":" + seconds;
  return "- " + days + ":" + hours + ":" + minutes + ":" + seconds;
}

console.log(
  "\n\nDBU | ====================================================================================================\n" 
  + process.argv[1] 
  + "\nDBU | PROCESS ID:    " + process.pid 
  + "\nDBU | PROCESS TITLE: " + process.title 
  + "\nDBU | " + "====================================================================================================\n" 
);

function showStats(options){

  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  if (options) {
    console.log("DBU | STATS\nDBU | " + jsonPrint(statsObj));
  }
  else {
    console.log(chalkLog("DBU | ============================================================"
      + "\nDBU | S"
      + " | STATUS: " + statsObj.status
      + " | CPUs: " + statsObj.cpus
      + " | CH: " + statsObj.numChildren
      + " | S " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
      + " | N " + moment().format(compactDateTimeFormat)
      + " | E " + msToTime(statsObj.elapsed)
      + "\nDBU | ============================================================"
    ));
  }
}

function quit(options){

  console.log(chalkAlert( "\n\nDBU | ... QUITTING ...\n\n" ));

  clearInterval(userUpdateQueueInterval);

  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  if (options !== undefined) {

    if (options === "help") {
      process.exit();
    }
  }

  showStats();

  setTimeout(function(){
    global.dbConnection.close(function () {
      console.log(chalkAlert(
          "\nDBU | =========================="
        + "\nDBU | MONGO DB CONNECTION CLOSED"
        + "\nDBU | ==========================\n"
      ));
      process.exit();
    });
  }, 1000);
}

process.on( "SIGINT", function() {
  quit("SIGINT");
});

process.on("exit", function() {
  quit("EXIT");
});

function connectDb(){

  console.log(chalkLog("DBU | CONNECT DB"));

  return new Promise(function(resolve, reject){

    statsObj.status = "CONNECT DB";

    wordAssoDb.connect("DBU_" + process.pid, function(err, db){
      if (err) {
        console.log(chalkError("*** DBU | MONGO DB CONNECTION ERROR: " + err));
        statsObj.dbConnectionReady = false;
        return reject(err);
      }
      else {

        db.on("error", function(err){
          console.error.bind(console, "*** DBU | MONGO DB CONNECTION ERROR ***\n");
          console.log(chalkError("*** DBU | MONGO DB CONNECTION ERROR ***\n"));
          db.close();
          statsObj.dbConnectionReady = false;
          quit(err);
        });

        db.on("disconnected", function(){
          console.error.bind(console, "*** DBU | MONGO DB DISCONNECTED ***\n");
          console.log(chalkAlert("*** DBU | MONGO DB DISCONNECTED ***\n"));
          statsObj.dbConnectionReady = false;
          quit("MONGO DB DISCONNECTED");
        });

        console.log(chalkLog("DBU | MONGOOSE DEFAULT CONNECTION OPEN"));

        statsObj.dbConnectionReady = true;

        // User = mongoose.model("User", userModel.UserSchema);

        global.dbConnection = db;

        UserServerController = require("@threeceelabs/user-server-controller");
        userServerController = new UserServerController("DBU_USC");


        userServerControllerReady = false;

        userServerController.on("ready", function(appname){
          userServerControllerReady = true;
          console.log(chalkLog("DBU | USC READY | " + appname));
        });


        resolve(db);

      }
    });

  });
}


function initialize(){

  return new Promise(function(resolve, reject){

    statsObj.status = "INITIALIZE";

    if (debug.enabled || debugCache.enabled || debugQ.enabled){
      console.log("\nDBU | %%%%%%%%%%%%%%\nDBU |  DEBUG ENABLED \nDBU | %%%%%%%%%%%%%%\n");
    }

    resolve();

  });

}

let userUpdateQueueInterval;
let userUpdateQueueReady = false;
let userUpdateQueue = [];
let tweetObj = {};
// let user;

function userUpdateDb(tweetObj){
  return new Promise(function(resolve, reject){

    // tweetObj.user = results.user;
    // tweetObj.userMentions = results.userMentions || [];
    // tweetObj.hashtags = results.hashtags || [];
    // tweetObj.urls = results.urls || [];
    // tweetObj.media = results.media || [];
    // tweetObj.emoji = results.emoji || [];
    // tweetObj.words = results.words || [];
    // tweetObj.place = results.place;

    let userHistograms = [];

    async.each(Object.keys(tweetObj), function(entityType, cb0){

      if (entityType === "user") { return cb0(); }

      if (tweetObj[entityType].length === 0) { return cb0(); }

      async.each(Object.keys(tweetObj[entityType]), function(entity, cb1){

        if (!tweetObj.user.histograms[entityType] || (tweetObj.user.histograms[entityType] === undefined)){
          tweetObj.user.histograms[entityType] = {};
          tweetObj.user.histograms[entityType][entity] = 0;
        }

        tweetObj.user.histograms[entityType][entity] += 1;

        if (configuration.verbose) {
          console.log(chalkLog("DBU | +++ USER HIST"
            + " | " + entityType.toUpperCase()
            + " | " + entity
            + " | " + tweetObj.user.histograms[entityType][entity]
          ));
        }

        cb1();

      }, function(){

        cb0();

      });

    }, function(err0){

      if (err) { return reject(err); }

      resolve(tweetObj.user);

    });

  });
}

function initUserUpdateQueueInterval(interval){

  return new Promise(function(resolve, reject){

    clearInterval(userUpdateQueueInterval);

    userUpdateQueueReady = true;

    userUpdateQueueInterval = setInterval(async function(){

      if (userUpdateQueueReady && (userUpdateQueue.length > 0)) {

        userUpdateQueueReady = false;

        tweetObj = userUpdateQueue.shift();

        try {
          user = await userUpdateDb(tweetObj);
        }
        catch(err){
          console.log(chalkError("DBU | *** USER UPDATE DB ERROR: " + err));
        }

        userUpdateQueueReady = true;

      }

    }, interval)

    resolve();

  });

}

console.log(chalkInfo("DBU | " + getTimeStamp() 
  + " | WAIT 5 SEC FOR MONGO BEFORE INITIALIZE CONFIGURATION"
));

process.on("message", function(m) {

  debug(chalkAlert("DBU | RX MESSAGE"
    + " | OP: " + m.op
  ));

  switch (m.op) {

    case "INIT":

      process.title = m.title;

      configuration.verbose = m.verbose || DEFAULT_VERBOSE;
      configuration.testMode = m.testMode || DEFAULT_TEST_MODE;
      configuration.userUpdateQueueInterval = m.interval || DEFAULT_USER_UPDATE_QUEUE_INTERVAL;

      console.log(chalkInfo("DBU | INIT"
        + " | TITLE: " + process.title
      ));
    break;

    case "TWEET":

      if (userUpdateQueue.length < configuration.maxUserUpdateQueue){
        userUpdateQueue.push(m.tweetObj);
      }

      if (configuration.verbose) {
        console.log(chalkLog("DBU | [" + userUpdateQueue.length + "]"
          + " | TW " + m.tweetObj.tweetId 
          + " | @" + m.tweetObj.user.screenName 
        ));
      }

      statsObj.userUpdateQueue = userUpdateQueue.length;

    break;

    case "PING":
      debug(chalkLog("DBU | TWP | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){

        process.send({ 
          op: "PONG", pongId: 
          m.pingId
        });

      }, 1000);
    break;

    default:
      console.error(chalkError("DBU | TWP | *** DBU UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));

  }
});

setTimeout(async function(){

  try {

    await initialize();

    console.log(chalkLog("DBU | " + configuration.processName + " STARTED " + getTimeStamp() + "\n"));

    await connectDb();

    await initUserUpdateQueueInterval(configuration.userUpdateQueueInterval);

  }
  catch(err){
    console.log(chalkError("DBU | *** DBU INITIALIZE ERROR: " + err));
    quit(err);
  }


}, 5*ONE_SECOND);

