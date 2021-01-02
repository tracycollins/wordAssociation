import React from 'react';
import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';
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
  return `${value}`;
}

const Settings = (props) => {
  
  const classes = useStyles();

  const handleChangeSettings = name => (e, value) => {
    e.preventDefault();
    props.handleChange({name: name, value: value})
  };

  return (
    <>
      <Grid className={classes.grid}>
          <Grid item className={classes.gridItem} xs={3}>

            <Typography className={classes.range} id="nodeRadiusRatio" name="nodeRadiusRatio" gutterBottom>
              {`NODE RADIUS RATIO ${props.defaults.nodeRadiusRatio.min} min/ ${props.defaults.nodeRadiusRatio.max} max`}
            </Typography>
            <Slider
              id="nodeRadiusRatio"
              name="nodeRadiusRatio"
              value={[props.settings.nodeRadiusRatio.min, props.settings.nodeRadiusRatio.max]}
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
              value={[props.settings.fontSizeRatio.min, props.settings.fontSizeRatio.max]}
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
              value={props.settings.maxNodesLimit}
              min={props.defaults.maxNodesLimitRange.min}
              max={props.defaults.maxNodesLimitRange.max}
              step={props.defaults.maxNodesLimitRange.step}
              onChange={handleChangeSettings("maxNodesLimit")}
              valueLabelDisplay="auto"
              aria-labelledby="slider"
              getAriaValueText={valuetext}
            />

            <Typography className={classes.range} id="nodeMaxAge" name="nodeMaxAge" gutterBottom>
              MAX AGE (seconds)
            </Typography>
            <Slider
              id="nodeMaxAge"
              name="nodeMaxAge"
              value={props.settings.nodeMaxAge}
              min={props.defaults.nodeMaxAgeRange.min}
              max={props.defaults.nodeMaxAgeRange.max}
              step={props.defaults.nodeMaxAgeRange.step}
              onChange={handleChangeSettings("nodeMaxAge")}
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
              value={props.settings.velocityDecay}
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
              value={props.settings.charge}
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
              value={props.settings.gravity}
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
