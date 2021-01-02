import React, { useState } from 'react';
// import React from 'react';
// import { green } from '@material-ui/core/colors';
// import clsx from 'clsx';

// import Duration from 'duration';

// import AppBar from '@material-ui/core/AppBar';
// import Button from '@material-ui/core/Button';
// import ButtonGroup from '@material-ui/core/ButtonGroup';
// import Card from '@material-ui/core/Card';
// import CardActionArea from '@material-ui/core/CardActionArea';
// import CardActions from '@material-ui/core/CardActions';
// import CardContent from '@material-ui/core/CardContent';
// import CardHeader from '@material-ui/core/CardHeader';
// import CardMedia from '@material-ui/core/CardMedia';
// import CheckBoxIcon from '@material-ui/icons/CheckBox';
// import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
// import Checkbox from '@material-ui/core/Checkbox';
// import FormControl from '@material-ui/core/FormControl';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import FormGroup from '@material-ui/core/FormGroup';
// import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
// import IconButton from '@material-ui/core/IconButton';
// import InputBase from '@material-ui/core/InputBase';
// import InputLabel from '@material-ui/core/InputLabel';
// import MenuItem from '@material-ui/core/MenuItem';
// import MenuIcon from '@material-ui/icons/Menu';
// import Paper from '@material-ui/core/Paper';
// import Radio from '@material-ui/core/Radio';
// import RadioGroup from '@material-ui/core/RadioGroup';
// import SearchIcon from '@material-ui/icons/Search';
// import Select from '@material-ui/core/Select';
import Slider from '@material-ui/core/Slider';
// import Table from '@material-ui/core/Table';
// import TableBody from '@material-ui/core/TableBody';
// import TableCell from '@material-ui/core/TableCell';
// import TableContainer from '@material-ui/core/TableContainer';
// import TableHead from '@material-ui/core/TableHead';
// import TableRow from '@material-ui/core/TableRow';
// import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    border: 0,
    flexGrow: 2,
  },
  range: {
    color: 'white',
  }
}));

function valuetext(value) {
  return `${value}°C`;
}

const Settings = (props) => {
  
  const classes = useStyles();

  const defaultSettingsState = {
    nodeRadiusRatio : [
      props.settings.nodeRadiusRatio.min, 
      props.settings.nodeRadiusRatio.max
    ],
    fontSizeRatio : [
      props.settings.fontSizeRatio.min, 
      props.settings.fontSizeRatio.max
    ],
    metricMode: "rate",
    ageNodes: true,
    autoCategoryFlag: false,
    testMode: false,
    pause: false,
    charge: props.settings.charge,
    gravity: props.settings.gravity,
    velocityDecay: props.settings.velocityDecay,
    maxNodesLimit: props.settings.maxNodesLimit,
    nodeMaxAge: props.settings.nodeMaxAge,
  }

  const [settings, setSettings] = useState(defaultSettingsState);

  const handleChangeSettings = name => (e, value) => {
    // event.preventDefault();
    setSettings(prevState => ({...prevState, [name]: value}));
    props.handleChange({name: name, value: value})
  };

  // const [nodeRadiusRatio, setNodeRadiusRatio] = React.useState(
  //   [
  //     props.settings.nodeRadiusRatio.min, 
  //     props.settings.nodeRadiusRatio.max
  //   ]
  // );
  // const handleChangeNodeSize = (event, newNodeRadiusRatio) => {
  //   setNodeRadiusRatio(newNodeRadiusRatio);
  //   props.handleChange({name: "nodeRadiusRatio", value: newNodeRadiusRatio})
  // };

  // const [fontSizeRatio, setFontSizeRatio] = React.useState(
  //   [
  //     props.settings.fontSizeRatio.min, 
  //     props.settings.fontSizeRatio.max
  //   ]
  // );
  // const handleChangeFontSize = (event, newFontSizeRatio) => {
  //   setFontSizeRatio(newFontSizeRatio);
  //   props.handleChange({name: "fontSizeRatio", value: newFontSizeRatio})
  // };

  // const propertiesSelect = [    
  //   "metricMode",
  // ]

  // const propertiesRange = [    
  //   "nodeRadiusRatio",
  //   "fontSizeRatio",
  // ]

  // const propertiesBoolean = [
  //   "ageNodes",
  //   "autoCategoryFlag",
  //   "testMode",
  //   "pause",
  // ]

  // const propertiesMoment = [
  //   "reset",
  //   "resetDefaultForce",
  // ]

  // const propertiesScalar = [
  //   "charge",
  //   "gravity",
  //   "maxAgeRate",
  //   "maxNodesLimit",
  //   "nodeMaxAge",
  //   "velocityDecay",
  // ]

  // const [charge, setCharge] = React.useState(props.settings.charge);
  // const handleChangeCharge = (event, newCharge) => {
  //   setCharge(newCharge);
  //   props.handleChange({name: "charge", value: newCharge})
  // };

  // const [gravity, setGravity] = React.useState(props.settings.gravity);
  // const handleChangeGravity = (event, newGravity) => {
  //   setGravity(newGravity);
  //   props.handleChange({name: "gravity", value: newGravity})
  // };

  // const [velocityDecay, setVelocityDecay] = React.useState(props.settings.velocityDecay);
  // const handleChangeVelocityDecay = (event, newVelocityDecay) => {
  //   setVelocityDecay(newVelocityDecay);
  //   props.handleChange({name: "velocityDecay", value: newVelocityDecay})
  // };

  return (
    <>
      <Grid className={classes.grid}>
          <Grid item className={classes.gridItem} xs={3}>

            <Typography className={classes.range} id="nodeRadiusRatio" name="nodeRadiusRatio" gutterBottom>
              NODE RADIUS RATIO min/max
            </Typography>
            <Slider
              id="nodeRadiusRatio"
              name="nodeRadiusRatio"
              value={settings.nodeRadiusRatio}
              min={props.defaults.nodeRadiusRatioRange.min}
              max={props.defaults.nodeRadiusRatioRange.max}
              step={props.defaults.nodeRadiusRatioRange.step}
              onChange={handleChangeSettings("nodeRadiusRatio")}
              valueLabelDisplay="auto"
              aria-labelledby="range-slider"
              getAriaValueText={valuetext}
            />

            <Typography className={classes.range} id="fontSizeRatio" name="fontSizeRatio" gutterBottom>
              FONT SIZE RATIO min/max
            </Typography>
            <Slider
              id="fontSizeRatio"
              name="fontSizeRatio"
              value={settings.fontSizeRatio}
              min={props.defaults.fontSizeRatioRange.min}
              max={props.defaults.fontSizeRatioRange.max}
              step={props.defaults.fontSizeRatioRange.step}
              onChange={handleChangeSettings("fontSizeRatio")}
              valueLabelDisplay="auto"
              aria-labelledby="range-slider"
              getAriaValueText={valuetext}
            />

            <Typography className={classes.range} id="setMaxNodesLimit" name="setMaxNodesLimit" gutterBottom>
              MAX NODES
            </Typography>
            <Slider
              id="maxNodesLimit"
              name="maxNodesLimit"
              value={settings.maxNodesLimit}
              min={props.defaults.maxNodesLimitRange.min}
              max={props.defaults.maxNodesLimitRange.max}
              step={props.defaults.maxNodesLimitRange.step}
              onChange={handleChangeSettings("maxNodesLimit")}
              valueLabelDisplay="auto"
              aria-labelledby="slider"
              getAriaValueText={valuetext}
            />

            <Typography className={classes.range} id="velocityDecay" name="velocityDecay" gutterBottom>
              VELOCITY DECAY
            </Typography>
            <Slider
              id="velocityDecay"
              name="velocityDecay"
              value={settings.velocityDecay}
              min={props.defaults.velocityDecayRange.min}
              max={props.defaults.velocityDecayRange.max}
              step={props.defaults.velocityDecayRange.step}
              onChange={handleChangeSettings("velocityDecay")}
              valueLabelDisplay="auto"
              aria-labelledby="slider"
              getAriaValueText={valuetext}
            />

            <Typography className={classes.range} id="charge" name="charge" gutterBottom>
              CHARGE
            </Typography>
            <Slider
              id="charge"
              name="charge"
              value={settings.charge}
              min={props.defaults.chargeRange.min}
              max={props.defaults.chargeRange.max}
              step={props.defaults.chargeRange.step}
              onChange={handleChangeSettings("charge")}
              valueLabelDisplay="auto"
              aria-labelledby="slider"
              getAriaValueText={valuetext}
            />

            <Typography className={classes.range} id="gravity" name="gravity" gutterBottom>
              GRAVITY
            </Typography>
            <Slider
              id="gravity"
              name="gravity"
              value={settings.gravity}
              min={props.defaults.gravityRange.min}
              max={props.defaults.gravityRange.max}
              step={props.defaults.gravityRange.step}
              onChange={handleChangeSettings("gravity")}
              valueLabelDisplay="auto"
              aria-labelledby="slider"
              getAriaValueText={valuetext}
            />

          </Grid>
        </Grid>
    </>
  );
}

export default Settings;
