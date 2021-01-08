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

// <Typography className={classes.range} id="bestNetwork" name="bestNetwork" gutterBottom>
//     {`BEST NN: ${props.heartbeat.bestNetwork.networkId} | IN ID: ${props.heartbeat.bestNetwork.inputsId} | SR: ${props.heartbeat.bestNetwork.successRate}%`}
//   </Typography>
//   <Typography className={classes.range} id="nodesPerMin" name="nodesPerMin" gutterBottom>
//     {`TWITTER | ${props.heartbeat.twitter.tweetsPerMin} TPM | ${props.heartbeat.twitter.tweetsReceived} RCVD | ${props.heartbeat.twitter.maxTweetsPerMin} MAX TPM`}
//   </Typography>
//   <Typography className={classes.range} id="nodesPerMin" name="nodesPerMin" gutterBottom>
//     {`NODE RATE: ${props.heartbeat.nodesPerMin} | ${props.heartbeat.maxNodesPerMin} MAX`}
//   </Typography>

const defaultHeartbeat = {
  nodesPerMin: 0,
  maxNodesPerMin: 0,
  maxNodesPerMinTime: 1610097731559,
  bestNetwork: {
    networkId: "",
    inputsId: "",
    successRate: 0,
    overallMatchRate: 0,
    networkTechnology: "",
    numInputs: 0,
    runtimeMatchRate: 0,
    betterChild: false,
    seedNetworkId: "",
    seedNetworkRes: 0,
  },
  twitter: {
    tweetsPerMin: 0,
    maxTweetsPerMin: 1,
    tweetsReceived: 0,
    maxTweetsPerMinTime: 1610098221597
  }
}

ReactDOM.render(
  <Router>
    <div>
      <Switch>
        <Route path="/customize/settings">
          <App defaults={config.defaults} settings={config.settings} status={{}} heartbeat={defaultHeartbeat}/>
        </Route>
        <Route path="/customize/stats">
          <App defaults={config.defaults} settings={config.settings} status={{}} heartbeat={defaultHeartbeat}/>
        </Route>
        <Route >
          <App defaults={config.defaults} settings={config.settings} status={{}} heartbeat={defaultHeartbeat}/>
        </Route>
      </Switch>
    </div>
  </Router>,
  document.getElementById('root')
);