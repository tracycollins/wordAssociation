import React, { useState, useEffect, useCallback, useRef } from 'react';

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

const App = () => {

  const classes = useStyles()

  const [tabValue, setTabValue] = useState(0)

  const [status, setStatus] = useState(defaultStatus)
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