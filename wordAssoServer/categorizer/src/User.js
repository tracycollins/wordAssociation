import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

const useStyles = makeStyles({
  // root: {
  //   maxWidth: 400,
  // },
  root: {
    flexGrow: 1,
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'left',
  },  
  paper: {
    alignItems: 'left',
  },
  profileImage: {
    width: 360,
    height: 360,
  },
  bannerImage: {
    width: 360,
    height: 100,
  },
  table: {
    maxWidth: 360,
  },
});

const formatDate = (dateInput) => {
  return new Date(dateInput).toLocaleDateString(
    'en-gb',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  );
}

const User = (props) => {

  const classes = useStyles();

  const createdAt = formatDate(props.user.createdAt)
  const lastSeen = formatDate(props.user.lastSeen)

  return (
    <div className={classes.root}>
      <Container component="main">
        <Grid className={classes.grid}>
          <Grid item xs={4}>
            <Card className={classes.root}>
              <CardHeader
                title={`${props.user.name}`}
                subheader={`@${props.user.screenName}`}
              >
              </CardHeader>
              <CardMedia
                className={classes.profileImage}
                image={props.user.profileImageUrl}
                title={props.user.name}
              />
              <CardMedia className={classes.bannerImage} image={props.user.bannerImageUrl} />
              <CardContent>
                <Typography>
                  {props.user.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <TableContainer>
              <Table className={classes.table} size="small" aria-label="a dense table">
                <TableBody>
                  <TableRow>
                    <TableCell>Followers</TableCell><TableCell align="right">{props.user.followersCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Friends</TableCell><TableCell align="right">{props.user.friendsCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Location</TableCell><TableCell align="right">{props.user.location}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Created</TableCell><TableCell align="right">{createdAt}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Last Seen</TableCell><TableCell align="right">{lastSeen}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Age</TableCell><TableCell align="right">{Math.ceil(props.user.ageDays)} days</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mentions</TableCell><TableCell align="right">{props.user.mentions}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Rate (mentions/min)</TableCell><TableCell align="right">{props.user.rate.toFixed(1)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={4}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={props.user.categoryVerified} onChange={props.handleChange} name="catVerified" />}
                label="CAT VERIFIED"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.following} onChange={props.handleChange} name="following" />}
                label="FOLLOWING"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.ignored} onChange={props.handleChange} name="ignored" />}
                label="IGNORED"
              />
              <FormControlLabel
                control={<Checkbox checked={props.user.isBot} onChange={props.handleChange} name="isBot" />}
                label="BOT"
              />
              <FormControl component="fieldset">
                <FormLabel component="legend">{`CATEGORY | AUTO: ${props.user.categoryAuto.toUpperCase()}`}</FormLabel>
                <RadioGroup aria-label="category" name="category" value={props.user.category} onChange={props.handleChange}>
                  <FormControlLabel value="left" control={<Radio />} label="Left" />
                  <FormControlLabel value="neutral" control={<Radio />} label="Neutral" />
                  <FormControlLabel value="right" control={<Radio />} label="Right" />
                  <FormControlLabel value="positive" control={<Radio />} label="Positive" />
                  <FormControlLabel value="negative" control={<Radio />} label="Negative" />
                  <FormControlLabel value="none" control={<Radio />} label="None" />
                </RadioGroup>
              </FormControl>
            </FormGroup>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default User;
