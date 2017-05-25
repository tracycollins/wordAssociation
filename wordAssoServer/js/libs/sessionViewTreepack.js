/*jslint node: false */

function ViewTreepack() {

  "use strict";

  var self = this;
  var simulation;
  var resumeTimeStamp = 0;
  var displayTopTermsFlag = false;

  var compactDateTimeFormat = "YYYYMMDD HHmmss";

  var minRadiusRatio = 0.01;
  var maxRadiusRatio = 0.10;

  var sliderPercision = 3;

  var hashtagTopMargin = 5; // %
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

  var xFocusNegativeRatio = 0.5;
  var yFocusNegativeRatio = 0.7;

  var xFocusNeutralRatio = 0.5;
  var yFocusNeutralRatio = 0.5;

  var xFocusDefaultRatio = 0.5;
  var yFocusDefaultRatio = 0.5;

  // INITIAL POSITION
  var xMinRatioLeft = 0.10;
  var xMaxRatioLeft = 0.35;

  var yMinRatioLeft = 0.85;
  var yMaxRatioLeft = 0.90;

  var xMinRatioRight = 0.65;
  var xMaxRatioRight = 0.90;

  var yMinRatioRight = 0.85;
  var yMaxRatioRight = 0.90;

  var xMinRatioPositive = 0.45;
  var xMaxRatioPositive = 0.55;

  var yMinRatioPositive = 0.85;
  var yMaxRatioPositive = 0.95;

  var xMinRatioNegative = 0.55;
  var xMaxRatioNegative = 0.65;

  var yMinRatioNegative = 0.90;
  var yMaxRatioNegative = 1.00;

  var xMinRatioNeutral = 0.45;
  var xMaxRatioNeutral = 0.55;

  var yMinRatioNeutral = 0.85;
  var yMaxRatioNeutral = 0.95;


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

  var getWindowDimensions = function (){

    var w;
    var h;

    if (window.innerWidth !== 'undefined') {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    else if (document.documentElement !== 'undefined' 
      && document.documentElement.clientWidth !== 'undefined' 
      && document.documentElement.clientWidth !== 0) {
      w = document.documentElement.clientWidth;
      h = document.documentElement.clientHeight;
    }
    // older versions of IE
    else {
      w = document.getElementsByTagName('body')[0].clientWidth;
      h = document.getElementsByTagName('body')[0].clientHeight;
    }

    return { width: w, height: h };
  };

  var width = getWindowDimensions().width;
  var height = getWindowDimensions().height;

  var minRadius = minRadiusRatio * width;
  var maxRadius = maxRadiusRatio * height;

  var metricMode = config.defaultMetricMode;
  var transitionDuration = config.defaultTransitionDuration;
  var blahMode = config.defaultBlahMode;
  var charge = config.defaultCharge;
  var gravity = config.defaultGravity;
  var forceXmultiplier = config.defaultForceXmultiplier;
  var forceYmultiplier = config.defaultForceYmultiplier;
  var collisionRadiusMultiplier = 1.01;
  var collisionIterations = config.defaultCollisionIterations;
  var globalLinkStrength = config.defaultLinkStrength;
  var globalLinkDistance = config.defaultLinkDistance;
  var velocityDecay = config.defaultVelocityDecay;
  var fontSizeMinRatio = config.defaultFontSizeMinRatio;
  var fontSizeMaxRatio = config.defaultFontSizeMaxRatio;
  var fontSizeTopTermRatio = config.defaultFontSizeTopTermRatio;
  var fontSizeMin = config.defaultFontSizeMinRatio * height;
  var fontSizeMax = config.defaultFontSizeMaxRatio * height;
  // var fontTopTerm = config.defaultFontSizeTopTermRatio * height;

  var rowSpacing = fontSizeTopTermRatio*110; // %
  var colSpacing = 90/maxHashtagCols; // %

  var maxRateMentionsNode = {};
  maxRateMentionsNode.rateNodeType = "hashtag";
  maxRateMentionsNode.mentionsNodeType = "hashtag";
  maxRateMentionsNode.isMaxNode = true;

  if (metricMode === "rate") {
    maxRateMentionsNode.nodeId = "RATE | MAX";
  }
  if (metricMode === "mentions") {
    maxRateMentionsNode.nodeId = "MNTN | MAX";
  }
  maxRateMentionsNode.age = 0;
  maxRateMentionsNode.rate = 2;
  maxRateMentionsNode.rateNodeId = "what";
  maxRateMentionsNode.mentionsNodeId = "what";
  maxRateMentionsNode.rateTimeStamp = moment().valueOf();
  maxRateMentionsNode.mentionsTimeStamp = moment().valueOf();
  maxRateMentionsNode.mentions = 2;
  maxRateMentionsNode.ageMaxRatio = 0;
  maxRateMentionsNode.isTrendingTopic = true;
  maxRateMentionsNode.displaytext = "WHAT?";
  maxRateMentionsNode.mouseHoverFlag = false;
  maxRateMentionsNode.x = 100;
  maxRateMentionsNode.y = 100;


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

  var minOpacity = 0.35;
  // var blahFlag = false;
  var antonymFlag = false;
  var removeDeadNodesFlag = true;

  var defaultPosDuration = 150;

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
    'ageRate': DEFAULT_AGE_RATE
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
    "blue": "#2176C7",
    "green": "#259286",
    "lightgreen": "#35A296",
    "yellowgreen": "#738A05"
  };


  var topTermsDiv = d3.select("#topTermsDiv");

  var topTermsCheckBox = topTermsDiv.append("input")
    .attr("id", "topTermsCheckBox")
    .attr("type", "checkbox")
    // .attr("checked", "false")
    .on("change", function(){
      console.log("CHECKBOX");
      if (!topTermsCheckBox.property("checked")) { 
        console.warn("NOT CHECKED");
        topTermsDiv.style("visibility", "hidden"); 
        nodeTopTermLabelSvgGroup.style("visibility", "hidden");
      }
      else {
        console.error("CHECKED");
        topTermsDiv.style("visibility", "visible"); 
        nodeTopTermLabelSvgGroup.style("visibility", "visible");
      }
    });
 
  console.log("width: " + width + " | height: " + height);

  var mouseMoveTimeoutEventHandler = function(e) {
    // var elem = document.getElementById("topTermsCheckBox");
    console.debug("mouseMoveTimeoutEvent");
    if (!topTermsCheckBox.property("checked")) { 
      console.warn("NOT CHECKED");
      topTermsDiv.style("visibility", "hidden"); 
      nodeTopTermLabelSvgGroup.style("visibility", "hidden");
    }
    else {
      console.warn("CHECKED");
      topTermsDiv.style("visibility", "visible"); 
      nodeTopTermLabelSvgGroup.style("visibility", "visible");
    }
  };

  document.addEventListener("mouseMoveTimeoutEvent", mouseMoveTimeoutEventHandler);

  document.addEventListener("mousemove", function() {

    topTermsDiv.style("visibility", "visible");
    nodeTopTermLabelSvgGroup.style("visibility", "visible");

    if (mouseHoverFlag) {
      d3.select("body").style("cursor", "pointer");
    } else {
      d3.select("body").style("cursor", "default");
    }

  }, true);

  var defaultRadiusScale = d3.scaleLinear()
    .domain([0.1, Math.sqrt(currentMaxMetric)])
    .range([minRadius, maxRadius])
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
    .domain([1e-6, 0.2, 1.0])
    .range([1.0, 0.4, minOpacity])
    .clamp(true);
    
  var adjustedAgeRateScale = d3.scaleLinear()
    .domain([1, MAX_NODES])
    .range([1.0, 10.0]);

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

  var panzoomElement = document.getElementById('svgTreemapLayoutArea');
  panzoom(panzoomElement, {zoomSpeed: 0.030});

//============TREEMAP=================================


  var svgTopTerms = topTermsDiv.append("svg:svg")
    .attr("id", "svgTopTerms")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var nodeTopTermLabelSvgGroup = svgTopTerms.append("svg:g")
    .attr("id", "nodeTopTermLabelSvgGroup")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6)
    .attr("visibility", "hidden");

  var fontTopTerm = config.defaultFontSizeTopTermRatio * topTermsDiv.height;

  // nodeTopTermLabelSvgGroup.style("visibility", "visible");

  var nodeSvgGroup = svgTreemapLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgTreemapLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");


  console.log("@@@@@@@ CLIENT @@@@@@@@");

  var randomIntFromInterval = function(min, max) {
    var random = Math.random();
    var randomInt = Math.floor((random * (max - min + 1)) + min);
    if (randomInt !== randomInt) {
      console.error("randomIntFromInterval ERROR"
        + " | MIN: " + min
        + " | MAX: " + max
      );
    }
    if (Number.isNaN(randomInt)) {
      console.error("randomIntFromInterval NaN"
        + " | MIN: " + min
        + " | MAX: " + max
      );
    }
    return randomInt;
  };

  d3.select("body").style("cursor", "default");
  
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
      .range([minRadius, maxRadius])
      .clamp(true);

    console.debug("SET METRIC MODE: " + metricMode);
  };

  this.setBlah = function(flag) {
    blahMode = flag;
    console.debug("SET BLAH: " + blahMode);
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
      self.simulationControl('PAUSE');
    }
    else{
      self.simulationControl('RESUME');
    }
  };

  self.togglePause = function(){
    if (runningFlag){
      self.simulationControl('PAUSE');
    }
    else{
      self.simulationControl('RESUME');
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
    console.debug("UPDATE GRAVITY: " + value.toFixed(sliderPercision));
    config.defaultGravity = value;
    gravity = value;

    simulation
      .force("forceX", d3.forceX().x(function(d) { 
        if (d.isKeyword){
          if (d.keywords.right !== undefined) {
            return foci.right.x;
          }
          if (d.keywords.left !== undefined) {
            return foci.left.x;
          }
          if (d.keywords.positive !== undefined) {
            return foci.positive.x;
          }
          if (d.keywords.negative !== undefined) {
            return foci.negative.x;
          }
          if (d.keywords.neutral !== undefined) {
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
          if (d.keywords.right !== undefined) {
            return foci.right.y;
          }
          if (d.keywords.left !== undefined) {
            return foci.left.y;
          }
          if (d.keywords.positive !== undefined) {
            return foci.positive.y;
          }
          if (d.keywords.negative !== undefined) {
            return foci.negative.y;
          }
          if (d.keywords.neutral !== undefined) {
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
    var nodeObj;

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

      if (resumeTimeStamp > 0){
        ageRate = 0;
      }

      age = node.age + (ageRate * (moment().valueOf() - node.ageUpdated));

      ageMaxRatio = age/nodeMaxAge ;

      if (node.isDead 
        || (removeDeadNodesFlag && (age >= nodeMaxAge))
        ) {

        delete localNodeHashMap[node.nodeId];

        nodesTopTermHashMap.remove(node.nodeId);

        nodes.splice(ageNodesIndex, 1);
        console.debug("X NODE"
          + " | NODES: " + nodes.length
          + " | " + node.nodeType
          + " | " + node.nodeId
        );
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

      maxRateMentionsNode.age = 0;

      maxRateMentionsNode.rateNodeType = currentMax.rate.nodeType;
      maxRateMentionsNode.rate = currentMax.rate.value;
      maxRateMentionsNode.rateNodeId = currentMax.rate.nodeId;
      maxRateMentionsNode.rateTimeStamp = currentMax.rate.timeStamp;

      maxRateMentionsNode.mentionsNodeType = currentMax.mentions.nodeType;
      maxRateMentionsNode.mentions = currentMax.mentions.value;
      maxRateMentionsNode.mentionsNodeId = currentMax.mentions.nodeId;
      maxRateMentionsNode.mentionsTimeStamp = currentMax.mentions.timeStamp;

      maxRateMentionsNode.ageMaxRatio = 0;
      maxRateMentionsNode.isTrendingTopic = true;
      maxRateMentionsNode.displaytext = createDisplayText(maxRateMentionsNode);
      maxRateMentionsNode.mouseHoverFlag = false;

      if (metricMode === "rate") {
        maxRateMentionsNode.nodeId = "RATE | MAX" ;
      }
      if (metricMode === "mentions") {
        maxRateMentionsNode.nodeId = "MNTN | MAX" ;
      }

      nodesTopTermHashMap.set(maxRateMentionsNode.nodeId, maxRateMentionsNode);

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
        nodeDeleteQ.push({op:'delete', nodeId: node.nodeId});
        deadNodeFlag = true;
        delete deadNodesHash[node.nodeId];

        // localNodeHashMap.remove(node.nodeId);
        delete localNodeHashMap[node.nodeId];

        nodesTopTermHashMap.remove(node.nodeId);
      }
      deadNodeIds = Object.keys(deadNodesHash);
    }

    if ((nodes.length === 0) || (deadNodeIds.length === 0) || (ageNodesIndex < 0)) {
      return (callback(null, deadNodeFlag));
    }
  };

  var nodeMouseOver = function (d) {

    d.mouseHoverFlag = true;

    self.toolTipVisibility(true);

    d3.select(this).style("opacity", 1);

    var tooltipString;

    switch (d.nodeType) {
      case 'user':
        tooltipString = "@" + d.nodeId
          + "<br>TOPTERM: " + d.isTopTerm 
          + "<br>N: " + d.name 
          + "<br>SN: " + d.screenName 
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>KEYWORDS: " + jsonPrint(d.keywords);
      break;
      case 'hashtag':
        tooltipString = "#" + d.nodeId
          + "<br>TOPTERM " + d.isTopTerm 
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>KEYWORDS: " + jsonPrint(d.keywords);
      break;
      case 'word':
        tooltipString = d.nodeId
          + "<br>TOPTERM " + d.isTopTerm 
          + "<br>TYPE: " + d.nodeType 
          + "<br>KEYWORDS: " + jsonPrint(d.keywords)
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>URL: " + d.url;
      break;
      case 'place':
        tooltipString = d.fullName
          + "<br>TOPTERM " + d.isTopTerm 
          + "<br>TYPE: " + d.nodeType 
          + "<br>KEYWORDS: " + jsonPrint(d.keywords)
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM";
      break;
    }

    divTooltip.html(tooltipString)
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

  function cellClick(d) {
    console.debug("cellClick", d);
    var url = "https://twitter.com/search?f=tweets&q=%23" + d.name ;
    window.open(url, '_blank');
  }

  function nodeClick(d) {
    console.debug("nodeClick");
    var url = "";

    switch (d.nodeType) {
      case "user" :
        // url = "https://twitter.com/search?f=realtime&q=%23" + d.text ;
        url = "https://twitter.com/search?f=tweets&q=%3A" + d.screenName ;
        window.open(url, '_blank');
      break;
      case "hashtag" :
        // url = "https://twitter.com/search?f=realtime&q=%23" + d.text ;
        url = "https://twitter.com/search?f=tweets&q=%23" + d.text ;
        window.open(url, '_blank');
      break;
      case "place" :
        // url = "https://twitter.com/search?f=realtime&q=%23" + d.text ;
        url = "http://twitter.com/search?q=place%3A" + d.placeId ;
        window.open(url, '_blank');
      break;
    }
  }

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
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
      .attr("class", "exit")
      .remove();

    nodeTopTermLabels
      .attr("class", "update")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .text(function(d) {
        return d.displaytext;
      })
      .style("font-size", fontTopTerm)
      .style('fill', function(d) { 
        if (d.newFlag) { return palette.white; }
        if (d.mouseHoverFlag) { return palette.blue; }
        if (d.isKeyword) { return d.keywordColor; }
        if (d.isTrendingTopic || d.isTwitterUser || d.isNumber || d.isCurrency) { return palette.white; }
        if ((d.isGroupNode || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
        return palette.darkgray; 
      })
      .style('opacity', function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return topTermLabelOpacityScale(d.ageMaxRatio); 
      })
      .transition()
        .duration(transitionDuration)
        .attr("x", xposition)
        .attr("y", yposition);

    nodeTopTermLabels
      .enter().append("text")
      .attr("class", "enter")
      .style("text-anchor", "right")
      .style("alignment-baseline", "bottom")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .attr("x", xposition)
      .attr("y", yposition)
      .text(function(d) {
        return d.displaytext;
      })
      .style("font-family", "monospace")
      .style("font-weight", "normal")
      .style('opacity', function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return topTermLabelOpacityScale(d.ageMaxRatio); 
      })
      .style('fill', palette.white)
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
        // if (typeof d.x != "number") {
        if (Number.isNaN(d.x)) {
          console.error("d.x ERROR\n" + jsonPrint(d));
          d.x = 100;
          return 100;
        }
        else {
          return d.x; 
        }
      })
      .attr("cy", function(d) { 
        return d.y; 
      })
      .style("fill", function(d) { 
        if (!d.isKeyword) { return palette.black; }
        return d.keywordColor; 
      })
      .style("stroke", function(d) { 
        return palette.white; 
      })
      .style("stroke-dasharray", function(d) { 
        if (d.isTopTerm) { return "10,2"; }
        return null; 
      })
      .style("stroke-width", function(d) { 
        if (d.isTopTerm) { return "4.0"; }
        if (d.newFlag) { return "2.0"; }
        return "1.2"; 
      })
      .style('opacity', function(d) { 
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .transition()
        .duration(transitionDuration)
        .attr("r", function(d) {
          if (d.isIgnored) {
            return defaultRadiusScale(Math.sqrt(0.1));
          }
          if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate));}
          if (metricMode === "mentions") { return defaultRadiusScale(Math.sqrt(d.mentions)); }
        });

    nodeCircles
      .attr("cx", function(d) { 
        // if (typeof d.x != "number") {
        if (Number.isNaN(d.x)) {
          console.error("d.x ERROR\n" + jsonPrint(d));
          d.x = 100;
          return 100;
        }
        else {
          return d.x; 
        }
      })
      .attr("cy", function(d) { 
        return d.y; 
      })
      .style("fill", function(d) { 
        if (!d.isKeyword) { return palette.black; }
        return d.keywordColor; 
      })
      .style("stroke", function(d) { 
        return palette.white; 
      })
      .style("stroke-width", function(d) { 
        if (d.isTopTerm) { return "4.0"; }
        if (d.newFlag) { return "2.0"; }
        return "1.2"; 
      })
      .style("stroke-dasharray", function(d) { 
        if (d.isTopTerm) { return "10,2"; }
        return null; 
      })
      .style('opacity', function(d) { 
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .transition()
        .duration(transitionDuration)
        .attr("r", function(d) {
          if (d.isIgnored) {
            return defaultRadiusScale(Math.sqrt(0.1));
          }
          if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate));}
          if (metricMode === "mentions") { return defaultRadiusScale(Math.sqrt(d.mentions)); }
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
      .text(function(d) {
        if (d.isTwitterUser) { 
          if (d.screenName) { 
            return "@" + d.screenName.toUpperCase(); 
          }
          else if (d.name){
            return "@" + d.name.toUpperCase(); 
          }
          else {
            return "@UNKNOWN?"; 
          }

        }
        if (d.isKeyword || d.isTrendingTopic || d.isTwitterUser) { 
          if (d.nodeType === "place") { return d.fullName.toUpperCase(); }
          return d.nodeId.toUpperCase(); 
        }
        if (d.nodeType === "place") { return d.fullName; }
        if (testMode) { return "blah"; }
        return d.nodeId; 
      })
      .style("font-weight", function(d) {
        if (d.isTopTerm) { return "bold"; }
        return "normal";
      })
      .style("text-decoration", function(d) { 
        if (d.isTopTerm) { return "overline"; }
        return "none"; 
      })
      .style("opacity", function(d) { 
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("fill", palette.white)
      .style("font-size", function(d) {
        if (metricMode === "rate") {return nodeLabelSizeScale(d.rate);}
        if (metricMode === "mentions") {return nodeLabelSizeScale(d.mentions);}
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
      .attr("x", function(d) { 
        return d.x; 
      })
      .attr("y", function(d) { 
        return d.y; 
      })
      .text(function(d) {
        if (d.isTwitterUser) { 
          if (d.screenName) { 
            return "@" + d.screenName.toUpperCase(); 
          }
          else if (d.name){
            return "@" + d.name.toUpperCase(); 
          }
          else {
            return "@UNKNOWN?"; 
          }

        }
        if (d.isKeyword || d.isTrendingTopic || d.isTwitterUser) { 
          if (d.nodeType === "place") { return d.fullName.toUpperCase(); }
          return d.nodeId.toUpperCase(); 
        }
        if (d.nodeType === "place") { return d.fullName; }
        if (testMode) { return "blah"; }
        return d.nodeId; 
      })
      .style("font-weight", function(d) {
        if (d.isTopTerm) { return "bold"; }
        return "normal";
      })
      .style("text-decoration", function(d) { 
        if (d.isTopTerm) { return "overline"; }
        return "none"; 
      })
      .style("opacity", function(d) { 
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("fill", palette.white)
      .style("font-size", function(d) {
        if (metricMode === "rate") {return nodeLabelSizeScale(d.rate);}
        if (metricMode === "mentions") {return nodeLabelSizeScale(d.mentions);}
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

    var mntns = node.mentions.toString() ;
    var rate = node.rate.toFixed(2).toString() ;
    var mentionPadSpaces = mentionsNumChars - mntns.length;
    var ratePadSpaces = rateNumChars - rate.length;
    var displaytext = "";


    if (node.isMaxNode) {
      if (metricMode === "rate") {
        var nodeId = node.rateNodeId.toUpperCase();
        if (node.nodeType === "user") { nodeId = "@" + nodeId; }
        displaytext = new Array(ratePadSpaces).join("\xa0") + rate
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns 
        + " | RATE | MAX | " + nodeId
        + " | " + moment(parseInt(node.rateTimeStamp)).format(compactDateTimeFormat);
      }
      else {
        var nodeId = node.mentionsNodeId.toUpperCase();
        if (node.nodeType === "user") { nodeId = "@" + nodeId; }
        displaytext = new Array(ratePadSpaces).join("\xa0") + rate 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns
        + " | MNTN | MAX | " + nodeId
        + " | " + moment(parseInt(node.mentionsTimeStamp)).format(compactDateTimeFormat);
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

    var nodeAddObj;
    var newNode;
    var currentNode;

    if (nodeAddQ.length > 0) {

      nodesModifiedFlag = false;
      nodeAddObj = nodeAddQ.shift();
      newNode = nodeAddObj.node;
      newNode.nodeId = newNode.nodeId.toLowerCase();
      currentNode = {};

      if (localNodeHashMap[newNode.nodeId] !== undefined){

        currentNode = localNodeHashMap[newNode.nodeId];

        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = moment().valueOf();
        currentNode.isKeyword = newNode.isKeyword || false;
        currentNode.keywords = newNode.keywords;
        currentNode.isTopTerm = newNode.isTopTerm || false;
        currentNode.isTrendingTopic = newNode.isTrendingTopic || false;
        currentNode.isTwitterUser = newNode.isTwitterUser || false;
        currentNode.keywordColor = newNode.keywordColor;
        currentNode.mentions = Math.max(currentNode.mentions, newNode.mentions || 1);
        currentNode.mouseHoverFlag = false;
        currentNode.rank = currentNode.rank || 0;
        currentNode.rate = newNode.rate || 0;
        currentNode.displaytext = createDisplayText(currentNode);
        currentNode.x = currentNode.x || 0;
        currentNode.y = currentNode.y || 0;

        // localNodeHashMap.set(currentNode.nodeId, currentNode);
        localNodeHashMap[currentNode.nodeId] = currentNode;

        if (currentNode.isTopTerm) {
          nodesTopTermHashMap.set(currentNode.nodeId, currentNode);
        }
        else {
          nodesTopTermHashMap.remove(currentNode.nodeId);
        }

        // console.info("HIT currentNode\n" + jsonPrint(currentNode));
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
        currentNode.mentions = Math.max(currentNode.mentions, newNode.mentions || 1);
        currentNode.mouseHoverFlag = false;
        currentNode.rank = 0;
        currentNode.rate = newNode.rate || 0;
        currentNode.displaytext = createDisplayText(currentNode);

        if (currentNode.isKeyword) {
          console.warn("keywords"
            + " | NID: " + newNode.nodeId 
            + " | NTYPE: " + newNode.nodeType 
            + " | isKeyword: " + newNode.isKeyword 
            + "\n" + jsonPrint(newNode.keywords)
          );
          if (newNode.keywords.left) { 
            currentNode.x = focus("left").x; 
            currentNode.y = focus("left").y;
          }
          else if (newNode.keywords.positive) { 
            currentNode.x = focus("positive").x; 
            currentNode.y = focus("positive").y;
          }
          else if (newNode.keywords.right) { 
            currentNode.x = focus("right").x; 
            currentNode.y = focus("right").y;
          }
          else if (newNode.keywords.negative) { 
            currentNode.x = focus("negative").x; 
            currentNode.y = focus("negative").y;
          }
          else if (newNode.keywords.neutral) { 
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
        // console.info("MISS currentNode\n" + jsonPrint(currentNode));
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
      updateSimulation(function(){});
    });
  }

  function drawSimulation(callback){
    updateNodeCircles(function(){
      updateNodeLabels(function(){
        updateTopTerm(function(){
          callback();
        });
      });
    });
  }

  function updateSimulation(callback) {

    async.series(
      {
        addNode: processNodeAddQ,
        ageNode: ageNodes,
        deadNode: processDeadNodesHash
      },
      function(err, results) {
        simulation.nodes(nodes);
        if (typeof callback !== 'undefined') callback();
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

  this.setChargeSliderValue = function(){
  };

  this.addNode = function(nNode) {

    if (((nNode.nodeType !== "hashtag") 
      && (nNode.nodeType !== "word") 
      && (nNode.nodeType !== "user")
      && (nNode.nodeType !== "place")) 
      || nNode.isIgnored) { 
      return;
    }

    // if ((nNode.nodeType === "word") && !nNode.isKeyword) { 
    //   return;
    // }

    var newNode = {};

    newNode = nNode;
    newNode.rank = -1;
    newNode.newFlag = true;
    newNode.x = newNode.x || 0.5*width;
    newNode.y = newNode.y || 0.5*height;

    if (nNode.mentions > currentMax.mentions.value) { 

      currentMax.mentions.value = nNode.mentions; 

      if (nNode.nodeType === "user") {
        currentMax.mentions.nodeId = nNode.screenName; 
      }
      else if (nNode.nodeType === "place") {
        currentMax.mentions.nodeId = nNode.fullName; 
      }
      else {
        currentMax.mentions.nodeId = nNode.nodeId; 
      }
      currentMax.mentions.timeStamp = moment().valueOf(); 

      if (metricMode === "mentions") {

        currentMaxMetric = nNode.mentions; 

        nodeLabelSizeScale = d3.scaleLinear()
          .domain([1, currentMaxMetric])
          .range([fontSizeMin, fontSizeMax])
          .clamp(true);

        defaultRadiusScale = d3.scaleLinear()
          .domain([1, Math.sqrt(currentMaxMetric)])
          .range([minRadius, maxRadius])
          .clamp(true);
      }

      console.info("NEW MAX MENTIONS: " + currentMax.mentions.value + " | " + nNode.nodeId);
    }

    if (nNode.rate > currentMax.rate.value) { 

      currentMax.rate.value = nNode.rate;
      if (nNode.nodeType === "user") {
        currentMax.rate.nodeId = nNode.screenName; 
      }
      else if (nNode.nodeType === "place") {
        currentMax.rate.nodeId = nNode.fullName; 
      }
      else {
        currentMax.rate.nodeId = nNode.nodeId; 
      }
      currentMax.rate.timeStamp = moment().valueOf(); 

      if (metricMode === "rate") {

        currentMaxMetric = nNode.rate; 

        nodeLabelSizeScale = d3.scaleLinear()
          .domain([1, currentMaxMetric])
          .range([fontSizeMin, fontSizeMax])
          .clamp(true);

        defaultRadiusScale = d3.scaleLinear()
          .domain([1, Math.sqrt(currentMaxMetric)])
          .range([minRadius, maxRadius])
          .clamp(true);
      }

      console.info("NEW MAX RATE: " + currentMax.rate.value.toFixed(2) + " | " + nNode.nodeId);
    }

    if (nodeAddQ.length < MAX_RX_QUEUE) {
      nodeAddQ.push({op:'add', node: newNode});
    }

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
      console.info("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    }
  };

  this.addGroup = function() {
  };

  this.addSession = function() {
  };

  this.initD3timer = function() {

    simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(charge))
      .force("forceX", d3.forceX().x(function(d) { 
        if (d.isKeyword){
          if (d.keywords.right !== undefined) {
            return foci.right.x;
          }
          if (d.keywords.left !== undefined) {
            return foci.left.x;
          }
          if (d.keywords.positive !== undefined) {
            return foci.positive.x;
          }
          if (d.keywords.negative !== undefined) {
            return foci.negative.x;
          }
          if (d.keywords.neutral !== undefined) {
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
          if (d.keywords.right !== undefined) {
            return foci.right.y;
          }
          if (d.keywords.left !== undefined) {
            return foci.left.y;
          }
          if (d.keywords.positive !== undefined) {
            return foci.positive.y;
          }
          if (d.keywords.negative !== undefined) {
            return foci.negative.y;
          }
          if (d.keywords.neutral !== undefined) {
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
        if (metricMode === "mentions") {return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions));}
      }).iterations(collisionIterations).strength(1.0))
      .velocityDecay(velocityDecay)
      .on("tick", ticked);
  }

  this.simulationControl = function(op) {
    switch (op) {
      case 'RESET':
        console.info("SIMULATION CONTROL | OP: " + op);
        self.reset();
        runningFlag = false;
      break;
      case 'START':
        console.info("SIMULATION CONTROL | OP: " + op);
        self.initD3timer();
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      case 'RESUME':
        console.info("SIMULATION CONTROL | OP: " + op);
        // self.initD3timer();
        resumeTimeStamp = moment().valueOf();
        runningFlag = true;
        simulation.alphaTarget(0.7).restart();
      break;
      case 'FREEZE':
        console.info("SIMULATION CONTROL | OP: " + op);
        if (!freezeFlag){
          freezeFlag = true;
          simulation.alpha(0);
          simulation.stop();
        }
      break;
      case 'PAUSE':
        console.info("SIMULATION CONTROL | OP: " + op);
        resumeTimeStamp = 0;
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case 'STOP':
        console.info("SIMULATION CONTROL | OP: " + op);
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case 'RESTART':
        // console.info("SIMULATION CONTROL | OP: " + op);
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      default:
        console.error("???? SIMULATION CONTROL | UNKNOWN OP: " + op);
      break;
    }
  }

  this.resize = function() {
    console.info("RESIZE");

    d3image = d3.select("#d3group");

    width = getWindowDimensions().width;
    height = getWindowDimensions().height;

    console.info("width: " + width + " | height: " + height);

    foci = {
      left: {x: xFocusLeftRatio*width, y: yFocusLeftRatio*height}, 
      right: {x: xFocusRightRatio*width, y: yFocusRightRatio*height}, 
      positive: {x: xFocusPositiveRatio*width, y: yFocusPositiveRatio*height}, 
      negative: {x: xFocusNeutralRatio*width, y: yFocusNegativeRatio*height},
      neutral: {x: xFocusNeutralRatio*width, y: yFocusNeutralRatio*height},
      default: {x: xFocusDefaultRatio*width, y: yFocusDefaultRatio*height}
    };

    minRadius = minRadiusRatio * width;
    maxRadius = maxRadiusRatio * width;

    defaultRadiusScale = d3.scaleLinear()
    .domain([0.1, Math.sqrt(currentMaxMetric)])
    .range([minRadius, maxRadius])
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
    // fontTopTerm = fontSizeTopTermRatio * height;
    rowSpacing = fontSizeTopTermRatio*110; // %

    if (simulation){
      simulation
        .force("charge", d3.forceManyBody().strength(charge))
        .force("forceX", d3.forceX().x(function(d) { 
          if (d.isKeyword){
            if (d.keywords.right !== undefined) {
              return foci.right.x;
            }
            if (d.keywords.left !== undefined) {
              return foci.left.x;
            }
            if (d.keywords.positive !== undefined) {
              return foci.positive.x;
            }
            if (d.keywords.negative !== undefined) {
              return foci.negative.x;
            }
            if (d.keywords.neutral !== undefined) {
              return foci.neutral.x;
            }
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
            if (d.keywords.right !== undefined) {
              return foci.right.y;
            }
            if (d.keywords.left !== undefined) {
              return foci.left.y;
            }
            if (d.keywords.positive !== undefined) {
              return foci.positive.y;
            }
            if (d.keywords.negative !== undefined) {
              return foci.negative.y;
            }
            if (d.keywords.neutral !== undefined) {
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
          if (metricMode === "mentions") {return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions));}
        }).iterations(collisionIterations))
        .velocityDecay(velocityDecay)

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