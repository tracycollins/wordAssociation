import React from 'react';
import PropTypes from 'prop-types';

// import clsx from 'clsx';
import { green, grey } from '@material-ui/core/colors';

import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';

import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

import { makeStyles, withStyles } from '@material-ui/core/styles';

const StyledTableCell = withStyles((theme) => ({
  head: {
  },
  body: {
    fontSize: 11,
  },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  root: {
    backgroundColor: grey,
  },
}))(TableRow);

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
    padding: theme.spacing(1),
    outlined: true,
    variant: 'outlined',
  },
  timelineError: {
    textAlign: "center",
    border: '2px solid red',
    color: 'red',
    backgroundColor: 'white',
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
    border: '1px solid darkgray',
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.9rem',
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
    maxWidth: "95%",
    align: 'center',
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
    backgroundColor: 'white',
    color: 'black',
  },
  ignored: {
    backgroundColor: 'yellow',
    color: 'black',
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
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
};

const formatDate = (dateInput) => {
  return new Date(dateInput).toLocaleDateString(
    'en-gb',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  );
}

// const useStyles = makeStyles((theme) => ({
//   root: {
//     border: 0,
//     flexGrow: 2,
//   },
//   range: {
//     color: 'blue',
//   }
// }));

const Stats = (props) => {

  // const { heartbeat } = props;
  console.log(props)
  
  // statsObj.nodesPerSec = 0.0;
  // statsObj.nodesPerMin = 0.0;
  // statsObj.maxNodesPerMin = 0.0;
  // statsObj.maxNodesPerMinTime = moment().valueOf();

  const classes = useStyles();

  return (
    <>
      <Grid className={classes.grid}>
          <Grid item className={classes.gridItem} xs={4}>
            <Card className={classes.card} variant="outlined">
              <CardContent >
                <Typography variant="h6" id="neuralNetworks" name="neuralNetworks" gutterBottom>
                  NEURAL NETWORKS
                </Typography>
                  <Typography>BEST: {props.heartbeat.bestNetwork.networkId}</Typography>
                  <Typography>LIVE RATE: {props.heartbeat.bestNetwork.runtimeMatchRate.toFixed(2)}%</Typography>
                  <Typography>SUCCESS RATE: {props.heartbeat.bestNetwork.successRate.toFixed(2)}%</Typography>
              </CardContent>              
            </Card>
          </Grid>
          <Grid item className={classes.gridItem} xs={4}>
            <Card className={classes.card} variant="outlined">
              <CardContent >
                <Typography variant="h6" id="tweets" name="tweets" gutterBottom>
                  TWITTER
                </Typography>
                <Typography id="tweetsReceived" name="tweetsReceived" gutterBottom>
                  <span><b>{props.heartbeat.twitter.tweetsReceived}</b> TWEETS RCVD</span>
                </Typography>
                <Typography id="tweetsPerMin" name="tweetsPerMin" gutterBottom>
                  <span><b>{props.heartbeat.twitter.tweetsPerMin}</b> TWEETS/MIN</span>
                </Typography>
                <Typography id="maxTweetsPerMin" name="maxTweetsPerMin" gutterBottom>
                  <span><b>{props.heartbeat.twitter.maxTweetsPerMin}</b> MAX TWEETS/MIN</span>
                </Typography>

                <LinearProgressWithLabel 
                  variant="determinate" 
                  value={(100.0 * props.heartbeat.twitter.tweetsPerMin / props.heartbeat.twitter.maxTweetsPerMin)}
                >
                </LinearProgressWithLabel>

              </CardContent>
            </Card>
          </Grid>
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
                  value={(100.0 * props.heartbeat.nodesPerMin / props.heartbeat.maxNodesPerMin)}
                >
                </LinearProgressWithLabel>


                {/* <LinearProgress variant="determinate" value={(100.0 * props.heartbeat.nodesPerMin / props.heartbeat.maxNodesPerMin)}>
                </LinearProgress> */}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
    </>
  );
}

export default Stats;
