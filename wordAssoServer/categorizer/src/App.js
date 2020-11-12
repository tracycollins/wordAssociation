import React, { useState, useLayoutEffect, useEffect } from 'react';
import socketClient from "socket.io-client";
import './App.css';
import User from './User.js';

import Button from '@material-ui/core/Button';


// const ENDPOINT = "http://mbp3:9997/view";
const ENDPOINT = "https://word.threeceelabs.com/view";

const statsObj = {};
statsObj.viewerReadyTransmitted = false;

const socket = socketClient(ENDPOINT);

const App = () => {

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
    profileImageUrl: "https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",
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
          setUser({
            ...currentUser,
            ...action.data,
          })
          console.log("USER: @" + currentUser.screenName + " | " + currentUser.profileImageUrl)
        break
      case "hashtag":
          setHashtag({})
        break
      case "stats":
          setStatus({nodesPerMin: currentUser.nodesPerMin, maxNodesPerMin: currentUser.maxNodesPerMin})
        break
        default:
    }
  }

  const handleSearchUser = (searchString) => {
    const searchTerm = "@" + searchString
    socket.emit("TWITTER_SEARCH_NODE", searchTerm)
  }

  const handleUserChange = (event) => {
    event.persist()
    console.log("handleChange: " + event.target.name)

    switch (event.target.name){
      case "category":
        console.log("handleChange: " + event.target.name + " | " + event.target.value + " | " + event.target.checked)
        socket.emit("TWITTER_CATEGORIZE_NODE", {
          category: event.target.value,
          following: true,
          node: currentUser,
        });
        break
      case "isBot":
      case "following":
      case "catVerified":
        console.log("handleChange: " + event.target.name + " | " + event.target.checked)
        if (event.target.checked){
          socket.emit("TWITTER_CATEGORY_VERIFIED", currentUser);
        }
        else{
          socket.emit("TWITTER_CATEGORY_UNVERIFIED", currentUser);
        }
        break
      case "ignored":
        console.log("handleChange: " + event.target.name + " | " + event.target.checked)
        break
    }
  }
  
  useLayoutEffect(() => {
      socket.on("SET_TWITTER_USER", (results) => {
      console.debug("RX SET_TWITTER_USER");
      console.debug(results);
      handleAction({type: "user", data: results.node})
    });
}, [])

  useEffect(() => {
    socket.on("connect", ()=>{
      console.log("CONNECTED: " + socket.id)
      socket.emit("authentication", {
        namespace: "view",
        userId: "test",
        password: "0123456789",
      });
    }, [])

    socket.on("authenticated", function () {
      console.debug("AUTHENTICATED | " + socket.id);

      statsObj.socketId = socket.id;
      statsObj.serverConnected = true;
      statsObj.userReadyTransmitted = false;
      statsObj.userReadyAck = false;

      console.log("CONNECTED TO HOST" + " | ID: " + socket.id);
      socket.emit("TWITTER_SEARCH_NODE", "@threecee")
    });

    socket.on("action", (action) => {
      console.debug("RX ACTION | " + socket.id + " | TYPE: " + action.type);
      console.debug("RX ACTION | ", action.data);
      handleAction(action)
    });    
  
    return () => socket.disconnect();
  }, []);

  return (
    <User user={currentUser} handleChange={handleUserChange} handleSearchUser={handleSearchUser}/>
  );
}

export default App;
