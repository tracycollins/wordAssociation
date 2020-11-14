import React, { useState, useEffect } from 'react';
import { Timeline } from 'react-twitter-widgets'

import Duration from 'duration';

import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Card from '@material-ui/core/Card';
// import CardActionArea from '@material-ui/core/CardActionArea';
// import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
// import CheckBoxIcon from '@material-ui/icons/CheckBox';
// import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import Checkbox from '@material-ui/core/Checkbox';
import Container from '@material-ui/core/Container';
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
// import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { fade, makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  // root: {
  //   maxWidth: 400,
  // },
  root: {
    flexGrow: 2,
  },
  grid: {
    display: 'flex',
    // flexDirection: 'row',
    // flexGrow: 2,
    // flexFlow: 'wrap',
    // alignItems: 'center',
    // alignItems: 'stretch',
    // margin: 'auto',
  },  
  gridItem: {
    // backgroundColor: 'lightgray',
    margin: 5,
    // padding: 2,
    // backgroundColor: 'red',
  },  
  // paper: {
  //   alignItems: 'left',
  // },
  card: {
    raised: false,
    // border: 10,
    // backgroundColor: 'lightgray',
    maxWidth: 300,
  },
  profileImage: {
    // width: 200,
    height: 300,
    // margin: 8,
    // padding: -10,
  },
  bannerImage: {
    // width: 200,
    height: 80,
    // margin: 8,
    // padding: 10,
  },
  table: {
    // width: 300,
  },
  tableRowGreen: {
    backgroundColor: 'lightgreen',
    // width: 300,
  },
  appBar: {
    backgroundColor: 'white',
    margin: 2,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    // backgroundColor: fade(theme.palette.common.black, 0.15),
    backgroundColor: "white",
    '&:hover': {
      // backgroundColor: fade(theme.palette.common.black, 0.15),
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
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
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
    // color: 'black',
    margin: 5
  },

  left: {
    // padding: 5,
    color: 'white',
    backgroundColor: 'blue',
  },
  neutral: {
    // margin: 5,
    // padding: 5,
    color: 'white',
    backgroundColor: 'gray',
  },
  right: {
    // margin: 5,
    // padding: 5,
    color: 'white',
    backgroundColor: 'red',
  },
  none: {
    // margin: 5,
    // padding: 5,
    color: 'black',
    backgroundColor: 'white',
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
  const [timelineLoaded, setTimelineLoaded] = useState(false);

  const handleChangeSearch = (event) => {
    console.log("handleChangeSearch: " + event.target.value)
    setUserSearch(event.target.value);
  }

  const handleKeyPress = (event) => {
    if (event.charCode === 13) { // enter key pressed
      console.log("ENTER")
      props.handleSearchUser(userSearch)
    }
  }

  const handleTimelineLoaded = () => {
    setTimelineLoaded(true)
    console.log("TIMELINE LOADED")
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
        return classes[category]
      default:
        return classes.none
    }
  }

  useEffect(() => {
    setTimelineLoaded(false)
    console.log({timelineLoaded})
  }, [props.user])

  return (
    <div className={classes.root}>
      <Container component="main">
        {/* <AppBar  className={classes.appBar} position="static">
          <Toolbar>
            <Typography className={classes.title} color="primary">
               user
            </Typography>
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
            <Button color="inherit">Login</Button>
          </Toolbar>
        </AppBar> */}
        <AppBar  className={classes.appBar} position="static">
          <Toolbar>
            <Button variant="contained" color="primary" onClick={props.handleChange} name="mismatch" className={classes.buttonMismatch}>MISMATCH {props.stats.user.mismatched}</Button>

            <ButtonGroup variant="contained" color="primary" size="small" aria-label="small button group">
              <Button onClick={props.handleChange} name="all" >TOTAL: {props.stats.user.uncategorized.all}</Button>
              <Button onClick={props.handleChange} name="left" >LEFT: {props.stats.user.uncategorized.left}</Button>
              <Button onClick={props.handleChange} name="neutral" >NEUTRAL: {props.stats.user.uncategorized.neutral}</Button>
              <Button onClick={props.handleChange} name="right" >RIGHT: {props.stats.user.uncategorized.right}</Button>
          </ButtonGroup>
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
          </Toolbar>
        </AppBar>
        <Grid className={classes.grid}>
          <Grid item className={classes.gridItem} xs={3}>
            <Card className={classes.card} variant="outlined">
              <CardHeader
                onClick={openUserTwitterPage}
                title={`${props.user.name}`}
                subheader={`@${props.user.screenName}`}
              >
              </CardHeader>
              <CardMedia
                className={classes.profileImage}
                image={props.user.profileImageUrl || defaultProfileImage}
              />
              <br></br>
              <CardMedia className={classes.bannerImage} image={props.user.bannerImageUrl || defaultBannerImage} />
              <CardContent>
                <Typography>
                  {props.user.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item className={classes.gridItem} xs={4}>
            <Typography>
              {timelineLoaded ? "TIMELINE LOADED" : "LOADING TIMELINE ..."}
            </Typography>
            <Timeline
              onLoad={handleTimelineLoaded}
              dataSource={{
                sourceType: 'profile',
                screenName: props.user.screenName
              }}
              options={{
                height: '540'
              }}
            />
          </Grid>
          <Grid item className={classes.gridItem} xs={3}>
            <TableContainer>
              <Table className={classes.table} size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>location</TableCell><TableCell align="right">{props.user.location}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>created</TableCell><TableCell align="right">{createdAt}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>twitter age</TableCell><TableCell align="right">{twitterAgeString}</TableCell>
                  </TableRow>
                  <TableRow className={props.user.followersCount > 5000 ? classes.tableRowGreen : null}>
                    <TableCell>followers</TableCell><TableCell align="right">{props.user.followersCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>friends</TableCell><TableCell align="right">{props.user.friendsCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>tweets</TableCell><TableCell align="right">{props.user.statusesCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>tweets/day</TableCell><TableCell align="right">{tweetRate}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>last seen</TableCell><TableCell align="right">{lastSeen}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>last seen</TableCell><TableCell align="right">{lastSeenDuration} ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>mentions</TableCell><TableCell align="right">{props.user.mentions}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>mentions/min</TableCell><TableCell align="right">{props.user.rate ? props.user.rate.toFixed(1) : 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item className={classes.gridItem} xs={1}>
            <FormGroup>
              <Button className={getCategoryClass(props.user.categoryAuto)}>
                AUTO: {props.user.categoryAuto.toUpperCase() || "NONE"}
              </Button>

              <FormControl component="fieldset">
                <RadioGroup aria-label="category" name="category" value={props.user.category || "none"} onChange={props.handleChange}>
                  <FormControlLabel labelPlacement="start" value="left" control={<Radio />} label="left"/>
                  <FormControlLabel labelPlacement="start" value="neutral" control={<Radio />} label="neutral" />
                  <FormControlLabel labelPlacement="start" value="right" control={<Radio />} label="right" />
                  <FormControlLabel labelPlacement="start" value="positive" control={<Radio />} label="positive" />
                  <FormControlLabel labelPlacement="start" value="negative" control={<Radio />} label="negative" />
                  <FormControlLabel labelPlacement="start" value="none" control={<Radio />} label="none" />
                </RadioGroup>
              </FormControl>

              <FormControlLabel
                control={<Checkbox checked={props.user.categoryVerified || false} onChange={props.handleChange} name="catVerified" />}
                label="verified"
                labelPlacement="start"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.following || false} onChange={props.handleChange} name="following" />}
                label="following"
                labelPlacement="start"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.ignored || false} onChange={props.handleChange} name="ignored" />}
                label="ignored"
                labelPlacement="start"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.isBot || false} onChange={props.handleChange} name="isBot" />}
                label="bot"
                labelPlacement="start"
              />

                  {/* <TableRow>
                    <TableCell>cat verified</TableCell>
                    <TableCell>
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox checked={props.user.categoryVerified || false} onChange={props.handleChange} name="catVerified" />}
                          label=""
                          labelPlacement="start"
                        />
                      </FormGroup>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>following</TableCell>
                    <TableCell>
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox checked={props.user.following || false} onChange={props.handleChange} name="following" />}
                          label=""
                          labelPlacement="start"
                        />
                      </FormGroup>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ignored</TableCell>
                    <TableCell>
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox checked={props.user.ignored || false} onChange={props.handleChange} name="ignored" />}
                          label=""
                          labelPlacement="start"
                        />
                      </FormGroup>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>bot</TableCell>
                    <TableCell>
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox checked={props.user.isBot || false} onChange={props.handleChange} name="isBot" />}
                          label=""
                          labelPlacement="start"
                        />
                      </FormGroup>
                    </TableCell>
                  </TableRow> */}


            </FormGroup>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default User;
