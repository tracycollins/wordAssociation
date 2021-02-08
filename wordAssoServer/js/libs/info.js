const InfoPanel = function(props){

  console.log(props)

  const Button = MaterialUI.Button;
  const ButtonGroup = MaterialUI.ButtonGroup;
  
  return (
    <ButtonGroup color="primary" aria-label="outlined primary button group">
      <Button>One</Button>
      <Button>Two</Button>
      <Button>Three</Button>
    </ButtonGroup>
  );
}
