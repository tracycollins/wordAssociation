(this.webpackJsonpcategorizer=this.webpackJsonpcategorizer||[]).push([[0],{101:function(e,t,a){},133:function(e,t,a){},171:function(e,t,a){"use strict";a.r(t);var n=a(2),c=a(0),r=a.n(c),s=a(20),l=a.n(s),o=(a(101),a(33)),i=a(25),d=a(83),g=a.n(d),h=(a(133),a(28)),j=a(86),u=a(49),b=a.n(u),m=a(211),O=a(172),x=a(213),T=a(215),p=a(218),f=a(216),C=a(217),E=a(228),I=a(210),w=a(229),k=a(225),N=a(224),R=a(214),y=a(227),v=a(226),S=a(230),_=a(85),A=a.n(_),D=a(220),P=a(221),W=a(223),U=a(219),L=a(222),B=a(212),G=a(34),z=a(208),F=Object(z.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:300},profileImage:{height:300},bannerImage:{height:80},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},left:{color:"white",backgroundColor:"blue"},neutral:{color:"white",backgroundColor:"gray"},right:{color:"white",backgroundColor:"red"},none:{color:"black",backgroundColor:"white"}}})),M=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},H=function(e){var t=F(),a=M(e.user.createdAt),r=M(e.user.lastSeen),s=new b.a(new Date(e.user.lastSeen)).toString(1,4),l=e.user.createdAt?new b.a(new Date(e.user.createdAt)):new b.a(new Date),o=l.toString(1,4),d=l.days>0?Math.ceil(e.user.statusesCount/l.days):0,g=Object(c.useState)(""),h=Object(i.a)(g,2),u=h[0],_=h[1];return Object(n.jsx)("div",{className:t.root,children:Object(n.jsxs)(I.a,{component:"main",children:[Object(n.jsx)(m.a,{className:t.appBar,position:"static",children:Object(n.jsxs)(B.a,{children:[Object(n.jsxs)(O.a,{variant:"contained",color:"primary",onClick:e.handleChange,name:"mismatch",className:t.buttonMismatch,children:["MISMATCH ",e.stats.user.mismatched]}),Object(n.jsxs)(x.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:[Object(n.jsxs)(O.a,{onClick:e.handleChange,name:"all",children:["TOTAL: ",e.stats.user.uncategorized.all]}),Object(n.jsxs)(O.a,{onClick:e.handleChange,name:"left",children:["LEFT: ",e.stats.user.uncategorized.left]}),Object(n.jsxs)(O.a,{onClick:e.handleChange,name:"neutral",children:["NEUTRAL: ",e.stats.user.uncategorized.neutral]}),Object(n.jsxs)(O.a,{onClick:e.handleChange,name:"right",children:["RIGHT: ",e.stats.user.uncategorized.right]})]}),Object(n.jsxs)("div",{className:t.search,children:[Object(n.jsx)("div",{className:t.searchIcon,children:Object(n.jsx)(A.a,{color:"primary"})}),Object(n.jsx)(y.a,{placeholder:"search\u2026",classes:{root:t.inputRoot,input:t.inputInput},inputProps:{"aria-label":"search"},value:u,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER"),e.handleSearchUser(u))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),_(e.target.value)}})]})]})}),Object(n.jsxs)(R.a,{className:t.grid,children:[Object(n.jsx)(R.a,{item:!0,className:t.gridItem,xs:3,children:Object(n.jsxs)(T.a,{className:t.card,variant:"outlined",children:[Object(n.jsx)(f.a,{onClick:function(){console.log("open twitter"),window.open("http://twitter.com/".concat(e.user.screenName||null),"_blank")},title:"".concat(e.user.name),subheader:"@".concat(e.user.screenName)}),Object(n.jsx)(C.a,{className:t.profileImage,image:e.user.profileImageUrl||"logo192.png"}),Object(n.jsx)("br",{}),Object(n.jsx)(C.a,{className:t.bannerImage,image:e.user.bannerImageUrl||"logo192.png"}),Object(n.jsx)(p.a,{children:Object(n.jsx)(G.a,{children:e.user.description})})]})}),Object(n.jsx)(R.a,{item:!0,className:t.gridItem,xs:4,children:Object(n.jsx)(j.a,{dataSource:{sourceType:"profile",screenName:e.user.screenName},options:{height:"540"}})}),Object(n.jsx)(R.a,{item:!0,className:t.gridItem,xs:3,children:Object(n.jsx)(U.a,{children:Object(n.jsx)(D.a,{className:t.table,size:"small",children:Object(n.jsxs)(P.a,{children:[Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"location"}),Object(n.jsx)(W.a,{align:"right",children:e.user.location})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"created"}),Object(n.jsx)(W.a,{align:"right",children:a})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"twitter age"}),Object(n.jsx)(W.a,{align:"right",children:o})]}),Object(n.jsxs)(L.a,{className:e.user.followersCount>5e3?t.tableRowGreen:null,children:[Object(n.jsx)(W.a,{children:"followers"}),Object(n.jsx)(W.a,{align:"right",children:e.user.followersCount})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"friends"}),Object(n.jsx)(W.a,{align:"right",children:e.user.friendsCount})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"tweets"}),Object(n.jsx)(W.a,{align:"right",children:e.user.statusesCount})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"tweets/day"}),Object(n.jsx)(W.a,{align:"right",children:d})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"last seen"}),Object(n.jsx)(W.a,{align:"right",children:r})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"last seen"}),Object(n.jsxs)(W.a,{align:"right",children:[s," ago"]})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"mentions"}),Object(n.jsx)(W.a,{align:"right",children:e.user.mentions})]}),Object(n.jsxs)(L.a,{children:[Object(n.jsx)(W.a,{children:"mentions/min"}),Object(n.jsx)(W.a,{align:"right",children:e.user.rate?e.user.rate.toFixed(1):0})]})]})})})}),Object(n.jsx)(R.a,{item:!0,className:t.gridItem,xs:1,children:Object(n.jsxs)(N.a,{children:[Object(n.jsxs)(O.a,{className:function(e){switch(e){case"left":case"neutral":case"right":return t[e];default:return t.none}}(e.user.categoryAuto),children:["AUTO: ",e.user.categoryAuto.toUpperCase()||"NONE"]}),Object(n.jsx)(w.a,{component:"fieldset",children:Object(n.jsxs)(S.a,{"aria-label":"category",name:"category",value:e.user.category||"none",onChange:e.handleChange,children:[Object(n.jsx)(k.a,{labelPlacement:"start",value:"left",control:Object(n.jsx)(v.a,{}),label:"left"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"neutral",control:Object(n.jsx)(v.a,{}),label:"neutral"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"right",control:Object(n.jsx)(v.a,{}),label:"right"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"positive",control:Object(n.jsx)(v.a,{}),label:"positive"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"negative",control:Object(n.jsx)(v.a,{}),label:"negative"}),Object(n.jsx)(k.a,{labelPlacement:"start",value:"none",control:Object(n.jsx)(v.a,{}),label:"none"})]})}),Object(n.jsx)(k.a,{control:Object(n.jsx)(E.a,{checked:e.user.categoryVerified||!1,onChange:e.handleChange,name:"catVerified"}),label:"verified",labelPlacement:"start"}),Object(n.jsx)(k.a,{control:Object(n.jsx)(E.a,{checked:e.user.following||!1,onChange:e.handleChange,name:"following"}),label:"following",labelPlacement:"start"}),Object(n.jsx)(k.a,{control:Object(n.jsx)(E.a,{checked:e.user.ignored||!1,onChange:e.handleChange,name:"ignored"}),label:"ignored",labelPlacement:"start"}),Object(n.jsx)(k.a,{control:Object(n.jsx)(E.a,{checked:e.user.isBot||!1,onChange:e.handleChange,name:"isBot"}),label:"bot",labelPlacement:"start"})]})})]})]})})},V={viewerReadyTransmitted:!1},X=g()("https://word.threeceelabs.com/view"),Y=function(){var e=Object(c.useState)({nodesPerMin:0,maxNodesPerMin:0,bestNetworkId:"",user:{uncategorized:{left:0,neutral:0,right:0,all:0,mismatched:0}}}),t=Object(i.a)(e,2),a=t[0],r=t[1],s=Object(c.useState)({nodeId:null,screenName:"threecee",name:"",location:"",description:"",profileImageUrl:"https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",bannerImage:"",createdAt:null,followersCount:0,friendsCount:0,tweets:0,age:0,mentions:0,rate:0,rateMax:0,tweetsPerDay:0,lastSeen:null,isBot:!1,following:!1,categoryVerfied:!1,category:"none",categoryAuto:"none"}),l=Object(i.a)(s,2),d=l[0],g=l[1],h=Object(c.useState)({nodeId:null,text:null,categoryAuto:"none",category:"none",lastSeen:null,age:0,mentions:0,rate:0,rateMax:0}),j=Object(i.a)(h,2),u=j[0],b=j[1],m=Object(c.useCallback)((function(e){switch(e.type){case"user":g(Object(o.a)(Object(o.a)({},d),e.data)),console.log("USER: @"+d.screenName+" | "+d.profileImageUrl);break;case"hashtag":b({}),console.log("HT: #"+u.text);break;case"stats":r(Object(o.a)(Object(o.a)({},a),e.data))}}),[u.text,d]);return Object(c.useEffect)((function(){X.on("SET_TWITTER_USER",(function(e){console.debug("RX SET_TWITTER_USER"),console.debug(e),m({type:"user",data:e.node}),m({type:"stats",data:e.stats})}))}),[m]),Object(c.useEffect)((function(){X.on("connect",(function(){console.log("CONNECTED: "+X.id),X.emit("authentication",{namespace:"view",userId:"test",password:"0123456789"})})),X.on("authenticated",(function(){console.debug("AUTHENTICATED | "+X.id),V.socketId=X.id,V.serverConnected=!0,V.userReadyTransmitted=!1,V.userReadyAck=!1,console.log("CONNECTED TO HOST | ID: "+X.id),X.emit("TWITTER_SEARCH_NODE","@threecee")})),X.on("action",(function(e){console.debug("RX ACTION | "+X.id+" | TYPE: "+e.type),console.debug("RX ACTION | ",e.data),m(e)}))}),[m]),Object(n.jsx)(H,{user:d,stats:a,handleChange:function(e){e.persist(),console.log("handleChange: name: "+e.currentTarget.name+" | value: "+e.currentTarget.value);var t="@?";switch(e.currentTarget.name){case"all":case"left":case"neutral":case"right":t+=e.currentTarget.name,X.emit("TWITTER_SEARCH_NODE",t);break;case"mismatch":X.emit("TWITTER_SEARCH_NODE","@?mm");break;case"category":console.log("handleChange: "+e.currentTarget.name+" | "+e.currentTarget.value+" | "+e.currentTarget.checked),X.emit("TWITTER_CATEGORIZE_NODE",{category:e.currentTarget.value,following:!0,node:d});break;case"isBot":console.log("handleChange: "+e.currentTarget.name+" | "+e.currentTarget.checked),e.currentTarget.checked?X.emit("TWITTER_BOT",d):X.emit("TWITTER_UNBOT",d);break;case"following":console.log("handleChange: "+e.currentTarget.name+" | "+e.currentTarget.checked),e.currentTarget.checked?X.emit("TWITTER_FOLLOW",d):X.emit("TWITTER_UNFOLLOW",d);break;case"catVerified":console.log("handleChange: "+e.currentTarget.name+" | "+e.currentTarget.checked),e.currentTarget.checked?X.emit("TWITTER_CATEGORY_VERIFIED",d):X.emit("TWITTER_CATEGORY_UNVERIFIED",d);break;case"ignored":console.log("handleChange: "+e.currentTarget.name+" | "+e.currentTarget.checked),e.currentTarget.checked?X.emit("TWITTER_IGNORE",d):X.emit("TWITTER_UNIGNORE",d)}},handleSearchUser:function(e){var t="@"+e;X.emit("TWITTER_SEARCH_NODE",t)}})},J=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,232)).then((function(t){var a=t.getCLS,n=t.getFID,c=t.getFCP,r=t.getLCP,s=t.getTTFB;a(e),n(e),c(e),r(e),s(e)}))};l.a.render(Object(n.jsx)(r.a.StrictMode,{children:Object(n.jsx)(Y,{})}),document.getElementById("root")),J()}},[[171,1,2]]]);
//# sourceMappingURL=main.5c576e92.chunk.js.map