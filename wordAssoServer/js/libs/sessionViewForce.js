/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewForce() {

  var self = this;

  var pauseFlag = false;
  var updateNodeFlag = false;

  // ==============================================
  // GLOBAL VARS
  // ==============================================
  // var testModeEnabled = false;

  var tickNumber = 0;
  var width = window.innerWidth * 1;
  var height = window.innerHeight * 1;

  this.getWidth = function() {
    return width;
  }

  this.getHeight = function() {
    return height;
  }

  var dateNow = moment().valueOf();
  var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
  var defaultTimePeriodFormat = "HH:mm:ss";

  // var dragEndEvent = new Event('dragEnd');
  // var dragEndEvent = new CustomEvent('dragEnd', { 'position': { 'x': elem.x, 'y': elem.y } });

  var ageNodesReady = true;

  var minSessionNodeOpacity = 0.2;

  var mouseFreezeEnabled = false;
  var mouseHoverFlag = false;
  var mouseOverRadius = 10;
  var mouseHoverNodeId;


  var updateForceDisplayReady = true;

  var showStatsFlag = false;

  var nodeMaxAge = 20000;

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
  var linkStrength = DEFAULT_LINK_STRENGTH;
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

  var currentScale = 0.3;

  var INITIAL_X_RATIO = 0.5;
  var INITIAL_Y_RATIO = 0.5;

  var D3_LAYOUT_WIDTH_RATIO = 1.0;
  var D3_LAYOUT_HEIGHT_RATIO = 1.0;

  var FORCE_LAYOUT_WIDTH_RATIO = 1.0;
  var FORCE_LAYOUT_HEIGHT_RATIO = 1.0;

  var SVGCANVAS_WIDTH_RATIO = 2.0;
  var SVGCANVAS_HEIGHT_RATIO = 2.0;


  var DEFAULT_ADMIN_OVERLAY0_X = 0.95;
  var DEFAULT_ADMIN_OVERLAY0_Y = 0.10;

  var DEFAULT_ADMIN_OVERLAY1_X = 0.95;
  var DEFAULT_ADMIN_OVERLAY1_Y = 0.08;

  var DEFAULT_ADMIN_OVERLAY2_X = 0.95;
  var DEFAULT_ADMIN_OVERLAY2_Y = 0.12;

  var DEFAULT_ADMIN_OVERLAY3_X = 0.95;
  var DEFAULT_ADMIN_OVERLAY3_Y = 0.06;

  var DEFAULT_STATS_OVERLAY1_X = 0.05;
  var DEFAULT_STATS_OVERLAY1_Y = 0.84;

  var DEFAULT_STATS_OVERLAY2_X = 0.05;
  var DEFAULT_STATS_OVERLAY2_Y = 0.86;

  var DEFAULT_STATS_OVERLAY3_X = 0.05;
  var DEFAULT_STATS_OVERLAY3_Y = 0.88;

  var DEFAULT_STATS_OVERLAY4_X = 0.05;
  var DEFAULT_STATS_OVERLAY4_Y = 0.90;

  var DEFAULT_DATE_TIME_OVERLAY_X = 0.95;
  var DEFAULT_DATE_TIME_OVERLAY_Y = 0.04;

  var forceStopped = true;

  var createNodeQueue = [];
  var createLinkQueue = [];
  // var nodeDeleteQueue = [];

  var deadNodesHash = {};
  var deadLinksHash = {};

  var newNodes = [];
  var newLinks = [];

  var mouseHoverFlag = false;
  var mouseHoverNodeId;

  var translate = [0, 0];

  var zoomWidth = (width - (currentScale * width)) / 2;
  var zoomHeight = (height - (currentScale * height)) / 2;

  var d3LayoutWidth = width * D3_LAYOUT_WIDTH_RATIO;
  var d3LayoutHeight = height * D3_LAYOUT_HEIGHT_RATIO;

  console.log("width: " + width + " | height: " + height);


  var ADMIN_OVERLAY0_X;
  var ADMIN_OVERLAY0_Y;

  var ADMIN_OVERLAY1_X;
  var ADMIN_OVERLAY1_Y;

  var ADMIN_OVERLAY2_X;
  var ADMIN_OVERLAY2_Y;

  var ADMIN_OVERLAY3_X;
  var ADMIN_OVERLAY3_Y;

  var STATS_OVERLAY1_X;
  var STATS_OVERLAY1_Y;

  var STATS_OVERLAY2_X;
  var STATS_OVERLAY2_Y;

  var STATS_OVERLAY3_X;
  var STATS_OVERLAY3_Y;

  var STATS_OVERLAY4_X;
  var STATS_OVERLAY4_Y;

  var DATE_TIME_OVERLAY_X;
  var DATE_TIME_OVERLAY_Y;

  STATS_OVERLAY1_X = DEFAULT_STATS_OVERLAY1_X * width;
  STATS_OVERLAY1_Y = DEFAULT_STATS_OVERLAY1_Y * height;

  STATS_OVERLAY2_X = DEFAULT_STATS_OVERLAY2_X * width;
  STATS_OVERLAY2_Y = DEFAULT_STATS_OVERLAY2_Y * height;

  STATS_OVERLAY3_X = DEFAULT_STATS_OVERLAY3_X * width;
  STATS_OVERLAY3_Y = DEFAULT_STATS_OVERLAY3_Y * height;

  STATS_OVERLAY4_X = DEFAULT_STATS_OVERLAY4_X * width;
  STATS_OVERLAY4_Y = DEFAULT_STATS_OVERLAY4_Y * height;

  DATE_TIME_OVERLAY_X = DEFAULT_DATE_TIME_OVERLAY_X * width;
  DATE_TIME_OVERLAY_Y = DEFAULT_DATE_TIME_OVERLAY_Y * height;



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


  var adjustedAgeRateScale = d3.scale.pow().domain([1, 500]).range([1.0, 100.0]);
  var fontSizeScale = d3.scale.linear().domain([1, 100000000]).range([35.0, 70]);

  var sessionCircleRadiusScale = d3.scale.log().domain([1, 2000000]).range([40.0, 100.0]); // uses wordChainIndex
  var defaultRadiusScale = d3.scale.log().domain([1, 2000000]).range([1.0, 40.0]);

  var fillColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#111111", "#000000"]);

  var strokeColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#444444", "#000000"]);

  var linkColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#666666", "#444444"]);


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

  var sessions = [];
  var nodes = [];
  var links = [];


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

  var nodeInitialX = INITIAL_X_RATIO * svgForceLayoutAreaWidth;
  var nodeInitialY = INITIAL_Y_RATIO * svgForceLayoutAreaHeight;

  console.log("nodeInitialX: " + nodeInitialX + " | nodeInitialY: " + nodeInitialY);


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

  var sessionSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "sessionSvgGroup");
  var sessionLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "sessionLabelSvgGroup");
  var sessionGnode = sessionSvgGroup.selectAll("g.session");
  var sessionCircles = sessionSvgGroup.selectAll(".sessionCircle");
  var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");

  var linkSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "linkSvgGroup");

  var nodeSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

  var node = nodeSvgGroup.selectAll("g.node");
  var nodeCircles = nodeSvgGroup.selectAll("circle");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

  var link = linkSvgGroup.selectAll("line");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);

  function sessionCircleDragMove(d) {

    // console.error("sessionCircleDragMove"
    //   + " | " + d.nodeId
    //   + " | " + d3.event.x + " " + d3.event.y
    // );

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

    sessionGnode.select('#' + d.sessionId)
      .attr("px", x)
      .attr("py", y)
      .attr("x", x)
      .attr("y", y);


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
        var shiftY = -1.4 * (sessionCircleRadiusScale(d.wordChainIndex + 1));
        return d.y + shiftY;
      });

    document.dispatchEvent(sessionDragEndEvent);
      tick();
        updateNodes();
        updateLinks();
        updateSessionCircles();
        updateNodeCircles();
        updateNodeLabels();

  }

  // Define drag beavior
  var drag = d3.behavior.drag()
    .origin(function(d) {
      // d3.event.sourceEvent.stopPropagation();
      return d;
    })
    .on("drag", sessionCircleDragMove);

  drag.on("dragstart", function() {
    d3.event.sourceEvent.stopPropagation(); // silence other listeners
  });

  drag.on("dragend", function(d) {
    console.warn("d\n" + jsonPrint(d));
    console.warn("DRAG END" + "\n" + jsonPrint(dragEndPosition));
    // document.dispatchEvent(sessionDragEndEvent);
    // d3.event.sourceEvent.stopPropagation(); // silence other listeners
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
    sessionGnode
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      });

    node
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      });

    sessionCircles
      .attr("r", function(d) {
        return sessionCircleRadiusScale(d.wordChainIndex + 1);
      })
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });

    sessionLabels
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        var shiftY = -1.4 * (sessionCircleRadiusScale(d.wordChainIndex + 1));
        return d.y + shiftY;
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

    nodeCircles
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });

    nodeLabels
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        var shiftY = -10 - 1.1 * (defaultRadiusScale(d.mentions + 1));
        return d.y + shiftY;
      });
  }

  var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .gravity(gravity)
    .friction(friction)
    .charge(charge)
    .linkStrength(linkStrength)
    .size([svgForceLayoutAreaWidth, svgForceLayoutAreaHeight])
    .on("tick", tick);

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
    linkStrength = value;
    force.linkStrength(linkStrength);
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
  var nodeIndex = 0;
  var tempMentions;
  var numberSessionsUpdated = 0;


  function ageNodes(callback) {

    // console.log("ageNodes: " + nodes.length);
    var numDeadNodes = Object.keys(deadNodesHash);
    // console.log("deadNodesHash: " + numDeadNodes.length);

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

      if (node.isDead) {
        deadNodesHash[node.nodeId] = 1;
      } else if (!node.isSessionNode && (age >= nodeMaxAge)) {
        node.ageUpdated = dateNow;
        node.age = age;
        node.isDead = true;
        nodes[ageNodesIndex] = node;
        deadNodesHash[node.nodeId] = 1;
        // console.log("XXX DEAD NODE " + node.nodeId);
      } else {
        node.ageUpdated = dateNow;
        node.age = age;
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
        force.nodes(nodes);
        delete deadNodesHash[node.nodeId];
      }
      deadNodeIds = Object.keys(deadNodesHash);
    }

    if ((nodes.length == 0) || (deadNodeIds.length == 0) || (ageNodesIndex < 0)) {
      return (callback());
    }
  }

  function updateNodes(callback) {

    node = node.data(force.nodes(), function(d) {
        return d.nodeId;
      })
      .attr("userId", function(d) {
        return d.userId;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("mentions", function(d) {
        return d.mentions;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
      });

    node.enter()
      .append("svg:g")
      .attr("class", "node")
      .attr("id", function(d) {
        return d.nodeId;
      })
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .attr("userId", function(d) {
        return d.userId;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("mentions", function(d) {
        return d.mentions;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
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
      .attr("sourceNodeId", function(d) {
        return d.source.nodeId;
      })
      .attr("targetNodeId", function(d) {
        return d.target.nodeId;
      })
      .style('stroke', function(d) {
        return linkColorScale(d.age);
      })
      .style('opacity', function(d) {
        return 0.1 + ((nodeMaxAge - d.age) / nodeMaxAge);
      });

    link.enter()
      .append("svg:line")
      .attr("class", "link")
      .attr("id", function(d) {
        return d.linkId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .attr("sourceNodeId", function(d) {
        return d.source.nodeId;
      })
      .attr("targetNodeId", function(d) {
        return d.target.nodeId;
      })
      .style('stroke', function(d) {
        return linkColorScale(d.age);
      })
      .style('stroke-width', 1.75)
      .style('opacity', 1e-6)
      .transition()
      .duration(defaultFadeDuration)
      .style('opacity', function(d) {
        return 0.1 + ((nodeMaxAge - d.age) / nodeMaxAge);
      });

    link
      .exit()
      .remove();

    return (callback(null, "updateLinks"));
  }

  function updateSessionCircles(callback) {

    // console.log("updateSessionCircles");

    var dateNow = moment().valueOf();

    sessionCircles = sessionSvgGroup.selectAll("circle")
      .data(sessions, function(d) {
        return d.sessionId;
      });

    sessionCircles
      .attr("id", function(d) {
        return d.nodeId;
      })
      .attr("r", function(d) {
        return sessionCircleRadiusScale(d.wordChainIndex + 1);
      })
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .style("fill", function(d) {
        return d.interpolateColor(0.25);
      })
      .style('opacity', function(d) {
        return (nodeMaxAge - (dateNow - d.lastSeen)) / nodeMaxAge;
      })
      .style('stroke', function(d) {
        return d.interpolateColor(0.95)
      })
      .style("stroke-opacity", 0.8);


    sessionCircles
      .enter()
      .append("svg:circle")
      .attr("id", function(d) {
        return d.nodeId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .attr("class", "sessionCircle")
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .attr("mouseover", 0)
      .on("mouseover", sessionCircleMouseOver)
      .on("mouseout", sessionCircleMouseOut)
      .on("dblclick", sessionCircleClick)
      .call(drag)
      .attr("r", 1e-6)
      .style("visibility", "visible")
      .style("fill", function(d) {
        return d.interpolateColor(0.5);
      })
      .style("opacity", 1e-6)
      .style('stroke', function(d) {
        return d.interpolateColor(0.75);
      })
      .style("stroke-width", 2.5)
      .style("stroke-opacity", 0.8)
      .transition()
      .duration(defaultFadeDuration)
      .attr("r", function(d) {
        return sessionCircleRadiusScale(d.wordChainIndex + 1);
      })
      .style('opacity', 0.5);

    sessionCircles
      .exit()
      .remove();


    sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel")
      .data(sessions, function(d) {
        return d.sessionId;
      })
      .text(function(d) {
        return d.text;
      })
      .style("font-size", function(d) {
        return fontSizeScale(1000.1) + "px";
      })
      .style('opacity', function(d) {
        return (nodeMaxAge - (dateNow - d.lastSeen)) / nodeMaxAge;
      });

    sessionLabels.enter()
      .append("svg:text")
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        var shiftY = -1.4 * (sessionCircleRadiusScale(d.wordChainIndex + 1));
        return d.y + shiftY;
      })
      .attr("class", "sessionLabel")
      .attr("id", function(d) {
        return d.nodeId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .text(function(d) {
        return d.text;
      })
      .style("text-anchor", "middle")
      .style("opacity", 1e-6)
      .style('fill', "#ffffff")
      .style("font-size", function(d) {
        return fontSizeScale(1000.1) + "px";
      })
      .transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1.0);

    sessionLabels
      .exit().remove();


    return (callback(null, "updateSessionCircles"));
  }

  function updateNodeCircles(callback) {

    // console.log("updateNodeCircles");

    nodeCircles = nodeSvgGroup.selectAll("circle")
      .data(force.nodes(), function(d) {
        return d.nodeId;
      });

    nodeCircles
      .attr("r", function(d) {
        return defaultRadiusScale(d.mentions + 1);
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
        else if (d.age < (0.01 * nodeMaxAge)) {
          return "#ffffff";
        }
        else {
          return d.interpolateColor((nodeMaxAge - d.age) / nodeMaxAge);
        }
      })
      .style('opacity', function(d) {
        if (d.age >= nodeMaxAge) {
          return 0;
        }
        return 1
      })
      .style('stroke', function(d) {
        return strokeColorScale(d.age);
      })
      .style('stroke-opacity', function(d) {
        return (nodeMaxAge - d.age) / nodeMaxAge;
      });

    nodeCircles
      .enter()
      .append("svg:circle")
      .attr("id", function(d) {
        return d.nodeId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
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
      .attr("r", function(d) {
        return defaultRadiusScale(d.mentions + 1);
      })
      .style("visibility", "visible")
      .style("opacity", 1.0)
      .style('stroke', function(d) {
        return strokeColorScale(d.age);
      })
      .style("stroke-width", 2.5)
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
        if (d.isSessionNode) return d.wordChainIndex;
        return d.text;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        var shiftY = -10 - 1.1 * (defaultRadiusScale(d.mentions + 1));
        return d.y + shiftY;
      })
      .style("font-size", function(d) {
        return fontSizeScale(d.mentions + 1.1) + "px";
      })
      .style('opacity', function(d) {
        return (nodeMaxAge - d.age) / nodeMaxAge;
      });

    nodeLabels.enter()
      .append("svg:text")
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("class", "nodeLabel")
      .attr("id", function(d) {
        return d.nodeId;
      })
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .text(function(d) {
        if (d.isSessionNode) return d.wordChainIndex;
        return d.text;
      })
      .style("text-anchor", "middle")
      .style("opacity", 1e-6)
      .style("fill", "#ffffff")
      .style("font-size", function(d) {
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

    // console.log("updateForceDisplay");

    updateForceDisplayReady = false;

    async.series(
      [
        ageNodes,
        ageLinks,
        processDeadNodesHash,
        processDeadLinksHash,
        updateNodes,
        updateLinks,
        updateSessionCircles,
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
          // console.warn("force start");
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

    var tooltipString = "<bold>" + nodeId + "</bold>" + "<br>MENTIONS: " + mentions + "<br>" + uId + "<br>" + sId;

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

  // function nodeFill(age) {
  //   return fillColorScale(age);
  // }

  // SESSION CIRCLE
  function sessionCircleMouseOver(d) {

    console.log("MOUSE OVER" + " | ID: " + d.id
      // + " | NID: " + d.nodeId
      // + " | UID: " + d.userId
      // + jsonPrint(d)
    );

    mouseHoverFlag = true;
    mouseHoverNodeId = d.sessionId;

    // var nodeId = d.nodeId;
    var sId = d.sessionId;
    var uId = d.userId;
    var wordChainIndex = d.wordChainIndex;
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

    var tooltipString = "<bold>" + uId + "<br>" + sId + "</bold>" + "<br>WORDS: " + wordChainIndex;

    divTooltip.html(tooltipString)
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");
  }

  function sessionCircleMouseOut() {

    mouseHoverFlag = false;

    d3.select("body").style("cursor", "default");

    d3.select(this)
      .style("fill", function(d) {
        return d.interpolateColor(0.25);
      })
      .style("opacity", 0.5)
      .style('stroke', function(d) {
        return d.interpolateColor(0.95);
      })
      .style("stroke-width", 2.5)
      .attr("mouseover", 0)
      .attr("r", function(d) {
        return sessionCircleRadiusScale(d.wordChainIndex + 1);
      });

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

      // console.log("currentLinkObject\n" + jsonPrint(currentLinkObject));

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
        } else {
          currentLinkObject.age = currentLinkObject.target.age;
          links[ageLinksIndex] = currentLinkObject;
        }
      }
    }

    if ((links.length == 0) || (ageLinksIndex < 0)) {
      return (callback(null, null));
    }
  }

  this.addSession = function(newSession) {
    // console.warn("addSession: " + newSession.sessionId);
    force.stop();
    forceStopped = true;
    sessions.push(newSession);
  }

  this.deleteSessionLinks = function(sessionId) {
    // console.log("deleteSessionLinks " + sessionId);
    if (self.disableLinks)  return ;

    var deletedSession;
    var deadSessionFlag = false;

    var sessionsLength = sessions.length - 1;
    var sessionIndex = sessions.length - 1;

    for (sessionIndex = sessionsLength; sessionIndex >= 0; sessionIndex -= 1) {
      deletedSession = sessions[sessionIndex];
      if (deletedSession.sessionId == sessionId) {

        // console.log("XXX SESS " + sessionId
        //     // + "\n" + jsonPrint(session)
        // );

        var linksLength = links.length - 1;
        var linkIndex = links.length - 1;


        for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
          var link = links[linkIndex];
          if (link.sessionId == sessionId) {
            // console.warn("XXX SESS LINK " + link.linkId);
            deadLinksHash[link.linkId] = 1;
          }
        }

        if (linkIndex < 0) {
          console.log("XXX SESS NODE " + deletedSession.userId);
          self.deleteNode(deletedSession.userId);
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
    // console.log("addNode\n" + jsonPrint(newNode));
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
    // console.log("deleteNode " + nodeId);

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

        // console.log("XXX NODE " + nodeId
        //     + "\n" + jsonPrint(node)
        // );

        for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
          var link = links[linkIndex];
          var linkId = link.linkId;
          if (node.links[linkId]) {
            // console.log("XXX LINK " + linkId);
            // links.splice(linkIndex, 1);
          }
        }

        if (linkIndex < 0) {
          nodes.splice(nodeIndex, 1);
          force.nodes(nodes);
          // console.error("slice nodes: nodeIndex " + nodeIndex + "\n"  + jsonPrint(nodes));

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
    // console.warn("addLink" 
    //   + " | LID: " + newLink.linkId 
    //   + " | SID: " + newLink.sessionId 
    //   + " | UID: " + newLink.userId
    //   + " | " + newLink.source.nodeId
    //   + " > " + newLink.target.nodeId
    //   );
    force.stop();
    forceStopped = true;
    links.push(newLink);
    force.links(links);
  }

  this.deleteLink = function(linkId) {

    force.stop();
    forceStopped = true;

    var linksLength = links.length - 1;

    var linkIndex = linksLength;

    for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
      if (linkId == links[linkIndex].linkId) {
        // console.log("XXX LINK " + linkId);
        links.splice(linkIndex, 1);
        force.links(links);
        return;
      }
    }

    if (linkIndex < 0) {
      return;
    }
  }


  // function initD3timer() {
  this.initD3timer = function() {
    d3.timer(function() {
      tickNumber++;
      dateNow = moment().valueOf();
      if (!pauseFlag && !updateNodeFlag && updateForceDisplayReady && (!mouseFreezeEnabled || (mouseFreezeEnabled && !mouseMovingFlag))){
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

    radiusX = 0.5 * width;
    radiusY = 0.5 * height;

    d3LayoutWidth = width * D3_LAYOUT_WIDTH_RATIO; // double the width for now
    d3LayoutHeight = height * D3_LAYOUT_HEIGHT_RATIO;

    svgcanvas
      .attr("width", SVGCANVAS_WIDTH_RATIO * width)
      .attr("height", SVGCANVAS_HEIGHT_RATIO * height);

    svgForceLayoutAreaWidth = d3LayoutWidth * FORCE_LAYOUT_WIDTH_RATIO;
    svgForceLayoutAreaHeight = d3LayoutHeight * FORCE_LAYOUT_HEIGHT_RATIO;


    svgForceLayoutArea.attr("width", svgForceLayoutAreaWidth)
      .attr("height", svgForceLayoutAreaHeight);

    svgForceLayoutArea.attr("x", 0);
    svgForceLayoutArea.attr("y", 0);


    force.size([svgForceLayoutAreaWidth, svgForceLayoutAreaHeight]);

    nodeInitialX = INITIAL_X_RATIO * svgForceLayoutAreaWidth;
    nodeInitialY = INITIAL_Y_RATIO * svgForceLayoutAreaHeight;
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

    // var startColor = "hsl(" + randomNumber360 + ",0.8,0.5)";
    var startColor = "hsl(" + randomNumber360 + ",0.8,0.5)";
    // var endColor = "hsl(" + randomNumber360 + ",0,0)";
    var endColor = "black";

    var interpolateNodeColor = d3.interpolateRgb(endColor, startColor);

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
      x: 0.5 * width + randomIntFromInterval(0, 100),
      y: 0.5 * height + randomIntFromInterval(0, 100),
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

    // console.log("sourceNodeIndex: " + sourceNodeIndex);
    // console.log("targetNodeIndex: " + targetNodeIndex);

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
    nodes = [];
    links = [];
    createNodeQueue = [];
    createLinkQueue = [];

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
    ageNodesReady = true;
    updateForceDisplayReady = true;
  }

}