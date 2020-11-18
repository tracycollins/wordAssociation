import React, { useState, useEffect } from 'react';
import { Tweet } from 'react-twitter-widgets'

import Duration from 'duration';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Card from '@material-ui/core/Card';
// import CardActionArea from '@material-ui/core/CardActionArea';
// import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
// import CardHeader from '@material-ui/core/CardHeader';
// import CardMedia from '@material-ui/core/CardMedia';
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
    maxWidth: 400,
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
    color: 'blue',
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
    backgroundColor: 'blue',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
  },
  neutral: {
    backgroundColor: 'gray',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
  },
  right: {
    backgroundColor: 'red',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
  },
  none: {
    backgroundColor: 'white',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
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

const HashtagView = (props) => {

  const classes = useStyles();

  const createdAt = formatDate(props.hashtag.createdAt)
  const lastSeen = formatDate(props.hashtag.lastSeen)
 
  const lastSeenDuration = new Duration(new Date(props.hashtag.lastSeen)).toString(1, 4)
  const twitterAge = props.hashtag.createdAt ? new Duration(new Date(props.hashtag.createdAt)) : new Duration(new Date())
  const twitterAgeString = twitterAge.toString(1, 4)

  const [hashtagSearch, setHashtagSearch] = useState(props.hashtag.nodeId);

  useEffect(() => {
    setHashtagSearch(props.hashtag.nodeId)
  }, [props])
  
  const handleChangeSearch = (event) => {
    console.log("handleChangeSearch: " + event.target.value)
    setHashtagSearch(event.target.value);
  }

  const handleKeyPress = (event) => {
    if (event.charCode === 13) { // enter key pressed
      console.log("ENTER: hashtagSearch: " + hashtagSearch)
      props.handleSearchNode(hashtagSearch)
    }
  }

  const openHashtagTwitterPage = () => {
    console.log("open twitter")
    window.open(`https://twitter.com/search?f=tweets&q=%23${props.hashtag.nodeId || null}`, "_blank") //to open new page
  }

  const displayTweets = (tweets) => {
    if (tweets.statuses === undefined) { return <></>}
    return tweets.statuses.map((tweet) => {
      return <Tweet key={tweet.id_str} tweetId={tweet.id_str} options={{ width: "400" }} />
    })
  }

  return (
    <>
      <AppBar  className={classes.appBar} position="static">
        <Toolbar variant="dense">

          <Typography variant="h6" className={classes.title}>
            Hashtag
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
              value={hashtagSearch}
              onKeyPress={handleKeyPress}
              onChange={handleChangeSearch}
            />
          </div>

          <Typography className={classes.buttonGroupLabel}>
            UNCAT
          </Typography>   

          <ButtonGroup variant="contained" color="primary" size="small" aria-label="small button group">
            <Button onClick={(event) => props.handleNodeChange(event, props.hashtag)} name="all" >ALL: {props.stats.hashtag.uncategorized.all}</Button>
          </ButtonGroup>

        </Toolbar>
      </AppBar>
      <Grid className={classes.grid}>
        <Grid item className={classes.gridItem} xs={3}>
          <Card className={classes.card} variant="outlined">
            <CardContent onClick={openHashtagTwitterPage}>
              <Typography variant="h6">#{props.hashtag.nodeId}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item className={classes.gridItem} xs={3}>
          {displayTweets(props.tweets)}
        </Grid>
        <Grid item className={classes.gridItem} xs={3}>
          <TableContainer>
            <Table className={classes.table} size="small">
              <TableBody>
                <TableRow>
                  <TableCell>id</TableCell><TableCell align="right">{props.hashtag.nodeId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>created</TableCell><TableCell align="right">{createdAt}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>twitter age</TableCell><TableCell align="right">{twitterAgeString}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>last seen</TableCell><TableCell align="right">{lastSeen}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>last seen</TableCell><TableCell align="right">{lastSeenDuration} ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>mentions</TableCell><TableCell align="right">{props.hashtag.mentions}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>mentions/min</TableCell><TableCell align="right">{props.hashtag.rate ? props.hashtag.rate.toFixed(1) : 0}</TableCell>
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
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>left</TableCell>
                  <TableCell align="right">{props.stats.hashtag.manual.left}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>neutral</TableCell>
                  <TableCell align="right">{props.stats.hashtag.manual.neutral}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>right</TableCell>
                  <TableCell align="right">{props.stats.hashtag.manual.right}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>positive</TableCell>
                  <TableCell align="right">{props.stats.hashtag.manual.positive}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>negative</TableCell>
                  <TableCell align="right">{props.stats.hashtag.manual.negative}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item className={classes.gridItem} xs={1}>
          <FormGroup>
            <FormControl component="fieldset">
              <RadioGroup aria-label="category" name="category" value={props.hashtag.category || "none"} onChange={(event) => props.handleNodeChange(event, props.hashtag)}>
                <FormControlLabel labelPlacement="start" value="left" control={<Radio />} label="left"/>
                <FormControlLabel labelPlacement="start" value="neutral" control={<Radio />} label="neutral" />
                <FormControlLabel labelPlacement="start" value="right" control={<Radio />} label="right" />
                <FormControlLabel labelPlacement="start" value="positive" control={<Radio />} label="positive" />
                <FormControlLabel labelPlacement="start" value="negative" control={<Radio />} label="negative" />
                <FormControlLabel labelPlacement="start" value="none" control={<Radio />} label="none" />
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={<Checkbox checked={props.hashtag.ignored || false} onChange={(event) => props.handleNodeChange(event, props.hashtag)} name="ignored" />}
              label="ignored"
              labelPlacement="start"
            />
          </FormGroup>
        </Grid>
      </Grid>
    </>
  );
}

export default HashtagView;
