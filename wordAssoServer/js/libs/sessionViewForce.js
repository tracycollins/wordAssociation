/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewForce() {

  var self = this;

  var force;
  var showStatsFlag = false;

  var pauseFlag = false;
  var updateNodeFlag = false;

  // ==============================================
  // GLOBAL VARS
  // ==============================================
  // var testModeEnabled = false;

  var maxTotalWordChainIndex ;

  var tickNumber = 0;
  var width = window.innerWidth * 1;
  var height = window.innerHeight * 1;

  this.getWidth = function() {
    return window.innerWidth;
  }

  this.getHeight = function() {
    return window.innerHeight;
  }

  var dateNow = moment().valueOf();
  var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
  var defaultTimePeriodFormat = "HH:mm:ss";

  var ageSessionsReady = true;
  var ageNodesReady = true;

  var minSessionNodeOpacity = 0.2;

  var mouseFreezeEnabled = false;
  var mouseHoverFlag = false;
  var mouseOverRadius = 10;
  var mouseHoverNodeId;

  var updateForceDisplayReady = true;

  var nodeMaxAge = 60000;

  var DEFAULT_CONFIG = {
    'nodeMaxAge': window.DEFAULT_MAX_AGE
  };
  var config = DEFAULT_CONFIG;
  var previousConfig = [];

  var defaultTextFill = "#888888";

  var defaultFadeDuration = 250;

  var DEFAULT_FORCE_CONFIG = {
    'charge': DEFAULT_CHARGE,
    'friction': DEFAULT_FRICTION,
    'linkStrength': DEFAULT_LINK_STRENGTH,
    'gravity': DEFAULT_GRAVITY,
    'ageRate': window.DEFAULT_AGE_RATE,
  };

  var ageRate = DEFAULT_FORCE_CONFIG.ageRate;

  var charge = DEFAULT_CHARGE;
  var gravity = DEFAULT_GRAVITY;
  var globalLinkStrength = DEFAULT_LINK_STRENGTH;
  var friction = DEFAULT_FRICTION;

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

  var currentScale = 0.4;

  var D3_LAYOUT_WIDTH_RATIO = 1.0;
  var D3_LAYOUT_HEIGHT_RATIO = 1.0;

  var FORCE_LAYOUT_WIDTH_RATIO = 1.0;
  var FORCE_LAYOUT_HEIGHT_RATIO = 1.0;

  var SVGCANVAS_WIDTH_RATIO = 1.0;
  var SVGCANVAS_HEIGHT_RATIO = 1.0;


  var forceStopped = true;

  var deadNodesHash = {};
  var deadLinksHash = {};

  var newNodes = [];
  var newLinks = [];

  var translate = [0, 0];

  var zoomWidth = (window.innerWidth - (currentScale * window.innerWidth)) / 2;
  var zoomHeight = (window.innerHeight - (currentScale * window.innerHeight)) / 2;

  var d3LayoutWidth = window.innerWidth * D3_LAYOUT_WIDTH_RATIO;
  var d3LayoutHeight = window.innerHeight * D3_LAYOUT_HEIGHT_RATIO;

  console.log("width: " + window.innerWidth + " | height: " + window.innerHeight);

  document.addEventListener("mousemove", function() {
    if (mouseHoverFlag) {
      d3.select("body").style("cursor", "pointer");
    } else {
      d3.select("body").style("cursor", "default");
    }

    resetMouseMoveTimer();
    mouseMovingFlag = true;

    if (mouseFreezeEnabled) {
      // force.stop();
    }
  }, true);


  var adjustedAgeRateScale = d3.scale.linear().domain([1, 500]).range([1.0, 100.0]);
  var fontSizeScale = d3.scale.linear().domain([1, 1000000]).range([40.0, 80]).clamp(true);

  var groupCircleRadiusScale = d3.scale.log().domain([1, 1000000]).range([10.0, 100.0]).clamp(true); // uses wordChainIndex
  var sessionCircleRadiusScale = d3.scale.log().domain([1, 1000000]).range([10.0, 100.0]).clamp(true); // uses wordChainIndex
  var defaultRadiusScale = d3.scale.log().domain([1, 10000000]).range([4.0, 40.0]).clamp(true);

  var fillColorScale = d3.scale.linear().domain([1e-6, 0.5, 1.0]).range(["#555555", "#111111", "#000000"]);

  var strokeColorScale = d3.scale.linear().domain([1e-6, 0.5, 1.0]).range(["#cccccc", "#444444", "#000000"]);

  var linkColorScale = d3.scale.linear().domain([1e-6, 0.5, 1.0]).range(["#cccccc", "#666666", "#444444"]);


  console.log("@@@@@@@ CLIENT @@@@@@@@");

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

  d3.select("body").style("cursor", "default");

  var groups = [];
  var sessions = [];
  var nodes = [];
  var links = [];

  this.groupsLength = function() {
    return groups.length;
  }
  
  this.sessionsLength = function() {
    return sessions.length;
  }
  
  this.nodesLength = function() {
    return nodes.length;
  }
  
  this.linksLength = function() {
    return links.length;
  }
  
  this.ageRate = function() {
    return ageRate;
  }
  
  this.setNodeMaxAge = function(maxAge) {
    nodeMaxAge = maxAge;
    console.warn("SET NODE MAX AGE: " + nodeMaxAge);
  }

  this.getSession = function(index) {
    return sessions[index];
  }

  var maxNumberSessions = 0;
  var maxNumberNodes = 0;
  var maxNumberLinks = 0;

  var svgForceLayoutAreaWidth = d3LayoutWidth * FORCE_LAYOUT_WIDTH_RATIO;
  var svgForceLayoutAreaHeight = d3LayoutHeight * FORCE_LAYOUT_HEIGHT_RATIO;

  this.getSessionsLength = function() {
    return sessions.length;
  }

  function zoomHandler() {
    if (!mouseHoverFlag) {
      svgForceLayoutArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
  }


  var d3image = d3.select("#d3group");

  var svgcanvas = d3image.append("svg:svg")
    .attr("id", "svgcanvas")
    .attr("x", 0)
    .attr("y", 0)
    .call(d3.behavior.zoom()
      .scale(currentScale)
      .scaleExtent([0.1, 10])
      .on("zoom", zoomHandler));

  var svgForceLayoutArea = svgcanvas.append("g")
    .attr("id", "svgForceLayoutArea");

  var zoomListener = d3.behavior.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", zoomHandler);

  zoomListener.translate([zoomWidth, zoomHeight]).scale(currentScale); 
  zoomListener.event(svgcanvas.transition().duration(1000)); //does a zoom

  var linkSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "linkSvgGroup");

  var groupSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "groupSvgGroup");
  var groupLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "groupLabelSvgGroup");
  var groupGnode = groupSvgGroup.selectAll("g.group");
  var groupCircles = groupSvgGroup.selectAll("circle");

  var sessionSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "sessionSvgGroup");
  var sessionCircles = sessionSvgGroup.selectAll("circle");

  var nodeSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

  var node = nodeSvgGroup.selectAll("g.node");
  var nodeCircles = nodeSvgGroup.selectAll("circle");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

  var groupLabels = groupLabelSvgGroup.selectAll(".groupLabel");
  var sessionLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "sessionLabelSvgGroup");
  var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");
  var link = linkSvgGroup.selectAll("line");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);

  function sessionCircleDragMove(d) {

    dragEndPosition = { 'id': d.sessionId, 'x': d3.event.x, 'y': d3.event.y};

    var x = d3.event.x;
    var y = d3.event.y;

    var dX = 1 * (-d.x + x);
    var dY = 1 * (-d.y + y);

    d.x = x;
    d.y = y;

    d3.select(this)
      .attr("x", x)
      .attr("y", y)
      .attr("px", x)
      .attr("py", y)
      .attr("cx", x)
      .attr("cy", y);

    nodeSvgGroup.selectAll('#' + d.nodeId)
      .attr("x", x)
      .attr("y", y)
      .attr("px", x)
      .attr("py", y)
      .attr("cx", x)
      .attr("cy", y);

    nodeLabelSvgGroup.selectAll('#' + d.nodeId)
      .attr("x", x)
      .attr("y", function(d) {
        var shiftY = -10 - 1.1 * (defaultRadiusScale(d.mentions + 1));
        return y + shiftY;
      });

    nodeCircles.select('#' + d.nodeId)
      .attr("x", x)
      .attr("y", y)
      .attr("px", x)
      .attr("py", y)
      .attr("cx", x)
      .attr("cy", y);

    sessionLabelSvgGroup.select('#' + d.nodeId)
      .attr("x", x)
      .attr("y", function(d) {
        var shiftY = -2 * (sessionCircleRadiusScale(d.wordChainIndex + 1));
        return d.y + shiftY;
      });

    document.dispatchEvent(sessionDragEndEvent);
    // tick();
    updateNodes;
    updateLinks;
    updateGroupsCircles;
    updateSessionCircles;
    updateNodeCircles;
    updateNodeLabels;
  }

  // Define drag beavior
  var drag = d3.behavior.drag()
    .origin(function(d) {
      return d;
    });
    // .on("drag", sessionCircleDragMove);

  drag.on("dragstart", function() {
    d3.event.sourceEvent.stopPropagation(); // silence other listeners
  });

  drag.on("dragend", function(d) {
    // console.warn("d\n" + jsonPrint(d));
    // console.warn("DRAG END" + "\n" + jsonPrint(dragEndPosition));
  });

  var globalLinkIndex = 0;

  function generateLinkId(callback) {
    globalLinkIndex++;
    return "LNK" + globalLinkIndex;
  }

  //
  // FORCE LAYOUT DECLARATION
  //

  function tick() {

    force.linkStrength(
      function(d,i){
        if(d.isGroupLink)
          return 1.0;//calculate your charge for other nodes
        else
          return globalLinkStrength;//calculate your charge for the clicked node
      });

    link
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });
  }

  self.setPause = function(pause){
    pauseFlag = pause;
    console.error("PAUSE: " + pauseFlag);
    if (pauseFlag){
      force.stop();
      forceStopped = true;
    }
  }

  self.updateLinkStrength = function(value) {
    console.log("updateLinkStrength: " + value + " | forceStopped: " + forceStopped);
    globalLinkStrength = value;
    force.linkStrength(globalLinkStrength);
    force.start();
  }

  self.updateFriction = function(value) {
    friction = value;
    force.friction(friction);
    force.start();
  }

  self.updateGravity = function(value) {
    gravity = value;
    force.gravity(gravity);
    force.start();
  }

  self.updateCharge = function(value) {
    charge = value;
    force.charge(charge);
    force.start();
  }

  self.resetDefaultForce = function() {
    console.log("RESET FORCE LAYOUT DEFAULTS");
    self.updateCharge(DEFAULT_CHARGE);
    self.updateFriction(DEFAULT_FRICTION);
    self.updateGravity(DEFAULT_GRAVITY);
    self.updateLinkStrength(DEFAULT_LINK_STRENGTH);
  }

  //================================
  // GET NODES FROM QUEUE
  //================================

  var age;
  var ageMaxRatio;  // 0.0 - 1.0 of nodeMaxAge
  var nodeIndex = 0;

  function ageNodes(callback) {

    if (nodes.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
      return (callback());
    } else if (nodes.length > 100) {
      ageRate = adjustedAgeRateScale(nodes.length - 100);
    } else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var node;

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var dateNow = moment().valueOf();

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {

      node = nodes[ageNodesIndex];

      age = node.age + (ageRate * (dateNow - node.ageUpdated));
      ageMaxRatio = age/nodeMaxAge ;

      if (node.isDead) {
        deadNodesHash[node.nodeId] = 1;
      } else if (age >= nodeMaxAge) {
        node.ageUpdated = dateNow;
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;
        node.isDead = true;
        nodes[ageNodesIndex] = node;
        deadNodesHash[node.nodeId] = 1;
      } else {
        node.ageUpdated = dateNow;
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;
        nodes[ageNodesIndex] = node;
      }
    }

    if (ageNodesIndex < 0) {
      return (callback());
    }
  }

  function initDeadNodesInterval(interval) {}

  function processDeadLinksHash(callback) {

    if (self.disableLinks){
      if (links.length > 0) {
        force.stop();
        forceStopped = true;
        links = [];
        force.links(links);
        return (callback());
      }
      return (callback());
    }

    force.stop();
    forceStopped = true;

    var ageLinksLength = links.length - 1;
    var ageLinksIndex = links.length - 1;
    var link;

    for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {
      link = links[ageLinksIndex];
      if (deadLinksHash[link.linkId]) {
        // console.warn("XXX DEAD LINK | " + link.linkId);
        linkDeleteQueue.push(link.linkId);
        links.splice(ageLinksIndex, 1);
        force.links(links);
        delete deadLinksHash[link.linkId];
      }
    }

    if ((links.length == 0) || (ageLinksIndex < 0)) {
      return (callback());
    }
  }

  function processDeadNodesHash(callback) {

    if (Object.keys(deadNodesHash).length == 0) {
      return (callback());
    }

    var deadNodeIds = Object.keys(deadNodesHash);

    force.stop();
    forceStopped = true;

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var node;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {
      node = nodes[ageNodesIndex];
      if (deadNodesHash[node.nodeId]) {
        nodeDeleteQueue.push(node.nodeId);
        nodes.splice(ageNodesIndex, 1);
        delete deadNodesHash[node.nodeId];
        if (node.isGroupNode){
          for (var i=groups.length-1; i >= 0; i -= 1) {
            if (node.nodeId == groups[i].node.nodeId) {
              console.log("XXX GROUP | " + groups[i].node.nodeId);
              groups.splice(i, 1);
              var deadLinkIds = Object.keys(node.links);
              deadLinkIds.forEach(function(deadLink){
                deadLinksHash[deadLink] = 'DEAD';
              });
            }
          }
        }
        if (node.isSessionNode){
          for (var i=sessions.length-1; i >= 0; i -= 1) {
            if (node.nodeId == sessions[i].node.nodeId) {
              console.log("XXX SESSION | " + sessions[i].node.nodeId);
              sessions.splice(i, 1);
              var deadLinkIds = Object.keys(node.links);
              deadLinkIds.forEach(function(deadLink){
                deadLinksHash[deadLink] = 'DEAD';
              });
            }
          }
        }
      }
      deadNodeIds = Object.keys(deadNodesHash);
    }

    if ((nodes.length == 0) || (deadNodeIds.length == 0) || (ageNodesIndex < 0)) {
      force.nodes(nodes);
      return (callback());
    }
  }

  function updateNodes(callback) {

    node = node.data(force.nodes(), function(d) {
        return d.nodeId;
      });

    node.enter()
      .append("svg:g")
      .attr("class", "node")
      .attr("id", function(d) {
        return d.nodeId;
      });

    node
      .exit()
      .remove();

    return (callback(null, "updateNodes"));
  }

  function updateLinks(callback) {

    // console.log("updateLinks");

    link = linkSvgGroup.selectAll("line").data(force.links(),
      function(d) {
        return d.source.nodeId + "-" + d.target.nodeId;
      });

    link
      .style('stroke', function(d) {
        return linkColorScale(d.ageMaxRatio);
      })
      .style('opacity', function(d) {
        return 1.0 - d.ageMaxRatio;
      });

    link.enter()
      .append("svg:line")
      .attr("class", "link")
      .style('stroke', function(d) {
        return linkColorScale(1.0);
      })
      .style('stroke-width', 1.75)
      .style('opacity', 1e-6)
      .transition()
      .duration(defaultFadeDuration)
      .style('opacity', 1.0);

    link
      .exit()
      .remove();

    return (callback(null, "updateLinks"));
  }

  function updateGroupsCircles(callback) {

    var dateNow = moment().valueOf();

    groupCircles = groupSvgGroup.selectAll("circle")
      .data(groups, function(d) {
        return d.groupId;
      });

    groupCircles
      .attr("r", function(d) {
        return groupCircleRadiusScale(d.wordChainIndex + 1);
        // return groupCircleRadiusScale(d.mentions + 1);
      })
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .style("fill", function(d) {
        if (this.getAttribute("mouseover") == 1) {
          return "#ffffff";
        }
        else if (d.ageMaxRatio < 0.01) {
          return "#ffffff";
        }
        else {
          return d.interpolateColor(d.ageMaxRatio);
        }
      })
      .style('opacity', function(d) {
        if ((dateNow - d.lastSeen) >= nodeMaxAge) {
          return 1e-6;
        }
        else {
          return 1.0;
        }
      })
      .style('stroke', function(d) {
          return d.interpolateColor(d.ageMaxRatio);
      })
      .style('stroke-width', function(d) {
        return 5;
      })
      .style("stroke-opacity", function(d) {
          return d.interpolateColor(d.ageMaxRatio);
      });

    groupCircles
      .enter()
      .append("svg:circle")
      .attr("class", "groupCircle")
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .attr("mouseover", 0)
      .attr("r", 1e-6)
      .style("visibility", "visible")
      .style("fill", "#ffffff")
      .style("opacity", 1e-6)
      .style('stroke', function(d) {
        return d.interpolateColor(0.75);
      })
      .style("stroke-width", 2.5)
      .style("stroke-opacity", 0.8)
      .transition()
        .duration(defaultFadeDuration)
        .attr("r", function(d) {
          return groupCircleRadiusScale(d.wordChainIndex + 1);
        })
        .style('opacity', 1.0);

    groupCircles
      .exit()
      .remove();

    groupLabels = groupLabelSvgGroup.selectAll(".groupLabel")
      .data(groups, function(d) {
        return d.groupId;
      })
      .text(function(d) {
        return d.text;
      })
      .style("font-size", function(d) {
        return fontSizeScale(d.totalWordChainIndex) + "px";
      })
      .style('opacity', function(d) {
        if (d3.select(this).attr("mouseover") == 1) {
          return 1.0;
        }
        return 1.0-((dateNow-d.lastSeen)/nodeMaxAge);
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        var shiftY = -1.5 * (groupCircleRadiusScale(d.totalWordChainIndex + 1));
        return d.y + shiftY;
      });

    groupLabels.enter()
      .append("svg:text")
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        var shiftY = -1.6 * (groupCircleRadiusScale(d.totalWordChainIndex + 1));
        return d.y + shiftY;
      })
      .attr("class", "groupLabel")
      .text(function(d) {
        return d.text;
      })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .style("opacity", 1e-6)
      .style('fill', "#ffffff")
      .style("font-size", function(d) {
        return fontSizeScale(d.totalWordChainIndex) + "px";
      })
      .transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1.0);

    groupLabels
      .exit().remove();

    return (callback(null, "updateGroupsCircles"));
  }

  function updateSessionLabels(callback) {

    var dateNow = moment().valueOf();

    sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel")
      .data(sessions, function(d) {
        return d.nodeId;
      })
      .text(function(d) {
        return d.text;
        // return d.wordChainIndex;
      })
      .attr("x", function(d) {
        var cnode = nodeHashMap.get(d.nodeId);
        if (typeof cnode === 'undefined') return 0;
        return cnode.x;
      })
      .attr("y", function(d) {
        var shiftY = -1.5 * (sessionCircleRadiusScale(d.wordChainIndex + 1));
        var cnode = nodeHashMap.get(d.nodeId);
        if (typeof cnode === 'undefined') return 0;
        return cnode.y + shiftY;
      })
      .style("font-size", function(d) {
        return fontSizeScale(d.wordChainIndex) + "px";
      })
      .style('opacity', function(d) {
        if (d3.select(this).attr("mouseover") == 1) {
          return 1.0;
        }
        return 1.0-((dateNow-d.lastSeen)/nodeMaxAge);
      });

    sessionLabels.enter()
      .append("text")
      .attr("class", "sessionLabel")
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .text(function(d) {
        return d.text;
        return d.wordChainIndex;
      })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .style("opacity", 1)
      .style('fill', "#ffffff")
      .style("font-size", function(d) {
        return fontSizeScale(d.wordChainIndex) + "px";
      })
      .attr("x", function(d) {
        var cnode = nodeHashMap.get(d.nodeId);
        if (typeof cnode === 'undefined') return 0;
        return cnode.x;
      })
      .attr("y", function(d) {
        var shiftY = -2.5 * (sessionCircleRadiusScale(d.wordChainIndex + 1));
        var cnode = nodeHashMap.get(d.nodeId);
        if (typeof cnode === 'undefined') return 0;
        return cnode.y + shiftY;
      });

    sessionLabels
      .exit().remove();


    return (callback(null, "updateSessionLabels"));
  }

  function updateNodeCircles(callback) {

    // console.log("updateNodeCircles");

    nodeCircles = nodeSvgGroup.selectAll("circle")
      .data(force.nodes(), function(d) {
        return d.nodeId;
      });

    nodeCircles
      .attr("r", function(d) {
        if (typeof d.mentions === 'undefined') 
          {
            console.error(d.nodeId + " | NODE CIRCLE d.mentions UNDEFINED");
            return defaultRadiusScale(1);
          }
          else {
            if (d.isGroupNode) return groupCircleRadiusScale(d.totalWordChainIndex + 1) ;
            if (d.isSessionNode) return groupCircleRadiusScale(d.wordChainIndex + 1) ;
            return defaultRadiusScale(parseInt(d.mentions) + 1);
          }
      })
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .style("fill", function(d) {
        if (this.getAttribute("mouseover") == 1) {
          return "#ffffff";
        }
        else if (d.ageMaxRatio < 0.01) {
          return "#ffffff";
        }
        else {
          if (d.isGroupNode) return "#000000";
          if (d.isSessionNode) return "#000000";
          return d.interpolateColor(d.ageMaxRatio);
        }
      })
      .style('opacity', function(d) {
        if (d.ageMaxRatio >= 1.0) {
          return 0;
        }
        return 1
      })
      .style('stroke', function(d) {
        if (d.isGroupNode) return d.interpolateColor(d.ageMaxRatio);
        if (d.isSessionNode) return d.interpolateColor(d.ageMaxRatio);
        return strokeColorScale(d.ageMaxRatio);
      })
      .style('stroke-opacity', function(d) {
        return 1.0 - d.ageMaxRatio;
      });

    nodeCircles
      .enter()
      .append("svg:circle")
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .attr("mouseover", 0)
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("dblclick", nodeClick)
      .attr("r", 1e-6)
      .style("visibility", "visible")
      .style("opacity", 1e-6)
      .style('stroke', function(d) {
        return strokeColorScale(d.ageMaxRatio);
      })
      .style("stroke-width", function(d) {
        if (d.isGroupNode) return 8;
        if (d.isSessionNode) return 6;
        return 2.5;
      })
      .style("fill", "#FFFFFF")
      .transition()
        .duration(defaultFadeDuration)
        .style("fill", "#ffffff")
        .style('opacity', 1.0);

    nodeCircles
      .exit().remove();

    return (callback(null, "updateNodeCircles"));
  }

  function updateNodeLabels(callback) {

    // console.log("updateNodeLabels");

    nodeLabels = nodeLabelSvgGroup.selectAll(".nodeLabel").data(force.nodes(),
        function(d) {
          return d.nodeId;
        })
      .text(function(d) {
        if (d.isGroupNode) return d.totalWordChainIndex;
        if (d.isSessionNode) return d.wordChainIndex;
        return d.text;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        if (d.isGroupNode) {
          return d.y;
        }
        else if (d.isSessionNode) {
          return d.y;
        }
        else{
          var shiftY = -20 - 1.15 * (defaultRadiusScale(parseInt(d.mentions) + 1));
          return d.y + shiftY;
        }
      })
      .style("font-size", function(d) {
        if (d.isGroupNode) return fontSizeScale(d.totalWordChainIndex + 1.1) + "px";
        if (d.isSessionNode) return fontSizeScale(d.wordChainIndex + 1.1) + "px";
        return fontSizeScale(d.mentions + 1.1) + "px";
      })
      .style('opacity', function(d) {
        return 1.0 - d.ageMaxRatio;
      });

    nodeLabels.enter()
      .append("svg:text")
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        if (d.isGroupNode) {
          return d.y;
        }
        else if (d.isSessionNode) {
          return d.y;
        }
        else{
          var shiftY = -10 - 1.1 * (defaultRadiusScale(parseInt(d.mentions) + 1));
          return d.y + shiftY;
        }
      })
      .attr("class", "nodeLabel")
      .attr("id", function(d) {
        return d.nodeId;
      })
      .text(function(d) {
        if (d.isGroupNode) return d.totalWordChainIndex;
        if (d.isSessionNode) return d.wordChainIndex;
        return d.text;
      })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .style("opacity", 1e-6)
      .style("fill", "#ffffff")
      .style("font-size", function(d) {
        if (d.isGroupNode) return fontSizeScale(d.totalWordChainIndex + 1.1) + "px";
        if (d.isSessionNode) return fontSizeScale(d.wordChainIndex + 1.1) + "px";
        return fontSizeScale(d.mentions + 1.1) + "px";
      })
      .transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1.0);

    nodeLabels
      .exit().remove();


    return (callback(null, "updateNodeLabels"));
  }

  function updateForceDisplay() {

    updateForceDisplayReady = false;

    async.series(
      [
        ageNodes,
        ageLinks,
        processDeadNodesHash,
        processDeadLinksHash,
        updateLinks,
        updateNodes,
        updateGroupsCircles,
        // updateSessionCircles,
        updateSessionLabels,
        updateNodeCircles,
        updateNodeLabels,
      ],

      function(err, result) {
        if (err) {
          console.error("*** ERROR: updateForceDisplayReady *** \nERROR: " + err);
        }

        if (forceStopped) {
          force.start();
          forceStopped = false;
        }
        updateForceDisplayReady = true;
      }
    );
  }

  // ===================================================================

  function nodeFill(age) {
    return fillColorScale(age);
  }

  function nodeMouseOver(d) {

    mouseHoverFlag = true;
    mouseHoverNodeId = d.nodeId;

    var nodeId = d.nodeId;
    var sId = d.sessionId;
    var uId = d.userId;
    var mentions = d.mentions;
    var currentR = d3.select(this).attr("r");

    d3.select("body").style("cursor", "pointer");

    d3.select(this)
      .attr("mouseover", 1)
      .style("fill", palette.blue)
      .style("opacity", 1)
      .style("stroke", palette.red)
      .style("stroke-width", 3)
      .attr("r", function() {
        return Math.max(mouseOverRadius, currentR);
      });

    divTooltip.transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1.0);

    var tooltipString = "<bold>" + nodeId + "</bold>" 
      + "<br>MENTIONS: " + mentions 
      + "<br>" + uId 
      + "<br>" + sId;

    divTooltip.html(tooltipString)
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");
  }

  function nodeMouseOut() {

    mouseHoverFlag = false;

    var fillColor = nodeFill(age);

    d3.select("body").style("cursor", "default");

    d3.select(this)
      .style("fill", fillColor)
      .style("stroke", "#eeeeee")
      .style("stroke-width", 1.5)
      .attr("mouseover", 0)
      .attr("r", function(d) {
        return defaultRadiusScale(d.mentions + 1);
      });

    divTooltip.transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1e-6);
  }

  function nodeClick(d) {
    launchSessionView(d.sessionId);
  }
  // SESSION CIRCLE
  function sessionCircleMouseOver(d) {

    console.log("MOUSE OVER" + " | ID: " + d.nodeId
      // + " | NID: " + d.nodeId
      // + " | UID: " + d.userId
      // + jsonPrint(d)
    );

    mouseHoverFlag = true;
    mouseHoverNodeId = d.sessionId;

    var sId = d.sessionId;
    var uId = d.userId;
    var wordChainIndex = d.wordChainIndex;
    var currentR = d3.select(this).attr("r");

    d3.select("body").style("cursor", "pointer");

    d3.select(this)
      .attr("mouseover", 1)
      .style("fill", palette.red)
      .style("opacity", 1)
      .style("stroke", palette.white)
      .style("stroke-width", 8)
      .attr("r", function() {
        return Math.max(mouseOverRadius, currentR);
      });

    sessionLabelSvgGroup.select('#' + d.nodeId)
      .attr("mouseover", 1)
      .style("opacity", 1);

    nodeSvgGroup.select('#' + d.nodeId)
      .attr("mouseover", 1)
      .style("fill", palette.yellow)
      .style("opacity", 1)
      .style("stroke", palette.red)
      .style("stroke-width", 3)
      .attr("r", function() {
        return Math.max(mouseOverRadius, currentR);
      });

    divTooltip.transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1.0);

    var tooltipString = "ENT: " + d.tags.entity
      + "<br>CH: " + d.tags.channel
      + "<br>WORDS: " + wordChainIndex
      + "<br>" + sId;

    divTooltip.html(tooltipString)
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");
  }

  function sessionCircleMouseOut(d) {

    mouseHoverFlag = false;

    d3.select("body").style("cursor", "default");

    d3.select(this)
      .style("fill", function(d) {
        return d.interpolateColor(0.25);
      })
      .style("opacity", 1)
      .style('stroke', function(d) {
        return d.interpolateColor(0.95);
      })
      .style("stroke-width", 2.5)
      .attr("mouseover", 0)
      .attr("r", function(d) {
        return sessionCircleRadiusScale(d.wordChainIndex + 1);
      });

    sessionLabelSvgGroup.select('#' + d.nodeId)
      .attr("mouseover", 0);

    nodeSvgGroup.select('#' + d.nodeId)
      .attr("mouseover", 0);

    divTooltip.transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1e-6);
  }

  function sessionCircleClick(d) {
    launchSessionView(d.sessionId);
  }

  function ageLinks(callback) {

    if (self.disableLinks)  return (callback(null, null));

    var ageLinksLength = links.length - 1;
    var ageLinksIndex = links.length - 1;

    var currentSession;
    var currentLinkObject = {};
    var dateNow = moment().valueOf();

    for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {

      currentLinkObject = links[ageLinksIndex];

      if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD';
      } else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.source.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD SOURCE';
      } else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.target.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD TARGET';
      } else if (!nodeHashMap.has(currentLinkObject.source.nodeId)) {
        deadLinksHash[currentLinkObject.linkId] = 'UNDEFINED SOURCE';
      } else if (!nodeHashMap.has(currentLinkObject.target.nodeId)) {
        deadLinksHash[currentLinkObject.linkId] = 'UNDEFINED TARGET';
      } else {
        if (currentLinkObject.source.age > currentLinkObject.target.age) {
          currentLinkObject.age = currentLinkObject.source.age;
          currentLinkObject.ageMaxRatio = currentLinkObject.source.ageMaxRatio;
        } else {
          currentLinkObject.age = currentLinkObject.target.age;
          currentLinkObject.ageMaxRatio = currentLinkObject.target.ageMaxRatio;
          links[ageLinksIndex] = currentLinkObject;
        }
      }
    }

    if ((links.length == 0) || (ageLinksIndex < 0)) {
      return (callback(null, null));
    }
  }

  this.addSession = function(newSession) {
    if (!forceStopped){
      force.stop();
      forceStopped = true;
    }
    sessions.push(newSession);
  }

  this.addGroup = function(newGroup) {
    force.stop();
    forceStopped = true;
    groups.push(newGroup);
  }

  this.deleteSessionLinks = function(sessionId) {
    if (self.disableLinks)  return ;

    var deletedSession;
    var deadSessionFlag = false;

    var sessionsLength = sessions.length - 1;
    var sessionIndex = sessions.length - 1;

    for (sessionIndex = sessionsLength; sessionIndex >= 0; sessionIndex -= 1) {
      deletedSession = sessions[sessionIndex];
      if (deletedSession.sessionId == sessionId) {

        var linksLength = links.length - 1;
        var linkIndex = links.length - 1;


        for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
          var link = links[linkIndex];
          if (link.sessionId == sessionId) {
            deadLinksHash[link.linkId] = 1;
          }
        }

        if (linkIndex < 0) {
          console.log("XXX SESS NODE " + deletedSession.node.nodeId);
          self.deleteNode(deletedSession.node.nodeId);
          sessions.splice(sessionIndex, 1);
          return;
        }
      }
    }
    if ((sessionIndex < 0) && (linkIndex < 0)) {
      return;
    }
  }

  this.addNode = function(newNode) {
    force.stop();
    forceStopped = true;
    nodes.push(newNode);
    force.nodes(nodes);
  }

  this.updateNode = function(uNode) {
    console.error("updateNode\n" + jsonPrint(uNode));

    updateNodeFlag = true;
    force.stop();
    forceStopped = true;

    var node;
    var nodesLength = nodes.length - 1;
    var nodeIndex = nodesLength;

    for (nodeIndex = nodesLength; nodeIndex >= 0; nodeIndex -= 1) {
      node = nodes[nodeIndex];
      if (node.nodeId == uNode.nodeId) {
        console.error("updateNode PREVIOUS\n" + jsonPrint(node));
        nodes[nodeIndex] = uNode;
        console.error("updateNode UPDATED\n" + jsonPrint(uNode));
      }
    }

    if (nodeIndex < 0) {
      force.nodes(nodes);
      force.links(links);
      updateNodeFlag = false;
      forceStopped = false;
      console.error("updateNode DONE");
      return;
    }

  }

  this.deleteNode = function(nodeId) {

    force.stop();
    forceStopped = true;

    var nodesLength = nodes.length - 1;
    var linksLength = links.length - 1;

    var node;
    var deadNodeFlag = false;

    var nodeIndex = nodesLength;
    var linkIndex = linksLength;

    for (nodeIndex = nodesLength; nodeIndex >= 0; nodeIndex -= 1) {
      node = nodes[nodeIndex];
      if (node.nodeId == nodeId) {

        for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
          var link = links[linkIndex];
          var linkId = link.linkId;
          if (node.links[linkId]) {
          }
        }

        if (linkIndex < 0) {
          nodes.splice(nodeIndex, 1);
          force.nodes(nodes);

          return;
        }
      }
    }
    if ((nodeIndex < 0) && (linkIndex < 0)) {
      nodes.splice(nodeIndex, 1);
      force.nodes(nodes);
      console.error("XXX NODE NOT FOUND ??? " + nodeId);
      return;
    }
  }

  this.addLink = function(newLink) {

    if (self.disableLinks)  return ;
    force.stop();
    forceStopped = true;
    links.push(newLink);
    // if (newLink.isGroupLink){
    //   console.error("ADD GROUP LINK | " + newLink.linkId);
    // }
    force.links(links);
  }

  this.deleteLink = function(linkId) {

    force.stop();
    forceStopped = true;

    var linksLength = links.length - 1;

    var linkIndex = linksLength;

    for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
      if (linkId == links[linkIndex].linkId) {
        links.splice(linkIndex, 1);
        force.links(links);
        return;
      }
    }

    if (linkIndex < 0) {
      return;
    }
  }
  this.initD3timer = function() {

  force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .gravity(gravity)
    .friction(friction)
    .charge(charge)
    .linkStrength(globalLinkStrength)
    .size([svgForceLayoutAreaWidth, svgForceLayoutAreaHeight])
    .on("tick", tick);

    d3.timer(function() {
      tickNumber++;
      dateNow = moment().valueOf();
      if (!pauseFlag 
        && !updateNodeFlag 
        && updateForceDisplayReady 
        && (!mouseFreezeEnabled || (mouseFreezeEnabled && !mouseMovingFlag))){
        updateForceDisplay();
      }
    });
  }

  this.resize = function() {
    console.log("RESIZE");

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

    d3LayoutWidth = window.innerWidth * D3_LAYOUT_WIDTH_RATIO; // double the width for now
    d3LayoutHeight = window.innerHeight * D3_LAYOUT_HEIGHT_RATIO;

    svgcanvas
      .attr("width", SVGCANVAS_WIDTH_RATIO * window.innerWidth)
      .attr("height", SVGCANVAS_HEIGHT_RATIO * window.innerHeight);

    svgForceLayoutAreaWidth = d3LayoutWidth * FORCE_LAYOUT_WIDTH_RATIO;
    svgForceLayoutAreaHeight = d3LayoutHeight * FORCE_LAYOUT_HEIGHT_RATIO;

    svgForceLayoutArea.attr("width", svgForceLayoutAreaWidth)
      .attr("height", svgForceLayoutAreaHeight);

    svgForceLayoutArea.attr("x", 0);
    svgForceLayoutArea.attr("y", 0);

    force.size([svgForceLayoutAreaWidth, svgForceLayoutAreaHeight]);
  }

  // ==========================================
  var testAddNodeInterval;

  this.deleteRandomNode = function() {
    if (nodes.length == 0) return;
    if ((nodes.length < 5) && (randomIntFromInterval(0, 100) < 80)) return;
    if (randomIntFromInterval(0, 100) < 5) return;
    force.stop();
    forceStopped = true;
    var index = randomIntFromInterval(0, nodes.length - 1);
    var node = nodes[index];
    self.deleteNode(node.nodeId);
  }

  this.addRandomNode = function() {

    force.stop();
    forceStopped = true;

    var randomNumber360 = randomIntFromInterval(0, 360);
    var randomNumber256 = randomIntFromInterval(0, 256);

    var sessionId = 'session_' + randomNumber360;
    var userId = 'user_' + randomNumber360;
    var nodeId = 'testNode' + tickNumber;
    var mentions = randomIntFromInterval(0, 1000000);
    var wordChainIndex = tickNumber;
    var text = randomNumber360 + ' | ' + mentions;

    var startColor = "hsl(" + randomNumber360 + ",0.8,0.5)";
    var endColor = "black";

    var interpolateNodeColor = d3.interpolateRgb(startColor, endColor);

    var newNode = {
      nodeId: nodeId,
      sessionId: sessionId,
      userId: userId,
      text: text,
      mentions: mentions,
      wordChainIndex: wordChainIndex,
      startColor: startColor,
      endColor: endColor,
      interpolateColor: interpolateNodeColor,
      x: 0.5 * window.innerWidth + randomIntFromInterval(0, 100),
      y: 0.5 * window.innerHeight + randomIntFromInterval(0, 100),
      age: 0,
      lastSeen: dateNow,
    }

    newNode.links = {};

    self.addNode(newNode);
  }

  var testSessionIndex = 0;

  this.addRandomLink = function() {

    if (nodes.length < 2) {
      return;
    }

    force.stop();
    forceStopped = true;

    var sessionId = 'testSession' + testSessionIndex;
    var linkId = 'testLink' + tickNumber;

    var sourceNodeIndex = randomIntFromInterval(0, nodes.length - 1);
    var targetNodeIndex = randomIntFromInterval(0, nodes.length - 1);

    while (sourceNodeIndex == targetNodeIndex) {
      sourceNodeIndex = randomIntFromInterval(0, nodes.length - 1);
      targetNodeIndex = randomIntFromInterval(0, nodes.length - 1);
    }

    var sourceNode = nodes[sourceNodeIndex];
    var targetNode = nodes[targetNodeIndex];

    var newLink = {
      sessionId: sessionId,
      linkId: linkId,
      age: 0,
      source: {},
      target: {}
    }

    sourceNode.links[linkId] = 1;
    targetNode.links[linkId] = 1;

    newLink.source = sourceNode;
    newLink.target = targetNode;

    nodes[sourceNodeIndex] = sourceNode;
    nodes[targetNodeIndex] = targetNode;

    self.addLink(newLink);
  }

  this.clearTestAddNodeInterval = function() {
    clearInterval(testAddNodeInterval);
  }

  this.initTestAddNodeInterval = function(interval) {
    clearInterval(testAddNodeInterval);
    testAddNodeInterval = setInterval(function() {
      self.addRandomNode();
    }, interval);
  }

  var testAddLinkInterval;

  this.clearTestAddLinkInterval = function() {
    clearInterval(testAddLinkInterval);
  }

  this.initTestAddLinkInterval = function(interval) {
    clearInterval(testAddLinkInterval);
    testAddLinkInterval = setInterval(function() {
      if (nodes.length > 1) {
        self.addRandomLink();
      }
    }, interval);
  }

  var testDeleteNodeInterval;

  this.clearTestDeleteNodeInterval = function() {
    clearInterval(testDeleteNodeInterval);
  }

  this.initTestDeleteNodeInterval = function(interval) {
    clearInterval(testDeleteNodeInterval);
    testDeleteNodeInterval = setInterval(function() {
      self.deleteRandomNode();
    }, interval);
  }

  self.reset = function() {
    console.error("RESET");

    force.stop();

    forceStopped = true;
    updateNodeFlag = false;

    groups = [];
    sessions = [];
    nodes = [];
    links = [];

    deadNodesHash = {};
    deadLinksHash = {};

    newNodes = [];
    newLinks = [];
    resetMouseMoveTimer();
    mouseMovingFlag = false;
    self.resize();
    self.resetDefaultForce();
    force.nodes(nodes);
    if (!self.disableLinks) force.links(links);
    force.start;
    forceStopped = false;
    ageSessionsReady = true;
    ageNodesReady = true;
    updateForceDisplayReady = true;
  }

}