(this.webpackJsonpcategorizer=this.webpackJsonpcategorizer||[]).push([[0],{103:function(e,t,a){},135:function(e,t,a){},173:function(e,t,a){"use strict";a.r(t);var n=a(2),r=a(0),c=a.n(r),s=a(23),i=a.n(s),l=(a(103),a(20)),o=a(11),d=a(81),j=a.n(d),h=(a(135),a(56)),b=a(87),u=a(47),g=a.n(u),O=a(214),m=a(174),x=a(216),f=a(218),p=a(219),T=a(220),I=a(231),C=a(213),E=a(232),N=a(228),w=a(227),y=a(217),R=a(230),v=a(229),k=a(233),U=a(86),A=a.n(U),S=a(222),_=a(223),D=a(225),W=a(221),L=a(224),P=a(215),B=a(175),K=a(211),z=a(226),M=Object(K.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:300},profileImage:{height:300},bannerImage:{height:80},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},left:{color:"white",backgroundColor:"blue"},neutral:{color:"white",backgroundColor:"gray"},right:{color:"white",backgroundColor:"red"},none:{color:"black",backgroundColor:"white"}}})),G=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},V=function(e){var t=M(),a=G(e.user.createdAt),c=G(e.user.lastSeen),s=new g.a(new Date(e.user.lastSeen)).toString(1,4),i=e.user.createdAt?new g.a(new Date(e.user.createdAt)):new g.a(new Date),o=i.toString(1,4),d=i.days>0?Math.ceil(e.user.statusesCount/i.days):0,j=Object(r.useState)(e.user.screenName),h=Object(l.a)(j,2),u=h[0],U=h[1];return Object(n.jsx)("div",{className:t.root,children:Object(n.jsxs)(C.a,{component:"main",maxWidth:!1,children:[Object(n.jsx)(O.a,{className:t.appBar,position:"static",children:Object(n.jsxs)(P.a,{children:[Object(n.jsxs)(x.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:[Object(n.jsxs)(m.a,{onClick:e.handleUserChange,name:"all",children:["TOTAL: ",e.stats.user.uncategorized.all]}),Object(n.jsxs)(m.a,{onClick:e.handleUserChange,name:"left",children:["LEFT: ",e.stats.user.uncategorized.left]}),Object(n.jsxs)(m.a,{onClick:e.handleUserChange,name:"neutral",children:["NEUTRAL: ",e.stats.user.uncategorized.neutral]}),Object(n.jsxs)(m.a,{onClick:e.handleUserChange,name:"right",children:["RIGHT: ",e.stats.user.uncategorized.right]})]}),Object(n.jsxs)(m.a,{variant:"contained",color:"primary",size:"small",onClick:e.handleUserChange,name:"mismatch",className:t.buttonMismatch,children:["MISMATCH ",e.stats.user.mismatched]}),Object(n.jsxs)("div",{className:t.search,children:[Object(n.jsx)("div",{className:t.searchIcon,children:Object(n.jsx)(A.a,{color:"primary"})}),Object(n.jsx)(R.a,{placeholder:"search\u2026",classes:{root:t.inputRoot,input:t.inputInput},inputProps:{"aria-label":"search"},value:u,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER"),e.handleSearchUser(u))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),U(e.target.value)}})]})]})}),Object(n.jsxs)(y.a,{className:t.grid,children:[Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:3,children:Object(n.jsxs)(f.a,{className:t.card,variant:"outlined",children:[Object(n.jsxs)(p.a,{onClick:function(){console.log("open twitter"),window.open("http://twitter.com/".concat(e.user.screenName||null),"_blank")},children:[Object(n.jsx)(B.a,{variant:"h6",children:e.user.name}),Object(n.jsxs)(B.a,{children:["@",e.user.screenName]})]}),Object(n.jsx)(T.a,{className:t.profileImage,src:e.user.profileImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(n.jsx)("br",{}),Object(n.jsx)(T.a,{className:t.bannerImage,src:e.user.bannerImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(n.jsx)(p.a,{children:Object(n.jsx)(B.a,{children:e.user.description})})]})}),Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:3,children:Object(n.jsx)(b.a,{dataSource:{sourceType:"profile",screenName:e.user.screenName},options:{height:"640"}})}),Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:3,children:Object(n.jsx)(W.a,{children:Object(n.jsx)(S.a,{className:t.table,size:"small",children:Object(n.jsxs)(_.a,{children:[Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"id"}),Object(n.jsx)(D.a,{align:"right",children:e.user.nodeId})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"location"}),Object(n.jsx)(D.a,{align:"right",children:e.user.location})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"created"}),Object(n.jsx)(D.a,{align:"right",children:a})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"twitter age"}),Object(n.jsx)(D.a,{align:"right",children:o})]}),Object(n.jsxs)(L.a,{className:e.user.followersCount>5e3?t.tableRowGreen:null,children:[Object(n.jsx)(D.a,{children:"followers"}),Object(n.jsx)(D.a,{align:"right",children:e.user.followersCount})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"friends"}),Object(n.jsx)(D.a,{align:"right",children:e.user.friendsCount})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"tweets"}),Object(n.jsx)(D.a,{align:"right",children:e.user.statusesCount})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"tweets/day"}),Object(n.jsx)(D.a,{align:"right",children:d})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"last seen"}),Object(n.jsx)(D.a,{align:"right",children:c})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"last seen"}),Object(n.jsxs)(D.a,{align:"right",children:[s," ago"]})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"mentions"}),Object(n.jsx)(D.a,{align:"right",children:e.user.mentions})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"mentions/min"}),Object(n.jsx)(D.a,{align:"right",children:e.user.rate?e.user.rate.toFixed(1):0})]})]})})})}),Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:2,children:Object(n.jsx)(W.a,{children:Object(n.jsxs)(S.a,{className:t.table,size:"small",children:[Object(n.jsx)(z.a,{children:Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"CAT"}),Object(n.jsx)(D.a,{align:"left",children:"MAN"}),Object(n.jsx)(D.a,{align:"left",children:"AUTO"})]})}),Object(n.jsxs)(_.a,{children:[Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"left"}),Object(n.jsx)(D.a,{align:"right",children:e.stats.user.manual.left}),Object(n.jsx)(D.a,{align:"right",children:e.stats.user.auto.left})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"neutral"}),Object(n.jsx)(D.a,{align:"right",children:e.stats.user.manual.neutral}),Object(n.jsx)(D.a,{align:"right",children:e.stats.user.auto.neutral})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(D.a,{children:"right"}),Object(n.jsx)(D.a,{align:"right",children:e.stats.user.manual.right}),Object(n.jsx)(D.a,{align:"right",children:e.stats.user.auto.right})]})]})]})})}),Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:1,children:Object(n.jsxs)(w.a,{children:[Object(n.jsxs)(m.a,{className:function(e){switch(e){case"left":case"neutral":case"right":return t[e];default:return t.none}}(e.user.categoryAuto),children:["AUTO: ",e.user.categoryAuto.toUpperCase()||"NONE"]}),Object(n.jsx)(E.a,{component:"fieldset",children:Object(n.jsxs)(k.a,{"aria-label":"category",name:"category",value:e.user.category||"none",onChange:e.handleUserChange,children:[Object(n.jsx)(N.a,{labelPlacement:"start",value:"left",control:Object(n.jsx)(v.a,{}),label:"left"}),Object(n.jsx)(N.a,{labelPlacement:"start",value:"neutral",control:Object(n.jsx)(v.a,{}),label:"neutral"}),Object(n.jsx)(N.a,{labelPlacement:"start",value:"right",control:Object(n.jsx)(v.a,{}),label:"right"}),Object(n.jsx)(N.a,{labelPlacement:"start",value:"positive",control:Object(n.jsx)(v.a,{}),label:"positive"}),Object(n.jsx)(N.a,{labelPlacement:"start",value:"negative",control:Object(n.jsx)(v.a,{}),label:"negative"}),Object(n.jsx)(N.a,{labelPlacement:"start",value:"none",control:Object(n.jsx)(v.a,{}),label:"none"})]})}),Object(n.jsx)(N.a,{control:Object(n.jsx)(I.a,{checked:e.user.categoryVerified||!1,onChange:e.handleUserChange,name:"catVerified"}),label:"verified",labelPlacement:"start"}),Object(n.jsx)(N.a,{control:Object(n.jsx)(I.a,{checked:e.user.following||!1,onChange:e.handleUserChange,name:"following"}),label:"following",labelPlacement:"start"}),Object(n.jsx)(N.a,{control:Object(n.jsx)(I.a,{checked:e.user.ignored||!1,onChange:e.handleUserChange,name:"ignored"}),label:"ignored",labelPlacement:"start"}),Object(n.jsx)(N.a,{control:Object(n.jsx)(I.a,{checked:e.user.isBot||!1,onChange:e.handleUserChange,name:"isBot"}),label:"bot",labelPlacement:"start"})]})})]})]})})},F={viewerReadyTransmitted:!1},H=j()("https://word.threeceelabs.com/view"),X=[],Y=function(){var e=Object(r.useState)({nodesPerMin:0,maxNodesPerMin:0,bestNetworkId:"",user:{uncategorized:{left:0,neutral:0,right:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0},auto:{left:0,neutral:0,right:0}}}),t=Object(l.a)(e,2),a=t[0],c=t[1],s=Object(r.useState)({nodeId:null,screenName:"threecee",name:"",location:"",description:"",profileImageUrl:"https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",bannerImage:"",createdAt:null,followersCount:0,friendsCount:0,tweets:0,age:0,mentions:0,rate:0,rateMax:0,tweetsPerDay:0,lastSeen:null,isBot:!1,following:!1,categoryVerfied:!1,category:"none",categoryAuto:"none"}),i=Object(l.a)(s,2),d=i[0],j=i[1],h=Object(r.useState)({nodeId:!1}),b=Object(l.a)(h,2),u=b[0],g=b[1],O=Object(r.useState)({nodeId:null,text:null,categoryAuto:"none",category:"none",lastSeen:null,age:0,mentions:0,rate:0,rateMax:0}),m=Object(l.a)(O,2),x=m[0],f=m[1],p=Object(r.useCallback)((function(e){void 0!==e.persist&&e.persist(),void 0!==e.preventDefault&&e.preventDefault();var t=e.currentTarget.name,a=e.currentTarget.value,n=e.currentTarget.checked;if(void 0===e.currentTarget.name&&e.code)switch(e.code){case"ArrowRight":case"ArrowLeft":t="all";break;case"KeyD":case"KeyL":e.shiftKey?(t="category",a="left"):t="left";break;case"KeyN":e.shiftKey?(t="category",a="neutral"):t="neutral";break;case"KeyR":e.shiftKey?(t="category",a="right"):t="right";break;case"KeyI":e.shiftKey&&(t="ignored",n=!d.ignored);break;case"KeyV":e.shiftKey&&(t="catVerified",n=!d.categoryVerified);break;case"KeyB":e.shiftKey&&(t="isBot",n=!d.isBot)}console.log("handleUserChange | @"+d.screenName+" | name: "+t+" | value: "+a);var r="@?";switch(t){case"all":case"left":case"neutral":case"right":r+=t,H.emit("TWITTER_SEARCH_NODE",r);break;case"mismatch":H.emit("TWITTER_SEARCH_NODE","@?mm");break;case"category":H.emit("TWITTER_CATEGORIZE_NODE",{category:a,following:!0,node:d});break;case"isBot":n?H.emit("TWITTER_BOT",d):H.emit("TWITTER_UNBOT",d);break;case"following":n?H.emit("TWITTER_FOLLOW",d):H.emit("TWITTER_UNFOLLOW",d);break;case"catVerified":n?H.emit("TWITTER_CATEGORY_VERIFIED",d):H.emit("TWITTER_CATEGORY_UNVERIFIED",d);break;case"ignored":n?H.emit("TWITTER_IGNORE",d):H.emit("TWITTER_UNIGNORE",d);break;default:console.log("handleUserChange: UNKNOWN NAME: "+t+" | VALUE: "+a),console.log({event:e})}}),[d]);return Object(r.useEffect)((function(){H.on("SET_TWITTER_USER",(function(e){var t;console.debug("RX SET_TWITTER_USER"),console.debug(e),void 0!==(t=e.node)&&void 0!==t.nodeId&&void 0!==t.screenName&&j(e.node),c(e.stats)}))}),[]),Object(r.useEffect)((function(){H.on("action",(function(e){switch(console.debug("RX ACTION | "+H.id+" | TYPE: "+e.type),console.debug("RX ACTION | ",e.data),e.type){case"user":j(e.data),u.nodeId&&d.nodeId!==u.nodeId&&!X.includes(u.nodeId)&&X.push(u.nodeId),u.nodeId!==d.nodeId&&g(d),console.log("USER: @"+e.data.screenName+" | "+e.data.profileImageUrl);break;case"hashtag":f({}),console.log("HT: #"+x.text);break;case"stats":c(e.data)}}))}),[]),Object(r.useEffect)((function(){return H.on("connect",(function(){console.log("CONNECTED: "+H.id),H.emit("authentication",{namespace:"view",userId:"test",password:"0123456789"})})),function(){return H.disconnect()}}),[]),Object(r.useEffect)((function(){H.on("authenticated",(function(){console.debug("AUTHENTICATED | "+H.id),F.socketId=H.id,F.serverConnected=!0,F.userReadyTransmitted=!1,F.userReadyAck=!1,H.emit("TWITTER_SEARCH_NODE","@threecee")}))}),[]),Object(o.a)("right",p),Object(o.a)("left",p),Object(o.a)("L",p),Object(o.a)("shift+L",(function(e){return p(e)}),{},[d]),Object(o.a)("D",p),Object(o.a)("shift+D",(function(e){return p(e)}),{},[d]),Object(o.a)("R",p),Object(o.a)("shift+R",(function(e){return p(e)}),{},[d]),Object(o.a)("N",p),Object(o.a)("shift+N",(function(e){return p(e)}),{},[d]),Object(o.a)("shift+I",(function(e){return p(e)}),{},[d]),Object(o.a)("shift+B",(function(e){return p(e)}),{},[d]),Object(o.a)("shift+V",(function(e){return p(e)}),{},[d]),Object(n.jsx)(V,{user:d,stats:a,handleUserChange:p,handleSearchUser:function(e){var t="@"+e;H.emit("TWITTER_SEARCH_NODE",t)}})},J=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,235)).then((function(t){var a=t.getCLS,n=t.getFID,r=t.getFCP,c=t.getLCP,s=t.getTTFB;a(e),n(e),r(e),c(e),s(e)}))};i.a.render(Object(n.jsx)(c.a.StrictMode,{children:Object(n.jsx)(Y,{})}),document.getElementById("root")),J()}},[[173,1,2]]]);
//# sourceMappingURL=main.ddcac054.chunk.js.map