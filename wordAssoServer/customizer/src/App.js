import React, { useState, useEffect, useRef } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import './App.css';
import SettingsView from './SettingsView.js';
import StatsView from './StatsView.js';

const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
const LOCAL_SOURCE = "http://localhost:9997";
const MBP3_SOURCE = "http://mbp3:3000";

const DEFAULT_SOURCE = PRODUCTION_SOURCE;

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
  useEffect(() => { defaultsRef.current = defaults }, [defaults])

  const [settings, setSettings] = useState(props.settings)
  const settingsRef = useRef(settings)
  useEffect(() => { settingsRef.current = settings }, [settings])

  const [status, setStatus] = useState(props.status)
  const statusRef = useRef(status)
  useEffect(() => { statusRef.current = status }, [status])
  
  const [heartbeat, setHeartbeat] = useState(props.heartbeat)
  const heartbeatRef = useRef(heartbeat)
  useEffect(() => { heartbeatRef.current = heartbeat }, [heartbeat])
  
  const handleTabChange = (event, newValue) => {

    event.preventDefault()
    // console.log({newValue})

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

    let tempSettings = {}

    switch (changeObj.name){

      case "nodeRadiusRatio":
      case "fontSizeRatio":
        if (parentWindow){
          parentWindow.postMessage(
            {
              op: "UPDATE", 
              id: changeObj.name,
              min: changeObj.value[0],
              max: changeObj.value[1]
            }, 
            DEFAULT_SOURCE
          );
        }

        tempSettings = Object.assign({}, settingsRef.current, {[changeObj.name]: { min: changeObj.value[0],  max: changeObj.value[1]}})
        setSettings(tempSettings)
        break

      case "nodeMaxAge":
      case "maxNodesLimit":
      case "charge":
      case "gravity":
      case "velocityDecay":
        if (parentWindow){
          parentWindow.postMessage(
            {
              op: "UPDATE", 
              id: changeObj.name,
              value: changeObj.value,
            }, 
            DEFAULT_SOURCE
          );
        }

        tempSettings = Object.assign({}, settingsRef.current, {[changeObj.name]: changeObj.value})
        setSettings(tempSettings)

        break

      default:
        console.error(`UNKNOWN CHANGE NAME: ${changeObj.name}`)
    }    
  }

  const receiveMessage = (event) => {

    event.preventDefault();

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

    // console.debug("RX MESSAGE | SOURCE"
    //   + " | ORIGIN: " + event.origin 
    //   + " | PARENT WINDOW: " + parentWindow.PARENT_ID
    //   + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
    // );

    switch (event.data.op) {

      case "INIT":
        console.debug("CUSTOMIRZER INIT");

        if (event.data.config && event.data.config.defaults){
          setDefaults(event.data.config.defaults)
          console.log(`defaultsRef.current \n ${defaultsRef.current}`)
        }

        if (event.data.config && event.data.config.settings){
          setSettings(event.data.config.settings)
          console.log(`settingsRef.current \n ${settingsRef.current}`)
        }

        if (event.data.status){
          setStatus(event.data.status)
          console.log(`statusRef.current \n ${statusRef.current}`)
          console.log({statusRef})
        }
      break;

      case "CONFIG":
        if (event.data.config && event.data.config.defaults){
          setDefaults(event.data.config.defaults)
          console.log(`defaultsRef.current \n ${defaultsRef.current}`)
        }

        if (event.data.config && event.data.config.settings){
          setSettings(event.data.config.settings)
          console.log(`settingsRef.current \n ${settingsRef.current}`)
        }
      break;

      case "STATS":
        if (event.data.status) {
          setStatus(event.data.status);
        }
      break;

      case "HEARTBEAT":
        if (event.data.status) {
          setHeartbeat(event.data.status);
        }
      break;

      default:
        console.error(`*** ERROR | UNKNOWN MESSAGE | OP: ${event.data.op}`);
    }
  }

  const displayTab = (tab) => {
    if (tab === "settings"){
      return (
        <SettingsView 
          defaults={defaultsRef.current} 
          settings={settingsRef.current} 
          status={statusRef.current} 
          handleChange={handleChange}
        >
        </SettingsView>
      )
    }
    else{
      return (
        <StatsView 
          heartbeat={heartbeatRef.current} 
        >
        </StatsView>
      )
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