import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ReactDOM.render(
//   <Router>
//     <div>
//       <Switch>
//         <Route path="/categorize/user/:slug">
//           <App />
//         </Route>
//       </Switch>
//     </div>
//   </Router>,
//   document.getElementById('root')
// );

ReactDOM.render(
  <Router>
    <div>
      <Switch>
        <Route path="/categorize/user/:slug">
          <App />
        </Route>
        <Route path="/categorize/hashtag/:slug">
          <App />
        </Route>
        <Route >
          <App />
        </Route>
      </Switch>
    </div>
  </Router>,
  document.getElementById('root')
);




// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
