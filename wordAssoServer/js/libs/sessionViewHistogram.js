/*ver 0.47*/
/*jslint node: true */


function ViewHistogram() {

  "use strict";

  var self = this;

  var maxHashtagRows = 25;
  var maxRecentHashtags = maxHashtagRows ;

  var DEFAULT_AGE_RATE = 1.0;
  var MAX_RX_QUEUE = 100;

  var d3LayoutWidth;
  var d3LayoutHeight;

  var mouseHoverNodeId;

  var localNodeHashMap = new HashMap();

  var MAX_NODES = 47;
  var processNodeCount = 0;
  var processNodeModulus = 3;

  var maxNodeAddQ = 0;
  var maxNumberNodes = 0;

  var simulation;
  var gravity = 0;

  var runningFlag = false;
  
  var nodeAddQ = [];
  // var nodeUpdateQ = [];
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

  var minFontSize = 20;
  var maxFontSize = 30;

  var deadNodesHash = {};

  console.log("width: " + window.innerWidth + " | height: " + window.innerHeight);

  document.addEventListener("mousemove", function() {
    if (mouseHoverFlag) {
      d3.select("body").style("cursor", "pointer");
    } else {
      d3.select("body").style("cursor", "default");
    }
  }, true);

  var nodeLabelOpacityScale = d3.scaleLinear().domain([1e-6, 1.0]).range([1.0, 1e-6]);

  var adjustedAgeRateScale = d3.scaleLinear().domain([1, MAX_NODES]).range([1.0, 10.0]);

  var nodeFontSizeScale = d3.scaleLinear().domain([1, 1000000]).range([minFontSize, maxFontSize]);
  var defaultRadiusScale = d3.scaleLog().domain([1, 10000000]).range([5, 30]).clamp(true);

  console.log("@@@@@@@ CLIENT @@@@@@@@");

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
  
  this.setNodeMaxAge = function(maxAge) {
    nodeMaxAge = maxAge;
    console.debug("SET NODE MAX AGE: " + nodeMaxAge);
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

  var deleteNodeQ = function (nodeId){

    var deadNodeFlag = false;

    var nodesLength = nodes.length - 1;

    var node;

    var nodeIndex = nodesLength;

    for (nodeIndex = nodesLength; nodeIndex >= 0; nodeIndex -= 1) {

      node = nodes[nodeIndex];

      if (node.nodeId === nodeId) {
        nodes.splice(nodeIndex, 1);
        deadNodeFlag = true;
        return deadNodeFlag;
      }
    }
    if (nodeIndex < 0) {
      nodes.splice(nodeIndex, 1);
      console.debug("XXX NODE NOT FOUND ??? " + nodeId);
      return deadNodeFlag;
    }
  };

  var processNodeDeleteQ = function(callback) {

    var nodesModifiedFlag = false;
    var nodeDeleteObj;

    while (nodeDeleteQ.length > 0){

      nodeDeleteObj = nodeDeleteQ.shift();

      switch (nodeDeleteObj.op) {

        case "delete":
          nodesModifiedFlag = deleteNodeQ(nodeDeleteObj.nodeId);

        break;

        default:
          console.error("??? UNKNOWN NODE DELETE Q OP: " + nodeDeleteObj.op);

      }
    }

    if (nodeDeleteQ.length === 0){
      callback(null, nodesModifiedFlag);
    }
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
      // return (callback(null, deadNodeFlag));
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
        if (nodeObj.newFlag) {
          node.age = 1e-6;
          node.ageUpdated = moment().valueOf();
          node.isDead = false;
          node.newFlag = false;
          localNodeHashMap.set(node.nodeId, node);
        }
      }

      age = node.age + randomIntFromInterval(10,100) + (ageRate * (moment().valueOf() - node.ageUpdated));
      ageMaxRatio = age/nodeMaxAge ;

      if (node.isDead) {
        deadNodesHash[node.nodeId] = 1;
        node.ageMaxRatio = 1.0;
        deadNodeFlag = true;
        localNodeHashMap.set(node.nodeId, node);
      } 
      else if (age >= nodeMaxAge) {
        node.ageUpdated = moment().valueOf();
        node.age = age;
        node.ageMaxRatio = 1.0;
        node.isDead = true;
        nodes[ageNodesIndex] = node;
        deadNodesHash[node.nodeId] = 1;
        deadNodeFlag = true;
        localNodeHashMap.set(node.nodeId, node);
      } 
      else {
        node.ageUpdated = moment().valueOf();
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;
        node.isDead = false;
        nodes[ageNodesIndex] = node;
        localNodeHashMap.set(node.nodeId, node);
      }
    }

    if (ageNodesIndex < 0) {
      callback(null, deadNodeFlag);
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

  function updateHashtags(htMnObjData, recentHtObjData) {

    var hashtag = svgHashtag.selectAll("#hashtag")
        .data(htMnObjData, function(d) { return (d.nodeId); });

    var recentHashtag = svgRecentHashtag.selectAll("#recentHashtag")
        .data(recentHtObjData, function(d) { return (d.nodeId); });

    hashtag.attr("class", function(d) { return d.newFlag ? "updateNew" : "update"; })
      .text(function(d) { return d.displaytext; })
      .style("fill", function(d) { return d.newFlag ? "red" : "#ffffff"; })
      .style("fill-opacity", function(d) {
        if (d3.select(this).attr("mouseOverFlag") == "true") {
          return 1;
        }
        else {
          return hashtagOpacityScale(d.age);
        }
      })
      .on("mouseout", hashtagMouseOut)
      .on("mouseover", hashtagMouseOver)
      .transition()
        .duration(defaultFadeDuration)
        .attr("x", xposition)
        .attr("y", yposition);

    recentHashtag.attr("class", function(d) { return d.newFlag ? "updateNew" : "update"; })
      .text(function(d) { return d.displaytext; })
      .style("fill", function(d) { return d.newFlag ? "red" : "#ffffff"; })
      .style("fill-opacity", function(d) {
        if (d3.select(this).attr("mouseOverFlag") == "true") {
          return 1;
        }
        else {
          return d.newFlag ? 1 : 0.75; 
        }
      })
      .on("mouseout", hashtagMouseOut)
      .on("mouseover", hashtagMouseOver)
      .transition()
        .duration(defaultFadeDuration)
        .attr("x", xposition)
        .attr("y", yposition);

    // ENTER
    // Create new elements as needed.
    hashtag.enter().append("svg:text")
      .attr("id", "hashtag")
      .attr("class", "enter")
      .attr("x", xposition)
      .attr("y", yposition)
      .on("click", function(d){
        window.open("http://twitter.com/search?f=realtime&q=%23" + d.text, '_blank');
      })
      .text(function(d) { return d.displaytext; })
      .style("fill-opacity", 1e-6)
      // .style("font-size", "2.0vmin")
      .style("font-size", "1.0rem")
      .on("mouseout", hashtagMouseOut)
      .on("mouseover", hashtagMouseOver)
      .transition()
        .duration(defaultFadeDuration)
        .style("fill-opacity", 1);


    recentHashtag.enter().append("svg:text")
      .attr("id", "recentHashtag")
      .attr("class", "enter")
      .attr("x", xposition)
      .attr("y", yposition)
      .on("click", function(d){
        window.open("http://twitter.com/search?f=realtime&q=%23" + d.text, '_blank');
      })
      .text(function(d) { return d.displaytext; })
      .on("mouseout", hashtagMouseOut)
      .on("mouseover", hashtagMouseOver)
      .style("font-size", "1.0rem")
      .style("fill-opacity", 1e-6)
      .transition()
        .duration(defaultFadeDuration)
        .attr("x", xposition)
        .attr("y", yposition)
        .style("fill-opacity", 1);

    // EXIT
    // Remove old elements as needed.
    hashtag.exit()
      .attr("class", "exit")
      .transition()
        .duration(defaultFadeDuration)
        .style("fill-opacity", 1e-6)
        .remove();


    recentHashtag.exit()
      .attr("class", "exit")
      .transition()
        .duration(defaultFadeDuration)
        .style("fill-opacity", 1e-6)
        .remove();
  }

  var updateNodeLabels = function(callback) {

    nodeLabels = nodeLabelSvgGroup.selectAll("text")
      .data(nodes.filter(function(d){
        return (
          (d.nodeType === 'hashtag') 
          || (d.nodeType === 'word')
          ); 
      }));

    nodeLabels
      .enter()
      .append("svg:text")
      .style("text-anchor", "middle")
      .style("alignment-baseline", "bottom")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .merge(nodeLabels)
      .text(function(d) {
        if (d.nodeType === 'word') {return d.text;}
        if (d.nodeType === 'hashtag') {return d.nodeId;}
      })
      .attr("x", function(d) { xposition })
      .attr("y", function(d) { yposition })
      .style('opacity', function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style('fill', function(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        return palette.white; 
      })
      .style("font-size", function(d) {
        return (nodeFontSizeScale(d.mentions + 1));
      });

    nodeLabels
      .exit().remove();

    callback();
  };

  var nodeMouseOver = function (d) {

    mouseHoverFlag = true;
    d.mouseHoverFlag = true;
    mouseHoverNodeId = d.nodeId;

    d.fx = d.x;
    d.fy = d.y;

    self.toolTipVisibility(true);

    var tooltipString;

    switch (d.nodeType) {
      case 'tweet':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>MENTIONS: " + d.mentions 
          + "<br>@" + d.user.screenName
          + "<br>" + d.user.name;
      break;
      case 'user':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>" + d.name
          + "<br>@" + d.screenName
          + "<br>Ms: " + d.mentions;
      break;
      case 'media':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>URL: " + d.url;
      break;
      case 'hashtag':
        tooltipString = "#" + d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions;
      break;
      case 'url':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>URL: " + d.url;
      break;
      case 'place':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>URL: " + d.fullName;
      break;
    }

    divTooltip.html(tooltipString)
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");

    updateNodeLabels(function(){});
  };

  function nodeMouseOut(d) {
    mouseHoverFlag = false;
    d.mouseHoverFlag = false;
    mouseHoverNodeId = false;
    self.toolTipVisibility(false);
  }

  function nodeClick(d) {

    var url = "";

    switch (d.nodeType) {
      case "tweet" :
        console.warn("OPEN TWEET URL: " + d.url);
        window.open(d.url, '_blank');
      break;

      case "user" :
        console.warn("OPEN USER URL: " + d.profileUrl);
        window.open(d.profileUrl, '_blank');
      break;

      case "hashtag" :
        url = "https://twitter.com/search?f=realtime&q=%23" + d.text ;
        window.open(url, '_blank');
      break;

      case "place" :
        url = d.sourceUrl ;
        window.open(url, '_blank');
      break;

      case "url" :
        url = d.expandedUrl ;
        window.open(url, '_blank');
      break;

      case "media" :
        url = d.sourceUrl ;
        window.open(url, '_blank');
      break;

    }
  }


  function addNodeEnabled (){
    if (nodes.length < MAX_NODES) {
      // console.debug("processNodeCount"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 2*MAX_NODES) && (processNodeCount % processNodeModulus === 0)) {
      // console.debug("processNodeCount MAX_NODES MOD"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 3*MAX_NODES) && (processNodeCount % (processNodeModulus+1) === 0)) {
      // console.debug("processNodeCount MAX_NODES MOD"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 4*MAX_NODES) && (processNodeCount % (processNodeModulus+2) === 0)) {
      // console.debug("processNodeCount MAX_NODES MOD 2"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 8*MAX_NODES) && (processNodeCount % (processNodeModulus+3) === 0)) {
      // console.debug("processNodeCount MAX_NODES MOD 8"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else {
      // console.info("processNodeCount MAX_NODES"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return false;
    }
  }

  var processNodeAddQ = function(callback) {

    var nodesModifiedFlag = false;

    processNodeCount = processNodeCount+1;

    var nodeAddObj;
    var newNode;
    var currentNode;

    while ((nodeAddQ.length > 0) && (addNodeEnabled() || (nodeAddQ[0].nodeType === "tweet"))) {

      nodesModifiedFlag = false;

      processNodeCount = processNodeCount+1;

      nodeAddObj = nodeAddQ.shift();
      newNode = nodeAddObj.node;
      currentNode = {};

      // console.warn("processNodeAddQ | " + newNode.nodeType + " | " + newNode.nodeId);

      switch (nodeAddObj.op) {

        case "add":

          if (localNodeHashMap.has(newNode.nodeId)){
            // console.error("localNodeHashMap HIT: " + newNode.nodeId);
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
            currentNode.x = randomIntFromInterval(0.45 * width, 0.55 * width);
            currentNode.y = randomIntFromInterval(0.45 * height, 0.55 * height);
            // if (newNode.nodeType === "tweet"){
            // }
          }

          currentNode.mentions = newNode.mentions;
          currentNode.ageUpdated = moment().valueOf();

          if ((newNode.nodeType === "hashtag") && (newNode.mentions > currentHashtagMaxMentions)){
            currentHashtagMaxMentions = newNode.mentions;
            // nodeFontSizeScale = d3.scaleLinear().domain([1, currentHashtagMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);
            console.info("NEW MAX Ms" 
              + " | " + currentHashtagMaxMentions 
              + " | " + currentNode.nodeType 
              + " | " + currentNode.text 
            );
          }

          if (nodesModifiedFlag) {
            nodes.push(currentNode);
          }

          localNodeHashMap.set(currentNode.nodeId, currentNode);

          if (nodes.length > maxNumberNodes) {
            maxNumberNodes = nodes.length;
          }

        break;

        default:
          console.error("??? UNKNOWN NODE UPDATE Q OP: " + nodeAddObj.op);
      }
    }

    if ((nodeAddQ.length === 0) || !addNodeEnabled()){
      callback(null, nodesModifiedFlag);
    }
  };

  function xposition(d,i){
    var value ;

    switch (this.getAttribute("id")) {
      case 'hashtag' :
        if (i < maxHashtagRows) {
          value = 3;
        }
        else {
          value = 28;
        }
      break;

      case 'place' :
        if (i < maxPlaceRows) {
          value = 5;
        }
        else {
          value = 33;
        }
      break;

      case 'hashtagbar' :
        value = 75 - hashtagBarWidthScale(d.mentions.toString());
      break;

      case 'hashtagbarlabel' :
        value = 5;
        // value = hashtagBarWidthScale(d.mentions.toString());
      break;

      case 'recentHashtag' :
        value = 66; 
      break;

      case 'recentPlace' :
        value = 66; 
      break;

      case 'media':
        value = 10 + (i * (mediaSize + mediaMargin))
        return value + "px";
      break;

      case 'ig_media':
        value = 10 + (i * (mediaSize + mediaMargin))
        return value + "px";
      break;

      case 'recentMedia':
        value = 10 + (i * (mediaSize + mediaMargin));
        return value + "px";
      break;

      default:
        value = 33;
    }

    return value + "%";
  }

  function yposition(d,i){
    var value ;

    switch (d.nodeType) {
      case 'hashtag':
        if (i < maxHashtagRows) {
          value = hashtagTopMargin + (i * 3);
        }
        else {
          value = hashtagTopMargin + ((i-maxHashtagRows) * 3)
        }
        return value + "%";
      break;

      case 'place':
        if (i < maxPlaceRows) {
          value = placeTopMargin + (i * 3);
        }
        else {
          value = placeTopMargin + ((i-maxPlaceRows) * 3)
        }
        return value + "%";
      break;

     case 'media' :
      if (this.getAttribute("id") == 'recentMedia') {
        return "85%"; 
      }
      else {
        return "90%"; 
      }
      break;

     case 'ig_media' :
      if (this.getAttribute("id") == 'recentMedia') {
        return "85%"; 
      }
      else {
        return "90%"; 
      }
      break;

      default:
    }
  }

  function ticked() {
    drawSimulation(function(){
      updateSimulation(function(){});
    });
  }
  function drawSimulation(callback){

    async.parallel(
      {
        udnl: updateNodeLabels
      },

      function(err, results) {
        if (err) {
          console.error("*** ERROR: drawSimulation *** \nERROR: " + err);
          callback(err);
        }
        else {
          callback();
        }
      }

    );
  }

  function updateSimulation(callback) {

    async.series(
      {
        deleteNode: processNodeDeleteQ,
        addNode: processNodeAddQ,
        ageNode: ageNodes,
        deadNode: processDeadNodesHash
      },

      function(err, results) {
        simulation.nodes(nodes);
        if (typeof callback !== 'undefined') {callback();}
      }

    );
  }

  this.setChargeSliderValue = function(value){

  };

  this.addNode = function(nNode) {

    console.debug("addNode: " + jsonPrint(nNode));

    if ((nNode.nodeType === "session")|| (nNode.nodeType === "group")|| (nNode.nodeType === "word")) {return;}

    var newNode = nNode;
    newNode.newFlag = true;

    if (nodeAddQ.length < MAX_RX_QUEUE) {
      nodeAddQ.push({op:'add', node: newNode});
    }

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
      console.info("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    }
  };

  this.addGroup = function(nNode) {

    var newNode = nNode;
    newNode.newFlag = true;

      console.debug("N> " + newNode.nodeId + " | " + newNode.nodeType);

    if (nodeAddQ.length < MAX_RX_QUEUE) {nodeAddQ.push({op:'add', node: newNode});}

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
      console.info("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    }
  };

  var localSessionHashMap = {};

  this.addSession = function(sess) {
  };

  this.deleteNode = function(nodeId) {
    nodeDeleteQ.push({op:'delete', nodeId: nodeId});
  };

  this.initD3timer = function() {

    simulation = d3.forceSimulation(nodes)
      .on("tick", ticked);
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
        self.initD3timer();
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      case 'RESUME':
        console.debug("SIMULATION CONTROL | OP: " + op);
        // self.initD3timer();
        runningFlag = true;
        simulation.alphaTarget(0.7).restart();
      break;
      case 'FREEZE':
        console.debug("SIMULATION CONTROL | OP: " + op);
        if (!freezeFlag){
          freezeFlag = true;
          simulation.alpha(0);
          simulation.stop();
        }
      break;
      case 'PAUSE':
        console.debug("SIMULATION CONTROL | OP: " + op);
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case 'STOP':
        console.debug("SIMULATION CONTROL | OP: " + op);
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case 'RESTART':
        // console.debug("SIMULATION CONTROL | OP: " + op);
        simulation.alphaTarget(0.7).restart();
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

    d3LayoutWidth = width; // double the width for now
    d3LayoutHeight = height;

    svgForceLayoutArea
      .attr("width", width)
      .attr("height", height)
      .attr("viewbox", 1e-6, 1e-6, width, height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    if (simulation){
      simulation.force("forceX", d3.forceX().x(function(d) { 
          return 0.5*width; 
        }).strength(function(d){
          return 1*gravity; 
        }));

      simulation.force("forceY", d3.forceY().y(function(d) { 
          return 0.4*height; 
        }).strength(function(d){
          return forceYmultiplier * gravity; 
        }));
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
    mouseMovingFlag = false;
    mouseHoverFlag = false;
    mouseHoverNodeId = false;
    self.toolTipVisibility(false);

    self.resize();
    self.resetDefaultForce();
  };
}