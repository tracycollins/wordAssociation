(this.webpackJsonpcategorizer=this.webpackJsonpcategorizer||[]).push([[0],{102:function(e,t,a){},134:function(e,t,a){},172:function(e,t,a){"use strict";a.r(t);var n=a(2),r=a(0),c=a.n(r),s=a(21),l=a.n(s),o=(a(102),a(33)),i=a(18),d=a(84),h=a.n(d),j=(a(134),a(28)),u=a(50),g=a(87),b=a(49),O=a.n(b),m=a(212),x=a(173),T=a(214),p=a(216),f=a(219),C=a(217),E=a(218),w=a(229),I=a(211),N=a(230),k=a(226),R=a(225),y=a(215),v=a(228),U=a(227),S=a(231),A=a(86),_=a.n(A),W=a(221),D=a(222),P=a(224),L=a(220),B=a(223),G=a(213),M=a(34),z=a(209),F=Object(z.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:300},profileImage:{height:300},bannerImage:{height:80},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1},search:Object(j.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(j.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},left:{color:"white",backgroundColor:"blue"},neutral:{color:"white",backgroundColor:"gray"},right:{color:"white",backgroundColor:"red"},none:{color:"black",backgroundColor:"white"}}})),H=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},V=function(e){var t=F(),a=H(e.user.createdAt),c=H(e.user.lastSeen),s=new O.a(new Date(e.user.lastSeen)).toString(1,4),l=e.user.createdAt?new O.a(new Date(e.user.createdAt)):new O.a(new Date),o=l.toString(1,4),d=l.days>0?Math.ceil(e.user.statusesCount/l.days):0,h=Object(r.useState)(""),j=Object(i.a)(h,2),b=j[0],A=j[1],z=Object(r.useState)("---"),V=Object(i.a)(z,2),K=V[0],Y=V[1],X=function(t){Y(t.key.toUpperCase()),e.handleUserChange(t)};Object(u.a)("L",(function(e){return X(e)})),Object(u.a)("R",(function(e){return X(e)})),Object(u.a)("N",(function(e){return X(e)}));return Object(n.jsx)("div",{className:t.root,children:Object(n.jsxs)(I.a,{component:"main",children:[Object(n.jsx)(m.a,{className:t.appBar,position:"static",children:Object(n.jsxs)(G.a,{children:[Object(n.jsxs)(x.a,{variant:"contained",color:"primary",onClick:e.handleUserChange,name:"mismatch",className:t.buttonMismatch,children:["MISMATCH ",e.stats.user.mismatched]}),Object(n.jsxs)(T.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:[Object(n.jsxs)(x.a,{onClick:e.handleUserChange,name:"all",children:["TOTAL: ",e.stats.user.uncategorized.all]}),Object(n.jsxs)(x.a,{onClick:e.handleUserChange,name:"left",children:["LEFT: ",e.stats.user.uncategorized.left]}),Object(n.jsxs)(x.a,{onClick:e.handleUserChange,name:"neutral",children:["NEUTRAL: ",e.stats.user.uncategorized.neutral]}),Object(n.jsxs)(x.a,{onClick:e.handleUserChange,name:"right",children:["RIGHT: ",e.stats.user.uncategorized.right]})]}),Object(n.jsxs)("div",{className:t.search,children:[Object(n.jsx)("div",{className:t.searchIcon,children:Object(n.jsx)(_.a,{color:"primary"})}),Object(n.jsx)(v.a,{placeholder:"search\u2026",classes:{root:t.inputRoot,input:t.inputInput},inputProps:{"aria-label":"search"},value:b,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER"),e.handleSearchUser(b))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),A(e.target.value)}})]}),Object(n.jsxs)(M.a,{color:"primary",children:["HOTKEY: ",K]})]})}),Object(n.jsxs)(y.a,{className:t.grid,children:[Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:3,children:Object(n.jsxs)(p.a,{className:t.card,variant:"outlined",children:[Object(n.jsx)(C.a,{onClick:function(){console.log("open twitter"),window.open("http://twitter.com/".concat(e.user.screenName||null),"_blank")},title:"".concat(e.user.name),subheader:"@".concat(e.user.screenName)}),Object(n.jsx)(E.a,{className:t.profileImage,image:e.user.profileImageUrl||"logo192.png"}),Object(n.jsx)("br",{}),Object(n.jsx)(E.a,{className:t.bannerImage,image:e.user.bannerImageUrl||"logo192.png"}),Object(n.jsx)(f.a,{children:Object(n.jsx)(M.a,{children:e.user.description})})]})}),Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:4,children:Object(n.jsx)(g.a,{dataSource:{sourceType:"profile",screenName:e.user.screenName},options:{height:"540"}})}),Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:3,children:Object(n.jsx)(L.a,{children:Object(n.jsx)(W.a,{className:t.table,size:"small",children:Object(n.jsxs)(D.a,{children:[Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"location"}),Object(n.jsx)(P.a,{align:"right",children:e.user.location})]}),Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"created"}),Object(n.jsx)(P.a,{align:"right",children:a})]}),Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"twitter age"}),Object(n.jsx)(P.a,{align:"right",children:o})]}),Object(n.jsxs)(B.a,{className:e.user.followersCount>5e3?t.tableRowGreen:null,children:[Object(n.jsx)(P.a,{children:"followers"}),Object(n.jsx)(P.a,{align:"right",children:e.user.followersCount})]}),Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"friends"}),Object(n.jsx)(P.a,{align:"right",children:e.user.friendsCount})]}),Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"tweets"}),Object(n.jsx)(P.a,{align:"right",children:e.user.statusesCount})]}),Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"tweets/day"}),Object(n.jsx)(P.a,{align:"right",children:d})]}),Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"last seen"}),Object(n.jsx)(P.a,{align:"right",children:c})]}),Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"last seen"}),Object(n.jsxs)(P.a,{align:"right",children:[s," ago"]})]}),Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"mentions"}),Object(n.jsx)(P.a,{align:"right",children:e.user.mentions})]}),Object(n.jsxs)(B.a,{children:[Object(n.jsx)(P.a,{children:"mentions/min"}),Object(n.jsx)(P.a,{align:"right",children:e.user.rate?e.user.rate.toFixed(1):0})]})]})})})}),Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:1,children:Object(n.jsxs)(R.a,{children:[Object(n.jsxs)(x.a,{className:function(e){switch(e){case"left":case"neutral":case"right":return t[e];default:return t.none}}(e.user.categoryAuto),children:["AUTO: ",e.user.categoryAuto.toUpperCase()||"NONE"]}),Object(n.jsx)(N.a,{component:"fieldset",children:Object(n.jsxs)(S.a,{"aria-label":"category",name:"category",value:e.user.category||"none",onChange:e.handleUserChange,children:[Object(n.jsx)(k.a,{labelPlacement:"start",value:"left",control:Object(n.jsx)(U.a,{}),label:"left"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"neutral",control:Object(n.jsx)(U.a,{}),label:"neutral"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"right",control:Object(n.jsx)(U.a,{}),label:"right"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"positive",control:Object(n.jsx)(U.a,{}),label:"positive"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"negative",control:Object(n.jsx)(U.a,{}),label:"negative"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"none",control:Object(n.jsx)(U.a,{}),label:"none"})]})}),Object(n.jsx)(k.a,{control:Object(n.jsx)(w.a,{checked:e.user.categoryVerified||!1,onChange:e.handleUserChange,name:"catVerified"}),label:"verified",labelPlacement:"start"}),Object(n.jsx)(k.a,{control:Object(n.jsx)(w.a,{checked:e.user.following||!1,onChange:e.handleUserChange,name:"following"}),label:"following",labelPlacement:"start"}),Object(n.jsx)(k.a,{control:Object(n.jsx)(w.a,{checked:e.user.ignored||!1,onChange:e.handleUserChange,name:"ignored"}),label:"ignored",labelPlacement:"start"}),Object(n.jsx)(k.a,{control:Object(n.jsx)(w.a,{checked:e.user.isBot||!1,onChange:e.handleUserChange,name:"isBot"}),label:"bot",labelPlacement:"start"})]})})]})]})})},K={viewerReadyTransmitted:!1},Y=h()("https://word.threeceelabs.com/view"),X=function(){var e=Object(r.useState)({nodesPerMin:0,maxNodesPerMin:0,bestNetworkId:"",user:{uncategorized:{left:0,neutral:0,right:0,all:0,mismatched:0}}}),t=Object(i.a)(e,2),a=t[0],c=t[1],s=Object(r.useState)({nodeId:null,screenName:"threecee",name:"",location:"",description:"",profileImageUrl:"https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",bannerImage:"",createdAt:null,followersCount:0,friendsCount:0,tweets:0,age:0,mentions:0,rate:0,rateMax:0,tweetsPerDay:0,lastSeen:null,isBot:!1,following:!1,categoryVerfied:!1,category:"none",categoryAuto:"none"}),l=Object(i.a)(s,2),d=l[0],h=l[1],j=Object(r.useState)({nodeId:null,text:null,categoryAuto:"none",category:"none",lastSeen:null,age:0,mentions:0,rate:0,rateMax:0}),u=Object(i.a)(j,2),g=u[0],b=u[1],O=Object(r.useCallback)((function(e){switch(e.type){case"user":h(Object(o.a)(Object(o.a)({},d),e.data)),console.log("USER: @"+d.screenName+" | "+d.profileImageUrl);break;case"hashtag":b({}),console.log("HT: #"+g.text);break;case"stats":c(Object(o.a)(Object(o.a)({},a),e.data))}}),[g.text,d]);return Object(r.useEffect)((function(){Y.on("SET_TWITTER_USER",(function(e){console.debug("RX SET_TWITTER_USER"),console.debug(e),O({type:"user",data:e.node}),O({type:"stats",data:e.stats})}))}),[]),Object(r.useEffect)((function(){return Y.on("connect",(function(){console.log("CONNECTED: "+Y.id),Y.emit("authentication",{namespace:"view",userId:"test",password:"0123456789"})})),Y.on("authenticated",(function(){console.debug("AUTHENTICATED | "+Y.id),K.socketId=Y.id,K.serverConnected=!0,K.userReadyTransmitted=!1,K.userReadyAck=!1,console.log("CONNECTED TO HOST | ID: "+Y.id),Y.emit("TWITTER_SEARCH_NODE","@threecee")})),Y.on("action",(function(e){console.debug("RX ACTION | "+Y.id+" | TYPE: "+e.type),console.debug("RX ACTION | ",e.data),O(e)})),function(){return Y.disconnect()}}),[]),Object(n.jsx)(V,{user:d,stats:a,handleUserChange:function(e){console.log(typeof e),void 0!==e.persist&&e.persist();var t=e.currentTarget.name;if(void 0===e.currentTarget.name&&e.code)switch(e.code){case"KeyL":t="left";break;case"KeyN":t="neutral";break;case"KeyR":t="right"}console.log("handleUserChange: name: "+t+" | value: "+e.currentTarget.value);var a="@?";switch(t){case"all":case"left":case"neutral":case"right":a+=t,Y.emit("TWITTER_SEARCH_NODE",a);break;case"mismatch":Y.emit("TWITTER_SEARCH_NODE","@?mm");break;case"category":console.log("handleUserChange: "+t+" | "+e.currentTarget.value+" | "+e.currentTarget.checked),Y.emit("TWITTER_CATEGORIZE_NODE",{category:e.currentTarget.value,following:!0,node:d});break;case"isBot":console.log("handleUserChange: "+t+" | "+e.currentTarget.checked),e.currentTarget.checked?Y.emit("TWITTER_BOT",d):Y.emit("TWITTER_UNBOT",d);break;case"following":console.log("handleUserChange: "+t+" | "+e.currentTarget.checked),e.currentTarget.checked?Y.emit("TWITTER_FOLLOW",d):Y.emit("TWITTER_UNFOLLOW",d);break;case"catVerified":console.log("handleUserChange: "+t+" | "+e.currentTarget.checked),e.currentTarget.checked?Y.emit("TWITTER_CATEGORY_VERIFIED",d):Y.emit("TWITTER_CATEGORY_UNVERIFIED",d);break;case"ignored":console.log("handleUserChange: "+t+" | "+e.currentTarget.checked),e.currentTarget.checked?Y.emit("TWITTER_IGNORE",d):Y.emit("TWITTER_UNIGNORE",d);break;default:console.log("handleUserChange: UNKNOWN NAME: "+t+" | VALUE: "+e.currentTarget.value),console.log({event:e})}},handleSearchUser:function(e){var t="@"+e;Y.emit("TWITTER_SEARCH_NODE",t)}})},J=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,233)).then((function(t){var a=t.getCLS,n=t.getFID,r=t.getFCP,c=t.getLCP,s=t.getTTFB;a(e),n(e),r(e),c(e),s(e)}))};l.a.render(Object(n.jsx)(c.a.StrictMode,{children:Object(n.jsx)(X,{})}),document.getElementById("root")),J()}},[[172,1,2]]]);
//# sourceMappingURL=main.0dabf364.chunk.js.map