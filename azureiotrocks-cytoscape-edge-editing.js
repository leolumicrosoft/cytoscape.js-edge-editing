!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.cytoscapeEdgeEditing=t():e.cytoscapeEdgeEditing=t()}(window,(function(){return function(e){var t={};function n(o){if(t[o])return t[o].exports;var i=t[o]={i:o,l:!1,exports:{}};return e[o].call(i.exports,i,i.exports,n),i.l=!0,i.exports}return n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(o,i,function(t){return e[t]}.bind(null,i));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=2)}([function(e,t,n){"use strict";var o={currentCtxEdge:void 0,currentCtxPos:void 0,currentAnchorIndex:void 0,currentEdgesForFixAnchorPositions:void 0,ignoredClasses:void 0,setIgnoredClasses:function(e){this.ignoredClasses=e},syntax:{bend:{edge:"segments",class:"edgebendediting-hasbendpoints",multiClass:"edgebendediting-hasmultiplebendpoints",weight:"cyedgebendeditingWeights",distance:"cyedgebendeditingDistances",weightCss:"segment-weights",distanceCss:"segment-distances",pointPos:"bendPointPositions",bendAnchorsAbsolutePosition:"bendAnchorsAbsolutePosition"},control:{edge:"unbundled-bezier",class:"edgecontrolediting-hascontrolpoints",multiClass:"edgecontrolediting-hasmultiplecontrolpoints",weight:"cyedgecontroleditingWeights",distance:"cyedgecontroleditingDistances",weightCss:"control-point-weights",distanceCss:"control-point-distances",pointPos:"controlPointPositions"}},getEdgeType:function(e){return e?e.hasClass(this.syntax.bend.class)?"bend":e.hasClass(this.syntax.control.class)?"control":e.css("curve-style")===this.syntax.bend.edge?"bend":e.css("curve-style")===this.syntax.control.edge?"control":e.data(this.syntax.bend.pointPos)&&e.data(this.syntax.bend.pointPos).length>0?"bend":e.data(this.syntax.control.pointPos)&&e.data(this.syntax.control.pointPos).length>0?"control":"inconclusive":"inconclusive"},initAnchorPoints:function(e,t,n){for(var o=0;o<n.length;o++){var i=n[o],s=this.getEdgeType(i);if("inconclusive"!==s&&!this.isIgnoredEdge(i)){var a;"bend"===s?a=e.apply(this,i):"control"===s&&(a=t.apply(this,i));var d=this.convertToRelativePositions(i,a);d.distances.length>0&&(i.data(this.syntax[s].weight,d.weights),i.data(this.syntax[s].distance,d.distances),i.addClass(this.syntax[s].class),d.distances.length>1&&i.addClass(this.syntax[s].multiClass))}}},isIgnoredEdge:function(e){var t=e.source().position("x"),n=e.source().position("y"),o=e.target().position("x"),i=e.target().position("y");if(t==o&&n==i||e.source().id()==e.target().id())return!0;for(var s=0;this.ignoredClasses&&s<this.ignoredClasses.length;s++)if(e.hasClass(this.ignoredClasses[s]))return!0;return!1},getLineDirection:function(e,t){e.y,e.x,t.y,t.x;var n=function(e,t){return Math.abs(e-t)<1e-4};return n(e.y,t.y)&&e.x<t.x?1:e.y<t.y&&e.x<t.x?2:e.y<t.y&&n(e.x,t.x)?3:e.y<t.y&&e.x>t.x?4:n(e.y,t.y)&&e.x>t.x?5:e.y>t.y&&e.x>t.x?6:e.y>t.y&&n(e.x,t.x)?7:8},getSrcTgtPointsAndTangents:function(e){var t=e.source(),n=e.target(),o=(n.position(),t.position(),t.position()),i=n.position(),s=(i.y-o.y)/(i.x-o.x);return{m1:s,m2:-1/s,srcPoint:o,tgtPoint:i}},getIntersection:function(e,t,n){void 0===n&&(n=this.getSrcTgtPointsAndTangents(e));var o,i,s=n.srcPoint,a=(n.tgtPoint,n.m1),d=n.m2;if(a==1/0||a==-1/0)o=s.x,i=t.y;else if(Math.abs(a)<1e-7)o=t.x,i=s.y;else{var r=s.y-a*s.x;i=a*(o=(t.y-d*t.x-r)/(a-d))+r}return{x:o,y:i}},getAnchorsAsArray:function(e){var t=this.getEdgeType(e);if("inconclusive"!==t&&e.css("curve-style")===this.syntax[t].edge){for(var n=[],o=e.pstyle(this.syntax[t].weightCss)?e.pstyle(this.syntax[t].weightCss).pfValue:[],i=e.pstyle(this.syntax[t].distanceCss)?e.pstyle(this.syntax[t].distanceCss).pfValue:[],s=Math.min(o.length,i.length),a=0;a<s;a++){var d=this.convertToAnchorAbsolutePositions(e,t,a);n.push(d.x,d.y)}return n}},resetAnchorsAbsolutePosition:function(){this.currentEdgesForFixAnchorPositions=void 0},storeAnchorsAbsolutePosition:function(e){var t=this,n=e.connectedEdges(),o=e.edgesWith(e);(n=n.unmerge(o)).forEach((function(e){var n=t.getAnchorsAsArray(e);if(void 0!==n){for(var o=[],i=0;i<n.length;i+=2)o.push({x:n[i],y:n[i+1]});e.data(t.syntax.bend.bendAnchorsAbsolutePosition,o)}})),this.currentEdgesForFixAnchorPositions=n},keepAnchorsAbsolutePositionDuringMoving:function(){var e=this;void 0!==this.currentEdgesForFixAnchorPositions&&this.currentEdgesForFixAnchorPositions.forEach((function(t){var n=t.data(e.syntax.bend.bendAnchorsAbsolutePosition);if((o=e.convertToRelativePositions(t,n)).distances<0)var o=e.convertToRelativePositions(t,n);o.distances.length>0&&(t.data(e.syntax.bend.weight,o.weights),t.data(e.syntax.bend.distance,o.distances))}))},convertToAnchorAbsolutePositions:function(e,t,n){var o=e.source().position(),i=e.target().position(),s=e.data(this.syntax[t].weight),a=e.data(this.syntax[t].distance),d=s[n],r=a[n],c=i.y-o.y,l=i.x-o.x,g=Math.sqrt(l*l+c*c),h={x:l/g,y:c/g},u=-h.y,y=h.x,v=1-d,f=d;return{x:o.x*v+i.x*f+u*r,y:o.y*v+i.y*f+y*r}},obtainPrevAnchorAbsolutePositions:function(e,t,n){return n<=0?e.source().position():this.convertToAnchorAbsolutePositions(e,t,n-1)},obtainNextAnchorAbsolutePositions:function(e,t,n){var o=e.data(this.syntax[t].weight),i=e.data(this.syntax[t].distance);return n>=Math.min(o.length,i.length)-1?e.target().position():this.convertToAnchorAbsolutePositions(e,t,n+1)},convertToRelativePosition:function(e,t,n){void 0===n&&(n=this.getSrcTgtPointsAndTangents(e));var o,i=this.getIntersection(e,t,n),s=i.x,a=i.y,d=n.srcPoint,r=n.tgtPoint;o=s!=d.x?(s-d.x)/(r.x-d.x):a!=d.y?(a-d.y)/(r.y-d.y):0;var c=Math.sqrt(Math.pow(a-t.y,2)+Math.pow(s-t.x,2)),l=this.getLineDirection(d,r),g=this.getLineDirection(i,t);return l-g!=-2&&l-g!=6&&0!=c&&(c*=-1),{weight:o,distance:c}},convertToRelativePositions:function(e,t){for(var n=this.getSrcTgtPointsAndTangents(e),o=[],i=[],s=0;t&&s<t.length;s++){var a=t[s],d=this.convertToRelativePosition(e,a,n);o.push(d.weight),i.push(d.distance)}return{weights:o,distances:i}},getDistancesString:function(e,t){for(var n="",o=e.data(this.syntax[t].distance),i=0;o&&i<o.length;i++)n=n+" "+o[i];return n},getWeightsString:function(e,t){for(var n="",o=e.data(this.syntax[t].weight),i=0;o&&i<o.length;i++)n=n+" "+o[i];return n},addAnchorPoint:function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:void 0;void 0!==e&&void 0!==t||(e=this.currentCtxEdge,t=this.currentCtxPos),void 0===n&&(n=this.getEdgeType(e));for(var o,i=this.syntax[n].weight,s=this.syntax[n].distance,a=this.convertToRelativePosition(e,t),d=a.weight,r=e.source().position("x"),c=e.source().position("y"),l=e.target().position("x"),g=e.target().position("y"),h=this.convertToRelativePosition(e,{x:r,y:c}).weight,u=this.convertToRelativePosition(e,{x:l,y:g}).weight,y=[h].concat(e.data(i)?e.data(i):[]).concat([u]),v=this.getAnchorsAsArray(e),f=1/0,p=[r,c].concat(v||[]).concat([l,g]),x=-1,m=0;m<y.length-1;m++){var b=y[m],A=y[m+1],P=this.compareWithPrecision(d,b,!0),M=this.compareWithPrecision(d,A),w=this.compareWithPrecision(d,A,!0),E=this.compareWithPrecision(d,b);if(P&&M||w&&E){var C={x:r=p[2*m],y:c=p[2*m+1]},T={x:l=p[2*m+2],y:g=p[2*m+3]},S=(c-g)/(r-l),I=-1/S,R={srcPoint:C,tgtPoint:T,m1:S,m2:I},F=this.getIntersection(e,t,R),D=Math.sqrt(Math.pow(t.x-F.x,2)+Math.pow(t.y-F.y,2));D<f&&(f=D,o=F,x=m)}}void 0!==o&&(t=o),a=this.convertToRelativePosition(e,t),void 0===o&&(a.distance=0);var k=e.data(i),z=e.data(s);return z=z||[],0===(k=k||[]).length&&(x=0),-1!=x&&(k.splice(x,0,a.weight),z.splice(x,0,a.distance)),e.data(i,k),e.data(s,z),e.addClass(this.syntax[n].class),(k.length>1||z.length>1)&&e.addClass(this.syntax[n].multiClass),x},removeAnchor:function(e,t){void 0!==e&&void 0!==t||(e=this.currentCtxEdge,t=this.currentAnchorIndex);var n=this.getEdgeType(e);if(!this.edgeTypeInconclusiveShouldntHappen(n,"anchorPointUtilities.js, removeAnchor")){var o=this.syntax[n].weight,i=this.syntax[n].distance,s=this.syntax[n].pointPos,a=e.data(o),d=e.data(i),r=e.data(s);a.splice(t,1),d.splice(t,1),r&&r.splice(t,1),1==a.length||1==d.length?e.removeClass(this.syntax[n].multiClass):0==a.length||0==d.length?(e.removeClass(this.syntax[n].class),e.data(o,[]),e.data(i,[])):(e.data(o,a),e.data(i,d))}},removeAllAnchors:function(e){void 0===e&&(e=this.currentCtxEdge);var t=this.getEdgeType(e);if(!this.edgeTypeInconclusiveShouldntHappen(t,"anchorPointUtilities.js, removeAllAnchors")){e.removeClass(this.syntax[t].class),e.removeClass(this.syntax[t].multiClass);var n=this.syntax[t].weight,o=this.syntax[t].distance,i=this.syntax[t].pointPos;e.data(n,[]),e.data(o,[]),e.data(i)&&e.data(i,[])}},calculateDistance:function(e,t){var n=e.x-t.x,o=e.y-t.y;return Math.sqrt(Math.pow(n,2)+Math.pow(o,2))},compareWithPrecision:function(e,t){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2],o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:.01,i=e-t;return Math.abs(i)<=o||(n?e<t:e>t)},edgeTypeInconclusiveShouldntHappen:function(e,t){return"inconclusive"===e&&(console.log("In "+t+": edge type inconclusive should never happen here!!"),!0)}};e.exports=o},function(e,t,n){"use strict";var o,i,s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},a=(o=Math.max,i=Date.now||function(){return(new Date).getTime()},function(e,t,n){var a,d,r,c,l,g,h,u,y,v=0,f=!1,p=!0;if("function"!=typeof e)throw new TypeError("Expected a function");if(t=t<0?0:+t||0,!0===n){var x=!0;p=!1}else y=void 0===(u=n)?"undefined":s(u),!u||"object"!=y&&"function"!=y||(x=!!n.leading,f="maxWait"in n&&o(+n.maxWait||0,t),p="trailing"in n?!!n.trailing:p);function m(t,n){n&&clearTimeout(n),d=g=h=void 0,t&&(v=i(),r=e.apply(l,a),g||d||(a=l=void 0))}function b(){var e=t-(i()-c);e<=0||e>t?m(h,d):g=setTimeout(b,e)}function A(){m(p,g)}function P(){if(a=arguments,c=i(),l=this,h=p&&(g||!x),!1===f)var n=x&&!g;else{d||x||(v=c);var o=f-(c-v),s=o<=0||o>f;s?(d&&(d=clearTimeout(d)),v=c,r=e.apply(l,a)):d||(d=setTimeout(A,o))}return s&&g?g=clearTimeout(g):g||t===f||(g=setTimeout(b,t)),n&&(s=!0,r=e.apply(l,a)),!s||g||d||(a=l=void 0),r}return P.cancel=function(){g&&clearTimeout(g),d&&clearTimeout(d),v=0,d=g=h=void 0},P});e.exports=a},function(e,t,n){"use strict";var o,i,s;i=n(0),n(1),s=function(e,t,o){var s=n(3);if(e&&t&&o){var a,d={bendPositionsFunction:function(e){return e.data("bendPointPositions")},controlPositionsFunction:function(e){return e.data("controlPointPositions")},initAnchorsAutomatically:!0,ignoredClasses:[],undoable:!1,anchorShapeSizeFactor:3,zIndex:999,enabled:!0,bendRemovalSensitivity:8,addBendMenuItemTitle:"Add Bend Point",removeBendMenuItemTitle:"Remove Bend Point",removeAllBendMenuItemTitle:"Remove All Bend Points",addControlMenuItemTitle:"Add Control Point",removeControlMenuItemTitle:"Remove Control Point",removeAllControlMenuItemTitle:"Remove All Control Points",moveSelectedAnchorsOnKeyEvents:function(){return!0},enableMultipleAnchorRemovalOption:!1,enableAnchorSizeNotImpactByZoom:!1,enableCreateAnchorOnDrag:!0,stickyAnchorTolerence:-1,enableRemoveAnchorMidOfNearLine:!0,enableAnchorsAbsolutePosition:!1,disableReconnect:!1},r=!1;e("core","edgeEditing",(function(e){var t=this;if("initialized"===e)return r;if("get"!==e){if(a=function(e,t){var n={};for(var o in e)n[o]=e[o];for(var o in t)if("bendRemovalSensitivity"==o){var i=t[o];isNaN(i)||(n[o]=i>=0&&i<=20?t[o]:i<0?0:20)}else n[o]=t[o];return n}(d,e),r=!0,t.style().selector(".edgebendediting-hasbendpoints").css({"curve-style":"segments","segment-distances":function(e){return i.getDistancesString(e,"bend")},"segment-weights":function(e){return i.getWeightsString(e,"bend")},"edge-distances":"node-position"}),t.style().selector(".edgecontrolediting-hascontrolpoints").css({"curve-style":"unbundled-bezier","control-point-distances":function(e){return i.getDistancesString(e,"control")},"control-point-weights":function(e){return i.getWeightsString(e,"control")},"edge-distances":"node-position"}),i.setIgnoredClasses(a.ignoredClasses),a.initAnchorsAutomatically&&i.initAnchorPoints(a.bendPositionsFunction,a.controlPositionsFunction,t.edges(),a.ignoredClasses),a.enableAnchorsAbsolutePosition){var n=t.edgeEditing("get"),o=function(e){n.keepAnchorsAbsolutePositionDuringMoving()},c=function(){t.once("grab",(function(e){var n=t.collection();e.target.isNode()&&n.merge(e.target),t.$(":selected").forEach((function(e){e.isNode()&&n.merge(e)})),t.edgeEditing("get").storeAnchorsAbsolutePosition(n),t.on("tapdrag",o),l()}))},l=function(){t.once("free",(function(e){t.edgeEditing("get").resetAnchorsAbsolutePosition(),c(),t.removeListener("tapdrag",o)}))};c()}a.enabled?s(a,t):s("unbind",t)}return n=r?{getAnchorsAsArray:function(e){return i.getAnchorsAsArray(e)},storeAnchorsAbsolutePosition:function(e){i.storeAnchorsAbsolutePosition(e)},resetAnchorsAbsolutePosition:function(){i.resetAnchorsAbsolutePosition()},keepAnchorsAbsolutePositionDuringMoving:function(){i.keepAnchorsAbsolutePositionDuringMoving()},initAnchorPoints:function(e){i.initAnchorPoints(a.bendPositionsFunction,a.controlPositionsFunction,e)},deleteSelectedAnchor:function(e,t){i.removeAnchor(e,t)}}:void 0}))}},e.exports&&(e.exports=s),void 0===(o=function(){return s}.call(t,n,t,e))||(e.exports=o),"undefined"!=typeof cytoscape&&$&&Konva&&s(cytoscape,$,Konva)},function(e,t,n){"use strict";var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},i=n(1),s=n(0),a=n(4),d=n(5),r=0;e.exports=function(e,t){var n,c,l,g,h,u,y,v,f,p,x,m,b,A,P,M,w,E,C,T,S,I=e,R="cy-edge-bend-editing-cxt-add-bend-point"+r,F="cy-edge-bend-editing-cxt-remove-bend-point"+r,D="cy-edge-bend-editing-cxt-remove-multiple-bend-point"+r,k="cy-edge-control-editing-cxt-add-control-point"+r,z="cy-edge-control-editing-cxt-remove-control-point"+r,O="cy-edge-bend-editing-cxt-remove-multiple-control-point"+r,B=null,W=null,K=!1,N={init:function(){d(t,s,e);var o=e,I=$(this),N="cy-node-edge-editing-stage"+r;r++;var L,j,_=$('<div id="'+N+'"></div>');I.find("#"+N).length<1&&I.append(_),(L=Konva.stages.length<r?new Konva.Stage({id:"node-edge-editing-stage",container:N,width:I.width(),height:I.height()}):Konva.stages[r-1]).getChildren().length<1?(j=new Konva.Layer,L.add(j)):j=L.getChildren()[0];var H={edge:void 0,edgeType:"inconclusive",anchors:[],touchedAnchor:void 0,touchedAnchorIndex:void 0,bindListeners:function(e){e.on("mousedown touchstart",this.eMouseDown)},unbindListeners:function(e){e.off("mousedown touchstart",this.eMouseDown)},eMouseDown:function(e){if(K=!0,H.touchedAnchor=e.target,S=!1,H.edge){t.autounselectify(!1),H.edge.unselect();var n=s.syntax[H.edgeType].weight,o=s.syntax[H.edgeType].distance,i=H.edge;pe={edge:i,type:H.edgeType,weights:i.data(n)?[].concat(i.data(n)):[],distances:i.data(o)?[].concat(i.data(o)):[]}}else if(H.node){var a=H.node;null==a.data("originalWidth")&&(a.data("originalWidth",a.width()),a.data("originalHeight",a.height())),a.addClass("edgebendediting_scaleRotate"),pe={node:a,dragStartX:e.evt.offsetX,dragStartY:e.evt.offsetY,originalScaleFactor:a.data("scaleFactor")||1,originalRotateAngle:a.data("rotateAngle")||0,isScaleHandle:e.target.attrs.scaleHandle}}!function(){E=t.style()._private.coreStyle["active-bg-opacity"]?t.style()._private.coreStyle["active-bg-opacity"].value:.15;t.style().selector("core").style("active-bg-opacity",0).update()}(),ce(),t.autoungrabify(!0),j.getStage().on("contentTouchend contentMouseup",H.eMouseUp),j.getStage().on("contentMouseout",H.eMouseOut)},eMouseUp:function(e){K=!1,H.touchedAnchor=void 0,S=!1,H.edge&&H.edge.select(),H.node&&H.node.select(),t.style().selector("core").style("active-bg-opacity",E).update(),le(),H.edge&&t.autounselectify(!0),t.autoungrabify(!1),j.getStage().off("contentTouchend contentMouseup",H.eMouseUp),j.getStage().off("contentMouseout",H.eMouseOut)},eMouseOut:function(e){S=!0},clearAnchorsExcept:function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:void 0,n=!1;this.anchors.forEach((function(o,i){t&&o===t?n=!0:(e.unbindListeners(o),o.destroy())})),n?this.anchors=[t]:(this.anchors=[],this.edge=void 0,this.edgeType="inconclusive")},renderAnchorShapesForNode:function(e){this.node=e,this.edge=void 0;var n=e.position(),o=e.width(),i=e.height(),s=e.data("rotateAngle")||0,a=-o/2,d=-i/2,r=a*Math.cos(s)-d*Math.sin(s),c=a*Math.sin(s)+d*Math.cos(s),l={x:n.x+r,y:n.y+c},g=function(e){for(var t=e.pstyle("shape-rotation").value,n=Math.cos(t),o=Math.sin(t),i=e.width()/2,s=e.height()/2,a=[-i,-s,i,-s,i,s,-i,s],d=[],r=[],c=0;c<a.length;c+=2){var l=a[c],g=a[c+1],h=l*n-g*o,u=l*o+g*n;d.push(h),r.push(u)}return i=(Math.max.apply(Math,d)-Math.min.apply(Math,d))/2,s=(Math.max.apply(Math,r)-Math.min.apply(Math,r))/2,[i,s]}(e),h={x:n.x+g[0],y:n.y+g[1]},u=.65*function(){var e=oe().anchorShapeSizeFactor;if(oe().enableAnchorSizeNotImpactByZoom)var n=e/t.zoom();else n=e;return 15*n}()*t.zoom()/2,y=ie({x:l.x,y:l.y}),v=ie({x:h.x,y:h.y});B=new Konva.Arc({x:y.x,y:y.y,innerRadius:2*u/3,outerRadius:4*u/3,angle:120,rotation:165+s/Math.PI*180,fill:"orange"}),W=new Konva.Arrow({x:v.x,y:v.y,points:[0,0,.5*u,.5*u,.7*u,.7*u],fill:"orange",stroke:"orange",strokeWidth:12,scaleHandle:1}),this.anchors.push(B,W),this.bindListeners(B),this.bindListeners(W),j.add(B),j.add(W),j.draw()},renderAnchorShapes:function(e){if(this.edge=e,this.node=void 0,this.edgeType=s.getEdgeType(e),e.hasClass("edgebendediting-hasbendpoints")||e.hasClass("edgecontrolediting-hascontrolpoints")){for(var t=s.getAnchorsAsArray(e),n=.65*ae(e),o=(e.source().position(),e.target().position(),0);t&&o<t.length;o+=2){var i=t[o],a=t[o+1];this.renderAnchorShape(i,a,n)}j.draw()}},renderAnchorShape:function(e,n,o){var i=ie({x:e-o/2,y:n-o/2});o*=t.zoom();var s=new Konva.Rect({x:i.x,y:i.y,width:o,height:o,fill:"black",strokeWidth:0,draggable:!0});this.anchors.push(s),this.bindListeners(s),j.add(s)}},U=function(e,n){var o=e.target||e.cyTarget;if(!s.isIgnoredEdge(o)){var i,a,d,r,c=s.getEdgeType(o);"inconclusive"===c?(i=[],a=[]):(d=s.syntax[c].weight,r=s.syntax[c].distance,i=o.data(d)?[].concat(o.data(d)):o.data(d),a=o.data(r)?[].concat(o.data(r)):o.data(r));var l={edge:o,type:c,weights:i,distances:a};s.addAnchorPoint(void 0,void 0,n),oe().undoable&&t.undoRedo().do("changeAnchorPoints",l)}se(),o.select()},q=function(e){var n=H.edge,o=s.getEdgeType(n);if(!s.edgeTypeInconclusiveShouldntHappen(o,"UiUtilities.js, cxtRemoveAnchorFcn")){var i={edge:n,type:o,weights:[].concat(n.data(s.syntax[o].weight)),distances:[].concat(n.data(s.syntax[o].distance))};s.removeAnchor(),oe().undoable&&t.undoRedo().do("changeAnchorPoints",i),setTimeout((function(){se(),n.select()}),50)}},X=function(e){var n=H.edge,o=s.getEdgeType(n),i={edge:n,type:o,weights:[].concat(n.data(s.syntax[o].weight)),distances:[].concat(n.data(s.syntax[o].distance))};s.removeAllAnchors(),oe().undoable&&t.undoRedo().do("changeAnchorPoints",i),setTimeout((function(){se(),n.select()}),50)},Y=o.handleReconnectEdge,Z=o.validateEdge,V=o.actOnUnsuccessfulReconnection,G=[{id:R,content:o.addBendMenuItemTitle,selector:"edge",onClickFunction:function(e){U(e,"bend")}},{id:F,content:o.removeBendMenuItemTitle,selector:"edge",onClickFunction:q},{id:D,content:o.removeAllBendMenuItemTitle,selector:o.enableMultipleAnchorRemovalOption&&":selected.edgebendediting-hasmultiplebendpoints",onClickFunction:X},{id:k,content:o.addControlMenuItemTitle,selector:"edge",coreAsWell:!0,onClickFunction:function(e){U(e,"control")}},{id:z,content:o.removeControlMenuItemTitle,selector:"edge",coreAsWell:!0,onClickFunction:q},{id:O,content:o.removeAllControlMenuItemTitle,selector:o.enableMultipleAnchorRemovalOption&&":selected.edgecontrolediting-hasmultiplecontrolpoints",onClickFunction:X}];if(t.contextMenus){var J=t.contextMenus("get");J.isActive()?J.appendMenuItems(G):t.contextMenus({menuItems:G})}var Q=i((function(){_.attr("height",I.height()).attr("width",I.width()).css({position:"absolute",top:0,left:0,"z-index":oe().zIndex}),setTimeout((function(){var e=_.offset(),n=I.offset();_.css({top:-(e.top-n.top),left:-(e.left-n.left)}),j.getStage().setWidth(I.width()),j.getStage().setHeight(I.height()),t&&se()}),0)}),250);function ee(){Q()}ee(),$(window).bind("resize",(function(){ee()}));var te,ne=I.data("cyedgeediting");function oe(){return te||(te=I.data("cyedgeediting").options)}function ie(e){var n=t.pan(),o=t.zoom();return{x:e.x*o+n.x,y:e.y*o+n.y}}function se(){H.clearAnchorsExcept(H.touchedAnchor),null!==B&&(B.destroy(),B=null),null!==W&&(W.destroy(),W=null),j.draw(),C&&(H.renderAnchorShapes(C),function(e){if(!e)return;var n=s.getAnchorsAsArray(e);void 0===n&&(n=[]);var o=e.sourceEndpoint(),i=e.targetEndpoint();if(n.unshift(o.y),n.unshift(o.x),n.push(i.x),n.push(i.y),!n)return;var a={x:n[0],y:n[1]},d={x:n[n.length-2],y:n[n.length-1]},r={x:n[2],y:n[3]},c={x:n[n.length-4],y:n[n.length-3]},l=.65*ae(e);!function(e,n,o,i,s){var a=e.x-o/2,d=e.y-o/2,r=n.x-o/2,c=n.y-o/2,l=ie({x:a,y:d}),g=ie({x:r,y:c});o=o*t.zoom()/2;var h=i.x-o/2,u=i.y-o/2,y=s.x-o/2,v=s.y-o/2,f=ie({x:h,y:u}),p=ie({x:y,y:v}),x=o,m=Math.sqrt(Math.pow(f.x-l.x,2)+Math.pow(f.y-l.y,2)),b=l.x+x/m*(f.x-l.x),A=l.y+x/m*(f.y-l.y),P=Math.sqrt(Math.pow(p.x-g.x,2)+Math.pow(p.y-g.y,2)),M=g.x+x/P*(p.x-g.x),w=g.y+x/P*(p.y-g.y);null===B&&(B=new Konva.Circle({x:b+o,y:A+o,radius:o,fill:"gray"}));null===W&&(W=new Konva.Circle({x:M+o,y:w+o,radius:o,fill:"gray"}));j.add(B),j.add(W),j.draw()}(a,d,l,r,c)}(C)),T&&H.renderAnchorShapesForNode(T)}function ae(e){var n=oe().anchorShapeSizeFactor;if(oe().enableAnchorSizeNotImpactByZoom)var o=n/t.zoom();else o=n;return parseFloat(e.css("width"))<=2.5?2.5*o:parseFloat(e.css("width"))*o}function de(e,t,n,o,i){return e>=o-n/2&&e<=o+n/2&&t>=i-n/2&&t<=i+n/2}function re(e,t,n){var o=s.getEdgeType(n);if("inconclusive"===o)return-1;if(null==n.data(s.syntax[o].weight)||0==n.data(s.syntax[o].weight).length)return-1;for(var i=s.getAnchorsAsArray(n),a=ae(n),d=0;i&&d<i.length;d+=2){if(de(e,t,a,i[d],i[d+1]))return d/2}return-1}function ce(){P=t.panningEnabled(),M=t.zoomingEnabled(),w=t.boxSelectionEnabled(),t.zoomingEnabled(!1).panningEnabled(!1).boxSelectionEnabled(!1)}function le(){t.zoomingEnabled(M).panningEnabled(P).boxSelectionEnabled(w)}function ge(e,t){var n=Math.atan2(t.y-e.y,t.x-e.x),o=[-Math.PI,3*-Math.PI/4,-Math.PI/2,-Math.PI/4,0,Math.PI/4,Math.PI/2,3*Math.PI/4,Math.PI/4],i=[];o.forEach((function(e){i.push(Math.abs(n-e))}));var s=i.indexOf(Math.min.apply(Math,i)),a=t.y-e.y,d=t.x-e.x,r=Math.sqrt(d*d+a*a),c=Math.abs(r*Math.sin(i[s])),l=o[s],g=Math.abs(r*Math.cos(i[s]));return{costDistance:c,x:e.x+g*Math.cos(l),y:e.y+g*Math.sin(l),angle:l}}null==ne&&(ne={}),ne.options=o;var he=function(e,n,i,a){var d=s.obtainPrevAnchorAbsolutePositions(e,n,i),r=s.obtainNextAnchorAbsolutePositions(e,n,i),c=a,l=ge(d,c),g=ge(r,c),h=t.zoom();if(l.costDistance*h<o.stickyAnchorTolerence&&g.costDistance*h>o.stickyAnchorTolerence)a.x=l.x,a.y=l.y;else if(l.costDistance*h>o.stickyAnchorTolerence&&g.costDistance*h<o.stickyAnchorTolerence)a.x=g.x,a.y=g.y;else if(l.costDistance*h<o.stickyAnchorTolerence&&g.costDistance*h<o.stickyAnchorTolerence){var u=l.angle,y=g.angle;if(u==y||Math.abs(u-y)==Math.PI)a.x=l.x,a.y=l.y;else{var v=d.x,f=d.y,p=r.x,x=r.y,m=l.x,b=l.y,A=g.x,P=g.y;if(Math.abs(b-f)<1e-5)a.y=f,a.x=(A-p)/(P-x)*(a.y-x)+p;else if(Math.abs(P-x)<1e-5)a.y=x,a.x=(m-v)/(b-f)*(a.y-f)+v;else{var M=(m-v)/(b-f),w=(A-p)/(P-x);a.y=(M*f-v-w*x+p)/(M-w),a.x=M*(a.y-f)+v}}}var E=e.data(s.syntax[n].weight),C=e.data(s.syntax[n].distance),T=s.convertToRelativePosition(e,a);E[i]=T.weight,C[i]=T.distance,e.data(s.syntax[n].weight,E),e.data(s.syntax[n].distance,C)};P=t.panningEnabled(),M=t.zoomingEnabled(),w=t.boxSelectionEnabled();var ue,ye,ve,fe,pe,xe,me,be,Ae,Pe,Me=(Re=t.edges(":selected")).length,we=t.nodes(":selected"),Ee=we.length;1===Me&&0===Ee&&(C=Re[0]),0===Me&&1===Ee&&(T=we[0]),t.bind("zoom pan",g=function(){(C||T)&&se()}),t.bind("drag","node",A=function(){T==this&&se(),null==C||C.source()!=this&&C.target()!=this||se()}),t.on("data","edge",(function(){C==this&&se()})),t.on("style","edge.edgebendediting-hasbendpoints:selected, edge.edgecontrolediting-hascontrolpoints:selected",n=function(){setTimeout((function(){se()}),50)}),t.on("remove","edge",c=function(){if(this.selected()){if(Me-=1,t.startBatch(),C&&C.removeClass("cy-edge-editing-highlight"),1===Me){var e=t.edges(":selected");1===e.length?(C=e[0]).addClass("cy-edge-editing-highlight"):C=void 0}else C=void 0;t.endBatch()}se()}),t.on("add","edge",l=function(){this.selected()&&(Me+=1,t.startBatch(),C&&C.removeClass("cy-edge-editing-highlight"),1===Me?(C=this).addClass("cy-edge-editing-highlight"):C=void 0,t.endBatch()),se()}),t.on("select","node",m=function(){var e=t.nodes(":selected").length;C&&(C.removeClass("cy-edge-editing-highlight"),C=void 0),T&&(T.removeClass("cy-node-editing-highlight"),T=void 0),1==e&&0==Me&&(T=this).addClass("cy-node-editing-highlight"),se()}),t.on("unselect","node",b=function(){1==t.nodes(":selected").length&&0==Me?(T=t.nodes(":selected")[0]).addClass("cy-node-editing-highlight"):T&&(T.removeClass("cy-node-editing-highlight"),T=void 0),se()}),t.on("select","edge",h=function(){0!=this.target().connectedEdges().length&&0!=this.source().connectedEdges().length&&(Me+=1,t.startBatch(),C&&C.removeClass("cy-edge-editing-highlight"),T&&(T.removeClass("cy-node-editing-highlight"),T=void 0),1===Me&&1==t.$(":selected").length?(C=this).addClass("cy-edge-editing-highlight"):C=void 0,t.endBatch(),se())}),t.on("unselect","edge",u=function(){if(Me-=1,t.startBatch(),C&&C.removeClass("cy-edge-editing-highlight"),1===Me){var e=t.edges(":selected");1===e.length?(C=e[0]).addClass("cy-edge-editing-highlight"):C=void 0}else C=void 0;t.endBatch(),se()});var Ce,Te,Se,Ie,Re,Fe=!1,De=[];t.on("tapstart",y=function(e){if(ye=e.position||e.cyPosition,e.target.isNode&&e.target.isNode()){t.boxSelectionEnabled(!1);var n=t.nodes(":selected");e.target.selected()||(n=n.union(e.target)),n.forEach((function(e){var t=e.position();De.push({n:e,ox:t.x,oy:t.y})}))}}),t.on("tapstart","edge",v=function(e){if(C&&C.id()===this.id()){ve=this;var n=s.getEdgeType(this);"inconclusive"===n&&(n="bend");var i=ye.x,d=ye.y;if(o.disableReconnect)var r=-1;else r=function(e,t,n){var o=ae(n),i=n._private.rscratch.allpts,s={x:i[0],y:i[1]},a={x:i[i.length-2],y:i[i.length-1]};return ie(s),ie(a),de(e,t,o,s.x,s.y)?0:de(e,t,o,a.x,a.y)?1:-1}(i,d,this);if(0==r||1==r){this.unselect(),me=r,Ae=0==r?ve.source():ve.target();var c=0==r?"source":"target",l=a.disconnectEdge(ve,t,e.renderedPosition,c);be=l.dummyNode,ve=l.edge,ce()}else ue=void 0,xe=!0}else xe=!1}),t.on("tapdrag",f=function(e){if(De.length>0&&Oe&&De.forEach((function(e){var t=e.n.position(),n=t.x-e.ox,o=t.y-e.oy;Math.abs(o)>Math.abs(n)?e.n.position("x",e.ox):e.n.position("y",e.oy)})),H.node||H.edge){var n=e.position||e.cyPosition,i=e.renderedPosition;if(H.edge){t.edges(":selected").length>0&&t.autounselectify(!1);var a=ve;if(void 0!==ve&&s.isIgnoredEdge(a))return;var d=s.getEdgeType(a);if(xe&&o.enableCreateAnchorOnDrag&&!K&&"inconclusive"!==d){var r=s.syntax[d].weight,c=s.syntax[d].distance;pe={edge:a,type:d,weights:a.data(r)?[].concat(a.data(r)):[],distances:a.data(c)?[].concat(a.data(c)):[]},a.unselect(),ue=s.addAnchorPoint(a,ye),ve=a,xe=void 0,Fe=!0,ce()}if(!K&&(void 0===ve||void 0===ue&&void 0===me))return;-1!=me&&be?be.position(n):null!=ue?he(a,d,ue,n):K&&(void 0===H.touchedAnchorIndex&&ye&&(H.touchedAnchorIndex=re(ye.x,ye.y,H.edge)),void 0!==H.touchedAnchorIndex&&he(H.edge,H.edgeType,H.touchedAnchorIndex,n)),e.target&&e.target[0]&&e.target.isNode()&&(Pe=e.target)}else if(H.node){if(!K)return;fe=H.node,function(e,n){if(pe){var o=e.renderedPosition();if(pe.isScaleHandle){pe.originalWidth,pe.originalHeight;var i=pe.originalScaleFactor,s=Math.abs((n.x-o.x)/(pe.dragStartX-o.x)),a=Math.abs((n.y-o.y)/(pe.dragStartY-o.y)),d=Math.min(s,a)*i,r=d.toFixed(0),c=.25/t.zoom();c<.1&&(c=.1),c>.5&&(c=.5),Math.abs(d-r)<c&&(d=r),d<.2&&(d=.2),e.data("scaleFactor",d)}else{var l=pe.dragStartX-o.x,g=pe.dragStartY-o.y,h=n.x-o.x,u=n.y-o.y,y=l*h+g*u,v=l*u-h*g,f=Math.atan2(v,y)+pe.originalRotateAngle,p=f/Math.PI*180,x=90*(p/90).toFixed(0);Math.abs(x-p)<10&&(f=x*Math.PI/180),e.data("rotateAngle",f)}se()}}(H.node,i)}}}),t.on("tapend",p=function(e){t.boxSelectionEnabled(!0),S&&j.getStage().fire("contentMouseup");var n=ve||H.edge;if(void 0!==n){var i=H.touchedAnchorIndex;if(null!=i){var d,r=n.source().position("x"),c=n.source().position("y"),l=n.target().position("x"),g=n.target().position("y"),h=s.getAnchorsAsArray(n),u=[r,c].concat(h).concat([l,g]),y=i+1,v=y-1,f=y+1,p={x:u[2*y],y:u[2*y+1]},x={x:u[2*v],y:u[2*v+1]},m={x:u[2*f],y:u[2*f+1]};if(p.x===x.x&&p.y===x.y||p.x===x.x&&p.y===x.y)d=!0;else{var b,A=(x.y-m.y)/(x.x-m.x),P={srcPoint:x,tgtPoint:m,m1:A,m2:-1/A},M=s.getIntersection(n,p,P),w=Math.sqrt(Math.pow(p.x-M.x,2)+Math.pow(p.y-M.y,2));"bend"===(b=s.getEdgeType(n))&&w<oe().bendRemovalSensitivity&&(d=!0)}o.enableRemoveAnchorMidOfNearLine&&d&&s.removeAnchor(n,i)}else if(null!=be&&(0==me||1==me)){var E=Ae,C="valid",I=0==me?"source":"target";if(Pe){var R=0==me?Pe:n.source(),F=1==me?Pe:n.target();"function"==typeof Z&&(C=Z(n,R,F)),E="valid"===C?Pe:Ae}R=0==me?E:n.source(),F=1==me?E:n.target();if(n=a.connectEdge(n,Ae,I),Ae.id()!==E.id())if("function"==typeof Y){var D=Y(R.id(),F.id(),n.data());if(D&&(a.copyEdge(n,D),s.initAnchorPoints(oe().bendPositionsFunction,oe().controlPositionsFunction,[D])),D&&oe().undoable){var k={newEdge:D,oldEdge:n};t.undoRedo().do("removeReconnectedEdge",k),n=D}else D&&(t.remove(n),n=D)}else{var z=0==me?{source:E.id()}:{target:E.id()},O=0==me?{source:Ae.id()}:{target:Ae.id()};if(oe().undoable&&E.id()!==Ae.id()){var B={edge:n,location:z,oldLoc:O};n=t.undoRedo().do("reconnectEdge",B).edge}}"valid"!==C&&"function"==typeof V&&V(),n.select(),t.remove(be)}"inconclusive"===(b=s.getEdgeType(n))&&(b="bend"),void 0!==H.touchedAnchorIndex||Fe||(pe=void 0);var W=s.syntax[b].weight;void 0!==n&&void 0!==pe&&(n.data(W)?n.data(W).toString():null)!=pe.weights.toString()&&(Fe&&(n.select(),t.autounselectify(!0)),oe().undoable&&t.undoRedo().do("changeAnchorPoints",pe))}if(H.node){var K=!1;if(1==H.node.data("scaleFactor")?H.node.removeData("scaleFactor"):null!=H.node.data("scaleFactor")&&(K=!0),0==H.node.data("rotateAngle")?H.node.removeData("rotateAngle"):null!=H.node.data("rotateAngle")&&(K=!0),K?H.node.addClass("edgebendediting_scaleRotate"):H.node.removeClass("edgebendediting_scaleRotate"),pe){var N={scale:pe.originalScaleFactor,rotate:pe.originalRotateAngle};oe().undoable&&t.undoRedo().do("useScaleRotate",{node:H.node,newScaleRotate:{scale:H.node.data("scaleFactor")||1,rotate:H.node.data("rotateAngle")||0},oldScaleRotate:N})}T!=e.target&&(H.node.removeClass("cy-node-editing-highlight"),T=void 0);var L=fe;setTimeout((function(){0==t.$(":selected").length&&L&&L.select()}),50)}De.length=0,ue=void 0,ve=void 0,fe=void 0,pe=void 0,xe=void 0,me=void 0,be=void 0,Ae=void 0,Pe=void 0,ye=void 0,Fe=!1,H.touchedAnchorIndex=void 0,le(),setTimeout((function(){se()}),50)}),t.on("edgeediting.movestart",(function(e,t){Ie=!1,null!=t[0]&&t.forEach((function(e){null==s.getAnchorsAsArray(e)||Ie||(Te={x:s.getAnchorsAsArray(e)[0],y:s.getAnchorsAsArray(e)[1]},Ce={firstTime:!0,firstAnchorPosition:{x:Te.x,y:Te.y},edges:t},Se=e,Ie=!0)}))})),t.on("edgeediting.moveend",(function(e,n){if(null!=Ce){var o=Ce.firstAnchorPosition,i={x:s.getAnchorsAsArray(Se)[0],y:s.getAnchorsAsArray(Se)[1]};Ce.positionDiff={x:-i.x+o.x,y:-i.y+o.y},delete Ce.firstAnchorPosition,oe().undoable&&t.undoRedo().do("moveAnchorPoints",Ce),Ce=void 0}})),t.on("cxttap",x=function(e){var n,i,a=e.target||e.cyTarget,d=!1;try{d=a.isEdge()}catch(e){}d?(n=a,i=s.getEdgeType(n)):(n=H.edge,i=H.edgeType);var r=t.contextMenus("get");if(!C||C.id()!=n.id()||s.isIgnoredEdge(n)||C!==n)return r.hideMenuItem(F),r.hideMenuItem(R),r.hideMenuItem(z),void r.hideMenuItem(k);var c=e.position||e.cyPosition,l=re(c.x,c.y,n);-1==l?(r.hideMenuItem(F),r.hideMenuItem(z),"control"===i&&d?(r.showMenuItem(k),r.hideMenuItem(R)):"bend"===i&&d?(r.showMenuItem(R),r.hideMenuItem(k)):d?(r.showMenuItem(R),r.showMenuItem(k)):(r.hideMenuItem(R),r.hideMenuItem(k)),s.currentCtxPos=c):(r.hideMenuItem(R),r.hideMenuItem(k),"control"===i?(r.showMenuItem(z),r.hideMenuItem(F),o.enableMultipleAnchorRemovalOption&&n.hasClass("edgecontrolediting-hasmultiplecontrolpoints")&&r.showMenuItem(O)):"bend"===i?(r.showMenuItem(F),r.hideMenuItem(z)):(r.hideMenuItem(F),r.hideMenuItem(z),r.hideMenuItem(O)),s.currentAnchorIndex=l),s.currentCtxEdge=n}),t.on("cyedgeediting.changeAnchorPoints","edge",(function(){t.startBatch(),t.edges().unselect(),t.trigger("bendPointMovement"),t.endBatch(),se()}));var ke=!1,ze={37:!1,38:!1,39:!1,40:!1},Oe=!1;document.addEventListener("keydown",(function(e){if(Oe=e.shiftKey,"function"==typeof oe().moveSelectedAnchorsOnKeyEvents?oe().moveSelectedAnchorsOnKeyEvents():oe().moveSelectedAnchorsOnKeyEvents){var n,o,i=document.activeElement.tagName;if("TEXTAREA"!=i&&"INPUT"!=i){switch(e.keyCode){case 37:case 39:case 38:case 40:case 32:e.preventDefault()}if(e.keyCode<"37"||e.keyCode>"40")return;if(ze[e.keyCode]=!0,t.edges(":selected").length!=t.elements(":selected").length||1!=t.edges(":selected").length)return;ke||(Re=t.edges(":selected"),t.trigger("edgeediting.movestart",[Re]),ke=!0);var a=3;if(e.altKey&&e.shiftKey)return;e.altKey?a=1:e.shiftKey&&(a=10);var d=0,r=0;d+=ze[39]?a:0,d-=ze[37]?a:0,r+=ze[40]?a:0,r-=ze[38]?a:0,n={x:d,y:r},(o=Re).forEach((function(e){var t=s.getAnchorsAsArray(e),o=[];if(null!=t){for(var i=0;i<t.length;i+=2)o.push({x:t[i]+n.x,y:t[i+1]+n.y});var a=s.getEdgeType(e);if(s.edgeTypeInconclusiveShouldntHappen(a,"UiUtilities.js, moveAnchorPoints"))return;e.data(s.syntax[a].pointPos,o)}})),s.initAnchorPoints(oe().bendPositionsFunction,oe().controlPositionsFunction,o),t.trigger("bendPointMovement")}}}),!0),document.addEventListener("keyup",(function(e){Oe=e.shiftKey,e.keyCode<"37"||e.keyCode>"40"||(e.preventDefault(),ze[e.keyCode]=!1,("function"==typeof oe().moveSelectedAnchorsOnKeyEvents?oe().moveSelectedAnchorsOnKeyEvents():oe().moveSelectedAnchorsOnKeyEvents)&&(t.trigger("edgeediting.moveend",[Re]),Re=void 0,ke=!1))}),!0),I.data("cyedgeediting",ne)},unbind:function(){t.off("remove","node",c).off("add","node",l).off("style","edge.edgebendediting-hasbendpoints:selected, edge.edgecontrolediting-hascontrolpoints:selected",n).off("select","edge",h).off("unselect","edge",u).off("select","node",m).off("unselect","node",b).off("tapstart",y).off("tapstart","edge",v).off("tapdrag",f).off("tapend",p).off("cxttap",x),t.unbind("zoom pan",g),t.unbind("drag",A)}};return N[I]?N[I].apply($(t.container()),Array.prototype.slice.call(arguments,1)):"object"!=(void 0===I?"undefined":o(I))&&I?($.error("No such function `"+I+"` for cytoscape.js-edge-editing"),$(this)):N.init.apply($(t.container()),arguments)}},function(e,t,n){"use strict";e.exports={disconnectEdge:function(e,t,n,o){var i={data:{id:"nwt_reconnectEdge_dummy",ports:[]},style:{width:1,height:1,visibility:"hidden"},renderedPosition:n};t.add(i);var s="source"===o?{source:i.data.id}:{target:i.data.id};return e=e.move(s)[0],{dummyNode:t.nodes("#"+i.data.id)[0],edge:e}},connectEdge:function(e,t,n){if(e.isEdge()&&t.isNode()){var o={};if("source"===n)o.source=t.id();else{if("target"!==n)return;o.target=t.id()}return e.move(o)[0]}},copyEdge:function(e,t){this.copyAnchors(e,t),this.copyStyle(e,t)},copyStyle:function(e,t){e&&t&&(t.data("line-color",e.data("line-color")),t.data("width",e.data("width")),t.data("cardinality",e.data("cardinality")))},copyAnchors:function(e,t){if(e.hasClass("edgebendediting-hasbendpoints")){var n=e.data("cyedgebendeditingDistances"),o=e.data("cyedgebendeditingWeights");t.data("cyedgebendeditingDistances",n),t.data("cyedgebendeditingWeights",o),t.addClass("edgebendediting-hasbendpoints")}else if(e.hasClass("edgecontrolediting-hascontrolpoints")){n=e.data("cyedgecontroleditingDistances"),o=e.data("cyedgecontroleditingWeights");t.data("cyedgecontroleditingDistances",n),t.data("cyedgecontroleditingWeights",o),t.addClass("edgecontrolediting-hascontrolpoints")}e.hasClass("edgebendediting-hasmultiplebendpoints")?t.addClass("edgebendediting-hasmultiplebendpoints"):e.hasClass("edgecontrolediting-hasmultiplecontrolpoints")&&t.addClass("edgecontrolediting-hasmultiplecontrolpoints")}}},function(e,t,n){"use strict";e.exports=function(e,t,n){if(null!=e.undoRedo){var o,i=e.undoRedo({defaultActions:!1,isDebug:!0});o=function(e,t,n){1!=t?e.data("scaleFactor",t):e.removeData("scaleFactor"),0!=n?e.data("rotateAngle",n):e.removeData("rotateAngle"),1==t&&0==n?e.removeClass("edgebendediting_scaleRotate"):e.addClass("edgebendediting_scaleRotate")},i.action("useScaleRotate",(function(e){return o(e.node,e.newScaleRotate.scale,e.newScaleRotate.rotate),e}),(function(e){return e.node.unselect(),o(e.node,e.oldScaleRotate.scale,e.oldScaleRotate.rotate),e})),i.action("changeAnchorPoints",s,s),i.action("moveAnchorPoints",a,a),i.action("reconnectEdge",d,d),i.action("removeReconnectedEdge",r,r)}function s(n){var o,i,s,a,d=e.getElementById(n.edge.id()),r="inconclusive"!==n.type?n.type:t.getEdgeType(d);"inconclusive"!==n.type||n.set?(s=t.syntax[r].weight,a=t.syntax[r].distance,o=n.set?d.data(s):n.weights,i=n.set?d.data(a):n.distances):(o=[],i=[]);var c={edge:d,type:r,weights:o,distances:i,set:!0};if(n.set){var l=n.weights&&n.weights.length>0,g=l&&n.weights.length>1;l?d.data(s,n.weights):d.removeData(s),l?d.data(a,n.distances):d.removeData(a);var h=t.syntax[r].class,u=t.syntax[r].multiClass;l||g?l&&!g?(d.addClass(h),d.removeClass(u)):d.addClass(h+" "+u):d.removeClass(h+" "+u),d.selected()?(d.unselect(),d.select()):d.select()}return d.trigger("cyedgeediting.changeAnchorPoints"),c}function a(e){if(e.firstTime)return delete e.firstTime,e;var o=e.edges,i=e.positionDiff,s={edges:o,positionDiff:{x:-i.x,y:-i.y}};return function(e,o){o.forEach((function(n){var o=t.getEdgeType(n),i=t.getAnchorsAsArray(n),s=[];if(null!=i){for(var a=0;a<i.length;a+=2)s.push({x:i[a]+e.x,y:i[a+1]+e.y});n.data(t.syntax[o].pointPos,s)}})),t.initAnchorPoints(n.bendPositionsFunction,n.controlPositionsFunction,o)}(i,o),s}function d(e){var t=e.edge,n=e.location,o=e.oldLoc,i={edge:t=t.move(n)[0],location:o,oldLoc:n};return t.unselect(),i}function r(t){var n=t.oldEdge;(o=e.getElementById(n.data("id")))&&o.length>0&&(n=o);var o,i=t.newEdge;return(o=e.getElementById(i.data("id")))&&o.length>0&&(i=o),n.inside()&&(n=n.remove()[0]),i.removed()&&(i=i.restore()).unselect(),{oldEdge:i,newEdge:n}}}}])}));