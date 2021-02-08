const ControlPanel = function(props){

  const Icon = MaterialUI.Icon;
  const ButtonGroup = MaterialUI.ButtonGroup;

  return (
    <ButtonGroup color="primary" aria-label="control panel">
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
    </ButtonGroup>
  );
}
