/*ver 0.47*/

/*jslint node: true */
"use strict";

var stdin = {};
stdin.setRawMode = true;
var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";
var DEFAULT_CONFIG = {};
DEFAULT_CONFIG.cacheTtl = 60;
DEFAULT_CONFIG.stages = 3;
var config = DEFAULT_CONFIG;
var stagePipe = []; // 3 stages
// ==================================================================
// NODE MODULE DECLARATIONS
// ==================================================================

var S = require("string");

var os = require("os");

var config = require("./config/config");

var util = require("util");

var express = require("./config/express");

var mongoose = require("./config/mongoose");

var async = require("async");

var HashMap = require("hashmap").HashMap;

var NodeCache = require("node-cache");

var EventEmitter2 = require("eventemitter2").EventEmitter2;

var EventEmitter = require("events").EventEmitter;

var commandLineArgs = require("command-line-args");

var Dropbox = require("dropbox");

var chalk = require("chalk");

var chalkRedBold = chalk.bold.red;
var chalkRed = chalk.red;
var chalkGreen = chalk.green;
var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.yellow;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;
var chalkMeta = chalk.blue;
var chalkMetaBold = chalk.bold.blue;
var chalkTwitter = chalk.green;
var chalkTwitterBold = chalk.bold.green;
var chalkConnect = chalk.green;

var debug = require("debug")("tm");

var db = mongoose();

var wordServer = require("./app/controllers/word.server.controller");

var phraseCache = new NodeCache({
  stdTTL: DEFAULT_CONFIG.cacheTtl,
  checkperiod: 5
});

function quit() {
  console.log("\n... QUITTING ...");
  process.exit();
}

var jsonPrint = function (obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  }

  return "UNDEFINED";
};

console.log(process.argv[1] + " | PID: " + process.pid + "\nSTARTED " + Date());
process.on("message", function (msg) {
  if (msg === "shutdown") {
    console.log("\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n");
    setTimeout(function () {
      console.log("**** Finished closing connections ****\n\n ***** RELOADING twitterMetaTweetCrawler.js NOW *****\n\n");
      process.exit(0);
    }, 1500);
  }
});
var statsObj = {};
statsObj.restarts = 0;
statsObj.pid = process.pid;
statsObj.hostname = os.hostname();
statsObj.serverName = "PHRASE_" + os.hostname() + "_" + process.pid;
statsObj.errors = {};
statsObj.errors.db = {};
statsObj.words = {};
statsObj.words.totalWords = 0;
statsObj.words.wordsProcessed = 0;
statsObj.phrases = {};
statsObj.phrases.totalPhrases = {};
statsObj.phrases.prhasesProcessed = 0;
var configuration = {};
configuration.instanceId = process.env.PD_INSTANCE_ID || "00";
configuration.testMode = false;
var utilServer = process.env.UTIL_SERVER || "http://localhost:9997/util";
var socket;
socket = require("socket.io-client")(utilServer);
var serverConnected = false;

function newWord(word, callback) {
  stagePipe.push(word);
  if (stagePipe.length > DEFAULT_CONFIG.stages) stagePipe.shift();

  if (stagePipe.length == DEFAULT_CONFIG.stages) {
    var key = stagePipe.join('');
    phraseCache.set(key, phraseCache.get(key) == 'undefined' ? 1 : phraseCache.get(key) + 1);
  }
}

function initSocketHandlers() {
  socket.on("reconnect_attempt", function () {
    console.log(chalkConnect("!!! RECONNECT ATTEMPT UTIL SERVER" + " | " + getTimeStamp() + " | " + socket.id));
  });
  socket.on("reconnect_error", function () {
    console.log(chalkConnect("!!! RECONNECT ERROR UTIL SERVER" + " | " + getTimeStamp() + " | " + socket.id));
  });
  socket.on("reconnect_failed", function () {
    console.log(chalkConnect("*** RECONNECT FAILED UTIL SERVER" + " | " + getTimeStamp() + " | " + socket.id));
  });
  socket.on("disconnect", function (errorObj) {
    console.log(chalkConnect("*** DISCONNECT UTIL SERVER" + " | " + getTimeStamp() + " | " + socket.id + JSON.stringify(errorObj, null, 3)));
  });
  socket.on("connect_error", function (errorObj) {
    console.error(chalkError("\n*** UTIL SERVER CONNECT ERROR: " + " | " + getTimeStamp() + jsonPrint(errorObj)));
  });
}

if (socket) {
  socket.on("connect", function () {
    serverConnected = true;
    console.log("CONNECTED TO HOST" + " | SERVER: " + utilServer + " | ID: " + socket.id);
    socket.emit("SERVER_READY", {
      serverId: socket.id,
      serverName: statsObj.serverName,
      serverType: "PHRASE"
    });
    initSocketHandlers();
  });
}

if (debug.enabled) {
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

debug("NODE_ENV BEFORE: " + process.env.NODE_ENV);
process.env.NODE_ENV = process.env.NODE_ENV || "development";
console.log("NODE_ENV : " + process.env.NODE_ENV);
var enableStdin = {
  name: "enableStdin",
  alias: "i",
  type: Boolean,
  defaultValue: true
};
var quitOnError = {
  name: "quitOnError",
  alias: "q",
  type: Boolean,
  defaultValue: true
};
var instance = {
  name: "instance",
  alias: "n",
  type: String
};
var optionDefinitions = [enableStdin, quitOnError, instance];
var commandLineConfig = commandLineArgs(optionDefinitions);
console.log(chalkInfo("COMMAND LINE CONFIG\n" + jsonPrint(commandLineConfig))); // ==================================================================
// DROPBOX
// ==================================================================

var DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
var DROPBOX_PD_CONFIG_FILE = process.env.DROPBOX_PD_CONFIG_FILE || "prhasesDetector.json";
var dropboxConfigFile = "/config/" + os.hostname() + "_" + DROPBOX_PD_CONFIG_FILE;
var statsFile;
var dropboxClient = new Dropbox({
  accessToken: DROPBOX_ACCESS_TOKEN
});
var app = express();
process.on('SIGINT', function () {
  console.log(chalkAlert("*** SIGINT | SHUTTING DOWN | " + getTimeStamp()));
  socket.close();
  setTimeout(function () {
    // 300ms later the process kill it self to allow a restart
    process.exit(0);
  }, 300);
});

function msToTime(duration) {
  // var milliseconds = parseInt((duration % 1000)/100, 10);
  var seconds = parseInt(duration / 1000 % 60, 10);
  var minutes = parseInt(duration / (1000 * 60) % 60, 10);
  var hours = parseInt(duration / (1000 * 60 * 60) % 24, 10);
  var days = parseInt(duration / (1000 * 60 * 60 * 24), 10);
  days = days < 10 ? "0" + days : days;
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  return days + " D " + hours + ":" + minutes + ":" + seconds;
}

function msToMinutes(duration) {
  var minutes = parseInt(duration / (1000 * 60) % 60, 10);
  return minutes;
}

function getTimeNow() {
  var d = new Date();
  return d.getTime();
}

function getTimeStamp(inputTime) {
  var currentTimeStamp;

  if (typeof inputTime === "undefined") {
    currentTimeStamp = moment.utc();
  } else if (moment.isMoment(inputTime)) {
    currentTimeStamp = moment.utc(inputTime);
  } else if (moment.utc(new Date(parseInt(inputTime, 10))).isValid()) {
    currentTimeStamp = moment.utc(new Date(parseInt(inputTime, 10)));
  } else if (moment.utc(new Date(inputTime)).isValid()) {
    currentTimeStamp = moment.utc(new Date(inputTime));
  }

  return currentTimeStamp.format("YYYY-MM-DD HH:mm:ss ZZ");
}

function showConfig(cnf) {
  console.log(chalkRed("\n====================================\nCONFIGURATION\n"));
  var configArgs = Object.keys(cnf);
  configArgs.forEach(function (arg) {
    switch (arg) {
      default:
        console.log(chalkRed(arg + ": " + cnf[arg]));
        break;
    }
  });
  console.log(chalkRed("====================================\n"));
}

function showStats(options) {
  if (options) {
    console.log("STATS\n" + jsonPrint(statsObj));
  } else {
    console.log(chalkLog("STATS" + "\n START:   " + moment.utc(statsObj.runstartSearchTime).format(defaultDateTimeFormat) + "\n NOW:     " + getTimeStamp() + "\n ELAPSED: " + statsObj.elapsed));
  }
}

socket.on("reconnect", function () {
  console.log(chalkConnect("RECONNECTED TO HOST" + " | " + getTimeStamp() + " | SERVER: " + utilServer + " | ID: " + socket.id));
  serverConnected = true;
  initSocketHandlers();
});

function loadConfig(file, callback) {
  dropboxClient.filesDownload({
    path: file
  }).then(function (data) {
    console.log(chalkLog(getTimeStamp() + " | LOADING CONFIG FROM DROPBOX FILE: " + file));
    var payload = data.fileBinary;
    console.log(payload);
    var configObj = JSON.parse(payload);
    return callback(null, configObj);
  }).catch(function (error) {
    console.log(chalkAlert("DROPBOX loadConfig ERROR: " + file + "\n" + error));
    console.log(chalkError("!!! DROPBOX READ " + file + " ERROR"));
    console.log(chalkError(jsonPrint(error)));

    if (error["status"] === 404) {
      console.error(chalkError("!!! DROPBOX READ CONFIG FILE " + file + " NOT FOUND ... SKIPPING ..."));
      return callback(null, null);
    }

    if (error["status"] === 0) {
      console.error(chalkError("!!! DROPBOX NO RESPONSE ... NO INTERNET CONNECTION? ... SKIPPING ..."));
      return callback(null, null);
    }

    return callback(error, null);
  });
}

function loadStats(file, callback) {
  console.log(chalkInfo("LOAD STATS FILE: " + file));
  jsonfile.readFile(file, function (err, sObj) {
    if (err) {
      console.error(chalkError("!!! READ STATS FILE " + file + " ERROR ... SKIPPING ...\n" + err));
      return callback(err, null);
    } else {
      console.log(chalkLog(getTimeStamp() + " | LOADING STATUS FROM FILE: " + file + "\n" + jsonPrint(sObj)));
      return callback(null, sObj);
    }
  });
}

function saveStats(file, sObj, callback) {
  if (!sObj || typeof sObj === 'undefined') {
    console.log(chalkError("*** ERROR saveStats STATS OBJECT UNDEFINED"));
    return callback("*** ERROR saveStats STATS OBJECT UNDEFINED", null);
  }

  console.log(chalkAlert("saveStats" + " | " + file // + "\n" + jsonPrint(sObj)
  ));
  jsonfile.writeFile(file, sObj, {
    spaces: 2
  }, function (err) {
    if (err) {
      return callback(err);
    } else {
      return callback(null);
    }
  });
}

function initStatsUpdate(cnfInput, callback) {
  clearInterval(statsUpdateInterval);
  console.log(chalkAlert("INIT STATS UPDATE"));
  showConfig(cnfInput);
  statsObj.elapsed = msToTime(moment.utc().valueOf() - statsObj.runstartSearchTime.valueOf());
  statsObj.timeStamp = moment.utc().format(defaultDateTimeFormat);
  statsUpdateInterval = setInterval(function () {
    statsObj.elapsed = msToTime(moment.utc().valueOf() - statsObj.runstartSearchTime.valueOf());
    statsObj.timeStamp = moment.utc().format(defaultDateTimeFormat);
    saveStats(statsFile, statsObj, function (err) {
      if (err) {
        console.log(chalkError("*** SAVE STATS ERROR\n" + err));
      }

      showStats();
    });
  }, cnfInput.statsUpdateIntervalTime);
  loadStats(statsFile, function (err, loadedStatsObj) {
    if (!err) {} else {}
  });
}

function initStdIn(cnf) {
  console.log("STDIN ENABLED");
  stdin = process.stdin;

  if (typeof stdin.setRawMode !== "undefined") {
    stdin.setRawMode(true);
  }

  stdin.resume();
  stdin.setEncoding("utf8");
  stdin.on("data", function (key) {
    switch (key) {
      case "\u0003":
        process.exit();
        break;

      case "q":
        quit();
        break;

      case "s":
        showStats();
        break;

      case "S":
        showStats(true);
        break;

      default:
        // console.log("KEY: " +q key);
        console.log("\n" + "q: quit" + "\n" + "s: showStats" + "\n" + "S: showStats raw");
        break;
    }
  });
}

function initCommandLineArgs(cnfInput, callback) {
  var commandLineArgArray = Object.keys(commandLineConfig);
  commandLineArgArray.forEach(function (arg) {
    cnfInput[arg] = commandLineConfig[arg];
    console.log("--> COMMAND LINE CONFIG | " + arg + ": " + cnfInput[arg]);
  });
  showConfig(cnfInput);
  return callback(cnfInput);
}

function initializeMain(cnf, callback) {
  console.log(chalkAlert("INITIALIZE MAIN "));
  showConfig(cnf);

  if (debug.enabled) {
    console.log("\n%%%%%%%%%%%%%%\n DEBUG ENABLED \n%%%%%%%%%%%%%%\n");
  } // cnf.instanceId = process.env.TMTC_INSTANCE_ID || "00";


  cnf.processName = process.env.PD_PROCESS_NAME || "phraseDetector";
  cnf.quitOnError = process.env.PD_QUIT_ON_ERROR || true;
  cnf.enableStdin = process.env.PD_ENABLE_STDIN || true;
  cnf.statsUpdateIntervalTime = process.env.PD_STATS_UPDATE_INTERVAL || 60000;
  loadConfig(dropboxConfigFile, function (err, loadedConfigObj) {
    if (!err) {
      console.log(chalkInfo("LOADED DROPBOX CONFIG: " + dropboxConfigFile));
      console.log(dropboxConfigFile + "\n" + jsonPrint(loadedConfigObj)); // OVERIDE CONFIG WITH COMMAND LINE ARGS

      cnf.note = "loadConfig return";
      showConfig(cnf);

      if (cnf.enableStdin) {
        initStdIn(cnf);
      }

      initCommandLineArgs(cnf, function (cnf2) {
        cnf2.note = "initCommandLineArgs return";
        showConfig(cnf2);
        initStatsUpdate(cnf2, function (err) {
          cnf2.note = "initStatsUpdate return";
          console.log(chalkInfo("INIT STATS UPDATE COMPLETE | " + dropboxConfigFile));
          return callback(err, cnf2);
        });
      });
    } else {
      if (err["status"] === 0) {
        console.warn(chalkWarn("\nCONFIG FILE NOT LOADED: NO INTERNET?  ... USING DEFAULTS ...\n"));
      } else if (err["status"] === 404 || err["status"] === 409) {
        console.warn(chalkWarn("\nCONFIG FILE NOT FOUND ... USING DEFAULTS ...\n"));
      } else {
        console.error(chalkError("\n*** INITIALIZE ERROR\n" + jsonPrint(err)));
      } // OVERIDE CONFIG WITH COMMAND LINE ARGS


      if (cnf.enableStdin) {
        initStdIn(cnf);
      }

      initCommandLineArgs(cnf, function (cnf2) {
        cnf2.note = "initCommandLineArgs return";
        showConfig(cnf2);
        initMetaSpanObjects();
        initStatsUpdate(cnf2, function (err) {
          cnf2.note = "initStatsUpdate return2";
          console.log(chalkInfo("INIT STATS UPDATE COMPLETE | " + dropboxConfigFile));
          return callback(err, cnf2);
        });
      });
    }
  });
}

if (!initializeCompleteFlag) {
  console.log(chalkAlert("... INITIALIZING | COMPLETE FLAG: " + initializeCompleteFlag));
  showConfig(configuration);
  initializeMain(configuration, function (err, cnf) {
    if (err && err.status != 0 && err.status != 404) {
      console.error(chalkError("***** INIT ERROR *****\n" + jsonPrint(err)));
      console.log("err.status: " + err.status);
      quit("INIT ERROR\n" + err.status);
    } else {
      console.log(chalkRed("END INIT MAIN | CONFIGURATION"));
      showConfig(cnf);
      initializeCompleteFlag = true;
    }
  });
}