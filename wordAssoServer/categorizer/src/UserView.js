import React, { useState } from 'react';
import { Timeline } from 'react-twitter-widgets'

import Duration from 'duration';
import clsx from 'clsx';

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
import { makeStyles, withStyles } from '@material-ui/core/styles';

const fontSizeCategory = '0.7rem';

const StyledTableCell = withStyles((theme) => ({
  head: {
    // backgroundColor: theme.palette.common.black,
    // color: theme.palette.common.white,
  },
  body: {
    fontSize: 12,
  },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  root: {
    // '&:nth-of-type(odd)': {
    //   backgroundColor: theme.palette.action.hover,
    // },
  },
}))(TableRow);


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
    alignItems: 'stretch',
  },
  gridItem: {
    margin: theme.spacing(1),
  },  
  card: {
    maxWidth: "85%",
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
  radioGroupCategory: {
    fontSize: '0.5rem',
    backgroundColor: '#ddeeee',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  radioButtonLabel: {
    fontSize: '0.9rem'
  },
  radioButton: {
  },
  table: {
    borderRadius: theme.shape.borderRadius,
  },
  tableHead: {
    backgroundColor: '#ddeeee',
  },
  tableCell: {
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
    raised: false,
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
    backgroundColor: 'yellow',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'black',
    marginBottom: theme.spacing(1),
  },

}));

function StyledRadio(props) {
  const classes = useStyles();
  return (
    <Radio
      className={classes.radioButton}
      disableRipple
      color="default"
      checkedIcon={<span className={clsx(classes.icon, classes.checkedIcon)} />}
      icon={<span className={classes.icon} />}
      {...props}
    />
  );
}


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
          <Grid item className={classes.gridItem} xs={3}>
            <Timeline
              dataSource={{
                sourceType: 'profile',
                screenName: props.user.screenName
              }}
              options={{width: '100%', height: '640'}}
            />
          </Grid>
          <Grid item className={classes.gridItem} xs={2}>
            <TableContainer>
              <Table className={classes.table} size="small">
                <TableHead>
                  <StyledTableRow className={classes.tableHead}>
                    <StyledTableCell>@{props.user.screenName}</StyledTableCell><StyledTableCell align="right"></StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  <StyledTableRow>
                    <StyledTableCell>Twitter ID</StyledTableCell><StyledTableCell align="right">{props.user.nodeId}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Location</StyledTableCell><StyledTableCell align="right">{props.user.location}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Created</StyledTableCell><StyledTableCell align="right">{createdAt}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Twitter age</StyledTableCell><StyledTableCell align="right">{twitterAgeString}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow className={props.user.followersCount > 5000 ? classes.tableRowGreen : null}>
                    <StyledTableCell>Followers</StyledTableCell><StyledTableCell align="right">{props.user.followersCount}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Friends</StyledTableCell><StyledTableCell align="right">{props.user.friendsCount}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Tweets</StyledTableCell><StyledTableCell align="right">{props.user.statusesCount}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Tweets/day</StyledTableCell><StyledTableCell align="right">{tweetRate}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Active</StyledTableCell><StyledTableCell align="right">{lastSeen} ({lastSeenDuration} ago)</StyledTableCell>
                  </StyledTableRow>
                  {/* <StyledTableRow>
                    <StyledTableCell>Last Active</StyledTableCell><StyledTableCell align="right">{lastSeenDuration} ago</StyledTableCell>
                  </StyledTableRow> */}
                  <StyledTableRow>
                    <StyledTableCell>Mentions</StyledTableCell><StyledTableCell align="right">{props.user.mentions}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Mentions/hour</StyledTableCell><StyledTableCell align="right">{props.user.rate ? 60*props.user.rate.toFixed(2) : 0}</StyledTableCell>
                  </StyledTableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item className={classes.gridItem} xs={2}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <StyledTableRow className={classes.tableHead}>
                    <StyledTableCell colSpan={3}>ALL USERS</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>CAT</StyledTableCell>
                    <StyledTableCell align="right">MAN</StyledTableCell>
                    <StyledTableCell align="right">AUTO</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  <StyledTableRow > 
                    <StyledTableCell>LEFT</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.manual.left}</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.auto.left}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell >RIGHT</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.manual.right}</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.auto.right}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell >NEUTRAL</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.manual.neutral}</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.auto.neutral}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell >POSITIVE</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.manual.positive}</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.auto.positive}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell >NEGATIVE</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.manual.negative}</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.auto.negative}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell >NONE</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.manual.none}</StyledTableCell>
                    <StyledTableCell align="right">{props.stats.user.auto.none}</StyledTableCell>
                  </StyledTableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item className={classes.gridItem} xs={1}>
            <FormGroup>
              <FormControl component="fieldset">
                <RadioGroup 
                  className={classes.radioGroupCategory}
                  aria-label="category" 
                  name="category" 
                  // size="small"
                  value={props.user.category || "none"} 
                  onChange={(event) => props.handleNodeChange(event, props.user)}
                >
                  <FormControlLabel value="left" control={<StyledRadio/>} label={<Typography className={classes.radioButtonLabel}>LEFT</Typography>}/>
                  <FormControlLabel value="right" control={<StyledRadio/>} label={<Typography className={classes.radioButtonLabel}>RIGHT</Typography>} />
                  <FormControlLabel value="neutral" control={<StyledRadio/>} label={<Typography className={classes.radioButtonLabel}>NEUTRAL</Typography>} />
                  <FormControlLabel value="positive" control={<StyledRadio/>} label={<Typography className={classes.radioButtonLabel}>POSITIVE</Typography>} />
                  <FormControlLabel value="negative" control={<StyledRadio/>} label={<Typography className={classes.radioButtonLabel}>NEGATIVE</Typography>} />
                  <FormControlLabel value="none" control={<StyledRadio/>} label={<Typography className={classes.radioButtonLabel}>NONE</Typography>} />
                </RadioGroup>
              </FormControl>

              <FormControl 
                component="fieldset"
                className={classes.radioGroupCategory}
                size="small"
              >
                <FormControlLabel
                  control={<Checkbox size="small" checked={props.user.following || false} onChange={(event) => props.handleNodeChange(event, props.user)} name="following" />}
                  label={<Typography className={classes.radioButtonLabel}>FOLLOWING</Typography>}
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={props.user.categoryVerified || false} onChange={(event) => props.handleNodeChange(event, props.user)} name="catVerified" />}
                  label={<Typography className={classes.radioButtonLabel}>VERIFIED</Typography>}
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={props.user.ignored || false} onChange={(event) => props.handleNodeChange(event, props.user)} name="ignored" />}
                  label={<Typography className={classes.radioButtonLabel}>IGNORED</Typography>}
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={props.user.isBot || false} onChange={(event) => props.handleNodeChange(event, props.user)} name="isBot" />}
                  label={<Typography className={classes.radioButtonLabel}>BOT</Typography>}
                />
              </FormControl>
            </FormGroup>
          </Grid>
        </Grid>
    </>
  );
}

export default User;
