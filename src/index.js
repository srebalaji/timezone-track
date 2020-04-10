import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import App from "./App";

ReactDOM.render((
	<BrowserRouter>
		<React.Fragment>
		</React.Fragment>
		<Switch>
			<Route exact path='/' component={App}/>

	    <Route exact path='/team/:id' render={(props) => (
			  <App {...props} fromTeam={true}/>
			)}/>

	    <Route path="*" component={App} />
    </Switch>
	</BrowserRouter>
), document.getElementById("app"));
