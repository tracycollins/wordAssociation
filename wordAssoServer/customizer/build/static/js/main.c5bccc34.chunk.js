(this.webpackJsonpcustomizer=this.webpackJsonpcustomizer||[]).push([[0],{51:function(e,a,t){},52:function(e,a,t){},63:function(e,a,t){"use strict";t.r(a);var n=t(2),i=t(0),o=t(23),s=t.n(o),r=t(40),c=t(8),d=(t(51),{defaults:{maxNodesLimit:47,maxNodesLimitRange:{min:0,max:100,step:1},nodeMaxAge:.5,nodeMaxAgeRange:{min:0,max:2e4,step:1},velocityDecay:.5,velocityDecayRange:{min:0,max:1,step:.01},charge:-50,chargeRange:{min:-1e3,max:1e3,step:10},gravity:.001,gravityRange:{min:-.002,max:.002,step:1e-5},nodeRadiusRatioRange:{min:0,max:1,step:.001},nodeRadiusRatio:{min:.047,max:.47},fontSizeRatioRange:{min:0,max:1,step:.001},fontSizeRatio:{min:.047,max:.47}},settings:{nodeMaxAge:.5,maxNodesLimit:47,velocityDecay:.33,charge:-50,gravity:.001,nodeRadiusRatio:{min:.012,max:.345},fontSizeRatio:{min:.012,max:.345}}}),l=t(20),g=t(16),u=t(89),m=t(93),b=t(98),f=t(96),p=t(95),h=t(94),x=t(92),R=(t(52),t(35)),j=t(91),O=t(97),v=Object(u.a)((function(e){return{root:{border:0,flexGrow:2},range:{color:"white"}}}));function y(e){return"".concat(e,"\xb0C")}var N=function(e){var a=v(),t={nodeRadiusRatio:[e.settings.nodeRadiusRatio.min,e.settings.nodeRadiusRatio.max],fontSizeRatio:[e.settings.fontSizeRatio.min,e.settings.fontSizeRatio.max],metricMode:"rate",ageNodes:!0,autoCategoryFlag:!1,testMode:!1,pause:!1,charge:e.settings.charge,gravity:e.settings.gravity,velocityDecay:e.settings.velocityDecay,maxNodesLimit:e.settings.maxNodesLimit,nodeMaxAge:e.settings.nodeMaxAge},o=Object(i.useState)(t),s=Object(l.a)(o,2),r=s[0],c=s[1],d=function(a){return function(t,n){c((function(e){return Object(R.a)(Object(R.a)({},e),{},Object(g.a)({},a,n))})),e.handleChange({name:a,value:n})}};return Object(n.jsx)(n.Fragment,{children:Object(n.jsx)(j.a,{className:a.grid,children:Object(n.jsxs)(j.a,{item:!0,className:a.gridItem,xs:3,children:[Object(n.jsx)(x.a,{className:a.range,id:"nodeRadiusRatio",name:"nodeRadiusRatio",gutterBottom:!0,children:"NODE RADIUS RATIO min/max"}),Object(n.jsx)(O.a,{id:"nodeRadiusRatio",name:"nodeRadiusRatio",value:r.nodeRadiusRatio,min:e.defaults.nodeRadiusRatioRange.min,max:e.defaults.nodeRadiusRatioRange.max,step:e.defaults.nodeRadiusRatioRange.step,onChange:d("nodeRadiusRatio"),valueLabelDisplay:"auto","aria-labelledby":"range-slider",getAriaValueText:y}),Object(n.jsx)(x.a,{className:a.range,id:"fontSizeRatio",name:"fontSizeRatio",gutterBottom:!0,children:"FONT SIZE RATIO min/max"}),Object(n.jsx)(O.a,{id:"fontSizeRatio",name:"fontSizeRatio",value:r.fontSizeRatio,min:e.defaults.fontSizeRatioRange.min,max:e.defaults.fontSizeRatioRange.max,step:e.defaults.fontSizeRatioRange.step,onChange:d("fontSizeRatio"),valueLabelDisplay:"auto","aria-labelledby":"range-slider",getAriaValueText:y}),Object(n.jsx)(x.a,{className:a.range,id:"setMaxNodesLimit",name:"setMaxNodesLimit",gutterBottom:!0,children:"MAX NODES"}),Object(n.jsx)(O.a,{id:"maxNodesLimit",name:"maxNodesLimit",value:r.maxNodesLimit,min:e.defaults.maxNodesLimitRange.min,max:e.defaults.maxNodesLimitRange.max,step:e.defaults.maxNodesLimitRange.step,onChange:d("maxNodesLimit"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:y}),Object(n.jsx)(x.a,{className:a.range,id:"nodeMaxAge",name:"nodeMaxAge",gutterBottom:!0,children:"MAX AGE (seconds)"}),Object(n.jsx)(O.a,{id:"nodeMaxAge",name:"nodeMaxAge",value:r.nodeMaxAge,min:e.defaults.nodeMaxAgeRange.min,max:e.defaults.nodeMaxAgeRange.max,step:e.defaults.nodeMaxAgeRange.step,onChange:d("nodeMaxAge"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:y}),Object(n.jsx)(x.a,{className:a.range,id:"velocityDecay",name:"velocityDecay",gutterBottom:!0,children:"VELOCITY DECAY"}),Object(n.jsx)(O.a,{id:"velocityDecay",name:"velocityDecay",value:r.velocityDecay,min:e.defaults.velocityDecayRange.min,max:e.defaults.velocityDecayRange.max,step:e.defaults.velocityDecayRange.step,onChange:d("velocityDecay"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:y}),Object(n.jsx)(x.a,{className:a.range,id:"charge",name:"charge",gutterBottom:!0,children:"CHARGE"}),Object(n.jsx)(O.a,{id:"charge",name:"charge",value:r.charge,min:e.defaults.chargeRange.min,max:e.defaults.chargeRange.max,step:e.defaults.chargeRange.step,onChange:d("charge"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:y}),Object(n.jsx)(x.a,{className:a.range,id:"gravity",name:"gravity",gutterBottom:!0,children:"GRAVITY"}),Object(n.jsx)(O.a,{id:"gravity",name:"gravity",value:r.gravity,min:e.defaults.gravityRange.min,max:e.defaults.gravityRange.max,step:e.defaults.gravityRange.step,onChange:d("gravity"),valueLabelDisplay:"auto","aria-labelledby":"slider",getAriaValueText:y})]})})})},S=t(33),k=Object(u.a)((function(e){return{root:{border:0,flexGrow:2},appBar:{border:0,backgroundColor:"white",marginBottom:e.spacing(1)},grid:{border:0,display:"flex",alignItems:"stretch"},gridItem:{border:0,margin:e.spacing(1)},gridHeader:{padding:e.spacing(1),border:0,marginBottom:e.spacing(1)},paper:{outlined:!0,variant:"outlined"},card:{alignSelf:"center"},profileImage:{marginBottom:e.spacing(1)},bannerImage:{marginBottom:e.spacing(1)},icon:{borderRadius:"50%",width:16,height:16,boxShadow:"inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)",backgroundColor:"#f5f8fa",backgroundImage:"linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))","$root.Mui-focusVisible &":{outline:"2px auto rgba(19,124,189,.6)",outlineOffset:2},"input:hover ~ &":{backgroundColor:"#ebf1f5"},"input:disabled ~ &":{boxShadow:"none",background:"rgba(206,217,224,.5)"}},checkedIcon:{backgroundColor:"#137cbd",backgroundImage:"linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))","&:before":{display:"block",width:16,height:16,backgroundImage:"radial-gradient(#fff,#fff 28%,transparent 32%)",content:'""'},"input:hover ~ &":{backgroundColor:"#106ba3"}},selectCategory:{fontSize:"0.9rem",borderRadius:e.shape.borderRadius,padding:e.spacing(1),marginBottom:e.spacing(1)},radioGroupCategory:{maxWidth:"90%",fontSize:"0.5rem",padding:e.spacing(2),marginBottom:e.spacing(1)},checkbox:{color:S.a[400],"&$checked":{color:S.a[600]}},checked:{},radioButtonLabel:{fontSize:"0.9rem"},radioButton:{},table:{maxWidth:"90%",padding:e.spacing(1)},tableHead:{backgroundColor:"#ddeeee"},tableCell:{},tableCategorized:{backgroundColor:"#ddeeee"},tableRowGreen:{backgroundColor:"lightgreen"},statusBar:{raised:!1,backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},title:{color:"blue"},search:Object(g.a)({position:"relative",borderRadius:e.shape.borderRadius,backgroundColor:"white","&:hover":{backgroundColor:"#ddeeee"},marginRight:e.spacing(1),width:"100%"},e.breakpoints.up("sm"),{width:"auto"}),searchIcon:{padding:e.spacing(0,2),height:"100%",position:"absolute",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"},inputRoot:{color:"primary"},inputInput:Object(g.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"}),buttonGroupLabel:{color:"blue",marginRight:e.spacing(1)},buttonAll:{color:"black"},buttonLeft:{color:"blue"},buttonNeutral:{color:"gray"},buttonRight:{color:"red"},buttonMismatch:{margin:5},autoCategory:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),color:"white",marginBottom:e.spacing(1)},category:{borderRadius:e.shape.borderRadius,padding:e.spacing(1),marginBottom:e.spacing(1)},left:{backgroundColor:"blue",color:"white"},neutral:{backgroundColor:"darkgray",color:"white"},right:{backgroundColor:"red",color:"white"},positive:{backgroundColor:"green",color:"white"},negative:{backgroundColor:"yellow",color:"black"},none:{backgroundColor:"lightgray",color:"black"},ignored:{backgroundColor:"yellow",color:"black"}}})),C=function(e){var a=k();return Object(n.jsx)(n.Fragment,{children:Object(n.jsx)(j.a,{className:a.grid,children:Object(n.jsx)(j.a,{item:!0,className:a.gridItem,xs:3})})})},w="https://word.threeceelabs.com",A=window.opener;console.log({parentWindow:A});var E=Object(u.a)((function(e){return{root:{width:"100%",flexGrow:1,background:"black",boxShadow:0},appBar:{backgroundColor:"black",marginBottom:e.spacing(2),boxShadow:0},tabs:{color:"white"},tab:{minWidth:100,width:100},toolBar:{shadows:0},title:{color:"white",marginRight:e.spacing(2)},serverStatus:{fontSize:"0.85rem",flexGrow:1,color:"lightgray",padding:e.spacing(1)},statusBar:{backgroundColor:"white",margin:2},menuButton:{marginRight:e.spacing(2)},inputRoot:{color:"primary"},inputInput:Object(g.a)({padding:e.spacing(1,1,1,0),paddingLeft:"calc(1em + ".concat(e.spacing(4),"px)"),transition:e.transitions.create("width"),width:"100%"},e.breakpoints.up("md"),{width:"20ch"})}})),D=function(e){var a=E(),t=Object(i.useState)(0),o=Object(l.a)(t,2),s=o[0],r=o[1],c=Object(i.useState)("settings"),d=Object(l.a)(c,2),u=d[0],R=d[1],j=Object(i.useRef)(u);Object(i.useEffect)((function(){j.current=u}),[u]);var O=Object(i.useState)(e.defaults),v=Object(l.a)(O,2),y=v[0],S=v[1],k=Object(i.useRef)(y);Object(i.useEffect)((function(){k.current=y}),[y]);var D=Object(i.useState)(e.settings),I=Object(l.a)(D,2),L=I[0],M=I[1],B=Object(i.useRef)(L);Object(i.useEffect)((function(){B.current=L}),[L]);var T=Object(i.useState)(e.status),z=Object(l.a)(T,2),G=z[0],U=z[1],V=Object(i.useRef)(G);Object(i.useEffect)((function(){V.current=G}),[G]);var W,F=function(e){var a={};switch(e.name){case"nodeRadiusRatio":case"fontSizeRatio":A&&A.postMessage({op:"UPDATE",id:e.name,min:e.value[0],max:e.value[1]},w),a=Object.assign({},B.current,Object(g.a)({},e.name,{min:e.value[0],max:e.value[1]})),M(a);break;case"nodeMaxAge":case"maxNodesLimit":case"charge":case"gravity":case"velocityDecay":A&&A.postMessage({op:"UPDATE",id:e.name,value:e.value},w),a=Object.assign({},B.current,Object(g.a)({},e.name,e.value)),M(a);break;default:console.error("UNKNOWN CHANGE NAME: ".concat(e.name))}};return window.addEventListener("message",(function(e){if(e.origin===w){if(void 0!==e.data.op)switch(console.debug("RX MESSAGE | SOURCE | ORIGIN: "+e.origin+" | PARENT WINDOW: "+A.PARENT_ID+" | DEFAULT_SOURCE: "+w),e.data.op){case"INIT":console.debug("CUSTOMIRZER INIT"),e.data.config&&e.data.config.defaults&&(S(e.data.config.defaults),console.log("defaultsRef.current \n ".concat(k.current))),e.data.config&&e.data.config.settings&&(M(e.data.config.settings),console.log("settingsRef.current \n ".concat(B.current))),e.data.status&&(U(e.data.status),console.log("statusRef.current \n ".concat(V.current)));break;case"CONFIG":e.data.config&&e.data.config.defaults&&(S(e.data.config.defaults),console.log("defaultsRef.current \n ".concat(k.current))),e.data.config&&e.data.config.settings&&(M(e.data.config.settings),console.log("settingsRef.current \n ".concat(B.current)));break;case"STATS":e.data.stats&&(U(e.data.stats),console.log("statusRef.current \n ".concat(V.current)));break;default:console.error("*** ERROR | UNKNOWN MESSAGE | OP: ".concat(e.data.op))}}else console.error("RX MESSAGE | NOT TRUSTED SOURCE | ORIGIN: "+e.origin+" | DEFAULT_SOURCE: "+w)}),!1),Object(n.jsx)("div",{className:a.root,children:Object(n.jsxs)(m.a,{component:"main",maxWidth:!1,children:[Object(n.jsx)(b.a,{className:a.appBar,position:"static",children:Object(n.jsxs)(h.a,{className:a.toolBar,children:[Object(n.jsx)(x.a,{className:a.title,children:"CUSTOMIZE"}),Object(n.jsxs)(f.a,{className:a.tabs,value:s,onChange:function(e,a){switch(e.preventDefault(),console.log({newValue:a}),a){case 0:R("settings");break;case 1:R("stats");break;default:R("settings")}r(a)},children:[Object(n.jsx)(p.a,{className:a.tab,label:"Settings"}),Object(n.jsx)(p.a,{className:a.tab,label:"Stats"})]})]})}),(W=u,"settings"===W?Object(n.jsx)(N,{defaults:k.current,settings:B.current,status:V.current,handleChange:F}):Object(n.jsx)(C,{settings:L,stats:G}))]})})};s.a.render(Object(n.jsx)(r.a,{children:Object(n.jsx)("div",{children:Object(n.jsxs)(c.c,{children:[Object(n.jsx)(c.a,{path:"/customize/settings",children:Object(n.jsx)(D,{defaults:d.defaults,settings:d.settings,status:{}})}),Object(n.jsx)(c.a,{path:"/customize/stats",children:Object(n.jsx)(D,{defaults:d.defaults,settings:d.settings,status:{}})}),Object(n.jsx)(c.a,{children:Object(n.jsx)(D,{defaults:d.defaults,settings:d.settings,status:{}})})]})})}),document.getElementById("root"))}},[[63,1,2]]]);
//# sourceMappingURL=main.c5bccc34.chunk.js.map