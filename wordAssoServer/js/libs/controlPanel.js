function ControlPanel() {
  "use strict";

  const ONE_SECOND = 1000;
  const ONE_MINUTE = 60*ONE_SECOND;
  const ONE_HOUR = 60*ONE_MINUTE;
  const ONE_DAY = 24*ONE_HOUR;

  const compactDateTimeFormat = "YYYYMMDD HHmmss";

  const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
  const LOCAL_SOURCE = "http://localhost:9997";

  const DEFAULT_SOURCE = REPLACE_SOURCE;

	var parentWindow = window.opener;
	console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
	var self = this;

	var dashboardMainDiv = document.getElementById('dashboardMainDiv');

  var displayControlHashMap = {};

  var displayControl;
  var displayControlDiv = document.createElement("div");
  displayControlDiv.id = "displayControlDiv";

  var twitterControl;
  var twitterControlDiv = document.createElement("div");
  twitterControlDiv.id = "twitterControlDiv";

  var twitterEntity;
  var twitterEntityDiv = document.createElement("div");
  twitterEntityDiv.id = "twitterEntityDiv";

	var twitterTimeLine;
	var twitterTimeLineDiv = document.createElement("div");
	twitterTimeLineDiv.id = "twitterTimeLineDiv";

	var entityCategorizeDiv = document.getElementById('entityCategorizeDiv');

  var twitterFeedUser = {};
  var twitterFeedPreviousUser = {};
  var twitterFeedHashtag = {};
  var twitterFeedPreviousHashtag = {};

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

  const DEFAULT_RANGE_STEPS = 1000;

  config.defaultRangeSteps = DEFAULT_RANGE_STEPS;

  const DEFAULT_MAX_NODES = 100;
  const DEFAULT_MAX_NODES_MIN = 10;
  const DEFAULT_MAX_NODES_MAX = 500;

  const DEFAULT_NODE_RADIUS_RATIO_MIN = 0.0020;
  const DEFAULT_NODE_RADIUS_RATIO_MIN_MIN = 0.0;
  const DEFAULT_NODE_RADIUS_RATIO_MIN_MAX = 0.1;

  const DEFAULT_NODE_RADIUS_RATIO_MAX = 0.2;
  const DEFAULT_NODE_RADIUS_RATIO_MAX_MIN = 0.1;
  const DEFAULT_NODE_RADIUS_RATIO_MAX_MAX = 0.5;

  const DEFAULT_FONT_SIZE_RATIO_MIN = 0.050;
  const DEFAULT_FONT_SIZE_RATIO_MIN_MIN = 0.0;
  const DEFAULT_FONT_SIZE_RATIO_MIN_MAX = 0.100;

  const DEFAULT_FONT_SIZE_RATIO_MAX = 0.100	;
  const DEFAULT_FONT_SIZE_RATIO_MAX_MIN = 0.050;
  const DEFAULT_FONT_SIZE_RATIO_MAX_MAX = 0.250;

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

  config.range = {};

  const rangeInputs =[
    "charge",
    "fontSizeRatioMax",
    "fontSizeRatioMin",
    "gravity", 
    "maxAge",
    "maxNodes", 
    "nodeRadiusRatioMax",
    "nodeRadiusRatioMin", 
    "velocityDecay"
  ];

  rangeInputs.forEach(function(rangeInput){
    config.range[rangeInput] = {};
    config.range[rangeInput].name = rangeInput;
    config.range[rangeInput].default = eval("DEFAULT_" + changeCase.constantCase(rangeInput));
    config.range[rangeInput].min = eval("DEFAULT_" + changeCase.constantCase(rangeInput) + "_MIN");
    config.range[rangeInput].max = eval("DEFAULT_" + changeCase.constantCase(rangeInput) + "_MAX");
  });

  console.log("CONFIG RANGE INPUTS\n", config.range);

  delete config.twitterUser.histograms;
  delete config.twitterUser.countHistory;
  delete config.twitterUser.status;

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
  statsObj.user.following = false;
  statsObj.user.ignored = false;
  statsObj.user.profileImageUrl = "";

  twitterFeedUser = statsObj.user;

  var eventDetected = false;

  var categories = [
  	"left",
  	"neutral",
  	"right",
  	"positive",
  	"negative",
  	"none",
  ];

  function getTimeStamp(inputTime) {

    let currentTimeStamp;

    if (inputTime === undefined) {
      currentTimeStamp = moment().format(compactDateTimeFormat);
      return currentTimeStamp;
    }
    else if (moment.isMoment(inputTime)) {
      currentTimeStamp = moment(inputTime).format(compactDateTimeFormat);
      return currentTimeStamp;
    }
    else if (moment(new Date(inputTime)).isValid()) {
      currentTimeStamp = moment(new Date(inputTime)).format(compactDateTimeFormat);
      return currentTimeStamp;
    }
    else if (moment(parseInt(inputTime)).isValid()) {
      currentTimeStamp = moment(parseInt(inputTime)).format(compactDateTimeFormat);
      return currentTimeStamp;
    }
    else {
      console.log(chalkAlert("WAS | *** getTimeStamp INVALID DATE: " + inputTime));
      return null;
    }
  }

  var nextUncatHandler = function(cat){
  	// need to debounce button click
  	if (eventDetected) {
  		return;
  	}
  	eventDetected = true;

  	var searchFilter = "@?";

    switch (cat){
    	case "left":
    	case "right":
    	case "neutral":
    	case "positive":
    	case "negative":
    	case "none":
    		searchFilter += cat; 
    }

    console.debug("NEXT UNCAT | CAT FILTER: " + cat + " | searchFilter: " + searchFilter);

    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: searchFilter}, DEFAULT_SOURCE); }
  	setTimeout(function(){
  		eventDetected = false;
  	}, 100);
	};


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

	  setChecked(category);

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

      // twitterFeedPreviousUser = node;

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
      statsObj.user.following = node.following;
      statsObj.user.threeceeFollowing = node.threeceeFollowing;
      statsObj.user.mentions = node.mentions;

      if (twttr && twttr.widgets) {

        twttr.widgets.createTimeline(
          { sourceType: "profile", screenName: node.screenName},
          twitterTimeLineDiv,
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

    twitterTimeLineDiv.removeAll();

    callback();
  }

  function loadTwitterFeed(node, callback) {

    if (!twitterTimeLineDiv || (twttr === undefined)) { 
      console.error("loadTwitterFeed: twitterTimeLineDiv OR twttr UNDEFINED");
      return callback("loadTwitterFeed: twitterTimeLineDiv OR twttr UNDEFINED");
    }

    twitterTimeLineDiv.removeAll();

    node.categoryAuto = node.categoryAuto || "none";

    if (node.nodeType === "user"){

      twitterFeedPreviousUser = twitterFeedUser;
      twitterFeedUser = node;

      twitterEntity.setValue("NODE ID", node.nodeId);
    	twitterEntity.setValue("NAME", node.name);
      twitterEntity.setValue("SCREENNAME", "@"+node.screenName);
      twitterEntity.setValue("CREATED", getTimeStamp(node.createdAt));
      twitterEntity.setValue("LAST SEEN", getTimeStamp(node.lastSeen));
      twitterEntity.setValue("HASHTAG", "");
      twitterEntity.setValue("FOLLOWERS", node.followersCount);
      twitterEntity.setValue("FRIENDS", node.friendsCount);
      twitterEntity.setValue("LOCATION", node.location);
      twitterEntity.setValue("PROFILE IMAGE", node.profileImageUrl.replace("_normal", ""));
      twitterEntity.setValue("DESCRIPTION", node.description);

      const ageMs = moment().diff(node.createdAt);
      const tweetsPerDay = ONE_DAY * (node.statusesCount/ageMs);

      twitterTimeLine.setValue("TWEETS", node.statusesCount);
      twitterTimeLine.setValue("TWEETS PER DAY", tweetsPerDay.toFixed(3));
      twitterTimeLine.setValue("MENTIONS", node.mentions);
      twitterTimeLine.setValue("RATE", node.rate);
      twitterTimeLine.setValue("RATE MAX", node.rateMax);

      const following = node.following || false;
      const ignored = node.ignored || false;
      const categoryAuto = node.categoryAuto.toUpperCase() || "NONE";

      twitterControl.setValue("FOLLOWING", following);
      twitterControl.setValue("IGNORED", ignored);
			twitterControl.setValue("CATEGORY AUTO", categoryAuto);

      console.debug("loadTwitterFeed"
        + " | TYPE: " + node.nodeType
        + " | NID: " + node.nodeId
        + " | IG: " + node.ignored
        + " | FLWG: " + node.following
        + " | 3CFLWG: " + node.threeceeFollowing
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
          callback(null);
        });

      });
    }
    else if (node.nodeType === "hashtag"){

      twitterFeedHashtag = node;
      twitterFeedPreviousHashtag = twitterFeedHashtag;

      twitterEntity.setValue("NODE ID", node.nodeId);
      twitterEntity.setValue("NAME", "");
      twitterEntity.setValue("SCREENNAME", "");
      twitterEntity.setValue("HASHTAG", "#" + node.nodeId);
      twitterEntity.setValue("FOLLOWERS", "");
      twitterEntity.setValue("FRIENDS", "");
      twitterEntity.setValue("LOCATION", "");
      twitterEntity.setValue("PROFILE IMAGE", "https://word.threeceelabs.com/public/assets/images/twitterEgg.png");
      twitterEntity.setValue("DESCRIPTION", "");

      twitterTimeLine.setValue("TWEETS", "");
      twitterTimeLine.setValue("MENTIONS", node.mentions);
      twitterTimeLine.setValue("RATE", node.rate);
      twitterTimeLine.setValue("RATE MAX", node.rateMax);

      twitterControl.setValue("FOLLOWING", node.following || false);
      twitterControl.setValue("IGNORED", node.ignored || false);
      twitterControl.setValue("CATEGORY AUTO", node.categoryAuto.toUpperCase() || "NONE");

      console.debug("loadTwitterFeed"
        + " | TYPE: " + node.nodeType
        + " | #: " + node.nodeId
        + " | CAT M: " + node.category
        + " | Ms: " + node.mentions
      );

      updateCategoryRadioButtons(node.category, function(){
        twitterHashtagSearch(node, function(){
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
          + " | IG: " + currentTwitterNode.ignored
          + " | FLWG: " + currentTwitterNode.following
          + " | 3CFLWG: " + currentTwitterNode.threeceeFollowing
          + " | @" + currentTwitterNode.screenName
          + " | CR: " + currentTwitterNode.createdAt
          + " | LS: " + currentTwitterNode.lastSeen
          + " | C: " + currentTwitterNode.category
          + " | CA: " + currentTwitterNode.categoryAuto
			    + "\n profileImageUrl: " + currentTwitterNode.profileImageUrl
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

	var radioUserCategoryDiv = document.createElement("div");
	radioUserCategoryDiv.id = "radioUserCategoryDiv";
  radioUserCategoryDiv.setAttribute("class", "radioCheckbox");
  radioUserCategoryDiv.style.fontSize = "16px";

	["left", "neutral", "right", "positive", "negative", "none"].forEach(function(category){

		var categoryLabel = document.createElement("label");
		categoryLabel.setAttribute("class", "categoryButtonLabel");
		categoryLabel.setAttribute("id", "categoryLabel_" + shortCategory(category));
    categoryLabel.style.fontSize = "16px";
    categoryLabel.style.padding = "5px";
		categoryLabel.innerHTML = shortCategory(category);

		var categoryButton = document.createElement("input");
		categoryButton.id = "category_" + category; 
		categoryButton.setAttribute("type", "checkbox");
		categoryButton.name = category; 
    categoryButton.style.webkitAppearance = "none";
    categoryButton.style.backgroundColor = "lightgray";
    categoryButton.style.boxSizing = "border-box";
    categoryButton.style.width = "16px";
    categoryButton.style.height = "16px";

		categoryLabel.appendChild(categoryButton);
		radioUserCategoryDiv.appendChild(categoryLabel);

	});

	radioUserCategoryDiv.onclick = function(e){
		console.log("radioUserCategoryDiv BUTTON: ", e.srcElement.id);
		catRadioButtonHandler(e);
	}

	function setChecked( categorySet ){

		var categorySetButtonId = "category_" + categorySet;

		var cbxs = radioUserCategoryDiv.getElementsByTagName('input'), i=cbxs.length;

		while(i--) {

		  if (cbxs[i].type && cbxs[i].type == 'checkbox' && cbxs[i].id === categorySetButtonId) {
				cbxs[i].checked = true;
        cbxs[i].style.backgroundColor = "blue";
		  }
		  if (cbxs[i].type && cbxs[i].type == 'checkbox' && cbxs[i].id !== categorySetButtonId) {
				cbxs[i].checked = false;
        cbxs[i].style.backgroundColor = "lightgray";
		  }

		}
	}

  function computeRangeStep(params){
    return Math.abs((params.max-params.min)/config.defaultRangeSteps);
  }

  function catRadioButtonHandler(e){

		e = e || event;

		var cb = e.srcElement || e.target;

		if (cb.type !== 'checkbox') {return true;}

		console.log("CAT BUTTON: ", cb.id);

		var cbxs = radioUserCategoryDiv.getElementsByTagName('input');
		var i = cbxs.length;

		while(i--) {
			if (cbxs[i].type && cbxs[i].type == 'checkbox' && cbxs[i].id !== cb.id) {
				cbxs[i].checked = false;
        cbxs[i].style.backgroundColor = "lightgray";
			}
		}
		cb.checked = true;
    cb.style.backgroundColor = "blue";
    parentWindow.postMessage({op: "CATEGORIZE", node: currentTwitterNode, category: cb.name}, DEFAULT_SOURCE);
  }

  function createRangeInput(params){

    console.log("createRangeInput\n", params);

    let configObj = config.range[params.name];

    configObj.title = changeCase.sentenceCase(configObj.name).toUpperCase();
    configObj.step = configObj.step || computeRangeStep({ max: configObj.max, min: configObj.min });

    console.log("configObj\n", configObj);

    displayControl.addRange(
      configObj.title, 
      configObj.min, 
      configObj.max, 
      configObj.default, 
      configObj.step, 
      function(value){
        console.debug(configObj.name + ": " + value);
        parentWindow.postMessage({op: "UPDATE", id: configObj.name, value: value}, DEFAULT_SOURCE);
      }
    );

    return;
  }

  $( document ).ready(function() {

    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG");

    self.createControlPanel(function(){

      setTimeout(function() {  // KLUDGE to insure table is created before update

        QuickSettings.useExtStyleSheet();

        // DISPLAY ==================================

        displayControl = QuickSettings.create(900, 0, "DISPLAY", entityCategorizeDiv);

        displayControl.setWidth(300);

        rangeInputs.forEach(function(rangeInput){
          createRangeInput({name: rangeInput});
        });

        // TWITTER USER CONTROL ==================================

        twitterControl = QuickSettings.create(600, 0, "CONTROL", entityCategorizeDiv);

        twitterControl.setWidth(300);

        let following = false;
        if (twitterFeedUser && twitterFeedUser.following !== undefined) {
          following = twitterFeedUser.following;
        }

        twitterControl.addBoolean("FOLLOWING", following, function(data){
          console.debug("USER FOLLOWING | " + twitterEntity.getValue("SCREENNAME") + " | FOLLOWING: " + data);
          const op = (data) ? "FOLLOW" : "UNFOLLOW";
          parentWindow.postMessage({op: op, user: twitterFeedUser}, DEFAULT_SOURCE);
        });

        let ignored = false;
        if (twitterFeedUser && twitterFeedUser.ignored !== undefined) {
          ignored = twitterFeedUser.ignored;
        }

        twitterControl.addBoolean("IGNORED", ignored, function(data){
          console.debug("USER IGNORED | " + twitterEntity.getValue("SCREENNAME") + " | IGNORED: " + data);
          const op = (data) ? "IGNORE" : "UNIGNORE";
          parentWindow.postMessage({op: op, user: twitterFeedUser}, DEFAULT_SOURCE);
        });

        twitterControl.addElement("CATEGORY MAN", radioUserCategoryDiv);

        twitterFeedUser.categoryAuto = twitterFeedUser.categoryAuto || "none";
        const categoryAuto = (twitterFeedUser) ? twitterFeedUser.categoryAuto.toUpperCase() : "";
        twitterControl.addText("CATEGORY AUTO", categoryAuto.toUpperCase());

        twitterControl.addButton("NEXT UNCAT LEFT", function(){
          nextUncatHandler("left");
        });
        twitterControl.addButton("NEXT UNCAT NEUTRAL", function(){
          nextUncatHandler("neutral");
        });
        twitterControl.addButton("NEXT UNCAT RIGHT", function(){
          nextUncatHandler("right");
        });
        twitterControl.addButton("IGNORE", function(){
          parentWindow.postMessage({op: "IGNORE", user: twitterFeedUser}, DEFAULT_SOURCE);
        });
        twitterControl.addButton("UNIGNORE", function(){
          parentWindow.postMessage({op: "UNIGNORE", user: twitterFeedUser}, DEFAULT_SOURCE);
        });
        twitterControl.addButton("NEXT UNCAT", function(){
          nextUncatHandler("any");
        });


        // TWITTER ENTITY ==================================

        twitterEntity = QuickSettings.create(0, 0, "ENTITY", entityCategorizeDiv);
        twitterEntity.setWidth(300);


        const nodeId = (twitterFeedUser) ? twitterFeedUser.nodeId : "";
        twitterEntity.addText("NODE ID", nodeId);

        const name = (twitterFeedUser) ? twitterFeedUser.name : "";
        twitterEntity.addText("NAME", name);

        const screenName = (twitterFeedUser) ? "@"+twitterFeedUser.screenName : "@";
        twitterEntity.addText("SCREENNAME", screenName);

        const createdAt = (twitterFeedUser) ? twitterFeedUser.createdAt : "";
        const ageMs = (twitterFeedUser) ? moment().diff(createdAt) : 0;
        twitterEntity.addText("CREATED", getTimeStamp(createdAt));

        const lastSeen = (twitterFeedUser) ? twitterFeedUser.lastSeen : "";
        twitterEntity.addText("LAST SEEN", getTimeStamp(lastSeen));

        twitterEntity.addButton("USER SEARCH", function(data){
          console.debug("NODE SEARCH: ", twitterEntity.getValue("SCREENNAME"));
          parentWindow.postMessage({op: "NODE_SEARCH", input: twitterEntity.getValue("SCREENNAME")}, DEFAULT_SOURCE);
        });

        const hashtag = (twitterFeedHashtag) ? "#"+twitterFeedHashtag.nodeId : "#";
        twitterEntity.addText("HASHTAG", hashtag);

				twitterEntity.addButton("HASHTAG SEARCH", function(data){
					console.debug("NODE SEARCH: ", twitterEntity.getValue("HASHTAG"));
		      parentWindow.postMessage({op: "NODE_SEARCH", input: twitterEntity.getValue("HASHTAG")}, DEFAULT_SOURCE);
				});

        twitterEntity.addNumber("FOLLOWERS", twitterFeedUser.followersCount);
        twitterEntity.addNumber("FRIENDS", twitterFeedUser.friendsCount);

        const location = (twitterFeedUser) ? twitterFeedUser.location : "";
        twitterEntity.addText("LOCATION", location);

				const description = (twitterFeedUser) ? twitterFeedUser.description : "";
				twitterEntity.addTextArea("DESCRIPTION", description);

				if (twitterFeedUser) {
					var profileImageUrl = twitterFeedUser.profileImageUrl.replace("http:", "https:");
					profileImageUrl = twitterFeedUser.profileImageUrl.replace("_normal", "");
					twitterEntity.addImage("PROFILE IMAGE", profileImageUrl);
				}
				else {
					twitterEntity.addImage("PROFILE IMAGE", "https://word.threeceelabs.com/public/assets/images/twitterEgg.png");
				}


        // TWITTER USER TIMELINE ==================================

				twitterTimeLine = QuickSettings.create(300, 	0, "TIMELINE", entityCategorizeDiv);
				twitterTimeLine.setWidth(300);

        const tweetsPerDay = (twitterFeedUser && ageMs) ? ONE_DAY * (twitterFeedUser.statusesCount/ageMs) : 0;

        twitterTimeLine.addNumber("TWEETS", twitterFeedUser.statusesCount);
        twitterTimeLine.addNumber("TWEETS PER DAY", tweetsPerDay.toFixed(3));
        twitterTimeLine.addNumber("MENTIONS", twitterFeedUser.mentions);
        twitterTimeLine.addNumber("RATE", twitterFeedUser.rate);
        twitterTimeLine.addNumber("RATE MAX", twitterFeedUser.rateMax);
				twitterTimeLine.addElement("TIMELINE", twitterTimeLineDiv);	

				twitterEntity.setGlobalChangeHandler(function(data){
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