(this.webpackJsonpcategorizer=this.webpackJsonpcategorizer||[]).push([[0],{131:function(e,t,a){},162:function(e,t,a){},201:function(e,t,a){"use strict";a.r(t);var n,r,s=a(1),c=a(0),i=a(31),o=a.n(i),l=a(68),d=(a(131),a(17)),h=a(25),u=a(10),j=a(11),g=a(100),b=a.n(g),m=a(223),O=a(240),x=a(225),p=a(241),f=a(202),N=a(242),T=a(226),w=a(106),R=(a(162),a(56)),C=a(27),v=a.n(C),I=a(227),y=a(229),E=a(230),k=a(231),A=a(245),S=a(246),L=a(239),_=a(238),D=a(228),G=a(244),U=a(243),z=a(247),B=a(50),W=a.n(B),H=a(233),F=a(237),M=a(236),K=a(232),P=a(234),V=a(235),X=Object(m.a)((function(e){return{root:{flexGrow:2},appBar:{backgroundColor:"white",marginBottom:e.spacing(1)},grid:{display:"flex"},gridItem:{marginRight:e.spacing(1)},card:{raised:!1,maxWidth:400},profileImage:{maxHeight:400,marginBottom:e.spacing(1)},bannerImage:{height:80,marginBottom:e.spacing(1)},radioGroupCategory:{backgroundColor:"#ddeeee",borderRadius:e.shape.borderRadius,padding:e.spacing(1),marginBottom:e.spacing(1)},table:{borderRadius:e.shape.borderRadius},tableHead:{backgroundColor:"#ddeeee"},tableCategorized:{borderRadius:e.shape.borderRadius,borderColor:"red",backgroundColor:"#ddeeee"},tableRowGreen:{backgroundColor:"lightgreen"},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1,color:"blue"},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"#ddeeee"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},left:{backgroundColor:"blue",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},neutral:{backgroundColor:"gray",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},right:{backgroundColor:"red",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},none:{backgroundColor:"white",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"}}})),Y=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},q=function(e){var t=X(),a=Y(e.user.createdAt),n=Y(e.user.lastSeen),r=new v.a(new Date(e.user.lastSeen)).toString(1,4),i=e.user.createdAt?new v.a(new Date(e.user.createdAt)):new v.a(new Date),o=i.toString(1,4),l=i.days>0?Math.ceil(e.user.statusesCount/i.days):0,h=Object(c.useState)(""),u=Object(d.a)(h,2),j=u[0],g=u[1];return Object(s.jsxs)(s.Fragment,{children:[Object(s.jsx)(x.a,{className:t.appBar,position:"static",children:Object(s.jsxs)(T.a,{variant:"dense",children:[Object(s.jsx)(w.a,{variant:"h6",className:t.title,children:"User"}),Object(s.jsx)(w.a,{className:t.buttonGroupLabel,children:"GET UNCAT"}),Object(s.jsxs)(I.a,{color:"primary",size:"small","aria-label":"small button group",children:[Object(s.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.user)},name:"all",children:["ALL: ",e.stats.user.uncategorized.all]}),Object(s.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.user)},name:"left",children:["LEFT: ",e.stats.user.uncategorized.left]}),Object(s.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.user)},name:"neutral",children:["NEUTRAL: ",e.stats.user.uncategorized.neutral]}),Object(s.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.user)},name:"right",children:["RIGHT: ",e.stats.user.uncategorized.right]})]}),Object(s.jsx)(I.a,{color:"primary",size:"small","aria-label":"small button group",children:Object(s.jsxs)(f.a,{className:t.buttonMismatch,color:"primary",size:"small",onClick:function(t){return e.handleNodeChange(t,e.user)},name:"mismatch",children:["MISMATCH ",e.stats.user.mismatched]})}),Object(s.jsxs)("div",{className:t.search,children:[Object(s.jsx)("div",{className:t.searchIcon,children:Object(s.jsx)(W.a,{color:"primary"})}),Object(s.jsx)(G.a,{placeholder:"search\u2026",classes:{root:t.inputRoot,input:t.inputInput},inputProps:{"aria-label":"search"},value:j,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER"),e.handleSearchNode(j))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),g(e.target.value)}})]})]})}),Object(s.jsxs)(D.a,{className:t.grid,children:[Object(s.jsx)(D.a,{item:!0,className:t.gridItem,xs:3,children:Object(s.jsxs)(y.a,{className:t.card,variant:"outlined",children:[Object(s.jsx)(E.a,{onClick:function(){console.log("open twitter"),window.open("http://twitter.com/".concat(e.user.screenName||null),"_blank")},children:Object(s.jsxs)("span",{children:[Object(s.jsxs)(w.a,{className:function(e){switch(e){case"left":case"neutral":case"right":return t[e];default:return t.none}}(e.user.categoryAuto),align:"center",children:["AUTO: ",e.user.categoryAuto.toUpperCase()||"NONE"]}),Object(s.jsx)(w.a,{variant:"h6",children:e.user.name}),Object(s.jsxs)(w.a,{children:["@",e.user.screenName]})]})}),Object(s.jsx)(k.a,{className:t.profileImage,src:e.user.profileImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(s.jsx)(k.a,{className:t.bannerImage,src:e.user.bannerImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(s.jsx)(E.a,{children:Object(s.jsx)(w.a,{children:e.user.description})})]})}),Object(s.jsx)(D.a,{item:!0,className:t.gridItem,xs:2,children:Object(s.jsx)(R.a,{dataSource:{sourceType:"profile",screenName:e.user.screenName},options:{height:"640"}})}),Object(s.jsx)(D.a,{item:!0,className:t.gridItem,xs:2,children:Object(s.jsx)(K.a,{children:Object(s.jsxs)(H.a,{className:t.table,size:"small",children:[Object(s.jsx)(P.a,{children:Object(s.jsxs)(V.a,{className:t.tableHead,children:[Object(s.jsxs)(M.a,{children:["@",e.user.screenName]}),Object(s.jsx)(M.a,{align:"right"})]})}),Object(s.jsxs)(F.a,{children:[Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Twitter ID"}),Object(s.jsx)(M.a,{align:"right",children:e.user.nodeId})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Location"}),Object(s.jsx)(M.a,{align:"right",children:e.user.location})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Created"}),Object(s.jsx)(M.a,{align:"right",children:a})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Twitter age"}),Object(s.jsx)(M.a,{align:"right",children:o})]}),Object(s.jsxs)(V.a,{className:e.user.followersCount>5e3?t.tableRowGreen:null,children:[Object(s.jsx)(M.a,{children:"Followers"}),Object(s.jsx)(M.a,{align:"right",children:e.user.followersCount})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Friends"}),Object(s.jsx)(M.a,{align:"right",children:e.user.friendsCount})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Tweets"}),Object(s.jsx)(M.a,{align:"right",children:e.user.statusesCount})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Tweets/day"}),Object(s.jsx)(M.a,{align:"right",children:l})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Last Active"}),Object(s.jsxs)(M.a,{align:"right",children:[n," (",r," ago)"]})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Mentions"}),Object(s.jsx)(M.a,{align:"right",children:e.user.mentions})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"Mentions/hour"}),Object(s.jsx)(M.a,{align:"right",children:e.user.rate?60*e.user.rate.toFixed(2):0})]})]})]})})}),Object(s.jsx)(D.a,{item:!0,className:t.gridItem,xs:2,children:Object(s.jsx)(K.a,{children:Object(s.jsxs)(H.a,{size:"small",children:[Object(s.jsxs)(P.a,{children:[Object(s.jsx)(V.a,{className:t.tableHead,children:Object(s.jsx)(M.a,{colSpan:3,children:"ALL USERS"})}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"CAT"}),Object(s.jsx)(M.a,{align:"right",children:"MAN"}),Object(s.jsx)(M.a,{align:"right",children:"AUTO"})]})]}),Object(s.jsxs)(F.a,{children:[Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"left"}),Object(s.jsx)(M.a,{align:"right",children:e.stats.user.manual.left}),Object(s.jsx)(M.a,{align:"right",children:e.stats.user.auto.left})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"neutral"}),Object(s.jsx)(M.a,{align:"right",children:e.stats.user.manual.neutral}),Object(s.jsx)(M.a,{align:"right",children:e.stats.user.auto.neutral})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"right"}),Object(s.jsx)(M.a,{align:"right",children:e.stats.user.manual.right}),Object(s.jsx)(M.a,{align:"right",children:e.stats.user.auto.right})]})]})]})})}),Object(s.jsx)(D.a,{item:!0,className:t.gridItem,xs:1,children:Object(s.jsxs)(_.a,{children:[Object(s.jsx)(S.a,{component:"fieldset",size:"small",children:Object(s.jsxs)(z.a,{className:t.radioGroupCategory,"aria-label":"category",name:"category",value:e.user.category||"none",onChange:function(t){return e.handleNodeChange(t,e.user)},children:[Object(s.jsx)(L.a,{value:"left",control:Object(s.jsx)(U.a,{size:"small"}),label:"LEFT"}),Object(s.jsx)(L.a,{value:"neutral",control:Object(s.jsx)(U.a,{size:"small"}),label:"NEUTRAL"}),Object(s.jsx)(L.a,{value:"right",control:Object(s.jsx)(U.a,{size:"small"}),label:"RIGHT"}),Object(s.jsx)(L.a,{value:"positive",control:Object(s.jsx)(U.a,{size:"small"}),label:"POSITIVE"}),Object(s.jsx)(L.a,{value:"negative",control:Object(s.jsx)(U.a,{size:"small"}),label:"NEGATIVE"}),Object(s.jsx)(L.a,{value:"none",control:Object(s.jsx)(U.a,{size:"small"}),label:"NONE"})]})}),Object(s.jsxs)(S.a,{component:"fieldset",className:t.radioGroupCategory,size:"small",children:[Object(s.jsx)(L.a,{control:Object(s.jsx)(A.a,{size:"small",checked:e.user.categoryVerified||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"catVerified"}),label:"VERIFIED"}),Object(s.jsx)(L.a,{control:Object(s.jsx)(A.a,{size:"small",checked:e.user.following||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"following"}),label:"FOLLOWING"}),Object(s.jsx)(L.a,{control:Object(s.jsx)(A.a,{size:"small",checked:e.user.ignored||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"ignored"}),label:"IGNORED"}),Object(s.jsx)(L.a,{control:Object(s.jsx)(A.a,{size:"small",checked:e.user.isBot||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"isBot"}),label:"BOT"})]})]})})]})]})},J=Object(m.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:400},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{flexGrow:1,color:"blue"},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},left:{backgroundColor:"blue",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},neutral:{backgroundColor:"gray",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},right:{backgroundColor:"red",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},none:{backgroundColor:"white",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"}}})),Z=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},Q=function(e){var t,a=J(),n=Z(e.hashtag.createdAt),r=Z(e.hashtag.lastSeen),i=new v.a(new Date(e.hashtag.lastSeen)).toString(1,4),o=(e.hashtag.createdAt?new v.a(new Date(e.hashtag.createdAt)):new v.a(new Date)).toString(1,4),l=Object(c.useState)(""),h=Object(d.a)(l,2),u=h[0],j=h[1];return Object(s.jsxs)(s.Fragment,{children:[Object(s.jsx)(x.a,{className:a.appBar,position:"static",children:Object(s.jsxs)(T.a,{variant:"dense",children:[Object(s.jsx)(w.a,{variant:"h6",className:a.title,children:"Hashtag"}),Object(s.jsx)(w.a,{className:a.buttonGroupLabel,children:"UNCAT"}),Object(s.jsx)(I.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:Object(s.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.hashtag)},name:"all",children:["ALL: ",e.stats.hashtag.uncategorized.all]})}),Object(s.jsxs)("div",{className:a.search,children:[Object(s.jsx)("div",{className:a.searchIcon,children:Object(s.jsx)(W.a,{color:"primary"})}),Object(s.jsx)(G.a,{placeholder:"search\u2026",classes:{root:a.inputRoot,input:a.inputInput},inputProps:{"aria-label":"search"},value:u,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER: hashtagSearch: "+u),e.handleSearchNode(u))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),j(e.target.value)}})]})]})}),Object(s.jsxs)(D.a,{className:a.grid,children:[Object(s.jsx)(D.a,{item:!0,className:a.gridItem,xs:3,children:Object(s.jsx)(y.a,{className:a.card,variant:"outlined",children:Object(s.jsx)(E.a,{onClick:function(){console.log("open twitter"),window.open("https://twitter.com/search?f=tweets&q=%23".concat(e.hashtag.nodeId||null),"_blank")},children:Object(s.jsxs)(w.a,{variant:"h6",children:["#",e.hashtag.nodeId]})})})}),Object(s.jsx)(D.a,{item:!0,className:a.gridItem,xs:3,children:(t=e.tweets,void 0===t.statuses?Object(s.jsx)(s.Fragment,{}):t.statuses.map((function(e){return Object(s.jsx)(R.b,{tweetId:e.id_str,options:{width:"400"}},e.id_str)})))}),Object(s.jsx)(D.a,{item:!0,className:a.gridItem,xs:3,children:Object(s.jsx)(K.a,{children:Object(s.jsx)(H.a,{className:a.table,size:"small",children:Object(s.jsxs)(F.a,{children:[Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"id"}),Object(s.jsx)(M.a,{align:"right",children:e.hashtag.nodeId})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"created"}),Object(s.jsx)(M.a,{align:"right",children:n})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"twitter age"}),Object(s.jsx)(M.a,{align:"right",children:o})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"last seen"}),Object(s.jsx)(M.a,{align:"right",children:r})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"last seen"}),Object(s.jsxs)(M.a,{align:"right",children:[i," ago"]})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"mentions"}),Object(s.jsx)(M.a,{align:"right",children:e.hashtag.mentions})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"mentions/min"}),Object(s.jsx)(M.a,{align:"right",children:e.hashtag.rate?e.hashtag.rate.toFixed(1):0})]})]})})})}),Object(s.jsx)(D.a,{item:!0,className:a.gridItem,xs:2,children:Object(s.jsx)(K.a,{children:Object(s.jsxs)(H.a,{className:a.table,size:"small",children:[Object(s.jsx)(P.a,{children:Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"CAT"}),Object(s.jsx)(M.a,{align:"left",children:"MAN"})]})}),Object(s.jsxs)(F.a,{children:[Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"left"}),Object(s.jsx)(M.a,{align:"right",children:e.stats.hashtag.manual.left})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"neutral"}),Object(s.jsx)(M.a,{align:"right",children:e.stats.hashtag.manual.neutral})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"right"}),Object(s.jsx)(M.a,{align:"right",children:e.stats.hashtag.manual.right})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"positive"}),Object(s.jsx)(M.a,{align:"right",children:e.stats.hashtag.manual.positive})]}),Object(s.jsxs)(V.a,{children:[Object(s.jsx)(M.a,{children:"negative"}),Object(s.jsx)(M.a,{align:"right",children:e.stats.hashtag.manual.negative})]})]})]})})}),Object(s.jsx)(D.a,{item:!0,className:a.gridItem,xs:1,children:Object(s.jsxs)(_.a,{children:[Object(s.jsx)(S.a,{component:"fieldset",children:Object(s.jsxs)(z.a,{"aria-label":"category",name:"category",value:e.hashtag.category||"none",onChange:function(t){return e.handleNodeChange(t,e.hashtag)},children:[Object(s.jsx)(L.a,{labelPlacement:"start",value:"left",control:Object(s.jsx)(U.a,{}),label:"left"}),Object(s.jsx)(L.a,{labelPlacement:"start",value:"neutral",control:Object(s.jsx)(U.a,{}),label:"neutral"}),Object(s.jsx)(L.a,{labelPlacement:"start",value:"right",control:Object(s.jsx)(U.a,{}),label:"right"}),Object(s.jsx)(L.a,{labelPlacement:"start",value:"positive",control:Object(s.jsx)(U.a,{}),label:"positive"}),Object(s.jsx)(L.a,{labelPlacement:"start",value:"negative",control:Object(s.jsx)(U.a,{}),label:"negative"}),Object(s.jsx)(L.a,{labelPlacement:"start",value:"none",control:Object(s.jsx)(U.a,{}),label:"none"})]})}),Object(s.jsx)(L.a,{control:Object(s.jsx)(A.a,{checked:e.hashtag.ignored||!1,onChange:function(t){return e.handleNodeChange(t,e.hashtag)},name:"ignored"}),label:"ignored",labelPlacement:"start"})]})})]})]})},$="http://word.threeceelabs.com/auth/twitter",ee="viewer_"+(n=1e9,r=9999999999,Math.floor(Math.random()*(r-n+1)+n)),te={nodeId:ee,userId:ee,viewerId:ee,screenName:ee,type:"viewer",namespace:"view",timeStamp:Date.now(),tags:{}};te.tags.type="viewer",te.tags.mode="stream",te.tags.entity=ee;var ae,ne=te;console.log({viewerObj:ne});var re=Object(m.a)((function(e){return{root:{flexGrow:1},appBar:{backgroundColor:"white",marginBottom:e.spacing(2)},toolBar:{backgroundColor:"white"},buttonNodeType:{flexGrow:1},title:{color:"blue",marginRight:e.spacing(2)},serverStatus:{color:"gray",padding:e.spacing(1)},twitterAuth:{color:"green",padding:e.spacing(1),marginRight:e.spacing(2)},buttonLogin:{marginRight:e.spacing(2)},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},search:Object(h.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(h.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"})}})),se=function(){var e=Object(u.d)(),t=re(),a=Object(c.useState)(!1),n=Object(d.a)(a,2),r=n[0],i=n[1],o=Object(c.useState)(""),l=Object(d.a)(o,2),h=l[0],g=l[1],m=Object(c.useState)({nodesPerMin:0,maxNodesPerMin:0,maxNodesPerMinTime:0,bestNetwork:{networkId:""},user:{uncategorized:{left:0,neutral:0,right:0,positive:0,negative:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0,positive:0,negative:0},auto:{left:0,neutral:0,right:0,positive:0,negative:0}},hashtag:{uncategorized:{left:0,neutral:0,right:0,positive:0,negative:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0,positive:0,negative:0},auto:{left:0,neutral:0,right:0,positive:0,negative:0}}}),R=Object(d.a)(m,2),C=R[0],v=R[1],y=Object(c.useState)({search_metadata:{},statuses:[]}),E=Object(d.a)(y,2),k=E[0],A=E[1],S=Object(c.useState)("loading"),L=Object(d.a)(S,2),_=L[0],D=L[1],G=Object(c.useState)("user"),U=Object(d.a)(G,2),z=U[0],B=U[1],W=Object(c.useState)({nodeId:null,screenName:"threecee",name:"",location:"",description:"",profileImageUrl:"https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",bannerImage:"",createdAt:null,followersCount:0,friendsCount:0,tweets:0,age:0,mentions:0,rate:0,rateMax:0,tweetsPerDay:0,lastSeen:null,isBot:!1,following:!1,categoryVerfied:!1,category:"none",categoryAuto:"none"}),H=Object(d.a)(W,2),F=H[0],M=H[1],K=Object(c.useState)({nodeId:"blacklivesmatter",text:"BlackLivesMatter",categoryAuto:"none",category:"left",createdAt:0,lastSeen:0,age:0,mentions:0,rate:0,rateMax:0}),P=Object(d.a)(K,2),V=P[0],X=P[1],Y="user"===z?F:V,J=function(e){D((function(e){return"searchNode"}));var t="user"===z?"@"+e:"#"+e;console.log("SEARCH TERM: "+t),ae.emit("TWITTER_SEARCH_NODE",t)},Z=Object(c.useCallback)((function(t,a){"user"===z?console.log("handleNodeChange | user: @"+a.screenName):console.log("handleNodeChange | hashtag: #"+a.nodeId),void 0!==t.persist&&t.persist(),void 0!==t.preventDefault&&t.preventDefault();var n,r=t.currentTarget.name||"nop",s=t.currentTarget.value,c=t.currentTarget.checked;if(void 0===t.currentTarget.name&&t.code)switch(t.code){case"ArrowRight":case"ArrowLeft":r="history","ArrrowRight"===t.code&&e.goForward(),"ArrowLeft"===t.code&&e.goBack(),s=e.location.pathname.split("/").pop();break;case"KeyA":r="all";break;case"KeyD":case"KeyL":t.shiftKey?(r="category",s="left"):r="left";break;case"KeyN":t.shiftKey?(r="category",s="neutral"):r="neutral";break;case"KeyR":t.shiftKey?(r="category",s="right"):r="right";break;case"KeyHyphen":t.shiftKey?(r="category",s="negative"):r="negative";break;case"KeyEquals":t.shiftKey?(r="category",s="positive"):r="positive";break;case"KeyI":case"KeyX":t.shiftKey&&(r="ignored",c=!a.ignored);break;case"KeyV":t.shiftKey&&(r="catVerified",c=!a.categoryVerified);break;case"KeyB":t.shiftKey&&(r="isBot",c=!a.isBot)}switch("user"===a.nodeType?(n="@?",console.log("handleNodeChange | @"+a.screenName+" | name: "+r+" | value: "+s)):(n="#?",console.log("handleNodeChange | #"+a.nodeId+" | name: "+r+" | value: "+s)),D((function(e){return r})),r){case"nop":break;case"history":"user"===a.nodeType?(console.log("handleNodeChange | history | @"+a.screenName+" | name: "+r+" | value: "+s),ae.emit("TWITTER_SEARCH_NODE","@"+s)):(console.log("handleNodeChange | history | #"+a.nodeId+" | name: "+r+" | value: "+s),ae.emit("TWITTER_SEARCH_NODE","#"+s));break;case"all":case"left":case"neutral":case"right":case"positive":case"negative":n+=r,ae.emit("TWITTER_SEARCH_NODE",n);break;case"mismatch":"user"===a.nodeType&&ae.emit("TWITTER_SEARCH_NODE","@?mm");break;case"category":ae.emit("TWITTER_CATEGORIZE_NODE",{category:s,following:!0,node:a});break;case"isBot":"user"===a.nodeType&&(c?ae.emit("TWITTER_BOT",a):ae.emit("TWITTER_UNBOT",a));break;case"following":"user"===a.nodeType&&(c?ae.emit("TWITTER_FOLLOW",a):ae.emit("TWITTER_UNFOLLOW",a));break;case"catVerified":"user"===a.nodeType&&(c?ae.emit("TWITTER_CATEGORY_VERIFIED",a):ae.emit("TWITTER_CATEGORY_UNVERIFIED",a));break;case"ignored":c?ae.emit("TWITTER_IGNORE",a):ae.emit("TWITTER_UNIGNORE",a);break;default:console.log("handleNodeChange: UNKNOWN NAME: "+r+" | VALUE: "+s),console.log({event:t})}}),[z,e]),ee=function(e){return void 0!==e&&(void 0!==e.nodeId&&("user"!==e.nodeType||void 0!==e.screenName))};Object(c.useEffect)((function(){"user"===z&&(e.location.pathname.endsWith("/user/"+F.screenName)||e.push("/user/"+F.screenName)),"hashtag"===z&&(e.location.pathname.endsWith("/hashtag/"+V.nodeId)||e.push("/hashtag/"+V.nodeId))}),[F,V,z,e]),Object(c.useEffect)((function(){return(ae=b()("https://word.threeceelabs.com/view")).on("connect",(function(){console.log("CONNECTED: "+ae.id),D((function(e){return"authentication"})),ae.emit("authentication",{namespace:"view",userId:"test",password:"0123456789"})})),ae.on("SET_TWITTER_USER",(function(e){console.debug("RX SET_TWITTER_USER"),ee(e.node)&&(M((function(t){return e.node})),console.debug("new: @"+e.node.screenName)),D((function(e){return"idle"})),v((function(t){return e.stats}))})),ae.on("SET_TWITTER_HASHTAG",(function(e){console.debug("RX SET_TWITTER_HASHTAG"),ee(e.node)&&(X((function(t){return e.node})),console.debug("new: #"+e.node.nodeId),A((function(t){return e.tweets}))),D((function(e){return"idle"})),v((function(t){return e.stats}))})),ae.on("action",(function(e){switch(console.debug("RX ACTION | socket: "+ae.id+" | TYPE: "+e.type),console.debug("RX ACTION | ",e.data),e.type){case"user":M((function(t){return e.data})),console.log("USER: @"+e.data.screenName+" | "+e.data.profileImageUrl);break;case"hashtag":console.log("HT: #"+e.data.text);break;case"stats":v((function(t){return e.data}))}})),ae.on("authenticated",(function(){D((function(e){return"idle"})),console.debug("AUTHENTICATED | "+ae.id),ae.emit("TWITTER_SEARCH_NODE","@threecee")})),ae.on("USER_AUTHENTICATED",(function(e){D((function(e){return"idle"})),i((function(e){return!0})),g((function(t){return e.screenName})),console.log("RX TWITTER USER_AUTHENTICATED | USER: @"+e.screenName)})),ae.on("TWITTER_USER_NOT_FOUND",(function(e){D((function(e){return"idle"})),console.debug("RX TWITTER_USER_NOT_FOUND"),console.debug(e),v((function(t){return e.stats}))})),D("idle"),function(){return ae.disconnect()}}),[]),Object(j.a)("left",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("right",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("A",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("L",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+L",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("D",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+D",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("R",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+R",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("N",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+N",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("-",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+-",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("=",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+=",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+I",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+X",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+B",(function(e){return Z(e,Y)}),{},[Y]),Object(j.a)("shift+V",(function(e){return Z(e,Y)}),{},[Y]);var te,se;return Object(s.jsx)("div",{className:t.root,children:Object(s.jsxs)(O.a,{component:"main",maxWidth:!1,children:[Object(s.jsx)(x.a,{className:t.appBar,position:"static",children:Object(s.jsxs)(T.a,{className:t.toolBar,children:[Object(s.jsx)(w.a,{variant:"h6",className:t.title,children:"Categorizer"}),Object(s.jsxs)(I.a,{className:t.buttonNodeType,children:[Object(s.jsx)(f.a,{variant:"contained",color:"primary",size:"small",name:"user",label:"user",onClick:function(){return B("user")},children:"User"}),Object(s.jsx)(f.a,{variant:"contained",color:"primary",size:"small",name:"hashtag",label:"hashtag",onClick:function(){return B("hashtag")},children:"Hashtag"})]}),"idle"!==_?Object(s.jsx)(p.a,{children:_}):Object(s.jsx)(s.Fragment,{}),Object(s.jsxs)(w.a,{className:t.serverStatus,children:["NN: ",C.bestNetwork.networkId]}),Object(s.jsxs)(w.a,{className:t.serverStatus,children:[C.nodesPerMin," nodes/min (max: ",C.maxNodesPerMin," | time: ",(se=C.maxNodesPerMinTime,new Date(se).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"})),")"]}),Object(s.jsx)(N.a,{className:t.twitterAuth,href:"http://twitter.com/"+h,target:"_blank",rel:"noopener",children:h?"@"+h:""}),Object(s.jsx)(f.a,{className:t.buttonLogin,variant:"contained",color:"primary",size:"small",onClick:function(){D((function(e){return"loginLogout"})),r?(console.warn("LOGGING OUT"),ae.emit("logout",ne),i(!1),g("")):(console.warn("LOGIN: AUTH: "+r+" | URL: "+$),window.open($,"LOGIN","_new"),ae.emit("login",ne))},name:"login",label:"login",children:r?"LOGOUT":"LOGIN TWITTER"})]})}),(te=z,"user"===te?Object(s.jsx)(q,{user:F,stats:C,handleNodeChange:Z,handleSearchNode:J}):Object(s.jsx)(Q,{hashtag:V,stats:C,tweets:k,handleNodeChange:Z,handleSearchNode:J}))]})})},ce=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,249)).then((function(t){var a=t.getCLS,n=t.getFID,r=t.getFCP,s=t.getLCP,c=t.getTTFB;a(e),n(e),r(e),s(e),c(e)}))};o.a.render(Object(s.jsx)(l.a,{children:Object(s.jsx)(se,{})}),document.getElementById("root")),ce()}},[[201,1,2]]]);
//# sourceMappingURL=main.3d5b27e1.chunk.js.map