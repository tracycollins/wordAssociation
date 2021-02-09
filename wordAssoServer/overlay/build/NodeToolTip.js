/* global MaterialUI,config,d3,HashMap,store,moment,io,ViewForceLinks,React,ReactDOM,InfoOverlay,ControlOverlay */
const useStylesNode = MaterialUI.makeStyles(theme => ({
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
  } = props; // console.log(props)

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
  const classes = useStylesNode();

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

  const generateCardContent = node => {
    switch (node.nodeType) {
      case "user":
        return /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Typography, null, `${node.statusesCount} tweets`), /*#__PURE__*/React.createElement(Typography, null, `${node.tweetsPerDay.toFixed(0)} tweets/day`), /*#__PURE__*/React.createElement(Typography, null, `${node.mentions} mentions`), /*#__PURE__*/React.createElement(Typography, null, `${node.followersCount} followers`), /*#__PURE__*/React.createElement(Typography, null, `${node.friendsCount} friends`), /*#__PURE__*/React.createElement(Typography, null, `CREATED: ${node.createdAt}`), /*#__PURE__*/React.createElement(Typography, null, `${node.ageDays.toFixed(1)} DAYS OLD`), /*#__PURE__*/React.createElement(Typography, null, `LAST: ${node.lastSeen}`), /*#__PURE__*/React.createElement(Typography, null, `CAT: MANL: ${node.category}`), /*#__PURE__*/React.createElement(Typography, null, `CAT: AUTO: ${node.categoryAuto}`), /*#__PURE__*/React.createElement(Typography, null, `${node.rate.toFixed(3)} NPM`), /*#__PURE__*/React.createElement(Typography, null, node.description || ""), /*#__PURE__*/React.createElement(CardMedia, {
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

      case "hashtag":
        return /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Typography, null, `CAT: MANL: ${node.category}`), /*#__PURE__*/React.createElement(Typography, null, `${node.mentions} mentions`), /*#__PURE__*/React.createElement(Typography, null, `${node.rate.toFixed(3)} NPM`), /*#__PURE__*/React.createElement(Typography, null, `CREATED: ${node.createdAt}`), /*#__PURE__*/React.createElement(Typography, null, `${node.ageDays.toFixed(1)} DAYS OLD`));

      case "tweet":
        return /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Typography, null, `@${node.user.screenName}`), /*#__PURE__*/React.createElement(Typography, null, `${node.mentions} mentions`), /*#__PURE__*/React.createElement(Typography, null, `CREATED: ${node.createdAt}`), /*#__PURE__*/React.createElement(Typography, null, `${node.ageDays.toFixed(1)} DAYS OLD`), /*#__PURE__*/React.createElement(Typography, null, `${node.rate.toFixed(3)} NPM`), /*#__PURE__*/React.createElement(Typography, null, node.status || ""));

        defautlt: return /*#__PURE__*/React.createElement(CardContent, null);

    }
  };

  return /*#__PURE__*/React.createElement(Card, {
    className: classes.card
  }, /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Typography, {
    className: (classes.category, node.ignored ? getCategoryClass("ignored") : getCategoryClass(node.category))
  }, node.name || node.nodeId), /*#__PURE__*/React.createElement(Typography, null, node.nodeType === "user" ? `@${node.screenName}` : node.nodeType === "hashtag" ? `#${node.nodeId}` : "tweet", " "), /*#__PURE__*/React.createElement(Typography, null, node.location !== undefined ? node.location : "", " ")), generateCardContent(node));
};