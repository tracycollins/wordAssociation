import React from "react";
import { green, grey } from "@material-ui/core/colors";
import clsx from "clsx";
import { Timeline } from "react-twitter-widgets";
import Duration from "duration";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Checkbox from "@material-ui/core/Checkbox";
// import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import twitterBanner from "./threecee-twitter-banner.png";

const StyledTableCell = withStyles((theme) => ({
  head: {},
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
  },
  appBar: {
    border: 0,
    backgroundColor: "white",
  },
  grid: {
    border: 0,
    display: "flex",
  },
  gridItem: {
    border: 0,
    justifyContent: "center",
    marginRight: theme.spacing(1),
  },
  gridHeader: {
    padding: theme.spacing(1),
    border: 0,
  },
  paper: {
    padding: theme.spacing(1),
    outlined: true,
    variant: "outlined",
  },
  timelineError: {
    textAlign: "center",
    border: "2px solid red",
    color: "red",
    backgroundColor: "white",
  },
  card: {
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    marginTop: theme.spacing(1),
    fontSize: 12,
  },
  profileImage: {
    marginBottom: theme.spacing(1),
  },
  bannerImage: {
    // : theme.spacing(1),
  },
  icon: {
    borderRadius: "50%",
    width: 16,
    height: 16,
    boxShadow:
      "inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)",
    backgroundColor: "#f5f8fa",
    backgroundImage:
      "linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))",
    "$root.Mui-focusVisible &": {
      outline: "2px auto rgba(19,124,189,.6)",
      outlineOffset: 2,
    },
    "input:hover ~ &": {
      backgroundColor: "#ebf1f5",
    },
    "input:disabled ~ &": {
      boxShadow: "none",
      background: "rgba(206,217,224,.5)",
    },
  },
  checkedIcon: {
    backgroundColor: "#137cbd",
    backgroundImage:
      "linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))",
    "&:before": {
      display: "block",
      width: 16,
      height: 16,
      backgroundImage: "radial-gradient(#fff,#fff 28%,transparent 32%)",
      content: '""',
    },
    "input:hover ~ &": {
      backgroundColor: "#106ba3",
    },
  },
  selectCategory: {
    border: "1px solid darkgray",
    borderRadius: theme.shape.borderRadius,
    fontSize: "0.9rem",
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  radioGroupCategory: {
    maxWidth: "90%",
    fontSize: "0.5rem",
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  checkbox: {
    color: green[400],
    "&$checked": {
      color: green[600],
    },
  },
  checked: {},
  radioButtonLabel: {
    fontSize: "0.9rem",
  },
  radioButton: {},
  table: {
    maxWidth: "95%",
    align: "center",
    padding: theme.spacing(1),
  },
  tableHead: {
    backgroundColor: "#ddeeee",
  },
  tableCell: {},
  tableCategorized: {
    backgroundColor: "#ddeeee",
  },
  tableRowGreen: {
    backgroundColor: "lightgreen",
  },
  statusBar: {
    raised: false,
    backgroundColor: "white",
    margin: 2,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    color: "blue",
  },
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    "&:hover": { backgroundColor: "#ddeeee" },
    marginRight: theme.spacing(1),
    width: "100%",
    [theme.breakpoints.up("sm")]: { width: "auto" },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRoot: {
    color: "primary",
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },

  buttonGroupLabel: {
    color: "blue",
    marginRight: theme.spacing(1),
  },
  buttonAll: {
    color: "black",
  },
  buttonLeft: {
    color: "blue",
  },
  buttonNeutral: {
    color: "gray",
  },
  buttonRight: {
    color: "red",
  },
  buttonMismatch: {
    margin: 5,
  },
  autoCategory: {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: "white",
    marginBottom: theme.spacing(1),
  },
  category: {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    // marginBottom: theme.spacing(1),
  },

  left: {
    backgroundColor: "blue",
    color: "white",
  },
  neutral: {
    backgroundColor: "darkgray",
    color: "white",
  },
  right: {
    backgroundColor: "red",
    color: "white",
  },
  positive: {
    backgroundColor: "green",
    color: "white",
  },
  negative: {
    backgroundColor: "yellow",
    color: "black",
  },
  none: {
    backgroundColor: "white",
    color: "black",
  },
  ignored: {
    backgroundColor: "yellow",
    color: "black",
  },
}));

const formatDate = (dateInput) => {
  return new Date(dateInput).toLocaleDateString("en-gb", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const defaultProfileImage = "/logo192.png";
const defaultBannerImage = twitterBanner;

const User = (props) => {
  const classes = useStyles();

  const createdAt = formatDate(props.user.createdAt);
  const lastSeen = formatDate(props.user.lastSeen);

  const lastSeenDuration = new Duration(new Date(props.user.lastSeen)).toString(
    1,
    4
  );
  const twitterAge = props.user.createdAt
    ? new Duration(new Date(props.user.createdAt))
    : new Duration(new Date());
  const twitterAgeString = twitterAge.toString(1, 4);

  const tweetRate =
    twitterAge.days > 0
      ? Math.ceil(props.user.statusesCount / twitterAge.days)
      : 0;

  const openUserTwitterPage = () => {
    console.log("open twitter");
    window.open(
      `http://twitter.com/${props.user.screenName || null}`,
      "_blank"
    ); //to open new page
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case "left":
      case "neutral":
      case "right":
      case "positive":
      case "negative":
      case "ignored":
        return classes[category];
      default:
        return classes.none;
    }
  };

  return (
    <>
      <Grid className={classes.grid}>
        <Grid item className={classes.gridItem} xs={3}>
          <Card className={classes.card} variant="outlined">
            <CardContent onClick={openUserTwitterPage}>
              <Typography
                className={clsx(
                  classes.category,
                  props.user.ignored
                    ? getCategoryClass("ignored")
                    : getCategoryClass(props.user.category)
                )}
              >
                {props.user.name}
              </Typography>
              {/* <Typography>@{props.user.screenName} </Typography> */}
              {/* <Divider /> */}
              <Typography className={classes.description}>
                {props.user.description}
              </Typography>
            </CardContent>

            <CardMedia
              className={classes.profileImage}
              src={props.user.profileImageUrl || defaultProfileImage}
              component="img"
              onError={(e) => {}}
            />
            <CardMedia
              className={classes.bannerImage}
              src={props.user.bannerImageUrl || defaultBannerImage}
              component="img"
              onError={(e) => {}}
            />
          </Card>
        </Grid>
        <Grid item className={classes.gridItem} xs={3}>
          <Paper className={classes.paper} elevation={0} variant="outlined">
            <Timeline
              dataSource={{
                sourceType: "profile",
                screenName: props.user.screenName,
              }}
              options={{ width: "100%", height: "640" }}
              renderError={(_err) => (
                <div className={classes.timelineError}>
                  <p>COULD NOT LOAD USER TWEETS</p>
                </div>
              )}
            />
          </Paper>
        </Grid>
        <Grid item className={classes.gridItem} xs={3}>
          <Paper className={classes.paper} elevation={0} variant="outlined">
            {/* <Typography className={classes.gridHeader}>STATS</Typography> */}
            <TableContainer className={classes.table}>
              <Table size="small">
                <TableHead>
                  <StyledTableRow className={classes.tableHead}>
                    <StyledTableCell colSpan={2}>
                      @{props.user.screenName}
                    </StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  <StyledTableRow>
                    <StyledTableCell>Twitter ID</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.user.nodeId}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Location</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.user.location}
                    </StyledTableCell>
                  </StyledTableRow>
                  {/* <StyledTableRow>
                    <StyledTableCell>Geo Enabled</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.user.geoEnabled ? "TRUE" : "FALSE"}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Geo Valid</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.user.geoValid ? "TRUE" : "FALSE"}
                    </StyledTableCell>
                  </StyledTableRow> */}
                  <StyledTableRow>
                    <StyledTableCell>Created</StyledTableCell>
                    <StyledTableCell align="right">{createdAt}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Twitter age</StyledTableCell>
                    <StyledTableCell align="right">
                      {twitterAgeString}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow
                    className={
                      props.user.followersCount > 5000
                        ? classes.tableRowGreen
                        : null
                    }
                  >
                    <StyledTableCell>Followers</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.user.followersCount}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Friends</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.user.friendsCount}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Tweets</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.user.statusesCount}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Tweets/day</StyledTableCell>
                    <StyledTableCell align="right">{tweetRate}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Active</StyledTableCell>
                    <StyledTableCell align="right">
                      {lastSeen} ({lastSeenDuration} ago)
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Mentions</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.user.mentions}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>Mentions/hour</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.user.rate ? 60 * props.user.rate.toFixed(2) : 0}
                    </StyledTableCell>
                  </StyledTableRow>
                </TableBody>
              </Table>
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
                  <StyledTableRow>
                    <StyledTableCell>LEFT</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.category.left}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.categoryAuto.left}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>RIGHT</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.category.right}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.categoryAuto.right}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>NEUTRAL</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.category.neutral}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.categoryAuto.neutral}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>POSITIVE</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.category.positive}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.categoryAuto.positive}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>NEGATIVE</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.category.negative}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.categoryAuto.negative}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell>NONE</StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.category.none}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {props.stats.user.categoryAuto.none}
                    </StyledTableCell>
                  </StyledTableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item className={classes.gridItem} xs={2}>
          <Paper className={classes.paper} elevation={0} variant="outlined">
            {/* <Typography className={classes.gridHeader}>SETTINGS</Typography> */}
            <FormGroup align="center">
              <FormControl align="center">
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  className={clsx(
                    classes.selectCategory,
                    getCategoryClass(props.user.category)
                  )}
                  value={props.user.category || "none"}
                  onChange={(event) =>
                    props.handleNodeChange(event, props.user)
                  }
                >
                  <MenuItem dense={true} value={"none"}>
                    NONE
                  </MenuItem>
                  <MenuItem dense={true} value={"left"}>
                    LEFT
                  </MenuItem>
                  <MenuItem dense={true} value={"neutral"}>
                    NEUTRAL
                  </MenuItem>
                  <MenuItem dense={true} value={"right"}>
                    RIGHT
                  </MenuItem>
                  <MenuItem dense={true} value={"positive"}>
                    POSITIVE
                  </MenuItem>
                  <MenuItem dense={true} value={"negative"}>
                    NEGATIVE
                  </MenuItem>
                </Select>
              </FormControl>

              <Typography
                className={clsx(
                  classes.selectCategory,
                  getCategoryClass(props.user.categoryAuto)
                )}
              >
                AUTO:{" "}
                {props.user.categoryAuto
                  ? props.user.categoryAuto.toUpperCase()
                  : "NONE"}
              </Typography>

              <FormControl
                component="fieldset"
                className={classes.radioGroupCategory}
                size="small"
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      className={classes.checkbox}
                      size="small"
                      checked={props.user.following || false}
                      onChange={(event) =>
                        props.handleNodeChange(event, props.user)
                      }
                      name="following"
                    />
                  }
                  label={
                    <Typography className={classes.radioButtonLabel}>
                      FOLLOWING
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      className={classes.checkbox}
                      size="small"
                      checked={props.user.categoryVerified || false}
                      onChange={(event) =>
                        props.handleNodeChange(event, props.user)
                      }
                      name="catVerified"
                    />
                  }
                  label={
                    <Typography className={classes.radioButtonLabel}>
                      VERIFIED
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      className={classes.checkbox}
                      size="small"
                      checked={props.user.ignored || false}
                      onChange={(event) =>
                        props.handleNodeChange(event, props.user)
                      }
                      name="ignored"
                    />
                  }
                  label={
                    <Typography className={classes.radioButtonLabel}>
                      IGNORED
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      className={classes.checkbox}
                      size="small"
                      checked={props.user.isBot || false}
                      onChange={(event) =>
                        props.handleNodeChange(event, props.user)
                      }
                      name="isBot"
                    />
                  }
                  label={
                    <Typography className={classes.radioButtonLabel}>
                      BOT
                    </Typography>
                  }
                />
              </FormControl>

              <FormControl
                component="fieldset"
                className={classes.radioGroupCategory}
                size="small"
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      className={classes.checkbox}
                      size="small"
                      checked={props.filterLowFollowersCount || false}
                      onChange={(event) => props.handleFilterChange(event)}
                      name="filterLowFollowersCount"
                    />
                  }
                  label={
                    <Typography className={classes.radioButtonLabel}>
                      FILTER LOW FOLLOWERS
                    </Typography>
                  }
                />
              </FormControl>
            </FormGroup>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default User;
