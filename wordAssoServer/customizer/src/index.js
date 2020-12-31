import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import './index.css';
import config from './config.js';
import App from './App';

// const defaultDefaults = {};
// defaultDefaults.velocityDecay = 0.5;
// defaultDefaults.nodeRadiusRatioRange = {};
// defaultDefaults.nodeRadiusRatioRange.min = 0.0;
// defaultDefaults.nodeRadiusRatioRange.max = 0.5;
// defaultDefaults.nodeRadiusRatioRange.step = 0.01;

// const defaultSettings = {};
// defaultDefaults.velocityDecay = 0.5;
// defaultSettings.nodeRadiusRatioRange = {};
// defaultSettings.nodeRadiusRatioRange.min = 0.01;
// defaultSettings.nodeRadiusRatioRange.max = 0.05;

// const defaultStatus = {};

ReactDOM.render(
  <Router>
    <div>
      <Switch>
        <Route path="/customize/settings">
          <App defaults={config.defaults} settings={config.settings} status={{}}/>
        </Route>
        <Route path="/customize/stats">
          <App defaults={config.defaults} settings={config.settings} status={{}}/>
        </Route>
        <Route >
          <App defaults={config.defaults} settings={config.settings} status={{}}/>
        </Route>
      </Switch>
    </div>
  </Router>,
  document.getElementById('root')
);