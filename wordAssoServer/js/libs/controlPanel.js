function ControlPanel() {
  // var DEFAULT_SOURCE = "==SOURCE==";  // will be updated by wordAssoServer.js on app.get
  // var DEFAULT_SOURCE = "http://localhost:9997";
  var DEFAULT_SOURCE = "http://word.threeceelabs.com";

  var parentWindow = window.opener;
  console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
  var self = this;

  var config = {};
  var currentTwitterNode;
  var currentTwitterUser;
  var currentTwitterHashtag;

  config = window.opener.config;

  console.log("config\n" + jsonPrint(config));

  var controlIdHash = {};

  var dashboardMain;
  var infoTable;
  var controlTable;
  var controlTableHead;
  var controlTableBody;
  var controlSliderTable;

  var twitterFeedDiv = d3.select("#twitterFeedDiv");
  var timelineDiv = document.getElementById("timelineDiv");
  var hashtagDiv =document.getElementById("hashtagDiv");

  var twitterProfile = d3.select("#twitterProfileDiv").append("svg:svg")  
    .attr("id", "twitterProfile")
    .attr("width", 100)
    .attr("height", 100)
    .attr("viewbox", 1e-6, 1e-6, 100, 100)
    .attr("x", 0)
    .attr("y", 0)
    .append("svg:a")
    .attr("id", "twitterProfileLink")
    .attr("xlink:show", "new")
    .attr("xlink:href", "http://word.threeceelabs.com");
  var twitterProfileImage = twitterProfile.append("svg:image")
    .attr("id", "twitterProfileImage")
    .attr("xlink:href", "favicon.png")
    .attr("width", 100)
    .attr("height", 100)
    .style("opacity", 1)
    .style("visibility", "hidden");

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
    }
  }

  function loadTwitterProfile(profileImageUrl) {
    console.log("loadTwitterProfile: " + profileImageUrl);
    twitterProfileImage.attr("xlink:href", profileImageUrl);
  }

  function twitterWidgetsCreateTimeline(node, callback){

    var screenName = node.screenName;

    var timelineText = document.createElement("TEXT");
    timelineText.setAttribute("id", "timelineText");
    timelineText.setAttribute("class", "hashtagText");
    timelineText.innerHTML = "<br>" + "KW: " + node.keywords + " | KWA: " + node.keywordsAuto + "<br>";
    timelineDiv.appendChild(timelineText);


    twttr.widgets.createTimeline(
      { sourceType: "profile", screenName: screenName },
      timelineDiv,
      { width: "450", height: "700", related: "twitterdev,twitterapi" })
    .then(function (el) {

      // var timelineText = document.createElement("TEXT");
      // timelineText.setAttribute("id", "timelineText");
      // timelineText.setAttribute("class", "timelineText");
      // timelineText.innerHTML = "KW: " + node.keywords + " | KWA: " + node.keywordsAuto;
      // timelineDiv.appendChild(timelineText);

      callback(null, el);
    })
    .catch(function(err){
      console.error("TWITTER WIDGET ERROR: " + err);
      callback(err, null);
    });
  }

  function twitterHashtagSearch(text, callback){

    var url = "https://twitter.com/search?f=tweets&q=%23" + text ;

    var hashtagText = document.createElement("TEXT");
    hashtagText.setAttribute("id", "hashtagText");
    hashtagText.setAttribute("class", "hashtagText");
    hashtagText.innerHTML = "#" + text;

    hashtagDiv.removeAll();
    timelineDiv.removeAll();
    hashtagDiv.appendChild(hashtagText);

    callback();
  }

  Element.prototype.removeAll = function () {
    while (this.firstChild) { this.removeChild(this.firstChild); }
    return this;
  };

  function loadTwitterFeed(node, callback) {

    var keywords = "-";
    var keywordsAuto = "-";

    if (node.keywords 
      && (node.keywords !== undefined) 
      && (Object.keys(node.keywords).length > 0)){
      keywords = Object.keys(node.keywords);
    }

    if (node.keywordsAuto 
      && (node.keywordsAuto !== undefined) 
      && (Object.keys(node.keywordsAuto).length > 0)){
      keywordsAuto = Object.keys(node.keywordsAuto);
    }

    node.keywords = keywords;
    node.keywordsAuto = keywordsAuto;

    console.debug("loadTwitterFeed"
      + " | " + node.nodeType
      + " | " + node.nodeId
      + " | " + node.keywords
      + " | " + node.keywordsAuto
    );

    hashtagDiv.removeAll();
    timelineDiv.removeAll();

    if (node.nodeType === "user"){
      twitterWidgetsCreateTimeline(node, function(err, el){
        callback(err, el);
      });
    }
    else if (node.nodeType === "hashtag"){
      twitterHashtagSearch(node, function(err, el){
        callback(err, el);
      });
    }
  }

  function categoryButtonHandler(e){

    var currentButton = document.getElementById(e.target.id);
    var keywords = {};

    console.warn("CATEGORY BUTTON"
     + " | ID: " + e.target.id
     + "\n" + jsonPrint(e.target)
    );

    switch (e.target.id){
      case "categoryLeft":
        console.log("LEFT | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        keywords = { left: 100 };
      break;
      case "categoryRight":
        console.log("RIGHT | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        keywords = { right: 100 };
      break;
      case "categoryNeutral":
        console.log("NEUTRAL | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        keywords = { neutral: 100 };
      break;
      case "categoryPositive":
        console.log("POSITIVE | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        keywords = { positive: 100 };
      break;
      case "categoryNegative":
        console.log("NEGATIVE | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        keywords = { negative: 100 };
      break;
    }

    parentWindow.postMessage({op: "CATEGORIZE", node: currentTwitterNode, keywords: keywords}, DEFAULT_SOURCE);
  }

  var twitterCategoryDiv = document.getElementById("twitterCategoryDiv");

  var categoryLeft = document.createElement("BUTTON");
  categoryLeft.setAttribute("class", "button");
  categoryLeft.setAttribute("type", "radio");
  categoryLeft.setAttribute("name", "category");
  categoryLeft.setAttribute("id", "categoryLeft");
  categoryLeft.setAttribute("value", "left");
  categoryLeft.setAttribute("checked", true);
  categoryLeft.innerHTML = "LEFT";
  categoryLeft.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);

  var categoryNeutral = document.createElement("BUTTON");
  categoryNeutral.setAttribute("class", "button");
  categoryNeutral.setAttribute("type", "radio");
  categoryNeutral.setAttribute("name", "category");
  categoryNeutral.setAttribute("id", "categoryNeutral");
  categoryNeutral.setAttribute("value", "neutral");
  categoryNeutral.innerHTML = "NEUTRAL";
  categoryNeutral.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);

  var categoryRight = document.createElement("BUTTON");
  categoryRight.setAttribute("class", "button");
  categoryRight.setAttribute("type", "radio");
  categoryRight.setAttribute("name", "category");
  categoryRight.setAttribute("id", "categoryRight");
  categoryRight.setAttribute("value", "right");
  categoryRight.innerHTML = "RIGHT";
  categoryRight.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);

  var categoryPositive = document.createElement("BUTTON");
  categoryPositive.setAttribute("class", "button");
  categoryPositive.setAttribute("type", "radio");
  categoryPositive.setAttribute("name", "category");
  categoryPositive.setAttribute("id", "categoryPositive");
  categoryPositive.setAttribute("value", "positive");
  categoryPositive.innerHTML = "POSITIVE";
  categoryPositive.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);

  var categoryNegative = document.createElement("BUTTON");
  categoryNegative.setAttribute("class", "button");
  categoryNegative.setAttribute("type", "radio");
  categoryNegative.setAttribute("name", "category");
  categoryNegative.setAttribute("id", "categoryNegative");
  categoryNegative.setAttribute("value", "negative");
  categoryNegative.innerHTML = "NEGATIVE";
  categoryNegative.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);

  twitterCategoryDiv.appendChild(categoryLeft);
  twitterCategoryDiv.appendChild(categoryNeutral);
  twitterCategoryDiv.appendChild(categoryRight);
  twitterCategoryDiv.appendChild(categoryPositive);
  twitterCategoryDiv.appendChild(categoryNegative);

  var statsObj = {};
  statsObj.socketId = "NOT SET";


  var nodeSearchInput = document.createElement("input");
  var nodeSearchLabel = document.createElement("label");
  var nodeSearchValue = "";

  function nodeSearchHandler(e) {
    console.log("NODE SEARCH"
      + " | KEY: " + e.keyCode
      + " | INPUT: " + nodeSearchInput.value
    );
  }

  nodeSearchLabel.setAttribute("id", "nodeSearchLabel");

  nodeSearchLabel.innerHTML = "NODE SEARCH";

  nodeSearchInput.setAttribute("class", "nodeSearch");
  nodeSearchInput.setAttribute("type", "text");
  nodeSearchInput.setAttribute("id", "nodeSearchInput");
  nodeSearchInput.setAttribute("name", "nodeSearch");
  nodeSearchInput.setAttribute("autofocus", true);
  nodeSearchInput.setAttribute("autocapitalize", "none");
  nodeSearchInput.setAttribute("value", nodeSearchValue);
  // nodeSearchInput.setAttribute("onkeydown", "if (event.keyCode === 13) { return nodeSearch(); }");
  nodeSearchInput.addEventListener("keydown", function(e){ nodeSearchHandler(e); }, false);

  // var nodeSearchDiv = document.getElementById("nodeSearchDiv");
  twitterCategoryDiv.appendChild(nodeSearchLabel);
  twitterCategoryDiv.appendChild(nodeSearchInput);

  // var inputChangedTimeout;
  // var checkInputTextInterval;

  // clearTimeout(inputChangedTimeout);
  // clearInterval(checkInputTextInterval);

  // checkInputTextInterval = setInterval(function() {
  //     if (statsObj.serverConnected && nodeSearchEnabled) {
  //         currentInput = document.getElementById("nodeSearchInput").value.toLowerCase();
  //         if (!currentInput || typeof currentInput === 'undefined') {
  //             clearTimeout(inputChangedTimeout);
  //         } else if (enterKeyDownFlag || (previousInput != currentInput)) {
  //             enterKeyDownFlag = false;
  //             clearTimeout(inputChangedTimeout);
  //             timeDelta = moment().valueOf() - previousTimestamp;
  //             // console.log("CHANGE [" + timeDelta + "]: "  + previousInput + " | " + currentInput);
  //             previousTimestamp = moment().valueOf();
  //             inputChangedTimeout = setTimeout(function() {
  //                 sendnodeSearch('PROMPT', currentInput, function(dataTransmitted) {
  //                     console.log("TXD: " + dataTransmitted);
  //                     currentInput = document.getElementById("nodeSearchInput");
  //                     currentInput.value = '';
  //                 });
  //             }, responseTimeoutInterval);
  //         }
  //         previousInput = document.getElementById("nodeSearchInput").value.toLowerCase();
  //     } else if (statsObj.serverConnected && !nodeSearchEnabled) {
  //         clearTimeout(inputChangedTimeout);
  //         currentInput = document.getElementById("nodeSearchInput");
  //         currentInput.value = '';
  //     }
  // }, 100);

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
    // document.getElementById("gravitySlider").value = (value * document.getElementById("gravitySlider").getAttribute("multiplier"));
    document.getElementById("gravitySlider").value = value;
    document.getElementById("gravitySliderText").innerHTML = value.toFixed(5);
  };

  this.setChargeSliderValue = function (value) {
    if (!document.getElementById("chargeSlider")) { return; }
    console.log("setChargeSliderValue: " + value);
    document.getElementById("chargeSlider").value = value;
    document.getElementById("chargeSliderText").innerHTML = value;
  };

  this.setMaxAgeSliderValue = function (value) {
    if (!document.getElementById("maxAgeSlider")) { return; }
    console.log("setMaxAgeSliderValue: " + value);
    document.getElementById("maxAgeSlider").value = value;
    document.getElementById("maxAgeSliderText").innerHTML = value;
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

    console.log("RX MESSAGE\n" + jsonPrint(event.data));

    // Do we trust the sender of this message?
    if (event.origin !== DEFAULT_SOURCE){
      console.error("NOT TRUSTED SOURCE"
        + " | ORIGIN: " + event.origin 
        + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
      );
      return;
    }

    // parentWindow = event.source;

    console.debug("SOURCE"
      + " | ORIGIN: " + event.origin 
      + " | PARENT WINDOW: " + parentWindow.PARENT_ID
      + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
    );

    var op = event.data.op;
    var cnf;

    switch (op) {

      case "INIT":

        cnf = event.data.config;

        console.debug("CONTROL PANEL INIT\n" + jsonPrint(cnf));

        Object.keys(cnf).forEach(function(prop){
          config[prop] = cnf[prop];
          console.info("CNF | " + prop 
            + " | " + config[prop]
          );
        });

        self.setTransitionDurationSliderValue(cnf.defaultTransitionDuration);
        self.setLinkStrengthSliderValue(cnf.defaultLinkStrength);
        self.setLinkDistanceSliderValue(cnf.defaultLinkDistance);
        self.setGravitySliderValue(cnf.defaultGravity);
        self.setChargeSliderValue(cnf.defaultCharge);
        self.setVelocityDecaySliderValue(cnf.defaultVelocityDecay);
        self.setMaxAgeSliderValue(cnf.defaultMaxAge);
        self.setFontSizeMinRatioSliderValue(cnf.defaultFontSizeMinRatio);
        self.setFontSizeMaxRatioSliderValue(cnf.defaultFontSizeMaxRatio);
      break;

      case "SET_TWITTER_USER":
        currentTwitterNode = event.data.user;
        console.debug("SET TWITTER USER\n" + jsonPrint(currentTwitterNode));
        loadTwitterFeed(currentTwitterNode, function(err, el){});
      break;

      case "SET_TWITTER_HASHTAG":
        currentTwitterNode = event.data.hashtag;
        console.debug("SET TWITTER HASHTAG\n" + jsonPrint(currentTwitterNode));
        loadTwitterFeed(currentTwitterNode, function(err, el){});
      break;
    }
  }

  window.addEventListener("message", receiveMessage, false);

  window.onbeforeunload = function() {
    parentWindow.postMessage({op:"CLOSE"}, DEFAULT_SOURCE);
  };

  function buttonHandler(e) {

    var currentButton = document.getElementById(e.target.id);

    console.warn("BUTTON"
     + " | ID: " + e.target.id
     + "\n HASH\n" + jsonPrint(controlIdHash[e.target.id])
     + "\n" + jsonPrint(e.target)
    );

    if (!currentButton){
      console.error("UNKNOWN BUTTON\n" + jsonPrint(e));
    }
    else if (controlIdHash[currentButton.id] === undefined) {
      console.error("UNKNOWN BUTTON NOT IN HASH\n" + jsonPrint(e));
    }
    else {
      var buttonConfig = controlIdHash[currentButton.id];
      console.log("BUTTON " + currentButton.id 
        + " : " + buttonConfig.mode
      );

      parentWindow.postMessage({op: buttonConfig.mode, id: currentButton.id}, DEFAULT_SOURCE);

      if (currentButton.id === "resetButton"){
        console.warn("RESET");
        self.setLinkStrengthSliderValue(parentWindow.DEFAULT_LINK_STRENGTH);
        self.setLinkDistanceSliderValue(parentWindow.DEFAULT_LINK_DISTANCE);
        self.setTransitionDurationSliderValue(parentWindow.DEFAULT_TRANSITION_DURATION);
        self.setGravitySliderValue(parentWindow.DEFAULT_GRAVITY);
        self.setChargeSliderValue(parentWindow.DEFAULT_CHARGE);
        self.setVelocityDecaySliderValue(parentWindow.DEFAULT_VELOCITY_DECAY);
        self.setMaxAgeSliderValue(parentWindow.DEFAULT_MAX_AGE);
        self.setFontSizeMinRatioSliderValue(parentWindow.DEFAULT_FONT_SIZE_MIN_RATIO);
        self.setFontSizeMaxRatioSliderValue(parentWindow.DEFAULT_FONT_SIZE_MAX_RATIO);
      }
    }
  }

  function sliderHandler(e) {

    console.log("sliderHandler: " + e.target.id);
    var currentSlider = document.getElementById(e.target.id);
    currentSlider.multiplier = currentSlider.getAttribute("multiplier");

    var valMultRatio = currentSlider.value/currentSlider.multiplier;

    console.log("SLIDER " + currentSlider.id 
      + " | " + currentSlider.value 
      + " | " + currentSlider.multiplier 
      + " | " + valMultRatio.toFixed(3)
    );

    var currentSliderTextId = currentSlider.id + "Text";

    var v;
    switch (currentSlider.id) {
      case "fontSizeMinRatioSlider":
      case "fontSizeMaxRatioSlider":
        v = 100*currentSlider.value/currentSlider.multiplier;
        document.getElementById(currentSliderTextId).innerHTML = v.toFixed(1) + " % H";
      break;
      case "gravitySlider":
        v = currentSlider.value/currentSlider.multiplier;
        document.getElementById(currentSliderTextId).innerHTML = v.toFixed(5);
      break;
      default:
        v = currentSlider.value/currentSlider.multiplier;
        document.getElementById(currentSliderTextId).innerHTML = v.toFixed(3);
    }

    parentWindow.postMessage({op:"UPDATE", id: currentSlider.id, value: (currentSlider.value/currentSlider.multiplier)}, DEFAULT_SOURCE);
  }


  window.addEventListener("input", function (e) {
    // console.log("keyup event detected! coming from this element:", e.target);
    switch (e.target.id) {
      case "nodeSearchInput":
        // nodeSearchHandler(e);
      break;
      default:
        sliderHandler(e);
    }

  }, false);



  this.tableCreateRow = function (parentTable, options, cells) {

    var tr = parentTable.insertRow();
    var tdTextColor = options.textColor;
    var tdBgColor = options.backgroundColor || "#222222";

    if (options.trClass) {
      tr.className = options.trClass;
    }

    if (options.headerFlag) {
      cells.forEach(function(content) {
        var th = tr.insertCell();
        th.appendChild(parentTable.parentNode.createTextNode(content));
        th.style.color = tdTextColor;
        th.style.backgroundColor = tdBgColor;
      });
    } else {
      cells.forEach(function(content) {

        // console.warn("tableCreateRow\n" + jsonPrint(content));

        var td = tr.insertCell();
        if (content.type === undefined) {

          td.appendChild(document.createTextNode(content));
          td.style.color = tdTextColor;
          td.style.backgroundColor = tdBgColor;

        } else if (content.type === "TEXT") {

          td.className = content.class;
          td.setAttribute("id", content.id);
          td.style.color = tdTextColor;
          td.style.backgroundColor = tdBgColor;
          td.innerHTML = content.text;

        } else if (content.type === "BUTTON") {

          var buttonElement = document.createElement("BUTTON");
          buttonElement.className = content.class;
          buttonElement.setAttribute("id", content.id);
          buttonElement.setAttribute("mode", content.mode);
          buttonElement.addEventListener("click", function(e){ buttonHandler(e); }, false);
          buttonElement.innerHTML = content.text;
          td.appendChild(buttonElement);
          controlIdHash[content.id] = content;

        } else if (content.type === "SLIDER") {

        // console.warn("tableCreateRow\n" + jsonPrint(content));

          var sliderElement = document.createElement("INPUT");
          sliderElement.type = "range";
          sliderElement.className = content.class;
          sliderElement.setAttribute("id", content.id);
          sliderElement.setAttribute("min", content.min);
          sliderElement.setAttribute("max", content.max);
          sliderElement.setAttribute("multiplier", content.multiplier);
          // sliderElement.setAttribute("oninput", function(e){ sliderHandler(e); }, false);
          sliderElement.value = content.value;
          td.appendChild(sliderElement);
          controlIdHash[content.id] = content;

        }
      });
    }
  };

  this.createControlPanel = function(callback) {

    var storedConfigName = "config_" + parentWindow.config.sessionViewType;

    console.debug("STORED CONFIG: " + storedConfigName);
    var storedConfig = store.get(storedConfigName);

    if (storedConfig !== undefined) {
      var storedConfigArgs = Object.keys(storedConfig);

      storedConfigArgs.forEach(function(arg){
        config[arg] = storedConfig[arg];
        console.log("--> STORED CONFIG | " + arg + ": " + config[arg]);
      });
    }
    // statsObj = store.get("stats");

    console.log("CREATE CONTROL PANEL\n" + jsonPrint(config));

    dashboardMain = document.getElementById("dashboardMain");
    infoTable = document.getElementById("infoTable");
    controlTable = document.getElementById("controlTable");
    controlTableHead = document.getElementById("controlTableHead");
    controlTableBody = document.getElementById("controlTableBody");
    controlSliderTable = document.getElementById("controlSliderTable");

    var optionsHead = {
      headerFlag: true,
      textColor: "#CCCCCC",
      backgroundColor: "#222222"
    };

    var optionsBody = {
      headerFlag: false,
      textColor: "#BBBBBB",
      backgroundColor: "#111111"
    };

    var resetButton = {
      type: "BUTTON",
      mode: "MOMENT",
      id: "resetButton",
      class: "button",
      text: "RESET"
    };

    var blahButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "blahToggleButton",
      class: "button",
      text: "BLAH"
    };

    var fullscreenButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "fullscreenToggleButton",
      class: "button",
      text: "FULLSCREEN"
    };

    var pauseButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "pauseToggleButton",
      class: "button",
      text: "PAUSE"
    };

    var statsButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "statsToggleButton",
      class: "button",
      text: "STATS"
    };

    var testModeButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "testModeToggleButton",
      class: "button",
      text: "TEST"
    };

    var antonymButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "antonymToggleButton",
      class: "button",
      text: "ANT"
    };

    var disableLinksButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "disableLinksToggleButton",
      class: "button",
      text: "LINKS"
    };

    var removeDeadNodeButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "removeDeadNodeToogleButton",
      class: "button",
      text: "DEAD"
    };

    var nodeCreateButton = {
      type: "BUTTON",
      mode: "MOMENT",
      id: "nodeCreateButton",
      class: "button",
      text: "NODE"
    };

    var maxAgeSlider = {
      type: "SLIDER",
      id: "maxAgeSlider",
      class: "slider",
      min: 500,
      max: 120000,
      value: config.defaultMaxAge,
      multiplier: 1.0
    };

    var maxAgeSliderText = {
      type: "TEXT",
      id: "maxAgeSliderText",
      class: "sliderText",
      text: maxAgeSlider.value + " ms"
    };

    console.log("config\n" + jsonPrint(config));

     var fontSizeMinRatioSlider = {
      type: "SLIDER",
      id: "fontSizeMinRatioSlider",
      class: "slider",
      min: 0,
      max: 100,
      value: config.defaultFontSizeMinRatio * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var fontSizeMinRatioSliderText = {
      type: "TEXT",
      id: "fontSizeMinRatioSliderText",
      class: "sliderText",
      text: fontSizeMinRatioSlider.value + fontSizeMinRatioSlider.multiplier
    };

    var fontSizeMaxRatioSlider = {
      type: "SLIDER",
      id: "fontSizeMaxRatioSlider",
      class: "slider",
      min: 0,
      max: 100,
      value: config.defaultFontSizeMaxRatio * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var fontSizeMaxRatioSliderText = {
      type: "TEXT",
      id: "fontSizeMaxRatioSliderText",
      class: "sliderText",
      text: fontSizeMaxRatioSlider.value + fontSizeMaxRatioSlider.multiplier
    };

    var transitionDurationSlider = {
      type: "SLIDER",
      id: "transitionDurationSlider",
      class: "slider",
      min: 0,
      max: 100,
      value: config.defaultTransitionDuration,
      multiplier: 1.0
    };

    var transitionDurationSliderText = {
      type: "TEXT",
      id: "transitionDurationSliderText",
      class: "sliderText",
      text: (transitionDurationSlider.value * transitionDurationSlider.multiplier)
    };

    var chargeSlider = {
      type: "SLIDER",
      id: "chargeSlider",
      class: "slider",
      min: -100,
      max: 100,
      value: config.defaultCharge,
      multiplier: 1.0
    };

    var chargeSliderText = {
      type: "TEXT",
      id: "chargeSliderText",
      class: "sliderText",
      text: (chargeSlider.value * chargeSlider.multiplier)
    };

    var gravitySlider = {
      type: "SLIDER",
      id: "gravitySlider",
      class: "slider",
      min: -10.0,
      max: 10.0,
      value: config.defaultGravity,
      // value: config.defaultGravity,
      multiplier: 10000.0
    };

    var gravitySliderText = {
      type: "TEXT",
      id: "gravitySliderText",
      class: "sliderText",
      text: (gravitySlider.value * gravitySlider.multiplier)
    };

    var velocityDecaySlider = {
      type: "SLIDER",
      id: "velocityDecaySlider",
      class: "slider",
      min: 0.0,
      max: 1000.0,
      value: config.defaultVelocityDecay * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var velocityDecaySliderText = {
      type: "TEXT",
      id: "velocityDecaySliderText",
      class: "sliderText",
      text: (velocityDecaySlider.value * velocityDecaySlider.multiplier)
    };

    var linkStrengthSlider = {
      type: "SLIDER",
      id: "linkStrengthSlider",
      class: "slider",
      min: 0.0,
      max: 1000,
      value: config.defaultLinkStrength * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var linkStrengthSliderText = {
      type: "TEXT",
      id: "linkStrengthSliderText",
      class: "sliderText",
      text: (linkStrengthSlider.value * linkStrengthSlider.multiplier)
    };

    var linkDistanceSlider = {
      type: "SLIDER",
      id: "linkDistanceSlider",
      class: "slider",
      min: 0.0,
      max: 100,
      value: config.defaultLinkDistance,
      multiplier: 1.0
    };

    var linkDistanceSliderText = {
      type: "TEXT",
      id: "linkDistanceSliderText",
      class: "sliderText",
      text: (linkDistanceSlider.value * linkDistanceSlider.multiplier)
    };

    var status = {
      type: "TEXT",
      id: "statusSessionId",
      class: "statusText",
      text: "SESSION ID: " + statsObj.socketId
    };

    var status2 = {
      type: "TEXT",
      id: "statusSession2Id",
      class: "statusText",
      text: "NODES: " + 0
    };

    switch (config.sessionViewType) {

      case "force":
      case "flow":
        self.tableCreateRow(infoTable, optionsBody, [status]);
        self.tableCreateRow(infoTable, optionsBody, [status2]);
        self.tableCreateRow(controlTable, 
          optionsBody, 
          [
            pauseButton, 
            statsButton, 
            testModeButton, 
            nodeCreateButton, 
            removeDeadNodeButton, 
            disableLinksButton,
            blahButton,
            antonymButton,
            fullscreenButton
          ]);
        self.tableCreateRow(controlTable, optionsBody, [resetButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["FONT MIN", fontSizeMinRatioSlider, fontSizeMinRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["FONT MAX", fontSizeMaxRatioSlider, fontSizeMaxRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["MAX AGE", maxAgeSlider, maxAgeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["CHARGE", chargeSlider, chargeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["GRAVITY", gravitySlider, gravitySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["VEL DECAY", velocityDecaySlider, velocityDecaySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["LINK STRENGTH", linkStrengthSlider, linkStrengthSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["LINK DISTANCE", linkDistanceSlider, linkDistanceSliderText]);
        if (callback) { callback(dashboardMain); }
        break;
      case "treepack":
        self.tableCreateRow(infoTable, optionsBody, [status]);
        self.tableCreateRow(infoTable, optionsBody, [status2]);
        self.tableCreateRow(controlTable, optionsBody, [resetButton, pauseButton, statsButton, fullscreenButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["FONT MIN", fontSizeMinRatioSlider, fontSizeMinRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["FONT MAX", fontSizeMaxRatioSlider, fontSizeMaxRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["TRANSITION", transitionDurationSlider, transitionDurationSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["MAX AGE", maxAgeSlider, maxAgeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["CHARGE", chargeSlider, chargeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["GRAVITY", gravitySlider, gravitySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["VEL DECAY", velocityDecaySlider, velocityDecaySliderText]);
        if (callback) { callback(dashboardMain); }
        break;

      case "ticker":
        self.tableCreateRow(infoTable, optionsBody, [status]);
        self.tableCreateRow(infoTable, optionsBody, [status2]);
        self.tableCreateRow(controlTable, 
          optionsBody, 
          [
            fullscreenButton, 
            pauseButton, 
            statsButton, 
            testModeButton, 
            nodeCreateButton, 
            removeDeadNodeButton, 
            disableLinksButton, 
            antonymButton
          ]
        );
        self.tableCreateRow(controlTable, optionsBody, [resetButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["MAX AGE", maxAgeSlider, maxAgeSliderText]);
        if (callback) { callback(dashboardMain); }
        break;

      case "histogram":
        self.tableCreateRow(controlTable, optionsBody, [status]);
        self.tableCreateRow(controlTable, optionsBody, [status2]);
        self.tableCreateRow(controlTable, optionsBody, 
          [
            blahButton,
            resetButton,
            fullscreenButton, 
            pauseButton, 
            statsButton, 
            removeDeadNodeButton,
            testModeButton, 
            antonymButton
          ]
        );
        // self.tableCreateRow(controlSliderTable, optionsBody, [blahButton, resetButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["MAX AGE", maxAgeSlider, maxAgeSliderText]);
        if (callback) { callback(dashboardMain); }

        break;

      default:
        self.tableCreateRow(controlTable, optionsBody, [status]);
        self.tableCreateRow(controlTable, 
          optionsBody, 
          [
            fullscreenButton, 
            pauseButton, 
            statsButton, testModeButton, resetButton, nodeCreateButton, removeDeadNodeButton]);
        if (callback) { callback(dashboardMain); }
    }
  };

  this.updateControlPanel = function (config, callback) {

    console.log("UPDATE CONTROL PANEL");

    if (controlIdHash.blahToggleButton) {
      if (config.blahMode) {
        document.getElementById("blahToggleButton").style.color = "red";
        document.getElementById("blahToggleButton").style.border = "2px solid red";
      } else {
        document.getElementById("blahToggleButton").style.color = "#888888";
        document.getElementById("blahToggleButton").style.border = "1px solid white";
      }
    }

    if (controlIdHash.antonymToggleButton) {
      if (config.antonymFlag) {
        document.getElementById("antonymToggleButton").style.color = "red";
        document.getElementById("antonymToggleButton").style.border = "2px solid red";
      } else {
        document.getElementById("antonymToggleButton").style.color = "#888888";
        document.getElementById("antonymToggleButton").style.border = "1px solid white";
      }
    }

    if (config.pauseFlag) {
      document.getElementById("pauseToggleButton").style.color = "red";
      document.getElementById("pauseToggleButton").style.border = "2px solid red";
    } else {
      document.getElementById("pauseToggleButton").style.color = "#888888";
      document.getElementById("pauseToggleButton").style.border = "1px solid white";
    }

    if (config.showStatsFlag) {
      document.getElementById("statsToggleButton").style.color = "red";
      document.getElementById("statsToggleButton").style.border = "2px solid red";
    } else {
      document.getElementById("statsToggleButton").style.color = "#888888";
      document.getElementById("statsToggleButton").style.border = "1px solid white";
    }

    if ((config.sessionViewType === "force") || (config.sessionViewType === "flow")){  
      if (config.disableLinks) {
        document.getElementById("disableLinksToggleButton").style.color = "red";
        document.getElementById("disableLinksToggleButton").style.border = "2px solid red";
      } else {
        document.getElementById("disableLinksToggleButton").style.color = "#888888";
        document.getElementById("disableLinksToggleButton").style.border = "1px solid white";
      }
    }

    if (callback) { callback(); }
  };

  $( document ).ready(function() {
    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG\n" + jsonPrint(config) );
    self.createControlPanel(function(dashboard){
      setTimeout(function() {  // KLUDGE to insure table is created before update
        self.updateControlPanel(config, function(){
          if (parentWindow !== undefined) {
            setTimeout(function(){
              console.log("TX PARENT READY " + DEFAULT_SOURCE);
              parentWindow.postMessage({op:"READY"}, DEFAULT_SOURCE);
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