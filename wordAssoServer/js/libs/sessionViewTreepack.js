/*jslint node: false */

function ViewTreepack() {

  "use strict";

  var self = this;
  var simulation;

  var maxRateMentionsNode = {};
  maxRateMentionsNode.nodeId = "RATE MENTIONS | MAX";
  maxRateMentionsNode.age = 0;
  maxRateMentionsNode.rate = 1;
  maxRateMentionsNode.mentions = 1;
  maxRateMentionsNode.ageMaxRatio = 0;
  maxRateMentionsNode.isTrendingTopic = true;
  maxRateMentionsNode.displaytext = "WHAT?";
  maxRateMentionsNode.mouseHoverFlag = false;
  maxRateMentionsNode.x = 100;
  maxRateMentionsNode.y = 100;


  var minRadiusRatio = 0.01;
  var maxRadiusRatio = 0.10;

  var sliderPercision = 3;

  var hashtagTopMargin = 10; // %
  var hashtagLeftMargin = 5; // %
  var mentionsNumChars = 9;
  var rateNumChars = 8;

  var maxHashtagRows = 25;
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
  var xMinRatioLeft = 0.25;
  var xMaxRatioLeft = 0.35;

  var yMinRatioLeft = 0.85;
  var yMaxRatioLeft = 0.95;

  var xMinRatioRight = 0.65;
  var xMaxRatioRight = 0.75;

  var yMinRatioRight = 0.85;
  var yMaxRatioRight = 0.95;

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

  var currentMaxMentions = 0;
  var currentMaxRate = 2;
  var currentHashtagMaxMentions = 2;
  var deadNodesHash = {};

  var getWindowDimensions = function (){

    var w, h;

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
  var fontSizeMin = config.defaultFontSizeMinRatio * height;
  var fontSizeMax = config.defaultFontSizeMaxRatio * height;

  var rowSpacing = fontSizeMinRatio*110; // %
  var colSpacing = 90/maxHashtagCols; // %

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
  var blahFlag = false;
  var metricMode = "rate";
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
      if (value.isSessionNode) {
      } 
      else {
        keys.push(key);
      }
    });
    return keys.sort(function(a, b) {
      return hmap.get(b)[sortProperty] - hmap.get(a)[sortProperty]
    });
  }

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


  console.log("width: " + width + " | height: " + height);

  document.addEventListener("mousemove", function() {
    if (mouseHoverFlag) {
      d3.select("body").style("cursor", "pointer");
    } else {
      d3.select("body").style("cursor", "default");
    }
  }, true);

  // var defaultRadiusScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minRadius, maxRadius]).clamp(true);
  var defaultRadiusScale = d3.scaleLinear()
    .domain([1, currentMaxRate])
    .range([minRadius, maxRadius])
    .clamp(true);

  var nodeLabelSizeScale = d3.scaleLinear()
    // .domain([1, currentMaxMentions])
    .domain([1, currentMaxRate])
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

  var panzoomElement = document.getElementById('svgTreemapLayoutArea');
  panzoom(panzoomElement, {zoomSpeed: 0.030});

//============TREEMAP=================================

  var nodeSvgGroup = svgTreemapLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  // var nodeCircles = nodeSvgGroup.selectAll("circle");
  var nodeLabelSvgGroup = svgTreemapLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");
  var nodeTopTermLabelSvgGroup = svgTreemapLayoutArea.append("svg:g").attr("id", "nodeTopTermLabelSvgGroup");
  // var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

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
    if (isNaN(randomInt)) {
      console.error("randomIntFromInterval NaN"
        + " | MIN: " + min
        + " | MAX: " + max
      );
    }
    return randomInt;
  };

  d3.select("body").style("cursor", "default");

  
  this.deleteNode = function() {
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

  this.setMetric = function(mode) {
    metricMode = mode;
    console.debug("SET METRIC: " + metricMode);
  };

  this.setBlah = function(flag) {
    blahFlag = flag;
    console.debug("SET BLAH: " + blahFlag);
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
  }

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
  }

  self.updateTransitionDuration = function(value) {
    console.debug("UPDATE TRANSITION DURATION: " + value);
    transitionDuration = value;
    config.defaultTransitionDuration = value;
  }

  self.updateCharge = function(value) {
    console.debug("UPDATE CHARGE: " + value);
    config.defaultCharge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  }

  self.updateFontSizeMinRatio = function(value) {
    console.debug("UPDATE FONT MIN SIZE: " + value);
    config.defaultFontSizeMinRatio = value;
    fontSizeMinRatio = value;
    fontSizeMin = value * height;
    rowSpacing = value * 110; // %
    nodeLabelSizeScale = d3.scaleLinear()
      // .domain([1, currentMaxMentions])
      .domain([1, currentMaxRate])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);
  }

  self.updateFontSizeMaxRatio = function(value) {
    console.debug("UPDATE FONT MAX SIZE: " + value);
    config.defaultFontSizeMaxRatio = value;
    fontSizeMaxRatio = value;
    fontSizeMax = value * height;
    nodeLabelSizeScale = d3.scaleLinear()
      // .domain([1, currentMaxMentions])
      .domain([1, currentMaxRate])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);
  }


  self.resetDefaultForce = function() {
    console.warn("RESET TREEPACK DEFAULT FORCE");
    self.updateTransitionDuration(config.defaultTransitionDuration);
    self.setNodeMaxAge(config.defaultMaxAge);
    self.updateCharge(config.defaultCharge);
    self.updateVelocityDecay(config.defaultVelocityDecay);
    self.updateGravity(config.defaultGravity);
  }

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

      age = node.age 
        + (ageRate * (moment().valueOf() - node.ageUpdated));

      ageMaxRatio = age/nodeMaxAge ;

      if (node.isDead 
        || (removeDeadNodesFlag && (age >= nodeMaxAge))
        ) {

        // localNodeHashMap.remove(node.nodeId);
        delete localNodeHashMap[node.nodeId];

        nodesTopTermHashMap.remove(node.nodeId);

        nodes.splice(ageNodesIndex, 1);
        // console.debug("X NODE"
        //   + " | NODES: " + nodes.length
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

        nodes[ageNodesIndex] = node;

        // localNodeHashMap.set(node.nodeId, node);
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


      maxRateMentionsNode.age = 0;
      maxRateMentionsNode.rate = currentMaxRate;
      maxRateMentionsNode.mentions = currentMaxMentions;
      maxRateMentionsNode.ageMaxRatio = 0;
      maxRateMentionsNode.isTrendingTopic = true;
      maxRateMentionsNode.displaytext = createDisplayText(maxRateMentionsNode);
      maxRateMentionsNode.mouseHoverFlag = false;

      nodesTopTermHashMap.set(maxRateMentionsNode.nodeId, maxRateMentionsNode);

      rankHashMapByValue(nodesTopTermHashMap, "rate", function(){
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
      case 'hashtag':
        tooltipString = "#" + d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>KEYWORDS: " + jsonPrint(d.keywords);
      break;
      case 'word':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>KEYWORDS: " + jsonPrint(d.keywords)
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>URL: " + d.url;
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
      case "hashtag" :
        // url = "https://twitter.com/search?f=realtime&q=%23" + d.text ;
        url = "https://twitter.com/search?f=tweets&q=%23" + d.text ;
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

      // if (index >= MAX_NODES){
      //   entry.isDead = true;
      //   hmap.set(key, entry);
      //   cb();
      // }
      // else {
        hmap.set(key, entry);
        cb();
      // }
      // console.debug("key " + key);
      // console.debug("entry\n" + jsonPrint(entry));

      // console.debug("TOP 10"
      //   + " | " + entry.nodeId
      //   + " | " + entry.rank
      //   + " | " + entry.rate.toFixed(2)
      // );

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
      .style("font-size", fontSizeMin)
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
      .style("font-size", fontSizeMin);

      callback(null, null);
  };

  var updateNodeCircles = function(callback) {

    var nodeCircles = nodeSvgGroup.selectAll("circle")
      .data(nodes, function(d){
        return d.nodeId;
      });

    nodeCircles
      .enter()
      .append("circle")
      .attr("nodeId", function(d) { return d.nodeId; })
      .attr("cx", function(d) { 
        if (!d.nodeId) { 
          console.warn("UNDEFINED d.nodeId");
          d.x = 0.5*width; 
          return 0.5*width; 
        }
        if (isNaN(d.x)) { 
          console.warn("NaN d.x " + d.nodeId);
          d.x = 0.5*width; 
          return 0.5*width; 
        }
        return d.x; 
      })
      .attr("cy", function(d) { 
        if (!d.nodeId) { 
          console.warn("UNDEFINED d.nodeId");
          d.y = 0.5*height;
          return 0.5*height; 
        }
        if (isNaN(d.y)) { 
          console.warn("NaN d.y " + d.nodeId);
          d.y = 0.5*height;
          return 0.5*height;
        }
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
            d.r = defaultRadiusScale(1);
            return d.r;
          }
          else {
            // d.r = defaultRadiusScale(parseInt(d.mentions));
            d.r = defaultRadiusScale(parseInt(d.rate));
            return d.r;
          }
        });

    nodeCircles
      .attr("cx", function(d) { 
        // console.debug("typeof d.x: " + typeof d.x + " | " + d.x);
        if (!d.nodeId) { 
          console.warn("UNDEFINED d.nodeId");
          d.x = 0.5*width; 
          return 0.5*width; 
        }
        if (isNaN(d.x)) { 
          console.warn("NaN d.x " + d.nodeId);
          d.x = 0.5*width; 
          return 0.5*width; 
        }
        return d.x; 
      })
      .attr("cy", function(d) { 
        if (!d.nodeId) { 
          console.warn("UNDEFINED d.nodeId");
          d.y = 0.5*height; 
          return 0.5*height; 
        }
        if (isNaN(d.y)) { 
          console.warn("NaN d.y " + d.nodeId);
          d.y = 0.5*height; 
          return 0.5*height; 
        }
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
            return defaultRadiusScale(1);
          }
          else {
            // return defaultRadiusScale(parseInt(d.mentions));
            return defaultRadiusScale(parseInt(d.rate));
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
      .attr("x", function(d) { 
        if (!d.nodeId) { 
          console.warn("UNDEFINED d.nodeId");
          return 0.5*width; }
        if (d.x === undefined) { 
          console.warn("UNDEFINED d.x " + d.nodeId);
          return 0.5*width; 
        }
        return d.x; 
      })
      .attr("y", function(d) { 
        if (!d.nodeId) { 
          console.warn("UNDEFINED d.nodeId");
          return 0.5*height; 
        }
        if (d.y === undefined) { 
          console.warn("UNDEFINED d.y " + d.nodeId);
          return 0.5*height; 
        }
        return d.y; 
      })
      .text(function(d) {
        if (d.isTwitterUser) { return "@" + d.screenName.toUpperCase(); }
        if (d.isKeyword || d.isTrendingTopic || d.isTwitterUser) { return d.nodeId.toUpperCase(); }
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
        // if (d.mouseHoverFlag) { return 1.0; }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("fill", palette.white)
      .style("font-size", function(d) {
        // return nodeLabelSizeScale(d.mentions);
        return nodeLabelSizeScale(d.rate);
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
        if (!d.nodeId) { 
          console.warn("UNDEFINED d.nodeId");
          return 0.5*width; }
        if (d.x === undefined) { 
          console.warn("UNDEFINED d.x " + d.nodeId);
          return 0.5*width; 
        }
        return d.x; 
      })
      .attr("y", function(d) { 
        if (!d.nodeId) { 
          console.warn("UNDEFINED d.nodeId");
          return 0.5*height; 
        }
        if (d.y === undefined) { 
          console.warn("UNDEFINED d.y " + d.nodeId);
          return 0.5*height; 
        }
        return d.y; 
      })
      .text(function(d) {
        if (d.isTwitterUser) { return "@" + d.screenName.toUpperCase(); }
        if (d.isKeyword || d.isTrendingTopic || d.isTwitterUser) { return d.nodeId.toUpperCase(); }
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
        // if (d.mouseHoverFlag) { return 1.0; }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("fill", palette.white)
      .style("font-size", function(d) {
        // return nodeLabelSizeScale(d.mentions);
        return nodeLabelSizeScale(d.rate);
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
        break;
      case "right":
        return({
          x: randomIntFromInterval(xMinRatioRight*width, xMaxRatioRight*width), 
          y: randomIntFromInterval(yMinRatioRight*height, yMaxRatioRight*height)
        });
        break;
      case "positive":
        return({
          x: randomIntFromInterval(xMinRatioPositive*width, xMaxRatioPositive*width), 
          y: randomIntFromInterval(yMinRatioPositive*height, yMaxRatioPositive*height)
        });
        break;
      case "negative":
        return({
          x: randomIntFromInterval(xMinRatioNegative*width, xMaxRatioNegative*width), 
          y: randomIntFromInterval(yMinRatioNegative*height, yMaxRatioNegative*height)
        });
        break;
      case "neutral":
        return({
          x: randomIntFromInterval(xMinRatioNeutral*width, xMaxRatioNeutral*width), 
          y: randomIntFromInterval(yMinRatioNeutral*height, yMaxRatioNeutral*height)
        });
        break;
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

    if (node.isTwitterUser) { 
      displaytext = new Array(ratePadSpaces).join("\xa0") + rate + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns + " | " + node.screenName.toUpperCase() ;
    }
    else if (testMode) { 
      displaytext = new Array(ratePadSpaces).join("\xa0") + rate + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns + " | BLAH" ;
    }
    else { 
      displaytext = new Array(ratePadSpaces).join("\xa0") + rate + " | " + new Array(mentionPadSpaces).join("\xa0") + mntns + " | " + node.nodeId.toUpperCase() ;
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
        // currentNode.mentions = newNode.mentions || 1;
        currentNode.mentions = Math.max(currentNode.mentions, newNode.mentions || 1);
        currentNode.mouseHoverFlag = false;
        currentNode.rank = 0;
        currentNode.rate = newNode.rate || 0;
        currentNode.displaytext = createDisplayText(currentNode);

        if (currentNode.isKeyword) {
          // console.warn("keywords: " + newNode.nodeId + "\n" + jsonPrint(newNode.keywords));
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

        nodes.push(currentNode)
        // console.info("MISS currentNode\n" + jsonPrint(currentNode));
        callback(null, nodesModifiedFlag);
      }


      // if (newNode.mentions > currentHashtagMaxMentions) {
      //   currentHashtagMaxMentions = newNode.mentions;
      // if (newNode.rate > currentMaxRate) {
      //   currentMaxRate = newNode.rate;

      //   nodeLabelSizeScale = d3.scaleLinear()
      //     // .domain([1, currentMaxMentions])
      //     .domain([1, currentMaxRate])
      //     .range([fontSizeMin, fontSizeMax])
      //     .clamp(true);

      //   defaultRadiusScale = d3.scaleLinear()
      //     .domain([1, currentMaxRate])
      //     .range([minRadius, maxRadius])
      //     .clamp(true);

      //   console.info("NEW MAX Ms" 
      //     + " | " + currentHashtagMaxMentions 
      //     + " | " + currentNode.nodeType 
      //     + " | " + currentNode.text 
      //   );
      // }

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

    if ((nNode.nodeType === "word") && !nNode.isKeyword) { 
      return;
    }

    var newNode = {};
    newNode = nNode;
    newNode.rank = -1;
    newNode.newFlag = true;

    if (nNode.mentions > currentMaxMentions) { 

      currentMaxMentions = nNode.mentions; 

      // nodeLabelSizeScale = d3.scaleLinear()
      //   // .domain([1, currentMaxMentions])
      //   .domain([1, currentMaxRate])
      //   .range([fontSizeMin, fontSizeMax])
      //   .clamp(true);

      // defaultRadiusScale = d3.scaleLinear()
      //   .domain([1, currentMaxRate])
      //   .range([minRadius, maxRadius])
      //   .clamp(true);

      console.info("NEW MAX MENTIONS: " + currentMaxMentions);
    }

    if (nNode.rate > currentMaxRate) { 
      
      currentMaxRate = nNode.rate; 

      nodeLabelSizeScale = d3.scaleLinear()
        .domain([1, currentMaxRate])
        .range([fontSizeMin, fontSizeMax])
        .clamp(true);

      defaultRadiusScale = d3.scaleLinear()
        .domain([1, currentMaxRate])
        .range([minRadius, maxRadius])
        .clamp(true);

      console.info("NEW MAX RATE: " + currentMaxRate.toFixed(2) + " | " + nNode.nodeId);
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
        // return 0.5*height; 
      }).strength(function(d){
        return forceYmultiplier * gravity; 
      }))
      .force("collide", d3.forceCollide().radius(function(d) { 
        // return collisionRadiusMultiplier * defaultRadiusScale(d.mentions) ; 
        return collisionRadiusMultiplier * defaultRadiusScale(d.rate) ; 
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

    // defaultRadiusScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minRadius, maxRadius]).clamp(true);
    defaultRadiusScale = d3.scaleLinear()
    .domain([1, currentMaxRate])
    .range([minRadius, maxRadius])
    .clamp(true);

    fontSizeMin = fontSizeMinRatio * height;
    fontSizeMax = fontSizeMaxRatio * height;
    rowSpacing = fontSizeMinRatio*110; // %

    nodeLabelSizeScale = d3.scaleLinear()
      // .domain([1, currentMaxMentions])
      .domain([1, currentMaxRate])
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
          // return collisionRadiusMultiplier * defaultRadiusScale(d.mentions) ; 
          return collisionRadiusMultiplier * defaultRadiusScale(d.rate) ; 
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