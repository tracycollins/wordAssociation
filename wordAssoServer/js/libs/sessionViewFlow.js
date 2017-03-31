/*jslint node: false */

function ViewFlow() {

  "use strict";

  var mouseMovingFlag = false;
  var freezeFlag = false;
  var hideNodeImagesFlag = false;

  var MAX_NODES = 100;
  var processNodeCount = 0;
  var processNodeModulus = 2;

  var maxNodeAddQ = 0;
  var maxNumberNodes = 0;

  var self = this;
  var simulation;

  var resumeTimeStamp = 0;
  var runningFlag = false;
  var antonymFlag = false;

  var groupUpdateQ = [];
  var sessionUpdateQ = [];
  var nodeAddQ = [];
  var nodeDeleteQ = [];

  // ==============================================
  // GLOBAL VARS
  // ==============================================
  var sliderPercision = 3;

  var width;
  var height;

  if (window.innerWidth !== "undefined") {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
  else if (document.documentElement !== "undefined" 
    && document.documentElement.clientWidth !== "undefined" 
    && document.documentElement.clientWidth !== 0) {
    width = document.documentElement.clientWidth;
    height = document.documentElement.clientHeight;
  }
  // older versions of IE
  else {
    width = document.getElementsByTagName("body")[0].clientWidth;
    height = document.getElementsByTagName("body")[0].clientHeight;
  }

  this.getWidth = function() {
    return width;
  };

  this.getHeight = function() {
    return height;
  };

  var mouseHoverFlag = false;

  var nodeMaxAge = 60000;

  var DEFAULT_FLOW_CONFIG = {
    "blahMode": DEFAULT_BLAH_MODE,
    "charge": DEFAULT_CHARGE,
    "velocityDecay": DEFAULT_VELOCITY_DECAY,
    "gravity": DEFAULT_GRAVITY,
    "forceYmultiplier": DEFAULT_FORCEY_MULTIPLIER,
    "minFontSize": DEFAULT_FONT_SIZE_MIN,
    "maxFontSize": DEFAULT_FONT_SIZE_MAX,
    "ageRate": window.DEFAULT_AGE_RATE
  };

  var ageRate = DEFAULT_FLOW_CONFIG.ageRate;
  var maxAgeRate = 0;

  var blahMode = DEFAULT_BLAH_MODE;
  var charge = DEFAULT_CHARGE;
  var gravity = DEFAULT_GRAVITY;
  var forceXmultiplier = DEFAULT_FORCEX_MULTIPLIER;
  var forceXsessionMultiplier = DEFAULT_FORCEX_SESSION_MULTIPLIER;
  var forceYmultiplier = DEFAULT_FORCEY_MULTIPLIER;
  var collisionRadiusMultiplier = DEFAULT_COLLISION_RADIUS_MULTIPLIER;
  var collisionIterations = DEFAULT_COLLISION_ITERATIONS;
  var velocityDecay = DEFAULT_VELOCITY_DECAY;

  var minFontSize = DEFAULT_FONT_SIZE_MIN // 10;
  var maxFontSize = DEFAULT_FONT_SIZE_MAX // 60;

  var palette = {
    "black": "#000000",
    "white": "#FFFFFF",
    "lightgray": "#DDDDDD",
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

  var currentMaxMentions = 2;

  var deadNodesHash = {};

  console.log("width: " + width + " | height: " + height);

  document.addEventListener("mousemove", function() {
    if (mouseHoverFlag) {
      d3.select("body").style("cursor", "pointer");
    } else {
      d3.select("body").style("cursor", "default");
    }
  }, true);

  var adjustedAgeRateScale = d3.scaleLinear().domain([1, 300]).range([1.0, 20.0]).clamp(true);
  var nodeFontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);
  var groupCircleRadiusScale = d3.scaleLog().domain([1, 10000000]).range([10.0, 50.0]).clamp(true); // uses wordChainIndex
  var sessionCircleRadiusScale = d3.scaleLog().domain([1, 1000000]).range([25.0, 70.0]); // uses wordChainIndex
  var defaultRadiusScale = d3.scaleLog().domain([1, 10000000]).range([2.0, 30.0]).clamp(true);
  var sessionOpacityScale = d3.scaleLinear().domain([1e-6, 0.05, 1.0]).range([1.0, 0.2, 1e-6]);

  console.log("@@@@@@@ CLIENT @@@@@@@@");

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
    }
  }

  d3.select("body").style("cursor", "default");

  var groups = [];
  var sessions = [];
  var nodes = [];

  this.getGroupsLength = function() {
    return groups.length;
  };
  
  this.getSessionsLength = function() {
    return sessions.length;
  };
  
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

  this.setFontSizeMin = function(minFont) {
    minFontSize = minFont;
    nodeFontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);
    console.debug("SET MIN FONT SIZE: " + minFontSize);
  };

  this.setFontSizeMax = function(maxFont) {
    maxFontSize = maxFont;
    nodeFontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);
    console.debug("SET MAX FONT SIZE: " + maxFontSize);
  };

  this.getSession = function(index) {
    return sessions[index];
  };


  var d3image = d3.select("#d3group");

  var svgMain = d3image.append("svg:svg")
    .attr("id", "svgMain")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var svgFlowLayoutArea = svgMain.append("g")
    .attr("id", "svgFlowLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", 1e-6, 1e-6, width, height)
    .attr("preserveAspectRatio", "none")
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var nodeSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");
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

  var panzoomElement = document.getElementById("svgFlowLayoutArea");
  panzoom(panzoomElement, {zoomSpeed: 0.030});

  self.setBlah = function(value){
    blahMode = value;
    console.log("BLAH: " + value);
  };

  self.setAntonym = function(ant){
    antonymFlag = ant;
    console.error("ANTONYM: " + antonymFlag);
    if (antonymFlag){
    }
  };

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
  };

  self.updateVelocityDecay = function(value) {
    console.debug("UPDATE VEL DECAY: " + value.toFixed(sliderPercision));
    velocityDecay = value;
    simulation.velocityDecay(velocityDecay);
  };

  self.updateGravity = function(value) {
    console.debug("UPDATE GRAVITY: " + value.toFixed(sliderPercision));
    gravity = value;
    simulation.force("forceX", d3.forceX().x(function(d) { 
        if (d.isSessionNode) {return 0.7*width;}
        return -2*width; 
      }).strength(function(){
        if (d.isSessionNode) {return forceXsessionMultiplier*gravity;}
        return forceXmultiplier * gravity;
      }));
    simulation.force("forceY", d3.forceY().y(function() { 
        return 0.4*height; 
      }).strength(function(d){
        if (d.isSessionNode) {return forceYmultiplier*gravity;}
        return forceYmultiplier * gravity; 
      }));
  };

  self.updateCharge = function(value) {
    console.debug("UPDATE CHARGE: " + value);
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  self.resetDefaultForce = function() {
    console.log("RESET FLOW LAYOUT DEFAULTS");
    self.updateCharge(DEFAULT_CHARGE);
    self.updateVelocityDecay(DEFAULT_VELOCITY_DECAY);
    self.updateGravity(DEFAULT_GRAVITY);
  };

  //================================
  // GET NODES FROM QUEUE
  //================================

  var age;
  var ageMaxRatio;  // 0.0 - 1.0 of nodeMaxAge

  var deleteNodeQ = function (nodeId){

    var dnFlag = false;
    var nodesLength = nodes.length - 1;
    var node;
    var nIndex = nodesLength;

    for (nIndex = nodesLength; nIndex >= 0; nIndex -= 1) {

      node = nodes[nIndex];

      if (node.nodeId === nodeId) {

        if (node.isSessionNode) {
          sessionUpdateQ.push({op:"delete", sessionId: node.sessionId});
        }

        nodes.splice(nIndex, 1);
        dnFlag = true;
        return dnFlag;
      }
    }
    if (nIndex < 0) {
      nodes.splice(nIndex, 1);
      console.debug("XXX NODE NOT FOUND ??? " + nodeId);
      return dnFlag;
    }
  };

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
      // console.debug("processNodeCount MAX_NODES MOD 2"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 5*MAX_NODES) && (processNodeCount % (processNodeModulus+2) === 0)) {
      // console.debug("processNodeCount MAX_NODES MOD 2"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else {
      // return (processNodeCount % (processNodeModulus+3) === 0));
      // console.info("processNodeCount MAX_NODES"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return false;
    }
  }

  var processNodeAddQ = function(callback) {

    processNodeCount += 1;

    var nodesModifiedFlag = false;

    if ((nodeAddQ.length > 0) && addNodeEnabled()) {

      var nodeAddObj = nodeAddQ.shift();

      switch (nodeAddObj.op) {

        case "add":

          nodesModifiedFlag = true;
          nodeAddObj.node.age = 1e-6;
          nodeAddObj.node.ageMaxRatio = 1e-6;
          nodeAddObj.node.ageUpdated = moment().valueOf();

          if (!nodeAddObj.node.isGroupNode 
            && !nodeAddObj.node.isSessionNode 
            && !nodeAddObj.node.isIgnored 
            && (nodeAddObj.node.mentions > currentMaxMentions)) {

            currentMaxMentions = nodeAddObj.node.mentions;

            nodeFontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);

            console.info("NEW MAX Ms" 
              + " | " + nodeAddObj.node.text 
              + " | I: " + nodeAddObj.node.isIgnored 
              + " | Ms " + currentMaxMentions 
              + " | K: " + nodeAddObj.node.isKeyword 
              + " | KWs: " + jsonPrint(nodeAddObj.node.keywords) 
            );
          }

          nodes.push(nodeAddObj.node);

          if (nodes.length > maxNumberNodes) {
            console.info("MAX NODES: " + maxNumberNodes);
            maxNumberNodes = nodes.length;
          }

          callback(null, nodesModifiedFlag);

        break;

        default:
          console.error("??? UNKNOWN NODE UPDATE Q OP: " + nodeAddObj.op);
          callback(null, nodesModifiedFlag);
      }
    }
    else {
      callback(null, nodesModifiedFlag);
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

    var dnFlag = false ;
    var node;

    var currentNodeMaxAge = nodeMaxAge;

    if (nodes.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    } 
    else if (nodeAddQ.length > 100) {
      ageRate = adjustedAgeRateScale(nodeAddQ.length - 100);
    } 
    else if (nodes.length > 100) {
      ageRate = adjustedAgeRateScale(nodes.length - 100);
    } 
    else {
      ageRate = DEFAULT_AGE_RATE;
    }

    maxAgeRate = Math.max(ageRate, maxAgeRate);

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var sNode;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {

      node = nodes[ageNodesIndex];

      if (node.isSessionNode) {
        currentNodeMaxAge = 2.0 * nodeMaxAge;
      }
      else {
        currentNodeMaxAge = nodeMaxAge;
      }

      if (resumeTimeStamp > 0){
        ageRate = 0;
      }
      else {
      }

      age = node.age + (ageRate * (moment().valueOf() - node.ageUpdated));
      ageMaxRatio = age/currentNodeMaxAge ;

      if (node.isDead) {
        deadNodesHash[node.nodeId] = 1;
        node.ageMaxRatio = 1.0;
        dnFlag = true;
        // console.log("XXX NODE DEAD " + node.nodeId);
      } 
      else if (age >= currentNodeMaxAge) {
        node.ageUpdated = moment().valueOf();
        node.age = age;
        node.ageMaxRatio = 1.0;
        node.isDead = true;
        nodes[ageNodesIndex] = node;
        deadNodesHash[node.nodeId] = 1;
        dnFlag = true;
        // console.error("XXX NODE AGE " + node.nodeId);
      } 
      else {
        node.ageUpdated = moment().valueOf();
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;
        nodes[ageNodesIndex] = node;
      }
    }

    if (ageNodesIndex < 0) {
      resumeTimeStamp = 0;
      callback(null, dnFlag);
    }
  };

  var processDeadNodesHash = function (callback) {

    var dnFlag = false;

    if (Object.keys(deadNodesHash).length === 0) {
      return (callback(null, dnFlag));
    }

    var deadNodeIds = Object.keys(deadNodesHash);

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var node;
    var index;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {
      node = nodes[ageNodesIndex];
      if (deadNodesHash[node.nodeId]) {

        nodeDeleteQ.push({op:"delete", nodeId: node.nodeId});
        dnFlag = true;

        delete deadNodesHash[node.nodeId];

        if (node.isGroupNode){

          for (index = groups.length-1; index >= 0; index -= 1) {

            if (node.nodeId === groups[index].node.nodeId) {
              console.log("X GRP | " + groups[index].node.nodeId);
              groupUpdateQ.push({op:"delete", groupId: groups[index].groupId});
            }
          }
        }

        else if (node.isSessionNode){

          for (index = sessions.length-1; index >= 0; index -= 1) {

            if (node.nodeId === sessions[index].node.nodeId) {
              console.log("X SES | " + sessions[index].node.nodeId);
              sessionUpdateQ.push({op:"delete", sessionId: sessions[index].sessionId});
            }
          }
        }
      }
      deadNodeIds = Object.keys(deadNodesHash);
    }

    if ((nodes.length === 0) || (deadNodeIds.length === 0) || (ageNodesIndex < 0)) {
      return (callback(null, dnFlag));
    }
  };

  function nodeMouseOver(d) {

    mouseHoverFlag = true;
    d.mouseHoverFlag = true;

    d.fx = d.x;
    d.fy = d.y;

    d3.select(this)
      .attr("mouseover", 1)
      .style("fill", palette.blue)
      .style("opacity", 1);

    var nodeId = d.nodeId;
    var uId = d.userId;
    var mentions = d.mentions;

    self.toolTipVisibility(true);

    var tooltipString;

    if (d.isSessionNode) {
      sessions.forEach(function(session){
        if (session.sessionId === d.sessionId){
          session.mouseHoverFlag = true;
        }
      });

      tooltipString = uId 
        + "<br>MENTIONS: " + mentions;
    }
    else {
      tooltipString = d.raw
        + "<br>MENTIONS: " + mentions 
        + "<br>" + uId
        + "<br>" + nodeId
        + "<br>K: " + d.isKeyword
        + "<br>K: " + jsonPrint(d.keywords)
        + "<br>" + d.sessionId;
    }

    divTooltip.html(tooltipString)
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");
  }

  function nodeMouseOut(d) {

    mouseHoverFlag = false;
    d.mouseHoverFlag = false;

    d3.select(this)
      .attr("mouseover", 0)
      .style("fill", function(d) { 
        if (d.isKeyword) { return d.keywordColor; }
        if (d.isTrendingTopic 
          || d.isTwitterUser 
          || d.isNumber 
          || d.isCurrency) { return palette.white; }
        if ((d.isGroupNode 
          || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
        return palette.lightgray; 
      })
      .style("opacity", function(d) { 
        return 1.0 - d.ageMaxRatio; 
      });

    if (!d.isGroupNode){
      d.fx = null;
      d.fy = null;
    }

    self.toolTipVisibility(false);
  }

  function nodeClick(d) {
    window.open(d.url, "_blank");
  }
 
  var updateNodes = function(callback) {

    var nodeImages = nodeSvgGroup.selectAll("image")
      .data(nodes.filter(function(d){ 
        return (d.nodeType === "session"); }), function(d) { return d.nodeId; });

    nodeImages
      .attr("r", function(d) {
        if (d.mentions === undefined) {
            console.error(d.nodeId + " | NODE CIRCLE d.mentions UNDEFINED");
            return defaultRadiusScale(1);
        }
        else {
          if (d.isGroupNode) {
            return groupCircleRadiusScale(d.totalWordChainIndex + 1.0) ;
          }
          else if (d.isSessionNode) {
            return sessionCircleRadiusScale(d.wordChainIndex + 1.0) ;
          }
          else {
            return defaultRadiusScale(parseInt(d.mentions) + 1.0);
          }
        }
      })
      .attr("x", function(d) {return d.x - 0.5*(sessionCircleRadiusScale(d.wordChainIndex + 1.0));})
      .attr("y", function(d) {return d.y - 0.5*(sessionCircleRadiusScale(d.wordChainIndex + 1.0));})
      .attr("xlink:href", function(d) { return d.profileImageUrl; })
      .attr("width", function(d){ return sessionCircleRadiusScale(d.wordChainIndex + 1.0); })
      .attr("height", function(d){ return sessionCircleRadiusScale(d.wordChainIndex + 1.0); })
      .style("opacity", function(d) {
        if (hideNodeImagesFlag) {return 1e-6;}
        if (d.mouseHoverFlag) {return 1.0;}
        return sessionOpacityScale(d.ageMaxRatio);
      });

    nodeImages
      .enter()
      .append("svg:image")
      .attr("id", function(d) { return d.nodeId;})
      .attr("nodeId", function(d) { return d.nodeId;})
      .attr("sessionNode", function(d) { 
        if (d.isSessionNode) { return d.nodeId; }
        return false;
      })
      .attr("sessionId", function(d) { return d.sessionId;})
      .attr("x", function(d) {return d.x;})
      .attr("y", function(d) {return d.y;})
      .attr("xlink:href", function(d) { return d.profileImageUrl; })
      .attr("width", 1e-6)
      .attr("height", 1e-6)
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .attr("r", 1e-6)
      .style("opacity", 1);

    nodeImages
      .exit()
      .remove();

    callback();
  };

  var updateNodeLabels = function(callback) {

    nodeLabels = nodeLabelSvgGroup.selectAll("text").data(nodes ,function(d) { return d.nodeId; });

    nodeLabels
      .text(function(d) {
        d.textLength = this.getComputedTextLength();
        if (d.isGroupNode) { return d.totalWordChainIndex; }
        if (d.isSessionNode) { return d.entity; }
        if (d.isTwitterUser) { return d.raw; }
        if (!mouseMovingFlag 
          && blahMode 
          && !d.isTwitterUser 
          && !d.isKeyword 
          && !d.isCurrency 
          && !d.isNumber 
          && !d.isTrendingTopic) {
          return "blah";
        }
        if (antonymFlag && d.antonym) { return "[" + d.antonym + "]";  }
        return d.raw.toUpperCase();
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .style("font-weight", function(d) {
        if (d.isTwitterUser 
          || d.isKeyword 
          || d.isNumber 
          || d.isCurrency 
          || d.isTrendingTopic) { return "bold"; }
        return "normal";
      })
      .style("text-decoration", function(d) {
        if (d.isTrendingTopic) { return "underline"; }
        return "none";
      })
      .style("fill", function(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        if (d.isKeyword) { return d.keywordColor; }
        if (d.isTrendingTopic 
          || d.isTwitterUser 
          || d.isNumber 
          || d.isCurrency) { return palette.white; }
        if ((d.isGroupNode 
          || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
        return palette.lightgray; 
      })
      .style("opacity", function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return 1.0 - d.ageMaxRatio; 
      })
      .style("font-size", function(d) {
          if (d.isIgnored) { return nodeFontSizeScale(10) + "px";  }
          if (d.isTrendingTopic) { return nodeFontSizeScale(1.5*d.mentions + 1.1) + "px"; }
          return (nodeFontSizeScale(d.mentions + 1.1)) + "px";
        });

    nodeLabels
      .enter()
      .append("svg:text")
      .attr("nodeId", function(d) { return d.nodeId; })
      .text(function(d) {
        d.textLength = this.getComputedTextLength();
        if (d.isGroupNode) { return d.totalWordChainIndex; }
        if (d.isSessionNode) { return d.wordChainIndex + " | " + d.y.toFixed(0); }
        if (!mouseMovingFlag && blahMode && !d.isKeyword) { return "blah"; }
        return d.raw;
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .style("visibility", function(d) { 
        return (d.isGroupNode || d.isSessionNode) ? "hidden" : "visible"; 
      })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .style("opacity", 1e-6)
      .style("fill", palette.white)
      .style("font-size", "1px")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick);

    nodeLabels
      .exit()
      .remove();

    callback();
  };

  function drawSimulation(callback){

    async.series(
      {
        udnc: updateNodes,
        udnl: updateNodeLabels
      },
      function(err, results) {
        if (err) {
          console.error("*** ERROR: drawSimulation *** \nERROR: " + err);
          callback(err);
        }
        else {
          callback(results);
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

      function() {
        simulation.nodes(nodes);
        if (callback !== undefined) {
          callback();
        }
      }

    );
  }

  function ticked() {
    drawSimulation(function(){
      updateSimulation(function(){});
    });
  }

  this.addGroup = function() {
  };

  this.addSession = function(newSession) {
    // console.info("+ SES" 
    //   + " " + newSession.sessionId
    // );
  };

  this.deleteSessionLinks = function(){

  };

  this.sessionKeepalive = function(session) {
    console.debug("<K SES" 
      + " | " + session.sessionId
    );

    var keepaliveNodeId = session.tags.entity + "_" + session.tags.channel;

    async.forEachOf(nodes, function(node, index, cb){
      if (node.isSessionNode && (node.nodeId === keepaliveNodeId)){
        console.debug("* SES KEEPALIVE HIT" 
          + " | " + node.nodeId
        );
        nodes[index].age = 1e-6;
        nodes[index].isDead = false;
        nodes[index].ageUpdated = moment().valueOf();
        nodes[index].ageMaxRatio = 1e-6;
      }
      cb();
    }, function(err){
      if (err) {
        console.debug("* SES KEEPALIVE ERROR" 
          + " | " + err
        );
      }
    });
  };


  this.addNode = function(newNode) {

    newNode.age = 1e-6;
    newNode.ageMaxRatio = 1e-6;

    if (newNode.text === undefined) {
      newNode.text = "== UNDEFINED ==";
    }

    newNode.textLength = 100;

    if (newNode.isKeyword){
      newNode.textLength = 100;
    }

    if (newNode.raw !== undefined) {

      newNode.raw = newNode.raw.replace("&amp;", "&");

      if (newNode.raw.match(/^\d+/gi)){
        newNode.isNumber = true;
      }

      if (newNode.raw.match(/^\$/gi)){
        newNode.isCurrency = true;
      }
      
      if (newNode.raw.match(/^@/gi)){
        newNode.isTwitterUser = true;
      }
    }

    if (newNode.isTrendingTopic) {
      console.log("TT" 
        + " " + newNode.text
        + " " + newNode.raw
      );
    }

    if (newNode.isSessionNode) {
      nodeAddQ.push({op:"add", node: newNode});
    }
    else {
      nodeAddQ.push({op:"add", node: newNode});
    }

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
      console.warn("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    }
  };

  this.deleteNode = function(nodeId) {
    nodeDeleteQ.push({op:"delete", nodeId: nodeId});
  };

  this.initD3timer = function() {

    simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody()
        .strength(charge))
      .force("forceX", d3.forceX()
        .x(function(d) { 
          if (d.isSessionNode) { return 0.7*width; }
          return -2*width; 
        })
        .strength(function(d){
          if (d.isSessionNode) {return forceXsessionMultiplier*gravity;}
          return forceXmultiplier * gravity;
        })
      )
      .force("forceY", d3.forceY()
        .y(function() { return 0.4*height; })
        .strength(function(d){
          if (d.isSessionNode) { return forceYmultiplier * gravity; }
          return forceYmultiplier * gravity; })
      )
      .force("collide", d3.forceCollide().radius(function(d) { 
          if (d.isGroupNode) {
            return collisionRadiusMultiplier * sessionCircleRadiusScale(d.wordChainIndex + 1.0);
          } 
          if (d.isSessionNode) {
            return collisionRadiusMultiplier * sessionCircleRadiusScale(d.wordChainIndex + 1.0);
          } 
          return collisionRadiusMultiplier * d.textLength; 
        }).iterations(collisionIterations))
      .velocityDecay(velocityDecay)
      .on("tick", ticked);

  };

  this.simulationControl = function(op) {
    switch (op) {
      case "RESET":
        console.debug("SIMULATION CONTROL | OP: " + op);
        self.reset();
        runningFlag = false;
      break;
      case "START":
        self.initD3timer();
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      case "RESUME":
        runningFlag = true;
        resumeTimeStamp = moment().valueOf();
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
        runningFlag = false;
        resumeTimeStamp = 0;
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
    console.info("RESIZE");

    d3image = d3.select("#d3group");

    if (window.innerWidth !== "undefined") {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    else if (document.documentElement !== "undefined" 
      && document.documentElement.clientWidth !== "undefined" 
      && document.documentElement.clientWidth !== 0) {
      width = document.documentElement.clientWidth;
      height = document.documentElement.clientHeight;
    }
    // older versions of IE
    else {
      width = document.getElementsByTagName("body")[0].clientWidth;
      height = document.getElementsByTagName("body")[0].clientHeight;
    }

    console.log("width: " + width + " | height: " + height);

    svgMain
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);


    svgFlowLayoutArea
      .attr("width", width)
      .attr("height", height)
      .attr("viewbox", 1e-6, 1e-6, width, height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    if (simulation){
      simulation.force("forceX", d3.forceX().x(function(d) { 
          if (d.isSessionNode) {return 0.7*width;}
          return -2*width; 
        }).strength(function(d){
          if (d.isSessionNode) {return forceXsessionMultiplier*gravity;}
          return forceXmultiplier * gravity;
        }));
      simulation.force("forceY", d3.forceY().y(function() { 
          return 0.4*height; 
        }).strength(function(d){
          if (d.isSessionNode) {return forceYmultiplier*gravity;}
          return forceYmultiplier * gravity; 
        }));
    }
  };

  document.addEventListener("resize", function() {
    self.resize();
  }, true);

  self.reset = function() {
    console.info("RESET");

    groups = [];
    sessions = [];
    nodes = [];

    deadNodesHash = {};
    mouseMovingFlag = false;
    mouseHoverFlag = false;

    self.toolTipVisibility(false);
    self.resize();
    self.resetDefaultForce();
  };
}