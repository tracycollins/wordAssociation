import React from 'react';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
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

const Stats = (props) => {

  // const { status } = props;
  console.log(props)
  
  // statsObj.nodesPerSec = 0.0;
  // statsObj.nodesPerMin = 0.0;
  // statsObj.maxNodesPerMin = 0.0;
  // statsObj.maxNodesPerMinTime = moment().valueOf();

  const classes = useStyles();

  return (
    <>
      <Grid className={classes.grid}>
          <Grid item className={classes.gridItem} xs={6}>
              <Typography className={classes.range} id="nodesPerMin" name="nodesPerMin" gutterBottom>
                NODE RATE
              </Typography>
              <LinearProgress variant="determinate" value={47}>
              </LinearProgress>
          </Grid>
        </Grid>
    </>
  );
}

export default Stats;
