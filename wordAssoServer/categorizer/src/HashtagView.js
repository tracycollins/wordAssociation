import React from "react";
import clsx from "clsx";
import { Tweet } from "react-twitter-widgets";

import Duration from "duration";
import { green } from "@material-ui/core/colors";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Checkbox from "@material-ui/core/Checkbox";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Grid from "@material-ui/core/Grid";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { TableHead } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    // flexGrow: 2,
  },
  grid: {
    display: "flex",
  },
  gridItem: {
    margin: 5,
  },
  tweets: {
    // margin: 5,
    overflow: "auto",
    maxHeight: 540,
  },
  hashtag: {
    // margin: theme.spacing(2),
    raised: false,
    // maxWidth: 300,
  },
  table: {},
  tableRowGreen: {
    backgroundColor: "lightgreen",
  },
  appBar: {
    backgroundColor: "white",
    margin: 2,
  },
  statusBar: {
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
    flexGrow: 1,
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    "&:hover": {
      backgroundColor: "lightgray",
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(3),
      width: "auto",
    },
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
  selectCategory: {
    fontSize: "0.7rem",
    backgroundColor: "#ddeeee",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  radioGroupCategory: {
    fontSize: "0.7rem",
    backgroundColor: "#ddeeee",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    margin: theme.spacing(1),
  },
  checkbox: {
    color: green[400],
    "&$checked": {
      color: green[600],
    },
  },
  checked: {},
  radioButtonLabel: {
    fontSize: "0.7rem",
  },
  radioButton: {},

  buttonGroupLabel: {
    color: "blue",
    // marginRight: theme.spacing(1),
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
    // margin: 5,
  },

  autoCategory: {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: "white",
  },

  category: {
    fontSize: "0.9rem",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
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
    backgroundColor: "lightgray",
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

const HashtagView = (props) => {
  const classes = useStyles();

  const createdAt = props.hashtag.createdAt
    ? formatDate(props.hashtag.createdAt)
    : "---";
  const lastSeen = props.hashtag.lastSeen
    ? formatDate(props.hashtag.lastSeen)
    : "---";

  const lastSeenDuration = props.hashtag.lastSeen
    ? new Duration(new Date(props.hashtag.lastSeen)).toString(1, 4)
    : "---";
  const twitterAge = props.hashtag.createdAt
    ? new Duration(new Date(props.hashtag.createdAt))
    : "---";
  const twitterAgeString = props.hashtag.createdAt
    ? twitterAge.toString(1, 4)
    : "---";

  const openHashtagTwitterPage = () => {
    console.log("open twitter");
    window.open(
      `https://twitter.com/search?f=tweets&q=%23${
        props.hashtag.nodeId || null
      }`,
      "_blank"
    ); //to open new page
  };

  const displayTweets = (tweets) => {
    if (!tweets || tweets === undefined || tweets.statuses === undefined) {
      return <></>;
    }
    return tweets.statuses.map((tweet) => {
      return (
        <Tweet
          key={tweet.id_str}
          tweetId={tweet.id_str}
          options={{ width: "400" }}
        />
      );
    });
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
        {/* <Grid item className={classes.gridItem} xs={3}>
          <Card className={classes.card} variant="outlined">
            <CardContent onClick={openHashtagTwitterPage}>
              <Typography
                className={clsx(
                  classes.category,
                  props.hashtag.ignored
                    ? getCategoryClass("ignored")
                    : getCategoryClass(props.hashtag.category)
                )}
                variant="h6"
              >
                #
                {props.statusHashtag === "notFound"
                  ? props.hashtag.nodeId + " NOT FOUND"
                  : props.hashtag.nodeId}
              </Typography>
            </CardContent>
          </Card>
        </Grid> */}

        <Grid item className={classes.gridItem} xs={3}>
          <Card className={classes.hashtag} variant="outlined">
            <CardContent onClick={openHashtagTwitterPage}>
              <Typography
                className={clsx(
                  classes.category,
                  props.hashtag.ignored
                    ? getCategoryClass("ignored")
                    : getCategoryClass(props.hashtag.category)
                )}
                variant="h6"
              >
                #
                {props.statusHashtag === "notFound"
                  ? props.hashtag.nodeId + " NOT FOUND"
                  : props.hashtag.nodeId}
              </Typography>
            </CardContent>
          </Card>
          <div className={classes.tweets}>{displayTweets(props.tweets)}</div>
        </Grid>

        <Grid item className={classes.gridItem} xs={3}>
          <TableContainer>
            <Table className={classes.table} size="small">
              <TableBody>
                <TableRow>
                  <TableCell>id</TableCell>
                  <TableCell align="right">{props.hashtag.nodeId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>created</TableCell>
                  <TableCell align="right">{createdAt}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>twitter age</TableCell>
                  <TableCell align="right">{twitterAgeString}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>last seen</TableCell>
                  <TableCell align="right">{lastSeen}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>last seen</TableCell>
                  <TableCell align="right">{lastSeenDuration} ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>mentions</TableCell>
                  <TableCell align="right">
                    {props.hashtag.mentions ? props.hashtag.mentions : "---"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>mentions/min</TableCell>
                  <TableCell align="right">
                    {props.hashtag.rate ? props.hashtag.rate.toFixed(1) : "---"}
                  </TableCell>
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
                  <TableCell align="right">
                    {props.stats.hashtag.category.left}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>neutral</TableCell>
                  <TableCell align="right">
                    {props.stats.hashtag.category.neutral}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>right</TableCell>
                  <TableCell align="right">
                    {props.stats.hashtag.category.right}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>positive</TableCell>
                  <TableCell align="right">
                    {props.stats.hashtag.category.positive}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>negative</TableCell>
                  <TableCell align="right">
                    {props.stats.hashtag.category.negative}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item className={classes.gridItem} xs={1}>
          <FormGroup>
            <FormControl>
              <InputLabel id="category">CATEGORY</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                name="category"
                className={clsx(
                  classes.category,
                  getCategoryClass(props.hashtag.category)
                )}
                align="center"
                value={props.hashtag.category || "none"}
                onChange={(event) =>
                  props.handleNodeChange(event, props.hashtag)
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
                classes.autoCategory,
                getCategoryClass(props.hashtag.categoryAuto)
              )}
              align="center"
            >
              AUTO:{" "}
              {props.hashtag.categoryAuto
                ? props.hashtag.categoryAuto.toUpperCase()
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
                    checked={props.hashtag.ignored || false}
                    onChange={(event) =>
                      props.handleNodeChange(event, props.hashtag)
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
            </FormControl>
          </FormGroup>
        </Grid>
      </Grid>
    </>
  );
};

export default HashtagView;
