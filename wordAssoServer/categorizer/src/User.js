import React, { useState } from 'react';

import Duration from 'duration';

import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
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
import TableHead from '@material-ui/core/TableHead';
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
    margin: 2,
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
    height: 280,
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
  appBar: {
    backgroundColor: 'black',
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
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
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
    color: 'inherit',
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
  
  return (
    <div className={classes.root}>
      <Container component="main">
        <AppBar  className={classes.appBar} position="static">
          <Toolbar>
            {/* <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
              <MenuIcon />
            </IconButton> */}
            <Typography className={classes.title}>
               User
            </Typography>

            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon />
              </div>
              <InputBase
                placeholder="Search…"
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
          <Grid item className={classes.gridItem} xs={3}>
            <TableContainer>
              <Table className={classes.table} size="small" aria-label="a dense table">
                <TableHead>
                  <TableRow>
                    {/* <TableCell>{`${props.user.name}`}</TableCell><TableCell align="right">{`@${props.user.screenName}`}</TableCell> */}
                  </TableRow>
                </TableHead>
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
                  <TableRow>
                    <TableCell>followers</TableCell><TableCell align="right">{props.user.followersCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>friends</TableCell><TableCell align="right">{props.user.friendsCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>tweets</TableCell><TableCell align="right">{props.user.statusesCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>tweet rate (day)</TableCell><TableCell align="right">{tweetRate}</TableCell>
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
                    <TableCell>mention rate (min)</TableCell><TableCell align="right">{props.user.rate ? props.user.rate.toFixed(1) : 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item className={classes.gridItem} xs={2}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={props.user.categoryVerified || false} onChange={props.handleChange} name="catVerified" />}
                label="category verified"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.following || false} onChange={props.handleChange} name="following" />}
                label="following"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.ignored || false} onChange={props.handleChange} name="ignored" />}
                label="ignored"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.isBot || false} onChange={props.handleChange} name="isBot" />}
                label="isBot"
              />
            </FormGroup>
          </Grid>
          <Grid item className={classes.gridItem} xs={2}>
            <FormGroup>
              <Typography>
                CATEGORY
              </Typography>
              <Typography>
                AUTO: {props.user.categoryAuto.toUpperCase() || "none"}
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup aria-label="category" name="category" value={props.user.category || "none"} onChange={props.handleChange}>
                  <FormControlLabel value="left" control={<Radio />} label="left" />
                  <FormControlLabel value="neutral" control={<Radio />} label="neutral" />
                  <FormControlLabel value="right" control={<Radio />} label="right" />
                  <FormControlLabel value="positive" control={<Radio />} label="positive" />
                  <FormControlLabel value="negative" control={<Radio />} label="negative" />
                  <FormControlLabel value="none" control={<Radio />} label="none" />
                </RadioGroup>
              </FormControl>
            </FormGroup>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default User;
