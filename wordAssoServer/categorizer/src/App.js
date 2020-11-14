import React, { useState, useEffect, useCallback } from 'react';
import socketClient from "socket.io-client";
import './App.css';
import User from './User.js';

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
    user: {
      uncategorized: {
        left: 0,
        neutral: 0,
        right: 0,
        all: 0,
        mismatched: 0
      }
    }
  }

  const defaultUser = {

    nodeId: null, 
    screenName: "threecee",
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

  const handleAction = useCallback((action) => {
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
          console.log("HT: #" + currentHashtag.text)
        break
      case "stats":
          setStatus({
            ...action.data,
          })
        break
        default:
    }
  }, [currentHashtag.text, currentUser])
  
  const handleSearchUser = (searchString) => {
    const searchTerm = "@" + searchString
    socket.emit("TWITTER_SEARCH_NODE", searchTerm)
  }

  const handleUserChange = (event) => {
    event.persist()
    console.log("handleChange: name: " + event.currentTarget.name + " | value: " + event.currentTarget.value)

    let searchFilter = "@?";

    switch (event.currentTarget.name){
      case "all":
      case "left":
      case "neutral":
      case "right":
        searchFilter += event.currentTarget.name
        socket.emit("TWITTER_SEARCH_NODE", searchFilter);
        break
      case "mismatch":
        socket.emit("TWITTER_SEARCH_NODE", "@?mm");
        break
      case "category":
        console.log("handleChange: " + event.currentTarget.name + " | " + event.currentTarget.value + " | " + event.currentTarget.checked)
        socket.emit("TWITTER_CATEGORIZE_NODE", {
          category: event.currentTarget.value,
          following: true,
          node: currentUser,
        });
        break
      case "isBot":
        console.log("handleChange: " + event.currentTarget.name + " | " + event.currentTarget.checked)
        if (event.currentTarget.checked){
          socket.emit("TWITTER_BOT", currentUser);
        }
        else{
          socket.emit("TWITTER_UNBOT", currentUser);
        }
        break
      case "following":
        console.log("handleChange: " + event.currentTarget.name + " | " + event.currentTarget.checked)
        if (event.currentTarget.checked){
          socket.emit("TWITTER_FOLLOW", currentUser);
        }
        else{
          socket.emit("TWITTER_UNFOLLOW", currentUser);
        }
        break
      case "catVerified":
        console.log("handleChange: " + event.currentTarget.name + " | " + event.currentTarget.checked)
        if (event.currentTarget.checked){
          socket.emit("TWITTER_CATEGORY_VERIFIED", currentUser);
        }
        else{
          socket.emit("TWITTER_CATEGORY_UNVERIFIED", currentUser);
        }
        break
      case "ignored":
        console.log("handleChange: " + event.currentTarget.name + " | " + event.currentTarget.checked)
        if (event.currentTarget.checked){
          socket.emit("TWITTER_IGNORE", currentUser);
        }
        else{
          socket.emit("TWITTER_UNIGNORE", currentUser);
        }
        break
      default:
    }
  }
  
  // useLayoutEffect(() => {
  useEffect(() => {
    socket.on("SET_TWITTER_USER", (results) => {
      console.debug("RX SET_TWITTER_USER");
      console.debug(results);
      handleAction({type: "user", data: results.node})
      handleAction({type: "stats", data: results.stats})
    });
  }, [handleAction])

  useEffect(() => {
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

      console.log("CONNECTED TO HOST | ID: " + socket.id);
      socket.emit("TWITTER_SEARCH_NODE", "@threecee")
    });

    socket.on("action", (action) => {
      console.debug("RX ACTION | " + socket.id + " | TYPE: " + action.type);
      console.debug("RX ACTION | ", action.data);
      handleAction(action)
    });    
  
    // return () => socket.disconnect();

  }, [handleAction]);

  return (
    <User user={currentUser} stats={status} handleChange={handleUserChange} handleSearchUser={handleSearchUser}/>
  );
}

export default App;
