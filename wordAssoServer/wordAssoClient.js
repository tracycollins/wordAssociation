/*jslint node: true */
"use strict";

var DEFAULT_MAX_AGE = 10000;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var debug = false ;
var testMode = false ;

var userResponseEnabled = false;

var sessionMode = 'STREAM' ;
var monitorMode = false ;

var responseTimeoutInterval = 1000 ;

var defaultTextColor = "#888888";

var urlRoot = "http://word.threeceelabs.com/session?session=";
var configHashMap = new HashMap();

configHashMap.set('testMode', testMode);
configHashMap.set('debug', debug);
configHashMap.set('monitorMode', monitorMode);

var resizeFlag = false ;

var showStatsFlag = false ;
var pageLoadedTimeIntervalFlag = true ;

var updateInterval = 500 ;
var defaultFadeDuration = 250 ;

var fullscreenFlag = false ;
var mouseMovingFlag = false ;
var mouseMoveTimeoutInterval = 5000; // 5 seconds
var mouseOverFlag = false ;
var mouseHoverFlag = false ;

var namespace = 'user'
var socket = io('/' + namespace);
var socketId ;
var connectedFlag = false ;

var jsonPrint = function (obj){
  if (obj) {
    return JSON.stringify(obj, null, 2);
  }
  else {
    return "UNDEFINED";
  }
}

var randomFloatFromInterval = function (min,max) {
  var random = Math.random() ;
  var randomFloat = (random*(max-min))+min;
  return randomFloat;
}

var randomIntFromInterval = function (min,max) {
  var random = Math.random() ;
  var randomInt = Math.floor((random*(max-min+1))+min) ;
  return randomInt;
}

function getMillis() {
  var d = new Date();
  return d.getMilliseconds();
}

var USER_ID = 'CLIENT_' + getMillis();
var SCREEN_NAME = USER_ID;

var userObj = {};
userObj.tags = {};

userObj.userId = USER_ID;
userObj.screenName = SCREEN_NAME;
userObj.type = "USER";
userObj.mode = sessionMode;
userObj.streamSource = "USER";
userObj.tags.entity = USER_ID;

function getUrlVariables(config){

  var searchString = window.location.search.substring(1);
  var variableArray = searchString.split('&');

  for(var i = 0; i < variableArray.length; i++){
    var keyValuePair = variableArray[i].split('=');
    if (typeof keyValuePair[1] !== 'undefined'){
      configHashMap.set(keyValuePair[0], keyValuePair[1]) ;
      console.log("'" + variableArray[i] + "' >>> URL config: " + keyValuePair[0] + " : " + configHashMap.get(keyValuePair[0]));  
      if (keyValuePair[0] == 'monitor') {
        monitorMode = keyValuePair[1] ;
      }    
    } 
    else {
      console.log("NO URL VARIABLES");      
      configHashMap.set('monitor', false) ;
    }
  }
}

var transmitDataQueue = [];

setInterval(function(){
  socket.emit("SESSION_KEEPALIVE", userObj);
}, 60000);

setInterval(function(){
  if (transmitDataQueue.length > 0){
    var wordObj = {};
    wordObj.tags = {};
    wordObj.tags.entity = userObj.userId;
    wordObj.nodeId = transmitDataQueue.shift();
    socket.emit("RESPONSE_WORD_OBJ", wordObj);
  }
}, 447);

function sendUserResponse(sessionMode, data, callback){
  console.log("SESSION MODE: " + sessionMode + " | RAW INPUT: " + data);

  if (!data) {
    console.warn("NO INPUT WORD");
    callback('');
    return;
  }

  var userResponseValue = data.replace(/\s+/g, ' ') ;
  userResponseValue = userResponseValue.replace(/[\n\r\[\]\{\}\<\>\/\;\:\"\`\~\?\!\@\#\$\%\^\&\*\(\)\_\+\=]+/g, '') ;
  userResponseValue = userResponseValue.replace(/\s+/g, ' ') ;
  userResponseValue = userResponseValue.replace(/^\s+|\s+$/g, '') ;
  userResponseValue = userResponseValue.replace(/\'+/g, "'") ;
  userResponseValue = userResponseValue.toLowerCase();

  console.log("CORRECTED INPUT: " + userResponseValue);

  if (userResponseValue == '') {
    console.warn("NO INPUT WORD");
    callback('');
    return;
  }
  else if (sessionMode == 'STREAM') {
    var wordArray = userResponseValue.split(" ");
    wordArray.forEach(function(word){
      console.log("TX-Q WORD: '" + word + "'");
      transmitDataQueue.push(word);
    });
    callback(userResponseValue);
    return;
  }
  else if (sessionMode == 'PROMPT') {
    console.log("TX WORD: '" + userResponseValue + "'");
    socket.emit("RESPONSE_WORD_OBJ", {nodeId: userResponseValue});
    callback(userResponseValue);
    return;
  }
}

var currentInput = '';
var previousInput = '';
var previousTimestamp = moment().valueOf();
var timeDelta = 0;

var currentStreamInput = '';
var previousStreamInputData = '';
var previousStreamTimestamp = moment().valueOf();
var timeStreamDelta = 0;

var checkStreamInputTextInterval;
var inputChangedTimeout;
var inputStreamChangedTimeout;

var userResponseValue = "";
var userResponseStreamValue = "";

var socketIdDiv = document.getElementById("socketId");
var socketIdLabel = document.createElement("label");

socketIdLabel.innerHTML = "SID: " + socket.id;   
socketIdDiv.appendChild(socketIdLabel);

var checkInputTextInterval;
var enterKeyDownFlag = false ;

function addServerPrompt() {
  var serverPromptOutput = document.createElement("output"); 
  var serverPromptLabel = document.createElement("label");
  serverPromptLabel.setAttribute("id", "serverPromptLabel");

  serverPromptLabel.innerHTML = "SERVER SAYS: ";   

  serverPromptOutput.setAttribute("class", "serverPrompt");
  serverPromptOutput.setAttribute("type", "text");
  serverPromptOutput.setAttribute("id", "serverPromptOutput");
  serverPromptOutput.setAttribute("name", "serverPrompt");
  serverPromptOutput.setAttribute("value", "");
  serverPromptOutput.innerHTML = "";   

  var serverPromptDiv = document.getElementById("serverPromptDiv");
  serverPromptDiv.appendChild(serverPromptLabel);
  serverPromptDiv.appendChild(serverPromptOutput);
}

function addPairedUserPrompt() {
  var pairedUserPromptOutput = document.createElement("output"); 
  var pairedUserPromptLabel = document.createElement("label");
  pairedUserPromptLabel.setAttribute("id", "pairedUserPromptLabel");

  pairedUserPromptLabel.innerHTML = "... WAITING FOR USER TO PAIR ...";   

  pairedUserPromptOutput.setAttribute("class", "serverPrompt");
  pairedUserPromptOutput.setAttribute("type", "text");
  pairedUserPromptOutput.setAttribute("id", "serverPromptOutput");
  pairedUserPromptOutput.setAttribute("name", "serverPrompt");
  pairedUserPromptOutput.setAttribute("value", "");
  pairedUserPromptOutput.innerHTML = "";   

  var pairedUserPromptDiv = document.getElementById("pairedUserPromptDiv");
  pairedUserPromptDiv.appendChild(pairedUserPromptLabel);
  pairedUserPromptDiv.appendChild(pairedUserPromptOutput);
}

function addUserResponseStream() {
  var userResponseStreamInput = document.createElement("textarea");
  var userResponseStreamLabel = document.createElement("label");
  userResponseStreamLabel.setAttribute("id", "userResponseStreamLabel");

  userResponseStreamLabel.innerHTML = "WHAT SAY YOU? (text sent when idle)";   

  userResponseStreamInput.setAttribute("class", "userResponseStream");
  userResponseStreamInput.setAttribute("type", "textarea");
  userResponseStreamInput.setAttribute("id", "userResponseStreamInput");
  userResponseStreamInput.setAttribute("name", "userResponseStream");
  userResponseStreamInput.setAttribute("autofocus", true);
  userResponseStreamInput.setAttribute("autocapitalize", "none");
  userResponseStreamInput.setAttribute("value", userResponseStreamValue);
  userResponseStreamInput.setAttribute("rows", 10);
  userResponseStreamInput.setAttribute("cols", 50);
  userResponseStreamInput.setAttribute("onkeydown", "if (event.keyCode == 13) { return sendUserResponseOnEnter() }");

  var userResponseStreamDiv = document.getElementById("userResponseStreamDiv");
  userResponseStreamDiv.appendChild(userResponseStreamLabel);
  userResponseStreamDiv.appendChild(userResponseStreamInput);

  checkStreamInputText();
}

function enableUserResponsePrompt() {
  userResponseEnabled = true;
}

function disableUserResponsePrompt() {
  userResponseEnabled = false;
}

function addUserResponsePrompt() {
  var userResponseInput = document.createElement("input");
  var userResponseLabel = document.createElement("label");
  userResponseLabel.setAttribute("id", "userResponseLabel");

  userResponseLabel.innerHTML = "YOU RESPOND: ";   

  userResponseInput.setAttribute("class", "userResponse");
  userResponseInput.setAttribute("type", "text");
  userResponseInput.setAttribute("id", "userResponseInput");
  userResponseInput.setAttribute("name", "userResponse");
  userResponseInput.setAttribute("autofocus", true);
  userResponseInput.setAttribute("autocapitalize", "none");
  userResponseInput.setAttribute("value", userResponseValue);
  userResponseInput.setAttribute("onkeydown", "if (event.keyCode == 13) { return sendUserResponseOnEnter() }");
  // userResponseInput.setAttribute("onkeydown", "if (event.keyCode == 13) { return sendUserResponse() }");

  var userResponseDiv = document.getElementById("userResponseDiv");
  userResponseDiv.appendChild(userResponseLabel);
  userResponseDiv.appendChild(userResponseInput);

  checkInputTextInterval = setInterval(function() { 
    if (connectedFlag && userResponseEnabled){
      currentInput = document.getElementById("userResponseInput").value.toLowerCase(); ;
      if (!currentInput){
        clearTimeout(inputChangedTimeout);
      }
      else if (enterKeyDownFlag || (previousInput != currentInput)) {
        enterKeyDownFlag = false ;
        clearTimeout(inputChangedTimeout);
        timeDelta = moment().valueOf() - previousTimestamp;
        // console.log("CHANGE [" + timeDelta + "]: "  + previousInput + " | " + currentInput);
        previousTimestamp = moment().valueOf();
        inputChangedTimeout = setTimeout(function(){
          sendUserResponse('PROMPT', currentInput, function(dataTransmitted){
            console.log("TXD: " + dataTransmitted);
            currentInput = document.getElementById("userResponseInput");
            currentInput.value = '';
          });
        }, responseTimeoutInterval);
      }
      previousInput = document.getElementById("userResponseInput").value.toLowerCase();
    }
    else if (connectedFlag && !userResponseEnabled){
      clearTimeout(inputChangedTimeout);
      currentInput = document.getElementById("userResponseInput");
      currentInput.value = '';
    }
  }, 100);
}

function sendUserResponseOnEnter(){
  console.log("sendUserResponseOnEnter");
  if (connectedFlag && userResponseEnabled) {
    enterKeyDownFlag = true ;
    clearTimeout(inputStreamChangedTimeout);
    clearInterval(checkStreamInputTextInterval);
    console.log("enterKeyDownFlag: " + enterKeyDownFlag);
    var inputDataRaw = document.getElementById("userResponseStreamInput");
    if (!inputDataRaw) return;
    var inputData = inputDataRaw.value.toLowerCase();

    if (inputData){
      sendUserResponse('STREAM', inputData, function(dataTransmitted){
        if (dataTransmitted !== '') console.log("TXD: " + dataTransmitted);
        var currentStreamInput = document.getElementById("userResponseStreamInput");
        console.log("currentStreamInput");
        for (var x in currentStreamInput)
          if (currentStreamInput.hasAttribute(x) && typeof x !== 'function'){
            console.log("currentStreamInput: " + x + " " + currentStreamInput[x]);
          }
        currentStreamInput = document.getElementById("userResponseStreamInput");
        currentStreamInput.value = '';
        previousStreamInputData = '';
        enterKeyDownFlag = false;
        checkStreamInputText();
      });
    }

  }
}

function checkStreamInputText() {
  checkStreamInputTextInterval = setInterval(function() { 
    if (connectedFlag && userResponseEnabled){
      var currentStreamInputData = document.getElementById("userResponseStreamInput").value.toLowerCase(); ;
      if (!currentStreamInputData || currentStreamInputData == ''){
        clearTimeout(inputStreamChangedTimeout);
      }
      else if (!enterKeyDownFlag && (previousStreamInputData != currentStreamInputData)) {
        clearTimeout(inputStreamChangedTimeout);
        var timeStreamDelta = moment().valueOf() - previousStreamTimestamp;
        // console.log("CHANGE [" + timeStreamDelta + "]: "  + previousStreamInput + " | " + currentStreamInput);
        previousStreamTimestamp = moment().valueOf();
        inputStreamChangedTimeout = setTimeout(function(){
          sendUserResponse('STREAM', currentStreamInputData, function(dataTransmitted){
            if (dataTransmitted !== '') console.log("TXD: " + dataTransmitted);
            var currentStreamInput = document.getElementById("userResponseStreamInput");
            currentStreamInput.value = '';
          });
        }, responseTimeoutInterval);
      }
      previousStreamInputData = document.getElementById("userResponseStreamInput").value.toLowerCase();
    }
  }, 100);
}

function updateServerPrompt(prompt){
  if (debug) console.log("updateServerPrompt: " + prompt);
  var serverPromptOutputText = document.getElementById("serverPromptOutput");
  serverPromptOutputText.innerHTML = prompt;
}

function updatePairedUserPromptLabel(labelText){
  var pairedUserPromptDiv = document.getElementById("pairedUserPromptDiv");
  pairedUserPromptLabel.innerHTML = labelText;   

}

function removeServerPrompt() {
  clearInterval(checkInputTextInterval);
  clearInterval(checkStreamInputTextInterval);

  var serverPromptDiv = document.getElementById("serverPromptDiv");
  while (serverPromptDiv.hasChildNodes()) {   
    serverPromptDiv.removeChild(serverPromptDiv.firstChild);
  }
}

function removePairedUserPrompt() {
  clearInterval(checkInputTextInterval);
  clearInterval(checkStreamInputTextInterval);

  var pairedUserPromptDiv = document.getElementById("pairedUserPromptDiv");
  while (pairedUserPromptDiv.hasChildNodes()) {   
    pairedUserPromptDiv.removeChild(pairedUserPromptDiv.firstChild);
  }
}

function removeUserResponsePrompt() {
  clearInterval(checkInputTextInterval);
  clearInterval(checkStreamInputTextInterval);

  var userResponseDiv = document.getElementById("userResponseDiv");
  while (userResponseDiv.hasChildNodes()) {   
    userResponseDiv.removeChild(userResponseDiv.firstChild);
  }
}

function removeUserResponseStream() {
  clearInterval(checkInputTextInterval);
  clearInterval(checkStreamInputTextInterval);

  var userResponseStreamDiv = document.getElementById("userResponseStreamDiv");
  while (userResponseStreamDiv.hasChildNodes()) {   
    userResponseStreamDiv.removeChild(userResponseStreamDiv.firstChild);
  }
}

function setSessionMode(mode){

  console.log("NEW SESSION MODE: " + mode);

  sessionMode = mode;
  userObj.mode = sessionMode;

  removeServerPrompt();
  removePairedUserPrompt();
  removeUserResponsePrompt();
  removeUserResponseStream();

  switch (mode) {
    case 'PROMPT':
      addServerPrompt();
      addUserResponsePrompt();
      enableUserResponsePrompt();
    break;

    case 'STREAM':
      addUserResponseStream();
      enableUserResponsePrompt();
    break;

    case 'USER_USER':
      addPairedUserPrompt();
      addUserResponsePrompt();
      disableUserResponsePrompt();
    break;

    default:
      console.error("??? UNKNOWN SESSION MODE: " + sessionMode);
    break;
  }

  var userReadyObj = {};
  userReadyObj.tags = {};
  userReadyObj.userId = userObj.userId;
  userReadyObj.screenName = userObj.screenName;
  userReadyObj.nodeId = userObj.userId;
  userReadyObj.tags.entity = userObj.userId;

  socket.emit("USER_READY", userReadyObj);
  console.log("TX USER READY\nuserReadyObj\n" + jsonPrint(userReadyObj));
  transmitDataQueue.push(userReadyObj.userId);
}


socket.on("PROMPT_WORD", function(promptWord){
  console.log("RX PROMPT_WORD: " + promptWord);
  updateServerPrompt(promptWord);
  enableUserResponsePrompt();
});


var autoResponseWord = "testing";

socket.on("SESSION_ABORT", function(socketId){

  console.error("**** RX SESSION_ABORT: " + socketId);

  var serverPromptDiv = document.getElementById("serverPromptDiv");
  var serverPromptLabel = document.getElementById("serverPromptLabel");
  var serverPromptOutput = document.getElementById("serverPromptOutput");

  if (serverPromptOutput) serverPromptDiv.removeChild(serverPromptOutput);
  if (serverPromptLabel) serverPromptDiv.removeChild(serverPromptLabel);

  var userResponseStreamDiv = document.getElementById("userResponseStreamDiv");
  var userResponseStreamLabel = document.getElementById("userResponseStreamLabel");
  var userResponseStreamInput = document.getElementById("userResponseStreamInput");

  if (userResponseStreamLabel) userResponseStreamDiv.removeChild(userResponseStreamLabel);
  if (userResponseStreamInput) userResponseStreamDiv.removeChild(userResponseStreamInput);

  var userResponseDiv = document.getElementById("userResponseDiv");
  var userResponseLabel = document.getElementById("userResponseLabel");
  var userResponseInput = document.getElementById("userResponseInput");

  if (userResponseLabel) userResponseDiv.removeChild(userResponseLabel);
  if (userResponseInput) userResponseDiv.removeChild(userResponseInput);

  socketIdLabel.innerHTML = '<bold>*** SESSION EXPIRED ***</bold>'  + '<br><br>' + 'REFRESH BROWSER TO RECONNECT' + '<br><br>EXPIRED SESSION: ' + socket.id; 

  socket.disconnect();
});

socket.on("SESSION_EXPIRED", function(reason){
  console.error("**** RX SESSION_EXPIRED: " + reason);

  var serverPromptDiv = document.getElementById("serverPromptDiv");
  var serverPromptLabel = document.getElementById("serverPromptLabel");
  var serverPromptOutput = document.getElementById("serverPromptOutput");

  if (serverPromptOutput) serverPromptDiv.removeChild(serverPromptOutput);
  if (serverPromptLabel) serverPromptDiv.removeChild(serverPromptLabel);

  var userResponseStreamDiv = document.getElementById("userResponseStreamDiv");
  var userResponseStreamLabel = document.getElementById("userResponseStreamLabel");
  var userResponseStreamInput = document.getElementById("userResponseStreamInput");

  if (userResponseStreamLabel) userResponseStreamDiv.removeChild(userResponseStreamLabel);
  if (userResponseStreamInput) userResponseStreamDiv.removeChild(userResponseStreamInput);

  var userResponseDiv = document.getElementById("userResponseDiv");
  var userResponseLabel = document.getElementById("userResponseLabel");
  var userResponseInput = document.getElementById("userResponseInput");

  if (userResponseInput) userResponseDiv.removeChild(userResponseInput);
  if (userResponseLabel) userResponseDiv.removeChild(userResponseLabel);

  socketIdLabel.innerHTML = '<bold>*** SESSION EXPIRED ***</bold>'  + '<br><br>' + 'REFRESH BROWSER TO RECONNECT' + '<br><br>EXPIRED SESSION: ' + socket.id; 

  socket.disconnect();  
});

socket.on("RANDOM_WORD", function(randomWord){
  enableUserResponsePrompt();

  console.log("RX RANDOM_WORD: " + randomWord);
  autoResponseWord = randomWord ;

  var userResponseValue = document.getElementById("userResponseInput") ;
  var charIndex = 0;
  var charArray = [];

  userResponseValue.value = charArray;

  var charTypeInterval = setInterval(function(){
    charArray.push(autoResponseWord[charIndex]);
    userResponseValue.value = charArray.join("");
    charIndex++;
    if (charIndex > autoResponseWord.length) {
      var sendResponseInterval = setTimeout(function(){
        sendUserResponse(userObj.mode, null, function(randomWord){
          console.log("TXD RANDOM: " + randomWord);
        });
      }, 1000);
      clearInterval(charTypeInterval);
    }
   }, 200);
});

socket.on("PROMPT_WORD_OBJ", function(promptWordObj){
  console.log("RX PROMPT_WORD_OBJ: " + promptWordObj.nodeId + " | BHT FOUND: " + promptWordObj.bhtFound);
  updateServerPrompt(promptWordObj.nodeId);
  if (monitorMode) socket.emit("GET_RANDOM_WORD");
  enableUserResponsePrompt();
});

socket.on("PAIRED_USER", function(pairedUserSessionId){
  console.warn("PAIRED USER: " + pairedUserSessionId);
  updatePairedUserPromptLabel("USER " + pairedUserSessionId);
  enableUserResponsePrompt();
});

socket.on("PAIRED_USER_END", function(pairedUserSessionId){
  console.warn("PAIRED USER END: " + pairedUserSessionId);
  updatePairedUserPromptLabel("... WAITING FOR USER TO PAIR ...");
  disableUserResponsePrompt();
});

socket.on("PAIRED_USER_END", function(pairedUserSessionId){
  console.warn("PAIRED USER END: " + pairedUserSessionId);
  updatePairedUserPromptLabel("... WAITING FOR USER TO PAIR ...");
  disableUserResponsePrompt();
});

socket.on('connect', function(){
  connectedFlag = true ;

  socketId = socket.id ;
  console.log(">>> CONNECTED TO HOST | SOCKET ID: " + socketId);
  getUrlVariables();
  socket.emit("USER_READY", userObj);
  console.log("TX USER READY\nuserObj\n" + jsonPrint(userObj));
  transmitDataQueue.push(userObj.userId);

  socketIdLabel.style.color = defaultTextColor ;
  socketIdLabel.innerHTML = userObj.userId + '<br>' + socket.id;   
  socketIdDiv.appendChild(socketIdLabel);
});

socket.on('reconnect', function(){
  connectedFlag = true ;
  socketId = socket.id ;
  console.log(">-> RECONNECTED TO HOST | SOCKET ID: " + socketId);
  getUrlVariables();
  socket.emit("USER_READY", userObj);

  socketIdLabel.style.color = defaultTextColor ;
  socketIdLabel.innerHTML = "SERVER DISCONNECTED";   
  socketIdDiv.appendChild(socketIdLabel);
});

socket.on('disconnect', function(){
  connectedFlag = false;
  console.error("*** DISCONNECTED FROM HOST | SOCKET ID: " + socketId);
  socketIdLabel.style.color = "red";
  socketIdLabel.innerHTML = "SERVER DISCONNECTED";   
  socketIdDiv.appendChild(socketIdLabel);
});

var data= [] ;

var fill = d3.scale.category10();
var color = d3.scale.category10();

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
}

var windowVisible = true;

function getSortedKeys(hmap) {
  var keys = []; 
  hmap.forEach(function(value, key){
    keys.push(key);
  });
  return keys.sort(function(a,b){return hmap.get(b).mentions-hmap.get(a).mentions});
}


document.title = "Word Association";

// Get Browser Prefix
var prefix = getBrowserPrefix();
var hidden = hiddenProperty(prefix);
var visibilityState = visibilityState(prefix);
var visibilityEvent = visibilityEvent(prefix);
 
document.addEventListener(visibilityEvent, function(event) {
  console.log("visibilityEvent");
  if (!document[hidden]) {
    windowVisible = true ;
  } else {
    windowVisible = false ;
  }
});

document.addEventListener("mousemove", function() {
  d3.select("body").style("cursor", "default");
  mouseMovingFlag = true ;
  resetMouseMoveTimer();
}, true);

document.addEventListener("mousemove", function() {
  if (mouseHoverFlag) {
    d3.select("body").style("cursor", "pointer");
  }
  else {
    d3.select("body").style("cursor", "default");
  }
  mouseMovingFlag = true ;
  resetMouseMoveTimer();
}, true);

var mouseMoveTimeout = setTimeout(function(){
  mouseMovingFlag = false ;
 }, mouseMoveTimeoutInterval);

function resetMouseMoveTimer() {
  clearTimeout(mouseMoveTimeout);
  mouseMoveTimeout = setTimeout(function(){
    mouseMovingFlag = false ;
  }, mouseMoveTimeoutInterval);
}

function showInfo() {
  window.open("http://www.threeCeeMedia.com/", '_blank');
}

function launchSessionView(sessionId) {
  var url = urlRoot + sessionId + "&nsp=" + namespace ;
  console.log("launchSessionView: " + sessionId + " URL: " + url);
  window.open(url, 'SESSION VIEW', '_new');
}

function getTimeStamp(inputTime) {
  var options = {
    weekday: "long", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", hour12: false,  minute: "2-digit"
  };

  var currentDate ;
  var currentTime ;

  if (typeof inputTime === 'undefined') {
    currentDate = new Date().toDateString("en-US", options);
    currentTime = new Date().toTimeString('en-US', options);
  }
  else {
    currentDate = new Date(inputTime).toDateString("en-US", options);
    currentTime = new Date(inputTime).toTimeString('en-US', options);
  }
  return currentDate + " - " + currentTime;
}

function zoom() {
  svgcanvas.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

socket.on('HEARTBEAT', function(heartbeat){
});


socket.on('CONFIG_CHANGE', function(rxConfig){

  console.log("\n-----------------------\nRX CONFIG_CHANGE\n" 
    + JSON.stringify(rxConfig, null, 3) + "\n------------------------\n");
});


var defaultBarOpacity = 0.3 ;

function openSessionView(){
  console.log("openSessionView BUTTON PRESS");
  launchSessionView(socket.id);
}

function resize() {
  if (typeof window.innerWidth != 'undefined') {
    width = window.innerWidth,
    height = window.innerHeight
  }
  // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
  else if (typeof document.documentElement != 'undefined'
   && typeof document.documentElement.clientWidth !=
   'undefined' && document.documentElement.clientWidth != 0) {
     width = document.documentElement.clientWidth,
     height = document.documentElement.clientHeight
  }
  // older versions of IE
  else {
     width = document.getElementsByTagName('body')[0].clientWidth,
     height = document.getElementsByTagName('body')[0].clientHeight
  }

  resizeFlag = true ;
}

function getTimeNow(callback) {
  var nd = new Date();
  callback(nd.getTime());
}

function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement 
      && !document.webkitFullscreenElement 
      && !document.msFullscreenElement ) {  // current working methods

    fullscreenFlag = true ;

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
      resize();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
      resize();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
      resize();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      resize();
    }
  } else {

    fullscreenFlag = false ;

    if (document.exitFullscreen) {
      document.exitFullscreen();
      resize();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      resize();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      resize();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      resize();
    }
  }
}

// Get Browser-Specifc Prefix
function getBrowserPrefix() {
   
  // Check for the unprefixed property.
  if ('hidden' in document) {
    return null;
  }
 
  // All the possible prefixes.
  var browserPrefixes = ['moz', 'ms', 'o', 'webkit'];
 
  for (var i = 0; i < browserPrefixes.length; i++) {
    var prefix = browserPrefixes[i] + 'Hidden';
    if (prefix in document) {
      return browserPrefixes[i];
    }
  }
 
  // The API is not supported in browser.
  return null;
}
 
// Get Browser Specific Hidden Property
function hiddenProperty(prefix) {
  if (prefix) {
    return prefix + 'Hidden';
  } else {
    return 'hidden';
  }
}
 
// Get Browser Specific Visibility State
function visibilityState(prefix) {
  if (prefix) {
    return prefix + 'VisibilityState';
  } else {
    return 'visibilityState';
  }
}
 
// Get Browser Specific Event
function visibilityEvent(prefix) {
  if (prefix) {
    return prefix + 'visibilitychange';
  } else {
    return 'visibilitychange';
  }
}


// ==================
// MAIN INTERVAL LOOP
// ==================

// setInterval(function() {
// }, updateInterval);

window.onload = function () {
  console.log("ONLOAD");

  window.resizeTo(400,600);

  // addControlPanel();

  setSessionMode(sessionMode);

  // if (sessionMode == 'PROMPT') {
  //   addServerPrompt();
  //   addUserResponsePrompt();
  // }
  // else if (sessionMode == 'STREAM') {
  //   addUserResponseStream();
  //   enableUserResponsePrompt();
  // }

  // userObj.userId = socket.id;

  console.log("sessionMode: " + sessionMode);
  console.log("USER\n" + jsonPrint(userObj));

  // socket.emit("USER_READY", userObj);
  // launchSessionView(socket.id);

  setTimeout(function(){
    pageLoadedTimeIntervalFlag = false ;
  }, 5000);
};


