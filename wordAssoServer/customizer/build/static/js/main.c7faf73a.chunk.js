(this.webpackJsonpcustomizer=this.webpackJsonpcustomizer||[]).push([[0],{64:function(e,t,a){},65:function(e,t,a){},76:function(e,t,a){"use strict";a.r(t);var n=a(2),i=a(0),s=a(26),r=a.n(s),o=a(49),c=a(9),d=(a(64),{defaults:{displayLinks:!1,linkStrength:.2,linkStrengthRange:{min:0,max:1,step:.01},linkDistance:10,linkDistanceRange:{min:0,max:1e3,step:1},maxNodesLimit:50,maxNodesLimitRange:{min:0,max:200,step:1},nodeMaxAge:2e4,nodeMaxAgeRange:{min:0,max:6e4,step:100},velocityDecay:.8,velocityDecayRange:{min:0,max:1,step:.01},charge:-500,chargeRange:{min:-1e3,max:1e3,step:10},gravity:.005,gravityRange:{min:-.002,max:.01,step:1e-5},nodeRadiusRatioRange:{min:0,max:.1,step:.001},nodeRadiusRatio:{min:.007,max:.047},fontSizeRatioRange:{min:0,max:.1,step:.001},fontSizeRatio:{min:.015,max:.045}}});d.settings=Object.assign({},d.defaults);var l=d,g=a(25),u=a(19),m=a(107),b=a(114),h=a(115),j=a(119),x=a(117),p=a(116),O=a(78),f=(a(65),a(38)),R=a(120),N=a(121),v=a(110),k=a(109),y=a(108),w=a(51),S=a(122),C=Object(m.a)((function(e){return{root:{border:0,flexGrow:2},grid:{border:0,display:"flex",alignItems:"stretch"},gridItem:{border:0,margin:e.spacing(1)},gridHeader:{padding:e.spacing(1),border:0,marginBottom:e.spacing(1)},paper:{padding:e.spacing(1),outlined:!0,variant:"outlined"},radioGroupCategory:{maxWidth:"90%",fontSize:"0.5rem",padding:e.spacing(2),marginBottom:e.spacing(1)},checkbox:{color:f.a[400],"&$checked":{color:f.a[600]}},checked:{},radioButtonLabel:{fontSize:"0.9rem"},radioButton:{},range:{color:"white"}}}));function M(e){return"".concat(e)}var E=function(e){var t=C(),a=function(t){return function(a,n){a.preventDefault(),e.handleChange({name:t,value:n})}};return Object(n.jsx)(n.Fragment,{children:Object(n.jsxs)(y.a,{className:t.grid,children:[Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:2,children:Object(n.jsxs)(w.a,{className:t.paper,elevation:0,variant:"outlined",children:[Object(n.jsx)(O.a,{className:t.gridHeader,children:"SETTINGS"}),Object(n.jsx)(k.a,{align:"center",children:Object(n.jsx)(N.a,{component:"fieldset",className:t.radioGroupCategory,size:"small",children:Object(n.jsx)(v.a,{control:Object(n.jsx)(R.a,{id:"displayLinks",name:"displayLinks",className:t.checkbox,size:"small",value:e.settings.displayLinks,onChange:function(e){return a("displayLinks")}}),label:Object(n.jsx)(O.a,{className:t.radioButtonLabel,children:"LINKS"})})})})]})}),Object(n.jsxs)(y.a,{item:!0,className:t.gridItem,xs:6,children:[Object(n.jsx)(O.a,{className:t.range,id:"nodeRadiusRatio",name:"nodeRadiusRatio",gutterBottom:!0,children:"NODE RADIUS RATIO"}),Object(n.jsx)(O.a,{className:t.range,gutterBottom:!0,children:"".concat(e.settings.nodeRadiusRatio.min," min | ").concat(e.settings.nodeRadiusRatio.max," max")}),Object(n.jsx)(S.a,{id:"nodeRadiusRatio",name:"nodeRadiusRatio",value:[e.settings.nodeRadiusRatio.min,e.settings.nodeRadiusRatio.max],min:e.defaults.nodeRadiusRatioRange.min,max:e.defaults.nodeRadiusRatioRange.max,step:e.defaults.nodeRadiusRatioRange.step,onChange:a("nodeRadiusRatio"),valueLabelDisplay:"auto","aria-labelledby":"range-slider",getAriaValueText:M}),Object(n.jsx)(O.a,{className:t.range,id:"fontSizeRatio",name:"fontSizeRatio",gutterBottom:!0,children:"FONT SIZE RATIO min/max"}),Object(n.jsx)(O.a,{className:t.range,gutterBottom:!0,children:"".concat(e.settings.fontSizeRatio.min," min | ").concat(e.settings.fontSizeRatio.max," max")}),Object(n.jsx)(S.a,{id:"fontSizeRatio",name:"fontSizeRatio",value:[e.settings.fontSizeRatio.min,e.settings.fontSizeRatio.max],min:e.defaults.fontSizeRatioRange.min,max:e.defaults.fontSizeRatioRange.max,step:e.defaults.fontSizeRatioRange.step,onChange:a("fontSizeRatio"),valueLabelDisplay:"auto","aria-labelledby":"range-slider",getAriaValueText:M}),Object(n.jsx)(O.a,{className:t.range,id:"setMaxNodesLimit",name:"setMaxNodesLimit",gutterBottom:!0,children:"MAX NODES"}),Object(n.jsx)(O.a,{className:t.range,gutterBottom:!0,children:"".concat(e.settings.maxNodesLimit," MAX NODES")}),Object(n.jsx)(S.a,{id:"maxNodesLimit",name:"maxNodesLimit",value:e.settings.maxNodesLimit,min:e.defaults.maxNodesLimitRange.min,max:e.defaults.maxNodesLimitRange.max,step:e.defaults.maxNodesLimitRange.step,onChange:a("maxNodesLimit"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:M}),Object(n.jsx)(O.a,{className:t.range,id:"nodeMaxAge",name:"nodeMaxAge",gutterBottom:!0,children:"MAX AGE (seconds)"}),Object(n.jsx)(O.a,{className:t.range,gutterBottom:!0,children:"".concat(e.settings.nodeMaxAge," MAX NODE AGE (ms)")}),Object(n.jsx)(S.a,{id:"nodeMaxAge",name:"nodeMaxAge",value:e.settings.nodeMaxAge,min:e.defaults.nodeMaxAgeRange.min,max:e.defaults.nodeMaxAgeRange.max,step:e.defaults.nodeMaxAgeRange.step,onChange:a("nodeMaxAge"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:M}),Object(n.jsx)(O.a,{className:t.range,id:"linkStrength",name:"linkStrength",gutterBottom:!0,children:"LINK STRENGTH"}),Object(n.jsx)(O.a,{className:t.range,gutterBottom:!0,children:"".concat(e.settings.linkStrength," LINK STRENGTH")}),Object(n.jsx)(S.a,{id:"linkStrength",name:"linkStrength",value:e.settings.linkStrength,min:e.defaults.linkStrengthRange.min,max:e.defaults.linkStrengthRange.max,step:e.defaults.linkStrengthRange.step,onChange:a("linkStrength"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:M}),Object(n.jsx)(O.a,{className:t.range,id:"linkDistance",name:"linkDistance",gutterBottom:!0,children:"LINK DISTANCE"}),Object(n.jsx)(O.a,{className:t.range,gutterBottom:!0,children:"".concat(e.settings.linkDistance," LINK DISTANCE")}),Object(n.jsx)(S.a,{id:"linkDistance",name:"linkDistance",value:e.settings.linkDistance,min:e.defaults.linkDistanceRange.min,max:e.defaults.linkDistanceRange.max,step:e.defaults.linkDistanceRange.step,onChange:a("linkDistance"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:M}),Object(n.jsx)(O.a,{className:t.range,id:"velocityDecay",name:"velocityDecay",gutterBottom:!0,children:"VELOCITY DECAY"}),Object(n.jsx)(O.a,{className:t.range,gutterBottom:!0,children:"".concat(e.settings.velocityDecay,"/1.0")}),Object(n.jsx)(S.a,{id:"velocityDecay",name:"velocityDecay",value:e.settings.velocityDecay,min:e.defaults.velocityDecayRange.min,max:e.defaults.velocityDecayRange.max,step:e.defaults.velocityDecayRange.step,onChange:a("velocityDecay"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:M}),Object(n.jsx)(O.a,{className:t.range,id:"charge",name:"charge",gutterBottom:!0,children:"CHARGE"}),Object(n.jsx)(O.a,{className:t.range,gutterBottom:!0,children:"".concat(e.settings.charge)}),Object(n.jsx)(S.a,{id:"charge",name:"charge",value:e.settings.charge,min:e.defaults.chargeRange.min,max:e.defaults.chargeRange.max,step:e.defaults.chargeRange.step,onChange:a("charge"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:M}),Object(n.jsx)(O.a,{className:t.range,id:"gravity",name:"gravity",gutterBottom:!0,children:"GRAVITY"}),Object(n.jsx)(O.a,{className:t.range,gutterBottom:!0,children:"".concat(e.settings.gravity)}),Object(n.jsx)(S.a,{id:"gravity",name:"gravity",value:e.settings.gravity,min:e.defaults.gravityRange.min,max:e.defaults.gravityRange.max,step:e.defaults.gravityRange.step,onChange:a("gravity"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:M})]})]})})},T=a(48),D=a(118),B=a(112),I=a(113),A=a(111),L=Object(m.a)((function(e){return{root:{border:0,flexGrow:2},appBar:{border:0,backgroundColor:"white",marginBottom:e.spacing(1)},grid:{border:0,display:"flex",alignItems:"stretch"},gridItem:{border:0,margin:e.spacing(1)},gridHeader:{padding:e.spacing(1),border:0,marginBottom:e.spacing(1)},paper:{padding:e.spacing(1),outlined:!0,variant:"outlined"},timelineError:{textAlign:"center",border:"2px solid red",color:"red",backgroundColor:"white"},card:{alignSelf:"center"},profileImage:{marginBottom:e.spacing(1)},bannerImage:{marginBottom:e.spacing(1)},icon:{borderRadius:"50%",width:16,height:16,boxShadow:"inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)",backgroundColor:"#f5f8fa",backgroundImage:"linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))","$root.Mui-focusVisible &":{outline:"2px auto rgba(19,124,189,.6)",outlineOffset:2},"input:hover ~ &":{backgroundColor:"#ebf1f5"},"input:disabled ~ &":{boxShadow:"none",background:"rgba(206,217,224,.5)"}},checkedIcon:{backgroundColor:"#137cbd",backgroundImage:"linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))","&:before":{display:"block",width:16,height:16,backgroundImage:"radial-gradient(#fff,#fff 28%,transparent 32%)",content:'""'},"input:hover ~ &":{backgroundColor:"#106ba3"}},selectCategory:{border:"1px solid darkgray",borderRadius:e.shape.borderRadius,fontSize:"0.9rem",padding:e.spacing(1),marginBottom:e.spacing(1)},radioGroupCategory:{maxWidth:"90%",fontSize:"0.5rem",padding:e.spacing(2),marginBottom:e.spacing(1)},checkbox:{color:f.a[400],"&$checked":{color:f.a[600]}},checked:{},radioButtonLabel:{fontSize:"0.9rem"},radioButton:{},table:{maxWidth:"95%",align:"center",padding:e.spacing(1)},tableHead:{backgroundColor:"#ddeeee"},tableCell:{},tableCategorized:{backgroundColor:"#ddeeee"},tableRowGreen:{backgroundColor:"lightgreen"},statusBar:{raised:!1,backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{color:"blue"},search:Object(u.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"#ddeeee"},marginRight:e.spacing(1),width:"100%"},e.breakpoints.up("sm"),{width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(u.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white",marginBottom:e.spacing(1)},category:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),marginBottom:e.spacing(1)},left:{backgroundColor:"blue",color:"white"},neutral:{backgroundColor:"darkgray",color:"white"},right:{backgroundColor:"red",color:"white"},positive:{backgroundColor:"green",color:"white"},negative:{backgroundColor:"yellow",color:"black"},none:{backgroundColor:"white",color:"black"},ignored:{backgroundColor:"yellow",color:"black"}}}));function z(e){return Object(n.jsxs)(D.a,{display:"flex",alignItems:"center",children:[Object(n.jsx)(D.a,{width:"100%",mr:1,children:Object(n.jsx)(A.a,Object(T.a)({variant:"determinate"},e))}),Object(n.jsx)(D.a,{minWidth:35,children:Object(n.jsx)(O.a,{variant:"body2",color:"textSecondary",children:"".concat(Math.round(e.value))})})]})}var P=function(e){console.log(e);var t=L();return Object(n.jsx)(n.Fragment,{children:Object(n.jsxs)(y.a,{className:t.grid,children:[Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:4,children:Object(n.jsx)(B.a,{className:t.card,variant:"outlined",children:Object(n.jsxs)(I.a,{children:[Object(n.jsx)(O.a,{variant:"h6",id:"neuralNetworks",name:"neuralNetworks",gutterBottom:!0,children:"NEURAL NETWORKS"}),Object(n.jsxs)(O.a,{children:["BEST: ",e.heartbeat.bestNetwork.networkId]}),Object(n.jsxs)(O.a,{children:["LIVE RATE: ",e.heartbeat.bestNetwork.runtimeMatchRate.toFixed(2),"%"]}),Object(n.jsxs)(O.a,{children:["SUCCESS RATE: ",e.heartbeat.bestNetwork.successRate.toFixed(2),"%"]})]})})}),Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:4,children:Object(n.jsx)(B.a,{className:t.card,variant:"outlined",children:Object(n.jsxs)(I.a,{children:[Object(n.jsx)(O.a,{variant:"h6",id:"tweets",name:"tweets",gutterBottom:!0,children:"TWITTER"}),Object(n.jsx)(O.a,{id:"tweetsReceived",name:"tweetsReceived",gutterBottom:!0,children:Object(n.jsxs)("span",{children:[Object(n.jsx)("b",{children:e.heartbeat.twitter.tweetsReceived})," TWEETS RCVD"]})}),Object(n.jsx)(O.a,{id:"tweetsPerMin",name:"tweetsPerMin",gutterBottom:!0,children:Object(n.jsxs)("span",{children:[Object(n.jsx)("b",{children:e.heartbeat.twitter.tweetsPerMin})," TWEETS/MIN"]})}),Object(n.jsx)(O.a,{id:"maxTweetsPerMin",name:"maxTweetsPerMin",gutterBottom:!0,children:Object(n.jsxs)("span",{children:[Object(n.jsx)("b",{children:e.heartbeat.twitter.maxTweetsPerMin})," MAX TWEETS/MIN"]})}),Object(n.jsx)(z,{variant:"determinate",value:100*e.heartbeat.twitter.tweetsPerMin/e.heartbeat.twitter.maxTweetsPerMin})]})})}),Object(n.jsx)(y.a,{item:!0,className:t.gridItem,xs:4,children:Object(n.jsx)(B.a,{className:t.card,variant:"outlined",children:Object(n.jsxs)(I.a,{children:[Object(n.jsx)(O.a,{variant:"h6",id:"nodes",name:"nodes",gutterBottom:!0,children:"NODES"}),Object(n.jsx)(O.a,{className:t.range,id:"nodeCount",name:"nodeCount",gutterBottom:!0,children:Object(n.jsxs)("span",{children:[Object(n.jsx)("b",{children:e.heartbeat.nodeCount})," NODES"]})}),Object(n.jsx)(O.a,{className:t.range,id:"nodesPerMin",name:"nodesPerMin",gutterBottom:!0,children:Object(n.jsxs)("span",{children:[Object(n.jsx)("b",{children:e.heartbeat.nodesPerMin})," NODES/MIN"]})}),Object(n.jsx)(O.a,{className:t.range,id:"maxNodesPerMin",name:"maxNodesPerMin",gutterBottom:!0,children:Object(n.jsxs)("span",{children:[Object(n.jsx)("b",{children:e.heartbeat.maxNodesPerMin})," MAX NODES/MIN"]})}),Object(n.jsx)(z,{variant:"determinate",value:100*e.heartbeat.nodesPerMin/e.heartbeat.maxNodesPerMin})]})})})]})})},G="https://word.threeceelabs.com",U=window.opener;console.log({parentWindow:U});var V=Object(m.a)((function(e){return{root:{width:"100%",flexGrow:1,background:"black",boxShadow:0},appBar:{backgroundColor:"black",marginBottom:e.spacing(2),boxShadow:0},tabs:{color:"white"},tab:{minWidth:100,width:100},toolBar:{shadows:0},title:{color:"white",marginRight:e.spacing(2)},serverStatus:{fontSize:"0.85rem",flexGrow:1,color:"lightgray",padding:e.spacing(1)},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},inputRoot:{color:"primary"},inputInput:Object(u.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"})}})),W=function(e){var t=V(),a=Object(i.useState)(0),s=Object(g.a)(a,2),r=s[0],o=s[1],c=Object(i.useState)("settings"),d=Object(g.a)(c,2),l=d[0],m=d[1],f=Object(i.useRef)(l);Object(i.useEffect)((function(){f.current=l}),[l]);var R=Object(i.useState)(e.defaults),N=Object(g.a)(R,2),v=N[0],k=N[1],y=Object(i.useRef)(v);Object(i.useEffect)((function(){y.current=v}),[v]);var w=Object(i.useState)(e.settings),S=Object(g.a)(w,2),C=S[0],M=S[1],T=Object(i.useRef)(C);Object(i.useEffect)((function(){T.current=C}),[C]);var D=Object(i.useState)(e.status),B=Object(g.a)(D,2),I=B[0],A=B[1],L=Object(i.useRef)(I);Object(i.useEffect)((function(){L.current=I}),[I]);var z=Object(i.useState)(e.heartbeat),W=Object(g.a)(z,2),H=W[0],K=W[1],F=Object(i.useRef)(H);Object(i.useEffect)((function(){F.current=H}),[H]);var X,Y=function(e){var t={};switch(e.name){case"displayLinks":U&&U.postMessage({op:"UPDATE",id:e.name,value:e.value},G),t=Object.assign({},T.current,Object(u.a)({},e.name,e.value)),M(t);break;case"nodeRadiusRatio":case"fontSizeRatio":U&&U.postMessage({op:"UPDATE",id:e.name,min:e.value[0],max:e.value[1]},G),t=Object.assign({},T.current,Object(u.a)({},e.name,{min:e.value[0],max:e.value[1]})),M(t);break;case"linkStrength":case"linkDistance":case"nodeMaxAge":case"maxNodesLimit":case"charge":case"gravity":case"velocityDecay":U&&U.postMessage({op:"UPDATE",id:e.name,value:e.value},G),t=Object.assign({},T.current,Object(u.a)({},e.name,e.value)),M(t);break;default:console.error("UNKNOWN CHANGE NAME: ".concat(e.name))}};return window.addEventListener("message",(function(e){if(e.preventDefault(),e.origin===G){if(void 0!==e.data.op)switch(e.data.op){case"INIT":console.debug("CUSTOMIRZER INIT"),e.data.config&&e.data.config.defaults&&(k(e.data.config.defaults),console.log("defaultsRef.current \n ".concat(y.current))),e.data.config&&e.data.config.settings&&(M(e.data.config.settings),console.log("settingsRef.current \n ".concat(T.current))),e.data.status&&(A(e.data.status),console.log("statusRef.current \n ".concat(L.current)),console.log({statusRef:L}));break;case"CONFIG":e.data.config&&e.data.config.defaults&&(k(e.data.config.defaults),console.log("defaultsRef.current \n ".concat(y.current))),e.data.config&&e.data.config.settings&&(M(e.data.config.settings),console.log("settingsRef.current \n ".concat(T.current)));break;case"STATS":e.data.status&&A(e.data.status);break;case"HEARTBEAT":e.data.status&&K(e.data.status);break;default:console.error("*** ERROR | UNKNOWN MESSAGE | OP: ".concat(e.data.op))}}else console.error("RX MESSAGE | NOT TRUSTED SOURCE | ORIGIN: "+e.origin+" | DEFAULT_SOURCE: "+G)}),!1),Object(n.jsx)("div",{className:t.root,children:Object(n.jsxs)(b.a,{component:"main",maxWidth:!1,children:[Object(n.jsx)(h.a,{className:t.appBar,position:"static",children:Object(n.jsxs)(p.a,{className:t.toolBar,children:[Object(n.jsx)(O.a,{className:t.title,children:"CUSTOMIZE"}),Object(n.jsxs)(j.a,{className:t.tabs,value:r,onChange:function(e,t){switch(e.preventDefault(),t){case 0:m("settings");break;case 1:m("stats");break;default:m("settings")}o(t)},children:[Object(n.jsx)(x.a,{className:t.tab,label:"Settings"}),Object(n.jsx)(x.a,{className:t.tab,label:"Stats"})]})]})}),(X=l,"settings"===X?Object(n.jsx)(E,{defaults:y.current,settings:T.current,status:L.current,handleChange:Y}):Object(n.jsx)(P,{heartbeat:F.current}))]})})},H={nodeCount:0,nodesPerMin:0,maxNodesPerMin:0,maxNodesPerMinTime:1610097731559,bestNetwork:{networkId:"",inputsId:"",successRate:0,overallMatchRate:0,networkTechnology:"",numInputs:0,runtimeMatchRate:0,betterChild:!1,seedNetworkId:"",seedNetworkRes:0},twitter:{tweetsPerMin:0,maxTweetsPerMin:1,tweetsReceived:0,maxTweetsPerMinTime:1610098221597}};r.a.render(Object(n.jsx)(o.a,{children:Object(n.jsx)("div",{children:Object(n.jsxs)(c.c,{children:[Object(n.jsx)(c.a,{path:"/customize/settings",children:Object(n.jsx)(W,{defaults:l.defaults,settings:l.settings,status:{},heartbeat:H})}),Object(n.jsx)(c.a,{path:"/customize/stats",children:Object(n.jsx)(W,{defaults:l.defaults,settings:l.settings,status:{},heartbeat:H})}),Object(n.jsx)(c.a,{children:Object(n.jsx)(W,{defaults:l.defaults,settings:l.settings,status:{},heartbeat:H})})]})})}),document.getElementById("root"))}},[[76,1,2]]]);
//# sourceMappingURL=main.c7faf73a.chunk.js.map