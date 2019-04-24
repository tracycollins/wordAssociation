function ControlPanel() {
  "use strict";

  const ONE_SECOND = 1000;
  const ONE_MINUTE = 60*ONE_SECOND;

	var DEFAULT_SOURCE = "https://word.threeceelabs.com";
  // var DEFAULT_SOURCE = "http://localhost:9997";

	var parentWindow = window.opener;
	console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
	var self = this;

	var dashboardMainDiv = document.getElementById('dashboardMainDiv');

	var twitterProfile;
	var twitterProfileDiv = document.createElement("div");
	twitterProfileDiv.id = "twitterProfileDiv";

	var twitterTimeLine;
	var twitterTimeLineDiv = document.createElement("div");
	twitterTimeLineDiv.id = "twitterTimeLineDiv";

	var userCategorizeDiv = document.getElementById('userCategorizeDiv');

  var twitterFeedUser;
  var twitterFeedPreviousUser;
  var twitterFeedHashtag;

	var compactDateTimeFormat = "YYYYMMDD HHmmss";

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

  var eventDetected = false;

  var categories = [
  	"left",
  	"neutral",
  	"right",
  	"positive",
  	"negative",
  	"none",
  ];

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

    if (node.nodeType === "user"){

      twitterFeedPreviousUser = twitterFeedUser;
      twitterFeedUser = node;

    	twitterProfile.setValue("NAME", node.name);
    	twitterProfile.setValue("SCREENNAME", "@"+node.screenName);
    	twitterProfile.setValue("LOCATION", node.location);
			twitterProfile.setValue("PROFILE", node.profileImageUrl.replace("_normal", ""));
			twitterProfile.setValue("DESCRIPTION", node.description);
			twitterProfile.setValue("IGNORED", node.ignored || false);
			twitterProfile.setValue("CATEGORY AUTO", node.categoryAuto);

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
	radioUserCategoryDiv.style.backgroundColor = "white";

	["left", "neutral", "right", "positive", "negative", "none"].forEach(function(category){

		var categoryLabel = document.createElement("label");
		categoryLabel.setAttribute("class", "categoryButtonLabel");
		categoryLabel.setAttribute("id", "categoryLabel_" + shortCategory(category));
		categoryLabel.innerHTML = shortCategory(category);

		var categoryButton = document.createElement("input");
		categoryButton.id = "category_" + category; 
		categoryButton.setAttribute("type", "checkbox");
		categoryButton.name = category; 

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
		  }
		  if (cbxs[i].type && cbxs[i].type == 'checkbox' && cbxs[i].id !== categorySetButtonId) {
				cbxs[i].checked = false;
		  }

		}
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
			}
		}
		cb.checked = true;
    parentWindow.postMessage({op: "CATEGORIZE", node: currentTwitterNode, category: cb.name}, DEFAULT_SOURCE);
  }


  $( document ).ready(function() {

    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG");

    self.createControlPanel(function(){

      setTimeout(function() {  // KLUDGE to insure table is created before update

				twitterProfile = QuickSettings.create(0, 0, "TWITTER USER PROFILE", userCategorizeDiv);
				twitterProfile.setWidth(400);

				twitterProfile.addButton("NEXT UNCAT", function(){
					nextUncatHandler("any");
				});
				twitterProfile.addButton("NEXT UNCAT LEFT", function(){
					nextUncatHandler("left");
				});
				twitterProfile.addButton("NEXT UNCAT RIGHT", function(){
					nextUncatHandler("right");
				});

        let ignored = false;
        if (twitterFeedUser && twitterFeedUser.ignored !== undefined) {
          ignored = twitterFeedUser.ignored;
        }

        twitterProfile.addBoolean("IGNORED", ignored);
        // twitterProfile.overrideStyle("IGNORED", "position", null);

				twitterProfile.addElement("CATEGORY MAN", radioUserCategoryDiv);

				const categoryAuto = (twitterFeedUser) ? twitterFeedUser.categoryAuto : "";
				twitterProfile.addText("CATEGORY AUTO", categoryAuto);

				const name = (twitterFeedUser) ? twitterFeedUser.name : "";
				twitterProfile.addText("NAME", name);

				const screenName = (twitterFeedUser) ? "@"+twitterFeedUser.screenName : "@";
				twitterProfile.addText("SCREENNAME", screenName);

				twitterProfile.addButton("SEARCH", function(data){
					console.debug("NODE SEARCH: ", twitterProfile.getValue("SCREENNAME"));
		      parentWindow.postMessage({op: "NODE_SEARCH", input: twitterProfile.getValue("SCREENNAME")}, DEFAULT_SOURCE);
				});

				const location = (twitterFeedUser) ? twitterFeedUser.location : "";
				twitterProfile.addText("LOCATION", location);

				const description = (twitterFeedUser) ? twitterFeedUser.description : "";
				twitterProfile.addTextArea("DESCRIPTION", description);

				if (twitterFeedUser) {
					var profileImageUrl = twitterFeedUser.profileImageUrl.replace("http:", "https:");
					profileImageUrl = twitterFeedUser.profileImageUrl.replace("_normal", "");
					twitterProfile.addImage("PROFILE", profileImageUrl);
				}
				else {
					twitterProfile.addImage("PROFILE", "https://word.threeceelabs.com/public/assets/images/twitterEgg.png");
				}


				twitterTimeLine = QuickSettings.create(400, 	0, "TWITTER USER TIMELINE", userCategorizeDiv);
				twitterTimeLine.setWidth(400);
				twitterTimeLine.addElement("TWEETS", twitterTimeLineDiv);	

				twitterProfile.setGlobalChangeHandler(function(data){
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