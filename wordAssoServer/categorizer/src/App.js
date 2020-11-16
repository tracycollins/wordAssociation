import React, { useState, useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import socketClient from "socket.io-client";
import './App.css';
import User from './User.js';

// const ENDPOINT = "http://mbp3:9997/view";
const ENDPOINT = "https://word.threeceelabs.com/view";

const statsObj = {};
statsObj.viewerReadyTransmitted = false;

const socket = socketClient(ENDPOINT);
const twitterFeedPreviousUserArray = [];


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
      },
      manual: {
        left: 0,
        neutral: 0,
        right: 0,
      },
      auto: {
        left: 0,
        neutral: 0,
        right: 0,
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
  const [currentUser, setCurrentUser] = useState(defaultUser);
  const [previousUser, setPreviousUser] = useState({nodeId: false});
  const [currentHashtag, setHashtag] = useState(defaultHashtag);
  
  const handleSearchUser = (searchString) => {
    const searchTerm = "@" + searchString
    socket.emit("TWITTER_SEARCH_NODE", searchTerm)
  }

  const handleUserChange = useCallback((event) => {

    // console.log("handleUserChange | currentUser: @" + currentUser.screenName)

    if (event.persist !== undefined) { 
      event.persist() 
    }

    if (event.preventDefault !== undefined) { 
      event.preventDefault() 
    }

    let eventName = event.currentTarget.name;
    let eventValue = event.currentTarget.value;
    let eventChecked = event.currentTarget.checked;

    if (event.currentTarget.name === undefined && event.code){
      switch (event.code){
        case "ArrowRight":
          eventName = "all"
          break;
        case "ArrowLeft":
          eventName = "all"
          break;
        case "KeyD":
        case "KeyL":
          if (event.shiftKey){
            eventName = "category"
            eventValue = "left"
          }
          else{
            eventName = "left"
          }
          break;
        case "KeyN":
          if (event.shiftKey){
            eventName = "category"
            eventValue = "neutral"
          }
          else{
            eventName = "neutral"
          }
          break;
        case "KeyR":
          if (event.shiftKey){
            eventName = "category"
            eventValue = "right"
          }
          else{
            eventName = "right"
          }
          break;
        case "KeyI":
          if (event.shiftKey){
            eventName = "ignored"
            eventChecked = !currentUser.ignored
          }
          break;
        case "KeyV":
          if (event.shiftKey){
            eventName = "catVerified"
            eventChecked = !currentUser.categoryVerified
          }
          break;
        case "KeyB":
          if (event.shiftKey){
            eventName = "isBot"
            eventChecked = !currentUser.isBot
          }
          break;
        default:
      }
    }

    console.log("handleUserChange | @" + currentUser.screenName + " | name: " + eventName + " | value: " + eventValue)

    let searchFilter = "@?";

    switch (eventName){
      case "all":
      case "left":
      case "neutral":
      case "right":
        searchFilter += eventName
        socket.emit("TWITTER_SEARCH_NODE", searchFilter);
        break
      case "mismatch":
        socket.emit("TWITTER_SEARCH_NODE", "@?mm");
        break
      case "category":
        socket.emit("TWITTER_CATEGORIZE_NODE", {
          category: eventValue,
          following: true,
          node: currentUser,
        });
        break
      case "isBot":
        if (eventChecked){
          socket.emit("TWITTER_BOT", currentUser);
        }
        else{
          socket.emit("TWITTER_UNBOT", currentUser);
        }
        break
      case "following":
        if (eventChecked){
          socket.emit("TWITTER_FOLLOW", currentUser);
        }
        else{
          socket.emit("TWITTER_UNFOLLOW", currentUser);
        }
        break
      case "catVerified":
        if (eventChecked){
          socket.emit("TWITTER_CATEGORY_VERIFIED", currentUser);
        }
        else{
          socket.emit("TWITTER_CATEGORY_UNVERIFIED", currentUser);
        }
        break
      case "ignored":
        if (eventChecked){
          socket.emit("TWITTER_IGNORE", currentUser);
        }
        else{
          socket.emit("TWITTER_UNIGNORE", currentUser);
        }
        break
      default:
        console.log("handleUserChange: UNKNOWN NAME: " + eventName + " | VALUE: " + eventValue)
        console.log({event})
    }
    
  }, [currentUser])

  const nodeValid = (node) => {
    if (node === undefined) return false
    if (node.nodeId === undefined) return false
    if (node.screenName === undefined) return false
    return true
  }
  
  useEffect(() => {
    socket.on("SET_TWITTER_USER", (results) => {
      console.debug("RX SET_TWITTER_USER");
      console.debug(results);
      if (nodeValid(results.node)) { setCurrentUser(results.node) }
      setStatus(results.stats)
    });
  }, [])

  useEffect(() => {
    socket.on("action", (action) => {
      console.debug("RX ACTION | " + socket.id + " | TYPE: " + action.type);
      console.debug("RX ACTION | ", action.data);

      switch (action.type){
        case "user":
            setCurrentUser(action.data)

            if (previousUser.nodeId 
              && (currentUser.nodeId !== previousUser.nodeId) 
              && !twitterFeedPreviousUserArray.includes(previousUser.nodeId)
            ){
              twitterFeedPreviousUserArray.push(previousUser.nodeId);
            }
            if (previousUser.nodeId !== currentUser.nodeId){
              setPreviousUser(currentUser);
            }

            console.log("USER: @" + action.data.screenName + " | " + action.data.profileImageUrl)
          break
        case "hashtag":
            setHashtag({})
            console.log("HT: #" + currentHashtag.text)
          break
        case "stats":
            setStatus(action.data)
          break
          default:
      }

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
    })
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    socket.on("authenticated", function () {
      console.debug("AUTHENTICATED | " + socket.id);

      statsObj.socketId = socket.id;
      statsObj.serverConnected = true;
      statsObj.userReadyTransmitted = false;
      statsObj.userReadyAck = false;
      socket.emit("TWITTER_SEARCH_NODE", "@threecee")
    });
  }, []);

  useHotkeys('right', handleUserChange) // next uncat any
  useHotkeys('left', handleUserChange) // prev uncat any

  useHotkeys('L', handleUserChange)
  useHotkeys('shift+L', (event) => handleUserChange(event), {}, [currentUser])

  useHotkeys('D', handleUserChange)
  useHotkeys('shift+D', (event) => handleUserChange(event), {}, [currentUser])

  useHotkeys('R', handleUserChange)
  useHotkeys('shift+R', (event) => handleUserChange(event), {}, [currentUser])

  useHotkeys('N', handleUserChange)
  useHotkeys('shift+N', (event) => handleUserChange(event), {}, [currentUser])

  useHotkeys('shift+I', (event) => handleUserChange(event), {}, [currentUser])
  useHotkeys('shift+B', (event) => handleUserChange(event), {}, [currentUser])
  useHotkeys('shift+V', (event) => handleUserChange(event), {}, [currentUser])

  return (
    <User user={currentUser} stats={status} handleUserChange={handleUserChange} handleSearchUser={handleSearchUser}/>
  );
}

export default App;
