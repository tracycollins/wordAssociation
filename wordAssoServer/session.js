/* jshint undef: true, unused: true */
/* globals
CustomEvent,
ViewTreepack, 
clearTimeout,
setTimeout, 
setInterval, 
window, 
document, 
console, 
store, 
io, 
requirejs, 
moment,
clearInterval,
HashMap,
Element,
async, 
ProgressBar 
*/

"use strict";

const STORED_CONFIG_VERSION = 0.01;
const DEFAULT_USE_STORED_CONFIG = true;
const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
const LOCAL_SOURCE = "http://localhost:9997";

var DEFAULT_ZOOM_FACTOR = 0.75;

var DEFAULT_METRIC_MODE = "rate";
var DEFAULT_MAX_NODES = 50;
var DEFAULT_MAX_AGE = 15000;

var TREEMAP_MAX_NODES = 50;
var TREEMAP_MAX_AGE = 15000;

var TREEPACK_MAX_NODES = 50;
var TREEPACK_MAX_AGE = 15000;

var DEFAULT_AGE_RATE = 1.0;

var DEFAULT_TRANSITION_DURATION = 40;
var DEFAULT_CHARGE = -50;
var DEFAULT_GRAVITY = 0.001;
var DEFAULT_FORCEX_MULTIPLIER = 25.0;
var DEFAULT_FORCEX_SESSION_MULTIPLIER = 50.0;
var DEFAULT_FORCEY_MULTIPLIER = 25.0;
var DEFAULT_NODE_RADIUS_MIN_RATIO = 0.01;
var DEFAULT_NODE_RADIUS_MAX_RATIO = 0.15;
var DEFAULT_VELOCITY_DECAY = 0.35;
var DEFAULT_LINK_DISTANCE = 100.0;
var DEFAULT_LINK_STRENGTH = 0.5;
var DEFAULT_COLLISION_RADIUS_MULTIPLIER = 1.0;
var DEFAULT_COLLISION_ITERATIONS = 1;
var DEFAULT_FONT_SIZE_MIN = 16;
var DEFAULT_FONT_SIZE_MAX = 60;

var DEFAULT_FONT_SIZE_MIN_RATIO = 0.02;
var DEFAULT_FONT_SIZE_MAX_RATIO = 0.05;
var DEFAULT_FONT_SIZE_TOPTERM_RATIO = 0.026;

var DEFAULT_NODE_RADIUS = 20.0;

const DEFAULT_SOURCE = REPLACE_SOURCE;

var DEFAULT_AUTH_URL = "http://word.threeceelabs.com/auth/twitter";

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;

const DEFAULT_KEEPALIVE_INTERVAL = ONE_MINUTE;

// var serverHeartbeatTimeoutFlag = false;
// var serverHeartbeatTimeoutPeriod = 5*ONE_MINUTE;
var serverCheckInterval = 5 * ONE_MINUTE;

var MAX_RX_QUEUE = 250;

var MAX_READY_ACK_WAIT_COUNT = 10;

var config = {};
var previousConfig = {};

config.keepaliveInterval = DEFAULT_KEEPALIVE_INTERVAL;

config.displayNodeHashMap = {};
config.displayNodeHashMap.emoji = "hide";
config.displayNodeHashMap.hashtag = "show";
config.displayNodeHashMap.place = "hide";
config.displayNodeHashMap.url = "hide";
config.displayNodeHashMap.user = "show";
config.displayNodeHashMap.word = "hide";
config.viewerReadyInterval = 10000;

var statsObj = {};

statsObj.bestNetwork = {};
statsObj.bestNetwork.networkId = "";
statsObj.bestNetwork.successRate = 0;
statsObj.bestNetwork.matchRate = 0;
statsObj.bestNetwork.overallMatchRate = 0;
statsObj.bestNetwork.inputsId = "";
statsObj.bestNetwork.numInputs = 0;

statsObj.isAuthenticated = false || LOCAL_SOURCE === DEFAULT_SOURCE;
statsObj.maxNodes = 0;
statsObj.maxNodeAddQ = 0;
statsObj.serverConnected = false;

statsObj.socket = {};

statsObj.socket.errors = 0;
statsObj.socket.error = false;

statsObj.socket.connected = true;
statsObj.socket.connects = 0;
statsObj.socket.reconnects = 0;

var RX_NODE_QUEUE_INTERVAL = 5;
var RX_NODE_QUEUE_MAX = 100;

var STATS_UPDATE_INTERVAL = 1000;

function jsonPrint(obj) {
  if (obj || obj === 0) {
    return JSON.stringify(obj, null, 2);
  } else {
    return "UNDEFINED";
  }
}

var randomIntFromInterval = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

var randomId = randomIntFromInterval(1000000000, 9999999999);
var VIEWER_ID = "viewer_" + randomId;

var DEFAULT_VIEWER_OBJ = {
  nodeId: VIEWER_ID,
  userId: VIEWER_ID,
  viewerId: VIEWER_ID,
  screenName: VIEWER_ID,
  type: "viewer",
  namespace: "view",
  timeStamp: Date.now(),
  tags: {},
};

DEFAULT_VIEWER_OBJ.tags.type = "viewer";
DEFAULT_VIEWER_OBJ.tags.mode = "stream";
DEFAULT_VIEWER_OBJ.tags.entity = VIEWER_ID;

var viewerObj = {};
viewerObj = DEFAULT_VIEWER_OBJ;

console.log("viewerObj\n" + jsonPrint(viewerObj));

var loginCallBack = function () {
  console.log("LOGIN CALL BACK");
};

var twitterUserThreecee = {
  nodeId: "14607119",
  // userId : "14607119",
  profileImageUrl:
    "http://pbs.twimg.com/profile_images/780466729692659712/p6RcVjNK.jpg",
  profileUrl: "http://twitter.com/threecee",
  url: "http://threeCeeMedia.com",
  name: "Tracy Collins",
  screenName: "threecee",
  nodeType: "user",
  threeceeFollowing: "altthreecee00",
  following: true,
  ignored: false,
  description: "photography + animation + design",
  isTwitterUser: true,
  screenNameLower: "threecee",
  categoryVerified: true,
  category: "left",
};

var PARENT_ID = "0047";

var storedConfigName;
var storedConfig;

var PAGE_LOAD_TIMEOUT = 1000;

var DEFAULT_FORCEVIEW_MODE = "web";
var DEFAULT_SESSION_VIEW = "treepack";

var useStoredConfig = DEFAULT_USE_STORED_CONFIG;
var globalStoredConfigName = "config_" + DEFAULT_SESSION_VIEW;

var d3;
var controlPanel;
var controlPanelWindow;
var controlPanelFlag = false;

requirejs(
  ["https://d3js.org/d3.v6.min.js"],
  function (d3Loaded) {
    console.log("d3 LOADED");
    d3 = d3Loaded;
    initialize(function () {
      PARENT_ID = config.sessionViewType;

      addControlButton();
      addLoginButton();
      addStatsButton();
      addFullscreenButton();
      addMetricButton();
      addCategoryButton();
      resetMouseMoveTimer();

      document.addEventListener(
        "mousemove",
        function () {
          if (currentSessionView) {
            if (config.pauseOnMouseMove) {
              currentSessionView.simulationControl("PAUSE");
            }
            mouseMovingFlag = true;
            currentSessionView.mouseMoving(true);
            displayStats(true, palette.white);
            displayControl(true);
            resetMouseMoveTimer();
          }
        },
        true
      );

      document.addEventListener(
        "panzoomEvent",
        function () {
          if (currentSessionView) {
            config.panzoomTransform = currentSessionView.getPanzoomTransform();
            saveConfig();
          }
        },
        true
      );
    });
  },
  function (error) {
    console.log("REQUIREJS ERROR handler", error);
    console.log(error.requireModules && error.requireModules[0]);
    console.log(error.message);
  }
);

var currentSessionView;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";

var pageLoadedTimeIntervalFlag = true;

var TREEPACK_DEFAULT = {};
TREEPACK_DEFAULT.ZOOOM_FACTOR = DEFAULT_ZOOM_FACTOR;
TREEPACK_DEFAULT.TRANSITION_DURATION = DEFAULT_TRANSITION_DURATION;
TREEPACK_DEFAULT.MAX_NODES = TREEPACK_MAX_NODES;
TREEPACK_DEFAULT.MAX_AGE = TREEPACK_MAX_AGE;
TREEPACK_DEFAULT.CHARGE = DEFAULT_CHARGE;
TREEPACK_DEFAULT.GRAVITY = DEFAULT_GRAVITY;
TREEPACK_DEFAULT.FORCEX_MULTIPLIER = DEFAULT_FORCEX_MULTIPLIER;
TREEPACK_DEFAULT.FORCEY_MULTIPLIER = DEFAULT_FORCEY_MULTIPLIER;
TREEPACK_DEFAULT.VELOCITY_DECAY = DEFAULT_VELOCITY_DECAY;
TREEPACK_DEFAULT.COLLISION_RADIUS_MULTIPLIER = DEFAULT_COLLISION_RADIUS_MULTIPLIER;
TREEPACK_DEFAULT.COLLISION_ITERATIONS = DEFAULT_COLLISION_ITERATIONS;
TREEPACK_DEFAULT.FONT_SIZE_MIN_RATIO = DEFAULT_FONT_SIZE_MIN_RATIO;
TREEPACK_DEFAULT.FONT_SIZE_MAX_RATIO = DEFAULT_FONT_SIZE_MAX_RATIO;
TREEPACK_DEFAULT.NODE_RADIUS_MIN_RATIO = DEFAULT_NODE_RADIUS_MIN_RATIO;
TREEPACK_DEFAULT.NODE_RADIUS_MAX_RATIO = DEFAULT_NODE_RADIUS_MAX_RATIO;

config.twitterUser = {};
config.twitterUser.userId = "";
config.fullscreenMode = false;

console.debug("LOADING STORED CONFIG: " + globalStoredConfigName);

storedConfig = store.get(globalStoredConfigName);

if (
  useStoredConfig &&
  storedConfig &&
  storedConfig.version === STORED_CONFIG_VERSION
) {
  config = storedConfig;
  config.fullscreenMode = false;
  config.pauseFlag = false;
  config.pauseOnMouseMove = true;
  if (config.authenticationUrl === undefined) {
    config.authenticationUrl = DEFAULT_AUTH_URL;
    config.twitterUser = {};
    config.twitterUser.userId = "";
  }
  if (config.twitterUser === undefined) {
    config.twitterUser = {};
    config.twitterUser.userId = "";
  }
  if (config.defaultNodeRadiusMinRatio === undefined) {
    config.defaultNodeRadiusMinRatio = DEFAULT_NODE_RADIUS_MIN_RATIO;
  }
  if (config.defaultNodeRadiusMaxRatio === undefined) {
    config.defaultNodeRadiusMaxRatio = DEFAULT_NODE_RADIUS_MAX_RATIO;
  }
} else {
  config.version = STORED_CONFIG_VERSION;
  config.authenticationUrl = DEFAULT_AUTH_URL;
  config.twitterUser = {};
  config.twitterUser.userId = "";
  config.autoCategoryFlag = false;
  config.metricMode = DEFAULT_METRIC_MODE;
  config.enableAgeNodes = true;
  config.defaultAgeRate = 1.0;
  config.forceViewMode = DEFAULT_FORCEVIEW_MODE;
  config.fullscreenMode = false;
  config.pauseOnMouseMove = true;
  config.showStatsFlag = false;
  config.pauseFlag = false;
  config.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??
  config.maxWords = 100;
  config.testMode = false;
  config.removeDeadNodesFlag = true;

  config.defaultZoomFactor = DEFAULT_ZOOM_FACTOR;
  config.defaultZoomInitialX = 100;
  config.defaultZoomInitialY = 100;

  config.defaultMaxNodes = DEFAULT_MAX_NODES;
  config.defaultTransitionDuration = DEFAULT_TRANSITION_DURATION;
  config.defaultMaxAge = DEFAULT_MAX_AGE;
  config.defaultMultiplier = 1000.0;
  config.defaultMetricMode = DEFAULT_METRIC_MODE;
  config.defaultCharge = DEFAULT_CHARGE;
  config.defaultGravity = DEFAULT_GRAVITY;
  config.defaultForceXmultiplier = DEFAULT_FORCEX_MULTIPLIER;
  config.defaultForceXsessionMultiplier = DEFAULT_FORCEX_SESSION_MULTIPLIER;
  config.defaultForceYmultiplier = DEFAULT_FORCEY_MULTIPLIER;
  config.defaultCollisionRadiusMultiplier = DEFAULT_COLLISION_RADIUS_MULTIPLIER;
  config.defaultCollisionIterations = DEFAULT_COLLISION_ITERATIONS;
  config.defaultLinkStrength = DEFAULT_LINK_STRENGTH;
  config.defaultLinkDistance = DEFAULT_LINK_DISTANCE;

  config.defaultNodeRadiusMinRatio = DEFAULT_NODE_RADIUS_MIN_RATIO;
  config.defaultNodeRadiusMaxRatio = DEFAULT_NODE_RADIUS_MAX_RATIO;
  config.defaultNodeRadius = DEFAULT_NODE_RADIUS;

  config.defaultVelocityDecay = DEFAULT_VELOCITY_DECAY;

  config.defaultFontSizeMinRatio = DEFAULT_FONT_SIZE_MIN_RATIO;
  config.defaultFontSizeMaxRatio = DEFAULT_FONT_SIZE_MAX_RATIO;
  config.defaultFontSizeTopTermRatio = DEFAULT_FONT_SIZE_TOPTERM_RATIO;

  if (config.sessionViewType === "ticker") {
    config.disableLinks = true;
  } else {
    config.disableLinks = false;
  }
}

var palette = {
  black: "#000000",
  white: "#FFFFFF",
  lightgray: "#819090",
  gray: "#708284",
  mediumgray: "#536870",
  // darkgray: "#475B62",
  darkgray: "#364A51",
  darkblue: "#0A2933",
  darkerblue: "#042029",
  paleryellow: "#FCF4DC",
  paleyellow: "#EAE3CB",
  yellow: "#A57706",
  orange: "#BD3613",
  red: "#D11C24",
  pink: "#C61C6F",
  purple: "#595AB7",
  blue: "#2176C7",
  green: "#25C286",
  lightgreen: "#35F096",
  yellowgreen: "#738A05",
};

var ignoreWordsArray = [
  "в",
  "e",
  "o",
  "del",
  "un",
  "en",
  "'",
  "-",
  "...",
  "a",
  "about",
  "across",
  "after",
  "all",
  "also",
  "an",
  "and",
  "ao",
  "aos",
  "applause",
  "are",
  "as",
  "at",
  "b",
  "be",
  "because",
  "been",
  "before",
  "being",
  "but",
  "by",
  "can",
  "can",
  "could",
  "could",
  "da",
  "day",
  "de",
  "did",
  "do",
  "dont",
  "e",
  "else",
  "em",
  "for",
  "from",
  "get",
  "go",
  "going",
  "had",
  "has",
  "hasnt",
  "have",
  "havent",
  "he",
  "her",
  "here",
  "him",
  "his",
  "how",
  "htt...",
  "i",
  "if",
  "im",
  "in",
  "into",
  "is",
  "isnt",
  "it",
  "its",
  "just",
  "less",
  "like",
  "lot",
  "m",
  "may",
  "me",
  "more",
  "my",
  "nas",
  "new",
  "no",
  "nos",
  "not",
  "of",
  "old",
  "on",
  "or",
  "os",
  "ou",
  "our",
  "out",
  "over",
  "rt",
  "s",
  "said",
  "say",
  "saying",
  "she",
  "should",
  "so",
  "some",
  "than",
  "that",
  "thats",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "though",
  "to",
  "too",
  "upon",
  "us",
  "ve",
  "want",
  "was",
  "wasnt",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "whose",
  "why",
  "will",
  "with",
  "wont",
  "would",
  "you",
  "your",
  "|",
  "é",
  "–",
];

ignoreWordsArray.push("'");
ignoreWordsArray.push("`");

var categoryColorHashMap = new HashMap();

categoryColorHashMap.set("positive", palette.green);
categoryColorHashMap.set("negative", palette.red);
categoryColorHashMap.set("neutral", palette.darkgray);
categoryColorHashMap.set("left", palette.blue);
categoryColorHashMap.set("right", palette.yellow);
categoryColorHashMap.set("none", palette.black);
categoryColorHashMap.set("auto", palette.white);

var monitorMode = false;

var socket = io("/view");

var seconds;
var minutes;
var hours;
var days;

function msToTime(duration) {
  seconds = parseInt((duration / 1000) % 60);
  minutes = parseInt((duration / (1000 * 60)) % 60);
  hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  days = parseInt(duration / (1000 * 60 * 60 * 24));

  days = days < 10 ? "0" + days : days;
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return days + ":" + hours + ":" + minutes + ":" + seconds;
}

function saveConfig() {
  storedConfigName = "config_" + config.sessionViewType;
  store.set(storedConfigName, config);
  console.debug("STORED CONFIG" + " | " + storedConfigName);
}

var controlDivElement = document.getElementById("controlDiv");
var statsDivElement = document.getElementById("statsDiv");
var statsText = document.getElementById("stats-text");

var statsLeftBarDiv = document.getElementById("left-bar");
var statsRightBarDiv = document.getElementById("right-bar");
var statsNeutralBarDiv = document.getElementById("neutral-bar");
var statsPositiveBarDiv = document.getElementById("positive-bar");
var statsNegativeBarDiv = document.getElementById("negative-bar");
var statsNoneBarDiv = document.getElementById("none-bar");

var statsLeftBar = new ProgressBar.Line(statsLeftBarDiv, { duration: 100 });
var statsRightBar = new ProgressBar.Line(statsRightBarDiv, { duration: 100 });
var statsNeutralBar = new ProgressBar.Line(statsNeutralBarDiv, {
  duration: 100,
});
var statsPositiveBar = new ProgressBar.Line(statsPositiveBarDiv, {
  duration: 100,
});
var statsNegativeBar = new ProgressBar.Line(statsNegativeBarDiv, {
  duration: 100,
});
var statsNoneBar = new ProgressBar.Line(statsNoneBarDiv, { duration: 100 });

statsLeftBar.animate(0);
statsLeftBar.path.setAttribute("stroke", palette.blue);

statsRightBar.animate(0);
statsRightBar.path.setAttribute("stroke", palette.yellow);

statsNeutralBar.animate(0);
statsNeutralBar.path.setAttribute("stroke", palette.gray);

statsPositiveBar.animate(0);
statsPositiveBar.path.setAttribute("stroke", palette.green);

statsNegativeBar.animate(0);
statsNegativeBar.path.setAttribute("stroke", palette.red);

statsNoneBar.animate(0);
statsNoneBar.path.setAttribute("stroke", palette.white);

function displayControl(isVisible) {
  controlDivElement.style.visibility = isVisible ? "visible" : "hidden";
  // topTermsDivElement.style.visibility = (isVisible) ? "visible" : "hidden";
}

var showPropArray = [
  "networkId",
  "successRate",
  "matchRate",
  "overallMatchRate",
  "numInputs",
  "inputsId",
];

function updateStatsText() {
  statsText.innerHTML = getTimeStamp() + "<br><hr><br>";

  Object.keys(statsObj.bestNetwork).forEach(function (key) {
    if (showPropArray.includes(key)) {
      switch (key) {
        case "networkId":
          statsText.innerHTML += statsObj.bestNetwork[key] + "<br><br><br>";
          break;
        case "successRate":
          if (typeof statsObj.bestNetwork[key] !== "number") {
            break;
          }
          statsText.innerHTML +=
            "SR: " + statsObj.bestNetwork[key].toFixed(2) + "%<br><br>";
          break;
        case "matchRate":
          if (typeof statsObj.bestNetwork[key] !== "number") {
            break;
          }
          statsText.innerHTML +=
            "MR: " + statsObj.bestNetwork[key].toFixed(2) + "%<br><br>";
          break;
        case "overallMatchRate":
          if (typeof statsObj.bestNetwork[key] !== "number") {
            break;
          }
          statsText.innerHTML +=
            "OAMR: " + statsObj.bestNetwork[key].toFixed(2) + "%<br><br>";
          break;

        case "seedNetworkRes":
          if (typeof statsObj.bestNetwork[key] !== "number") {
            break;
          }
          statsText.innerHTML +=
            "SN SR: " + statsObj.bestNetwork[key].toFixed(2) + "%<br><br>";
          break;

        default:
          statsText.innerHTML +=
            key.toUpperCase() + ": " + statsObj.bestNetwork[key] + "<br><br>";
      }
    }
  });
}

function displayStats(isVisible, dColor) {
  if (isVisible) {
    updateStatsText();
  }

  statsDivElement.style.visibility = isVisible ? "visible" : "hidden";
  if (dColor !== undefined) {
    statsDivElement.style.color = dColor;
  }
}

var mouseMoveTimeoutEventObj = new CustomEvent("mouseMoveTimeoutEvent");
var mouseMoveTimeout;
var mouseMovingFlag = false;
var mouseMoveTimeoutInterval = 2000;

function resetMouseMoveTimer() {
  clearTimeout(mouseMoveTimeout);

  mouseMoveTimeout = setTimeout(function () {
    mouseMovingFlag = false;
    displayControl(false);

    d3.select("body").style("cursor", "none");

    currentSessionView.toolTipVisibility(false);
    currentSessionView.mouseMoving(false);

    if (config.pauseOnMouseMove && !config.pauseFlag) {
      currentSessionView.simulationControl("RESUME");
    }

    if (!config.showStatsFlag && !pageLoadedTimeIntervalFlag) {
      displayStats(false, palette.white);
    }

    document.dispatchEvent(mouseMoveTimeoutEventObj);
  }, mouseMoveTimeoutInterval);
}

var serverActiveTimeoutEventObj = new CustomEvent("serverActiveTimeoutEvent");
var serverActiveTimeout;
var serverActiveFlag = false;
var serverActiveTimeoutInterval = 90 * ONE_SECOND;

function resetServerActiveTimer() {
  serverActiveFlag = true;
  if (currentSessionView !== undefined) {
    currentSessionView.setEnableAgeNodes(true);
  }

  clearTimeout(serverActiveTimeout);

  serverActiveTimeout = setTimeout(function () {
    serverActiveFlag = false;
    // if (currentSessionView !== undefined) { currentSessionView.setEnableAgeNodes(false); }

    document.dispatchEvent(serverActiveTimeoutEventObj);
  }, serverActiveTimeoutInterval);
}

window.onbeforeunload = function () {
  if (controlPanelFlag) {
    controlPanelWindow.close();
    clearInterval(controlPanelInitWaitInterval);
  }
  controlPanelFlag = false;
};

var controlPanelReadyFlag = false;

function createPopUpControlPanel(cnf, callback) {
  console.debug("createPopUpControlPanel");

  controlPanelWindow = window.open(
    DEFAULT_SOURCE + "/controlPanel.html",
    "CONTROL",
    "width=1200,height=800"
  );

  window.addEventListener("message", controlPanelComm, false);

  controlPanelWindow.addEventListener(
    "beforeunload",
    function () {
      console.log("CONTROL POP UP CLOSING...");
      controlPanelFlag = false;
      updateControlButton(controlPanelFlag);
    },
    false
  );

  controlPanelWindow.addEventListener(
    "load",
    function (cnf) {
      controlPanel = new controlPanelWindow.ControlPanel(cnf);
      controlPanelFlag = true;
      callback();
    },
    false
  );
}

var controlPanelInitWaitInterval;

function toggleControlPanel() {
  console.warn("toggleControlPanel config");

  if (controlPanelFlag) {
    clearInterval(controlPanelInitWaitInterval);
    controlPanelWindow.close();
    controlPanelFlag = false;
    controlPanelReadyFlag = false;
    updateControlButton(controlPanelFlag);
    console.debug("toggleControlPanel: " + controlPanelFlag);
  } else {
    createPopUpControlPanel(config, function () {
      clearInterval(controlPanelInitWaitInterval);

      console.warn(
        "createPopUpControlPanel toggleControlPanel: " + controlPanelFlag
      );

      controlPanelInitWaitInterval = setInterval(function () {
        if (controlPanelReadyFlag) {
          clearInterval(controlPanelInitWaitInterval);

          updateControlButton(controlPanelFlag);

          console.debug("TX> CONTROL PANEL INIT | SOURCE: " + DEFAULT_SOURCE);

          // doesn't like momment in config.VIEWER_OBJ in postMessage
          var cf = config;
          delete cf.VIEWER_OBJ;

          controlPanelWindow.postMessage(
            { op: "INIT", config: cf },
            DEFAULT_SOURCE
          );
        }
      }, 1000);
    });
  }
}

function updateControlButton(controlPanelFlag) {
  document.getElementById("controlPanelButton").innerHTML = controlPanelFlag
    ? "HIDE CONTROL"
    : "SHOW CONTROL";
}

function addControlButton() {
  controlDivElement.style.visibility = "hidden";
  var controlPanelButton = document.createElement("BUTTON");
  controlPanelButton.className = "button";
  controlPanelButton.setAttribute("id", "controlPanelButton");
  controlPanelButton.setAttribute("onclick", "toggleControlPanel()");
  controlPanelButton.innerHTML = controlPanelFlag
    ? "HIDE CONTROL"
    : "SHOW CONTROL";
  controlDivElement.appendChild(controlPanelButton);
}

function addCategoryButton() {
  var categoryButton = document.createElement("BUTTON");
  categoryButton.className = "button";
  categoryButton.setAttribute("id", "categoryButton");
  categoryButton.setAttribute("onclick", "toggleAutoCategory()");
  categoryButton.innerHTML = config.autoCategoryFlag
    ? "AUTO CATEGORY"
    : "MANUAL CATEGORY";
  controlDivElement.appendChild(categoryButton);
}

function updateCategoryButton() {
  document.getElementById("categoryButton").innerHTML = config.autoCategoryFlag
    ? "AUTO CATEGORY"
    : "MANUAL CATEGORY";
}

function updateMetricButton() {
  document.getElementById("metricButton").innerHTML =
    config.metricMode.toUpperCase() + " RADIUS";
}

function addMetricButton() {
  var metricButton = document.createElement("BUTTON");
  if (config.metricMode === undefined) {
    config.metricMode = "rate";
  }
  metricButton.className = "button";
  metricButton.setAttribute("id", "metricButton");
  metricButton.setAttribute("onclick", "toggleMetric()");
  metricButton.innerHTML = config.metricMode.toUpperCase() + " RADIUS";
  controlDivElement.appendChild(metricButton);
}

function updateLoginButton() {
  document.getElementById("loginButton").innerHTML = statsObj.isAuthenticated
    ? "LOG OUT"
    : "LOG IN";
}

function login() {
  console.warn(
    "LOGIN: AUTH: " +
      statsObj.isAuthenticated +
      " | URL: " +
      config.authenticationUrl
  );
  window.open(config.authenticationUrl, "LOGIN", "_new");
  socket.emit("login", viewerObj);
}

function addLoginButton() {
  var loginButton = document.createElement("BUTTON");
  loginButton.className = "button";
  loginButton.setAttribute("id", "loginButton");
  loginButton.setAttribute("onclick", "login()");
  loginButton.innerHTML = statsObj.isAuthenticated ? "LOG OUT" : "LOG IN";
  controlDivElement.appendChild(loginButton);
}

function updateStatsButton() {
  document.getElementById("statsButton").innerHTML = config.showStatsFlag
    ? "HIDE STATS"
    : "STATS";
}

function addStatsButton() {
  var statsButton = document.createElement("BUTTON");
  statsButton.className = "button";
  statsButton.setAttribute("id", "statsButton");
  statsButton.setAttribute("onclick", "toggleStats()");
  statsButton.innerHTML = config.showStatsFlag ? "HIDE STATS" : "STATS";
  controlDivElement.appendChild(statsButton);
}

function updateFullscreenButton() {
  document.getElementById("fullscreenButton").innerHTML = config.fullscreenMode
    ? "EXIT FULLSCREEN"
    : "FULLSCREEN";
}

function addFullscreenButton() {
  var fullscreenButton = document.createElement("BUTTON");
  fullscreenButton.className = "button";
  fullscreenButton.setAttribute("id", "fullscreenButton");
  fullscreenButton.setAttribute("onclick", "toggleFullScreen()");
  fullscreenButton.innerHTML = config.fullscreenMode
    ? "EXIT FULLSCREEN"
    : "FULLSCREEN";
  controlDivElement.appendChild(fullscreenButton);
}

var configUpdateTimeOut;
var configUpdateTimeOutInverval = 3000;

function resetConfigUpdateTimeOut() {
  storedConfigName = "config_" + config.sessionViewType;

  clearTimeout(configUpdateTimeOut);

  configUpdateTimeOut = setTimeout(function () {
    console.debug("STORE CONFIG");
    saveConfig();
  }, configUpdateTimeOutInverval);
}

function controlPanelComm(event) {
  console.debug("CONTROL PANEL: " + event.origin); // prints: { message: "Hello world!"}

  if (event.data === "DisableHTML5Autoplay_Initialize") {
    console.info(
      "RX> CONTROL PANEL | DisableHTML5Autoplay_Initialize ... IGNORING ..."
    );
    return;
  }

  switch (event.data.op) {
    case "READY":
      console.warn("R< CONTROL PANEL READY");
      controlPanelReadyFlag = true;
      break;

    case "FOLLOW":
      console.warn(
        "R< CONTROL FOLLOW" +
          " | NID: " +
          event.data.user.nodeId +
          " | @" +
          event.data.user.screenName
      );
      socket.emit("TWITTER_FOLLOW", event.data.user);
      break;

    case "UNFOLLOW":
      console.warn(
        "R< CONTROL UNFOLLOW" +
          " | UID: " +
          event.data.user.nodeId +
          " | @" +
          event.data.user.screenName
      );
      socket.emit("TWITTER_UNFOLLOW", event.data.user);
      break;

    case "CAT VERIFIED":
      console.warn(
        "R< CONTROL CATEGORY_VERIFIED" +
          " | UID: " +
          event.data.user.nodeId +
          " | @" +
          event.data.user.screenName
      );
      socket.emit("TWITTER_CATEGORY_VERIFIED", event.data.user);
      break;

    case "CAT UNVERIFIED":
      console.warn(
        "R< CONTROL CATEGORY_UNVERIFIED" +
          " | UID: " +
          event.data.user.nodeId +
          " | @" +
          event.data.user.screenName
      );
      socket.emit("TWITTER_CATEGORY_UNVERIFIED", event.data.user);
      break;

    case "BOT":
      console.warn(
        "R< CONTROL BOT" +
          " | UID: " +
          event.data.user.nodeId +
          " | @" +
          event.data.user.screenName
      );
      socket.emit("TWITTER_BOT", event.data.user);
      break;

    case "UNBOT":
      console.warn(
        "R< CONTROL UNBOT" +
          " | UID: " +
          event.data.user.nodeId +
          " | @" +
          event.data.user.screenName
      );
      socket.emit("TWITTER_UNBOT", event.data.user);
      break;

    case "IGNORE":
      console.warn(
        "R< CONTROL IGNORE" +
          " | UID: " +
          event.data.user.nodeId +
          " | @" +
          event.data.user.screenName
      );
      socket.emit("TWITTER_IGNORE", event.data.user);
      break;

    case "UNIGNORE":
      console.warn(
        "R< CONTROL UNIGNORE" +
          " | UID: " +
          event.data.user.nodeId +
          " | @" +
          event.data.user.screenName
      );
      socket.emit("TWITTER_UNIGNORE", event.data.user);
      break;

    case "NODE_SEARCH":
      console.warn("R< CONTROL NODE_SEARCH\n" + jsonPrint(event.data.input));
      socket.emit("TWITTER_SEARCH_NODE", event.data.input);
      break;

    case "CLOSE":
      console.warn("R< CONTROL PANEL CLOSING...");
      resetConfigUpdateTimeOut();
      break;

    case "MOMENT":
      console.warn("R< CONTROL PANEL MOMENT...");
      switch (event.data.id) {
        case "resetButton":
          reset();
          break;
        default:
          console.error("CONTROL PANEL UNKNOWN MOMENT BUTTON");
      }
      break;

    case "TOGGLE":
      console.warn("R< CONTROL PANEL TOGGLE");
      switch (event.data.id) {
        case "categoryAutoButton":
          toggleAutoCategory();
          break;
        case "metricToggleButton":
          toggleMetric();
          break;
        case "fullscreenToggleButton":
          toggleFullScreen();
          break;
        case "pauseToggleButton":
          togglePause();
          break;
        case "statsToggleButton":
          toggleStats();
          break;
        case "testModeToggleButton":
          toggleTestMode();
          break;
        case "removeDeadNodeToogleButton":
          toggleRemoveDeadNode();
          break;
        default:
          console.error(
            "CONTROL PANEL UNKNOWN TOGGLE BUTTON | ID: " + event.data.id
          );
      }
      resetConfigUpdateTimeOut();
      break;

    case "UPDATE":
      console.warn("R< CONTROL PANEL UPDATE");
      switch (event.data.id) {
        case "transitionDuration":
          currentSessionView.setTransitionDuration(event.data.value);
          config.defaultTransitionDuration = event.data.value;
          break;
        case "velocityDecay":
          currentSessionView.setVelocityDecay(event.data.value);
          break;
        case "gravity":
          currentSessionView.setGravity(event.data.value);
          break;
        case "charge":
          currentSessionView.setCharge(event.data.value);
          break;
        case "maxAge":
          currentSessionView.setNodeMaxAge(event.data.value);
          break;
        case "maxNodes":
          currentSessionView.setMaxNodesLimit(event.data.value);
          break;
        case "fontSizeRatioMin":
          currentSessionView.setFontSizeRatioMin(event.data.value);
          break;
        case "fontSizeRatioMax":
          currentSessionView.setFontSizeRatioMax(event.data.value);
          break;
        case "nodeRadiusRatioMin":
          currentSessionView.setNodeRadiusRatioMin(event.data.value);
          break;
        case "nodeRadiusRatioMax":
          currentSessionView.setNodeRadiusRatioMax(event.data.value);
          break;
        default:
          console.error(
            "UNKNOWN CONTROL PANEL ID: " +
              event.data.id +
              "\n" +
              jsonPrint(event.data)
          );
      }
      resetConfigUpdateTimeOut();
      break;

    case "INIT":
      console.info("R< CONTROL PANEL LOOPBACK? | INIT ... IGNORING ...");
      break;

    case "CATEGORIZE":
      if (statsObj.isAuthenticated) {
        if (event.data.node.nodeType === "user") {
          console.info(
            "R< CONTROL PANEL CATEGORIZE" +
              " | " +
              event.data.node.nodeId +
              " | @" +
              event.data.node.screenName +
              " | C: " +
              event.data.category
          );
          socket.emit("TWITTER_CATEGORIZE_NODE", {
            twitterUser: config.twitterUser,
            category: event.data.category,
            following: true,
            node: event.data.node,
          });
        } else if (event.data.node.nodeType === "hashtag") {
          console.info(
            "R< CONTROL PANEL CATEGORIZE" +
              " | #" +
              event.data.node.nodeId +
              " | C: " +
              event.data.category
          );
          socket.emit("TWITTER_CATEGORIZE_NODE", {
            twitterUser: config.twitterUser,
            category: event.data.category,
            node: event.data.node,
          });
        }
      } else {
        console.debug(
          "R< CONTROL PANEL CATEGORIZE | NOT AUTHENTICATED !" +
            " | " +
            event.data.node.nodeId +
            " | @" +
            event.data.node.screenName +
            " | C: " +
            event.data.category
        );
        console.debug("... AUTHENTICATING ...");
        window.open(config.authenticationUrl, "_blank");
      }
      break;

    case "SET_TWITTER_USER":
      // console.info("R< CONTROL PANEL LOOPBACK? | SET_TWITTER_USER ... IGNORING ...");
      break;

    case "SET_TWITTER_HASHTAG":
      // console.info("R< CONTROL PANEL LOOPBACK? | SET_TWITTER_HASHTAG ... IGNORING ...");
      break;

    case "DISPLAY_NODE_TYPE":
      config.displayNodeHashMap[event.data.displayNodeType] = event.data.value;
      console.warn(
        "R<DISPLAY_NODE_TYPE | " +
          event.data.displayNodeType +
          " | " +
          event.data.value
      );
      console.warn(
        "config.displayNodeHashMap\n" + jsonPrint(config.displayNodeHashMap)
      );
      resetConfigUpdateTimeOut();
      break;

    default:
      if (event.data["twttr.button"] !== undefined) {
        console.log(
          "R< CONTROL PANEL TWITTER" + " | " + event.data["twttr.button"].method
        );
      } else if (event.data.settings !== undefined) {
        console.log(
          "R< CONTROL PANEL SETTINGS" + "\n" + jsonPrint(event.data.settings)
        );
      } else {
        console.warn(
          "R< ??? CONTROL PANEL OP UNDEFINED\n" + jsonPrint(event.data)
        );
      }
  }
}

function toggleShowNodeType(displayNodeType) {
  if (config.displayNodeHashMap[displayNodeType] === "show") {
    config.displayNodeHashMap[displayNodeType] = "hide";
  } else {
    config.displayNodeHashMap[displayNodeType] = "show";
  }
  currentSessionView.setMetricMode(config.metricMode);
  console.warn("SET RADIUS MODE: " + config.metricMode);
  updateMetricButton();
  if (controlPanelFlag) {
    controlPanel.updateControlPanel(config);
  }
}

function toggleMetric() {
  if (config.metricMode === "rate") {
    config.metricMode = "mentions";
  } else {
    config.metricMode = "rate";
  }
  currentSessionView.setMetricMode(config.metricMode);
  console.warn("SET RADIUS MODE: " + config.metricMode);
  updateMetricButton();
  if (controlPanelFlag) {
    controlPanel.updateControlPanel(config);
  }
}

function togglePause() {
  config.pauseFlag = !config.pauseFlag;
  currentSessionView.setPause(config.pauseFlag);
  console.warn("TOGGLE PAUSE: " + config.pauseFlag);
  controlPanel.updateControlPanel(config);
}

function toggleRemoveDeadNode() {
  config.removeDeadNodesFlag = !config.removeDeadNodesFlag;
  currentSessionView.setRemoveDeadNodesFlag(config.removeDeadNodesFlag);
  console.warn("TOGGLE REMOVE DEAD NODES: " + config.removeDeadNodesFlag);
  controlPanel.updateControlPanel(config);
}

function toggleAutoCategory() {
  config.autoCategoryFlag = !config.autoCategoryFlag;
  currentSessionView.setAutoCategoryFlag(config.autoCategoryFlag);
  console.warn("AUTO CATEGORY: " + config.autoCategoryFlag);

  updateCategoryButton();
  if (controlPanelFlag) {
    controlPanel.updateControlPanel(config);
  }
}

function toggleStats() {
  config.showStatsFlag = !config.showStatsFlag;
  console.warn("TOGGLE STATS: " + config.showStatsFlag);

  if (config.showStatsFlag) {
    displayStats(config.showStatsFlag);
  } else {
    displayStats(false, palette.white);
  }

  if (controlPanelFlag) {
    controlPanel.updateControlPanel(config);
  }
}

function toggleTestMode() {
  config.testMode = !config.testMode;
  config.testModeEnabled = config.testMode;
  console.warn("TEST MODE: " + config.testModeEnabled);
  currentSessionView.setTestMode(config.testModeEnabled);
  controlPanel.updateControlPanel(config);
}

var keysForSortedKeys = [];
function getSortedKeys(hmap, sortProperty) {
  hmap.forEach(function (value, key) {
    if (!value.isSessionNode) {
      keysForSortedKeys.push(key);
    }
  });
  return keysForSortedKeys.sort(function (a, b) {
    return hmap.get(b)[sortProperty] - hmap.get(a)[sortProperty];
  });
}

var optionsTimeStamp = {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
};

var currentDate;
var currentTime;

function getTimeStamp(inputTime) {
  if (inputTime === undefined) {
    currentDate = new Date().toDateString("en-US", optionsTimeStamp);
    currentTime = new Date().toTimeString("en-US", optionsTimeStamp);
  } else {
    currentDate = new Date(inputTime).toDateString("en-US", optionsTimeStamp);
    currentTime = new Date(inputTime).toTimeString("en-US", optionsTimeStamp);
  }
  return currentDate + " - " + currentTime;
}

function getBrowserPrefix() {
  // Check for the unprefixed property.
  // if ("hidden" in document) {
  if (document.hidden !== undefined) {
    return null;
  }
  // All the possible prefixes.
  var browserPrefixes = ["moz", "ms", "o", "webkit"];
  var prefix;

  browserPrefixes.forEach(function (p) {
    prefix = p + "Hidden";
    if (document[prefix] !== undefined) {
      return p;
    }
  });

  // The API is not supported in browser.
  return null;
}

function hiddenProperty(prefix) {
  if (prefix) {
    return prefix + "Hidden";
  } else {
    return "hidden";
  }
}

function getVisibilityEvent(prefix) {
  if (prefix) {
    return prefix + "visibilitychange";
  } else {
    return "visibilitychange";
  }
}

var viewerReadyInterval;

function initViewerReadyInterval(interval) {
  console.log("INIT VIEWER READY INTERVAL");

  clearInterval(viewerReadyInterval);

  viewerReadyInterval = setInterval(function () {
    if (
      statsObj.serverConnected &&
      !statsObj.viewerReadyTransmitted &&
      !statsObj.viewerReadyAck
    ) {
      viewerObj.timeStamp = Date.now();

      console.log(
        "T> VIEWER_READY" +
          " | " +
          viewerObj.userId +
          " | CONNECTED: " +
          statsObj.serverConnected +
          " | READY TXD: " +
          statsObj.viewerReadyTransmitted +
          " | READY ACK RXD: " +
          statsObj.viewerReadyAck +
          " | " +
          getTimeStamp()
      );

      statsObj.viewerReadyTransmitted = true;

      socket.emit(
        "VIEWER_READY",
        { userId: viewerObj.userId, timeStamp: Date.now() },
        function () {
          statsObj.viewerReadyTransmitted = true;
        }
      );

      clearInterval(viewerReadyInterval);
    } else if (
      statsObj.serverConnected &&
      statsObj.viewerReadyTransmitted &&
      !statsObj.viewerReadyAck
    ) {
      if (statsObj.userReadyAckWait > MAX_READY_ACK_WAIT_COUNT) {
        statsObj.viewerReadyTransmitted = false;
        console.log(
          "*** RESENDING _READY AFTER " +
            MAX_READY_ACK_WAIT_COUNT +
            " WAIT CYCLES"
        );
      } else {
        statsObj.userReadyAckWait += 1;
        console.log(
          "... WAITING FOR VIEWER_READY_ACK" +
            " | " +
            MAX_READY_ACK_WAIT_COUNT +
            " WAIT CYCLES"
        );
      }
    } else if (!statsObj.serverConnected) {
      console.log("... WAITING FOR SERVER CONNECTION ...");
    }
  }, interval);
}

function sendKeepAlive(viewerObj, callback) {
  if (statsObj.viewerReadyAck && statsObj.serverConnected) {
    var statsObjSmall = statsObj;
    delete statsObjSmall.heartBeat;

    socket.emit("SESSION_KEEPALIVE", {
      user: viewerObj,
      stats: statsObjSmall,
      results: {},
    });

    callback(null);
  } else {
    console.error(
      "!!!! CANNOT TX KEEPALIVE" +
        " | " +
        viewerObj.userId +
        " | CONNECTED: " +
        statsObj.serverConnected +
        " | READY TXD: " +
        statsObj.viewerReadyTransmitted +
        " | READY ACK RXD: " +
        statsObj.viewerReadyAck +
        " | " +
        moment().format(defaultDateTimeFormat)
    );
    callback("ERROR");
  }
}

var socketKeepaliveInterval;

function initKeepalive(viewerObj, interval) {
  var keepaliveIndex = 0;

  clearInterval(socketKeepaliveInterval);

  console.log(
    "START KEEPALIVE" +
      " | READY ACK: " +
      statsObj.viewerReadyAck +
      " | SERVER CONNECTED: " +
      statsObj.serverConnected +
      " | INTERVAL: " +
      interval +
      " ms"
  );

  sendKeepAlive(viewerObj, function (err) {
    if (err) {
      console.error("KEEPALIVE ERROR: " + err);
    }
  });

  socketKeepaliveInterval = setInterval(function () {
    // TX KEEPALIVE

    statsObj.elapsed = Date.now() - statsObj.startTime;

    viewerObj.stats = statsObj;

    sendKeepAlive(viewerObj, function (err) {
      if (err) {
        console.error("KEEPALIVE ERROR: " + err);
      }
    });

    keepaliveIndex += 1;
  }, interval);
}

socket.on("connect", function () {
  viewerObj.socketId = socket.id;

  statsObj.socketId = socket.id;
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

  if (currentSessionView !== undefined) {
    currentSessionView.setEnableAgeNodes(true);
  }
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);

  statsObj.socket.connects += 1;

  viewerObj.timeStamp = Date.now();

  socket.emit("authentication", {
    namespace: "view",
    userId: viewerObj.userId,
    password: "0123456789",
  });
});

socket.on("SERVER_READY", function (serverAck) {
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;
  console.log("RX SERVER_READY | SERVER ACK: " + jsonPrint(serverAck));
});

socket.on("VIEWER_READY_ACK", function (vSesKey) {
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;
  statsObj.viewerReadyAck = true;

  console.log("RX VIEWER_READY_ACK | SESSION KEY: " + vSesKey);

  statsObj.viewerSessionKey = vSesKey;
  viewerObj.viewerSessionKey = vSesKey;

  if (config.VIEWER_OBJ === undefined) {
    config.VIEWER_OBJ = {};
  }

  config.VIEWER_OBJ = viewerObj;

  console.debug("STORE CONFIG ON VIEWER_READY_ACK");
  saveConfig();

  initKeepalive(viewerObj, DEFAULT_KEEPALIVE_INTERVAL);
});

socket.on("USER_AUTHENTICATED", function (userObj) {
  statsObj.isAuthenticated = true;
  statsObj.socket.connected = true;
  console.log("RX USER_AUTHENTICATED | USER: @" + userObj.screenName);
});

socket.on("reconnect", function () {
  viewerObj.socketId = socket.id;

  statsObj.serverConnected = true;
  console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);

  statsObj.socket.reconnects += 1;
  statsObj.socket.connected = true;

  viewerObj.timeStamp = Date.now();

  socket.emit("VIEWER_READY", viewerObj, function () {
    statsObj.viewerReadyTransmitted = true;
    socket.emit("authentication", {
      namespace: "view",
      userId: viewerObj.userId,
      password: "0123456789",
    });
  });
});

socket.on("disconnect", function () {
  statsObj.serverConnected = false;
  statsObj.socket.connected = false;

  console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  if (currentSessionView !== undefined) {
    currentSessionView.resize();
  }
});

var socketErrorTimeout;

socket.on("error", function (error) {
  statsObj.socket.errors += 1;
  statsObj.socket.error = error;

  console.log("*** SOCKET ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET ERROR\n" + error);

  if (currentSessionView !== undefined) {
    currentSessionView.resize();
  }

  socket.disconnect(true); // full disconnect, not just namespace

  clearTimeout(socketErrorTimeout);

  socketErrorTimeout = setTimeout(function () {
    socket.connect();
  }, 5000);
});

socket.on("connect_error", function (error) {
  statsObj.socket.errors += 1;
  statsObj.socket.error = error;

  console.log("*** SOCKET CONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET CONNECT ERROR\n" + error);
  if (currentSessionView !== undefined) {
    currentSessionView.resize();
  }
});

socket.on("reconnect_error", function (error) {
  statsObj.socket.errors += 1;
  statsObj.socket.error = error;

  console.log("*** SOCKET RECONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET RECONNECT ERROR\n" + error);
  if (currentSessionView !== undefined) {
    currentSessionView.resize();
  }
});

socket.on("unauthorized", function (err) {
  statsObj.serverConnected = true;

  console.error(
    "TSS | *** UNAUTHORIZED *** " +
      " | ID: " +
      socket.id +
      " | VIEWER ID: " +
      viewerObj.userId +
      " | " +
      err.message
  );
});

socket.on("authenticated", function () {
  console.debug("AUTHENTICATED | " + socket.id);

  statsObj.socketId = socket.id;
  statsObj.serverConnected = true;
  statsObj.userReadyTransmitted = false;
  statsObj.userReadyAck = false;

  console.log("CONNECTED TO HOST" + " | ID: " + socket.id);

  initViewerReadyInterval(config.viewerReadyInterval);
});

const sSmall = {};
sSmall.bestNetwork = {};

socket.on("HEARTBEAT", function (hb) {
  resetServerActiveTimer();

  statsObj.bestNetwork = hb.bestNetwork;

  statsObj.maxNodes =
    currentSessionView === undefined ? 0 : currentSessionView.getMaxNodes();
  statsObj.maxNodeAddQ =
    currentSessionView === undefined ? 0 : currentSessionView.getMaxNodeAddQ();

  // heartBeatsReceived += 1;
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;
  // lastHeartbeatReceived = Date.now();

  // sSmall.bestNetwork = hb.bestNetwork;
  // sSmall.user = hb.user;

  // if (currentSessionView) { currentSessionView.setStats(sSmall); }
});

socket.on("STATS", function (stats) {
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

  console.log("<R STATS" + "\n" + jsonPrint(stats));

  if (currentSessionView) {
    currentSessionView.setStats(stats);
  }
});

socket.on("CONFIG_CHANGE", function (rxConfig) {
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

  console.log(
    "\n-----------------------\nRX CONFIG_CHANGE\n" +
      JSON.stringify(rxConfig, null, 3) +
      "\n------------------------\n"
  );

  if (rxConfig.testMode !== undefined) {
    config.testMode = rxConfig.testMode;
    console.log(
      "\n*** ENV CHANGE: TEST_MODE:  WAS: " +
        previousConfig.testMode +
        " | NOW: " +
        config.testMode +
        "\n"
    );
    previousConfig.testMode = config.testMode;
  }

  if (rxConfig.testSendInterval !== undefined) {
    config.testSendInterval = rxConfig.testSendInterval;
    console.log(
      "\n*** ENV CHANGE: TEST_SEND_INTERVAL: WAS: " +
        previousConfig.testSendInterval +
        " | NOW: " +
        config.testSendInterval +
        "\n"
    );
    previousConfig.testSendInterval = config.testSendInterval;
  }

  if (rxConfig.maxNodes !== undefined) {
    config.maxNodes = rxConfig.maxNodes;
    console.log(
      "\n*** ENV CHANGE: NODE_MAX_NODES: WAS: " +
        previousConfig.maxNodes +
        " | NOW: " +
        config.maxNodes +
        "\n"
    );
    currentSessionView.setMaxAge(rxConfig.maxNodes);
    previousConfig.maxNodes = config.maxNodes;
  }

  if (rxConfig.nodeMaxAge !== undefined) {
    config.nodeMaxAge = rxConfig.nodeMaxAge;
    console.log(
      "\n*** ENV CHANGE: NODE_MAX_AGE: WAS: " +
        previousConfig.nodeMaxAge +
        " | NOW: " +
        config.nodeMaxAge +
        "\n"
    );
    currentSessionView.setMaxAge(rxConfig.nodeMaxAge);
    previousConfig.nodeMaxAge = config.nodeMaxAge;
  }
});

socket.on("TWITTER_SEARCH_NODE_EMPTY_QUEUE", function (message) {
  // message = { searchNode: searchNode, stats: statsObj.user.uncategorized }

  message.result = "TWITTER_SEARCH_NODE_EMPTY_QUEUE";
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

  console.log(
    "<R TWITTER_SEARCH_NODE_EMPTY_QUEUE" +
      " | SEARCH NODE: " +
      message.searchNode
  );

  console.log("<R STATS\n" + jsonPrint(message.stats));

  currentSessionView.setTwitterUser(message);
});

socket.on("TWITTER_SEARCH_NODE_NOT_FOUND", function (message) {
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

  console.log("<R TWITTER_SEARCH_NODE_NOT_FOUND" + "|  SEARCH NODE: " + message.searchNode);
  console.log("TWITTER_SEARCH_NODE_NOT_FOUND STATS\n" + jsonPrint(message.stats));

  currentSessionView.twitterUserNotFound(message);
});

socket.on("SET_TWITTER_USER", function (message) {
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

  message.node.ageDays = message.node.ageDays ? message.node.ageDays : 0;
  message.node.tweetsPerDay = message.node.tweetsPerDay
    ? message.node.tweetsPerDay
    : 0;

  console.log(
    "<R SET_TWITTER_USER" +
      " | BOT: " +
      message.node.isBot +
      " | IG: " +
      message.node.ignored +
      " | FLWG: " +
      message.node.following +
      " | 3CFLWG: " +
      message.node.threeceeFollowing +
      " | " +
      message.node.nodeId +
      " | @" +
      message.node.screenName +
      " | TPD: " +
      message.node.tweetsPerDay.toFixed(3) +
      " | AGE: " +
      message.node.ageDays.toFixed(3) +
      " | CR: " +
      message.node.createdAt +
      " | FLWRs: " +
      message.node.followersCount +
      " | FRNDs: " +
      message.node.friendsCount +
      " | Ts: " +
      message.node.statusesCount +
      " | Ms: " +
      message.node.mentions +
      " | C: " +
      message.node.category +
      " | CA: " +
      message.node.categoryAuto +
      "\n profileUrl: " +
      message.node.profileUrl
  );

  console.log("SET_TWITTER_USER STATS\n" + jsonPrint(message.stats));

  if (message.node.nodeId === twitterUserThreecee.nodeId) {
    twitterUserThreecee = message.node;
    config.twitterUser = message.node;
  }

  currentSessionView.setTwitterUser(message);
});

socket.on("TWITTER_USER_NOT_FOUND", function (message) {
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;


  console.log("<R TWITTER_USER_NOT_FOUND | SEARCH NODE: " + message.searchNode);

  console.log("SET_TWITTER_USER STATS\n" + jsonPrint(message.stats));

  if (message.node.nodeId === twitterUserThreecee.nodeId) {
    twitterUserThreecee = message.node;
    config.twitterUser = message.node;
  }

  currentSessionView.twitterUserNotFound(message);
});

socket.on("SET_TWITTER_HASHTAG", function (message) {
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

  console.log(
    "<R SET_TWITTER_HASHTAG" +
      " | #" +
      message.node.nodeId +
      " | CR: " +
      message.node.createdAt +
      " | Ms: " +
      message.node.mentions +
      " | C: " +
      message.node.category +
      " | CA: " +
      message.node.categoryAuto
  );

  console.log("SET_TWITTER_HASHTAG STATS\n" + jsonPrint(message.stats));

  currentSessionView.setTwitterHashtag(message);
});

socket.on("TWITTER_TOPTERM_1MIN", function (top10obj) {
  statsObj.socket.connected = true;
  statsObj.serverConnected = true;
  console.debug("TWITTER_TOPTERM_1MIN\n" + jsonPrint(top10obj));
});

var rxNodeQueueReady = false;
var rxNodeQueue = [];

var rxNode = function (node) {
  if (rxNodeQueue.length >= RX_NODE_QUEUE_MAX) {
    return;
  }

  if (node.nodeType !== "user" && node.nodeType !== "hashtag") {
    return;
  }

  rxNodeQueue.push(node);
};

socket.on("node", rxNode);

var windowVisible = true;

document.title = "Word Association";

var prefix = getBrowserPrefix();
var hidden = hiddenProperty(prefix);
var visibilityEvent = getVisibilityEvent(prefix);

function reset() {
  windowVisible = true;
  if (currentSessionView !== undefined) {
    currentSessionView.simulationControl("RESET");
    currentSessionView.resetDefaultForce();
    currentSessionView.simulationControl("START");
  }
}

window.addEventListener("resize", function () {
  currentSessionView.resize();
});

document.addEventListener(visibilityEvent, function () {
  if (!document[hidden]) {
    windowVisible = true;
    resetMouseMoveTimer();
    if (currentSessionView !== undefined) {
      currentSessionView.setPause(false);
    }
    console.info("visibilityEvent: " + windowVisible);
  } else {
    windowVisible = false;
    if (currentSessionView !== undefined) {
      currentSessionView.setPause(true);
    }
    console.info("visibilityEvent: " + windowVisible);
  }
});

function getUrlVariables(callbackMain) {
  var urlSessionId;
  var urlNamespace;
  var sessionType;

  var searchString = window.location.search.substring(1);
  console.log("searchString: " + searchString);

  var variableArray = searchString.split("&");

  var asyncTasks = [];

  variableArray.forEach(function (variable) {
    asyncTasks.push(function (callback2) {
      var keyValuePair = variable.split("=");

      if (keyValuePair[0] !== "" && keyValuePair[1] !== undefined) {
        console.log(
          variable +
            " >>> URL config: " +
            keyValuePair[0] +
            " : " +
            keyValuePair[1]
        );
        if (keyValuePair[0] === "monitor") {
          monitorMode = keyValuePair[1];
          console.log("MONITOR MODE | monitorMode: " + monitorMode);
          return callback2(null, {
            monitorMode: monitorMode,
          });
        }
        if (keyValuePair[0] === "session") {
          urlSessionId = keyValuePair[1];
          console.log("SESSION MODE | urlSessionId: " + urlSessionId);
          return callback2(null, {
            sessionMode: true,
            sessionId: urlSessionId,
          });
        }
        if (keyValuePair[0] === "nsp") {
          urlNamespace = keyValuePair[1];
          console.log("namespace: " + urlNamespace);
          return callback2(null, {
            namespace: urlNamespace,
          });
        }
        if (keyValuePair[0] === "type") {
          sessionType = keyValuePair[1];
          console.log("SESSION TYPE | sessionType: " + sessionType);
          return callback2(null, {
            sessionType: sessionType,
          });
        }
        if (keyValuePair[0] === "viewtype") {
          config.sessionViewType = keyValuePair[1];
          console.info(
            "SESSION VIEW TYPE | sessionViewType: " + config.sessionViewType
          );
          return callback2(null, {
            sessionViewType: config.sessionViewType,
          });
        }
      } else {
        console.log("NO URL VARIABLES");
        return callback2(null, []);
      }
    });
  });

  async.parallel(asyncTasks, function (err, results) {
    var urlConfig = {};

    // results is an array of objs:  results = [ {key0: val0}, ... {keyN: valN} ];
    async.each(
      results,
      function (urlVarObj, cb1) {
        console.log("urlVarObj\n" + jsonPrint(urlVarObj));

        var urlVarKeys = Object.keys(urlVarObj);

        async.each(
          urlVarKeys,
          function (key, cb2) {
            urlConfig[key] = urlVarObj[key];
            console.log("key: " + key + " > urlVarObj[key]: " + urlVarObj[key]);
            cb2();
          },
          function () {
            cb1();
          }
        );
      },
      function (err) {
        callbackMain(err, urlConfig);
      }
    );
  });
}

var globalLinkIndex = 0;

function generateLinkId() {
  globalLinkIndex += 1;
  return "LNK" + globalLinkIndex;
}

var totalHashMap = {};
var totalNodes = 0;
var leftNodesRatio = 0;
var rightNodesRatio = 0;
var neutralNodesRatio = 0;
var positiveNodesRatio = 0;
var negativeNodesRatio = 0;
var noneNodesRatio = 0;
var statsUpdateInterval;

//  STATS UPDATE
function initStatsUpdate(interval) {
  clearInterval(statsUpdateInterval);

  statsLeftBar.path.setAttribute("stroke", palette.blue);
  statsRightBar.path.setAttribute("stroke", palette.yellow);
  statsNeutralBar.path.setAttribute("stroke", palette.gray);
  statsPositiveBar.path.setAttribute("stroke", palette.green);
  statsNegativeBar.path.setAttribute("stroke", palette.red);
  statsNoneBar.path.setAttribute("stroke", palette.white);

  statsUpdateInterval = setInterval(function () {
    if (config.showStatsFlag) {
      totalHashMap = currentSessionView.getTotalHashMap();

      if (totalHashMap.total > 0) {
        leftNodesRatio = totalHashMap.left / totalHashMap.total;
        rightNodesRatio = totalHashMap.right / totalHashMap.total;
        neutralNodesRatio = totalHashMap.neutral / totalHashMap.total;
        positiveNodesRatio = totalHashMap.positive / totalHashMap.total;
        negativeNodesRatio = totalHashMap.negative / totalHashMap.total;
        noneNodesRatio = totalHashMap.none / totalHashMap.total;
      }

      statsLeftBar.animate(leftNodesRatio);
      statsRightBar.animate(rightNodesRatio);
      statsNeutralBar.animate(neutralNodesRatio);
      statsPositiveBar.animate(positiveNodesRatio);
      statsNegativeBar.animate(negativeNodesRatio);
      statsNoneBar.animate(noneNodesRatio);
    }
  }, interval);
}

var socketSessionUpdateInterval;

function initSocketSessionUpdateRx() {
  rxNodeQueueReady = true;

  var newNode = {};
  var category;

  var viewNumNodes = 0;
  var viewNodeAddQlength = 0;

  clearInterval(socketSessionUpdateInterval);

  socketSessionUpdateInterval = setInterval(function () {
    viewNodeAddQlength = currentSessionView.getNodeAddQlength();
    // viewNumNodes = currentSessionView.getNumNodes();

    // if (rxNodeQueueReady && (rxNodeQueue.length > 0) && (viewNumNodes <= 1.5*DEFAULT_MAX_NODES) && (viewNodeAddQlength <= 1.5*RX_NODE_QUEUE_MAX)) {
    if (
      rxNodeQueueReady &&
      rxNodeQueue.length > 0 &&
      viewNodeAddQlength <= 1.5 * RX_NODE_QUEUE_MAX
    ) {
      rxNodeQueueReady = false;

      newNode = rxNodeQueue.shift();

      if (config.autoCategoryFlag && newNode.categoryAuto) {
        category = newNode.categoryAuto;
      } else {
        category = newNode.category;
      }

      if (newNode.categoryAuto !== "none" && (category === undefined || category === "none")) {
        // newNode.categoryColor = categoryColorHashMap.get(newNode.categoryAuto);
        newNode.categoryColor = categoryColorHashMap.get("auto");
      } else if (category === undefined || category === "none") {
        newNode.categoryColor = categoryColorHashMap.get("none");
      } else {
        newNode.categoryColor = categoryColorHashMap.get(category);
      }

      newNode.age = 1e-6;
      newNode.ageMaxRatio = 1e-6;
      newNode.mouseHoverFlag = false;
      newNode.isDead = false;
      newNode.r = 0;
      newNode.following = newNode.following ? newNode.following : false;
      newNode.mentions = newNode.mentions ? newNode.mentions : 1;

      if (newNode.nodeType === "user") {
        newNode.text = newNode.screenName.toLowerCase();
        newNode.screenName = newNode.screenName.toLowerCase();
      }

      newNode.categoryMismatch =
        newNode.category !== "none" &&
        newNode.category &&
        newNode.categoryAuto &&
        newNode.category !== newNode.categoryAuto;
      newNode.categoryMatch =
        newNode.category !== "none" &&
        newNode.category &&
        newNode.categoryAuto &&
        newNode.category === newNode.categoryAuto;

      currentSessionView.addNode(newNode);
      rxNodeQueueReady = true;
    }
  }, RX_NODE_QUEUE_INTERVAL);
}

//================================
// GET NODES FROM QUEUE
//================================

function sum(obj) {
  var s = 0;
  var props = Object.keys(obj);

  async.each(
    props,
    function (prop, cb) {
      if (obj.hasOwnProperty(prop)) {
        s += parseFloat(obj[prop]);
      }
      cb();
    },
    function () {
      return s;
    }
  );
}

var randomNumber360 = 180;

function toggleFullScreen() {
  console.warn("toggleFullScreen");

  if (
    !document.fullscreenElement &&
    !document.mozFullScreenElement &&
    !document.webkitFullscreenElement &&
    !document.msFullscreenElement
  ) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(
        Element.ALLOW_KEYBOARD_INPUT
      );
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  resetConfigUpdateTimeOut();
}

requirejs.onError = function (err) {
  console.error("*** REQUIRE ERROR\n" + err);
  if (err.requireType === "timeout") {
    console.log("modules: " + err.requireModules);
  }
  throw err;
};

function loadViewType(svt, callback) {
  console.log("LOADING SESSION VIEW TYPE: " + svt);

  config.sessionViewType = "treepack";
  requirejs(["js/libs/sessionViewTreepack"], function () {
    console.debug("sessionViewTreepack LOADED");
    DEFAULT_TRANSITION_DURATION = TREEPACK_DEFAULT.TRANSITION_DURATION;
    DEFAULT_MAX_AGE = TREEPACK_DEFAULT.MAX_AGE;
    DEFAULT_COLLISION_RADIUS_MULTIPLIER =
      TREEPACK_DEFAULT.COLLISION_RADIUS_MULTIPLIER;
    DEFAULT_COLLISION_ITERATIONS = TREEPACK_DEFAULT.COLLISION_ITERATIONS;
    DEFAULT_CHARGE = TREEPACK_DEFAULT.CHARGE;
    DEFAULT_GRAVITY = TREEPACK_DEFAULT.GRAVITY;
    DEFAULT_NODE_RADIUS_MIN_RATIO = TREEPACK_DEFAULT.NODE_RADIUS_MIN_RATIO;
    DEFAULT_NODE_RADIUS_MAX_RATIO = TREEPACK_DEFAULT.NODE_RADIUS_MAX_RATIO;
    DEFAULT_VELOCITY_DECAY = TREEPACK_DEFAULT.VELOCITY_DECAY;
    DEFAULT_FORCEX_MULTIPLIER = TREEPACK_DEFAULT.FORCEX_MULTIPLIER;
    DEFAULT_FORCEY_MULTIPLIER = TREEPACK_DEFAULT.FORCEY_MULTIPLIER;
    DEFAULT_FONT_SIZE_MIN_RATIO = TREEPACK_DEFAULT.FONT_SIZE_MIN_RATIO;
    DEFAULT_FONT_SIZE_MAX_RATIO = TREEPACK_DEFAULT.FONT_SIZE_MAX_RATIO;

    currentSessionView = new ViewTreepack();
    initSocketSessionUpdateRx();

    callback();
  });
}

function onFullScreenChange() {
  var fullscreenElement =
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement;
  // if in fullscreen mode fullscreenElement wont be null
  currentSessionView.resize();
  config.fullscreenMode = Boolean(fullscreenElement);
  console.log("FULLSCREEN: " + config.fullscreenMode);
  updateFullscreenButton();
}

function initialize(callback) {
  console.log("INITIALIZE ...");

  document.addEventListener("fullscreenchange", onFullScreenChange, false);
  document.addEventListener(
    "webkitfullscreenchange",
    onFullScreenChange,
    false
  );
  document.addEventListener("mozfullscreenchange", onFullScreenChange, false);

  var sessionId;
  var namespace;

  getUrlVariables(function (err, urlVariablesObj) {
    console.log("URL VARS\n" + jsonPrint(urlVariablesObj));

    if (!err) {
      console.log("ON LOAD getUrlVariables\n" + jsonPrint(urlVariablesObj));

      if (urlVariablesObj !== undefined) {
        if (urlVariablesObj.sessionId) {
          sessionId = urlVariablesObj.sessionId;
        }

        if (urlVariablesObj.namespace) {
          namespace = urlVariablesObj.namespace;
        }

        if (urlVariablesObj.sessionViewType) {
          config.sessionViewType = urlVariablesObj.sessionViewType;

          console.log(
            "ON LOAD getUrlVariables: sessionViewType:" + config.sessionViewType
          );

          loadViewType(config.sessionViewType, function () {
            console.warn("SESSION VIEW TYPE: " + config.sessionViewType);
            currentSessionView.resize();

            currentSessionView.initD3timer();

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

            viewerObj.timeStamp = Date.now();

            socket.emit("VIEWER_READY", viewerObj, function () {
              statsObj.viewerReadyTransmitted = true;
            });

            setTimeout(function () {
              console.log("END PAGE LOAD TIMEOUT");
              pageLoadedTimeIntervalFlag = false;
              initStatsUpdate(STATS_UPDATE_INTERVAL);
              if (!config.showStatsFlag) {
                displayStats(false, palette.white);
              }

              statsObj.isAuthenticated = LOCAL_SOURCE === DEFAULT_SOURCE;
              console.log("AUTHENTICATED: " + statsObj.isAuthenticated);
            }, PAGE_LOAD_TIMEOUT);

            callback();
          });
        } else {
          console.warn("DEFAULT_SESSION_VIEW: " + DEFAULT_SESSION_VIEW);

          config.sessionViewType = DEFAULT_SESSION_VIEW;

          loadViewType(config.sessionViewType, function () {
            currentSessionView.simulationControl("START");
            currentSessionView.resize();

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

            viewerObj.timeStamp = Date.now();

            socket.emit("VIEWER_READY", viewerObj, function () {
              statsObj.viewerReadyTransmitted = true;
            });

            setTimeout(function () {
              console.log("END PAGE LOAD TIMEOUT");
              initStatsUpdate(STATS_UPDATE_INTERVAL);
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) {
                displayStats(false, palette.white);
              }

              statsObj.isAuthenticated = LOCAL_SOURCE === DEFAULT_SOURCE;
              console.log("AUTHENTICATED: " + statsObj.isAuthenticated);
            }, PAGE_LOAD_TIMEOUT);

            callback();
          });
        }
      } else {
        console.warn("DEFAULT_SESSION_VIEW *");

        config.sessionViewType = DEFAULT_SESSION_VIEW;

        loadViewType(config.sessionViewType, function () {
          currentSessionView.initD3timer();
          currentSessionView.resize();

          console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

          viewerObj.timeStamp = Date.now();

          socket.emit("VIEWER_READY", viewerObj, function () {
            statsObj.viewerReadyTransmitted = true;
          });

          setTimeout(function () {
            console.log("END PAGE LOAD TIMEOUT");

            initStatsUpdate(STATS_UPDATE_INTERVAL);
            pageLoadedTimeIntervalFlag = false;
            if (!config.showStatsFlag) {
              displayStats(false, palette.white);
            }

            statsObj.isAuthenticated = LOCAL_SOURCE === DEFAULT_SOURCE;
            console.log("AUTHENTICATED: " + statsObj.isAuthenticated);
          }, PAGE_LOAD_TIMEOUT);
        });

        callback();
      }
    } else {
      console.error("GET URL VARIABLES ERROR\n" + jsonPrint(err));
      callback(err);
    }
  });
}
