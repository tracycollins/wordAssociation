const MODULE_ID_PREFIX = "TWP";

process.title = "wa_node_child_twp";

const MAX_Q = 500;
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const debug = require("debug")("twp");
const moment = require("moment");
const EventEmitter2 = require("eventemitter2").EventEmitter2;

const chalk = require("chalk");
const chalkLog = chalk.gray;
const chalkBlueBold = chalk.blue.bold;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;

const statsObj = {};

const configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});

global.wordAssoDb = require("@threeceelabs/mongoose-twitter");

const tweetParserQueue = [];

const configuration = {};
configuration.processName = process.env.TWP_PROCESS_NAME || "node_tweetParser";
configuration.verbose = false;
configuration.updateInterval = 5;
configuration.globalTestMode = false;
configuration.tweetVersion2 = false;
configuration.testMode = false;
configuration.inc = true;

function quit(message) {

  let msg = "";
  let exitCode = 0;

  if (message) {
    msg = message;
    exitCode = 1;
  }

  console.log("TWP | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | TWEET PARSER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  if (global.dbConnection) {
    global.dbConnection.close(function () {
      
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

let tcUtils;
let tweetServerController;

async function connectDb(){

  try {

    console.log(chalkBlueBold(MODULE_ID_PREFIX + " | CONNECT MONGO DB ..."));

    const db = await global.wordAssoDb.connect(MODULE_ID_PREFIX + "_" + process.pid);

    db.on("error", async function(err){
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION ERROR"));
    });

    db.on("close", async function(err){
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION CLOSED"));
    });

    db.on("disconnected", async function(){
      statsObj.dbConnectionReady = false;
      console.log(chalkAlert(MODULE_ID_PREFIX + " | *** MONGO DB DISCONNECTED"));
    });

    console.log(chalk.green(MODULE_ID_PREFIX + " | MONGOOSE DEFAULT CONNECTION OPEN"));

    const ThreeceeUtilities = require("@threeceelabs/threecee-utilities");
    tcUtils = new ThreeceeUtilities(MODULE_ID_PREFIX + "_TCU");

    const TweetServerController = require("@threeceelabs/tweet-server-controller");
    tweetServerController = new TweetServerController(MODULE_ID_PREFIX + "_TSC");

    tweetServerController.on("error", function(err){
      console.log(chalkError(MODULE_ID_PREFIX + " | *** TSC ERROR | " + err));
    });

    tweetServerController.on("ready", function(appname){
      console.log(chalk.green(MODULE_ID_PREFIX + " | TSC READY | " + appname));
    });

    statsObj.dbConnectionReady = true;

    return db;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECT ERROR: " + err));
    throw err;
  }
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

  console.log(chalkInfo("TWP | initTweetParserQueueInterval"
    + " | TWEET VERSION 2: " + cnf.tweetVersion2
    + " | " + cnf.updateInterval + " MS"
  ));

  clearInterval(tweetParserQueueInterval);

  let tweetParserQueueReady = true;

  const params = {};
  params.tweetVersion2 = cnf.tweetVersion2;
  params.globalTestMode = cnf.globalTestMode;
  params.testMode = cnf.testMode;
  params.inc = cnf.inc;

  const tweetObjMessage = {};
  tweetObjMessage.op = "PARSED_TWEET";
  tweetObjMessage.tweetObj = {};

  tweetParserQueueInterval = setInterval(async function(){

    if (tweetServerController && (tweetParserQueue.length > 0) && tweetParserQueueReady){

      tweetParserQueueReady = false;

      params.tweetStatus = tweetParserQueue.shift();

      debug("params.tweetStatus\n", params.tweetStatus)

      try{
        tweetObjMessage.tweetObj = await tweetServerController.createStreamTweetAsync(params);
        process.send(tweetObjMessage);
        tweetParserQueueReady = true;
      }
      catch(err){

        console.log(chalkError("TWP | *** CREATE STREAM TWEET ERROR: " + tcUtils.getTimeStamp()));
        console.log(chalkError("TWP | *** CREATE STREAM TWEET ERROR: ", err));

        process.send({op: "ERROR", err: err}, function(err){

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

      }
    }

  }, cnf.updateInterval);
}

process.on("message", function(m) {

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
      configuration.tweetVersion2 = m.tweetVersion2;

      console.log(chalkInfo("TWP | TWEET PARSER INIT"
        + " | TITLE: " + m.title
        + " | INTERVAL: " + m.interval
        + " | TWEET VERSION 2: " + m.tweetVersion2
      ));

      initTweetParserQueueInterval(configuration);
    break;

    case "PING":
      debug(chalkLog("TWP | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
    break;

    case "tweet":
      if (tweetParserQueue.length <= MAX_Q) {

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

    console.log("TWP | " + chalk.blue(configuration.processName + " STARTED "));

    statsObj.status = "START";

    try {
      global.dbConnection = await connectDb();
      process.send({ op: "READY"});
    }
    catch(err){
      console.log(chalkError("TWP | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
      quit("MONGO DB CONNECT ERROR");
    }

  }
  catch(err){
    console.log(chalkError("TWP | *** INIT TIMEOUT ERROR: " + err));
    quit();
  }
}, 1000);
