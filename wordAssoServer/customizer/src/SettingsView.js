// import React, { useState } from 'react';
import React from 'react';
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

  const [nodeRadiusRatio, setNodeRadiusRatio] = React.useState(
    [
      props.settings.nodeRadiusRatio.min, 
      props.settings.nodeRadiusRatio.max
    ]
  );
  const handleChangeNodeSize = (event, newNodeRadiusRatio) => {
    // console.log({newNodeRadiusRatio})
    setNodeRadiusRatio(newNodeRadiusRatio);
    props.handleChange({name: "nodeRadiusRatio", value: newNodeRadiusRatio})
  };

  // const [nodeRadiusRatioRange, setNodeRadiusRatioRange] = React.useState(
  //   [
  //     props.settings.nodeRadiusRatioRange.min, 
  //     props.settings.nodeRadiusRatioRange.max
  //   ]
  // );

  const [velocityDecay, setVelocityDecay] = React.useState(props.settings.velocityDecay);
  const handleChangeVelocityDecay = (event, newVelocityDecay) => {
    // console.log({newVelocityDecay})
    setVelocityDecay(newVelocityDecay);
    props.handleChange({name: "velocityDecay", value: newVelocityDecay})
  };

  return (
    <>
      <Grid className={classes.grid}>
          <Grid item className={classes.gridItem} xs={3}>
            <Typography className={classes.range} id="nodeRadiusRatio" gutterBottom>
              NODE RADIUS RATIO min/max
            </Typography>
            <Slider
              id="nodeRadiusRatio"
              name="nodeRadiusRatio"
              value={nodeRadiusRatio}
              min={props.defaults.nodeRadiusRatioRange.min}
              max={props.defaults.nodeRadiusRatioRange.max}
              step={props.defaults.nodeRadiusRatioRange.step}
              onChange={handleChangeNodeSize}
              valueLabelDisplay="auto"
              aria-labelledby="range-slider"
              getAriaValueText={valuetext}
            />          
            <Typography className={classes.range} id="velocityDecay" gutterBottom>
              VELOCITY DECAY
            </Typography>
            <Slider
              id="velocityDecay"
              name="velocityDecay"
              value={velocityDecay}
              min={0.0}
              max={1.0}
              step={0.01}
              onChange={handleChangeVelocityDecay}
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
