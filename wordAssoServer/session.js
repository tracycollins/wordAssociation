/* global config,d3,HashMap,store,moment,io,ViewForce */

const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
const LOCAL_SOURCE = "http://localhost:9997";
const MBP3_SOURCE = "http://mbp3:3000";

const DEFAULT_SOURCE = PRODUCTION_SOURCE;

console.debug(`PRODUCTION_SOURCE: ${PRODUCTION_SOURCE}`)
console.debug(`LOCAL_SOURCE: ${LOCAL_SOURCE}`)
console.debug(`DEFAULT_SOURCE: ${DEFAULT_SOURCE}`)

const STORED_CONFIG_VERSION = "2.1.34";
const STORED_CONFIG_NAME = `stored_config${"_" + STORED_CONFIG_VERSION}`
const globalStoredSettingsName = STORED_CONFIG_NAME;

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";

// const DEFAULT_WINDOW_HEIGHT = 1080;
// const DEFAULT_WINDOW_WIDTH = 1920;

const DEFAULT_RX_NODE_QUEUE_MAX = 200;
const DEFAULT_RX_NODE_QUEUE_INTERVAL = 5;

const DEFAULT_MAX_READY_ACK_WAIT_COUNT = 10;
const DEFAULT_KEEPALIVE_INTERVAL = 60000;

let currentSessionView;
let rxNodeQueueReady = false;
const rxNodeQueue = [];

let customizePanelFlag = false;
let infoPanelFlag = false;

const status = {};

status.serverConnected = false;
status.viewerReadyTransmitted = false;
status.viewerReadyAck = false
status.isAuthenticated = false || LOCAL_SOURCE === DEFAULT_SOURCE;

status.socket = {};
status.socket.errors = 0;
status.socket.error = false;
status.socket.connected = true;
status.socket.connects = 0;
status.socket.reconnects = 0;

status.bestNetwork = {};
status.bestNetwork.networkId = "";
status.bestNetwork.successRate = 0;
status.bestNetwork.matchRate = 0;
status.bestNetwork.overallMatchRate = 0;
status.bestNetwork.inputsId = "";
status.bestNetwork.numInputs = 0;

status.maxNodes = 0;
status.maxNodeAddQ = 0;

config.defaults.app_name = "Session View";
config.defaults.sessionViewType = "treepack"; // options: force, histogram ??
config.defaults.storedConfigName = STORED_CONFIG_NAME;
config.defaults.rxNodeQueueMax = DEFAULT_RX_NODE_QUEUE_MAX;
config.defaults.rxNodeQueueInterval = DEFAULT_RX_NODE_QUEUE_INTERVAL;
config.defaults.keepaliveInterval = DEFAULT_KEEPALIVE_INTERVAL;
config.defaults.viewerReadyInterval = 10000;

config.settings = Object.assign({}, config.defaults)

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

function jsonPrint(obj) {
  if (obj || obj === 0) {
    return JSON.stringify(obj, null, 2);
  } else {
    return "UNDEFINED";
  }
}

const randomIntFromInterval = function (min, max) {
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

const viewerObj = DEFAULT_VIEWER_OBJ;

let currentDate;
let currentTime;

const optionsTimeStamp = {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
};

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

let configUpdateTimeOut;
const configUpdateTimeOutInverval = 3000;

const resetConfigUpdateTimeOut = () => {

  clearTimeout(configUpdateTimeOut);

  configUpdateTimeOut = setTimeout(function () {
    console.debug("STORE CONFIG");
    saveConfig();
    return;
  }, configUpdateTimeOutInverval);
}

const saveConfig = () => {
  config.defaults.storedConfigName = globalStoredSettingsName
  store.set(config.defaults.storedConfigName, config);
  console.debug("STORED CONFIG" + " | " + config.defaults.storedConfigName);
  return;
}

const infoDivElement = document.getElementById("infoDiv");
const controlDivElement = document.getElementById("controlDiv");

// let serverActiveTimeout;
// const serverActiveTimeoutEventObj = new CustomEvent("serverActiveTimeoutEvent");

// const resetServerActiveTimer = () => {

//   if (currentSessionView !== undefined) {
//     currentSessionView.setEnableAgeNodes(true);
//   }

//   clearTimeout(serverActiveTimeout);

//   serverActiveTimeout = setTimeout(function () {
//     document.dispatchEvent(serverActiveTimeoutEventObj);
//   }, config.settings.serverActiveTimeoutInterval);
// }

let customizerWindow;
const customizerComm = (event) => {

  console.debug("CUSTOMIZE PANEL: " + event.origin);

  if (event.data === "DisableHTML5Autoplay_Initialize") {
    console.info("RX> CONTROL PANEL | DisableHTML5Autoplay_Initialize ... IGNORING ...");
    return;
  }

  switch (event.data.op) {

    case "READY":
      console.warn("R< CUSTOMIZE PANEL READY");
      // customizePanel = true;
      break;

    case "CLOSE":
      console.warn("R< CUSTOMIZE PANEL CLOSING...");
      resetConfigUpdateTimeOut();
      break;

    case "TOGGLE":

      console.warn("R< CUSTOMIZE PANEL TOGGLE");

      switch (event.data.id) {

        case "fullscreenToggleButton":
          toggleFullScreen();
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

        case "linkStrength":
          currentSessionView.setLinkStrength(event.data.value);
          break;

        case "linkDistance":
          currentSessionView.setLinkDistance(event.data.value);
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

        case "nodeMaxAge":
          currentSessionView.setNodeMaxAge(event.data.value);
          break;

        case "maxNodesLimit":
          currentSessionView.setMaxNodesLimit(event.data.value);
          break;

        case "nodeRadiusRatio":
          currentSessionView.setNodeRadiusRatioMin(event.data.min);
          currentSessionView.setNodeRadiusRatioMax(event.data.max);
          console.log(`CUSTOMIZER SET | setNodeRadiusRatio | min: ${event.data.min} max: ${event.data.max}`)
          break;

        case "fontSizeRatio":
          currentSessionView.setFontSizeRatioMin(event.data.min);
          currentSessionView.setFontSizeRatioMax(event.data.max);
          console.log(`CUSTOMIZER SET | setFontSizeRatio | min: ${event.data.min} max: ${event.data.max}`)
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

const openCustomizer = (cnf) => {
  
  console.debug("openCustomizer");
  console.debug({cnf})

  customizerWindow = window.open(
    DEFAULT_SOURCE + "/customize",
    "CUSTOMIZE",
    "width=1000,height=800"
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
      customizerWindow.postMessage({ op: "INIT", config: cnf, status: status }, DEFAULT_SOURCE);
      return;
    },
    false
  );

  return;
}

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
  if (!customizePanelFlag) {
    customizePanelFlag = !customizePanelFlag;
    openCustomizer(config)
  }
  else{
    if (customizerWindow) {
      customizerWindow.close();
    }
  }
  return;
}

const toggleInfo = () => {

  console.warn("toggleInfo");
  if (!infoPanelFlag) {
    infoPanelFlag = !infoPanelFlag;
  }

  infoDivElement.style.display = infoPanelFlag ? "unset" : "none";

  return;
}

const updateCustomizeButton = (customizePanelFlag) => {
  document.getElementById("customizeButton").innerHTML = customizePanelFlag
    ? "CLOSE CUSTOMIZE"
    : "CUSTOMIZE";
  return;
}

const addInfoButton = () => {
  const infoButton = document.createElement("BUTTON");
  infoButton.className = "button";
  infoButton.setAttribute("id", "infoButton");
  infoButton.onclick = toggleInfo;
  infoButton.innerHTML = infoPanelFlag ? "EXIT INFO" : "INFO";
  controlDivElement.appendChild(infoButton);
  return;
}

const addCustomizeButton = () => {
  const customizeButton = document.createElement("BUTTON");
  customizeButton.className = "button";
  customizeButton.setAttribute("id", "customizeButton");
  customizeButton.onclick = toggleCustomize;
  customizeButton.innerHTML = config.settings.customizeMode
    ? "EXIT CUSTOMIZE"
    : "CUSTOMIZE";
  controlDivElement.appendChild(customizeButton);
  return;
}

const addFullscreenButton = () => {
  const fullscreenButton = document.createElement("BUTTON");
  fullscreenButton.className = "button";
  fullscreenButton.setAttribute("id", "fullscreenButton");
  fullscreenButton.onclick = toggleFullScreen
  fullscreenButton.innerHTML = config.fullscreenMode
    ? "EXIT FULLSCREEN"
    : "FULLSCREEN";
  controlDivElement.appendChild(fullscreenButton);
  return;
}

let viewerReadyInterval;

function initViewerReadyInterval(interval) {
  console.log("INIT VIEWER READY INTERVAL");

  clearInterval(viewerReadyInterval);

  viewerReadyInterval = setInterval(function () {
    if (
      status.serverConnected &&
      !status.viewerReadyTransmitted &&
      !status.viewerReadyAck
    ) {
      viewerObj.timeStamp = Date.now();

      console.log(
        "T> VIEWER_READY" +
          " | " +
          viewerObj.userId +
          " | CONNECTED: " +
          status.serverConnected +
          " | READY TXD: " +
          status.viewerReadyTransmitted +
          " | READY ACK RXD: " +
          status.viewerReadyAck +
          " | " +
          getTimeStamp()
      );

      status.viewerReadyTransmitted = true;

      socket.emit(
        "VIEWER_READY",
        { userId: viewerObj.userId, timeStamp: Date.now() },
        function () {
          status.viewerReadyTransmitted = true;
        }
      );

      clearInterval(viewerReadyInterval);
    } else if (
      status.serverConnected &&
      status.viewerReadyTransmitted &&
      !status.viewerReadyAck
    ) {
      if (status.userReadyAckWait > DEFAULT_MAX_READY_ACK_WAIT_COUNT) {
        status.viewerReadyTransmitted = false;
        console.log(`*** RESENDING _READY AFTER | ${DEFAULT_MAX_READY_ACK_WAIT_COUNT} WAIT CYCLES`);
      } else {
        status.userReadyAckWait += 1;
        console.log(`... WAITING FOR VIEWER_READY_ACK | ${DEFAULT_MAX_READY_ACK_WAIT_COUNT} WAIT CYCLES`);
      }
    } else if (!status.serverConnected) {
      console.log("... WAITING FOR SERVER CONNECTION ...");
    }
  }, interval);
}

function sendKeepAlive(viewerObj, callback) {
  if (status.viewerReadyAck && status.serverConnected) {
    const statusSmall = status;
    delete statusSmall.heartBeat;

    socket.emit("SESSION_KEEPALIVE", {
      user: viewerObj,
      stats: statusSmall,
      results: {},
    });

    callback(null);
  } else {
    console.error(
      "!!!! CANNOT TX KEEPALIVE" +
        " | " +
        viewerObj.userId +
        " | CONNECTED: " +
        status.serverConnected +
        " | READY TXD: " +
        status.viewerReadyTransmitted +
        " | READY ACK RXD: " +
        status.viewerReadyAck +
        " | " +
        moment().format(defaultDateTimeFormat)
    );
    callback("ERROR");
  }
}

let socketKeepaliveInterval;

function initKeepalive(viewerObj, interval) {
  clearInterval(socketKeepaliveInterval);

  console.log("START KEEPALIVE | READY ACK: " + status.viewerReadyAck +
    " | SERVER CONNECTED: " + status.serverConnected +
    " | INTERVAL: " + interval + " ms"
  );

  sendKeepAlive(viewerObj, function (err) {
    if (err) {
      console.error("KEEPALIVE ERROR: " + err);
    }
  });

  socketKeepaliveInterval = setInterval(function () {

    status.elapsed = Date.now() - status.startTime;
    viewerObj.stats = status;

    sendKeepAlive(viewerObj, function (err) {
      if (err) {
        console.error("KEEPALIVE ERROR: " + err);
      }
    });

  }, interval);
}

let socket;

const rxNode = function (node) {
  
  if (rxNodeQueue.length >= config.settings.rxNodeQueueMax) {
    return;
  }

  if (node.nodeType !== "tweet" && node.nodeType !== "user" && node.nodeType !== "hashtag") {
    return;
  }

  rxNodeQueue.push(node);
};

function initSocketHandler () {

  socket.on("connect", function () {

    viewerObj.socketId = socket.id;

    status.socketId = socket.id;
    status.serverConnected = true;
    status.socket.connected = true;

    if (currentSessionView !== undefined) {
      currentSessionView.setEnableAgeNodes(true);
    }
    console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);

    status.socket.connects += 1;

    viewerObj.timeStamp = Date.now();

    socket.emit("authentication", {
      namespace: "view",
      userId: viewerObj.userId,
      password: "0123456789",
    });
    
  });

  socket.on("SERVER_READY", function (serverAck) {
    status.serverConnected = true;
    status.socket.connected = true;
    console.log("RX SERVER_READY | SERVER ACK: " + jsonPrint(serverAck));
  });

  socket.on("VIEWER_READY_ACK", function (vSesKey) {
    status.serverConnected = true;
    status.socket.connected = true;
    status.viewerReadyAck = true;

    console.log("RX VIEWER_READY_ACK | SESSION KEY: " + vSesKey);

    status.viewerSessionKey = vSesKey;
    viewerObj.viewerSessionKey = vSesKey;

    if (config.settings.VIEWER_OBJ === undefined) {
      config.settings.VIEWER_OBJ = {};
    }

    config.settings.VIEWER_OBJ = viewerObj;

    console.debug("STORE CONFIG ON VIEWER_READY_ACK");
    saveConfig();

    initKeepalive(viewerObj, config.settings.keepaliveInterval);
  });

  socket.on("USER_AUTHENTICATED", function (userObj) {
    status.isAuthenticated = true;
    status.socket.connected = true;
    console.log("RX USER_AUTHENTICATED | USER: @" + userObj.screenName);
  });

  socket.on("reconnect", function () {
    viewerObj.socketId = socket.id;

    status.serverConnected = true;
    console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);

    status.socket.reconnects += 1;
    status.socket.connected = true;

    viewerObj.timeStamp = Date.now();

    socket.emit("VIEWER_READY", viewerObj, function () {
      status.viewerReadyTransmitted = true;
      socket.emit("authentication", {
        namespace: "view",
        userId: viewerObj.userId,
        password: "0123456789",
      });
    });
  });

  socket.on("disconnect", function () {
    status.serverConnected = false;
    status.socket.connected = false;
    console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  });

  let socketErrorTimeout;

  socket.on("error", function (error) {
    status.socket.errors += 1;
    status.socket.error = error;

    console.log("*** SOCKET ERROR ... DELETING ALL SESSIONS ...");
    console.error("*** SOCKET ERROR\n" + error);

    // if (currentSessionView !== undefined) {
    //   currentSessionView.resize();
    // }

    socket.disconnect(true); // full disconnect, not just namespace

    clearTimeout(socketErrorTimeout);

    socketErrorTimeout = setTimeout(function () {
      socket.connect();
    }, 5000);
  });

  socket.on("connect_error", function (error) {
    status.socket.errors += 1;
    status.socket.error = error;
    console.log("*** SOCKET CONNECT ERROR ... DELETING ALL SESSIONS ...");
    console.error("*** SOCKET CONNECT ERROR\n" + error);
  });

  socket.on("reconnect_error", function (error) {
    status.socket.errors += 1;
    status.socket.error = error;
    console.log("*** SOCKET RECONNECT ERROR ... DELETING ALL SESSIONS ...");
    console.error("*** SOCKET RECONNECT ERROR\n" + error);
  });

  socket.on("unauthorized", function (err) {
    status.serverConnected = true;
    console.error("*** UNAUTHORIZED *** | ID: " + socket.id +
      " | VIEWER ID: " + viewerObj.userId +
      " | " + err.message
    );
  });

  socket.on("authenticated", function () {
    console.debug("AUTHENTICATED | " + socket.id);
    status.socketId = socket.id;
    status.serverConnected = true;
    status.userReadyTransmitted = false;
    status.userReadyAck = false;
    console.log("CONNECTED TO HOST | ID: " + socket.id);
    initViewerReadyInterval(config.settings.viewerReadyInterval);
  });

  const sSmall = {};
  sSmall.bestNetwork = {};

  socket.on("action", (action) => {

    switch (action.type){

      case "heartbeat":

        status.serverConnected = true;
        status.socket.connected = true;

        console.log(`<R HB | ${action.data.timeStamp}`);

        if (customizerWindow) {
          customizerWindow.postMessage({ op: "HEARTBEAT", status: action.data }, DEFAULT_SOURCE);
        }

        break

      default:
    }
  });

  socket.on("node", rxNode);

  return;
}

let socketSessionUpdateInterval;

function initSocketSessionUpdateRx() {

  rxNodeQueueReady = true;

  let newNode = {};
  let category;
  let viewNodeAddQlength = 0;

  clearInterval(socketSessionUpdateInterval);

  socketSessionUpdateInterval = setInterval(function () {

    viewNodeAddQlength = currentSessionView.getNodeAddQlength();

    if (rxNodeQueueReady && rxNodeQueue.length > 0 && viewNodeAddQlength <= 1.5 * config.settings.rxNodeQueueMax) {

      rxNodeQueueReady = false;

      newNode = rxNodeQueue.shift();

      if (config.autoCategoryFlag && newNode.categoryAuto) {
        category = newNode.categoryAuto;
      } 
      else {
        category = newNode.category;
      }

      if (newNode.categoryAuto !== "none" && (category === undefined || category === "none")) {
        newNode.categoryColor = categoryColorHashMap.get("auto");
      } 
      else if (category === undefined || category === "none") {
        newNode.categoryColor = categoryColorHashMap.get("none");
      } 
      else {
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

      newNode.categoryMismatch = newNode.category !== "none" && newNode.category && newNode.categoryAuto && newNode.category !== newNode.categoryAuto;
      newNode.categoryMatch = newNode.category !== "none" && newNode.category && newNode.categoryAuto && newNode.category === newNode.categoryAuto;

      currentSessionView.addNode(newNode);
      rxNodeQueueReady = true;

    }

  }, config.settings.rxNodeQueueInterval);

  return;
}

function getBrowserPrefix() {
  // Check for the unprefixed property.
  // if ("hidden" in document) {
  if (document.hidden !== undefined) {
    return null;
  }
  // All the possible prefixes.
  const browserPrefixes = ["moz", "ms", "o", "webkit"];
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

const prefix = getBrowserPrefix();
const hidden = hiddenProperty(prefix);
const visibilityEvent = getVisibilityEvent(prefix);
let windowVisible = true;

function displayControl(isVisible) {
  controlDivElement.style.display = isVisible ? "unset" : "none";
}

const mouseMoveTimeoutEventObj = new CustomEvent("mouseMoveTimeoutEvent");
let mouseMoveTimeout;
// let mouseMovingFlag = false;
const mouseMoveTimeoutInterval = 2000;

function resetMouseMoveTimer() {
  clearTimeout(mouseMoveTimeout);

  mouseMoveTimeout = setTimeout(function () {
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

document.addEventListener("mousemove", function () {
    if (currentSessionView) {
      if (config.settings.pauseOnMouseMove) {
        currentSessionView.simulationControl("PAUSE");
      }
      // mouseMovingFlag = true;
      currentSessionView.mouseMoving(true);
      displayControl(true);
      resetMouseMoveTimer();
    }
  },
  true
);

document.addEventListener("panzoomEvent", function () {
    if (currentSessionView) {
      config.settings.panzoom.transform = currentSessionView.getPanzoomTransform();
      saveConfig();
    }
  },
  true
);

const loadStoredSettings = () => {
  console.log("LOADING STORED SETTINGS: " + globalStoredSettingsName);
  return store.get(globalStoredSettingsName);
}

// function Node() {
//   this.isFixedNode = false;
//   this.disableAging = false;
//   this.age = 1e-6;
//   this.ageMaxRatio = 1e-6;
//   this.ageUpdated = Date.now();
//   this.category = "none";
//   this.categoryAuto = "none";
//   this.categoryColor = "#FFFFFF";
//   this.categoryMatch = false;
//   this.categoryMismatch = false;
//   this.following = false;
//   this.followersCount = 0;
//   this.followersMentions = 0;
//   this.friendsCount = 0;
//   this.fullName = 0;
//   this.hashtagId = false;
//   this.index = 0;
//   this.isBot = false;
//   this.isTweeter = false;
//   this.isDead = true;
//   this.isIgnored = false;
//   this.isMaxNode = false;
//   this.isTopTerm = false;
//   this.isTrendingTopic = false;
//   this.isValid = false;
//   this.lastTweetId = false;
//   this.mentions = 0;
//   this.mouseHoverFlag = false;
//   this.name = "";
//   this.newFlag = true;
//   this.nodeId = "";
//   this.nodeType = "user";
//   this.rank = -1;
//   this.rate = 1e-6;
//   this.screenName = "";
//   this.statusesCount = 0;
//   this.text = "";
//   this.fx = null;
//   this.fy = null;
//   this.vx = 1e-6;
//   this.vy = 1e-6;
//   this.x = 1e-6;
//   this.y = 1e-6;
// }

function getWindowDimensions () {

  if (window.outerWidth !== "undefined") {
    return { width: window.outerWidth, height: window.outerHeight };
  }
  if (window.innerWidth !== "undefined") {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)

  if (
    document.documentElement !== "undefined" &&
    document.documentElement.clientWidth !== "undefined" &&
    document.documentElement.clientWidth !== 0
  ) {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };
  }
  // older versions of IE
  return {
    width: document.getElementsByTagName("body")[0].clientWidth,
    height: document.getElementsByTagName("body")[0].clientHeight,
  };
}

let width = getWindowDimensions().width;
let height = getWindowDimensions().height;

window.addEventListener("beforeunload",
  function () {
    console.log("CLOSING...");
    if (customizerWindow){ customizerWindow.close() }
    customizePanelFlag = false;
  },
  false
);

window.addEventListener("load",
  function () {

    console.log("LOAD SESSION");

    width = getWindowDimensions().width;
    height = getWindowDimensions().height;

    config.settings.panzoom.transform.x = 0.5 * width;
    config.defaults.panzoom.transform.x = 0.5 * width;
    config.settings.panzoom.transform.y = 0.5 * height;
    config.defaults.panzoom.transform.y = 0.5 * height;

  },

  false
);

const nodeSearch = (event) => {
// { detail: { node: d }}

  console.log(`EVENT | NODE SEARCH | TYPE: ${event.detail.node.nodeType} | @${event.detail.node.screenName}`);

  let searchNode

  switch (event.detail.node.nodeType){
    case "user":
      searchNode = "@" + event.detail.node.screenName;
    break;
    case "hashtag":
      searchNode = "#" + event.detail.node.nodeId;
    break;
    default:
      console.error(`EVENT | NODE SEARCH | UNKNOWN TYPE: ${event.detail.node.nodeType}`);
      return;
  }

  socket.emit("TWITTER_SEARCH_NODE", {searchNode: searchNode})
}

document.addEventListener("nodeSearch", nodeSearch, false);


setTimeout(function(){

  try{

    const storedSettings = loadStoredSettings();

    if (storedSettings) {
      console.log(`LOADED STORED SETTINGS`)
      console.log({storedSettings}) 
      config = Object.assign({}, config, storedSettings)
    }
    else{
      console.log(`*** LOAD STORED SETTINGS FAILED: ${globalStoredSettingsName}`)
    }

    socket = io("/view");

    // addInfoButton();
    addCustomizeButton();
    addFullscreenButton();

    console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

    viewerObj.timeStamp = Date.now();

    socket.emit("VIEWER_READY", viewerObj, function () {
      status.viewerReadyTransmitted = true;
    });

    currentSessionView = ViewForceLinks(config);
    currentSessionView.initD3timer();
    initSocketHandler()
    resetMouseMoveTimer()
    initSocketSessionUpdateRx()

  }
  catch(err){
    console.error({err})
  }

}, 100)
