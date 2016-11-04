/*ver 0.47*/
/*jslint node: true */
"use strict";

/*
to create links in ticker view, need a way to track which words are the same in all streams/groups/sessions.
then just create links between the common words in each stream
should all instances of the word to be linked to all of the others? 
hashmap
word -> array of nodes
when new instance of word arrives, iterate thru array of nodes and create linkskk
*/

// var DEFAULT_SOURCE = "http://localhost:9997";
// var DEFAULT_SOURCE = "http://word.threeceelabs.com";
var DEFAULT_SOURCE = "==SOURCE==";  // will be updated by wordAssoServer.js on app.get

var d3;
var controlPanel;
var controlTableHead;
var controlTableBody;
var controlSliderTable;

var statusSessionId;
var statusSession2Id;

var initializedFlag = false;

// requirejs(["http://d3js.org/d3.v4.min.js"], function(d3Loaded) {
requirejs(["https://cdnjs.cloudflare.com/ajax/libs/d3/4.3.0/d3.min.js"], function(d3Loaded) {
    console.log("d3 LOADED");
    d3 = d3Loaded;
    initialize(function(){
      initializedFlag = true;
      addControlButton();
      if (!config.pauseFlag) currentSessionView.simulationControl('RESUME');
    });
  },
  function(error) {
    console.log('REQUIREJS ERROR handler', error);
    //error.requireModules : is Array of all failed modules
    var failedId = error.requireModules && error.requireModules[0];
    console.log(failedId);
    console.log(error.message);
  }
);

var DEFAULT_SESSION_VIEW = 'force';
var currentSessionView;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var pageLoadedTimeIntervalFlag = true;

var debug = false;
var MAX_RX_QUEUE = 250;
var QUEUE_MAX = 200;
var MAX_WORDCHAIN_LENGTH = 100;
var DEFAULT_MAX_AGE = 20000;
var FORCE_MAX_AGE = 10347;
var DEFAULT_AGE_RATE = 1.0;

var DEFAULT_CHARGE = 5;
var DEFAULT_GRAVITY = 0.005;
var DEFAULT_LINK_STRENGTH = 0.80;
var DEFAULT_LINK_DISTANCE = 10.0;
var DEFAULT_VELOCITY_DECAY = 0.950;

var DEFAULT_NODE_RADIUS = 20.0;

var config = {};

config.antonymFlag = false;
config.pauseFlag = false;
config.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??
config.maxWords = 100;
config.testMode = false;
config.showStatsFlag = false;
config.removeDeadNodesFlag = true;

config.defaultMultiplier = 1000.0;
config.defaultCharge = DEFAULT_CHARGE;
config.defaultGravity = DEFAULT_GRAVITY;
config.defaultLinkStrength = DEFAULT_LINK_STRENGTH;
config.defaultLinkDistance = DEFAULT_LINK_DISTANCE;
config.defaultVelocityDecay = DEFAULT_VELOCITY_DECAY;
config.defaultNodeRadius = DEFAULT_NODE_RADIUS;


if ((config.sessionViewType == 'ticker') 
  // || (config.sessionViewType == 'flow')
  ) {
  config.disableLinks = true;
}
else{
  config.disableLinks = false;
}

var statsObj = {};
statsObj.socketId = null;

var palette = {
  "black": "#000000",
  "white": "#FFFFFF",
  "lightgray": "#819090",
  "gray": "#708284",
  "mediumgray": "#536870",
  "darkgray": "#475B62",
  "darkblue": "#0A2933",
  "darkerblue": "#042029",
  "paleryellow": "#FCF4DC",
  "paleyellow": "#EAE3CB",
  "yellow": "#A57706",
  "orange": "#BD3613",
  "red": "#D11C24",
  "pink": "#C61C6F",
  "purple": "#595AB7",
  "blue": "#2176C7",
  "green": "#259286",
  "yellowgreen": "#738A05"
};

var ignoreWordsArray = [
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

ignoreWordsArray.push('"');
ignoreWordsArray.push("'");

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
}

function displayControl(isVisible) {
  var v = 'hidden';
  if (isVisible) v = 'visible';
  document.getElementById('controlDiv').style.visibility = v;
}

function displayInfo(isVisible) {
  var v = 'hidden';
  if (isVisible) v = 'visible';
  // controlPanel.document.getElementById('infoDiv').style.visibility = v;
}

var mouseMoveTimeout;
var mouseMovingFlag = false;
var mouseMoveTimeoutInterval = 2000;

var mouseMoveTimeout;

function resetMouseMoveTimer() {

  clearTimeout(mouseMoveTimeout);

  mouseMoveTimeout = setTimeout(function() {

    mouseMovingFlag = false;
    d3.select("body").style("cursor", "none");

    if (!config.pauseFlag) currentSessionView.simulationControl('RESUME');

    if (!config.showStatsFlag && !pageLoadedTimeIntervalFlag) {
      displayInfo(false);
      displayControl(false);
    }

  }, mouseMoveTimeoutInterval);
}

document.addEventListener("mousemove", function() {
  currentSessionView.simulationControl('PAUSE');
  mouseMovingFlag = true;
  displayControl(true);
  displayInfo(true);
  resetMouseMoveTimer();
}, true);

var dragEndPosition = { 'id': 'ID', 'x': 47, 'y': 147};

document.addEventListener("dragEnd", function(e) {
  console.log("DRAG END: " + jsonPrint(dragEndPosition));
  if (sessionHashMap.has(dragEndPosition.id)){
    var dragSession = sessionHashMap.get(dragEndPosition.id);
    dragSession.initialPosition.x = dragEndPosition.x;
    dragSession.initialPosition.y = dragEndPosition.y;
    dragSession.node.px = dragEndPosition.x;
    dragSession.node.py = dragEndPosition.y;
    sessionHashMap.set(dragSession.nodeId, dragSession);
    nodeHashMap.set(dragSession.node.nodeId, dragSession.node);
    // console.error("dragSession\n" + jsonPrint(dragSession));
  }
});

var sessionDragEndEvent = new CustomEvent(
  'dragEnd', { 
    'detail': dragEndPosition
  } 
);


function setLinkStrengthSliderValue(value) {
  controlPanel.document.getElementById("linkStrengthSlider").value = value * controlPanel.document.getElementById("linkStrengthSlider").getAttribute("multiplier");
  currentSessionView.updateLinkStrength(value);
}

function setvelocityDecaySliderValue(value) {
  controlPanel.document.getElementById("velocityDecaySlider").value = value;
  currentSessionView.updateVelocityDecay(value);
}

function setGravitySliderValue(value) {
  controlPanel.document.getElementById("gravitySlider").value = value;
  currentSessionView.updateGravity(value);
}

function setChargeSliderValue(value) {
  controlPanel.document.getElementById("chargeSlider").value = value;
  currentSessionView.updateCharge(value);
}

function setMaxAgeSliderValue(value) {
  controlPanel.document.getElementById("maxAgeSlider").value = value;
  currentSessionView.setNodeMaxAge(value);
}


var controlPanelWindow; 
var controlPanelFlag = false;

window.onbeforeunload = function() {
  controlPanelFlag = false;
  controlPanelWindow.close();
}

function toggleControlPanel(){
  // console.warn("toggleControlPanel: " + controlPanelFlag);

  if (controlPanelFlag){
    controlPanelWindow.close();
    controlPanelFlag = false;
    updateControlButton(controlPanelFlag);
    console.debug("toggleControlPanel: " + controlPanelFlag);
  }
  else {

    var cnf = {};

    cnf.defaultMaxAge = DEFAULT_MAX_AGE;
    cnf.defaultGravity = DEFAULT_GRAVITY;
    cnf.defaultCharge = DEFAULT_CHARGE;
    cnf.defaultLinkStrength = DEFAULT_LINK_STRENGTH;
    cnf.defaultLinkDistance = DEFAULT_LINK_DISTANCE;
    cnf.defaultVelocityDecay = DEFAULT_VELOCITY_DECAY;
    cnf.defaultNodeRadius = DEFAULT_NODE_RADIUS;

    createPopUpControlPanel(cnf, function(cpw){
      controlPanelFlag = true;
      updateControlButton(controlPanelFlag);
      console.debug("createPopUpControlPanel toggleControlPanel: " + controlPanelFlag);
      setTimeout(function(){
        cpw.postMessage({op: 'INIT', config: cnf}, DEFAULT_SOURCE);
      }, 200);
    });
  }

}

function updateControlButton(controlPanelFlag){
  var cpButton = document.getElementById('controlPanelButton');
  cpButton.innerHTML = controlPanelFlag ? 'HIDE CONTROL' : 'SHOW CONTROL';
}

function addControlButton(){
  var controlDiv = document.getElementById('controlDiv');
  var controlPanelButton = document.createElement("BUTTON");
  controlPanelButton.className = 'button';
  controlPanelButton.setAttribute('id', 'controlPanelButton');
  controlPanelButton.setAttribute('onclick', 'toggleControlPanel()');
  controlPanelButton.innerHTML = controlPanelFlag ? 'HIDE CONTROL' : 'SHOW CONTROL';
  controlDiv.appendChild(controlPanelButton);
}


function createPopUpControlPanel (cnf, callback) {

  console.debug("createPopUpControlPanel\ncnf\n" + jsonPrint(cnf));


  controlPanelWindow = window.open("controlPanel.html", "CONTROL", "width=800,height=600");

  controlPanelWindow.addEventListener('beforeunload', function(){
    console.log("CONTROL POP UP CLOSING...");
    controlPanelFlag = false;
    updateControlButton(controlPanelFlag);
  }, false);

  controlPanelWindow.addEventListener('load', function(cnf){
    controlPanel = new controlPanelWindow.ControlPanel(cnf);
    initControlPanelComm(cnf);
    controlPanelFlag = true;
    callback(controlPanelWindow);
  }, false);
};

function controlPanelComm(event) {
  // console.debug("CONTROL PANEL: " + jsonPrint(event)); // prints: { message: 'Hello world!'} 

  var data = event.data;

  // Do we trust the sender of this message?
  // if (event.origin !== "http://example.com:8080")
  //   return;

  switch (data.op) {
    case 'READY' :
      console.warn("CONTROL PANEL READY");
    break;
    case 'CLOSE' :
      console.warn("CONTROL PANEL CLOSING...");
    break;
    case 'MOMENT' :
      console.warn("CONTROL PANEL MOMENT...");
      switch (data.id) {
        case 'resetButton' :
          reset();
        break;
        default:
          console.error("CONTROL PANEL UNKNOWN MOMENT BUTTON");
        break;
      }
    break;
    case 'TOGGLE' :
      console.warn("CONTROL PANEL TOGGLE");
      switch (data.id) {
        case 'fullscreenToggleButton' :
          toggleFullScreen();
        break;
        case 'pauseToggleButton' :
          togglePause();
        break;
        case 'statsToggleButton' :
          toggleStats();
        break;
        case 'testModeToggleButton' :
          toggleTestMode();
        break;
        case 'disableLinksToggleButton' :
          toggleDisableLinks();
        break;
        case 'nodeCreateButton' :
          // createTextNode;
        break;
        case 'antonymToggleButton' :
          toggleAntonym();
        break;
        case 'removeDeadNodeToogleButton' :
          toggleRemoveDeadNode();
        break;
        default:
          console.error("CONTROL PANEL UNKNOWN TOGGLE BUTTON");
        break;
      }
    break;
    case 'UPDATE' :
      console.warn("CONTROL PANEL UPDATE");
      switch (data.id) {
        case 'linkStrengthSlider' :
          currentSessionView.updateLinkStrength(data.value);
        break;
        case 'linkDistanceSlider' :
          currentSessionView.updateLinkDistance(data.value);
        break;
        case 'velocityDecaySlider' :
          currentSessionView.updateVelocityDecay(data.value);
        break;
        case 'gravitySlider' :
          currentSessionView.updateGravity(data.value);
        break;
        case 'chargeSlider' :
          currentSessionView.updateCharge(data.value);
        break;
        case 'maxAgeSlider' :
          currentSessionView.setNodeMaxAge(data.value);
        break;
      }
    break;
    default :
      console.error("CONTROL PANEL OP UNDEFINED: " + jsonPrint(data));
    break;
  }
}

function initControlPanelComm(cnf){

  // lsbridge.subscribe('controlPanel', function(data) {

  window.addEventListener("message", controlPanelComm, false);

}

function toggleAntonym() {
  config.antonymFlag = !config.antonymFlag;
  currentSessionView.setAntonym(config.antonymFlag);
  console.warn("TOGGLE ANT: " + config.antonymFlag);
  controlPanel.updateControlPanel(config);
}

function togglePause() {
  config.pauseFlag = !config.pauseFlag;
  currentSessionView.setPause(config.pauseFlag);
  console.warn("TOGGLE PAUSE: " + config.pauseFlag);
  controlPanel.updateControlPanel(config);
}

function toggleRemoveDeadNode() {
  config.removeDeadNodesFlag = !config.removeDeadNodesFlag;
  currentSessionView.removeDeadNodesFlag = config.removeDeadNodesFlag;
  console.warn("TOGGLE REMOVE DEAD NODES: " + config.removeDeadNodesFlag);
  controlPanel.updateControlPanel(config);
}

function toggleDisableLinks() {
  config.disableLinks = !config.disableLinks;
  currentSessionView.disableLinks = config.disableLinks;
  if (config.disableLinks) linkHashMap.clear();
  console.warn("TOGGLE DISABLE LINKS: " + config.disableLinks);
  controlPanel.updateControlPanel(config);
}

function toggleStats() {
  config.showStatsFlag = !config.showStatsFlag;

  if (config.showStatsFlag) {
    displayInfo(1);
  } else {
    displayInfo(0);
  }
  console.warn("TOGGLE STATS: " + config.showStatsFlag);
  controlPanel.updateControlPanel(config);
}

function toggleTestMode() {
  config.testMode = !config.testMode;
  config.testModeEnabled = config.testMode;
  console.warn("TEST MODE: " + config.testModeEnabled);

  if (config.testModeEnabled) {
    setTimeout(currentSessionView.initTestAddNodeInterval(1000), 1047);
    setTimeout(currentSessionView.initTestAddLinkInterval(1000), 2047);
    setTimeout(currentSessionView.initTestDeleteNodeInterval(1000), 5047);
  } else {
    currentSessionView.clearTestAddNodeInterval();
    currentSessionView.clearTestAddLinkInterval();
    currentSessionView.clearTestDeleteNodeInterval();
  }

  controlPanel.updateControlPanel(config);
}

var serverConnected = false;
var serverHeartbeatTimeout = 30000;
var serverCheckInterval = 30000;
var serverKeepaliveInteval = 10000;

var groupHashMap = new HashMap();
var groupDeleteHashMap = new HashMap();

var sessionHashMap = new HashMap();
var sessionDeleteHashMap = new HashMap();

var linkHashMap = new HashMap();
var nodeHashMap = new HashMap();

var ignoreWordHashMap = new HashMap();

var keywordHashMap = new HashMap();

keywordHashMap.set('aid', palette.green);
keywordHashMap.set('assist', palette.green);
keywordHashMap.set('birth', palette.green);
keywordHashMap.set('blacklivesmatter', palette.green);
keywordHashMap.set('care', palette.green);
keywordHashMap.set('constitution', palette.green);
keywordHashMap.set('constitutional', palette.green);
keywordHashMap.set('defend', palette.green);
keywordHashMap.set('democracy', palette.green);
keywordHashMap.set('dependable', palette.green);
keywordHashMap.set('donate', palette.green);
keywordHashMap.set('dream', palette.green);
keywordHashMap.set('education', palette.green);
keywordHashMap.set('empathetic', palette.green);
keywordHashMap.set('empathy', palette.green);
keywordHashMap.set('equality', palette.green);
keywordHashMap.set('faith', palette.green);
keywordHashMap.set('heal', palette.green);
keywordHashMap.set('help', palette.green);
keywordHashMap.set('thank', palette.green);
keywordHashMap.set('pray', palette.green);
keywordHashMap.set('bless', palette.green);
keywordHashMap.set('thanks', palette.green);
keywordHashMap.set('honest', palette.green);
keywordHashMap.set('honestly', palette.green);
keywordHashMap.set('honesty', palette.green);
keywordHashMap.set('hope', palette.green);
keywordHashMap.set('independence', palette.green);
keywordHashMap.set('integracy', palette.green);
keywordHashMap.set('justice', palette.green);
keywordHashMap.set('life', palette.green);
keywordHashMap.set('libery', palette.green);
keywordHashMap.set('freedom', palette.green);
keywordHashMap.set('love', palette.green);
keywordHashMap.set('patriotic', palette.green);
keywordHashMap.set('protect', palette.green);
keywordHashMap.set('protector', palette.green);
keywordHashMap.set('protectors', palette.green);
keywordHashMap.set('protects', palette.green);
keywordHashMap.set('protest', palette.green);
keywordHashMap.set('rebuild', palette.green);
keywordHashMap.set('reliable', palette.green);
keywordHashMap.set('restore', palette.green);
keywordHashMap.set('rights', palette.green);
keywordHashMap.set('trust', palette.green);
keywordHashMap.set('trustworthy', palette.green);
keywordHashMap.set('water', palette.green);
keywordHashMap.set('sustainable', palette.green);
keywordHashMap.set('renewable', palette.green);
keywordHashMap.set('growth', palette.green);
keywordHashMap.set('healthy', palette.green);
keywordHashMap.set('happy', palette.green);
keywordHashMap.set('future', palette.green);
keywordHashMap.set('earth', palette.green);
keywordHashMap.set('terra', palette.green);
keywordHashMap.set('citizen', palette.green);
keywordHashMap.set('citizenship', palette.green);
keywordHashMap.set('america', palette.green);
keywordHashMap.set('american', palette.green);
keywordHashMap.set('americans', palette.green);
keywordHashMap.set('vote', palette.green);
keywordHashMap.set('votes', palette.green);
keywordHashMap.set('voters', palette.green);
keywordHashMap.set('voter', palette.green);
keywordHashMap.set('voting', palette.green);
keywordHashMap.set('children', palette.green);
keywordHashMap.set('friend', palette.green);
keywordHashMap.set('friends', palette.green);
keywordHashMap.set('grateful', palette.green);
keywordHashMap.set('activist', palette.green);
keywordHashMap.set('social', palette.green);
keywordHashMap.set('reform', palette.green);
keywordHashMap.set('correct', palette.green);
keywordHashMap.set('stronger', palette.green);
keywordHashMap.set('strong', palette.green);
keywordHashMap.set('positive', palette.green);
keywordHashMap.set('health', palette.green);
keywordHashMap.set('healthy', palette.green);
keywordHashMap.set('marijuana', palette.green);
keywordHashMap.set('cannibis', palette.green);
keywordHashMap.set('housing', palette.green);
keywordHashMap.set('community', palette.green);
keywordHashMap.set('communities', palette.green);
keywordHashMap.set('diverse', palette.green);
keywordHashMap.set('diversity', palette.green);
keywordHashMap.set('sensitive', palette.green);
keywordHashMap.set('sensitivity', palette.green);
keywordHashMap.set('value', palette.green);
keywordHashMap.set('values', palette.green);
keywordHashMap.set('judgement', palette.green);
keywordHashMap.set('opportunity', palette.green);
keywordHashMap.set('good', palette.green);
keywordHashMap.set('great', palette.green);
keywordHashMap.set('excellent', palette.green);
keywordHashMap.set('amazing', palette.green);
keywordHashMap.set('best', palette.green);
keywordHashMap.set('success', palette.green);
keywordHashMap.set('free', palette.green);
keywordHashMap.set('truth', palette.green);
keywordHashMap.set('clean', palette.green);
keywordHashMap.set('green', palette.green);
keywordHashMap.set('environmentalist', palette.green);
keywordHashMap.set('environmentalists', palette.green);
keywordHashMap.set('benefit', palette.green);
keywordHashMap.set('benefits', palette.green);
keywordHashMap.set('safe', palette.green);
keywordHashMap.set('secure', palette.green);

keywordHashMap.set('administration', palette.yellow);
keywordHashMap.set('administrations', palette.yellow);
keywordHashMap.set('service', palette.yellow);
keywordHashMap.set('services', palette.yellow);
keywordHashMap.set('crimes', palette.yellow);
keywordHashMap.set('criminals', palette.yellow);
keywordHashMap.set('criminality', palette.yellow);
keywordHashMap.set('florida', palette.yellow);
keywordHashMap.set('sex', palette.yellow);
keywordHashMap.set('other', palette.yellow);
keywordHashMap.set('coalition', palette.yellow);
keywordHashMap.set('party', palette.yellow);
keywordHashMap.set('opposition', palette.yellow);
keywordHashMap.set('program', palette.yellow);
keywordHashMap.set('programs', palette.yellow);
keywordHashMap.set('industries', palette.yellow);
keywordHashMap.set('revenues', palette.yellow);
keywordHashMap.set('revenue', palette.yellow);
keywordHashMap.set('hurt', palette.yellow);
keywordHashMap.set('hurts', palette.yellow);
keywordHashMap.set('network', palette.yellow);
keywordHashMap.set('networks', palette.yellow);
keywordHashMap.set('enterprise', palette.yellow);
keywordHashMap.set('enterprises', palette.yellow);
keywordHashMap.set('company', palette.yellow);
keywordHashMap.set('companies', palette.yellow);
keywordHashMap.set('energy', palette.yellow);
keywordHashMap.set('districts', palette.yellow);
keywordHashMap.set('district', palette.yellow);
keywordHashMap.set('columbia', palette.yellow);
keywordHashMap.set('d.c.', palette.yellow);
keywordHashMap.set('dc', palette.yellow);
keywordHashMap.set('protection', palette.yellow);
keywordHashMap.set('protections', palette.yellow);
keywordHashMap.set('contract', palette.yellow);
keywordHashMap.set('contracts', palette.yellow);
keywordHashMap.set('aunt', palette.yellow);
keywordHashMap.set('aunts', palette.yellow);
keywordHashMap.set('uncle', palette.yellow);
keywordHashMap.set('uncles', palette.yellow);
keywordHashMap.set('brothers', palette.yellow);
keywordHashMap.set('farming', palette.yellow);
keywordHashMap.set('farmers', palette.yellow);
keywordHashMap.set('working', palette.yellow);
keywordHashMap.set('world', palette.yellow);
keywordHashMap.set('dirty', palette.yellow);
keywordHashMap.set('supports', palette.yellow);
keywordHashMap.set('historical', palette.yellow);
keywordHashMap.set('media', palette.yellow);
keywordHashMap.set('agriculture', palette.yellow);
keywordHashMap.set('endangered', palette.yellow);
keywordHashMap.set('legislation', palette.yellow);
keywordHashMap.set('slave', palette.yellow);
keywordHashMap.set('slaves', palette.yellow);
keywordHashMap.set('civil', palette.yellow);
keywordHashMap.set('confederate', palette.yellow);
keywordHashMap.set('confederacy', palette.yellow);
keywordHashMap.set('army', palette.yellow);
keywordHashMap.set('armies', palette.yellow);
keywordHashMap.set('navy', palette.yellow);
keywordHashMap.set('marine', palette.yellow);
keywordHashMap.set('marines', palette.yellow);
keywordHashMap.set('air', palette.yellow);
keywordHashMap.set('water', palette.yellow);
keywordHashMap.set('force', palette.yellow);
keywordHashMap.set('speech', palette.yellow);
keywordHashMap.set('slavery', palette.yellow);
keywordHashMap.set('mistake', palette.yellow);
keywordHashMap.set('thousand', palette.yellow);
keywordHashMap.set('thousands', palette.yellow);
keywordHashMap.set('pope', palette.yellow);
keywordHashMap.set('priest', palette.yellow);
keywordHashMap.set('priests', palette.yellow);
keywordHashMap.set('ambassador', palette.yellow);
keywordHashMap.set('minority', palette.yellow);
keywordHashMap.set('majority', palette.yellow);
keywordHashMap.set('supreme', palette.yellow);
keywordHashMap.set('court', palette.yellow);
keywordHashMap.set('federal', palette.yellow);
keywordHashMap.set('amendment', palette.yellow);
keywordHashMap.set('washington', palette.yellow);
keywordHashMap.set('hamilton', palette.yellow);
keywordHashMap.set('franklin', palette.yellow);
keywordHashMap.set('judge', palette.yellow);
keywordHashMap.set('9-11', palette.yellow);
keywordHashMap.set('911', palette.yellow);
keywordHashMap.set('aborion', palette.yellow);
keywordHashMap.set('afghanistan', palette.yellow);
keywordHashMap.set('asian', palette.yellow);
keywordHashMap.set('assault', palette.yellow);
keywordHashMap.set('attack', palette.yellow);
keywordHashMap.set('attacked', palette.yellow);
keywordHashMap.set('attacking', palette.yellow);
keywordHashMap.set('attacks', palette.yellow);
keywordHashMap.set('ballot', palette.yellow);
keywordHashMap.set('banker', palette.yellow);
keywordHashMap.set('bankers', palette.yellow);
keywordHashMap.set('bankrupt', palette.yellow);
keywordHashMap.set('bankruptcy', palette.yellow);
keywordHashMap.set('banks', palette.yellow);
keywordHashMap.set('bigot', palette.yellow);
keywordHashMap.set('bigotry', palette.yellow);
keywordHashMap.set('billion', palette.yellow);
keywordHashMap.set('billions', palette.yellow);
keywordHashMap.set('billionaire', palette.yellow);
keywordHashMap.set('billionaires', palette.yellow);
keywordHashMap.set('black', palette.yellow);
keywordHashMap.set('brother', palette.yellow);
keywordHashMap.set('brutality', palette.yellow);
keywordHashMap.set('california', palette.yellow);
keywordHashMap.set('campaign', palette.yellow);
keywordHashMap.set('change', palette.yellow);
keywordHashMap.set('china', palette.yellow);
keywordHashMap.set('christian', palette.yellow);
keywordHashMap.set('class', palette.yellow);
keywordHashMap.set('climate', palette.yellow);
keywordHashMap.set('conflict', palette.yellow);
keywordHashMap.set('congress', palette.yellow);
keywordHashMap.set('crime', palette.yellow);
keywordHashMap.set('criminal', palette.yellow);
keywordHashMap.set('crisis', palette.yellow);
keywordHashMap.set('crooked', palette.yellow);
keywordHashMap.set('dakota', palette.yellow);
keywordHashMap.set('danger', palette.yellow);
keywordHashMap.set('dangerous', palette.yellow);
keywordHashMap.set('dangers', palette.yellow);
keywordHashMap.set('dapl', palette.yellow);
keywordHashMap.set('daughter', palette.yellow);
keywordHashMap.set('death', palette.yellow);
keywordHashMap.set('debate', palette.yellow);
keywordHashMap.set('debates', palette.yellow);
keywordHashMap.set('debt', palette.yellow);
keywordHashMap.set('debts', palette.yellow);
keywordHashMap.set('drug', palette.yellow);
keywordHashMap.set('drugs', palette.yellow);
keywordHashMap.set('discriminate', palette.yellow);
keywordHashMap.set('discriminating', palette.yellow);
keywordHashMap.set('discrimination', palette.yellow);
keywordHashMap.set('discriminatory', palette.yellow);
keywordHashMap.set('economic', palette.yellow);
keywordHashMap.set('economy', palette.yellow);
keywordHashMap.set('election', palette.yellow);
keywordHashMap.set('electoral', palette.yellow);
keywordHashMap.set('empire', palette.yellow);
keywordHashMap.set('entitlement', palette.yellow);
keywordHashMap.set('ethical', palette.yellow);
keywordHashMap.set('ethics', palette.yellow);
keywordHashMap.set('execution', palette.yellow);
keywordHashMap.set('executions', palette.yellow);
keywordHashMap.set('families', palette.yellow);
keywordHashMap.set('family', palette.yellow);
keywordHashMap.set('father', palette.yellow);
keywordHashMap.set('federal', palette.yellow);
keywordHashMap.set('foreclosure', palette.yellow);
keywordHashMap.set('foreclosures', palette.yellow);
keywordHashMap.set('fossil', palette.yellow);
keywordHashMap.set('fossil-fuel', palette.yellow);
keywordHashMap.set('frack', palette.yellow);
keywordHashMap.set('fracking', palette.yellow);
keywordHashMap.set('fraud', palette.yellow);
keywordHashMap.set('fuel', palette.yellow);
keywordHashMap.set('fuels', palette.yellow);
keywordHashMap.set('gay', palette.yellow);
keywordHashMap.set('global', palette.yellow);
keywordHashMap.set('government', palette.yellow);
keywordHashMap.set('guilty', palette.yellow);
keywordHashMap.set('gun', palette.yellow);
keywordHashMap.set('guns', palette.yellow);
keywordHashMap.set('harrass', palette.yellow);
keywordHashMap.set('harrassment', palette.yellow);
keywordHashMap.set('hate', palette.yellow);
keywordHashMap.set('healthcare', palette.yellow);
keywordHashMap.set('hegemonic', palette.yellow);
keywordHashMap.set('hegemony', palette.yellow);
keywordHashMap.set('homeless', palette.yellow);
keywordHashMap.set('house', palette.yellow);
keywordHashMap.set('human', palette.yellow);
keywordHashMap.set('impeach', palette.yellow);
keywordHashMap.set('important', palette.yellow);
keywordHashMap.set('incarcerate', palette.yellow);
keywordHashMap.set('income', palette.yellow);
keywordHashMap.set('indict', palette.yellow);
keywordHashMap.set('indictment', palette.yellow);
keywordHashMap.set('inequality', palette.yellow);
keywordHashMap.set('infrastructure', palette.yellow);
keywordHashMap.set('innocent', palette.yellow);
keywordHashMap.set('insurance', palette.yellow);
keywordHashMap.set('invade', palette.yellow);
keywordHashMap.set('invasion', palette.yellow);
keywordHashMap.set('investment', palette.yellow);
keywordHashMap.set('iran', palette.yellow);
keywordHashMap.set('iraq', palette.yellow);
keywordHashMap.set('isis', palette.yellow);
keywordHashMap.set('jihad', palette.yellow);
keywordHashMap.set('jihadist', palette.yellow);
keywordHashMap.set('job', palette.yellow);
keywordHashMap.set('kill', palette.yellow);
keywordHashMap.set('killed', palette.yellow);
keywordHashMap.set('killer', palette.yellow);
keywordHashMap.set('killing', palette.yellow);
keywordHashMap.set('kills', palette.yellow);
keywordHashMap.set('korea', palette.yellow);
keywordHashMap.set('latino', palette.yellow);
keywordHashMap.set('lgbt', palette.yellow);
keywordHashMap.set('lgbtq', palette.yellow);
keywordHashMap.set('liar', palette.yellow);
keywordHashMap.set('lied', palette.yellow);
keywordHashMap.set('lies', palette.yellow);
keywordHashMap.set('loser', palette.yellow);
keywordHashMap.set('losing', palette.yellow);
keywordHashMap.set('market', palette.yellow);
keywordHashMap.set('massacre', palette.yellow);
keywordHashMap.set('medical', palette.yellow);
keywordHashMap.set('mexico', palette.yellow);
keywordHashMap.set('michigan', palette.yellow);
keywordHashMap.set('middle-eastern', palette.yellow);
keywordHashMap.set('middleeastern', palette.yellow);
keywordHashMap.set('military', palette.yellow);
keywordHashMap.set('million', palette.yellow);
keywordHashMap.set('millions', palette.yellow);
keywordHashMap.set('millionaire', palette.yellow);
keywordHashMap.set('millionaires', palette.yellow);
keywordHashMap.set('candidate', palette.yellow);
keywordHashMap.set('candidates', palette.yellow);
keywordHashMap.set('resignation', palette.yellow);
keywordHashMap.set('sentenced', palette.yellow);
keywordHashMap.set('misogeny', palette.yellow);
keywordHashMap.set('molest', palette.yellow);
keywordHashMap.set('molested', palette.yellow);
keywordHashMap.set('molesting', palette.yellow);
keywordHashMap.set('molests', palette.yellow);
keywordHashMap.set('money', palette.yellow);
keywordHashMap.set('moral', palette.yellow);
keywordHashMap.set('morals', palette.yellow);
keywordHashMap.set('mother', palette.yellow);
keywordHashMap.set('muslim', palette.yellow);
keywordHashMap.set('nation', palette.yellow);
keywordHashMap.set('nodapl', palette.yellow);
keywordHashMap.set('nuclear', palette.yellow);
keywordHashMap.set('occupiers', palette.yellow);
keywordHashMap.set('occupy', palette.yellow);
keywordHashMap.set('oil', palette.yellow);
keywordHashMap.set('oligarchic', palette.yellow);
keywordHashMap.set('oligarchies', palette.yellow);
keywordHashMap.set('oligarchy', palette.yellow);
keywordHashMap.set('pakistan', palette.yellow);
keywordHashMap.set('parole', palette.yellow);
keywordHashMap.set('partisan', palette.yellow);
keywordHashMap.set('peace', palette.yellow);
keywordHashMap.set('peaceful', palette.yellow);
keywordHashMap.set('people', palette.yellow);
keywordHashMap.set('pipeline', palette.yellow);
keywordHashMap.set('poison', palette.yellow);
keywordHashMap.set('poisoned', palette.yellow);
keywordHashMap.set('poisons', palette.yellow);
keywordHashMap.set('sheriff', palette.yellow);
keywordHashMap.set('deputy', palette.yellow);
keywordHashMap.set('police', palette.yellow);
keywordHashMap.set('political', palette.yellow);
keywordHashMap.set('politically', palette.yellow);
keywordHashMap.set('politics', palette.yellow);
keywordHashMap.set('poll', palette.yellow);
keywordHashMap.set('polls', palette.yellow);
keywordHashMap.set('pollute', palette.yellow);
keywordHashMap.set('polluted', palette.yellow);
keywordHashMap.set('polluter', palette.yellow);
keywordHashMap.set('polluters', palette.yellow);
keywordHashMap.set('pollutes', palette.yellow);
keywordHashMap.set('pollution', palette.yellow);
keywordHashMap.set('poor', palette.yellow);
keywordHashMap.set('prejudice', palette.yellow);
keywordHashMap.set('presidency', palette.yellow);
keywordHashMap.set('president', palette.yellow);
keywordHashMap.set('presidential', palette.yellow);
keywordHashMap.set('prison', palette.yellow);
keywordHashMap.set('problem', palette.yellow);
keywordHashMap.set('problems', palette.yellow);
keywordHashMap.set('queer', palette.yellow);
keywordHashMap.set('race', palette.yellow);
keywordHashMap.set('racism', palette.yellow);
keywordHashMap.set('racist', palette.yellow);
keywordHashMap.set('rape', palette.yellow);
keywordHashMap.set('regulation', palette.yellow);
keywordHashMap.set('regulations', palette.yellow);
keywordHashMap.set('religion', palette.yellow);
keywordHashMap.set('representative', palette.yellow);
keywordHashMap.set('retiree', palette.yellow);
keywordHashMap.set('russia', palette.yellow);
keywordHashMap.set('saudi', palette.yellow);
keywordHashMap.set('security', palette.yellow);
keywordHashMap.set('senate', palette.yellow);
keywordHashMap.set('sexist', palette.yellow);
keywordHashMap.set('sexual', palette.yellow);
keywordHashMap.set('shoot', palette.yellow);
keywordHashMap.set('shooting', palette.yellow);
keywordHashMap.set('shootings', palette.yellow);
keywordHashMap.set('shoots', palette.yellow);
keywordHashMap.set('shot', palette.yellow);
keywordHashMap.set('sister', palette.yellow);
keywordHashMap.set('social', palette.yellow);
keywordHashMap.set('son', palette.yellow);
keywordHashMap.set('states', palette.yellow);
keywordHashMap.set('student', palette.yellow);
keywordHashMap.set('syria', palette.yellow);
keywordHashMap.set('tax', palette.yellow);
keywordHashMap.set('taxes', palette.yellow);
keywordHashMap.set('terror', palette.yellow);
keywordHashMap.set('terrorism', palette.yellow);
keywordHashMap.set('terrorist', palette.yellow);
keywordHashMap.set('thug', palette.yellow);
keywordHashMap.set('thugs', palette.yellow);
keywordHashMap.set('rape', palette.yellow);
keywordHashMap.set('rapist', palette.yellow);
keywordHashMap.set('murder', palette.yellow);
keywordHashMap.set('murders', palette.yellow);
keywordHashMap.set('murderers', palette.yellow);
keywordHashMap.set('murderer', palette.yellow);
keywordHashMap.set('murdered', palette.yellow);
keywordHashMap.set('thief', palette.yellow);
keywordHashMap.set('toxic', palette.yellow);
keywordHashMap.set('toxins', palette.yellow);
keywordHashMap.set('trade', palette.yellow);
keywordHashMap.set('transgender', palette.yellow);
keywordHashMap.set('trial', palette.yellow);
keywordHashMap.set('trillion', palette.yellow);
keywordHashMap.set('unconstitutional', palette.yellow);
keywordHashMap.set('unemployed', palette.yellow);
keywordHashMap.set('unequal', palette.yellow);
keywordHashMap.set('united', palette.yellow);
keywordHashMap.set('upset', palette.yellow);
keywordHashMap.set('upsets', palette.yellow);
keywordHashMap.set('values', palette.yellow);
keywordHashMap.set('violence', palette.yellow);
keywordHashMap.set('vote', palette.yellow);
keywordHashMap.set('voter', palette.yellow);
keywordHashMap.set('wage', palette.yellow);
keywordHashMap.set('war', palette.yellow);
keywordHashMap.set('weapon', palette.yellow);
keywordHashMap.set('white', palette.yellow);
keywordHashMap.set('win', palette.yellow);
keywordHashMap.set('winning', palette.yellow);
keywordHashMap.set('work', palette.yellow);
keywordHashMap.set('wounded', palette.yellow);
keywordHashMap.set('authority', palette.yellow);
keywordHashMap.set('treaty', palette.yellow);
keywordHashMap.set('truce', palette.yellow);
keywordHashMap.set('inmate', palette.yellow);
keywordHashMap.set('inmates', palette.yellow);
keywordHashMap.set('parole', palette.yellow);
keywordHashMap.set('parolee', palette.yellow);
keywordHashMap.set('probation', palette.yellow);
keywordHashMap.set('bail', palette.yellow);
keywordHashMap.set('fine', palette.yellow);
keywordHashMap.set('fines', palette.yellow);
keywordHashMap.set('penalty', palette.yellow);
keywordHashMap.set('penalties', palette.yellow);
keywordHashMap.set('bribe', palette.yellow);
keywordHashMap.set('bribes', palette.yellow);
keywordHashMap.set('bribed', palette.yellow);
keywordHashMap.set('kickback', palette.yellow);
keywordHashMap.set('kickbacks', palette.yellow);
keywordHashMap.set('convict', palette.yellow);
keywordHashMap.set('convicts', palette.yellow);
keywordHashMap.set('convicted', palette.yellow);
keywordHashMap.set('loophole', palette.yellow);
keywordHashMap.set('loopholes', palette.yellow);
keywordHashMap.set('haven', palette.yellow);
keywordHashMap.set('havens', palette.yellow);
keywordHashMap.set('refugee', palette.yellow);
keywordHashMap.set('refugees', palette.yellow);
keywordHashMap.set('brexit', palette.yellow);
keywordHashMap.set('national', palette.yellow);
keywordHashMap.set('general', palette.yellow);
keywordHashMap.set('generals', palette.yellow);
keywordHashMap.set('turkey', palette.yellow);
keywordHashMap.set('profit', palette.yellow);
keywordHashMap.set('profits', palette.yellow);
keywordHashMap.set('profitted', palette.yellow);
keywordHashMap.set('exploit', palette.yellow);
keywordHashMap.set('exploited', palette.yellow);
keywordHashMap.set('exploits', palette.yellow);
keywordHashMap.set('exploitation', palette.yellow);
keywordHashMap.set('wage', palette.yellow);
keywordHashMap.set('wages', palette.yellow);
keywordHashMap.set('wars', palette.yellow);
keywordHashMap.set('battle', palette.yellow);
keywordHashMap.set('battled', palette.yellow);
keywordHashMap.set('battles', palette.yellow);
keywordHashMap.set('business', palette.yellow);
keywordHashMap.set('jobs', palette.yellow);
keywordHashMap.set('owner', palette.yellow);
keywordHashMap.set('owners', palette.yellow);
keywordHashMap.set('worker', palette.yellow);
keywordHashMap.set('workers', palette.yellow);
keywordHashMap.set('employer', palette.yellow);
keywordHashMap.set('employers', palette.yellow);
keywordHashMap.set('employee', palette.yellow);
keywordHashMap.set('employees', palette.yellow);
keywordHashMap.set('fire', palette.yellow);
keywordHashMap.set('fired', palette.yellow);
keywordHashMap.set('hire', palette.yellow);
keywordHashMap.set('hired', palette.yellow);
keywordHashMap.set('amendments', palette.yellow);
keywordHashMap.set('first', palette.yellow);
keywordHashMap.set('second', palette.yellow);
keywordHashMap.set('last', palette.yellow);
keywordHashMap.set('communist', palette.yellow);
keywordHashMap.set('communism', palette.yellow);
keywordHashMap.set('institution', palette.yellow);
keywordHashMap.set('institute', palette.yellow);
keywordHashMap.set('college', palette.yellow);
keywordHashMap.set('university', palette.yellow);
keywordHashMap.set('church', palette.yellow);
keywordHashMap.set('religion', palette.yellow);
keywordHashMap.set('support', palette.yellow);
keywordHashMap.set('union', palette.yellow);
keywordHashMap.set('lobby', palette.yellow);
keywordHashMap.set('lobbist', palette.yellow);
keywordHashMap.set('amnesty', palette.yellow);
keywordHashMap.set('planned', palette.yellow);
keywordHashMap.set('parenthood', palette.yellow);
keywordHashMap.set('immigration', palette.yellow);
keywordHashMap.set('immigrant', palette.yellow);
keywordHashMap.set('immigrants', palette.yellow);
keywordHashMap.set('migrant', palette.yellow);
keywordHashMap.set('farm', palette.yellow);
keywordHashMap.set('farms', palette.yellow);
keywordHashMap.set('industry', palette.yellow);
keywordHashMap.set('industrial', palette.yellow);
keywordHashMap.set('stocks', palette.yellow);
keywordHashMap.set('trade', palette.yellow);
keywordHashMap.set('bond', palette.yellow);
keywordHashMap.set('bonds', palette.yellow);
keywordHashMap.set('congressman', palette.yellow);
keywordHashMap.set('congressmen', palette.yellow);
keywordHashMap.set('congresswoman', palette.yellow);
keywordHashMap.set('congresswomen', palette.yellow);
keywordHashMap.set('professional', palette.yellow);
keywordHashMap.set('profession', palette.yellow);
keywordHashMap.set('students', palette.yellow);
keywordHashMap.set('attorney', palette.yellow);
keywordHashMap.set('finance', palette.yellow);
keywordHashMap.set('finances', palette.yellow);
keywordHashMap.set('financal', palette.yellow);
keywordHashMap.set('environment', palette.yellow);
keywordHashMap.set('environments', palette.yellow);
keywordHashMap.set('environmental', palette.yellow);
keywordHashMap.set('commonsense', palette.yellow);
keywordHashMap.set('defense', palette.yellow);
keywordHashMap.set('department', palette.yellow);
keywordHashMap.set('departments', palette.yellow);
keywordHashMap.set('council', palette.yellow);
keywordHashMap.set('appropriation', palette.yellow);
keywordHashMap.set('market', palette.yellow);
keywordHashMap.set('markets', palette.yellow);
keywordHashMap.set('swing', palette.yellow);
keywordHashMap.set('state', palette.yellow);
keywordHashMap.set('battleground', palette.yellow);
keywordHashMap.set('invest', palette.yellow);
keywordHashMap.set('homeland', palette.yellow);

keywordHashMap.set('barack', palette.blue);
keywordHashMap.set('bernie', palette.blue);
keywordHashMap.set('clinton', palette.blue);
keywordHashMap.set('clintons', palette.blue);
keywordHashMap.set('democrat', palette.blue);
keywordHashMap.set('democratic', palette.blue);
keywordHashMap.set('democrats', palette.blue);
keywordHashMap.set('dems', palette.blue);
keywordHashMap.set('dnc', palette.blue);
keywordHashMap.set('elizabeth', palette.blue);
keywordHashMap.set('hillary', palette.blue);
keywordHashMap.set('hillaryclinton', palette.blue);
keywordHashMap.set('kaine', palette.blue);
keywordHashMap.set('left', palette.blue);
keywordHashMap.set('liberal', palette.blue);
keywordHashMap.set('liberals', palette.blue);
keywordHashMap.set('obama', palette.blue);
keywordHashMap.set('obamas', palette.blue);
keywordHashMap.set('palosi', palette.blue);
keywordHashMap.set('sanders', palette.blue);
keywordHashMap.set('socialist', palette.blue);
keywordHashMap.set('socialism', palette.blue);
keywordHashMap.set('socialists', palette.blue);
keywordHashMap.set('warren', palette.blue);
keywordHashMap.set('msnbc', palette.blue);

keywordHashMap.set('donald', palette.red);
keywordHashMap.set('melania', palette.red);
keywordHashMap.set('ivanka', palette.red);
keywordHashMap.set('trump', palette.red);
keywordHashMap.set('trumps', palette.red);
keywordHashMap.set('drumpf', palette.red);
keywordHashMap.set('drumpfs', palette.red);
keywordHashMap.set('pence', palette.red);
keywordHashMap.set('conservative', palette.red);
keywordHashMap.set('conservatives', palette.red);
keywordHashMap.set('republican', palette.red);
keywordHashMap.set('republicans', palette.red);
keywordHashMap.set('right', palette.red);
keywordHashMap.set('gop', palette.red);
keywordHashMap.set('bush', palette.red);
keywordHashMap.set('romney', palette.red);
keywordHashMap.set('cruz', palette.red);
keywordHashMap.set('rubio', palette.red);
keywordHashMap.set('ryan', palette.red);
keywordHashMap.set('mconnell', palette.red);
keywordHashMap.set('koch', palette.red);
keywordHashMap.set('ailes', palette.red);
keywordHashMap.set('comey', palette.red);
keywordHashMap.set('comeys', palette.red);
keywordHashMap.set('fox', palette.red);


var rxSessionUpdateQueue = [];
var rxSessionDeleteQueue = [];

var groupCreateQueue = [];
var groupsCreated = 0;

var sessionCreateQueue = [];
var sessionsCreated = 0;

var nodeCreateQueue = [];
var linkCreateQueue = [];

var groupDeleteQueue = []; // gets a hash of nodes deleted by sessionViewForce for each d3 timer cycle.
var nodeDeleteQueue = []; // gets a hash of nodes deleted by sessionViewForce for each d3 timer cycle.
var linkDeleteQueue = []; // gets a hash of nodes deleted by sessionViewForce for each d3 timer cycle.

var urlRoot = DEFAULT_SOURCE + "/session?session=";

var currentSession = {};
var sessionId;
var namespace;
var sessionMode = false;
var monitorMode = false;

function jp(s, obj) {
  console.warn(s + "\n" + jsonPrint(obj));
}

function jsonPrint(obj) {
  if ((obj) || (obj === 0)) {
    var jsonString = JSON.stringify(obj, null, 2);
    return jsonString;
  } else {
    return "UNDEFINED";
  }
}

var randomIntFromInterval = function(min, max) {
  var random = Math.random();
  var randomInt = Math.floor((random * (max - min + 1)) + min);
  return randomInt;
};

var randomId = randomIntFromInterval(1000000000, 9999999999);

var viewerObj = {
  userId: 'VIEWER_RANDOM_' + randomId,
  viewerId: 'VIEWER_RANDOM_' + randomId,
  screenName: 'VIEWER RANDOM ' + randomId,
  type: "VIEWER",
};

var initialPositionIndex = 0;

function computeInitialPosition(index) {
  var radiusX = 0.01 * window.innerWidth;
  var radiusY = 0.4 * window.innerHeight;
  var pos = {
    x: (0.85*window.innerWidth + (radiusX * Math.cos(index))),
    y: (0.5*window.innerHeight + (radiusY * Math.sin(index)))
  };

  return pos;
}

function getSortedKeys(hmap, sortProperty) {
  var keys = [];
  hmap.forEach(function(value, key) {
    if (value.isSessionNode) {
    } else {
      keys.push(key);
    }
  });
  return keys.sort(function(a, b) {
    return hmap.get(b)[sortProperty] - hmap.get(a)[sortProperty]
  });
}

function getTimeStamp(inputTime) {
  var options = {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit"
  };

  var currentDate;
  var currentTime;

  if (inputTime === 'undefined') {
    currentDate = new Date().toDateString("en-US", options);
    currentTime = new Date().toTimeString('en-US', options);
  } else {
    currentDate = new Date(inputTime).toDateString("en-US", options);
    currentTime = new Date(inputTime).toTimeString('en-US', options);
  }
  return currentDate + " - " + currentTime;
}

function getBrowserPrefix() {
  // Check for the unprefixed property.
  // if ('hidden' in document) {
  if (document.hidden !== 'undefined') {
    return null;
  }
  // All the possible prefixes.
  var browserPrefixes = ['moz', 'ms', 'o', 'webkit'];
  var prefix;

  browserPrefixes.forEach(function(p) {
    prefix = p + 'Hidden';
    if (document[prefix] !== 'undefined') {
      return p;
    }
  });

  // The API is not supported in browser.
  return null;
}

function hiddenProperty(prefix) {
  if (prefix) {
    return prefix + 'Hidden';
  } else {
    return 'hidden';
  }
}

function getVisibilityEvent(prefix) {
  if (prefix) {
    return prefix + 'visibilitychange';
  } else {
    return 'visibilitychange';
  }
}

var viewerSessionKey;
var socket = io('/view');

socket.on("VIEWER_ACK", function(vSesKey) {

  serverConnected = true;

  console.log("RX VIEWER_ACK | SESSION KEY: " + vSesKey);

  statsObj.viewerSessionKey = vSesKey;

  store.set('stats', statsObj);

  if (sessionMode) {
    console.log("SESSION MODE" + " | SID: " + sessionId + " | NSP: " + namespace);
    var tempSessionId = "/" + namespace + "#" + sessionId;
    currentSession.sessionId = tempSessionId;
    console.log("TX GET_SESSION | " + currentSession.sessionId);
    socket.emit("GET_SESSION", currentSession.sessionId);
  } else {
    socket.emit("REQ_USER_SESSION");
  }
});

socket.on("reconnect", function() {
  statsObj.socketId = socket.id;
  store.set('stats', statsObj);
  serverConnected = true;
  console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);
  socket.emit("VIEWER_READY", viewerObj);
  if (sessionMode) {
    console.log("SESSION MODE" + " | SID: " + sessionId + " | NSP: " + namespace);
    var tempSessionId = "/" + namespace + "#" + sessionId;
    currentSession.sessionId = tempSessionId;
    controlPanel.document.getElementById("statusSessionId").innerHTML = 'SOCKET: ' + statsObj.socketId;
    socket.emit("GET_SESSION", currentSession.sessionId);
  } 
});

socket.on("connect", function() {
  statsObj.socketId = socket.id;
  store.set('stats', statsObj);
  serverConnected = true;
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
});

socket.on("disconnect", function() {
  serverConnected = false;
  statsObj.socketId = null;
  displayInfo(1.0, 'red');
  console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    updateSessionsReady = true;
    store.set('stats', statsObj);
  });
});

socket.on("error", function(error) {
  socket.disconnect();
  serverConnected = false;
  statsObj.socketId = null;
  displayInfo(1.0, 'red');
  console.log("*** SOCKET ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET ERROR\n" + error);
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    updateSessionsReady = true;
    store.set('stats', statsObj);
  });
});

socket.on("connect_error", function(error) {
  socket.disconnect();
  serverConnected = false;
  statsObj.socketId = null;
  displayInfo(1.0, 'red');
  console.log("*** SOCKET CONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET CONNECT ERROR\n" + error);
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    updateSessionsReady = true;
    store.set('stats', statsObj);
  });
});

socket.on("reconnect_error", function(error) {
  socket.disconnect();
  serverConnected = false;
  statsObj.socketId = null;
  displayInfo(1.0, 'red');
  console.log("*** SOCKET RECONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET RECONNECT ERROR\n" + error);
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    store.set('stats', statsObj);
    updateSessionsReady = true;
  });
});

var palette = {
  "black": "#000000",
  "white": "#FFFFFF",
  "lightgray": "#819090",
  "gray": "#708284",
  "mediumgray": "#536870",
  "darkgray": "#475B62",
  "darkblue": "#0A2933",
  "darkerblue": "#042029",
  "paleryellow": "#FCF4DC",
  "paleyellow": "#EAE3CB",
  "yellow": "#A57706",
  "orange": "#BD3613",
  "red": "#D11C24",
  "pink": "#C61C6F",
  "purple": "#595AB7",
  "blue": "#2176C7",
  "green": "#259286",
  "yellowgreen": "#738A05"
};

var windowVisible = true;

document.title = "Word Association";

var prefix = getBrowserPrefix();
var hidden = hiddenProperty(prefix);
var visibilityEvent = getVisibilityEvent(prefix);


function reset(){
  currentSessionView.simulationControl('RESET');
  windowVisible = true;
  // currentSessionView.reset();
  // nodeHashMap.clear();
  // linkHashMap.clear();
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS ON WINDOW HIDDEN");
    sessionCreateQueue = [];
    // groupHashMap.clear();
    sessionDeleteHashMap.clear();
    // currentSe÷ssionView.resize();
    // currentSessionView.reset();
    if ((config.sessionViewType == 'force') 
      || (config.sessionViewType == 'ticker')
      || (config.sessionViewType == 'flow')
    ) {
      currentSessionView.resetDefaultForce();
    }
    currentSessionView.simulationControl('START');
    updateSessionsReady = true;
  });  
}


document.addEventListener(visibilityEvent, function() {
  console.log("visibilityEvent");
  if (!document[hidden]) {
    windowVisible = true;
    currentSessionView.resize();
  } else {
    // reset();
  }
});

function getUrlVariables(callbackMain) {

  var urlSessionId;
  var urlNamespace;
  var sessionType;

  var searchString = window.location.search.substring(1);
  console.log("searchString: " + searchString);

  var variableArray = searchString.split('&');

  var asyncTasks = [];

  variableArray.forEach(

    function(variable, callback) {

      asyncTasks.push(function(callback2) {

        var keyValuePair = variable.split('=');

        if ((keyValuePair[0] !== '') && (keyValuePair[1] !== 'undefined')) {
          console.log("'" + variable + "' >>> URL config: " + keyValuePair[0] + " : " + keyValuePair[1]);
          if (keyValuePair[0] === 'monitor') {
            monitorMode = keyValuePair[1];
            console.log("MONITOR MODE | monitorMode: " + monitorMode);
            return (callback2(null, {
              monitorMode: monitorMode
            }));
          }
          if (keyValuePair[0] === 'session') {
            urlSessionId = keyValuePair[1];
            console.log("SESSION MODE | urlSessionId: " + urlSessionId);
            return (callback2(null, {
              sessionMode: true,
              sessionId: urlSessionId
            }));
            // return(callback2(null, {sessionMode: sessionMode}));
          }
          if (keyValuePair[0] === 'nsp') {
            urlNamespace = keyValuePair[1];
            console.log("namespace: " + urlNamespace);
            return (callback2(null, {
              namespace: urlNamespace
            }));
          }
          if (keyValuePair[0] === 'type') {
            sessionType = keyValuePair[1];
            console.log("SESSION TYPE | sessionType: " + sessionType);
            return (callback2(null, {
              sessionType: sessionType
            }));
          }
          if (keyValuePair[0] === 'viewtype') {
            config.sessionViewType = keyValuePair[1];
            console.log("SESSION VIEW TYPE | sessionViewType: " + config.sessionViewType);
            return (callback2(null, {
              sessionViewType: config.sessionViewType
            }));
          }
        } else {
          console.log("NO URL VARIABLES");
          return (callback2(null, []));
        }
      });
    }
  );

  async.parallel(asyncTasks, function(err, results) {

    // console.log("results\n" + results);

    var urlConfig = {};

    // results is an array of objs:  results = [ {key0: val0}, ... {keyN: valN} ];
    async.each(results, function(urlVarObj, cb1) {

      console.log("urlVarObj\n" + jsonPrint(urlVarObj));

      var urlVarKeys = Object.keys(urlVarObj);

      async.each(urlVarKeys, function(key, cb2) {


        urlConfig[key] = urlVarObj[key];

        console.log("key: " + key + " > urlVarObj[key]: " + urlVarObj[key]);

        cb2();

      }, function(err) {
        cb1();
      });


    }, function(err) {
      callbackMain(err, urlConfig);
    });

  });
}

function launchSessionView(sessionId) {
  var namespacePattern = new RegExp(/^\/(\S*)#(\S*)$/);
  var sessionIdParts = namespacePattern.exec(sessionId);
  console.log("sessionId: " + sessionId + " | nsp: " + sessionIdParts[1] + " | id: " + sessionIdParts[2]);
  var url = urlRoot + sessionIdParts[2] + "&nsp=" + sessionIdParts[1];
  console.log("launchSessionView: " + sessionId + " | " + url);
  window.open(url, 'SESSION VIEW', '_new');
}


var globalLinkIndex = 0;

function generateLinkId(callback) {
  globalLinkIndex++;
  return "LNK" + globalLinkIndex;
}


//  KEEPALIVE
setInterval(function() {
  if (serverConnected) {
    socket.emit("SESSION_KEEPALIVE", viewerObj);
    // console.log("SESSION_KEEPALIVE | " + moment());
  }
}, serverKeepaliveInteval);

var lastHeartbeatReceived = 0;

// CHECK FOR SERVER HEARTBEAT
setInterval(function() {
  if (!serverConnected) {
    console.error("\n????? SERVER DOWN ????? | | LAST HEARTBEAT: " 
      + getTimeStamp(lastHeartbeatReceived) 
      + " | " + moment().format(defaultDateTimeFormat) 
      + " | AGO: " + msToTime(moment().valueOf() - lastHeartbeatReceived));
    socket.connect();
  }
  else if ((lastHeartbeatReceived > 0) && (lastHeartbeatReceived + serverHeartbeatTimeout) < moment()) {
    console.error("\n????? SERVER DOWN ????? | LAST HEARTBEAT: " 
      + getTimeStamp(lastHeartbeatReceived) 
      + " | " + moment().format(defaultDateTimeFormat) 
      + " | AGO: " + msToTime(moment().valueOf() - lastHeartbeatReceived));
    socket.connect();
  }
}, serverCheckInterval);

function deleteSession(nodeId, callback) {

  if (!sessionHashMap.has(nodeId)) {
    console.error("deleteSession: SID NOT IN HASH: " + nodeId + " ... SKIPPING DELETE");
    return (callback(nodeId));
  }

  var deletedSession = sessionHashMap.get(nodeId);
  var groupLinkId = deletedSession.groupId + "_" + deletedSession.node.nodeId;

  console.log("XXX DELETE SESSION"
    // + " [" + currentSessionView.getSessionsLength() + "]"
    + " | GID: " + deletedSession.groupId 
    + " | NID: " + deletedSession.nodeId 
    + " | SID: " + deletedSession.sessionId 
    + " | UID: " + deletedSession.userId
    + " | SNID: " + deletedSession.linkHashMap.keys()
    + " | SNID: " + deletedSession.node.nodeId
    + " | LINKS: " + jsonPrint(deletedSession.node.links)
  );

  var sessionLinks = deletedSession.linkHashMap.keys();

  async.each(sessionLinks, function(sessionLinkId, cb) {
      linkHashMap.remove(sessionLinkId);
      cb();
    },
    function(err) {

      linkHashMap.remove(groupLinkId);

      sessionHashMap.remove(nodeId);

      nodeHashMap.remove(deletedSession.node.nodeId);

      sessionDeleteHashMap.set(sessionId, 1);

      currentSessionView.deleteSessionLinks(sessionId);
      currentSessionView.deleteNode(deletedSession.node.nodeId);

      return (callback(sessionId));
    }
  );
}

function deleteAllSessions(callback) {

  var nodeIds = sessionHashMap.keys();

  async.each(nodeIds, function(nodeId, cb) {
      deleteSession(nodeId, function(nId) {
        console.log("XXX DELETED SESSION " + nId);
        cb();
      });
    },
    function(err) {
      sessionDeleteHashMap.clear();
      callback();
    }
  );
}

var heartBeatsReceived = 0;

socket.on("HEARTBEAT", function(heartbeat) {
  heartBeatsReceived++;
  serverConnected = true;
});

socket.on("CONFIG_CHANGE", function(rxConfig) {

  console.log("\n-----------------------\nRX CONFIG_CHANGE\n" 
    + JSON.stringify(rxConfig, null, 3) + "\n------------------------\n");

  if (rxConfig.testMode !== 'undefined') {
    config.testMode = rxConfig.testMode;
    console.log("\n*** ENV CHANGE: TEST_MODE:  WAS: " 
      + previousConfig.testMode + " | NOW: " + config.testMode + "\n");
    previousConfig.testMode = config.testMode;
  }

  if (rxConfig.testSendInterval !== 'undefined') {
    config.testSendInterval = rxConfig.testSendInterval;
    console.log("\n*** ENV CHANGE: TEST_SEND_INTERVAL: WAS: " 
      + previousConfig.testSendInterval + " | NOW: " + config.testSendInterval + "\n");
    previousConfig.testSendInterval = config.testSendInterval;
  }

  if (rxConfig.nodeMaxAge !== 'undefined') {
    config.nodeMaxAge = rxConfig.nodeMaxAge;
    console.log("\n*** ENV CHANGE: NODE_MAX_AGE: WAS: " 
      + previousConfig.nodeMaxAge + " | NOW: " + config.nodeMaxAge + "\n");
    nodeMaxAge = config.nodeMaxAge;
    currentSessionView.setMaxAge(rxConfig.nodeMaxAge);
    previousConfig.nodeMaxAge = config.nodeMaxAge;
  }

  // resetMouseMoveTimer();
});

socket.on("SESSION_ABORT", function(rxSessionObject) {
  console.error("RX SESSION_ABORT" 
    + " | " + rxSessionObject.sessionId 
    + " | " + rxSessionObject.sessionEvent);
  if (rxSessionObject.sessionId == socket.id) {
    console.error("SESSION_ABORT" 
      + " | " + rxSessionObject.sessionId 
      + " | " + rxSessionObject.sessionEvent);
    serverConnected = false;
    statsObj.socketId = 'ABORTED';
    socket.disconnect();
    store.set('stats', statsObj);
  }
});

socket.on("SESSION_DELETE", function(rxSessionObject) {

  var rxObj = rxSessionObject;

  if (typeof rxObj.session.user !== 'undefined'){

    rxObj.session.nodeId = rxObj.session.user.tags.entity.toLowerCase() + "_" + rxObj.session.user.tags.channel.toLowerCase();

    if (sessionHashMap.has(rxObj.session.nodeId)) {

      console.log("SESSION_DELETE" 
        + " | " + rxObj.session.nodeId
        // + " | " + rxSessionObject.sessionId 
        + " | " + rxObj.sessionEvent
        // + "\n" + jsonPrint(rxSessionObject)
      );

      var session = sessionHashMap.get(rxObj.session.nodeId);
      sessionDeleteHashMap.set(rxObj.session.nodeId, 1);
      session.sessionEvent = "SESSION_DELETE";
      rxSessionDeleteQueue.push(session);
      store.set('stats', statsObj);

    }

  }
});

socket.on("USER_SESSION", function(rxSessionObject) {
  var rxObj = rxSessionObject;
  console.log("USER_SESSION" 
    + " | SID: " + rxObj.sessionId 
    + " | UID: " + rxObj.userId 
    + " | NSP: " + rxObj.namespace 
    + " | WCI: " + rxObj.wordChainIndex 
    + " | CONN: " + rxObj.connected);
});

socket.on("SESSION_UPDATE", function(rxSessionObject) {

  var rxObj = rxSessionObject;
  if (!windowVisible) {
    rxSessionUpdateQueue = [];
    if (debug) {
      console.log("... SKIP SESSION_UPDATE ... WINDOW NOT VISIBLE");
    }
  // } else if (sessionDeleteHashMap.has(rxObj.sessionId)) {

  //   console.warn("... SKIP SESSION_UPDATE ... DELETED SESSION: " + rxObj.sessionId);
    
  } else if (sessionMode && (rxObj.sessionId !== currentSession.sessionId)) {
    if (debug) {
      console.log("SKIP SESSION_UPDATE: " + rxObj.sessionId 
        + " | CURRENT: " + currentSession.sessionId);
    }
  } else if (rxSessionUpdateQueue.length < MAX_RX_QUEUE) {

    // rxSessionUpdateQueue.push(rxSessionObject);

    if (rxObj.action == 'KEEPALIVE') {
      // console.log("KEEPALIVE" + " | " + rxObj.userId);
    } else {
      rxSessionUpdateQueue.push(rxSessionObject);
      // console.log("UID: " + rxObj.userId 
      //   // + " | " + jsonPrint(rxObj.tags) 
      //   + " | G: " + rxObj.tags.group
      //   + " | ENT: " + rxObj.tags.entity
      //   + " | CH: " + rxObj.tags.channel
      //   + " | " + rxObj.wordChainIndex 
      //   + " | " + rxObj.source.nodeId 
      //   + " > " + rxObj.target.nodeId
      // );
    }
  }
});


//================================
// GET NODES FROM QUEUE
//================================


var nodeIndex = 0;
var tempMentions;

var numberSessionsUpdated = 0;

function addToHashMap(hm, key, value, callback) {
  hm.set(key, value);
  var v = hm.get(key);
  callback(v);
}

function removeFromHashMap(hm, key, callback) {
  if (hm.has(key)){
    var value = hm.get(key);
    hm.remove(key);
    callback(value);
  }
  else{
    callback(false);
  }
}

var processSessionQueues = function(callback) {
  if (rxSessionDeleteQueue.length > 0) {
    var deleteSessUpdate = rxSessionDeleteQueue.shift();
    console.log("DELETE SESSION: " + deleteSessUpdate.sessionId);
    sessionDeleteHashMap.set(deleteSessUpdate.sessionId, 1);
    deleteSession(deleteSessUpdate.sessionId, function(sessionId) {
      // sessionHashMap.remove(sessionId);
      return (callback(null, null));
    });
  } else if (rxSessionUpdateQueue.length == 0) {
    // console.log("sessionObject\n");
    return (callback(null, null));
  } else {
    var session = rxSessionUpdateQueue.shift();

    session.nodeId = session.tags.entity.toLowerCase() + "_" + session.tags.channel.toLowerCase();
    session.tags.entity = session.tags.entity.toLowerCase();
    session.tags.channel = session.tags.channel.toLowerCase();

    if (typeof session.tags.group !== 'undefined') {
      session.tags.group = session.tags.group;
      groupCreateQueue.push(session);
    }
    else {
      console.error("??? GROUP UNDEFINED ... SKIPPING"
        + " | " + session.nodeId
        + "\nTAGS\n" + jsonPrint(session.tags)
      );
    }

    // console.log("R< | " + "\n" + jsonPrint(session));

    return (callback(null, session.sessionId));
  }
}

var processNodeDeleteQueue = function(callback) {
  
  while (nodeDeleteQueue.length > 0) {
  //   return (callback(null, "processNodeDeleteQueue"));
  // } else {

    var deletedNodeId = nodeDeleteQueue.shift();

    // console.error("processNodeDeleteQueue: DELETE NODE: " + deletedNodeId);

    removeFromHashMap(nodeHashMap, deletedNodeId, function(deletedNode) {
      if (deletedNode) {
        // console.error("processNodeDeleteQueue: DELETED NODE: " + deletedNodeId);
      // return (callback(null, "processNodeDeleteQueue"));
      }
    });
    removeFromHashMap(sessionHashMap, deletedNodeId, function(deletedSession) {
      // if (deletedSession) {
      //   console.error("processNodeDeleteQueue: DELETED SESSION: " + deletedNodeId);
      //   // return (callback(null, "processNodeDeleteQueue"));
      // }
    });
    removeFromHashMap(groupHashMap, deletedNodeId, function(deletedGroup) {
      // if (deletedGroup) {
        // console.error("processNodeDeleteQueue: DELETED GROUP: " + deletedNodeId);
        // var linkKeys = Object.keys(deletedGroup.node.links);
        // linkKeys.forEach(function(deadLinkId){
        //   removeFromHashMap(linkHashMap, deadLinkId, function(deletedLink) {
        //     console.error("processNodeDeleteQueue: DELETED GROUP LINK"
        //       + " | " + deadLinkId
        //       + "\n" + + jsonPrint(deletedLink)
        //     );
        //   });
        // });
      // }
    });

  }
  return (callback(null, "processNodeDeleteQueue"));
}

var processLinkDeleteQueue = function(callback) {
  
  while (linkDeleteQueue.length > 0) {
  //   return (callback(null, "processNodeDeleteQueue"));
  // } else {

    var deletedLinkId = linkDeleteQueue.shift();

    // console.error("processNodeDeleteQueue: DELETE NODE: " + deletedNodeId);

    removeFromHashMap(linkHashMap, deletedLinkId, function() {
      // console.error("processNodeDeleteQueue: DELETED: " + deletedNodeId);
      // return (callback(null, "processNodeDeleteQueue"));
    });

  }
  return (callback(null, "processNodeDeleteQueue"));
}

function sum( obj ) {
  var sum = 0;
  for( var el in obj ) {
    if( obj.hasOwnProperty( el ) ) {
      sum += parseFloat( obj[el] );
    }
  }
  return sum;
}

var randomNumber360 = 180;

var createGroup = function(callback) {
  if (groupCreateQueue.length == 0) {
    return (callback(null, null));
  } 
  else {

    var dateNow = moment().valueOf();
    var sessUpdate = groupCreateQueue.shift();

    // var groupId = sessUpdate.tags.group.toLowerCase();
    var groupId = sessUpdate.tags.group.groupId;
    var groupName = sessUpdate.tags.group.name;

    // console.warn("createGroup" + " | " + groupId);

    // var currentGroup = {};
    // var currentSession = {};

    if (groupDeleteHashMap.has(groupId)) {
      console.warn("createGroup: " 
        + groupId + " | " + groupName + " | "
        + " GROUP IN DELETE HASH MAP ... SKIPPING"
      );
      return (callback(null, null));
    } 
    else if (groupHashMap.has(groupId)) {

      var currentGroup = {};
      var currentSession = {};

      currentGroup = groupHashMap.get(groupId);

      if (nodeHashMap.has(currentGroup.node.nodeId)) {
        currentGroup.node = nodeHashMap.get(currentGroup.node.nodeId);
      }

      // console.warn("FOUND GROUP" + " [" + sessUpdate.wordChainIndex + "]" 
      //   + " | G: " + sessUpdate.tags.group 
      //   + " | C: " + sessUpdate.tags.channel 
      //   + " | E: " + sessUpdate.tags.entity 
      //   + " | U: " + sessUpdate.userId 
      //   + " | " + sessUpdate.source.nodeId 
      //   + " > " + sessUpdate.target.nodeId
      //   // + "\n" + jsonPrint(currentGroup)
      // );

      currentGroup.mentions++;
      currentGroup.age = 1e-6;
      currentGroup.ageMaxRatio = 1e-6;
      currentGroup.lastSeen = dateNow;
      // currentGroup.text = groupId;
      currentGroup.text = groupName;
      currentGroup.wordChainIndex = sessUpdate.wordChainIndex;


      // GROUP NODE
      currentGroup.node.text = groupId;

      currentGroup.node.age = 1e-6;
      currentGroup.node.ageMaxRatio = 1e-6;
      currentGroup.node.ageUpdated = dateNow;
      currentGroup.node.lastSeen = dateNow;
      currentGroup.node.isDead = false;

      currentGroup.node.mentions++;

      currentGroup.node.wordChainIndex = sessUpdate.wordChainIndex;
      currentGroup.node.sessionWordChainIndex[sessUpdate.nodeId] = sessUpdate.wordChainIndex; 
      currentGroup.node.totalWordChainIndex = sum(currentGroup.node.sessionWordChainIndex);

      // update group totalWordChainIndex
      currentGroup.totalWordChainIndex = currentGroup.node.totalWordChainIndex;

      if (sessionHashMap.has(sessUpdate.nodeId)) {
        currentSession = sessionHashMap.get(sessUpdate.nodeId);
        var groupLinkId = currentGroup.node.nodeId + "_" + currentSession.node.nodeId;
        currentGroup.node.links = {};
        currentGroup.node.links[groupLinkId] = 1;
      }

      addToHashMap(nodeHashMap, currentGroup.node.nodeId, currentGroup.node, function(grpNode) {

        addToHashMap(groupHashMap, currentGroup.groupId, currentGroup, function(cGroup) {
          sessionCreateQueue.push(sessUpdate);
          return (callback(null, cGroup.groupId));
        });
      });

    } 
    else {

      groupsCreated += 1;

      var currentInitialPosition = computeInitialPosition(initialPositionIndex);
      initialPositionIndex++;

      randomNumber360 = (randomNumber360 + randomIntFromInterval(61, 117))%360;

      var groupStartColor = "hsl(" + randomNumber360 + ",0%,10%)";
      var groupEndColor = "hsl(" + randomNumber360 + ",0%,0%)";

      var sessionStartColor = "hsl(" + randomNumber360 + ",0%,10%)";
      var sessionEndColor = "hsl(" + randomNumber360 + ",0%,0%)";

      var nodeStartColor = "hsl(" + randomNumber360 + ",0%,100%)";
      var nodeEndColor = "hsl(" + randomNumber360 + ",0%,0%)";

      var currentGroup = {};
      var currentSession = {};

      // console.log("CREATE GROUP" + " [" + sessUpdate.wordChainIndex + "]" 
      //   + " | G: " + groupId 
      //   + " | C: " + sessUpdate.tags.channel 
      //   + " | E: " + sessUpdate.tags.entity 
      //   + " | U: " + sessUpdate.userId 
      //   + " | " + sessUpdate.source.nodeId 
      //   + " > " + sessUpdate.target.nodeId
      //   // + "\n" + jsonPrint(sessUpdate)
      // );

      currentGroup.groupId = groupId;
      currentGroup.name = groupName;
      currentGroup.nodeId = groupId;
      currentGroup.age = 1e-6;
      currentGroup.ageUpdated = dateNow;
      currentGroup.ageMaxRatio = 1e-6;
      currentGroup.lastSeen = dateNow;
      currentGroup.isGroup = true;
      currentGroup.isSession = false;
      currentGroup.mentions = 1;
      currentGroup.wordChainIndex = sessUpdate.wordChainIndex;
      currentGroup.totalWordChainIndex = sessUpdate.wordChainIndex;
      currentGroup.tags = {};
      currentGroup.tags = sessUpdate.tags;
      currentGroup.text = groupName;
      currentGroup.source = sessUpdate.source;
      currentGroup.source.lastSeen = dateNow;
      currentGroup.target = sessUpdate.target;
      currentGroup.target.lastSeen = dateNow;

      currentGroup.node = {};
      currentGroup.linkHashMap = new HashMap();
      currentGroup.initialPosition = currentInitialPosition;
      currentGroup.x = currentInitialPosition.x;
      currentGroup.y = currentInitialPosition.y;

      currentGroup.groupColors = {};
      currentGroup.groupColors = {"startColor": groupStartColor, "endColor": groupEndColor};
      currentGroup.sessionColors = {};
      currentGroup.sessionColors = {"startColor": sessionStartColor, "endColor": sessionEndColor};
      currentGroup.nodeColors = {};
      currentGroup.nodeColors = {"startColor": nodeStartColor, "endColor": nodeEndColor};

      var interpolateGroupColor = d3.interpolateHsl(groupStartColor, groupEndColor);
      currentGroup.interpolateGroupColor = interpolateGroupColor;

      var interpolateSessionColor = d3.interpolateHsl(sessionStartColor, sessionEndColor);
      currentGroup.interpolateSessionColor = interpolateSessionColor;

      var interpolateNodeColor = d3.interpolateHsl(nodeStartColor, nodeEndColor);
      currentGroup.interpolateNodeColor = interpolateNodeColor;

      currentGroup.interpolateColor = interpolateNodeColor;

      // CREATE GROUP NODE

      currentGroup.node.isGroupNode = true;
      currentGroup.node.isSessionNode = false;
      currentGroup.node.groupId = groupId;
      currentGroup.node.nodeId = groupId;
      currentGroup.node.age = 1e-6;
      currentGroup.node.ageMaxRatio = 1e-6;
      currentGroup.node.isDead = false;
      currentGroup.node.ageUpdated = dateNow;
      currentGroup.node.lastSeen = dateNow;

      currentGroup.node.wordChainIndex = sessUpdate.wordChainIndex;
      currentGroup.node.sessionWordChainIndex = {};  // per session wci
      currentGroup.node.sessionWordChainIndex[sessUpdate.nodeId] = sessUpdate.wordChainIndex; 
      currentGroup.node.totalWordChainIndex = sum(currentGroup.node.sessionWordChainIndex);  

      currentGroup.node.mentions = 1;
      currentGroup.node.text = groupId;
      currentGroup.node.r = config.defaultNodeRadius;
      currentGroup.node.x = currentGroup.initialPosition.x;
      currentGroup.node.y = currentGroup.initialPosition.y;
      currentGroup.node.fixed = false;

      currentGroup.node.groupColors = {};
      currentGroup.node.groupColors = currentGroup.groupColors;
      currentGroup.node.interpolateGroupColor = interpolateGroupColor;

      currentGroup.interpolateColor = interpolateGroupColor;

      currentGroup.node.links = {};

      if (sessionHashMap.has(sessUpdate.nodeId)) {
        currentSession = sessionHashMap.get(sessUpdate.nodeId);
        var groupLinkId = currentGroup.node.nodeId + "_" + currentSession.node.nodeId;
        currentGroup.node.links[groupLinkId] = 1;
      }

      addToHashMap(nodeHashMap, currentGroup.node.nodeId, currentGroup.node, function(grpNode) {

        console.log("NEW GROUP NODE" 
          + " | " + grpNode.nodeId
          + " | " + grpNode.groupId
          + " | isGroupNode: " + grpNode.isGroupNode
          + " | isSessionNode: " + grpNode.isSessionNode
          // + "\n" + jsonPrint(grpNode)
        );

        currentSessionView.addNode(grpNode);

        addToHashMap(groupHashMap, currentGroup.groupId, currentGroup, function(cGroup) {
          console.log("NEW GROUP " + cGroup.groupId 
            + " | GNID: " + cGroup.node.nodeId
          );
          sessionCreateQueue.push(sessUpdate);
          currentSessionView.addGroup(cGroup);
          // nodeCreateQueue.push(cGroup);
          return (callback(null, cGroup.groupId));
        });
      });
    }
  }
}

var createSession = function(callback) {

  if (sessionCreateQueue.length == 0) {
    return (callback(null, null));
  } 
  else {

    var dateNow = moment().valueOf();
    var sessUpdate = sessionCreateQueue.shift();

    var currentGroup = {};
    var currentSession = {};

    if (groupHashMap.has(sessUpdate.tags.group.groupId)) {
      currentGroup = groupHashMap.get(sessUpdate.tags.group.groupId);
      // console.warn("currentGroup\n" + jsonPrint(currentGroup)); 
    }
    else {
      console.error("currentGroup\n" + jsonPrint(currentGroup)); 
    }

    if (sessionDeleteHashMap.has(sessUpdate.sessionId)) {
      console.log("createSession: " 
        + sessUpdate.userId 
        + " | " + sessUpdate.tags.entity 
        + " SESSION IN DELETE HASH MAP ... SKIPPING"
      );
      return (callback(null, null));
    } 
    else if (sessionHashMap.has(sessUpdate.nodeId)) {

      currentSession = sessionHashMap.get(sessUpdate.nodeId);

      // console.log("UPDATE SESS" 
      //   + " [" + sessUpdate.wordChainIndex + "]" 
      //   // + " [" + sessUpdate.mentions + "]" 
      //   + " | UID: " + sessUpdate.userId 
      //   + " | ENT: " + sessUpdate.tags.entity 
      //   + " | CH: " + sessUpdate.tags.channel 
      //   + " | " + sessUpdate.source.nodeId 
      //   + " > " + sessUpdate.target.nodeId
      //   // + "\n" + jsonPrint(sessUpdate)
      // );

      if (typeof currentSession.wordChainIndex === 'undefined'){
        console.error("*** currentSession.wordChainIndex UNDEFINED");
      }

      if (typeof currentSession.tags === 'undefined') currentSession.tags = {};

      currentSession.tags = sessUpdate.tags;

      currentSession.colors = currentGroup.sessionColors;

      if (nodeHashMap.has(currentSession.node.nodeId)) {
        currentSession.node = nodeHashMap.get(currentSession.node.nodeId);
      }
      if (nodeHashMap.has(sessUpdate.tags.group.groupId)) {
        currentGroup.node = nodeHashMap.get(sessUpdate.tags.group.groupId);
      }

      var prevLatestNodeId = currentSession.latestNodeId;
      currentSession.prevLatestNodeId = prevLatestNodeId;
      var prevSessionLinkId = currentSession.node.nodeId + "_" + prevLatestNodeId;

      // console.warn("REMOVE LINK " + prevSessionLinkId);
      removeFromHashMap(linkHashMap, prevSessionLinkId, function() {
        currentSessionView.deleteLink(prevSessionLinkId);
      });

      currentSession.groupId = currentGroup.groupId;
      currentSession.age = 1e-6;
      currentSession.ageUpdated = dateNow;
      currentSession.ageMaxRatio = 1e-6;
      currentSession.mentions++;
      currentSession.lastSeen = dateNow;
      currentSession.userId = sessUpdate.userId;
      currentSession.text = sessUpdate.tags.entity + " | " + sessUpdate.tags.channel;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.source = sessUpdate.source;
      currentSession.source.lastSeen = dateNow;
      currentSession.target = sessUpdate.target;
      currentSession.target.lastSeen = dateNow;
      currentSession.latestNodeId = sessUpdate.source.nodeId;
      currentSession.interpolateSessionColor = currentGroup.interpolateSessionColor;
      currentSession.interpolateColor = currentGroup.interpolateSessionColor;

      currentSession.node.text = sessUpdate.tags.entity + "[" + sessUpdate.tags.channel + "]";
      currentSession.node.age = 1e-6;
      currentSession.node.ageMaxRatio = 1e-6;
      currentSession.node.isGroupNode = false;
      currentSession.node.isSessionNode = true;
      currentSession.node.isDead = false;
      currentSession.node.ageUpdated = dateNow;
      currentSession.node.lastSeen = dateNow;
      currentSession.node.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.node.mentions = sessUpdate.wordChainIndex;

      currentSession.node.groupColors = {};
      currentSession.node.groupColors = currentGroup.groupColors;
      currentSession.node.interpolateGroupColor = currentGroup.interpolateGroupColor;
      currentSession.node.interpolateColor = currentGroup.interpolateGroupColor;
      
      currentSession.node.sessionColors = {};
      currentSession.node.sessionColors = currentGroup.sessionColors;
      currentSession.node.interpolateSessionColor = currentGroup.interpolateSessionColor;
      
      currentSession.node.nodeColors = {};
      currentSession.node.nodeColors = currentGroup.nodeColors;
      currentSession.node.interpolateNodeColor = currentGroup.interpolateNodeColor;
      
      var sessionLinkId = currentSession.node.nodeId + "_" + sessUpdate.source.nodeId;
      
      currentSession.node.links = {};
      currentSession.node.links[sessionLinkId] = 1;

      addToHashMap(nodeHashMap, currentSession.node.nodeId, currentSession.node, function(sesNode) {
        addToHashMap(sessionHashMap, currentSession.nodeId, currentSession, function(cSession) {
          nodeCreateQueue.push(cSession);
          return (callback(null, cSession.nodeId));
          // removeFromHashMap(linkHashMap, sessionId, function() {
            // return (callback(null, cSession.sessionId));
          // });
        });
      });

      
    } else {

      sessionsCreated += 1;

      console.log("CREATE SESS" 
        + " [" + sessUpdate.wordChainIndex + "]" 
        // + " [" + sessUpdate.mentions + "]" 
        + " | UID: " + sessUpdate.userId 
        + " | ENT: " + sessUpdate.tags.entity 
        + " | CH: " + sessUpdate.tags.channel 
        + " | " + sessUpdate.source.nodeId 
        + " > " + sessUpdate.target.nodeId
        // + "\n" + jsonPrint(sessUpdate)
      );

      currentSession.groupId = currentGroup.groupId;
      currentSession.age = 1e-6;
      currentSession.ageMaxRatio = 1e-6;
      currentSession.mentions = 1;
      currentSession.lastSeen = dateNow;
      currentSession.rank = -1;
      currentSession.isSession = true;
      currentSession.nodeId = sessUpdate.tags.entity + "_" + sessUpdate.tags.channel;
      currentSession.sessionId = sessUpdate.sessionId;
      currentSession.tags = {};
      currentSession.tags = sessUpdate.tags;
      currentSession.userId = sessUpdate.userId;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.text = sessUpdate.tags.entity + "[" + sessUpdate.tags.channel + "]";
      currentSession.source = sessUpdate.source;
      currentSession.target = sessUpdate.target;
      currentSession.latestNodeId = sessUpdate.source.nodeId;
      currentSession.linkHashMap = new HashMap();
      currentSession.initialPosition = currentGroup.initialPosition;
      currentSession.x = currentGroup.x;
      currentSession.y = currentGroup.y;

      currentSession.sessionColors = {};
      currentSession.sessionColors = currentGroup.sessionColors;
      currentSession.interpolateSessionColor = currentGroup.interpolateSessionColor;
      currentSession.interpolateColor = currentGroup.interpolateSessionColor;

      currentSession.groupColors = {};
      currentSession.groupColors = currentGroup.groupColors;
      currentSession.interpolateGroupColor = currentGroup.interpolateGroupColor;

      currentSession.nodeColors = {};
      currentSession.nodeColors = currentGroup.nodeColors;
      currentSession.interpolateNodeColor = currentGroup.interpolateNodeColor;

      // CREATE SESSION NODE

      currentSession.node = {};
      currentSession.node.isSessionNode = true;
      currentSession.node.isGroupNode = false;
      currentSession.node.isDead = false;
      currentSession.node.nodeId = sessUpdate.tags.entity + "_" + sessUpdate.tags.channel;
      currentSession.node.entity = sessUpdate.tags.entity;
      currentSession.node.channel = sessUpdate.tags.channel;
      currentSession.node.userId = sessUpdate.userId;
      currentSession.node.sessionId = sessUpdate.sessionId;
      currentSession.node.age = 1e-6;
      currentSession.node.ageMaxRatio = 1e-6;
      currentSession.node.ageUpdated = dateNow;
      currentSession.node.lastSeen = dateNow;
      currentSession.node.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.node.mentions = sessUpdate.wordChainIndex;
      currentSession.node.text = sessUpdate.tags.entity + "[" + sessUpdate.tags.channel + "]";
      currentSession.node.r = config.defaultNodeRadius;
      currentSession.node.x = currentGroup.initialPosition.x + randomIntFromInterval(-10,10);
      currentSession.node.y = currentGroup.initialPosition.y + randomIntFromInterval(-10,10);

      currentSession.node.sessionColors = {};
      currentSession.node.sessionColors = currentGroup.sessionColors;
      currentSession.node.interpolateSessionColor = currentGroup.interpolateSessionColor;
      currentSession.node.interpolateColor = currentGroup.interpolateSessionColor;

      currentSession.node.groupColors = {};
      currentSession.node.groupColors = currentGroup.groupColors;
      currentSession.node.interpolateGroupColor = currentGroup.interpolateGroupColor;

      currentSession.node.nodeColors = {};
      currentSession.node.nodeColors = currentGroup.nodeColors;
      currentSession.node.interpolateNodeColor = currentGroup.interpolateNodeColor;

      currentSession.node.links = {};

      var sessionLinkId = currentSession.node.nodeId + "_" + currentSession.latestNodeId;
      currentSession.node.links[sessionLinkId] = 1;
      currentSession.node.link = sessionLinkId;

      currentSession.source.lastSeen = dateNow;
      if (typeof currentSession.target !== 'undefined') {
        currentSession.target.lastSeen = dateNow;
      }

      addToHashMap(nodeHashMap, currentSession.node.nodeId, currentSession.node, function(sesNode) {
        // console.log("NEW SESSION NODE" 
        //   + " | " + sesNode.nodeId
        //   + " | " + sesNode.text
        //   + " | WCI: " + sesNode.wordChainIndex
        //   + " | M: " + sesNode.wordChainIndex
        // );

        currentSessionView.addNode(sesNode);

        addToHashMap(sessionHashMap, currentSession.nodeId, currentSession, function(cSession) {
          // console.log("\nNEW SESSION"
          //   + "\nGRP: " + currentGroup.groupId
          //   + "\nGRPN: " + currentGroup.name
          //   + "\nUID: " + cSession.userId 
          //   + "\nNID: " + cSession.nodeId 
          //   + "\nSID: " + cSession.sessionId 
          //   + "\nSNID: " + cSession.node.nodeId
          //   + "\nLNID: " + cSession.latestNodeId
          //   + "\nWCI:" + cSession.wordChainIndex 
          //   + "\nM:" + cSession.mentions 
          //   // + "\n" + jsonPrint(cSession) 
          // );
          currentSessionView.addSession(cSession);
          nodeCreateQueue.push(cSession);
          return (callback(null, cSession.nodeId));
        });
      });
    }
  }
}

var createNode = function(callback) {

  if (nodeCreateQueue.length > 0) {

    var dateNow = moment().valueOf();

    var session = nodeCreateQueue.shift();

    if (nodeHashMap.has(session.node.nodeId)) {

      var sessionNode = nodeHashMap.get(session.node.nodeId);

      // console.log("FOUND NODE" 
      //   + " | " + session.node.nodeId
      //   // + "\n" + jsonPrint(session)
      // );

      sessionNode.age = 1e-6;
      sessionNode.ageMaxRatio = 1e-6;
      sessionNode.isDead = false;
      sessionNode.wordChainIndex = session.wordChainIndex;
      sessionNode.mentions = session.wordChainIndex;

      session.node = sessionNode;

      addToHashMap(nodeHashMap, session.node.nodeId, sessionNode, function(sNode) {
      });

    } 
    else {

      console.log("CREATE SESSION NODE" 
        + " | " + session.node.nodeId
        // + "\n" + jsonPrint(session)
      );

      session.node.bboxWidth = 1e-6;
      session.node.isSessionNode = true;
      session.node.isGroupNode = false;
      session.node.nodeId = session.tags.entity + "_" + session.tags.channel;
      session.node.entity = session.tags.entity;
      session.node.channel = session.tags.channel;
      session.node.text = session.tags.entity + "[" + session.tags.channel + "]";
      session.node.userId = session.userId;
      session.node.sessionId = session.sessionId;
      session.node.age = 1e-6;
      session.node.ageMaxRatio = 1e-6;
      session.node.isDead = false;
      session.node.wordChainIndex = session.wordChainIndex;
      session.node.mentions = session.wordChainIndex+1;
      session.node.r = config.defaultNodeRadius;
      session.node.x = session.initialPosition.x + randomIntFromInterval(-10,10);
      session.node.y = session.initialPosition.y + randomIntFromInterval(-10,10);

      // session.node.colors = {};
      session.node.groupColors = session.groupColors;
      session.node.sessionColors = session.sessionColors;
      session.node.nodeColors = session.nodeColors;
      session.node.interpolateGroupColor = session.interpolateGroupColor;
      session.node.interpolateNodeColor = session.interpolateNodeColor;
      session.node.interpolateSessionColor = session.interpolateSessionColor;
      session.node.interpolateColor = session.interpolateSessionColor;

      addToHashMap(nodeHashMap, session.node.nodeId, session.node, function(sNode) {
        currentSessionView.addNode(sNode);
      });
    }

    var sourceNodeId;
    var targetNodeId;

    if ((config.sessionViewType == 'ticker') || (config.sessionViewType == 'flow')){
      sourceNodeId = session.source.nodeId + "_" + moment().valueOf();
      targetNodeId = session.target.nodeId + "_" + moment().valueOf();
    }
    else {
      sourceNodeId = session.source.nodeId;
      targetNodeId = session.target.nodeId;
    }

    var sourceText = session.source.nodeId;
    var targetText = session.target.nodeId;

    var targetNode = {};
    var sourceNode = {};

    async.parallel({
        source: function(cb) {
          if (ignoreWordHashMap.has(sourceText)) {
            console.debug("IGNORED SOURCE: " + sourceText);
          }
          if (keywordHashMap.has(sourceText)) {
            console.error("TARGET SOURCE: " + sourceText);
          }
          if ((config.sessionViewType != 'ticker') && (config.sessionViewType != 'flow') && ignoreWordHashMap.has(sourceText)) {
            // if (ignoreWordHashMap.has(sourceText)) {
            // console.warn("sourceNodeId IGNORED: " + sourceNodeId);
            cb(null, {
              node: sourceNodeId,
              isIgnored: true,
              isNew: false
            });
          } 
          else if (nodeHashMap.has(sourceNodeId)) {
            sourceNode = nodeHashMap.get(sourceNodeId);
            sourceNode.isIgnored = ignoreWordHashMap.has(sourceText);
            sourceNode.isKeyword = keywordHashMap.has(sourceText);
            sourceNode.keywordColor = keywordHashMap.get(sourceText);
            sourceNode.latestNode = true;
            sourceNode.newFlag = false;
            sourceNode.userId = session.userId;
            sourceNode.sessionId = session.sessionId;
            sourceNode.groupId = session.groupId;
            sourceNode.channel = session.tags.channel;
            sourceNode.age = 1e-6;
            sourceNode.ageMaxRatio = 1e-6;
            sourceNode.isDead = false;
            sourceNode.ageUpdated = dateNow;
            sourceNode.lastSeen = dateNow;

            sourceNode.groupColors = session.groupColors;
            sourceNode.sessionColors = session.sessionColors;
            sourceNode.nodeColors = session.nodeColors;
            sourceNode.interpolateGroupColor = session.interpolateGroupColor;
            sourceNode.interpolateNodeColor = session.interpolateNodeColor;
            sourceNode.interpolateSessionColor = session.interpolateSessionColor;
            sourceNode.interpolateColor = session.interpolateSessionColor;

            if (sourceNode.isSessionNode){
              sourceNode.text = session.tags.entity + "[" + session.tags.channel + "]";
              sourceNode.wordChainIndex = session.source.wordChainIndex;
              sourceNode.mentions = session.source.wordChainIndex;
            }
            else {
              sourceNode.text = sourceText;
              sourceNode.mentions = session.source.mentions;
            }

            addToHashMap(nodeHashMap, sourceNodeId, sourceNode, function(sNode) {
              cb(null, {
                node: sNode,
                isIgnored: false,
                isNew: false
              });
            });
          } 
          else {
            sourceNode = session.source;
            sourceNode.nodeId = sourceNodeId;
            sourceNode.bboxWidth = 1e-6;
            sourceNode.isIgnored = ignoreWordHashMap.has(sourceText);
            sourceNode.isKeyword = keywordHashMap.has(sourceText);
            sourceNode.newFlag = true;
            sourceNode.latestNode = true;
            sourceNode.isSessionNode = false;
            sourceNode.isGroupNode = false;
            sourceNode.userId = session.userId;
            sourceNode.groupId = session.groupId;
            sourceNode.channel = session.tags.channel;
            sourceNode.sessionId = session.sessionId;
            sourceNode.links = {};
            sourceNode.rank = -1;
            sourceNode.age = 1e-6;
            sourceNode.ageMaxRatio = 1e-6;
            sourceNode.isDead = false;
            sourceNode.lastSeen = dateNow;
            sourceNode.ageUpdated = dateNow;

            sourceNode.groupColors = session.groupColors;
            sourceNode.sessionColors = session.sessionColors;
            sourceNode.nodeColors = session.nodeColors;
            sourceNode.keywordColor = keywordHashMap.get(sourceText);

            sourceNode.interpolateGroupColor = session.interpolateGroupColor;
            sourceNode.interpolateNodeColor = session.interpolateNodeColor;
            sourceNode.interpolateSessionColor = session.interpolateSessionColor;
            sourceNode.interpolateColor = session.interpolateSessionColor;

            sourceNode.r = config.defaultNodeRadius;
            sourceNode.x = session.node.x+randomIntFromInterval(-10,10);
            sourceNode.y = session.node.y+randomIntFromInterval(-10,10);

            if (sourceNode.isSessionNode){
              sourceNode.text = session.tags.entity + "[" + session.tags.channel + "]";
              sourceNode.wordChainIndex = session.source.wordChainIndex;
              sourceNode.mentions = session.source.wordChainIndex;
            }
            else {
              sourceNode.text = sourceText;
              sourceNode.mentions = session.source.mentions;
            }

            addToHashMap(nodeHashMap, sourceNodeId, sourceNode, function(sNode) {
              cb(null, {
                node: sNode,
                isIgnored: false,
                isNew: true
              });
            });
          }

        },

        target: function(cb) {

          if (ignoreWordHashMap.has(targetText)) {
            console.debug("IGNORED TARGET: " + targetText);
          }

          if (typeof targetNodeId === 'undefined' || (config.sessionViewType == 'ticker') || (config.sessionViewType == 'flow')) {
          // if (typeof targetNodeId === 'undefined') {
            // console.warn("targetNodeId UNDEFINED ... SKIPPING CREATE NODE");
            cb("TARGET UNDEFINED", null);
          } else if (ignoreWordHashMap.has(targetNodeId)) {
            // console.warn("targetNodeId IGNORED: " + targetNodeId);
            cb(null, {
              node: targetNodeId,
              isIgnored: true,
              isNew: false
            });
          } else if (nodeHashMap.has(targetNodeId)) {
            targetNode = nodeHashMap.get(targetNodeId);
            targetNode.newFlag = false;
            targetNode.isIgnored = ignoreWordHashMap.has(targetText);
            targetNode.isKeyword = keywordHashMap.has(targetText);
            targetNode.userId = session.userId;
            targetNode.sessionId = session.sessionId;
            targetNode.groupId = session.groupId;
            targetNode.channel = session.tags.channel;
            targetNode.age = 1e-6;
            targetNode.ageMaxRatio = 1e-6;
            targetNode.isDead = false;
            targetNode.ageUpdated = dateNow;
            targetNode.lastSeen = dateNow;

            targetNode.groupColors = session.groupColors;
            targetNode.sessionColors = session.sessionColors;
            targetNode.nodeColors = session.nodeColors;
            targetNode.interpolateGroupColor = session.interpolateGroupColor;
            targetNode.interpolateNodeColor = session.interpolateNodeColor;
            targetNode.interpolateSessionColor = session.interpolateSessionColor;
            targetNode.interpolateColor = session.interpolateSessionColor;

            targetNode.latestNode = false;
            if (targetNode.isSessionNode){
              targetNode.text = session.tags.entity + "[" + session.tags.channel + "]";
              targetNode.wordChainIndex = session.target.wordChainIndex;
              targetNode.mentions = session.target.wordChainIndex;
              targetNode.r = config.defaultNodeRadius;
              targetNode.x = session.node.x;
              targetNode.y = session.node.y;
            }
            else {
              targetNode.text = targetText;
              targetNode.mentions = session.target.mentions;
            }

            addToHashMap(nodeHashMap, targetNodeId, targetNode, function(tNode) {
              cb(null, {
                node: tNode,
                isIgnored: false,
                isNew: false
              });
            });
          } else {
            targetNode = session.target;
            targetNode.nodeId = targetNodeId;
            targetNode.bboxWidth = 1e-6;
            targetNode.newFlag = true;
            targetNode.isSessionNode = false;
            targetNode.isGroupNode = false;
            targetNode.isIgnored = ignoreWordHashMap.has(targetText);
            targetNode.isKeyword = keywordHashMap.has(targetText);
            targetNode.userId = session.userId;
            targetNode.groupId = session.groupId;
            targetNode.channel = session.tags.channel;
            targetNode.sessionId = session.sessionId;
            targetNode.links = {};
            targetNode.rank = -1;
            targetNode.age = 1e-6;
            targetNode.ageMaxRatio = 1e-6;
            targetNode.isDead = false;
            targetNode.lastSeen = dateNow;
            targetNode.ageUpdated = dateNow;

            targetNode.groupColors = session.groupColors;
            targetNode.sessionColors = session.sessionColors;
            targetNode.nodeColors = session.nodeColors;
            targetNode.interpolateGroupColor = session.interpolateGroupColor;
            targetNode.interpolateNodeColor = session.interpolateNodeColor;
            targetNode.interpolateSessionColor = session.interpolateSessionColor;
            targetNode.interpolateColor = session.interpolateSessionColor;

            targetNode.latestNode = false;
            if (targetNode.isSessionNode){
              targetNode.text = session.tags.entity + "[" + session.tags.channel + "]";
              targetNode.wordChainIndex = session.target.wordChainIndex;
              targetNode.mentions = session.target.wordChainIndex;
              targetNode.r = config.defaultNodeRadius;
              targetNode.x = session.node.x;
              targetNode.y = session.node.y;
            }
            else {
              targetNode.text = targetText;
              targetNode.mentions = session.target.mentions;
              targetNode.r = config.defaultNodeRadius;
              targetNode.x = session.node.x - (100 - 100 * Math.random());
              targetNode.y = session.node.y - (100 - 100 * Math.random());
            }

            addToHashMap(nodeHashMap, targetNodeId, targetNode, function(tNode) {
              cb(null, {
                node: tNode,
                isIgnored: false,
                isNew: true
              });
            });
          }
        }
      },
      function(err, results) {

        // console.warn("results\n" + jsonPrint(results));

        if (!results.source.isIgnored) {
          session.source = results.source.node;
          session.source.isNew = results.source.isNew;
          if (results.source.isNew) {
            currentSessionView.addNode(results.source.node);
          }
        }

        if (results.target && !results.target.isIgnored) {
          session.target = results.target.node;
          session.target.isNew = results.target.isNew;
          if (results.target.isNew) {
            currentSessionView.addNode(results.target.node);
          }
        }

        addToHashMap(sessionHashMap, session.nodeId, session, function(cSession) {
    // console.warn("cSession\n" + jsonPrint(session));
          if (!results.source.isIgnored && (config.sessionViewType != 'ticker')) {
            linkCreateQueue.push(cSession);
          }
        });
      });
  }
  return (callback(null, sessionId));
}

var createLink = function(callback) {

  if ((config.sessionViewType !== 'ticker') 
    // && (config.sessionViewType !== 'flow') 
    && !config.disableLinks 
    && (linkCreateQueue.length > 0)) {

    var session = linkCreateQueue.shift();

    // console.warn("createLink session\n" + jsonPrint(session));

    var currentGroup = groupHashMap.get(session.tags.group.groupId);

    // console.warn("createLink currentGroup\n" + jsonPrint(currentGroup));

    var groupLinkId;
    var sessionLinkId;

    // if (!session.node.isGroupNode && (currentGroup.node.nodeId != session.node.nodeId)){
    // if (session.node.isSessionNode && (currentGroup.node.nodeId != session.node.nodeId)){
    if (typeof currentGroup === 'undefined'){
    }
    else if (currentGroup.node.nodeId != session.node.nodeId){

      var groupLinkId = currentGroup.node.nodeId + "_" + session.node.nodeId;

      currentGroup.node.links[groupLinkId] = 1;
      session.node.links[groupLinkId] = 1;

      if (!linkHashMap.has(groupLinkId)){
        // console.error("-M- GROUP LINK HASH MISS | " + groupLinkId);
        var newGroupLink = {
          linkId: groupLinkId,
          groupId: currentGroup.groupId,
          age: 0,
          isDead: false,
          source: currentGroup.node,
          target: session.node,
          isGroupLink: true
        };


        addToHashMap(linkHashMap, groupLinkId, newGroupLink, function(grpLink) {
          // console.log("grpLink\n" + jsonPrint(grpLink));
          currentSessionView.addLink(grpLink);
        });
      }
      else {
        var groupLink = linkHashMap.get(groupLinkId);
        // console.log("*** GROUP LINK HASH HIT | " + groupLinkId);
        groupLink.age = 1e-6;
        groupLink.ageMaxRatio = 1e-6;
        addToHashMap(linkHashMap, groupLinkId, groupLink, function(grpLink) {
          // console.log("grpLink\n" + jsonPrint(grpLink));
          // currentSessionView.addLink(grpLink);
        });
      }
    }
    else {
      console.warn("SOURCE == TARGET ?"
        + " | " + currentGroup.node.nodeId
        + " | " + session.node.nodeId
      );
    }



    addToHashMap(sessionHashMap, session.nodeId, session, function(sess) {});
  }
  return (callback(null, sessionId));
}

var updateSessionsReady = true;
function updateSessions() {

  updateSessionsReady = false;

  async.series(
    [
      processLinkDeleteQueue,
      processNodeDeleteQueue,
      processSessionQueues,
      createGroup,
      createSession,
      createNode,
      createLink,
    ],

    function(err, result) {
      if (err) {
        console.error("*** ERROR: updateSessions *** \nERROR: " + err);
      }
      updateSessionsReady = true;

    }
  );
}

function toggleFullScreen() {

  console.warn("toggleFullScreen");

  if (!document.fullscreenElement &&
    !document.mozFullScreenElement && 
    !document.webkitFullscreenElement && 
    !document.msFullscreenElement) {

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
      currentSessionView.resize();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
      currentSessionView.resize();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
      currentSessionView.resize();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      currentSessionView.resize();
    }
  } else {

    if (document.exitFullscreen) {
      document.exitFullscreen();
      currentSessionView.resize();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      currentSessionView.resize();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      currentSessionView.resize();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      currentSessionView.resize();
    }
  }
}

var updateSessionsInterval;

function clearUpdateSessionsInterval() {
  clearInterval(updateSessionsInterval);
}

function initUpdateSessionsInterval(interval) {
  clearInterval(updateSessionsInterval);
  updateSessionsInterval = setInterval(function() {
    if (updateSessionsReady) updateSessions();
  }, interval);
}

requirejs.onError = function(err) {
  console.error("*** REQUIRE ERROR\n" + err);
  if (err.requireType === 'timeout') {
    console.log('modules: ' + err.requireModules);
  }
  throw err;
};

function loadViewType(svt, callback) {

  console.log("LOADING SESSION VIEW TYPE: " + svt);

  switch (svt) {
    case 'ticker':
      config.sessionViewType = 'ticker';
      requirejs(["js/libs/sessionViewTicker_v4"], function() {
        console.log("sessionViewTicker LOADED");
        currentSessionView = new ViewTicker();
        callback();
      });
      break;
    case 'flow':
      config.sessionViewType = 'flow';
      requirejs(["js/libs/sessionViewFlow"], function() {
        console.log("sessionViewFlow LOADED");
        currentSessionView = new ViewFlow();
        callback();
      });
      break;
    case 'histogram':
      config.sessionViewType = 'histogram';
      requirejs(["js/libs/sessionViewHistogram"], function() {
        console.log("sessionViewHistogram LOADED");
        currentSessionView = new ViewHistogram();
        callback();
      });
      break;
    default:
      config.sessionViewType = 'force';
      requirejs(["js/libs/sessionViewForce_v4"], function() {
        console.log("sessionViewForce LOADED");
        currentSessionView = new ViewForce();
        callback();
      });
      break;
  }
}

function initIgnoreWordsHashMap(callback) {
  async.each(ignoreWordsArray, function(ignoreWord, cb) {
    addToHashMap(ignoreWordHashMap, ignoreWord, true, function() {
      cb();
    });
  }, function(err) {
    callback();
  });
}

function initialize(callback) {

  console.log("INITIALIZE ...");

  getUrlVariables(function(err, urlVariablesObj) {

    document.dispatchEvent(sessionDragEndEvent);

    console.log("URL VARS\n" + jsonPrint(urlVariablesObj));

    var sessionId;
    var namespace;

    if (!err) {

      console.log("ON LOAD getUrlVariables\n" + jsonPrint(urlVariablesObj));

      if (typeof urlVariablesObj !== 'undefined') {
        if (urlVariablesObj.sessionId) {
          sessionId = urlVariablesObj.sessionId;
        }
        if (urlVariablesObj.namespace) {
          namespace = urlVariablesObj.namespace;
        }
        if (urlVariablesObj.sessionViewType) {

          config.sessionViewType = urlVariablesObj.sessionViewType;

          console.log("ON LOAD getUrlVariables: sessionViewType:" + config.sessionViewType);

          if (config.sessionViewType == 'ticker') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType == 'flow') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType == 'histogram') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }

          loadViewType(config.sessionViewType, function() {

            console.warn(config.sessionViewType);

            if (config.sessionViewType == 'ticker') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'flow') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'histogram') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'force') {
              currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
            }

            store.set('config', config);

            currentSessionView.initD3timer();
            currentSessionView.resize();

            initUpdateSessionsInterval(50);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              console.log("END PAGE LOAD TIMEOUT");
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) displayInfo(false);
              if (!config.showStatsFlag) displayControl(false);
            }, 5000);

            callback();
          });
        }
        else {

          console.warn("DEFAULT_SESSION_VIEW");

          config.sessionViewType = DEFAULT_SESSION_VIEW;

          loadViewType(config.sessionViewType, function() {

            if (config.sessionViewType == 'ticker') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'flow') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'histogram') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'force') {
              currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
            }

            store.set('config', config);

            currentSessionView.simulationControl('START');
            currentSessionView.resize();

            initUpdateSessionsInterval(50);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              console.log("END PAGE LOAD");
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) displayInfo(false);
              if (!config.showStatsFlag) displayControl(false);
            }, 5000);

            callback();

          });
        }
      } 
      else {

        console.warn("DEFAULT_SESSION_VIEW");

        config.sessionViewType = DEFAULT_SESSION_VIEW;

        loadViewType(config.sessionViewType, function() {

          if (config.sessionViewType == 'ticker') {
            currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
          }
          if (config.sessionViewType == 'flow') {
            currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
          }
          if (config.sessionViewType == 'histogram') {
            currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
          }
          if (config.sessionViewType == 'force') {
            currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
          }

          store.set('config', config);

          currentSessionView.initD3timer();
          currentSessionView.resize();

          initUpdateSessionsInterval(50);

          console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
          socket.emit("VIEWER_READY", viewerObj);

          setTimeout(function() {
            console.error("END PAGE LOAD TIMEOUT");
            pageLoadedTimeIntervalFlag = false;
            if (!config.showStatsFlag) displayInfo(false);
            if (!config.showStatsFlag) displayControl(false);
          }, 5000);
        });

        callback();

      }

    } 
    else {
      console.error("GET URL VARIABLES ERROR\n" + jsonPrint(err));
      callback(err);
    }
  });
};
