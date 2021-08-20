module.exports = function (cy, anchorPointUtilities, params) {
  if (cy.undoRedo == null)
    return;

  var ur = cy.undoRedo({
    defaultActions: false,
    isDebug: true
  });

  function changeAnchorPoints(param) {
    var edge = cy.getElementById(param.edge.id());
    var type = param.type !== 'inconclusive' ? param.type : anchorPointUtilities.getEdgeType(edge);
    
    var weights, distances, weightStr, distanceStr;

    if(param.type === 'inconclusive' && !param.set){
      weights = [];
      distances = [];
    }
    else {
      weightStr = anchorPointUtilities.syntax[type]['weight'];
      distanceStr = anchorPointUtilities.syntax[type]['distance'];

      weights = param.set ? edge.data(weightStr) : param.weights;
      distances = param.set ? edge.data(distanceStr) : param.distances;
    }

    var result = {
      edge: edge,
      type: type,
      weights: weights,
      distances: distances,
      //As the result will not be used for the first function call params should be used to set the data
      set: true
    };

    //Check if we need to set the weights and distances by the param values
    if (param.set) {
      var hadAnchorPoint = param.weights && param.weights.length > 0;
      var hadMultipleAnchorPoints = hadAnchorPoint && param.weights.length > 1;

      hadAnchorPoint ? edge.data(weightStr, param.weights) : edge.removeData(weightStr);
      hadAnchorPoint ? edge.data(distanceStr, param.distances) : edge.removeData(distanceStr);

      var singleClassName = anchorPointUtilities.syntax[type]['class'];
      var multiClassName = anchorPointUtilities.syntax[type]['multiClass'];

      // Refresh the curve style as the number of anchor point would be changed by the previous operation
      // Adding or removing multi classes at once can cause errors. If multiple classes are to be added,
      // just add them together in space delimeted class names format.
      if (!hadAnchorPoint && !hadMultipleAnchorPoints) {
        // Remove multiple classes from edge with space delimeted string of class names 
        edge.removeClass(singleClassName + " " + multiClassName);
      }
      else if (hadAnchorPoint && !hadMultipleAnchorPoints) { // Had single anchor
        edge.addClass(singleClassName);
        edge.removeClass(multiClassName);   
      }
      else {
        // Had multiple anchors. Add multiple classes with space delimeted string of class names
        edge.addClass(singleClassName + " " + multiClassName);
      }
      if (!edge.selected())
        edge.select();
      else {
        edge.unselect();
        edge.select();
      }
    }
    
    edge.trigger('cyedgeediting.changeAnchorPoints');

    return result;
  }

  function moveDo(arg) {
      if (arg.firstTime) {
          delete arg.firstTime;
          return arg;
      }

      var edges = arg.edges;
      var positionDiff = arg.positionDiff;
      var result = {
          edges: edges,
          positionDiff: {
              x: -positionDiff.x,
              y: -positionDiff.y
          }
      };
      moveAnchorsUndoable(positionDiff, edges);

      return result;
  }

  function moveAnchorsUndoable(positionDiff, edges) {
      edges.forEach(function( edge ){
          var type = anchorPointUtilities.getEdgeType(edge);
          var previousAnchorsPosition = anchorPointUtilities.getAnchorsAsArray(edge);
          var nextAnchorsPosition = [];
          if (previousAnchorsPosition != undefined)
          {
              for (var i=0; i<previousAnchorsPosition.length; i+=2)
              {
                  nextAnchorsPosition.push({x: previousAnchorsPosition[i]+positionDiff.x, y: previousAnchorsPosition[i+1]+positionDiff.y});
              }
              edge.data(anchorPointUtilities.syntax[type]['pointPos'], nextAnchorsPosition);
          }
      });

      anchorPointUtilities.initAnchorPoints(params.bendPositionsFunction, params.controlPositionsFunction, edges);
  }

  function reconnectEdge(param){
    var edge      = param.edge;
    var location  = param.location;
    var oldLoc    = param.oldLoc;

    edge = edge.move(location)[0];

    var result = {
      edge:     edge,
      location: oldLoc,
      oldLoc:   location
    }
    edge.unselect();
    return result;
  }

  function removeReconnectedEdge(param){
    var oldEdge = param.oldEdge;
    var tmp = cy.getElementById(oldEdge.data('id'));
    if(tmp && tmp.length > 0)
      oldEdge = tmp;

    var newEdge = param.newEdge;
    var tmp = cy.getElementById(newEdge.data('id'));
    if(tmp && tmp.length > 0)
      newEdge = tmp;

    if(oldEdge.inside()){
      oldEdge = oldEdge.remove()[0];
    } 
      
    if(newEdge.removed()){
      newEdge = newEdge.restore();
      newEdge.unselect();
    }
    
    return {
      oldEdge: newEdge,
      newEdge: oldEdge
    };
  }

  function applyScaleRotate() {
    var executeScaleRotate=(node,scale,rotate)=>{
      if(scale!=1) node.data('scaleFactor',scale)
      else node.removeData('scaleFactor')
      if(rotate!=0) node.data('rotateAngle',rotate)
      else node.removeData('rotateAngle')
      if(scale==1 && rotate==0) node.removeClass("edgebendediting_scaleRotate")
      else node.addClass("edgebendediting_scaleRotate")
    }
    ur.action( "useScaleRotate"
        , (arg)=>{
            executeScaleRotate(arg.node,arg.newScaleRotate.scale,arg.newScaleRotate.rotate)      
            return arg
        }
        , (arg)=>{
            arg.node.unselect()
            executeScaleRotate(arg.node,arg.oldScaleRotate.scale,arg.oldScaleRotate.rotate)
            return arg
        }
    )
  }


  applyScaleRotate()
  ur.action('changeAnchorPoints', changeAnchorPoints, changeAnchorPoints);
  ur.action('moveAnchorPoints', moveDo, moveDo);
  ur.action('reconnectEdge', reconnectEdge, reconnectEdge);
  ur.action('removeReconnectedEdge', removeReconnectedEdge, removeReconnectedEdge);
};
