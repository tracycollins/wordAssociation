const useStyles = MaterialUI.makeStyles(theme => ({
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

const InfoOverlay = function (props) {
  console.log(props);
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
  return /*#__PURE__*/React.createElement(Container, {
    className: classes.root
  }, /*#__PURE__*/React.createElement(Paper, {
    varient: "outlined",
    "aria-label": "outlined primary",
    component: "div"
  }, /*#__PURE__*/React.createElement(Icon, {
    className: classes.paragraph,
    onClick: props.closeButtonHandler
  }, "cancel"), /*#__PURE__*/React.createElement(Card, {
    className: classes.legend,
    variant: "outlined"
  }, /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Typography, null, "LEGEND")), /*#__PURE__*/React.createElement(CardMedia, {
    className: classes.profileImage,
    src: "info_legend.png",
    component: "img",
    onError: e => {}
  }))));
};