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
    border: 0,
    flexGrow: 2,
  },
  appBar: {
    border: 0,
    backgroundColor: 'white',
    marginBottom: theme.spacing(1),
  },
  grid: {
    border: 0,
    display: 'flex',
    alignItems: 'stretch',
  },
  gridItem: {
    border: 0,
    margin: theme.spacing(1),
  },
  gridHeader: {
    padding: theme.spacing(1),
    border: 0,
    marginBottom: theme.spacing(1),
  },
  paper: {
    outlined: true,
    variant: 'outlined',
  },
  card: {
    alignSelf: "center",
  },
  profileImage: {
    marginBottom: theme.spacing(1),
  },
  bannerImage: {
    marginBottom: theme.spacing(1),
  },
  icon: {
    borderRadius: '50%',
    width: 16,
    height: 16,
    boxShadow: 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
    backgroundColor: '#f5f8fa',
    backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))',
    '$root.Mui-focusVisible &': {
      outline: '2px auto rgba(19,124,189,.6)',
      outlineOffset: 2,
    },
    'input:hover ~ &': {
      backgroundColor: '#ebf1f5',
    },
    'input:disabled ~ &': {
      boxShadow: 'none',
      background: 'rgba(206,217,224,.5)',
    },
  },
  checkedIcon: {
    backgroundColor: '#137cbd',
    backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
    '&:before': {
      display: 'block',
      width: 16,
      height: 16,
      backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)',
      content: '""',
    },
    'input:hover ~ &': {
      backgroundColor: '#106ba3',
    },
  },
  selectCategory: {
    fontSize: '0.9rem',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  radioGroupCategory: {
    maxWidth: "90%",
    fontSize: '0.5rem',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  checkbox: {
    color: green[400],
    '&$checked': {
      color: green[600],
    },
  },
  checked: {},
  radioButtonLabel: {
    fontSize: '0.9rem'
  },
  radioButton: {
  },
  table: {
    maxWidth: "90%",
    padding: theme.spacing(1),
  },
  tableHead: {
    backgroundColor: '#ddeeee',
  },
  tableCell: {
  },
  tableCategorized: {
    backgroundColor: '#ddeeee',
  },
  tableRowGreen: {
    backgroundColor: 'lightgreen',
  },
  statusBar: {
    raised: false,
    backgroundColor: 'white',
    margin: 2,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    color: 'blue',
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "#ddeeee",
    },
    marginRight: theme.spacing(1),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
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

  buttonGroupLabel: {
    color: 'blue',
    marginRight: theme.spacing(1),
  },
  buttonAll: {
    color: 'black',
  },
  buttonLeft: {
    color: 'blue',
  },
  buttonNeutral: {
    color: 'gray',
  },
  buttonRight: {
    color: 'red',
  },
  buttonMismatch: {
    margin: 5
  },
  autoCategory:{
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
    marginBottom: theme.spacing(1),
  },
  category: {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },

  left: {
    backgroundColor: 'blue',
    color: 'white',
  },
  neutral: {
    backgroundColor: 'darkgray',
    color: 'white',
  },
  right: {
    backgroundColor: 'red',
    color: 'white',
  },
  positive: {
    backgroundColor: 'green',
    color: 'white',
  },
  negative: {
    backgroundColor: 'yellow',
    color: 'black',
  },
  none: {
    backgroundColor: 'lightgray',
    color: 'black',
  },
  ignored: {
    backgroundColor: 'yellow',
    color: 'black',
  },

}));

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