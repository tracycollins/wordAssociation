/* global MaterialUI,config,d3,HashMap,store,moment,io,ViewForceLinks,React,ReactDOM,InfoOverlay,ControlOverlay */
const useStyles = MaterialUI.makeStyles((theme) => ({
  root: {
    border: 0,
    backgroundColor: 'red',
    margin: theme.spacing(1),
    padding: theme.spacing(1)
  },
  grid: {
    border: 0,
    display: 'block',
  },
  gridItem: {
    border: 0,
    margin: theme.spacing(1),
  },
  card: {
    // width: "20%",
    margin: theme.spacing(1),
    padding: theme.spacing(1),
    alignSelf: "center",
  },
  profileImage: {
    // width: "10rem",
    marginBottom: theme.spacing(1),
  },
  bannerImage: {
    // width: "10rem",
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

const NodeToolTip = function(props){

  const { node } = props;
  console.log(props)

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
    <Card className={classes.card}>
      <CardContent >
          <Typography 
            className={classes.category, node.ignored ? getCategoryClass("ignored") : getCategoryClass(node.category)} 
          >
            {node.name || node.nodeId}
          </Typography>
          <Typography >{node.nodeType === "user" ? `@${node.screenName}` : node.nodeType === "hashtag" ? `#${node.nodeId}` : "tweet"} </Typography>
          <Typography>{node.location !== undefined ? node.location : ""} </Typography>
      </CardContent>
      <CardContent >
          <Typography>{`TWEETS: ${node.statusesCount}`}</Typography>
          <Typography>{`${node.tweetsPerDay.toFixed(0)} tweets/day`}</Typography>
          <Typography>{`MENTIONS: ${node.mentions}`}</Typography>
          <Typography>{`FOLLOWERS: ${node.followersCount}`}</Typography>
          <Typography>{`FRIENDS: ${node.friendsCount}`}</Typography>
          <Typography>{`CREATED: ${node.createdAt}`}</Typography>
          <Typography>{`CREATED: ${node.createdAt}`}</Typography>
          <Typography>{`AGE: ${node.age.toFixed(1)} DAYS`}</Typography>
          <Typography>{`CAT: MANL: ${node.category}`}</Typography>
          <Typography>{`CAT: MANL: ${node.category}`}</Typography>
          <Typography>{`CAT: AUTO: ${node.categoryAuto}`}</Typography>
          <Typography>{`RATE: ${node.rate.toFixed(3)} NPM`}</Typography>
          <Typography>{node.description || ""}</Typography>
      </CardContent>

      <CardMedia
        className={classes.profileImage}
        src={node.profileImageUrl || null}
        component="img"
        onError={e => {}}              
      />
      <CardMedia 
        className={classes.bannerImage} 
        src={node.bannerImageUrl || null} 
        component="img"
        onError={e => {}}              
      />
    </Card>
  );
}