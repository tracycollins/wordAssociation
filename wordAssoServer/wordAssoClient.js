/*jslint node: true */
"use strict";

var configHashMap = new HashMap();
configHashMap.set('testMode', false);

var debug = false ;
var testMode = false ;
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

var socket = io();
var socketId ;
var connectedFlag = false ;

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

function getUrlVariables(config){
  var searchString = window.location.search.substring(1);
  var variableArray = searchString.split('&');

  for(var i = 0; i < variableArray.length; i++){
    var keyValuePair = variableArray[i].split('=');
    if (typeof keyValuePair[1] !== 'undefined'){
      configHashMap.set(keyValuePair[0], keyValuePair[1]) ;
      console.log("'" + variableArray[i] + "' >>> URL config: " + keyValuePair[0] + " : " + configHashMap.get(keyValuePair[0]));      
    } 
    else {
      console.log("NO URL VARIABLES");      
    }
  }
}

var clientConfig = { user: "UNDEFINED", type: "STANDARD", mode: "WORD_OBJ"} ;


function sendUserResponse(){
  var userResponseValue = document.getElementById("userResponse").value.trim() ;
  userResponseValue = userResponseValue.toLowerCase();

  if (userResponseValue == '') {
    console.warn("NO INPUT WORD");
    var wordInText = document.getElementById("wordInText");
    console.log("wordInText: " + wordInText.value);
    wordInText.value = "";
    return ;
  }
  console.log("TX WORD: " + userResponseValue);
  socket.emit("RESPONSE_WORD_OBJ", {nodeId: userResponseValue});
  var wordInText = document.getElementById("userResponse");
  console.log("wordInText: " + wordInText.value);
  wordInText.value = "";
}

var userResponseValue = "";

function addUserResponse() {
  var userResponseInput = document.createElement("input");
  var userResponseLabel = document.createElement("label");

  userResponseLabel.innerHTML = "YOU RESPOND: ";   

  userResponseInput.setAttribute("class", "userResponse");
  userResponseInput.setAttribute("type", "text");
  userResponseInput.setAttribute("id", "userResponse");
  userResponseInput.setAttribute("name", "userResponse");
  userResponseInput.setAttribute("autofocus", true);
  userResponseInput.setAttribute("autocapitalize", "none");
  userResponseInput.setAttribute("value", userResponseValue);
  userResponseInput.setAttribute("onkeydown", "if (event.keyCode == 13) { return sendUserResponse() }");

  var userResponseDiv = document.getElementById("userResponseDiv");
  userResponseDiv.appendChild(userResponseLabel);
  userResponseDiv.appendChild(userResponseInput);
}

function addServerPrompt() {
  var serverPromptOutput = document.createElement("output"); 
  var serverPromptLabel = document.createElement("label");

  serverPromptLabel.innerHTML = "SERVER SAYS: ";   

  serverPromptOutput.setAttribute("class", "serverPrompt");
  serverPromptOutput.setAttribute("type", "text");
  serverPromptOutput.setAttribute("id", "serverPrompt");
  serverPromptOutput.setAttribute("name", "serverPrompt");
  serverPromptOutput.setAttribute("value", "");
  serverPromptOutput.innerHTML = "";   

  var serverPromptDiv = document.getElementById("serverPromptDiv");
  serverPromptDiv.appendChild(serverPromptLabel);
  serverPromptDiv.appendChild(serverPromptOutput);
}

function updateServerPrompt(prompt){
  if (debug) console.log("updateServerPrompt: " + prompt);
  var serverPromptOutputText = document.getElementById("serverPrompt");
  serverPromptOutputText.innerHTML = prompt;
}

socket.on("PROMPT_WORD", function(promptWord){
  console.log("RX PROMPT_WORD: " + promptWord);
  updateServerPrompt(promptWord);
});

socket.on("PROMPT_WORD_OBJ", function(promptWordObj){
  console.log("RX PROMPT_WORD_OBJ: " + promptWordObj.nodeId + " | BHT FOUND: " + promptWordObj.bhtFound);
  updateServerPrompt(promptWordObj.nodeId);
});

socket.on('connect', function(){
  socketId = socket.id ;
  console.log(">>> CONNECTED TO HOST | SOCKET ID: " + socketId);
  connectedFlag = true ;
  clientConfig.user = "USER_" + socket.id ;
  getUrlVariables();
});

socket.on('reconnect', function(){
  socketId = socket.id ;
  console.log(">-> RECONNECTED TO HOST | SOCKET ID: " + socketId);
  connectedFlag = true ;
  getUrlVariables();
  clientConfig.user = "USER_" + socket.id ;
  socket.emit("CLIENT_READY", clientConfig);
});

socket.on('disconnect', function(){
  console.log("*** DISCONNECTED FROM HOST | SOCKET ID: " + socketId);
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

window.onload = function () {
  console.log("ONLOAD");

  addServerPrompt();
  addUserResponse();
  socket.emit("CLIENT_READY", clientConfig);

  setTimeout(function(){
    pageLoadedTimeIntervalFlag = false ;
  }, 5000);
};


socket.on('HEARTBEAT', function(heartbeat){
});


socket.on('CONFIG_CHANGE', function(rxConfig){

  console.log("\n-----------------------\nRX CONFIG_CHANGE\n" 
    + JSON.stringify(rxConfig, null, 3) + "\n------------------------\n");
});


var defaultBarOpacity = 0.3 ;


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

setInterval(function() {
}, updateInterval);

