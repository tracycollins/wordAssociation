/*jslint node: false */
// "use strict";


function ViewHistogram() {

  "use strict";

  var self = this;

  var testMode = false;
  var freezeFlag = false;
  // var mouseMovingFlag = false;

  var MAX_NODES = 125;
  var NEW_NODE_AGE_RATIO = 0.02;
  var fontSizeRatio = 0.022;
  var minOpacity = 0.25;
  var blahFlag = false;
  var antonymFlag = false;
  var removeDeadNodesFlag = true;

  var defaultPosDuration = 50;

  var hashtagTopMargin = 15; // %
  var hashtagLeftMargin = 10; // %
  // var hashtagColMargin = 10;

  var maxHashtagRows = 25;
  var maxHashtagCols = 5;
  var rowSpacing = 3; // %
  var colSpacing = 90/maxHashtagCols; // %

  var DEFAULT_AGE_RATE = 1.0;
  var MAX_RX_QUEUE = 100;

  var localNodeHashMap = new HashMap();

  var processNodeCount = 0;

  var maxNodeAddQ = 0;
  var maxNumberNodes = 0;
  var runningFlag = false;
  
  var nodeAddQ = [];
  var nodeDeleteQ = [];

  var width = window.innerWidth * 0.9;
  var height = window.innerHeight * 0.9;

  self.getWidth = function() {
    return window.innerWidth;
  };

  self.getHeight = function() {
    return window.innerHeight;
  };

  var mouseHoverFlag = false;

  var nodeMaxAge = 60000;

  var DEFAULT_HISTOGRAM_CONFIG = {
    'ageRate': window.DEFAULT_AGE_RATE
  };

  var ageRate = DEFAULT_HISTOGRAM_CONFIG.ageRate;
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

  var currentHashtagMaxMentions = 2;


  var deadNodesHash = {};

  console.log("width: " + window.innerWidth + " | height: " + window.innerHeight);

  var fontSize = fontSizeRatio * window.innerHeight;

  document.addEventListener("mousemove", function() {
    if (mouseHoverFlag) {
      d3.select("body").style("cursor", "pointer");
    } else {
      d3.select("body").style("cursor", "default");
    }
  }, true);

  var nodeLabelOpacityScale = d3.scaleLinear()
    .domain([1e-6, 0.1, 1.0])
    .range([1.0, 0.4, minOpacity])
    .clamp(true);
  var adjustedAgeRateScale = d3.scaleLinear()
    .domain([1, MAX_NODES])
    .range([1.0, 10.0]);

  console.log("@@@@@@@ CLIENT @@@@@@@@");

  // function jsonPrint(obj) {
  //   if ((obj) || (obj === 0)) {
  //     var jsonString = JSON.stringify(obj, null, 2);
  //     return jsonString;
  //   } else {
  //     return "UNDEFINED";
  //   }
  // }

  var randomIntFromInterval = function(min, max) {
    var random = Math.random();
    var randomInt = Math.floor((random * (max - min + 1)) + min);
    return randomInt;
  };

  d3.select("body").style("cursor", "default");

  var nodes = [];
  
  this.getNodesLength = function() {
    return nodes.length;
  };
  
  this.getMaxNodes = function() {
    return maxNumberNodes;
  };
  
  this.getNodeAddQlength = function() {
    return nodeAddQ.length;
  };
  
  this.getMaxNodeAddQ = function() {
    return maxNodeAddQ;
  };
    
  this.getAgeRate = function() {
    return ageRate;
  };
  
  this.getMaxAgeRate = function() {
    return maxAgeRate;
  };
  
  this.setAntonym = function(flag) {
    antonymFlag = flag;
    console.debug("SET ANTONYM: " + antonymFlag);
  };

  this.setBlah = function(flag) {
    blahFlag = flag;
    console.debug("SET BLAH: " + blahFlag);
  };

  this.setNodeMaxAge = function(maxAge) {
    nodeMaxAge = maxAge;
    console.debug("SET NODE MAX AGE: " + nodeMaxAge);
  };

  this.setRemoveDeadNodesFlag = function(flag) {
    removeDeadNodesFlag = flag;
    console.debug("SET REMOVE DEAD NODES: " + removeDeadNodesFlag);
  };

  this.setTestMode = function(flag){
    testMode = flag;
    console.debug("SET TEST MODE: " + testMode);
  };

  var d3image = d3.select("#d3group");

  var svgMain = d3image.append("svg:svg")
    .attr("id", "svgMain")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var svgForceLayoutArea = svgMain.append("g")
    .attr("id", "svgForceLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", 1e-6, 1e-6, width, height)
    // .attr("preserveAspectRatio", "none")
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var nodeSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

  self.toolTipVisibility = function(isVisible){
    if (isVisible) {
      divTooltip.style("visibility", "visible");
    }
    else {
      divTooltip.style("visibility", "hidden");
    }
  };

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

  function rankHashMapByValue(hmap, sortProperty, callback) {
    // console.debug("rankHashMapByValue");
    var keys = hmap.keys().sort(function(a,b){
      return hmap.get(b)[sortProperty]-hmap.get(a)[sortProperty];
    });

    async.forEachOf(keys, function(key, index, cb) {

      var entry = hmap.get(key);
      entry.rank = index;

      if (index >= MAX_NODES){
        entry.isDead = true;
        hmap.set(key, entry);
        cb();
      }
      else {
        hmap.set(key, entry);
        cb();
      }
      // console.debug("key " + key);
    }, function(err) {
      if (err) { console.error("rankHashMapByValue ERROR: " + err); }
      callback(hmap);
    });
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

      if (localNodeHashMap.has(node.nodeId)){
        nodeObj = localNodeHashMap.get(node.nodeId);
        node.rank = nodeObj.rank;
      }

      age = node.age 
        + randomIntFromInterval(10,100) 
        + (ageRate * (moment().valueOf() - node.ageUpdated));

      ageMaxRatio = age/nodeMaxAge ;

      if (node.isDead || (removeDeadNodesFlag && (age >= nodeMaxAge))) {
        localNodeHashMap.remove(node.nodeId);
        nodes.splice(ageNodesIndex, 1);
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
        nodes[ageNodesIndex] = node;
        localNodeHashMap.set(node.nodeId, node);
      }
    }

    if (ageNodesIndex < 0) {
      rankHashMapByValue(localNodeHashMap, "mentions", function(){
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
        localNodeHashMap.remove(node.nodeId);
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

    var tooltipString;

    switch (d.nodeType) {
      case 'hashtag':
        tooltipString = "#" + d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>RANK: " + d.rank;
      break;
      case 'word':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>RANK: " + d.rank
          + "<br>Ms: " + d.mentions
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
  }

  function nodeClick(d) {

    var url = "";

    switch (d.nodeType) {
      case "hashtag" :
        url = "https://twitter.com/search?f=realtime&q=%23" + d.text ;
        window.open(url, '_blank');
      break;
    }
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


  var updateNodeLabels = function(callback) {

    nodeLabels = nodeLabelSvgGroup.selectAll("text")
      .data(nodes, function(d) { return d.nodeId; });

    nodeLabels
      .exit()
      .attr("class", "exit")
        .remove();

    nodeLabels
      .attr("class", "update")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .text(function(d) {
        if (d.isTwitterUser) { return "@" + d.screenName.toUpperCase(); }
        if (d.isKeyword || d.isTrendingTopic || d.isTwitterUser) { return d.nodeId.toUpperCase(); }
        if (testMode) { return "blah"; }
        return d.nodeId; 
      })
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
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .transition()
        .duration(defaultPosDuration)
        .attr("x", xposition)
        .attr("y", yposition);

    nodeLabels
      .enter().append("text")
      .attr("class", "enter")
      .style("text-anchor", "left")
      .style("alignment-baseline", "bottom")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .attr("x", xposition)
      .attr("y", yposition)
      .text(function(d) {
        if (d.isTwitterUser) { return "@" + d.screenName.toUpperCase(); }
        if (d.isKeyword || d.isTrendingTopic || d.isTwitterUser) { return d.nodeId.toUpperCase(); }
        if (testMode) { return "blah"; }
        return d.nodeId; 
      })
      .style("font-weight", function(d) {
        if (d.isTwitterUser 
          || d.isKeyword 
          || d.isNumber 
          || d.isCurrency 
          || d.isTrendingTopic) {
          return "bold";
        }
        return "normal";
      })
      .style('opacity', function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style('fill', palette.white)
      .style("font-size", fontSize)
      .transition()
        .duration(defaultPosDuration)
        .attr("y", yposition);

      callback(null, null);
  };

  var processNodeAddQ = function(callback) {

    var nodesModifiedFlag = false;

    processNodeCount = processNodeCount+1;

    var nodeAddObj;
    var newNode;
    var currentNode;

    if (nodeAddQ.length > 0) {

      nodesModifiedFlag = false;

      processNodeCount = processNodeCount+1;

      nodeAddObj = nodeAddQ.shift();
      newNode = nodeAddObj.node;
      currentNode = {};

      if (localNodeHashMap.has(newNode.nodeId)){
        currentNode = localNodeHashMap.get(newNode.nodeId);
        currentNode.newFlag = true;
        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
      }
      else {
        nodesModifiedFlag = true;
        currentNode = newNode;
        currentNode.newFlag = true;
        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
      }

      currentNode.mentions = newNode.mentions;
      currentNode.ageUpdated = moment().valueOf();

      if (newNode.mentions > currentHashtagMaxMentions) {
        currentHashtagMaxMentions = newNode.mentions;
        console.info("NEW MAX Ms" 
          + " | " + currentHashtagMaxMentions 
          + " | " + currentNode.nodeType 
          + " | " + currentNode.text 
        );
      }

      if (nodesModifiedFlag) { nodes.push(currentNode); }

      localNodeHashMap.set(currentNode.nodeId, currentNode);

      if (nodes.length > maxNumberNodes) {
        maxNumberNodes = nodes.length;
      }

    }

    callback(null, nodesModifiedFlag);
  };

  var updateReady = true;

  function update() {

    updateReady = false;

    if (runningFlag){
      async.series(
        {
          deadNode: processDeadNodesHash,
          addNode: processNodeAddQ,
          ageNode: ageNodes,
          updateNodeLabels: updateNodeLabels
        },
        function(err) {
          if (err) { console.error("update ERROR: " + err); }
          updateReady = true;
        }
      );
    }
    else {
      async.series(
        {
          updateNodeLabels: updateNodeLabels
        },
        function(err) {
          if (err) { console.error("update ERROR: " + err); }
          updateReady = true;
        }
      );
    }

  }

  this.setChargeSliderValue = function(){
  };

  this.addNode = function(nNode) {

    if (((nNode.nodeType !== "hashtag") && (nNode.nodeType !== "word") && (nNode.nodeType !== "user")) 
      || nNode.isIgnored) { 
      return;
    }

    if (nNode.nodeType === "user") { console.debug("USER: " + nNode.nodeId); }

    var newNode = {};
    newNode = nNode;
    newNode.newFlag = true;

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

  // var localSessionHashMap = {};

  this.initD3timer = function() {
    // simulation = d3.forceSimulation(nodes)
    //   .on("tick", ticked);
  };

  this.simulationControl = function(op) {
    switch (op) {
      case 'RESET':
        console.debug("SIMULATION CONTROL | OP: " + op);
        self.reset();
        runningFlag = false;
      break;
      case 'START':
        console.debug("SIMULATION CONTROL | OP: " + op);
        runningFlag = true;
      break;
      case 'RESUME':
        console.debug("SIMULATION CONTROL | OP: " + op);
        runningFlag = true;
      break;
      case 'FREEZE':
        console.debug("SIMULATION CONTROL | OP: " + op);
        if (!freezeFlag){
          freezeFlag = true;
        }
      break;
      case 'PAUSE':
        console.debug("SIMULATION CONTROL | OP: " + op);
        runningFlag = false;
      break;
      case 'STOP':
        console.debug("SIMULATION CONTROL | OP: " + op);
        runningFlag = false;
      break;
      case 'RESTART':
        // console.debug("SIMULATION CONTROL | OP: " + op);
        runningFlag = true;
      break;
      default:
        console.error("???? SIMULATION CONTROL | UNKNOWN OP: " + op);
    }
  };

  this.resize = function() {
    console.info("RESIZE");

    d3image = d3.select("#d3group");

    if (window.innerWidth !== 'undefined') {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    else if (document.documentElement !== 'undefined' 
      && document.documentElement.clientWidth !== 'undefined' 
      && document.documentElement.clientWidth !== 0) {
      width = document.documentElement.clientWidth;
      height = document.documentElement.clientHeight;
    }
    // older versions of IE
    else {
      width = document.getElementsByTagName('body')[0].clientWidth;
      height = document.getElementsByTagName('body')[0].clientHeight;
    }

    console.log("width: " + width + " | height: " + height);

    fontSize = fontSizeRatio * window.innerHeight;

    // d3LayoutWidth = width; // double the width for now
    // d3LayoutHeight = height;

    svgForceLayoutArea
      .attr("width", width)
      .attr("height", height)
      .attr("viewbox", 1e-6, 1e-6, width, height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);
  };

  // ==========================================

  document.addEventListener("resize", function() {
    self.resize();
  }, true);

  self.reset = function() {
    console.info("RESET");

    nodes = [];

    deadNodesHash = {};
    // mouseMovingFlag = false;
    mouseHoverFlag = false;
    self.toolTipVisibility(false);
    self.resize();
  };

  setInterval(function(){
    if (updateReady) { update(); }
  }, 50);
}