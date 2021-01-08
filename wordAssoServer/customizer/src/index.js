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

ReactDOM.render(
  <Router>
    <div>
      <Switch>
        <Route path="/customize/settings">
          <App defaults={config.defaults} settings={config.settings} status={{}} heartbeat={{}}/>
        </Route>
        <Route path="/customize/stats">
          <App defaults={config.defaults} settings={config.settings} status={{}} heartbeat={{}}/>
        </Route>
        <Route >
          <App defaults={config.defaults} settings={config.settings} status={{}} heartbeat={{}}/>
        </Route>
      </Switch>
    </div>
  </Router>,
  document.getElementById('root')
);