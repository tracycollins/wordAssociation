(this.webpackJsonpcategorizer=this.webpackJsonpcategorizer||[]).push([[0],{137:function(e,t,a){},168:function(e,t,a){},207:function(e,t,a){"use strict";a.r(t);var n=a(1),r=a(0),c=a(34),s=a.n(c),i=a(74),o=a(11),l=(a(137),a(28)),d=a(14),u=a(20),h=a(12),g=a(107),b=a.n(g),j=a(237),O=a(252),m=a(238),p=a(254),f=a(208),x=a(255),T=a(256),N=a(253),R=a(239),E=a(114),w=(a(168),a(108)),C=a(62),I=a(31),v=a.n(I),y=a(4),S=a(240),k=a(242),A=a(243),_=a(244),L=a(245),U=a(258),B=a(260),D=a(251),W=a(250),G=a(241),z=a(259),H=a(257),F=a(261),M=a(61),K=a.n(M),P=a(247),V=a(249),X=a(235),Y=a(246),q=a(248),J=a(236),Z=a(5),$="0.7rem",Q=Object(Z.a)((function(e){return{head:{},body:{fontSize:10}}}))(X.a),ee=Object(Z.a)((function(e){return{root:{}}}))(J.a),te=Object(j.a)((function(e){return{root:{flexGrow:2},appBar:{backgroundColor:"white",marginBottom:e.spacing(1)},grid:{display:"flex",alignItems:"stretch"},gridItem:{margin:e.spacing(1)},card:{maxWidth:"90%",alignSelf:"center"},profileImage:{marginBottom:e.spacing(1)},bannerImage:{marginBottom:e.spacing(1)},icon:{borderRadius:"50%",width:16,height:16,boxShadow:"inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)",backgroundColor:"#f5f8fa",backgroundImage:"linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))","$root.Mui-focusVisible &":{outline:"2px auto rgba(19,124,189,.6)",outlineOffset:2},"input:hover ~ &":{backgroundColor:"#ebf1f5"},"input:disabled ~ &":{boxShadow:"none",background:"rgba(206,217,224,.5)"}},checkedIcon:{backgroundColor:"#137cbd",backgroundImage:"linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))","&:before":{display:"block",width:16,height:16,backgroundImage:"radial-gradient(#fff,#fff 28%,transparent 32%)",content:'""'},"input:hover ~ &":{backgroundColor:"#106ba3"}},radioGroupCategory:{fontSize:"0.5rem",backgroundColor:"#ddeeee",borderRadius:e.shape.borderRadius,padding:e.spacing(2),marginBottom:e.spacing(1)},radioButtonLabel:{fontSize:"0.9rem"},radioButton:{},table:{borderRadius:e.shape.borderRadius},tableHead:{backgroundColor:"#ddeeee"},tableCell:{},tableCategorized:{borderRadius:e.shape.borderRadius,borderColor:"red",backgroundColor:"#ddeeee"},tableRowGreen:{backgroundColor:"lightgreen"},statusBar:{raised:!1,backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{color:"blue"},search:Object(u.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"#ddeeee"},marginRight:e.spacing(1),width:"100%"},e.breakpoints.up("sm"),{width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(u.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},left:{width:"50%",fontSize:$,backgroundColor:"blue",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white",marginBottom:e.spacing(1)},neutral:{width:"50%",fontSize:$,backgroundColor:"gray",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white",marginBottom:e.spacing(1)},right:{width:"50%",fontSize:$,backgroundColor:"red",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white",marginBottom:e.spacing(1)},positive:{width:"50%",fontSize:$,backgroundColor:"green",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white",marginBottom:e.spacing(1)},negative:{width:"50%",fontSize:$,backgroundColor:"red",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white",marginBottom:e.spacing(1)},none:{width:"50%",fontSize:$,backgroundColor:"lightgray",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white",marginBottom:e.spacing(1)},ignored:{width:"50%",fontSize:$,backgroundColor:"yellow",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"black",marginBottom:e.spacing(1)}}}));function ae(e){var t=te();return Object(n.jsx)(H.a,Object(w.a)({className:t.radioButton,disableRipple:!0,color:"default",checkedIcon:Object(n.jsx)("span",{className:Object(y.a)(t.icon,t.checkedIcon)}),icon:Object(n.jsx)("span",{className:t.icon})},e))}var ne,re,ce=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},se=function(e){var t=te(),a=ce(e.user.createdAt),c=ce(e.user.lastSeen),s=new v.a(new Date(e.user.lastSeen)).toString(1,4),i=e.user.createdAt?new v.a(new Date(e.user.createdAt)):new v.a(new Date),o=i.toString(1,4),l=i.days>0?Math.ceil(e.user.statusesCount/i.days):0,u=Object(r.useState)(""),h=Object(d.a)(u,2),g=h[0],b=h[1],j=function(){console.log("open twitter"),window.open("http://twitter.com/".concat(e.user.screenName||null),"_blank")},O=function(e){switch(e){case"left":case"neutral":case"right":case"positive":case"negative":case"ignored":return t[e];default:return t.none}};return Object(n.jsxs)(n.Fragment,{children:[Object(n.jsx)(m.a,{className:t.appBar,position:"static",children:Object(n.jsxs)(R.a,{variant:"dense",children:[Object(n.jsxs)("div",{className:t.search,children:[Object(n.jsx)("div",{className:t.searchIcon,children:Object(n.jsx)(K.a,{color:"primary"})}),Object(n.jsx)(z.a,{placeholder:"search\u2026",classes:{root:t.inputRoot,input:t.inputInput},inputProps:{"aria-label":"search"},value:g,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER"),e.handleSearchNode(g))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),b(e.target.value)}})]}),Object(n.jsx)(E.a,{className:t.buttonGroupLabel,children:"GET UNCAT"}),Object(n.jsxs)(S.a,{color:"primary",size:"small","aria-label":"small button group",children:[Object(n.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.user)},name:"all",children:["ALL: ",e.stats.user.uncategorized.all]}),Object(n.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.user)},name:"left",children:["LEFT: ",e.stats.user.uncategorized.left]}),Object(n.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.user)},name:"neutral",children:["NEUTRAL: ",e.stats.user.uncategorized.neutral]}),Object(n.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.user)},name:"right",children:["RIGHT: ",e.stats.user.uncategorized.right]})]}),Object(n.jsx)(S.a,{color:"primary",size:"small","aria-label":"small button group",children:Object(n.jsxs)(f.a,{className:t.buttonMismatch,color:"primary",size:"small",onClick:function(t){return e.handleNodeChange(t,e.user)},name:"mismatch",children:["MISMATCH ",e.stats.user.mismatched]})})]})}),Object(n.jsxs)(G.a,{className:t.grid,children:[Object(n.jsx)(G.a,{item:!0,className:t.gridItem,xs:3,children:Object(n.jsxs)(k.a,{className:t.card,variant:"outlined",children:[Object(n.jsxs)(A.a,{onClick:j,children:[Object(n.jsx)(E.a,{className:e.user.ignored?t.ignored:O(e.user.category),align:"center",children:e.user.ignored?"IGNORED":e.user.category.toUpperCase()||"MANUAL: NONE"}),Object(n.jsxs)(E.a,{className:O(e.user.categoryAuto),align:"center",children:["AUTO: ",e.user.categoryAuto.toUpperCase()||"NONE"]})]}),Object(n.jsxs)(_.a,{onClick:j,children:[Object(n.jsx)(E.a,{variant:"h6",children:e.user.name}),Object(n.jsxs)(E.a,{children:["@",e.user.screenName]})]}),Object(n.jsx)(L.a,{className:t.profileImage,src:e.user.profileImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(n.jsx)(L.a,{className:t.bannerImage,src:e.user.bannerImageUrl||"logo192.png",component:"img",onError:function(e){}}),Object(n.jsx)(_.a,{children:Object(n.jsx)(E.a,{children:e.user.description})})]})}),Object(n.jsx)(G.a,{item:!0,className:t.gridItem,xs:3,children:Object(n.jsx)(C.a,{dataSource:{sourceType:"profile",screenName:e.user.screenName},options:{width:"100%",height:"640"}})}),Object(n.jsx)(G.a,{item:!0,className:t.gridItem,xs:2,children:Object(n.jsx)(Y.a,{children:Object(n.jsxs)(P.a,{className:t.table,size:"small",children:[Object(n.jsx)(q.a,{children:Object(n.jsxs)(ee,{className:t.tableHead,children:[Object(n.jsxs)(Q,{children:["@",e.user.screenName]}),Object(n.jsx)(Q,{align:"right"})]})}),Object(n.jsxs)(V.a,{children:[Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Twitter ID"}),Object(n.jsx)(Q,{align:"right",children:e.user.nodeId})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Location"}),Object(n.jsx)(Q,{align:"right",children:e.user.location})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Created"}),Object(n.jsx)(Q,{align:"right",children:a})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Twitter age"}),Object(n.jsx)(Q,{align:"right",children:o})]}),Object(n.jsxs)(ee,{className:e.user.followersCount>5e3?t.tableRowGreen:null,children:[Object(n.jsx)(Q,{children:"Followers"}),Object(n.jsx)(Q,{align:"right",children:e.user.followersCount})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Friends"}),Object(n.jsx)(Q,{align:"right",children:e.user.friendsCount})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Tweets"}),Object(n.jsx)(Q,{align:"right",children:e.user.statusesCount})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Tweets/day"}),Object(n.jsx)(Q,{align:"right",children:l})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Active"}),Object(n.jsxs)(Q,{align:"right",children:[c," (",s," ago)"]})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Mentions"}),Object(n.jsx)(Q,{align:"right",children:e.user.mentions})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"Mentions/hour"}),Object(n.jsx)(Q,{align:"right",children:e.user.rate?60*e.user.rate.toFixed(2):0})]})]})]})})}),Object(n.jsx)(G.a,{item:!0,className:t.gridItem,xs:2,children:Object(n.jsx)(Y.a,{children:Object(n.jsxs)(P.a,{size:"small",children:[Object(n.jsxs)(q.a,{children:[Object(n.jsx)(ee,{className:t.tableHead,children:Object(n.jsx)(Q,{colSpan:3,children:"ALL USERS"})}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"CAT"}),Object(n.jsx)(Q,{align:"right",children:"MAN"}),Object(n.jsx)(Q,{align:"right",children:"AUTO"})]})]}),Object(n.jsxs)(V.a,{children:[Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"LEFT"}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.manual.left}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.auto.left})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"RIGHT"}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.manual.right}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.auto.right})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"NEUTRAL"}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.manual.neutral}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.auto.neutral})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"POSITIVE"}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.manual.positive}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.auto.positive})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"NEGATIVE"}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.manual.negative}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.auto.negative})]}),Object(n.jsxs)(ee,{children:[Object(n.jsx)(Q,{children:"NONE"}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.manual.none}),Object(n.jsx)(Q,{align:"right",children:e.stats.user.auto.none})]})]})]})})}),Object(n.jsx)(G.a,{item:!0,className:t.gridItem,xs:1,children:Object(n.jsxs)(W.a,{children:[Object(n.jsx)(B.a,{component:"fieldset",children:Object(n.jsxs)(F.a,{className:t.radioGroupCategory,"aria-label":"category",name:"category",value:e.user.category||"none",onChange:function(t){return e.handleNodeChange(t,e.user)},children:[Object(n.jsx)(D.a,{value:"left",control:Object(n.jsx)(ae,{}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"LEFT"})}),Object(n.jsx)(D.a,{value:"right",control:Object(n.jsx)(ae,{}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"RIGHT"})}),Object(n.jsx)(D.a,{value:"neutral",control:Object(n.jsx)(ae,{}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"NEUTRAL"})}),Object(n.jsx)(D.a,{value:"positive",control:Object(n.jsx)(ae,{}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"POSITIVE"})}),Object(n.jsx)(D.a,{value:"negative",control:Object(n.jsx)(ae,{}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"NEGATIVE"})}),Object(n.jsx)(D.a,{value:"none",control:Object(n.jsx)(ae,{}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"NONE"})})]})}),Object(n.jsxs)(B.a,{component:"fieldset",className:t.radioGroupCategory,size:"small",children:[Object(n.jsx)(D.a,{control:Object(n.jsx)(U.a,{size:"small",checked:e.user.following||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"following"}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"FOLLOWING"})}),Object(n.jsx)(D.a,{control:Object(n.jsx)(U.a,{size:"small",checked:e.user.categoryVerified||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"catVerified"}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"VERIFIED"})}),Object(n.jsx)(D.a,{control:Object(n.jsx)(U.a,{size:"small",checked:e.user.ignored||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"ignored"}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"IGNORED"})}),Object(n.jsx)(D.a,{control:Object(n.jsx)(U.a,{size:"small",checked:e.user.isBot||!1,onChange:function(t){return e.handleNodeChange(t,e.user)},name:"isBot"}),label:Object(n.jsx)(E.a,{className:t.radioButtonLabel,children:"BOT"})})]})]})})]})]})},ie=Object(j.a)((function(e){return{root:{flexGrow:2},grid:{display:"flex"},gridItem:{margin:5},card:{raised:!1,maxWidth:400},table:{},tableRowGreen:{backgroundColor:"lightgreen"},appBar:{backgroundColor:"white",margin:2},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{color:"blue"},search:Object(u.a)({flexGrow:1,position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(u.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},left:{backgroundColor:"blue",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},neutral:{backgroundColor:"gray",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},right:{backgroundColor:"red",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"},none:{backgroundColor:"white",borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white"}}})),oe=function(e){return new Date(e).toLocaleDateString("en-gb",{year:"numeric",month:"short",day:"numeric"})},le=function(e){var t,a=ie(),c=e.hashtag.createdAt?oe(e.hashtag.createdAt):"---",s=e.hashtag.lastSeen?oe(e.hashtag.lastSeen):"---",i=e.hashtag.lastSeen?new v.a(new Date(e.hashtag.lastSeen)).toString(1,4):"---",o=e.hashtag.createdAt?new v.a(new Date(e.hashtag.createdAt)):"---",l=e.hashtag.createdAt?o.toString(1,4):"---",u=Object(r.useState)(""),h=Object(d.a)(u,2),g=h[0],b=h[1];return Object(n.jsxs)(n.Fragment,{children:[Object(n.jsx)(m.a,{className:a.appBar,position:"static",children:Object(n.jsxs)(R.a,{variant:"dense",children:[Object(n.jsxs)("div",{className:a.search,children:[Object(n.jsx)("div",{className:a.searchIcon,children:Object(n.jsx)(K.a,{color:"primary"})}),Object(n.jsx)(z.a,{placeholder:"search\u2026",classes:{root:a.inputRoot,input:a.inputInput},inputProps:{"aria-label":"search"},value:g,onKeyPress:function(t){13===t.charCode&&(console.log("ENTER: hashtagSearch: "+g),e.handleSearchNode(g))},onChange:function(e){console.log("handleChangeSearch: "+e.target.value),b(e.target.value)}})]}),Object(n.jsx)(E.a,{className:a.buttonGroupLabel,children:"UNCAT"}),Object(n.jsx)(S.a,{variant:"contained",color:"primary",size:"small","aria-label":"small button group",children:Object(n.jsxs)(f.a,{onClick:function(t){return e.handleNodeChange(t,e.hashtag)},name:"all",children:["ALL: ",e.stats.hashtag.uncategorized.all]})})]})}),Object(n.jsxs)(G.a,{className:a.grid,children:[Object(n.jsx)(G.a,{item:!0,className:a.gridItem,xs:3,children:Object(n.jsx)(k.a,{className:a.card,variant:"outlined",children:Object(n.jsx)(_.a,{onClick:function(){console.log("open twitter"),window.open("https://twitter.com/search?f=tweets&q=%23".concat(e.hashtag.nodeId||null),"_blank")},children:Object(n.jsxs)(E.a,{variant:"h6",children:["#","notFound"===e.statusHashtag?e.hashtag.nodeId+" NOT FOUND":e.hashtag.nodeId]})})})}),Object(n.jsx)(G.a,{item:!0,className:a.gridItem,xs:3,children:(t=e.tweets,t&&void 0!==t&&void 0!==t.statuses?t.statuses.map((function(e){return Object(n.jsx)(C.b,{tweetId:e.id_str,options:{width:"400"}},e.id_str)})):Object(n.jsx)(n.Fragment,{}))}),Object(n.jsx)(G.a,{item:!0,className:a.gridItem,xs:3,children:Object(n.jsx)(Y.a,{children:Object(n.jsx)(P.a,{className:a.table,size:"small",children:Object(n.jsxs)(V.a,{children:[Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"id"}),Object(n.jsx)(X.a,{align:"right",children:e.hashtag.nodeId})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"created"}),Object(n.jsx)(X.a,{align:"right",children:c})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"twitter age"}),Object(n.jsx)(X.a,{align:"right",children:l})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"last seen"}),Object(n.jsx)(X.a,{align:"right",children:s})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"last seen"}),Object(n.jsxs)(X.a,{align:"right",children:[i," ago"]})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"mentions"}),Object(n.jsx)(X.a,{align:"right",children:e.hashtag.mentions?e.hashtag.mentions:"---"})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"mentions/min"}),Object(n.jsx)(X.a,{align:"right",children:e.hashtag.rate?e.hashtag.rate.toFixed(1):"---"})]})]})})})}),Object(n.jsx)(G.a,{item:!0,className:a.gridItem,xs:2,children:Object(n.jsx)(Y.a,{children:Object(n.jsxs)(P.a,{className:a.table,size:"small",children:[Object(n.jsx)(q.a,{children:Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"CAT"}),Object(n.jsx)(X.a,{align:"left",children:"MAN"})]})}),Object(n.jsxs)(V.a,{children:[Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"left"}),Object(n.jsx)(X.a,{align:"right",children:e.stats.hashtag.manual.left})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"neutral"}),Object(n.jsx)(X.a,{align:"right",children:e.stats.hashtag.manual.neutral})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"right"}),Object(n.jsx)(X.a,{align:"right",children:e.stats.hashtag.manual.right})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"positive"}),Object(n.jsx)(X.a,{align:"right",children:e.stats.hashtag.manual.positive})]}),Object(n.jsxs)(J.a,{children:[Object(n.jsx)(X.a,{children:"negative"}),Object(n.jsx)(X.a,{align:"right",children:e.stats.hashtag.manual.negative})]})]})]})})}),Object(n.jsx)(G.a,{item:!0,className:a.gridItem,xs:1,children:Object(n.jsxs)(W.a,{children:[Object(n.jsx)(B.a,{component:"fieldset",children:Object(n.jsxs)(F.a,{"aria-label":"category",name:"category",value:e.hashtag.category||"none",onChange:function(t){return e.handleNodeChange(t,e.hashtag)},children:[Object(n.jsx)(D.a,{labelPlacement:"start",value:"left",control:Object(n.jsx)(H.a,{}),label:"left"}),Object(n.jsx)(D.a,{labelPlacement:"start",value:"neutral",control:Object(n.jsx)(H.a,{}),label:"neutral"}),Object(n.jsx)(D.a,{labelPlacement:"start",value:"right",control:Object(n.jsx)(H.a,{}),label:"right"}),Object(n.jsx)(D.a,{labelPlacement:"start",value:"positive",control:Object(n.jsx)(H.a,{}),label:"positive"}),Object(n.jsx)(D.a,{labelPlacement:"start",value:"negative",control:Object(n.jsx)(H.a,{}),label:"negative"}),Object(n.jsx)(D.a,{labelPlacement:"start",value:"none",control:Object(n.jsx)(H.a,{}),label:"none"})]})}),Object(n.jsx)(D.a,{control:Object(n.jsx)(U.a,{checked:e.hashtag.ignored||!1,onChange:function(t){return e.handleNodeChange(t,e.hashtag)},name:"ignored"}),label:"ignored",labelPlacement:"start"})]})})]})]})},de="http://word.threeceelabs.com/auth/twitter",ue="viewer_"+(ne=1e9,re=9999999999,Math.floor(Math.random()*(re-ne+1)+ne)),he={nodeId:ue,userId:ue,viewerId:ue,screenName:ue,type:"viewer",namespace:"view",timeStamp:Date.now(),tags:{}};he.tags.type="viewer",he.tags.mode="stream",he.tags.entity=ue;var ge=he;console.log({viewerObj:ge});var be=b()("https://word.threeceelabs.com/view"),je=Object(j.a)((function(e){return{root:{width:"100%",flexGrow:1,boxShadow:0},appBar:{backgroundColor:"black",marginBottom:e.spacing(2),boxShadow:0},tabs:{flexGrow:1,color:"white"},toolBar:{shadows:0},title:{color:"white",marginRight:e.spacing(2)},progress:{color:"white",marginRight:e.spacing(2)},serverStatus:{color:"gray",padding:e.spacing(1)},twitterAuth:{color:"green",padding:e.spacing(1),marginRight:e.spacing(2)},buttonLogin:{backgroundColor:"green",marginRight:e.spacing(2)},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},search:Object(u.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"lightgray"},marginRight:e.spacing(2),marginLeft:0,width:"100%"},e.breakpoints.up("sm"),{marginLeft:e.spacing(3),width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(u.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"})}})),Oe=function(){var e=Object(o.f)(),t=Object(o.g)(),a=(Object(o.h)().slug,je()),c=Object(r.useState)(0),s=Object(d.a)(c,2),i=s[0],u=s[1],g=Object(r.useState)([t.pathname]),b=Object(d.a)(g,2),j=b[0],w=b[1],C=Object(r.useRef)(j),I=Object(r.useState)(0),v=Object(d.a)(I,2),y=v[0],S=v[1],k=Object(r.useRef)(y),A=Object(r.useState)(!1),_=Object(d.a)(A,2),L=_[0],U=_[1],B=Object(r.useRef)(L),D=Object(r.useState)(""),W=Object(d.a)(D,2),G=W[0],z=W[1],H=Object(r.useRef)(G),F=Object(r.useState)({nodesPerMin:0,maxNodesPerMin:0,maxNodesPerMinTime:0,bestNetwork:{networkId:""},user:{uncategorized:{left:0,neutral:0,right:0,positive:0,negative:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0,positive:0,negative:0},auto:{left:0,neutral:0,right:0,positive:0,negative:0}},hashtag:{uncategorized:{left:0,neutral:0,right:0,positive:0,negative:0,all:0,mismatched:0},manual:{left:0,neutral:0,right:0,positive:0,negative:0},auto:{left:0,neutral:0,right:0,positive:0,negative:0}}}),M=Object(d.a)(F,2),K=M[0],P=M[1],V=Object(r.useRef)(K),X=Object(r.useState)(!1),Y=Object(d.a)(X,2),q=Y[0],J=Y[1],Z=Object(r.useRef)(q),$=Object(r.useState)({search_metadata:{},statuses:[]}),Q=Object(d.a)($,2),ee=Q[0],te=Q[1],ae=Object(r.useRef)(ee),ne=Object(r.useState)("loading ..."),re=Object(d.a)(ne,2),ce=re[0],ie=re[1],oe=Object(r.useState)("user"),ue=Object(d.a)(oe,2),he=ue[0],Oe=ue[1],me=Object(r.useRef)(he),pe=Object(r.useState)([]),fe=Object(d.a)(pe,2),xe=fe[0],Te=fe[1],Ne=Object(r.useRef)(xe),Re=Object(r.useState)({nodeId:null,screenName:"threecee",name:"",location:"",description:"",profileImageUrl:"https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",bannerImage:"",createdAt:null,status:{},followersCount:0,friendsCount:0,tweets:0,age:0,mentions:0,rate:0,rateMax:0,tweetsPerDay:0,lastSeen:null,isBot:!1,following:!1,categoryVerfied:!1,category:"none",categoryAuto:"none"}),Ee=Object(d.a)(Re,2),we=Ee[0],Ce=Ee[1],Ie=Object(r.useRef)(we),ve=Object(r.useState)({nodeId:"blacklivesmatter",text:"BlackLivesMatter",categoryAuto:"none",category:"left",createdAt:0,lastSeen:0,age:0,mentions:0,rate:0,rateMax:0}),ye=Object(d.a)(ve,2),Se=ye[0],ke=ye[1],Ae=Object(r.useRef)(Se);Object(r.useEffect)((function(){var e=Object(l.a)(C.current);e.length>0&&t.pathname!==e[0]&&(e.push(t.pathname),w((function(){return Object(l.a)(e)})),S(e.length-1),C.current=e)}),[t.pathname]),Object(r.useEffect)((function(){H.current=G}),[G]),Object(r.useEffect)((function(){B.current=L}),[L]),Object(r.useEffect)((function(){me.current=he}),[he]),Object(r.useEffect)((function(){Ne.current=xe}),[xe]),Object(r.useEffect)((function(){Ie.current=we}),[we]),Object(r.useEffect)((function(){Ae.current=Se}),[Se]),Object(r.useEffect)((function(){Z.current=q}),[q]),Object(r.useEffect)((function(){V.current=K}),[K]),Object(r.useEffect)((function(){ae.current=ee}),[ee]);var _e="user"===me.current?Ie.current:Ae.current,Le=function(e){ie((function(e){return"searchNode"}));var t="user"===he?"@"+e:"#"+e;console.log("SEARCH TERM: "+t),be.emit("TWITTER_SEARCH_NODE",t)},Ue=Object(r.useCallback)((function(e){e.preventDefault(),ie((function(e){return"loginLogout"})),B.current?(console.warn("LOGGING OUT"),be.emit("logout",ge),U(!1),z(""),ie((function(e){return"idle"}))):(console.warn("LOGIN: AUTH: "+B.current+" | URL: "+de),window.open(de,"LOGIN","_new"),be.emit("login",ge))}),[]),Be=Object(r.useCallback)((function(a,n){void 0!==a.preventDefault&&a.preventDefault(),"user"===me.current?console.log("handleNodeChange | user: @"+n.screenName):console.log("handleNodeChange | hashtag: #"+n.nodeId),void 0!==a.persist&&a.persist();var r,c=a.currentTarget.name||"nop",s=a.currentTarget.value,i=a.currentTarget.checked;if(void 0===a.currentTarget.name&&a.code)switch(a.code){case"ArrowRight":case"ArrowLeft":if(console.log("location.pathname: "+t.pathname),console.log({historyArrayRef:C}),console.log({historyArrayIndexRef:k}),c="history",a.code,"ArrowLeft"===a.code&&C.current.length>0){C.current.pop();var o=C.current.pop();e.push(o),s=o.split("/").pop()}break;case"KeyA":c="all";break;case"KeyD":case"KeyL":a.shiftKey?(c="category",s="left"):c="left";break;case"KeyN":a.shiftKey?(c="category",s="neutral"):c="neutral";break;case"KeyR":a.shiftKey?(c="category",s="right"):c="right";break;case"KeyHyphen":a.shiftKey?(c="category",s="negative"):c="negative";break;case"KeyEquals":a.shiftKey?(c="category",s="positive"):c="positive";break;case"KeyI":case"KeyX":a.shiftKey&&(c="ignored",i=!n.ignored);break;case"KeyV":a.shiftKey&&(c="catVerified",i=!n.categoryVerified);break;case"KeyB":a.shiftKey&&(c="isBot",i=!n.isBot)}"user"===n.nodeType?(r="@?",console.log("handleNodeChange | @"+n.screenName+" | name: "+c+" | value: "+s)):(r="#?",console.log("handleNodeChange | #"+n.nodeId+" | name: "+c+" | value: "+s)),ie(c);var d=0;switch(c){case"nop":break;case"history":"user"===n.nodeType?(console.log("handleNodeChange | history | @"+n.screenName+" | name: "+c+" | value: "+s),be.emit("TWITTER_SEARCH_NODE","@"+s)):(console.log("handleNodeChange | history | #"+n.nodeId+" | name: "+c+" | value: "+s),be.emit("TWITTER_SEARCH_NODE","#"+s));break;case"all":case"left":case"neutral":case"right":case"positive":case"negative":r+=c,(d=function(e){if(Ne.current&&Ne.current.length>0){var t=Object(l.a)(Ne.current),a=t.shift();return Te(t),console.log("USING CURRENT USERS | CURRENT USERS: "+t.length+" | @"+a.screenName),Ce(a),ie("idle"),t.length}return 0}())<3&&(console.log("GET MORE USERS | usersAvailable: "+d),be.emit("TWITTER_SEARCH_NODE",r));break;case"mismatch":"user"===n.nodeType&&be.emit("TWITTER_SEARCH_NODE","@?mm");break;case"category":if(!B.current)return void alert("NOT AUTHENTICATED");be.emit("TWITTER_CATEGORIZE_NODE",{category:s,following:!0,node:n});break;case"isBot":"user"===n.nodeType&&(i?be.emit("TWITTER_BOT",n):be.emit("TWITTER_UNBOT",n));break;case"following":"user"===n.nodeType&&(i?be.emit("TWITTER_FOLLOW",n):be.emit("TWITTER_UNFOLLOW",n));break;case"catVerified":"user"===n.nodeType&&(i?be.emit("TWITTER_CATEGORY_VERIFIED",n):be.emit("TWITTER_CATEGORY_UNVERIFIED",n));break;case"ignored":i?be.emit("TWITTER_IGNORE",n):be.emit("TWITTER_UNIGNORE",n);break;default:console.log("handleNodeChange: UNKNOWN NAME: "+c+" | VALUE: "+s),console.log({event:a})}}),[e,t]),De=function(e){return void 0!==e&&(void 0!==e.nodeId&&("user"!==e.nodeType||void 0!==e.screenName))};Object(r.useEffect)((function(){"user"===me.current&&(console.log({history:e}),console.log("loc:  "+t.pathname),t.pathname.endsWith("/user/"+Ie.current.screenName)||(console.log("history push: /categorize/user/"+Ie.current.screenName),e.push("/categorize/user/"+Ie.current.screenName)))}),[e,we,t.pathname]),Object(r.useEffect)((function(){"hashtag"===me.current&&(console.log("history loc:  "+e.location.pathname),e.location.pathname.endsWith("/hashtag/"+Ae.current.nodeId)||(console.log("history push: /categorize/hashtag/"+Ae.current.nodeId),e.push("/categorize/hashtag/"+Ae.current.nodeId)))}),[e,Se,t.pathname]),Object(r.useEffect)((function(){return be.on("connect",(function(){console.log("CONNECTED: "+be.id),ie((function(e){return"authentication"})),be.emit("authentication",{namespace:"view",userId:"test",password:"0123456789"})})),be.on("TWITTER_USERS",(function(e){console.debug("RX TWITTER_USERS"),e.nodes&&(console.debug("RX nodes: "+e.nodes.length),Te((function(t){return[].concat(Object(l.a)(t),Object(l.a)(e.nodes))}))),ie((function(e){return"idle"})),P((function(t){return e.stats}))})),be.on("SET_TWITTER_USER",(function(e){console.debug("RX SET_TWITTER_USER"),e.nodes&&(Te((function(t){return[].concat(Object(l.a)(t),Object(l.a)(e.nodes))})),console.debug("RX nodes: "+e.nodes.length)),De(e.node)&&(Ce((function(t){return e.node})),console.debug("new: @"+e.node.screenName)),ie((function(e){return"idle"})),P((function(t){return e.stats}))})),be.on("TWITTER_SEARCH_NODE_UNKNOWN_MODE",(function(e){console.debug("RX TWITTER_SEARCH_NODE_UNKNOWN_MODE"),console.debug({response:e}),ie((function(e){return"idle"})),P((function(t){return e.stats}))})),be.on("TWITTER_HASHTAG_NOT_FOUND",(function(e){console.debug("RX TWITTER_HASHTAG_NOT_FOUND"),console.debug({response:e}),J((function(e){return"notFound"})),ke((function(t){return{nodeId:e.searchNode.slice(1)}})),te({search_metadata:{},statuses:[]}),ie((function(e){return"idle"})),P((function(t){return e.stats}))})),be.on("SET_TWITTER_HASHTAG",(function(e){console.debug("RX SET_TWITTER_HASHTAG"),De(e.node)?(J((function(e){return"found"})),ke((function(t){return e.node})),console.debug("new: #"+e.node.nodeId),e.tweets&&(console.debug("RX SET_TWITTER_HASHTAG | SET TWEETS: "+e.tweets.statuses.length),te((function(t){return e.tweets})))):(J((function(e){return"invalid"})),console.debug("INVALID HT NODE | RESULTS"),console.debug({response:e})),ie((function(e){return"idle"})),P((function(t){return e.stats}))})),be.on("action",(function(e){switch(console.debug("RX ACTION | socket: "+be.id+" | TYPE: "+e.type),console.debug("RX ACTION | ",e.data),e.type){case"user":Ce((function(t){return e.data})),console.log("USER: @"+e.data.screenName+" | "+e.data.profileImageUrl);break;case"hashtag":console.log("HT: #"+e.data.text);break;case"stats":P((function(){return e.data}))}})),be.on("authenticated",(function(){ie((function(e){return"idle"})),console.debug("AUTHENTICATED | "+be.id),be.emit("TWITTER_SEARCH_NODE","@?all"),be.emit("TWITTER_SEARCH_NODE","@threecee"),be.emit("TWITTER_SEARCH_NODE","#blacklivesmatter")})),be.on("USER_AUTHENTICATED",(function(e){ie((function(e){return"idle"})),U((function(){return!0})),z((function(t){return e.screenName})),console.log("RX TWITTER USER_AUTHENTICATED | USER: @"+e.screenName)})),be.on("TWITTER_USER_NOT_FOUND",(function(e){console.debug("RX TWITTER_USER_NOT_FOUND"),console.debug(e),P((function(t){return e.stats})),e.searchNode.startsWith("@?")&&e.results&&!e.results.endCursor?(console.debug("RETRY NEXT UNCAT: "+e.searchNode),be.emit("TWITTER_SEARCH_NODE",e.searchNode)):ie((function(e){return"idle"}))})),ie("idle"),function(){return be.disconnect()}}),[]),Object(h.a)("left",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("right",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("A",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("L",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+L",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("D",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+D",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("R",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+R",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("N",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+N",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("-",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+-",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("=",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+=",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+I",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+X",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+B",(function(e){return Be(e,_e)}),{},[_e]),Object(h.a)("shift+V",(function(e){return Be(e,_e)}),{},[_e]);var We;return Object(n.jsx)("div",{className:a.root,children:Object(n.jsxs)(O.a,{component:"main",maxWidth:!1,children:[Object(n.jsx)(m.a,{className:a.appBar,position:"static",children:Object(n.jsxs)(R.a,{className:a.toolBar,children:[Object(n.jsx)(E.a,{className:a.title,children:"CATEGORIZE"}),Object(n.jsxs)(T.a,{className:a.tabs,value:i,onChange:function(e,t){e.preventDefault(),console.log({newValue:t}),Oe(0===t?"user":"hashtag"),u(t)},children:[Object(n.jsx)(N.a,{label:"User"}),Object(n.jsx)(N.a,{label:"Hashtag"})]}),"idle"!==ce?Object(n.jsxs)(n.Fragment,{children:[Object(n.jsx)(E.a,{className:a.progress,children:"".concat(ce," ...")})," ",Object(n.jsx)(p.a,{className:a.progress,children:ce})]}):Object(n.jsx)(n.Fragment,{}),Object(n.jsx)(x.a,{className:a.twitterAuth,href:"http://twitter.com/"+H.current,target:"_blank",rel:"noopener",children:H.current?"@"+H.current:""}),Object(n.jsx)(f.a,{className:a.buttonLogin,variant:"contained",color:"primary",size:"small",onClick:function(e){Ue(e)},name:"login",label:"login",children:B.current?"LOGOUT":"LOGIN TWITTER"})]})}),(We=me.current,"user"===We?Object(n.jsx)(se,{user:Ie.current,stats:V.current,handleNodeChange:Be,handleSearchNode:Le}):Object(n.jsx)(le,{hashtag:Ae.current,statusHashtag:Z.current,stats:V.current,tweets:ae.current,handleNodeChange:Be,handleSearchNode:Le}))]})})},me=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,263)).then((function(t){var a=t.getCLS,n=t.getFID,r=t.getFCP,c=t.getLCP,s=t.getTTFB;a(e),n(e),r(e),c(e),s(e)}))};s.a.render(Object(n.jsx)(i.a,{children:Object(n.jsx)("div",{children:Object(n.jsxs)(o.c,{children:[Object(n.jsx)(o.a,{path:"/categorize/user/:slug",children:Object(n.jsx)(Oe,{})}),Object(n.jsx)(o.a,{path:"/categorize/hashtag/:slug",children:Object(n.jsx)(Oe,{})}),Object(n.jsx)(o.a,{children:Object(n.jsx)(Oe,{})})]})})}),document.getElementById("root")),me()}},[[207,1,2]]]);
//# sourceMappingURL=main.22468df3.chunk.js.map