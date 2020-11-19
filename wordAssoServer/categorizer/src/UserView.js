import React, { useState } from 'react';
import { Timeline } from 'react-twitter-widgets'

import Duration from 'duration';

import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Card from '@material-ui/core/Card';
// import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
// import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
// import CheckBoxIcon from '@material-ui/icons/CheckBox';
// import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
// import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
// import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
// import MenuIcon from '@material-ui/icons/Menu';
// import Paper from '@material-ui/core/Paper';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import SearchIcon from '@material-ui/icons/Search';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const fontSizeCategory = '1.0rem';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 2,
  },
  appBar: {
    backgroundColor: 'white',
    marginBottom: theme.spacing(1),
  },
  grid: {
    display: 'flex',
    // flexGrow: 1,
  },
  gridItem: {
    // margin: 5,
    flexGrow: 2,

    marginRight: theme.spacing(1),
  },  
  card: {
    raised: false,
    maxWidth: "80%",
  },
  profileImage: {
    maxHeight: 320,
    marginBottom: theme.spacing(1),
  },
  bannerImage: {
    height: 60,
    marginBottom: theme.spacing(1),
  },
  radioGroupCategory: {
    backgroundColor: '#ddeeee',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  table: {
    borderRadius: theme.shape.borderRadius,
    // borderColor: 'red',
  },
  tableHead: {
    backgroundColor: '#ddeeee',
  },
  tableCategorized: {
    borderRadius: theme.shape.borderRadius,
    borderColor: 'red',
    backgroundColor: '#ddeeee',
  },
  tableRowGreen: {
    backgroundColor: 'lightgreen',
  },
  statusBar: {
    backgroundColor: 'white',
    margin: 2,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    // flexGrow: 1,
    color: 'blue',
  },
  search: {
    // flexGrow: 1,
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "#ddeeee",
    },
    marginRight: theme.spacing(1),
    // marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      // marginLeft: theme.spacing(3),
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
  },

  left: {
    width: '50%',
    fontSize: fontSizeCategory,
    backgroundColor: 'blue',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
    marginBottom: theme.spacing(1),
  },
  neutral: {
    width: '50%',
    fontSize: fontSizeCategory,
    backgroundColor: 'gray',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
    marginBottom: theme.spacing(1),
  },
  right: {
    width: '50%',
    fontSize: fontSizeCategory,
    backgroundColor: 'red',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
    marginBottom: theme.spacing(1),
  },
  positive: {
    width: '50%',
    fontSize: fontSizeCategory,
    backgroundColor: 'green',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
    marginBottom: theme.spacing(1),
  },
  negative: {
    width: '50%',
    fontSize: fontSizeCategory,
    backgroundColor: 'red',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
    marginBottom: theme.spacing(1),
  },
  none: {
    width: '50%',
    fontSize: fontSizeCategory,
    backgroundColor: 'lightgray',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
    marginBottom: theme.spacing(1),
  },
  ignored: {
    width: '50%',
    fontSize: fontSizeCategory,
    backgroundColor: 'black',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
    marginBottom: theme.spacing(1),
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

const User = (props) => {

  const classes = useStyles();

  const createdAt = formatDate(props.user.createdAt)
  const lastSeen = formatDate(props.user.lastSeen)
 
  const lastSeenDuration = new Duration(new Date(props.user.lastSeen)).toString(1, 4)
  const twitterAge = props.user.createdAt ? new Duration(new Date(props.user.createdAt)) : new Duration(new Date())
  const twitterAgeString = twitterAge.toString(1, 4)

  const tweetRate = twitterAge.days > 0 ? Math.ceil(props.user.statusesCount/twitterAge.days) : 0;

  const [userSearch, setUserSearch] = useState("");

  // useEffect(() => {
  //   setUserSearch(props.user.screenName)
  // }, [props])
  
  const handleChangeSearch = (event) => {
    console.log("handleChangeSearch: " + event.target.value)
    setUserSearch(event.target.value);
  }

  const handleKeyPress = (event) => {
    if (event.charCode === 13) { // enter key pressed
      console.log("ENTER")
      props.handleSearchNode(userSearch)
    }
  }

  const openUserTwitterPage = () => {
    console.log("open twitter")
    window.open(`http://twitter.com/${props.user.screenName || null}`, "_blank") //to open new page
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
      <AppBar  className={classes.appBar} position="static">
        <Toolbar variant="dense">

          {/* <Typography variant="h6" className={classes.title}>
            User
          </Typography> */}

          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon color="primary"/>
            </div>
            <InputBase
              placeholder="search…"
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ 'aria-label': 'search' }}
              value={userSearch}
              onKeyPress={handleKeyPress}
              onChange={handleChangeSearch}
            />
          </div>

          <Typography className={classes.buttonGroupLabel}>GET UNCAT</Typography>   

          <ButtonGroup color="primary" size="small" aria-label="small button group">
            <Button onClick={(event) => props.handleNodeChange(event, props.user)} name="all" >ALL: {props.stats.user.uncategorized.all}</Button>
            <Button onClick={(event) => props.handleNodeChange(event, props.user)} name="left" >LEFT: {props.stats.user.uncategorized.left}</Button>
            <Button onClick={(event) => props.handleNodeChange(event, props.user)} name="neutral" >NEUTRAL: {props.stats.user.uncategorized.neutral}</Button>
            <Button onClick={(event) => props.handleNodeChange(event, props.user)} name="right" >RIGHT: {props.stats.user.uncategorized.right}</Button>
          </ButtonGroup>

          <ButtonGroup color="primary" size="small" aria-label="small button group">
            <Button 
              className={classes.buttonMismatch}
              // variant="contained" 
              color="primary" 
              size="small" 
              onClick={(event) => props.handleNodeChange(event, props.user)} 
              name="mismatch" 
            >
              MISMATCH {props.stats.user.mismatched}
            </Button>
          </ButtonGroup>

        </Toolbar>
      </AppBar>
      <Grid className={classes.grid}>
          <Grid item className={classes.gridItem} xs={3}>
            <Card className={classes.card} variant="outlined">
              <CardActions onClick={openUserTwitterPage}>
                  <Typography className={props.user.ignored ? classes["ignored"] : getCategoryClass(props.user.category)} align="center">
                    {props.user.ignored ? "IGNORED" : props.user.category.toUpperCase() || "MANUAL: NONE"}
                  </Typography>
                  <Typography className={getCategoryClass(props.user.categoryAuto)} align="center">
                    AUTO: {props.user.categoryAuto.toUpperCase() || "NONE"}
                  </Typography>
              </CardActions>
              <CardContent onClick={openUserTwitterPage}>
                  <Typography variant="h6">{props.user.name}</Typography>
                  <Typography>@{props.user.screenName}</Typography>
              </CardContent>
              <CardMedia
                className={classes.profileImage}
                src={props.user.profileImageUrl || defaultProfileImage}
                component="img"
                onError={e => {}}              
              />
              <CardMedia 
                className={classes.bannerImage} 
                src={props.user.bannerImageUrl || defaultBannerImage} 
                component="img"
                onError={e => {}}              
              />
              <CardContent>
                <Typography>
                  {props.user.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item className={classes.gridItem} xs={2}>
            <Timeline
              dataSource={{
                sourceType: 'profile',
                screenName: props.user.screenName
              }}
              options={{height: '640'}}
            />
          </Grid>
          <Grid item className={classes.gridItem} xs={2}>
            <TableContainer>
              <Table className={classes.table} size="small">
                <TableHead>
                  <TableRow className={classes.tableHead}>
                    <TableCell>@{props.user.screenName}</TableCell><TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Twitter ID</TableCell><TableCell align="right">{props.user.nodeId}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Location</TableCell><TableCell align="right">{props.user.location}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Created</TableCell><TableCell align="right">{createdAt}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Twitter age</TableCell><TableCell align="right">{twitterAgeString}</TableCell>
                  </TableRow>
                  <TableRow className={props.user.followersCount > 5000 ? classes.tableRowGreen : null}>
                    <TableCell>Followers</TableCell><TableCell align="right">{props.user.followersCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Friends</TableCell><TableCell align="right">{props.user.friendsCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tweets</TableCell><TableCell align="right">{props.user.statusesCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tweets/day</TableCell><TableCell align="right">{tweetRate}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Last Active</TableCell><TableCell align="right">{lastSeen} ({lastSeenDuration} ago)</TableCell>
                  </TableRow>
                  {/* <TableRow>
                    <TableCell>Last Active</TableCell><TableCell align="right">{lastSeenDuration} ago</TableCell>
                  </TableRow> */}
                  <TableRow>
                    <TableCell>Mentions</TableCell><TableCell align="right">{props.user.mentions}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mentions/hour</TableCell><TableCell align="right">{props.user.rate ? 60*props.user.rate.toFixed(2) : 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item className={classes.gridItem} xs={2}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow className={classes.tableHead}>
                    <TableCell colSpan={3}>ALL USERS</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CAT</TableCell>
                    <TableCell align="right">MAN</TableCell>
                    <TableCell align="right">AUTO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>LEFT</TableCell>
                    <TableCell align="right">{props.stats.user.manual.left}</TableCell>
                    <TableCell align="right">{props.stats.user.auto.left}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>RIGHT</TableCell>
                    <TableCell align="right">{props.stats.user.manual.right}</TableCell>
                    <TableCell align="right">{props.stats.user.auto.right}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>NEUTRAL</TableCell>
                    <TableCell align="right">{props.stats.user.manual.neutral}</TableCell>
                    <TableCell align="right">{props.stats.user.auto.neutral}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>POSITIVE</TableCell>
                    <TableCell align="right">{props.stats.user.manual.positive}</TableCell>
                    <TableCell align="right">{props.stats.user.auto.positive}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>NEGATIVE</TableCell>
                    <TableCell align="right">{props.stats.user.manual.negative}</TableCell>
                    <TableCell align="right">{props.stats.user.auto.negative}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>NONE</TableCell>
                    <TableCell align="right">{props.stats.user.manual.none}</TableCell>
                    <TableCell align="right">{props.stats.user.auto.none}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item className={classes.gridItem} xs={1}>
            <FormGroup>
              <FormControl component="fieldset" size="small">
                <RadioGroup 
                  className={classes.radioGroupCategory}
                  aria-label="category" 
                  name="category" 
                  size="small"
                  value={props.user.category || "none"} 
                  onChange={(event) => props.handleNodeChange(event, props.user)}
                >
                  <FormControlLabel value="left" control={<Radio size="small"/>} label="LEFT"/>
                  <FormControlLabel value="right" control={<Radio size="small" />} label="RIGHT" />
                  <FormControlLabel value="neutral" control={<Radio size="small" />} label="NEUTRAL" />
                  <FormControlLabel value="positive" control={<Radio size="small" />} label="POSITIVE" />
                  <FormControlLabel value="negative" control={<Radio size="small" />} label="NEGATIVE" />
                  <FormControlLabel value="none" control={<Radio size="small" />} label="NONE" />
                </RadioGroup>
              </FormControl>

              <FormControl 
                component="fieldset"
                className={classes.radioGroupCategory}
                size="small"
              >
                <FormControlLabel
                  control={<Checkbox size="small" checked={props.user.categoryVerified || false} onChange={(event) => props.handleNodeChange(event, props.user)} name="catVerified" />}
                  label="VERIFIED"
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={props.user.following || false} onChange={(event) => props.handleNodeChange(event, props.user)} name="following" />}
                  label="FOLLOWING"
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={props.user.ignored || false} onChange={(event) => props.handleNodeChange(event, props.user)} name="ignored" />}
                  label="IGNORED"
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={props.user.isBot || false} onChange={(event) => props.handleNodeChange(event, props.user)} name="isBot" />}
                  label="BOT"
                />
              </FormControl>
            </FormGroup>
          </Grid>
        </Grid>
    </>
  );
}

export default User;
