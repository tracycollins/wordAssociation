import React, { useState, useEffect, useRef } from 'react';
// import { green, grey } from '@material-ui/core/colors';

// import { useHistory, useLocation } from "react-router-dom";
// import { useHotkeys } from 'react-hotkeys-hook';
// import socketClient from "socket.io-client";
import { makeStyles } from '@material-ui/core/styles';

import Container from '@material-ui/core/Container';
import AppBar from '@material-ui/core/AppBar';
// import CircularProgress from '@material-ui/core/CircularProgress';
// import Button from '@material-ui/core/Button';

// import InputBase from '@material-ui/core/InputBase';
// import Link from '@material-ui/core/Link';
// import SearchIcon from '@material-ui/icons/Search';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import './App.css';
import SettingsView from './SettingsView.js';
import StatsView from './StatsView.js';

// const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
const LOCAL_SOURCE = "http://localhost:9997";

const DEFAULT_SOURCE = LOCAL_SOURCE;

const parentWindow = window.opener;

console.log({parentWindow})

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    flexGrow: 1,
    background: 'black',
    boxShadow: 0,
  },
  appBar: {
    backgroundColor: 'black',
    marginBottom: theme.spacing(2),
    boxShadow: 0,
  },
  tabs: {
    color: 'white',
  },
  tab: {
    minWidth: 100,
    width: 100,
  },
  toolBar: {
    shadows: 0,
  },
  title: {
    // flexGrow: 1,
    color: 'white',
    marginRight: theme.spacing(2),
  },
  serverStatus: {
    fontSize: "0.85rem",
    flexGrow: 1,
    color: 'lightgray',
    padding: theme.spacing(1),
  },
  statusBar: {
    backgroundColor: 'white',
    margin: 2,
  },
  menuButton: {
    marginRight: theme.spacing(2),
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

}))

const App = (props) => {

  const classes = useStyles()

  const [tabValue, setTabValue] = useState(0)
 
  const [currentTab, setCurrentTab] = useState("settings")
  const currentTabRef = useRef(currentTab)
  useEffect(() => { 
    currentTabRef.current = currentTab 
  }, [currentTab])

  const [defaults, setDefaults] = useState(props.defaults)
  const defaultsRef = useRef(defaults)
  useEffect(() => { 
    defaultsRef.current = defaults 
  }, [defaults])

  const [settings, setSettings] = useState(props.settings)
  const settingsRef = useRef(settings)
  useEffect(() => { 
    settingsRef.current = settings 
  }, [settings])

  const [status, setStatus] = useState({})
  const statusRef = useRef(status)
  useEffect(() => { 
    statusRef.current = status 
  }, [status])
  
  const handleTabChange = (event, newValue) => {

    event.preventDefault()
    console.log({newValue})

    switch (newValue){
      case 0:
        setCurrentTab("settings")
        break
      case 1:
        setCurrentTab("stats")
        break
      default:
        setCurrentTab("settings")
    }

    setTabValue(newValue)
  }

  const handleChange = (changeObj) => {
    console.log({changeObj})

    switch (changeObj.name){
      case "nodeRadiusRatioRange":
        if (parentWindow){
          parentWindow.postMessage(
            {
              op: "UPDATE", 
              id: "nodeRadiusRatioRange",
              min: changeObj.value[0],
              max: changeObj.value[1]
            }, 
            DEFAULT_SOURCE
          );
        }
        break
      default:
        console.error(`UNKNOWN CHANGE NAME: ${changeObj.name}`)
    }    
  }

  const displayTab = (tab) => {
    if (tab === "settings"){
      return (
        <SettingsView 
          defaults={defaultsRef.current} 
          settings={settingsRef.current} 
          stats={statusRef.current} 
          handleChange={handleChange}
        >
        </SettingsView>
      )
    }
    else{
      return <StatsView settings={settings} stats={status} />
    }
  }

  const receiveMessage = (event) => {

    // Do we trust the sender of this message?

    if (event.origin !== DEFAULT_SOURCE){
      console.error("RX MESSAGE | NOT TRUSTED SOURCE"
        + " | ORIGIN: " + event.origin 
        + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
      );
      return;
    }

    if (event.data.op === undefined){
      return;
    }

    console.debug("RX MESSAGE | SOURCE"
      + " | ORIGIN: " + event.origin 
      + " | PARENT WINDOW: " + parentWindow.PARENT_ID
      + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
    );

    switch (event.data.op) {

      case "INIT":

        if (event.data.defaults && event.data.defaults !== undefined){
          setDefaults(event.data.defaults)
          console.debug("CUSTOMIRZER INIT");
          console.log(`defaultsRef.current \n ${(defaultsRef.current)}`)
        }


      break;

      case "STATS":
        if (event.data.stats && event.data.stats !== undefined) {
          setStatus(event.data.stats);
        }
      break;

      default:
        console.error(`*** ERROR | UNKNOWN MESSAGE | OP: ${event.data.op}`);
    }
  }

  window.addEventListener("message", receiveMessage, false);

  return (
    <div className={classes.root}>
      <Container component="main" maxWidth={false}>
        <AppBar  className={classes.appBar} position="static">
          <Toolbar className={classes.toolBar}>

            <Typography className={classes.title}>
              CUSTOMIZE
            </Typography>
            
            <Tabs 
              className={classes.tabs}
              value={tabValue} 
              onChange={handleTabChange}
            >
              <Tab className={classes.tab} label="Settings"/>
              <Tab className={classes.tab} label="Stats"/>
            </Tabs>

          </Toolbar>
        </AppBar>
        {displayTab(currentTab)}
      </Container>
    </div>
  )
}

export default App;