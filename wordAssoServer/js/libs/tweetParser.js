/*jslint node: true */
/*jshint sub:true*/

process.title = "wa_node_child_twp";

const MAX_Q = 100;
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const debug = require("debug")("twp");
const moment = require("moment");
const treeify = require("treeify");
const EventEmitter2 = require("eventemitter2").EventEmitter2;

const chalk = require("chalk");
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;

const statsObj = {};
statsObj.dbConnectionReady = false;


const configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});

const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

global.globalDbConnection = false;

global.globalWordAssoDb = require("@threeceelabs/mongoose-twitter");

const emojiModel = require("@threeceelabs/mongoose-twitter/models/emoji.server.model");
const hashtagModel = require("@threeceelabs/mongoose-twitter/models/hashtag.server.model");
const locationModel = require("@threeceelabs/mongoose-twitter/models/location.server.model");
const mediaModel = require("@threeceelabs/mongoose-twitter/models/media.server.model");
const neuralNetworkModel = require("@threeceelabs/mongoose-twitter/models/neuralNetwork.server.model");
const placeModel = require("@threeceelabs/mongoose-twitter/models/place.server.model");
const tweetModel = require("@threeceelabs/mongoose-twitter/models/tweet.server.model");
const urlModel = require("@threeceelabs/mongoose-twitter/models/url.server.model");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

let dbConnectionReady = false;
let dbConnectionReadyInterval;

const TweetServerController = require("@threeceelabs/tweet-server-controller");
let tweetServerController;

const tweetParserQueue = [];

const configuration = {};
configuration.processName = process.env.TWP_PROCESS_NAME || "node_tweetParser";
configuration.verbose = false;
configuration.updateInterval = 5;
configuration.globalTestMode = false;
configuration.testMode = false;
configuration.inc = true;


function jsonPrint(obj) {
  if (obj) {
    return treeify.asTree(obj, true, true);
  } 
  else {
    return obj;
  }
}

function getTimeStamp(inputTime) {
  let currentTimeStamp;

  if (inputTime === undefined) {
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

function quit(message) {

  let msg = "";
  let exitCode = 0;

  if (message) {
    msg = message;
    exitCode = 1;
  }

  console.error("TWP | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | TWEET PARSER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  if ((global.globalDbConnection !== undefined) && (global.globalDbConnection.readyState > 0)) {
    global.globalDbConnection.close(function () {
      
      console.log(chalkAlert(
            "TWP | =========================="
        + "\nTWP | MONGO DB CONNECTION CLOSED"
        + "\nTWP | =========================="
      ));

      process.exit(exitCode);
    });
  }
  else {
    process.exit(exitCode);
  }
}

process.on("SIGHUP", function() {
  quit("SIGHUP");
});

process.on("SIGINT", function() {
  quit("SIGINT");
});

process.on("disconnect", function() {
  quit("DISCONNECT");
});

function connectDb(){

  return new Promise(function(resolve, reject){

    try {

      statsObj.status = "CONNECT DB";

      global.globalWordAssoDb.connect("TWP_" + process.pid, function(err, db){

        if (err) {
          console.log(chalkError("WAS | TWP | *** MONGO DB CONNECTION ERROR: " + err));
          statsObj.status = "MONGO CONNECTION ERROR";
          dbConnectionReady = false;
          quit(statsObj.status);
          return reject(err);
        }

        db.on("close", function(){
          statsObj.status = "MONGO CLOSED";
          console.error.bind(console, "WAS | TWP | *** MONGO DB CONNECTION CLOSED ***");
          console.log(chalkError("WAS | TWP | *** MONGO DB CONNECTION CLOSED ***"));
          dbConnectionReady = false;
        });

        db.on("error", function(){
          statsObj.status = "MONGO ERROR";
          console.error.bind(console, "WAS | TWP | *** MONGO DB CONNECTION ERROR ***");
          console.log(chalkError("WAS | TWP | *** MONGO DB CONNECTION ERROR ***"));
          dbConnectionReady = false;
        });

        db.on("disconnected", function(){
          statsObj.status = "MONGO DISCONNECTED";
          console.error.bind(console, "WAS | TWP | *** MONGO DB DISCONNECTED ***");
          console.log(chalkAlert("WAS | TWP | *** MONGO DB DISCONNECTED ***"));
          dbConnectionReady = false;
        });

        global.globalDbConnection = db;

        console.log(chalk.green("WAS | TWP | MONGOOSE DEFAULT CONNECTION OPEN"));

        global.globalEmoji = global.globalDbConnection.model("Emoji", emojiModel.EmojiSchema);
        global.globalHashtag = global.globalDbConnection.model("Hashtag", hashtagModel.HashtagSchema);
        global.globalLocation = global.globalDbConnection.model("Location", locationModel.LocationSchema);
        global.globalMedia = global.globalDbConnection.model("Media", mediaModel.MediaSchema);
        global.globalNeuralNetwork = global.globalDbConnection.model("NeuralNetwork", neuralNetworkModel.NeuralNetworkSchema);
        global.globalPlace = global.globalDbConnection.model("Place", placeModel.PlaceSchema);
        global.globalTweet = global.globalDbConnection.model("Tweet", tweetModel.TweetSchema);
        global.globalUrl = global.globalDbConnection.model("Url", urlModel.UrlSchema);
        global.globalUser = global.globalDbConnection.model("User", userModel.UserSchema);
        global.globalWord = global.globalDbConnection.model("Word", wordModel.WordSchema);

        tweetServerController = new TweetServerController("TWP_TSC");

        tweetServerController.on("ready", function(appname){
          statsObj.status = "MONGO DB CONNECTED";

          console.log(chalkLog("WAS | TWP | USC READY | " + appname));
          dbConnectionReady = true;

          resolve(db);

        });

        tweetServerController.on("error", function(err){
          console.trace(chalkError("WAS | TWP | *** TSC ERROR | " + err));
        });

      });
    }
    catch(err){
      console.log(chalkError("WAS | TWP | *** MONGO DB CONNECT ERROR: " + err));
      reject(err);
    }
  });
}

console.log(
  "\n\nTWP | ====================================================================================================\n" 
  + process.argv[1] 
  + "\nTWP | PROCESS ID:    " + process.pid 
  + "\nTWP | PROCESS TITLE: " + process.title 
  + "\nTWP | " + "====================================================================================================\n" 
);


if (debug.enabled) {
  console.log("TWP | %%%%%%%%%%%%%%\nTWP | %%%%%%% DEBUG ENABLED %%%%%%%\nTWP | %%%%%%%%%%%%%%\n");
}

let tweetParserQueueInterval;

function initTweetParserQueueInterval(cnf){

  console.log(chalkInfo("TWP | initTweetParserQueueInterval | " + cnf.updateInterval + " MS"));

  clearInterval(tweetParserQueueInterval);

  let tweet;
  let tweetParserQueueReady = true;
  const params = {};
  params.globalTestMode = cnf.globalTestMode;
  params.testMode = cnf.testMode;
  params.inc = cnf.inc;

  tweetParserQueueInterval = setInterval(function(){

    if (tweetServerController 
      && (tweetParserQueue.length > 0) 
      && tweetParserQueueReady)
    {

      tweetParserQueueReady = false;

      tweet = tweetParserQueue.shift();

      if (cnf.verbose) {
        console.log(chalkInfo("TW PARSER TPQ>"
          + " [" + tweetParserQueue.length + "]"
          + " | " + tweet.id_str
          + " | TWEET LANG: " + tweet.lang
          + " | " + tweet.user.id_str
          + " | @" + tweet.user.screen_name
          + " | " + tweet.user.name
          + " | USER LANG: " + tweet.user.lang
          + " | Ts: " + tweet.user.statuses_count
          + " | FLs: " + tweet.user.followers_count
          + " | FRs: " + tweet.user.friends_count
        ));
      }

      params.tweetStatus = tweet;

      tweetServerController.createStreamTweet(params).
      then(function(tweetObj){

        if (cnf.globalTestMode){

          tweetParserQueueReady = true;

          if (cnf.verbose){
            console.log(chalkAlert("TWP | t< GLOBAL TEST MODE"
              + " | " + tweetObj.tweetId
              + " | @" + tweetObj.user.screenName
            ));
          }
        }
        else {

          if (cnf.verbose) {
            console.log.bind(console, "TWP | TW PARSER [" + tweetParserQueue.length + "]"
              + " | " + tweetObj.tweetId);
            console.log(chalkInfo("TWP | TW PARSER [" + tweetParserQueue.length + "]"
              + " | " + tweetObj.tweetId
            ));
          }

          process.send({op: "parsedTweet", tweetObj: tweetObj}, function(err){

            tweetParserQueueReady = true;

            if (err) {
              console.trace(chalkError("TWP | *** PARSER SEND TWEET ERROR"
                + " | " + moment().format(compactDateTimeFormat)
                + " | " + err
              ));
            }
            else {
              debug(chalkInfo("TWP | *** PARSER SEND COMPLETE"
                + " | " + moment().format(compactDateTimeFormat)
                + " | " + tweetObj.tweetId
              ));
            }
          });

          // tweetParserQueueReady = true;
        }
      }).
      catch(function(err){

        console.log(chalkError("TWP | *** CREATE STREAM TWEET ERROR: " + getTimeStamp()));
        console.log(chalkError("TWP | *** CREATE STREAM TWEET ERROR: ", err));

        process.send({op: "error", err: err}, function(err){

          tweetParserQueueReady = true;

          if (err) {
            console.trace(chalkError("TWP | *** PARSER SEND ERROR ERROR"
              + " | " + moment().format(compactDateTimeFormat)
              + " | " + err
            ));
          }
          else {
            debug(chalkInfo("TWP | PARSER SEND ERROR COMPLETE"
              + " | " + moment().format(compactDateTimeFormat)
            ));
          }
        });

      });

    }

  }, cnf.updateInterval);
}

process.on("message", function(m) {

  debug(chalkAlert("TWEET PARSER RX MESSAGE"
    + " | OP: " + m.op
  ));

  switch (m.op) {

    case "VERBOSE":
      configuration.verbose = m.verbose;
      console.log(chalkInfo("TWP | VERBOSE"
        + " | " + m.verbose
      ));
    break;

    case "INIT":

      process.title = m.title;

      configuration.verbose = m.verbose;
      configuration.updateInterval = m.interval;
      // configuration.networkObj = {};
      // configuration.networkObj = m.networkObj;
      // configuration.maxInputHashMap = {};
      // configuration.maxInputHashMap = m.maxInputHashMap;
      // configuration.normalization = {};
      // configuration.normalization = m.normalization;
      // configuration.inputArrays = {};

      console.log(chalkInfo("TWP | TWEET PARSER INIT"
        + " | TITLE: " + m.title
        + " | INTERVAL: " + m.interval
        // + "\nMESSAGE " + jsonPrint(m)
      ));

      initTweetParserQueueInterval(configuration);

      // if (configuration.networkObj) {
      //   console.log(chalkInfo("TWP | TWEET PARSER INIT"
      //     + " | NN: " + m.networkObj.networkId
      //   ));

      //   async.eachSeries(Object.keys(m.networkObj.inputsObj.inputs), function(type, cb){

      //     console.log(chalkNetwork("TWP | NN INPUTS TYPE" 
      //       + " | " + type
      //       + " | INPUTS: " + m.networkObj.inputsObj.inputs[type].length
      //     ));

      //     configuration.inputArrays[type] = {};
      //     configuration.inputArrays[type] = m.networkObj.inputsObj.inputs[type];

      //     cb();
      //   }, function(){
      //     initTweetParserQueueInterval(configuration);
      //     // networkReady = true;
      //   });
      // }
      // else {
        // initTweetParserQueueInterval(configuration);
        // networkReady = false;
      // }
      
      // if (configuration.maxInputHashMap) {
      //   console.log(chalkInfo("TWP | TWEET PARSER INIT"
      //     + " | MAX IN HM INPUT TYPES: " + Object.keys(configuration.maxInputHashMap)
      //   ));
      // }
      
      // if (configuration.normalization) {
      //   console.log(chalkInfo("TWP | TWEET PARSER INIT"
      //     + " | NORMALIZATION INPUT TYPES: " + Object.keys(configuration.normalization)
      //   ));
      // }
    break;

    // case "NETWORK":

    //   // networkReady = false;

    //   console.log(chalkInfo("TWP | TWEET PARSER NETWORK"
    //     + " | NN: " + m.networkObj.networkId
    //     + " | SUCCESS RATE: " + m.networkObj.successRate.toFixed(2)
    //   ));

    //   configuration.networkObj = {};
    //   configuration.networkObj = m.networkObj;


    //   configuration.inputArrays = {};

    //   async.eachSeries(Object.keys(m.networkObj.inputsObj.inputs), function(type, cb){

    //     console.log(chalkNetwork("TWP | NN INPUTS TYPE" 
    //       + " | " + type
    //       + " | INPUTS: " + m.networkObj.inputsObj.inputs[type].length
    //     ));

    //     configuration.inputArrays[type] = {};
    //     configuration.inputArrays[type] = m.networkObj.inputsObj.inputs[type];

    //     cb();

    //   }, function(){
    //   });
    // break;

    case "PING":
      debug(chalkLog("TWP | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
    break;

    case "tweet":
      if (tweetParserQueue.length < MAX_Q) {

        tweetParserQueue.push(m.tweetStatus);

        debug(chalkInfo("TWP | PARSER T<"
          + " [ TPQ: " + tweetParserQueue.length + "]"
          + " | " + m.tweetStatus.id_str
        ));
      }
      else {
        debug(chalkAlert("TWP | *** MAX TWEET PARSE Q SIZE: " + tweetParserQueue.length));
      }
    break;

    default:
      console.trace(chalkError("TWP | *** TWEET PARSER UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));
  }
});

setTimeout(async function(){

  try {

    console.log("TWP | " + chalk.blue(configuration.processName + " STARTED " + getTimeStamp() ));

    statsObj.status = "START";

    debug("TWP | " + chalk.blue(configuration.processName + " CONFIGURATION\n" + jsonPrint(configuration)));

    try {
      await connectDb();
    }
    catch(err){
      dbConnectionReady = false;
      console.log(chalkError("TWP | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
      quit("MONGO DB CONNECT ERROR");
    }

    dbConnectionReadyInterval = setInterval(async function() {

      if (dbConnectionReady) {
        clearInterval(dbConnectionReadyInterval);
      }
      else {
        console.log(chalkAlert("TWP | ... WAIT DB CONNECTED ..."));
      }
    }, 1000);

  }
  catch(err){
    console.log(chalkError("TWP | *** INIT TIMEOUT ERROR: " + err));
    quit();
  }
}, 1000);
