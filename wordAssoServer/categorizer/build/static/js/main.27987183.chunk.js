(this.webpackJsonpcategorizer=this.webpackJsonpcategorizer||[]).push([[0],{132:function(e,t,a){},163:function(e,t,a){},202:function(e,t,a){"use strict";a.r(t);var n,r,c=a(1),s=a(0),i=a(31),o=a.n(i),l=a(68),d=(a(132),a(17)),h=a(25),j=a(10),g=a(11),u=a(100),b=a.n(u),m=a(222),O=a(239),x=a(224),p=a(240),f=a(203),N=a(241),T=a(225),w=a(106),v=(a(163),a(56)),C=a(27),R=a.n(C),y=a(226),I=a(228),E=a(229),k=a(230),A=a(244),S=a(245),_=a(238),L=a(237),U=a(227),D=a(243),P=a(242),W=a(246),G=a(49),B=a.n(G),H=a(232),K=a(233),z=a(235),M=a(231),F=a(234),V=a(236),X=Object(m.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:400},profileImage:{maxHeight:400},bannerImage:{height:80},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1,color:"blue"},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},left:{backgroundColor:"blue",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},neutral:{backgroundColor:"gray",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},right:{backgroundColor:"red",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},none:{backgroundColor:"white",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"}}})),Y=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},q=function(e){var t=X(),a=Y(e.user.createdAt),n=Y(e.user.lastSeen),r=new R.a(new Date(e.user.lastSeen)).toString(1,4),i=e.user.createdAt?new R.a(new Date(e.user.createdAt)):new R.a(new Date),o=i.toString(1,4),l=i.days>0?Math.ceil(e.user.statusesCount/i.days):0,h=Object(s.useState)(e.user.screenName),j=Object(d.a)(h,2),g=j[0],u=j[1];Object(s.useEffect)((function(){u(e.user.screenName)}),[e]);return Object(c.jsxs)(c.Fragment,{children:[Object(c.jsx)(x.a,{className:t.appBar,position:"static",children:Object(c.jsxs)(T.a,{children:[Object(c.jsx)(w.a,{variant:"h6",className:t.title,children:"User"}),Object(c.jsxs)("div",{className:t.search,children:[Object(c.jsx)("div",{className:t.searchIcon,children:Object(c.jsx)(B.a,{color:"primary"})}),Object(c.jsx)(D.a,{placeholder:"search\u2026",classes:{root:t.inputRoot,input:t.inputInput},inputProps:{"aria-label":"search"},value:g,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER"),e.handleSearchUser(g))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),u(e.target.value)}})]}),Object(c.jsx)(w.a,{className:t.buttonGroupLabel,children:"UNCAT"}),Object(c.jsxs)(y.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:[Object(c.jsxs)(f.a,{onClick:e.handleNodeChange,name:"all",children:["ALL: ",e.stats.user.uncategorized.all]}),Object(c.jsxs)(f.a,{onClick:e.handleNodeChange,name:"left",children:["LEFT: ",e.stats.user.uncategorized.left]}),Object(c.jsxs)(f.a,{onClick:e.handleNodeChange,name:"neutral",children:["NEUTRAL: ",e.stats.user.uncategorized.neutral]}),Object(c.jsxs)(f.a,{onClick:e.handleNodeChange,name:"right",children:["RIGHT: ",e.stats.user.uncategorized.right]})]}),Object(c.jsxs)(f.a,{className:t.buttonMismatch,variant:"contained",color:"primary",size:"small",onClick:e.handleNodeChange,name:"mismatch",children:["MISMATCH ",e.stats.user.mismatched]})]})}),Object(c.jsxs)(U.a,{className:t.grid,children:[Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsxs)(I.a,{className:t.card,variant:"outlined",children:[Object(c.jsxs)(E.a,{onClick:function(){console.log("open twitter"),window.open("http://twitter.com/".concat(e.user.screenName||null),"_blank")},children:[Object(c.jsx)(w.a,{variant:"h6",children:e.user.name}),Object(c.jsxs)(w.a,{children:["@",e.user.screenName]})]}),Object(c.jsx)(k.a,{className:t.profileImage,src:e.user.profileImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(c.jsx)("br",{}),Object(c.jsx)(k.a,{className:t.bannerImage,src:e.user.bannerImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(c.jsx)(E.a,{children:Object(c.jsx)(w.a,{children:e.user.description})})]})}),Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(v.b,{dataSource:{sourceType:"profile",screenName:e.user.screenName},options:{height:"640"}})}),Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(M.a,{children:Object(c.jsx)(H.a,{className:t.table,size:"small",children:Object(c.jsxs)(K.a,{children:[Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"id"}),Object(c.jsx)(z.a,{align:"right",children:e.user.nodeId})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"location"}),Object(c.jsx)(z.a,{align:"right",children:e.user.location})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"created"}),Object(c.jsx)(z.a,{align:"right",children:a})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"twitter age"}),Object(c.jsx)(z.a,{align:"right",children:o})]}),Object(c.jsxs)(F.a,{className:e.user.followersCount>5e3?t.tableRowGreen:null,children:[Object(c.jsx)(z.a,{children:"followers"}),Object(c.jsx)(z.a,{align:"right",children:e.user.followersCount})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"friends"}),Object(c.jsx)(z.a,{align:"right",children:e.user.friendsCount})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"tweets"}),Object(c.jsx)(z.a,{align:"right",children:e.user.statusesCount})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"tweets/day"}),Object(c.jsx)(z.a,{align:"right",children:l})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"last seen"}),Object(c.jsx)(z.a,{align:"right",children:n})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"last seen"}),Object(c.jsxs)(z.a,{align:"right",children:[r," ago"]})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"mentions"}),Object(c.jsx)(z.a,{align:"right",children:e.user.mentions})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"mentions/min"}),Object(c.jsx)(z.a,{align:"right",children:e.user.rate?e.user.rate.toFixed(1):0})]})]})})})}),Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:2,children:Object(c.jsx)(M.a,{children:Object(c.jsxs)(H.a,{className:t.table,size:"small",children:[Object(c.jsx)(V.a,{children:Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"CAT"}),Object(c.jsx)(z.a,{align:"left",children:"MAN"}),Object(c.jsx)(z.a,{align:"left",children:"AUTO"})]})}),Object(c.jsxs)(K.a,{children:[Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"left"}),Object(c.jsx)(z.a,{align:"right",children:e.stats.user.manual.left}),Object(c.jsx)(z.a,{align:"right",children:e.stats.user.auto.left})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"neutral"}),Object(c.jsx)(z.a,{align:"right",children:e.stats.user.manual.neutral}),Object(c.jsx)(z.a,{align:"right",children:e.stats.user.auto.neutral})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"right"}),Object(c.jsx)(z.a,{align:"right",children:e.stats.user.manual.right}),Object(c.jsx)(z.a,{align:"right",children:e.stats.user.auto.right})]})]})]})})}),Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:1,children:Object(c.jsxs)(L.a,{children:[Object(c.jsxs)(w.a,{className:function(e){switch(e){case"left":case"neutral":case"right":return t[e];default:return t.none}}(e.user.categoryAuto),align:"center",children:["AUTO: ",e.user.categoryAuto.toUpperCase()||"NONE"]}),Object(c.jsx)(S.a,{component:"fieldset",children:Object(c.jsxs)(W.a,{"aria-label":"category",name:"category",value:e.user.category||"none",onChange:e.handleNodeChange,children:[Object(c.jsx)(_.a,{labelPlacement:"start",value:"left",control:Object(c.jsx)(P.a,{}),label:"left"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"neutral",control:Object(c.jsx)(P.a,{}),label:"neutral"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"right",control:Object(c.jsx)(P.a,{}),label:"right"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"positive",control:Object(c.jsx)(P.a,{}),label:"positive"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"negative",control:Object(c.jsx)(P.a,{}),label:"negative"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"none",control:Object(c.jsx)(P.a,{}),label:"none"})]})}),Object(c.jsx)(_.a,{control:Object(c.jsx)(A.a,{checked:e.user.categoryVerified||!1,onChange:e.handleNodeChange,name:"catVerified"}),label:"verified",labelPlacement:"start"}),Object(c.jsx)(_.a,{control:Object(c.jsx)(A.a,{checked:e.user.following||!1,onChange:e.handleNodeChange,name:"following"}),label:"following",labelPlacement:"start"}),Object(c.jsx)(_.a,{control:Object(c.jsx)(A.a,{checked:e.user.ignored||!1,onChange:e.handleNodeChange,name:"ignored"}),label:"ignored",labelPlacement:"start"}),Object(c.jsx)(_.a,{control:Object(c.jsx)(A.a,{checked:e.user.isBot||!1,onChange:e.handleNodeChange,name:"isBot"}),label:"bot",labelPlacement:"start"})]})})]})]})},J=Object(m.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:400},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1,color:"blue"},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},left:{backgroundColor:"blue",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},neutral:{backgroundColor:"gray",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},right:{backgroundColor:"red",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},none:{backgroundColor:"white",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"}}})),Z=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},Q=function(e){var t=J(),a=Z(e.hashtag.createdAt),n=Z(e.hashtag.lastSeen),r=new R.a(new Date(e.hashtag.lastSeen)).toString(1,4),i=(e.hashtag.createdAt?new R.a(new Date(e.hashtag.createdAt)):new R.a(new Date)).toString(1,4),o=Object(s.useState)(e.hashtag.nodeId),l=Object(d.a)(o,2),h=l[0],j=l[1];Object(s.useEffect)((function(){j(e.hashtag.nodeId)}),[e]);return Object(c.jsxs)(c.Fragment,{children:[Object(c.jsx)(x.a,{className:t.appBar,position:"static",children:Object(c.jsxs)(T.a,{children:[Object(c.jsx)(w.a,{variant:"h6",className:t.title,children:"Hashtag"}),Object(c.jsxs)("div",{className:t.search,children:[Object(c.jsx)("div",{className:t.searchIcon,children:Object(c.jsx)(B.a,{color:"primary"})}),Object(c.jsx)(D.a,{placeholder:"search\u2026",classes:{root:t.inputRoot,input:t.inputInput},inputProps:{"aria-label":"search"},value:h,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER: hashtagSearch: "+h),e.handleSearchNode(h))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),j(e.target.value)}})]}),Object(c.jsx)(w.a,{className:t.buttonGroupLabel,children:"UNCAT"}),Object(c.jsx)(y.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:Object(c.jsxs)(f.a,{onClick:e.handleNodeChange,name:"all",children:["ALL: ",e.stats.hashtag.uncategorized.all]})})]})}),Object(c.jsxs)(U.a,{className:t.grid,children:[Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(I.a,{className:t.card,variant:"outlined",children:Object(c.jsx)(E.a,{onClick:function(){console.log("open twitter"),window.open("https://twitter.com/search?f=tweets&q=%23".concat(e.hashtag.nodeId||null),"_blank")},children:Object(c.jsxs)(w.a,{children:["#",e.hashtag.nodeId]})})})}),Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(v.a,{dataSource:{hashtag:e.hashtag.nodeId},options:{height:"640"}})}),Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(M.a,{children:Object(c.jsx)(H.a,{className:t.table,size:"small",children:Object(c.jsxs)(K.a,{children:[Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"id"}),Object(c.jsx)(z.a,{align:"right",children:e.hashtag.nodeId})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"created"}),Object(c.jsx)(z.a,{align:"right",children:a})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"twitter age"}),Object(c.jsx)(z.a,{align:"right",children:i})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"last seen"}),Object(c.jsx)(z.a,{align:"right",children:n})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"last seen"}),Object(c.jsxs)(z.a,{align:"right",children:[r," ago"]})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"mentions"}),Object(c.jsx)(z.a,{align:"right",children:e.hashtag.mentions})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"mentions/min"}),Object(c.jsx)(z.a,{align:"right",children:e.hashtag.rate?e.hashtag.rate.toFixed(1):0})]})]})})})}),Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:2,children:Object(c.jsx)(M.a,{children:Object(c.jsxs)(H.a,{className:t.table,size:"small",children:[Object(c.jsx)(V.a,{children:Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"CAT"}),Object(c.jsx)(z.a,{align:"left",children:"MAN"})]})}),Object(c.jsxs)(K.a,{children:[Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"left"}),Object(c.jsx)(z.a,{align:"right",children:e.stats.hashtag.manual.left})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"neutral"}),Object(c.jsx)(z.a,{align:"right",children:e.stats.hashtag.manual.neutral})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"right"}),Object(c.jsx)(z.a,{align:"right",children:e.stats.hashtag.manual.right})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"positive"}),Object(c.jsx)(z.a,{align:"right",children:e.stats.hashtag.manual.positive})]}),Object(c.jsxs)(F.a,{children:[Object(c.jsx)(z.a,{children:"negative"}),Object(c.jsx)(z.a,{align:"right",children:e.stats.hashtag.manual.negative})]})]})]})})}),Object(c.jsx)(U.a,{item:!0,className:t.gridItem,xs:1,children:Object(c.jsxs)(L.a,{children:[Object(c.jsxs)(w.a,{className:function(e){switch(e){case"left":case"neutral":case"right":case"positive":case"negative":return t[e];default:return t.none}}(e.hashtag.categoryAuto),align:"center",children:["AUTO: ",e.hashtag.categoryAuto.toUpperCase()||"NONE"]}),Object(c.jsx)(S.a,{component:"fieldset",children:Object(c.jsxs)(W.a,{"aria-label":"category",name:"category",value:e.hashtag.category||"none",onChange:e.handleNodeChange,children:[Object(c.jsx)(_.a,{labelPlacement:"start",value:"left",control:Object(c.jsx)(P.a,{}),label:"left"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"neutral",control:Object(c.jsx)(P.a,{}),label:"neutral"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"right",control:Object(c.jsx)(P.a,{}),label:"right"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"positive",control:Object(c.jsx)(P.a,{}),label:"positive"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"negative",control:Object(c.jsx)(P.a,{}),label:"negative"}),Object(c.jsx)(_.a,{labelPlacement:"start",value:"none",control:Object(c.jsx)(P.a,{}),label:"none"})]})}),Object(c.jsx)(_.a,{control:Object(c.jsx)(A.a,{checked:e.hashtag.ignored||!1,onChange:e.handleNodeChange,name:"ignored"}),label:"ignored",labelPlacement:"start"})]})})]})]})},$="http://word.threeceelabs.com/auth/twitter",ee="viewer_"+(n=1e9,r=9999999999,Math.floor(Math.random()*(r-n+1)+n)),te={nodeId:ee,userId:ee,viewerId:ee,screenName:ee,type:"viewer",namespace:"view",timeStamp:Date.now(),tags:{}};te.tags.type="viewer",te.tags.mode="stream",te.tags.entity=ee;var ae,ne=te;console.log({viewerObj:ne});var re=Object(m.a)((function(e){return{root:{flexGrow:1},appBar:{backgroundColor:"white",margin:2},buttonNodeType:{},title:{flexGrow:1,color:"blue"},serverStatus:{color:"gray",padding:e.spacing(1)},twitterAuth:{color:"green",padding:e.spacing(1),marginRight:e.spacing(2)},buttonLogin:{marginRight:e.spacing(2)},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"})}})),ce=function(){var e=Object(j.d)(),t=re(),a=Object(s.useState)(!1),n=Object(d.a)(a,2),r=n[0],i=n[1],o=Object(s.useState)(""),l=Object(d.a)(o,2),h=l[0],u=l[1],m=Object(s.useState)({nodesPerMin:0,maxNodesPerMin:0,maxNodesPerMinTime:0,bestNetwork:{networkId:""},user:{uncategorized:{left:0,neutral:0,right:0,positive:0,negative:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0,positive:0,negative:0},auto:{left:0,neutral:0,right:0,positive:0,negative:0}},hashtag:{uncategorized:{left:0,neutral:0,right:0,positive:0,negative:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0,positive:0,negative:0},auto:{left:0,neutral:0,right:0,positive:0,negative:0}}}),v=Object(d.a)(m,2),C=v[0],R=v[1],y=Object(s.useState)("idle"),I=Object(d.a)(y,2),E=I[0],k=I[1],A=Object(s.useState)("user"),S=Object(d.a)(A,2),_=S[0],L=S[1],U=Object(s.useState)({nodeId:null,screenName:"threecee",name:"",location:"",description:"",profileImageUrl:"https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",bannerImage:"",createdAt:null,followersCount:0,friendsCount:0,tweets:0,age:0,mentions:0,rate:0,rateMax:0,tweetsPerDay:0,lastSeen:null,isBot:!1,following:!1,categoryVerfied:!1,category:"none",categoryAuto:"none"}),D=Object(d.a)(U,2),P=D[0],W=D[1],G=Object(s.useState)({nodeId:"blacklivesmatter",text:"BlackLivesMatter",categoryAuto:"none",category:"left",createdAt:0,lastSeen:0,age:0,mentions:0,rate:0,rateMax:0}),B=Object(d.a)(G,2),H=B[0],K=B[1],z="user"===_?P:H,M=function(e){var t="user"===_?"@"+e:"#"+e;console.log("SEARCH TERM: "+t),ae.emit("TWITTER_SEARCH_NODE",t)},F=Object(s.useCallback)((function(t,a){"user"===_?console.log("handleNodeChange | user: @"+a.screenName):console.log("handleNodeChange | hashtag: #"+a.nodeId),void 0!==t.persist&&t.persist(),void 0!==t.preventDefault&&t.preventDefault();var n,r=t.currentTarget.name||"nop",c=t.currentTarget.value,s=t.currentTarget.checked;if(void 0===t.currentTarget.name&&t.code)switch(t.code){case"ArrowRight":case"ArrowLeft":r="history","ArrrowRight"===t.code&&e.goForward(),"ArrowLeft"===t.code&&e.goBack(),c=e.location.pathname.split("/").pop();break;case"KeyA":r="all";break;case"KeyD":case"KeyL":t.shiftKey?(r="category",c="left"):r="left";break;case"KeyN":t.shiftKey?(r="category",c="neutral"):r="neutral";break;case"KeyR":t.shiftKey?(r="category",c="right"):r="right";break;case"KeyHyphen":t.shiftKey?(r="category",c="negative"):r="negative";break;case"KeyEquals":t.shiftKey?(r="category",c="positive"):r="positive";break;case"KeyI":case"KeyX":t.shiftKey&&(r="ignored",s=!a.ignored);break;case"KeyV":t.shiftKey&&(r="catVerified",s=!a.categoryVerified);break;case"KeyB":t.shiftKey&&(r="isBot",s=!a.isBot)}switch("user"===a.nodeType?(n="@?",console.log("handleNodeChange | @"+a.screenName+" | name: "+r+" | value: "+c)):(n="#?",console.log("handleNodeChange | #"+a.nodeId+" | name: "+r+" | value: "+c)),k((function(e){return r})),r){case"nop":break;case"history":"user"===a.nodeType?(console.log("handleNodeChange | history | @"+a.screenName+" | name: "+r+" | value: "+c),ae.emit("TWITTER_SEARCH_NODE","@"+c)):(console.log("handleNodeChange | history | #"+a.nodeId+" | name: "+r+" | value: "+c),ae.emit("TWITTER_SEARCH_NODE","#"+c));break;case"all":case"left":case"neutral":case"right":case"positive":case"negative":n+=r,ae.emit("TWITTER_SEARCH_NODE",n);break;case"mismatch":"user"===a.nodeType&&ae.emit("TWITTER_SEARCH_NODE","@?mm");break;case"category":ae.emit("TWITTER_CATEGORIZE_NODE",{category:c,following:!0,node:a});break;case"isBot":"user"===a.nodeType&&(s?ae.emit("TWITTER_BOT",a):ae.emit("TWITTER_UNBOT",a));break;case"following":"user"===a.nodeType&&(s?ae.emit("TWITTER_FOLLOW",a):ae.emit("TWITTER_UNFOLLOW",a));break;case"catVerified":"user"===a.nodeType&&(s?ae.emit("TWITTER_CATEGORY_VERIFIED",a):ae.emit("TWITTER_CATEGORY_UNVERIFIED",a));break;case"ignored":s?ae.emit("TWITTER_IGNORE",a):ae.emit("TWITTER_UNIGNORE",a);break;default:console.log("handleNodeChange: UNKNOWN NAME: "+r+" | VALUE: "+c),console.log({event:t})}}),[_,e]),V=function(e){return void 0!==e&&(void 0!==e.nodeId&&void 0!==e.screenName)};Object(s.useEffect)((function(){"user"===_&&(e.location.pathname.endsWith("/user/"+P.screenName)||e.push("/user/"+P.screenName)),"hashtag"===_&&(e.location.pathname.endsWith("/hashtag/"+H.nodeId)||e.push("/hashtag/"+H.nodeId))}),[P,H,_,e]),Object(s.useEffect)((function(){return(ae=b()("https://word.threeceelabs.com/view")).on("connect",(function(){console.log("CONNECTED: "+ae.id),k((function(e){return"authentication"})),ae.emit("authentication",{namespace:"view",userId:"test",password:"0123456789"})})),ae.on("SET_TWITTER_USER",(function(e){console.debug("RX SET_TWITTER_USER"),V(e.node)&&(W((function(t){return e.node})),console.debug("new: @"+e.node.screenName)),k((function(e){return"idle"})),R((function(t){return e.stats}))})),ae.on("SET_TWITTER_HASHTAG",(function(e){console.debug("RX SET_TWITTER_HASHTAG"),V(e.node)&&(K((function(t){return e.node})),console.debug("new: #"+e.node.nodeId)),k((function(e){return"idle"})),R((function(t){return e.stats}))})),ae.on("action",(function(e){switch(console.debug("RX ACTION | socket: "+ae.id+" | TYPE: "+e.type),console.debug("RX ACTION | ",e.data),e.type){case"user":W((function(t){return e.data})),console.log("USER: @"+e.data.screenName+" | "+e.data.profileImageUrl);break;case"hashtag":console.log("HT: #"+e.data.text);break;case"stats":R((function(t){return e.data}))}})),ae.on("authenticated",(function(){k((function(e){return"idle"})),console.debug("AUTHENTICATED | "+ae.id),ae.emit("TWITTER_SEARCH_NODE","@threecee")})),ae.on("USER_AUTHENTICATED",(function(e){k((function(e){return"idle"})),i((function(e){return!0})),u((function(t){return e.screenName})),console.log("RX TWITTER USER_AUTHENTICATED | USER: @"+e.screenName)})),ae.on("TWITTER_USER_NOT_FOUND",(function(e){k((function(e){return"idle"})),console.debug("RX TWITTER_USER_NOT_FOUND"),console.debug(e),R((function(t){return e.stats}))})),function(){return ae.disconnect()}}),[]),Object(g.a)("left",(function(e){return F(e,z)}),{},[z]),Object(g.a)("right",(function(e){return F(e,z)}),{},[z]),Object(g.a)("A",(function(e){return F(e,z)}),{},[z]),Object(g.a)("L",(function(e){return F(e,z)}),{},[z]),Object(g.a)("shift+L",(function(e){return F(e,z)}),{},[z]),Object(g.a)("D",F),Object(g.a)("shift+D",(function(e){return F(e,z)}),{},[z]),Object(g.a)("R",F),Object(g.a)("shift+R",(function(e){return F(e,z)}),{},[z]),Object(g.a)("N",F),Object(g.a)("shift+N",(function(e){return F(e,z)}),{},[z]),Object(g.a)("-",F),Object(g.a)("shift+-",(function(e){return F(e,z)}),{},[z]),Object(g.a)("=",F),Object(g.a)("shift+=",(function(e){return F(e,z)}),{},[z]),Object(g.a)("shift+I",(function(e){return F(e,z)}),{},[z]),Object(g.a)("shift+X",(function(e){return F(e,z)}),{},[z]),Object(g.a)("shift+B",(function(e){return F(e,z)}),{},[z]),Object(g.a)("shift+V",(function(e){return F(e,z)}),{},[z]);var X,Y;return Object(c.jsx)("div",{className:t.root,children:Object(c.jsxs)(O.a,{component:"main",maxWidth:!1,children:[Object(c.jsx)(x.a,{className:t.appBar,position:"static",children:Object(c.jsxs)(T.a,{children:[Object(c.jsx)(w.a,{variant:"h6",className:t.title,children:"Categorizer"}),Object(c.jsx)(f.a,{className:t.buttonNodeType,variant:"contained",color:"primary",size:"small",name:"user",label:"user",onClick:function(){return L("user")},children:"User"}),Object(c.jsx)(f.a,{className:t.buttonNodeType,variant:"contained",color:"primary",size:"small",name:"hashtag",label:"hashtag",onClick:function(){return L("hashtag")},children:"Hashtag"}),"idle"!==E?Object(c.jsx)(p.a,{}):Object(c.jsx)(c.Fragment,{}),Object(c.jsxs)(w.a,{className:t.serverStatus,children:["NN: ",C.bestNetwork.networkId]}),Object(c.jsxs)(w.a,{className:t.serverStatus,children:[C.nodesPerMin," nodes/min (max: ",C.maxNodesPerMin," | time: ",(Y=C.maxNodesPerMinTime,new Date(Y).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"})),")"]}),Object(c.jsx)(N.a,{className:t.twitterAuth,href:"http://twitter.com/"+h,target:"_blank",rel:"noopener",children:h?"@"+h:""}),Object(c.jsx)(f.a,{className:t.buttonLogin,variant:"contained",color:"primary",size:"small",onClick:function(){r?(console.warn("LOGGING OUT"),ae.emit("logout",ne),i(!1),u("")):(console.warn("LOGIN: AUTH: "+r+" | URL: "+$),window.open($,"LOGIN","_new"),ae.emit("login",ne))},name:"login",label:"login",children:r?"LOGOUT":"LOGIN TWITTER"})]})}),(X=_,"user"===X?Object(c.jsx)(q,{user:P,stats:C,handleNodeChange:F,handleSearchNode:M}):Object(c.jsx)(Q,{hashtag:H,stats:C,handleNodeChange:F,handleSearchNode:M}))]})})},se=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,248)).then((function(t){var a=t.getCLS,n=t.getFID,r=t.getFCP,c=t.getLCP,s=t.getTTFB;a(e),n(e),r(e),c(e),s(e)}))};o.a.render(Object(c.jsx)(l.a,{children:Object(c.jsx)(ce,{})}),document.getElementById("root")),se()}},[[202,1,2]]]);
//# sourceMappingURL=main.27987183.chunk.js.map