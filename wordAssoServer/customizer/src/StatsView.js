import React from "react";
import PropTypes from "prop-types";

import moment from "moment";
import { grey } from "@material-ui/core/colors";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

const lightGray = "#202020";
const textLightGray = "#CCCCCC";

const ONE_KB = 1024;
const ONE_MB = 1024 * ONE_KB;
const ONE_GB = 1024 * ONE_MB;

const useStyles = makeStyles((theme) => ({
  root: {
    border: 0,
    margin: 0,
    padding: 0,
    flexGrow: 2,
  },
  multilineColor: {
    color: textLightGray,
  },
  grid: {
    border: 0,
    display: "flex",
  },
  gridSetting: {
    flexFlow: "column",
    display: "flex",
  },
  gridSubSetting: {
    flexFlow: "row",
    display: "flex",
    marginBottom: theme.spacing(2),
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
    outlined: true,
    variant: "outlined",
  },
  radioGroupCategory: {
    maxWidth: "80%",
    fontSize: "0.5rem",
  },
  checkbox: {
    color: grey[400],
    "&$checked": { color: grey[600] },
  },
  checked: {},
  radioButtonLabel: {
    fontSize: "0.9rem",
  },
  radioButton: {},
  range: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    color: textLightGray,
  },
  slider: {},
  sectionLabel: {
    fontSize: "1.2rem",
    fontWeight: "400",
    color: textLightGray,
    marginBottom: theme.spacing(2),
  },
  settingLabel: {
    fontSize: "0.8rem",
    color: textLightGray,
  },
  settingValue: {
    fontSize: "1.2rem",
    marginBottom: theme.spacing(2),
    color: textLightGray,
  },
  settingValueSmall: {
    fontSize: "1.0rem",
    marginBottom: theme.spacing(2),
    color: textLightGray,
  },
  progress: {
    color: textLightGray,
  },
  textField: {
    color: textLightGray,
    "& input:valid + fieldset": {
      borderColor: textLightGray,
    },
  },
}));

function LinearProgressWithLabel(props) {
  const classes = useStyles();
  return (
    <Box display="flex" alignItems="center" className={classes.progress}>
      <Box width="90%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography>{`${Math.round(props.value)}% MAX`}</Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";

const elapsed = (m) => {
  return moment.duration(moment().diff(m));
};

const Stats = (props) => {
  console.log(props);

  const classes = useStyles();
  // memory: MemoryInfo jsHeapSizeLimit: 2172649472 totalJSHeapSize: 19348658
  // usedJSHeapSize: 18244770

  const totalJSHeapSize =
    props.heartbeat &&
    props.heartbeat.memory &&
    props.heartbeat.memory.totalJSHeapSize
      ? props.heartbeat.memory.totalJSHeapSize / ONE_MB
      : 0;

  const jsHeapSizeLimit =
    props.heartbeat &&
    props.heartbeat.memory &&
    props.heartbeat.memory.jsHeapSizeLimit
      ? props.heartbeat.memory.jsHeapSizeLimit / ONE_MB
      : 0;

  const heapUsedPercent =
    jsHeapSizeLimit > 0 ? (100 * totalJSHeapSize) / jsHeapSizeLimit : 0;

  const heapMax =
    props.heartbeat && props.heartbeat.memory && props.heartbeat.memory.heapMax
      ? props.heartbeat.memory.heapMax / ONE_MB
      : 0;

  return (
    <>
      <Grid className={classes.grid}>
        <Grid item className={classes.gridItem} xs={4}>
          <Grid className={classes.gridSetting}>
            <Typography className={classes.sectionLabel}>
              CLIENT HEAP
            </Typography>

            <Grid className={classes.gridSubSetting}>
              <Grid item xs={4}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    USED (%)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue}>
                    {heapUsedPercent.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={4}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    USED (B)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue}>
                    {totalJSHeapSize.toFixed(3)}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={6}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>
                    LIMIT
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue} margin={0}>
                    {jsHeapSizeLimit.toFixed(3)}
                  </Typography>
                </Grid>
              </Grid>
              <Grid item xs={6}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>MAX</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue} margin={0}>
                    {heapMax.toFixed(3)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            <LinearProgressWithLabel
              className={classes.progress}
              variant="determinate"
              value={heapUsedPercent}
            ></LinearProgressWithLabel>
          </Grid>
        </Grid>
        <Grid item className={classes.gridItem} xs={4}>
          <Grid className={classes.gridSetting}>
            <Typography className={classes.sectionLabel}>
              BEST NEURAL NETWORK
            </Typography>
            <Typography className={classes.settingLabel}>NETWORK ID</Typography>
            <Grid item xs={8}>
              <Typography className={classes.settingValue}>
                {props.heartbeat.bestNetwork.networkId || "---"}
              </Typography>
            </Grid>
            <Typography className={classes.settingLabel}>INPUTS ID</Typography>
            <Grid item xs={8}>
              <Typography className={classes.settingValueSmall}>
                {props.heartbeat.bestNetwork.inputsId || "---"}
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
                    {`${props.heartbeat.bestNetwork.runtimeMatchRate.toFixed(
                      2
                    )}%`}
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
            <Typography className={classes.sectionLabel}>TWITTER</Typography>

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
                  <Typography className={classes.settingLabel}>MAX</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue} margin={0}>
                    {props.heartbeat.twitter.maxTweetsPerMin}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography className={classes.settingLabel}>
                    {`${moment(
                      props.heartbeat.twitter.maxTweetsPerMinTime
                    ).format(defaultDateTimeFormat)}`}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography className={classes.settingLabel}>
                    {`${elapsed(
                      moment(props.heartbeat.twitter.maxTweetsPerMinTime)
                    )
                      .as("days")
                      .toFixed(1)} DAYS AGO`}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            <LinearProgressWithLabel
              className={classes.progress}
              variant="determinate"
              value={
                props.heartbeat.twitter.tweetsPerMin &&
                props.heartbeat.twitter.maxTweetsPerMin
                  ? (100.0 * props.heartbeat.twitter.tweetsPerMin) /
                    props.heartbeat.twitter.maxTweetsPerMin
                  : 0
              }
            ></LinearProgressWithLabel>
          </Grid>
        </Grid>
        <Grid item className={classes.gridItem} xs={4}>
          <Grid className={classes.gridSetting}>
            <Typography className={classes.sectionLabel}>NODES</Typography>

            <Grid className={classes.gridSubSetting}>
              <Grid item xs={4}>
                <Grid item xs={6}>
                  <Typography className={classes.settingLabel}>RCVD</Typography>
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
                  <Typography className={classes.settingLabel}>MAX</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.settingValue} margin={0}>
                    {props.heartbeat.maxNodesPerMin}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography className={classes.settingLabel}>
                    {`${moment(props.heartbeat.maxNodesPerMinTime).format(
                      defaultDateTimeFormat
                    )}`}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography className={classes.settingLabel}>
                    {`${elapsed(moment(props.heartbeat.maxNodesPerMinTime))
                      .as("days")
                      .toFixed(1)} DAYS AGO`}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            <LinearProgressWithLabel
              className={classes.progress}
              variant="determinate"
              value={
                props.heartbeat.nodesPerMin && props.heartbeat.maxNodesPerMin
                  ? (100.0 * props.heartbeat.nodesPerMin) /
                    props.heartbeat.maxNodesPerMin
                  : 0
              }
            ></LinearProgressWithLabel>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default Stats;
