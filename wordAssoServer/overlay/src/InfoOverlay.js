/* global MaterialUI,config,d3,HashMap,store,moment,io,ViewForceLinks,React,ReactDOM,InfoOverlay,ControlOverlay */
const useStyles = MaterialUI.makeStyles((theme) => ({
  legend: {
    // width: "80%",
  }
}));

const InfoOverlay = function(props){

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

  return (
    <Card className={classes.legend} variant="outlined">
      <CardMedia
        // className={classes.media}
        src={"/public/assets/images/info_legend.png"}
        component="img"
        onError={e => {}}              
      />
    </Card>
  );
}