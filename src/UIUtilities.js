var debounce = require('./debounce');
var anchorPointUtilities = require('./AnchorPointUtilities');
var reconnectionUtilities = require('./reconnectionUtilities');
var registerUndoRedoFunctions = require('./registerUndoRedoFunctions');
var stageId = 0;

module.exports = function (params, cy) {
  var fn = params;

  var addBendPointCxtMenuId = 'cy-edge-bend-editing-cxt-add-bend-point' + stageId;
  var removeBendPointCxtMenuId = 'cy-edge-bend-editing-cxt-remove-bend-point' + stageId;
  var removeAllBendPointCtxMenuId = 'cy-edge-bend-editing-cxt-remove-multiple-bend-point' + stageId;
  var addControlPointCxtMenuId = 'cy-edge-control-editing-cxt-add-control-point' + stageId;
  var removeControlPointCxtMenuId = 'cy-edge-control-editing-cxt-remove-control-point' + stageId;
  var removeAllControlPointCtxMenuId = 'cy-edge-bend-editing-cxt-remove-multiple-control-point' + stageId;
  var eStyle, eRemove, eAdd, eZoom, eSelect, eUnselect, eTapStart, eTapStartOnEdge, eTapDrag, eTapEnd, eCxtTap;
  var nSelect,nUnselect,nDrag
  // last status of gestures
  var lastPanningEnabled, lastZoomingEnabled, lastBoxSelectionEnabled;
  var lastActiveBgOpacity;
  // status of edge to highlight bends and selected edges
  var edgeToHighlight,nodeToHighlight;

  // the Kanva.shape() for the endpoints
  var endpointShape1 = null, endpointShape2 = null;
  // used to stop certain cy listeners when interracting with anchors
  var anchorTouched = false;
  // used call eMouseDown of anchorManager if the mouse is out of the content on cy.on(tapend)
  var mouseOut;
  
  var functions = {
    init: function () {
      // register undo redo functions
      registerUndoRedoFunctions(cy, anchorPointUtilities, params);
      
      var self = this;
      var opts = params;

      /*
        Make sure we don't append an element that already exists.
        This extension canvas uses the same html element as edge-editing.
        It makes sense since it also uses the same Konva stage.
        Without the below logic, an empty canvasElement would be created
        for one of these extensions for no reason.
      */
      var $container = $(this);
      var canvasElementId = 'cy-node-edge-editing-stage' + stageId;
      stageId++;
      var $canvasElement = $('<div id="' + canvasElementId + '"></div>');

      if ($container.find('#' + canvasElementId).length < 1) {
        $container.append($canvasElement);
      }

      /* 
        Maintain a single Konva.stage object throughout the application that uses this extension
        such as Newt. This is important since having different stages causes weird behavior
        on other extensions that also use Konva, like not listening to mouse clicks and such.
        If you are someone that is creating an extension that uses Konva in the future, you need to
        be careful about how events register. If you use a different stage almost certainly one
        or both of the extensions that use the stage created below will break.
      */ 
      var stage;
      if (Konva.stages.length < stageId) {
        stage = new Konva.Stage({
          id: 'node-edge-editing-stage',
          container: canvasElementId,   // id of container <div>
          width: $container.width(),
          height: $container.height()
        });
      }
      else {
        stage = Konva.stages[stageId - 1];
      }
      
      var canvas;
      if (stage.getChildren().length < 1) {
        canvas = new Konva.Layer();
        stage.add(canvas);
      }
      else {
        canvas = stage.getChildren()[0];
      }  
      
      var anchorManager = {
        edge: undefined,
        edgeType: 'inconclusive',
        anchors: [],
        // remembers the touched anchor to avoid clearing it when dragging happens
        touchedAnchor: undefined,
        // remembers the index of the moving anchor
        touchedAnchorIndex: undefined,
        bindListeners: function(anchor){
          anchor.on("mousedown touchstart", this.eMouseDown);
        },
        unbindListeners: function(anchor){
          anchor.off("mousedown touchstart", this.eMouseDown);
        },
        // gets trigger on clicking on context menus, while cy listeners don't get triggered
        // it can cause weird behaviour if not aware of this
        eMouseDown: function(event){
          // eMouseDown(set) -> tapdrag(used) -> eMouseUp(reset)
          anchorTouched = true;
          anchorManager.touchedAnchor = event.target;
          
          mouseOut = false;

          if(anchorManager.edge){
            // anchorManager.edge.unselect() won't work sometimes if this wasn't here
            cy.autounselectify(false);
            anchorManager.edge.unselect();
            // remember state before changing
            var weightStr = anchorPointUtilities.syntax[anchorManager.edgeType]['weight'];
            var distanceStr = anchorPointUtilities.syntax[anchorManager.edgeType]['distance'];
  
            var edge = anchorManager.edge;
            moveAnchorParam = {
              edge: edge,
              type: anchorManager.edgeType,
              weights: edge.data(weightStr) ? [].concat(edge.data(weightStr)) : [],
              distances: edge.data(distanceStr) ? [].concat(edge.data(distanceStr)) : []
            };
          }else if(anchorManager.node){
            var n=anchorManager.node
            if(n.data("originalWidth")==null) {
              n.data("originalWidth",n.width())
              n.data("originalHeight",n.height())
            }
            n.addClass("edgebendediting_scaleRotate")
            moveAnchorParam = {
              node: n,
              dragStartX:event.evt.offsetX,
              dragStartY:event.evt.offsetY,
              originalScaleFactor: n.data("scaleFactor")||1,
              originalRotateAngle: n.data("rotateAngle")||0,
              isScaleHandle:event.target.attrs.scaleHandle
            };
          }
          
          turnOffActiveBgColor();
          disableGestures();
          
          cy.autoungrabify(true);

          canvas.getStage().on("contentTouchend contentMouseup", anchorManager.eMouseUp);
          canvas.getStage().on("contentMouseout", anchorManager.eMouseOut);
        },
        // gets called before cy.on('tapend')
        eMouseUp: function(event){
          // won't be called if the mouse is released out of screen
          anchorTouched = false;
          anchorManager.touchedAnchor = undefined;
          mouseOut = false;
          if(anchorManager.edge) anchorManager.edge.select();
          if(anchorManager.node) anchorManager.node.select();
          
          resetActiveBgColor();
          resetGestures();
          
          /* 
           * IMPORTANT
           * Any programmatic calls to .select(), .unselect() after this statement are ignored
           * until cy.autounselectify(false) is called in one of the previous:
           * 
           * cy.on('tapstart')
           * anchor.on('mousedown touchstart')
           * document.on('keydown')
           * cy.on('tapdrap')
           * 
           * Doesn't affect UX, but may cause confusing behaviour if not aware of this when coding
           * 
           * Why is this here?
           * This is important to keep edges from being auto deselected from working
           * with anchors out of the edge body (for unbundled bezier, technically not necessery for segements).
           * 
           * These is anther cy.autoselectify(true) in cy.on('tapend') 
           * 
          */ 
          if(anchorManager.edge) cy.autounselectify(true);
          cy.autoungrabify(false);

          canvas.getStage().off("contentTouchend contentMouseup", anchorManager.eMouseUp);
          canvas.getStage().off("contentMouseout", anchorManager.eMouseOut);
        },
        // handle mouse going out of canvas 
        eMouseOut: function (event){
          mouseOut = true;
        },
        clearAnchorsExcept: function(dontClean = undefined){
          var exceptionApplies = false;

          this.anchors.forEach((anchor, index) => {
            if(dontClean && anchor === dontClean){
              exceptionApplies = true; // the dontClean anchor is not cleared
              return;
            }

            this.unbindListeners(anchor);
            anchor.destroy();
          });

          if(exceptionApplies){
            this.anchors = [dontClean];
          }
          else {
            this.anchors = [];
            this.edge = undefined;
            this.edgeType = 'inconclusive';
          }
        },


        renderAnchorShapesForNode:function(node){
          this.node = node
          this.edge = undefined
          var pos = node.position()
          var nodeWidth = node.width()
          var nodeHeight = node.height()
          var ang=node.data("rotateAngle")||0

          var x= - nodeWidth / 2, y=- nodeHeight / 2
          var _x=x*Math.cos(ang)-y*Math.sin(ang)
          var _y=x*Math.sin(ang)+y*Math.cos(ang)
          var leftTop = {x: pos.x +_x,y: pos.y +_y}

          var newwh=getHalfWidthAndHeightAfterRotate(node)
          var newRightBottom = {x: pos.x + newwh[0], y: pos.y + newwh[1]}
          var length = getAnchorShapesLengthForNode() * 0.65* cy.zoom() / 2;

          var renderedSourcePos = convertToRenderedPosition({ x: leftTop.x, y: leftTop.y });
          var renderedTargetPos = convertToRenderedPosition({ x: newRightBottom.x, y: newRightBottom.y });

          endpointShape1 = new Konva.Arc({ x: renderedSourcePos.x, y: renderedSourcePos.y, innerRadius: length*2 / 3, outerRadius: length*4/3, angle: 120, rotation: 165+ang/Math.PI*180, fill: 'orange' });


          endpointShape2 = new Konva.Arrow({
            x: renderedTargetPos.x, y: renderedTargetPos.y, points: [0, 0, length*0.5, length*0.5,length*0.7,length*0.7],
            fill: 'orange',stroke: 'orange',strokeWidth: 12,scaleHandle:1        })
          this.anchors.push(endpointShape1, endpointShape2);
          this.bindListeners(endpointShape1);
          this.bindListeners(endpointShape2);
          canvas.add(endpointShape1);
          canvas.add(endpointShape2);
          canvas.draw();
        },

        // render the bend and control shapes of the given edge
        renderAnchorShapes: function(edge) {
          this.edge = edge;
          this.node = undefined
          this.edgeType = anchorPointUtilities.getEdgeType(edge);

          if(!edge.hasClass('edgebendediting-hasbendpoints') &&
              !edge.hasClass('edgecontrolediting-hascontrolpoints')) {
            return;
          }
          
          var anchorList = anchorPointUtilities.getAnchorsAsArray(edge);//edge._private.rdata.segpts;
          var length = getAnchorShapesLength(edge) * 0.65;
          
          var srcPos = edge.source().position();
          var tgtPos = edge.target().position();

          for(var i = 0; anchorList && i < anchorList.length; i = i + 2){
            var anchorX = anchorList[i];
            var anchorY = anchorList[i + 1];

            this.renderAnchorShape(anchorX, anchorY, length);
          }

          canvas.draw();
        },
        // render a anchor shape with the given parameters
        renderAnchorShape: function(anchorX, anchorY, length) {
          // get the top left coordinates
          var topLeftX = anchorX - length / 2;
          var topLeftY = anchorY - length / 2;
          
          // convert to rendered parameters
          var renderedTopLeftPos = convertToRenderedPosition({x: topLeftX, y: topLeftY});
          length *= cy.zoom();
          
          var newAnchor = new Konva.Rect({
            x: renderedTopLeftPos.x,
            y: renderedTopLeftPos.y,
            width: length,
            height: length,
            fill: 'black',
            strokeWidth: 0,
            draggable: true
          });

          this.anchors.push(newAnchor);
          this.bindListeners(newAnchor);
          canvas.add(newAnchor);
        }
      };

      var cxtAddBendFcn = function(event){
        cxtAddAnchorFcn(event, 'bend');
      }

      var cxtAddControlFcn = function(event) {
        cxtAddAnchorFcn(event, 'control');
      }

      var cxtAddAnchorFcn = function (event, anchorType) {
        var edge = event.target || event.cyTarget;
        if(!anchorPointUtilities.isIgnoredEdge(edge)) {

          var type = anchorPointUtilities.getEdgeType(edge);
          var weights, distances, weightStr, distanceStr;

          if(type === 'inconclusive'){
            weights = [];
            distances = [];
          }
          else{
            weightStr = anchorPointUtilities.syntax[type]['weight'];
            distanceStr = anchorPointUtilities.syntax[type]['distance'];

            weights = edge.data(weightStr) ? [].concat(edge.data(weightStr)) : edge.data(weightStr);
            distances = edge.data(distanceStr) ? [].concat(edge.data(distanceStr)) : edge.data(distanceStr);
          }

          var param = {
            edge: edge,
            type: type,
            weights: weights,
            distances: distances
          };

          // the undefined go for edge and newAnchorPoint parameters
          anchorPointUtilities.addAnchorPoint(undefined, undefined, anchorType);

          if (options().undoable) {
            cy.undoRedo().do('changeAnchorPoints', param);
          }
        }

        refreshDraws();
        edge.select();
      };

      var cxtRemoveAnchorFcn = function (event) {
        var edge = anchorManager.edge;
        var type = anchorPointUtilities.getEdgeType(edge);

        if(anchorPointUtilities.edgeTypeInconclusiveShouldntHappen(type, "UiUtilities.js, cxtRemoveAnchorFcn")){
          return;
        }

        var param = {
          edge: edge,
          type: type,
          weights: [].concat(edge.data(anchorPointUtilities.syntax[type]['weight'])),
          distances: [].concat(edge.data(anchorPointUtilities.syntax[type]['distance']))
        };

        anchorPointUtilities.removeAnchor();
        
        if(options().undoable) {
          cy.undoRedo().do('changeAnchorPoints', param);
        }
        
        setTimeout(function(){refreshDraws();edge.select();}, 50) ;

      };

      var cxtRemoveAllAnchorsFcn = function (event) {
        var edge = anchorManager.edge;
        var type = anchorPointUtilities.getEdgeType(edge);
        var param = {
          edge: edge,
          type: type,
          weights: [].concat(edge.data(anchorPointUtilities.syntax[type]['weight'])),
          distances: [].concat(edge.data(anchorPointUtilities.syntax[type]['distance']))
        };
        
        anchorPointUtilities.removeAllAnchors();

        if (options().undoable) {
          cy.undoRedo().do('changeAnchorPoints', param);
        }
        setTimeout(function(){refreshDraws();edge.select();}, 50);
      }
      
      // function to reconnect edge
      var handleReconnectEdge = opts.handleReconnectEdge;
      // function to validate edge source and target on reconnection
      var validateEdge = opts.validateEdge; 
      // function to be called on invalid edge reconnection
      var actOnUnsuccessfulReconnection = opts.actOnUnsuccessfulReconnection;
      
      var menuItems = [
        {
          id: addBendPointCxtMenuId,
          content: opts.addBendMenuItemTitle,
          selector: 'edge',
          onClickFunction: cxtAddBendFcn
        },
        {
          id: removeBendPointCxtMenuId,
          content: opts.removeBendMenuItemTitle,
          selector: 'edge',
          onClickFunction: cxtRemoveAnchorFcn
        }, 
        {
          id: removeAllBendPointCtxMenuId,
          content: opts.removeAllBendMenuItemTitle,
          selector: opts.enableMultipleAnchorRemovalOption && ':selected.edgebendediting-hasmultiplebendpoints',
          onClickFunction: cxtRemoveAllAnchorsFcn
        },
        {
          id: addControlPointCxtMenuId,
          content: opts.addControlMenuItemTitle,
          selector: 'edge',
          coreAsWell: true,
          onClickFunction: cxtAddControlFcn
        },
        {
          id: removeControlPointCxtMenuId,
          content: opts.removeControlMenuItemTitle,
          selector: 'edge',
          coreAsWell: true,
          onClickFunction: cxtRemoveAnchorFcn
        }, 
        {
          id: removeAllControlPointCtxMenuId,
          content: opts.removeAllControlMenuItemTitle,
          selector: opts.enableMultipleAnchorRemovalOption && ':selected.edgecontrolediting-hasmultiplecontrolpoints',
          onClickFunction: cxtRemoveAllAnchorsFcn
        },
      ];
      
      if(cy.contextMenus) {
        var menus = cy.contextMenus('get');
        // If context menus is active just append menu items else activate the extension
        // with initial menu items
        if (menus.isActive()) {
          menus.appendMenuItems(menuItems);
        }
        else {
          cy.contextMenus({
            menuItems: menuItems
          });
        }
      }
      
      var _sizeCanvas = debounce(function () {
        $canvasElement
          .attr('height', $container.height())
          .attr('width', $container.width())
          .css({
            'position': 'absolute',
            'top': 0,
            'left': 0,
            'z-index': options().zIndex
          })
        ;

        setTimeout(function () {
          var canvasBb = $canvasElement.offset();
          var containerBb = $container.offset();

          $canvasElement
            .css({
              'top': -(canvasBb.top - containerBb.top),
              'left': -(canvasBb.left - containerBb.left)
            })
          ;

          canvas.getStage().setWidth($container.width());
          canvas.getStage().setHeight($container.height());

          // redraw on canvas resize
          if(cy){
            refreshDraws();
          }
        }, 0);

      }, 250);

      function sizeCanvas() {
        _sizeCanvas();
      }

      sizeCanvas();

      $(window).bind('resize', function () {
        sizeCanvas();
      });
      
      // write options to data
      var data = $container.data('cyedgeediting');
      if (data == null) {
        data = {};
      }
      data.options = opts;

      var optCache;

      function options() {
        return optCache || (optCache = $container.data('cyedgeediting').options);
      }

      // we will need to convert model positons to rendered positions
      function convertToRenderedPosition(modelPosition) {
        var pan = cy.pan();
        var zoom = cy.zoom();

        var x = modelPosition.x * zoom + pan.x;
        var y = modelPosition.y * zoom + pan.y;

        return {
          x: x,
          y: y
        };
      }
      
      function refreshDraws() {
        // don't clear anchor which is being moved
        anchorManager.clearAnchorsExcept(anchorManager.touchedAnchor);
        
        if(endpointShape1 !== null){
          endpointShape1.destroy();
          endpointShape1 = null;
        }
        if(endpointShape2 !== null){
          endpointShape2.destroy();
          endpointShape2 = null;
        }
        canvas.draw();
        if( edgeToHighlight ) {
          anchorManager.renderAnchorShapes(edgeToHighlight);
          renderEndPointShapes(edgeToHighlight);
        }
        if(nodeToHighlight){
          anchorManager.renderAnchorShapesForNode(nodeToHighlight);
        }
      }

      // render the end points shapes of the given edge
      function renderEndPointShapes(edge) {
        if(!edge){
          return;
        }

        var edge_pts = anchorPointUtilities.getAnchorsAsArray(edge);
        if(typeof edge_pts === 'undefined'){
          edge_pts = [];
        }       
        var sourcePos = edge.sourceEndpoint();
        var targetPos = edge.targetEndpoint();
        edge_pts.unshift(sourcePos.y);
        edge_pts.unshift(sourcePos.x);
        edge_pts.push(targetPos.x);
        edge_pts.push(targetPos.y); 

       
        if(!edge_pts)
          return;

        var src = {
          x: edge_pts[0],
          y: edge_pts[1]
        }

        var target = {
          x: edge_pts[edge_pts.length-2],
          y: edge_pts[edge_pts.length-1]
        }

        var nextToSource = {
          x: edge_pts[2],
          y: edge_pts[3]
        }
        var nextToTarget = {
          x: edge_pts[edge_pts.length-4],
          y: edge_pts[edge_pts.length-3]
        }
        var length = getAnchorShapesLength(edge) * 0.65;
        
        renderEachEndPointShape(src, target, length,nextToSource,nextToTarget); 
      }

      function renderEachEndPointShape(source, target, length,nextToSource,nextToTarget) {
        // get the top left coordinates of source and target
        var sTopLeftX = source.x - length / 2;
        var sTopLeftY = source.y - length / 2;

        var tTopLeftX = target.x - length / 2;
        var tTopLeftY = target.y - length / 2;

        // convert to rendered parameters
        var renderedSourcePos = convertToRenderedPosition({x: sTopLeftX, y: sTopLeftY});
        var renderedTargetPos = convertToRenderedPosition({x: tTopLeftX, y: tTopLeftY});
        length = length * cy.zoom() / 2;

        var nextToSourceX = nextToSource.x - length /2;
          var nextToSourceY = nextToSource.y - length / 2;
          var nextToTargetX = nextToTarget.x - length /2;
          var nextToTargetY = nextToTarget.y - length /2;
          var renderedNextToSource = convertToRenderedPosition({ x: nextToSourceX, y: nextToSourceY });
          var renderedNextToTarget = convertToRenderedPosition({ x: nextToTargetX, y: nextToTargetY });
          //how far to go from the node along the edge
          var distanceFromNode = length;

          var distanceSource = Math.sqrt(Math.pow(renderedNextToSource.x - renderedSourcePos.x, 2) + Math.pow(renderedNextToSource.y - renderedSourcePos.y, 2));
          var sourceEndPointX = renderedSourcePos.x + ((distanceFromNode / distanceSource) * (renderedNextToSource.x - renderedSourcePos.x));
          var sourceEndPointY = renderedSourcePos.y + ((distanceFromNode / distanceSource) * (renderedNextToSource.y - renderedSourcePos.y));


          var distanceTarget = Math.sqrt(Math.pow(renderedNextToTarget.x - renderedTargetPos.x, 2) + Math.pow(renderedNextToTarget.y - renderedTargetPos.y, 2));
          var targetEndPointX = renderedTargetPos.x + ((distanceFromNode / distanceTarget) * (renderedNextToTarget.x - renderedTargetPos.x));
          var targetEndPointY = renderedTargetPos.y + ((distanceFromNode / distanceTarget) * (renderedNextToTarget.y - renderedTargetPos.y));

        // render end point shape for source and target
        // the null checks are not theoretically required
        // but they protect from bad synchronious calls of refreshDraws()
        if(endpointShape1 === null){
          endpointShape1 = new Konva.Circle({
            x: sourceEndPointX + length,
            y: sourceEndPointY + length,
            radius: length,
            fill: 'gray',
          });
        }

        if(endpointShape2 === null){
          endpointShape2 = new Konva.Circle({
            x: targetEndPointX + length,
            y: targetEndPointY + length,
            radius: length,
            fill: 'gray',
          });
        }

        canvas.add(endpointShape1);
        canvas.add(endpointShape2);
        canvas.draw();
      }

      // get the length of anchor points to be rendered
      function getAnchorShapesLength(edge) {
        var factor = options().anchorShapeSizeFactor;
        if(options().enableAnchorSizeNotImpactByZoom) var actualFactor= factor/cy.zoom()
        else var actualFactor= factor
        if (parseFloat(edge.css('width')) <= 2.5)
          return 2.5 * actualFactor;
        else return parseFloat(edge.css('width'))*actualFactor;
      }

      function getHalfWidthAndHeightAfterRotate(node) {
        var rotateAngle = node.pstyle("shape-rotation").value
        let cos = Math.cos(rotateAngle);
        let sin = Math.sin(rotateAngle);
        var hw=node.width()/2
        var hh=node.height()/2
        var oshape = [-hw, -hh, hw, -hh, hw, hh, -hw, hh]
        var allx = [], ally = []
        for (var i = 0; i < oshape.length; i += 2) {
          var ox = oshape[i], oy = oshape[i + 1]
          var _ox = ox * cos - oy * sin
          var _oy = ox * sin + oy * cos
          allx.push(_ox)
          ally.push(_oy)
        }

        hw = (Math.max(...allx) - Math.min(...allx)) / 2
        hh = (Math.max(...ally) - Math.min(...ally)) / 2
        return [hw,hh]
      }

      function getAnchorShapesLengthForNode() {
        var factor = options().anchorShapeSizeFactor;
        if(options().enableAnchorSizeNotImpactByZoom) var actualFactor= factor/cy.zoom()
        else var actualFactor= factor
        return 15 * actualFactor;
      }
      
      // check if the anchor represented by {x, y} is inside the point shape
      function checkIfInsideShape(x, y, length, centerX, centerY){
        var minX = centerX - length / 2;
        var maxX = centerX + length / 2;
        var minY = centerY - length / 2;
        var maxY = centerY + length / 2;
        
        var inside = (x >= minX && x <= maxX) && (y >= minY && y <= maxY);
        return inside;
      }

      // get the index of anchor containing the point represented by {x, y}
      function getContainingShapeIndex(x, y, edge) {
        var type = anchorPointUtilities.getEdgeType(edge);

        if(type === 'inconclusive'){
          return -1;
        }

        if(edge.data(anchorPointUtilities.syntax[type]['weight']) == null || 
          edge.data(anchorPointUtilities.syntax[type]['weight']).length == 0){
          return -1;
        }

        var anchorList = anchorPointUtilities.getAnchorsAsArray(edge);//edge._private.rdata.segpts;
        var length = getAnchorShapesLength(edge);

        for(var i = 0; anchorList && i < anchorList.length; i = i + 2){
          var anchorX = anchorList[i];
          var anchorY = anchorList[i + 1];

          var inside = checkIfInsideShape(x, y, length, anchorX, anchorY);
          if(inside){
            return i / 2;
          }
        }

        return -1;
      };

      function getContainingEndPoint(x, y, edge){
        var length = getAnchorShapesLength(edge);
        var allPts = edge._private.rscratch.allpts;
        var src = {
          x: allPts[0],
          y: allPts[1]
        }
        var target = {
          x: allPts[allPts.length-2],
          y: allPts[allPts.length-1]
        }
        convertToRenderedPosition(src);
        convertToRenderedPosition(target);
        
        // Source:0, Target:1, None:-1
        if(checkIfInsideShape(x, y, length, src.x, src.y))
          return 0;
        else if(checkIfInsideShape(x, y, length, target.x, target.y))
          return 1;
        else
          return -1;
      }
      
      // store the current status of gestures and set them to false
      function disableGestures() {
        lastPanningEnabled = cy.panningEnabled();
        lastZoomingEnabled = cy.zoomingEnabled();
        lastBoxSelectionEnabled = cy.boxSelectionEnabled();

        cy.zoomingEnabled(false)
          .panningEnabled(false)
          .boxSelectionEnabled(false);
      }
      
      // reset the gestures by their latest status
      function resetGestures() {
        cy.zoomingEnabled(lastZoomingEnabled)
          .panningEnabled(lastPanningEnabled)
          .boxSelectionEnabled(lastBoxSelectionEnabled);
      }

      function turnOffActiveBgColor(){
        // found this at the cy-node-resize code, but doesn't seem to find the object most of the time
        if( cy.style()._private.coreStyle["active-bg-opacity"]) {
          lastActiveBgOpacity = cy.style()._private.coreStyle["active-bg-opacity"].value;
        }
        else {
          // arbitrary, feel free to change
          // trial and error showed that 0.15 was closest to the old color
          lastActiveBgOpacity = 0.15;
        }

        cy.style()
          .selector("core")
          .style("active-bg-opacity", 0)
          .update();
      }

      function resetActiveBgColor(){
        cy.style()
          .selector("core")
          .style("active-bg-opacity", lastActiveBgOpacity)
          .update();
      }

      function moveAnchorPoints(positionDiff, edges) {
          edges.forEach(function( edge ){
              var previousAnchorsPosition = anchorPointUtilities.getAnchorsAsArray(edge);
              var nextAnchorPointsPosition = [];
              if (previousAnchorsPosition != undefined)
              {
                for (var i=0; i<previousAnchorsPosition.length; i+=2)
                {
                    nextAnchorPointsPosition.push({x: previousAnchorsPosition[i]+positionDiff.x, y: previousAnchorsPosition[i+1]+positionDiff.y});
                }
                var type = anchorPointUtilities.getEdgeType(edge);

                if(anchorPointUtilities.edgeTypeInconclusiveShouldntHappen(type, "UiUtilities.js, moveAnchorPoints")){
                  return;
                }

                edge.data(anchorPointUtilities.syntax[type]['pointPos'], nextAnchorPointsPosition);
              }
          });
          anchorPointUtilities.initAnchorPoints(options().bendPositionsFunction, options().controlPositionsFunction, edges);
          
          // Listener defined in other extension
          // Might have compatibility issues after the unbundled bezier
          cy.trigger('bendPointMovement'); 
      }


      function _calcCostToPreferredPosition(p1, p2){
        var currentAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        var perfectAngle=[-Math.PI,-Math.PI*3/4,-Math.PI/2,-Math.PI/4,0,Math.PI/4,Math.PI/2,Math.PI*3/4,Math.PI/4]
        var deltaAngle=[]
        perfectAngle.forEach((angle)=>{deltaAngle.push(Math.abs(currentAngle-angle))})
        var indexOfMin= deltaAngle.indexOf(Math.min(...deltaAngle))
        var dy = ( p2.y - p1.y );
        var dx = ( p2.x - p1.x );
        var l=Math.sqrt( dx * dx + dy * dy );
        var cost=Math.abs(l*Math.sin(deltaAngle[indexOfMin]))

        var chosenAngle=perfectAngle[indexOfMin]
        var edgeL=Math.abs(l*Math.cos(deltaAngle[indexOfMin]))
        var targetPointX=p1.x + edgeL*Math.cos(chosenAngle)
        var targetPointY=p1.y + edgeL*Math.sin(chosenAngle)

        return {"costDistance":cost,"x":targetPointX,"y":targetPointY,"angle":chosenAngle}
      }

      function moveNodeAnchorOnDrag(node,renderPos){
        if(!moveAnchorParam) return;
        var rpos=node.renderedPosition()

        if(moveAnchorParam.isScaleHandle){
          var w=moveAnchorParam.originalWidth
          var h=moveAnchorParam.originalHeight
          var originalF=moveAnchorParam.originalScaleFactor
          var f1=Math.abs((renderPos.x-rpos.x)/(moveAnchorParam.dragStartX-rpos.x))
          var f2=Math.abs((renderPos.y-rpos.y)/(moveAnchorParam.dragStartY-rpos.y))
          var f=Math.min(f1,f2) * originalF
          var intF=f.toFixed(0)
          var zoomLevel=cy.zoom()
          var threshold=0.25/zoomLevel
          if(threshold<0.1) threshold=0.1
          if(threshold>0.5) threshold=0.5
          if(Math.abs(f-intF)<threshold) f=intF
          if(f<0.2) f=0.2
          node.data('scaleFactor',f)
        }else{
          var x1=moveAnchorParam.dragStartX-rpos.x, y1=moveAnchorParam.dragStartY-rpos.y,x2=renderPos.x-rpos.x,y2=renderPos.y-rpos.y
          var dot=x1*x2+y1*y2
          var det=x1*y2-x2*y1
          var angle=Math.atan2(det,dot)+moveAnchorParam.originalRotateAngle
          var degreeAng=angle/Math.PI*180
          var fixedDegree= (degreeAng/90).toFixed(0)*90
          
          if(Math.abs(fixedDegree-degreeAng)<10) angle=fixedDegree*Math.PI/180
          node.data('rotateAngle',angle)
        }
        refreshDraws()
      }

      function moveAnchorOnDrag(edge, type, index, position){
        var prevPointPosition=anchorPointUtilities.obtainPrevAnchorAbsolutePositions(edge,type,index)
        var nextPointPosition=anchorPointUtilities.obtainNextAnchorAbsolutePositions(edge,type,index)
        var mousePosition = position;

        //calcualte the cost(or offset distance) to fulfill perfect 0, or 45 or 90 degree positions according to prev and next position
        var judgePrev=_calcCostToPreferredPosition(prevPointPosition,mousePosition)
        var judgeNext=_calcCostToPreferredPosition(nextPointPosition,mousePosition)
        var decisionObj=null
        
        var zoomLevel=cy.zoom()

        if (judgePrev.costDistance * zoomLevel < opts.stickyAnchorTolerence
          && judgeNext.costDistance * zoomLevel > opts.stickyAnchorTolerence) {
          //choose the perfect angle point from prev anchor
          position.x = judgePrev.x
          position.y = judgePrev.y
        }else if(judgePrev.costDistance * zoomLevel > opts.stickyAnchorTolerence
          && judgeNext.costDistance * zoomLevel < opts.stickyAnchorTolerence){
            //choose the perfect angle point from next anchor
            position.x = judgeNext.x
            position.y = judgeNext.y
        }else if(judgePrev.costDistance * zoomLevel < opts.stickyAnchorTolerence
          && judgeNext.costDistance * zoomLevel < opts.stickyAnchorTolerence){
            //check if the two angle lines are parallel or not
            var angle1=judgePrev.angle
            var angle2=judgeNext.angle
            if(angle1==angle2 || Math.abs(angle1-angle2)==Math.PI){
              //there will be no intersection, so just choose the perfect angle point from prev anchor
              position.x = judgePrev.x
              position.y = judgePrev.y
            }else{
              //calculate the intersection as perfect anchor point
              var prevX = prevPointPosition.x
              var prevY = prevPointPosition.y
              var nexX = nextPointPosition.x
              var nexY = nextPointPosition.y
              var fx= judgePrev.x
              var fy = judgePrev.y
              var sx = judgeNext.x
              var sy = judgeNext.y

              if(Math.abs(fy-prevY)<0.00001){
                position.y=prevY
                position.x=(sx-nexX)/(sy-nexY)*(position.y-nexY)+nexX
              }else if(Math.abs(sy-nexY)<0.00001){
                position.y=nexY
                position.x=(fx-prevX)/(fy-prevY)*(position.y-prevY)+prevX
              }else{
                var a = (fx-prevX)/(fy-prevY)
                var b = (sx-nexX)/(sy-nexY)
                position.y = (a*prevY-prevX-b*nexY+nexX)/(a-b)
                position.x = a*(position.y-prevY)+prevX
              }
            }
        }
        
        var weights = edge.data(anchorPointUtilities.syntax[type]['weight']);
        var distances = edge.data(anchorPointUtilities.syntax[type]['distance']);
        
        var relativeAnchorPosition = anchorPointUtilities.convertToRelativePosition(edge, position);
        weights[index] = relativeAnchorPosition.weight;
        distances[index] = relativeAnchorPosition.distance;
        
        edge.data(anchorPointUtilities.syntax[type]['weight'], weights);
        edge.data(anchorPointUtilities.syntax[type]['distance'], distances);
      }

      
      var _moveAnchorOnDrag = moveAnchorOnDrag //debounce( moveAnchorOnDrag, 5);

      {  
        lastPanningEnabled = cy.panningEnabled();
        lastZoomingEnabled = cy.zoomingEnabled();
        lastBoxSelectionEnabled = cy.boxSelectionEnabled();
        
        // Initilize the edgeToHighlightBends and numberOfSelectedEdges
        {
          var selectedEdges = cy.edges(':selected');
          var numberOfSelectedEdges = selectedEdges.length;
          var selectedNodes= cy.nodes(':selected');
          var numberOfSelectedNodes=selectedNodes.length;

          if ( numberOfSelectedEdges === 1 && numberOfSelectedNodes===0 ) {
            edgeToHighlight = selectedEdges[0];
          }
          if ( numberOfSelectedEdges === 0 && numberOfSelectedNodes===1 ) {
            nodeToHighlight = selectedNodes[0];
          }
        }
        
        cy.bind('zoom pan', eZoom = function () {
          if ( !edgeToHighlight && !nodeToHighlight ) {
            return;
          }
          
          refreshDraws();
        });
        cy.bind('drag','node', nDrag = function () {
          if(nodeToHighlight==this) refreshDraws();
          if(edgeToHighlight!=null && (edgeToHighlight.source()==this || edgeToHighlight.target()==this) ) refreshDraws();
        });

        // cy.off is never called on this listener
        cy.on('data', 'edge',  function () {
          if (edgeToHighlight==this ) refreshDraws();
        });

        cy.on('style', 'edge.edgebendediting-hasbendpoints:selected, edge.edgecontrolediting-hascontrolpoints:selected', eStyle = function () {
          setTimeout(function(){refreshDraws()}, 50);
        });

        cy.on('remove', 'edge', eRemove = function () {
          var edge = this;
          if (edge.selected()) {
            numberOfSelectedEdges = numberOfSelectedEdges - 1;
            
            cy.startBatch();
            
            if (edgeToHighlight) {
              edgeToHighlight.removeClass('cy-edge-editing-highlight');
            }
            
            if (numberOfSelectedEdges === 1) {
              var selectedEdges = cy.edges(':selected');
              
              // If user removes all selected edges at a single operation then our 'numberOfSelectedEdges'
              // may be misleading. Therefore we need to check if the number of edges to highlight is realy 1 here.
              if (selectedEdges.length === 1) {
                edgeToHighlight = selectedEdges[0];
                edgeToHighlight.addClass('cy-edge-editing-highlight');
              }
              else {
                edgeToHighlight = undefined;
              }
            }
            else {
              edgeToHighlight = undefined;
            }
            
            cy.endBatch();
          }
          refreshDraws();
        });
        
         cy.on('add', 'edge', eAdd = function () {
          var edge = this;
          if (edge.selected()) {
            numberOfSelectedEdges = numberOfSelectedEdges + 1;
            
            cy.startBatch();
            
            if (edgeToHighlight) {
              edgeToHighlight.removeClass('cy-edge-editing-highlight');
            }
            
            if (numberOfSelectedEdges === 1) {
              edgeToHighlight = edge;
              edgeToHighlight.addClass('cy-edge-editing-highlight');
            }
            else {
              edgeToHighlight = undefined;
            }
            
            cy.endBatch();
          }
          refreshDraws();
        });
        
        cy.on('select', 'node', nSelect = function () {
          var numberOfSelectedNodes=cy.nodes(':selected').length;
          if (edgeToHighlight) {
            edgeToHighlight.removeClass('cy-edge-editing-highlight');
            edgeToHighlight = undefined
          }
          if (nodeToHighlight) {
            nodeToHighlight.removeClass('cy-node-editing-highlight');
            nodeToHighlight=undefined;
          }
          if(numberOfSelectedNodes==1 && numberOfSelectedEdges==0) {
            nodeToHighlight=this
            nodeToHighlight.addClass('cy-node-editing-highlight');            
          }
          refreshDraws();
        });
        cy.on('unselect', 'node', nUnselect = function () {
          var numberOfSelectedNodes=cy.nodes(':selected').length;
          if(numberOfSelectedNodes==1 && numberOfSelectedEdges==0) {
            nodeToHighlight=cy.nodes(':selected')[0]
            nodeToHighlight.addClass('cy-node-editing-highlight');            
          }else{
            if (nodeToHighlight) {
              nodeToHighlight.removeClass('cy-node-editing-highlight');
              nodeToHighlight=undefined;
            }
          }
          refreshDraws();
        });


        cy.on('select', 'edge', eSelect = function () {
          var edge = this;
          if(edge.target().connectedEdges().length == 0 || edge.source().connectedEdges().length == 0){
            return;
          }

          numberOfSelectedEdges = numberOfSelectedEdges + 1;
          
          cy.startBatch();
            
          if (edgeToHighlight) {
            edgeToHighlight.removeClass('cy-edge-editing-highlight');
          }
          if (nodeToHighlight) {
            nodeToHighlight.removeClass('cy-node-editing-highlight');
            nodeToHighlight=undefined;
          }
          
          if (numberOfSelectedEdges === 1 && cy.$(':selected').length==1) {
            edgeToHighlight = edge;
            edgeToHighlight.addClass('cy-edge-editing-highlight');
          }
          else {
            edgeToHighlight = undefined;
          }
          
          cy.endBatch();
          refreshDraws();
        });
        
        cy.on('unselect', 'edge', eUnselect = function () {
          numberOfSelectedEdges = numberOfSelectedEdges - 1;
            
          cy.startBatch();
            
          if (edgeToHighlight) {
            edgeToHighlight.removeClass('cy-edge-editing-highlight');
          }
            
          if (numberOfSelectedEdges === 1) {
            var selectedEdges = cy.edges(':selected');
            
            // If user unselects all edges by tapping to the core etc. then our 'numberOfSelectedEdges'
            // may be misleading. Therefore we need to check if the number of edges to highlight is realy 1 here.
            if (selectedEdges.length === 1) {
              edgeToHighlight = selectedEdges[0];
              edgeToHighlight.addClass('cy-edge-editing-highlight');
            }
            else {
              edgeToHighlight = undefined;
            }
          }
          else {
            edgeToHighlight = undefined;
          }
          
          cy.endBatch();
          refreshDraws();
        });
        
        var movedAnchorIndex;
        var tapStartPos;
        var movedEdge;
        var movedNode;
        var moveAnchorParam;
        var createAnchorOnDrag;
        var movedEndPoint;
        var dummyNode;
        var detachedNode;
        var nodeToAttach;
        var anchorCreatedByDrag = false;
        var draggingNodesInitialPos=[]

        cy.on('tapstart', eTapStart = function(event) {
          tapStartPos = event.position || event.cyPosition;
          if(event.target.isNode && event.target.isNode() ){
            cy.boxSelectionEnabled(false)
            var selectedNodes=cy.nodes(':selected')
            if(!event.target.selected()) selectedNodes=selectedNodes.union(event.target)
            selectedNodes.forEach(ele=>{
              var pos=ele.position()
              draggingNodesInitialPos.push({n:ele,ox:pos.x,oy:pos.y})
            })
          } 
        });

        cy.on('tapstart', 'edge', eTapStartOnEdge = function (event) {
          var edge = this;

          if (!edgeToHighlight || edgeToHighlight.id() !== edge.id()) {
            createAnchorOnDrag = false;
            return;
          }
          
          movedEdge = edge;

          var type = anchorPointUtilities.getEdgeType(edge);

          // to avoid errors
          if(type === 'inconclusive')
            type = 'bend';
          
          var cyPosX = tapStartPos.x;
          var cyPosY = tapStartPos.y;
          
          // Get which end point has been clicked (Source:0, Target:1, None:-1)
          if(opts.disableReconnect) var endPoint=-1
          else endPoint = getContainingEndPoint(cyPosX, cyPosY, edge);
          if(endPoint == 0 || endPoint == 1){
            edge.unselect();
            movedEndPoint = endPoint;
            detachedNode = (endPoint == 0) ? movedEdge.source() : movedEdge.target();

            var disconnectedEnd = (endPoint == 0) ? 'source' : 'target';
            var result = reconnectionUtilities.disconnectEdge(movedEdge, cy, event.renderedPosition, disconnectedEnd);
            
            dummyNode = result.dummyNode;
            movedEdge = result.edge;

            disableGestures();
          }
          else {
            movedAnchorIndex = undefined;
            createAnchorOnDrag = true;
          }
        });

        cy.on('tapdrag', eTapDrag = function (event) {
          /** 
           * if there is a selected edge set autounselectify false
           * fixes the node-editing problem where nodes would get
           * unselected after resize drag
          */
          if (draggingNodesInitialPos.length>0 && shiftKeyState) {
            draggingNodesInitialPos.forEach(obj=>{
                var curPos=obj.n.position()
                var deltax=curPos.x-obj.ox;
                var deltay=curPos.y-obj.oy
                if(Math.abs(deltay)>Math.abs(deltax)){ //move in vertical direction
                  obj.n.position("x",obj.ox)
                }else{ //move in horizontal direction
                  obj.n.position("y",obj.oy)
                }
            })
          }
          if (!anchorManager.node && !anchorManager.edge) return;
          var eventPos = event.position || event.cyPosition;
          var eventRenderPos=event.renderedPosition
          if (anchorManager.edge) {//dragging edge anchor or edge itself to create anchor
            if (cy.edges(':selected').length > 0) cy.autounselectify(false);
            var edge = movedEdge;
            if (movedEdge !== undefined && anchorPointUtilities.isIgnoredEdge(edge)) return;
            var type = anchorPointUtilities.getEdgeType(edge);
            if (createAnchorOnDrag && opts.enableCreateAnchorOnDrag && !anchorTouched && type !== 'inconclusive') {
              // remember state before creating anchor
              var weightStr = anchorPointUtilities.syntax[type]['weight'];
              var distanceStr = anchorPointUtilities.syntax[type]['distance'];

              moveAnchorParam = {
                edge: edge,
                type: type,
                weights: edge.data(weightStr) ? [].concat(edge.data(weightStr)) : [],
                distances: edge.data(distanceStr) ? [].concat(edge.data(distanceStr)) : []
              };

              edge.unselect();

              // using tapstart position fixes bug on quick drags
              // --- 
              // also modified addAnchorPoint to return the index because
              // getContainingShapeIndex failed to find the created anchor on quick drags
              movedAnchorIndex = anchorPointUtilities.addAnchorPoint(edge, tapStartPos);
              movedEdge = edge;
              createAnchorOnDrag = undefined;
              anchorCreatedByDrag = true;
              disableGestures();
            }
            // if the tapstart did not hit an edge and it did not hit an anchor
            if (!anchorTouched && (movedEdge === undefined || (movedAnchorIndex === undefined && movedEndPoint === undefined))) {
              return;
            }
            // Update end point location (Source:0, Target:1)
            if (movedEndPoint != -1 && dummyNode) {
              dummyNode.position(eventPos);
            }
            // change location of anchor created by drag
            else if (movedAnchorIndex != undefined) {
              _moveAnchorOnDrag(edge, type, movedAnchorIndex, eventPos);
            }
            // change location of drag and dropped anchor
            else if (anchorTouched) {
              // the tapStartPos check is necessary when righ clicking anchor points
              // right clicking anchor points triggers MouseDown for Konva, but not tapstart for cy
              // when that happens tapStartPos is undefined
              if (anchorManager.touchedAnchorIndex === undefined && tapStartPos) {
                anchorManager.touchedAnchorIndex = getContainingShapeIndex(
                  tapStartPos.x,
                  tapStartPos.y,
                  anchorManager.edge);
              }

              if (anchorManager.touchedAnchorIndex !== undefined) {
                _moveAnchorOnDrag(
                  anchorManager.edge,
                  anchorManager.edgeType,
                  anchorManager.touchedAnchorIndex,
                  eventPos
                );
              }
            }

            if (event.target && event.target[0] && event.target.isNode()) {
              nodeToAttach = event.target;
            }
          } else if (anchorManager.node){ //draging node anchor
            if (!anchorTouched) return; 
            movedNode=anchorManager.node
            moveNodeAnchorOnDrag(anchorManager.node,eventRenderPos);
          }
        });
        
        cy.on('tapend', eTapEnd = function (event) {
          cy.boxSelectionEnabled(true)
          if(mouseOut){
            canvas.getStage().fire("contentMouseup");
          }

          var edge = movedEdge || anchorManager.edge; 
          if( edge !== undefined ) {
            var index = anchorManager.touchedAnchorIndex;
            if( index != undefined ) {
              var startX = edge.source().position('x');
              var startY = edge.source().position('y');
              var endX = edge.target().position('x');
              var endY = edge.target().position('y');
              
              var anchorList = anchorPointUtilities.getAnchorsAsArray(edge);
              var allAnchors = [startX, startY].concat(anchorList).concat([endX, endY]);
              
              var anchorIndex = index + 1;
              var preIndex = anchorIndex - 1;
              var posIndex = anchorIndex + 1;
              
              var anchor = {
                x: allAnchors[2 * anchorIndex],
                y: allAnchors[2 * anchorIndex + 1]
              };
              
              var preAnchorPoint = {
                x: allAnchors[2 * preIndex],
                y: allAnchors[2 * preIndex + 1]
              };
              
              var posAnchorPoint = {
                x: allAnchors[2 * posIndex],
                y: allAnchors[2 * posIndex + 1]
              };
              
              var nearToLine;
              
              if( ( anchor.x === preAnchorPoint.x && anchor.y === preAnchorPoint.y ) || ( anchor.x === preAnchorPoint.x && anchor.y === preAnchorPoint.y ) ) {
                nearToLine = true;
              }
              else {
                var m1 = ( preAnchorPoint.y - posAnchorPoint.y ) / ( preAnchorPoint.x - posAnchorPoint.x );
                var m2 = -1 / m1;

                var srcTgtPointsAndTangents = {
                  srcPoint: preAnchorPoint,
                  tgtPoint: posAnchorPoint,
                  m1: m1,
                  m2: m2
                };

                var currentIntersection = anchorPointUtilities.getIntersection(edge, anchor, srcTgtPointsAndTangents);
                var dist = Math.sqrt( Math.pow( (anchor.x - currentIntersection.x), 2 ) 
                        + Math.pow( (anchor.y - currentIntersection.y), 2 ));
                
                // remove the bend point if segment edge becomes straight
                var type = anchorPointUtilities.getEdgeType(edge);
                if( (type === 'bend' && dist  < options().bendRemovalSensitivity)) {
                  nearToLine = true;
                }
                
              }
              
              if(opts.enableRemoveAnchorMidOfNearLine && nearToLine )
              {
                anchorPointUtilities.removeAnchor(edge, index);
              }
              
            }
            else if(dummyNode != undefined && (movedEndPoint == 0 || movedEndPoint == 1) ){
              
              var newNode = detachedNode;
              var isValid = 'valid';
              var location = (movedEndPoint == 0) ? 'source' : 'target';

              // validate edge reconnection
              if(nodeToAttach){
                var newSource = (movedEndPoint == 0) ? nodeToAttach : edge.source();
                var newTarget = (movedEndPoint == 1) ? nodeToAttach : edge.target();
                if(typeof validateEdge === "function")
                  isValid = validateEdge(edge, newSource, newTarget);
                newNode = (isValid === 'valid') ? nodeToAttach : detachedNode;
              }

              var newSource = (movedEndPoint == 0) ? newNode : edge.source();
              var newTarget = (movedEndPoint == 1) ? newNode : edge.target();
              edge = reconnectionUtilities.connectEdge(edge, detachedNode, location);

              if(detachedNode.id() !== newNode.id()){
                // use given handleReconnectEdge function 
                if(typeof handleReconnectEdge === 'function'){
                  var reconnectedEdge = handleReconnectEdge(newSource.id(), newTarget.id(), edge.data());
                  
                  if(reconnectedEdge){
                    reconnectionUtilities.copyEdge(edge, reconnectedEdge);
                    anchorPointUtilities.initAnchorPoints(options().bendPositionsFunction, 
                                              options().controlPositionsFunction, [reconnectedEdge]);
                  }
                  
                  if(reconnectedEdge && options().undoable){
                    var params = {
                      newEdge: reconnectedEdge,
                      oldEdge: edge
                    };
                    cy.undoRedo().do('removeReconnectedEdge', params);
                    edge = reconnectedEdge;
                  }
                  else if(reconnectedEdge){
                    cy.remove(edge);
                    edge = reconnectedEdge;
                  }
                }
                else{
                  var loc = (movedEndPoint == 0) ? {source: newNode.id()} : {target: newNode.id()};
                  var oldLoc = (movedEndPoint == 0) ? {source: detachedNode.id()} : {target: detachedNode.id()};
                  
                  if(options().undoable && newNode.id() !== detachedNode.id()) {
                    var param = {
                      edge: edge,
                      location: loc,
                      oldLoc: oldLoc
                    };
                    var result = cy.undoRedo().do('reconnectEdge', param);
                    edge = result.edge;
                    //edge.select();
                  }
                }  
              }

              // invalid edge reconnection callback
              if(isValid !== 'valid' && typeof actOnUnsuccessfulReconnection === 'function'){
                actOnUnsuccessfulReconnection();
              }
              edge.select();
              cy.remove(dummyNode);
            }
            var type = anchorPointUtilities.getEdgeType(edge);

            // to avoid errors
            if(type === 'inconclusive'){
              type = 'bend';
            }
  
            if(anchorManager.touchedAnchorIndex === undefined && !anchorCreatedByDrag){
              moveAnchorParam = undefined;
            }
  
            var weightStr = anchorPointUtilities.syntax[type]['weight'];
            if (edge !== undefined && moveAnchorParam !== undefined && 
              (edge.data(weightStr) ? edge.data(weightStr).toString() : null) != moveAnchorParam.weights.toString()) {
              
              // anchor created from drag
              if (anchorCreatedByDrag) {
                edge.select();
                // stops the unbundled bezier edges from being unselected
                cy.autounselectify(true);
              }
  
              if(options().undoable) {
                cy.undoRedo().do('changeAnchorPoints', moveAnchorParam);
              }
            }
            //end of edge tapend processing
          }
          

          if (anchorManager.node) {
            var hasClass = false
            if (anchorManager.node.data('scaleFactor') == 1) anchorManager.node.removeData('scaleFactor')
            else if(anchorManager.node.data('scaleFactor') != null) hasClass = true
            if (anchorManager.node.data('rotateAngle') == 0) anchorManager.node.removeData('rotateAngle')
            else if(anchorManager.node.data('rotateAngle') != null) hasClass = true
            
            if (hasClass) anchorManager.node.addClass("edgebendediting_scaleRotate")
            else anchorManager.node.removeClass("edgebendediting_scaleRotate")
          
            if(moveAnchorParam){
              var oldScaleRotate={scale:moveAnchorParam.originalScaleFactor,rotate:moveAnchorParam.originalRotateAngle}
              if (options().undoable) {
                  cy.undoRedo().do('useScaleRotate', {"node":anchorManager.node,"newScaleRotate":{"scale":anchorManager.node.data('scaleFactor')||1,"rotate":anchorManager.node.data('rotateAngle')||0},"oldScaleRotate":oldScaleRotate} );
              }
            }

            if(nodeToHighlight!=event.target){
              anchorManager.node.removeClass('cy-node-editing-highlight');
              nodeToHighlight=undefined;
            }

            var theNode=movedNode
            setTimeout(()=>{
              if(cy.$(":selected").length==0 && theNode) theNode.select()
            },50)
            //quite confused code in edge editing part, delay a bit so programmtically select will work again
          }
          draggingNodesInitialPos.length=0
          movedAnchorIndex = undefined;
          movedEdge = undefined;
          movedNode = undefined;
          moveAnchorParam = undefined;
          createAnchorOnDrag = undefined;
          movedEndPoint = undefined;
          dummyNode = undefined;
          detachedNode = undefined;
          nodeToAttach = undefined;
          tapStartPos = undefined;
          anchorCreatedByDrag = false;

          anchorManager.touchedAnchorIndex = undefined; 
          resetGestures();
          setTimeout(function(){refreshDraws()}, 50);
        });

        //Variables used for starting and ending the movement of anchor points with arrows
        var moveanchorparam;
        var firstAnchor;
        var edgeContainingFirstAnchor;
        var firstAnchorPointFound;
        cy.on("edgeediting.movestart", function (e, edges) {
            firstAnchorPointFound = false;
            if (edges[0] != undefined)
            {
                edges.forEach(function( edge ){
                  if (anchorPointUtilities.getAnchorsAsArray(edge) != undefined && !firstAnchorPointFound)
                  {
                      firstAnchor = { x: anchorPointUtilities.getAnchorsAsArray(edge)[0], y: anchorPointUtilities.getAnchorsAsArray(edge)[1]};
                      moveanchorparam = {
                          firstTime: true,
                          firstAnchorPosition: {
                              x: firstAnchor.x,
                              y: firstAnchor.y
                          },
                          edges: edges
                      };
                      edgeContainingFirstAnchor = edge;
                      firstAnchorPointFound = true;
                  }
                });
            }
        });

        cy.on("edgeediting.moveend", function (e, edges) {
            if (moveanchorparam != undefined)
            {
                var initialPos = moveanchorparam.firstAnchorPosition;
                var movedFirstAnchor = {
                    x: anchorPointUtilities.getAnchorsAsArray(edgeContainingFirstAnchor)[0],
                    y: anchorPointUtilities.getAnchorsAsArray(edgeContainingFirstAnchor)[1]
                };


                moveanchorparam.positionDiff = {
                    x: -movedFirstAnchor.x + initialPos.x,
                    y: -movedFirstAnchor.y + initialPos.y
                }

                delete moveanchorparam.firstAnchorPosition;

                if(options().undoable) {
                    cy.undoRedo().do("moveAnchorPoints", moveanchorparam);
                }

                moveanchorparam = undefined;
            }
        });

        cy.on('cxttap', eCxtTap = function (event) {
          var target = event.target || event.cyTarget;
          var targetIsEdge = false;

          try{
            targetIsEdge = target.isEdge();
          }
          catch(err){
            // this is here just to suppress the error
          }

          var edge, type;
          if(targetIsEdge){
            edge = target;
            type = anchorPointUtilities.getEdgeType(edge);
          }
          else{
            edge = anchorManager.edge;          
            type = anchorManager.edgeType;
          }

          var menus = cy.contextMenus('get'); // get context menus instance
          
          if(!edgeToHighlight || edgeToHighlight.id() != edge.id() || anchorPointUtilities.isIgnoredEdge(edge) ||
              edgeToHighlight !== edge) {
            menus.hideMenuItem(removeBendPointCxtMenuId);
            menus.hideMenuItem(addBendPointCxtMenuId);
            menus.hideMenuItem(removeControlPointCxtMenuId);
            menus.hideMenuItem(addControlPointCxtMenuId);
            return;
          }

          var cyPos = event.position || event.cyPosition;
          var selectedIndex = getContainingShapeIndex(cyPos.x, cyPos.y, edge);
          // not clicked on an anchor
          if (selectedIndex == -1) {
            menus.hideMenuItem(removeBendPointCxtMenuId);
            menus.hideMenuItem(removeControlPointCxtMenuId);
            if(type === 'control' && targetIsEdge){
              menus.showMenuItem(addControlPointCxtMenuId);
              menus.hideMenuItem(addBendPointCxtMenuId);
            }
            else if(type === 'bend' && targetIsEdge){
              menus.showMenuItem(addBendPointCxtMenuId);
              menus.hideMenuItem(addControlPointCxtMenuId);
            }
            else if (targetIsEdge){
              menus.showMenuItem(addBendPointCxtMenuId);
              menus.showMenuItem(addControlPointCxtMenuId);
            }
            else {
              menus.hideMenuItem(addBendPointCxtMenuId);
              menus.hideMenuItem(addControlPointCxtMenuId);
            }
            anchorPointUtilities.currentCtxPos = cyPos;
          }
          // clicked on an anchor
          else {
            menus.hideMenuItem(addBendPointCxtMenuId);
            menus.hideMenuItem(addControlPointCxtMenuId);
            if(type === 'control'){
              menus.showMenuItem(removeControlPointCxtMenuId);
              menus.hideMenuItem(removeBendPointCxtMenuId);
              if (opts.enableMultipleAnchorRemovalOption && 
                  edge.hasClass('edgecontrolediting-hasmultiplecontrolpoints')) {
                menus.showMenuItem(removeAllControlPointCtxMenuId);
              }
            }
            else if(type === 'bend'){
              menus.showMenuItem(removeBendPointCxtMenuId);
              menus.hideMenuItem(removeControlPointCxtMenuId);
            }
            else{
              menus.hideMenuItem(removeBendPointCxtMenuId);
              menus.hideMenuItem(removeControlPointCxtMenuId);
              menus.hideMenuItem(removeAllControlPointCtxMenuId);
            }
            anchorPointUtilities.currentAnchorIndex = selectedIndex;
          }

          anchorPointUtilities.currentCtxEdge = edge;
        });
        
        cy.on('cyedgeediting.changeAnchorPoints', 'edge', function() {
          var edge = this;
          cy.startBatch();
          cy.edges().unselect(); 
                    
          // Listener defined in other extension
          // Might have compatibility issues after the unbundled bezier    
          cy.trigger('bendPointMovement');    
          
          cy.endBatch();          
          refreshDraws();
        
          
        });
      }

      var selectedEdges;
      var anchorsMoving = false;

      // track arrow key presses, default false
      // event.keyCode normally returns number
      // but JS will convert to string anyway
      var keys = {
        '37': false,
        '38': false,
        '39': false,
        '40': false
      };
      var shiftKeyState=false

      function keyDown(e) {
          shiftKeyState=e.shiftKey
          var shouldMove = typeof options().moveSelectedAnchorsOnKeyEvents === 'function'
              ? options().moveSelectedAnchorsOnKeyEvents() : options().moveSelectedAnchorsOnKeyEvents;

          if (!shouldMove) {
              return;
          }

          //Checks if the tagname is textarea or input
          var tn = document.activeElement.tagName;
          if (tn != "TEXTAREA" && tn != "INPUT")
          {
              switch(e.keyCode){
                  case 37: case 39: case 38:  case 40: // Arrow keys
                  case 32: e.preventDefault(); break; // Space
                  default: break; // do not block other keys
              }
              if (e.keyCode < '37' || e.keyCode > '40') {
                  return;
              }
              keys[e.keyCode] = true;

              //Checks if only edges are selected (not any node) and if only 1 edge is selected
              //If the second checking is removed the anchors of multiple edges would move
              if (cy.edges(":selected").length != cy.elements(":selected").length || cy.edges(":selected").length != 1)
              {
                return;
              }
              if (!anchorsMoving)
              {
                  selectedEdges = cy.edges(':selected');
                  cy.trigger("edgeediting.movestart", [selectedEdges]);
                  anchorsMoving = true;
              }
              var moveSpeed = 3;
                    
              // doesn't make sense if alt and shift both pressed
              if(e.altKey && e.shiftKey) {
                return;
              }
              else if (e.altKey) {
                moveSpeed = 1;
              }
              else if (e.shiftKey) {
                moveSpeed = 10;
              }

              var upArrowCode = 38;
              var downArrowCode = 40;
              var leftArrowCode = 37;
              var rightArrowCode = 39;

              var dx = 0;
              var dy = 0;

              dx += keys[rightArrowCode] ? moveSpeed : 0;
              dx -= keys[leftArrowCode] ? moveSpeed : 0;
              dy += keys[downArrowCode] ? moveSpeed : 0;
              dy -= keys[upArrowCode] ? moveSpeed : 0;

              moveAnchorPoints({x:dx, y:dy}, selectedEdges);
          }
      }
      function keyUp(e) {
          shiftKeyState=e.shiftKey
          if (e.keyCode < '37' || e.keyCode > '40') {
              return;
          }
          e.preventDefault();
          keys[e.keyCode] = false;
          var shouldMove = typeof options().moveSelectedAnchorsOnKeyEvents === 'function'
              ? options().moveSelectedAnchorsOnKeyEvents() : options().moveSelectedAnchorsOnKeyEvents;

          if (!shouldMove) {
              return;
          }

          cy.trigger("edgeediting.moveend", [selectedEdges]);
          selectedEdges = undefined;
          anchorsMoving = false;

      }
      document.addEventListener("keydown",keyDown, true);
      document.addEventListener("keyup",keyUp, true);

      $container.data('cyedgeediting', data);
    },
    unbind: function () {
        cy.off('remove', 'node', eRemove)
          .off('add', 'node', eAdd)
          .off('style', 'edge.edgebendediting-hasbendpoints:selected, edge.edgecontrolediting-hascontrolpoints:selected', eStyle)
          .off('select', 'edge', eSelect)
          .off('unselect', 'edge', eUnselect)
          .off('select', 'node', nSelect)
          .off('unselect', 'node', nUnselect)
          .off('tapstart', eTapStart)
          .off('tapstart', 'edge', eTapStartOnEdge)
          .off('tapdrag', eTapDrag)
          .off('tapend', eTapEnd)
          .off('cxttap', eCxtTap)

        cy.unbind("zoom pan", eZoom);
        cy.unbind("drag",nDrag)
    }
  };

  if (functions[fn]) {
    return functions[fn].apply($(cy.container()), Array.prototype.slice.call(arguments, 1));
  } else if (typeof fn == 'object' || !fn) {
    return functions.init.apply($(cy.container()), arguments);
  } else {
    $.error('No such function `' + fn + '` for cytoscape.js-edge-editing');
  }

  return $(this);
};
