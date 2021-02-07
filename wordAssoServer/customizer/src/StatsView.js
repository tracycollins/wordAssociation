import React from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

// import clsx from 'clsx';
import { grey } from '@material-ui/core/colors';

import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
// import CardMedia from '@material-ui/core/CardMedia';

import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
// import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
// import TableCell from '@material-ui/core/TableCell';
// import TableRow from '@material-ui/core/TableRow';

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
  gridSubSetting: {
    // border: 0,
    flexFlow: 'row',
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
  sectionLabel: {
    fontSize: '1.4rem',
    fontWeight: '400',
    color: textLightGray,
    marginBottom: theme.spacing(2),
  },
  settingLabel: {
    fontSize: '0.8rem',
    color: textLightGray,
  },
  settingValue: {
    fontSize: '1.8rem',
    marginBottom: theme.spacing(2),
    color: textLightGray,
  },
  settingValueSmall: {
    fontSize: '1.0rem',
    marginBottom: theme.spacing(2),
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


function LinearProgressWithLabel(props) {
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(
          props.value,
        )}`}</Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";

const elapsed = (m) => {
  return moment.duration(moment().diff(m))
}

const Stats = (props) => {

  console.log(props)
  
  const classes = useStyles();

  return (
    <>
      <Grid className={classes.grid}>

        <Grid item className={classes.gridItem} xs={4}>
          <Grid className={classes.gridSetting}>
            <Typography className={classes.sectionLabel}>
              BEST NEURAL NETWORK
            </Typography>
            <Typography className={classes.settingLabel}>
              NETWORK ID
            </Typography>
            <Grid item xs={8}>
              <Typography className={classes.settingValue}>
                {props.heartbeat.bestNetwork.networkId || '---'}
              </Typography>
            </Grid>
            <Typography className={classes.settingLabel}>
              INPUTS ID
            </Typography>
            <Grid item xs={8}>
              <Typography className={classes.settingValueSmall}>
                {props.heartbeat.bestNetwork.inputsId || '---'}
              </Typography>
            </Grid>

            <Grid className={classes.gridSubSetting}>
              <Grid item xs={4}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    LIVE RATE
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue}>
                    {`${props.heartbeat.bestNetwork.runtimeMatchRate.toFixed(2)}%`}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={6}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    SUCCESS RATE
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue}>
                    {`${props.heartbeat.bestNetwork.successRate.toFixed(2)}%`}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

        </Grid>

        <Grid item className={classes.gridItem} xs={4}>

          <Grid className={classes.gridSetting}>
            <Typography className={classes.sectionLabel}>
              TWITTER
            </Typography>

            <Grid className={classes.gridSubSetting}>

              <Grid item xs={4}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    TWEETS
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue}>
                    {props.heartbeat.twitter.tweetsReceived}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={4}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    PER MIN
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue}>
                    {props.heartbeat.twitter.tweetsPerMin}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={6}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    MAX
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue} margin={0}>
                    {props.heartbeat.twitter.maxTweetsPerMin}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography className={classes.settingLabel}>
                    {`${moment(props.heartbeat.twitter.maxTweetsPerMinTime).format(defaultDateTimeFormat)}`}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography className={classes.settingLabel}>
                    {`${elapsed(moment(props.heartbeat.twitter.maxTweetsPerMinTime)).as('days').toFixed(1)} DAYS AGO`}
                  </Typography>
                </Grid>
              </Grid>

            </Grid>
          </Grid>
        </Grid>

        <Grid item className={classes.gridItem} xs={4}>

          <Grid className={classes.gridSetting}>
            <Typography className={classes.sectionLabel}>
              NODES
            </Typography>

            <Grid className={classes.gridSubSetting}>

              <Grid item xs={4}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    RCVD
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue}>
                    {props.heartbeat.nodeCount}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={4}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    PER MIN
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue}>
                    {props.heartbeat.nodesPerMin}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={6}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    MAX
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue} margin={0}>
                    {props.heartbeat.maxNodesPerMin}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography className={classes.settingLabel}>
                    {`${moment(props.heartbeat.maxNodesPerMinTime).format(defaultDateTimeFormat)}`}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography className={classes.settingLabel}>
                    {`${elapsed(moment(props.heartbeat.maxNodesPerMinTime)).as('days').toFixed(1)} DAYS AGO`}
                  </Typography>
                </Grid>
              </Grid>

            </Grid>
          </Grid>
        </Grid>

{/* 
        <Grid item className={classes.gridItem} xs={4}>
          <Card className={classes.card} variant="outlined">
            <CardContent >
              <Typography variant="h6" id="nodes" name="nodes" gutterBottom>
                NODES
              </Typography>

              <Typography className={classes.range} id="nodeCount" name="nodeCount" gutterBottom>
                <span><b>{props.heartbeat.nodeCount}</b> NODES</span>
              </Typography>
              <Typography className={classes.range} id="nodesPerMin" name="nodesPerMin" gutterBottom>
                <span><b>{props.heartbeat.nodesPerMin}</b> NODES/MIN</span>
              </Typography>
              <Typography className={classes.range} id="maxNodesPerMin" name="maxNodesPerMin" gutterBottom>
                <span><b>{props.heartbeat.maxNodesPerMin}</b> MAX NODES/MIN</span>
              </Typography>

              <LinearProgressWithLabel 
                variant="determinate" 
                value={props.heartbeat.nodesPerMin && props.heartbeat.maxNodesPerMin ? (100.0 * props.heartbeat.nodesPerMin / props.heartbeat.maxNodesPerMin) : 0}
              >
              </LinearProgressWithLabel>
            </CardContent>
          </Card>
        </Grid> */}

      </Grid>
    </>
  );
}

export default Stats;
