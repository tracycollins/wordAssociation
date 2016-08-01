/*ver 0.47*/
/*jslint node: true */

"use strict";

function ControlPanel() {

  var self = this;

  var config = {};

  var dashboardMain;
  var infoTable;
  var controlTable;
  var controlTableHead;
  var controlTableBody;
  var controlSliderTable;

  var statsObj = {};
  statsObj.socketId = 'NOT SET';


  $( document ).ready(function() {
    console.log( "ready!" );
    self.createControlPanel();
    lsbridge.send('controlPanel', { message: 'HEY' });
  });

  window.addEventListener('input', function (e) {
    // console.log("keyup event detected! coming from this element:", e.target);
    // controlPanel.document.getElementById(e.target.id);
    var currentSlider = document.getElementById(e.target.id);
    console.log("SLIDER " + currentSlider.id + " : " + currentSlider.value);
    var currentSliderTextId = currentSlider.id + 'Text';
    document.getElementById(currentSliderTextId).innerHTML = currentSlider.value;

    lsbridge.send('controlPanel', {id: currentSlider.id, value: currentSlider.value});
  }, false);

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
    }
  }

  // function sliderUpdate (sliderId, value){
  //   console.log("sliderUpdate " + sliderId + " " + value);
  //   controlPanel.document.getElementById(sliderId).value = value * 1000;
  //   currentSessionView.updateParam('linkStrength', value);
  // }

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
          // var td2 = td.insertCell();
          td.appendChild(document.createTextNode(content));
          td.style.color = tdTextColor;
          td.style.backgroundColor = tdBgColor;
        } else if (content.type == 'TEXT') {
          // console.warn("tableCreateRow\n" + content);
          // var td2 = td.insertCell();
          td.className = content.class;
          td.setAttribute('id', content.id);
          // td.appendChild(document.createTextNode(content.text));
          td.style.color = tdTextColor;
          td.style.backgroundColor = tdBgColor;
          td.innerHTML = content.text;
        } else if (content.type == 'BUTTON') {
          var buttonElement = document.createElement("BUTTON");
          buttonElement.className = content.class;
          buttonElement.setAttribute('id', content.id);
          buttonElement.setAttribute('onclick', content.onclick);
          buttonElement.innerHTML = content.text;
          td.appendChild(buttonElement);
        } else if (content.type == 'SLIDER') {
          var sliderElement = document.createElement("INPUT");
          sliderElement.type = 'range';
          sliderElement.className = content.class;
          sliderElement.setAttribute('id', content.id);
          sliderElement.setAttribute('min', content.min);
          sliderElement.setAttribute('max', content.max);
          sliderElement.setAttribute('oninput', content.oninput);
          sliderElement.value = content.value;
          td.appendChild(sliderElement);
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

    var fullscreenButton = {
      type: 'BUTTON',
      id: 'fullscreenToggleButton',
      class: 'button',
      onclick: 'toggleFullScreen()',
      text: 'FULLSCREEN'
    }

    var pauseButton = {
      type: 'BUTTON',
      id: 'pauseToggleButton',
      class: 'button',
      onclick: 'togglePause()',
      text: 'PAUSE'
    }

    var statsButton = {
      type: 'BUTTON',
      id: 'statsToggleButton',
      class: 'button',
      onclick: 'toggleStats()',
      text: 'STATS'
    }

    var testModeButton = {
      type: 'BUTTON',
      id: 'testModeButton',
      class: 'button',
      onclick: 'toggleTestMode()',
      text: 'TEST'
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

    var antonymButton = {
      type: 'BUTTON',
      id: 'antonymButton',
      class: 'button',
      onclick: 'toggleAntonym()',
      text: 'ANT'
    }

    var resetButton = {
      type: 'BUTTON',
      id: 'resetButton',
      class: 'button',
      onclick: 'reset()',
      text: 'RESET'
    }

    var disableLinksButton = {
      type: 'BUTTON',
      id: 'disableLinksButton',
      class: 'button',
      onclick: 'toggleDisableLinks()',
      text: 'LINKS'
    }

    var removeDeadNodeButton = {
      type: 'BUTTON',
      id: 'removeDeadNodeButton',
      class: 'button',
      onclick: 'toggleRemoveDeadNode()',
      text: 'DEAD'
    }

    var nodeCreateButton = {
      type: 'BUTTON',
      id: 'nodeCreateButton',
      class: 'button',
      onclick: 'currentSessionView.addRandomNode()',
      text: 'NODE'
    }

    var maxAgeSlider = {
      type: 'SLIDER',
      id: 'maxAgeSlider',
      class: 'slider',
      min: 500,
      max: 120000,
      // value: config.defaultMaxAge,
      value: 60000,
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
      value: -30,
    }

    var chargeSliderText = {
      type: 'TEXT',
      id: 'chargeSliderText',
      class: 'sliderText',
      text: chargeSlider.value
    }

    var gravitySlider = {
      type: 'SLIDER',
      id: 'gravitySlider',
      class: 'slider',
      min: 0,
      max: 1000,
      value: 100,
    }

    var gravitySliderText = {
      type: 'TEXT',
      id: 'gravitySliderText',
      class: 'sliderText',
      text: gravitySlider.value
    }

    var velocityDecaySlider = {
      type: 'SLIDER',
      id: 'velocityDecaySlider',
      class: 'slider',
      min: 0,
      max: 1000,
      value: 300,
    }

    var velocityDecaySliderText = {
      type: 'TEXT',
      id: 'velocityDecaySliderText',
      class: 'sliderText',
      text: velocityDecaySlider.value
    }

    var linkStrengthSlider = {
      type: 'SLIDER',
      id: 'linkStrengthSlider',
      class: 'slider',
      min: -100,
      max: 1000,
      value: 747,
    }

    var linkStrengthSliderText = {
      type: 'TEXT',
      id: 'linkStrengthSliderText',
      class: 'sliderText',
      text: linkStrengthSlider.value
    }


    switch (config.sessionViewType) {

      case 'force':
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
        self.tableCreateRow(controlTable, optionsBody, [status]);
        self.tableCreateRow(controlTable, optionsBody, [status2]);
        self.tableCreateRow(controlTable, optionsBody, [fullscreenButton, pauseButton, statsButton, testModeButton, nodeCreateButton, removeDeadNodeButton, disableLinksButton, antonymButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, [resetButton]);
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

    if (callback) callback(dashboardMain);
  }

  this.updateControlPanel = function (config) {

    console.log("UPDATE CONTROL PANEL");

    if (config.antonymFlag) {
      document.getElementById("antonymButton").style.color = "red";
      document.getElementById("antonymButton").style.border = "2px solid red";
    } else {
      document.getElementById("antonymButton").style.color = "#888888";
      document.getElementById("antonymButton").style.border = "1px solid white";
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
      document.getElementById("testModeButton").style.color = "red";
      document.getElementById("testModeButton").style.border = "2px solid red";
    } else {
      document.getElementById("testModeButton").style.color = "#888888";
      document.getElementById("testModeButton").style.border = "1px solid white";
    }
    if (config.removeDeadNodes) {
      document.getElementById("removeDeadNodeButton").style.color = "red";
      document.getElementById("removeDeadNodeButton").style.border = "2px solid red";
    } else {
      document.getElementById("removeDeadNodeButton").style.color = "#888888";
      document.getElementById("removeDeadNodeButton").style.border = "1px solid white";
    }
    if (config.sessionViewType == 'force'){  
      if (config.disableLinks) {
        document.getElementById("disableLinksButton").style.color = "red";
        document.getElementById("disableLinksButton").style.border = "2px solid red";
      } else {
        document.getElementById("disableLinksButton").style.color = "#888888";
        document.getElementById("disableLinksButton").style.border = "1px solid white";
      }
    }
  }

}