import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from "react-router-dom";
import { useHotkeys } from 'react-hotkeys-hook';
import socketClient from "socket.io-client";
import { makeStyles } from '@material-ui/core/styles';

import Container from '@material-ui/core/Container';
import AppBar from '@material-ui/core/AppBar';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
// import ButtonGroup from '@material-ui/core/ButtonGroup';
// import InputBase from '@material-ui/core/InputBase';
// import SearchIcon from '@material-ui/icons/Search';
import Link from '@material-ui/core/Link';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import './App.css';
import UserView from './UserView.js';
import HashtagView from './HashtagView.js';
import { ButtonGroup } from '@material-ui/core';

// const ENDPOINT = "http://mbp3:9997/view";
const ENDPOINT = "https://word.threeceelabs.com/view";
const DEFAULT_AUTH_URL = "http://word.threeceelabs.com/auth/twitter";

const randomIntFromInterval = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const randomId = randomIntFromInterval(1000000000, 9999999999);
const VIEWER_ID = "viewer_" + randomId;

const DEFAULT_VIEWER_OBJ = {
  nodeId: VIEWER_ID,
  userId: VIEWER_ID,
  viewerId: VIEWER_ID,
  screenName: VIEWER_ID,
  type: "viewer",
  namespace: "view",
  timeStamp: Date.now(),
  tags: {},
};

DEFAULT_VIEWER_OBJ.tags.type = "viewer";

DEFAULT_VIEWER_OBJ.tags.mode = "stream";
DEFAULT_VIEWER_OBJ.tags.entity = VIEWER_ID;

const viewerObj = DEFAULT_VIEWER_OBJ;

console.log({viewerObj});

let socket;

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: 'white',
    marginBottom: theme.spacing(2),
  },
  toolBar: {
    backgroundColor: 'white',
  },
  buttonNodeType: {
    flexGrow: 1,
  },
  title: {
    // flexGrow: 1,
    color: 'blue',
    marginRight: theme.spacing(2),
  },
  serverStatus: {
    // flexGrow: 1,
    color: 'gray',
    padding: theme.spacing(1),
  },
  twitterAuth: {
    // backgroundColor: 'black',
    color: "green",
    padding: theme.spacing(1),
    marginRight: theme.spacing(2),
  },  
  buttonLogin: {
    marginRight: theme.spacing(2),
  },
  statusBar: {
    backgroundColor: 'white',
    margin: 2,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "lightgray",
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'primary',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },

}));

const formatDateTime = (dateInput) => {
  return new Date(dateInput).toLocaleDateString(
    'en-gb',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }
  );
}

const App = () => {

  const history = useHistory();

  const classes = useStyles();

  const defaultStatus = {
    nodesPerMin: 0, 
    maxNodesPerMin: 0,
    maxNodesPerMinTime: 0,
    bestNetwork: {
      networkId: ""
    },
    user: {
      uncategorized: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
        all: 0,
        mismatched: 0
      },
      manual: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
      },
      auto: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
      }
    },
    hashtag: {
      uncategorized: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
        all: 0,
        mismatched: 0
      },
      manual: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
      },
      auto: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
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
    nodeId: "blacklivesmatter",
    text: "BlackLivesMatter",
    categoryAuto: "none",
    category: "left",
    createdAt: 0,
    lastSeen: 0,
    age: 0,
    mentions: 0,
    rate: 0,
    rateMax: 0,
  }

  const defaultTweets = {
    search_metadata: {},
    statuses: []
  }

  const [twitterAuthenticated, setTwitterAuthenticated] = useState(false);
  const [twitterAuthenticatedUser, setTwitterAuthenticatedUser  ] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [tweets, setTweets] = useState(defaultTweets);
  const [progress, setProgress] = useState("loading");

  const [displayNodeType, setDisplayNodeType] = useState("user");

  const [currentUser, setCurrentUser] = useState(defaultUser);
  // const [userHistory, setUserHistory] = useState([]);
  // const [userHistoryIndex, setUserHistoryIndex] = useState(0);

  const [currentHashtag, setCurrentHashtag] = useState(defaultHashtag);

  const currentNode = displayNodeType === "user" ? currentUser : currentHashtag;

  const handleSearchNode = (searchString) => {
    setProgress(progress => "searchNode");
    const searchTerm = displayNodeType === "user" ? "@" + searchString : "#" + searchString
    console.log("SEARCH TERM: " + searchTerm)
    socket.emit("TWITTER_SEARCH_NODE", searchTerm)
  }

  const handleLoginLogout = () => {

    setProgress(progress => "loginLogout");

    if (twitterAuthenticated){
      console.warn(
        "LOGGING OUT");
      socket.emit("logout", viewerObj);
      setTwitterAuthenticated(false)
      setTwitterAuthenticatedUser("")
    }
    else{
      console.warn(
        "LOGIN: AUTH: " +
          twitterAuthenticated +
          " | URL: " +
          DEFAULT_AUTH_URL
      );
      window.open(DEFAULT_AUTH_URL, "LOGIN", "_new");
      socket.emit("login", viewerObj);
    }
  }

  const handleNodeChange = useCallback((event, node) => {

    if (displayNodeType === "user"){
      console.log("handleNodeChange | user: @" + node.screenName)
    }
    else{
      console.log("handleNodeChange | hashtag: #" + node.nodeId)
    }

    if (event.persist !== undefined) { 
      event.persist() 
    }

    if (event.preventDefault !== undefined) { 
      event.preventDefault() 
    }

    let eventName = event.currentTarget.name || "nop";
    let eventValue = event.currentTarget.value;
    let eventChecked = event.currentTarget.checked;

    if (event.currentTarget.name === undefined && event.code){

      switch (event.code){

        case "ArrowRight":
        case "ArrowLeft":
          eventName = "history"
          if (event.code === "ArrrowRight"){ history.goForward(); }
          if (event.code === "ArrowLeft"){ history.goBack(); }
          eventValue = history.location.pathname.split("/").pop()
          break;

        case "KeyA":
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

        case "KeyHyphen":
          if (event.shiftKey){
            eventName = "category"
            eventValue = "negative"
          }
          else{
            eventName = "negative"
          }
          break;

        case "KeyEquals":
          if (event.shiftKey){
            eventName = "category"
            eventValue = "positive"
          }
          else{
            eventName = "positive"
          }
          break;

        case "KeyI":
        case "KeyX":
          if (event.shiftKey){
            eventName = "ignored"
            eventChecked = !node.ignored
          }
          break;

        case "KeyV":
          if (event.shiftKey){
            eventName = "catVerified"
            eventChecked = !node.categoryVerified
          }
          break;

        case "KeyB":
          if (event.shiftKey){
            eventName = "isBot"
            eventChecked = !node.isBot
          }
          break;

        default:
      }
    }

    let searchFilter;

    if (node.nodeType === "user"){
      searchFilter = "@?";
      console.log("handleNodeChange | @" + node.screenName + " | name: " + eventName + " | value: " + eventValue)
    }
    else{
      searchFilter = "#?";
      console.log("handleNodeChange | #" + node.nodeId + " | name: " + eventName + " | value: " + eventValue)
    }

    setProgress(progress => eventName);

    switch (eventName){

      case "nop":
        break;

      case "history":
        if (node.nodeType === "user"){
          console.log("handleNodeChange | history | @" + node.screenName + " | name: " + eventName + " | value: " + eventValue)
          socket.emit("TWITTER_SEARCH_NODE", "@" + eventValue);
        }
        else{
          console.log("handleNodeChange | history | #" + node.nodeId + " | name: " + eventName + " | value: " + eventValue)
          socket.emit("TWITTER_SEARCH_NODE", "#" + eventValue);
        }
        break;

      case "all":
      case "left":
      case "neutral":
      case "right":
      case "positive":
      case "negative":
        searchFilter += eventName
        socket.emit("TWITTER_SEARCH_NODE", searchFilter);
        break

      case "mismatch":
        if (node.nodeType === "user"){
          socket.emit("TWITTER_SEARCH_NODE", "@?mm");
        }
        break

      case "category":
        socket.emit("TWITTER_CATEGORIZE_NODE", {
          category: eventValue,
          following: true,
          node: node,
        });
        break

      case "isBot":
        if (node.nodeType === "user"){
          if (eventChecked){
            socket.emit("TWITTER_BOT", node);
          }
          else{
            socket.emit("TWITTER_UNBOT", node);
          }
        }
        break

      case "following":
        if (node.nodeType === "user"){
          if (eventChecked){
            socket.emit("TWITTER_FOLLOW", node);
          }
          else{
            socket.emit("TWITTER_UNFOLLOW", node);
          }
        }
        break

      case "catVerified":
        if (node.nodeType === "user"){
          if (eventChecked){
            socket.emit("TWITTER_CATEGORY_VERIFIED", node);
          }
          else{
            socket.emit("TWITTER_CATEGORY_UNVERIFIED", node);
          }
        }
        break

      case "ignored":
        if (eventChecked){
          socket.emit("TWITTER_IGNORE", node);
        }
        else{
          socket.emit("TWITTER_UNIGNORE", node);
        }
        break

      default:
        console.log("handleNodeChange: UNKNOWN NAME: " + eventName + " | VALUE: " + eventValue)
        console.log({event})
    }
    
  }, [displayNodeType, history])

  const nodeValid = (node) => {
    if (node === undefined) return false
    if (node.nodeId === undefined) return false

    if (node.nodeType === "user"){
      if (node.screenName === undefined) return false
    } 

    return true
  }

  useEffect(() => {
    if (displayNodeType === "user"){
      if (!history.location.pathname.endsWith("/user/" + currentUser.screenName)){
        history.push("/user/" + currentUser.screenName)
      }
    }
    if (displayNodeType === "hashtag"){
      if (!history.location.pathname.endsWith("/hashtag/" + currentHashtag.nodeId)){
        history.push("/hashtag/" + currentHashtag.nodeId)
      }
    }
  }, [currentUser, currentHashtag, displayNodeType, history])

  useEffect(() => {

    socket = socketClient(ENDPOINT);

    socket.on("connect", ()=>{
      console.log("CONNECTED: " + socket.id)
      setProgress(progress => "authentication");
      socket.emit("authentication", {
        namespace: "view",
        userId: "test",
        password: "0123456789",
      });
    })

    socket.on("SET_TWITTER_USER", (results) => {

      console.debug("RX SET_TWITTER_USER");

      if (nodeValid(results.node)) { 
        setCurrentUser(currentUser => results.node) 
        console.debug("new: @" + results.node.screenName);
      }
      setProgress(progress => "idle");
      setStatus(status => results.stats)
    });

    socket.on("SET_TWITTER_HASHTAG", (results) => {

      console.debug("RX SET_TWITTER_HASHTAG");
      if (nodeValid(results.node)) { 
        setCurrentHashtag(currentHashtag => results.node) 
        console.debug("new: #" + results.node.nodeId);
        setTweets(tweets => results.tweets)
      }
      setProgress(progress => "idle");
      setStatus(status => results.stats)
    });

    socket.on("action", (action) => {
      
      console.debug("RX ACTION | socket: " + socket.id + " | TYPE: " + action.type);
      console.debug("RX ACTION | ", action.data);

      switch (action.type){

        case "user":
            setCurrentUser(currentUser => action.data)
            console.log("USER: @" + action.data.screenName + " | " + action.data.profileImageUrl)
          break

        case "hashtag":
            console.log("HT: #" + action.data.text)
          break

        case "stats":
            setStatus(status => action.data)
          break

        default:
      }

    });   

    socket.on("authenticated", function () {
      setProgress(progress => "idle");
      console.debug("AUTHENTICATED | " + socket.id);

      // statsObj.socketId = socket.id;
      // statsObj.serverConnected = true;
      // statsObj.userReadyTransmitted = false;
      // statsObj.userReadyAck = false;
      socket.emit("TWITTER_SEARCH_NODE", "@threecee")
    });

    socket.on("USER_AUTHENTICATED", function (userObj) {
      setProgress(progress => "idle");
      setTwitterAuthenticated(twitterAuthenticated => true)
      setTwitterAuthenticatedUser(twitterAuthenticatedUser => userObj.screenName)
      console.log("RX TWITTER USER_AUTHENTICATED | USER: @" + userObj.screenName);
    });

    socket.on("TWITTER_USER_NOT_FOUND", (results) => {
      setProgress(progress => "idle");
      console.debug("RX TWITTER_USER_NOT_FOUND");
      console.debug(results);
      setStatus(status => results.stats)
    });
    
    setProgress("idle")

    return () => socket.disconnect();

  }, [])

  // history
  // - back
  useHotkeys('left', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  // - forward
  useHotkeys('right', (event) => handleNodeChange(event, currentNode), {}, [currentNode])

  // all
  useHotkeys('A', (event) => handleNodeChange(event, currentNode), {}, [currentNode])

  // left
  useHotkeys('L', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  useHotkeys('shift+L', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  useHotkeys('D', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  useHotkeys('shift+D', (event) => handleNodeChange(event, currentNode), {}, [currentNode])

  // right
  useHotkeys('R', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  useHotkeys('shift+R', (event) => handleNodeChange(event, currentNode), {}, [currentNode])

  // neutral
  useHotkeys('N', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  useHotkeys('shift+N', (event) => handleNodeChange(event, currentNode), {}, [currentNode])

  // negative
  useHotkeys('-', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  useHotkeys('shift+-', (event) => handleNodeChange(event, currentNode), {}, [currentNode])

  // positive
  useHotkeys('=', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  useHotkeys('shift+=', (event) => handleNodeChange(event, currentNode), {}, [currentNode])

  // ignore toggle
  useHotkeys('shift+I', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  useHotkeys('shift+X', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  // bot toggle
  useHotkeys('shift+B', (event) => handleNodeChange(event, currentNode), {}, [currentNode])
  // verified toggle
  useHotkeys('shift+V', (event) => handleNodeChange(event, currentNode), {}, [currentNode])

  const displayNode = (nodeType) => {
    if (nodeType === "user"){
      return <UserView user={currentUser} stats={status} handleNodeChange={handleNodeChange} handleSearchNode={handleSearchNode}/>
    }
    else{
      return <HashtagView hashtag={currentHashtag} stats={status} tweets={tweets} handleNodeChange={handleNodeChange} handleSearchNode={handleSearchNode}/>
    }
  }

  return (
    <div className={classes.root}>
      <Container component="main" maxWidth={false}>
        <AppBar  className={classes.appBar} position="static">
          <Toolbar className={classes.toolBar}>

            <Typography variant="h6" className={classes.title}>
              {/* Categorizer | USER HISTORY: {userHistory.length} | PREV USER: {userHistory.length > 0 ? userHistory[userHistory.length-1] : ""} */}
              Categorizer
            </Typography>

            <ButtonGroup                
              className={classes.buttonNodeType}
            >
              <Button 
                variant="contained" 
                color="primary" 
                size="small" 
                name="user"
                label="user"
                onClick={() => setDisplayNodeType("user")}
              >
                User
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                size="small" 
                name="hashtag"
                label="hashtag"
                onClick={() => setDisplayNodeType("hashtag")}
              >
                Hashtag
              </Button>
            </ButtonGroup>

            {progress !== "idle" ? <CircularProgress>{progress}</CircularProgress> : <></>}

            <Typography  className={classes.serverStatus}>
              NN: {status.bestNetwork.networkId}
            </Typography>
            <Typography  className={classes.serverStatus}>
              {status.nodesPerMin} nodes/min (max: {status.maxNodesPerMin} | time: {formatDateTime(status.maxNodesPerMinTime)})
            </Typography>


            <Link
              className={classes.twitterAuth}
              href={"http://twitter.com/" + twitterAuthenticatedUser}
              target="_blank"
              rel="noopener"
            >
              {twitterAuthenticatedUser ? "@" + twitterAuthenticatedUser : ""}
            </Link>

            <Button 
              className={classes.buttonLogin}
              variant="contained" 
              color="primary" 
              size="small" 
              onClick={handleLoginLogout} 
              name="login"
              label="login"
            >
              {twitterAuthenticated ? "LOGOUT" : "LOGIN TWITTER"}
            </Button>

          </Toolbar>
        </AppBar>
        {displayNode(displayNodeType)}
      </Container>
    </div>
  );
}

export default App;