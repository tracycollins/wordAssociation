/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewHistogram() {

  var self = this;

  // ==============================================
  // GLOBAL VARS
  // ==============================================

  var removeDeadNodes = false;
  var minOpacity = 0.2;
  var defaultFadeDuration = 100;

  var testModeEnabled = false;

  var tickNumber = 0;
  var width = window.innerWidth * 1;
  var height = window.innerHeight * 1;

  var newWordFlag = false;


  var maxSessionRows = 25;
  var maxWordRows = 25;

  var marginTopSessions = 15; // %
  var marginLeftSessions = 0;

  var marginTopWords = 15; // %
  var marginLeftWords = 15;

  var colSpacing = 20;



  var maxRecentWords = maxWordRows;
  var wordArray = [];
  var recentNodeArray = [];
  var wordMentionsArray = [];
  var recentWordMentionsArray = [];

  var dateNow = moment().valueOf();
  var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
  var defaultTimePeriodFormat = "HH:mm:ss";

  var mouseFreezeEnabled = true;
  var mouseMovingFlag = false;
  var mouseHoverFlag = false;
  var mouseOverRadius = 10;
  var mouseMoveTimeoutInterval = 1000;
  var mouseHoverNodeId;


  var updateHistogramDisplayReady = true;

  var showStatsFlag = false;

  var sessionMaxAge = window.DEFAULT_MAX_AGE;
  var nodeMaxAge = window.DEFAULT_MAX_AGE;

  var DEFAULT_CONFIG = {
    'nodeMaxAge': window.DEFAULT_MAX_AGE
  };
  var config = DEFAULT_CONFIG;
  var previousConfig = [];

  var defaultTextFill = "#888888";


  var DEFAULT_HISTOGRAM_CONFIG = {
    'ageRate': window.DEFAULT_AGE_RATE,
  };

  var ageRate = DEFAULT_HISTOGRAM_CONFIG.ageRate;

  var currentScale = 0.7;

  var radiusX = 0.5 * width;
  var radiusY = 0.5 * height;

  var INITIAL_X_RATIO = 0.5;
  var INITIAL_Y_RATIO = 0.5;

  var D3_LAYOUT_WIDTH_RATIO = 1.0;
  var D3_LAYOUT_HEIGHT_RATIO = 1.0;

  var HISTOGRAM_LAYOUT_WIDTH_RATIO = 1.0;
  var HISTOGRAM_LAYOUT_HEIGHT_RATIO = 1.0;

  var SVGCANVAS_WIDTH_RATIO = 1.0;
  var SVGCANVAS_HEIGHT_RATIO = 1.0;


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

  var createSessionNodeLinkReady = true;

  var createNodeQueue = [];
  var createLinkQueue = [];

  var deadSessionsHash = {};
  var deadNodesHash = {};
  var deadLinksHash = {};

  var newNodes = [];
  var newLinks = [];

  var mouseHoverFlag = false;
  var mouseHoverNodeId;



  var translate = [0, 0];

  var zoomWidth = (width - currentScale * width) / 2;
  var zoomHeight = (height - currentScale * height) / 2;

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
    }
    else {
      d3.select("body").style("cursor", "default");
    }

    resetMouseMoveTimer();
    mouseMovingFlag = true;

    if (mouseFreezeEnabled) {}
  }, true);


  var wordBarWidthScale = d3.scale.linear().domain([1, 2e6]).range([0.1, 65]);
  var wordOpacityScale = d3.scale.linear().domain([0, DEFAULT_MAX_AGE]).range([0.9, 0.15]);
  var placeOpacityScale = d3.scale.linear().domain([0, DEFAULT_MAX_AGE]).range([0.9, 0.15]);
  var wordBarOpacityScale = d3.scale.linear().domain([0, DEFAULT_MAX_AGE]).range([0.9, 0.15]);
  var wordCloudFontScale = d3.scale.linear().domain([1, 2e6]).range([2, 8]);
  var wordCloudAgeScale = d3.scale.linear().domain([1, DEFAULT_MAX_AGE]).range([1, 1e-6]);


  var adjustedAgeRateScale = d3.scale.pow().domain([1, 500]).range([1.0, 100.0]);
  var fontSizeScale = d3.scale.linear().domain([1, 100000000]).range([20.0, 30]);

  var sessionCircleRadiusScale = d3.scale.log().domain([1, 100000000]).range([40.0, 100.0]); // uses wordChainIndex
  var defaultRadiusScale = d3.scale.linear().domain([1, 100000000]).range([1.0, 30.0]);

  var fillColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#222222", "#000000"]);

  var strokeColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#444444", "#000000"]);

  var linkColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#666666", "#444444"]);





  console.log("@@@@@@@ CLIENT @@@@@@@@");

  var randomId = randomIntFromInterval(1000000000, 9999999999);


  function setLinkstrengthSliderValue(value) {
    document.getElementById("linkstrengthSlider").value = value * 1000;
    document.getElementById("linkstrengthSliderText").innerHTML = value.toFixed(3);
  }

  function setFrictionSliderValue(value) {
    document.getElementById("frictionSlider").value = value * 1000;
    document.getElementById("frictionSliderText").innerHTML = value.toFixed(3);
  }

  function setGravitySliderValue(value) {
    document.getElementById("gravitySlider").value = value * 1000;
    document.getElementById("gravitySliderText").innerHTML = value.toFixed(3);
  }

  function setChargeSliderValue(value) {
    document.getElementById("chargeSlider").value = value;
    document.getElementById("chargeSliderText").innerHTML = value;
  }



  d3.select("body").style("cursor", "default");


  var sessionCircleRadiusScale = d3.scale.log().domain([1, 2000000]).range([40.0, 100.0]); // uses wordChainIndex
  var defaultRadiusScale = d3.scale.log().domain([1, 2000000]).range([1.0, 40.0]);

  var fillColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#222222", "#000000"]);

  var strokeColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#444444", "#000000"]);

  var linkColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#666666", "#444444"]);


  var sessions = [];
  var nodes = [];
  var links = [];

  this.getSession = function(index) {
    return sessions[index];
  }

  var maxNumberSessions = 0;
  var maxNumberNodes = 0;
  var maxNumberLinks = 0;

  var svgHistogramLayoutAreaWidth = d3LayoutWidth * HISTOGRAM_LAYOUT_WIDTH_RATIO;
  var svgHistogramLayoutAreaHeight = d3LayoutHeight * HISTOGRAM_LAYOUT_HEIGHT_RATIO;

  var nodeInitialX = INITIAL_X_RATIO * svgHistogramLayoutAreaWidth;
  var nodeInitialY = INITIAL_Y_RATIO * svgHistogramLayoutAreaHeight;

  console.log("nodeInitialX: " + nodeInitialX + " | nodeInitialY: " + nodeInitialY);


  this.getSessionsLength = function() {
    return sessions.length;
  }

  this.displayControlOverlay = function(vis) {

    var visible = "visible";

    if (vis) {
      visible = "visible";
    }
    else {
      visible = "hidden";
    }

    d3.select("#sliderDiv").style("visibility", visible);

    d3.select("#infoButton").style("visibility", visible);
    d3.select("#statsToggleButton").style("visibility", visible);
    d3.select("#fullscreenToggleButton").style("visibility", visible);
  }

  this.displayInfoOverlay = function(opacity, color) {


    d3.select("#adminOverlay0").select("text").style("opacity", opacity);
    d3.select("#adminOverlay1").select("text").style("opacity", opacity);
    d3.select("#adminOverlay2").select("text").style("opacity", opacity);
    d3.select("#adminOverlay3").select("text").style("opacity", opacity);

    d3.select("#dateTimeOverlay").select("text").style("opacity", opacity);

    d3.select("#statsOverlay1").style("opacity", opacity);
    d3.select("#statsOverlay2").style("opacity", opacity);
    d3.select("#statsOverlay3").style("opacity", opacity);
    d3.select("#statsOverlay4").style("opacity", opacity);

    if (color) {

      console.log("displayInfoOverlay", opacity, color);

      d3.select("#adminOverlay0").select("text").style("fill", color);
      d3.select("#adminOverlay1").select("text").style("fill", color);
      d3.select("#adminOverlay2").select("text").style("fill", color);
      d3.select("#adminOverlay3").select("text").style("fill", color);

      d3.select("#dateTimeOverlay").select("text").style("fill", color);

      d3.select("#statsOverlay1").style("fill", color);
      d3.select("#statsOverlay2").style("fill", color);
      d3.select("#statsOverlay3").style("fill", color);
      d3.select("#statsOverlay4").style("fill", color);
    }
  }

  var mouseMoveTimeout = setTimeout(function() {
    d3.select("body").style("cursor", "none");
    if (!showStatsFlag && !pageLoadedTimeIntervalFlag) {
      self.displayInfoOverlay(1e-6);
      self.displayControlOverlay(false);
    }
  }, mouseMoveTimeoutInterval);



  function resetMouseMoveTimer() {
    clearTimeout(mouseMoveTimeout);

    self.displayInfoOverlay(1);
    self.displayControlOverlay(true);

    mouseMoveTimeout = setTimeout(function() {
      d3.select("body").style("cursor", "none");

      if (!showStatsFlag && !pageLoadedTimeIntervalFlag) {
        self.displayInfoOverlay(1e-6);
        self.displayControlOverlay(false);
      }

      mouseMovingFlag = false;
    }, mouseMoveTimeoutInterval);
  }

  function zoomHandler() {
    // console.log("zoomHandler: TRANSLATE: " + d3.event.translate + " | SCALE: " + d3.event.scale);
    // svgHistogramLayoutArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    if (!mouseHoverFlag) {
      svgHistogramLayoutArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
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

  var svgHistogramLayoutArea = svgcanvas.append("g")
    .attr("id", "svgHistogramLayoutArea");

  var zoomListener = d3.behavior.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", zoomHandler);

  zoomListener.translate([zoomWidth, zoomHeight]).scale(currentScale); //translate and scale to whatever value you wish
  zoomListener.event(svgcanvas.transition().duration(1000)); //does a zoom



  var sessionSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "sessionSvgGroup");
  var sessionLabelSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "sessionLabelSvgGroup");
  var sessionGnode = sessionSvgGroup.selectAll("g.session");
  var sessionCircles = sessionSvgGroup.selectAll(".sessionCircle");
  var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");
  var linkSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "linkSvgGroup");
  var nodeSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");
  var node = nodeSvgGroup.selectAll("g.node");
  var nodeCircles = nodeSvgGroup.selectAll("circle");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");
  var link = linkSvgGroup.selectAll("line");


  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);

  // function sessionCircleDragMove(d) {
  //   var x = d3.event.x;
  //   var y = d3.event.y;

  //   var dX = 1 * (-d.x + x);
  //   var dY = 1 * (-d.y + y);

  //   d3.select(this).attr("transform", "translate(" + dX + "," + dY + ")");
  //   nodeSvgGroup.selectAll('#' + d.nodeId).attr("transform", "translate(" + dX + "," + dY + ")");
  //   sessionGnode.select('#' + d.nodeId).attr("transform", "translate(" + dX + "," + dY + ")");
  //   sessionCircles.select('#' + d.userId).attr("transform", "translate(" + dX + "," + dY + ")");
  //   // sessionSvgGroup.selectAll('#' + d.nodeId).attr("transform", "translate(" + dX + "," + dY + ")");
  //   sessionLabelSvgGroup.select('#' + d.nodeId).attr("transform", "translate(" + dX + "," + dY + ")");

  //   // console.log("dragmove\n" + d.sessionId +  " | " + d.nodeId + " | currentScale: " + currentScale + " x: " + x + " y: " + y);
  // }

  // Define drag beavior
  // var drag = d3.behavior.drag()
  //   .origin(function(d) {
  //     return d;
  //   })
  //   .on("drag", sessionCircleDragMove);

  // drag.on("dragstart", function() {
  //   d3.event.sourceEvent.stopPropagation(); // silence other listeners
  // });

  // drag.on("dragend", function(d) {
  //   d3.event.sourceEvent.stopPropagation(); // silence other listeners

  //   console.warn("DRAG END" + " | " + d.nodeId + " | " + d.x + " " + d.y);
  // });

  var globalLinkIndex = 0;

  function generateLinkId(callback) {
    globalLinkIndex++;
    return "LNK" + globalLinkIndex;
  }

  //
  // HISTOGRAM LAYOUT DECLARATION
  //

  //=============================
  // TICK
  //=============================

  var age;

  //================================
  // GET NODES FROM QUEUE
  //================================

  var initialPositionIndex = 0;
  var initialPositionArray = [];

  function computeInitialPosition(index) {
    var pos = {
      x: ((0.4 * width) + (radiusX * Math.cos(index))),
      y: ((0.5 * height) - (radiusY * Math.sin(index)))
    };

    return pos;
  }

  // ===================================================================

  function ageSessions(callback) {

    if (sessions.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    }
    else if (sessions.length > 100) {
      ageRate = adjustedAgeRateScale(sessions.length - 100);
    }
    else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var session;

    var ageSessionsLength = sessions.length - 1;
    var ageSessionsIndex = sessions.length - 1;

    for (ageSessionsIndex = ageSessionsLength; ageSessionsIndex >= 0; ageSessionsIndex -= 1) {

      session = sessions[ageSessionsIndex];

      age = session.age + (ageRate * (dateNow - session.ageUpdated));

      if (session.isDead) {
        deadSessionsHash[session.sessionId] = 1;
      }
      else if (age >= sessionMaxAge) {
        session.isDead = true;
        deadSessionsHash[session.sessionId] = 1;
      }
      else {
        session.ageUpdated = dateNow;
        session.age = age;
        if (age < 0.01 * sessionMaxAge) {
          session.newFlag = true;
        }
        else {
          session.newFlag = false;
        }
        // sessions[ageSessionsIndex] = session;
      }
    }

    if (ageSessionsIndex < 0) {
      return (callback());
    }
  }

  function processDeadSessionsHash(callback) {

    if (Object.keys(deadSessionsHash).length == 0) {
      // console.warn("NO DEAD SESSIONS");
      return (callback());
    }
    // console.error("processDeadSessionsHash\n" + jsonPrint(deadSessionsHash));

    var ageSessionsLength = sessions.length - 1;
    var ageSessionsIndex = sessions.length - 1;
    var session;

    for (ageSessionsIndex = ageSessionsLength; ageSessionsIndex >= 0; ageSessionsIndex -= 1) {
      session = sessions[ageSessionsIndex];
      if (deadSessionsHash[session.sessionId]) {
        sessionDeleteQueue.push(session.sessionId);
        sessions.splice(ageSessionsIndex, 1);
        delete deadSessionsHash[session.sessionId];
        // console.log("XXX SESSION: " + session.sessionId);
      }
    }

    if (ageSessionsIndex < 0) {
      return (callback());
    }
  }

  // ===================================================================

  function ageNodes(callback) {

    if (nodes.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    }
    else if (nodes.length > 100) {
      ageRate = adjustedAgeRateScale(nodes.length - 100);
    }
    else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var node;

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {

      node = nodes[ageNodesIndex];

      age = node.age + (ageRate * (dateNow - node.ageUpdated));

      if (removeDeadNodes && node.isDead) {
        deadNodesHash[node.nodeId] = 1;
      }
      else if (removeDeadNodes && !node.isSessionNode && (age >= nodeMaxAge)) {
        node.isDead = true;
        deadNodesHash[node.nodeId] = 1;
      }
      else {
        node.ageUpdated = dateNow;
        node.age = age;
        if (age < 0.01 * nodeMaxAge) {
          node.newFlag = true;
        }
        else {
          node.newFlag = false;
        }
        // nodes[ageNodesIndex] = node;
      }
    }

    if (ageNodesIndex < 0) {
      return (callback());
    }
  }

  function processDeadNodesHash(callback) {

    if (Object.keys(deadNodesHash).length == 0) {
      // console.warn("NO DEAD NODES");
      return (callback());
    }
    // console.error("processDeadNodesHash\n" + jsonPrint(deadNodesHash));

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var node;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {
      node = nodes[ageNodesIndex];
      if (deadNodesHash[node.nodeId]) {
        nodeDeleteQueue.push(node.nodeId);
        nodes.splice(ageNodesIndex, 1);
        delete deadNodesHash[node.nodeId];
        // console.log("XXX NODE: " + node.nodeId);
      }
    }

    if (ageNodesIndex < 0) {
      return (callback());
    }
  }

  function ageLinks(callback) {

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
      }
      else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.source.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD SOURCE';
      }
      else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.target.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD TARGET';
      }
      // } else if ((typeof currentLinkObject !== 'undefined') && !linkHashMap.has(currentLinkObject.linkId)) {
      //     deadLinksHash[currentLinkObject.linkId] = 1;
      // } 
      else if (!nodeHashMap.has(currentLinkObject.source.nodeId)) {
        deadLinksHash[currentLinkObject.linkId] = 'UNDEFINED SOURCE';
      }
      else if (!nodeHashMap.has(currentLinkObject.target.nodeId)) {
        deadLinksHash[currentLinkObject.linkId] = 'UNDEFINED TARGET';
      }
      else {
        if (currentLinkObject.source.age > currentLinkObject.target.age) {
          currentLinkObject.age = currentLinkObject.source.age;
        }
        else {
          currentLinkObject.age = currentLinkObject.target.age;
          links[ageLinksIndex] = currentLinkObject;
        }
      }
    }

    if (ageLinksIndex < 0) {
      return (callback(null, null));
    }
  }

  function processDeadLinksHash(callback) {

    var ageLinksLength = links.length - 1;
    var ageLinksIndex = links.length - 1;
    var link;

    for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {
      link = links[ageLinksIndex];
      if (deadLinksHash[link.linkId]) {
        links.splice(ageLinksIndex, 1);
        // console.log("XXX LINK"
        //   + " | " + link.linkId
        //   + " | " + link.source.nodeId
        //   + " > " + link.target.nodeId
        //   + " | " + deadLinksHash[link.linkId]
        //   + " | " + deadLinksHash[link.linkId]
        // );
        delete deadLinksHash[link.linkId];
      }
    }

    if (ageLinksIndex < 0) {
      callback();
    }
  }

  // ===================================================================

  function updateSessions(callback) {

    // console.log("updateSessions");

    sessionGnode = sessionGnode.data(sessions, function(d) {
        return d.sessionId;
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("wordChainIndex", function(d) {
        return d.wordChainIndex;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
      });

    sessionGnode.enter()
      .append("svg:g")
      .attr("class", "session")
      .attr("id", function(d) {
        return d.userId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("userId", function(d) {
        return d.userId;
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("wordChainIndex", function(d) {
        return d.wordChainIndex;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
      });

    sessionGnode
      .exit()
      .remove();

    return (callback(null, "updateSessions"));
  }

  function updateSessionWords(callback) {

    var sessionWords = sessionSvgGroup.selectAll("#session")
      .data(sessions, function(d) {
        return d.userId;
      });

    sessionWords
      .attr("class", function(d) {
        return d.newFlag ? "updateNew" : "update";
      })
      // .text(function(d) { return d.mentions + " | " + d.text; })
      .attr("rank", function(d) {
        return d.rank;
      })
      .text(function(d) {
        return d.text;
      })
      .style("fill", function(d) {
        return d.newFlag ? "red" : "#ffffff";
      })
      .style("fill-opacity", function(d) {
        if (d3.select(this).attr("mouseOverFlag") == "true") {
          return 1;
        }
        else {
          // return d.newFlag ? 1 : 0.5; 
          return wordOpacityScale(d.age);
        }
      })
      // .on("mouseout", wordMouseOut)
      // .on("mouseover", wordMouseOver)
      .transition()
      .duration(defaultFadeDuration)
      .attr("x", xposition)
      .attr("y", yposition);

    sessionWords
      .enter()
      .append("svg:text")
      .attr("id", "session")
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("userId", function(d) {
        return d.userId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .attr("class", "enter")
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", xposition)
      .attr("y", yposition)
      // .on("click", function(d){
      //   window.open("http://twitter.com/search?f=realtime&q=%23" + d.text, '_blank');
      // })
      // .text(function(d) { return d.mentions + " | " + d.text; })
      .text(function(d) {
        return d.text;
      })
      .style("fill-opacity", 1e-6)
      .style("font-size", "2.2vmin")
      // .on("mouseout", sessionMouseOut)
      // .on("mouseover", sessionMouseOver)
      .transition()
      .duration(defaultFadeDuration * 2)
      .style("fill-opacity", 1);

    sessionWords
      .exit()
      .attr("class", "exit")
      .transition()
      .duration(defaultFadeDuration * 2)
      .style("fill-opacity", 1e-6)
      .remove();

    return (callback(null, "updateSessionWords"));
  }

  function updateNodes(callback) {

    // console.log("updateNodes");

    node = node.data(nodes, function(d) {
        return d.nodeId;
      })
      .attr("rank", function(d) {
        return d.rank;
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
      .attr("rank", function(d) {
        return d.rank;
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

  function updateNodeWords(callback) {

    var nodeWords = nodeSvgGroup.selectAll("#word")
      .data(nodes, function(d) {
        return d.nodeId;
      });

    nodeWords
      .attr("class", function(d) {
        return d.newFlag ? "updateNew" : "update";
      })
      // .text(function(d) { return d.mentions + " | " + d.text; })
      .attr("rank", function(d) {
        return d.rank;
      })
      .text(function(d) {
        return d.text;
      })
      .style("fill", function(d) {
        return d.newFlag ? "red" : "#ffffff";
      })
      .style("fill-opacity", function(d) {
        if (d3.select(this).attr("mouseOverFlag") == "true") {
          return 1;
        }
        else {
          if (removeDeadNodes) {
          return wordOpacityScale(d.age);
          }
          else {
            return Math.max(wordOpacityScale(d.age), minOpacity)
          }
        }
      })
      // .on("mouseout", wordMouseOut)
      // .on("mouseover", wordMouseOver)
      .transition()
      .duration(defaultFadeDuration)
      .attr("x", xposition)
      .attr("y", yposition);

    nodeWords
      .enter()
      .append("svg:text")
      .attr("id", "word")
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("class", "enter")
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", xposition)
      .attr("y", yposition)
      // .on("click", function(d){
      //   window.open("http://twitter.com/search?f=realtime&q=%23" + d.text, '_blank');
      // })
      // .text(function(d) { return d.mentions + " | " + d.text; })
      .text(function(d) {
        return d.text;
      })
      .style("fill-opacity", 1e-6)
      .style("font-size", "2.2vmin")
      .on("mouseout", nodeMouseOut)
      .on("mouseover", nodeMouseOver)
      .transition()
      .duration(defaultFadeDuration * 2)
      .style("fill-opacity", 1);

    nodeWords
      .exit()
      .attr("class", "exit")
      .transition()
      .duration(defaultFadeDuration * 2)
      .style("fill-opacity", 1e-6)
      .remove();

    return (callback(null, "updateNodeWords"));
  }

  function updateRecentNodes(node) {

    var newNodeFlag = true;
    var i = 0;
    for (i = recentNodeArray.length - 1; i >= 0; i--) {

      if (recentNodeArray[i].nodeId == node.nodeId) {
        newNodeFlag = false;
        recentNodeArray.splice(i, 1);
      }
    }

    if ((i < 0) && (newNodeFlag)) {
      newNodeFlag = false;
      recentNodeArray.unshift(node);
    }

    if (recentNodeArray.length > maxRecentWords) {
      recentNodeArray.pop();
    };
  }

  function updateHistogramDisplay() {

    updateHistogramDisplayReady = false;

    async.series(
      [
        ageSessions,
        ageNodes,
        processDeadNodesHash,
        processDeadLinksHash,
        // updateRecentNodes,
        updateSessions,
        updateSessionWords,
        updateNodes,
        updateNodeWords,
      ],

      function(err, result) {
        if (err) {
          console.error("*** ERROR: updateHistogramDisplayReady *** \nERROR: " + err);
        }
        updateHistogramDisplayReady = true;
      }
    );
  }

  // ===================================================================

  function nodeFill(age) {
    return fillColorScale(age);
  }

  function nodeMouseOver(d) {

    // console.warn("MOUSE OVER"
    //   // + "\n" + jsonPrint(d)
    // );

    // if (d.links) {
    //   var linkNodeIds = Object.keys(d.links);

    //   linkNodeIds.forEach(function(nId){
    //     var cNode = nodeHashMap.get(nId);
    //     console.log("CONNECTED NODES | " + d.nodeId
    //       + "\n" + jsonPrint(cNode)
    //       );
    //   });
    // }

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

  function nodeFill(age) {
    return fillColorScale(age);
  }

  // ===================================================================

  this.addSession = function(newSession) {
    sessions.push(newSession);
  }

  this.deleteSessionLinks = function(sessionId) {
    // console.log("deleteSessionLinks " + sessionId);

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
    if (!newNode.isSession && !newNode.isSessionNode) nodes.push(newNode);
    updateRecentNodes(newNode);
  }

  this.deleteNode = function(nodeId) {

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
          // console.error("slice nodes: nodeIndex " + nodeIndex + "\n"  + jsonPrint(nodes));

          return;
        }
      }
    }
    if ((nodeIndex < 0) && (linkIndex < 0)) {
      nodes.splice(nodeIndex, 1);
      console.error("XXX NODE NOT FOUND ??? " + nodeId);
      return;
    }
  }

  this.addLink = function(newLink) {
    links.push(newLink);
  }

  this.deleteLink = function(linkId) {
    var linksLength = links.length - 1;
    var linkIndex = linksLength;

    for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
      if (linkId == links[linkIndex].linkId) {
        // console.log("XXX LINK " + linkId);
        links.splice(linkIndex, 1);
        return;
      }
    }

    if (linkIndex < 0) {
      return;
    }
  }

  // ===================================================================

  this.initD3timer = function() {
    d3.timer(function() {
      tickNumber++;
      dateNow = moment().valueOf();
      if (updateHistogramDisplayReady && !mouseMovingFlag) updateHistogramDisplay();
    });
  }

  // ===================================================================

  this.resize = function() {
    console.log("RESIZE");

    if (window.innerWidth !== 'undefined') {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    else if (document.documentElement !== 'undefined' && document.documentElement.clientWidth !== 'undefined' && document.documentElement.clientWidth !== 0) {
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

    svgHistogramLayoutAreaWidth = d3LayoutWidth * HISTOGRAM_LAYOUT_WIDTH_RATIO;
    svgHistogramLayoutAreaHeight = d3LayoutHeight * HISTOGRAM_LAYOUT_HEIGHT_RATIO;


    svgHistogramLayoutArea.attr("width", svgHistogramLayoutAreaWidth)
      .attr("height", svgHistogramLayoutAreaHeight);

    svgHistogramLayoutArea.attr("x", 0);
    svgHistogramLayoutArea.attr("y", 0);

    nodeInitialX = INITIAL_X_RATIO * svgHistogramLayoutAreaWidth;
    nodeInitialY = INITIAL_Y_RATIO * svgHistogramLayoutAreaHeight;
  }

  // ===================================================================
  var testAddNodeInterval;
  var testSessionIndex = 0;
  var testAddLinkInterval;
  var testDeleteNodeInterval;

  function deleteRandomNode() {
    if (nodes.length == 0) return;
    if ((nodes.length < 5) && (randomIntFromInterval(0, 100) < 80)) return;
    if (randomIntFromInterval(0, 100) < 5) return;
    var index = randomIntFromInterval(0, nodes.length - 1);
    var node = nodes[index];
    self.deleteNode(node.nodeId);
  }

  function addRandomNode() {

    var randomNumber360 = randomIntFromInterval(0, 360);

    var sessionId = 'session_' + randomNumber360;
    var userId = 'user_' + randomNumber360;
    var nodeId = 'testNode' + tickNumber;
    var mentions = randomIntFromInterval(0, 1000000);
    var wordChainIndex = tickNumber;
    var text = randomNumber360 + ' | ' + mentions;

    var startColor = "hsl(" + randomNumber360 + ",100%,50%)";
    var endColor = "hsl(" + randomNumber360 + ",0%,0%)";

    var interpolateNodeColor = d3.interpolateHcl(endColor, startColor);

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

    addNode(newNode);
  }

  function addRandomLink() {

    if (nodes.length < 2) {
      return;
    }

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

    addLink(newLink);
  }

  function clearTestAddNodeInterval() {
    clearInterval(testAddNodeInterval);
  }

  function initTestAddNodeInterval(interval) {
    clearInterval(testAddNodeInterval);
    testAddNodeInterval = setInterval(function() {
      addRandomNode();
    }, interval);
  }

  function clearTestAddLinkInterval() {
    clearInterval(testAddLinkInterval);
  }

  function initTestAddLinkInterval(interval) {
    clearInterval(testAddLinkInterval);
    testAddLinkInterval = setInterval(function() {
      if (nodes.length > 1) {
        addRandomLink();
      }
    }, interval);
  }

  function clearTestDeleteNodeInterval() {
    clearInterval(testDeleteNodeInterval);
  }

  function initTestDeleteNodeInterval(interval) {
    clearInterval(testDeleteNodeInterval);
    testDeleteNodeInterval = setInterval(function() {
      deleteRandomNode();
    }, interval);
  }

  function getSortedKeys(hmap) {
    var keys = [];
    hmap.forEach(function(value, key) {
      keys.push(key);
    });
    return keys.sort(function(a, b) {
      return hmap.get(b).mentions - hmap.get(a).mentions
    });
  }

  function xposition(d, i) {

    if (d.isSession) {
      return marginLeftSessions;
    }

    if (typeof d.rank === 'undefined') {
      return marginLeftWords + colSpacing * (10);
    }

    var value;
    var col = parseInt(d.rank / maxWordRows);

    value = marginLeftWords + colSpacing * (col);

    // if (d.rank < maxWordRows) {
    //   value = 15;
    // }
    // else if (d.rank < 2*maxWordRows) {
    //   value = 45;
    // }
    // else {
    //   value = 75;
    // }

    return value + "%";
  }

  var rows = maxWordRows;
  var cols = 5;

  function yposition(d, i) {

    var value;
    var col;

    if (d.isSession) {

      if (typeof d.rank === 'undefined') {
        value = marginTopSessions + 3 * (maxSessionRows);
        return value + "%";
      }

      value = marginTopSessions + 3 * (d.rank % maxSessionRows);
      return value + "%";
    }

    if (typeof d.rank === 'undefined') {
      value = marginTopWords + 3 * (maxWordRows);
      return value + "%";
    }

    value = marginTopWords + 3 * (d.rank % maxWordRows);
    // col = parseInt(d.rank/maxWordRows);

    // if (d.rank < maxWordRows) {
    //   value = marginTopWords + (d.rank-() * 3);
    // }
    // else if (d.rank < 2*maxWordRows) {
    //   value = marginTopWords + ((d.rank-maxWordRows) * 3)
    // }
    // else {
    //   value = marginTopWords + ((d.rank-2*maxWordRows) * 3)
    // }
    return value + "%";
  }




  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);

  var dateTimeOverlay = svgcanvas.append("svg:g")
    .attr("class", "admin")
    .attr("id", "dateTimeOverlay")
    .append("text")
    .text("../../..  --:--:--")
    .attr("x", DATE_TIME_OVERLAY_X)
    .attr("y", DATE_TIME_OVERLAY_Y)
    .style("opacity", 1e-6)
    .style("font-size", "1.4vmin")
    .style("text-anchor", "end")
    .style("fill", defaultTextFill);

  var statsOverlay1 = svgcanvas.append("svg:g") // user screenname
    .attr("id", "statsOverlay1")
    .attr("class", "statsOverlay")
    .append("svg:a")
    .attr("id", "userUrl")
    .attr("xlink:show", "new")
    .attr("xlink:href", "http://word.threeceemedia.com/")
    .attr("x", STATS_OVERLAY1_X)
    .attr("y", STATS_OVERLAY1_Y)
    .append("text")
    .attr("id", "userScreenName")
    .attr("class", "userScreenName")
    .text("word association")
    .style("opacity", 0.8)
    .style("font-size", "1.4vmin")
    .style("fill", palette.blue);

  var statsOverlay2 = svgcanvas.append("svg:g") // tweet createdAt
    .attr("id", "statsOverlay2")
    .attr("class", "statsOverlay")
    .append("text")
    .attr("id", "tweetCreatedAt")
    .text("threecee")
    .attr("x", STATS_OVERLAY2_X)
    .attr("y", STATS_OVERLAY2_Y)
    .style("opacity", 0.8)
    .style("font-size", "1.4vmin")
    .style("fill", palette.blue);

  var statsOverlay3 = svgcanvas.append("svg:g") // tweet text
    .attr("id", "statsOverlay3")
    .attr("class", "statsOverlay")
    .append("svg:a")
    .attr("id", "tweetUrl")
    .attr("class", "tweetUrl")
    .attr("xlink:show", "new")
    .attr("xlink:href", "http://threeceemedia.com")
    .attr("x", STATS_OVERLAY3_X)
    .attr("y", STATS_OVERLAY3_Y)
    .append("text")
    .attr("id", "tweetText")
    .attr("class", "tweetText")
    .text("threeceemedia.com")
    .style("opacity", 0.8)
    .style("font-size", "1.4vmin")
    .style("fill", palette.blue);

  var statsOverlay4 = svgcanvas.append("svg:g") // tweet text
    .attr("id", "statsOverlay4")
    .attr("class", "statsOverlay")
    .append("svg:a")
    .attr("id", "sessionId")
    .attr("x", STATS_OVERLAY4_X)
    .attr("y", STATS_OVERLAY4_Y)
    .append("text")
    .attr("id", "sessionIdText")
    .attr("class", "sessionIdText")
    .text("SESSION ID")
    .style("opacity", 0.8)
    .style("font-size", "1.4vmin")
    .style("fill", palette.gray);

  var adminOverlay0 = svgcanvas.append("svg:g")
    .attr("class", "admin")
    .attr("id", "adminOverlay0")
    .append("text")
    .attr("id", "heartBeat")
    .text("...")
    .attr("x", ADMIN_OVERLAY0_X)
    .attr("y", ADMIN_OVERLAY0_Y)
    .style("text-anchor", "end")
    .style("opacity", 1e-6)
    .style("font-size", "1.4vmin")
    .style("fill", defaultTextFill);

  var adminOverlay1 = svgcanvas.append("svg:g")
    .attr("class", "admin")
    .attr("id", "adminOverlay1")
    .append("text")
    .attr("id", "heartBeat")
    .text("...")
    .attr("x", ADMIN_OVERLAY1_X)
    .attr("y", ADMIN_OVERLAY1_Y)
    .style("text-anchor", "end")
    .style("opacity", 1e-6)
    .style("font-size", "1.4vmin")
    .style("fill", defaultTextFill);

  var adminOverlay2 = svgcanvas.append("svg:g")
    .attr("class", "admin")
    .attr("id", "adminOverlay2")
    .append("text")
    .attr("id", "heartBeat")
    .text("...")
    .attr("x", ADMIN_OVERLAY2_X)
    .attr("y", ADMIN_OVERLAY2_Y)
    .style("text-anchor", "end")
    .style("opacity", 1e-6)
    .style("font-size", "1.4vmin")
    .style("fill", defaultTextFill);

  var adminOverlay3 = svgcanvas.append("svg:g")
    .attr("class", "admin")
    .attr("id", "adminOverlay3")
    .append("text")
    .attr("id", "heartBeat")
    .text("LOCAL TIME: " + getTimeStamp())
    .attr("x", ADMIN_OVERLAY3_X)
    .attr("y", ADMIN_OVERLAY3_Y)
    .style("text-anchor", "end")
    .style("opacity", 1e-6)
    .style("font-size", "1.4vmin")
    .style("fill", defaultTextFill);

  setInterval(function() {
    dateTimeOverlay = d3.select("#dateTimeOverlay").select("text").text("SERVER TIME: " + moment().format(defaultDateTimeFormat));
    // statsOverlay4 = d3.select("#statsOverlay4").select("text").text(viewerSessionKey);
  }, 1000);

}