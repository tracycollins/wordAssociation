import React, { useState, useEffect } from 'react';
// import ReactDOM from 'react-dom';
// import logo from './logo.png';
import socketClient from "socket.io-client";
import './App.css';
// import { client } from "./client";
// import Button from '@material-ui/core/Button';
const ENDPOINT = "http://mbp3:9997/view";

const statsObj = {};
statsObj.viewerReadyTransmitted = false;

function App() {

  const defaultStatus = {
    nodesPerMin: 0, 
    maxNodesPerMin: 0,
    bestNetworkId: "",
  }

  const defaultUser = {

    nodeId: null, 
    screenName: "",
    name: "",
    location: "",
    description: "",
    profileImage: "",
    bannerImage: "",
    createdAt: null,
    followersCount: 0,
    friendsCount: 0,
    tweets: 0,

    age: 0,
    mentions: 0,
    rate: 0,
    rateMax: 0,
    tweetsPerDay: 0,

    lastSeen: null,
    isBot: false,
    following: false,
    categoryVerfied: false,
    category: "none",
    categoryAuto: "none",
  }

  const defaultHashtag = {
    nodeId: null,
    text: null,
    categoryAuto: "none",
    category: "none",
    
    lastSeen: null,
    age: 0,
    mentions: 0,
    rate: 0,
    rateMax: 0,
  }

  const [status, setStatus] = useState(defaultStatus);
  const [currentUser, setUser] = useState(defaultUser);
  const [currentHashtag, setHashtag] = useState(defaultHashtag);

  const handleAction = (action) => {
    switch (action.type){
      case "user":
          setUser({})
        break
      case "hashtag":
          setHashtag({})
        break
      case "stats":
          setStatus({nodesPerMin: action.data.nodesPerMin, maxNodesPerMin: action.data.maxNodesPerMin})
        break
        default:
    }
  }

  useEffect(() => {
    const socket = socketClient(ENDPOINT);

    socket.on("connect", ()=>{

      console.log("CONNECTED: " + socket.id)

      socket.emit("authentication", {
        namespace: "view",
        userId: "test",
        password: "0123456789",
      });

    })

    socket.on("authenticated", function () {
      console.debug("AUTHENTICATED | " + socket.id);

      statsObj.socketId = socket.id;
      statsObj.serverConnected = true;
      statsObj.userReadyTransmitted = false;
      statsObj.userReadyAck = false;

      console.log("CONNECTED TO HOST" + " | ID: " + socket.id);

      socket.emit("TWITTER_SEARCH_NODE", "@threecee")

    });

    
    socket.on("SET_TWITTER_USER", (results) => {
      console.debug("RX SET_TWITTER_USER");
      console.debug(results);
    });

    socket.on("action", (action) => {
      console.debug("RX ACTION | " + socket.id + " | TYPE: " + action.type);
      console.debug("RX ACTION | ", action.data);
      handleAction(action)
    });

    const statsInterval = setInterval(() => {
      // socket.emit("")
    }, 1000);
    
  }, []);

  return (
    <div className="App">
      <h3>NODES PER MIN: {status.nodesPerMin} | MAX: {status.maxNodesPerMin}</h3>
      <h3>USER:    @{currentUser.screenName}</h3>
      <h3>HASHTAG: #{currentHashtag.text}</h3>
    </div>
  );
}

export default App;
