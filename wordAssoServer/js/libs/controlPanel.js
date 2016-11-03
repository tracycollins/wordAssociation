/*ver 0.47*/
/*jslint node: true */

"use strict";

function ControlPanel() {

  var DEFAULT_SOURCE = "http://localhost:9997";
  // var DEFAULT_SOURCE = "http://word.threeceelabs.com";

  var parentWindow;
  var self = this;

  var config = {};

  config.defaultMultiplier = 1000.0;

  config.defaultCharge = window.opener.DEFAULT_CHARGE;
  config.defaultGravity = window.opener.DEFAULT_GRAVITY;
  config.defaultLinkStrength = window.opener.DEFAULT_LINK_STRENGTH;
  config.defaultVelocityDecay = window.opener.DEFAULT_VELOCITY_DECAY;

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
    console.log("setVelocityDecaySliderValue: " + value);
    document.getElementById("velocityDecaySlider").value = (value * document.getElementById("velocityDecaySlider").getAttribute("multiplier"));
    document.getElementById("velocityDecaySliderText").innerHTML = value.toFixed(3);
  }

  this.setLinkStrengthSliderValue = function (value) {
    console.log("setLinkStrengthSliderValue: " + value);
    document.getElementById("linkStrengthSlider").value = (value * document.getElementById("linkStrengthSlider").getAttribute("multiplier"));
    document.getElementById("linkStrengthSliderText").innerHTML = value.toFixed(3);
  }

  this.setGravitySliderValue = function (value) {
    console.log("setGravitySliderValue: " + value);
    document.getElementById("gravitySlider").value = (value* document.getElementById("gravitySlider").getAttribute("multiplier"));
    document.getElementById("gravitySliderText").innerHTML = value.toFixed(3);
  }

  this.setChargeSliderValue = function (value) {
    console.log("setChargeSliderValue: " + value);
    document.getElementById("chargeSlider").value = value;
    document.getElementById("chargeSliderText").innerHTML = value;
  }

  this.setMaxAgeSliderValue = function (value) {
    console.log("setMaxAgeSliderValue: " + value);
    document.getElementById("maxAgeSlider").value = value;
    document.getElementById("maxAgeSliderText").innerHTML = value;
  }



  $( document ).ready(function() {
    console.log( "CONTROL PANEL READY" );
    console.log( "CONTROL PANEL CONFIG\n" + jsonPrint(config) );
    self.createControlPanel(function(dashboard){
      // parentWindow.postMessage({op:'READY'}, DEFAULT_SOURCE);
    });
    // lsbridge.send('controlPanel', {op: 'READY'});
  });

  window.onbeforeunload = function() {
    // lsbridge.send('controlPanel', {op:'CLOSE'});
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
      // lsbridge.send('controlPanel', {op: buttonConfig.mode, id: currentButton.id});
      parentWindow.postMessage({op: buttonConfig.mode, id: currentButton.id}, DEFAULT_SOURCE);

      if (currentButton.id == 'resetButton'){
        self.setLinkStrengthSliderValue(config.defaultLinkStrength);
        self.setGravitySliderValue(config.defaultGravity);
        self.setChargeSliderValue(config.defaultCharge);
        self.setVelocityDecaySliderValue(config.defaultVelocityDecay);
        self.setMaxAgeSliderValue(config.defaultMaxAge);
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

    console.log("receiveMessage " + event.source);

    // Do we trust the sender of this message?
    if (event.origin !== DEFAULT_SOURCE)
      return;

    parentWindow = event.source;

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
        self.setGravitySliderValue(cnf.defaultGravity);
        self.setChargeSliderValue(cnf.defaultCharge);
        self.setVelocityDecaySliderValue(cnf.defaultVelocityDecay);
        self.setMaxAgeSliderValue(cnf.defaultMaxAge);

      break;
    }

    // event.source is window.opener
    // event.data "

  }


  window.addEventListener("message", receiveMessage, false);

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

    config = store.get('config');
    statsObj = store.get('stats');

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
      // onclick: 'buttonHandler()',
      text: 'RESET'
    }

    var fullscreenButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'fullscreenToggleButton',
      class: 'button',
      // onclick: 'buttonHandler()',
      text: 'FULLSCREEN'
    }

    var pauseButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'pauseToggleButton',
      class: 'button',
      // onclick: 'buttonHandler()',
      text: 'PAUSE'
    }

    var statsButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'statsToggleButton',
      class: 'button',
      // onclick: 'buttonHandler()',
      text: 'STATS'
    }

    var testModeButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'testModeToggleButton',
      class: 'button',
      // onclick: 'buttonHandler()',
      text: 'TEST'
    }

    var antonymButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'antonymToggleButton',
      class: 'button',
      // onclick: 'buttonHandler()',
      text: 'ANT'
    }

    var disableLinksButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'disableLinksToggleButton',
      class: 'button',
      // onclick: 'buttonHandler()',
      text: 'LINKS'
    }

    var removeDeadNodeButton = {
      type: 'BUTTON',
      mode: 'TOGGLE',
      id: 'removeDeadNodeToogleButton',
      class: 'button',
      // onclick: 'buttonHandler()',
      text: 'DEAD'
    }

    var nodeCreateButton = {
      type: 'BUTTON',
      mode: 'MOMENT',
      id: 'nodeCreateButton',
      class: 'button',
      // onclick: 'buttonHandler()',
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

    var chargeSlider = {
      type: 'SLIDER',
      id: 'chargeSlider',
      class: 'slider',
      min: -1000,
      max: 10,
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
      min: 0.0,
      max: 1000,
      // value: (config.defaultGravity * config.defaultMultiplier),
      value: config.defaultGravity * config.defaultMultiplier,
      multiplier: 1000
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
        self.tableCreateRow(controlTable, optionsBody, [fullscreenButton, pauseButton, statsButton, testModeButton, nodeCreateButton, removeDeadNodeButton, disableLinksButton, antonymButton]);
        self.tableCreateRow(controlTable, optionsBody, [resetButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['MAX AGE', maxAgeSlider, maxAgeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['CHARGE', chargeSlider, chargeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['GRAVITY', gravitySlider, gravitySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['VEL DECAY', velocityDecaySlider, velocityDecaySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['LINK STRENGTH', linkStrengthSlider, linkStrengthSliderText]);
        break;

      case 'ticker':
        self.tableCreateRow(infoTable, optionsBody, [status]);
        self.tableCreateRow(infoTable, optionsBody, [status2]);
        self.tableCreateRow(controlTable, optionsBody, [fullscreenButton, pauseButton, statsButton, testModeButton, nodeCreateButton, removeDeadNodeButton, disableLinksButton, antonymButton]);
        self.tableCreateRow(controlTable, optionsBody, [resetButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['MAX AGE', maxAgeSlider, maxAgeSliderText]);
        break;

      case 'histogram':
        self.tableCreateRow(controlTable, optionsBody, [status]);
        self.tableCreateRow(controlTable, optionsBody, [status2]);
        self.tableCreateRow(controlTable, 
          optionsBody, 
          [
            fullscreenButton, 
            pauseButton, 
            statsButton, testModeButton, resetButton, nodeCreateButton, removeDeadNodeButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, [resetButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ['MAX AGE', maxAgeSlider]);

        break;

      default:
        self.tableCreateRow(controlTable, optionsBody, [status]);
        self.tableCreateRow(controlTable, 
          optionsBody, 
          [
            fullscreenButton, 
            pauseButton, 
            statsButton, testModeButton, resetButton, nodeCreateButton, removeDeadNodeButton]);
        break;
    }

    self.updateControlPanel(config);

    if (callback) callback(dashboardMain);
  }

  this.updateControlPanel = function (config) {

    console.log("UPDATE CONTROL PANEL");

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
  }

}