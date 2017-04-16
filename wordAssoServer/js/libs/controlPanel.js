/*ver 0.47*/
/*jslint node: true */

"use strict";

function ControlPanel() {

  // var DEFAULT_SOURCE = "http://localhost:9997";
  // var DEFAULT_SOURCE = "http://word.threeceelabs.com";
  var DEFAULT_SOURCE = "==SOURCE==";  // will be updated by wordAssoServer.js on app.get

  var parentWindow = window.opener;
  console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
  var self = this;

  var config = {};

  config = window.opener.config;

  // config.defaultMaxAge = window.opener.DEFAULT_MAX_AGE;
  // config.defaultCharge = window.opener.DEFAULT_CHARGE;
  // config.defaultGravity = window.opener.DEFAULT_GRAVITY;
  // config.defaultLinkStrength = window.opener.DEFAULT_LINK_STRENGTH;
  // config.defaultLinkDistance = window.opener.DEFAULT_LINK_DISTANCE;
  // config.defaultVelocityDecay = window.opener.DEFAULT_VELOCITY_DECAY;
  // config.defaultFontSizeMin = window.opener.DEFAULT_FONT_SIZE_MIN;
  // config.defaultFontSizeMax = window.opener.DEFAULT_FONT_SIZE_MAX;

console.log("config\n" + jsonPrint(config));

  var controlIdHash = {};

  var dashboardMain;
  var infoTable;
  var controlTable;
  var controlTableHead;
  var controlTableBody;
  var controlSliderTable;

  var statsObj = {};
  statsObj.socketId = 'NOT SET';

  this.setVelocityDecaySliderValue = function (value) {
    if (!document.getElementById("velocityDecaySlider")) { return; }
    console.log("setVelocityDecaySliderValue: " + value);
    document.getElementById("velocityDecaySlider").value = (value * document.getElementById("velocityDecaySlider").getAttribute("multiplier"));
    document.getElementById("velocityDecaySliderText").innerHTML = value.toFixed(3);
  }

  this.setLinkStrengthSliderValue = function (value) {
    if (!document.getElementById("linkStrengthSlider")) { return; }
    console.log("setLinkStrengthSliderValue: " + value);
    document.getElementById("linkStrengthSlider").value = (value * document.getElementById("linkStrengthSlider").getAttribute("multiplier"));
    document.getElementById("linkStrengthSliderText").innerHTML = value.toFixed(3);
  }

  this.setLinkDistanceSliderValue = function (value) {
    if (!document.getElementById("linkDistanceSlider")) { return; }
    console.log("setLinkDistanceSliderValue: " + value);
    document.getElementById("linkDistanceSlider").value = (value * document.getElementById("linkDistanceSlider").getAttribute("multiplier"));
    document.getElementById("linkDistanceSliderText").innerHTML = value.toFixed(3);
  }

  this.setGravitySliderValue = function (value) {
    if (!document.getElementById("gravitySlider")) { return; }
    console.log("setGravitySliderValue: " + value);
    document.getElementById("gravitySlider").value = (value* document.getElementById("gravitySlider").getAttribute("multiplier"));
    document.getElementById("gravitySliderText").innerHTML = value.toFixed(3);
  }

  this.setChargeSliderValue = function (value) {
    if (!document.getElementById("chargeSlider")) { return; }
    console.log("setChargeSliderValue: " + value);
    document.getElementById("chargeSlider").value = value;
    document.getElementById("chargeSliderText").innerHTML = value;
  }

  this.setMaxAgeSliderValue = function (value) {
    if (!document.getElementById("maxAgeSlider")) { return; }
    console.log("setMaxAgeSliderValue: " + value);
    document.getElementById("maxAgeSlider").value = value;
    document.getElementById("maxAgeSliderText").innerHTML = value;
  }

  this.setFontSizeMinSliderValue = function (value) {
    if (!document.getElementById("fontSizeMinSlider")) { return; }
    console.log("setFontSizeMinSliderValue: " + value);
    document.getElementById("fontSizeMinSlider").value = value;
    document.getElementById("fontSizeMinSliderText").innerHTML = value;
  }

  this.setFontSizeMaxSliderValue = function (value) {
    if (!document.getElementById("fontSizeMaxSlider")) { return; }
    console.log("setFontSizeMaxSliderValue: " + value);
    document.getElementById("fontSizeMaxSlider").value = value;
    document.getElementById("fontSizeMaxSliderText").innerHTML = value;
  }

  window.addEventListener("message", receiveMessage, false);

  window.onbeforeunload = function() {
    parentWindow.postMessage({op:'CLOSE'}, DEFAULT_SOURCE);
  }

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
    else if (typeof controlIdHash[currentButton.id] === 'undefined') {
      console.error("UNKNOWN BUTTON NOT IN HASH\n" + jsonPrint(e));
    }
    else {
      var buttonConfig = controlIdHash[currentButton.id];
      console.log("BUTTON " + currentButton.id 
        + " : " + buttonConfig.mode
      );

      parentWindow.postMessage({op: buttonConfig.mode, id: currentButton.id}, DEFAULT_SOURCE);

      if (currentButton.id == 'resetButton'){
        self.setLinkStrengthSliderValue(config.defaultLinkStrength);
        self.setLinkDistanceSliderValue(config.defaultLinkDistance);
        self.setGravitySliderValue(config.defaultGravity);
        self.setChargeSliderValue(config.defaultCharge);
        self.setVelocityDecaySliderValue(config.defaultVelocityDecay);
        self.setMaxAgeSliderValue(config.defaultMaxAge);
        self.setFontSizeMinSliderValue(config.defaultFontSizeMin);
        self.setFontSizeMaxSliderValue(config.defaultFontSizeMax);
      }
    }
  };

  window.addEventListener('input', function (e) {
    // console.log("keyup event detected! coming from this element:", e.target);
    var currentSlider = document.getElementById(e.target.id);
    currentSlider.multiplier = currentSlider.getAttribute("multiplier");

    console.log("SLIDER " + currentSlider.id 
      + " | " + currentSlider.value 
      + " | " + currentSlider.multiplier 
      + " | " + (currentSlider.value/currentSlider.multiplier).toFixed(3)
    );

    var currentSliderTextId = currentSlider.id + 'Text';

    document.getElementById(currentSliderTextId).innerHTML = (currentSlider.value/currentSlider.multiplier).toFixed(3);

    parentWindow.postMessage({op:'UPDATE', id: currentSlider.id, value: (currentSlider.value/currentSlider.multiplier)}, DEFAULT_SOURCE);
  }, false);

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

    switch (op) {

      case 'INIT':
        var cnf = event.data.config;
        console.debug("CONTROL PANEL INIT\n" + jsonPrint(cnf));
        for (var prop in cnf) {
          config[prop] = cnf[prop];
          console.info("CNF | " + prop 
            + " | " + config[prop]
          );
        }
        self.setLinkStrengthSliderValue(cnf.defaultLinkStrength);
        self.setLinkDistanceSliderValue(cnf.defaultLinkDistance);
        self.setGravitySliderValue(cnf.defaultGravity);
        self.setChargeSliderValue(cnf.defaultCharge);
        self.setVelocityDecaySliderValue(cnf.defaultVelocityDecay);
        self.setMaxAgeSliderValue(cnf.defaultMaxAge);
        self.setFontSizeMinSliderValue(cnf.defaultFontSizeMin);
        self.setFontSizeMaxSliderValue(cnf.defaultFontSizeMax);
      break;
    }
  }


  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
    }
  }

  this.tableCreateRow = function (parentTable, options, cells) {

    var tr = parentTable.insertRow();
    var tdTextColor = options.textColor;
    var tdBgColor = options.backgroundColor || '#222222';

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
        if (typeof content.type === 'undefined') {

          td.appendChild(document.createTextNode(content));
          td.style.color = tdTextColor;
          td.style.backgroundColor = tdBgColor;

        } else if (content.type == 'TEXT') {

          td.className = content.class;
          td.setAttribute('id', content.id);
          td.style.color = tdTextColor;
          td.style.backgroundColor = tdBgColor;
          td.innerHTML = content.text;

        } else if (content.type == 'BUTTON') {

          var buttonElement = document.createElement("BUTTON");
          buttonElement.className = content.class;
          buttonElement.setAttribute('id', content.id);
          buttonElement.setAttribute('mode', content.mode);
          buttonElement.addEventListener('click', function(e){ buttonHandler(e); }, false);
          buttonElement.innerHTML = content.text;
          td.appendChild(buttonElement);
          controlIdHash[content.id] = content;

        } else if (content.type == 'SLIDER') {

        console.warn("tableCreateRow\n" + jsonPrint(content));

          var sliderElement = document.createElement("INPUT");
          sliderElement.type = 'range';
          sliderElement.className = content.class;
          sliderElement.setAttribute('id', content.id);
          sliderElement.setAttribute('min', content.min);
          sliderElement.setAttribute('max', content.max);
          sliderElement.setAttribute('multiplier', content.multiplier);
          sliderElement.setAttribute('oninput', content.oninput);
          sliderElement.value = content.value;
          td.appendChild(sliderElement);
          controlIdHash[content.id] = content;

        }
      });
    }
  }

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
    // statsObj = store.get('stats');

    console.log("CREATE CONTROL PANEL\n" + jsonPrint(config));

    dashboardMain = document.getElementById('dashboardMain');
    infoTable = document.getElementById('infoTable');
    controlTable = document.getElementById('controlTable');
    controlTableHead = document.getElementById('controlTableHead');
    controlTableBody = document.getElementById('controlTableBody');
    controlSliderTable = document.getElementById('controlSliderTable');

    var optionsHead = {
      headerFlag: true,
      textColor: '#CCCCCC',
      backgroundColor: '#222222'
    };

    var optionsBody = {
      headerFlag: false,
      textColor: '#BBBBBB',
      backgroundColor: '#111111'
    };

    var resetButton = {
      type: 'BUTTON',
      mode: 'MOMENT',
      id: 'resetButton',
      class: 'button',
      text: 'RESET'
    }

    var blahButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'blahToggleButton',
      class: 'button',
      text: 'BLAH'
    }

    var fullscreenButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'fullscreenToggleButton',
      class: 'button',
      text: 'FULLSCREEN'
    }

    var pauseButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'pauseToggleButton',
      class: 'button',
      text: 'PAUSE'
    }

    var statsButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'statsToggleButton',
      class: 'button',
      text: 'STATS'
    }

    var testModeButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'testModeToggleButton',
      class: 'button',
      text: 'TEST'
    }

    var antonymButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'antonymToggleButton',
      class: 'button',
      text: 'ANT'
    }

    var disableLinksButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'disableLinksToggleButton',
      class: 'button',
      text: 'LINKS'
    }

    var removeDeadNodeButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'removeDeadNodeToogleButton',
      class: 'button',
      text: 'DEAD'
    }

    var nodeCreateButton = {
      type: 'BUTTON',
      mode: 'MOMENT',
      id: 'nodeCreateButton',
      class: 'button',
      text: 'NODE'
    }

    var maxAgeSlider = {
      type: 'SLIDER',
      id: 'maxAgeSlider',
      class: 'slider',
      min: 500,
      max: 120000,
      value: config.defaultMaxAge,
      multiplier: 1.0
    }

    var maxAgeSliderText = {
      type: 'TEXT',
      id: 'maxAgeSliderText',
      class: 'sliderText',
      text: maxAgeSlider.value + ' ms'
    }

console.log("config\n" + jsonPrint(config));

    var fontSizeMinSlider = {
      type: 'SLIDER',
      id: 'fontSizeMinSlider',
      class: 'slider',
      min: 0,
      max: 50,
      value: config.defaultFontSizeMin,
      // value: 47,
      multiplier: 1.0
    }

    var fontSizeMinSliderText = {
      type: 'TEXT',
      id: 'fontSizeMinSliderText',
      class: 'sliderText',
      text: fontSizeMinSlider.value + ' px'
    }

    var fontSizeMaxSlider = {
      type: 'SLIDER',
      id: 'fontSizeMaxSlider',
      class: 'slider',
      min: 0,
      max: 100,
      value: config.defaultFontSizeMax,
      multiplier: 1.0
    }

    var fontSizeMaxSliderText = {
      type: 'TEXT',
      id: 'fontSizeMaxSliderText',
      class: 'sliderText',
      text: fontSizeMaxSlider.value + ' px'
    }

    var transitionDurationSlider = {
      type: 'SLIDER',
      id: 'transitionDurationSlider',
      class: 'slider',
      min: 0,
      max: 1000,
      value: config.defaultTransitionDuration,
      multiplier: 1.0
    }

    var transitionDurationSliderText = {
      type: 'TEXT',
      id: 'transitionDurationSliderText',
      class: 'sliderText',
      text: (transitionDurationSlider.value * transitionDurationSlider.multiplier)
    }

    var chargeSlider = {
      type: 'SLIDER',
      id: 'chargeSlider',
      class: 'slider',
      min: -500,
      max: 500,
      value: config.defaultCharge,
      multiplier: 1.0
    }

    var chargeSliderText = {
      type: 'TEXT',
      id: 'chargeSliderText',
      class: 'sliderText',
      text: (chargeSlider.value * chargeSlider.multiplier)
    }

    var gravitySlider = {
      type: 'SLIDER',
      id: 'gravitySlider',
      class: 'slider',
      min: -10.0,
      max: 10,
      // value: (config.defaultGravity * config.defaultMultiplier),
      value: config.defaultGravity * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    }

    var gravitySliderText = {
      type: 'TEXT',
      id: 'gravitySliderText',
      class: 'sliderText',
      text: (gravitySlider.value * gravitySlider.multiplier)
    }

    var velocityDecaySlider = {
      type: 'SLIDER',
      id: 'velocityDecaySlider',
      class: 'slider',
      min: 0.0,
      max: 1000.0,
      value: config.defaultVelocityDecay * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    }

    var velocityDecaySliderText = {
      type: 'TEXT',
      id: 'velocityDecaySliderText',
      class: 'sliderText',
      text: (velocityDecaySlider.value * velocityDecaySlider.multiplier)
    }

    var linkStrengthSlider = {
      type: 'SLIDER',
      id: 'linkStrengthSlider',
      class: 'slider',
      min: 0.0,
      max: 1000,
      value: config.defaultLinkStrength * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    }

    var linkStrengthSliderText = {
      type: 'TEXT',
      id: 'linkStrengthSliderText',
      class: 'sliderText',
      text: (linkStrengthSlider.value * linkStrengthSlider.multiplier)
    }

    var linkDistanceSlider = {
      type: 'SLIDER',
      id: 'linkDistanceSlider',
      class: 'slider',
      min: 0.0,
      max: 100,
      value: config.defaultLinkDistance,
      multiplier: 1.0
    }

    var linkDistanceSliderText = {
      type: 'TEXT',
      id: 'linkDistanceSliderText',
      class: 'sliderText',
      text: (linkDistanceSlider.value * linkDistanceSlider.multiplier)
    }

    var status = {
      type: 'TEXT',
      id: 'statusSessionId',
      class: 'statusText',
      text: 'SESSION ID: ' + statsObj.socketId
    }

    var status2 = {
      type: 'TEXT',
      id: 'statusSession2Id',
      class: 'statusText',
      text: 'NODES: ' + 0
    }

    switch (config.sessionViewType) {

      case 'force':
      case 'flow':
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
        self.tableCreateRow(controlSliderTable, optionsBody, ['FONT MIN', fontSizeMinSlider, fontSizeMinSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['FONT MAX', fontSizeMaxSlider, fontSizeMaxSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['MAX AGE', maxAgeSlider, maxAgeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['CHARGE', chargeSlider, chargeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['GRAVITY', gravitySlider, gravitySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['VEL DECAY', velocityDecaySlider, velocityDecaySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['LINK STRENGTH', linkStrengthSlider, linkStrengthSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['LINK DISTANCE', linkDistanceSlider, linkDistanceSliderText]);
        if (callback) callback(dashboardMain);
        break;

      case 'treepack':
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
        self.tableCreateRow(controlSliderTable, optionsBody, ['FONT MIN', fontSizeMinSlider, fontSizeMinSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['FONT MAX', fontSizeMaxSlider, fontSizeMaxSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['TRANSITION', transitionDurationSlider, transitionDurationSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['MAX AGE', maxAgeSlider, maxAgeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['CHARGE', chargeSlider, chargeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['GRAVITY', gravitySlider, gravitySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['VEL DECAY', velocityDecaySlider, velocityDecaySliderText]);
        // self.tableCreateRow(controlSliderTable, optionsBody, ['LINK STRENGTH', linkStrengthSlider, linkStrengthSliderText]);
        // self.tableCreateRow(controlSliderTable, optionsBody, ['LINK DISTANCE', linkDistanceSlider, linkDistanceSliderText]);
        if (callback) callback(dashboardMain);
        break;

      case 'ticker':
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
        self.tableCreateRow(controlSliderTable, optionsBody, ['MAX AGE', maxAgeSlider, maxAgeSliderText]);
        if (callback) callback(dashboardMain);
        break;

      case 'histogram':
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
        self.tableCreateRow(controlSliderTable, optionsBody, ['MAX AGE', maxAgeSlider, maxAgeSliderText]);
        if (callback) callback(dashboardMain);

        break;

      default:
        self.tableCreateRow(controlTable, optionsBody, [status]);
        self.tableCreateRow(controlTable, 
          optionsBody, 
          [
            fullscreenButton, 
            pauseButton, 
            statsButton, testModeButton, resetButton, nodeCreateButton, removeDeadNodeButton]);
        if (callback) callback(dashboardMain);
        break;
    }

    // self.updateControlPanel(config);
    // if (callback) callback(dashboardMain);
  }

  this.updateControlPanel = function (config, callback) {

    console.log("UPDATE CONTROL PANEL");

    if (config.blahMode) {
      document.getElementById("blahToggleButton").style.color = "red";
      document.getElementById("blahToggleButton").style.border = "2px solid red";
    } else {
      document.getElementById("blahToggleButton").style.color = "#888888";
      document.getElementById("blahToggleButton").style.border = "1px solid white";
    }
    if (config.antonymFlag) {
      document.getElementById("antonymToggleButton").style.color = "red";
      document.getElementById("antonymToggleButton").style.border = "2px solid red";
    } else {
      document.getElementById("antonymToggleButton").style.color = "#888888";
      document.getElementById("antonymToggleButton").style.border = "1px solid white";
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
    if (config.testModeEnabled) {
      document.getElementById("testModeToggleButton").style.color = "red";
      document.getElementById("testModeToggleButton").style.border = "2px solid red";
    } else {
      document.getElementById("testModeToggleButton").style.color = "#888888";
      document.getElementById("testModeToggleButton").style.border = "1px solid white";
    }
    if (config.removeDeadNodesFlag) {
      document.getElementById("removeDeadNodeToogleButton").style.color = "red";
      document.getElementById("removeDeadNodeToogleButton").style.border = "2px solid red";
    } else {
      document.getElementById("removeDeadNodeToogleButton").style.color = "#888888";
      document.getElementById("removeDeadNodeToogleButton").style.border = "1px solid white";
    }
    if ((config.sessionViewType == 'force') || (config.sessionViewType == 'flow')){  
      if (config.disableLinks) {
        document.getElementById("disableLinksToggleButton").style.color = "red";
        document.getElementById("disableLinksToggleButton").style.border = "2px solid red";
      } else {
        document.getElementById("disableLinksToggleButton").style.color = "#888888";
        document.getElementById("disableLinksToggleButton").style.border = "1px solid white";
      }
    }

    if (callback) callback();
  }

  $( document ).ready(function() {
    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG\n" + jsonPrint(config) );
    self.createControlPanel(function(dashboard){
      setTimeout(function() {  // KLUDGE to insure table is created before update
        self.updateControlPanel(config, function(){
          if (typeof parentWindow !== 'undefined') {
            setTimeout(function(){
              console.log("TX PARENT READY " + DEFAULT_SOURCE);
              parentWindow.postMessage({op:'READY'}, DEFAULT_SOURCE);
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