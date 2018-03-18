/*jslint node: false */

function ViewTreepack() {

  "use strict";

  var MIN_RATE = 2.5;
  var MIN_FOLLOWERS = 50000;
  var MIN_MENTIONS = 10000;
  var MIN_FOLLOWERS_AGE_RATE_RATIO = 0.9;  // age users with many followers at a slower rate

  var mouseMovingFlag = false;

  var currentTwitterUser = twitterUserThreecee;
  var currentTwitterHashtag = "resist";

  var defaultProfileImageUrl = "favicon.png";

  var self = this;
  var simulation;

  var enableAgeNodes = true;
  var newCurrentMaxMetricFlag = true;

  var resumeTimeStamp = 0;
  var compactDateTimeFormat = "YYYYMMDD HHmmss";

  // var nodeRadiusMinRatio = 0.0075;
  // var nodeRadiusMaxRatio = 0.10;

  var sliderPercision = 5;

  var maxRateMentionsTopMargin = 2; // %
  var maxRateMentionsLeftMargin = 2; // %
  var hashtagTopMargin = 7; // %
  var hashtagLeftMargin = 2; // %
  var mentionsNumChars = 9;
  var rateNumChars = 8;

  var maxHashtagRows = 100;
  var maxHashtagCols = 5;

  // FORCE X & Y
  var xFocusLeftRatio = 0.3;
  var yFocusLeftRatio = 0.5;

  var xFocusRightRatio = 0.7;
  var yFocusRightRatio = 0.5;

  var xFocusPositiveRatio = 0.5;
  var yFocusPositiveRatio = 0.3;

  var yFocusNegativeRatio = 0.7;

  var xFocusNeutralRatio = 0.5;
  var yFocusNeutralRatio = 0.5;

  var xFocusDefaultRatio = 0.5;
  var yFocusDefaultRatio = 0.5;

  // INITIAL POSITION
  var xMinRatioLeft = 0.10;
  var xMaxRatioLeft = 0.35;

  var yMinRatioLeft = 0.75;
  var yMaxRatioLeft = 0.80;

  var xMinRatioRight = 0.65;
  var xMaxRatioRight = 0.90;

  var yMinRatioRight = 0.75;
  var yMaxRatioRight = 0.80;

  var xMinRatioPositive = 0.45;
  var xMaxRatioPositive = 0.55;

  var yMinRatioPositive = 0.65;
  var yMaxRatioPositive = 0.75;

  var xMinRatioNegative = 0.55;
  var xMaxRatioNegative = 0.65;

  var yMinRatioNegative = 0.65;
  var yMaxRatioNegative = 0.75;

  var xMinRatioNeutral = 0.45;
  var xMaxRatioNeutral = 0.55;

  var yMinRatioNeutral = 0.65;
  var yMaxRatioNeutral = 0.75;


  var nodes = [];
  var nodesTopTerm = [];

  var currentMaxMetric = 2;

  var currentMax = {};

  currentMax.rate = {};
  currentMax.rate.nodeId = "what";
  currentMax.rate.nodeType = "hashtag";
  currentMax.rate.value = 0.1;
  currentMax.rate.timeStamp = moment().valueOf();

  currentMax.mentions = {};
  currentMax.mentions.nodeId = "what";
  currentMax.mentions.nodeType = "hashtag";
  currentMax.mentions.value = 0.1;
  currentMax.mentions.timeStamp = moment().valueOf();

  var deadNodesHash = {};

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
    }
  }


  var getWindowDimensions = function (){

    var w;
    var h;

    if (window.innerWidth !== "undefined") {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    else if (document.documentElement !== "undefined" 
      && document.documentElement.clientWidth !== "undefined" 
      && document.documentElement.clientWidth !== 0) {
      w = document.documentElement.clientWidth;
      h = document.documentElement.clientHeight;
    }
    // older versions of IE
    else {
      w = document.getElementsByTagName("body")[0].clientWidth;
      h = document.getElementsByTagName("body")[0].clientHeight;
    }

    return { width: w, height: h };
  };

  var width = getWindowDimensions().width;
  var height = getWindowDimensions().height;

  // var nodeRadiusMin = nodeRadiusMinRatio * width;
  // var nodeRadiusMax = nodeRadiusMaxRatio * height;

  var autoKeywordsFlag = config.autoKeywordsFlag;

  var metricMode = config.defaultMetricMode;
  var transitionDuration = config.defaultTransitionDuration;
  var blahMode = config.defaultBlahMode;
  var charge = config.defaultCharge;
  var gravity = config.defaultGravity;
  var forceXmultiplier = config.defaultForceXmultiplier;
  var forceYmultiplier = config.defaultForceYmultiplier;
  var collisionRadiusMultiplier = 1.1;
  var collisionIterations = config.defaultCollisionIterations;
  var velocityDecay = config.defaultVelocityDecay;
  var fontSizeMinRatio = config.defaultFontSizeMinRatio;
  var fontSizeMaxRatio = config.defaultFontSizeMaxRatio;
  var fontSizeTopTermRatio = config.defaultFontSizeTopTermRatio;
  var fontSizeMin = config.defaultFontSizeMinRatio * height;
  var fontSizeMax = config.defaultFontSizeMaxRatio * height;

  var nodeRadiusMinRatio = config.defaultNodeRadiusMinRatio;
  var nodeRadiusMaxRatio = config.defaultNodeRadiusMaxRatio;
  var nodeRadiusMin = config.defaultNodeRadiusMinRatio * width;
  var nodeRadiusMax = config.defaultNodeRadiusMaxRatio * width;

  var rowSpacing = fontSizeTopTermRatio*110; // %
  var colSpacing = 90/maxHashtagCols; // %

  var maxRateMentions = {};
  maxRateMentions.rateNodeType = "hashtag";
  maxRateMentions.mentionsNodeType = "hashtag";
  maxRateMentions.isMaxNode = true;
  maxRateMentions.metricMode = metricMode;

  if (metricMode === "rate") {
    maxRateMentions.nodeId = "RATE | MAX";
  }
  if (metricMode === "mentions") {
    maxRateMentions.nodeId = "MNTN | MAX";
  }
  // maxRateMentions.age = 0;
  maxRateMentions.rate = 2;
  maxRateMentions.rateNodeId = "what";
  maxRateMentions.mentionsNodeId = "what";
  maxRateMentions.rateTimeStamp = moment().valueOf();
  maxRateMentions.mentionsTimeStamp = moment().valueOf();
  maxRateMentions.mentions = 2;
  maxRateMentions.ageMaxRatio = 0;
  maxRateMentions.isTrendingTopic = true;
  maxRateMentions.displaytext = "WHAT?";
  maxRateMentions.mouseHoverFlag = false;
  maxRateMentions.x = 100;
  maxRateMentions.y = 100;

  console.warn("TREEPACK CONFIG\n" + jsonPrint(config));

  var testMode = false;
  var freezeFlag = false;

  var MAX_NODES = 100;

  var NEW_NODE_AGE_RATIO = 0.01;

  var foci = {
    left: {x: xFocusLeftRatio*width, y: yFocusLeftRatio*height}, 
    right: {x: xFocusRightRatio*width, y: yFocusRightRatio*height}, 
    positive: {x: xFocusPositiveRatio*width, y: yFocusPositiveRatio*height}, 
    negative: {x: xFocusNeutralRatio*width, y: yFocusNegativeRatio*height},
    neutral: {x: xFocusNeutralRatio*width, y: yFocusNeutralRatio*height},
    default: {x: xFocusDefaultRatio*width, y: yFocusDefaultRatio*height}
  };

  var minOpacity = 0.1;
  var antonymFlag = false;
  var removeDeadNodesFlag = true;

  var DEFAULT_AGE_RATE = 1.0;
  var MAX_RX_QUEUE = 100;

  var nodesTopTermHashMap = new HashMap();

  var localNodeHashMap = {};
  var maxNodeAddQ = 0;
  var maxNumberNodes = 0;

  var runningFlag = false;
  
  var nodeAddQ = [];
  var nodeDeleteQ = [];

  self.sessionKeepalive = function() {
    return null;
  };

  self.mouseMoving = function(isMoving) {
    if (isMoving && !mouseMovingFlag) {
      mouseMovingFlag = isMoving;
      updateNodeLabels(function(){});
    }
    else {
      mouseMovingFlag = isMoving;
    }
  };

  self.getWidth = function() {
    return width;
  };

  self.getHeight = function() {
    return height;
  };

  self.getSortedKeys = function(hmap, sortProperty) {
    var keys = [];
    hmap.forEach(function(value, key) {
      if (!value.isSessionNode) {
        keys.push(key);
      }
    });
    return keys.sort(function(a, b) {
      return hmap.get(b)[sortProperty] - hmap.get(a)[sortProperty];
    });
  };

  var mouseHoverFlag = false;

  var nodeMaxAge = 60000;

  var DEFAULT_TREEMAP_CONFIG = {
    "ageRate": DEFAULT_AGE_RATE
  };

  var ageRate = DEFAULT_TREEMAP_CONFIG.ageRate;
  var maxAgeRate = 0;

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
    "blue": "#4808FF",
    "green": "#00E540",
    "darkergreen": "#008200",
    "lightgreen":  "#35A296",
    "yellowgreen": "#738A05"
  };

  var keywordsMatchColor = palette.green;
  var keywordsMatchStrokeWidth = "4.0";
  var keywordsMismatchStrokeWidth = "4.0";
  var keywordsAutoStrokeWidth = "3.0";


  var divTooltip = d3.select("body").append("div")
    .attr("id", "divTooltip")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

  var topTermsDiv = d3.select("#topTermsDiv");

  var topTermsCheckBox = topTermsDiv.append("input")
    .attr("id", "topTermsCheckBox")
    .attr("type", "checkbox")
    // .attr("checked", false)
    .style("pointer-events", "auto")
    // .style("visibility", "visible")
    .on("change", function(){
      if (topTermsCheckBox.property("checked") === false) { 
        topTermsDiv.style("visibility", "hidden"); 
        // nodeTopTermLabelSvgGroup.style("visibility", "hidden");
      }
      else {
        topTermsDiv.style("visibility", "visible"); 
        // nodeTopTermLabelSvgGroup.style("visibility", "visible");
      }
    });

  var mouseMoveTimeoutEventHandler = function(e) {

    d3.selectAll("iframe").style("visibility", "hidden");

    if (topTermsCheckBox.property("checked") === false) { 
      topTermsDiv.style("visibility", "hidden"); 
      // nodeTopTermLabelSvgGroup.style("visibility", "hidden");
    }
    else {
      topTermsDiv.style("visibility", "visible"); 
      // nodeTopTermLabelSvgGroup.style("visibility", "visible");
    }
  };


  document.addEventListener("mouseMoveTimeoutEvent", mouseMoveTimeoutEventHandler);

  document.addEventListener("mousemove", function() {

    topTermsDiv.style("visibility", "visible");
    // nodeTopTermLabelSvgGroup.style("visibility", "visible");

    if (mouseHoverFlag) {
      d3.select("body").style("cursor", "pointer");
    } else {
      d3.select("body").style("cursor", "default");
    }

  }, true);

  var defaultRadiusScale = d3.scaleLinear()
    .domain([0.1, Math.sqrt(currentMaxMetric)])
    .range([nodeRadiusMin, nodeRadiusMax])
    .clamp(true);

  var nodeLabelSizeScale = d3.scaleLinear()
    .domain([1, currentMaxMetric])
    .range([fontSizeMin, fontSizeMax])
    .clamp(true);
    
  var topTermLabelOpacityScale = d3.scaleLinear()
    .domain([1e-6, 1.0])
    .range([1.0, minOpacity])
    .clamp(true);
    
  var nodeLabelOpacityScale = d3.scaleLinear()
    .domain([1e-6, 0.1, 1.0])
    .range([1.0, 0.5, minOpacity])
    .clamp(true);
    
  var adjustedAgeRateScale = d3.scaleLinear()
    .domain([1, MAX_NODES])
    .range([1.0, 10.0]);

  var fontTopTerm = config.defaultFontSizeTopTermRatio * topTermsDiv.height;

  var d3image = d3.select("#d3group");

  var svgMain = d3image.append("svg:svg")
    .attr("id", "svgMain")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var svgTreemapLayoutArea = svgMain.append("g")
    .attr("id", "svgTreemapLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var svgTopTermLayoutArea = svgMain.append("g")
    .attr("id", "svgTopTermLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var panzoomElement = document.getElementById("svgTreemapLayoutArea");
  panzoom(panzoomElement, { zoomSpeed: 0.030 });

  var svgTopTerms = topTermsDiv.append("svg:svg")
    .attr("id", "svgTopTerms")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var maxRateMentionsSvgGroup = svgTopTerms.append("svg:g")
    .attr("id", "maxRateMentionsSvgGroup")
    .attr("width", width)
    .attr("height", height)
    .style("zIndex", 100)
    .style("opacity", 1.0);

  var maxRateMentionsText = maxRateMentionsSvgGroup.append("text")
    .attr("id", "maxRateMentionsText")
    .attr("x", maxRateMentionsLeftMargin + "%")
    .attr("y", maxRateMentionsTopMargin + "%")
    .text("MAX MENTIONS: 0")
    .style("font-family", "monospace")
    .style("font-size", fontTopTerm)
    .style("fill", palette.white)
    // .style("stroke", palette.white)
    .style("opacity", 1.0)
    .style("text-anchor", "right")
    .style("alignment-baseline", "top");

  var nodeTopTermLabelSvgGroup = svgTopTerms.append("svg:g")
    .attr("id", "nodeTopTermLabelSvgGroup")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);
    // .attr("visibility", "hidden");


  var nodeSvgGroup = svgTreemapLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgTreemapLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

  console.log("@@@@@@@ CLIENT @@@@@@@@");

  var randomIntFromInterval = function(min, max) {
    var random = Math.random();
    var randomInt = Math.floor((random * (max - min + 1)) + min);
    if (Number.isNaN(randomInt)) {
      console.error("randomIntFromInterval NaN"
        + " | MIN: " + min
        + " | MAX: " + max
      );
    }
    return randomInt;
  };

  d3.select("body").style("cursor", "default");
  
  self.setEnableAgeNodes = function(enabled) {
    enableAgeNodes = enabled;
    config.enableAgeNodes = enabled;
  };
  
  this.deleteNode = function() {
    return null;
  };
  
  this.getNodesLength = function() { return nodes.length; };
  
  this.getMaxNodes = function() { return maxNumberNodes; };
  
  this.getNodeAddQlength = function() { return nodeAddQ.length; };
  
  this.getMaxNodeAddQ = function() { return maxNodeAddQ; };
    
  this.getAgeRate = function() { return ageRate; };
  
  this.setNodeMaxAge = function(mAge) {
    nodeMaxAge = mAge;
    config.defaultMaxAge = mAge;
    console.debug("SET NODE MAX AGE: " + nodeMaxAge);
  };

  this.getMaxAgeRate = function() { return maxAgeRate; };
  
  this.setAntonym = function(flag) {
    antonymFlag = flag;
    console.debug("SET ANTONYM: " + antonymFlag);
  };

  this.setTwitterUser = function(user) {

    if (user.notFound !== undefined) {
      console.log("setTwitterUser | NOT FOUND: @"  + user.screenName);
    }
    else {
      console.log("setTwitterUser | "  + user.userId + " | @" + user.screenName);
    }


    if (user.userId === twitterUserThreecee.userId) {
      twitterUserThreecee = user;
    }
    
    if (controlPanelReadyFlag){
      controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: user}, DEFAULT_SOURCE);
    }
  };

  this.setTwitterHashtag = function(hashtag) {
    console.log("setTwitterHashtag | HTID: "  + hashtag.hashtagId + " | #" + hashtag.text);
    
    if (controlPanelReadyFlag){
      controlPanelWindow.postMessage({op: "SET_TWITTER_HASHTAG", hashtag: hashtag}, DEFAULT_SOURCE);
    }
  };

  this.setMetricMode = function(mode) {

    config.defaultMetricMode = mode;
    metricMode = mode;

    if (mode === "rate") {
      currentMaxMetric = currentMax.rate.value;
    }
    else if (mode === "mentions") {
      currentMaxMetric = currentMax.mentions.value;
    }

    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMaxMetric])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);

    defaultRadiusScale = d3.scaleLinear()
      .domain([0.1, Math.sqrt(currentMaxMetric)])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);

    console.debug("SET METRIC MODE: " + metricMode);
  };

  this.setBlah = function(flag) {
    blahMode = flag;
    console.debug("SET BLAH: " + blahMode);
  };

  this.setAutoKeywordsFlag = function(flag) {
    autoKeywordsFlag = flag;
    console.debug("SET AUTO KEYWORDS: " + autoKeywordsFlag);
  };

  this.setRemoveDeadNodesFlag = function(flag) {
    removeDeadNodesFlag = flag;
    console.debug("SET REMOVE DEAD NODES: " + removeDeadNodesFlag);
  };

  this.setTestMode = function(flag){
    testMode = flag;
    console.debug("SET TEST MODE: " + testMode);
  };

  self.toolTipVisibility = function(isVisible){
    if (isVisible) {
      divTooltip.style("visibility", "visible");
    }
    else {
      divTooltip.style("visibility", "hidden");
    }
  };

  self.deleteSessionLinks = function(){ console.debug("DELETE LINKS"); };

  self.setPause = function(value){
    console.debug("SET PAUSE: " + value);
    runningFlag = !value;
    if (value){
      self.simulationControl("PAUSE");
    }
    else{
      self.simulationControl("RESUME");
    }
  };

  self.togglePause = function(){
    if (runningFlag){
      self.simulationControl("PAUSE");
    }
    else{
      self.simulationControl("RESUME");
    }
  };

  self.updateParam = function(param, value) {
    console.log("updateParam: " + param + " = " + value);
    return;
  };

  self.updateVelocityDecay = function(value) {
    console.debug("UPDATE VEL DECAY: " + value.toFixed(sliderPercision));
    config.defaultVelocityDecay = value;
    velocityDecay = value;
    simulation.velocityDecay(velocityDecay);
  };

  self.updateGravity = function(value) {
    console.debug("UPDATE GRAVITY: " + value.toFixed(5));
    config.defaultGravity = value;
    gravity = value;

    simulation
      .force("forceX", d3.forceX().x(function(d) { 
        if (d.isKeyword){

          var keywords = {};
          if (autoKeywordsFlag 
            && (d.keywordsAuto !== undefined) 
            && d.keywordsAuto
            && (Object.keys(d.keywordsAuto).length > 0)
            ){
            keywords = d.keywordsAuto;
          }
          else if ((d.keywordsAuto !== undefined) 
            && d.keywordsAuto
            && (!d.keywords || (d.keywords === undefined))){
            keywords = d.keywordsAuto;
          }
          else {
            keywords = d.keywords;
          }

          if (keywords.right !== undefined) {
            return foci.right.x;
          }
          if (keywords.left !== undefined) {
            return foci.left.x;
          }
          if (keywords.positive !== undefined) {
            return foci.positive.x;
          }
          if (keywords.negative !== undefined) {
            return foci.negative.x;
          }
          if (keywords.neutral !== undefined) {
            return foci.neutral.x;
          }
        }
        else {
          return foci.default.x;
        }
      }).strength(function(d){
        return forceXmultiplier * gravity; 
      }))
      .force("forceY", d3.forceY().y(function(d) { 
        if (d.isKeyword){

          var keywords = {};
          if (autoKeywordsFlag 
            && (d.keywordsAuto !== undefined) 
            && d.keywordsAuto
            && (Object.keys(d.keywordsAuto).length > 0)
            ){
            keywords = d.keywordsAuto;
          }
          else if ((d.keywordsAuto !== undefined) 
            && d.keywordsAuto
            && (!d.keywords || (d.keywords === undefined))){
            keywords = d.keywordsAuto;
          }
          else {
            keywords = d.keywords;
          }

          if (keywords.right !== undefined) {
            return foci.right.y;
          }
          if (keywords.left !== undefined) {
            return foci.left.y;
          }
          if (keywords.positive !== undefined) {
            return foci.positive.y;
          }
          if (keywords.negative !== undefined) {
            return foci.negative.y;
          }
          if (keywords.neutral !== undefined) {
            return foci.neutral.y;
          }
        }
        else {
          return foci.default.y;
        }
      }).strength(function(d){
        return forceYmultiplier * gravity; 
      }));
  };

  self.updateTransitionDuration = function(value) {
    console.debug("UPDATE TRANSITION DURATION: " + value);
    transitionDuration = value;
    config.defaultTransitionDuration = value;
  };

  self.updateCharge = function(value) {
    console.debug("UPDATE CHARGE: " + value);
    config.defaultCharge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  self.updateNodeRadiusMinRatio = function(value) {
    console.debug("UPDATE NODE RADIUS MIN RATIO: " + value);
    config.defaultNodeRadiusMinRatio = value;
    nodeRadiusMinRatio = value;
    nodeRadiusMin = value * width;
    defaultRadiusScale = d3.scaleLinear()
      .domain([0.1, Math.sqrt(currentMaxMetric)])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
  };

  self.updateNodeRadiusMaxRatio = function(value) {
    console.debug("UPDATE NODE RADIUS MAX RATIO: " + value);
    config.defaultNodeRadiusMaxRatio = value;
    nodeRadiusMaxRatio = value;
    nodeRadiusMax = value * width;
    defaultRadiusScale = d3.scaleLinear()
      .domain([0.1, Math.sqrt(currentMaxMetric)])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
  };

  self.updateFontSizeMinRatio = function(value) {
    console.debug("UPDATE FONT MIN SIZE: " + value);
    config.defaultFontSizeMinRatio = value;
    fontSizeMinRatio = value;
    fontSizeMin = value * height;
    // rowSpacing = value * 110; // %
    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMaxMetric])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);
  };

  self.updateFontSizeMaxRatio = function(value) {
    console.debug("UPDATE FONT MAX SIZE: " + value);
    config.defaultFontSizeMaxRatio = value;
    fontSizeMaxRatio = value;
    fontSizeMax = value * height;
    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMaxMetric])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);
  };

  self.resetDefaultForce = function() {
    console.warn("RESET TREEPACK DEFAULT FORCE");
    self.updateTransitionDuration(config.defaultTransitionDuration);
    self.setNodeMaxAge(config.defaultMaxAge);
    self.updateCharge(config.defaultCharge);
    self.updateVelocityDecay(config.defaultVelocityDecay);
    self.updateGravity(config.defaultGravity);
  };

  var ageNodes = function (callback) {

    var age;
    var ageMaxRatio = 1e-6;
    var deadNodeFlag = false ;
    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var node;
    // var nodeObj;

    if (nodes.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    } 
    else if ((nodes.length > MAX_NODES) && (nodeAddQ.length <= MAX_RX_QUEUE)) {
      ageRate = adjustedAgeRateScale(nodes.length - MAX_NODES);
    } 
    else if (nodeAddQ.length > MAX_RX_QUEUE) {
      ageRate = adjustedAgeRateScale(nodeAddQ.length - MAX_RX_QUEUE);
    } 
    else {
      ageRate = DEFAULT_AGE_RATE;
    }

    maxAgeRate = Math.max(ageRate, maxAgeRate);

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {

      node = nodes[ageNodesIndex];

      if (!enableAgeNodes || (resumeTimeStamp > 0)) {
        ageRate = 0;
      }

      if ((node.nodeType === "user") && (node.followersCount > MIN_FOLLOWERS)){
        age = node.age + (ageRate * MIN_FOLLOWERS_AGE_RATE_RATIO * (moment().valueOf() - node.ageUpdated));
      }
      else {
        age = node.age + (ageRate * (moment().valueOf() - node.ageUpdated));
      }

      ageMaxRatio = age/nodeMaxAge ;

      if (node.isDead 
        || (removeDeadNodesFlag && (age >= nodeMaxAge))
        ) {

        delete localNodeHashMap[node.nodeId];

        nodesTopTermHashMap.remove(node.nodeId);

        nodes.splice(ageNodesIndex, 1);
        // console.debug("X NODE"
        //   + " | NODES: " + nodes.length
        //   + " | " + node.nodeType
        //   + " | " + node.nodeId
        // );
      } 
      else {
        node.ageUpdated = moment().valueOf();
        node.age = age;
        if (ageMaxRatio < NEW_NODE_AGE_RATIO) { 
          node.newFlag = true; 
        }
        else {
          node.newFlag = false; 
        }
        node.ageMaxRatio = ageMaxRatio;
        node.isDead = false;

        node.isTopTerm = localNodeHashMap[node.nodeId].isTopTerm;
        node.isKeyword = localNodeHashMap[node.nodeId].isKeyword;
        node.keywordColor = localNodeHashMap[node.nodeId].keywordColor;
        node.isTrendingTopic = localNodeHashMap[node.nodeId].isTrendingTopic;
        node.keywords = localNodeHashMap[node.nodeId].keywords;
        node.keywordsAuto = localNodeHashMap[node.nodeId].keywordsAuto;

        nodes[ageNodesIndex] = node;

        localNodeHashMap[node.nodeId] = node;

        if (node.isTopTerm) {
          nodesTopTermHashMap.set(node.nodeId, node);
        }
        else {
          nodesTopTermHashMap.remove(node.nodeId);
        }
      }
    }

    if (ageNodesIndex < 0) {

      resumeTimeStamp = 0;

      // maxRateMentions.age = 0;
      // maxRateMentions.rank = 0;
      // maxRateMentions.isDead = false;
      maxRateMentions.metricMode = metricMode;
      
      maxRateMentions.rateNodeType = currentMax.rate.nodeType;
      maxRateMentions.rate = currentMax.rate.value;
      maxRateMentions.rateNodeId = currentMax.rate.nodeId;
      maxRateMentions.rateTimeStamp = currentMax.rate.timeStamp;

      maxRateMentions.mentionsNodeType = currentMax.mentions.nodeType;
      maxRateMentions.mentions = currentMax.mentions.value;
      maxRateMentions.mentionsNodeId = currentMax.mentions.nodeId;
      maxRateMentions.mentionsTimeStamp = currentMax.mentions.timeStamp;

      // maxRateMentions.ageMaxRatio = 0;
      maxRateMentions.isTrendingTopic = true;
      maxRateMentions.displaytext = createDisplayText(maxRateMentions);
      // maxRateMentions.mouseHoverFlag = false;

      if (metricMode === "rate") {
        maxRateMentions.nodeId = "RATE | MAX" ;
      }
      if (metricMode === "mentions") {
        maxRateMentions.nodeId = "MNTN | MAX" ;
      }

      maxRateMentionsText.text(maxRateMentions.displaytext);

      // nodesTopTermHashMap.set(maxRateMentions.nodeId, maxRateMentions);

      rankHashMapByValue(nodesTopTermHashMap, metricMode, function(){
        nodesTopTerm = nodesTopTermHashMap.values();
        callback(null, deadNodeFlag);
      });
    }
  };

  var processDeadNodesHash = function (callback) {

    var deadNodeFlag = false;

    if (Object.keys(deadNodesHash).length === 0) {
      return (callback(null, deadNodeFlag));
    }

    var deadNodeIds = Object.keys(deadNodesHash);

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var node;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {
      node = nodes[ageNodesIndex];
      if (deadNodesHash[node.nodeId]) {
        nodeDeleteQ.push({op:"delete", nodeId: node.nodeId});
        deadNodeFlag = true;
        delete deadNodesHash[node.nodeId];
        delete localNodeHashMap[node.nodeId];
        nodesTopTermHashMap.remove(node.nodeId);
      }
      deadNodeIds = Object.keys(deadNodesHash);
    }

    if ((nodes.length === 0) || (deadNodeIds.length === 0) || (ageNodesIndex < 0)) {
      return (callback(null, deadNodeFlag));
    }
  };

  var previousTwitterUserId;
  var previousTwitterHashtag;

  var nodeMouseOver = function (d) {

    d.mouseHoverFlag = true;

    if (mouseMovingFlag) {
      self.toolTipVisibility(true);
    }
    else {
      self.toolTipVisibility(false);
    }

    d3.select(this).style("opacity", 1);

    var tooltipString;

    switch (d.nodeType) {

      case "user":

        currentTwitterUser = d;

        if (mouseMovingFlag && controlPanelReadyFlag && (!previousTwitterUserId || (previousTwitterUserId !== d.userId))){
          controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: currentTwitterUser}, DEFAULT_SOURCE);
          previousTwitterUserId = currentTwitterUser.userId;
        }

        tooltipString = "@" + d.screenName
          + "<br>" + d.name 
          + "<br>FLWRs: " + d.followersCount
          + "<br>FRNDs: " + d.friendsCount
          + "<br>FMs: " + d.followersMentions
          + "<br>Ms: " + d.mentions
          + "<br>Ts: " + d.statusesCount
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>KWs: " + jsonPrint(d.keywords)
          + "<br>AKWs: " + jsonPrint(d.keywordsAuto);
      break;

      case "hashtag":

        currentTwitterHashtag = d;

        if (mouseMovingFlag && controlPanelReadyFlag && (!previousTwitterHashtag || (previousTwitterHashtag !== d.nodeId))){
          controlPanelWindow.postMessage({op: "SET_TWITTER_HASHTAG", hashtag: currentTwitterHashtag}, DEFAULT_SOURCE);
          previousTwitterHashtag = currentTwitterHashtag.nodeId;
        }

        tooltipString = "#" + d.nodeId
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>KWs: " + jsonPrint(d.keywords)
          + "<br>AKWs: " + jsonPrint(d.keywordsAuto);
      break;
      case "word":
        tooltipString = d.nodeId
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>KWs: " + jsonPrint(d.keywords)
          + "<br>AKWs: " + jsonPrint(d.keywordsAuto);
      break;
      case "place":
        tooltipString = d.fullName
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>KWs: " + jsonPrint(d.keywords)
          + "<br>AKWs: " + jsonPrint(d.keywordsAuto);
      break;
    }

    divTooltip.html(tooltipString);
    divTooltip
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");
  };

  function nodeMouseOut(d) {
    d.mouseHoverFlag = false;
    self.toolTipVisibility(false);
    d3.select(this).style("opacity", function(){
        if (d.isTopTerm) { return topTermLabelOpacityScale(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio);
      });
  }

  function nodeClick(d) {
    var url = "";

    switch (d.nodeType) {

      case "user" :

        currentTwitterUser = d;
        
        if (mouseMovingFlag && controlPanelReadyFlag && (!previousTwitterUserId || (previousTwitterUserId !== d.userId))){
          controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: currentTwitterUser}, DEFAULT_SOURCE);
          previousTwitterUserId = currentTwitterUser.userId;
        }

        if ((d.lastTweetId !== undefined) && d.lastTweetId) {
          // url = "https://twitter.com/" + d.screenName + "/status/" + d.lastTweetId ;
          url = d.lastTweetId ;
        }
        else {
          url = "https://twitter.com/" + d.screenName ;
        }

        console.debug("LOADING TWITTER USER: " + url);
        window.open(url, "_blank");
      break;

      case "hashtag" :

        currentTwitterHashtag = d;

        if (mouseMovingFlag && controlPanelReadyFlag && (!previousTwitterHashtag || (previousTwitterHashtag !== d.nodeId))){
          controlPanelWindow.postMessage({op: "SET_TWITTER_HASHTAG", hashtag: currentTwitterHashtag}, DEFAULT_SOURCE);
          previousTwitterHashtag = currentTwitterHashtag.nodeId;
        }

        url = "https://twitter.com/search?f=tweets&q=%23" + d.text ;
        window.open(url, "_blank");
      break;

      case "place" :
        url = "http://twitter.com/search?q=place%3A" + d.placeId ;
        window.open(url, "_blank");
      break;
    }
  }

  function rankHashMapByValue(hmap, sortProperty, callback) {
    // console.debug("rankHashMapByValue");
    var keys = hmap.keys().sort(function(a,b){
      return hmap.get(b)[sortProperty]-hmap.get(a)[sortProperty];
    });

    async.forEachOf(keys, function(key, index, cb) {

      var entry = hmap.get(key);
      entry.rank = index;

      hmap.set(key, entry);
      cb();

    }, function(err) {
      if (err) { console.error("rankHashMapByValue ERROR: " + err); }
      callback(hmap);
    });
  }

  var updateTopTerm = function(callback) {

    var nodeTopTermLabels = nodeTopTermLabelSvgGroup.selectAll("text")
      .data(nodesTopTerm, function(d) { return d.nodeId; });

    nodeTopTermLabels
      .exit()
      .remove();

    nodeTopTermLabels
      .attr("x", xposition)
      .attr("y", yposition)
      .text(function(d) {
        return d.displaytext;
      })
      .style("opacity", function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return topTermLabelOpacityScale(d.ageMaxRatio); 
      });

    nodeTopTermLabels
      .enter().append("text")
      .style("text-anchor", "right")
      .style("alignment-baseline", "bottom")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      // .on("touchstart", nodeClick)
      .style("pointer-events", "auto")
      .attr("x", xposition)
      .attr("y", yposition)
      .text(function(d) {
        return d.displaytext;
      })
      .style("font-family", "monospace")
      .style("opacity", function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return topTermLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("fill", function(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        if (d.isKeyword) { return d.keywordColor; }
        if (d.isTrendingTopic || d.isTwitterUser || d.isNumber || d.isCurrency) { return palette.white; }
        if ((d.isGroupNode || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
        return palette.darkgray; 
      })
      .style("font-size", fontTopTerm);


    callback(null, null);
  };

  var updateNodeCircles = function(callback) {

    var nodeCircles = nodeSvgGroup.selectAll("circle")
      .data(nodes, function(d){ return d.nodeId; });

    nodeCircles
      .enter()
      .append("circle")
      .attr("nodeId", function(d) { return d.nodeId; })
      .attr("cx", function(d) { 
        return d.x; 
      })
      .attr("cy", function(d) { 
        return d.y; 
      })
      .style("fill", function(d) { 
        if (!d.isKeyword) { return palette.black; }
        return d.keywordColor; 
      })
      .style("stroke", function(d) {
        if (d.keywordsMismatch) { return palette.red; }
        if (d.keywordsMatch) { return keywordsMatchColor; }
        if (d.keywordsAuto.right) { return palette.yellow; }
        if (d.keywordsAuto.left) { return palette.blue; }
        if (d.keywordsAuto.positive) { return palette.green; }
        if (d.keywordsAuto.negative) { return palette.red; }
        return palette.white; 
      })
      .style("stroke-width", function(d) { 
        if (d.keywordsMatch) { return keywordsMatchStrokeWidth; }
        if (d.isTopTerm) { return "3.0"; }
        if (d.newFlag) { return "3.0"; }
        if (d.keywordsAuto.right) { return keywordsAutoStrokeWidth; }
        if (d.keywordsAuto.left) { return keywordsAutoStrokeWidth; }
        if (d.keywordsAuto.positive) { return keywordsAutoStrokeWidth; }
        if (d.keywordsAuto.negative) { return keywordsAutoStrokeWidth; }
        return "2.0"; 
      })
      .style("opacity", function(d) { 
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      // .on("touchstart", nodeClick)
      .transition()
        .duration(transitionDuration)
        .attr("r", function(d) {
          if (d.isIgnored) {
            return defaultRadiusScale(Math.sqrt(0.1));
          }
          if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate));}
          if (metricMode === "mentions") { 
            if (d.nodeType === "user") { 
              // if (d.followersCount === undefined) { return defaultRadiusScale(1); }
              return defaultRadiusScale(Math.sqrt(d.followersMentions)); 
            }
            return defaultRadiusScale(Math.sqrt(d.mentions));
          }
        });

    nodeCircles
      .attr("cx", function(d) { 
        return d.x; 
      })
      .attr("cy", function(d) { 
        return d.y; 
      })
      .style("fill", function(d) { 
        if (!d.isKeyword) { return palette.black; }
        return d.keywordColor; 
      })
      .style("stroke", function(d) {
        if (d.keywordsMismatch) { return palette.red; }
        if (d.keywordsMatch) { return keywordsMatchColor; }
        if (d.keywordsAuto.right) { return palette.yellow; }
        if (d.keywordsAuto.left) { return palette.blue; }
        if (d.keywordsAuto.positive) { return palette.green; }
        if (d.keywordsAuto.negative) { return palette.red; }
        return palette.white; 
      })
      .style("stroke-width", function(d) { 
        if (d.keywordsMatch) { return keywordsMatchStrokeWidth; }
        if (d.isTopTerm) { return "4.0"; }
        if (d.newFlag) { return "3.0"; }
        if (d.keywordsAuto.right) { return keywordsAutoStrokeWidth; }
        if (d.keywordsAuto.left) { return keywordsAutoStrokeWidth; }
        if (d.keywordsAuto.positive) { return keywordsAutoStrokeWidth; }
        if (d.keywordsAuto.negative) { return keywordsAutoStrokeWidth; }
        return "2.0"; 
      })
      .style("opacity", function(d) { 
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .on("click", nodeClick)
      // .on("touchstart", nodeClick)
      .transition()
        .duration(transitionDuration)
        .attr("r", function(d) {
          if (d.isIgnored) {
            return defaultRadiusScale(Math.sqrt(0.1));
          }
          if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate));}
          if (metricMode === "mentions") { 
            if (d.nodeType === "user") { 
              // if (d.followersCount === undefined) { return defaultRadiusScale(1); }
              return defaultRadiusScale(Math.sqrt(d.followersMentions)); 
            }
            return defaultRadiusScale(Math.sqrt(d.mentions));
          }
        });

    nodeCircles
      .exit()
      .attr("r", 1e-6)
      .style("opacity", 1e-6)
      .remove();

    callback();
  };

  var updateNodeLabels = function(callback) {

    var nodeLabels = nodeLabelSvgGroup.selectAll("text")
      .data(nodes, function(d) { 
        return d.nodeId; 
      });

    nodeLabels
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .style("opacity", function(d) { 
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("fill", palette.white)
      .style("visibility", function(d) {
        if (mouseMovingFlag) { return "visible"; }
        if (d.rate > MIN_RATE) { return "visible"; }
        if (d.followersCount > MIN_FOLLOWERS) { return "visible"; }
        if (d.mentions > MIN_FOLLOWERS) { return "visible"; }
        if (d.isKeyword) { return "visible"; }
        if (d.nodeType === "hashtag") { 
          if (d.text.toLowerCase().includes("trump")) { return "visible"; }
          return "hidden";
        }
        if (d.nodeType === "user") { 
          if (d.screenName.toLowerCase().includes("trump")) { return "visible"; }
          if (d.name.toLowerCase().includes("trump")) { return "visible"; }
          return "hidden";
        }
        return "hidden";
      })
      .style("font-size", function(d) {
        if (metricMode === "rate") {return nodeLabelSizeScale(d.rate);}
        if (metricMode === "mentions") {
          if (d.nodeType === "user") { 
            // if (d.followersCount === undefined) { return nodeLabelSizeScale(1); }
            return nodeLabelSizeScale(d.followersMentions);
          }
          return nodeLabelSizeScale(d.mentions);
        }
      });

    nodeLabels
      .enter()
      .append("text")
      .attr("nodeId", function(d) { return d.nodeId; })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      // .on("touchstart", nodeClick)
      .attr("x", function(d) { 
        return d.x; 
      })
      .attr("y", function(d) { 
        return d.y; 
      })
      .text(function(d) {
        if (d.nodeType === "hashtag") { return "#" + d.text.toUpperCase(); }
        if (d.nodeType === "user") { 
          if (d.screenName) { return "@" + d.screenName.toUpperCase(); 
          }
          else if (d.name){
            return "@" + d.name.toUpperCase(); 
          }
          else {
            return "@UNKNOWN?"; 
          }
        }
        if (d.isKeyword || d.isTrendingTopic || d.isTwitterUser) { 
          if (d.nodeType === "hashtag") { return "#" + d.text.toUpperCase(); }
          if (d.nodeType === "place") { return d.fullName.toUpperCase(); }
          return d.nodeId.toUpperCase(); 
        }
        if (d.nodeType === "hashtag") { return "#" + d.text.toUpperCase(); }
        if (d.nodeType === "place") { return d.fullName; }
        if (testMode) { return "blah"; }
        return d.nodeId; 
      })
      .style("font-weight", function(d) {
        if (d.followersCount > MIN_FOLLOWERS) { return "bold"; }
        return "normal";
      })
      .style("visibility", function(d) {
        if (mouseMovingFlag) { 
          return "visible"; 
        }
        if (d.rate > MIN_RATE) { return "visible"; }
        if (d.followersCount > MIN_FOLLOWERS) { return "visible"; }
        if (d.mentions > MIN_MENTIONS) { return "visible"; }
        if (d.isKeyword) { return "visible"; }
        return "hidden";
      })
      .style("text-decoration", function(d) { 
        if (d.isTopTerm && (d.followersCount > MIN_FOLLOWERS)) { return "overline underline"; }
        if (!d.isTopTerm && (d.followersCount > MIN_FOLLOWERS)) { return "underline"; }
        if (d.isTopTerm) { return "overline"; }
        return "none"; 
      })
      .style("opacity", function(d) { 
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("fill", palette.white)
      .style("stroke-width", function(d) { 
        if (d.keywordsMatch) { return keywordsMatchStrokeWidth; }
        if (d.keywordsMismatch) { return "4.0"; }
        if (d.isTopTerm) { return "3.0"; }
        if (d.newFlag) { return "2.0"; }
        return "1.2"; 
      })
      .style("font-size", function(d) {
        if (metricMode === "rate") {return nodeLabelSizeScale(d.rate);}
        if (metricMode === "mentions") {
          if (d.nodeType === "user") { 
            // if (d.followersCount === undefined) { return nodeLabelSizeScale(1); }
            return nodeLabelSizeScale(d.followersMentions);
          }
          return nodeLabelSizeScale(d.mentions);
        }
      });

    nodeLabels
      .exit()
      .style("font-size", 1e-6)
      .style("opacity", 1e-6)
      .remove();

    callback();
  };

  var focus = function(focalPoint){
    switch (focalPoint) {
      case "left":
        return({
          x: randomIntFromInterval(xMinRatioLeft*width, xMaxRatioLeft*width), 
          y: randomIntFromInterval(yMinRatioLeft*height, yMaxRatioLeft*height)
        });
      case "right":
        return({
          x: randomIntFromInterval(xMinRatioRight*width, xMaxRatioRight*width), 
          y: randomIntFromInterval(yMinRatioRight*height, yMaxRatioRight*height)
        });
      case "positive":
        return({
          x: randomIntFromInterval(xMinRatioPositive*width, xMaxRatioPositive*width), 
          y: randomIntFromInterval(yMinRatioPositive*height, yMaxRatioPositive*height)
        });
      case "negative":
        return({
          x: randomIntFromInterval(xMinRatioNegative*width, xMaxRatioNegative*width), 
          y: randomIntFromInterval(yMinRatioNegative*height, yMaxRatioNegative*height)
        });
      case "neutral":
        return({
          x: randomIntFromInterval(xMinRatioNeutral*width, xMaxRatioNeutral*width), 
          y: randomIntFromInterval(yMinRatioNeutral*height, yMaxRatioNeutral*height)
        });
      default:
        return({
          x: randomIntFromInterval(xMinRatioNeutral*width, xMaxRatioNeutral*width), 
          y: randomIntFromInterval(yMinRatioNeutral*height, yMaxRatioNeutral*height)
        });
    }
  };

  var createDisplayText = function(node) {

    var mntns = "1" ;

    if (node.nodeType === "user"){
      mntns = node.followersMentions.toString();
      // if (node.followersCount !== undefined) { 
      //   const totalMentions = node.mentions + node.followersCount;
      //   mntns = totalMentions.toString() ;
      // }
      // else {
      //   // mntns = "1";
      //   mntns = node.mentions.toString();
      // }
    }
    else {
      mntns = node.mentions.toString() ;
    }

    var rate = node.rate.toFixed(2).toString() ;
    var mentionPadSpaces = mentionsNumChars - mntns.length;
    var ratePadSpaces = rateNumChars - rate.length;
    var displaytext = "";

    var nodeId;

    if (node.isMaxNode) {
      if (metricMode === "rate") {
        nodeId = node.rateNodeId.toUpperCase();
        if (node.rateNodeType === "user") { nodeId = "@" + nodeId; }
        if (node.rateNodeType === "hashtag") { nodeId = "#" + nodeId; }
        displaytext = new Array(ratePadSpaces).join("\xa0") + rate
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns 
        + " | " + nodeId
        + " | RATE MAX " + moment(parseInt(node.rateTimeStamp)).format(compactDateTimeFormat);
      }
      else {
        nodeId = node.mentionsNodeId.toUpperCase();
        if (node.mentionsNodeType === "user") { nodeId = "@" + node.screenName; }
        if (node.rateNodeType === "hashtag") { nodeId = "#" + nodeId; }
        displaytext = new Array(ratePadSpaces).join("\xa0") + rate 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns
        + " | " + nodeId
        + " | MENTION MAX " + moment(parseInt(node.mentionsTimeStamp)).format(compactDateTimeFormat);
      }
    }
    else {
      if (node.isTwitterUser) { 
        if (node.screenName) {
          displaytext = new Array(ratePadSpaces).join("\xa0") + rate 
          + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns 
          + " | @" + node.screenName.toUpperCase() ;
        }
        else if (node.name) {
          displaytext = new Array(ratePadSpaces).join("\xa0") + rate 
          + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns 
          + " | @" + node.name.toUpperCase() ;
        }
        else {
          displaytext = new Array(ratePadSpaces).join("\xa0") + rate 
          + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns 
          + " | @UNKNOWN?";
        }
      }
      else if (node.nodeType === "hashtag") { 
        displaytext = new Array(ratePadSpaces).join("\xa0") + rate 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns 
        + " | #" + node.text.toUpperCase() ;
      }
      else if (node.nodeType === "place") { 
        displaytext = new Array(ratePadSpaces).join("\xa0") + rate 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns 
        + " | " + node.fullName.toUpperCase() ;
      }
      else if (testMode) { 
        displaytext = new Array(ratePadSpaces).join("\xa0") + rate 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns 
        + " | BLAH" ;
      }
      else { 
        displaytext = new Array(ratePadSpaces).join("\xa0") + rate 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns 
        + " | " + node.nodeId.toUpperCase() ;
      }
    }

    return displaytext;
  };

  var processNodeAddQ = function(callback) {

    var nodesModifiedFlag = false;

    // var nodeAddObj;
    // var newNode;
    // var currentNode;

    if (nodeAddQ.length > 0) {

      nodesModifiedFlag = false;

      var nodeAddObj = nodeAddQ.shift();

      var newNode = nodeAddObj.node;

      // newNode.nodeId = newNode.nodeId.toLowerCase();

      var currentNode = {};

      if (localNodeHashMap[newNode.nodeId] !== undefined){

        currentNode = localNodeHashMap[newNode.nodeId];

        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = moment().valueOf();
        currentNode.isKeyword = newNode.isKeyword || false;
        currentNode.keywords = newNode.keywords;
        currentNode.keywordsAuto = newNode.keywordsAuto;
        currentNode.isTopTerm = newNode.isTopTerm || false;
        currentNode.isTrendingTopic = newNode.isTrendingTopic || false;
        currentNode.isTwitterUser = newNode.isTwitterUser || false;
        currentNode.keywordColor = newNode.keywordColor;
        currentNode.mentions = newNode.mentions;
        currentNode.mouseHoverFlag = false;
        currentNode.rank = currentNode.rank || 0;
        currentNode.rate = newNode.rate || 0;
        currentNode.x = currentNode.x || 0;
        currentNode.y = currentNode.y || 0;

        if (newNode.nodeType === "user"){
          currentNode.statusesCount = newNode.statusesCount;
          currentNode.followersCount = newNode.followersCount;
          currentNode.friendsCount = newNode.friendsCount;
          currentNode.threeceeFollowing = newNode.threeceeFollowing;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        currentNode.displaytext = createDisplayText(currentNode);

        localNodeHashMap[currentNode.nodeId] = currentNode;

        if (currentNode.isTopTerm) {
          nodesTopTermHashMap.set(currentNode.nodeId, currentNode);
        }
        else {
          nodesTopTermHashMap.remove(currentNode.nodeId);
        }

        callback(null, nodesModifiedFlag);
      }
      else {
        nodesModifiedFlag = true;

        currentNode = newNode;

        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = moment().valueOf();
        currentNode.isKeyword = newNode.isKeyword || false;
        currentNode.isTopTerm = newNode.isTopTerm || false;
        currentNode.isTrendingTopic = newNode.isTrendingTopic || false;
        currentNode.isTwitterUser = newNode.isTwitterUser || false;
        currentNode.keywordColor = newNode.keywordColor;
        currentNode.mentions = newNode.mentions;
        currentNode.mouseHoverFlag = false;
        currentNode.rank = 0;
        currentNode.rate = newNode.rate || 0;

        if (newNode.nodeType === "user"){
          currentNode.statusesCount = newNode.statusesCount;
          currentNode.followersCount = newNode.followersCount;
          currentNode.friendsCount = newNode.friendsCount;
          currentNode.threeceeFollowing = newNode.threeceeFollowing;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        currentNode.displaytext = createDisplayText(currentNode);

        if (currentNode.isKeyword 
          || ((newNode.keywordsAuto !== undefined) 
              && newNode.keywordsAuto
              && (Object.keys(newNode.keywordsAuto).length > 0))) {

          var keywords = {};

          if (autoKeywordsFlag 
            && (newNode.keywordsAuto !== undefined) 
            && newNode.keywordsAuto
            && (Object.keys(newNode.keywordsAuto).length > 0)
            ){
            keywords = newNode.keywordsAuto;
          }
          else if ((newNode.keywordsAuto !== undefined) 
            && newNode.keywordsAuto
            && (!newNode.keywords || (newNode.keywords === undefined))){
            keywords = newNode.keywordsAuto;
          }
          else {
            keywords = newNode.keywords;
          }

          if (keywords.left) { 
            currentNode.x = focus("left").x; 
            currentNode.y = focus("left").y;
          }
          else if (keywords.positive) { 
            currentNode.x = focus("positive").x; 
            currentNode.y = focus("positive").y;
          }
          else if (keywords.right) { 
            currentNode.x = focus("right").x; 
            currentNode.y = focus("right").y;
          }
          else if (keywords.negative) { 
            currentNode.x = focus("negative").x; 
            currentNode.y = focus("negative").y;
          }
          else if (keywords.neutral) { 
            currentNode.x = focus("neutral").x; 
            currentNode.y = focus("neutral").y;
          }
          else {
            currentNode.x = focus("neutral").x; 
            currentNode.y = focus("neutral").y;
          }
        }
        else {
          currentNode.x = focus("neutral").x; 
          currentNode.y = focus("neutral").y;
        }

        localNodeHashMap[currentNode.nodeId] = currentNode;

        if (currentNode.isTopTerm) {
          nodesTopTermHashMap.set(currentNode.nodeId, currentNode);
        }
        else {
          nodesTopTermHashMap.remove(currentNode.nodeId);
        }

        nodes.push(currentNode);
        callback(null, nodesModifiedFlag);
      }

      if (nodes.length > maxNumberNodes) {
        maxNumberNodes = nodes.length;
      }

    }
    else {
      callback(null, nodesModifiedFlag);
    }
  };

  function ticked() {
    drawSimulation(function(){
      updateSimulation();
    });
  }

  var previousMaxMetric = 0;

  function drawSimulation(callback){

    async.series([
      function(cb){ updateNodeCircles(cb) },
      function(cb){ updateNodeLabels(cb) },
      function(cb){ updateTopTerm(cb) }
    ], function(err, results) {
      if (newCurrentMaxMetricFlag && (Math.abs(currentMaxMetric - previousMaxMetric)/currentMaxMetric) > 0.05) {

        newCurrentMaxMetricFlag = false;
        previousMaxMetric = currentMaxMetric;

        nodeLabelSizeScale = d3.scaleLinear()
          .domain([1, currentMaxMetric])
          .range([fontSizeMin, fontSizeMax])
          .clamp(true);

        defaultRadiusScale = d3.scaleLinear()
          .domain([1, Math.sqrt(currentMaxMetric)])
          .range([nodeRadiusMin, nodeRadiusMax])
          .clamp(true);

      }
      callback();
    });
  }

  function updateSimulation() {

    async.series(
      {
        addNode: processNodeAddQ,
        ageNode: ageNodes,
        deadNode: processDeadNodesHash
      },
      function() {
        simulation.nodes(nodes);
      }
    );
  }

  function yposition(d){
    var rowNum = d.rank % maxHashtagRows;
    var value = hashtagTopMargin + (rowNum * rowSpacing);
    return value + "%";
  }

  function xposition(d){
    var colNum = parseInt(d.rank / maxHashtagRows);        
    var value = hashtagLeftMargin + (colNum * colSpacing);
    return value + "%" ;
  }

  this.setChargeSliderValue = function(value){
    console.debug("SET CHARGE: " + value);
    config.defaultCharge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  this.addNode = function(nNode) {
    self.setEnableAgeNodes(true);

    if (((nNode.nodeType !== "hashtag") 
      && (nNode.nodeType !== "word") 
      && (nNode.nodeType !== "user")
      && (nNode.nodeType !== "place")) 
      || nNode.isIgnored) { 
      return;
    }

    var newNode = {};

    // if (nNode.keywordsMatch || nNode.keywordsMismatch){
    //   console.debug("keywordsMismatch: " + nNode.keywordsMismatch
    //     + " | keywordsMismatch: " + nNode.keywordsMismatch
    //   );
    // }

    newNode = nNode;
    newNode.rank = -1;
    newNode.newFlag = true;
    newNode.x = nNode.x || 0.5*width;
    newNode.y = nNode.y || 0.5*height;

    if (!nNode.keywordsAuto || (nNode.keywordsAuto === undefined)) {
      newNode.keywordsAuto = {};
    }
    else {
      newNode.isKeyword = true;
    }

    if (newNode.nodeType === "user") {
      newNode.followersMentions = nNode.mentions + nNode.followersCount;
    }

    if ((newNode.nodeType === "user") && (newNode.followersMentions > currentMax.mentions.value)) { 

      newCurrentMaxMetricFlag = true;

      currentMax.mentions.value = newNode.followersMentions; 
      currentMax.mentions.nodeId = nNode.screenName.toLowerCase(); 
      currentMax.mentions.timeStamp = moment().valueOf(); 

      if (metricMode === "mentions") {
        currentMaxMetric = newNode.followersMentions; 
      }
    }
    else if (nNode.mentions > currentMax.mentions.value) { 

      newCurrentMaxMetricFlag = true;

      currentMax.mentions.nodeType = nNode.nodeType;
      currentMax.mentions.value = nNode.mentions; 

      if (nNode.nodeType === "user") {
        if (nNode.screenName !== undefined) {
          currentMax.mentions.nodeId = nNode.screenName.toLowerCase(); 
        }
        else if (nNode.name !== undefined) {
          currentMax.mentions.nodeId = nNode.screenName.toLowerCase(); 
        }
        else {
          currentMax.mentions.nodeId = nNode.nodeId; 
        }
      }
      else if (nNode.nodeType === "place") {
        currentMax.mentions.nodeId = nNode.name.toLowerCase(); 
      }
      else if (nNode.nodeId === undefined) {
        console.error("*** NODE ID UNDEFINED\n" + jsonPrint(nNode));
      }
      else  {
        currentMax.mentions.nodeId = nNode.nodeId; 
      }
      currentMax.mentions.timeStamp = moment().valueOf(); 

      if (metricMode === "mentions") {
        currentMaxMetric = nNode.mentions; 
      }

      // console.info("NEW MAX MENTIONS: " + currentMax.mentions.value + " | " + nNode.nodeId);
    }

    if (nNode.rate > currentMax.rate.value) { 

      newCurrentMaxMetricFlag = true;

      currentMax.rate.nodeType = nNode.nodeType;
      currentMax.rate.value = nNode.rate;

      if (nNode.nodeType === "user") {
        if (nNode.screenName !== undefined) {
          currentMax.rate.nodeId = nNode.screenName.toLowerCase(); 
        }
        else if (nNode.name !== undefined) {
          currentMax.rate.nodeId = nNode.screenName.toLowerCase(); 
        }
        else {
          currentMax.rate.nodeId = nNode.nodeId; 
        }
      }
      else if (nNode.nodeType === "place") {
        currentMax.rate.nodeId = nNode.name; 
      }
      else {
        currentMax.rate.nodeId = nNode.nodeId; 
      }
      currentMax.rate.timeStamp = moment().valueOf(); 

      if (metricMode === "rate") {
        currentMaxMetric = nNode.rate; 
      }
    }

    if (nodeAddQ.length < MAX_RX_QUEUE) {
      nodeAddQ.push({op:"add", node: newNode});
    }

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
      // console.info("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    }
  };

  this.addGroup = function() {
    // not used
  };

  this.addSession = function() {
    // not used
  };

  this.initD3timer = function() {

    simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(charge))
      .force("forceX", d3.forceX().x(function(d) { 
        if (d.isKeyword){

          var keywords = {};

          if (autoKeywordsFlag 
            && (d.keywordsAuto !== undefined) 
            && d.keywordsAuto
            && (Object.keys(d.keywordsAuto).length > 0)
            ){
            keywords = d.keywordsAuto;
          }
          else if ((d.keywordsAuto !== undefined) 
            && d.keywordsAuto
            && (!d.keywords || (d.keywords === undefined))){
            keywords = d.keywordsAuto;
          }
          else {
            keywords = d.keywords;
          }

          if (keywords.right !== undefined) {
            return foci.right.x;
          }
          if (keywords.left !== undefined) {
            return foci.left.x;
          }
          if (keywords.positive !== undefined) {
            return foci.positive.x;
          }
          if (keywords.negative !== undefined) {
            return foci.negative.x;
          }
          if (keywords.neutral !== undefined) {
            return foci.neutral.x;
          }
          return 100;
        }
        else {
          return foci.default.x;
        }
        // return 0.5*width; 
      }).strength(function(d){
        return forceXmultiplier * gravity; 
      }))
      .force("forceY", d3.forceY().y(function(d) { 
        if (d.isKeyword){

          var keywords = {};
          if (autoKeywordsFlag 
            && (d.keywordsAuto !== undefined) 
            && d.keywordsAuto
            && (Object.keys(d.keywordsAuto).length > 0)
            ){
            keywords = d.keywordsAuto;
          }
          else if ((d.keywordsAuto !== undefined) 
            && d.keywordsAuto
            && (!d.keywords || (d.keywords === undefined))){
            keywords = d.keywordsAuto;
          }
          else {
            keywords = d.keywords;
          }

          if (keywords.right !== undefined) {
            return foci.right.y;
          }
          if (keywords.left !== undefined) {
            return foci.left.y;
          }
          if (keywords.positive !== undefined) {
            return foci.positive.y;
          }
          if (keywords.negative !== undefined) {
            return foci.negative.y;
          }
          if (keywords.neutral !== undefined) {
            return foci.neutral.y;
          }
          return 100;
        }
        else {
          return foci.default.y;
        }
      }).strength(function(d){
        return forceYmultiplier * gravity; 
      }))
      .force("collide", d3.forceCollide().radius(function(d) { 
        if (metricMode === "rate") {return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.rate));}
        if (metricMode === "mentions") {
          if (d.nodeType === "user") { 
            if (d.followersCount === undefined) {
              return collisionRadiusMultiplier * defaultRadiusScale(d.mentions);
            }
            return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.followersMentions));
          }
          return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions));
        }
      }).iterations(collisionIterations).strength(1.0))
      .velocityDecay(velocityDecay)
      .on("tick", ticked);
  };

  this.simulationControl = function(op) {
    switch (op) {
      case "RESET":
        self.reset();
        runningFlag = false;
      break;
      case "START":
        self.initD3timer();
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      case "RESUME":
        resumeTimeStamp = moment().valueOf();
        runningFlag = true;
        simulation.alphaTarget(0.7).restart();
      break;
      case "FREEZE":
        if (!freezeFlag){
          freezeFlag = true;
          simulation.alpha(0);
          simulation.stop();
        }
      break;
      case "PAUSE":
        resumeTimeStamp = 0;
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case "STOP":
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case "RESTART":
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      default:
        console.error("???? SIMULATION CONTROL | UNKNOWN OP: " + op);
    }
  };

  this.resize = function() {

    d3image = d3.select("#d3group");

    width = getWindowDimensions().width;
    height = getWindowDimensions().height;

    foci = {
      left: {x: xFocusLeftRatio*width, y: yFocusLeftRatio*height}, 
      right: {x: xFocusRightRatio*width, y: yFocusRightRatio*height}, 
      positive: {x: xFocusPositiveRatio*width, y: yFocusPositiveRatio*height}, 
      negative: {x: xFocusNeutralRatio*width, y: yFocusNegativeRatio*height},
      neutral: {x: xFocusNeutralRatio*width, y: yFocusNeutralRatio*height},
      default: {x: xFocusDefaultRatio*width, y: yFocusDefaultRatio*height}
    };

    nodeRadiusMin = nodeRadiusMinRatio * width;
    nodeRadiusMax = nodeRadiusMaxRatio * width;

    defaultRadiusScale = d3.scaleLinear()
    .domain([0.1, Math.sqrt(currentMaxMetric)])
    .range([nodeRadiusMin, nodeRadiusMax])
    .clamp(true);

    fontSizeMin = fontSizeMinRatio * height;
    fontSizeMax = fontSizeMaxRatio * height;


    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMaxMetric])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);

    svgMain
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    svgTreemapLayoutArea
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);
      // .on("touchstart", nodeClick);
      // .on("touchstart", function(d){
      //   topTermsDiv.style("visibility", "visible");
      //   nodeTopTermLabelSvgGroup.style("visibility", "visible");
      // })
      // .on("touchend", function(d){
      //   setTimeout(function(){
      //     topTermsDiv.style("visibility", "hidden");
      //     nodeTopTermLabelSvgGroup.style("visibility", "hidden");
      //   }, 2000);
      // });

    svgTopTermLayoutArea
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    nodeTopTermLabelSvgGroup
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    svgTopTerms
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    fontTopTerm = fontSizeTopTermRatio * topTermsDiv.height;
    rowSpacing = fontSizeTopTermRatio*110; // %

    if (simulation){
      simulation
        .force("charge", d3.forceManyBody().strength(charge))
        .force("forceX", d3.forceX().x(function(d) { 
          if (d.isKeyword){

            var keywords = {};
            if (autoKeywordsFlag 
              && (d.keywordsAuto !== undefined) 
              && d.keywordsAuto
              && (Object.keys(d.keywordsAuto).length > 0)
              ){
              keywords = d.keywordsAuto;
            }
            else if ((d.keywordsAuto !== undefined) 
              && d.keywordsAuto
              && (!d.keywords || (d.keywords === undefined))){
              keywords = d.keywordsAuto;
            }
            else {
              keywords = d.keywords;
            }

            if (keywords.right !== undefined) {
              return foci.right.x;
            }
            if (keywords.left !== undefined) {
              return foci.left.x;
            }
            if (keywords.positive !== undefined) {
              return foci.positive.x;
            }
            if (keywords.negative !== undefined) {
              return foci.negative.x;
            }
            if (keywords.neutral !== undefined) {
              return foci.neutral.x;
            }
          }
          else {
            return foci.default.x;
          }
        }).strength(function(d){
          return forceXmultiplier * gravity; 
        }))
        .force("forceY", d3.forceY().y(function(d) { 
          if (d.isKeyword){

            var keywords = {};
            if (autoKeywordsFlag 
              && (d.keywordsAuto !== undefined) 
              && d.keywordsAuto
              && (Object.keys(d.keywordsAuto).length > 0)
              ){
              keywords = d.keywordsAuto;
            }
            else if ((d.keywordsAuto !== undefined) 
              && d.keywordsAuto
              && (!d.keywords || (d.keywords === undefined))){
              keywords = d.keywordsAuto;
            }
            else {
              keywords = d.keywords;
            }

            if (keywords.right !== undefined) {
              return foci.right.y;
            }
            if (keywords.left !== undefined) {
              return foci.left.y;
            }
            if (keywords.positive !== undefined) {
              return foci.positive.y;
            }
            if (keywords.negative !== undefined) {
              return foci.negative.y;
            }
            if (keywords.neutral !== undefined) {
              return foci.neutral.y;
            }
          }
          else {
            return foci.default.y;
          }
        }).strength(function(d){
          return forceYmultiplier * gravity; 
        }))
        .force("collide", d3.forceCollide().radius(function(d) { 
          if (metricMode === "rate") {return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.rate));}
          if (metricMode === "mentions") {
            if (d.nodeType === "user") { 
              if (d.followersCount === undefined) {
                return collisionRadiusMultiplier * defaultRadiusScale(d.mentions);
              }
              return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.followersMentions));
            }
            return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions));
          }
        }).iterations(collisionIterations))
        .velocityDecay(velocityDecay);

    }
  };

  // ==========================================

  document.addEventListener("resize", function() {
    self.resize();
  }, true);

  self.reset = function() {
    console.info("RESET");
    nodes = [];
    deadNodesHash = {};
    mouseHoverFlag = false;
    localNodeHashMap = {};
    nodesTopTermHashMap.clear();
    self.toolTipVisibility(false);
    self.resize();
    self.resetDefaultForce();
  };

}