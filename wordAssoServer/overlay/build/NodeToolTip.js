/* global MaterialUI,config,d3,HashMap,store,moment,io,ViewForceLinks,React,ReactDOM,InfoOverlay,ControlOverlay */
const useStyles = MaterialUI.makeStyles(theme => ({
  root: {
    border: 0,
    backgroundColor: 'red',
    margin: theme.spacing(1),
    padding: theme.spacing(1)
  },
  grid: {
    border: 0,
    display: 'block'
  },
  gridItem: {
    border: 0,
    margin: theme.spacing(1)
  },
  card: {
    // width: "20%",
    margin: theme.spacing(1),
    padding: theme.spacing(1),
    alignSelf: "center"
  },
  profileImage: {
    // width: "10rem",
    marginBottom: theme.spacing(1)
  },
  bannerImage: {// width: "10rem",
    // marginBottom: theme.spacing(1),
  },
  paragraph: {
    margin: theme.spacing(1),
    padding: theme.spacing(1)
  },
  legend: {
    margin: theme.spacing(1),
    padding: theme.spacing(1)
  }
}));

const NodeToolTip = function (props) {
  const {
    node
  } = props;
  console.log(props);
  const Grid = MaterialUI.Grid;
  const Container = MaterialUI.Container;
  const Card = MaterialUI.Card;
  const CardContent = MaterialUI.CardContent;
  const CardMedia = MaterialUI.CardMedia;
  const Paper = MaterialUI.Paper;
  const TextField = MaterialUI.TextField;
  const Button = MaterialUI.Button;
  const Icon = MaterialUI.Icon;
  const Typography = MaterialUI.Typography;
  const classes = useStyles();

  const getCategoryClass = category => {
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

  return /*#__PURE__*/React.createElement(Card, {
    className: classes.card
  }, /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Typography, {
    className: (classes.category, node.ignored ? getCategoryClass("ignored") : getCategoryClass(node.category))
  }, node.name || node.nodeId), /*#__PURE__*/React.createElement(Typography, null, node.nodeType === "user" ? `@${node.screenName}` : node.nodeType === "hashtag" ? `#${node.nodeId}` : "tweet", " "), /*#__PURE__*/React.createElement(Typography, null, node.location !== undefined ? node.location : "", " ")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Typography, null, `TWEETS: ${node.statusesCount}`), /*#__PURE__*/React.createElement(Typography, null, `${node.tweetsPerDay.toFixed(0)} tweets/day`), /*#__PURE__*/React.createElement(Typography, null, `MENTIONS: ${node.mentions}`), /*#__PURE__*/React.createElement(Typography, null, `FOLLOWERS: ${node.followersCount}`), /*#__PURE__*/React.createElement(Typography, null, `FRIENDS: ${node.friendsCount}`), /*#__PURE__*/React.createElement(Typography, null, `CREATED: ${node.createdAt}`), /*#__PURE__*/React.createElement(Typography, null, `CREATED: ${node.createdAt}`), /*#__PURE__*/React.createElement(Typography, null, `AGE: ${node.age.toFixed(1)} DAYS`), /*#__PURE__*/React.createElement(Typography, null, `CAT: MANL: ${node.category}`), /*#__PURE__*/React.createElement(Typography, null, `CAT: MANL: ${node.category}`), /*#__PURE__*/React.createElement(Typography, null, `CAT: AUTO: ${node.categoryAuto}`), /*#__PURE__*/React.createElement(Typography, null, `RATE: ${node.rate.toFixed(3)} NPM`), /*#__PURE__*/React.createElement(Typography, null, node.description || "")), /*#__PURE__*/React.createElement(CardMedia, {
    className: classes.profileImage,
    src: node.profileImageUrl || null,
    component: "img",
    onError: e => {}
  }), /*#__PURE__*/React.createElement(CardMedia, {
    className: classes.bannerImage,
    src: node.bannerImageUrl || null,
    component: "img",
    onError: e => {}
  }));
};