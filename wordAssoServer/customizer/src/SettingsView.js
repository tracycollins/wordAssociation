import React from 'react';
import { grey } from '@material-ui/core/colors';
// import Duration from 'duration';
// import clsx from 'clsx';
// import Card from '@material-ui/core/Card';
// import CardContent from '@material-ui/core/CardContent';
// import CardHeader from '@material-ui/core/CardHeader';
// import CardMedia from '@material-ui/core/CardMedia';
import Checkbox from '@material-ui/core/Checkbox';
// import FilledInput from '@material-ui/core/FilledInput';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Grid from '@material-ui/core/Grid';
// import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
// import InputBase from '@material-ui/core/InputBase';
// import InputAdornment from '@material-ui/core/InputAdornment';

// import FormatAlignLeftIcon from '@material-ui/icons/FormatAlignLeft';
// import FormatAlignCenterIcon from '@material-ui/icons/FormatAlignCenter';
// import FormatAlignRightIcon from '@material-ui/icons/FormatAlignRight';
// import FormatBoldIcon from '@material-ui/icons/FormatBold';
// import FormatItalicIcon from '@material-ui/icons/FormatItalic';
// import FormatUnderlinedIcon from '@material-ui/icons/FormatUnderlined';
// import Divider from '@material-ui/core/Divider';
// import Select from '@material-ui/core/Select';
import Slider from '@material-ui/core/Slider';
// import Table from '@material-ui/core/Table';
// import TableBody from '@material-ui/core/TableBody';
// import TableCell from '@material-ui/core/TableCell';
// import TableContainer from '@material-ui/core/TableContainer';
// import TableHead from '@material-ui/core/TableHead';
// import TableRow from '@material-ui/core/TableRow';
// import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const lightGray = '#202020';
const textLightGray = '#CCCCCC';

const useStyles = makeStyles((theme) => ({
  root: {
    border: 0,
    margin: 0,
    padding: 0,
    flexGrow: 2,
  },
  multilineColor:{
    color: textLightGray
  },
  grid: {
    border: 0,
    display: 'flex',
    // alignItems: 'stretch',
  },
  gridSetting: {
    // border: 0,
    flexFlow: 'column',
    display: 'flex',
    // margin: theme.spacing(1),
    // alignItems: 'flexStart',
  },
  gridItem: {
    background: lightGray,
    border: 0,
    margin: theme.spacing(1),
    padding: theme.spacing(4),
  },
  gridHeader: {
    border: 0,
  },
  paper: {
    color: textLightGray,
    backgroundColor: lightGray,
    // padding: theme.spacing(1),
    outlined: true,
    variant: 'outlined',
  },
  radioGroupCategory: {
    maxWidth: "80%",
    fontSize: '0.5rem',
  },
  checkbox: {
    color: grey[400],
    '&$checked': { color: grey[600],},
  },
  checked: {},
  radioButtonLabel: {
    fontSize: '0.9rem'
  },
  radioButton: {
  },
  range: {
    // width: 'fit-content',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    // backgroundColor: theme.palette.background.paper,
    // color: theme.palette.text.secondary,
    color: textLightGray,
  },
  slider: {
    // margin: theme.spacing(1),
  },
  settingLabel: {
    fontSize: '0.8rem',
    // margin: theme.spacing(1),
    color: textLightGray,
  },
  settingValue: {
    fontSize: '1.5rem',
    // margin: theme.spacing(1),
    color: textLightGray,
  },
  textField: {
    color: textLightGray,
    '& input:valid + fieldset': {
      borderColor: textLightGray,
      // borderWidth: 2,
    }
  },
}));

function valuetext(value) {
  return `${value}`;
}

const Settings = (props) => {
  
  const classes = useStyles();

  const handleChangeSettings = name => (e, value) => {
    // e.preventDefault();
    props.handleChange({name: name, value: value})
  };

  function renderDisplayCheckboxes(){

    const entityTypes = ["tweet", "user", "hashtag", "link"];

    return (
      <FormGroup  align="center">
        <FormControl component="fieldset" className={classes.radioGroupCategory} size="small">
          {
            entityTypes.map((entityType) => (
              <FormControlLabel
                key={`display_${entityType}`}
                control={
                  <Checkbox
                    key={`display_${entityType}`}
                    id={`display_${entityType}`}
                    name={`display_${entityType}`}
                    className={classes.checkbox} 
                    size="small" 
                    checked={props.settings.display[entityType]}
                    onChange={handleChangeSettings(`display_${entityType}`)}
                  />
                }
                label={<Typography key={`display_${entityType}`} className={classes.radioButtonLabel}>{entityType.toUpperCase()}</Typography>}
              />
            ))
          }
        </FormControl>
      </FormGroup>
    )
  }

  return (
    <>
      <Grid className={classes.grid}>

          <Grid item className={classes.gridItem} xs={4}>
            <Paper className={classes.paper} elevation={0} variant="outlined">
              <Typography className={classes.gridHeader}>DISPLAY</Typography>
              {renderDisplayCheckboxes()}
            </Paper>
          </Grid>

          <Grid item className={classes.gridItem} xs={8}>

            <Grid className={classes.gridSetting}>
              <Grid item xs={8}>
                <Typography className={classes.settingLabel}>
                  NODE RADIUS RATIO
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={classes.settingValue}>
                  {`${props.settings.nodeRadiusRatio.min} min | ${props.settings.nodeRadiusRatio.max} max`}
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  className={classes.slider}
                  id="nodeRadiusRatio"
                  name="nodeRadiusRatio"
                  value={[props.settings.nodeRadiusRatio.min, props.settings.nodeRadiusRatio.max]}
                  min={props.defaults.nodeRadiusRatioRange.min}
                  max={props.defaults.nodeRadiusRatioRange.max}
                  step={props.defaults.nodeRadiusRatioRange.step}
                  onChange={handleChangeSettings("nodeRadiusRatio")}
                  valueLabelDisplay="off"
                  aria-labelledby="range-slider"
                  getAriaValueText={valuetext}
                />
              </Grid>
            </Grid>

            <Grid className={classes.gridSetting}>
              <Grid item xs={8}>
                <Typography className={classes.settingLabel}>
                  FONT SIZE RATIO
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={classes.settingValue}>
                  {`${props.settings.fontSizeRatio.min} min | ${props.settings.fontSizeRatio.max} max`}
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  id="fontSizeRatio"
                  name="fontSizeRatio"
                  value={[props.settings.fontSizeRatio.min, props.settings.fontSizeRatio.max]}
                  min={props.defaults.fontSizeRatioRange.min}
                  max={props.defaults.fontSizeRatioRange.max}
                  step={props.defaults.fontSizeRatioRange.step}
                  onChange={handleChangeSettings("fontSizeRatio")}
                  valueLabelDisplay="off"
                  aria-labelledby="range-slider"
                  getAriaValueText={valuetext}
                />
              </Grid>
            </Grid>

            <Grid className={classes.gridSetting}>
              <Grid item xs={8}>
                <Typography className={classes.settingLabel}>
                  MAX NODES
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={classes.settingValue}>
                  {`${props.settings.maxNodesLimit}`}
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  id="maxNodesLimit"
                  name="maxNodesLimit"
                  value={props.settings.maxNodesLimit}
                  min={props.defaults.maxNodesLimitRange.min}
                  max={props.defaults.maxNodesLimitRange.max}
                  step={props.defaults.maxNodesLimitRange.step}
                  onChange={handleChangeSettings("maxNodesLimit")}
                  valueLabelDisplay="off"
                  aria-labelledby="slider"
                  getAriaValueText={valuetext}
                />
              </Grid>
            </Grid>

            <Grid className={classes.gridSetting}>
              <Grid item xs={8}>
                <Typography className={classes.settingLabel} id="nodeMaxAge" name="nodeMaxAge">
                  MAX AGE
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={classes.settingValue} id="nodeMaxAge" name="nodeMaxAge">
                  {`${props.settings.nodeMaxAge/1000} secs`}
                </Typography>  
              </Grid>
              <Grid item xs={8}>
                <Slider
                  className={classes.slider}
                  id="nodeMaxAge"
                  name="nodeMaxAge"
                  value={props.settings.nodeMaxAge}
                  min={props.defaults.nodeMaxAgeRange.min}
                  max={props.defaults.nodeMaxAgeRange.max}
                  step={props.defaults.nodeMaxAgeRange.step}
                  onChange={handleChangeSettings("nodeMaxAge")}
                  valueLabelDisplay="off"
                  aria-labelledby="slider"
                  getAriaValueText={valuetext}
                />
              </Grid>
            </Grid>

            <Grid className={classes.gridSetting}>
              <Grid item xs={8}>
                <Typography className={classes.settingLabel} id="linkStrength" name="linkStrength">
                  LINK STRENGTH
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={classes.settingValue} id="linkStrength" name="linkStrength">
                  {`${props.settings.linkStrength}`}
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  className={classes.slider}
                  id="linkStrength"
                  name="linkStrength"
                  value={props.settings.linkStrength}
                  min={props.defaults.linkStrengthRange.min}
                  max={props.defaults.linkStrengthRange.max}
                  step={props.defaults.linkStrengthRange.step}
                  onChange={handleChangeSettings("linkStrength")}
                  valueLabelDisplay="off"
                  aria-labelledby="slider"
                  getAriaValueText={valuetext}
                />
              </Grid>
            </Grid>
              
            <Grid className={classes.gridSetting}>
              <Grid item xs={8}>
                <Typography className={classes.settingLabel}>
                  LINK DISTANCE
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={classes.settingValue}>
                  {`${props.settings.linkDistance}`}
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  className={classes.slider}
                  id="linkDistance"
                  name="linkDistance"
                  value={props.settings.linkDistance}
                  min={props.defaults.linkDistanceRange.min}
                  max={props.defaults.linkDistanceRange.max}
                  step={props.defaults.linkDistanceRange.step}
                  onChange={handleChangeSettings("linkDistance")}
                  valueLabelDisplay="off"
                  aria-labelledby="slider"
                  getAriaValueText={valuetext}
                />
              </Grid>
            </Grid> 

            <Grid className={classes.gridSetting}>
              <Grid item xs={8}>
                <Typography className={classes.settingLabel}>
                  VELOCITY DECAY
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={classes.settingValue}>
                  {`${props.settings.velocityDecay}`}
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  className={classes.slider}
                  id="velocityDecay"
                  name="velocityDecay"
                  value={props.settings.velocityDecay}
                  min={props.defaults.velocityDecayRange.min}
                  max={props.defaults.velocityDecayRange.max}
                  step={props.defaults.velocityDecayRange.step}
                  onChange={handleChangeSettings("velocityDecay")}
                  valueLabelDisplay="off"
                  aria-labelledby="slider"
                  getAriaValueText={valuetext}
                />
              </Grid>
            </Grid> 

            <Grid className={classes.gridSetting}>
              <Grid item xs={8}>
                <Typography className={classes.settingLabel}>
                  CHARGE
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={classes.settingValue}>
                  {`${props.settings.charge}`}
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  className={classes.slider}
                  id="charge"
                  name="charge"
                  value={props.settings.charge}
                  min={props.defaults.chargeRange.min}
                  max={props.defaults.chargeRange.max}
                  step={props.defaults.chargeRange.step}
                  onChange={handleChangeSettings("charge")}
                  valueLabelDisplay="off"
                  aria-labelledby="slider"
                  getAriaValueText={valuetext}
                />
              </Grid>
            </Grid> 

            <Grid className={classes.gridSetting}>
              <Grid item xs={8}>
                <Typography className={classes.settingLabel}>
                  GRAVITY
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={classes.settingValue}>
                  {`${props.settings.gravity}`}
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  className={classes.slider}
                  id="gravity"
                  name="gravity"
                  value={props.settings.gravity}
                  min={props.defaults.gravityRange.min}
                  max={props.defaults.gravityRange.max}
                  step={props.defaults.gravityRange.step}
                  onChange={handleChangeSettings("gravity")}
                  valueLabelDisplay="off"
                  aria-labelledby="slider"
                  getAriaValueText={valuetext}
                />
              </Grid>
            </Grid> 

          </Grid>
          
        </Grid>
    </>
  );
}

export default Settings;
