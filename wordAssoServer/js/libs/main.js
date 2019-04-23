function ControlPanel() {
  "use strict";

  const ONE_SECOND = 1000;
  const ONE_MINUTE = 60*ONE_SECOND;

	var DEFAULT_SOURCE = "https://word.threeceelabs.com";
  // var DEFAULT_SOURCE = "http://localhost:9997";

	var parentWindow = window.opener;
	console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
	var self = this;

	var guiDisplayHashMap = {};

  var guiUser;
  var guiDisplay;

	var displayData = document.getElementById('displayData');
	var displayConfig;

	var userData = document.getElementById('userData');
	var userNode;


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

  const DEFAULT_NODE_RADIUS_RATIO_MIN = 0.0020;
  const DEFAULT_NODE_RADIUS_RATIO_MIN_MIN = 0.0010;
  const DEFAULT_NODE_RADIUS_RATIO_MIN_MAX = 0.1;

  const DEFAULT_NODE_RADIUS_RATIO_MAX = 0.2;
  const DEFAULT_NODE_RADIUS_RATIO_MAX_MIN = 0.1;
  const DEFAULT_NODE_RADIUS_RATIO_MAX_MAX = 0.5;

  const DEFAULT_FONT_SIZE_RATIO_MIN = 0.050;
  const DEFAULT_FONT_SIZE_RATIO_MIN_MIN = 0.001;
  const DEFAULT_FONT_SIZE_RATIO_MIN_MAX = 0.100;

  const DEFAULT_FONT_SIZE_RATIO_MAX = 0.100	;
  const DEFAULT_FONT_SIZE_RATIO_MAX_MIN = 0.050;
  const DEFAULT_FONT_SIZE_RATIO_MAX_MAX = 0.500;

  const DEFAULT_MAX_AGE = 30*ONE_SECOND;
  const DEFAULT_MAX_AGE_MIN = ONE_SECOND;
  const DEFAULT_MAX_AGE_MAX = ONE_MINUTE;

  const DEFAULT_GRAVITY = 0.001;
  const DEFAULT_GRAVITY_MIN = -0.005;
  const DEFAULT_GRAVITY_MAX = 0.005;

  const DEFAULT_CHARGE = -50.0;
  const DEFAULT_CHARGE_MIN = -1000.0;
  const DEFAULT_CHARGE_MAX = 1000.0;

  const DEFAULT_VELOCITY_DECAY = 0.50;
  const DEFAULT_VELOCITY_DECAY_MIN = 0.0;
  const DEFAULT_VELOCITY_DECAY_MAX = 1.0;

  config.fontSizeRatioMin = config.fontSizeRatioMin || DEFAULT_FONT_SIZE_RATIO_MIN;
  config.fontSizeRatioMinMin = config.fontSizeRatioMinMin || DEFAULT_FONT_SIZE_RATIO_MIN_MIN;
  config.fontSizeRatioMinMax = config.fontSizeRatioMinMax || DEFAULT_FONT_SIZE_RATIO_MIN_MAX;

  config.fontSizeRatioMax = config.fontSizeRatioMax || DEFAULT_FONT_SIZE_RATIO_MAX;
  config.fontSizeRatioMaxMin = config.fontSizeRatioMaxMin || DEFAULT_FONT_SIZE_RATIO_MAX_MIN;
  config.fontSizeRatioMaxMax = config.fontSizeRatioMaxMax || DEFAULT_FONT_SIZE_RATIO_MAX_MAX;

  config.maxNodes = config.maxNodes || DEFAULT_MAX_NODES;
  config.maxNodesMin = config.maxNodesMin || DEFAULT_MAX_NODES_MIN;
  config.maxNodesMax = config.maxNodesMax || DEFAULT_MAX_NODES_MAX;

  config.nodeRadiusRatioMin = config.nodeRadiusRatioMin || DEFAULT_NODE_RADIUS_RATIO_MIN;
  config.nodeRadiusRatioMinMin = config.nodeRadiusRatioMinMin || DEFAULT_NODE_RADIUS_RATIO_MIN_MIN;
  config.nodeRadiusRatioMinMax = config.nodeRadiusRatioMinMax || DEFAULT_NODE_RADIUS_RATIO_MIN_MAX;

  config.nodeRadiusRatioMax = config.nodeRadiusRatioMax || DEFAULT_NODE_RADIUS_RATIO_MAX;
  config.nodeRadiusRatioMaxMin = config.nodeRadiusRatioMaxMin || DEFAULT_NODE_RADIUS_RATIO_MAX_MIN;
  config.nodeRadiusRatioMaxMax = config.nodeRadiusRatioMaxMax || DEFAULT_NODE_RADIUS_RATIO_MAX_MAX;

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
  statsObj.user.nodeId = "---";
  statsObj.user.userId = "---";
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

  var eventDetected = false;

  var categories = {left: false, neutral: false, right: false, positive: false, negative: false, none: true };

  var nextUncatHandler = function(){
  	// need to debounce button click
  	// if (eventDetected) {
  	// 	return;
  	// }
  	// eventDetected = true;
    console.debug("NEXT UNCAT");
    // if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?"}, DEFAULT_SOURCE); }
  	// setTimeout(function(){
  	// 	eventDetected = false;
  	// }, 100);
	};

	var UserNode = function() {
		this.nextUncat = nextUncatHandler;
	  this.userId = statsObj.user.userId;
	  this.nodeId = statsObj.user.nodeId;
	  this.screenName = statsObj.user.screenName;
	  this.name = statsObj.user.name;
	  this.location = statsObj.user.location;
	  this.description = statsObj.user.description;
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
	  this.nodeRadiusRatioMin = config.nodeRadiusRatioMin;
	  this.nodeRadiusRatioMax = config.nodeRadiusRatioMax;
	  this.fontSizeRatioMin = config.fontSizeRatioMin;
	  this.fontSizeRatioMax = config.fontSizeRatioMax;
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

      statsObj.user.userId = node.userId;
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

			userNode.userId = statsObj.user.userId;
			userNode.nodeId = statsObj.user.nodeId;
			userNode.name = statsObj.user.name;
			userNode.location = statsObj.user.location;
			userNode.screenName = statsObj.user.screenName;
			userNode.category = shortCategory(statsObj.user.category);
			userNode.categoryAuto = shortCategory(statsObj.user.categoryAuto);
			userNode.followersCount = statsObj.user.followersCount;
			userNode.friendsCount = statsObj.user.friendsCount;
			userNode.statusesCount = statsObj.user.statusesCount;
			userNode.mentions = statsObj.user.mentions;
			userNode.ignored = statsObj.user.ignored;
			userNode.threeceeFollowing = statsObj.user.threeceeFollowing;
			userNode.description = statsObj.user.description;

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


  this.createControlPanel = function(callback) {

    if (callback) { callback(); }

  };


  this.updateControlPanel = function (cfg, callback) {

    console.log("UPDATE CONTROL PANEL");
    if (callback) { callback(); }
  };

	function setChecked( prop ){
	  for (let param in categories){
	    categories[param] = false;
	  }
	  categories[prop] = true;
    // if (parentWindow) {
    // 	parentWindow.postMessage({op: "CATEGORIZE", node: userNode, category: prop}, DEFAULT_SOURCE);
    // }
	}

  $( document ).ready(function() {

    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG"
    	// + "\n" + jsonPrint(config)
    );

    self.createControlPanel(function(){

      setTimeout(function() {  // KLUDGE to insure table is created before update

			  userNode = new UserNode();

			  guiUser = new dat.GUI();
			  guiUser.width = 400;
			  var userCategory = guiUser.addFolder('category');

				userCategory.add(categories, 'left').name('L').listen().onChange(function(){
					setChecked("left");
		    	parentWindow.postMessage({op: "CATEGORIZE", node: currentTwitterNode, category: "left"}, DEFAULT_SOURCE);
				});
				userCategory.add(categories, 'neutral').name('N').listen().onChange(function(){setChecked("neutral")});
				userCategory.add(categories, 'right').name('R').listen().onChange(function(){setChecked("right")});
				userCategory.add(categories, 'none').name('0').listen().onChange(function(){setChecked("none")});

				// userCategoryLeft.onChange(function(value){
				// 	console.log("USER CATEGORY LEFT: " + value);
				// });

				// userCategoryNeutral.onChange(function(value){
				// 	console.log("USER CATEGORY NEUTRAL: " + value);
				// });

				// userCategoryRight.onChange(function(value){
				// 	console.log("USER CATEGORY RIGHT: " + value);
				// });

				// userCategoryNone.onChange(function(value){
				// 	console.log("USER CATEGORY NONE: " + value);
				// });

			  guiUser.add(userNode, 'nextUncat');
			  guiUser.add(userNode, 'nodeId').listen();
			  guiUser.add(userNode, 'screenName').listen();
			  guiUser.add(userNode, 'name').listen();
			  guiUser.add(userNode, 'location').listen();
			  guiUser.add(userNode, 'ignored').listen();
			  guiUser.add(userNode, 'description').listen();
			  // const categoryLeft = guiUser.add(userNode, 'left').name('L').listen().onChange(function(){setChecked("left")});
			  // const categoryRight = guiUser.add(userNode, 'category', 'right').name('R').listen().onChange(function(){setChecked("right")});
			  // const categoryNeutral = guiUser.add(userNode, 'category', 'neutral').name('N').listen().onChange(function(){setChecked("neutral")});
			  // const categoryPositive = guiUser.add(userNode, 'category', 'positive').name('+').listen().onChange(function(){setChecked("positive")});
			  // const categoryNegative = guiUser.add(userNode, 'category', 'negative').name('-').listen().onChange(function(){setChecked("negative")});
			  // const categoryNone = guiUser.add(userNode, 'category', 'none').name('0').listen().onChange(function(){setChecked("none")});
			  guiUser.add(userNode, 'categoryAuto', [ 'L', 'N', 'R', '+', '-', '0' ]).listen();
			  guiUser.add(userNode, 'followersCount').listen();
			  guiUser.add(userNode, 'friendsCount').listen();
			  guiUser.add(userNode, 'statusesCount').listen();
			  guiUser.add(userNode, 'threeceeFollowing').listen();
			  guiUser.addColor(userNode, 'color');
			  guiUser.add(userNode, 'fontSize', 6, 48);
			  guiUser.add(userNode, 'border');
			  guiUser.add(userNode, 'fontFamily',["sans-serif", "serif", "cursive", "monospace"]);

			  displayConfig = new DisplayConfig();

			  guiDisplay = new dat.GUI();
			  guiDisplay.width = 400;

			  guiDisplayHashMap['maxNodes'] = guiDisplay.add(displayConfig, 'maxNodes', config.maxNodesMin, config.maxNodesMax).listen();
			  guiDisplayHashMap['nodeRadiusRatioMin'] = guiDisplay.add(displayConfig, 'nodeRadiusRatioMin', config.nodeRadiusRatioMinMin, config.nodeRadiusRatioMinMax).listen();
			  guiDisplayHashMap['nodeRadiusRatioMax'] = guiDisplay.add(displayConfig, 'nodeRadiusRatioMax', config.nodeRadiusRatioMaxMin, config.nodeRadiusRatioMaxMax).listen();
			  guiDisplayHashMap['fontSizeRatioMin'] = guiDisplay.add(displayConfig, 'fontSizeRatioMin', config.fontSizeRatioMinMin, config.fontSizeRatioMinMax).listen();
			  guiDisplayHashMap['fontSizeRatioMax'] = guiDisplay.add(displayConfig, 'fontSizeRatioMax', config.fontSizeRatioMaxMin, config.fontSizeRatioMaxMax).listen();
			  guiDisplayHashMap['maxAge'] = guiDisplay.add(displayConfig, 'maxAge', config.maxAgeMin, config.maxAgeMax).listen();
			  guiDisplayHashMap['gravity'] = guiDisplay.add(displayConfig, 'gravity', config.gravityMin, config.gravityMax).listen();
			  guiDisplayHashMap['charge'] = guiDisplay.add(displayConfig, 'charge', config.chargeMin, config.chargeMax).listen();
			  guiDisplayHashMap['velocityDecay'] = guiDisplay.add(displayConfig, 'velocityDecay', config.velocityDecayMin, config.velocityDecayMax).listen();

			  guiDisplay.addColor(displayConfig, 'color');
			  guiDisplay.add(displayConfig, 'fontSize', 6, 48);
			  guiDisplay.add(displayConfig, 'border');
			  guiDisplay.add(displayConfig, 'fontFamily',["sans-serif", "serif", "cursive", "monospace"]);

				guiDisplayHashMap['maxNodes'].onFinishChange(function(value) {
					console.debug("GUI DisplayConfig MAX NODES CHANGE\n", value);
			    parentWindow.postMessage({op:"UPDATE", id: "maxNodes", value: value}, DEFAULT_SOURCE);
				});

				guiDisplayHashMap['fontSizeRatioMin'].onChange(function(value) {
					console.debug("GUI DisplayConfig NODE FONT SIZE RATIO MIN CHANGE\n", value);
			    parentWindow.postMessage({op:"UPDATE", id: "fontSizeRatioMin", value: value}, DEFAULT_SOURCE);
				});

				guiDisplayHashMap['fontSizeRatioMax'].onChange(function(value) {
					console.debug("GUI DisplayConfig NODE FONT SIZE RATIO MAX CHANGE\n", value);
			    parentWindow.postMessage({op:"UPDATE", id: "fontSizeRatioMax", value: value}, DEFAULT_SOURCE);
				});

				guiDisplayHashMap['nodeRadiusRatioMin'].onChange(function(value) {
					console.debug("GUI DisplayConfig NODE RADIUS RATIO MIN CHANGE\n", value);
			    parentWindow.postMessage({op:"UPDATE", id: "nodeRadiusRatioMin", value: value}, DEFAULT_SOURCE);
				});

				guiDisplayHashMap['nodeRadiusRatioMax'].onChange(function(value) {
					console.debug("GUI DisplayConfig NODE RADIUS RATIO MAX CHANGE\n", value);
			    parentWindow.postMessage({op:"UPDATE", id: "nodeRadiusRatioMax", value: value}, DEFAULT_SOURCE);
				});

				guiDisplayHashMap['maxAge'].onFinishChange(function(value) {
					console.debug("GUI DisplayConfig MAX AGE CHANGE\n", value);
			    parentWindow.postMessage({op:"UPDATE", id: "maxAge", value: value}, DEFAULT_SOURCE);
				});

				guiDisplayHashMap['gravity'].onChange(function(value) {
					console.debug("GUI DisplayConfig GRAVITY CHANGE\n", value);
			    parentWindow.postMessage({op:"UPDATE", id: "gravity", value: value}, DEFAULT_SOURCE);
				});

				guiDisplayHashMap['charge'].onChange(function(value) {
					console.debug("GUI DisplayConfig CHARGE CHANGE\n", value);
			    parentWindow.postMessage({op:"UPDATE", id: "charge", value: value}, DEFAULT_SOURCE);
				});

				guiDisplayHashMap['velocityDecay'].onChange(function(value) {
					console.debug("GUI DisplayConfig VELOCITY DECAY CHANGE\n", value);
			    parentWindow.postMessage({op:"UPDATE", id: "velocityDecay", value: value}, DEFAULT_SOURCE);
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