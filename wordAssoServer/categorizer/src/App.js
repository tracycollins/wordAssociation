import React, { useState, useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import socketClient from "socket.io-client";
import { makeStyles } from '@material-ui/core/styles';

import Container from '@material-ui/core/Container';
import AppBar from '@material-ui/core/AppBar';
// import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
// import ButtonGroup from '@material-ui/core/ButtonGroup';
// import InputBase from '@material-ui/core/InputBase';
// import SearchIcon from '@material-ui/icons/Search';
import Link from '@material-ui/core/Link';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import './App.css';
import User from './User.js';

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

const statsObj = {};
statsObj.isAuthenticated = false;
statsObj.viewerReadyTransmitted = false;

const socket = socketClient(ENDPOINT);
const twitterFeedPreviousUserArray = [];

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: 'white',
    margin: 2,
  },
  title: {
    flexGrow: 1,
    color: 'blue',
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

  const [twitterAuthenticated, setTwitterAuthenticated] = useState(false);
  const [twitterAuthenticatedUser, setTwitterAuthenticatedUser  ] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [currentUser, setCurrentUser] = useState(defaultUser);
  const [previousUser, setPreviousUser] = useState({nodeId: false});
  const [currentHashtag, setHashtag] = useState(defaultHashtag);
  
  const handleSearchUser = (searchString) => {
    const searchTerm = "@" + searchString
    socket.emit("TWITTER_SEARCH_NODE", searchTerm)
  }

  const handleLoginLogout = () => {
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
        case "KeyX":
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
     
  }, [currentHashtag.text, currentUser, previousUser.nodeId])

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

  useEffect(() => {
    socket.on("USER_AUTHENTICATED", function (userObj) {
      setTwitterAuthenticated(true)
      setTwitterAuthenticatedUser(userObj.screenName)
      console.log("RX TWITTER USER_AUTHENTICATED | USER: @" + userObj.screenName);
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
  useHotkeys('shift+X', (event) => handleUserChange(event), {}, [currentUser])

  return (
    <div className={classes.root}>
      <Container component="main" maxWidth={false}>
        <AppBar  className={classes.appBar} position="static">
          <Toolbar>

            <Typography variant="h6" className={classes.title}>
              Categorizer
            </Typography>

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
        <User user={currentUser} stats={status} handleUserChange={handleUserChange} handleSearchUser={handleSearchUser}/>
      </Container>
    </div>
  );
}

export default App;