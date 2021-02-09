/*jslint node: true */
"use strict";

const compactDateTimeFormat = "YYYYMMDD HHmmss";

const moment = require("moment");

const debug = require("debug")("wa");

const os = require("os");

const chalk = require("chalk");

const chalkGreen = chalk.green;
const chalkInfo = chalk.gray;
const chalkError = chalk.bold.red;
const chalkLog = chalk.black;
let hostname = os.hostname();
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
process.title = "wa_node_sorter";
console.log("\n\n====================================================================================================\n" + "========================================= ***START*** ==============================================\n" + "====================================================================================================\n" + process.argv[1] + "\nPROCESS ID     " + process.pid + "\nPROCESS TITLE  " + process.title + "\n" + "====================================================================================================\n" + "========================================= ***START*** ==============================================\n" + "====================================================================================================\n\n");

const quit = function (message) {
  let msg;

  if (message) {
    msg = 1;
  }

  console.error(process.argv[1] + " | " + moment().format(compactDateTimeFormat) + " | SORTER: **** QUITTING" + " | CAUSE: " + message + " | PID: " + process.pid); // process.exit(1);

  process.exitCode = 1; // process.close(1);
};

process.on("SIGUSR2", function () {
  console.log(chalkError("SORTER EXIT SIGUSR2"));
  quit("SIGUSR2");
});
process.on("SIGHUP", function () {
  console.log(chalkError("SORTER EXIT SIGHUP"));
  quit("SIGHUP");
});
process.on("SIGINT", function () {
  console.log(chalkError("SORTER EXIT SIGINT"));
  quit("SIGINT");
});

if (debug.enabled) {
  console.log("SORTER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
} // ==================================================================
// FUNCTIONS
// ==================================================================


const sortedObjectValues = function (params) {
  return new Promise(function (resolve, reject) {
    const keys = Object.keys(params.obj);
    const sortedKeys = keys.sort(function (a, b) {
      const objA = params.obj[a];
      const objB = params.obj[b];
      return objB[params.sortKey] - objA[params.sortKey];
    });

    if (keys.length !== undefined) {
      resolve({
        nodeType: params.nodeType,
        sortKey: params.sortKey,
        sortedKeys: sortedKeys.slice(0, params.max)
      });
    } else {
      quit("SORTER sortedObjectValues ERR");
      reject(new Error("ERROR"));
    }
  });
};

const sendSorted = function (params) {
  return new Promise(function (resolve, reject) {
    process.send({
      op: "SORTED",
      nodeType: params.nodeType,
      sortKey: params.sortKey,
      sortedKeys: params.sortedKeys
    }, function (err) {
      if (err) {
        console.log(chalkError("!!! SORTER SEND ERR: " + err));
        reject(new Error("SEND KEYWORDS ERROR: " + err));
        quit("SORTER END KEYWORDS ERR: " + err);
      } else {
        resolve(params.sortedKeys.length);
      }
    });
  });
};

process.on("message", function (m) {
  debug(chalkInfo("SORTER RX MESSAGE" + " | OP: " + m.op // + "\n" + jsonPrint(m)
  ));
  let params = {};

  switch (m.op) {
    case "INIT":
      console.log(chalkLog("SORTER INIT | " + m.childId + " | TITLE: " + m.title));
      process.title = m.title;
      break;

    case "PING":
      debug(chalkLog("SORTER | PING" + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)));
      process.send({
        op: "PONG",
        pongId: m.pingId
      }, function (err) {
        if (err) {
          console.log(chalkError("!!! SORTER PONG SEND ERR: " + err));
          quit("SORTER PONG SEND ERR");
        }
      });
      break;

    case "SORT":
      params.nodeType = m.nodeType;
      params.sortKey = m.sortKey;
      params.obj = m.obj;
      params.max = m.max;
      debug(chalkGreen("SORTER SORT" + " | KEYS: " + Object.keys(m.obj).length));
      sortedObjectValues(params).then(sendSorted).then(function (response) {
        debug(chalkError("SORTER KEYS SENT: " + response));
      }, function (err) {
        console.log(chalkError("SORTER ERROR: " + err));
        quit("SORTER ERROR: " + err);
      });
      break;

    default:
      console.log(chalkError("UNKNOWN SORTER OP???" + " | " + m.op));
      process.send({
        error: "ERROR",
        message: "UNKNOWN SORTER OP" + m.op
      }, function (err) {
        if (err) {
          console.log(chalkError("!!! SORTER SEND ERR: " + err));
          quit("SORTER SEND ERR");
        }
      });
  }
});