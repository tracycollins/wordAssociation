const ControlOverlay = function (props) {
  // test
  const Box = MaterialUI.Box;
  const Icon = MaterialUI.Icon;
  const ButtonGroup = MaterialUI.ButtonGroup;
  return /*#__PURE__*/React.createElement(Box, {
    "aria-label": "outlined primary"
  }, /*#__PURE__*/React.createElement(Icon, {
    onClick: props.settingsButtonHandler
  }, "settings"), /*#__PURE__*/React.createElement(Icon, {
    onClick: props.fullscreenButtonHandler
  }, "fullscreen"), /*#__PURE__*/React.createElement(Icon, {
    onClick: props.infoButtonHandler
  }, "info"));
};