
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
  }
}));

const InfoPanel = function(props){

  console.log(props)

  const Container = MaterialUI.Container;
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

        <Typography className={classes.paragraph}>
          Information coming soon.
        </Typography>

      </Paper>
    </Container>
  );
}
