(this.webpackJsonpcategorizer=this.webpackJsonpcategorizer||[]).push([[0],{106:function(e,t,a){},138:function(e,t,a){},176:function(e,t,a){"use strict";a.r(t);var n,r,c=a(2),s=a(0),i=a.n(s),o=a(23),l=a.n(o),d=(a(106),a(20)),j=a(27),h=a(11),u=a(82),b=a.n(u),g=a(211),O=a(228),m=a(213),x=a(177),f=a(214),p=(a(138),a(88)),T=a(48),w=a.n(T),I=a(215),C=a(217),E=a(218),N=a(219),y=a(231),R=a(232),v=a(227),k=a(226),A=a(216),U=a(230),S=a(229),_=a(233),L=a(87),D=a.n(L),B=a(221),W=a(222),P=a(224),G=a(220),K=a(223),M=a(178),z=a(225),H=Object(g.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:300},profileImage:{height:300},bannerImage:{height:80},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1},search:Object(j.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(j.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},left:{color:"white",backgroundColor:"blue"},neutral:{color:"white",backgroundColor:"gray"},right:{color:"white",backgroundColor:"red"},none:{color:"black",backgroundColor:"white"}}})),V=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},F=function(e){var t=H(),a=V(e.user.createdAt),n=V(e.user.lastSeen),r=new w.a(new Date(e.user.lastSeen)).toString(1,4),i=e.user.createdAt?new w.a(new Date(e.user.createdAt)):new w.a(new Date),o=i.toString(1,4),l=i.days>0?Math.ceil(e.user.statusesCount/i.days):0,j=Object(s.useState)(e.user.screenName),h=Object(d.a)(j,2),u=h[0],b=h[1];Object(s.useEffect)((function(){b(e.user.screenName)}),[e]);return Object(c.jsxs)("div",{children:[Object(c.jsx)(m.a,{className:t.appBar,position:"static",children:Object(c.jsxs)(f.a,{children:[Object(c.jsxs)(I.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:[Object(c.jsxs)(x.a,{onClick:e.handleUserChange,name:"all",children:["TOTAL: ",e.stats.user.uncategorized.all]}),Object(c.jsxs)(x.a,{onClick:e.handleUserChange,name:"left",children:["LEFT: ",e.stats.user.uncategorized.left]}),Object(c.jsxs)(x.a,{onClick:e.handleUserChange,name:"neutral",children:["NEUTRAL: ",e.stats.user.uncategorized.neutral]}),Object(c.jsxs)(x.a,{onClick:e.handleUserChange,name:"right",children:["RIGHT: ",e.stats.user.uncategorized.right]})]}),Object(c.jsxs)(x.a,{variant:"contained",color:"primary",size:"small",onClick:e.handleUserChange,name:"mismatch",className:t.buttonMismatch,children:["MISMATCH ",e.stats.user.mismatched]}),Object(c.jsxs)("div",{className:t.search,children:[Object(c.jsx)("div",{className:t.searchIcon,children:Object(c.jsx)(D.a,{color:"primary"})}),Object(c.jsx)(U.a,{placeholder:"search\u2026",classes:{root:t.inputRoot,input:t.inputInput},inputProps:{"aria-label":"search"},value:u,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER"),e.handleSearchUser(u))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),b(e.target.value)}})]})]})}),Object(c.jsxs)(A.a,{className:t.grid,children:[Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsxs)(C.a,{className:t.card,variant:"outlined",children:[Object(c.jsxs)(E.a,{onClick:function(){console.log("open twitter"),window.open("http://twitter.com/".concat(e.user.screenName||null),"_blank")},children:[Object(c.jsx)(M.a,{variant:"h6",children:e.user.name}),Object(c.jsxs)(M.a,{children:["@",e.user.screenName]})]}),Object(c.jsx)(N.a,{className:t.profileImage,src:e.user.profileImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(c.jsx)("br",{}),Object(c.jsx)(N.a,{className:t.bannerImage,src:e.user.bannerImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(c.jsx)(E.a,{children:Object(c.jsx)(M.a,{children:e.user.description})})]})}),Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(p.a,{dataSource:{sourceType:"profile",screenName:e.user.screenName},options:{height:"640"}})}),Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(G.a,{children:Object(c.jsx)(B.a,{className:t.table,size:"small",children:Object(c.jsxs)(W.a,{children:[Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"id"}),Object(c.jsx)(P.a,{align:"right",children:e.user.nodeId})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"location"}),Object(c.jsx)(P.a,{align:"right",children:e.user.location})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"created"}),Object(c.jsx)(P.a,{align:"right",children:a})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"twitter age"}),Object(c.jsx)(P.a,{align:"right",children:o})]}),Object(c.jsxs)(K.a,{className:e.user.followersCount>5e3?t.tableRowGreen:null,children:[Object(c.jsx)(P.a,{children:"followers"}),Object(c.jsx)(P.a,{align:"right",children:e.user.followersCount})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"friends"}),Object(c.jsx)(P.a,{align:"right",children:e.user.friendsCount})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"tweets"}),Object(c.jsx)(P.a,{align:"right",children:e.user.statusesCount})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"tweets/day"}),Object(c.jsx)(P.a,{align:"right",children:l})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"last seen"}),Object(c.jsx)(P.a,{align:"right",children:n})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"last seen"}),Object(c.jsxs)(P.a,{align:"right",children:[r," ago"]})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"mentions"}),Object(c.jsx)(P.a,{align:"right",children:e.user.mentions})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"mentions/min"}),Object(c.jsx)(P.a,{align:"right",children:e.user.rate?e.user.rate.toFixed(1):0})]})]})})})}),Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:2,children:Object(c.jsx)(G.a,{children:Object(c.jsxs)(B.a,{className:t.table,size:"small",children:[Object(c.jsx)(z.a,{children:Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"CAT"}),Object(c.jsx)(P.a,{align:"left",children:"MAN"}),Object(c.jsx)(P.a,{align:"left",children:"AUTO"})]})}),Object(c.jsxs)(W.a,{children:[Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"left"}),Object(c.jsx)(P.a,{align:"right",children:e.stats.user.manual.left}),Object(c.jsx)(P.a,{align:"right",children:e.stats.user.auto.left})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"neutral"}),Object(c.jsx)(P.a,{align:"right",children:e.stats.user.manual.neutral}),Object(c.jsx)(P.a,{align:"right",children:e.stats.user.auto.neutral})]}),Object(c.jsxs)(K.a,{children:[Object(c.jsx)(P.a,{children:"right"}),Object(c.jsx)(P.a,{align:"right",children:e.stats.user.manual.right}),Object(c.jsx)(P.a,{align:"right",children:e.stats.user.auto.right})]})]})]})})}),Object(c.jsx)(A.a,{item:!0,className:t.gridItem,xs:1,children:Object(c.jsxs)(k.a,{children:[Object(c.jsxs)(x.a,{className:function(e){switch(e){case"left":case"neutral":case"right":return t[e];default:return t.none}}(e.user.categoryAuto),children:["AUTO: ",e.user.categoryAuto.toUpperCase()||"NONE"]}),Object(c.jsx)(R.a,{component:"fieldset",children:Object(c.jsxs)(_.a,{"aria-label":"category",name:"category",value:e.user.category||"none",onChange:e.handleUserChange,children:[Object(c.jsx)(v.a,{labelPlacement:"start",value:"left",control:Object(c.jsx)(S.a,{}),label:"left"}),Object(c.jsx)(v.a,{labelPlacement:"start",value:"neutral",control:Object(c.jsx)(S.a,{}),label:"neutral"}),Object(c.jsx)(v.a,{labelPlacement:"start",value:"right",control:Object(c.jsx)(S.a,{}),label:"right"}),Object(c.jsx)(v.a,{labelPlacement:"start",value:"positive",control:Object(c.jsx)(S.a,{}),label:"positive"}),Object(c.jsx)(v.a,{labelPlacement:"start",value:"negative",control:Object(c.jsx)(S.a,{}),label:"negative"}),Object(c.jsx)(v.a,{labelPlacement:"start",value:"none",control:Object(c.jsx)(S.a,{}),label:"none"})]})}),Object(c.jsx)(v.a,{control:Object(c.jsx)(y.a,{checked:e.user.categoryVerified||!1,onChange:e.handleUserChange,name:"catVerified"}),label:"verified",labelPlacement:"start"}),Object(c.jsx)(v.a,{control:Object(c.jsx)(y.a,{checked:e.user.following||!1,onChange:e.handleUserChange,name:"following"}),label:"following",labelPlacement:"start"}),Object(c.jsx)(v.a,{control:Object(c.jsx)(y.a,{checked:e.user.ignored||!1,onChange:e.handleUserChange,name:"ignored"}),label:"ignored",labelPlacement:"start"}),Object(c.jsx)(v.a,{control:Object(c.jsx)(y.a,{checked:e.user.isBot||!1,onChange:e.handleUserChange,name:"isBot"}),label:"bot",labelPlacement:"start"})]})})]})]})},X="http://word.threeceelabs.com/auth/twitter",Y="viewer_"+(n=1e9,r=9999999999,Math.floor(Math.random()*(r-n+1)+n)),J={nodeId:Y,userId:Y,viewerId:Y,screenName:Y,type:"viewer",namespace:"view",timeStamp:Date.now(),tags:{}};J.tags.type="viewer",J.tags.mode="stream",J.tags.entity=Y;var Z=J;console.log({viewerObj:Z});var q={isAuthenticated:!1,viewerReadyTransmitted:!1},Q=b()("https://word.threeceelabs.com/view"),$=[],ee=Object(g.a)((function(e){return{root:{flexGrow:2},appBar:{backgroundColor:"white",margin:2},buttonLogin:{},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1},search:Object(j.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(j.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"})}})),te=function(){var e=ee(),t=Object(s.useState)({nodesPerMin:0,maxNodesPerMin:0,bestNetworkId:"",user:{uncategorized:{left:0,neutral:0,right:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0},auto:{left:0,neutral:0,right:0}}}),a=Object(d.a)(t,2),n=a[0],r=a[1],i=Object(s.useState)({nodeId:null,screenName:"threecee",name:"",location:"",description:"",profileImageUrl:"https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",bannerImage:"",createdAt:null,followersCount:0,friendsCount:0,tweets:0,age:0,mentions:0,rate:0,rateMax:0,tweetsPerDay:0,lastSeen:null,isBot:!1,following:!1,categoryVerfied:!1,category:"none",categoryAuto:"none"}),o=Object(d.a)(i,2),l=o[0],j=o[1],u=Object(s.useState)({nodeId:!1}),b=Object(d.a)(u,2),g=b[0],p=b[1],T=Object(s.useState)({nodeId:null,text:null,categoryAuto:"none",category:"none",lastSeen:null,age:0,mentions:0,rate:0,rateMax:0}),w=Object(d.a)(T,2),I=w[0],C=w[1],E=Object(s.useCallback)((function(e){void 0!==e.persist&&e.persist(),void 0!==e.preventDefault&&e.preventDefault();var t=e.currentTarget.name,a=e.currentTarget.value,n=e.currentTarget.checked;if(void 0===e.currentTarget.name&&e.code)switch(e.code){case"ArrowRight":case"ArrowLeft":t="all";break;case"KeyD":case"KeyL":e.shiftKey?(t="category",a="left"):t="left";break;case"KeyN":e.shiftKey?(t="category",a="neutral"):t="neutral";break;case"KeyR":e.shiftKey?(t="category",a="right"):t="right";break;case"KeyI":e.shiftKey&&(t="ignored",n=!l.ignored);break;case"KeyV":e.shiftKey&&(t="catVerified",n=!l.categoryVerified);break;case"KeyB":e.shiftKey&&(t="isBot",n=!l.isBot)}console.log("handleUserChange | @"+l.screenName+" | name: "+t+" | value: "+a);var r="@?";switch(t){case"all":case"left":case"neutral":case"right":r+=t,Q.emit("TWITTER_SEARCH_NODE",r);break;case"mismatch":Q.emit("TWITTER_SEARCH_NODE","@?mm");break;case"category":Q.emit("TWITTER_CATEGORIZE_NODE",{category:a,following:!0,node:l});break;case"isBot":n?Q.emit("TWITTER_BOT",l):Q.emit("TWITTER_UNBOT",l);break;case"following":n?Q.emit("TWITTER_FOLLOW",l):Q.emit("TWITTER_UNFOLLOW",l);break;case"catVerified":n?Q.emit("TWITTER_CATEGORY_VERIFIED",l):Q.emit("TWITTER_CATEGORY_UNVERIFIED",l);break;case"ignored":n?Q.emit("TWITTER_IGNORE",l):Q.emit("TWITTER_UNIGNORE",l);break;default:console.log("handleUserChange: UNKNOWN NAME: "+t+" | VALUE: "+a),console.log({event:e})}}),[l]);return Object(s.useEffect)((function(){Q.on("SET_TWITTER_USER",(function(e){var t;console.debug("RX SET_TWITTER_USER"),console.debug(e),void 0!==(t=e.node)&&void 0!==t.nodeId&&void 0!==t.screenName&&j(e.node),r(e.stats)}))}),[]),Object(s.useEffect)((function(){Q.on("action",(function(e){switch(console.debug("RX ACTION | "+Q.id+" | TYPE: "+e.type),console.debug("RX ACTION | ",e.data),e.type){case"user":j(e.data),g.nodeId&&l.nodeId!==g.nodeId&&!$.includes(g.nodeId)&&$.push(g.nodeId),g.nodeId!==l.nodeId&&p(l),console.log("USER: @"+e.data.screenName+" | "+e.data.profileImageUrl);break;case"hashtag":C({}),console.log("HT: #"+I.text);break;case"stats":r(e.data)}}))}),[]),Object(s.useEffect)((function(){return Q.on("connect",(function(){console.log("CONNECTED: "+Q.id),Q.emit("authentication",{namespace:"view",userId:"test",password:"0123456789"})})),function(){return Q.disconnect()}}),[]),Object(s.useEffect)((function(){Q.on("authenticated",(function(){console.debug("AUTHENTICATED | "+Q.id),q.socketId=Q.id,q.serverConnected=!0,q.userReadyTransmitted=!1,q.userReadyAck=!1,Q.emit("TWITTER_SEARCH_NODE","@threecee")}))}),[]),Object(s.useEffect)((function(){Q.on("USER_AUTHENTICATED",(function(e){q.isAuthenticated=!0,console.log("RX USER_AUTHENTICATED | USER: @"+e.screenName)}))}),[]),Object(h.a)("right",E),Object(h.a)("left",E),Object(h.a)("L",E),Object(h.a)("shift+L",(function(e){return E(e)}),{},[l]),Object(h.a)("D",E),Object(h.a)("shift+D",(function(e){return E(e)}),{},[l]),Object(h.a)("R",E),Object(h.a)("shift+R",(function(e){return E(e)}),{},[l]),Object(h.a)("N",E),Object(h.a)("shift+N",(function(e){return E(e)}),{},[l]),Object(h.a)("shift+I",(function(e){return E(e)}),{},[l]),Object(h.a)("shift+B",(function(e){return E(e)}),{},[l]),Object(h.a)("shift+V",(function(e){return E(e)}),{},[l]),Object(c.jsx)("div",{className:e.root,children:Object(c.jsxs)(O.a,{component:"main",maxWidth:!1,children:[Object(c.jsx)(m.a,{className:e.appBar,position:"static",children:Object(c.jsx)(f.a,{children:Object(c.jsx)(x.a,{variant:"contained",color:"primary",size:"small",onClick:function(){console.warn("LOGIN: AUTH: "+q.isAuthenticated+" | URL: "+X),window.open(X,"LOGIN","_new"),Q.emit("login",Z)},name:"login",className:e.buttonLogin,children:"TWITTER LOGIN"})})}),Object(c.jsx)(F,{user:l,stats:n,handleUserChange:E,handleSearchUser:function(e){var t="@"+e;Q.emit("TWITTER_SEARCH_NODE",t)}})]})})},ae=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,235)).then((function(t){var a=t.getCLS,n=t.getFID,r=t.getFCP,c=t.getLCP,s=t.getTTFB;a(e),n(e),r(e),c(e),s(e)}))};l.a.render(Object(c.jsx)(i.a.StrictMode,{children:Object(c.jsx)(te,{})}),document.getElementById("root")),ae()}},[[176,1,2]]]);
//# sourceMappingURL=main.f32faf02.chunk.js.map