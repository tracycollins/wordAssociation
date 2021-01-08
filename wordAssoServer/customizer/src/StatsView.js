import React from 'react';
import { green } from '@material-ui/core/colors';
// import clsx from 'clsx';

// import Duration from 'duration';

// import AppBar from '@material-ui/core/AppBar';
// import Button from '@material-ui/core/Button';
// import ButtonGroup from '@material-ui/core/ButtonGroup';
// import Card from '@material-ui/core/Card';
// import CardActionArea from '@material-ui/core/CardActionArea';
// import CardActions from '@material-ui/core/CardActions';
// import CardContent from '@material-ui/core/CardContent';
// import CardHeader from '@material-ui/core/CardHeader';
// import CardMedia from '@material-ui/core/CardMedia';
// import CheckBoxIcon from '@material-ui/icons/CheckBox';
// import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
// import Checkbox from '@material-ui/core/Checkbox';
// import FormControl from '@material-ui/core/FormControl';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import FormGroup from '@material-ui/core/FormGroup';
// import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
// import IconButton from '@material-ui/core/IconButton';
// import InputBase from '@material-ui/core/InputBase';
// import InputLabel from '@material-ui/core/InputLabel';
// import MenuItem from '@material-ui/core/MenuItem';
// import MenuIcon from '@material-ui/icons/Menu';
// import Paper from '@material-ui/core/Paper';
// import Radio from '@material-ui/core/Radio';
// import RadioGroup from '@material-ui/core/RadioGroup';
// import SearchIcon from '@material-ui/icons/Search';
// import Select from '@material-ui/core/Select';
// import Table from '@material-ui/core/Table';
// import TableBody from '@material-ui/core/TableBody';
// import TableCell from '@material-ui/core/TableCell';
// import TableContainer from '@material-ui/core/TableContainer';
// import TableHead from '@material-ui/core/TableHead';
// import TableRow from '@material-ui/core/TableRow';
// import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

// const StyledTableCell = withStyles((theme) => ({
//   head: {
//   },
//   body: {
//     fontSize: 11,
//   },
// }))(TableCell);

// const StyledTableRow = withStyles((theme) => ({
//   root: {
//     backgroundColor: grey,
//   },
// }))(TableRow);

const useStyles = makeStyles((theme) => ({
  root: {
    border: 0,
    flexGrow: 2,
  },
  appBar: {
    border: 0,
    backgroundColor: 'white',
    marginBottom: theme.spacing(1),
  },
  grid: {
    border: 0,
    display: 'flex',
    alignItems: 'stretch',
  },
  gridItem: {
    border: 0,
    margin: theme.spacing(1),
  },
  gridHeader: {
    padding: theme.spacing(1),
    border: 0,
    marginBottom: theme.spacing(1),
  },
  paper: {
    outlined: true,
    variant: 'outlined',
  },
  card: {
    alignSelf: "center",
  },
  profileImage: {
    marginBottom: theme.spacing(1),
  },
  bannerImage: {
    marginBottom: theme.spacing(1),
  },
  icon: {
    borderRadius: '50%',
    width: 16,
    height: 16,
    boxShadow: 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
    backgroundColor: '#f5f8fa',
    backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))',
    '$root.Mui-focusVisible &': {
      outline: '2px auto rgba(19,124,189,.6)',
      outlineOffset: 2,
    },
    'input:hover ~ &': {
      backgroundColor: '#ebf1f5',
    },
    'input:disabled ~ &': {
      boxShadow: 'none',
      background: 'rgba(206,217,224,.5)',
    },
  },
  checkedIcon: {
    backgroundColor: '#137cbd',
    backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
    '&:before': {
      display: 'block',
      width: 16,
      height: 16,
      backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)',
      content: '""',
    },
    'input:hover ~ &': {
      backgroundColor: '#106ba3',
    },
  },
  selectCategory: {
    fontSize: '0.9rem',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  radioGroupCategory: {
    maxWidth: "90%",
    fontSize: '0.5rem',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  checkbox: {
    color: green[400],
    '&$checked': {
      color: green[600],
    },
  },
  checked: {},
  radioButtonLabel: {
    fontSize: '0.9rem'
  },
  radioButton: {
  },
  table: {
    maxWidth: "90%",
    padding: theme.spacing(1),
  },
  tableHead: {
    backgroundColor: '#ddeeee',
  },
  tableCell: {
  },
  tableCategorized: {
    backgroundColor: '#ddeeee',
  },
  tableRowGreen: {
    backgroundColor: 'lightgreen',
  },
  statusBar: {
    raised: false,
    backgroundColor: 'white',
    margin: 2,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    color: 'blue',
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "#ddeeee",
    },
    marginRight: theme.spacing(1),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'primary',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },

  buttonGroupLabel: {
    color: 'blue',
    marginRight: theme.spacing(1),
  },
  buttonAll: {
    color: 'black',
  },
  buttonLeft: {
    color: 'blue',
  },
  buttonNeutral: {
    color: 'gray',
  },
  buttonRight: {
    color: 'red',
  },
  buttonMismatch: {
    margin: 5
  },
  autoCategory:{
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    color: 'white',
    marginBottom: theme.spacing(1),
  },
  category: {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },

  left: {
    backgroundColor: 'blue',
    color: 'white',
  },
  neutral: {
    backgroundColor: 'darkgray',
    color: 'white',
  },
  right: {
    backgroundColor: 'red',
    color: 'white',
  },
  positive: {
    backgroundColor: 'green',
    color: 'white',
  },
  negative: {
    backgroundColor: 'yellow',
    color: 'black',
  },
  none: {
    backgroundColor: 'lightgray',
    color: 'black',
  },
  ignored: {
    backgroundColor: 'yellow',
    color: 'black',
  },

}));

// const formatDate = (dateInput) => {
//   return new Date(dateInput).toLocaleDateString(
//     'en-gb',
//     {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     }
//   );
// }

const Stats = (props) => {
  
  // statsObj.nodesPerSec = 0.0;
  // statsObj.nodesPerMin = 0.0;
  // statsObj.maxNodesPerMin = 0.0;
  // statsObj.maxNodesPerMinTime = moment().valueOf();


  const classes = useStyles();

  return (
    <>
      <Grid className={classes.grid}>
          <Grid item className={classes.gridItem} xs={3}>
              <LinearProgress variant="determinate" value={(props.stats.maxNodesPerMin !== undefined && props.stats.maxNodesPerMin !== 0 ? props.stats.nodesPerMin/props.stats.maxNodesPerMin : 0)} />
          </Grid>
        </Grid>
    </>
  );
}

export default Stats;
