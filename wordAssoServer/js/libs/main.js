window.ControlPanel = function ControlPanel() {
  "use strict";

  const ONE_SECOND = 1000;
  const ONE_MINUTE = 60*ONE_SECOND;

	var DEFAULT_SOURCE = "https://word.threeceelabs.com";
  // var DEFAULT_SOURCE = "http://localhost:9997";

	var parentWindow = window.opener;
	console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
	var self = this;

	var $ = require('jquery-browserify');
	var control = require("control-panel");
	var dat = require('dat.gui');

	// var canvas = document.getElementById("guiCanvas");

  var guiUser;
  var guiDisplay;

	var displayData = document.getElementById('displayData');
	var displayConfig;

	var userData = document.getElementById('userData');
	var userText;


  var twitterFeedUser;
  var twitterFeedPreviousUser;
  var twitterFeedHashtag;

	var compactDateTimeFormat = "YYYYMMDD HHmmss";

  var timelineDiv = document.getElementById("timelineDiv");
  var hashtagDiv =document.getElementById("hashtagDiv");

  var nodeTypesSet = new Set();
  nodeTypesSet.add("emoji");
  nodeTypesSet.add("hashtag");
  nodeTypesSet.add("location");
  nodeTypesSet.add("media");
  nodeTypesSet.add("place");
  nodeTypesSet.add("url");
  nodeTypesSet.add("user");
  nodeTypesSet.add("word");

	var currentUser = "threecee";
	var previousUser = currentUser;

  var config = {};
  var currentTwitterNode;

  config = window.opener.config;

  const DEFAULT_MAX_NODES = 100;
  const DEFAULT_MAX_NODES_MIN = 10;
  const DEFAULT_MAX_NODES_MAX = 500;

  const DEFAULT_MAX_AGE = 30*ONE_SECOND;
  const DEFAULT_MAX_AGE_MIN = ONE_SECOND;
  const DEFAULT_MAX_AGE_MAX = ONE_MINUTE;

  const DEFAULT_GRAVITY = 0.001;
  const DEFAULT_GRAVITY_MIN = 0.0;
  const DEFAULT_GRAVITY_MAX = 5.0;

  const DEFAULT_CHARGE = -50.0;
  const DEFAULT_CHARGE_MIN = -100.0;
  const DEFAULT_CHARGE_MAX = 100.0;

  const DEFAULT_VELOCITY_DECAY = 0.50;
  const DEFAULT_VELOCITY_DECAY_MIN = 0.0;
  const DEFAULT_VELOCITY_DECAY_MAX = 1.0;

  config.maxNodes = config.maxNodes || DEFAULT_MAX_NODES;
  config.maxNodesMin = config.maxNodesMin || DEFAULT_MAX_NODES_MIN;
  config.maxNodesMax = config.maxNodesMax || DEFAULT_MAX_NODES_MAX;

  config.maxAge = config.maxAge || DEFAULT_MAX_AGE;
  config.maxAgeMin = config.maxAgeMin || DEFAULT_MAX_AGE_MIN;
  config.maxAgeMax = config.maxAgeMax || DEFAULT_MAX_AGE_MAX;

  config.gravity = config.gravity || DEFAULT_GRAVITY;
  config.gravityMin = config.gravityMin || DEFAULT_GRAVITY_MIN;
  config.gravityMax = config.gravityMax || DEFAULT_GRAVITY_MAX;

  config.charge = config.charge || DEFAULT_CHARGE;
  config.chargeMin = config.chargeMin || DEFAULT_CHARGE_MIN;
  config.chargeMax = config.chargeMax || DEFAULT_CHARGE_MAX;

  config.velocityDecay = config.velocityDecay || DEFAULT_VELOCITY_DECAY;
  config.velocityDecayMin = config.velocityDecayMin || DEFAULT_VELOCITY_DECAY_MIN;
  config.velocityDecayMax = config.velocityDecayMax || DEFAULT_VELOCITY_DECAY_MAX;

  delete config.twitterUser.histograms;
  delete config.twitterUser.countHistory;
  delete config.twitterUser.status;

  // console.log("config\n" + jsonPrint(config));

  var statsObj = {};
  statsObj.socketId = "NOT SET";
  statsObj.user = {};
  statsObj.user.name = "---";
  statsObj.user.screenName = "@";
  statsObj.user.location = "---";
  statsObj.user.description = "---";
  statsObj.user.category = "---";
  statsObj.user.categoryAuto = "---";
  statsObj.user.followersCount = 0;
  statsObj.user.friendsCount = 0;
  statsObj.user.statusesCount = 0;
  statsObj.user.mentions = 0;
  statsObj.user.threeceeFollowing = "---";
  statsObj.user.ignored = "---";

	var UserText = function() {
		this.nextUncat = function(){
	    console.debug("NEXT UNCAT");
	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?"}, DEFAULT_SOURCE); }
		}
	  this.nodeId = statsObj.user.nodeId;
	  this.screenName = statsObj.user.screenName;
	  this.name = statsObj.user.name;
	  this.location = statsObj.user.location;
	  this.description = statsObj.user.description;
	  this.category = statsObj.user.category;
	  this.categoryAuto = statsObj.user.categoryAuto;
	  this.location = statsObj.user.location;
	  this.followersCount = statsObj.user.followersCount;
	  this.friendsCount = statsObj.user.friendsCount;
	  this.statusesCount = statsObj.user.statusesCount;
	  this.mentions = statsObj.user.mentions;
	  this.threeceeFollowing = statsObj.user.threeceeFollowing;
	  this.ignored = statsObj.user.ignored;
	  this.color = "#ffffff";
	  this.fontSize = 16;
	  this.border = false;
	  this.fontFamily = "monospace";
	};

	var DisplayConfig = function() {

	  this.maxNodes = config.maxNodes;
	  this.maxAge = config.maxAge;
	  this.gravity = config.gravity;
	  this.charge = config.charge;
	  this.nodeRadius = config.nodeRadiusRatio;
	  this.velocityDecay = config.velocityDecay;
	  this.fontSizeRatio = config.fontSizeRatio;
	  this.transitionDuration = config.transitionDuration;

	  this.color = "#ffffff";
	  this.fontSize = 16;
	  this.border = false;
	  this.fontFamily = "monospace";
	};


  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
    }
  }

  var nodeSearchInput = document.createElement("input");
  var nodeSearchLabel = document.createElement("label");
  var nodeSearchValue = "";

  nodeSearchLabel.setAttribute("id", "nodeSearchLabel");
  nodeSearchLabel.innerHTML = "NODE SEARCH";

  function nodeSearchHandler(e) {
    if (e.keyCode === 13) { // 'ENTER' key
      parentWindow.postMessage({op: "NODE_SEARCH", input: nodeSearchInput.value}, DEFAULT_SOURCE);
    }
  }

  nodeSearchInput.setAttribute("class", "nodeSearch");
  nodeSearchInput.setAttribute("type", "text");
  nodeSearchInput.setAttribute("id", "nodeSearchInput");
  nodeSearchInput.setAttribute("name", "nodeSearch");
  nodeSearchInput.setAttribute("autofocus", true);
  nodeSearchInput.setAttribute("autocapitalize", "none");
  nodeSearchInput.setAttribute("value", nodeSearchValue);
  nodeSearchInput.addEventListener("keydown", function(e){ nodeSearchHandler(e); }, false);

  twitterCategorySearchDiv.appendChild(nodeSearchLabel);
  twitterCategorySearchDiv.appendChild(nodeSearchInput);

  Element.prototype.removeAll = function () {
    while (this.firstChild) { this.removeChild(this.firstChild); }
    return this;
  };

  function updateCategoryRadioButtons(category, callback){

    console.log("updateCategoryRadioButtons | " + category);

    if (category === undefined || !category) {
      category = "none";
    }

    callback();

    // var element;

    // document.getElementById("categoryLeft").setAttribute("class", "radioUnchecked");
    // document.getElementById("categoryRight").setAttribute("class", "radioUnchecked");
    // document.getElementById("categoryNeutral").setAttribute("class", "radioUnchecked");
    // document.getElementById("categoryPositive").setAttribute("class", "radioUnchecked");
    // document.getElementById("categoryNegative").setAttribute("class", "radioUnchecked");
    // document.getElementById("categoryNone").setAttribute("class", "radioUnchecked");

    // switch(category) {
    //   case "left":
    //     element = document.getElementById("categoryLeft");
    //     element.className = "radioChecked";
    //     callback();
    //   break;
    //   case "right":
    //     element = document.getElementById("categoryRight");
    //     element.className = "radioChecked";
    //     callback();
    //   break;
    //   case "neutral":
    //     element = document.getElementById("categoryNeutral");
    //     element.className = "radioChecked";
    //     callback();
    //   break;
    //   case "positive":
    //     element = document.getElementById("categoryPositive");
    //     element.className = "radioChecked";
    //     callback();
    //   break;
    //   case "negative":
    //     element = document.getElementById("categoryNegative");
    //     element.className = "radioChecked";
    //     callback();
    //   break;
    //   case "none":
    //     element = document.getElementById("categoryNone");
    //     element.className = "radioChecked";
    //     callback();
    //   break;
    //   default:
    //     callback();
    // }
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

  var nodeName;
  var category;
  var categoryAuto;

  function twitterWidgetsCreateTimeline(node, callback){

    if (node.notFound !== undefined) {
      callback(null, null);
    }
    else {

      twitterFeedPreviousUser = node;

      nodeName = (node.name !== undefined) ? node.name : "---";

      category = node.category || "none";
      categoryAuto = node.categoryAuto || "none";

      statsObj.user.nodeId = node.nodeId;
      statsObj.user.name = nodeName;
      statsObj.user.screenName = node.screenName;
      statsObj.user.location = node.location;
      statsObj.user.description = node.description;
      statsObj.user.category = category;
      statsObj.user.categoryAuto = categoryAuto;
      statsObj.user.followersCount = node.followersCount;
      statsObj.user.friendsCount = node.friendsCount;
      statsObj.user.statusesCount = node.statusesCount;
      statsObj.user.ignored = node.ignored;
      statsObj.user.threeceeFollowing = node.threeceeFollowing;
      statsObj.user.mentions = node.mentions;

			userText.nodeId = statsObj.user.nodeId;
			userText.name = statsObj.user.name;
			userText.location = statsObj.user.location;
			userText.screenName = statsObj.user.screenName;
			userText.category = shortCategory(statsObj.user.category);
			userText.categoryAuto = shortCategory(statsObj.user.categoryAuto);
			userText.followersCount = statsObj.user.followersCount;
			userText.friendsCount = statsObj.user.friendsCount;
			userText.statusesCount = statsObj.user.statusesCount;
			userText.mentions = statsObj.user.mentions;
			userText.ignored = statsObj.user.ignored;
			userText.threeceeFollowing = statsObj.user.threeceeFollowing;
			userText.description = statsObj.user.description;

      if (twttr && twttr.widgets) {
        // twttr.widgets.createFollowButton(
        //   node.screenName,
        //   timelineDiv
        // );

        twttr.widgets.createTimeline(
          { sourceType: "profile", screenName: node.screenName},
          timelineDiv,
          { width: "400", height: "600"}
        )
        .then(function (el) {
          callback(null, el);
        })
        .catch(function(err){
          console.error("TWITTER CREATE TIMELINE ERROR: " + err);
          callback(err, null);
        });
      }
      else {
        callback(null, null);
      }
    }
  }

  function twitterHashtagSearch(node, callback){

    var text = node.nodeId.toLowerCase();
    var hashtagText = document.createElement("TEXT");

    hashtagText.setAttribute("id", "hashtagText");
    hashtagText.setAttribute("class", "hashtagText");
    hashtagText.innerHTML = "<br><br>" 
      + "#" + text
      + "<br><br>"
      + "C: M: " + node.category
      + "<br><br>";

    hashtagDiv.removeAll();
    timelineDiv.removeAll();
    hashtagDiv.appendChild(hashtagText);

    callback();
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

  this.setDisplayNodeType = function(params, callback){};

  this.setMaxNodes = function (value) {};

  this.setNodeRadiusRatioMax = function (value) {};
  this.setNodeRadiusRatioMin = function (value) {};
  this.setNodeRadiusRatio = function (value) {};

  this.setVelocityDecay = function (value) {};

  this.setLinkStrength = function (value) {};

  this.setLinkDistance = function (value) {};

  this.setTransitionDuration = function (value) {};

  this.setGravity = function (value) {};

  this.setCharge = function (value) {};

  this.setMaxAge = function (value) {};

  this.setFontSizeRatioMin = function (value) {};
  this.setFontSizeRatioMax = function (value) {};
  this.setFontSizeRatio = function (value) {};

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

        console.debug("CONTROL PANEL INIT"
        	// + "\n" + jsonPrint(cnf)
        );

        Object.keys(cnf).forEach(function(prop){
          config[prop] = cnf[prop];
          console.info("CNF | " + prop 
            + " | " + config[prop]
          );
        });

        self.setMaxNodes(cnf.defaultMaxNodesLimit);
        self.setTransitionDuration(cnf.defaultTransitionDuration);
        self.setLinkStrength(cnf.defaultLinkStrength);
        self.setLinkDistance(cnf.defaultLinkDistance);
        self.setGravity(cnf.defaultGravity);
        self.setCharge(cnf.defaultCharge);
        self.setNodeRadiusRatioMin(cnf.defaultNodeRadiusRatioMin);
        self.setNodeRadiusRatioMax(cnf.defaultNodeRadiusRatioMax);
        self.setVelocityDecay(cnf.defaultVelocityDecay);
        self.setMaxAge(cnf.defaultMaxAge);
        self.setFontSizeRatioMin(cnf.defaultFontSizeRatioMin);
        self.setFontSizeRatioMax(cnf.defaultFontSizeRatioMax);

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
		{type: "checkbox", label: "HASHTAG", initial: false},
		{type: "checkbox", label: "LOCATION", initial: false},
		{type: "checkbox", label: "MEDIA", initial: false},
		{type: "checkbox", label: "PLACE", initial: false},
		{type: "checkbox", label: "URL", initial: false},
		{type: "checkbox", label: "USER", initial: false},
		{type: "checkbox", label: "WORD", initial: false}
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

	// function setValue() {
	//   userData.innerHTML = userText.screenName;
	//   userData.style.color = userText.color;
	//   userData.style.fontSize = userText.fontSize+"px";
	//   userData.style.fontFamily = userText.fontFamily;
	//   if(userText.border) {
	//     userData.style.border = "solid 1px black";
	//     userData.style.padding = "10px";
	//   }
	//   else {
	//     userData.style.border = "none";
	//     userData.style.padding = "0px";
	//   }
	// }

  $( document ).ready(function() {

    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG"
    	// + "\n" + jsonPrint(config)
    );

    self.createControlPanel(function(){

      setTimeout(function() {  // KLUDGE to insure table is created before update

			  userText = new UserText();

			  guiUser = new dat.GUI();
			  guiUser.width = 400;
			  guiUser.add(userText, 'nextUncat');
			  guiUser.add(userText, 'screenName').listen();
			  guiUser.add(userText, 'name').listen();
			  guiUser.add(userText, 'location').listen();
			  guiUser.add(userText, 'ignored').listen();
			  guiUser.add(userText, 'description').listen();
			  guiUser.add(userText, 'category', [ 'L', 'N', 'R', '+', '-', '0' ]).listen();
			  guiUser.add(userText, 'categoryAuto', [ 'L', 'N', 'R', '+', '-', '0' ]).listen();
			  guiUser.add(userText, 'followersCount').listen();
			  guiUser.add(userText, 'friendsCount').listen();
			  guiUser.add(userText, 'statusesCount').listen();
			  guiUser.add(userText, 'threeceeFollowing').listen();
			  guiUser.addColor(userText, 'color');
			  guiUser.add(userText, 'fontSize', 6, 48);
			  guiUser.add(userText, 'border');
			  guiUser.add(userText, 'fontFamily',["sans-serif", "serif", "cursive", "monospace"]);

				guiUser.onChange(function(value) {
					console.debug("GUI USER CHANGE\n", value);
				});

			  displayConfig = new DisplayConfig();

			  guiDisplay = new dat.GUI();
			  guiDisplay.width = 400;

			  guiDisplay.add(displayConfig, 'maxNodes', config.maxNodesMin, config.maxNodesMax).listen();
			  guiDisplay.add(displayConfig, 'maxAge', config.maxAgeMin, config.maxAgeMax).listen();
			  guiDisplay.add(displayConfig, 'gravity', config.gravityMin, config.gravityMax).listen();
			  guiDisplay.add(displayConfig, 'charge', config.chargeMin, config.chargeMax).listen();
			  guiDisplay.add(displayConfig, 'velocityDecay', config.velocityDecayMin, config.velocityDecayMax).listen();

			  guiDisplay.addColor(displayConfig, 'color');
			  guiDisplay.add(displayConfig, 'fontSize', 6, 48);
			  guiDisplay.add(displayConfig, 'border');
			  guiDisplay.add(displayConfig, 'fontFamily',["sans-serif", "serif", "cursive", "monospace"]);

				guiDisplay.onChange(function(value) {
					console.debug("GUI DISPLAY CHANGE\n", value);
				});

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