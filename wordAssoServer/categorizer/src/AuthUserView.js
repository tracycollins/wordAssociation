import React from 'react';
import clsx from 'clsx';
// import { Tweet } from 'react-twitter-widgets'
import { green } from '@material-ui/core/colors';

import Duration from 'duration';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
// import Checkbox from '@material-ui/core/Checkbox';
// import FormControl from '@material-ui/core/FormControl';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import FormGroup from '@material-ui/core/FormGroup';
import Grid from '@material-ui/core/Grid';
// import InputLabel from '@material-ui/core/InputLabel';
// import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
// import Select from '@material-ui/core/Select';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 2,
  },
  grid: {
    display: 'flex',
  },
  gridItem: {
    margin: 5,
  },  
  card: {
    raised: false,
    maxWidth: 400,
  },
  paper: {
    outlined: true,
    variant: 'outlined',
  },
  table: {
    // minWidth: 500,
  },
  tableHead: {
    backgroundColor: 'lightgreen',
  },
  tableBody: {
    // backgroundColor: 'gray',
  },
  appBar: {
    backgroundColor: 'white',
    margin: 2,
  },
  statusBar: {
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
    flexGrow: 1,
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "lightgray",
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
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
  selectCategory: {
    fontSize: '0.5rem',
    backgroundColor: '#ddeeee',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  radioGroupCategory: {
    fontSize: '0.5rem',
    backgroundColor: '#ddeeee',
    borderRadius: theme.shape.borderRadius,
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
  },

  category: {
    // fontSize: fontSizeCategory,
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
const defaultProfileImage = "logo192.png"
const defaultBannerImage = "logo192.png"

const AuthUserView = (props) => {

  const classes = useStyles();

  const earned = {};
  earned.total = props.earned ? earned.total : 0;

  const categorized = {};
  categorized.total = props.authUser.screenName? props.stats.user.categorizedBy[props.authUser.screenName].total : "---"

  const createdAt = formatDate(props.authUser.createdAt)
  const lastSeen = formatDate(props.authUser.lastSeen)
 
  const lastSeenDuration = props.authUser.lastSeen ? new Duration(new Date(props.authUser.lastSeen)).toString(1, 4) : "---"
  const twitterAge = props.authUser.createdAt ? new Duration(new Date(props.authUser.createdAt)) : new Duration(new Date())
  const twitterAgeString = twitterAge.toString(1, 4)

  const tweetRate = twitterAge.days > 0 ? Math.ceil(props.authUser.statusesCount/twitterAge.days) : 0;

  const openUserTwitterPage = () => {
    console.log("open twitter")
    window.open(`http://twitter.com/${props.authUser.screenName || null}`, "_blank") //to open new page
  }

  const getCategoryClass = (category) => {
    switch (category){
      case "left":
      case "neutral":
      case "right":
      case "positive":
      case "negative":
      case "ignored":
        return classes[category]
      default:
        return classes.none
    }
  }
  return (
    <>
      <Grid className={classes.grid}>
        <Grid item className={classes.gridItem} xs={3}>
          <Card className={classes.card} variant="outlined">

            <CardContent onClick={openUserTwitterPage}>
                <Typography 
                  className={clsx(classes.category, props.authUser.ignored ? getCategoryClass("ignored") : getCategoryClass(props.authUser.category))} 
                  variant="h6"
                >
                  {props.authUser.name}
                </Typography>
                <Typography variant="h6">@{props.authUser.screenName} </Typography>
            </CardContent>
            <CardContent >
                <Typography>{props.authUser.description}</Typography>
            </CardContent>

            <CardMedia
              className={classes.profileImage}
              src={props.authUser.profileImageUrl || defaultProfileImage}
              component="img"
              onError={e => {}}              
            />
            <CardMedia 
              className={classes.bannerImage} 
              src={props.authUser.bannerImageUrl || defaultBannerImage} 
              component="img"
              onError={e => {}}              
            />
          </Card>        </Grid>
        <Grid item className={classes.gridItem} xs={3}>
          <Paper className={classes.paper}  elevation={0} variant="outlined">
            <TableContainer>
              <Table  className={classes.table}  size="small">
                <TableHead className={classes.tableHead}>
                  <TableRow>
                    <TableCell>@{props.authUser.screenName}</TableCell><TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className={classes.tableBody}>
                  <TableRow>
                    <TableCell>Twitter ID</TableCell><TableCell align="right">{props.authUser.nodeId}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Location</TableCell><TableCell align="right">{props.authUser.location}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Created</TableCell><TableCell align="right">{createdAt}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Twitter age</TableCell><TableCell align="right">{twitterAgeString}</TableCell>
                  </TableRow>
                  <TableRow className={props.authUser.followersCount > 5000 ? classes.tableRowGreen : null}>
                    <TableCell>Followers</TableCell><TableCell align="right">{props.authUser.followersCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Friends</TableCell><TableCell align="right">{props.authUser.friendsCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tweets</TableCell><TableCell align="right">{props.authUser.statusesCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tweets/day</TableCell><TableCell align="right">{tweetRate}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Active</TableCell><TableCell align="right">{lastSeen} ({lastSeenDuration} ago)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mentions</TableCell><TableCell align="right">{props.authUser.mentions}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mentions/hour</TableCell><TableCell align="right">{props.authUser.rate ? 60*props.authUser.rate.toFixed(2) : 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>              
          </Paper>
        </Grid>
        <Grid item className={classes.gridItem} xs={3}>

          <Paper className={classes.paper}  elevation={0} variant="outlined">

            <TableContainer>

              <Table className={classes.table} size="small"  aria-label="simple table">

                <TableHead className={classes.tableHead}>
                  <TableRow>
                    <TableCell>CATEGORIZED</TableCell>
                    <TableCell align="right">USERS</TableCell>
                    <TableCell align="right">EARNED</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow>
                    <TableCell >TOTAL</TableCell>
                    <TableCell align="right">{categorized.total || "---"}</TableCell>
                    <TableCell align="right">{earned.total || "---"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell >Today</TableCell>
                    <TableCell align="right">{categorized.today || "---"}</TableCell>
                    <TableCell align="right">{earned.today || "---"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell >This Period</TableCell>
                    <TableCell align="right">{categorized.period || "---"}</TableCell>
                    <TableCell align="right">{earned.period || "---"}</TableCell>
                  </TableRow>
                </TableBody>

              </Table>
            </TableContainer>              
          </Paper>
        </Grid>
        
      </Grid>
    </>
  );
}

export default AuthUserView;
