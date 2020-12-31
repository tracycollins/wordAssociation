import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import './index.css';
import App from './App';

const defaultDefaults = {};
defaultDefaults.nodeRadiusRatioRange = {};
defaultDefaults.nodeRadiusRatioRange.min = 0.0;
defaultDefaults.nodeRadiusRatioRange.max = 0.5;
defaultDefaults.nodeRadiusRatioRange.step = 0.01;

const defaultSettings = {};
defaultSettings.nodeRadiusRatioRange = {};
defaultSettings.nodeRadiusRatioRange.min = 0.01;
defaultSettings.nodeRadiusRatioRange.max = 0.05;

ReactDOM.render(
  <Router>
    <div>
      <Switch>
        <Route path="/customize/settings">
          <App defaults={defaultDefaults} settings={defaultSettings}/>
        </Route>
        <Route path="/customize/stats">
          <App defaults={defaultDefaults} settings={defaultSettings}/>
        </Route>
        <Route >
          <App defaults={defaultDefaults} settings={defaultSettings}/>
        </Route>
      </Switch>
    </div>
  </Router>,
  document.getElementById('root')
);