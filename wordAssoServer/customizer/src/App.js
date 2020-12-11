import React, { useState, useEffect, useCallback, useRef } from 'react';
import { green, grey } from '@material-ui/core/colors';

import { useHistory, useLocation } from "react-router-dom";
import { useHotkeys } from 'react-hotkeys-hook';
import socketClient from "socket.io-client";
import { makeStyles } from '@material-ui/core/styles';

import Container from '@material-ui/core/Container';
import AppBar from '@material-ui/core/AppBar';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';

import InputBase from '@material-ui/core/InputBase';
import Link from '@material-ui/core/Link';
import SearchIcon from '@material-ui/icons/Search';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import './App.css';
import SettingsView from './SettingsView.js';
import StatsView from './StatsView.js';

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    flexGrow: 1,
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
  progress: {
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
  twitterAuth: {
    // backgroundColor: 'black',
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "green",
    padding: theme.spacing(1),
    marginRight: theme.spacing(2),
  },  
  buttonLogin: {
    // backgroundColor: "green",
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
    // flexGrow: 1,
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "lightgray",
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '20%',
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

}))

const App = () => {

  const classes = useStyles()

  const [tabValue, setTabValue] = useState(0)

  const [settings, setSettings] = useState({})
  const settingsRef = useRef(settings)

  const [status, setStatus] = useState({})
  const statusRef = useRef(status)

  const [progress, setProgress] = useState("loading ...")

  const [currentTab, setCurrentTab] = useState("settings")
  const currentTabRef = useRef(currentTab)
  
  useEffect(() => { 
    currentTabRef.current = currentTab 
  }, [currentTab])
  
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

  const displayTab = (tab) => {
    if (tab === "settings"){
      return <SettingsView settings={settings} stats={status}/>
    }
    else{
      return <StatsView settings={settings} stats={status} />
    }
  }

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