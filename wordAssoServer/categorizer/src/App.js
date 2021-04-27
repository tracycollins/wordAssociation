import React, { useState, useEffect, useCallback, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import socketClient from "socket.io-client";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import AppBar from "@material-ui/core/AppBar";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import InputBase from "@material-ui/core/InputBase";
import Link from "@material-ui/core/Link";
import SearchIcon from "@material-ui/icons/Search";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

import "./App.css";
import UserView from "./UserView.js";
import HashtagView from "./HashtagView.js";
import AuthUserView from "./AuthUserView.js";

const MIN_USERS_AVAILABLE = 10;
const MIN_FOLLOWERS_COUNT = 5000;

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

console.log({ viewerObj });

let socket = socketClient(ENDPOINT);

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    // flexGrow: 1,
    boxShadow: 0,
  },
  appBar: {
    backgroundColor: "black",
    marginBottom: theme.spacing(2),
    boxShadow: 0,
    top: 0,
    bottom: "auto",
  },
  tabs: {
    color: "white",
  },
  tab: {
    minWidth: 100,
    width: 100,
  },
  toolBar: {
    shadows: 0,
  },
  title: {
    color: "white",
    marginRight: theme.spacing(2),
  },
  progress: {
    color: "white",
    marginRight: theme.spacing(2),
  },
  serverStatus: {
    fontSize: "0.85rem",
    flexGrow: 1,
    color: "lightgray",
    padding: theme.spacing(1),
  },
  twitterAuth: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "green",
    padding: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  buttonLogin: {
    // marginRight: theme.spacing(1),
  },
  statusBar: {
    backgroundColor: "white",
    margin: 2,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    "&:hover": {
      backgroundColor: "lightgray",
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "20%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(3),
      width: "auto",
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRoot: {
    color: "primary",
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}));

const formatDateTime = (dateInput) => {
  return new Date(dateInput).toLocaleString();
};

const App = () => {
  const history = useHistory();
  let location = useLocation();

  const classes = useStyles();

  const defaultStatus = {
    nodesPerMin: 0,
    maxNodesPerMin: 0,
    maxNodesPerMinTime: 0,
    bestNetwork: {
      networkId: "",
    },
    user: {
      uncategorized: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
        all: 0,
        mismatched: 0,
      },
      category: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
      },
      categoryAuto: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
      },
    },
    hashtag: {
      uncategorized: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
        all: 0,
        mismatched: 0,
      },
      category: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
      },
      categoryAuto: {
        left: 0,
        neutral: 0,
        right: 0,
        positive: 0,
        negative: 0,
      },
    },
  };

  const defaultUser = {
    nodeId: null,
    screenName: "threecee",
    name: "",
    location: "",
    description: "",
    profileImageUrl:
      "https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",
    bannerImage: "",
    createdAt: null,
    status: {},
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
  };

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
  };

  const defaultTweets = {
    search_metadata: {},
    statuses: [],
  };

  const [tabValue, setTabValue] = useState(0);

  const [filterLowFollowersCount, setFilterLowFollowersCount] = useState(true);
  const filterLowFollowersCountRef = useRef(filterLowFollowersCount);

  const [twitterAuthenticated, setTwitterAuthenticated] = useState(false);
  const twitterAuthenticatedRef = useRef(twitterAuthenticated);

  const [twitterAuthenticatedUser, setTwitterAuthenticatedUser] = useState({});
  const twitterAuthenticatedUserRef = useRef(twitterAuthenticatedUser);

  const [userSearch, setUserSearch] = useState("");

  const [status, setStatus] = useState(defaultStatus);
  const statusRef = useRef(status);

  const [statusHashtag, setStatusHashtag] = useState(false);
  const statusHashtagRef = useRef(statusHashtag);

  const [tweets, setTweets] = useState(defaultTweets);
  const tweetsRef = useRef(tweets);

  const [progress, setProgress] = useState("loading ...");

  const [currentTab, setCurrentTab] = useState("user");
  const currentTabRef = useRef(currentTab);

  const [currentUsers, setUsers] = useState([]);
  const currentUsersRef = useRef(currentUsers);

  const [currentUser, setCurrentUser] = useState(defaultUser);
  const currentUserRef = useRef(currentUser);

  const [waitForCurrentUser, setWaitForCurrentUser] = useState(false);
  const waitForCurrentUserRef = useRef(waitForCurrentUser);

  const [currentHashtag, setCurrentHashtag] = useState(defaultHashtag);
  const currentHashtagRef = useRef(currentHashtag);

  useEffect(() => {
    filterLowFollowersCountRef.current = filterLowFollowersCount;
  }, [filterLowFollowersCount]);

  useEffect(() => {
    twitterAuthenticatedUserRef.current = twitterAuthenticatedUser;
  }, [twitterAuthenticatedUser]);

  useEffect(() => {
    twitterAuthenticatedRef.current = twitterAuthenticated;
  }, [twitterAuthenticated]);

  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  useEffect(() => {
    waitForCurrentUserRef.current = waitForCurrentUser;
  }, [waitForCurrentUser]);

  useEffect(() => {
    currentUsersRef.current = currentUsers;
  }, [currentUsers]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    currentHashtagRef.current = currentHashtag;
  }, [currentHashtag]);

  useEffect(() => {
    statusHashtagRef.current = statusHashtag;
  }, [statusHashtag]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    tweetsRef.current = tweets;
  }, [tweets]);

  const currentNode = currentTab === "user" ? currentUser : currentHashtag;

  useEffect(() => {
    console.log(`IN CURRENT NODE USE EFFECT | progress: ${progress}`);

    let newLocation = "";

    if (currentTab === "user") {
      newLocation = "/categorize/user/" + currentNode.screenName.toLowerCase();
    }
    if (currentTab === "hashtag") {
      newLocation = "/categorize/hashtag/" + currentNode.nodeId.toLowerCase();
    }

    if (progress === "history" && newLocation !== location.pathname) {
      history.replace(newLocation);
      console.log(
        `history size: ${history.length} | new location: ${newLocation}`
      );
      setProgress("idle");
    }

    if (progress !== "history" && newLocation !== location.pathname) {
      history.push(newLocation);
      console.log(
        `history size: ${history.length} | new location: ${newLocation}`
      );
      setProgress("idle");
    }
  }, [currentNode, history, currentTab, location.pathname, progress]);

  const handleTabChange = (event, newValue) => {
    event.preventDefault();
    console.log({ newValue });

    switch (newValue) {
      case 0:
        setCurrentTab("user");
        break;
      case 1:
        setCurrentTab("hashtag");
        break;
      case 2:
        setCurrentTab("authUser");
        break;
      default:
        setCurrentTab("user");
    }

    setTabValue(newValue);
  };

  const handleSearchNode = (searchString) => {
    setProgress((progress) => "searchNode");
    const searchTerm =
      currentTab === "user" ? "@" + searchString : "#" + searchString;
    console.log("SEARCH TERM: " + searchTerm);
    socket.emit("TWITTER_SEARCH_NODE", { searchNode: searchTerm });
  };

  const handleLoginLogout = useCallback((event) => {
    event.preventDefault();
    setProgress((progress) => "loginLogout");

    if (twitterAuthenticatedRef.current) {
      console.warn("LOGGING OUT");
      socket.emit("logout", viewerObj);
      setTwitterAuthenticated(false);
      setTwitterAuthenticatedUser({});
      setProgress((progress) => "idle");
    } else {
      console.warn(
        "TWITTER_AUTHENTICATE: " +
          twitterAuthenticatedRef.current +
          " | URL: " +
          DEFAULT_AUTH_URL
      );
      window.open(DEFAULT_AUTH_URL, "TWITTER_AUTHENTICATE", "_new");
      socket.emit("TWITTER_AUTHENTICATE", viewerObj);
    }
  }, []);

  const currentUsersAvailable = (eventName) => {
    if (currentUsersRef.current && currentUsersRef.current.length > 0) {
      const tempUsers = [...currentUsersRef.current];
      const user = tempUsers.shift();
      setUsers(tempUsers);
      console.log(
        "USING CURRENT USERS | CURRENT USERS: " +
          tempUsers.length +
          " | @" +
          user.screenName
      );
      setCurrentUser(user);
      return tempUsers.length;
    }
    return 0;
  };

  const handleNodeChange = useCallback(
    (event, node) => {
      if (event.preventDefault !== undefined) {
        event.preventDefault();
      }

      if (currentTabRef.current === "user") {
        console.log("handleNodeChange | user: @" + node.screenName);
      } else {
        console.log("handleNodeChange | hashtag: #" + node.nodeId);
      }

      if (event.persist !== undefined) {
        event.persist();
      }

      let eventName = event.target.name || "nop";
      let eventValue = event.target.value;
      let eventChecked = event.target.checked;
      let eventCode = event.code;

      if (event.target.name === undefined && eventCode) {
        switch (eventCode) {
          case "ArrowRight":
          case "ArrowLeft":
            console.log("location.pathname: " + location.pathname);

            eventName = "history";

            if (eventCode === "ArrowRight") {
              history.goForward();
              console.log("history.goForward: loc: " + location.pathname);
              eventValue = location.pathname.split("/").pop();
            }
            if (eventCode === "ArrowLeft") {
              history.goBack();
              console.log("history.goBack: loc: " + location.pathname);
              eventValue = location.pathname.split("/").pop();
            }
            break;

          case "KeyA":
            eventName = "all";
            break;

          case "KeyD":
          case "KeyL":
            if (event.shiftKey) {
              eventName = "category";
              eventValue = "left";
            } else {
              eventName = "left";
            }
            break;

          case "KeyN":
            if (event.shiftKey) {
              eventName = "category";
              eventValue = "neutral";
            } else {
              eventName = "neutral";
            }
            break;

          case "KeyR":
            if (event.shiftKey) {
              eventName = "category";
              eventValue = "right";
            } else {
              eventName = "right";
            }
            break;

          case "KeyHyphen":
            if (event.shiftKey) {
              eventName = "category";
              eventValue = "negative";
            } else {
              eventName = "negative";
            }
            break;

          case "KeyEquals":
            if (event.shiftKey) {
              eventName = "category";
              eventValue = "positive";
            } else {
              eventName = "positive";
            }
            break;

          case "KeyI":
          case "KeyX":
            if (event.shiftKey) {
              eventName = "ignored";
              eventChecked = !node.ignored;
            }
            break;

          case "KeyV":
            if (event.shiftKey) {
              eventName = "catVerified";
              eventChecked = !node.categoryVerified;
            }
            break;

          case "KeyB":
            if (event.shiftKey) {
              eventName = "isBot";
              eventChecked = !node.isBot;
            }
            break;

          default:
        }
      }

      let searchFilter;

      if (node.nodeType === "user") {
        searchFilter = "@?";
      } else {
        searchFilter = "#?";
      }

      setProgress(eventName);

      let usersAvailable = 0;

      switch (eventName) {
        case "nop":
          setProgress("idle");
          break;

        case "history":
          if (node.nodeType === "user") {
            console.log(
              "handleNodeChange | history | @" +
                node.screenName +
                " | name: " +
                eventName +
                " | value: " +
                eventValue
            );
            socket.emit("TWITTER_SEARCH_NODE", {
              searchNode: "@" + eventValue,
            });
          } else {
            console.log(
              "handleNodeChange | history | #" +
                node.nodeId +
                " | name: " +
                eventName +
                " | value: " +
                eventValue
            );
            socket.emit("TWITTER_SEARCH_NODE", {
              searchNode: "#" + eventValue,
            });
          }
          break;

        case "all":
        case "left":
        case "neutral":
        case "right":
        case "positive":
        case "negative":
          searchFilter += eventName;

          usersAvailable = currentUsersAvailable(eventName);

          if (usersAvailable === 0 && !waitForCurrentUserRef.current) {
            console.log("NO USERS | usersAvailable: " + usersAvailable);
            console.log(
              "SET WAIT FOR CURRENT USER | : " + waitForCurrentUserRef.current
            );
            setWaitForCurrentUser(true);
          }

          if (usersAvailable < MIN_USERS_AVAILABLE) {
            console.log("GET MORE USERS | usersAvailable: " + usersAvailable);
            socket.emit("TWITTER_SEARCH_NODE", { searchNode: searchFilter });
          }

          break;

        case "mismatch":
          if (node.nodeType === "user") {
            socket.emit("TWITTER_SEARCH_NODE", { searchNode: "@?mm" });
          }
          break;

        case "category":
          if (twitterAuthenticatedRef.current) {
            console.log(
              "TWITTER_CATEGORIZE_NODE | CAT: " +
                eventValue +
                " | NODE: " +
                node.nodeId
            );
            socket.emit("TWITTER_CATEGORIZE_NODE", {
              categorizedBy: twitterAuthenticatedUserRef.current.screenName,
              category: eventValue,
              following: true,
              node: node,
            });
          } else {
            alert("NOT AUTHENTICATED");
            setProgress("idle");
            return;
          }
          break;

        case "isBot":
        case "following":
        case "catVerified":
        case "ignored":
          if (!twitterAuthenticatedRef.current) {
            alert("NOT AUTHENTICATED");
            setProgress("idle");
            return;
          }

          if (eventName === "ignored") {
            if (eventChecked) {
              socket.emit("TWITTER_IGNORE", node);
            } else {
              socket.emit("TWITTER_UNIGNORE", node);
            }
            break;
          }

          if (node.nodeType === "user") {
            if (eventName === "bot") {
              if (eventChecked) {
                socket.emit("TWITTER_BOT", node);
              } else {
                socket.emit("TWITTER_UNBOT", node);
              }
            }

            if (eventName === "following") {
              if (eventChecked) {
                socket.emit("TWITTER_FOLLOW", node);
              } else {
                socket.emit("TWITTER_UNFOLLOW", node);
              }
            }

            if (eventName === "catVerified") {
              if (eventChecked) {
                socket.emit("TWITTER_CATEGORY_VERIFIED", node);
              } else {
                socket.emit("TWITTER_CATEGORY_UNVERIFIED", node);
              }
            }
          }

          break;

        default:
          console.log(
            "handleNodeChange: UNKNOWN NAME: " +
              eventName +
              " | VALUE: " +
              eventValue
          );
          console.log({ event });
      }
    },
    [location, history]
  );

  const nodeValid = (node) => {
    if (node === undefined) return false;
    if (node.nodeId === undefined) return false;

    if (node.nodeType === "user") {
      if (node.screenName === undefined) return false;
    }

    return true;
  };

  useEffect(() => {
    if (currentTabRef.current === "user") {
      console.log("user loc:  " + location.pathname);
    }
  }, [location, tabValue]);

  useEffect(() => {
    if (currentTabRef.current === "hashtag") {
      console.log("hashtag loc:  " + location.pathname);
    }
  }, [location, tabValue]);

  useEffect(() => {
    if (currentTabRef.current === "authUser") {
      console.log("authUser loc:  " + location.pathname);
    }
  }, [location, tabValue]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("CONNECTED: " + socket.id);

      setProgress((progress) => "authentication");

      socket.emit("authentication", {
        namespace: "view",
        userId: "test",
        password: "0123456789",
      });
    });

    socket.on("TWITTER_USERS", (response) => {
      console.debug("RX TWITTER_USERS");

      let tempUsers = [];
      let minFollowers = filterLowFollowersCountRef.current ? 5000 : 0;
      let currentUserSetFlag = false;

      if (response.nodes && response.nodes.length > 0) {
        console.debug("RX USERS: " + response.nodes.length);

        tempUsers = [...currentUsersRef.current];

        for (const user of response.nodes) {
          if (user.screenName && user.screenName !== "") {
            if (
              filterLowFollowersCountRef.current &&
              user.followersCount < MIN_FOLLOWERS_COUNT
            ) {
              console.log(
                "LESS THAN MIN FOLLOWERS ... SKIPPING | @" +
                  user.screenName +
                  " | FOLLOWERS: " +
                  user.followersCount
              );
            } else {
              console.log(
                "+++ USER | @" +
                  user.screenName +
                  " | FOLLOWERS: " +
                  user.followersCount
              );
              if (!currentUserSetFlag && waitForCurrentUserRef.current) {
                console.log(
                  "WAIT FOR CURRENT USER | SET CURRENT USER | @" +
                    user.screenName +
                    " | FOLLOWERS: " +
                    user.followersCount
                );
                currentUserSetFlag = true;
                setCurrentUser(user);
                setWaitForCurrentUser(false);
              } else {
                tempUsers.push(user);
              }
            }
          }
        }
        console.debug("TOTAL USERS: " + tempUsers.length);
        setUsers((users) => [...tempUsers]);
      }

      if (tempUsers.length < MIN_USERS_AVAILABLE) {
        socket.emit("TWITTER_SEARCH_NODE", {
          searchNode: response.searchNode,
          minFollowers: minFollowers,
        });
      }

      setProgress((progress) => "idle");
      setStatus((status) => response.stats);
    });

    socket.on("SET_TWITTER_USER", (response) => {
      console.debug("RX SET_TWITTER_USER");

      if (response.nodes) {
        setUsers((users) => [...users, ...response.nodes]);
        console.debug("RX nodes: " + response.nodes.length);
      }

      if (nodeValid(response.node)) {
        setCurrentUser((currentUser) => response.node);
        console.debug("new twitter user: @" + response.node.screenName);
        // if (currentTabRef.current === "user"){
        //   history.push("/categorize/user/" + response.node.screenName.toLowerCase())
        // }
      }

      setProgress((progress) => "idle");
      setStatus((status) => response.stats);
    });

    socket.on("TWITTER_SEARCH_NODE_UNKNOWN_MODE", (response) => {
      console.debug("RX TWITTER_SEARCH_NODE_UNKNOWN_MODE");
      console.debug({ response });
      setProgress((progress) => "idle");
      setStatus((status) => response.stats);
    });

    socket.on("TWITTER_HASHTAG_NOT_FOUND", (response) => {
      console.debug("RX TWITTER_HASHTAG_NOT_FOUND");
      console.debug({ response });
      setStatusHashtag((statusHashtag) => "notFound");
      setCurrentHashtag((currentHashtag) => {
        return { nodeId: response.searchNode.slice(1) };
      });
      setTweets({ search_metadata: {}, statuses: [] });
      setProgress((progress) => "idle");
      setStatus((status) => response.stats);
    });

    socket.on("SET_TWITTER_HASHTAG", (response) => {
      console.debug("RX SET_TWITTER_HASHTAG");

      if (nodeValid(response.node)) {
        setStatusHashtag((statusHashtag) => "found");
        setCurrentHashtag((currentHashtag) => response.node);
        console.debug("new: #" + response.node.nodeId);
        if (response.tweets) {
          console.debug(
            "RX SET_TWITTER_HASHTAG | SET TWEETS: " +
              response.tweets.statuses.length
          );
          setTweets((tweets) => response.tweets);
        }
      } else {
        setStatusHashtag((statusHashtag) => "invalid");
        console.debug("INVALID HT NODE | RESULTS");
        console.debug({ response });
      }

      setProgress((progress) => "idle");
      setStatus((status) => response.stats);
    });

    socket.on("action", (action) => {
      switch (action.type) {
        case "user":
          setCurrentUser((currentUser) => action.data);
          console.log(
            "USER: @" +
              action.data.screenName +
              " | " +
              action.data.profileImageUrl
          );
          break;

        case "hashtag":
          console.log("HT: #" + action.data.text);
          break;

        case "stats":
          setStatus(() => action.data);
          break;

        default:
      }
    });

    socket.on("authenticated", function () {
      setProgress((progress) => "idle");
      console.debug("AUTHENTICATED | " + socket.id);
      socket.emit("TWITTER_SEARCH_NODE", { searchNode: "@?all" });
      socket.emit("TWITTER_SEARCH_NODE", { searchNode: "@threecee" });
      socket.emit("TWITTER_SEARCH_NODE", { searchNode: "#blacklivesmatter" });
    });

    socket.on("USER_AUTHENTICATED", function (userObj) {
      setProgress((progress) => "idle");
      setTwitterAuthenticated(() => true);
      setTwitterAuthenticatedUser((twitterAuthenticatedUser) => userObj);
      console.log(
        "RX TWITTER USER_AUTHENTICATED | USER: @" + userObj.screenName
      );
    });

    socket.on("TWITTER_USER_NOT_FOUND", (response) => {
      console.debug("RX TWITTER_USER_NOT_FOUND");
      console.debug(response);

      setStatus((status) => response.stats);

      if (
        response.searchNode.startsWith("@?") &&
        response.results &&
        !response.results.endCursor
      ) {
        console.debug("RETRY NEXT UNCAT: " + response.searchNode);
        socket.emit("TWITTER_SEARCH_NODE", { searchNode: response.searchNode });
      } else {
        setProgress((progress) => "idle");
      }
    });

    setProgress("idle");

    return () => socket.disconnect();
  }, []);

  // history
  // - back
  useHotkeys("left", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // - forward
  useHotkeys("right", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // all
  useHotkeys("A", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // left
  useHotkeys("L", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  useHotkeys("shift+L", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  useHotkeys("D", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  useHotkeys("shift+D", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // right
  useHotkeys("R", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  useHotkeys("shift+R", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // neutral
  useHotkeys("N", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  useHotkeys("shift+N", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // negative
  useHotkeys("-", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  useHotkeys("shift+-", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // positive
  useHotkeys("=", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  useHotkeys("shift+=", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // ignore toggle
  useHotkeys("shift+I", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  useHotkeys("shift+X", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // bot toggle
  useHotkeys("shift+B", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);
  // verified toggle
  useHotkeys("shift+V", (event) => handleNodeChange(event, currentNode), {}, [
    currentNode,
  ]);

  const handleChangeSearch = (event) => {
    console.log("handleChangeSearch: " + event.target.value);
    setUserSearch(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.charCode === 13) {
      // enter key pressed
      console.log("ENTER");
      handleSearchNode(userSearch);
    }
  };

  const handleFilterChange = (event) => {
    event.persist();
    setFilterLowFollowersCount(
      filterLowFollowersCountRef.current ? false : true
    );
    console.log(
      `NAME: ${event.target.name} | CHECKED: ${event.target.checked} | filterLowFollowersCount: ${filterLowFollowersCount}`
    );
  };

  const displayTab = (tab) => {
    if (tab === "authUser") {
      return (
        <AuthUserView
          authenticated={twitterAuthenticated}
          authUser={twitterAuthenticatedUser}
          stats={status}
        />
      );
    } else if (tab === "user") {
      return (
        <UserView
          user={currentUser}
          stats={status}
          filterLowFollowersCount={filterLowFollowersCount}
          handleNodeChange={handleNodeChange}
          handleSearchNode={handleSearchNode}
          handleFilterChange={handleFilterChange}
        />
      );
    } else {
      return (
        <HashtagView
          hashtag={currentHashtagRef.current}
          statusHashtag={statusHashtagRef.current}
          stats={statusRef.current}
          tweets={tweetsRef.current}
          handleNodeChange={handleNodeChange}
          handleSearchNode={handleSearchNode}
        />
      );
    }
  };

  return (
    <div className={classes.root}>
      <Container component="main" maxWidth={false}>
        <AppBar className={classes.appBar} position="static">
          <Toolbar className={classes.toolBar}>
            <Typography className={classes.title}>CATEGORIZE</Typography>

            <Tabs
              className={classes.tabs}
              value={tabValue}
              onChange={handleTabChange}
            >
              <Tab className={classes.tab} label="User" />
              <Tab className={classes.tab} label="Hashtag" />
              <Tab className={classes.tab} label="Account" />
            </Tabs>

            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon color="primary" />
              </div>
              <InputBase
                placeholder={
                  currentTab === "user" ? "user search..." : "hashtag search..."
                }
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput,
                }}
                inputProps={{ "aria-label": "search" }}
                value={userSearch}
                onKeyPress={handleKeyPress}
                onChange={handleChangeSearch}
              />
            </div>

            <Typography className={classes.serverStatus}>
              {status.nodesPerMin} NPM ( max: {status.maxNodesPerMin} at{" "}
              {formatDateTime(status.maxNodesPerMinTime)} )
            </Typography>

            {progress !== "idle" ? (
              <>
                <Typography
                  className={classes.progress}
                >{`${progress} ...`}</Typography>{" "}
                <CircularProgress className={classes.progress}>
                  {progress}
                </CircularProgress>
              </>
            ) : (
              <div className={classes.progress}></div>
            )}

            <Link
              className={classes.twitterAuth}
              href={"http://twitter.com/" + twitterAuthenticatedUser.screenName}
              target="_blank"
              rel="noopener"
            >
              {twitterAuthenticatedUser.screenName
                ? "@" + twitterAuthenticatedUser.screenName
                : ""}
            </Link>

            <Button
              className={classes.buttonLogin}
              variant="contained"
              color={twitterAuthenticated ? "secondary" : "primary"}
              size="small"
              onClick={(event) => {
                handleLoginLogout(event);
              }}
              name="login"
              label="login"
            >
              {twitterAuthenticated ? "LOGOUT" : "LOGIN TWITTER"}
            </Button>
          </Toolbar>
        </AppBar>
        {displayTab(currentTab)}
      </Container>
    </div>
  );
};

export default App;
