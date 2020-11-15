import React, { useState } from 'react';
import { Timeline } from 'react-twitter-widgets'

import Duration from 'duration';
import CircularProgress from '@material-ui/core/CircularProgress';

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
import { makeStyles } from '@material-ui/core/styles';
import { TableHead } from '@material-ui/core';

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
    maxWidth: 300,
  },
  profileImage: {
    height: 300,
  },
  bannerImage: {
    height: 80,
  },
  table: {
  },
  tableRowGreen: {
    backgroundColor: 'lightgreen',
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
    flexGrow: 1,
  },
  search: {
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

  left: {
    color: 'white',
    backgroundColor: 'blue',
  },
  neutral: {
    color: 'white',
    backgroundColor: 'gray',
  },
  right: {
    color: 'white',
    backgroundColor: 'red',
  },
  none: {
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

  return (
    <div className={classes.root}>
      <Container component="main" maxWidth={false}>
        <AppBar  className={classes.appBar} position="static">
          <Toolbar>
            <ButtonGroup variant="contained" color="primary" size="small" aria-label="small button group">
              <Button onClick={props.handleUserChange} name="all" >TOTAL: {props.stats.user.uncategorized.all}</Button>
              <Button onClick={props.handleUserChange} name="left" >LEFT: {props.stats.user.uncategorized.left}</Button>
              <Button onClick={props.handleUserChange} name="neutral" >NEUTRAL: {props.stats.user.uncategorized.neutral}</Button>
              <Button onClick={props.handleUserChange} name="right" >RIGHT: {props.stats.user.uncategorized.right}</Button>
          </ButtonGroup>
            <Button 
              variant="contained" color="primary" size="small" onClick={props.handleUserChange} name="mismatch" className={classes.buttonMismatch}>MISMATCH {props.stats.user.mismatched}
            </Button>
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
              <CardContent
                onClick={openUserTwitterPage}
              >
                <Typography
                  variant="h6"
                >
                  {props.user.name}
                </Typography>
                <Typography>
                  @{props.user.screenName}
                </Typography>
              </CardContent>
              {/* <CardHeader
                onClick={openUserTwitterPage}
                title={`${props.user.name}`}
                subheader={`@${props.user.screenName}`}
              >
              </CardHeader> */}
              <CardMedia
                className={classes.profileImage}
                // image={props.user.profileImageUrl}
                src={props.user.profileImageUrl || defaultProfileImage}
                component="img"
                onError={e => {
                }}              
              />
              <br></br>
              <CardMedia 
                className={classes.bannerImage} 
                // image={props.user.bannerImageUrl || defaultBannerImage}
                src={props.user.bannerImageUrl || defaultBannerImage} 
                component="img"
                onError={e => {
                }}              
              />
              <CardContent>
                <Typography>
                  {props.user.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item className={classes.gridItem} xs={3}>
            <Timeline
              dataSource={{
                sourceType: 'profile',
                screenName: props.user.screenName
              }}
              options={{
                height: '640'
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
          <Grid item className={classes.gridItem} xs={2}>
            <TableContainer>
              <Table className={classes.table} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>CAT</TableCell>
                    <TableCell align="left">MAN</TableCell>
                    <TableCell align="left">AUTO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>left</TableCell>
                    <TableCell align="right">{props.stats.user.manual.left}</TableCell>
                    <TableCell align="right">{props.stats.user.auto.left}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>neutral</TableCell>
                    <TableCell align="right">{props.stats.user.manual.neutral}</TableCell>
                    <TableCell align="right">{props.stats.user.auto.neutral}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>right</TableCell>
                    <TableCell align="right">{props.stats.user.manual.right}</TableCell>
                    <TableCell align="right">{props.stats.user.auto.right}</TableCell>
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
                <RadioGroup aria-label="category" name="category" value={props.user.category || "none"} onChange={props.handleUserChange}>
                  <FormControlLabel labelPlacement="start" value="left" control={<Radio />} label="left"/>
                  <FormControlLabel labelPlacement="start" value="neutral" control={<Radio />} label="neutral" />
                  <FormControlLabel labelPlacement="start" value="right" control={<Radio />} label="right" />
                  <FormControlLabel labelPlacement="start" value="positive" control={<Radio />} label="positive" />
                  <FormControlLabel labelPlacement="start" value="negative" control={<Radio />} label="negative" />
                  <FormControlLabel labelPlacement="start" value="none" control={<Radio />} label="none" />
                </RadioGroup>
              </FormControl>

              <FormControlLabel
                control={<Checkbox checked={props.user.categoryVerified || false} onChange={props.handleUserChange} name="catVerified" />}
                label="verified"
                labelPlacement="start"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.following || false} onChange={props.handleUserChange} name="following" />}
                label="following"
                labelPlacement="start"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.ignored || false} onChange={props.handleUserChange} name="ignored" />}
                label="ignored"
                labelPlacement="start"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.isBot || false} onChange={props.handleUserChange} name="isBot" />}
                label="bot"
                labelPlacement="start"
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default User;
