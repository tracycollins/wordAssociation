
const useStyles = MaterialUI.makeStyles((theme) => ({
  root: {
    border: 0,
    width: "100%",
    margin: theme.spacing(1),
    padding: theme.spacing(1)
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

const InfoPanel = function(props){

  console.log(props)

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
    <Container className={classes.root}>
      <Paper
        varient="outlined"
        aria-label="outlined primary"
        component="div"
      >
        <Icon
          className={classes.paragraph}
          onClick={props.closeButtonHandler}
        >
          cancel
        </Icon>

          <Card className={classes.legend} variant="outlined">

            <CardContent >
                <Typography>LEGEND</Typography>
            </CardContent>

            <CardMedia
              className={classes.profileImage}
              src={"info_legend.png"}
              component="img"
              onError={e => {}}              
            />

          </Card>

      </Paper>
    </Container>
  );
}
