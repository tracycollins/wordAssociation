(this.webpackJsonpcategorizer=this.webpackJsonpcategorizer||[]).push([[0],{106:function(e,t,a){},138:function(e,t,a){},176:function(e,t,a){"use strict";a.r(t);var n,r,c=a(2),s=a(0),i=a.n(s),o=a(23),l=a.n(o),d=(a(106),a(18)),h=a(27),j=a(10),u=a(83),b=a.n(u),g=a(211),m=a(228),O=a(213),x=a(178),p=a(214),f=a(177),T=(a(138),a(89)),w=a(48),N=a.n(w),I=a(215),R=a(217),C=a(218),E=a(219),y=a(231),v=a(232),k=a(227),U=a(226),A=a(216),S=a(230),L=a(229),_=a(233),D=a(88),P=a.n(D),W=a(221),B=a(222),G=a(224),M=a(220),K=a(223),z=a(225),H=Object(g.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:400},profileImage:{maxHeight:400},bannerImage:{height:80},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1,color:"blue"},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},left:{backgroundColor:"blue",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},neutral:{backgroundColor:"gray",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},right:{backgroundColor:"red",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},none:{backgroundColor:"white",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"}}})),F=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},V=function(e){var t=H(),a=F(e.user.createdAt),n=F(e.user.lastSeen),r=new N.a(new Date(e.user.lastSeen)).toString(1,4),i=e.user.createdAt?new N.a(new Date(e.user.createdAt)):new N.a(new Date),o=i.toString(1,4),l=i.days>0?Math.ceil(e.user.statusesCount/i.days):0,h=Object(s.useState)(e.user.screenName),j=Object(d.a)(h,2),u=j[0],b=j[1];Object(s.useEffect)((function(){b(e.user.screenName)}),[e]);return Object(c.jsxs)(c.Fragment,{children:[Object(c.jsx)(O.a,{className:t.appBar,position:"static",children:Object(c.jsxs)(p.a,{children:[Object(c.jsx)(f.a,{variant:"h6",className:t.title,children:"User"}),Object(c.jsxs)("div",{className:t.search,children:[Object(c.jsx)("div",{className:t.searchIcon,children:Object(c.jsx)(P.a,{color:"primary"})}),Object(c.jsx)(S.a,{placeholder:"search\u2026",classes:{root:t.inputRoot,input:t.inputInput},inputProps:{"aria-label":"search"},value:u,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER"),e.handleSearchUser(u))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),b(e.target.value)}})]}),Object(c.jsx)(f.a,{className:t.buttonGroupLabel,children:"UNCAT"}),Object(c.jsxs)(I.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:[Object(c.jsxs)(x.a,{onClick:e.handleUserChange,name:"all",children:["ALL: ",e.stats.user.uncategorized.all]}),Object(c.jsxs)(x.a,{onClick:e.handleUserChange,name:"left",children:["LEFT: ",e.stats.user.uncategorized.left]}),Object(c.jsxs)(x.a,{onClick:e.handleUserChange,name:"neutral",children:["NEUTRAL: ",e.stats.user.uncategorized.neutral]}),Object(c.jsxs)(x.a,{onClick:e.handleUserChange,name:"right",children:["RIGHT: ",e.stats.user.uncategorized.right]})]}),Object(c.jsxs)(x.a,{variant:"contained",color:"primary",size:"small",onClick:e.handleUserChange,name:"mismatch",className:t.buttonMismatch,children:["MISMATCH ",e.stats.user.mismatched]})]})}),Object(c.jsxs)(A.a,{className:t.grid,children:[Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsxs)(R.a,{className:t.card,variant:"outlined",children:[Object(c.jsxs)(C.a,{onClick:function(){console.log("open twitter"),window.open("http://twitter.com/".concat(e.user.screenName||null),"_blank")},children:[Object(c.jsx)(f.a,{variant:"h6",children:e.user.name}),Object(c.jsxs)(f.a,{children:["@",e.user.screenName]})]}),Object(c.jsx)(E.a,{className:t.profileImage,src:e.user.profileImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(c.jsx)("br",{}),Object(c.jsx)(E.a,{className:t.bannerImage,src:e.user.bannerImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(c.jsx)(C.a,{children:Object(c.jsx)(f.a,{children:e.user.description})})]})}),Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(T.a,{dataSource:{sourceType:"profile",screenName:e.user.screenName},options:{height:"640"}})}),Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(M.a,{children:Object(c.jsx)(W.a,{className:t.table,size:"small",children:Object(c.jsxs)(B.a,{children:[Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"id"}),Object(c.jsx)(G.a,{align:"right",children:e.user.nodeId})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"location"}),Object(c.jsx)(G.a,{align:"right",children:e.user.location})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"created"}),Object(c.jsx)(G.a,{align:"right",children:a})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"twitter age"}),Object(c.jsx)(G.a,{align:"right",children:o})]}),Object(c.jsxs)(K.a,{className:e.user.followersCount>5e3?t.tableRowGreen:null,children:[Object(c.jsx)(G.a,{children:"followers"}),Object(c.jsx)(G.a,{align:"right",children:e.user.followersCount})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"friends"}),Object(c.jsx)(G.a,{align:"right",children:e.user.friendsCount})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"tweets"}),Object(c.jsx)(G.a,{align:"right",children:e.user.statusesCount})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"tweets/day"}),Object(c.jsx)(G.a,{align:"right",children:l})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"last seen"}),Object(c.jsx)(G.a,{align:"right",children:n})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"last seen"}),Object(c.jsxs)(G.a,{align:"right",children:[r," ago"]})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"mentions"}),Object(c.jsx)(G.a,{align:"right",children:e.user.mentions})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"mentions/min"}),Object(c.jsx)(G.a,{align:"right",children:e.user.rate?e.user.rate.toFixed(1):0})]})]})})})}),Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:2,children:Object(c.jsx)(M.a,{children:Object(c.jsxs)(W.a,{className:t.table,size:"small",children:[Object(c.jsx)(z.a,{children:Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"CAT"}),Object(c.jsx)(G.a,{align:"left",children:"MAN"}),Object(c.jsx)(G.a,{align:"left",children:"AUTO"})]})}),Object(c.jsxs)(B.a,{children:[Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"left"}),Object(c.jsx)(G.a,{align:"right",children:e.stats.user.manual.left}),Object(c.jsx)(G.a,{align:"right",children:e.stats.user.auto.left})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"neutral"}),Object(c.jsx)(G.a,{align:"right",children:e.stats.user.manual.neutral}),Object(c.jsx)(G.a,{align:"right",children:e.stats.user.auto.neutral})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(G.a,{children:"right"}),Object(c.jsx)(G.a,{align:"right",children:e.stats.user.manual.right}),Object(c.jsx)(G.a,{align:"right",children:e.stats.user.auto.right})]})]})]})})}),Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:1,children:Object(c.jsxs)(U.a,{children:[Object(c.jsxs)(f.a,{className:function(e){switch(e){case"left":case"neutral":case"right":return t[e];default:return t.none}}(e.user.categoryAuto),align:"center",children:["AUTO: ",e.user.categoryAuto.toUpperCase()||"NONE"]}),Object(c.jsx)(v.a,{component:"fieldset",children:Object(c.jsxs)(_.a,{"aria-label":"category",name:"category",value:e.user.category||"none",onChange:e.handleUserChange,children:[Object(c.jsx)(k.a,{labelPlacement:"start",value:"left",control:Object(c.jsx)(L.a,{}),label:"left"}),Object(c.jsx)(k.a,{labelPlacement:"start",value:"neutral",control:Object(c.jsx)(L.a,{}),label:"neutral"}),Object(c.jsx)(k.a,{labelPlacement:"start",value:"right",control:Object(c.jsx)(L.a,{}),label:"right"}),Object(c.jsx)(k.a,{labelPlacement:"start",value:"positive",control:Object(c.jsx)(L.a,{}),label:"positive"}),Object(c.jsx)(k.a,{labelPlacement:"start",value:"negative",control:Object(c.jsx)(L.a,{}),label:"negative"}),Object(c.jsx)(k.a,{labelPlacement:"start",value:"none",control:Object(c.jsx)(L.a,{}),label:"none"})]})}),Object(c.jsx)(k.a,{control:Object(c.jsx)(y.a,{checked:e.user.categoryVerified||!1,onChange:e.handleUserChange,name:"catVerified"}),label:"verified",labelPlacement:"start"}),Object(c.jsx)(k.a,{control:Object(c.jsx)(y.a,{checked:e.user.following||!1,onChange:e.handleUserChange,name:"following"}),label:"following",labelPlacement:"start"}),Object(c.jsx)(k.a,{control:Object(c.jsx)(y.a,{checked:e.user.ignored||!1,onChange:e.handleUserChange,name:"ignored"}),label:"ignored",labelPlacement:"start"}),Object(c.jsx)(k.a,{control:Object(c.jsx)(y.a,{checked:e.user.isBot||!1,onChange:e.handleUserChange,name:"isBot"}),label:"bot",labelPlacement:"start"})]})})]})]})},X="http://word.threeceelabs.com/auth/twitter",Y="viewer_"+(n=1e9,r=9999999999,Math.floor(Math.random()*(r-n+1)+n)),J={nodeId:Y,userId:Y,viewerId:Y,screenName:Y,type:"viewer",namespace:"view",timeStamp:Date.now(),tags:{}};J.tags.type="viewer",J.tags.mode="stream",J.tags.entity=Y;var Z=J;console.log({viewerObj:Z});var q={isAuthenticated:!1,viewerReadyTransmitted:!1},Q=b()("https://word.threeceelabs.com/view"),$=[],ee=Object(g.a)((function(e){return{root:{flexGrow:1},appBar:{backgroundColor:"white",margin:2},title:{flexGrow:1,color:"blue"},serverStatus:{color:"gray",padding:e.spacing(1)},twitterAuth:{color:"gray",padding:e.spacing(1),marginRight:e.spacing(2)},buttonLogin:{marginRight:e.spacing(2)},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"})}})),te=function(){var e,t=ee(),a=Object(s.useState)(!1),n=Object(d.a)(a,2),r=n[0],i=n[1],o=Object(s.useState)(!1),l=Object(d.a)(o,2),h=l[0],u=l[1],b=Object(s.useState)({nodesPerMin:0,maxNodesPerMin:0,maxNodesPerMinTime:0,bestNetwork:{networkId:""},user:{uncategorized:{left:0,neutral:0,right:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0},auto:{left:0,neutral:0,right:0}}}),g=Object(d.a)(b,2),T=g[0],w=g[1],N=Object(s.useState)({nodeId:null,screenName:"threecee",name:"",location:"",description:"",profileImageUrl:"https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",bannerImage:"",createdAt:null,followersCount:0,friendsCount:0,tweets:0,age:0,mentions:0,rate:0,rateMax:0,tweetsPerDay:0,lastSeen:null,isBot:!1,following:!1,categoryVerfied:!1,category:"none",categoryAuto:"none"}),I=Object(d.a)(N,2),R=I[0],C=I[1],E=Object(s.useState)({nodeId:!1}),y=Object(d.a)(E,2),v=y[0],k=y[1],U=Object(s.useState)({nodeId:null,text:null,categoryAuto:"none",category:"none",lastSeen:null,age:0,mentions:0,rate:0,rateMax:0}),A=Object(d.a)(U,2),S=A[0],L=A[1],_=Object(s.useCallback)((function(e){void 0!==e.persist&&e.persist(),void 0!==e.preventDefault&&e.preventDefault();var t=e.currentTarget.name,a=e.currentTarget.value,n=e.currentTarget.checked;if(void 0===e.currentTarget.name&&e.code)switch(e.code){case"ArrowRight":case"ArrowLeft":t="all";break;case"KeyD":case"KeyL":e.shiftKey?(t="category",a="left"):t="left";break;case"KeyN":e.shiftKey?(t="category",a="neutral"):t="neutral";break;case"KeyR":e.shiftKey?(t="category",a="right"):t="right";break;case"KeyI":case"KeyX":e.shiftKey&&(t="ignored",n=!R.ignored);break;case"KeyV":e.shiftKey&&(t="catVerified",n=!R.categoryVerified);break;case"KeyB":e.shiftKey&&(t="isBot",n=!R.isBot)}console.log("handleUserChange | @"+R.screenName+" | name: "+t+" | value: "+a);var r="@?";switch(t){case"all":case"left":case"neutral":case"right":r+=t,Q.emit("TWITTER_SEARCH_NODE",r);break;case"mismatch":Q.emit("TWITTER_SEARCH_NODE","@?mm");break;case"category":Q.emit("TWITTER_CATEGORIZE_NODE",{category:a,following:!0,node:R});break;case"isBot":n?Q.emit("TWITTER_BOT",R):Q.emit("TWITTER_UNBOT",R);break;case"following":n?Q.emit("TWITTER_FOLLOW",R):Q.emit("TWITTER_UNFOLLOW",R);break;case"catVerified":n?Q.emit("TWITTER_CATEGORY_VERIFIED",R):Q.emit("TWITTER_CATEGORY_UNVERIFIED",R);break;case"ignored":n?Q.emit("TWITTER_IGNORE",R):Q.emit("TWITTER_UNIGNORE",R);break;default:console.log("handleUserChange: UNKNOWN NAME: "+t+" | VALUE: "+a),console.log({event:e})}}),[R]);return Object(s.useEffect)((function(){Q.on("SET_TWITTER_USER",(function(e){var t;console.debug("RX SET_TWITTER_USER"),console.debug(e),void 0!==(t=e.node)&&void 0!==t.nodeId&&void 0!==t.screenName&&C(e.node),w(e.stats)}))}),[]),Object(s.useEffect)((function(){Q.on("action",(function(e){switch(console.debug("RX ACTION | "+Q.id+" | TYPE: "+e.type),console.debug("RX ACTION | ",e.data),e.type){case"user":C(e.data),v.nodeId&&R.nodeId!==v.nodeId&&!$.includes(v.nodeId)&&$.push(v.nodeId),v.nodeId!==R.nodeId&&k(R),console.log("USER: @"+e.data.screenName+" | "+e.data.profileImageUrl);break;case"hashtag":L({}),console.log("HT: #"+S.text);break;case"stats":w(e.data)}}))}),[]),Object(s.useEffect)((function(){return Q.on("connect",(function(){console.log("CONNECTED: "+Q.id),Q.emit("authentication",{namespace:"view",userId:"test",password:"0123456789"})})),function(){return Q.disconnect()}}),[]),Object(s.useEffect)((function(){Q.on("authenticated",(function(){console.debug("AUTHENTICATED | "+Q.id),q.socketId=Q.id,q.serverConnected=!0,q.userReadyTransmitted=!1,q.userReadyAck=!1,Q.emit("TWITTER_SEARCH_NODE","@threecee")}))}),[]),Object(s.useEffect)((function(){Q.on("USER_AUTHENTICATED",(function(e){i(!0),u(e.screenName),console.log("RX TWITTER USER_AUTHENTICATED | USER: @"+e.screenName)}))}),[]),Object(j.a)("right",_),Object(j.a)("left",_),Object(j.a)("L",_),Object(j.a)("shift+L",(function(e){return _(e)}),{},[R]),Object(j.a)("D",_),Object(j.a)("shift+D",(function(e){return _(e)}),{},[R]),Object(j.a)("R",_),Object(j.a)("shift+R",(function(e){return _(e)}),{},[R]),Object(j.a)("N",_),Object(j.a)("shift+N",(function(e){return _(e)}),{},[R]),Object(j.a)("shift+I",(function(e){return _(e)}),{},[R]),Object(j.a)("shift+B",(function(e){return _(e)}),{},[R]),Object(j.a)("shift+V",(function(e){return _(e)}),{},[R]),Object(j.a)("shift+X",(function(e){return _(e)}),{},[R]),Object(c.jsx)("div",{className:t.root,children:Object(c.jsxs)(m.a,{component:"main",maxWidth:!1,children:[Object(c.jsx)(O.a,{className:t.appBar,position:"static",children:Object(c.jsxs)(p.a,{children:[Object(c.jsx)(f.a,{variant:"h6",className:t.title,children:"Categorizer"}),Object(c.jsxs)(f.a,{className:t.serverStatus,children:["NN: ",T.bestNetwork.networkId]}),Object(c.jsxs)(f.a,{className:t.serverStatus,children:[T.nodesPerMin," nodes/min (max: ",T.maxNodesPerMin," | time: ",(e=T.maxNodesPerMinTime,new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"})),")"]}),Object(c.jsx)(f.a,{className:t.twitterAuth,children:h?"@"+h:"logged out"}),Object(c.jsx)(x.a,{className:t.buttonLogin,variant:"contained",color:"primary",size:"small",onClick:function(){console.warn("LOGIN: AUTH: "+q.isAuthenticated+" | URL: "+X),window.open(X,"LOGIN","_new"),Q.emit("login",Z)},name:"login",label:"login",children:r?"LOGOUT":"LOGIN TWITTER"})]})}),Object(c.jsx)(V,{user:R,stats:T,handleUserChange:_,handleSearchUser:function(e){var t="@"+e;Q.emit("TWITTER_SEARCH_NODE",t)}})]})})},ae=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,235)).then((function(t){var a=t.getCLS,n=t.getFID,r=t.getFCP,c=t.getLCP,s=t.getTTFB;a(e),n(e),r(e),c(e),s(e)}))};l.a.render(Object(c.jsx)(i.a.StrictMode,{children:Object(c.jsx)(te,{})}),document.getElementById("root")),ae()}},[[176,1,2]]]);
//# sourceMappingURL=main.93ecba7e.chunk.js.map