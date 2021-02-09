var _jsxFileName = "/Volumes/RAID1/projects/wordAssociation/wordAssoServer/js/libs/control.js";

const ControlPanel = function (props) {
  const Box = MaterialUI.Box;
  const Icon = MaterialUI.Icon;
  const ButtonGroup = MaterialUI.ButtonGroup;
  return /*#__PURE__*/React.createElement(Box, {
    "aria-label": "outlined primary",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 8,
      columnNumber: 5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    onClick: props.settingsButtonHandler,
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 9,
      columnNumber: 7
    }
  }, "settings"), /*#__PURE__*/React.createElement(Icon, {
    onClick: props.fullscreenButtonHandler,
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 14,
      columnNumber: 7
    }
  }, "fullscreen"), /*#__PURE__*/React.createElement(Icon, {
    onClick: props.infoButtonHandler,
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 19,
      columnNumber: 7
    }
  }, "info"));
};