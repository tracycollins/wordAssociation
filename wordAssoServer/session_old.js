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
*/

"use strict";

const STORED_SETTINGS_VERSION = 0.01;
const DEFAULT_USE_STORED_SETTINGS = false;

const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
const LOCAL_SOURCE = "http://localhost:9997";
const DEFAULT_SOURCE = REPLACE_SOURCE;

const DEFAULT_AUTH_URL = "http://word.threeceelabs.com/auth/twitter";

let customizePanelFlag = false;
let customizePanelWindow;

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;

const DEFAULT_KEEPALIVE_INTERVAL = ONE_MINUTE;
const DEFAULT_STATS_UPDATE_INTERVAL = ONE_SECOND;

const DEFAULT_PAGE_LOAD_TIMEOUT = ONE_SECOND;

const DEFAULT_FORCEVIEW_MODE = "web";
const DEFAULT_SESSION_VIEW = "treepack";

const DEFAULT_RX_NODE_QUEUE_INTERVAL = 5;
const DEFAULT_RX_NODE_QUEUE_MAX = 100;

const DEFAULT_ZOOM_FACTOR = 0.75;

const DEFAULT_METRIC_MODE = "rate";
const DEFAULT_MAX_NODES = 50;
const DEFAULT_MAX_AGE = 15000;
const DEFAULT_AGE_RATE = 1.0;

const DEFAULT_TRANSITION_DURATION = 40;
const DEFAULT_CHARGE = -50;
const DEFAULT_GRAVITY = 0.001;
const DEFAULT_FORCEX_MULTIPLIER = 25.0;
const DEFAULT_FORCEX_SESSION_MULTIPLIER = 50.0;
const DEFAULT_FORCEY_MULTIPLIER = 25.0;

const DEFAULT_NODE_RADIUS_RATIO_MIN = 0.01;
const DEFAULT_NODE_RADIUS_RATIO_MAX = 0.15;
const DEFAULT_NODE_RADIUS_MIN = 5.0;
const DEFAULT_NODE_RADIUS_MAX = 100.0;

const DEFAULT_VELOCITY_DECAY = 0.35;
const DEFAULT_LINK_DISTANCE = 100.0;
const DEFAULT_LINK_STRENGTH = 0.5;
const DEFAULT_COLLISION_RADIUS_MULTIPLIER = 1.0;
const DEFAULT_COLLISION_ITERATIONS = 1;

const DEFAULT_FONT_SIZE_MIN = 16;
const DEFAULT_FONT_SIZE_MAX = 60;
const DEFAULT_FONT_SIZE_MIN_RATIO = 0.02;
const DEFAULT_FONT_SIZE_MAX_RATIO = 0.05;

const DEFAULT_FONT_SIZE_TOPTERM_RATIO = 0.026;


const DEFAULT_MAX_RX_QUEUE = 250;
const DEFAULT_MAX_READY_ACK_WAIT_COUNT = 10;

// TREEMAP
const TREEMAP_MAX_NODES = DEFAULT_MAX_NODES;
const TREEMAP_MAX_AGE = DEFAULT_MAX_AGE;
// TREEPACK
const TREEPACK_MAX_NODES = DEFAULT_MAX_NODES;
const TREEPACK_MAX_AGE = DEFAULT_MAX_AGE;

let serverCheckInterval = 5 * ONE_MINUTE;

let config = {};

config.defaults = {}
config.defaults.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??
config.defaults.pauseOnMouseMove = true;
config.defaults.keepaliveInterval = DEFAULT_KEEPALIVE_INTERVAL;
config.defaults.viewerReadyInterval = 10000;
config.defaults.panzoomTransform = {};

config.defaults.displayNodeHashMap = {};

config.defaults.displayNodeHashMap = {};
config.defaults.displayNodeHashMap.emoji = "hide";
config.defaults.displayNodeHashMap.hashtag = "show";
config.defaults.displayNodeHashMap.place = "hide";
config.defaults.displayNodeHashMap.url = "hide";
config.defaults.displayNodeHashMap.user = "show";
config.defaults.displayNodeHashMap.word = "hide";

config.defaults.nodeRadiusRatioRange = {};
config.defaults.nodeRadiusRatioRange.min = 0.0;
config.defaults.nodeRadiusRatioRange.max = 0.5;
config.defaults.nodeRadiusRatioRange.step = 0.01;


let previousConfig = {};

let statsObj = {};

statsObj.serverConnected = false;
statsObj.isAuthenticated = false || LOCAL_SOURCE === DEFAULT_SOURCE;

statsObj.socket = {};
statsObj.socket.errors = 0;
statsObj.socket.error = false;
statsObj.socket.connected = true;
statsObj.socket.connects = 0;
statsObj.socket.reconnects = 0;

statsObj.bestNetwork = {};
statsObj.bestNetwork.networkId = "";
statsObj.bestNetwork.successRate = 0;
statsObj.bestNetwork.matchRate = 0;
statsObj.bestNetwork.overallMatchRate = 0;
statsObj.bestNetwork.inputsId = "";
statsObj.bestNetwork.numInputs = 0;

statsObj.maxNodes = 0;
statsObj.maxNodeAddQ = 0;

function jsonPrint(obj) {
  if (obj || obj === 0) {
    return JSON.stringify(obj, null, 2);
  } else {
    return "UNDEFINED";
  }
}

let randomIntFromInterval = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const VIEWER_ID = "viewer_" + randomIntFromInterval(1000000000, 9999999999);

const DEFAULT_VIEWER_OBJ = {
  nodeId: VIEWER_ID,
  userId: VIEWER_ID,
  viewerId: VIEWER_ID,
  screenName: VIEWER_ID,
  type: "viewer",
  namespace: "view",
  timeStamp: Date.now(),
  tags: {
    entity: VIEWER_ID,
    type: "viewer",
    mode: "stream"
  },
};

let viewerObj = DEFAULT_VIEWER_OBJ;

console.log("viewerObj\n" + jsonPrint(viewerObj));

let storedConfigName;
let storedSettings;

let useStoredConfig = DEFAULT_USE_STORED_SETTINGS;
let globalStoredSettingsName = "config_" + DEFAULT_SESSION_VIEW;

let d3;
let customizerWindow;
let currentSessionView;

let defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";

let pageLoadedTimeIntervalFlag = true;

const TREEPACK_DEFAULT = {};
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
TREEPACK_DEFAULT.NODE_RADIUS_RATIO_MIN = DEFAULT_NODE_RADIUS_RATIO_MIN;
TREEPACK_DEFAULT.NODE_RADIUS_RATIO_MAX = DEFAULT_NODE_RADIUS_RATIO_MAX;

config.defaults.twitterUser = {};
config.defaults.twitterUser.userId = "";
config.defaults.fullscreenMode = false;

const palette = {
  black: "#000000",
  white: "#FFFFFF",
  lightgray: "#819090",
  gray: "#708284",
  mediumgray: "#536870",
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

const categoryColorHashMap = new HashMap();

categoryColorHashMap.set("positive", palette.green);
categoryColorHashMap.set("negative", palette.red);
categoryColorHashMap.set("neutral", palette.darkgray);
categoryColorHashMap.set("left", palette.blue);
categoryColorHashMap.set("right", palette.yellow);
categoryColorHashMap.set("none", palette.black);
categoryColorHashMap.set("auto", palette.white);

let monitorMode = false;

const socket = io("/view");

let seconds;
let minutes;
let hours;
let days;

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
  storedConfigName = "config_" + config.settings.sessionViewType;
  store.set(storedConfigName, config);
  console.debug("STORED CONFIG" + " | " + storedConfigName);
}

let controlDivElement = document.getElementById("controlDiv");

document.addEventListener("nodeSearch",function (event) {
  console.log("nodeSearch event", event.detail);
  const searchTerm = event.detail.node && event.detail.node.nodeType === "user" ? "@" + event.detail.node.screenName : "#" + event.detail.node.nodeId;
  socket.emit("TWITTER_SEARCH_NODE", searchTerm);
});

function displayControl(isVisible) {
  controlDivElement.style.visibility = isVisible ? "visible" : "hidden";
}

let showPropArray = [
  "networkId",
  "successRate",
  "matchRate",
  "overallMatchRate",
  "numInputs",
  "inputsId",
];

let mouseMoveTimeoutEventObj = new CustomEvent("mouseMoveTimeoutEvent");
let mouseMoveTimeout;
let mouseMovingFlag = false;
let mouseMoveTimeoutInterval = 2000;

function resetMouseMoveTimer() {
  
  clearTimeout(mouseMoveTimeout);

  mouseMoveTimeout = setTimeout(function () {
    mouseMovingFlag = false;
    displayControl(false);

    d3.select("body").style("cursor", "none");

    currentSessionView.toolTipVisibility(false);
    currentSessionView.mouseMoving(false);

    if (config.settings.pauseOnMouseMove && !config.settings.pauseFlag) {
      currentSessionView.simulationControl("RESUME");
    }

    document.dispatchEvent(mouseMoveTimeoutEventObj);
  }, mouseMoveTimeoutInterval);
}

let serverActiveTimeoutEventObj = new CustomEvent("serverActiveTimeoutEvent");
let serverActiveTimeout;
let serverActiveFlag = false;
let serverActiveTimeoutInterval = 90 * ONE_SECOND;

function resetServerActiveTimer() {
  serverActiveFlag = true;
  if (currentSessionView !== undefined) {
    currentSessionView.setEnableAgeNodes(true);
  }

  clearTimeout(serverActiveTimeout);

  serverActiveTimeout = setTimeout(function () {
    serverActiveFlag = false;
    document.dispatchEvent(serverActiveTimeoutEventObj);
  }, serverActiveTimeoutInterval);
}

window.onbeforeunload = function () {
};

const openCustomizer = (cnf) => {
  
  console.debug("openCustomizer");

  customizerWindow = window.open(
    DEFAULT_SOURCE + "/customize",
    "CUSTOMIZE",
    "width=1200,height=800"
  );

  window.addEventListener("message", customizerComm, false);

  customizerWindow.addEventListener(
    "beforeunload",
    function () {
      console.log("CUSTOMIZE POP UP CLOSING...");
      customizePanelFlag = false;
      updateCustomizeButton(customizePanelFlag);
    },
    false
  );

  customizerWindow.addEventListener(
    "load",
    function () {
      customizePanelFlag = true;
      updateCustomizeButton(customizePanelFlag);
      customizerWindow.postMessage({ op: "INIT", config: cnf }, DEFAULT_SOURCE);
      return;
    },
    false
  );
}

function updateCustomizeButton(customizePanelFlag) {
  document.getElementById("customizeButton").innerHTML = customizePanelFlag
    ? "CLOSE CUSTOMIZE"
    : "CUSTOMIZE";
}

function addCategoryButton() {
  let categoryButton = document.createElement("BUTTON");
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
  document.getElementById("metricButton").innerHTML = config.settings.metricMode.toUpperCase() + " RADIUS";
}

function addMetricButton() {
  let metricButton = document.createElement("BUTTON");
  if (config.settings.metricMode === undefined) {
    config.settings.metricMode = "rate";
  }
  metricButton.className = "button";
  metricButton.setAttribute("id", "metricButton");
  metricButton.setAttribute("onclick", "toggleMetric()");
  metricButton.innerHTML = config.settings.metricMode.toUpperCase() + " RADIUS";
  controlDivElement.appendChild(metricButton);
}

function updateFullscreenButton() {
  document.getElementById("fullscreenButton").innerHTML = config.settings.fullscreenMode
    ? "EXIT FULLSCREEN"
    : "FULLSCREEN";
}

const addCustomizeButton = () => {
  let customizeButton = document.createElement("BUTTON");
  customizeButton.className = "button";
  customizeButton.setAttribute("id", "customizeButton");
  customizeButton.setAttribute("onclick", "toggleCustomize()");
  customizeButton.innerHTML = config.settings.customizeMode
    ? "EXIT CUSTOMIZE"
    : "CUSTOMIZE";
  controlDivElement.appendChild(customizeButton);
}

function addFullscreenButton() {
  let fullscreenButton = document.createElement("BUTTON");
  fullscreenButton.className = "button";
  fullscreenButton.setAttribute("id", "fullscreenButton");
  fullscreenButton.setAttribute("onclick", "toggleFullScreen()");
  fullscreenButton.innerHTML = config.fullscreenMode
    ? "EXIT FULLSCREEN"
    : "FULLSCREEN";
  controlDivElement.appendChild(fullscreenButton);
}

let configUpdateTimeOut;
let configUpdateTimeOutInverval = 3000;

function resetConfigUpdateTimeOut() {
  storedConfigName = "config_" + config.settings.sessionViewType;

  clearTimeout(configUpdateTimeOut);

  configUpdateTimeOut = setTimeout(function () {
    console.debug("STORE CONFIG");
    saveConfig();
  }, configUpdateTimeOutInverval);
}

const customizerComm = (event) => {

  console.debug("CUSTOMIZE PANEL: " + event.origin);

  if (event.data === "DisableHTML5Autoplay_Initialize") {
    console.info("RX> CONTROL PANEL | DisableHTML5Autoplay_Initialize ... IGNORING ...");
    return;
  }

  switch (event.data.op) {

    case "READY":
      console.warn("R< CUSTOMIZE PANEL READY");
      controlPanelReadyFlag = true;
      break;

    case "CLOSE":
      console.warn("R< CUSTOMIZE PANEL CLOSING...");
      resetConfigUpdateTimeOut();
      break;

    case "MOMENT":
      console.warn("R< CUSTOMIZE PANEL MOMENT...");
      switch (event.data.id) {
        case "resetButton":
          reset();
          break;
        default:
          console.error("CUSTOMIZE PANEL UNKNOWN MOMENT BUTTON");
      }
      break;

    case "TOGGLE":

      console.warn("R< CUSTOMIZE PANEL TOGGLE");

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
            "CUSTOMIZE PANEL UNKNOWN TOGGLE BUTTON | ID: " + event.data.id
          );
      }

      resetConfigUpdateTimeOut();

      break;

    case "UPDATE":

      console.warn("R< CONTROL PANEL UPDATE");

      switch (event.data.id) {

        case "transitionDuration":
          currentSessionView.setTransitionDuration(event.data.value);
          config.settings.TransitionDuration = event.data.value;
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

        case "nodeRadiusRatioRange":
          currentSessionView.setNodeRadiusRatioMin(event.data.min);
          currentSessionView.setNodeRadiusRatioMax(event.data.max);
          console.log(`CUSTOMIZER SET | setNodeRadiusRatio | min: ${event.data.min} max: ${event.data.max}`)
          break;

        default:
          console.error("UNKNOWN CUSTOMIZE PANEL ID: " + event.data.id + "\n" + jsonPrint(event.data));
      }
      resetConfigUpdateTimeOut();

      break;

    case "INIT":
      console.info("R< CUSTOMIZE PANEL LOOPBACK? | INIT ... IGNORING ...");
      break;

    default:
      if (event.data["twttr.button"] !== undefined) {
        console.log("R< CUSTOMIZE PANEL TWITTER" + " | " + event.data["twttr.button"].method);
      } 
      else if (event.data.settings !== undefined) {
        console.log("R< CUSTOMIZE PANEL SETTINGS" + "\n" + jsonPrint(event.data.settings));
      } 
      else {
        console.warn("R< ??? CUSTOMIZE PANEL OP UNDEFINED\n" + jsonPrint(event.data));
      }
  }
}

function toggleShowNodeType(displayNodeType) {

  if (config.settings.displayNodeHashMap[displayNodeType] === "show") {
    config.settings.displayNodeHashMap[displayNodeType] = "hide";
  } 
  else {
    config.settings.displayNodeHashMap[displayNodeType] = "show";
  }

  currentSessionView.setMetricMode(config.settings.metricMode);

  console.warn("SET RADIUS MODE: " + config.settings.metricMode);

  updateMetricButton();

}

function toggleMetric() {

  if (config.settings.metricMode === "rate") {
    config.settings.metricMode = "mentions";
  } else {
    config.settings.metricMode = "rate";
  }
  currentSessionView.setMetricMode(config.settings.metricMode);
  console.warn("SET RADIUS MODE: " + config.settings.metricMode);
  updateMetricButton();

}

function togglePause() {
  config.settings.pauseFlag = !config.settings.pauseFlag;
  currentSessionView.setPause(config.settings.pauseFlag);
  console.warn("TOGGLE PAUSE: " + config.settings.pauseFlag);
}

function toggleRemoveDeadNode() {
  config.settings.removeDeadNodesFlag = !config.settings.removeDeadNodesFlag;
  currentSessionView.setRemoveDeadNodesFlag(config.settings.removeDeadNodesFlag);
  console.warn("TOGGLE REMOVE DEAD NODES: " + config.settings.removeDeadNodesFlag);
}

function toggleAutoCategory() {
  config.settings.autoCategoryFlag = !config.settings.autoCategoryFlag;
  currentSessionView.setAutoCategoryFlag(config.settings.autoCategoryFlag);
  console.warn("AUTO CATEGORY: " + config.settings.autoCategoryFlag);

  updateCategoryButton();

}

function toggleTestMode() {
  config.settings.testMode = !config.settings.testMode;
  config.settings.testModeEnabled = config.settings.testMode;
  console.warn("TEST MODE: " + config.settings.testModeEnabled);
  currentSessionView.setTestMode(config.settings.testModeEnabled);
}

let keysForSortedKeys = [];
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

let optionsTimeStamp = {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
};

let currentDate;
let currentTime;

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
  let browserPrefixes = ["moz", "ms", "o", "webkit"];
  let prefix;

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

let viewerReadyInterval;

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
      if (statsObj.userReadyAckWait > DEFAULT_MAX_READY_ACK_WAIT_COUNT) {
        statsObj.viewerReadyTransmitted = false;
        console.log(
          "*** RESENDING _READY AFTER " +
            DEFAULT_MAX_READY_ACK_WAIT_COUNT +
            " WAIT CYCLES"
        );
      } else {
        statsObj.userReadyAckWait += 1;
        console.log(
          "... WAITING FOR VIEWER_READY_ACK" +
            " | " +
            DEFAULT_MAX_READY_ACK_WAIT_COUNT +
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
    let statsObjSmall = statsObj;
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

let socketKeepaliveInterval;

function initKeepalive(viewerObj, interval) {
  let keepaliveIndex = 0;

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

  if (config.settings.VIEWER_OBJ === undefined) {
    config.settings.VIEWER_OBJ = {};
  }

  config.settings.VIEWER_OBJ = viewerObj;

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

let socketErrorTimeout;

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

  initViewerReadyInterval(config.settings.viewerReadyInterval);
});

const sSmall = {};
sSmall.bestNetwork = {};

socket.on("HEARTBEAT", function (hb) {
  resetServerActiveTimer();

  statsObj.bestNetwork = hb.bestNetwork;

  statsObj.maxNodes = currentSessionView === undefined ? 0 : currentSessionView.getMaxNodes();
  statsObj.maxNodeAddQ = currentSessionView === undefined ? 0 : currentSessionView.getMaxNodeAddQ();

  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

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
    config.settings.testMode = rxConfig.testMode;
    console.log(
      "\n*** ENV CHANGE: TEST_MODE:  WAS: " +
        previousConfig.testMode +
        " | NOW: " +
        config.settings.testMode +
        "\n"
    );
    previousConfig.testMode = config.testMode;
  }

  if (rxConfig.testSendInterval !== undefined) {
    config.settings.testSendInterval = rxConfig.testSendInterval;
    console.log(
      "\n*** ENV CHANGE: TEST_SEND_INTERVAL: WAS: " +
        previousConfig.testSendInterval +
        " | NOW: " +
        config.settings.testSendInterval +
        "\n"
    );
    previousConfig.testSendInterval = config.settings.testSendInterval;
  }

  if (rxConfig.maxNodes !== undefined) {
    config.settings.maxNodes = rxConfig.maxNodes;
    console.log(
      "\n*** ENV CHANGE: NODE_MAX_NODES: WAS: " +
        previousConfig.maxNodes +
        " | NOW: " +
        config.settings.maxNodes +
        "\n"
    );
    currentSessionView.setMaxAge(rxConfig.maxNodes);
    previousConfig.maxNodes = config.settings.maxNodes;
  }

  if (rxConfig.nodeMaxAge !== undefined) {
    config.settings.nodeMaxAge = rxConfig.nodeMaxAge;
    console.log(
      "\n*** ENV CHANGE: NODE_MAX_AGE: WAS: " +
        previousConfig.nodeMaxAge +
        " | NOW: " +
        config.settings.nodeMaxAge +
        "\n"
    );
    currentSessionView.setMaxAge(rxConfig.nodeMaxAge);
    previousConfig.nodeMaxAge = config.settings.nodeMaxAge;
  }
});


let rxNodeQueueReady = false;
let rxNodeQueue = [];

let rxNode = function (node) {
  if (rxNodeQueue.length >= DEFAULT_RX_NODE_QUEUE_MAX) {
    return;
  }

  if (node.nodeType !== "user" && node.nodeType !== "hashtag") {
    return;
  }

  rxNodeQueue.push(node);
};

socket.on("node", rxNode);

let windowVisible = true;

document.title = "Word Association";

let prefix = getBrowserPrefix();
let hidden = hiddenProperty(prefix);
let visibilityEvent = getVisibilityEvent(prefix);

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

const getUrlVariables = () => {

  let urlSessionId;
  let urlNamespace;
  let sessionType;

  let searchString = window.location.search.substring(1);
  console.log("searchString: " + searchString);

  let variableArray = searchString.split("&");

  let asyncTasks = [];

  variableArray.forEach(function (variable) {

    asyncTasks.push(function (callback2) {

      let keyValuePair = variable.split("=");

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
          config.settings.sessionViewType = keyValuePair[1];
          console.info(
            "SESSION VIEW TYPE | sessionViewType: " + config.settings.sessionViewType
          );
          return callback2(null, {
            sessionViewType: config.settings.sessionViewType,
          });
        }
      } 
      else {
        console.log("NO URL VARIABLES");
        return callback2(null, []);
      }
    });
  });

  async.parallel(asyncTasks, function (err, results) {
    let urlConfig = {};

    // results is an array of objs:  results = [ {key0: val0}, ... {keyN: valN} ];
    async.each(
      results,
      function (urlVarObj, cb1) {
        console.log("urlVarObj\n" + jsonPrint(urlVarObj));

        let urlVarKeys = Object.keys(urlVarObj);

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
        return({err: err, urlConfig: urlConfig});
      }
    );
  });
}

let globalLinkIndex = 0;

function generateLinkId() {
  globalLinkIndex += 1;
  return "LNK" + globalLinkIndex;
}

let totalHashMap = {};
let totalNodes = 0;
let leftNodesRatio = 0;
let rightNodesRatio = 0;
let neutralNodesRatio = 0;
let positiveNodesRatio = 0;
let negativeNodesRatio = 0;
let noneNodesRatio = 0;
let statsUpdateInterval;

// //  STATS UPDATE
// function initStatsUpdate(interval) {
//   clearInterval(statsUpdateInterval);

//   statsLeftBar.path.setAttribute("stroke", palette.blue);
//   statsRightBar.path.setAttribute("stroke", palette.yellow);
//   statsNeutralBar.path.setAttribute("stroke", palette.gray);
//   statsPositiveBar.path.setAttribute("stroke", palette.green);
//   statsNegativeBar.path.setAttribute("stroke", palette.red);
//   statsNoneBar.path.setAttribute("stroke", palette.white);

//   statsUpdateInterval = setInterval(function () {
//     if (config.showStatsFlag) {
//       totalHashMap = currentSessionView.getTotalHashMap();

//       if (totalHashMap.total > 0) {
//         leftNodesRatio = totalHashMap.left / totalHashMap.total;
//         rightNodesRatio = totalHashMap.right / totalHashMap.total;
//         neutralNodesRatio = totalHashMap.neutral / totalHashMap.total;
//         positiveNodesRatio = totalHashMap.positive / totalHashMap.total;
//         negativeNodesRatio = totalHashMap.negative / totalHashMap.total;
//         noneNodesRatio = totalHashMap.none / totalHashMap.total;
//       }

//       statsLeftBar.animate(leftNodesRatio);
//       statsRightBar.animate(rightNodesRatio);
//       statsNeutralBar.animate(neutralNodesRatio);
//       statsPositiveBar.animate(positiveNodesRatio);
//       statsNegativeBar.animate(negativeNodesRatio);
//       statsNoneBar.animate(noneNodesRatio);
//     }
//   }, interval);
// }

let socketSessionUpdateInterval;

const initSocketSessionUpdateRx = () => {

  rxNodeQueueReady = true;

  let newNode = {};
  let category;

  let viewNumNodes = 0;
  let viewNodeAddQlength = 0;

  clearInterval(socketSessionUpdateInterval);

  socketSessionUpdateInterval = setInterval(function () {

    viewNodeAddQlength = currentSessionView.getNodeAddQlength();
    // viewNumNodes = currentSessionView.getNumNodes();

    // if (rxNodeQueueReady && (rxNodeQueue.length > 0) && (viewNumNodes <= 1.5*DEFAULT_MAX_NODES) && (viewNodeAddQlength <= 1.5*DEFAULT_RX_NODE_QUEUE_MAX)) {
    if (
      rxNodeQueueReady &&
      rxNodeQueue.length > 0 &&
      viewNodeAddQlength <= 1.5 * DEFAULT_RX_NODE_QUEUE_MAX
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
  }, DEFAULT_RX_NODE_QUEUE_INTERVAL);

  return;
}

//================================
// GET NODES FROM QUEUE
//================================

function sum(obj) {
  let s = 0;
  let props = Object.keys(obj);

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

let randomNumber360 = 180;

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

const toggleCustomize = () => {

  console.warn("toggleCustomize");
  customizePanelFlag = !customizePanelFlag;
  if (customizePanelFlag) {
    openCustomizer(config)
  }
  else{
    if (customizerWindow) {
      customizerWindow.close();
    }
  }
  return;
}

requirejs.onError = function (err) {
  console.error("*** REQUIRE ERROR\n" + err);
  if (err.requireType === "timeout") {
    console.log("modules: " + err.requireModules);
  }
  throw err;
};

const loadViewType = async (svt) => {

  console.log("LOADING SESSION VIEW TYPE: " + svt);

  config.settings.sessionViewType = "treepack";

  const ViewTreepack = require "js/libs/sessionViewTreepack"

  // requirejs(["js/libs/sessionViewTreepack"], function () {

  //   console.debug("sessionViewTreepack LOADED");

  //   config.defaults.transitionDuration = TREEPACK_DEFAULT.TRANSITION_DURATION;
  //   config.defaults.maxAge = TREEPACK_DEFAULT.MAX_AGE;
  //   config.defaults.collisionRadiusMultiplier = TREEPACK_DEFAULT.COLLISION_RADIUS_MULTIPLIER;
  //   config.defaults.collisionIterations = TREEPACK_DEFAULT.COLLISION_ITERATIONS;
  //   config.defaults.charge = TREEPACK_DEFAULT.CHARGE;
  //   config.defaults.gravity = TREEPACK_DEFAULT.GRAVITY;
  //   config.defaults.nodeRadiusMinRatio = TREEPACK_DEFAULT.NODE_RADIUS_MIN_RATIO;
  //   config.defaults.nodeRadiusMaxRatio = TREEPACK_DEFAULT.NODE_RADIUS_MAX_RATIO;
  //   config.defaults.velocityDecay = TREEPACK_DEFAULT.VELOCITY_DECAY;
  //   config.defaults.forceXmultiplier = TREEPACK_DEFAULT.FORCEX_MULTIPLIER;
  //   config.defaults.forceYmultiplier = TREEPACK_DEFAULT.FORCEY_MULTIPLIER;
  //   config.defaults.fontSizeMinRatio = TREEPACK_DEFAULT.FONT_SIZE_MIN_RATIO;
  //   config.defaults.fontSizeMaxRatio = TREEPACK_DEFAULT.FONT_SIZE_MAX_RATIO;

  //   // DEFAULT_TRANSITION_DURATION = TREEPACK_DEFAULT.TRANSITION_DURATION;
  //   // DEFAULT_MAX_AGE = TREEPACK_DEFAULT.MAX_AGE;
  //   // DEFAULT_COLLISION_RADIUS_MULTIPLIER = TREEPACK_DEFAULT.COLLISION_RADIUS_MULTIPLIER;
  //   // DEFAULT_COLLISION_ITERATIONS = TREEPACK_DEFAULT.COLLISION_ITERATIONS;
  //   // DEFAULT_CHARGE = TREEPACK_DEFAULT.CHARGE;
  //   // DEFAULT_GRAVITY = TREEPACK_DEFAULT.GRAVITY;
  //   // DEFAULT_NODE_RADIUS_MIN_RATIO = TREEPACK_DEFAULT.NODE_RADIUS_MIN_RATIO;
  //   // DEFAULT_NODE_RADIUS_MAX_RATIO = TREEPACK_DEFAULT.NODE_RADIUS_MAX_RATIO;
  //   // DEFAULT_VELOCITY_DECAY = TREEPACK_DEFAULT.VELOCITY_DECAY;
  //   // DEFAULT_FORCEX_MULTIPLIER = TREEPACK_DEFAULT.FORCEX_MULTIPLIER;
  //   // DEFAULT_FORCEY_MULTIPLIER = TREEPACK_DEFAULT.FORCEY_MULTIPLIER;
  //   // DEFAULT_FONT_SIZE_MIN_RATIO = TREEPACK_DEFAULT.FONT_SIZE_MIN_RATIO;
  //   // DEFAULT_FONT_SIZE_MAX_RATIO = TREEPACK_DEFAULT.FONT_SIZE_MAX_RATIO;

  //   return new ViewTreepack(config);
  //   // initSocketSessionUpdateRx();
  // });

}

function onFullScreenChange() {

  let fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
  // if in fullscreen mode fullscreenElement wont be null
  currentSessionView.resize();
  config.fullscreenMode = Boolean(fullscreenElement);
  console.log("FULLSCREEN: " + config.fullscreenMode);
  updateFullscreenButton();
}

const loadStoredSettings = async () => {
  console.log("LOADING STORED SETTINGS: " + globalStoredSettingsName);
  return store.get(globalStoredSettingsName);
}

const initialize = async () => {

  console.log("INITIALIZE ...");

  config.settings = Object.assign({}, config.defaults);

  if (useStoredConfig){

    const storedSettings = await loadStoredSettings()

    if (storedSettings && storedSettings.version === STORED_SETTINGS_VERSION) {
      config.settings = Object.assign(config.settings, storedSettings);
    } 

  }

  console.log({config})

  document.addEventListener("fullscreenchange", onFullScreenChange, false);
  document.addEventListener("webkitfullscreenchange", onFullScreenChange, false);
  document.addEventListener("mozfullscreenchange", onFullScreenChange, false);

  let sessionId;
  let namespace;

  currentSessionView = await loadViewType(config.settings.sessionViewType)
  currentSessionView.initD3timer();
  currentSessionView.resize();

  console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

  viewerObj.timeStamp = Date.now();

  socket.emit("VIEWER_READY", viewerObj, function () {
    statsObj.viewerReadyTransmitted = true;
  });

  setTimeout(function () {
    console.log("END PAGE LOAD TIMEOUT");
    pageLoadedTimeIntervalFlag = false;
    statsObj.isAuthenticated = LOCAL_SOURCE === DEFAULT_SOURCE;
    console.log("AUTHENTICATED: " + statsObj.isAuthenticated);
    initSocketSessionUpdateRx();
    return;
  }, PAGE_LOAD_TIMEOUT);

}

requirejs(
  ["https://d3js.org/d3.v6.min.js"],

  function (d3Loaded) {

    console.log("d3 LOADED");
    d3 = d3Loaded;

    initialize(config)
    addCustomizeButton();
    addFullscreenButton();
    addMetricButton();
    addCategoryButton();
    resetMouseMoveTimer();

    document.addEventListener(
      "mousemove",
      function () {
        if (currentSessionView) {
          if (config.settings.pauseOnMouseMove) {
            currentSessionView.simulationControl("PAUSE");
          }
          mouseMovingFlag = true;
          currentSessionView.mouseMoving(true);
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
          config.settings.panzoomTransform = currentSessionView.getPanzoomTransform();
          saveConfig();
        }
      },
      true
    );
  },

  function (error) {
    console.log("REQUIREJS ERROR handler", error);
    console.log(error.requireModules && error.requireModules[0]);
    console.log(error.message);
  }
);
