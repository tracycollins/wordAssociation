const ControlPanel = function(props){

  const Box = MaterialUI.Box;
  const Icon = MaterialUI.Icon;
  const ButtonGroup = MaterialUI.ButtonGroup;

  return (
    <Box aria-label="outlined primary">
      <Icon
        onClick={props.settingsButtonHandler}
      >
        settings
      </Icon>
      <Icon
        onClick={props.fullscreenButtonHandler}
      >
        fullscreen
      </Icon>
      <Icon
        onClick={props.infoButtonHandler}
      >
        info
      </Icon>
    </Box>
  );
}
