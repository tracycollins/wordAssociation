window.ControlPanel = function ControlPanel() {
  "use strict";

	var DEFAULT_SOURCE = "https:{//word.threeceelabs.com";
  // var DEFAULT_SOURCE = "http://localhost:9997";

	var parentWindow = window.opener;
	console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
	var self = this;

  var twitterFeedUser;
  var twitterFeedPreviousUser;
  var twitterFeedHashtag;

	var compactDateTimeFormat = "YYYYMMDD HH}mmss";

  var timelineDiv = document.getElementById("timelineDiv");
  var hashtagDiv =document.getElementById("hashtagDiv");

  var nodeTypesSet = new Set();
  nodeTypesSet.add("emoji");
  nodeTypesSet.add("hashtag");
  nodeTypesSet.add("place");
  nodeTypesSet.add("media");
  nodeTypesSet.add("url");
  nodeTypesSet.add("user");
  nodeTypesSet.add("word");

	var $ = require('jquery-browserify');
	var control = require("control-panel");

	var currentUser = "threecee";
	var previousUser = currentUser;

  var config = {};
  var currentTwitterNode;

  config = window.opener.config;
  delete config.twitterUser.histograms;
  delete config.twitterUser.countHistory;
  delete config.twitterUser.status;

  console.log("config\n" + jsonPrint(config));

  var statsObj = {};
  statsObj.socketId = "NOT SET";
  statsObj.user = {};
  statsObj.user.name = "---";
  statsObj.user.screenName = "@";
  statsObj.user.category = "---";
  statsObj.user.categoryAuto = "---";
  statsObj.user.followersCount = 0;
  statsObj.user.friendsCount = 0;
  statsObj.user.statusesCount = 0;
  statsObj.user.mentions = 0;
  statsObj.user.threeceeFollowing = "---";
  statsObj.user.ignored = "---";

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
    }
  }

  Element.prototype.removeAll = function () {
    while (this.firstChild) { this.removeChild(this.firstChild); }
    return this;
  };

  function updateCategoryRadioButtons(category, callback){

    console.log("updateCategoryRadioButtons | " + category);

    if (category === undefined || !category) {
      category = "none";
    }

    var element;

    document.getElementById("categoryLeft").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryRight").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryNeutral").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryPositive").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryNegative").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryNone").setAttribute("class", "radioUnchecked");

    switch(category) {
      case "left":
        element = document.getElementById("categoryLeft");
        element.className = "radioChecked";
        callback();
      break;
      case "right":
        element = document.getElementById("categoryRight");
        element.className = "radioChecked";
        callback();
      break;
      case "neutral":
        element = document.getElementById("categoryNeutral");
        element.className = "radioChecked";
        callback();
      break;
      case "positive":
        element = document.getElementById("categoryPositive");
        element.className = "radioChecked";
        callback();
      break;
      case "negative":
        element = document.getElementById("categoryNegative");
        element.className = "radioChecked";
        callback();
      break;
      case "none":
        element = document.getElementById("categoryNone");
        element.className = "radioChecked";
        callback();
      break;
      default:
        callback();
    }
  }

  function shortCategory(c) {
    switch (c) {
      case "left": return "L"; 
      case "right": return "R"; 
      case "neutral": return "N"; 
      case "positive": return "+"; 
      case "negative": return "-";
      default: return "0";
    }
  }

  function loadTwitterFeed(node, callback) {

    if (!timelineDiv || !hashtagDiv || (twttr === undefined)) { 
      console.error("loadTwitterFeed: timelineDiv OR hashtagDiv OR twttr UNDEFINED");
      return callback("loadTwitterFeed: timelineDiv OR hashtagDiv OR twttr UNDEFINED");
    }

    hashtagDiv.removeAll();
    timelineDiv.removeAll();

    if (node.nodeType === "user"){

      twitterFeedPreviousUser = twitterFeedUser;
      twitterFeedUser = node;

      console.debug("loadTwitterFeed"
        + " | TYPE: " + node.nodeType
        + " | NID: " + node.nodeId
        + " | @" + node.screenName
        + " | " + node.name
        + " | CR: " + node.createdAt
        + " | LS: " + node.lastSeen
        + " | CAT M: " + node.category
        + " | CAT A: " + node.categoryAuto
        + " | Ms: " + node.mentions
        + " | Ts: " + node.statusesCount
        + " | FRNDs: " + node.friendsCount
        + " | FLWRs: " + node.followersCount
      );

      updateCategoryRadioButtons(node.category, function(){

        twitterWidgetsCreateTimeline(node, function(err, el){
          if (err){
            console.error("LOAD TWITTER FEED ERROR: " + err);
            return callback(err);
          }
          var nsi =document.getElementById("nodeSearchInput");
          nsi.value = "@" + node.screenName;
          callback(null);
        });

      });
    }
    else if (node.nodeType === "hashtag"){

      twitterFeedHashtag = node;

      console.debug("loadTwitterFeed"
        + " | TYPE: " + node.nodeType
        + " | #: " + node.nodeId
        + " | CAT M: " + node.category
        + " | Ms: " + node.mentions
      );

      updateCategoryRadioButtons(node.category, function(){
        twitterHashtagSearch(node, function(){
          var nsi =document.getElementById("nodeSearchInput");
          nsi.value = "#" + node.nodeId;
          callback(null);
        });
      });
    }
    else {
      callback("ILLEGAL NODE TYPE: " + node.nodeType);
    }
  }

  this.setDisplayNodeType = function(params, callback){

    if (!nodeTypesSet.has(params.displayNodeType)) {
      console.error("UNKNOWN NODE TYPE: " + params.displayNodeType);
      return callback("UNKNOWN NODE TYPE: " + params.displayNodeType);
    }

    const id = params.id || "displayNodeType_" + params.displayNodeType.toLowerCase();
    const value = params.value || "hide";

    console.log("SET DISPLAY NODE TYPE | " + params.displayNodeType + " | " + value);

    var displayNodeType = document.getElementById(id);
    if (displayNodeType) { displayNodeType.setAttribute("value", value); }

    if (callback !== undefined) { callback(); }
  };

  this.setMaxNodesSliderValue = function (value) {
    value = parseInt(value);
    if (!document.getElementById("maxNodesSlider")) { return; }
    console.log("setMaxNodesSliderValue: " + value);
    document.getElementById("maxNodesSlider").value = parseInt(value * document.getElementById("maxNodesSlider").getAttribute("multiplier"));
    document.getElementById("maxNodesSliderText").innerHTML = value;
  };

  this.setNodeRadiusMaxRatioSliderValue = function (value) {
    if (!document.getElementById("nodeRadiusMaxRatioSlider")) { return; }
    console.log("setNodeRadiusMaxRatioSliderValue: " + value);
    document.getElementById("nodeRadiusMaxRatioSlider").value = (value * document.getElementById("nodeRadiusMaxRatioSlider").getAttribute("multiplier"));
    document.getElementById("nodeRadiusMaxRatioSliderText").innerHTML = value.toFixed(3);
  };

  this.setNodeRadiusMinRatioSliderValue = function (value) {
    if (!document.getElementById("nodeRadiusMinRatioSlider")) { return; }
    console.log("setNodeRadiusMinRatioSliderValue: " + value);
    document.getElementById("nodeRadiusMinRatioSlider").value = (value * document.getElementById("nodeRadiusMinRatioSlider").getAttribute("multiplier"));
    document.getElementById("nodeRadiusMinRatioSliderText").innerHTML = value.toFixed(3);
  };

  this.setVelocityDecaySliderValue = function (value) {
    if (!document.getElementById("velocityDecaySlider")) { return; }
    console.log("setVelocityDecaySliderValue: " + value);
    document.getElementById("velocityDecaySlider").value = (value * document.getElementById("velocityDecaySlider").getAttribute("multiplier"));
    document.getElementById("velocityDecaySliderText").innerHTML = value.toFixed(3);
  };

  this.setLinkStrengthSliderValue = function (value) {
    if (!document.getElementById("linkStrengthSlider")) { return; }
    console.log("setLinkStrengthSliderValue: " + value);
    document.getElementById("linkStrengthSlider").value = (value * document.getElementById("linkStrengthSlider").getAttribute("multiplier"));
    document.getElementById("linkStrengthSliderText").innerHTML = value.toFixed(3);
  };

  this.setLinkDistanceSliderValue = function (value) {
    if (!document.getElementById("linkDistanceSlider")) { return; }
    console.log("setLinkDistanceSliderValue: " + value);
    document.getElementById("linkDistanceSlider").value = (value * document.getElementById("linkDistanceSlider").getAttribute("multiplier"));
    document.getElementById("linkDistanceSliderText").innerHTML = value.toFixed(3);
  };

  this.setTransitionDurationSliderValue = function (value) {
    if (!document.getElementById("transitionDurationSlider")) { return; }
    console.log("setTransitionDurationSliderValue: " + value);
    document.getElementById("transitionDurationSlider").value = (value* document.getElementById("transitionDurationSlider").getAttribute("multiplier"));
    document.getElementById("transitionDurationSliderText").innerHTML = value.toFixed(3);
  };

  this.setGravitySliderValue = function (value) {
    if (!document.getElementById("gravitySlider")) { return; }
    console.log("setGravitySliderValue: " + value);
    document.getElementById("gravitySlider").value = (value* document.getElementById("gravitySlider").getAttribute("multiplier"));
    document.getElementById("gravitySliderText").innerHTML = value.toFixed(5);
  };

  this.setChargeSliderValue = function (value) {
    if (!document.getElementById("chargeSlider")) { return; }
    console.log("setChargeSliderValue: " + value);
    document.getElementById("chargeSlider").value = value;
    document.getElementById("chargeSliderText").innerHTML = value.toFixed(0);
  };

  this.setMaxAgeSliderValue = function (value) {
    if (!document.getElementById("maxAgeSlider")) { return; }
    console.log("setMaxAgeSliderValue: " + value);
    document.getElementById("maxAgeSlider").value = value;
    document.getElementById("maxAgeSliderText").innerHTML = value.toFixed(0);
  };

  this.setFontSizeMinRatioSliderValue = function (value) {
    if (!document.getElementById("fontSizeMinRatioSlider")) { return; }
    console.log("setFontSizeMinRatioSliderValue: " + value);
    document.getElementById("fontSizeMinRatioSlider").value = (value * document.getElementById("fontSizeMinRatioSlider").getAttribute("multiplier"));
    var valuePercent = 100*value;
    document.getElementById("fontSizeMinRatioSliderText").innerHTML = valuePercent.toFixed(1) + "% H";
  };

  this.setFontSizeMaxRatioSliderValue = function (value) {
    if (!document.getElementById("fontSizeMaxRatioSlider")) { return; }
    console.log("setFontSizeMaxRatioSliderValue: " + value);
    document.getElementById("fontSizeMaxRatioSlider").value = (value * document.getElementById("fontSizeMaxRatioSlider").getAttribute("multiplier"));
    var valuePercent = 100*value;
    document.getElementById("fontSizeMaxRatioSliderText").innerHTML = valuePercent.toFixed(1) + "% H";
  };

  function receiveMessage(event){
    // Do we trust the sender of this message?
    if (event.origin !== DEFAULT_SOURCE){
      if (event.origin === "https://platform.twitter.com") {
        if (event.data["twttr.button"] 
          && (event.data["twttr.button"]["method"] === "twttr.private.resizeButton")){
          return;
        }
        // console.log("TWITTER SOURCE: " + event.origin);
      }
      else {
        console.error("RX MESSAGE | NOT TRUSTED SOURCE"
          + " | ORIGIN: " + event.origin 
          + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
        );
        return;
      }
    }

    console.debug("RX MESSAGE | SOURCE"
      + " | ORIGIN: " + event.origin 
      + " | PARENT WINDOW: " + parentWindow.PARENT_ID
      + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
    );

    var op = event.data.op;
    var cnf;

    switch (op) {

      case "INIT":

        cnf = event.data.config;
        delete cnf.twitterUser.histograms;
        delete cnf.twitterUser.countHistory;
        delete cnf.twitterUser.status;

        console.debug("CONTROL PANEL INIT\n" + jsonPrint(cnf));

        Object.keys(cnf).forEach(function(prop){
          config[prop] = cnf[prop];
          console.info("CNF | " + prop 
            + " | " + config[prop]
          );
        });

        self.setMaxNodesSliderValue(cnf.defaultMaxNodesLimit);
        self.setTransitionDurationSliderValue(cnf.defaultTransitionDuration);
        self.setLinkStrengthSliderValue(cnf.defaultLinkStrength);
        self.setLinkDistanceSliderValue(cnf.defaultLinkDistance);
        self.setGravitySliderValue(cnf.defaultGravity);
        self.setChargeSliderValue(cnf.defaultCharge);
        self.setNodeRadiusMinRatioSliderValue(cnf.defaultNodeRadiusMinRatio);
        self.setNodeRadiusMaxRatioSliderValue(cnf.defaultNodeRadiusMaxRatio);
        self.setVelocityDecaySliderValue(cnf.defaultVelocityDecay);
        self.setMaxAgeSliderValue(cnf.defaultMaxAge);
        self.setFontSizeMinRatioSliderValue(cnf.defaultFontSizeMinRatio);
        self.setFontSizeMaxRatioSliderValue(cnf.defaultFontSizeMaxRatio);

        if (cnf.displayNodeHashMap !== undefined) {
          Object.keys(cnf.displayNodeHashMap).forEach(function(displayNodeType){
            self.setDisplayNodeType({displayNodeType: displayNodeType, value: cnf.displayNodeHashMap[displayNodeType]}, function(err){
              if (err) {
                delete cnf.displayNodeHashMap[displayNodeType];
              }
            });
          });
        }

        parentWindow.postMessage({op: "NODE_SEARCH", input: "@threecee"}, DEFAULT_SOURCE);

      break;

      case "SET_TWITTER_USER":
        currentTwitterNode = event.data.user;
        console.debug("SET TWITTER USER" 
          + " | " + currentTwitterNode.nodeId
          + " | @" + currentTwitterNode.screenName
          + " | CR: " + currentTwitterNode.createdAt
          + " | LS: " + currentTwitterNode.lastSeen
          + " | C: " + currentTwitterNode.category
          + " | CA: " + currentTwitterNode.categoryAuto
          // + jsonPrint(currentTwitterNode)
        );
        if (event.data.nodeSearch) {
          console.debug("NODE_SEARCH on SET_TWITTER_USER USER" 
            + " | @" + currentTwitterNode.screenName
          );
          parentWindow.postMessage({op: "NODE_SEARCH", input: "@" + currentTwitterNode.screenName}, DEFAULT_SOURCE);
        }
        loadTwitterFeed(currentTwitterNode, function(err){
          if (err) {
            setTimeout(function(){
              loadTwitterFeed(currentTwitterNode, function(err2){
                if (err2) { console.error("loadTwitterFeed SET_TWITTER_USER FAIL"); }
              });
            }, 1000);
          }
        });
      break;

      case "SET_TWITTER_HASHTAG":
        currentTwitterNode = event.data.hashtag;
        console.debug("SET TWITTER HASHTAG\n" + jsonPrint(currentTwitterNode));
        loadTwitterFeed(currentTwitterNode, function(err){
          if (err) {
            setTimeout(function(){
              loadTwitterFeed(currentTwitterNode, function(err2){
                if (err2) { console.error("loadTwitterFeed SET_TWITTER_HASHTAG FAIL"); }
              });
            }, 1000);
          }
        });
      break;
    }
  }

	function buttonHandler(params) {

	  const user = (params.user) ? "@" + params.user : currentUser;

	  switch (params.id){
	  	case "previousUser":
		    console.debug("PREVIOUS USER: " + user);
		    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: user }, DEFAULT_SOURCE); }
	  	break;
	  	case "follow":
		    console.debug("FOLLOW: " + user);
		    if (parentWindow) { parentWindow.postMessage({op: "FOLLOW", user: user}, DEFAULT_SOURCE); }
	  	break;
	  	case "unfollow":
		    console.debug("UNFOLLOW: " + user);
		    if (parentWindow) { parentWindow.postMessage({op: "UNFOLLOW", user: user}, DEFAULT_SOURCE); }
	  	break;
	  	case "ignore":
		    console.debug("IGNORE: " + user);
		    if (parentWindow) { parentWindow.postMessage({op: "IGNORE", user: user}, DEFAULT_SOURCE); }
	  	break;
	  	case "unignore":
		    console.debug("UNIGNORE: " + user);
		    if (parentWindow) { parentWindow.postMessage({op: "UNIGNORE", user: user}, DEFAULT_SOURCE); }
	  	break;
	  	case "nextMismatch":
		    console.debug("NEXT MISMATCH");
		    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?MM"}, DEFAULT_SOURCE); }
	  	break;
	  	case "nextUncat":
		    console.debug("NEXT UNCAT");
		    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?"}, DEFAULT_SOURCE); }
	  	break;
	  	case "nextUncatLeft":
		    console.debug("NEXT UNCAT LEFT");
		    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?LEFT"}, DEFAULT_SOURCE); }
	  	break;
	  	case "nextUncatNeutral":
		    console.debug("NEXT UNCAT NEUTRAL");
		    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?NEUTRAL"}, DEFAULT_SOURCE); }
	  	break;
	  	case "nextUncatRight":
		    console.debug("NEXT UNCAT RIGHT");
		    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?RIGHT"}, DEFAULT_SOURCE); }
	  	break;
	  	case "resetButton":
		    console.debug("RESET");
		    if (parentWindow) { parentWindow.postMessage({op: "RESET"}, DEFAULT_SOURCE); }
	  	break;
	  	default:
	  		console.error("UNKNOW BUTTON ID: " + params.id);
	  }
	}

	var nodeDisplayPanel = control([
		{type: "checkbox", label: "EMOJI", initial: false},
	], 
	  {root: document.getElementById("nodeDisplayDiv"), theme: "dark"}
	);

	nodeDisplayPanel.on("input", function(data){
		console.debug("NODE DISPLAY INPUT\n", data)
	});

	var userCategorizePanel = control([
		{type: "button", label: "PREV USER", action: function () { buttonHandler({id: "previousUser", name: "PREV USER", user: previousUser}); }},
		{type: "button", label: "FOLLOW", action: function () { buttonHandler({id: "follow", name: "FOLLOW", user: currentUser}); }},
		{type: "button", label: "UNFOLLOW", action: function () { buttonHandler({id: "unfollow", name: "UNFOLLOW", user: currentUser}); }},
		{type: "button", label: "IGNORE", action: function () { buttonHandler({id: "ignore", name: "IGNORE", user: currentUser}); }},
		{type: "button", label: "UNIGNORE", action: function () { buttonHandler({id: "unignore", name: "UNIGNORE", user: currentUser}); }},
		{type: "button", label: "NEXT MISMATCH", action: function () { buttonHandler({id: "nextMismatch", name: "NEXT MISMATCH"}); }},
		{type: "button", label: "NEXT UNCAT", action: function () { buttonHandler({id: "nextUncat", name: "NEXT UNCAT"}); }},
		{type: "button", label: "NEXT UNCAT LEFT", action: function () { buttonHandler({id: "nextUncatLeft", name: "NEXT UNCAT LEFT"}); }},
		{type: "button", label: "NEXT UNCAT NEUTRAL", action: function () { buttonHandler({id: "nextUncatNeutral", name: "NEXT UNCAT NEUTRAL"}); }},
		{type: "button", label: "NEXT UNCAT RIGHT", action: function () { buttonHandler({id: "nextUncatRight", name: "NEXT UNCAT RIGHT"}); }},
	  {type: "select", label: "CATEGORY", options: ["LEFT", "NEUTRAL", "RIGHT", "POSITIVE", "NEGATIVE", "NONE"], initial: "NONE"}
	], 
	  {root: document.getElementById("userCategorizeDiv"), theme: "dark"}
	);

	userCategorizePanel.on("input", function(data){
		console.debug("USER CATEGORIZE INPUT\n", data)
	});

  this.createControlPanel = function(callback) {

    if (callback) { callback(); }

  };


  this.updateControlPanel = function (cfg, callback) {

    console.log("UPDATE CONTROL PANEL");
    if (callback) { callback(); }
  };

  $( document ).ready(function() {

    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG\n" + jsonPrint(config) );

    self.createControlPanel(function(){

      setTimeout(function() {  // KLUDGE to insure table is created before update
        self.updateControlPanel(config, function(){
          if (parentWindow !== undefined) {
            window.addEventListener("message", receiveMessage, false);

            setTimeout(function(){

              console.log("TX PARENT READY " + DEFAULT_SOURCE);

              parentWindow.postMessage({op:"READY"}, DEFAULT_SOURCE);

              if (!twttr || !twttr.widgets) {

                var waitTwitterWidgetsInterval;

                waitTwitterWidgetsInterval = setInterval(function(){

                  if (twttr && twttr.widgets){
                    clearInterval(waitTwitterWidgetsInterval);
                    twttr.widgets.load();              
                  }

                }, 100);

              }
              else {
                twttr.widgets.load();              
              }
            }, 1000);

          }
          else {
            console.error("PARENT WINDOW UNDEFINED??");
          }
        });
      }, 2000);

    });
  });
}