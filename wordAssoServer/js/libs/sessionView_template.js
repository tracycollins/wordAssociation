/*jslint node: false */
"use strict";

function View() {

  console.log("@@@@@@@ CLIENT @@@@@@@@");

  var getWindowDimensions = function (){

    if (window.innerWidth !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    
    if (document.documentElement !== "undefined" 
      && document.documentElement.clientWidth !== "undefined" 
      && document.documentElement.clientWidth !== 0) {
      return { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    }
    // older versions of IE
    return { width: document.getElementsByTagName("body")[0].clientWidth, height: document.getElementsByTagName("body")[0].clientHeight };
  };

  var width = getWindowDimensions().width;
  var height = getWindowDimensions().height;

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      return JSON.stringify(obj, null, 2);
    } else {
      return "UNDEFINED";
    }
  }

  var palette = {
    "black": "#000000",
    "white": "#FFFFFF",
    "lightgray": "#AAAAAA",
    "gray": "#888888",
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
    "blue": "#4808FF",
    "green": "#00E540",
    "darkergreen": "#008200",
    "lightgreen": "#35A296",
    "yellowgreen": "#738A05"
  };

  var mouseMovingFlag = false;

  var self = this;

  var testMode = false;

  var runningFlag = false;
  
  self.sessionKeepalive = function() {
    return null;
  };

  self.getWidth = function() { return width; };

  self.getHeight = function() { return height; };

  var mouseHoverFlag = false;

  var nodeMaxAge = 60000;

  var nodeAddQ = [];

  var DEFAULT_CONFIG = { testMode: testMode };

  document.addEventListener("mousemove", function mousemoveFunc() {

  }, true);

  this.addNode = function(n) {
    if (nodeAddQ.length < MAX_RX_QUEUE) { nodeAddQ.push(n); }
  };

  this.setTestMode = function(flag){
    testMode = flag;
    console.debug("SET TEST MODE: " + testMode);
  };

  self.setParam = function(param, value) {
    console.log("updateParam: " + param + " = " + value);
    return;
  };

  self.mouseMoving = function(isMoving) {
    if (isMoving && !mouseMovingFlag) {
      mouseMovingFlag = isMoving;
      updateNodeLabels();
    }
    else { 
      mouseMovingFlag = isMoving;
    }
  };

  this.resize = function() {

    width = getWindowDimensions().width;
    height = getWindowDimensions().height;

  };

  // ==========================================

  document.addEventListener("resize", function resizeFunc() { self.resize(); }, true);

  self.reset = function() {
    console.info("RESET");
    mouseHoverFlag = false;
    self.resize();
  };

}
