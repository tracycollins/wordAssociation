(this.webpackJsonpcategorizer=this.webpackJsonpcategorizer||[]).push([[0],{148:function(e,t,a){},179:function(e,t,a){},218:function(e,t,a){"use strict";a.r(t);var n,r,c=a(2),s=a(0),i=a(12),o=a.n(i),l=a(88),d=a(13),u=(a(148),a(119)),h=a(37),g=a(16),b=a(32),j=a(15),O=a(120),m=a.n(O),f=a(268),p=a(283),x=a(280),T=a(285),N=a(219),R=a(291),E=a(286),w=a(75),v=a.n(w),I=a(288),C=a(284),y=a(281),S=a(126),k=(a(179),a(79)),A=a(4),_=a(77),L=a(43),U=a.n(L),D=a(270),W=a(271),B=a(272),G=a(290),H=a(278),z=a(279),F=a(277),K=a(269),M=a(292),P=a(293),V=a(287),X=a(274),Y=a(276),q=a(266),J=a(273),Z=a(275),$=a(267),Q=a(5),ee=Object(Q.a)((function(e){return{head:{},body:{fontSize:11}}}))(q.a),te=Object(Q.a)((function(e){return{root:{}}}))($.a),ae=Object(f.a)((function(e){return{root:{flexGrow:2},appBar:{backgroundColor:"white",marginBottom:e.spacing(1)},grid:{display:"flex",alignItems:"stretch"},gridItem:{margin:e.spacing(1)},card:{alignSelf:"center"},profileImage:{marginBottom:e.spacing(1)},bannerImage:{marginBottom:e.spacing(1)},icon:{borderRadius:"50%",width:16,height:16,boxShadow:"inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)",backgroundColor:"#f5f8fa",backgroundImage:"linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))","$root.Mui-focusVisible &":{outline:"2px auto rgba(19,124,189,.6)",outlineOffset:2},"input:hover ~ &":{backgroundColor:"#ebf1f5"},"input:disabled ~ &":{boxShadow:"none",background:"rgba(206,217,224,.5)"}},checkedIcon:{backgroundColor:"#137cbd",backgroundImage:"linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))","&:before":{display:"block",width:16,height:16,backgroundImage:"radial-gradient(#fff,#fff 28%,transparent 32%)",content:'""'},"input:hover ~ &":{backgroundColor:"#106ba3"}},selectCategory:{fontSize:"0.5rem",backgroundColor:"#ddeeee",borderRadius:e.shape.borderRadius,padding:e.spacing(1),marginBottom:e.spacing(1)},radioGroupCategory:{fontSize:"0.5rem",backgroundColor:"#ddeeee",borderRadius:e.shape.borderRadius,padding:e.spacing(2),marginBottom:e.spacing(1)},checkbox:{color:k.a[400],"&$checked":{color:k.a[600]}},checked:{},radioButtonLabel:{fontSize:"0.9rem"},radioButton:{},table:{borderRadius:e.shape.borderRadius},tableHead:{backgroundColor:"#ddeeee"},tableCell:{},tableCategorized:{borderRadius:e.shape.borderRadius,backgroundColor:"#ddeeee"},tableRowGreen:{backgroundColor:"lightgreen"},statusBar:{raised:!1,backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{color:"blue"},search:Object(b.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"#ddeeee"},marginRight:e.spacing(1),width:"100%"},e.breakpoints.up("sm"),{width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(b.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},category:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),marginBottom:e.spacing(1)},left:{backgroundColor:"blue",color:"white"},neutral:{backgroundColor:"darkgray",color:"white"},right:{backgroundColor:"red",color:"white"},positive:{backgroundColor:"green",color:"white"},negative:{backgroundColor:"yellow",color:"black"},none:{backgroundColor:"lightgray",color:"black"},ignored:{backgroundColor:"yellow",color:"black"}}})),ne=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},re=function(e){var t=ae(),a=ne(e.user.createdAt),n=ne(e.user.lastSeen),r=new U.a(new Date(e.user.lastSeen)).toString(1,4),s=e.user.createdAt?new U.a(new Date(e.user.createdAt)):new U.a(new Date),i=s.toString(1,4),o=s.days>0?Math.ceil(e.user.statusesCount/s.days):0,l=function(e){switch(e){case"left":case"neutral":case"right":case"positive":case"negative":case"ignored":return t[e];default:return t.none}};return Object(c.jsx)(c.Fragment,{children:Object(c.jsxs)(K.a,{className:t.grid,children:[Object(c.jsx)(K.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsxs)(D.a,{className:t.card,variant:"outlined",children:[Object(c.jsxs)(W.a,{onClick:function(){console.log("open twitter"),window.open("http://twitter.com/".concat(e.user.screenName||null),"_blank")},children:[Object(c.jsx)(S.a,{className:Object(A.a)(t.category,e.user.ignored?l("ignored"):l(e.user.category)),variant:"h6",children:e.user.name}),Object(c.jsxs)(S.a,{variant:"h6",children:["@",e.user.screenName," "]})]}),Object(c.jsx)(W.a,{children:Object(c.jsx)(S.a,{children:e.user.description})}),Object(c.jsx)(B.a,{className:t.profileImage,src:e.user.profileImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(c.jsx)(B.a,{className:t.bannerImage,src:e.user.bannerImageUrl||"logo192.png",component:"img",onError:function(e){}})]})}),Object(c.jsx)(K.a,{item:!0,className:t.gridItem,xs:3,children:Object(c.jsx)(_.a,{dataSource:{sourceType:"profile",screenName:e.user.screenName},options:{width:"100%",height:"800"}})}),Object(c.jsx)(K.a,{item:!0,className:t.gridItem,xs:2,children:Object(c.jsx)(J.a,{children:Object(c.jsxs)(X.a,{className:t.table,size:"small",children:[Object(c.jsx)(Z.a,{children:Object(c.jsxs)(te,{className:t.tableHead,children:[Object(c.jsxs)(ee,{children:["@",e.user.screenName]}),Object(c.jsx)(ee,{align:"right"})]})}),Object(c.jsxs)(Y.a,{children:[Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Twitter ID"}),Object(c.jsx)(ee,{align:"right",children:e.user.nodeId})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Location"}),Object(c.jsx)(ee,{align:"right",children:e.user.location})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Created"}),Object(c.jsx)(ee,{align:"right",children:a})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Twitter age"}),Object(c.jsx)(ee,{align:"right",children:i})]}),Object(c.jsxs)(te,{className:e.user.followersCount>5e3?t.tableRowGreen:null,children:[Object(c.jsx)(ee,{children:"Followers"}),Object(c.jsx)(ee,{align:"right",children:e.user.followersCount})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Friends"}),Object(c.jsx)(ee,{align:"right",children:e.user.friendsCount})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Tweets"}),Object(c.jsx)(ee,{align:"right",children:e.user.statusesCount})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Tweets/day"}),Object(c.jsx)(ee,{align:"right",children:o})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Active"}),Object(c.jsxs)(ee,{align:"right",children:[n," (",r," ago)"]})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Mentions"}),Object(c.jsx)(ee,{align:"right",children:e.user.mentions})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"Mentions/hour"}),Object(c.jsx)(ee,{align:"right",children:e.user.rate?60*e.user.rate.toFixed(2):0})]})]})]})})}),Object(c.jsx)(K.a,{item:!0,className:t.gridItem,xs:2,children:Object(c.jsx)(J.a,{children:Object(c.jsxs)(X.a,{size:"small",children:[Object(c.jsxs)(Z.a,{children:[Object(c.jsx)(te,{className:t.tableHead,children:Object(c.jsx)(ee,{colSpan:3,children:"ALL USERS"})}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"CAT"}),Object(c.jsx)(ee,{align:"right",children:"MAN"}),Object(c.jsx)(ee,{align:"right",children:"AUTO"})]})]}),Object(c.jsxs)(Y.a,{children:[Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"LEFT"}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.manual.left}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.auto.left})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"RIGHT"}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.manual.right}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.auto.right})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"NEUTRAL"}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.manual.neutral}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.auto.neutral})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"POSITIVE"}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.manual.positive}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.auto.positive})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"NEGATIVE"}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.manual.negative}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.auto.negative})]}),Object(c.jsxs)(te,{children:[Object(c.jsx)(ee,{children:"NONE"}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.manual.none}),Object(c.jsx)(ee,{align:"right",children:e.stats.user.auto.none})]})]})]})})}),Object(c.jsx)(K.a,{item:!0,className:t.gridItem,xs:1,children:Object(c.jsxs)(F.a,{children:[Object(c.jsxs)(H.a,{children:[Object(c.jsx)(M.a,{id:"category-manual",children:"CATEGORY"}),Object(c.jsxs)(V.a,{labelId:"category-manual-label",id:"category-manual",name:"category",className:Object(A.a)(t.category,l(e.user.category)),align:"center",value:e.user.category||"none",onChange:function(t){return e.handleNodeChange(t,e.user)},children:[Object(c.jsx)(P.a,{dense:!0,value:"none",children:"NONE"}),Object(c.jsx)(P.a,{dense:!0,value:"left",children:"LEFT"}),Object(c.jsx)(P.a,{dense:!0,value:"neutral",children:"NEUTRAL"}),Object(c.jsx)(P.a,{dense:!0,value:"right",children:"RIGHT"}),Object(c.jsx)(P.a,{dense:!0,value:"positive",children:"POSITIVE"}),Object(c.jsx)(P.a,{dense:!0,value:"negative",children:"NEGATIVE"})]})]}),Object(c.jsxs)(S.a,{className:Object(A.a)(t.autoCategory,l(e.user.categoryAuto)),align:"center",children:["AUTO: ",e.user.categoryAuto?e.user.categoryAuto.toUpperCase():"NONE"]}),Object(c.jsxs)(H.a,{component:"fieldset",className:t.radioGroupCategory,size:"small",children:[Object(c.jsx)(z.a,{control:Object(c.jsx)(G.a,{className:t.checkbox,size:"small",checked:e.user.following||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"following"}),label:Object(c.jsx)(S.a,{className:t.radioButtonLabel,children:"FOLLOWING"})}),Object(c.jsx)(z.a,{control:Object(c.jsx)(G.a,{className:t.checkbox,size:"small",checked:e.user.categoryVerified||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"catVerified"}),label:Object(c.jsx)(S.a,{className:t.radioButtonLabel,children:"VERIFIED"})}),Object(c.jsx)(z.a,{control:Object(c.jsx)(G.a,{className:t.checkbox,size:"small",checked:e.user.ignored||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"ignored"}),label:Object(c.jsx)(S.a,{className:t.radioButtonLabel,children:"IGNORED"})}),Object(c.jsx)(z.a,{control:Object(c.jsx)(G.a,{className:t.checkbox,size:"small",checked:e.user.isBot||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"isBot"}),label:Object(c.jsx)(S.a,{className:t.radioButtonLabel,children:"BOT"})})]})]})})]})})},ce=a(282),se=a(289),ie=a(294),oe=Object(f.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:400},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{color:"blue"},search:Object(b.a)({flexGrow:1,position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(b.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},left:{backgroundColor:"blue",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},neutral:{backgroundColor:"gray",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},right:{backgroundColor:"red",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},none:{backgroundColor:"white",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"}}})),le=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},de=function(e){var t,a=oe(),n=e.hashtag.createdAt?le(e.hashtag.createdAt):"---",r=e.hashtag.lastSeen?le(e.hashtag.lastSeen):"---",i=e.hashtag.lastSeen?new U.a(new Date(e.hashtag.lastSeen)).toString(1,4):"---",o=e.hashtag.createdAt?new U.a(new Date(e.hashtag.createdAt)):"---",l=e.hashtag.createdAt?o.toString(1,4):"---",d=Object(s.useState)(""),u=Object(g.a)(d,2),h=u[0],b=u[1];return Object(c.jsxs)(c.Fragment,{children:[Object(c.jsx)(x.a,{className:a.appBar,position:"static",children:Object(c.jsxs)(y.a,{variant:"dense",children:[Object(c.jsxs)("div",{className:a.search,children:[Object(c.jsx)("div",{className:a.searchIcon,children:Object(c.jsx)(v.a,{color:"primary"})}),Object(c.jsx)(R.a,{placeholder:"search\u2026",classes:{root:a.inputRoot,input:a.inputInput},inputProps:{"aria-label":"search"},value:h,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER: hashtagSearch: "+h),e.handleSearchNode(h))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),b(e.target.value)}})]}),Object(c.jsx)(S.a,{className:a.buttonGroupLabel,children:"UNCAT"}),Object(c.jsx)(ce.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:Object(c.jsxs)(N.a,{onClick:function(t){return e.handleNodeChange(t,e.hashtag)},name:"all",children:["ALL: ",e.stats.hashtag.uncategorized.all]})})]})}),Object(c.jsxs)(K.a,{className:a.grid,children:[Object(c.jsx)(K.a,{item:!0,className:a.gridItem,xs:3,children:Object(c.jsx)(D.a,{className:a.card,variant:"outlined",children:Object(c.jsx)(W.a,{onClick:function(){console.log("open twitter"),window.open("https://twitter.com/search?f=tweets&q=%23".concat(e.hashtag.nodeId||null),"_blank")},children:Object(c.jsxs)(S.a,{variant:"h6",children:["#","notFound"===e.statusHashtag?e.hashtag.nodeId+" NOT FOUND":e.hashtag.nodeId]})})})}),Object(c.jsx)(K.a,{item:!0,className:a.gridItem,xs:3,children:(t=e.tweets,t&&void 0!==t&&void 0!==t.statuses?t.statuses.map((function(e){return Object(c.jsx)(_.b,{tweetId:e.id_str,options:{width:"400"}},e.id_str)})):Object(c.jsx)(c.Fragment,{}))}),Object(c.jsx)(K.a,{item:!0,className:a.gridItem,xs:3,children:Object(c.jsx)(J.a,{children:Object(c.jsx)(X.a,{className:a.table,size:"small",children:Object(c.jsxs)(Y.a,{children:[Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"id"}),Object(c.jsx)(q.a,{align:"right",children:e.hashtag.nodeId})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"created"}),Object(c.jsx)(q.a,{align:"right",children:n})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"twitter age"}),Object(c.jsx)(q.a,{align:"right",children:l})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"last seen"}),Object(c.jsx)(q.a,{align:"right",children:r})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"last seen"}),Object(c.jsxs)(q.a,{align:"right",children:[i," ago"]})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"mentions"}),Object(c.jsx)(q.a,{align:"right",children:e.hashtag.mentions?e.hashtag.mentions:"---"})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"mentions/min"}),Object(c.jsx)(q.a,{align:"right",children:e.hashtag.rate?e.hashtag.rate.toFixed(1):"---"})]})]})})})}),Object(c.jsx)(K.a,{item:!0,className:a.gridItem,xs:2,children:Object(c.jsx)(J.a,{children:Object(c.jsxs)(X.a,{className:a.table,size:"small",children:[Object(c.jsx)(Z.a,{children:Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"CAT"}),Object(c.jsx)(q.a,{align:"left",children:"MAN"})]})}),Object(c.jsxs)(Y.a,{children:[Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"left"}),Object(c.jsx)(q.a,{align:"right",children:e.stats.hashtag.manual.left})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"neutral"}),Object(c.jsx)(q.a,{align:"right",children:e.stats.hashtag.manual.neutral})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"right"}),Object(c.jsx)(q.a,{align:"right",children:e.stats.hashtag.manual.right})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"positive"}),Object(c.jsx)(q.a,{align:"right",children:e.stats.hashtag.manual.positive})]}),Object(c.jsxs)($.a,{children:[Object(c.jsx)(q.a,{children:"negative"}),Object(c.jsx)(q.a,{align:"right",children:e.stats.hashtag.manual.negative})]})]})]})})}),Object(c.jsx)(K.a,{item:!0,className:a.gridItem,xs:1,children:Object(c.jsxs)(F.a,{children:[Object(c.jsx)(H.a,{component:"fieldset",children:Object(c.jsxs)(ie.a,{"aria-label":"category",name:"category",value:e.hashtag.category||"none",onChange:function(t){return e.handleNodeChange(t,e.hashtag)},children:[Object(c.jsx)(z.a,{labelPlacement:"start",value:"left",control:Object(c.jsx)(se.a,{}),label:"left"}),Object(c.jsx)(z.a,{labelPlacement:"start",value:"neutral",control:Object(c.jsx)(se.a,{}),label:"neutral"}),Object(c.jsx)(z.a,{labelPlacement:"start",value:"right",control:Object(c.jsx)(se.a,{}),label:"right"}),Object(c.jsx)(z.a,{labelPlacement:"start",value:"positive",control:Object(c.jsx)(se.a,{}),label:"positive"}),Object(c.jsx)(z.a,{labelPlacement:"start",value:"negative",control:Object(c.jsx)(se.a,{}),label:"negative"}),Object(c.jsx)(z.a,{labelPlacement:"start",value:"none",control:Object(c.jsx)(se.a,{}),label:"none"})]})}),Object(c.jsx)(z.a,{control:Object(c.jsx)(G.a,{checked:e.hashtag.ignored||!1,onChange:function(t){return e.handleNodeChange(t,e.hashtag)},name:"ignored"}),label:"ignored",labelPlacement:"start"})]})})]})]})},ue="http://word.threeceelabs.com/auth/twitter",he="viewer_"+(n=1e9,r=9999999999,Math.floor(Math.random()*(r-n+1)+n)),ge={nodeId:he,userId:he,viewerId:he,screenName:he,type:"viewer",namespace:"view",timeStamp:Date.now(),tags:{}};ge.tags.type="viewer",ge.tags.mode="stream",ge.tags.entity=he;var be=ge;console.log({viewerObj:be});var je=m()("https://word.threeceelabs.com/view"),Oe=Object(f.a)((function(e){return{root:{width:"100%",flexGrow:1,boxShadow:0},appBar:{backgroundColor:"black",marginBottom:e.spacing(2),boxShadow:0},tabs:{color:"white"},toolBar:{shadows:0},title:{color:"white",marginRight:e.spacing(2)},progress:{flexGrow:1,color:"white",marginRight:e.spacing(2)},serverStatus:{color:"gray",padding:e.spacing(1)},twitterAuth:{fontSize:"1.2rem",fontWeight:600,color:"green",padding:e.spacing(1),marginRight:e.spacing(2)},buttonLogin:{marginRight:e.spacing(2)},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},search:Object(b.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"20%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(b.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"})}})),me=function(){var e=Object(d.f)(),t=Object(d.g)(),a=(Object(d.h)().slug,Oe()),n=Object(s.useState)(0),r=Object(g.a)(n,2),i=r[0],o=r[1],l=(Object(s.useRef)(i),Object(s.useState)([t.pathname])),b=Object(g.a)(l,2),O=b[0],m=b[1],f=Object(s.useRef)(O),w=Object(s.useState)(0),k=Object(g.a)(w,2),A=k[0],_=k[1],L=Object(s.useRef)(A),U=Object(s.useState)(!1),D=Object(g.a)(U,2),W=D[0],B=D[1],G=Object(s.useRef)(W),H=Object(s.useState)(""),z=Object(g.a)(H,2),F=z[0],K=z[1],M=Object(s.useRef)(F),P=Object(s.useState)(""),V=Object(g.a)(P,2),X=V[0],Y=V[1],q=(Object(s.useRef)(X),Object(s.useState)({nodesPerMin:0,maxNodesPerMin:0,maxNodesPerMinTime:0,bestNetwork:{networkId:""},user:{uncategorized:{left:0,neutral:0,right:0,positive:0,negative:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0,positive:0,negative:0},auto:{left:0,neutral:0,right:0,positive:0,negative:0}},hashtag:{uncategorized:{left:0,neutral:0,right:0,positive:0,negative:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0,positive:0,negative:0},auto:{left:0,neutral:0,right:0,positive:0,negative:0}}})),J=Object(g.a)(q,2),Z=J[0],$=J[1],Q=Object(s.useRef)(Z),ee=Object(s.useState)(!1),te=Object(g.a)(ee,2),ae=te[0],ne=te[1],ce=Object(s.useRef)(ae),se=Object(s.useState)({search_metadata:{},statuses:[]}),ie=Object(g.a)(se,2),oe=ie[0],le=ie[1],he=Object(s.useRef)(oe),ge=Object(s.useState)("loading ..."),me=Object(g.a)(ge,2),fe=me[0],pe=me[1],xe=Object(s.useState)("user"),Te=Object(g.a)(xe,2),Ne=Te[0],Re=Te[1],Ee=Object(s.useRef)(Ne),we=Object(s.useState)([]),ve=Object(g.a)(we,2),Ie=ve[0],Ce=ve[1],ye=Object(s.useRef)(Ie),Se=Object(s.useState)({nodeId:null,screenName:"threecee",name:"",location:"",description:"",profileImageUrl:"https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",bannerImage:"",createdAt:null,status:{},followersCount:0,friendsCount:0,tweets:0,age:0,mentions:0,rate:0,rateMax:0,tweetsPerDay:0,lastSeen:null,isBot:!1,following:!1,categoryVerfied:!1,category:"none",categoryAuto:"none"}),ke=Object(g.a)(Se,2),Ae=ke[0],_e=ke[1],Le=Object(s.useRef)(Ae),Ue=Object(s.useState)({nodeId:"blacklivesmatter",text:"BlackLivesMatter",categoryAuto:"none",category:"left",createdAt:0,lastSeen:0,age:0,mentions:0,rate:0,rateMax:0}),De=Object(g.a)(Ue,2),We=De[0],Be=De[1],Ge=Object(s.useRef)(We);Object(s.useEffect)((function(){var e=Object(h.a)(f.current);e.length>0&&t.pathname!==e[0]&&(e.push(t.pathname),m((function(){return Object(h.a)(e)})),_(e.length-1),f.current=e)}),[t.pathname]),Object(s.useEffect)((function(){M.current=F}),[F]),Object(s.useEffect)((function(){G.current=W}),[W]),Object(s.useEffect)((function(){Ee.current=Ne}),[Ne]),Object(s.useEffect)((function(){ye.current=Ie}),[Ie]),Object(s.useEffect)((function(){Le.current=Ae}),[Ae]),Object(s.useEffect)((function(){Ge.current=We}),[We]),Object(s.useEffect)((function(){ce.current=ae}),[ae]),Object(s.useEffect)((function(){Q.current=Z}),[Z]),Object(s.useEffect)((function(){he.current=oe}),[oe]);var He="user"===Ee.current?Le.current:Ge.current,ze=function(e){pe((function(e){return"searchNode"}));var t="user"===Ne?"@"+e:"#"+e;console.log("SEARCH TERM: "+t),je.emit("TWITTER_SEARCH_NODE",t)},Fe=Object(s.useCallback)((function(e){e.preventDefault(),pe((function(e){return"loginLogout"})),G.current?(console.warn("LOGGING OUT"),je.emit("logout",be),B(!1),K(""),pe((function(e){return"idle"}))):(console.warn("LOGIN: AUTH: "+G.current+" | URL: "+ue),window.open(ue,"LOGIN","_new"),je.emit("login",be))}),[]),Ke=Object(s.useCallback)((function(a,n){void 0!==a.preventDefault&&a.preventDefault(),"user"===Ee.current?console.log("handleNodeChange | user: @"+n.screenName):console.log("handleNodeChange | hashtag: #"+n.nodeId),void 0!==a.persist&&a.persist();var r,c=a.target.name||"nop",s=a.target.value,i=a.target.checked;if(void 0===a.target.name&&a.code)switch(a.code){case"ArrowRight":case"ArrowLeft":if(console.log("location.pathname: "+t.pathname),console.log({historyArrayRef:f}),console.log({historyArrayIndexRef:L}),c="history",a.code,"ArrowLeft"===a.code&&f.current.length>0){f.current.pop();var o=f.current.pop();e.push(o),s=o.split("/").pop()}break;case"KeyA":c="all";break;case"KeyD":case"KeyL":a.shiftKey?(c="category",s="left"):c="left";break;case"KeyN":a.shiftKey?(c="category",s="neutral"):c="neutral";break;case"KeyR":a.shiftKey?(c="category",s="right"):c="right";break;case"KeyHyphen":a.shiftKey?(c="category",s="negative"):c="negative";break;case"KeyEquals":a.shiftKey?(c="category",s="positive"):c="positive";break;case"KeyI":case"KeyX":a.shiftKey&&(c="ignored",i=!n.ignored);break;case"KeyV":a.shiftKey&&(c="catVerified",i=!n.categoryVerified);break;case"KeyB":a.shiftKey&&(c="isBot",i=!n.isBot)}"user"===n.nodeType?(r="@?",console.log("handleNodeChange | @"+n.screenName+" | name: "+c+" | value: "+s)):(r="#?",console.log("handleNodeChange | #"+n.nodeId+" | name: "+c+" | value: "+s)),pe(c);var l=0;switch(c){case"nop":break;case"history":"user"===n.nodeType?(console.log("handleNodeChange | history | @"+n.screenName+" | name: "+c+" | value: "+s),je.emit("TWITTER_SEARCH_NODE","@"+s)):(console.log("handleNodeChange | history | #"+n.nodeId+" | name: "+c+" | value: "+s),je.emit("TWITTER_SEARCH_NODE","#"+s));break;case"all":case"left":case"neutral":case"right":case"positive":case"negative":r+=c,(l=function(e){if(ye.current&&ye.current.length>0){var t=Object(h.a)(ye.current),a=t.shift();return Ce(t),console.log("USING CURRENT USERS | CURRENT USERS: "+t.length+" | @"+a.screenName),_e(a),pe("idle"),t.length}return 0}())<5&&(console.log("GET MORE USERS | usersAvailable: "+l),je.emit("TWITTER_SEARCH_NODE",r));break;case"mismatch":"user"===n.nodeType&&je.emit("TWITTER_SEARCH_NODE","@?mm");break;case"category":if(!G.current)return alert("NOT AUTHENTICATED"),void pe("idle");je.emit("TWITTER_CATEGORIZE_NODE",{category:s,following:!0,node:n});break;case"isBot":case"following":case"catVerified":case"ignored":if(!G.current)return alert("NOT AUTHENTICATED"),void pe("idle");if("ignored"===c){i?je.emit("TWITTER_IGNORE",n):je.emit("TWITTER_UNIGNORE",n);break}"user"===n.nodeType&&("bot"===c&&(i?je.emit("TWITTER_BOT",n):je.emit("TWITTER_UNBOT",n)),"following"===c&&(i?je.emit("TWITTER_FOLLOW",n):je.emit("TWITTER_UNFOLLOW",n)),"catVerified"===c&&(i?je.emit("TWITTER_CATEGORY_VERIFIED",n):je.emit("TWITTER_CATEGORY_UNVERIFIED",n)));break;default:console.log("handleNodeChange: UNKNOWN NAME: "+c+" | VALUE: "+s),console.log({event:a})}}),[e,t]),Me=function(e){return void 0!==e&&(void 0!==e.nodeId&&("user"!==e.nodeType||void 0!==e.screenName))};Object(s.useEffect)((function(){"user"===Ee.current&&(console.log({history:e}),console.log("loc:  "+t.pathname),t.pathname.endsWith("/user/"+Le.current.screenName)||(console.log("history push: /categorize/user/"+Le.current.screenName),e.push("/categorize/user/"+Le.current.screenName)))}),[e,Ae,t.pathname]),Object(s.useEffect)((function(){"hashtag"===Ee.current&&(console.log("history loc:  "+e.location.pathname),e.location.pathname.endsWith("/hashtag/"+Ge.current.nodeId)||(console.log("history push: /categorize/hashtag/"+Ge.current.nodeId),e.push("/categorize/hashtag/"+Ge.current.nodeId)))}),[e,We,t.pathname]),Object(s.useEffect)((function(){return je.on("connect",(function(){console.log("CONNECTED: "+je.id),pe((function(e){return"authentication"})),je.emit("authentication",{namespace:"view",userId:"test",password:"0123456789"})})),je.on("TWITTER_USERS",(function(e){if(console.debug("RX TWITTER_USERS"),e.nodes&&e.nodes.length>0){console.debug("RX USERS: "+e.nodes.length);var t,a=Object(h.a)(ye.current),n=Object(u.a)(e.nodes);try{for(n.s();!(t=n.n()).done;){var r=t.value;r.screenName&&""!==r.screenName&&a.push(r)}}catch(c){n.e(c)}finally{n.f()}console.debug("TOTAL USERS: "+a.length),Ce((function(e){return Object(h.a)(a)}))}pe((function(e){return"idle"})),$((function(t){return e.stats}))})),je.on("SET_TWITTER_USER",(function(e){console.debug("RX SET_TWITTER_USER"),e.nodes&&(Ce((function(t){return[].concat(Object(h.a)(t),Object(h.a)(e.nodes))})),console.debug("RX nodes: "+e.nodes.length)),Me(e.node)&&(_e((function(t){return e.node})),console.debug("new: @"+e.node.screenName)),pe((function(e){return"idle"})),$((function(t){return e.stats}))})),je.on("TWITTER_SEARCH_NODE_UNKNOWN_MODE",(function(e){console.debug("RX TWITTER_SEARCH_NODE_UNKNOWN_MODE"),console.debug({response:e}),pe((function(e){return"idle"})),$((function(t){return e.stats}))})),je.on("TWITTER_HASHTAG_NOT_FOUND",(function(e){console.debug("RX TWITTER_HASHTAG_NOT_FOUND"),console.debug({response:e}),ne((function(e){return"notFound"})),Be((function(t){return{nodeId:e.searchNode.slice(1)}})),le({search_metadata:{},statuses:[]}),pe((function(e){return"idle"})),$((function(t){return e.stats}))})),je.on("SET_TWITTER_HASHTAG",(function(e){console.debug("RX SET_TWITTER_HASHTAG"),Me(e.node)?(ne((function(e){return"found"})),Be((function(t){return e.node})),console.debug("new: #"+e.node.nodeId),e.tweets&&(console.debug("RX SET_TWITTER_HASHTAG | SET TWEETS: "+e.tweets.statuses.length),le((function(t){return e.tweets})))):(ne((function(e){return"invalid"})),console.debug("INVALID HT NODE | RESULTS"),console.debug({response:e})),pe((function(e){return"idle"})),$((function(t){return e.stats}))})),je.on("action",(function(e){switch(console.debug("RX ACTION | socket: "+je.id+" | TYPE: "+e.type),console.debug("RX ACTION | ",e.data),e.type){case"user":_e((function(t){return e.data})),console.log("USER: @"+e.data.screenName+" | "+e.data.profileImageUrl);break;case"hashtag":console.log("HT: #"+e.data.text);break;case"stats":$((function(){return e.data}))}})),je.on("authenticated",(function(){pe((function(e){return"idle"})),console.debug("AUTHENTICATED | "+je.id),je.emit("TWITTER_SEARCH_NODE","@?all"),je.emit("TWITTER_SEARCH_NODE","@threecee"),je.emit("TWITTER_SEARCH_NODE","#blacklivesmatter")})),je.on("USER_AUTHENTICATED",(function(e){pe((function(e){return"idle"})),B((function(){return!0})),K((function(t){return e.screenName})),console.log("RX TWITTER USER_AUTHENTICATED | USER: @"+e.screenName)})),je.on("TWITTER_USER_NOT_FOUND",(function(e){console.debug("RX TWITTER_USER_NOT_FOUND"),console.debug(e),$((function(t){return e.stats})),e.searchNode.startsWith("@?")&&e.results&&!e.results.endCursor?(console.debug("RETRY NEXT UNCAT: "+e.searchNode),je.emit("TWITTER_SEARCH_NODE",e.searchNode)):pe((function(e){return"idle"}))})),pe("idle"),function(){return je.disconnect()}}),[]),Object(j.a)("left",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("right",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("A",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("L",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+L",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("D",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+D",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("R",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+R",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("N",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+N",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("-",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+-",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("=",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+=",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+I",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+X",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+B",(function(e){return Ke(e,He)}),{},[He]),Object(j.a)("shift+V",(function(e){return Ke(e,He)}),{},[He]);var Pe;return Object(c.jsx)("div",{className:a.root,children:Object(c.jsxs)(p.a,{component:"main",maxWidth:!1,children:[Object(c.jsx)(x.a,{className:a.appBar,position:"static",children:Object(c.jsxs)(y.a,{className:a.toolBar,children:[Object(c.jsx)(S.a,{className:a.title,children:"CATEGORIZE"}),Object(c.jsxs)(I.a,{className:a.tabs,value:i,onChange:function(e,t){e.preventDefault(),console.log({newValue:t}),Re(0===t?"user":"hashtag"),o(t)},children:[Object(c.jsx)(C.a,{label:"User"}),Object(c.jsx)(C.a,{label:"Hashtag"})]}),Object(c.jsxs)("div",{className:a.search,children:[Object(c.jsx)("div",{className:a.searchIcon,children:Object(c.jsx)(v.a,{color:"primary"})}),Object(c.jsx)(R.a,{placeholder:"user"===Ee.current?"user search...":"hashtag search...",classes:{root:a.inputRoot,input:a.inputInput},inputProps:{"aria-label":"search"},value:X,onKeyPress:function(e){13===e.charCode&&(console.log("ENTER"),ze(X))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),Y(e.target.value)}})]}),"idle"!==fe?Object(c.jsxs)(c.Fragment,{children:[Object(c.jsx)(S.a,{className:a.progress,children:"".concat(fe," ...")})," ",Object(c.jsx)(T.a,{className:a.progress,children:fe})]}):Object(c.jsx)("div",{className:a.progress,children:"status: idle"}),Object(c.jsx)(E.a,{className:a.twitterAuth,href:"http://twitter.com/"+M.current,target:"_blank",rel:"noopener",children:M.current?"@"+M.current:""}),Object(c.jsx)(N.a,{className:a.buttonLogin,variant:"contained",color:G.current?"secondary":"primary",size:"small",onClick:function(e){Fe(e)},name:"login",label:"login",children:G.current?"LOGOUT":"LOGIN TWITTER"})]})}),(Pe=Ee.current,"user"===Pe?Object(c.jsx)(re,{user:Le.current,stats:Q.current,handleNodeChange:Ke,handleSearchNode:ze}):Object(c.jsx)(de,{hashtag:Ge.current,statusHashtag:ce.current,stats:Q.current,tweets:he.current,handleNodeChange:Ke,handleSearchNode:ze}))]})})},fe=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,295)).then((function(t){var a=t.getCLS,n=t.getFID,r=t.getFCP,c=t.getLCP,s=t.getTTFB;a(e),n(e),r(e),c(e),s(e)}))};o.a.render(Object(c.jsx)(l.a,{children:Object(c.jsx)("div",{children:Object(c.jsxs)(d.c,{children:[Object(c.jsx)(d.a,{path:"/categorize/user/:slug",children:Object(c.jsx)(me,{})}),Object(c.jsx)(d.a,{path:"/categorize/hashtag/:slug",children:Object(c.jsx)(me,{})}),Object(c.jsx)(d.a,{children:Object(c.jsx)(me,{})})]})})}),document.getElementById("root")),fe()}},[[218,1,2]]]);
//# sourceMappingURL=main.6a21680a.chunk.js.map