(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["cytoscapeEdgeEditing"] = factory();
	else
		root["cytoscapeEdgeEditing"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 964:
/***/ ((module) => {



var anchorPointUtilities = {
  currentCtxEdge: undefined,
  currentCtxPos: undefined,
  currentAnchorIndex: undefined,
  ignoredClasses: undefined,
  setIgnoredClasses: function setIgnoredClasses(_ignoredClasses) {
    this.ignoredClasses = _ignoredClasses;
  },
  syntax: {
    bend: {
      edge: "segments",
      class: "edgebendediting-hasbendpoints",
      multiClass: "edgebendediting-hasmultiplebendpoints",
      weight: "cyedgebendeditingWeights",
      distance: "cyedgebendeditingDistances",
      weightCss: "segment-weights",
      distanceCss: "segment-distances",
      pointPos: "bendPointPositions"
    },
    control: {
      edge: "unbundled-bezier",
      class: "edgecontrolediting-hascontrolpoints",
      multiClass: "edgecontrolediting-hasmultiplecontrolpoints",
      weight: "cyedgecontroleditingWeights",
      distance: "cyedgecontroleditingDistances",
      weightCss: "control-point-weights",
      distanceCss: "control-point-distances",
      pointPos: "controlPointPositions"
    }
  },
  // gets edge type as 'bend' or 'control'
  // the interchanging if-s are necessary to set the priority of the tags
  // example: an edge with type segment and a class 'hascontrolpoints' will be classified as unbundled bezier
  getEdgeType: function getEdgeType(edge) {
    if (!edge) return 'inconclusive';else if (edge.hasClass(this.syntax['bend']['class'])) return 'bend';else if (edge.hasClass(this.syntax['control']['class'])) return 'control';else if (edge.css('curve-style') === this.syntax['bend']['edge']) return 'bend';else if (edge.css('curve-style') === this.syntax['control']['edge']) return 'control';else if (edge.data(this.syntax['bend']['pointPos']) && edge.data(this.syntax['bend']['pointPos']).length > 0) return 'bend';else if (edge.data(this.syntax['control']['pointPos']) && edge.data(this.syntax['control']['pointPos']).length > 0) return 'control';
    return 'inconclusive';
  },
  // initilize anchor points based on bendPositionsFcn and controlPositionFcn
  initAnchorPoints: function initAnchorPoints(bendPositionsFcn, controlPositionsFcn, edges) {
    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      var type = this.getEdgeType(edge);

      if (type === 'inconclusive') {
        continue;
      }

      if (!this.isIgnoredEdge(edge)) {

        var anchorPositions;

        // get the anchor positions by applying the functions for this edge
        if (type === 'bend') anchorPositions = bendPositionsFcn.apply(this, edge);else if (type === 'control') anchorPositions = controlPositionsFcn.apply(this, edge);

        // calculate relative anchor positions
        var result = this.convertToRelativePositions(edge, anchorPositions);

        // if there are anchors set weights and distances accordingly and add class to enable style changes
        if (result.distances.length > 0) {
          edge.data(this.syntax[type]['weight'], result.weights);
          edge.data(this.syntax[type]['distance'], result.distances);
          edge.addClass(this.syntax[type]['class']);
          if (result.distances.length > 1) {
            edge.addClass(this.syntax[type]['multiClass']);
          }
        }
      }
    }
  },

  isIgnoredEdge: function isIgnoredEdge(edge) {

    var startX = edge.source().position('x');
    var startY = edge.source().position('y');
    var endX = edge.target().position('x');
    var endY = edge.target().position('y');

    if (startX == endX && startY == endY || edge.source().id() == edge.target().id()) {
      return true;
    }
    for (var i = 0; this.ignoredClasses && i < this.ignoredClasses.length; i++) {
      if (edge.hasClass(this.ignoredClasses[i])) return true;
    }
    return false;
  },
  //Get the direction of the line from source point to the target point
  getLineDirection: function getLineDirection(srcPoint, tgtPoint) {
    if (srcPoint.y == tgtPoint.y && srcPoint.x < tgtPoint.x) {
      return 1;
    }
    if (srcPoint.y < tgtPoint.y && srcPoint.x < tgtPoint.x) {
      return 2;
    }
    if (srcPoint.y < tgtPoint.y && srcPoint.x == tgtPoint.x) {
      return 3;
    }
    if (srcPoint.y < tgtPoint.y && srcPoint.x > tgtPoint.x) {
      return 4;
    }
    if (srcPoint.y == tgtPoint.y && srcPoint.x > tgtPoint.x) {
      return 5;
    }
    if (srcPoint.y > tgtPoint.y && srcPoint.x > tgtPoint.x) {
      return 6;
    }
    if (srcPoint.y > tgtPoint.y && srcPoint.x == tgtPoint.x) {
      return 7;
    }
    return 8; //if srcPoint.y > tgtPoint.y and srcPoint.x < tgtPoint.x
  },
  getSrcTgtPointsAndTangents: function getSrcTgtPointsAndTangents(edge) {
    var sourceNode = edge.source();
    var targetNode = edge.target();

    var tgtPosition = targetNode.position();
    var srcPosition = sourceNode.position();

    var srcPoint = sourceNode.position();
    var tgtPoint = targetNode.position();

    var m1 = (tgtPoint.y - srcPoint.y) / (tgtPoint.x - srcPoint.x);
    var m2 = -1 / m1;

    return {
      m1: m1,
      m2: m2,
      srcPoint: srcPoint,
      tgtPoint: tgtPoint
    };
  },
  getIntersection: function getIntersection(edge, point, srcTgtPointsAndTangents) {
    if (srcTgtPointsAndTangents === undefined) {
      srcTgtPointsAndTangents = this.getSrcTgtPointsAndTangents(edge);
    }

    var srcPoint = srcTgtPointsAndTangents.srcPoint;
    var tgtPoint = srcTgtPointsAndTangents.tgtPoint;
    var m1 = srcTgtPointsAndTangents.m1;
    var m2 = srcTgtPointsAndTangents.m2;

    var intersectX;
    var intersectY;

    if (m1 == Infinity || m1 == -Infinity) {
      intersectX = srcPoint.x;
      intersectY = point.y;
    } else if (m1 == 0) {
      intersectX = point.x;
      intersectY = srcPoint.y;
    } else {
      var a1 = srcPoint.y - m1 * srcPoint.x;
      var a2 = point.y - m2 * point.x;

      intersectX = (a2 - a1) / (m1 - m2);
      intersectY = m1 * intersectX + a1;
    }

    //Intersection point is the intersection of the lines passing through the nodes and
    //passing through the bend or control point and perpendicular to the other line
    var intersectionPoint = {
      x: intersectX,
      y: intersectY
    };

    return intersectionPoint;
  },
  getAnchorsAsArray: function getAnchorsAsArray(edge) {
    var type = this.getEdgeType(edge);

    if (type === 'inconclusive') {
      return undefined;
    }

    if (edge.css('curve-style') !== this.syntax[type]['edge']) {
      return undefined;
    }

    var anchorList = [];

    var weights = edge.pstyle(this.syntax[type]['weightCss']) ? edge.pstyle(this.syntax[type]['weightCss']).pfValue : [];
    var distances = edge.pstyle(this.syntax[type]['distanceCss']) ? edge.pstyle(this.syntax[type]['distanceCss']).pfValue : [];
    var minLengths = Math.min(weights.length, distances.length);

    var srcPos = edge.source().position();
    var tgtPos = edge.target().position();

    var dy = tgtPos.y - srcPos.y;
    var dx = tgtPos.x - srcPos.x;

    var l = Math.sqrt(dx * dx + dy * dy);

    var vector = {
      x: dx,
      y: dy
    };

    var vectorNorm = {
      x: vector.x / l,
      y: vector.y / l
    };

    var vectorNormInverse = {
      x: -vectorNorm.y,
      y: vectorNorm.x
    };

    for (var s = 0; s < minLengths; s++) {
      var w = weights[s];
      var d = distances[s];

      var w1 = 1 - w;
      var w2 = w;

      var posPts = {
        x1: srcPos.x,
        x2: tgtPos.x,
        y1: srcPos.y,
        y2: tgtPos.y
      };

      var midptPts = posPts;

      var adjustedMidpt = {
        x: midptPts.x1 * w1 + midptPts.x2 * w2,
        y: midptPts.y1 * w1 + midptPts.y2 * w2
      };

      anchorList.push(adjustedMidpt.x + vectorNormInverse.x * d, adjustedMidpt.y + vectorNormInverse.y * d);
    }

    return anchorList;
  },
  convertToAnchorAbsolutePositions: function convertToAnchorAbsolutePositions(edge, type, anchorIndex) {
    var srcPos = edge.source().position();
    var tgtPos = edge.target().position();
    var weights = edge.data(this.syntax[type]['weight']);
    var distances = edge.data(this.syntax[type]['distance']);
    var w = weights[anchorIndex];
    var d = distances[anchorIndex];
    var dy = tgtPos.y - srcPos.y;
    var dx = tgtPos.x - srcPos.x;
    var l = Math.sqrt(dx * dx + dy * dy);
    var vector = {
      x: dx,
      y: dy
    };
    var vectorNorm = {
      x: vector.x / l,
      y: vector.y / l
    };
    var vectorNormInverse = {
      x: -vectorNorm.y,
      y: vectorNorm.x
    };

    var w1 = 1 - w;
    var w2 = w;
    var midX = srcPos.x * w1 + tgtPos.x * w2;
    var midY = srcPos.y * w1 + tgtPos.y * w2;
    var absoluteX = midX + vectorNormInverse.x * d;
    var absoluteY = midY + vectorNormInverse.y * d;

    return { x: absoluteX, y: absoluteY };
  },
  obtainPrevAnchorAbsolutePositions: function obtainPrevAnchorAbsolutePositions(edge, type, anchorIndex) {
    if (anchorIndex <= 0) {
      return edge.source().position();
    } else {
      return this.convertToAnchorAbsolutePositions(edge, type, anchorIndex - 1);
    }
  },
  obtainNextAnchorAbsolutePositions: function obtainNextAnchorAbsolutePositions(edge, type, anchorIndex) {
    var weights = edge.data(this.syntax[type]['weight']);
    var distances = edge.data(this.syntax[type]['distance']);
    var minLengths = Math.min(weights.length, distances.length);
    if (anchorIndex >= minLengths - 1) {
      return edge.target().position();
    } else {
      return this.convertToAnchorAbsolutePositions(edge, type, anchorIndex + 1);
    }
  },
  convertToRelativePosition: function convertToRelativePosition(edge, point, srcTgtPointsAndTangents) {
    if (srcTgtPointsAndTangents === undefined) {
      srcTgtPointsAndTangents = this.getSrcTgtPointsAndTangents(edge);
    }

    var intersectionPoint = this.getIntersection(edge, point, srcTgtPointsAndTangents);
    var intersectX = intersectionPoint.x;
    var intersectY = intersectionPoint.y;

    var srcPoint = srcTgtPointsAndTangents.srcPoint;
    var tgtPoint = srcTgtPointsAndTangents.tgtPoint;

    var weight;

    if (intersectX != srcPoint.x) {
      weight = (intersectX - srcPoint.x) / (tgtPoint.x - srcPoint.x);
    } else if (intersectY != srcPoint.y) {
      weight = (intersectY - srcPoint.y) / (tgtPoint.y - srcPoint.y);
    } else {
      weight = 0;
    }

    var distance = Math.sqrt(Math.pow(intersectY - point.y, 2) + Math.pow(intersectX - point.x, 2));

    //Get the direction of the line form source point to target point
    var direction1 = this.getLineDirection(srcPoint, tgtPoint);
    //Get the direction of the line from intesection point to the point
    var direction2 = this.getLineDirection(intersectionPoint, point);

    //If the difference is not -2 and not 6 then the direction of the distance is negative
    if (direction1 - direction2 != -2 && direction1 - direction2 != 6) {
      if (distance != 0) distance = -1 * distance;
    }

    return {
      weight: weight,
      distance: distance
    };
  },
  convertToRelativePositions: function convertToRelativePositions(edge, anchorPoints) {
    var srcTgtPointsAndTangents = this.getSrcTgtPointsAndTangents(edge);

    var weights = [];
    var distances = [];

    for (var i = 0; anchorPoints && i < anchorPoints.length; i++) {
      var anchor = anchorPoints[i];
      var relativeAnchorPosition = this.convertToRelativePosition(edge, anchor, srcTgtPointsAndTangents);

      weights.push(relativeAnchorPosition.weight);
      distances.push(relativeAnchorPosition.distance);
    }

    return {
      weights: weights,
      distances: distances
    };
  },
  getDistancesString: function getDistancesString(edge, type) {
    var str = "";

    var distances = edge.data(this.syntax[type]['distance']);
    for (var i = 0; distances && i < distances.length; i++) {
      str = str + " " + distances[i];
    }

    return str;
  },
  getWeightsString: function getWeightsString(edge, type) {
    var str = "";

    var weights = edge.data(this.syntax[type]['weight']);
    for (var i = 0; weights && i < weights.length; i++) {
      str = str + " " + weights[i];
    }

    return str;
  },
  addAnchorPoint: function addAnchorPoint(edge, newAnchorPoint) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

    if (edge === undefined || newAnchorPoint === undefined) {
      edge = this.currentCtxEdge;
      newAnchorPoint = this.currentCtxPos;
    }

    if (type === undefined) type = this.getEdgeType(edge);

    var weightStr = this.syntax[type]['weight'];
    var distanceStr = this.syntax[type]['distance'];

    var relativePosition = this.convertToRelativePosition(edge, newAnchorPoint);
    var originalAnchorWeight = relativePosition.weight;

    var startX = edge.source().position('x');
    var startY = edge.source().position('y');
    var endX = edge.target().position('x');
    var endY = edge.target().position('y');
    var startWeight = this.convertToRelativePosition(edge, { x: startX, y: startY }).weight;
    var endWeight = this.convertToRelativePosition(edge, { x: endX, y: endY }).weight;
    var weightsWithTgtSrc = [startWeight].concat(edge.data(weightStr) ? edge.data(weightStr) : []).concat([endWeight]);

    var anchorsList = this.getAnchorsAsArray(edge);

    var minDist = Infinity;
    var intersection;
    var ptsWithTgtSrc = [startX, startY].concat(anchorsList ? anchorsList : []).concat([endX, endY]);
    var newAnchorIndex = -1;

    for (var i = 0; i < weightsWithTgtSrc.length - 1; i++) {
      var w1 = weightsWithTgtSrc[i];
      var w2 = weightsWithTgtSrc[i + 1];

      //check if the weight is between w1 and w2
      var b1 = this.compareWithPrecision(originalAnchorWeight, w1, true);
      var b2 = this.compareWithPrecision(originalAnchorWeight, w2);
      var b3 = this.compareWithPrecision(originalAnchorWeight, w2, true);
      var b4 = this.compareWithPrecision(originalAnchorWeight, w1);
      if (b1 && b2 || b3 && b4) {
        var startX = ptsWithTgtSrc[2 * i];
        var startY = ptsWithTgtSrc[2 * i + 1];
        var endX = ptsWithTgtSrc[2 * i + 2];
        var endY = ptsWithTgtSrc[2 * i + 3];

        var start = {
          x: startX,
          y: startY
        };

        var end = {
          x: endX,
          y: endY
        };

        var m1 = (startY - endY) / (startX - endX);
        var m2 = -1 / m1;

        var srcTgtPointsAndTangents = {
          srcPoint: start,
          tgtPoint: end,
          m1: m1,
          m2: m2
        };

        var currentIntersection = this.getIntersection(edge, newAnchorPoint, srcTgtPointsAndTangents);
        var dist = Math.sqrt(Math.pow(newAnchorPoint.x - currentIntersection.x, 2) + Math.pow(newAnchorPoint.y - currentIntersection.y, 2));

        //Update the minimum distance
        if (dist < minDist) {
          minDist = dist;
          intersection = currentIntersection;
          newAnchorIndex = i;
        }
      }
    }

    if (intersection !== undefined) {
      newAnchorPoint = intersection;
    }

    relativePosition = this.convertToRelativePosition(edge, newAnchorPoint);

    if (intersection === undefined) {
      relativePosition.distance = 0;
    }

    var weights = edge.data(weightStr);
    var distances = edge.data(distanceStr);

    weights = weights ? weights : [];
    distances = distances ? distances : [];

    if (weights.length === 0) {
      newAnchorIndex = 0;
    }

    //    weights.push(relativeBendPosition.weight);
    //    distances.push(relativeBendPosition.distance);
    if (newAnchorIndex != -1) {
      weights.splice(newAnchorIndex, 0, relativePosition.weight);
      distances.splice(newAnchorIndex, 0, relativePosition.distance);
    }

    edge.data(weightStr, weights);
    edge.data(distanceStr, distances);

    edge.addClass(this.syntax[type]['class']);
    if (weights.length > 1 || distances.length > 1) {
      edge.addClass(this.syntax[type]['multiClass']);
    }

    return newAnchorIndex;
  },
  removeAnchor: function removeAnchor(edge, anchorIndex) {
    if (edge === undefined || anchorIndex === undefined) {
      edge = this.currentCtxEdge;
      anchorIndex = this.currentAnchorIndex;
    }

    var type = this.getEdgeType(edge);

    if (this.edgeTypeInconclusiveShouldntHappen(type, "anchorPointUtilities.js, removeAnchor")) {
      return;
    }

    var distanceStr = this.syntax[type]['weight'];
    var weightStr = this.syntax[type]['distance'];
    var positionDataStr = this.syntax[type]['pointPos'];

    var distances = edge.data(distanceStr);
    var weights = edge.data(weightStr);
    var positions = edge.data(positionDataStr);

    distances.splice(anchorIndex, 1);
    weights.splice(anchorIndex, 1);
    // position data is not given in demo so it throws error here
    // but it should be from the beginning
    if (positions) positions.splice(anchorIndex, 1);

    // only one anchor point left on edge
    if (distances.length == 1 || weights.length == 1) {
      edge.removeClass(this.syntax[type]['multiClass']);
    }
    // no more anchor points on edge
    else if (distances.length == 0 || weights.length == 0) {
        edge.removeClass(this.syntax[type]['class']);
        edge.data(distanceStr, []);
        edge.data(weightStr, []);
      } else {
        edge.data(distanceStr, distances);
        edge.data(weightStr, weights);
      }
  },
  removeAllAnchors: function removeAllAnchors(edge) {
    if (edge === undefined) {
      edge = this.currentCtxEdge;
    }
    var type = this.getEdgeType(edge);

    if (this.edgeTypeInconclusiveShouldntHappen(type, "anchorPointUtilities.js, removeAllAnchors")) {
      return;
    }

    // Remove classes from edge
    edge.removeClass(this.syntax[type]['class']);
    edge.removeClass(this.syntax[type]['multiClass']);

    // Remove all anchor point data from edge
    var distanceStr = this.syntax[type]['weight'];
    var weightStr = this.syntax[type]['distance'];
    var positionDataStr = this.syntax[type]['pointPos'];
    edge.data(distanceStr, []);
    edge.data(weightStr, []);
    // position data is not given in demo so it throws error here
    // but it should be from the beginning
    if (edge.data(positionDataStr)) {
      edge.data(positionDataStr, []);
    }
  },
  calculateDistance: function calculateDistance(pt1, pt2) {
    var diffX = pt1.x - pt2.x;
    var diffY = pt1.y - pt2.y;

    var dist = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    return dist;
  },
  /** (Less than or equal to) and (greater then equal to) comparisons with floating point numbers */
  compareWithPrecision: function compareWithPrecision(n1, n2) {
    var isLessThenOrEqual = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var precision = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.01;

    var diff = n1 - n2;
    if (Math.abs(diff) <= precision) {
      return true;
    }
    if (isLessThenOrEqual) {
      return n1 < n2;
    } else {
      return n1 > n2;
    }
  },
  edgeTypeInconclusiveShouldntHappen: function edgeTypeInconclusiveShouldntHappen(type, place) {
    if (type === 'inconclusive') {
      console.log("In " + place + ": edge type inconclusive should never happen here!!");
      return true;
    }
    return false;
  }
};

module.exports = anchorPointUtilities;

/***/ }),

/***/ 347:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var debounce = __webpack_require__(218);
var anchorPointUtilities = __webpack_require__(964);
var reconnectionUtilities = __webpack_require__(171);
var registerUndoRedoFunctions = __webpack_require__(961);
var stageId = 0;

module.exports = function (params, cy) {
  var fn = params;

  var addBendPointCxtMenuId = 'cy-edge-bend-editing-cxt-add-bend-point' + stageId;
  var removeBendPointCxtMenuId = 'cy-edge-bend-editing-cxt-remove-bend-point' + stageId;
  var removeAllBendPointCtxMenuId = 'cy-edge-bend-editing-cxt-remove-multiple-bend-point' + stageId;
  var addControlPointCxtMenuId = 'cy-edge-control-editing-cxt-add-control-point' + stageId;
  var removeControlPointCxtMenuId = 'cy-edge-control-editing-cxt-remove-control-point' + stageId;
  var removeAllControlPointCtxMenuId = 'cy-edge-bend-editing-cxt-remove-multiple-control-point' + stageId;
  var eStyle, eRemove, eAdd, eZoom, eSelect, eUnselect, eTapStart, eTapStartOnEdge, eTapDrag, eTapEnd, eCxtTap, eDrag;
  // last status of gestures
  var lastPanningEnabled, lastZoomingEnabled, lastBoxSelectionEnabled;
  var lastActiveBgOpacity;
  // status of edge to highlight bends and selected edges
  var edgeToHighlight, numberOfSelectedEdges;

  // the Kanva.shape() for the endpoints
  var endpointShape1 = null,
      endpointShape2 = null;
  // used to stop certain cy listeners when interracting with anchors
  var anchorTouched = false;
  // used call eMouseDown of anchorManager if the mouse is out of the content on cy.on(tapend)
  var mouseOut;

  var functions = {
    init: function init() {
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
          container: canvasElementId, // id of container <div>
          width: $container.width(),
          height: $container.height()
        });
      } else {
        stage = Konva.stages[stageId - 1];
      }

      var canvas;
      if (stage.getChildren().length < 1) {
        canvas = new Konva.Layer();
        stage.add(canvas);
      } else {
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
        bindListeners: function bindListeners(anchor) {
          anchor.on("mousedown touchstart", this.eMouseDown);
        },
        unbindListeners: function unbindListeners(anchor) {
          anchor.off("mousedown touchstart", this.eMouseDown);
        },
        // gets trigger on clicking on context menus, while cy listeners don't get triggered
        // it can cause weird behaviour if not aware of this
        eMouseDown: function eMouseDown(event) {
          // anchorManager.edge.unselect() won't work sometimes if this wasn't here
          cy.autounselectify(false);

          // eMouseDown(set) -> tapdrag(used) -> eMouseUp(reset)
          anchorTouched = true;
          anchorManager.touchedAnchor = event.target;
          mouseOut = false;
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

          turnOffActiveBgColor();
          disableGestures();

          cy.autoungrabify(true);

          canvas.getStage().on("contentTouchend contentMouseup", anchorManager.eMouseUp);
          canvas.getStage().on("contentMouseout", anchorManager.eMouseOut);
        },
        // gets called before cy.on('tapend')
        eMouseUp: function eMouseUp(event) {
          // won't be called if the mouse is released out of screen
          anchorTouched = false;
          anchorManager.touchedAnchor = undefined;
          mouseOut = false;
          anchorManager.edge.select();

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
          cy.autounselectify(true);
          cy.autoungrabify(false);

          canvas.getStage().off("contentTouchend contentMouseup", anchorManager.eMouseUp);
          canvas.getStage().off("contentMouseout", anchorManager.eMouseOut);
        },
        // handle mouse going out of canvas 
        eMouseOut: function eMouseOut(event) {
          mouseOut = true;
        },
        clearAnchorsExcept: function clearAnchorsExcept() {
          var _this = this;

          var dontClean = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

          var exceptionApplies = false;

          this.anchors.forEach(function (anchor, index) {
            if (dontClean && anchor === dontClean) {
              exceptionApplies = true; // the dontClean anchor is not cleared
              return;
            }

            _this.unbindListeners(anchor);
            anchor.destroy();
          });

          if (exceptionApplies) {
            this.anchors = [dontClean];
          } else {
            this.anchors = [];
            this.edge = undefined;
            this.edgeType = 'inconclusive';
          }
        },
        // render the bend and control shapes of the given edge
        renderAnchorShapes: function renderAnchorShapes(edge) {
          this.edge = edge;
          this.edgeType = anchorPointUtilities.getEdgeType(edge);

          if (!edge.hasClass('edgebendediting-hasbendpoints') && !edge.hasClass('edgecontrolediting-hascontrolpoints')) {
            return;
          }

          var anchorList = anchorPointUtilities.getAnchorsAsArray(edge); //edge._private.rdata.segpts;
          var length = getAnchorShapesLength(edge) * 0.65;

          var srcPos = edge.source().position();
          var tgtPos = edge.target().position();

          for (var i = 0; anchorList && i < anchorList.length; i = i + 2) {
            var anchorX = anchorList[i];
            var anchorY = anchorList[i + 1];

            this.renderAnchorShape(anchorX, anchorY, length);
          }

          canvas.draw();
        },
        // render a anchor shape with the given parameters
        renderAnchorShape: function renderAnchorShape(anchorX, anchorY, length) {
          // get the top left coordinates
          var topLeftX = anchorX - length / 2;
          var topLeftY = anchorY - length / 2;

          // convert to rendered parameters
          var renderedTopLeftPos = convertToRenderedPosition({ x: topLeftX, y: topLeftY });
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

      var cxtAddBendFcn = function cxtAddBendFcn(event) {
        cxtAddAnchorFcn(event, 'bend');
      };

      var cxtAddControlFcn = function cxtAddControlFcn(event) {
        cxtAddAnchorFcn(event, 'control');
      };

      var cxtAddAnchorFcn = function cxtAddAnchorFcn(event, anchorType) {
        var edge = event.target || event.cyTarget;
        if (!anchorPointUtilities.isIgnoredEdge(edge)) {

          var type = anchorPointUtilities.getEdgeType(edge);
          var weights, distances, weightStr, distanceStr;

          if (type === 'inconclusive') {
            weights = [];
            distances = [];
          } else {
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

      var cxtRemoveAnchorFcn = function cxtRemoveAnchorFcn(event) {
        var edge = anchorManager.edge;
        var type = anchorPointUtilities.getEdgeType(edge);

        if (anchorPointUtilities.edgeTypeInconclusiveShouldntHappen(type, "UiUtilities.js, cxtRemoveAnchorFcn")) {
          return;
        }

        var param = {
          edge: edge,
          type: type,
          weights: [].concat(edge.data(anchorPointUtilities.syntax[type]['weight'])),
          distances: [].concat(edge.data(anchorPointUtilities.syntax[type]['distance']))
        };

        anchorPointUtilities.removeAnchor();

        if (options().undoable) {
          cy.undoRedo().do('changeAnchorPoints', param);
        }

        setTimeout(function () {
          refreshDraws();edge.select();
        }, 50);
      };

      var cxtRemoveAllAnchorsFcn = function cxtRemoveAllAnchorsFcn(event) {
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
        setTimeout(function () {
          refreshDraws();edge.select();
        }, 50);
      };

      // function to reconnect edge
      var handleReconnectEdge = opts.handleReconnectEdge;
      // function to validate edge source and target on reconnection
      var validateEdge = opts.validateEdge;
      // function to be called on invalid edge reconnection
      var actOnUnsuccessfulReconnection = opts.actOnUnsuccessfulReconnection;

      var menuItems = [{
        id: addBendPointCxtMenuId,
        content: opts.addBendMenuItemTitle,
        selector: 'edge',
        onClickFunction: cxtAddBendFcn
      }, {
        id: removeBendPointCxtMenuId,
        content: opts.removeBendMenuItemTitle,
        selector: 'edge',
        onClickFunction: cxtRemoveAnchorFcn
      }, {
        id: removeAllBendPointCtxMenuId,
        content: opts.removeAllBendMenuItemTitle,
        selector: opts.enableMultipleAnchorRemovalOption && ':selected.edgebendediting-hasmultiplebendpoints',
        onClickFunction: cxtRemoveAllAnchorsFcn
      }, {
        id: addControlPointCxtMenuId,
        content: opts.addControlMenuItemTitle,
        selector: 'edge',
        coreAsWell: true,
        onClickFunction: cxtAddControlFcn
      }, {
        id: removeControlPointCxtMenuId,
        content: opts.removeControlMenuItemTitle,
        selector: 'edge',
        coreAsWell: true,
        onClickFunction: cxtRemoveAnchorFcn
      }, {
        id: removeAllControlPointCtxMenuId,
        content: opts.removeAllControlMenuItemTitle,
        selector: opts.enableMultipleAnchorRemovalOption && ':selected.edgecontrolediting-hasmultiplecontrolpoints',
        onClickFunction: cxtRemoveAllAnchorsFcn
      }];

      if (cy.contextMenus) {
        var menus = cy.contextMenus('get');
        // If context menus is active just append menu items else activate the extension
        // with initial menu items
        if (menus.isActive()) {
          menus.appendMenuItems(menuItems);
        } else {
          cy.contextMenus({
            menuItems: menuItems
          });
        }
      }

      var _sizeCanvas = debounce(function () {
        $canvasElement.attr('height', $container.height()).attr('width', $container.width()).css({
          'position': 'absolute',
          'top': 0,
          'left': 0,
          'z-index': options().zIndex
        });

        setTimeout(function () {
          var canvasBb = $canvasElement.offset();
          var containerBb = $container.offset();

          $canvasElement.css({
            'top': -(canvasBb.top - containerBb.top),
            'left': -(canvasBb.left - containerBb.left)
          });

          canvas.getStage().setWidth($container.width());
          canvas.getStage().setHeight($container.height());

          // redraw on canvas resize
          if (cy) {
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

        if (endpointShape1 !== null) {
          endpointShape1.destroy();
          endpointShape1 = null;
        }
        if (endpointShape2 !== null) {
          endpointShape2.destroy();
          endpointShape2 = null;
        }
        canvas.draw();

        if (edgeToHighlight) {
          anchorManager.renderAnchorShapes(edgeToHighlight);
          renderEndPointShapes(edgeToHighlight);
        }
      }

      // render the end points shapes of the given edge
      function renderEndPointShapes(edge) {
        if (!edge) {
          return;
        }

        var edge_pts = anchorPointUtilities.getAnchorsAsArray(edge);
        if (typeof edge_pts === 'undefined') {
          edge_pts = [];
        }
        var sourcePos = edge.sourceEndpoint();
        var targetPos = edge.targetEndpoint();
        edge_pts.unshift(sourcePos.y);
        edge_pts.unshift(sourcePos.x);
        edge_pts.push(targetPos.x);
        edge_pts.push(targetPos.y);

        if (!edge_pts) return;

        var src = {
          x: edge_pts[0],
          y: edge_pts[1]
        };

        var target = {
          x: edge_pts[edge_pts.length - 2],
          y: edge_pts[edge_pts.length - 1]
        };

        var nextToSource = {
          x: edge_pts[2],
          y: edge_pts[3]
        };
        var nextToTarget = {
          x: edge_pts[edge_pts.length - 4],
          y: edge_pts[edge_pts.length - 3]
        };
        var length = getAnchorShapesLength(edge) * 0.65;

        renderEachEndPointShape(src, target, length, nextToSource, nextToTarget);
      }

      function renderEachEndPointShape(source, target, length, nextToSource, nextToTarget) {
        // get the top left coordinates of source and target
        var sTopLeftX = source.x - length / 2;
        var sTopLeftY = source.y - length / 2;

        var tTopLeftX = target.x - length / 2;
        var tTopLeftY = target.y - length / 2;

        var nextToSourceX = nextToSource.x - length / 2;
        var nextToSourceY = nextToSource.y - length / 2;

        var nextToTargetX = nextToTarget.x - length / 2;
        var nextToTargetY = nextToTarget.y - length / 2;

        // convert to rendered parameters
        var renderedSourcePos = convertToRenderedPosition({ x: sTopLeftX, y: sTopLeftY });
        var renderedTargetPos = convertToRenderedPosition({ x: tTopLeftX, y: tTopLeftY });
        length = length * cy.zoom() / 2;

        var renderedNextToSource = convertToRenderedPosition({ x: nextToSourceX, y: nextToSourceY });
        var renderedNextToTarget = convertToRenderedPosition({ x: nextToTargetX, y: nextToTargetY });

        //how far to go from the node along the edge
        var distanceFromNode = length;

        var distanceSource = Math.sqrt(Math.pow(renderedNextToSource.x - renderedSourcePos.x, 2) + Math.pow(renderedNextToSource.y - renderedSourcePos.y, 2));
        var sourceEndPointX = renderedSourcePos.x + distanceFromNode / distanceSource * (renderedNextToSource.x - renderedSourcePos.x);
        var sourceEndPointY = renderedSourcePos.y + distanceFromNode / distanceSource * (renderedNextToSource.y - renderedSourcePos.y);

        var distanceTarget = Math.sqrt(Math.pow(renderedNextToTarget.x - renderedTargetPos.x, 2) + Math.pow(renderedNextToTarget.y - renderedTargetPos.y, 2));
        var targetEndPointX = renderedTargetPos.x + distanceFromNode / distanceTarget * (renderedNextToTarget.x - renderedTargetPos.x);
        var targetEndPointY = renderedTargetPos.y + distanceFromNode / distanceTarget * (renderedNextToTarget.y - renderedTargetPos.y);

        // render end point shape for source and target
        // the null checks are not theoretically required
        // but they protect from bad synchronious calls of refreshDraws()
        if (endpointShape1 === null) {
          endpointShape1 = new Konva.Circle({
            x: sourceEndPointX + length,
            y: sourceEndPointY + length,
            radius: length,
            fill: 'black'
          });
        }

        if (endpointShape2 === null) {
          endpointShape2 = new Konva.Circle({
            x: targetEndPointX + length,
            y: targetEndPointY + length,
            radius: length,
            fill: 'black'
          });
        }

        canvas.add(endpointShape1);
        canvas.add(endpointShape2);
        canvas.draw();
      }

      // get the length of anchor points to be rendered
      function getAnchorShapesLength(edge) {
        var factor = options().anchorShapeSizeFactor;
        if (options().enableAnchorSizeNotImpactByZoom) var actualFactor = factor / cy.zoom();else var actualFactor = factor;
        if (parseFloat(edge.css('width')) <= 2.5) return 2.5 * actualFactor;else return parseFloat(edge.css('width')) * actualFactor;
      }

      // check if the anchor represented by {x, y} is inside the point shape
      function checkIfInsideShape(x, y, length, centerX, centerY) {
        var minX = centerX - length / 2;
        var maxX = centerX + length / 2;
        var minY = centerY - length / 2;
        var maxY = centerY + length / 2;

        var inside = x >= minX && x <= maxX && y >= minY && y <= maxY;
        return inside;
      }

      // get the index of anchor containing the point represented by {x, y}
      function getContainingShapeIndex(x, y, edge) {
        var type = anchorPointUtilities.getEdgeType(edge);

        if (type === 'inconclusive') {
          return -1;
        }

        if (edge.data(anchorPointUtilities.syntax[type]['weight']) == null || edge.data(anchorPointUtilities.syntax[type]['weight']).length == 0) {
          return -1;
        }

        var anchorList = anchorPointUtilities.getAnchorsAsArray(edge); //edge._private.rdata.segpts;
        var length = getAnchorShapesLength(edge);

        for (var i = 0; anchorList && i < anchorList.length; i = i + 2) {
          var anchorX = anchorList[i];
          var anchorY = anchorList[i + 1];

          var inside = checkIfInsideShape(x, y, length, anchorX, anchorY);
          if (inside) {
            return i / 2;
          }
        }

        return -1;
      };

      function getContainingEndPoint(x, y, edge) {
        var length = getAnchorShapesLength(edge);
        var allPts = edge._private.rscratch.allpts;
        var src = {
          x: allPts[0],
          y: allPts[1]
        };
        var target = {
          x: allPts[allPts.length - 2],
          y: allPts[allPts.length - 1]
        };
        convertToRenderedPosition(src);
        convertToRenderedPosition(target);

        // Source:0, Target:1, None:-1
        if (checkIfInsideShape(x, y, length, src.x, src.y)) return 0;else if (checkIfInsideShape(x, y, length, target.x, target.y)) return 1;else return -1;
      }

      // store the current status of gestures and set them to false
      function disableGestures() {
        lastPanningEnabled = cy.panningEnabled();
        lastZoomingEnabled = cy.zoomingEnabled();
        lastBoxSelectionEnabled = cy.boxSelectionEnabled();

        cy.zoomingEnabled(false).panningEnabled(false).boxSelectionEnabled(false);
      }

      // reset the gestures by their latest status
      function resetGestures() {
        cy.zoomingEnabled(lastZoomingEnabled).panningEnabled(lastPanningEnabled).boxSelectionEnabled(lastBoxSelectionEnabled);
      }

      function turnOffActiveBgColor() {
        // found this at the cy-node-resize code, but doesn't seem to find the object most of the time
        if (cy.style()._private.coreStyle["active-bg-opacity"]) {
          lastActiveBgOpacity = cy.style()._private.coreStyle["active-bg-opacity"].value;
        } else {
          // arbitrary, feel free to change
          // trial and error showed that 0.15 was closest to the old color
          lastActiveBgOpacity = 0.15;
        }

        cy.style().selector("core").style("active-bg-opacity", 0).update();
      }

      function resetActiveBgColor() {
        cy.style().selector("core").style("active-bg-opacity", lastActiveBgOpacity).update();
      }

      function moveAnchorPoints(positionDiff, edges) {
        edges.forEach(function (edge) {
          var previousAnchorsPosition = anchorPointUtilities.getAnchorsAsArray(edge);
          var nextAnchorPointsPosition = [];
          if (previousAnchorsPosition != undefined) {
            for (var i = 0; i < previousAnchorsPosition.length; i += 2) {
              nextAnchorPointsPosition.push({ x: previousAnchorsPosition[i] + positionDiff.x, y: previousAnchorsPosition[i + 1] + positionDiff.y });
            }
            var type = anchorPointUtilities.getEdgeType(edge);

            if (anchorPointUtilities.edgeTypeInconclusiveShouldntHappen(type, "UiUtilities.js, moveAnchorPoints")) {
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

      function _calcCostToPreferredPosition(p1, p2) {
        var currentAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        var perfectAngle = [-Math.PI, -Math.PI * 3 / 4, -Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4, Math.PI / 4];
        var deltaAngle = [];
        perfectAngle.forEach(function (angle) {
          deltaAngle.push(Math.abs(currentAngle - angle));
        });
        var indexOfMin = deltaAngle.indexOf(Math.min.apply(Math, deltaAngle));
        var dy = p2.y - p1.y;
        var dx = p2.x - p1.x;
        var l = Math.sqrt(dx * dx + dy * dy);
        var cost = Math.abs(l * Math.sin(deltaAngle[indexOfMin]));

        var chosenAngle = perfectAngle[indexOfMin];
        var edgeL = Math.abs(l * Math.cos(deltaAngle[indexOfMin]));
        var targetPointX = p1.x + edgeL * Math.cos(chosenAngle);
        var targetPointY = p1.y + edgeL * Math.sin(chosenAngle);

        return { "costDistance": cost, "x": targetPointX, "y": targetPointY, "angle": chosenAngle };
      }

      function moveAnchorOnDrag(edge, type, index, position) {
        var prevPointPosition = anchorPointUtilities.obtainPrevAnchorAbsolutePositions(edge, type, index);
        var nextPointPosition = anchorPointUtilities.obtainNextAnchorAbsolutePositions(edge, type, index);
        var mousePosition = position;

        //calcualte the cost(or offset distance) to fulfill perfect 0, or 45 or 90 degree positions according to prev and next position
        var judgePrev = _calcCostToPreferredPosition(prevPointPosition, mousePosition);
        var judgeNext = _calcCostToPreferredPosition(nextPointPosition, mousePosition);
        var decisionObj = null;

        var zoomLevel = cy.zoom();

        if (judgePrev.costDistance * zoomLevel < opts.stickyAnchorTolerence && judgeNext.costDistance * zoomLevel > opts.stickyAnchorTolerence) {
          //choose the perfect angle point from prev anchor
          position.x = judgePrev.x;
          position.y = judgePrev.y;
        } else if (judgePrev.costDistance * zoomLevel > opts.stickyAnchorTolerence && judgeNext.costDistance * zoomLevel < opts.stickyAnchorTolerence) {
          //choose the perfect angle point from next anchor
          position.x = judgeNext.x;
          position.y = judgeNext.y;
        } else if (judgePrev.costDistance * zoomLevel < opts.stickyAnchorTolerence && judgeNext.costDistance * zoomLevel < opts.stickyAnchorTolerence) {
          //check if the two angle lines are parallel or not
          var angle1 = judgePrev.angle;
          var angle2 = judgeNext.angle;
          if (angle1 == angle2 || Math.abs(angle1 - angle2) == Math.PI) {
            //there will be no intersection, so just choose the perfect angle point from prev anchor
            position.x = judgePrev.x;
            position.y = judgePrev.y;
          } else {
            //calculate the intersection as perfect anchor point
            var prevX = prevPointPosition.x;
            var prevY = prevPointPosition.y;
            var nexX = nextPointPosition.x;
            var nexY = nextPointPosition.y;
            var fx = judgePrev.x;
            var fy = judgePrev.y;
            var sx = judgeNext.x;
            var sy = judgeNext.y;

            if (fy == prevY) {
              position.y = prevY;
              position.x = (sx - nexX) / (sy - nexY) * (position.y - nexY) + nexX;
            } else if (sy == nexY) {
              position.y = nexY;
              position.x = (fx - prevX) / (fy - prevY) * (position.y - prevY) + prevX;
            } else {
              var a = (fx - prevX) / (fy - prevY);
              var b = (sx - nexX) / (sy - nexY);
              position.y = (a * prevY - prevX - b * nexY + nexX) / (a - b);
              position.x = a * (position.y - prevY) + prevX;
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

      // debounced due to large amout of calls to tapdrag
      var _moveAnchorOnDrag = debounce(moveAnchorOnDrag, 5);

      {
        lastPanningEnabled = cy.panningEnabled();
        lastZoomingEnabled = cy.zoomingEnabled();
        lastBoxSelectionEnabled = cy.boxSelectionEnabled();

        // Initilize the edgeToHighlightBends and numberOfSelectedEdges
        {
          var selectedEdges = cy.edges(':selected');
          var numberOfSelectedEdges = selectedEdges.length;

          if (numberOfSelectedEdges === 1) {
            edgeToHighlight = selectedEdges[0];
          }
        }

        cy.bind('zoom pan', eZoom = function eZoom() {
          if (!edgeToHighlight) {
            return;
          }

          refreshDraws();
        });

        // cy.off is never called on this listener
        cy.on('data', 'edge', function () {
          if (!edgeToHighlight) {
            return;
          }

          refreshDraws();
        });

        cy.on('style', 'edge.edgebendediting-hasbendpoints:selected, edge.edgecontrolediting-hascontrolpoints:selected', eStyle = function eStyle() {
          setTimeout(function () {
            refreshDraws();
          }, 50);
        });

        cy.on('remove', 'edge', eRemove = function eRemove() {
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
              } else {
                edgeToHighlight = undefined;
              }
            } else {
              edgeToHighlight = undefined;
            }

            cy.endBatch();
          }
          refreshDraws();
        });

        cy.on('add', 'edge', eAdd = function eAdd() {
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
            } else {
              edgeToHighlight = undefined;
            }

            cy.endBatch();
          }
          refreshDraws();
        });

        cy.on('select', 'edge', eSelect = function eSelect() {
          var edge = this;

          if (edge.target().connectedEdges().length == 0 || edge.source().connectedEdges().length == 0) {
            return;
          }

          numberOfSelectedEdges = numberOfSelectedEdges + 1;

          cy.startBatch();

          if (edgeToHighlight) {
            edgeToHighlight.removeClass('cy-edge-editing-highlight');
          }

          if (numberOfSelectedEdges === 1) {
            edgeToHighlight = edge;
            edgeToHighlight.addClass('cy-edge-editing-highlight');
          } else {
            edgeToHighlight = undefined;
          }

          cy.endBatch();
          refreshDraws();
        });

        cy.on('unselect', 'edge', eUnselect = function eUnselect() {
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
            } else {
              edgeToHighlight = undefined;
            }
          } else {
            edgeToHighlight = undefined;
          }

          cy.endBatch();
          refreshDraws();
        });

        var movedAnchorIndex;
        var tapStartPos;
        var movedEdge;
        var moveAnchorParam;
        var createAnchorOnDrag;
        var movedEndPoint;
        var dummyNode;
        var detachedNode;
        var nodeToAttach;
        var anchorCreatedByDrag = false;

        cy.on('tapstart', eTapStart = function eTapStart(event) {
          tapStartPos = event.position || event.cyPosition;
        });

        cy.on('tapstart', 'edge', eTapStartOnEdge = function eTapStartOnEdge(event) {
          var edge = this;

          if (!edgeToHighlight || edgeToHighlight.id() !== edge.id()) {
            createAnchorOnDrag = false;
            return;
          }

          movedEdge = edge;

          var type = anchorPointUtilities.getEdgeType(edge);

          // to avoid errors
          if (type === 'inconclusive') type = 'bend';

          var cyPosX = tapStartPos.x;
          var cyPosY = tapStartPos.y;

          // Get which end point has been clicked (Source:0, Target:1, None:-1)
          var endPoint = getContainingEndPoint(cyPosX, cyPosY, edge);

          if (endPoint == 0 || endPoint == 1) {
            edge.unselect();
            movedEndPoint = endPoint;
            detachedNode = endPoint == 0 ? movedEdge.source() : movedEdge.target();

            var disconnectedEnd = endPoint == 0 ? 'source' : 'target';
            var result = reconnectionUtilities.disconnectEdge(movedEdge, cy, event.renderedPosition, disconnectedEnd);

            dummyNode = result.dummyNode;
            movedEdge = result.edge;

            disableGestures();
          } else {
            movedAnchorIndex = undefined;
            createAnchorOnDrag = true;
          }
        });

        cy.on('drag', 'node', eDrag = function eDrag(event) {
          var node = this;
          cy.edges().unselect();
          if (!node.selected()) {
            cy.nodes().unselect();
          }
        });
        cy.on('tapdrag', eTapDrag = function eTapDrag(event) {
          /** 
           * if there is a selected edge set autounselectify false
           * fixes the node-editing problem where nodes would get
           * unselected after resize drag
          */
          if (cy.edges(':selected').length > 0) {
            cy.autounselectify(false);
          }
          var edge = movedEdge;

          if (movedEdge !== undefined && anchorPointUtilities.isIgnoredEdge(edge)) {
            return;
          }

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
          if (!anchorTouched && (movedEdge === undefined || movedAnchorIndex === undefined && movedEndPoint === undefined)) {
            return;
          }

          var eventPos = event.position || event.cyPosition;

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
                  anchorManager.touchedAnchorIndex = getContainingShapeIndex(tapStartPos.x, tapStartPos.y, anchorManager.edge);
                }

                if (anchorManager.touchedAnchorIndex !== undefined) {
                  _moveAnchorOnDrag(anchorManager.edge, anchorManager.edgeType, anchorManager.touchedAnchorIndex, eventPos);
                }
              }

          if (event.target && event.target[0] && event.target.isNode()) {
            nodeToAttach = event.target;
          }
        });

        cy.on('tapend', eTapEnd = function eTapEnd(event) {

          if (mouseOut) {
            canvas.getStage().fire("contentMouseup");
          }

          var edge = movedEdge || anchorManager.edge;

          if (edge !== undefined) {
            var index = anchorManager.touchedAnchorIndex;
            if (index != undefined) {
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

              if (anchor.x === preAnchorPoint.x && anchor.y === preAnchorPoint.y || anchor.x === preAnchorPoint.x && anchor.y === preAnchorPoint.y) {
                nearToLine = true;
              } else {
                var m1 = (preAnchorPoint.y - posAnchorPoint.y) / (preAnchorPoint.x - posAnchorPoint.x);
                var m2 = -1 / m1;

                var srcTgtPointsAndTangents = {
                  srcPoint: preAnchorPoint,
                  tgtPoint: posAnchorPoint,
                  m1: m1,
                  m2: m2
                };

                var currentIntersection = anchorPointUtilities.getIntersection(edge, anchor, srcTgtPointsAndTangents);
                var dist = Math.sqrt(Math.pow(anchor.x - currentIntersection.x, 2) + Math.pow(anchor.y - currentIntersection.y, 2));

                // remove the bend point if segment edge becomes straight
                var type = anchorPointUtilities.getEdgeType(edge);
                if (type === 'bend' && dist < options().bendRemovalSensitivity) {
                  nearToLine = true;
                }
              }

              if (opts.enableRemoveAnchorMidOfNearLine && nearToLine) {
                anchorPointUtilities.removeAnchor(edge, index);
              }
            } else if (dummyNode != undefined && (movedEndPoint == 0 || movedEndPoint == 1)) {

              var newNode = detachedNode;
              var isValid = 'valid';
              var location = movedEndPoint == 0 ? 'source' : 'target';

              // validate edge reconnection
              if (nodeToAttach) {
                var newSource = movedEndPoint == 0 ? nodeToAttach : edge.source();
                var newTarget = movedEndPoint == 1 ? nodeToAttach : edge.target();
                if (typeof validateEdge === "function") isValid = validateEdge(edge, newSource, newTarget);
                newNode = isValid === 'valid' ? nodeToAttach : detachedNode;
              }

              var newSource = movedEndPoint == 0 ? newNode : edge.source();
              var newTarget = movedEndPoint == 1 ? newNode : edge.target();
              edge = reconnectionUtilities.connectEdge(edge, detachedNode, location);

              if (detachedNode.id() !== newNode.id()) {
                // use given handleReconnectEdge function 
                if (typeof handleReconnectEdge === 'function') {
                  var reconnectedEdge = handleReconnectEdge(newSource.id(), newTarget.id(), edge.data());

                  if (reconnectedEdge) {
                    reconnectionUtilities.copyEdge(edge, reconnectedEdge);
                    anchorPointUtilities.initAnchorPoints(options().bendPositionsFunction, options().controlPositionsFunction, [reconnectedEdge]);
                  }

                  if (reconnectedEdge && options().undoable) {
                    var params = {
                      newEdge: reconnectedEdge,
                      oldEdge: edge
                    };
                    cy.undoRedo().do('removeReconnectedEdge', params);
                    edge = reconnectedEdge;
                  } else if (reconnectedEdge) {
                    cy.remove(edge);
                    edge = reconnectedEdge;
                  }
                } else {
                  var loc = movedEndPoint == 0 ? { source: newNode.id() } : { target: newNode.id() };
                  var oldLoc = movedEndPoint == 0 ? { source: detachedNode.id() } : { target: detachedNode.id() };

                  if (options().undoable && newNode.id() !== detachedNode.id()) {
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
              if (isValid !== 'valid' && typeof actOnUnsuccessfulReconnection === 'function') {
                actOnUnsuccessfulReconnection();
              }
              edge.select();
              cy.remove(dummyNode);
            }
          }
          var type = anchorPointUtilities.getEdgeType(edge);

          // to avoid errors
          if (type === 'inconclusive') {
            type = 'bend';
          }

          if (anchorManager.touchedAnchorIndex === undefined && !anchorCreatedByDrag) {
            moveAnchorParam = undefined;
          }

          var weightStr = anchorPointUtilities.syntax[type]['weight'];
          if (edge !== undefined && moveAnchorParam !== undefined && (edge.data(weightStr) ? edge.data(weightStr).toString() : null) != moveAnchorParam.weights.toString()) {

            // anchor created from drag
            if (anchorCreatedByDrag) {
              edge.select();

              // stops the unbundled bezier edges from being unselected
              cy.autounselectify(true);
            }

            if (options().undoable) {
              cy.undoRedo().do('changeAnchorPoints', moveAnchorParam);
            }
          }

          movedAnchorIndex = undefined;
          movedEdge = undefined;
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
          setTimeout(function () {
            refreshDraws();
          }, 50);
        });

        //Variables used for starting and ending the movement of anchor points with arrows
        var moveanchorparam;
        var firstAnchor;
        var edgeContainingFirstAnchor;
        var firstAnchorPointFound;
        cy.on("edgeediting.movestart", function (e, edges) {
          firstAnchorPointFound = false;
          if (edges[0] != undefined) {
            edges.forEach(function (edge) {
              if (anchorPointUtilities.getAnchorsAsArray(edge) != undefined && !firstAnchorPointFound) {
                firstAnchor = { x: anchorPointUtilities.getAnchorsAsArray(edge)[0], y: anchorPointUtilities.getAnchorsAsArray(edge)[1] };
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
          if (moveanchorparam != undefined) {
            var initialPos = moveanchorparam.firstAnchorPosition;
            var movedFirstAnchor = {
              x: anchorPointUtilities.getAnchorsAsArray(edgeContainingFirstAnchor)[0],
              y: anchorPointUtilities.getAnchorsAsArray(edgeContainingFirstAnchor)[1]
            };

            moveanchorparam.positionDiff = {
              x: -movedFirstAnchor.x + initialPos.x,
              y: -movedFirstAnchor.y + initialPos.y
            };

            delete moveanchorparam.firstAnchorPosition;

            if (options().undoable) {
              cy.undoRedo().do("moveAnchorPoints", moveanchorparam);
            }

            moveanchorparam = undefined;
          }
        });

        cy.on('cxttap', eCxtTap = function eCxtTap(event) {
          var target = event.target || event.cyTarget;
          var targetIsEdge = false;

          try {
            targetIsEdge = target.isEdge();
          } catch (err) {
            // this is here just to suppress the error
          }

          var edge, type;
          if (targetIsEdge) {
            edge = target;
            type = anchorPointUtilities.getEdgeType(edge);
          } else {
            edge = anchorManager.edge;
            type = anchorManager.edgeType;
          }

          var menus = cy.contextMenus('get'); // get context menus instance

          if (!edgeToHighlight || edgeToHighlight.id() != edge.id() || anchorPointUtilities.isIgnoredEdge(edge) || edgeToHighlight !== edge) {
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
            if (type === 'control' && targetIsEdge) {
              menus.showMenuItem(addControlPointCxtMenuId);
              menus.hideMenuItem(addBendPointCxtMenuId);
            } else if (type === 'bend' && targetIsEdge) {
              menus.showMenuItem(addBendPointCxtMenuId);
              menus.hideMenuItem(addControlPointCxtMenuId);
            } else if (targetIsEdge) {
              menus.showMenuItem(addBendPointCxtMenuId);
              menus.showMenuItem(addControlPointCxtMenuId);
            } else {
              menus.hideMenuItem(addBendPointCxtMenuId);
              menus.hideMenuItem(addControlPointCxtMenuId);
            }
            anchorPointUtilities.currentCtxPos = cyPos;
          }
          // clicked on an anchor
          else {
              menus.hideMenuItem(addBendPointCxtMenuId);
              menus.hideMenuItem(addControlPointCxtMenuId);
              if (type === 'control') {
                menus.showMenuItem(removeControlPointCxtMenuId);
                menus.hideMenuItem(removeBendPointCxtMenuId);
                if (opts.enableMultipleAnchorRemovalOption && edge.hasClass('edgecontrolediting-hasmultiplecontrolpoints')) {
                  menus.showMenuItem(removeAllControlPointCtxMenuId);
                }
              } else if (type === 'bend') {
                menus.showMenuItem(removeBendPointCxtMenuId);
                menus.hideMenuItem(removeControlPointCxtMenuId);
              } else {
                menus.hideMenuItem(removeBendPointCxtMenuId);
                menus.hideMenuItem(removeControlPointCxtMenuId);
                menus.hideMenuItem(removeAllControlPointCtxMenuId);
              }
              anchorPointUtilities.currentAnchorIndex = selectedIndex;
            }

          anchorPointUtilities.currentCtxEdge = edge;
        });

        cy.on('cyedgeediting.changeAnchorPoints', 'edge', function () {
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

      function keyDown(e) {

        var shouldMove = typeof options().moveSelectedAnchorsOnKeyEvents === 'function' ? options().moveSelectedAnchorsOnKeyEvents() : options().moveSelectedAnchorsOnKeyEvents;

        if (!shouldMove) {
          return;
        }

        //Checks if the tagname is textarea or input
        var tn = document.activeElement.tagName;
        if (tn != "TEXTAREA" && tn != "INPUT") {
          switch (e.keyCode) {
            case 37:case 39:case 38:case 40: // Arrow keys
            case 32:
              e.preventDefault();break; // Space
            default:
              break; // do not block other keys
          }
          if (e.keyCode < '37' || e.keyCode > '40') {
            return;
          }
          keys[e.keyCode] = true;

          //Checks if only edges are selected (not any node) and if only 1 edge is selected
          //If the second checking is removed the anchors of multiple edges would move
          if (cy.edges(":selected").length != cy.elements(":selected").length || cy.edges(":selected").length != 1) {
            return;
          }
          if (!anchorsMoving) {
            selectedEdges = cy.edges(':selected');
            cy.trigger("edgeediting.movestart", [selectedEdges]);
            anchorsMoving = true;
          }
          var moveSpeed = 3;

          // doesn't make sense if alt and shift both pressed
          if (e.altKey && e.shiftKey) {
            return;
          } else if (e.altKey) {
            moveSpeed = 1;
          } else if (e.shiftKey) {
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

          moveAnchorPoints({ x: dx, y: dy }, selectedEdges);
        }
      }
      function keyUp(e) {

        if (e.keyCode < '37' || e.keyCode > '40') {
          return;
        }
        e.preventDefault();
        keys[e.keyCode] = false;
        var shouldMove = typeof options().moveSelectedAnchorsOnKeyEvents === 'function' ? options().moveSelectedAnchorsOnKeyEvents() : options().moveSelectedAnchorsOnKeyEvents;

        if (!shouldMove) {
          return;
        }

        cy.trigger("edgeediting.moveend", [selectedEdges]);
        selectedEdges = undefined;
        anchorsMoving = false;
      }
      document.addEventListener("keydown", keyDown, true);
      document.addEventListener("keyup", keyUp, true);

      $container.data('cyedgeediting', data);
    },
    unbind: function unbind() {
      cy.off('remove', 'node', eRemove).off('add', 'node', eAdd).off('style', 'edge.edgebendediting-hasbendpoints:selected, edge.edgecontrolediting-hascontrolpoints:selected', eStyle).off('select', 'edge', eSelect).off('unselect', 'edge', eUnselect).off('tapstart', eTapStart).off('tapstart', 'edge', eTapStartOnEdge).off('tapdrag', eTapDrag).off('tapend', eTapEnd).off('cxttap', eCxtTap).off('drag', 'node', eDrag);

      cy.unbind("zoom pan", eZoom);
    }
  };

  if (functions[fn]) {
    return functions[fn].apply($(cy.container()), Array.prototype.slice.call(arguments, 1));
  } else if ((typeof fn === 'undefined' ? 'undefined' : _typeof(fn)) == 'object' || !fn) {
    return functions.init.apply($(cy.container()), arguments);
  } else {
    $.error('No such function `' + fn + '` for cytoscape.js-edge-editing');
  }

  return $(this);
};

/***/ }),

/***/ 218:
/***/ ((module) => {



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var debounce = function () {
  /**
   * lodash 3.1.1 (Custom Build) <https://lodash.com/>
   * Build: `lodash modern modularize exports="npm" -o ./`
   * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   * Available under MIT license <https://lodash.com/license>
   */
  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /* Native method references for those with the same name as other `lodash` methods. */
  var nativeMax = Math.max,
      nativeNow = Date.now;

  /**
   * Gets the number of milliseconds that have elapsed since the Unix epoch
   * (1 January 1970 00:00:00 UTC).
   *
   * @static
   * @memberOf _
   * @category Date
   * @example
   *
   * _.defer(function(stamp) {
   *   console.log(_.now() - stamp);
   * }, _.now());
   * // => logs the number of milliseconds it took for the deferred function to be invoked
   */
  var now = nativeNow || function () {
    return new Date().getTime();
  };

  /**
   * Creates a debounced function that delays invoking `func` until after `wait`
   * milliseconds have elapsed since the last time the debounced function was
   * invoked. The debounced function comes with a `cancel` method to cancel
   * delayed invocations. Provide an options object to indicate that `func`
   * should be invoked on the leading and/or trailing edge of the `wait` timeout.
   * Subsequent calls to the debounced function return the result of the last
   * `func` invocation.
   *
   * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
   * on the trailing edge of the timeout only if the the debounced function is
   * invoked more than once during the `wait` timeout.
   *
   * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
   * for details over the differences between `_.debounce` and `_.throttle`.
   *
   * @static
   * @memberOf _
   * @category Function
   * @param {Function} func The function to debounce.
   * @param {number} [wait=0] The number of milliseconds to delay.
   * @param {Object} [options] The options object.
   * @param {boolean} [options.leading=false] Specify invoking on the leading
   *  edge of the timeout.
   * @param {number} [options.maxWait] The maximum time `func` is allowed to be
   *  delayed before it's invoked.
   * @param {boolean} [options.trailing=true] Specify invoking on the trailing
   *  edge of the timeout.
   * @returns {Function} Returns the new debounced function.
   * @example
   *
   * // avoid costly calculations while the window size is in flux
   * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
   *
   * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
   * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
   *   'leading': true,
   *   'trailing': false
   * }));
   *
   * // ensure `batchLog` is invoked once after 1 second of debounced calls
   * var source = new EventSource('/stream');
   * jQuery(source).on('message', _.debounce(batchLog, 250, {
   *   'maxWait': 1000
   * }));
   *
   * // cancel a debounced call
   * var todoChanges = _.debounce(batchLog, 1000);
   * Object.observe(models.todo, todoChanges);
   *
   * Object.observe(models, function(changes) {
   *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
   *     todoChanges.cancel();
   *   }
   * }, ['delete']);
   *
   * // ...at some point `models.todo` is changed
   * models.todo.completed = true;
   *
   * // ...before 1 second has passed `models.todo` is deleted
   * // which cancels the debounced `todoChanges` call
   * delete models.todo;
   */
  function debounce(func, wait, options) {
    var args,
        maxTimeoutId,
        result,
        stamp,
        thisArg,
        timeoutId,
        trailingCall,
        lastCalled = 0,
        maxWait = false,
        trailing = true;

    if (typeof func != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    wait = wait < 0 ? 0 : +wait || 0;
    if (options === true) {
      var leading = true;
      trailing = false;
    } else if (isObject(options)) {
      leading = !!options.leading;
      maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
      trailing = 'trailing' in options ? !!options.trailing : trailing;
    }

    function cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
      }
      lastCalled = 0;
      maxTimeoutId = timeoutId = trailingCall = undefined;
    }

    function complete(isCalled, id) {
      if (id) {
        clearTimeout(id);
      }
      maxTimeoutId = timeoutId = trailingCall = undefined;
      if (isCalled) {
        lastCalled = now();
        result = func.apply(thisArg, args);
        if (!timeoutId && !maxTimeoutId) {
          args = thisArg = undefined;
        }
      }
    }

    function delayed() {
      var remaining = wait - (now() - stamp);
      if (remaining <= 0 || remaining > wait) {
        complete(trailingCall, maxTimeoutId);
      } else {
        timeoutId = setTimeout(delayed, remaining);
      }
    }

    function maxDelayed() {
      complete(trailing, timeoutId);
    }

    function debounced() {
      args = arguments;
      stamp = now();
      thisArg = this;
      trailingCall = trailing && (timeoutId || !leading);

      if (maxWait === false) {
        var leadingCall = leading && !timeoutId;
      } else {
        if (!maxTimeoutId && !leading) {
          lastCalled = stamp;
        }
        var remaining = maxWait - (stamp - lastCalled),
            isCalled = remaining <= 0 || remaining > maxWait;

        if (isCalled) {
          if (maxTimeoutId) {
            maxTimeoutId = clearTimeout(maxTimeoutId);
          }
          lastCalled = stamp;
          result = func.apply(thisArg, args);
        } else if (!maxTimeoutId) {
          maxTimeoutId = setTimeout(maxDelayed, remaining);
        }
      }
      if (isCalled && timeoutId) {
        timeoutId = clearTimeout(timeoutId);
      } else if (!timeoutId && wait !== maxWait) {
        timeoutId = setTimeout(delayed, wait);
      }
      if (leadingCall) {
        isCalled = true;
        result = func.apply(thisArg, args);
      }
      if (isCalled && !timeoutId && !maxTimeoutId) {
        args = thisArg = undefined;
      }
      return result;
    }

    debounced.cancel = cancel;
    return debounced;
  }

  /**
   * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(1);
   * // => false
   */
  function isObject(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    return !!value && (type == 'object' || type == 'function');
  }

  return debounce;
}();

module.exports = debounce;

/***/ }),

/***/ 579:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;

;(function () {
  'use strict';

  var anchorPointUtilities = __webpack_require__(964);
  var debounce = __webpack_require__(218);

  // registers the extension on a cytoscape lib ref
  var register = function register(cytoscape, $, Konva) {
    var uiUtilities = __webpack_require__(347);

    if (!cytoscape || !$ || !Konva) {
      return;
    } // can't register if required libraries unspecified

    var defaults = {
      // this function specifies the poitions of bend points
      // strictly name the property 'bendPointPositions' for the edge to be detected for bend point edititng
      bendPositionsFunction: function bendPositionsFunction(ele) {
        return ele.data('bendPointPositions');
      },
      // this function specifies the poitions of control points
      // strictly name the property 'controlPointPositions' for the edge to be detected for control point edititng
      controlPositionsFunction: function controlPositionsFunction(ele) {
        return ele.data('controlPointPositions');
      },
      // whether to initilize bend and control points on creation of this extension automatically
      initAnchorsAutomatically: true,
      // the classes of those edges that should be ignored
      ignoredClasses: [],
      // whether the bend and control editing operations are undoable (requires cytoscape-undo-redo.js)
      undoable: false,
      // the size of bend and control point shape is obtained by multipling width of edge with this parameter
      anchorShapeSizeFactor: 3,
      //size of anchorpoint can be auto changed to compensate the impact of cy zooming level
      enableAnchorSizeNotImpactByZoom: false,
      // z-index value of the canvas in which bend and control points are drawn
      zIndex: 999,
      // whether to start the plugin in the enabled state
      enabled: true,
      //An option that controls the distance within which a bend point is considered "near" the line segment between its two neighbors and will be automatically removed
      bendRemovalSensitivity: 8,
      // title of add bend point menu item (User may need to adjust width of menu items according to length of this option)
      addBendMenuItemTitle: "Add Bend Point",
      // title of remove bend point menu item (User may need to adjust width of menu items according to length of this option)
      removeBendMenuItemTitle: "Remove Bend Point",
      // title of remove all bend points menu item
      removeAllBendMenuItemTitle: "Remove All Bend Points",
      // title of add control point menu item (User may need to adjust width of menu items according to length of this option)
      addControlMenuItemTitle: "Add Control Point",
      // title of remove control point menu item (User may need to adjust width of menu items according to length of this option)
      removeControlMenuItemTitle: "Remove Control Point",
      // title of remove all control points menu item
      removeAllControlMenuItemTitle: "Remove All Control Points",
      // whether the bend and control points can be moved by arrows
      moveSelectedAnchorsOnKeyEvents: function moveSelectedAnchorsOnKeyEvents() {
        return true;
      },
      // whether 'Remove all bend points' and 'Remove all control points' options should be presented
      enableMultipleAnchorRemovalOption: false,
      // whether allows adding bending point by draging edge without useing ctxmenu, default is true
      enableCreateAnchorOnDrag: true,
      // how to smartly move the anchor point to perfect 0 45 or 90 degree position, unit is px
      stickyAnchorTolerence: -1, //-1 actually disable this feature, change it to 20 to test the feature
      //automatically remove anchor if its prev segement and next segment is almost in a same line
      enableRemoveAnchorMidOfNearLine: true
    };

    var options;
    var initialized = false;

    // Merge default options with the ones coming from parameter
    function extend(defaults, options) {
      var obj = {};

      for (var i in defaults) {
        obj[i] = defaults[i];
      }

      for (var i in options) {
        // SPLIT FUNCTIONALITY?
        if (i == "bendRemovalSensitivity") {
          var value = options[i];
          if (!isNaN(value)) {
            if (value >= 0 && value <= 20) {
              obj[i] = options[i];
            } else if (value < 0) {
              obj[i] = 0;
            } else {
              obj[i] = 20;
            }
          }
        } else {
          obj[i] = options[i];
        }
      }

      return obj;
    };

    cytoscape('core', 'edgeEditing', function (opts) {
      var cy = this;

      if (opts === 'initialized') {
        return initialized;
      }

      if (opts !== 'get') {
        // merge the options with default ones
        options = extend(defaults, opts);
        initialized = true;

        // define edgebendediting-hasbendpoints css class
        cy.style().selector('.edgebendediting-hasbendpoints').css({
          'curve-style': 'segments',
          'segment-distances': function segmentDistances(ele) {
            return anchorPointUtilities.getDistancesString(ele, 'bend');
          },
          'segment-weights': function segmentWeights(ele) {
            return anchorPointUtilities.getWeightsString(ele, 'bend');
          },
          'edge-distances': 'node-position'
        });

        // define edgecontrolediting-hascontrolpoints css class
        cy.style().selector('.edgecontrolediting-hascontrolpoints').css({
          'curve-style': 'unbundled-bezier',
          'control-point-distances': function controlPointDistances(ele) {
            return anchorPointUtilities.getDistancesString(ele, 'control');
          },
          'control-point-weights': function controlPointWeights(ele) {
            return anchorPointUtilities.getWeightsString(ele, 'control');
          },
          'edge-distances': 'node-position'
        });

        anchorPointUtilities.setIgnoredClasses(options.ignoredClasses);

        // init bend positions conditionally
        if (options.initAnchorsAutomatically) {
          // CHECK THIS, options.ignoredClasses UNUSED
          anchorPointUtilities.initAnchorPoints(options.bendPositionsFunction, options.controlPositionsFunction, cy.edges(), options.ignoredClasses);
        }

        if (options.enabled) uiUtilities(options, cy);else uiUtilities("unbind", cy);
      }

      var instance = initialized ? {
        /*
        * get bend or control points of the given edge in an array A,
        * A[2 * i] is the x coordinate and A[2 * i + 1] is the y coordinate
        * of the ith bend point. (Returns undefined if the curve style is not segments nor unbundled bezier)
        */
        getAnchorsAsArray: function getAnchorsAsArray(ele) {
          return anchorPointUtilities.getAnchorsAsArray(ele);
        },
        // Initilize points for the given edges using 'options.bendPositionsFunction'
        initAnchorPoints: function initAnchorPoints(eles) {
          anchorPointUtilities.initAnchorPoints(options.bendPositionsFunction, options.controlPositionsFunction, eles);
        },
        deleteSelectedAnchor: function deleteSelectedAnchor(ele, index) {
          anchorPointUtilities.removeAnchor(ele, index);
        }
      } : undefined;

      return instance; // chainability
    });
  };

  if ( true && module.exports) {
    // expose as a commonjs module
    module.exports = register;
  }

  if (true) {
    // expose as an amd/requirejs module
    !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
      return register;
    }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }

  if (typeof cytoscape !== 'undefined' && $ && Konva) {
    // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape, $, Konva);
  }
})();

/***/ }),

/***/ 171:
/***/ ((module) => {



var reconnectionUtilities = {

    // creates and returns a dummy node which is connected to the disconnected edge
    disconnectEdge: function disconnectEdge(edge, cy, position, disconnectedEnd) {

        var dummyNode = {
            data: {
                id: 'nwt_reconnectEdge_dummy',
                ports: []
            },
            style: {
                width: 1,
                height: 1,
                'visibility': 'hidden'
            },
            renderedPosition: position
        };
        cy.add(dummyNode);

        var loc = disconnectedEnd === 'source' ? { source: dummyNode.data.id } : { target: dummyNode.data.id };

        edge = edge.move(loc)[0];

        return {
            dummyNode: cy.nodes("#" + dummyNode.data.id)[0],
            edge: edge
        };
    },

    connectEdge: function connectEdge(edge, node, location) {
        if (!edge.isEdge() || !node.isNode()) return;

        var loc = {};
        if (location === 'source') loc.source = node.id();else if (location === 'target') loc.target = node.id();else return;

        return edge.move(loc)[0];
    },

    copyEdge: function copyEdge(oldEdge, newEdge) {
        this.copyAnchors(oldEdge, newEdge);
        this.copyStyle(oldEdge, newEdge);
    },

    copyStyle: function copyStyle(oldEdge, newEdge) {
        if (oldEdge && newEdge) {
            newEdge.data('line-color', oldEdge.data('line-color'));
            newEdge.data('width', oldEdge.data('width'));
            newEdge.data('cardinality', oldEdge.data('cardinality'));
        }
    },

    copyAnchors: function copyAnchors(oldEdge, newEdge) {
        if (oldEdge.hasClass('edgebendediting-hasbendpoints')) {
            var bpDistances = oldEdge.data('cyedgebendeditingDistances');
            var bpWeights = oldEdge.data('cyedgebendeditingWeights');

            newEdge.data('cyedgebendeditingDistances', bpDistances);
            newEdge.data('cyedgebendeditingWeights', bpWeights);
            newEdge.addClass('edgebendediting-hasbendpoints');
        } else if (oldEdge.hasClass('edgecontrolediting-hascontrolpoints')) {
            var bpDistances = oldEdge.data('cyedgecontroleditingDistances');
            var bpWeights = oldEdge.data('cyedgecontroleditingWeights');

            newEdge.data('cyedgecontroleditingDistances', bpDistances);
            newEdge.data('cyedgecontroleditingWeights', bpWeights);
            newEdge.addClass('edgecontrolediting-hascontrolpoints');
        }
        if (oldEdge.hasClass('edgebendediting-hasmultiplebendpoints')) {
            newEdge.addClass('edgebendediting-hasmultiplebendpoints');
        } else if (oldEdge.hasClass('edgecontrolediting-hasmultiplecontrolpoints')) {
            newEdge.addClass('edgecontrolediting-hasmultiplecontrolpoints');
        }
    }
};

module.exports = reconnectionUtilities;

/***/ }),

/***/ 961:
/***/ ((module) => {



module.exports = function (cy, anchorPointUtilities, params) {
  if (cy.undoRedo == null) return;

  var ur = cy.undoRedo({
    defaultActions: false,
    isDebug: true
  });

  function changeAnchorPoints(param) {
    var edge = cy.getElementById(param.edge.id());
    var type = param.type !== 'inconclusive' ? param.type : anchorPointUtilities.getEdgeType(edge);

    var weights, distances, weightStr, distanceStr;

    if (param.type === 'inconclusive' && !param.set) {
      weights = [];
      distances = [];
    } else {
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
      } else if (hadAnchorPoint && !hadMultipleAnchorPoints) {
        // Had single anchor
        edge.addClass(singleClassName);
        edge.removeClass(multiClassName);
      } else {
        // Had multiple anchors. Add multiple classes with space delimeted string of class names
        edge.addClass(singleClassName + " " + multiClassName);
      }
      if (!edge.selected()) edge.select();else {
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
    edges.forEach(function (edge) {
      var type = anchorPointUtilities.getEdgeType(edge);
      var previousAnchorsPosition = anchorPointUtilities.getAnchorsAsArray(edge);
      var nextAnchorsPosition = [];
      if (previousAnchorsPosition != undefined) {
        for (var i = 0; i < previousAnchorsPosition.length; i += 2) {
          nextAnchorsPosition.push({ x: previousAnchorsPosition[i] + positionDiff.x, y: previousAnchorsPosition[i + 1] + positionDiff.y });
        }
        edge.data(anchorPointUtilities.syntax[type]['pointPos'], nextAnchorsPosition);
      }
    });

    anchorPointUtilities.initAnchorPoints(params.bendPositionsFunction, params.controlPositionsFunction, edges);
  }

  function reconnectEdge(param) {
    var edge = param.edge;
    var location = param.location;
    var oldLoc = param.oldLoc;

    edge = edge.move(location)[0];

    var result = {
      edge: edge,
      location: oldLoc,
      oldLoc: location
    };
    edge.unselect();
    return result;
  }

  function removeReconnectedEdge(param) {
    var oldEdge = param.oldEdge;
    var tmp = cy.getElementById(oldEdge.data('id'));
    if (tmp && tmp.length > 0) oldEdge = tmp;

    var newEdge = param.newEdge;
    var tmp = cy.getElementById(newEdge.data('id'));
    if (tmp && tmp.length > 0) newEdge = tmp;

    if (oldEdge.inside()) {
      oldEdge = oldEdge.remove()[0];
    }

    if (newEdge.removed()) {
      newEdge = newEdge.restore();
      newEdge.unselect();
    }

    return {
      oldEdge: newEdge,
      newEdge: oldEdge
    };
  }

  ur.action('changeAnchorPoints', changeAnchorPoints, changeAnchorPoints);
  ur.action('moveAnchorPoints', moveDo, moveDo);
  ur.action('reconnectEdge', reconnectEdge, reconnectEdge);
  ur.action('removeReconnectedEdge', removeReconnectedEdge, removeReconnectedEdge);
};

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(579);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jeXRvc2NhcGVFZGdlRWRpdGluZy93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvQW5jaG9yUG9pbnRVdGlsaXRpZXMuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvVUlVdGlsaXRpZXMuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvZGVib3VuY2UuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvcmVjb25uZWN0aW9uVXRpbGl0aWVzLmpzIiwid2VicGFjazovL2N5dG9zY2FwZUVkZ2VFZGl0aW5nLy4vc3JjL3JlZ2lzdGVyVW5kb1JlZG9GdW5jdGlvbnMuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbImFuY2hvclBvaW50VXRpbGl0aWVzIiwiY3VycmVudEN0eEVkZ2UiLCJ1bmRlZmluZWQiLCJjdXJyZW50Q3R4UG9zIiwiY3VycmVudEFuY2hvckluZGV4IiwiaWdub3JlZENsYXNzZXMiLCJzZXRJZ25vcmVkQ2xhc3NlcyIsIl9pZ25vcmVkQ2xhc3NlcyIsInN5bnRheCIsImJlbmQiLCJlZGdlIiwiY2xhc3MiLCJtdWx0aUNsYXNzIiwid2VpZ2h0IiwiZGlzdGFuY2UiLCJ3ZWlnaHRDc3MiLCJkaXN0YW5jZUNzcyIsInBvaW50UG9zIiwiY29udHJvbCIsImdldEVkZ2VUeXBlIiwiaGFzQ2xhc3MiLCJjc3MiLCJkYXRhIiwibGVuZ3RoIiwiaW5pdEFuY2hvclBvaW50cyIsImJlbmRQb3NpdGlvbnNGY24iLCJjb250cm9sUG9zaXRpb25zRmNuIiwiZWRnZXMiLCJpIiwidHlwZSIsImlzSWdub3JlZEVkZ2UiLCJhbmNob3JQb3NpdGlvbnMiLCJhcHBseSIsInJlc3VsdCIsImNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb25zIiwiZGlzdGFuY2VzIiwid2VpZ2h0cyIsImFkZENsYXNzIiwic3RhcnRYIiwic291cmNlIiwicG9zaXRpb24iLCJzdGFydFkiLCJlbmRYIiwidGFyZ2V0IiwiZW5kWSIsImlkIiwiZ2V0TGluZURpcmVjdGlvbiIsInNyY1BvaW50IiwidGd0UG9pbnQiLCJ5IiwieCIsImdldFNyY1RndFBvaW50c0FuZFRhbmdlbnRzIiwic291cmNlTm9kZSIsInRhcmdldE5vZGUiLCJ0Z3RQb3NpdGlvbiIsInNyY1Bvc2l0aW9uIiwibTEiLCJtMiIsImdldEludGVyc2VjdGlvbiIsInBvaW50Iiwic3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMiLCJpbnRlcnNlY3RYIiwiaW50ZXJzZWN0WSIsIkluZmluaXR5IiwiYTEiLCJhMiIsImludGVyc2VjdGlvblBvaW50IiwiZ2V0QW5jaG9yc0FzQXJyYXkiLCJhbmNob3JMaXN0IiwicHN0eWxlIiwicGZWYWx1ZSIsIm1pbkxlbmd0aHMiLCJNYXRoIiwibWluIiwic3JjUG9zIiwidGd0UG9zIiwiZHkiLCJkeCIsImwiLCJzcXJ0IiwidmVjdG9yIiwidmVjdG9yTm9ybSIsInZlY3Rvck5vcm1JbnZlcnNlIiwicyIsInciLCJkIiwidzEiLCJ3MiIsInBvc1B0cyIsIngxIiwieDIiLCJ5MSIsInkyIiwibWlkcHRQdHMiLCJhZGp1c3RlZE1pZHB0IiwicHVzaCIsImNvbnZlcnRUb0FuY2hvckFic29sdXRlUG9zaXRpb25zIiwiYW5jaG9ySW5kZXgiLCJtaWRYIiwibWlkWSIsImFic29sdXRlWCIsImFic29sdXRlWSIsIm9idGFpblByZXZBbmNob3JBYnNvbHV0ZVBvc2l0aW9ucyIsIm9idGFpbk5leHRBbmNob3JBYnNvbHV0ZVBvc2l0aW9ucyIsImNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb24iLCJwb3ciLCJkaXJlY3Rpb24xIiwiZGlyZWN0aW9uMiIsImFuY2hvclBvaW50cyIsImFuY2hvciIsInJlbGF0aXZlQW5jaG9yUG9zaXRpb24iLCJnZXREaXN0YW5jZXNTdHJpbmciLCJzdHIiLCJnZXRXZWlnaHRzU3RyaW5nIiwiYWRkQW5jaG9yUG9pbnQiLCJuZXdBbmNob3JQb2ludCIsIndlaWdodFN0ciIsImRpc3RhbmNlU3RyIiwicmVsYXRpdmVQb3NpdGlvbiIsIm9yaWdpbmFsQW5jaG9yV2VpZ2h0Iiwic3RhcnRXZWlnaHQiLCJlbmRXZWlnaHQiLCJ3ZWlnaHRzV2l0aFRndFNyYyIsImNvbmNhdCIsImFuY2hvcnNMaXN0IiwibWluRGlzdCIsImludGVyc2VjdGlvbiIsInB0c1dpdGhUZ3RTcmMiLCJuZXdBbmNob3JJbmRleCIsImIxIiwiY29tcGFyZVdpdGhQcmVjaXNpb24iLCJiMiIsImIzIiwiYjQiLCJzdGFydCIsImVuZCIsImN1cnJlbnRJbnRlcnNlY3Rpb24iLCJkaXN0Iiwic3BsaWNlIiwicmVtb3ZlQW5jaG9yIiwiZWRnZVR5cGVJbmNvbmNsdXNpdmVTaG91bGRudEhhcHBlbiIsInBvc2l0aW9uRGF0YVN0ciIsInBvc2l0aW9ucyIsInJlbW92ZUNsYXNzIiwicmVtb3ZlQWxsQW5jaG9ycyIsImNhbGN1bGF0ZURpc3RhbmNlIiwicHQxIiwicHQyIiwiZGlmZlgiLCJkaWZmWSIsIm4xIiwibjIiLCJpc0xlc3NUaGVuT3JFcXVhbCIsInByZWNpc2lvbiIsImRpZmYiLCJhYnMiLCJwbGFjZSIsImNvbnNvbGUiLCJsb2ciLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVib3VuY2UiLCJyZXF1aXJlIiwicmVjb25uZWN0aW9uVXRpbGl0aWVzIiwicmVnaXN0ZXJVbmRvUmVkb0Z1bmN0aW9ucyIsInN0YWdlSWQiLCJwYXJhbXMiLCJjeSIsImZuIiwiYWRkQmVuZFBvaW50Q3h0TWVudUlkIiwicmVtb3ZlQmVuZFBvaW50Q3h0TWVudUlkIiwicmVtb3ZlQWxsQmVuZFBvaW50Q3R4TWVudUlkIiwiYWRkQ29udHJvbFBvaW50Q3h0TWVudUlkIiwicmVtb3ZlQ29udHJvbFBvaW50Q3h0TWVudUlkIiwicmVtb3ZlQWxsQ29udHJvbFBvaW50Q3R4TWVudUlkIiwiZVN0eWxlIiwiZVJlbW92ZSIsImVBZGQiLCJlWm9vbSIsImVTZWxlY3QiLCJlVW5zZWxlY3QiLCJlVGFwU3RhcnQiLCJlVGFwU3RhcnRPbkVkZ2UiLCJlVGFwRHJhZyIsImVUYXBFbmQiLCJlQ3h0VGFwIiwiZURyYWciLCJsYXN0UGFubmluZ0VuYWJsZWQiLCJsYXN0Wm9vbWluZ0VuYWJsZWQiLCJsYXN0Qm94U2VsZWN0aW9uRW5hYmxlZCIsImxhc3RBY3RpdmVCZ09wYWNpdHkiLCJlZGdlVG9IaWdobGlnaHQiLCJudW1iZXJPZlNlbGVjdGVkRWRnZXMiLCJlbmRwb2ludFNoYXBlMSIsImVuZHBvaW50U2hhcGUyIiwiYW5jaG9yVG91Y2hlZCIsIm1vdXNlT3V0IiwiZnVuY3Rpb25zIiwiaW5pdCIsInNlbGYiLCJvcHRzIiwiJGNvbnRhaW5lciIsIiQiLCJjYW52YXNFbGVtZW50SWQiLCIkY2FudmFzRWxlbWVudCIsImZpbmQiLCJhcHBlbmQiLCJzdGFnZSIsIktvbnZhIiwic3RhZ2VzIiwiU3RhZ2UiLCJjb250YWluZXIiLCJ3aWR0aCIsImhlaWdodCIsImNhbnZhcyIsImdldENoaWxkcmVuIiwiTGF5ZXIiLCJhZGQiLCJhbmNob3JNYW5hZ2VyIiwiZWRnZVR5cGUiLCJhbmNob3JzIiwidG91Y2hlZEFuY2hvciIsInRvdWNoZWRBbmNob3JJbmRleCIsImJpbmRMaXN0ZW5lcnMiLCJvbiIsImVNb3VzZURvd24iLCJ1bmJpbmRMaXN0ZW5lcnMiLCJvZmYiLCJldmVudCIsImF1dG91bnNlbGVjdGlmeSIsInVuc2VsZWN0IiwibW92ZUFuY2hvclBhcmFtIiwidHVybk9mZkFjdGl2ZUJnQ29sb3IiLCJkaXNhYmxlR2VzdHVyZXMiLCJhdXRvdW5ncmFiaWZ5IiwiZ2V0U3RhZ2UiLCJlTW91c2VVcCIsImVNb3VzZU91dCIsInNlbGVjdCIsInJlc2V0QWN0aXZlQmdDb2xvciIsInJlc2V0R2VzdHVyZXMiLCJjbGVhckFuY2hvcnNFeGNlcHQiLCJkb250Q2xlYW4iLCJleGNlcHRpb25BcHBsaWVzIiwiZm9yRWFjaCIsImluZGV4IiwiZGVzdHJveSIsInJlbmRlckFuY2hvclNoYXBlcyIsImdldEFuY2hvclNoYXBlc0xlbmd0aCIsImFuY2hvclgiLCJhbmNob3JZIiwicmVuZGVyQW5jaG9yU2hhcGUiLCJkcmF3IiwidG9wTGVmdFgiLCJ0b3BMZWZ0WSIsInJlbmRlcmVkVG9wTGVmdFBvcyIsImNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24iLCJ6b29tIiwibmV3QW5jaG9yIiwiUmVjdCIsImZpbGwiLCJzdHJva2VXaWR0aCIsImRyYWdnYWJsZSIsImN4dEFkZEJlbmRGY24iLCJjeHRBZGRBbmNob3JGY24iLCJjeHRBZGRDb250cm9sRmNuIiwiYW5jaG9yVHlwZSIsImN5VGFyZ2V0IiwicGFyYW0iLCJvcHRpb25zIiwidW5kb2FibGUiLCJ1bmRvUmVkbyIsImRvIiwicmVmcmVzaERyYXdzIiwiY3h0UmVtb3ZlQW5jaG9yRmNuIiwic2V0VGltZW91dCIsImN4dFJlbW92ZUFsbEFuY2hvcnNGY24iLCJoYW5kbGVSZWNvbm5lY3RFZGdlIiwidmFsaWRhdGVFZGdlIiwiYWN0T25VbnN1Y2Nlc3NmdWxSZWNvbm5lY3Rpb24iLCJtZW51SXRlbXMiLCJjb250ZW50IiwiYWRkQmVuZE1lbnVJdGVtVGl0bGUiLCJzZWxlY3RvciIsIm9uQ2xpY2tGdW5jdGlvbiIsInJlbW92ZUJlbmRNZW51SXRlbVRpdGxlIiwicmVtb3ZlQWxsQmVuZE1lbnVJdGVtVGl0bGUiLCJlbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb24iLCJhZGRDb250cm9sTWVudUl0ZW1UaXRsZSIsImNvcmVBc1dlbGwiLCJyZW1vdmVDb250cm9sTWVudUl0ZW1UaXRsZSIsInJlbW92ZUFsbENvbnRyb2xNZW51SXRlbVRpdGxlIiwiY29udGV4dE1lbnVzIiwibWVudXMiLCJpc0FjdGl2ZSIsImFwcGVuZE1lbnVJdGVtcyIsIl9zaXplQ2FudmFzIiwiYXR0ciIsInpJbmRleCIsImNhbnZhc0JiIiwib2Zmc2V0IiwiY29udGFpbmVyQmIiLCJ0b3AiLCJsZWZ0Iiwic2V0V2lkdGgiLCJzZXRIZWlnaHQiLCJzaXplQ2FudmFzIiwid2luZG93IiwiYmluZCIsIm9wdENhY2hlIiwibW9kZWxQb3NpdGlvbiIsInBhbiIsInJlbmRlckVuZFBvaW50U2hhcGVzIiwiZWRnZV9wdHMiLCJzb3VyY2VQb3MiLCJzb3VyY2VFbmRwb2ludCIsInRhcmdldFBvcyIsInRhcmdldEVuZHBvaW50IiwidW5zaGlmdCIsInNyYyIsIm5leHRUb1NvdXJjZSIsIm5leHRUb1RhcmdldCIsInJlbmRlckVhY2hFbmRQb2ludFNoYXBlIiwic1RvcExlZnRYIiwic1RvcExlZnRZIiwidFRvcExlZnRYIiwidFRvcExlZnRZIiwibmV4dFRvU291cmNlWCIsIm5leHRUb1NvdXJjZVkiLCJuZXh0VG9UYXJnZXRYIiwibmV4dFRvVGFyZ2V0WSIsInJlbmRlcmVkU291cmNlUG9zIiwicmVuZGVyZWRUYXJnZXRQb3MiLCJyZW5kZXJlZE5leHRUb1NvdXJjZSIsInJlbmRlcmVkTmV4dFRvVGFyZ2V0IiwiZGlzdGFuY2VGcm9tTm9kZSIsImRpc3RhbmNlU291cmNlIiwic291cmNlRW5kUG9pbnRYIiwic291cmNlRW5kUG9pbnRZIiwiZGlzdGFuY2VUYXJnZXQiLCJ0YXJnZXRFbmRQb2ludFgiLCJ0YXJnZXRFbmRQb2ludFkiLCJDaXJjbGUiLCJyYWRpdXMiLCJmYWN0b3IiLCJhbmNob3JTaGFwZVNpemVGYWN0b3IiLCJlbmFibGVBbmNob3JTaXplTm90SW1wYWN0Qnlab29tIiwiYWN0dWFsRmFjdG9yIiwicGFyc2VGbG9hdCIsImNoZWNrSWZJbnNpZGVTaGFwZSIsImNlbnRlclgiLCJjZW50ZXJZIiwibWluWCIsIm1heFgiLCJtaW5ZIiwibWF4WSIsImluc2lkZSIsImdldENvbnRhaW5pbmdTaGFwZUluZGV4IiwiZ2V0Q29udGFpbmluZ0VuZFBvaW50IiwiYWxsUHRzIiwiX3ByaXZhdGUiLCJyc2NyYXRjaCIsImFsbHB0cyIsInBhbm5pbmdFbmFibGVkIiwiem9vbWluZ0VuYWJsZWQiLCJib3hTZWxlY3Rpb25FbmFibGVkIiwic3R5bGUiLCJjb3JlU3R5bGUiLCJ2YWx1ZSIsInVwZGF0ZSIsIm1vdmVBbmNob3JQb2ludHMiLCJwb3NpdGlvbkRpZmYiLCJwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiIsIm5leHRBbmNob3JQb2ludHNQb3NpdGlvbiIsImJlbmRQb3NpdGlvbnNGdW5jdGlvbiIsImNvbnRyb2xQb3NpdGlvbnNGdW5jdGlvbiIsInRyaWdnZXIiLCJfY2FsY0Nvc3RUb1ByZWZlcnJlZFBvc2l0aW9uIiwicDEiLCJwMiIsImN1cnJlbnRBbmdsZSIsImF0YW4yIiwicGVyZmVjdEFuZ2xlIiwiUEkiLCJkZWx0YUFuZ2xlIiwiYW5nbGUiLCJpbmRleE9mTWluIiwiaW5kZXhPZiIsImNvc3QiLCJzaW4iLCJjaG9zZW5BbmdsZSIsImVkZ2VMIiwiY29zIiwidGFyZ2V0UG9pbnRYIiwidGFyZ2V0UG9pbnRZIiwibW92ZUFuY2hvck9uRHJhZyIsInByZXZQb2ludFBvc2l0aW9uIiwibmV4dFBvaW50UG9zaXRpb24iLCJtb3VzZVBvc2l0aW9uIiwianVkZ2VQcmV2IiwianVkZ2VOZXh0IiwiZGVjaXNpb25PYmoiLCJ6b29tTGV2ZWwiLCJjb3N0RGlzdGFuY2UiLCJzdGlja3lBbmNob3JUb2xlcmVuY2UiLCJhbmdsZTEiLCJhbmdsZTIiLCJwcmV2WCIsInByZXZZIiwibmV4WCIsIm5leFkiLCJmeCIsImZ5Iiwic3giLCJzeSIsImEiLCJiIiwiX21vdmVBbmNob3JPbkRyYWciLCJzZWxlY3RlZEVkZ2VzIiwic2VsZWN0ZWQiLCJzdGFydEJhdGNoIiwiZW5kQmF0Y2giLCJjb25uZWN0ZWRFZGdlcyIsIm1vdmVkQW5jaG9ySW5kZXgiLCJ0YXBTdGFydFBvcyIsIm1vdmVkRWRnZSIsImNyZWF0ZUFuY2hvck9uRHJhZyIsIm1vdmVkRW5kUG9pbnQiLCJkdW1teU5vZGUiLCJkZXRhY2hlZE5vZGUiLCJub2RlVG9BdHRhY2giLCJhbmNob3JDcmVhdGVkQnlEcmFnIiwiY3lQb3NpdGlvbiIsImN5UG9zWCIsImN5UG9zWSIsImVuZFBvaW50IiwiZGlzY29ubmVjdGVkRW5kIiwiZGlzY29ubmVjdEVkZ2UiLCJyZW5kZXJlZFBvc2l0aW9uIiwibm9kZSIsIm5vZGVzIiwiZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnIiwiZXZlbnRQb3MiLCJpc05vZGUiLCJmaXJlIiwiYWxsQW5jaG9ycyIsInByZUluZGV4IiwicG9zSW5kZXgiLCJwcmVBbmNob3JQb2ludCIsInBvc0FuY2hvclBvaW50IiwibmVhclRvTGluZSIsImJlbmRSZW1vdmFsU2Vuc2l0aXZpdHkiLCJlbmFibGVSZW1vdmVBbmNob3JNaWRPZk5lYXJMaW5lIiwibmV3Tm9kZSIsImlzVmFsaWQiLCJsb2NhdGlvbiIsIm5ld1NvdXJjZSIsIm5ld1RhcmdldCIsImNvbm5lY3RFZGdlIiwicmVjb25uZWN0ZWRFZGdlIiwiY29weUVkZ2UiLCJuZXdFZGdlIiwib2xkRWRnZSIsInJlbW92ZSIsImxvYyIsIm9sZExvYyIsInRvU3RyaW5nIiwibW92ZWFuY2hvcnBhcmFtIiwiZmlyc3RBbmNob3IiLCJlZGdlQ29udGFpbmluZ0ZpcnN0QW5jaG9yIiwiZmlyc3RBbmNob3JQb2ludEZvdW5kIiwiZSIsImZpcnN0VGltZSIsImZpcnN0QW5jaG9yUG9zaXRpb24iLCJpbml0aWFsUG9zIiwibW92ZWRGaXJzdEFuY2hvciIsInRhcmdldElzRWRnZSIsImlzRWRnZSIsImVyciIsImhpZGVNZW51SXRlbSIsImN5UG9zIiwic2VsZWN0ZWRJbmRleCIsInNob3dNZW51SXRlbSIsImFuY2hvcnNNb3ZpbmciLCJrZXlzIiwia2V5RG93biIsInNob3VsZE1vdmUiLCJtb3ZlU2VsZWN0ZWRBbmNob3JzT25LZXlFdmVudHMiLCJ0biIsImRvY3VtZW50IiwiYWN0aXZlRWxlbWVudCIsInRhZ05hbWUiLCJrZXlDb2RlIiwicHJldmVudERlZmF1bHQiLCJlbGVtZW50cyIsIm1vdmVTcGVlZCIsImFsdEtleSIsInNoaWZ0S2V5IiwidXBBcnJvd0NvZGUiLCJkb3duQXJyb3dDb2RlIiwibGVmdEFycm93Q29kZSIsInJpZ2h0QXJyb3dDb2RlIiwia2V5VXAiLCJhZGRFdmVudExpc3RlbmVyIiwidW5iaW5kIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJhcmd1bWVudHMiLCJlcnJvciIsIkZVTkNfRVJST1JfVEVYVCIsIm5hdGl2ZU1heCIsIm1heCIsIm5hdGl2ZU5vdyIsIkRhdGUiLCJub3ciLCJnZXRUaW1lIiwiZnVuYyIsIndhaXQiLCJhcmdzIiwibWF4VGltZW91dElkIiwic3RhbXAiLCJ0aGlzQXJnIiwidGltZW91dElkIiwidHJhaWxpbmdDYWxsIiwibGFzdENhbGxlZCIsIm1heFdhaXQiLCJ0cmFpbGluZyIsIlR5cGVFcnJvciIsImxlYWRpbmciLCJpc09iamVjdCIsImNhbmNlbCIsImNsZWFyVGltZW91dCIsImNvbXBsZXRlIiwiaXNDYWxsZWQiLCJkZWxheWVkIiwicmVtYWluaW5nIiwibWF4RGVsYXllZCIsImRlYm91bmNlZCIsImxlYWRpbmdDYWxsIiwicmVnaXN0ZXIiLCJjeXRvc2NhcGUiLCJ1aVV0aWxpdGllcyIsImRlZmF1bHRzIiwiZWxlIiwiaW5pdEFuY2hvcnNBdXRvbWF0aWNhbGx5IiwiZW5hYmxlZCIsImluaXRpYWxpemVkIiwiZXh0ZW5kIiwib2JqIiwiaXNOYU4iLCJpbnN0YW5jZSIsImVsZXMiLCJkZWxldGVTZWxlY3RlZEFuY2hvciIsImRlZmluZSIsInBvcnRzIiwibW92ZSIsImNvcHlBbmNob3JzIiwiY29weVN0eWxlIiwiYnBEaXN0YW5jZXMiLCJicFdlaWdodHMiLCJ1ciIsImRlZmF1bHRBY3Rpb25zIiwiaXNEZWJ1ZyIsImNoYW5nZUFuY2hvclBvaW50cyIsImdldEVsZW1lbnRCeUlkIiwic2V0IiwiaGFkQW5jaG9yUG9pbnQiLCJoYWRNdWx0aXBsZUFuY2hvclBvaW50cyIsInJlbW92ZURhdGEiLCJzaW5nbGVDbGFzc05hbWUiLCJtdWx0aUNsYXNzTmFtZSIsIm1vdmVEbyIsImFyZyIsIm1vdmVBbmNob3JzVW5kb2FibGUiLCJuZXh0QW5jaG9yc1Bvc2l0aW9uIiwicmVjb25uZWN0RWRnZSIsInJlbW92ZVJlY29ubmVjdGVkRWRnZSIsInRtcCIsInJlbW92ZWQiLCJyZXN0b3JlIiwiYWN0aW9uIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsTzs7Ozs7Ozs7O0FDVkEsSUFBSUEsdUJBQXVCO0FBQ3pCQyxrQkFBZ0JDLFNBRFM7QUFFekJDLGlCQUFlRCxTQUZVO0FBR3pCRSxzQkFBb0JGLFNBSEs7QUFJekJHLGtCQUFnQkgsU0FKUztBQUt6QkkscUJBQW1CLDJCQUFTQyxlQUFULEVBQTBCO0FBQzNDLFNBQUtGLGNBQUwsR0FBc0JFLGVBQXRCO0FBQ0QsR0FQd0I7QUFRekJDLFVBQVE7QUFDTkMsVUFBTTtBQUNKQyxZQUFNLFVBREY7QUFFSkMsYUFBTywrQkFGSDtBQUdKQyxrQkFBWSx1Q0FIUjtBQUlKQyxjQUFRLDBCQUpKO0FBS0pDLGdCQUFVLDRCQUxOO0FBTUpDLGlCQUFXLGlCQU5QO0FBT0pDLG1CQUFhLG1CQVBUO0FBUUpDLGdCQUFVO0FBUk4sS0FEQTtBQVdOQyxhQUFTO0FBQ1BSLFlBQU0sa0JBREM7QUFFUEMsYUFBTyxxQ0FGQTtBQUdQQyxrQkFBWSw2Q0FITDtBQUlQQyxjQUFRLDZCQUpEO0FBS1BDLGdCQUFVLCtCQUxIO0FBTVBDLGlCQUFXLHVCQU5KO0FBT1BDLG1CQUFhLHlCQVBOO0FBUVBDLGdCQUFVO0FBUkg7QUFYSCxHQVJpQjtBQThCekI7QUFDQTtBQUNBO0FBQ0FFLGVBQWEscUJBQVNULElBQVQsRUFBYztBQUN6QixRQUFHLENBQUNBLElBQUosRUFDRSxPQUFPLGNBQVAsQ0FERixLQUVLLElBQUdBLEtBQUtVLFFBQUwsQ0FBYyxLQUFLWixNQUFMLENBQVksTUFBWixFQUFvQixPQUFwQixD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QUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUN0QkE7VUFDQTtVQUNBO1VBQ0EiLCJmaWxlIjoiY3l0b3NjYXBlLWVkZ2UtZWRpdGluZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcImN5dG9zY2FwZUVkZ2VFZGl0aW5nXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcImN5dG9zY2FwZUVkZ2VFZGl0aW5nXCJdID0gZmFjdG9yeSgpO1xufSkoc2VsZiwgZnVuY3Rpb24oKSB7XG5yZXR1cm4gIiwidmFyIGFuY2hvclBvaW50VXRpbGl0aWVzID0ge1xyXG4gIGN1cnJlbnRDdHhFZGdlOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudEN0eFBvczogdW5kZWZpbmVkLFxyXG4gIGN1cnJlbnRBbmNob3JJbmRleDogdW5kZWZpbmVkLFxyXG4gIGlnbm9yZWRDbGFzc2VzOiB1bmRlZmluZWQsXHJcbiAgc2V0SWdub3JlZENsYXNzZXM6IGZ1bmN0aW9uKF9pZ25vcmVkQ2xhc3Nlcykge1xyXG4gICAgdGhpcy5pZ25vcmVkQ2xhc3NlcyA9IF9pZ25vcmVkQ2xhc3NlcztcclxuICB9LFxyXG4gIHN5bnRheDoge1xyXG4gICAgYmVuZDoge1xyXG4gICAgICBlZGdlOiBcInNlZ21lbnRzXCIsXHJcbiAgICAgIGNsYXNzOiBcImVkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzXCIsXHJcbiAgICAgIG11bHRpQ2xhc3M6IFwiZWRnZWJlbmRlZGl0aW5nLWhhc211bHRpcGxlYmVuZHBvaW50c1wiLFxyXG4gICAgICB3ZWlnaHQ6IFwiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCIsXHJcbiAgICAgIGRpc3RhbmNlOiBcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCIsXHJcbiAgICAgIHdlaWdodENzczogXCJzZWdtZW50LXdlaWdodHNcIixcclxuICAgICAgZGlzdGFuY2VDc3M6IFwic2VnbWVudC1kaXN0YW5jZXNcIixcclxuICAgICAgcG9pbnRQb3M6IFwiYmVuZFBvaW50UG9zaXRpb25zXCIsXHJcbiAgICB9LFxyXG4gICAgY29udHJvbDoge1xyXG4gICAgICBlZGdlOiBcInVuYnVuZGxlZC1iZXppZXJcIixcclxuICAgICAgY2xhc3M6IFwiZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHNcIixcclxuICAgICAgbXVsdGlDbGFzczogXCJlZGdlY29udHJvbGVkaXRpbmctaGFzbXVsdGlwbGVjb250cm9scG9pbnRzXCIsXHJcbiAgICAgIHdlaWdodDogXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIixcclxuICAgICAgZGlzdGFuY2U6IFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixcclxuICAgICAgd2VpZ2h0Q3NzOiBcImNvbnRyb2wtcG9pbnQtd2VpZ2h0c1wiLFxyXG4gICAgICBkaXN0YW5jZUNzczogXCJjb250cm9sLXBvaW50LWRpc3RhbmNlc1wiLFxyXG4gICAgICBwb2ludFBvczogXCJjb250cm9sUG9pbnRQb3NpdGlvbnNcIixcclxuICAgIH1cclxuICB9LFxyXG4gIC8vIGdldHMgZWRnZSB0eXBlIGFzICdiZW5kJyBvciAnY29udHJvbCdcclxuICAvLyB0aGUgaW50ZXJjaGFuZ2luZyBpZi1zIGFyZSBuZWNlc3NhcnkgdG8gc2V0IHRoZSBwcmlvcml0eSBvZiB0aGUgdGFnc1xyXG4gIC8vIGV4YW1wbGU6IGFuIGVkZ2Ugd2l0aCB0eXBlIHNlZ21lbnQgYW5kIGEgY2xhc3MgJ2hhc2NvbnRyb2xwb2ludHMnIHdpbGwgYmUgY2xhc3NpZmllZCBhcyB1bmJ1bmRsZWQgYmV6aWVyXHJcbiAgZ2V0RWRnZVR5cGU6IGZ1bmN0aW9uKGVkZ2Upe1xyXG4gICAgaWYoIWVkZ2UpXHJcbiAgICAgIHJldHVybiAnaW5jb25jbHVzaXZlJztcclxuICAgIGVsc2UgaWYoZWRnZS5oYXNDbGFzcyh0aGlzLnN5bnRheFsnYmVuZCddWydjbGFzcyddKSlcclxuICAgICAgcmV0dXJuICdiZW5kJztcclxuICAgIGVsc2UgaWYoZWRnZS5oYXNDbGFzcyh0aGlzLnN5bnRheFsnY29udHJvbCddWydjbGFzcyddKSlcclxuICAgICAgcmV0dXJuICdjb250cm9sJztcclxuICAgIGVsc2UgaWYoZWRnZS5jc3MoJ2N1cnZlLXN0eWxlJykgPT09IHRoaXMuc3ludGF4WydiZW5kJ11bJ2VkZ2UnXSlcclxuICAgICAgcmV0dXJuICdiZW5kJztcclxuICAgIGVsc2UgaWYoZWRnZS5jc3MoJ2N1cnZlLXN0eWxlJykgPT09IHRoaXMuc3ludGF4Wydjb250cm9sJ11bJ2VkZ2UnXSlcclxuICAgICAgcmV0dXJuICdjb250cm9sJztcclxuICAgIGVsc2UgaWYoZWRnZS5kYXRhKHRoaXMuc3ludGF4WydiZW5kJ11bJ3BvaW50UG9zJ10pICYmIFxyXG4gICAgICAgICAgICBlZGdlLmRhdGEodGhpcy5zeW50YXhbJ2JlbmQnXVsncG9pbnRQb3MnXSkubGVuZ3RoID4gMClcclxuICAgICAgcmV0dXJuICdiZW5kJztcclxuICAgIGVsc2UgaWYoZWRnZS5kYXRhKHRoaXMuc3ludGF4Wydjb250cm9sJ11bJ3BvaW50UG9zJ10pICYmIFxyXG4gICAgICAgICAgICBlZGdlLmRhdGEodGhpcy5zeW50YXhbJ2NvbnRyb2wnXVsncG9pbnRQb3MnXSkubGVuZ3RoID4gMClcclxuICAgICAgcmV0dXJuICdjb250cm9sJztcclxuICAgIHJldHVybiAnaW5jb25jbHVzaXZlJztcclxuICB9LFxyXG4gIC8vIGluaXRpbGl6ZSBhbmNob3IgcG9pbnRzIGJhc2VkIG9uIGJlbmRQb3NpdGlvbnNGY24gYW5kIGNvbnRyb2xQb3NpdGlvbkZjblxyXG4gIGluaXRBbmNob3JQb2ludHM6IGZ1bmN0aW9uKGJlbmRQb3NpdGlvbnNGY24sIGNvbnRyb2xQb3NpdGlvbnNGY24sIGVkZ2VzKSB7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVkZ2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBlZGdlID0gZWRnZXNbaV07XHJcbiAgICAgIHZhciB0eXBlID0gdGhpcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgICAgXHJcbiAgICAgIGlmICh0eXBlID09PSAnaW5jb25jbHVzaXZlJykgeyBcclxuICAgICAgICBjb250aW51ZTsgXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKCF0aGlzLmlzSWdub3JlZEVkZ2UoZWRnZSkpIHtcclxuXHJcbiAgICAgICAgdmFyIGFuY2hvclBvc2l0aW9ucztcclxuXHJcbiAgICAgICAgLy8gZ2V0IHRoZSBhbmNob3IgcG9zaXRpb25zIGJ5IGFwcGx5aW5nIHRoZSBmdW5jdGlvbnMgZm9yIHRoaXMgZWRnZVxyXG4gICAgICAgIGlmKHR5cGUgPT09ICdiZW5kJylcclxuICAgICAgICAgIGFuY2hvclBvc2l0aW9ucyA9IGJlbmRQb3NpdGlvbnNGY24uYXBwbHkodGhpcywgZWRnZSk7XHJcbiAgICAgICAgZWxzZSBpZih0eXBlID09PSAnY29udHJvbCcpXHJcbiAgICAgICAgICBhbmNob3JQb3NpdGlvbnMgPSBjb250cm9sUG9zaXRpb25zRmNuLmFwcGx5KHRoaXMsIGVkZ2UpO1xyXG5cclxuICAgICAgICAvLyBjYWxjdWxhdGUgcmVsYXRpdmUgYW5jaG9yIHBvc2l0aW9uc1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb25zKGVkZ2UsIGFuY2hvclBvc2l0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIGlmIHRoZXJlIGFyZSBhbmNob3JzIHNldCB3ZWlnaHRzIGFuZCBkaXN0YW5jZXMgYWNjb3JkaW5nbHkgYW5kIGFkZCBjbGFzcyB0byBlbmFibGUgc3R5bGUgY2hhbmdlc1xyXG4gICAgICAgIGlmIChyZXN1bHQuZGlzdGFuY2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGVkZ2UuZGF0YSh0aGlzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10sIHJlc3VsdC53ZWlnaHRzKTtcclxuICAgICAgICAgIGVkZ2UuZGF0YSh0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXSwgcmVzdWx0LmRpc3RhbmNlcyk7XHJcbiAgICAgICAgICBlZGdlLmFkZENsYXNzKHRoaXMuc3ludGF4W3R5cGVdWydjbGFzcyddKTtcclxuICAgICAgICAgIGlmIChyZXN1bHQuZGlzdGFuY2VzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgZWRnZS5hZGRDbGFzcyh0aGlzLnN5bnRheFt0eXBlXVsnbXVsdGlDbGFzcyddKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBpc0lnbm9yZWRFZGdlOiBmdW5jdGlvbihlZGdlKSB7XHJcblxyXG4gICAgdmFyIHN0YXJ0WCA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oJ3gnKTtcclxuICAgIHZhciBzdGFydFkgPSBlZGdlLnNvdXJjZSgpLnBvc2l0aW9uKCd5Jyk7XHJcbiAgICB2YXIgZW5kWCA9IGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oJ3gnKTtcclxuICAgIHZhciBlbmRZID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigneScpO1xyXG4gICBcclxuICAgIGlmKChzdGFydFggPT0gZW5kWCAmJiBzdGFydFkgPT0gZW5kWSkgIHx8IChlZGdlLnNvdXJjZSgpLmlkKCkgPT0gZWRnZS50YXJnZXQoKS5pZCgpKSl7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZm9yKHZhciBpID0gMDsgdGhpcy5pZ25vcmVkQ2xhc3NlcyAmJiBpIDwgIHRoaXMuaWdub3JlZENsYXNzZXMubGVuZ3RoOyBpKyspe1xyXG4gICAgICBpZihlZGdlLmhhc0NsYXNzKHRoaXMuaWdub3JlZENsYXNzZXNbaV0pKVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0sXHJcbiAgLy9HZXQgdGhlIGRpcmVjdGlvbiBvZiB0aGUgbGluZSBmcm9tIHNvdXJjZSBwb2ludCB0byB0aGUgdGFyZ2V0IHBvaW50XHJcbiAgZ2V0TGluZURpcmVjdGlvbjogZnVuY3Rpb24oc3JjUG9pbnQsIHRndFBvaW50KXtcclxuICAgIGlmKHNyY1BvaW50LnkgPT0gdGd0UG9pbnQueSAmJiBzcmNQb2ludC54IDwgdGd0UG9pbnQueCl7XHJcbiAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG4gICAgaWYoc3JjUG9pbnQueSA8IHRndFBvaW50LnkgJiYgc3JjUG9pbnQueCA8IHRndFBvaW50Lngpe1xyXG4gICAgICByZXR1cm4gMjtcclxuICAgIH1cclxuICAgIGlmKHNyY1BvaW50LnkgPCB0Z3RQb2ludC55ICYmIHNyY1BvaW50LnggPT0gdGd0UG9pbnQueCl7XHJcbiAgICAgIHJldHVybiAzO1xyXG4gICAgfVxyXG4gICAgaWYoc3JjUG9pbnQueSA8IHRndFBvaW50LnkgJiYgc3JjUG9pbnQueCA+IHRndFBvaW50Lngpe1xyXG4gICAgICByZXR1cm4gNDtcclxuICAgIH1cclxuICAgIGlmKHNyY1BvaW50LnkgPT0gdGd0UG9pbnQueSAmJiBzcmNQb2ludC54ID4gdGd0UG9pbnQueCl7XHJcbiAgICAgIHJldHVybiA1O1xyXG4gICAgfVxyXG4gICAgaWYoc3JjUG9pbnQueSA+IHRndFBvaW50LnkgJiYgc3JjUG9pbnQueCA+IHRndFBvaW50Lngpe1xyXG4gICAgICByZXR1cm4gNjtcclxuICAgIH1cclxuICAgIGlmKHNyY1BvaW50LnkgPiB0Z3RQb2ludC55ICYmIHNyY1BvaW50LnggPT0gdGd0UG9pbnQueCl7XHJcbiAgICAgIHJldHVybiA3O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDg7Ly9pZiBzcmNQb2ludC55ID4gdGd0UG9pbnQueSBhbmQgc3JjUG9pbnQueCA8IHRndFBvaW50LnhcclxuICB9LFxyXG4gIGdldFNyY1RndFBvaW50c0FuZFRhbmdlbnRzOiBmdW5jdGlvbiAoZWRnZSkge1xyXG4gICAgdmFyIHNvdXJjZU5vZGUgPSBlZGdlLnNvdXJjZSgpO1xyXG4gICAgdmFyIHRhcmdldE5vZGUgPSBlZGdlLnRhcmdldCgpO1xyXG4gICAgXHJcbiAgICB2YXIgdGd0UG9zaXRpb24gPSB0YXJnZXROb2RlLnBvc2l0aW9uKCk7XHJcbiAgICB2YXIgc3JjUG9zaXRpb24gPSBzb3VyY2VOb2RlLnBvc2l0aW9uKCk7XHJcbiAgICBcclxuICAgIHZhciBzcmNQb2ludCA9IHNvdXJjZU5vZGUucG9zaXRpb24oKTtcclxuICAgIHZhciB0Z3RQb2ludCA9IHRhcmdldE5vZGUucG9zaXRpb24oKTtcclxuXHJcblxyXG4gICAgdmFyIG0xID0gKHRndFBvaW50LnkgLSBzcmNQb2ludC55KSAvICh0Z3RQb2ludC54IC0gc3JjUG9pbnQueCk7XHJcbiAgICB2YXIgbTIgPSAtMSAvIG0xO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIG0xOiBtMSxcclxuICAgICAgbTI6IG0yLFxyXG4gICAgICBzcmNQb2ludDogc3JjUG9pbnQsXHJcbiAgICAgIHRndFBvaW50OiB0Z3RQb2ludFxyXG4gICAgfTtcclxuICB9LFxyXG4gIGdldEludGVyc2VjdGlvbjogZnVuY3Rpb24oZWRnZSwgcG9pbnQsIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzKXtcclxuICAgIGlmIChzcmNUZ3RQb2ludHNBbmRUYW5nZW50cyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzID0gdGhpcy5nZXRTcmNUZ3RQb2ludHNBbmRUYW5nZW50cyhlZGdlKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc3JjUG9pbnQgPSBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cy5zcmNQb2ludDtcclxuICAgIHZhciB0Z3RQb2ludCA9IHNyY1RndFBvaW50c0FuZFRhbmdlbnRzLnRndFBvaW50O1xyXG4gICAgdmFyIG0xID0gc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMubTE7XHJcbiAgICB2YXIgbTIgPSBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cy5tMjtcclxuXHJcbiAgICB2YXIgaW50ZXJzZWN0WDtcclxuICAgIHZhciBpbnRlcnNlY3RZO1xyXG5cclxuICAgIGlmKG0xID09IEluZmluaXR5IHx8IG0xID09IC1JbmZpbml0eSl7XHJcbiAgICAgIGludGVyc2VjdFggPSBzcmNQb2ludC54O1xyXG4gICAgICBpbnRlcnNlY3RZID0gcG9pbnQueTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYobTEgPT0gMCl7XHJcbiAgICAgIGludGVyc2VjdFggPSBwb2ludC54O1xyXG4gICAgICBpbnRlcnNlY3RZID0gc3JjUG9pbnQueTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB2YXIgYTEgPSBzcmNQb2ludC55IC0gbTEgKiBzcmNQb2ludC54O1xyXG4gICAgICB2YXIgYTIgPSBwb2ludC55IC0gbTIgKiBwb2ludC54O1xyXG5cclxuICAgICAgaW50ZXJzZWN0WCA9IChhMiAtIGExKSAvIChtMSAtIG0yKTtcclxuICAgICAgaW50ZXJzZWN0WSA9IG0xICogaW50ZXJzZWN0WCArIGExO1xyXG4gICAgfVxyXG5cclxuICAgIC8vSW50ZXJzZWN0aW9uIHBvaW50IGlzIHRoZSBpbnRlcnNlY3Rpb24gb2YgdGhlIGxpbmVzIHBhc3NpbmcgdGhyb3VnaCB0aGUgbm9kZXMgYW5kXHJcbiAgICAvL3Bhc3NpbmcgdGhyb3VnaCB0aGUgYmVuZCBvciBjb250cm9sIHBvaW50IGFuZCBwZXJwZW5kaWN1bGFyIHRvIHRoZSBvdGhlciBsaW5lXHJcbiAgICB2YXIgaW50ZXJzZWN0aW9uUG9pbnQgPSB7XHJcbiAgICAgIHg6IGludGVyc2VjdFgsXHJcbiAgICAgIHk6IGludGVyc2VjdFlcclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiBpbnRlcnNlY3Rpb25Qb2ludDtcclxuICB9LFxyXG4gIGdldEFuY2hvcnNBc0FycmF5OiBmdW5jdGlvbihlZGdlKSB7XHJcbiAgICB2YXIgdHlwZSA9IHRoaXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgaWYodHlwZSA9PT0gJ2luY29uY2x1c2l2ZScpe1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZiggZWRnZS5jc3MoJ2N1cnZlLXN0eWxlJykgIT09IHRoaXMuc3ludGF4W3R5cGVdWydlZGdlJ10gKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBhbmNob3JMaXN0ID0gW107XHJcblxyXG4gICAgdmFyIHdlaWdodHMgPSBlZGdlLnBzdHlsZSggdGhpcy5zeW50YXhbdHlwZV1bJ3dlaWdodENzcyddICkgPyBcclxuICAgICAgICAgICAgICAgICAgZWRnZS5wc3R5bGUoIHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHRDc3MnXSApLnBmVmFsdWUgOiBbXTtcclxuICAgIHZhciBkaXN0YW5jZXMgPSBlZGdlLnBzdHlsZSggdGhpcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlQ3NzJ10gKSA/IFxyXG4gICAgICAgICAgICAgICAgICBlZGdlLnBzdHlsZSggdGhpcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlQ3NzJ10gKS5wZlZhbHVlIDogW107XHJcbiAgICB2YXIgbWluTGVuZ3RocyA9IE1hdGgubWluKCB3ZWlnaHRzLmxlbmd0aCwgZGlzdGFuY2VzLmxlbmd0aCApO1xyXG4gICAgXHJcbiAgICB2YXIgc3JjUG9zID0gZWRnZS5zb3VyY2UoKS5wb3NpdGlvbigpO1xyXG4gICAgdmFyIHRndFBvcyA9IGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oKTtcclxuXHJcbiAgICB2YXIgZHkgPSAoIHRndFBvcy55IC0gc3JjUG9zLnkgKTtcclxuICAgIHZhciBkeCA9ICggdGd0UG9zLnggLSBzcmNQb3MueCApO1xyXG4gICAgXHJcbiAgICB2YXIgbCA9IE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcclxuXHJcbiAgICB2YXIgdmVjdG9yID0ge1xyXG4gICAgICB4OiBkeCxcclxuICAgICAgeTogZHlcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHZlY3Rvck5vcm0gPSB7XHJcbiAgICAgIHg6IHZlY3Rvci54IC8gbCxcclxuICAgICAgeTogdmVjdG9yLnkgLyBsXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB2YXIgdmVjdG9yTm9ybUludmVyc2UgPSB7XHJcbiAgICAgIHg6IC12ZWN0b3JOb3JtLnksXHJcbiAgICAgIHk6IHZlY3Rvck5vcm0ueFxyXG4gICAgfTtcclxuXHJcbiAgICBmb3IoIHZhciBzID0gMDsgcyA8IG1pbkxlbmd0aHM7IHMrKyApe1xyXG4gICAgICB2YXIgdyA9IHdlaWdodHNbIHMgXTtcclxuICAgICAgdmFyIGQgPSBkaXN0YW5jZXNbIHMgXTtcclxuXHJcbiAgICAgIHZhciB3MSA9ICgxIC0gdyk7XHJcbiAgICAgIHZhciB3MiA9IHc7XHJcblxyXG4gICAgICB2YXIgcG9zUHRzID0ge1xyXG4gICAgICAgIHgxOiBzcmNQb3MueCxcclxuICAgICAgICB4MjogdGd0UG9zLngsXHJcbiAgICAgICAgeTE6IHNyY1Bvcy55LFxyXG4gICAgICAgIHkyOiB0Z3RQb3MueVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgdmFyIG1pZHB0UHRzID0gcG9zUHRzO1xyXG4gICAgICBcclxuICAgICAgdmFyIGFkanVzdGVkTWlkcHQgPSB7XHJcbiAgICAgICAgeDogbWlkcHRQdHMueDEgKiB3MSArIG1pZHB0UHRzLngyICogdzIsXHJcbiAgICAgICAgeTogbWlkcHRQdHMueTEgKiB3MSArIG1pZHB0UHRzLnkyICogdzJcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGFuY2hvckxpc3QucHVzaChcclxuICAgICAgICBhZGp1c3RlZE1pZHB0LnggKyB2ZWN0b3JOb3JtSW52ZXJzZS54ICogZCxcclxuICAgICAgICBhZGp1c3RlZE1pZHB0LnkgKyB2ZWN0b3JOb3JtSW52ZXJzZS55ICogZFxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gYW5jaG9yTGlzdDtcclxuICB9LFxyXG4gIGNvbnZlcnRUb0FuY2hvckFic29sdXRlUG9zaXRpb25zOiBmdW5jdGlvbiAoZWRnZSwgdHlwZSwgYW5jaG9ySW5kZXgpIHtcclxuICAgIHZhciBzcmNQb3MgPSBlZGdlLnNvdXJjZSgpLnBvc2l0aW9uKCk7XHJcbiAgICB2YXIgdGd0UG9zID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigpO1xyXG4gICAgdmFyIHdlaWdodHMgPSBlZGdlLmRhdGEodGhpcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddKTtcclxuICAgIHZhciBkaXN0YW5jZXMgPSBlZGdlLmRhdGEodGhpcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ10pO1xyXG4gICAgdmFyIHcgPSB3ZWlnaHRzWyBhbmNob3JJbmRleCBdO1xyXG4gICAgdmFyIGQgPSBkaXN0YW5jZXNbIGFuY2hvckluZGV4IF07XHJcbiAgICB2YXIgZHkgPSAoIHRndFBvcy55IC0gc3JjUG9zLnkgKTtcclxuICAgIHZhciBkeCA9ICggdGd0UG9zLnggLSBzcmNQb3MueCApO1xyXG4gICAgdmFyIGwgPSBNYXRoLnNxcnQoIGR4ICogZHggKyBkeSAqIGR5ICk7XHJcbiAgICB2YXIgdmVjdG9yID0ge1xyXG4gICAgICB4OiBkeCxcclxuICAgICAgeTogZHlcclxuICAgIH07XHJcbiAgICB2YXIgdmVjdG9yTm9ybSA9IHtcclxuICAgICAgeDogdmVjdG9yLnggLyBsLFxyXG4gICAgICB5OiB2ZWN0b3IueSAvIGxcclxuICAgIH07XHJcbiAgICB2YXIgdmVjdG9yTm9ybUludmVyc2UgPSB7XHJcbiAgICAgIHg6IC12ZWN0b3JOb3JtLnksXHJcbiAgICAgIHk6IHZlY3Rvck5vcm0ueFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgdzEgPSAoMSAtIHcpO1xyXG4gICAgdmFyIHcyID0gdztcclxuICAgIHZhciBtaWRYPSBzcmNQb3MueCAqIHcxICsgdGd0UG9zLnggKiB3MlxyXG4gICAgdmFyIG1pZFk9IHNyY1Bvcy55ICogdzEgKyB0Z3RQb3MueSAqIHcyXHJcbiAgICB2YXIgYWJzb2x1dGVYPSBtaWRYICsgdmVjdG9yTm9ybUludmVyc2UueCAqIGRcclxuICAgIHZhciBhYnNvbHV0ZVk9IG1pZFkgKyB2ZWN0b3JOb3JtSW52ZXJzZS55ICogZFxyXG5cclxuICAgIHJldHVybiB7eDphYnNvbHV0ZVgseTphYnNvbHV0ZVl9XHJcbiAgfSxcclxuICBvYnRhaW5QcmV2QW5jaG9yQWJzb2x1dGVQb3NpdGlvbnM6IGZ1bmN0aW9uIChlZGdlLCB0eXBlLCBhbmNob3JJbmRleCkge1xyXG4gICAgaWYoYW5jaG9ySW5kZXg8PTApe1xyXG4gICAgICByZXR1cm4gZWRnZS5zb3VyY2UoKS5wb3NpdGlvbigpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRUb0FuY2hvckFic29sdXRlUG9zaXRpb25zKGVkZ2UsdHlwZSxhbmNob3JJbmRleC0xKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgb2J0YWluTmV4dEFuY2hvckFic29sdXRlUG9zaXRpb25zOiBmdW5jdGlvbiAoZWRnZSwgdHlwZSwgYW5jaG9ySW5kZXgpIHtcclxuICAgIHZhciB3ZWlnaHRzID0gZWRnZS5kYXRhKHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSk7XHJcbiAgICB2YXIgZGlzdGFuY2VzID0gZWRnZS5kYXRhKHRoaXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddKTtcclxuICAgIHZhciBtaW5MZW5ndGhzID0gTWF0aC5taW4oIHdlaWdodHMubGVuZ3RoLCBkaXN0YW5jZXMubGVuZ3RoICk7XHJcbiAgICBpZihhbmNob3JJbmRleD49bWluTGVuZ3Rocy0xKXtcclxuICAgICAgcmV0dXJuIGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oKTtcclxuICAgIH1lbHNle1xyXG4gICAgICByZXR1cm4gdGhpcy5jb252ZXJ0VG9BbmNob3JBYnNvbHV0ZVBvc2l0aW9ucyhlZGdlLHR5cGUsYW5jaG9ySW5kZXgrMSlcclxuICAgIH1cclxuICB9LFxyXG4gIGNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb246IGZ1bmN0aW9uIChlZGdlLCBwb2ludCwgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMpIHtcclxuICAgIGlmIChzcmNUZ3RQb2ludHNBbmRUYW5nZW50cyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzID0gdGhpcy5nZXRTcmNUZ3RQb2ludHNBbmRUYW5nZW50cyhlZGdlKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIGludGVyc2VjdGlvblBvaW50ID0gdGhpcy5nZXRJbnRlcnNlY3Rpb24oZWRnZSwgcG9pbnQsIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzKTtcclxuICAgIHZhciBpbnRlcnNlY3RYID0gaW50ZXJzZWN0aW9uUG9pbnQueDtcclxuICAgIHZhciBpbnRlcnNlY3RZID0gaW50ZXJzZWN0aW9uUG9pbnQueTtcclxuICAgIFxyXG4gICAgdmFyIHNyY1BvaW50ID0gc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMuc3JjUG9pbnQ7XHJcbiAgICB2YXIgdGd0UG9pbnQgPSBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cy50Z3RQb2ludDtcclxuICAgIFxyXG4gICAgdmFyIHdlaWdodDtcclxuICAgIFxyXG4gICAgaWYoIGludGVyc2VjdFggIT0gc3JjUG9pbnQueCApIHtcclxuICAgICAgd2VpZ2h0ID0gKGludGVyc2VjdFggLSBzcmNQb2ludC54KSAvICh0Z3RQb2ludC54IC0gc3JjUG9pbnQueCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKCBpbnRlcnNlY3RZICE9IHNyY1BvaW50LnkgKSB7XHJcbiAgICAgIHdlaWdodCA9IChpbnRlcnNlY3RZIC0gc3JjUG9pbnQueSkgLyAodGd0UG9pbnQueSAtIHNyY1BvaW50LnkpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHdlaWdodCA9IDA7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBkaXN0YW5jZSA9IE1hdGguc3FydChNYXRoLnBvdygoaW50ZXJzZWN0WSAtIHBvaW50LnkpLCAyKVxyXG4gICAgICAgICsgTWF0aC5wb3coKGludGVyc2VjdFggLSBwb2ludC54KSwgMikpO1xyXG4gICAgXHJcbiAgICAvL0dldCB0aGUgZGlyZWN0aW9uIG9mIHRoZSBsaW5lIGZvcm0gc291cmNlIHBvaW50IHRvIHRhcmdldCBwb2ludFxyXG4gICAgdmFyIGRpcmVjdGlvbjEgPSB0aGlzLmdldExpbmVEaXJlY3Rpb24oc3JjUG9pbnQsIHRndFBvaW50KTtcclxuICAgIC8vR2V0IHRoZSBkaXJlY3Rpb24gb2YgdGhlIGxpbmUgZnJvbSBpbnRlc2VjdGlvbiBwb2ludCB0byB0aGUgcG9pbnRcclxuICAgIHZhciBkaXJlY3Rpb24yID0gdGhpcy5nZXRMaW5lRGlyZWN0aW9uKGludGVyc2VjdGlvblBvaW50LCBwb2ludCk7XHJcbiAgICBcclxuICAgIC8vSWYgdGhlIGRpZmZlcmVuY2UgaXMgbm90IC0yIGFuZCBub3QgNiB0aGVuIHRoZSBkaXJlY3Rpb24gb2YgdGhlIGRpc3RhbmNlIGlzIG5lZ2F0aXZlXHJcbiAgICBpZihkaXJlY3Rpb24xIC0gZGlyZWN0aW9uMiAhPSAtMiAmJiBkaXJlY3Rpb24xIC0gZGlyZWN0aW9uMiAhPSA2KXtcclxuICAgICAgaWYoZGlzdGFuY2UgIT0gMClcclxuICAgICAgICBkaXN0YW5jZSA9IC0xICogZGlzdGFuY2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHdlaWdodDogd2VpZ2h0LFxyXG4gICAgICBkaXN0YW5jZTogZGlzdGFuY2VcclxuICAgIH07XHJcbiAgfSxcclxuICBjb252ZXJ0VG9SZWxhdGl2ZVBvc2l0aW9uczogZnVuY3Rpb24gKGVkZ2UsIGFuY2hvclBvaW50cykge1xyXG4gICAgdmFyIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzID0gdGhpcy5nZXRTcmNUZ3RQb2ludHNBbmRUYW5nZW50cyhlZGdlKTtcclxuXHJcbiAgICB2YXIgd2VpZ2h0cyA9IFtdO1xyXG4gICAgdmFyIGRpc3RhbmNlcyA9IFtdO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBhbmNob3JQb2ludHMgJiYgaSA8IGFuY2hvclBvaW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YXIgYW5jaG9yID0gYW5jaG9yUG9pbnRzW2ldO1xyXG4gICAgICB2YXIgcmVsYXRpdmVBbmNob3JQb3NpdGlvbiA9IHRoaXMuY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbihlZGdlLCBhbmNob3IsIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzKTtcclxuXHJcbiAgICAgIHdlaWdodHMucHVzaChyZWxhdGl2ZUFuY2hvclBvc2l0aW9uLndlaWdodCk7XHJcbiAgICAgIGRpc3RhbmNlcy5wdXNoKHJlbGF0aXZlQW5jaG9yUG9zaXRpb24uZGlzdGFuY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHdlaWdodHM6IHdlaWdodHMsXHJcbiAgICAgIGRpc3RhbmNlczogZGlzdGFuY2VzXHJcbiAgICB9O1xyXG4gIH0sXHJcbiAgZ2V0RGlzdGFuY2VzU3RyaW5nOiBmdW5jdGlvbiAoZWRnZSwgdHlwZSkge1xyXG4gICAgdmFyIHN0ciA9IFwiXCI7XHJcblxyXG4gICAgdmFyIGRpc3RhbmNlcyA9IGVkZ2UuZGF0YSh0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXSk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgZGlzdGFuY2VzICYmIGkgPCBkaXN0YW5jZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgc3RyID0gc3RyICsgXCIgXCIgKyBkaXN0YW5jZXNbaV07XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBzdHI7XHJcbiAgfSxcclxuICBnZXRXZWlnaHRzU3RyaW5nOiBmdW5jdGlvbiAoZWRnZSwgdHlwZSkge1xyXG4gICAgdmFyIHN0ciA9IFwiXCI7XHJcblxyXG4gICAgdmFyIHdlaWdodHMgPSBlZGdlLmRhdGEodGhpcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyB3ZWlnaHRzICYmIGkgPCB3ZWlnaHRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHN0ciA9IHN0ciArIFwiIFwiICsgd2VpZ2h0c1tpXTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHN0cjtcclxuICB9LFxyXG4gIGFkZEFuY2hvclBvaW50OiBmdW5jdGlvbihlZGdlLCBuZXdBbmNob3JQb2ludCwgdHlwZSA9IHVuZGVmaW5lZCkge1xyXG4gICAgaWYoZWRnZSA9PT0gdW5kZWZpbmVkIHx8IG5ld0FuY2hvclBvaW50ID09PSB1bmRlZmluZWQpe1xyXG4gICAgICBlZGdlID0gdGhpcy5jdXJyZW50Q3R4RWRnZTtcclxuICAgICAgbmV3QW5jaG9yUG9pbnQgPSB0aGlzLmN1cnJlbnRDdHhQb3M7XHJcbiAgICB9XHJcbiAgXHJcbiAgICBpZih0eXBlID09PSB1bmRlZmluZWQpXHJcbiAgICAgIHR5cGUgPSB0aGlzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgIHZhciB3ZWlnaHRTdHIgPSB0aGlzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J107XHJcbiAgICB2YXIgZGlzdGFuY2VTdHIgPSB0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXTtcclxuXHJcbiAgICB2YXIgcmVsYXRpdmVQb3NpdGlvbiA9IHRoaXMuY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbihlZGdlLCBuZXdBbmNob3JQb2ludCk7XHJcbiAgICB2YXIgb3JpZ2luYWxBbmNob3JXZWlnaHQgPSByZWxhdGl2ZVBvc2l0aW9uLndlaWdodDtcclxuICAgIFxyXG4gICAgdmFyIHN0YXJ0WCA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oJ3gnKTtcclxuICAgIHZhciBzdGFydFkgPSBlZGdlLnNvdXJjZSgpLnBvc2l0aW9uKCd5Jyk7XHJcbiAgICB2YXIgZW5kWCA9IGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oJ3gnKTtcclxuICAgIHZhciBlbmRZID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigneScpO1xyXG4gICAgdmFyIHN0YXJ0V2VpZ2h0ID0gdGhpcy5jb252ZXJ0VG9SZWxhdGl2ZVBvc2l0aW9uKGVkZ2UsIHt4OiBzdGFydFgsIHk6IHN0YXJ0WX0pLndlaWdodDtcclxuICAgIHZhciBlbmRXZWlnaHQgPSB0aGlzLmNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb24oZWRnZSwge3g6IGVuZFgsIHk6IGVuZFl9KS53ZWlnaHQ7XHJcbiAgICB2YXIgd2VpZ2h0c1dpdGhUZ3RTcmMgPSBbc3RhcnRXZWlnaHRdLmNvbmNhdChlZGdlLmRhdGEod2VpZ2h0U3RyKT9lZGdlLmRhdGEod2VpZ2h0U3RyKTpbXSkuY29uY2F0KFtlbmRXZWlnaHRdKTtcclxuICAgIFxyXG4gICAgdmFyIGFuY2hvcnNMaXN0ID0gdGhpcy5nZXRBbmNob3JzQXNBcnJheShlZGdlKTtcclxuICAgIFxyXG4gICAgdmFyIG1pbkRpc3QgPSBJbmZpbml0eTtcclxuICAgIHZhciBpbnRlcnNlY3Rpb247XHJcbiAgICB2YXIgcHRzV2l0aFRndFNyYyA9IFtzdGFydFgsIHN0YXJ0WV1cclxuICAgICAgICAgICAgLmNvbmNhdChhbmNob3JzTGlzdD9hbmNob3JzTGlzdDpbXSlcclxuICAgICAgICAgICAgLmNvbmNhdChbZW5kWCwgZW5kWV0pO1xyXG4gICAgdmFyIG5ld0FuY2hvckluZGV4ID0gLTE7XHJcbiAgICBcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB3ZWlnaHRzV2l0aFRndFNyYy5sZW5ndGggLSAxOyBpKyspe1xyXG4gICAgICB2YXIgdzEgPSB3ZWlnaHRzV2l0aFRndFNyY1tpXTtcclxuICAgICAgdmFyIHcyID0gd2VpZ2h0c1dpdGhUZ3RTcmNbaSArIDFdO1xyXG4gICAgICBcclxuICAgICAgLy9jaGVjayBpZiB0aGUgd2VpZ2h0IGlzIGJldHdlZW4gdzEgYW5kIHcyXHJcbiAgICAgIGNvbnN0IGIxID0gdGhpcy5jb21wYXJlV2l0aFByZWNpc2lvbihvcmlnaW5hbEFuY2hvcldlaWdodCwgdzEsIHRydWUpO1xyXG4gICAgICBjb25zdCBiMiA9IHRoaXMuY29tcGFyZVdpdGhQcmVjaXNpb24ob3JpZ2luYWxBbmNob3JXZWlnaHQsIHcyKTtcclxuICAgICAgY29uc3QgYjMgPSB0aGlzLmNvbXBhcmVXaXRoUHJlY2lzaW9uKG9yaWdpbmFsQW5jaG9yV2VpZ2h0LCB3MiwgdHJ1ZSk7XHJcbiAgICAgIGNvbnN0IGI0ID0gdGhpcy5jb21wYXJlV2l0aFByZWNpc2lvbihvcmlnaW5hbEFuY2hvcldlaWdodCwgdzEpO1xyXG4gICAgICBpZiggKGIxICYmIGIyKSB8fCAoYjMgJiYgYjQpKXtcclxuICAgICAgICB2YXIgc3RhcnRYID0gcHRzV2l0aFRndFNyY1syICogaV07XHJcbiAgICAgICAgdmFyIHN0YXJ0WSA9IHB0c1dpdGhUZ3RTcmNbMiAqIGkgKyAxXTtcclxuICAgICAgICB2YXIgZW5kWCA9IHB0c1dpdGhUZ3RTcmNbMiAqIGkgKyAyXTtcclxuICAgICAgICB2YXIgZW5kWSA9IHB0c1dpdGhUZ3RTcmNbMiAqIGkgKyAzXTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3RhcnQgPSB7XHJcbiAgICAgICAgICB4OiBzdGFydFgsXHJcbiAgICAgICAgICB5OiBzdGFydFlcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBlbmQgPSB7XHJcbiAgICAgICAgICB4OiBlbmRYLFxyXG4gICAgICAgICAgeTogZW5kWVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG0xID0gKCBzdGFydFkgLSBlbmRZICkgLyAoIHN0YXJ0WCAtIGVuZFggKTtcclxuICAgICAgICB2YXIgbTIgPSAtMSAvIG0xO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cyA9IHtcclxuICAgICAgICAgIHNyY1BvaW50OiBzdGFydCxcclxuICAgICAgICAgIHRndFBvaW50OiBlbmQsXHJcbiAgICAgICAgICBtMTogbTEsXHJcbiAgICAgICAgICBtMjogbTJcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBjdXJyZW50SW50ZXJzZWN0aW9uID0gdGhpcy5nZXRJbnRlcnNlY3Rpb24oZWRnZSwgbmV3QW5jaG9yUG9pbnQsIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzKTtcclxuICAgICAgICB2YXIgZGlzdCA9IE1hdGguc3FydCggTWF0aC5wb3coIChuZXdBbmNob3JQb2ludC54IC0gY3VycmVudEludGVyc2VjdGlvbi54KSwgMiApIFxyXG4gICAgICAgICAgICAgICAgKyBNYXRoLnBvdyggKG5ld0FuY2hvclBvaW50LnkgLSBjdXJyZW50SW50ZXJzZWN0aW9uLnkpLCAyICkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vVXBkYXRlIHRoZSBtaW5pbXVtIGRpc3RhbmNlXHJcbiAgICAgICAgaWYoZGlzdCA8IG1pbkRpc3Qpe1xyXG4gICAgICAgICAgbWluRGlzdCA9IGRpc3Q7XHJcbiAgICAgICAgICBpbnRlcnNlY3Rpb24gPSBjdXJyZW50SW50ZXJzZWN0aW9uO1xyXG4gICAgICAgICAgbmV3QW5jaG9ySW5kZXggPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZihpbnRlcnNlY3Rpb24gIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgIG5ld0FuY2hvclBvaW50ID0gaW50ZXJzZWN0aW9uO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWxhdGl2ZVBvc2l0aW9uID0gdGhpcy5jb252ZXJ0VG9SZWxhdGl2ZVBvc2l0aW9uKGVkZ2UsIG5ld0FuY2hvclBvaW50KTtcclxuICAgIFxyXG4gICAgaWYoaW50ZXJzZWN0aW9uID09PSB1bmRlZmluZWQpe1xyXG4gICAgICByZWxhdGl2ZVBvc2l0aW9uLmRpc3RhbmNlID0gMDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgd2VpZ2h0cyA9IGVkZ2UuZGF0YSh3ZWlnaHRTdHIpO1xyXG4gICAgdmFyIGRpc3RhbmNlcyA9IGVkZ2UuZGF0YShkaXN0YW5jZVN0cik7XHJcbiAgICBcclxuICAgIHdlaWdodHMgPSB3ZWlnaHRzP3dlaWdodHM6W107XHJcbiAgICBkaXN0YW5jZXMgPSBkaXN0YW5jZXM/ZGlzdGFuY2VzOltdO1xyXG4gICAgXHJcbiAgICBpZih3ZWlnaHRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBuZXdBbmNob3JJbmRleCA9IDA7XHJcbiAgICB9XHJcbiAgICBcclxuLy8gICAgd2VpZ2h0cy5wdXNoKHJlbGF0aXZlQmVuZFBvc2l0aW9uLndlaWdodCk7XHJcbi8vICAgIGRpc3RhbmNlcy5wdXNoKHJlbGF0aXZlQmVuZFBvc2l0aW9uLmRpc3RhbmNlKTtcclxuICAgIGlmKG5ld0FuY2hvckluZGV4ICE9IC0xKXtcclxuICAgICAgd2VpZ2h0cy5zcGxpY2UobmV3QW5jaG9ySW5kZXgsIDAsIHJlbGF0aXZlUG9zaXRpb24ud2VpZ2h0KTtcclxuICAgICAgZGlzdGFuY2VzLnNwbGljZShuZXdBbmNob3JJbmRleCwgMCwgcmVsYXRpdmVQb3NpdGlvbi5kaXN0YW5jZSk7XHJcbiAgICB9XHJcbiAgIFxyXG4gICAgZWRnZS5kYXRhKHdlaWdodFN0ciwgd2VpZ2h0cyk7XHJcbiAgICBlZGdlLmRhdGEoZGlzdGFuY2VTdHIsIGRpc3RhbmNlcyk7XHJcbiAgICBcclxuICAgIGVkZ2UuYWRkQ2xhc3ModGhpcy5zeW50YXhbdHlwZV1bJ2NsYXNzJ10pO1xyXG4gICAgaWYgKHdlaWdodHMubGVuZ3RoID4gMSB8fCBkaXN0YW5jZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICBlZGdlLmFkZENsYXNzKHRoaXMuc3ludGF4W3R5cGVdWydtdWx0aUNsYXNzJ10pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gbmV3QW5jaG9ySW5kZXg7XHJcbiAgfSxcclxuICByZW1vdmVBbmNob3I6IGZ1bmN0aW9uKGVkZ2UsIGFuY2hvckluZGV4KXtcclxuICAgIGlmKGVkZ2UgPT09IHVuZGVmaW5lZCB8fCBhbmNob3JJbmRleCA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgZWRnZSA9IHRoaXMuY3VycmVudEN0eEVkZ2U7XHJcbiAgICAgIGFuY2hvckluZGV4ID0gdGhpcy5jdXJyZW50QW5jaG9ySW5kZXg7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciB0eXBlID0gdGhpcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuXHJcbiAgICBpZih0aGlzLmVkZ2VUeXBlSW5jb25jbHVzaXZlU2hvdWxkbnRIYXBwZW4odHlwZSwgXCJhbmNob3JQb2ludFV0aWxpdGllcy5qcywgcmVtb3ZlQW5jaG9yXCIpKXtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBkaXN0YW5jZVN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXTtcclxuICAgIHZhciB3ZWlnaHRTdHIgPSB0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXTtcclxuICAgIHZhciBwb3NpdGlvbkRhdGFTdHIgPSB0aGlzLnN5bnRheFt0eXBlXVsncG9pbnRQb3MnXTtcclxuXHJcbiAgICB2YXIgZGlzdGFuY2VzID0gZWRnZS5kYXRhKGRpc3RhbmNlU3RyKTtcclxuICAgIHZhciB3ZWlnaHRzID0gZWRnZS5kYXRhKHdlaWdodFN0cik7XHJcbiAgICB2YXIgcG9zaXRpb25zID0gZWRnZS5kYXRhKHBvc2l0aW9uRGF0YVN0cik7XHJcblxyXG4gICAgZGlzdGFuY2VzLnNwbGljZShhbmNob3JJbmRleCwgMSk7XHJcbiAgICB3ZWlnaHRzLnNwbGljZShhbmNob3JJbmRleCwgMSk7XHJcbiAgICAvLyBwb3NpdGlvbiBkYXRhIGlzIG5vdCBnaXZlbiBpbiBkZW1vIHNvIGl0IHRocm93cyBlcnJvciBoZXJlXHJcbiAgICAvLyBidXQgaXQgc2hvdWxkIGJlIGZyb20gdGhlIGJlZ2lubmluZ1xyXG4gICAgaWYgKHBvc2l0aW9ucylcclxuICAgICAgcG9zaXRpb25zLnNwbGljZShhbmNob3JJbmRleCwgMSk7XHJcblxyXG4gICAgLy8gb25seSBvbmUgYW5jaG9yIHBvaW50IGxlZnQgb24gZWRnZVxyXG4gICAgaWYgKGRpc3RhbmNlcy5sZW5ndGggPT0gMSB8fCB3ZWlnaHRzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgIGVkZ2UucmVtb3ZlQ2xhc3ModGhpcy5zeW50YXhbdHlwZV1bJ211bHRpQ2xhc3MnXSlcclxuICAgIH1cclxuICAgIC8vIG5vIG1vcmUgYW5jaG9yIHBvaW50cyBvbiBlZGdlXHJcbiAgICBlbHNlIGlmKGRpc3RhbmNlcy5sZW5ndGggPT0gMCB8fCB3ZWlnaHRzLmxlbmd0aCA9PSAwKXtcclxuICAgICAgZWRnZS5yZW1vdmVDbGFzcyh0aGlzLnN5bnRheFt0eXBlXVsnY2xhc3MnXSk7XHJcbiAgICAgIGVkZ2UuZGF0YShkaXN0YW5jZVN0ciwgW10pO1xyXG4gICAgICBlZGdlLmRhdGEod2VpZ2h0U3RyLCBbXSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgZWRnZS5kYXRhKGRpc3RhbmNlU3RyLCBkaXN0YW5jZXMpO1xyXG4gICAgICBlZGdlLmRhdGEod2VpZ2h0U3RyLCB3ZWlnaHRzKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHJlbW92ZUFsbEFuY2hvcnM6IGZ1bmN0aW9uKGVkZ2UpIHtcclxuICAgIGlmIChlZGdlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgZWRnZSA9IHRoaXMuY3VycmVudEN0eEVkZ2U7XHJcbiAgICB9XHJcbiAgICB2YXIgdHlwZSA9IHRoaXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcbiAgICBcclxuICAgIGlmKHRoaXMuZWRnZVR5cGVJbmNvbmNsdXNpdmVTaG91bGRudEhhcHBlbih0eXBlLCBcImFuY2hvclBvaW50VXRpbGl0aWVzLmpzLCByZW1vdmVBbGxBbmNob3JzXCIpKXtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSBjbGFzc2VzIGZyb20gZWRnZVxyXG4gICAgZWRnZS5yZW1vdmVDbGFzcyh0aGlzLnN5bnRheFt0eXBlXVsnY2xhc3MnXSk7XHJcbiAgICBlZGdlLnJlbW92ZUNsYXNzKHRoaXMuc3ludGF4W3R5cGVdWydtdWx0aUNsYXNzJ10pO1xyXG5cclxuICAgIC8vIFJlbW92ZSBhbGwgYW5jaG9yIHBvaW50IGRhdGEgZnJvbSBlZGdlXHJcbiAgICB2YXIgZGlzdGFuY2VTdHIgPSB0aGlzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J107XHJcbiAgICB2YXIgd2VpZ2h0U3RyID0gdGhpcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ107XHJcbiAgICB2YXIgcG9zaXRpb25EYXRhU3RyID0gdGhpcy5zeW50YXhbdHlwZV1bJ3BvaW50UG9zJ107XHJcbiAgICBlZGdlLmRhdGEoZGlzdGFuY2VTdHIsIFtdKTtcclxuICAgIGVkZ2UuZGF0YSh3ZWlnaHRTdHIsIFtdKTtcclxuICAgIC8vIHBvc2l0aW9uIGRhdGEgaXMgbm90IGdpdmVuIGluIGRlbW8gc28gaXQgdGhyb3dzIGVycm9yIGhlcmVcclxuICAgIC8vIGJ1dCBpdCBzaG91bGQgYmUgZnJvbSB0aGUgYmVnaW5uaW5nXHJcbiAgICBpZiAoZWRnZS5kYXRhKHBvc2l0aW9uRGF0YVN0cikpIHtcclxuICAgICAgZWRnZS5kYXRhKHBvc2l0aW9uRGF0YVN0ciwgW10pO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgY2FsY3VsYXRlRGlzdGFuY2U6IGZ1bmN0aW9uKHB0MSwgcHQyKSB7XHJcbiAgICB2YXIgZGlmZlggPSBwdDEueCAtIHB0Mi54O1xyXG4gICAgdmFyIGRpZmZZID0gcHQxLnkgLSBwdDIueTtcclxuICAgIFxyXG4gICAgdmFyIGRpc3QgPSBNYXRoLnNxcnQoIE1hdGgucG93KCBkaWZmWCwgMiApICsgTWF0aC5wb3coIGRpZmZZLCAyICkgKTtcclxuICAgIHJldHVybiBkaXN0O1xyXG4gIH0sXHJcbiAgLyoqIChMZXNzIHRoYW4gb3IgZXF1YWwgdG8pIGFuZCAoZ3JlYXRlciB0aGVuIGVxdWFsIHRvKSBjb21wYXJpc29ucyB3aXRoIGZsb2F0aW5nIHBvaW50IG51bWJlcnMgKi9cclxuICBjb21wYXJlV2l0aFByZWNpc2lvbjogZnVuY3Rpb24gKG4xLCBuMiwgaXNMZXNzVGhlbk9yRXF1YWwgPSBmYWxzZSwgcHJlY2lzaW9uID0gMC4wMSkge1xyXG4gICAgY29uc3QgZGlmZiA9IG4xIC0gbjI7XHJcbiAgICBpZiAoTWF0aC5hYnMoZGlmZikgPD0gcHJlY2lzaW9uKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKGlzTGVzc1RoZW5PckVxdWFsKSB7XHJcbiAgICAgIHJldHVybiBuMSA8IG4yO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIG4xID4gbjI7XHJcbiAgICB9XHJcbiAgfSxcclxuICBlZGdlVHlwZUluY29uY2x1c2l2ZVNob3VsZG50SGFwcGVuOiBmdW5jdGlvbih0eXBlLCBwbGFjZSl7XHJcbiAgICBpZih0eXBlID09PSAnaW5jb25jbHVzaXZlJykge1xyXG4gICAgICBjb25zb2xlLmxvZyhgSW4gJHtwbGFjZX06IGVkZ2UgdHlwZSBpbmNvbmNsdXNpdmUgc2hvdWxkIG5ldmVyIGhhcHBlbiBoZXJlISFgKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhbmNob3JQb2ludFV0aWxpdGllcztcclxuIiwidmFyIGRlYm91bmNlID0gcmVxdWlyZSgnLi9kZWJvdW5jZScpO1xyXG52YXIgYW5jaG9yUG9pbnRVdGlsaXRpZXMgPSByZXF1aXJlKCcuL0FuY2hvclBvaW50VXRpbGl0aWVzJyk7XHJcbnZhciByZWNvbm5lY3Rpb25VdGlsaXRpZXMgPSByZXF1aXJlKCcuL3JlY29ubmVjdGlvblV0aWxpdGllcycpO1xyXG52YXIgcmVnaXN0ZXJVbmRvUmVkb0Z1bmN0aW9ucyA9IHJlcXVpcmUoJy4vcmVnaXN0ZXJVbmRvUmVkb0Z1bmN0aW9ucycpO1xyXG52YXIgc3RhZ2VJZCA9IDA7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwYXJhbXMsIGN5KSB7XHJcbiAgdmFyIGZuID0gcGFyYW1zO1xyXG5cclxuICB2YXIgYWRkQmVuZFBvaW50Q3h0TWVudUlkID0gJ2N5LWVkZ2UtYmVuZC1lZGl0aW5nLWN4dC1hZGQtYmVuZC1wb2ludCcgKyBzdGFnZUlkO1xyXG4gIHZhciByZW1vdmVCZW5kUG9pbnRDeHRNZW51SWQgPSAnY3ktZWRnZS1iZW5kLWVkaXRpbmctY3h0LXJlbW92ZS1iZW5kLXBvaW50JyArIHN0YWdlSWQ7XHJcbiAgdmFyIHJlbW92ZUFsbEJlbmRQb2ludEN0eE1lbnVJZCA9ICdjeS1lZGdlLWJlbmQtZWRpdGluZy1jeHQtcmVtb3ZlLW11bHRpcGxlLWJlbmQtcG9pbnQnICsgc3RhZ2VJZDtcclxuICB2YXIgYWRkQ29udHJvbFBvaW50Q3h0TWVudUlkID0gJ2N5LWVkZ2UtY29udHJvbC1lZGl0aW5nLWN4dC1hZGQtY29udHJvbC1wb2ludCcgKyBzdGFnZUlkO1xyXG4gIHZhciByZW1vdmVDb250cm9sUG9pbnRDeHRNZW51SWQgPSAnY3ktZWRnZS1jb250cm9sLWVkaXRpbmctY3h0LXJlbW92ZS1jb250cm9sLXBvaW50JyArIHN0YWdlSWQ7XHJcbiAgdmFyIHJlbW92ZUFsbENvbnRyb2xQb2ludEN0eE1lbnVJZCA9ICdjeS1lZGdlLWJlbmQtZWRpdGluZy1jeHQtcmVtb3ZlLW11bHRpcGxlLWNvbnRyb2wtcG9pbnQnICsgc3RhZ2VJZDtcclxuICB2YXIgZVN0eWxlLCBlUmVtb3ZlLCBlQWRkLCBlWm9vbSwgZVNlbGVjdCwgZVVuc2VsZWN0LCBlVGFwU3RhcnQsIGVUYXBTdGFydE9uRWRnZSwgZVRhcERyYWcsIGVUYXBFbmQsIGVDeHRUYXAsIGVEcmFnO1xyXG4gIC8vIGxhc3Qgc3RhdHVzIG9mIGdlc3R1cmVzXHJcbiAgdmFyIGxhc3RQYW5uaW5nRW5hYmxlZCwgbGFzdFpvb21pbmdFbmFibGVkLCBsYXN0Qm94U2VsZWN0aW9uRW5hYmxlZDtcclxuICB2YXIgbGFzdEFjdGl2ZUJnT3BhY2l0eTtcclxuICAvLyBzdGF0dXMgb2YgZWRnZSB0byBoaWdobGlnaHQgYmVuZHMgYW5kIHNlbGVjdGVkIGVkZ2VzXHJcbiAgdmFyIGVkZ2VUb0hpZ2hsaWdodCwgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzO1xyXG5cclxuICAvLyB0aGUgS2FudmEuc2hhcGUoKSBmb3IgdGhlIGVuZHBvaW50c1xyXG4gIHZhciBlbmRwb2ludFNoYXBlMSA9IG51bGwsIGVuZHBvaW50U2hhcGUyID0gbnVsbDtcclxuICAvLyB1c2VkIHRvIHN0b3AgY2VydGFpbiBjeSBsaXN0ZW5lcnMgd2hlbiBpbnRlcnJhY3Rpbmcgd2l0aCBhbmNob3JzXHJcbiAgdmFyIGFuY2hvclRvdWNoZWQgPSBmYWxzZTtcclxuICAvLyB1c2VkIGNhbGwgZU1vdXNlRG93biBvZiBhbmNob3JNYW5hZ2VyIGlmIHRoZSBtb3VzZSBpcyBvdXQgb2YgdGhlIGNvbnRlbnQgb24gY3kub24odGFwZW5kKVxyXG4gIHZhciBtb3VzZU91dDtcclxuICBcclxuICB2YXIgZnVuY3Rpb25zID0ge1xyXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyByZWdpc3RlciB1bmRvIHJlZG8gZnVuY3Rpb25zXHJcbiAgICAgIHJlZ2lzdGVyVW5kb1JlZG9GdW5jdGlvbnMoY3ksIGFuY2hvclBvaW50VXRpbGl0aWVzLCBwYXJhbXMpO1xyXG4gICAgICBcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICB2YXIgb3B0cyA9IHBhcmFtcztcclxuXHJcbiAgICAgIC8qXHJcbiAgICAgICAgTWFrZSBzdXJlIHdlIGRvbid0IGFwcGVuZCBhbiBlbGVtZW50IHRoYXQgYWxyZWFkeSBleGlzdHMuXHJcbiAgICAgICAgVGhpcyBleHRlbnNpb24gY2FudmFzIHVzZXMgdGhlIHNhbWUgaHRtbCBlbGVtZW50IGFzIGVkZ2UtZWRpdGluZy5cclxuICAgICAgICBJdCBtYWtlcyBzZW5zZSBzaW5jZSBpdCBhbHNvIHVzZXMgdGhlIHNhbWUgS29udmEgc3RhZ2UuXHJcbiAgICAgICAgV2l0aG91dCB0aGUgYmVsb3cgbG9naWMsIGFuIGVtcHR5IGNhbnZhc0VsZW1lbnQgd291bGQgYmUgY3JlYXRlZFxyXG4gICAgICAgIGZvciBvbmUgb2YgdGhlc2UgZXh0ZW5zaW9ucyBmb3Igbm8gcmVhc29uLlxyXG4gICAgICAqL1xyXG4gICAgICB2YXIgJGNvbnRhaW5lciA9ICQodGhpcyk7XHJcbiAgICAgIHZhciBjYW52YXNFbGVtZW50SWQgPSAnY3ktbm9kZS1lZGdlLWVkaXRpbmctc3RhZ2UnICsgc3RhZ2VJZDtcclxuICAgICAgc3RhZ2VJZCsrO1xyXG4gICAgICB2YXIgJGNhbnZhc0VsZW1lbnQgPSAkKCc8ZGl2IGlkPVwiJyArIGNhbnZhc0VsZW1lbnRJZCArICdcIj48L2Rpdj4nKTtcclxuXHJcbiAgICAgIGlmICgkY29udGFpbmVyLmZpbmQoJyMnICsgY2FudmFzRWxlbWVudElkKS5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgJGNvbnRhaW5lci5hcHBlbmQoJGNhbnZhc0VsZW1lbnQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKiBcclxuICAgICAgICBNYWludGFpbiBhIHNpbmdsZSBLb252YS5zdGFnZSBvYmplY3QgdGhyb3VnaG91dCB0aGUgYXBwbGljYXRpb24gdGhhdCB1c2VzIHRoaXMgZXh0ZW5zaW9uXHJcbiAgICAgICAgc3VjaCBhcyBOZXd0LiBUaGlzIGlzIGltcG9ydGFudCBzaW5jZSBoYXZpbmcgZGlmZmVyZW50IHN0YWdlcyBjYXVzZXMgd2VpcmQgYmVoYXZpb3JcclxuICAgICAgICBvbiBvdGhlciBleHRlbnNpb25zIHRoYXQgYWxzbyB1c2UgS29udmEsIGxpa2Ugbm90IGxpc3RlbmluZyB0byBtb3VzZSBjbGlja3MgYW5kIHN1Y2guXHJcbiAgICAgICAgSWYgeW91IGFyZSBzb21lb25lIHRoYXQgaXMgY3JlYXRpbmcgYW4gZXh0ZW5zaW9uIHRoYXQgdXNlcyBLb252YSBpbiB0aGUgZnV0dXJlLCB5b3UgbmVlZCB0b1xyXG4gICAgICAgIGJlIGNhcmVmdWwgYWJvdXQgaG93IGV2ZW50cyByZWdpc3Rlci4gSWYgeW91IHVzZSBhIGRpZmZlcmVudCBzdGFnZSBhbG1vc3QgY2VydGFpbmx5IG9uZVxyXG4gICAgICAgIG9yIGJvdGggb2YgdGhlIGV4dGVuc2lvbnMgdGhhdCB1c2UgdGhlIHN0YWdlIGNyZWF0ZWQgYmVsb3cgd2lsbCBicmVhay5cclxuICAgICAgKi8gXHJcbiAgICAgIHZhciBzdGFnZTtcclxuICAgICAgaWYgKEtvbnZhLnN0YWdlcy5sZW5ndGggPCBzdGFnZUlkKSB7XHJcbiAgICAgICAgc3RhZ2UgPSBuZXcgS29udmEuU3RhZ2Uoe1xyXG4gICAgICAgICAgaWQ6ICdub2RlLWVkZ2UtZWRpdGluZy1zdGFnZScsXHJcbiAgICAgICAgICBjb250YWluZXI6IGNhbnZhc0VsZW1lbnRJZCwgICAvLyBpZCBvZiBjb250YWluZXIgPGRpdj5cclxuICAgICAgICAgIHdpZHRoOiAkY29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICBoZWlnaHQ6ICRjb250YWluZXIuaGVpZ2h0KClcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBzdGFnZSA9IEtvbnZhLnN0YWdlc1tzdGFnZUlkIC0gMV07XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIHZhciBjYW52YXM7XHJcbiAgICAgIGlmIChzdGFnZS5nZXRDaGlsZHJlbigpLmxlbmd0aCA8IDEpIHtcclxuICAgICAgICBjYW52YXMgPSBuZXcgS29udmEuTGF5ZXIoKTtcclxuICAgICAgICBzdGFnZS5hZGQoY2FudmFzKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjYW52YXMgPSBzdGFnZS5nZXRDaGlsZHJlbigpWzBdO1xyXG4gICAgICB9ICBcclxuICAgICAgXHJcbiAgICAgIHZhciBhbmNob3JNYW5hZ2VyID0ge1xyXG4gICAgICAgIGVkZ2U6IHVuZGVmaW5lZCxcclxuICAgICAgICBlZGdlVHlwZTogJ2luY29uY2x1c2l2ZScsXHJcbiAgICAgICAgYW5jaG9yczogW10sXHJcbiAgICAgICAgLy8gcmVtZW1iZXJzIHRoZSB0b3VjaGVkIGFuY2hvciB0byBhdm9pZCBjbGVhcmluZyBpdCB3aGVuIGRyYWdnaW5nIGhhcHBlbnNcclxuICAgICAgICB0b3VjaGVkQW5jaG9yOiB1bmRlZmluZWQsXHJcbiAgICAgICAgLy8gcmVtZW1iZXJzIHRoZSBpbmRleCBvZiB0aGUgbW92aW5nIGFuY2hvclxyXG4gICAgICAgIHRvdWNoZWRBbmNob3JJbmRleDogdW5kZWZpbmVkLFxyXG4gICAgICAgIGJpbmRMaXN0ZW5lcnM6IGZ1bmN0aW9uKGFuY2hvcil7XHJcbiAgICAgICAgICBhbmNob3Iub24oXCJtb3VzZWRvd24gdG91Y2hzdGFydFwiLCB0aGlzLmVNb3VzZURvd24pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdW5iaW5kTGlzdGVuZXJzOiBmdW5jdGlvbihhbmNob3Ipe1xyXG4gICAgICAgICAgYW5jaG9yLm9mZihcIm1vdXNlZG93biB0b3VjaHN0YXJ0XCIsIHRoaXMuZU1vdXNlRG93bik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBnZXRzIHRyaWdnZXIgb24gY2xpY2tpbmcgb24gY29udGV4dCBtZW51cywgd2hpbGUgY3kgbGlzdGVuZXJzIGRvbid0IGdldCB0cmlnZ2VyZWRcclxuICAgICAgICAvLyBpdCBjYW4gY2F1c2Ugd2VpcmQgYmVoYXZpb3VyIGlmIG5vdCBhd2FyZSBvZiB0aGlzXHJcbiAgICAgICAgZU1vdXNlRG93bjogZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgLy8gYW5jaG9yTWFuYWdlci5lZGdlLnVuc2VsZWN0KCkgd29uJ3Qgd29yayBzb21ldGltZXMgaWYgdGhpcyB3YXNuJ3QgaGVyZVxyXG4gICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAvLyBlTW91c2VEb3duKHNldCkgLT4gdGFwZHJhZyh1c2VkKSAtPiBlTW91c2VVcChyZXNldClcclxuICAgICAgICAgIGFuY2hvclRvdWNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9yID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgICAgICAgbW91c2VPdXQgPSBmYWxzZTtcclxuICAgICAgICAgIGFuY2hvck1hbmFnZXIuZWRnZS51bnNlbGVjdCgpO1xyXG5cclxuICAgICAgICAgIC8vIHJlbWVtYmVyIHN0YXRlIGJlZm9yZSBjaGFuZ2luZ1xyXG4gICAgICAgICAgdmFyIHdlaWdodFN0ciA9IGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFthbmNob3JNYW5hZ2VyLmVkZ2VUeXBlXVsnd2VpZ2h0J107XHJcbiAgICAgICAgICB2YXIgZGlzdGFuY2VTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbYW5jaG9yTWFuYWdlci5lZGdlVHlwZV1bJ2Rpc3RhbmNlJ107XHJcblxyXG4gICAgICAgICAgdmFyIGVkZ2UgPSBhbmNob3JNYW5hZ2VyLmVkZ2U7XHJcbiAgICAgICAgICBtb3ZlQW5jaG9yUGFyYW0gPSB7XHJcbiAgICAgICAgICAgIGVkZ2U6IGVkZ2UsXHJcbiAgICAgICAgICAgIHR5cGU6IGFuY2hvck1hbmFnZXIuZWRnZVR5cGUsXHJcbiAgICAgICAgICAgIHdlaWdodHM6IGVkZ2UuZGF0YSh3ZWlnaHRTdHIpID8gW10uY29uY2F0KGVkZ2UuZGF0YSh3ZWlnaHRTdHIpKSA6IFtdLFxyXG4gICAgICAgICAgICBkaXN0YW5jZXM6IGVkZ2UuZGF0YShkaXN0YW5jZVN0cikgPyBbXS5jb25jYXQoZWRnZS5kYXRhKGRpc3RhbmNlU3RyKSkgOiBbXVxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICB0dXJuT2ZmQWN0aXZlQmdDb2xvcigpO1xyXG4gICAgICAgICAgZGlzYWJsZUdlc3R1cmVzKCk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGN5LmF1dG91bmdyYWJpZnkodHJ1ZSk7XHJcblxyXG4gICAgICAgICAgY2FudmFzLmdldFN0YWdlKCkub24oXCJjb250ZW50VG91Y2hlbmQgY29udGVudE1vdXNldXBcIiwgYW5jaG9yTWFuYWdlci5lTW91c2VVcCk7XHJcbiAgICAgICAgICBjYW52YXMuZ2V0U3RhZ2UoKS5vbihcImNvbnRlbnRNb3VzZW91dFwiLCBhbmNob3JNYW5hZ2VyLmVNb3VzZU91dCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBnZXRzIGNhbGxlZCBiZWZvcmUgY3kub24oJ3RhcGVuZCcpXHJcbiAgICAgICAgZU1vdXNlVXA6IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIC8vIHdvbid0IGJlIGNhbGxlZCBpZiB0aGUgbW91c2UgaXMgcmVsZWFzZWQgb3V0IG9mIHNjcmVlblxyXG4gICAgICAgICAgYW5jaG9yVG91Y2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9yID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgbW91c2VPdXQgPSBmYWxzZTtcclxuICAgICAgICAgIGFuY2hvck1hbmFnZXIuZWRnZS5zZWxlY3QoKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgcmVzZXRBY3RpdmVCZ0NvbG9yKCk7XHJcbiAgICAgICAgICByZXNldEdlc3R1cmVzKCk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8qIFxyXG4gICAgICAgICAgICogSU1QT1JUQU5UXHJcbiAgICAgICAgICAgKiBBbnkgcHJvZ3JhbW1hdGljIGNhbGxzIHRvIC5zZWxlY3QoKSwgLnVuc2VsZWN0KCkgYWZ0ZXIgdGhpcyBzdGF0ZW1lbnQgYXJlIGlnbm9yZWRcclxuICAgICAgICAgICAqIHVudGlsIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSkgaXMgY2FsbGVkIGluIG9uZSBvZiB0aGUgcHJldmlvdXM6XHJcbiAgICAgICAgICAgKiBcclxuICAgICAgICAgICAqIGN5Lm9uKCd0YXBzdGFydCcpXHJcbiAgICAgICAgICAgKiBhbmNob3Iub24oJ21vdXNlZG93biB0b3VjaHN0YXJ0JylcclxuICAgICAgICAgICAqIGRvY3VtZW50Lm9uKCdrZXlkb3duJylcclxuICAgICAgICAgICAqIGN5Lm9uKCd0YXBkcmFwJylcclxuICAgICAgICAgICAqIFxyXG4gICAgICAgICAgICogRG9lc24ndCBhZmZlY3QgVVgsIGJ1dCBtYXkgY2F1c2UgY29uZnVzaW5nIGJlaGF2aW91ciBpZiBub3QgYXdhcmUgb2YgdGhpcyB3aGVuIGNvZGluZ1xyXG4gICAgICAgICAgICogXHJcbiAgICAgICAgICAgKiBXaHkgaXMgdGhpcyBoZXJlP1xyXG4gICAgICAgICAgICogVGhpcyBpcyBpbXBvcnRhbnQgdG8ga2VlcCBlZGdlcyBmcm9tIGJlaW5nIGF1dG8gZGVzZWxlY3RlZCBmcm9tIHdvcmtpbmdcclxuICAgICAgICAgICAqIHdpdGggYW5jaG9ycyBvdXQgb2YgdGhlIGVkZ2UgYm9keSAoZm9yIHVuYnVuZGxlZCBiZXppZXIsIHRlY2huaWNhbGx5IG5vdCBuZWNlc3NlcnkgZm9yIHNlZ2VtZW50cykuXHJcbiAgICAgICAgICAgKiBcclxuICAgICAgICAgICAqIFRoZXNlIGlzIGFudGhlciBjeS5hdXRvc2VsZWN0aWZ5KHRydWUpIGluIGN5Lm9uKCd0YXBlbmQnKSBcclxuICAgICAgICAgICAqIFxyXG4gICAgICAgICAgKi8gXHJcbiAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkodHJ1ZSk7XHJcbiAgICAgICAgICBjeS5hdXRvdW5ncmFiaWZ5KGZhbHNlKTtcclxuXHJcbiAgICAgICAgICBjYW52YXMuZ2V0U3RhZ2UoKS5vZmYoXCJjb250ZW50VG91Y2hlbmQgY29udGVudE1vdXNldXBcIiwgYW5jaG9yTWFuYWdlci5lTW91c2VVcCk7XHJcbiAgICAgICAgICBjYW52YXMuZ2V0U3RhZ2UoKS5vZmYoXCJjb250ZW50TW91c2VvdXRcIiwgYW5jaG9yTWFuYWdlci5lTW91c2VPdXQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gaGFuZGxlIG1vdXNlIGdvaW5nIG91dCBvZiBjYW52YXMgXHJcbiAgICAgICAgZU1vdXNlT3V0OiBmdW5jdGlvbiAoZXZlbnQpe1xyXG4gICAgICAgICAgbW91c2VPdXQgPSB0cnVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2xlYXJBbmNob3JzRXhjZXB0OiBmdW5jdGlvbihkb250Q2xlYW4gPSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgdmFyIGV4Y2VwdGlvbkFwcGxpZXMgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICB0aGlzLmFuY2hvcnMuZm9yRWFjaCgoYW5jaG9yLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBpZihkb250Q2xlYW4gJiYgYW5jaG9yID09PSBkb250Q2xlYW4pe1xyXG4gICAgICAgICAgICAgIGV4Y2VwdGlvbkFwcGxpZXMgPSB0cnVlOyAvLyB0aGUgZG9udENsZWFuIGFuY2hvciBpcyBub3QgY2xlYXJlZFxyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy51bmJpbmRMaXN0ZW5lcnMoYW5jaG9yKTtcclxuICAgICAgICAgICAgYW5jaG9yLmRlc3Ryb3koKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIGlmKGV4Y2VwdGlvbkFwcGxpZXMpe1xyXG4gICAgICAgICAgICB0aGlzLmFuY2hvcnMgPSBbZG9udENsZWFuXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmFuY2hvcnMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5lZGdlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB0aGlzLmVkZ2VUeXBlID0gJ2luY29uY2x1c2l2ZSc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyByZW5kZXIgdGhlIGJlbmQgYW5kIGNvbnRyb2wgc2hhcGVzIG9mIHRoZSBnaXZlbiBlZGdlXHJcbiAgICAgICAgcmVuZGVyQW5jaG9yU2hhcGVzOiBmdW5jdGlvbihlZGdlKSB7XHJcbiAgICAgICAgICB0aGlzLmVkZ2UgPSBlZGdlO1xyXG4gICAgICAgICAgdGhpcy5lZGdlVHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgICAgICAgIGlmKCFlZGdlLmhhc0NsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpICYmXHJcbiAgICAgICAgICAgICAgIWVkZ2UuaGFzQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB2YXIgYW5jaG9yTGlzdCA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpOy8vZWRnZS5fcHJpdmF0ZS5yZGF0YS5zZWdwdHM7XHJcbiAgICAgICAgICB2YXIgbGVuZ3RoID0gZ2V0QW5jaG9yU2hhcGVzTGVuZ3RoKGVkZ2UpICogMC42NTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgdmFyIHNyY1BvcyA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oKTtcclxuICAgICAgICAgIHZhciB0Z3RQb3MgPSBlZGdlLnRhcmdldCgpLnBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgICAgZm9yKHZhciBpID0gMDsgYW5jaG9yTGlzdCAmJiBpIDwgYW5jaG9yTGlzdC5sZW5ndGg7IGkgPSBpICsgMil7XHJcbiAgICAgICAgICAgIHZhciBhbmNob3JYID0gYW5jaG9yTGlzdFtpXTtcclxuICAgICAgICAgICAgdmFyIGFuY2hvclkgPSBhbmNob3JMaXN0W2kgKyAxXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQW5jaG9yU2hhcGUoYW5jaG9yWCwgYW5jaG9yWSwgbGVuZ3RoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjYW52YXMuZHJhdygpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gcmVuZGVyIGEgYW5jaG9yIHNoYXBlIHdpdGggdGhlIGdpdmVuIHBhcmFtZXRlcnNcclxuICAgICAgICByZW5kZXJBbmNob3JTaGFwZTogZnVuY3Rpb24oYW5jaG9yWCwgYW5jaG9yWSwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAvLyBnZXQgdGhlIHRvcCBsZWZ0IGNvb3JkaW5hdGVzXHJcbiAgICAgICAgICB2YXIgdG9wTGVmdFggPSBhbmNob3JYIC0gbGVuZ3RoIC8gMjtcclxuICAgICAgICAgIHZhciB0b3BMZWZ0WSA9IGFuY2hvclkgLSBsZW5ndGggLyAyO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBjb252ZXJ0IHRvIHJlbmRlcmVkIHBhcmFtZXRlcnNcclxuICAgICAgICAgIHZhciByZW5kZXJlZFRvcExlZnRQb3MgPSBjb252ZXJ0VG9SZW5kZXJlZFBvc2l0aW9uKHt4OiB0b3BMZWZ0WCwgeTogdG9wTGVmdFl9KTtcclxuICAgICAgICAgIGxlbmd0aCAqPSBjeS56b29tKCk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHZhciBuZXdBbmNob3IgPSBuZXcgS29udmEuUmVjdCh7XHJcbiAgICAgICAgICAgIHg6IHJlbmRlcmVkVG9wTGVmdFBvcy54LFxyXG4gICAgICAgICAgICB5OiByZW5kZXJlZFRvcExlZnRQb3MueSxcclxuICAgICAgICAgICAgd2lkdGg6IGxlbmd0aCxcclxuICAgICAgICAgICAgaGVpZ2h0OiBsZW5ndGgsXHJcbiAgICAgICAgICAgIGZpbGw6ICdibGFjaycsXHJcbiAgICAgICAgICAgIHN0cm9rZVdpZHRoOiAwLFxyXG4gICAgICAgICAgICBkcmFnZ2FibGU6IHRydWVcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHRoaXMuYW5jaG9ycy5wdXNoKG5ld0FuY2hvcik7XHJcbiAgICAgICAgICB0aGlzLmJpbmRMaXN0ZW5lcnMobmV3QW5jaG9yKTtcclxuICAgICAgICAgIGNhbnZhcy5hZGQobmV3QW5jaG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB2YXIgY3h0QWRkQmVuZEZjbiA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICBjeHRBZGRBbmNob3JGY24oZXZlbnQsICdiZW5kJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBjeHRBZGRDb250cm9sRmNuID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBjeHRBZGRBbmNob3JGY24oZXZlbnQsICdjb250cm9sJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBjeHRBZGRBbmNob3JGY24gPSBmdW5jdGlvbiAoZXZlbnQsIGFuY2hvclR5cGUpIHtcclxuICAgICAgICB2YXIgZWRnZSA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICBpZighYW5jaG9yUG9pbnRVdGlsaXRpZXMuaXNJZ25vcmVkRWRnZShlZGdlKSkge1xyXG5cclxuICAgICAgICAgIHZhciB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcbiAgICAgICAgICB2YXIgd2VpZ2h0cywgZGlzdGFuY2VzLCB3ZWlnaHRTdHIsIGRpc3RhbmNlU3RyO1xyXG5cclxuICAgICAgICAgIGlmKHR5cGUgPT09ICdpbmNvbmNsdXNpdmUnKXtcclxuICAgICAgICAgICAgd2VpZ2h0cyA9IFtdO1xyXG4gICAgICAgICAgICBkaXN0YW5jZXMgPSBbXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHdlaWdodFN0ciA9IGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J107XHJcbiAgICAgICAgICAgIGRpc3RhbmNlU3RyID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddO1xyXG5cclxuICAgICAgICAgICAgd2VpZ2h0cyA9IGVkZ2UuZGF0YSh3ZWlnaHRTdHIpID8gW10uY29uY2F0KGVkZ2UuZGF0YSh3ZWlnaHRTdHIpKSA6IGVkZ2UuZGF0YSh3ZWlnaHRTdHIpO1xyXG4gICAgICAgICAgICBkaXN0YW5jZXMgPSBlZGdlLmRhdGEoZGlzdGFuY2VTdHIpID8gW10uY29uY2F0KGVkZ2UuZGF0YShkaXN0YW5jZVN0cikpIDogZWRnZS5kYXRhKGRpc3RhbmNlU3RyKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgcGFyYW0gPSB7XHJcbiAgICAgICAgICAgIGVkZ2U6IGVkZ2UsXHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgIHdlaWdodHM6IHdlaWdodHMsXHJcbiAgICAgICAgICAgIGRpc3RhbmNlczogZGlzdGFuY2VzXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIC8vIHRoZSB1bmRlZmluZWQgZ28gZm9yIGVkZ2UgYW5kIG5ld0FuY2hvclBvaW50IHBhcmFtZXRlcnNcclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLmFkZEFuY2hvclBvaW50KHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBhbmNob3JUeXBlKTtcclxuXHJcbiAgICAgICAgICBpZiAob3B0aW9ucygpLnVuZG9hYmxlKSB7XHJcbiAgICAgICAgICAgIGN5LnVuZG9SZWRvKCkuZG8oJ2NoYW5nZUFuY2hvclBvaW50cycsIHBhcmFtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgIGVkZ2Uuc2VsZWN0KCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB2YXIgY3h0UmVtb3ZlQW5jaG9yRmNuID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIGVkZ2UgPSBhbmNob3JNYW5hZ2VyLmVkZ2U7XHJcbiAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuXHJcbiAgICAgICAgaWYoYW5jaG9yUG9pbnRVdGlsaXRpZXMuZWRnZVR5cGVJbmNvbmNsdXNpdmVTaG91bGRudEhhcHBlbih0eXBlLCBcIlVpVXRpbGl0aWVzLmpzLCBjeHRSZW1vdmVBbmNob3JGY25cIikpe1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmFtID0ge1xyXG4gICAgICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICB3ZWlnaHRzOiBbXS5jb25jYXQoZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10pKSxcclxuICAgICAgICAgIGRpc3RhbmNlczogW10uY29uY2F0KGVkZ2UuZGF0YShhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ10pKVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLnJlbW92ZUFuY2hvcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKG9wdGlvbnMoKS51bmRvYWJsZSkge1xyXG4gICAgICAgICAgY3kudW5kb1JlZG8oKS5kbygnY2hhbmdlQW5jaG9yUG9pbnRzJywgcGFyYW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7cmVmcmVzaERyYXdzKCk7ZWRnZS5zZWxlY3QoKTt9LCA1MCkgO1xyXG5cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHZhciBjeHRSZW1vdmVBbGxBbmNob3JzRmNuID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIGVkZ2UgPSBhbmNob3JNYW5hZ2VyLmVkZ2U7XHJcbiAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgICAgICB2YXIgcGFyYW0gPSB7XHJcbiAgICAgICAgICBlZGdlOiBlZGdlLFxyXG4gICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgIHdlaWdodHM6IFtdLmNvbmNhdChlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSkpLFxyXG4gICAgICAgICAgZGlzdGFuY2VzOiBbXS5jb25jYXQoZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXSkpXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhbmNob3JQb2ludFV0aWxpdGllcy5yZW1vdmVBbGxBbmNob3JzKCk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zKCkudW5kb2FibGUpIHtcclxuICAgICAgICAgIGN5LnVuZG9SZWRvKCkuZG8oJ2NoYW5nZUFuY2hvclBvaW50cycsIHBhcmFtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe3JlZnJlc2hEcmF3cygpO2VkZ2Uuc2VsZWN0KCk7fSwgNTApO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBmdW5jdGlvbiB0byByZWNvbm5lY3QgZWRnZVxyXG4gICAgICB2YXIgaGFuZGxlUmVjb25uZWN0RWRnZSA9IG9wdHMuaGFuZGxlUmVjb25uZWN0RWRnZTtcclxuICAgICAgLy8gZnVuY3Rpb24gdG8gdmFsaWRhdGUgZWRnZSBzb3VyY2UgYW5kIHRhcmdldCBvbiByZWNvbm5lY3Rpb25cclxuICAgICAgdmFyIHZhbGlkYXRlRWRnZSA9IG9wdHMudmFsaWRhdGVFZGdlOyBcclxuICAgICAgLy8gZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGludmFsaWQgZWRnZSByZWNvbm5lY3Rpb25cclxuICAgICAgdmFyIGFjdE9uVW5zdWNjZXNzZnVsUmVjb25uZWN0aW9uID0gb3B0cy5hY3RPblVuc3VjY2Vzc2Z1bFJlY29ubmVjdGlvbjtcclxuICAgICAgXHJcbiAgICAgIHZhciBtZW51SXRlbXMgPSBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IGFkZEJlbmRQb2ludEN4dE1lbnVJZCxcclxuICAgICAgICAgIGNvbnRlbnQ6IG9wdHMuYWRkQmVuZE1lbnVJdGVtVGl0bGUsXHJcbiAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgb25DbGlja0Z1bmN0aW9uOiBjeHRBZGRCZW5kRmNuXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogcmVtb3ZlQmVuZFBvaW50Q3h0TWVudUlkLFxyXG4gICAgICAgICAgY29udGVudDogb3B0cy5yZW1vdmVCZW5kTWVudUl0ZW1UaXRsZSxcclxuICAgICAgICAgIHNlbGVjdG9yOiAnZWRnZScsXHJcbiAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IGN4dFJlbW92ZUFuY2hvckZjblxyXG4gICAgICAgIH0sIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiByZW1vdmVBbGxCZW5kUG9pbnRDdHhNZW51SWQsXHJcbiAgICAgICAgICBjb250ZW50OiBvcHRzLnJlbW92ZUFsbEJlbmRNZW51SXRlbVRpdGxlLFxyXG4gICAgICAgICAgc2VsZWN0b3I6IG9wdHMuZW5hYmxlTXVsdGlwbGVBbmNob3JSZW1vdmFsT3B0aW9uICYmICc6c2VsZWN0ZWQuZWRnZWJlbmRlZGl0aW5nLWhhc211bHRpcGxlYmVuZHBvaW50cycsXHJcbiAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IGN4dFJlbW92ZUFsbEFuY2hvcnNGY25cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiBhZGRDb250cm9sUG9pbnRDeHRNZW51SWQsXHJcbiAgICAgICAgICBjb250ZW50OiBvcHRzLmFkZENvbnRyb2xNZW51SXRlbVRpdGxlLFxyXG4gICAgICAgICAgc2VsZWN0b3I6ICdlZGdlJyxcclxuICAgICAgICAgIGNvcmVBc1dlbGw6IHRydWUsXHJcbiAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IGN4dEFkZENvbnRyb2xGY25cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiByZW1vdmVDb250cm9sUG9pbnRDeHRNZW51SWQsXHJcbiAgICAgICAgICBjb250ZW50OiBvcHRzLnJlbW92ZUNvbnRyb2xNZW51SXRlbVRpdGxlLFxyXG4gICAgICAgICAgc2VsZWN0b3I6ICdlZGdlJyxcclxuICAgICAgICAgIGNvcmVBc1dlbGw6IHRydWUsXHJcbiAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IGN4dFJlbW92ZUFuY2hvckZjblxyXG4gICAgICAgIH0sIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiByZW1vdmVBbGxDb250cm9sUG9pbnRDdHhNZW51SWQsXHJcbiAgICAgICAgICBjb250ZW50OiBvcHRzLnJlbW92ZUFsbENvbnRyb2xNZW51SXRlbVRpdGxlLFxyXG4gICAgICAgICAgc2VsZWN0b3I6IG9wdHMuZW5hYmxlTXVsdGlwbGVBbmNob3JSZW1vdmFsT3B0aW9uICYmICc6c2VsZWN0ZWQuZWRnZWNvbnRyb2xlZGl0aW5nLWhhc211bHRpcGxlY29udHJvbHBvaW50cycsXHJcbiAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IGN4dFJlbW92ZUFsbEFuY2hvcnNGY25cclxuICAgICAgICB9LFxyXG4gICAgICBdO1xyXG4gICAgICBcclxuICAgICAgaWYoY3kuY29udGV4dE1lbnVzKSB7XHJcbiAgICAgICAgdmFyIG1lbnVzID0gY3kuY29udGV4dE1lbnVzKCdnZXQnKTtcclxuICAgICAgICAvLyBJZiBjb250ZXh0IG1lbnVzIGlzIGFjdGl2ZSBqdXN0IGFwcGVuZCBtZW51IGl0ZW1zIGVsc2UgYWN0aXZhdGUgdGhlIGV4dGVuc2lvblxyXG4gICAgICAgIC8vIHdpdGggaW5pdGlhbCBtZW51IGl0ZW1zXHJcbiAgICAgICAgaWYgKG1lbnVzLmlzQWN0aXZlKCkpIHtcclxuICAgICAgICAgIG1lbnVzLmFwcGVuZE1lbnVJdGVtcyhtZW51SXRlbXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGN5LmNvbnRleHRNZW51cyh7XHJcbiAgICAgICAgICAgIG1lbnVJdGVtczogbWVudUl0ZW1zXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIHZhciBfc2l6ZUNhbnZhcyA9IGRlYm91bmNlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkY2FudmFzRWxlbWVudFxyXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsICRjb250YWluZXIuaGVpZ2h0KCkpXHJcbiAgICAgICAgICAuYXR0cignd2lkdGgnLCAkY29udGFpbmVyLndpZHRoKCkpXHJcbiAgICAgICAgICAuY3NzKHtcclxuICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgJ3RvcCc6IDAsXHJcbiAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgJ3otaW5kZXgnOiBvcHRpb25zKCkuekluZGV4XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgY2FudmFzQmIgPSAkY2FudmFzRWxlbWVudC5vZmZzZXQoKTtcclxuICAgICAgICAgIHZhciBjb250YWluZXJCYiA9ICRjb250YWluZXIub2Zmc2V0KCk7XHJcblxyXG4gICAgICAgICAgJGNhbnZhc0VsZW1lbnRcclxuICAgICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgICAgJ3RvcCc6IC0oY2FudmFzQmIudG9wIC0gY29udGFpbmVyQmIudG9wKSxcclxuICAgICAgICAgICAgICAnbGVmdCc6IC0oY2FudmFzQmIubGVmdCAtIGNvbnRhaW5lckJiLmxlZnQpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICA7XHJcblxyXG4gICAgICAgICAgY2FudmFzLmdldFN0YWdlKCkuc2V0V2lkdGgoJGNvbnRhaW5lci53aWR0aCgpKTtcclxuICAgICAgICAgIGNhbnZhcy5nZXRTdGFnZSgpLnNldEhlaWdodCgkY29udGFpbmVyLmhlaWdodCgpKTtcclxuXHJcbiAgICAgICAgICAvLyByZWRyYXcgb24gY2FudmFzIHJlc2l6ZVxyXG4gICAgICAgICAgaWYoY3kpe1xyXG4gICAgICAgICAgICByZWZyZXNoRHJhd3MoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCAwKTtcclxuXHJcbiAgICAgIH0sIDI1MCk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBzaXplQ2FudmFzKCkge1xyXG4gICAgICAgIF9zaXplQ2FudmFzKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNpemVDYW52YXMoKTtcclxuXHJcbiAgICAgICQod2luZG93KS5iaW5kKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgc2l6ZUNhbnZhcygpO1xyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIC8vIHdyaXRlIG9wdGlvbnMgdG8gZGF0YVxyXG4gICAgICB2YXIgZGF0YSA9ICRjb250YWluZXIuZGF0YSgnY3llZGdlZWRpdGluZycpO1xyXG4gICAgICBpZiAoZGF0YSA9PSBudWxsKSB7XHJcbiAgICAgICAgZGF0YSA9IHt9O1xyXG4gICAgICB9XHJcbiAgICAgIGRhdGEub3B0aW9ucyA9IG9wdHM7XHJcblxyXG4gICAgICB2YXIgb3B0Q2FjaGU7XHJcblxyXG4gICAgICBmdW5jdGlvbiBvcHRpb25zKCkge1xyXG4gICAgICAgIHJldHVybiBvcHRDYWNoZSB8fCAob3B0Q2FjaGUgPSAkY29udGFpbmVyLmRhdGEoJ2N5ZWRnZWVkaXRpbmcnKS5vcHRpb25zKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gd2Ugd2lsbCBuZWVkIHRvIGNvbnZlcnQgbW9kZWwgcG9zaXRvbnMgdG8gcmVuZGVyZWQgcG9zaXRpb25zXHJcbiAgICAgIGZ1bmN0aW9uIGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24obW9kZWxQb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBwYW4gPSBjeS5wYW4oKTtcclxuICAgICAgICB2YXIgem9vbSA9IGN5Lnpvb20oKTtcclxuXHJcbiAgICAgICAgdmFyIHggPSBtb2RlbFBvc2l0aW9uLnggKiB6b29tICsgcGFuLng7XHJcbiAgICAgICAgdmFyIHkgPSBtb2RlbFBvc2l0aW9uLnkgKiB6b29tICsgcGFuLnk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICB4OiB4LFxyXG4gICAgICAgICAgeTogeVxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGZ1bmN0aW9uIHJlZnJlc2hEcmF3cygpIHtcclxuXHJcbiAgICAgICAgLy8gZG9uJ3QgY2xlYXIgYW5jaG9yIHdoaWNoIGlzIGJlaW5nIG1vdmVkXHJcbiAgICAgICAgYW5jaG9yTWFuYWdlci5jbGVhckFuY2hvcnNFeGNlcHQoYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9yKTtcclxuICAgICAgICBcclxuICAgICAgICBpZihlbmRwb2ludFNoYXBlMSAhPT0gbnVsbCl7XHJcbiAgICAgICAgICBlbmRwb2ludFNoYXBlMS5kZXN0cm95KCk7XHJcbiAgICAgICAgICBlbmRwb2ludFNoYXBlMSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGVuZHBvaW50U2hhcGUyICE9PSBudWxsKXtcclxuICAgICAgICAgIGVuZHBvaW50U2hhcGUyLmRlc3Ryb3koKTtcclxuICAgICAgICAgIGVuZHBvaW50U2hhcGUyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FudmFzLmRyYXcoKTtcclxuXHJcbiAgICAgICAgaWYoIGVkZ2VUb0hpZ2hsaWdodCApIHtcclxuICAgICAgICAgIGFuY2hvck1hbmFnZXIucmVuZGVyQW5jaG9yU2hhcGVzKGVkZ2VUb0hpZ2hsaWdodCk7XHJcbiAgICAgICAgICByZW5kZXJFbmRQb2ludFNoYXBlcyhlZGdlVG9IaWdobGlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gcmVuZGVyIHRoZSBlbmQgcG9pbnRzIHNoYXBlcyBvZiB0aGUgZ2l2ZW4gZWRnZVxyXG4gICAgICBmdW5jdGlvbiByZW5kZXJFbmRQb2ludFNoYXBlcyhlZGdlKSB7XHJcbiAgICAgICAgaWYoIWVkZ2Upe1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGVkZ2VfcHRzID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSk7XHJcbiAgICAgICAgaWYodHlwZW9mIGVkZ2VfcHRzID09PSAndW5kZWZpbmVkJyl7XHJcbiAgICAgICAgICBlZGdlX3B0cyA9IFtdO1xyXG4gICAgICAgIH0gICAgICAgXHJcbiAgICAgICAgdmFyIHNvdXJjZVBvcyA9IGVkZ2Uuc291cmNlRW5kcG9pbnQoKTtcclxuICAgICAgICB2YXIgdGFyZ2V0UG9zID0gZWRnZS50YXJnZXRFbmRwb2ludCgpO1xyXG4gICAgICAgIGVkZ2VfcHRzLnVuc2hpZnQoc291cmNlUG9zLnkpO1xyXG4gICAgICAgIGVkZ2VfcHRzLnVuc2hpZnQoc291cmNlUG9zLngpO1xyXG4gICAgICAgIGVkZ2VfcHRzLnB1c2godGFyZ2V0UG9zLngpO1xyXG4gICAgICAgIGVkZ2VfcHRzLnB1c2godGFyZ2V0UG9zLnkpOyBcclxuXHJcbiAgICAgICBcclxuICAgICAgICBpZighZWRnZV9wdHMpXHJcbiAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBzcmMgPSB7XHJcbiAgICAgICAgICB4OiBlZGdlX3B0c1swXSxcclxuICAgICAgICAgIHk6IGVkZ2VfcHRzWzFdXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0ID0ge1xyXG4gICAgICAgICAgeDogZWRnZV9wdHNbZWRnZV9wdHMubGVuZ3RoLTJdLFxyXG4gICAgICAgICAgeTogZWRnZV9wdHNbZWRnZV9wdHMubGVuZ3RoLTFdXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbmV4dFRvU291cmNlID0ge1xyXG4gICAgICAgICAgeDogZWRnZV9wdHNbMl0sXHJcbiAgICAgICAgICB5OiBlZGdlX3B0c1szXVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbmV4dFRvVGFyZ2V0ID0ge1xyXG4gICAgICAgICAgeDogZWRnZV9wdHNbZWRnZV9wdHMubGVuZ3RoLTRdLFxyXG4gICAgICAgICAgeTogZWRnZV9wdHNbZWRnZV9wdHMubGVuZ3RoLTNdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBsZW5ndGggPSBnZXRBbmNob3JTaGFwZXNMZW5ndGgoZWRnZSkgKiAwLjY1O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJlbmRlckVhY2hFbmRQb2ludFNoYXBlKHNyYywgdGFyZ2V0LCBsZW5ndGgsbmV4dFRvU291cmNlLG5leHRUb1RhcmdldCk7XHJcbiAgICAgICAgXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIHJlbmRlckVhY2hFbmRQb2ludFNoYXBlKHNvdXJjZSwgdGFyZ2V0LCBsZW5ndGgsbmV4dFRvU291cmNlLG5leHRUb1RhcmdldCkge1xyXG4gICAgICAgIC8vIGdldCB0aGUgdG9wIGxlZnQgY29vcmRpbmF0ZXMgb2Ygc291cmNlIGFuZCB0YXJnZXRcclxuICAgICAgICB2YXIgc1RvcExlZnRYID0gc291cmNlLnggLSBsZW5ndGggLyAyO1xyXG4gICAgICAgIHZhciBzVG9wTGVmdFkgPSBzb3VyY2UueSAtIGxlbmd0aCAvIDI7XHJcblxyXG4gICAgICAgIHZhciB0VG9wTGVmdFggPSB0YXJnZXQueCAtIGxlbmd0aCAvIDI7XHJcbiAgICAgICAgdmFyIHRUb3BMZWZ0WSA9IHRhcmdldC55IC0gbGVuZ3RoIC8gMjtcclxuXHJcbiAgICAgICAgdmFyIG5leHRUb1NvdXJjZVggPSBuZXh0VG9Tb3VyY2UueCAtIGxlbmd0aCAvMjtcclxuICAgICAgICB2YXIgbmV4dFRvU291cmNlWSA9IG5leHRUb1NvdXJjZS55IC0gbGVuZ3RoIC8gMjtcclxuXHJcbiAgICAgICAgdmFyIG5leHRUb1RhcmdldFggPSBuZXh0VG9UYXJnZXQueCAtIGxlbmd0aCAvMjtcclxuICAgICAgICB2YXIgbmV4dFRvVGFyZ2V0WSA9IG5leHRUb1RhcmdldC55IC0gbGVuZ3RoIC8yO1xyXG5cclxuXHJcbiAgICAgICAgLy8gY29udmVydCB0byByZW5kZXJlZCBwYXJhbWV0ZXJzXHJcbiAgICAgICAgdmFyIHJlbmRlcmVkU291cmNlUG9zID0gY29udmVydFRvUmVuZGVyZWRQb3NpdGlvbih7eDogc1RvcExlZnRYLCB5OiBzVG9wTGVmdFl9KTtcclxuICAgICAgICB2YXIgcmVuZGVyZWRUYXJnZXRQb3MgPSBjb252ZXJ0VG9SZW5kZXJlZFBvc2l0aW9uKHt4OiB0VG9wTGVmdFgsIHk6IHRUb3BMZWZ0WX0pO1xyXG4gICAgICAgIGxlbmd0aCA9IGxlbmd0aCAqIGN5Lnpvb20oKSAvIDI7XHJcblxyXG4gICAgICAgIHZhciByZW5kZXJlZE5leHRUb1NvdXJjZSA9IGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24oe3g6IG5leHRUb1NvdXJjZVgsIHk6IG5leHRUb1NvdXJjZVl9KTtcclxuICAgICAgICB2YXIgcmVuZGVyZWROZXh0VG9UYXJnZXQgPSBjb252ZXJ0VG9SZW5kZXJlZFBvc2l0aW9uKHt4OiBuZXh0VG9UYXJnZXRYLCB5OiBuZXh0VG9UYXJnZXRZfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9ob3cgZmFyIHRvIGdvIGZyb20gdGhlIG5vZGUgYWxvbmcgdGhlIGVkZ2VcclxuICAgICAgICB2YXIgZGlzdGFuY2VGcm9tTm9kZSA9IGxlbmd0aDtcclxuXHJcbiAgICAgICAgdmFyIGRpc3RhbmNlU291cmNlID0gTWF0aC5zcXJ0KE1hdGgucG93KHJlbmRlcmVkTmV4dFRvU291cmNlLnggLSByZW5kZXJlZFNvdXJjZVBvcy54LDIpICsgTWF0aC5wb3cocmVuZGVyZWROZXh0VG9Tb3VyY2UueSAtIHJlbmRlcmVkU291cmNlUG9zLnksMikpOyAgICAgICAgXHJcbiAgICAgICAgdmFyIHNvdXJjZUVuZFBvaW50WCA9IHJlbmRlcmVkU291cmNlUG9zLnggKyAoKGRpc3RhbmNlRnJvbU5vZGUvIGRpc3RhbmNlU291cmNlKSogKHJlbmRlcmVkTmV4dFRvU291cmNlLnggLSByZW5kZXJlZFNvdXJjZVBvcy54KSk7XHJcbiAgICAgICAgdmFyIHNvdXJjZUVuZFBvaW50WSA9IHJlbmRlcmVkU291cmNlUG9zLnkgKyAoKGRpc3RhbmNlRnJvbU5vZGUvIGRpc3RhbmNlU291cmNlKSogKHJlbmRlcmVkTmV4dFRvU291cmNlLnkgLSByZW5kZXJlZFNvdXJjZVBvcy55KSk7XHJcblxyXG5cclxuICAgICAgICB2YXIgZGlzdGFuY2VUYXJnZXQgPSBNYXRoLnNxcnQoTWF0aC5wb3cocmVuZGVyZWROZXh0VG9UYXJnZXQueCAtIHJlbmRlcmVkVGFyZ2V0UG9zLngsMikgKyBNYXRoLnBvdyhyZW5kZXJlZE5leHRUb1RhcmdldC55IC0gcmVuZGVyZWRUYXJnZXRQb3MueSwyKSk7ICAgICAgICBcclxuICAgICAgICB2YXIgdGFyZ2V0RW5kUG9pbnRYID0gcmVuZGVyZWRUYXJnZXRQb3MueCArICgoZGlzdGFuY2VGcm9tTm9kZS8gZGlzdGFuY2VUYXJnZXQpKiAocmVuZGVyZWROZXh0VG9UYXJnZXQueCAtIHJlbmRlcmVkVGFyZ2V0UG9zLngpKTtcclxuICAgICAgICB2YXIgdGFyZ2V0RW5kUG9pbnRZID0gcmVuZGVyZWRUYXJnZXRQb3MueSArICgoZGlzdGFuY2VGcm9tTm9kZS8gZGlzdGFuY2VUYXJnZXQpKiAocmVuZGVyZWROZXh0VG9UYXJnZXQueSAtIHJlbmRlcmVkVGFyZ2V0UG9zLnkpKTsgXHJcblxyXG4gICAgICAgIC8vIHJlbmRlciBlbmQgcG9pbnQgc2hhcGUgZm9yIHNvdXJjZSBhbmQgdGFyZ2V0XHJcbiAgICAgICAgLy8gdGhlIG51bGwgY2hlY2tzIGFyZSBub3QgdGhlb3JldGljYWxseSByZXF1aXJlZFxyXG4gICAgICAgIC8vIGJ1dCB0aGV5IHByb3RlY3QgZnJvbSBiYWQgc3luY2hyb25pb3VzIGNhbGxzIG9mIHJlZnJlc2hEcmF3cygpXHJcbiAgICAgICAgaWYoZW5kcG9pbnRTaGFwZTEgPT09IG51bGwpe1xyXG4gICAgICAgICAgZW5kcG9pbnRTaGFwZTEgPSBuZXcgS29udmEuQ2lyY2xlKHtcclxuICAgICAgICAgICAgeDogc291cmNlRW5kUG9pbnRYICsgbGVuZ3RoLFxyXG4gICAgICAgICAgICB5OiBzb3VyY2VFbmRQb2ludFkgKyBsZW5ndGgsXHJcbiAgICAgICAgICAgIHJhZGl1czogbGVuZ3RoLFxyXG4gICAgICAgICAgICBmaWxsOiAnYmxhY2snLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihlbmRwb2ludFNoYXBlMiA9PT0gbnVsbCl7XHJcbiAgICAgICAgICBlbmRwb2ludFNoYXBlMiA9IG5ldyBLb252YS5DaXJjbGUoe1xyXG4gICAgICAgICAgICB4OiB0YXJnZXRFbmRQb2ludFggKyBsZW5ndGgsXHJcbiAgICAgICAgICAgIHk6IHRhcmdldEVuZFBvaW50WSArIGxlbmd0aCxcclxuICAgICAgICAgICAgcmFkaXVzOiBsZW5ndGgsXHJcbiAgICAgICAgICAgIGZpbGw6ICdibGFjaycsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNhbnZhcy5hZGQoZW5kcG9pbnRTaGFwZTEpO1xyXG4gICAgICAgIGNhbnZhcy5hZGQoZW5kcG9pbnRTaGFwZTIpO1xyXG4gICAgICAgIGNhbnZhcy5kcmF3KCk7XHJcbiAgICAgICAgXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGdldCB0aGUgbGVuZ3RoIG9mIGFuY2hvciBwb2ludHMgdG8gYmUgcmVuZGVyZWRcclxuICAgICAgZnVuY3Rpb24gZ2V0QW5jaG9yU2hhcGVzTGVuZ3RoKGVkZ2UpIHtcclxuICAgICAgICB2YXIgZmFjdG9yID0gb3B0aW9ucygpLmFuY2hvclNoYXBlU2l6ZUZhY3RvcjtcclxuICAgICAgICBpZihvcHRpb25zKCkuZW5hYmxlQW5jaG9yU2l6ZU5vdEltcGFjdEJ5Wm9vbSkgdmFyIGFjdHVhbEZhY3Rvcj0gZmFjdG9yL2N5Lnpvb20oKVxyXG4gICAgICAgIGVsc2UgdmFyIGFjdHVhbEZhY3Rvcj0gZmFjdG9yXHJcbiAgICAgICAgaWYgKHBhcnNlRmxvYXQoZWRnZS5jc3MoJ3dpZHRoJykpIDw9IDIuNSlcclxuICAgICAgICAgIHJldHVybiAyLjUgKiBhY3R1YWxGYWN0b3I7XHJcbiAgICAgICAgZWxzZSByZXR1cm4gcGFyc2VGbG9hdChlZGdlLmNzcygnd2lkdGgnKSkqYWN0dWFsRmFjdG9yO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBjaGVjayBpZiB0aGUgYW5jaG9yIHJlcHJlc2VudGVkIGJ5IHt4LCB5fSBpcyBpbnNpZGUgdGhlIHBvaW50IHNoYXBlXHJcbiAgICAgIGZ1bmN0aW9uIGNoZWNrSWZJbnNpZGVTaGFwZSh4LCB5LCBsZW5ndGgsIGNlbnRlclgsIGNlbnRlclkpe1xyXG4gICAgICAgIHZhciBtaW5YID0gY2VudGVyWCAtIGxlbmd0aCAvIDI7XHJcbiAgICAgICAgdmFyIG1heFggPSBjZW50ZXJYICsgbGVuZ3RoIC8gMjtcclxuICAgICAgICB2YXIgbWluWSA9IGNlbnRlclkgLSBsZW5ndGggLyAyO1xyXG4gICAgICAgIHZhciBtYXhZID0gY2VudGVyWSArIGxlbmd0aCAvIDI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGluc2lkZSA9ICh4ID49IG1pblggJiYgeCA8PSBtYXhYKSAmJiAoeSA+PSBtaW5ZICYmIHkgPD0gbWF4WSk7XHJcbiAgICAgICAgcmV0dXJuIGluc2lkZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZ2V0IHRoZSBpbmRleCBvZiBhbmNob3IgY29udGFpbmluZyB0aGUgcG9pbnQgcmVwcmVzZW50ZWQgYnkge3gsIHl9XHJcbiAgICAgIGZ1bmN0aW9uIGdldENvbnRhaW5pbmdTaGFwZUluZGV4KHgsIHksIGVkZ2UpIHtcclxuICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgICAgICBpZih0eXBlID09PSAnaW5jb25jbHVzaXZlJyl7XHJcbiAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSkgPT0gbnVsbCB8fCBcclxuICAgICAgICAgIGVkZ2UuZGF0YShhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddKS5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYW5jaG9yTGlzdCA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpOy8vZWRnZS5fcHJpdmF0ZS5yZGF0YS5zZWdwdHM7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IGdldEFuY2hvclNoYXBlc0xlbmd0aChlZGdlKTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgYW5jaG9yTGlzdCAmJiBpIDwgYW5jaG9yTGlzdC5sZW5ndGg7IGkgPSBpICsgMil7XHJcbiAgICAgICAgICB2YXIgYW5jaG9yWCA9IGFuY2hvckxpc3RbaV07XHJcbiAgICAgICAgICB2YXIgYW5jaG9yWSA9IGFuY2hvckxpc3RbaSArIDFdO1xyXG5cclxuICAgICAgICAgIHZhciBpbnNpZGUgPSBjaGVja0lmSW5zaWRlU2hhcGUoeCwgeSwgbGVuZ3RoLCBhbmNob3JYLCBhbmNob3JZKTtcclxuICAgICAgICAgIGlmKGluc2lkZSl7XHJcbiAgICAgICAgICAgIHJldHVybiBpIC8gMjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGdldENvbnRhaW5pbmdFbmRQb2ludCh4LCB5LCBlZGdlKXtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gZ2V0QW5jaG9yU2hhcGVzTGVuZ3RoKGVkZ2UpO1xyXG4gICAgICAgIHZhciBhbGxQdHMgPSBlZGdlLl9wcml2YXRlLnJzY3JhdGNoLmFsbHB0cztcclxuICAgICAgICB2YXIgc3JjID0ge1xyXG4gICAgICAgICAgeDogYWxsUHRzWzBdLFxyXG4gICAgICAgICAgeTogYWxsUHRzWzFdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0YXJnZXQgPSB7XHJcbiAgICAgICAgICB4OiBhbGxQdHNbYWxsUHRzLmxlbmd0aC0yXSxcclxuICAgICAgICAgIHk6IGFsbFB0c1thbGxQdHMubGVuZ3RoLTFdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24oc3JjKTtcclxuICAgICAgICBjb252ZXJ0VG9SZW5kZXJlZFBvc2l0aW9uKHRhcmdldCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU291cmNlOjAsIFRhcmdldDoxLCBOb25lOi0xXHJcbiAgICAgICAgaWYoY2hlY2tJZkluc2lkZVNoYXBlKHgsIHksIGxlbmd0aCwgc3JjLngsIHNyYy55KSlcclxuICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIGVsc2UgaWYoY2hlY2tJZkluc2lkZVNoYXBlKHgsIHksIGxlbmd0aCwgdGFyZ2V0LngsIHRhcmdldC55KSlcclxuICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gc3RvcmUgdGhlIGN1cnJlbnQgc3RhdHVzIG9mIGdlc3R1cmVzIGFuZCBzZXQgdGhlbSB0byBmYWxzZVxyXG4gICAgICBmdW5jdGlvbiBkaXNhYmxlR2VzdHVyZXMoKSB7XHJcbiAgICAgICAgbGFzdFBhbm5pbmdFbmFibGVkID0gY3kucGFubmluZ0VuYWJsZWQoKTtcclxuICAgICAgICBsYXN0Wm9vbWluZ0VuYWJsZWQgPSBjeS56b29taW5nRW5hYmxlZCgpO1xyXG4gICAgICAgIGxhc3RCb3hTZWxlY3Rpb25FbmFibGVkID0gY3kuYm94U2VsZWN0aW9uRW5hYmxlZCgpO1xyXG5cclxuICAgICAgICBjeS56b29taW5nRW5hYmxlZChmYWxzZSlcclxuICAgICAgICAgIC5wYW5uaW5nRW5hYmxlZChmYWxzZSlcclxuICAgICAgICAgIC5ib3hTZWxlY3Rpb25FbmFibGVkKGZhbHNlKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gcmVzZXQgdGhlIGdlc3R1cmVzIGJ5IHRoZWlyIGxhdGVzdCBzdGF0dXNcclxuICAgICAgZnVuY3Rpb24gcmVzZXRHZXN0dXJlcygpIHtcclxuICAgICAgICBjeS56b29taW5nRW5hYmxlZChsYXN0Wm9vbWluZ0VuYWJsZWQpXHJcbiAgICAgICAgICAucGFubmluZ0VuYWJsZWQobGFzdFBhbm5pbmdFbmFibGVkKVxyXG4gICAgICAgICAgLmJveFNlbGVjdGlvbkVuYWJsZWQobGFzdEJveFNlbGVjdGlvbkVuYWJsZWQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiB0dXJuT2ZmQWN0aXZlQmdDb2xvcigpe1xyXG4gICAgICAgIC8vIGZvdW5kIHRoaXMgYXQgdGhlIGN5LW5vZGUtcmVzaXplIGNvZGUsIGJ1dCBkb2Vzbid0IHNlZW0gdG8gZmluZCB0aGUgb2JqZWN0IG1vc3Qgb2YgdGhlIHRpbWVcclxuICAgICAgICBpZiggY3kuc3R5bGUoKS5fcHJpdmF0ZS5jb3JlU3R5bGVbXCJhY3RpdmUtYmctb3BhY2l0eVwiXSkge1xyXG4gICAgICAgICAgbGFzdEFjdGl2ZUJnT3BhY2l0eSA9IGN5LnN0eWxlKCkuX3ByaXZhdGUuY29yZVN0eWxlW1wiYWN0aXZlLWJnLW9wYWNpdHlcIl0udmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgLy8gYXJiaXRyYXJ5LCBmZWVsIGZyZWUgdG8gY2hhbmdlXHJcbiAgICAgICAgICAvLyB0cmlhbCBhbmQgZXJyb3Igc2hvd2VkIHRoYXQgMC4xNSB3YXMgY2xvc2VzdCB0byB0aGUgb2xkIGNvbG9yXHJcbiAgICAgICAgICBsYXN0QWN0aXZlQmdPcGFjaXR5ID0gMC4xNTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN5LnN0eWxlKClcclxuICAgICAgICAgIC5zZWxlY3RvcihcImNvcmVcIilcclxuICAgICAgICAgIC5zdHlsZShcImFjdGl2ZS1iZy1vcGFjaXR5XCIsIDApXHJcbiAgICAgICAgICAudXBkYXRlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIHJlc2V0QWN0aXZlQmdDb2xvcigpe1xyXG4gICAgICAgIGN5LnN0eWxlKClcclxuICAgICAgICAgIC5zZWxlY3RvcihcImNvcmVcIilcclxuICAgICAgICAgIC5zdHlsZShcImFjdGl2ZS1iZy1vcGFjaXR5XCIsIGxhc3RBY3RpdmVCZ09wYWNpdHkpXHJcbiAgICAgICAgICAudXBkYXRlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIG1vdmVBbmNob3JQb2ludHMocG9zaXRpb25EaWZmLCBlZGdlcykge1xyXG4gICAgICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiggZWRnZSApe1xyXG4gICAgICAgICAgICAgIHZhciBwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpO1xyXG4gICAgICAgICAgICAgIHZhciBuZXh0QW5jaG9yUG9pbnRzUG9zaXRpb24gPSBbXTtcclxuICAgICAgICAgICAgICBpZiAocHJldmlvdXNBbmNob3JzUG9zaXRpb24gIT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxwcmV2aW91c0FuY2hvcnNQb3NpdGlvbi5sZW5ndGg7IGkrPTIpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dEFuY2hvclBvaW50c1Bvc2l0aW9uLnB1c2goe3g6IHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uW2ldK3Bvc2l0aW9uRGlmZi54LCB5OiBwcmV2aW91c0FuY2hvcnNQb3NpdGlvbltpKzFdK3Bvc2l0aW9uRGlmZi55fSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKGFuY2hvclBvaW50VXRpbGl0aWVzLmVkZ2VUeXBlSW5jb25jbHVzaXZlU2hvdWxkbnRIYXBwZW4odHlwZSwgXCJVaVV0aWxpdGllcy5qcywgbW92ZUFuY2hvclBvaW50c1wiKSl7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWydwb2ludFBvcyddLCBuZXh0QW5jaG9yUG9pbnRzUG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaW5pdEFuY2hvclBvaW50cyhvcHRpb25zKCkuYmVuZFBvc2l0aW9uc0Z1bmN0aW9uLCBvcHRpb25zKCkuY29udHJvbFBvc2l0aW9uc0Z1bmN0aW9uLCBlZGdlcyk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIExpc3RlbmVyIGRlZmluZWQgaW4gb3RoZXIgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAvLyBNaWdodCBoYXZlIGNvbXBhdGliaWxpdHkgaXNzdWVzIGFmdGVyIHRoZSB1bmJ1bmRsZWQgYmV6aWVyXHJcbiAgICAgICAgICBjeS50cmlnZ2VyKCdiZW5kUG9pbnRNb3ZlbWVudCcpOyBcclxuICAgICAgfVxyXG5cclxuXHJcbiAgICAgIGZ1bmN0aW9uIF9jYWxjQ29zdFRvUHJlZmVycmVkUG9zaXRpb24ocDEsIHAyKXtcclxuICAgICAgICB2YXIgY3VycmVudEFuZ2xlID0gTWF0aC5hdGFuMihwMi55IC0gcDEueSwgcDIueCAtIHAxLngpO1xyXG4gICAgICAgIHZhciBwZXJmZWN0QW5nbGU9Wy1NYXRoLlBJLC1NYXRoLlBJKjMvNCwtTWF0aC5QSS8yLC1NYXRoLlBJLzQsMCxNYXRoLlBJLzQsTWF0aC5QSS8yLE1hdGguUEkqMy80LE1hdGguUEkvNF1cclxuICAgICAgICB2YXIgZGVsdGFBbmdsZT1bXVxyXG4gICAgICAgIHBlcmZlY3RBbmdsZS5mb3JFYWNoKChhbmdsZSk9PntkZWx0YUFuZ2xlLnB1c2goTWF0aC5hYnMoY3VycmVudEFuZ2xlLWFuZ2xlKSl9KVxyXG4gICAgICAgIHZhciBpbmRleE9mTWluPSBkZWx0YUFuZ2xlLmluZGV4T2YoTWF0aC5taW4oLi4uZGVsdGFBbmdsZSkpXHJcbiAgICAgICAgdmFyIGR5ID0gKCBwMi55IC0gcDEueSApO1xyXG4gICAgICAgIHZhciBkeCA9ICggcDIueCAtIHAxLnggKTtcclxuICAgICAgICB2YXIgbD1NYXRoLnNxcnQoIGR4ICogZHggKyBkeSAqIGR5ICk7XHJcbiAgICAgICAgdmFyIGNvc3Q9TWF0aC5hYnMobCpNYXRoLnNpbihkZWx0YUFuZ2xlW2luZGV4T2ZNaW5dKSlcclxuXHJcbiAgICAgICAgdmFyIGNob3NlbkFuZ2xlPXBlcmZlY3RBbmdsZVtpbmRleE9mTWluXVxyXG4gICAgICAgIHZhciBlZGdlTD1NYXRoLmFicyhsKk1hdGguY29zKGRlbHRhQW5nbGVbaW5kZXhPZk1pbl0pKVxyXG4gICAgICAgIHZhciB0YXJnZXRQb2ludFg9cDEueCArIGVkZ2VMKk1hdGguY29zKGNob3NlbkFuZ2xlKVxyXG4gICAgICAgIHZhciB0YXJnZXRQb2ludFk9cDEueSArIGVkZ2VMKk1hdGguc2luKGNob3NlbkFuZ2xlKVxyXG5cclxuICAgICAgICByZXR1cm4ge1wiY29zdERpc3RhbmNlXCI6Y29zdCxcInhcIjp0YXJnZXRQb2ludFgsXCJ5XCI6dGFyZ2V0UG9pbnRZLFwiYW5nbGVcIjpjaG9zZW5BbmdsZX1cclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gbW92ZUFuY2hvck9uRHJhZyhlZGdlLCB0eXBlLCBpbmRleCwgcG9zaXRpb24pe1xyXG4gICAgICAgIHZhciBwcmV2UG9pbnRQb3NpdGlvbj1hbmNob3JQb2ludFV0aWxpdGllcy5vYnRhaW5QcmV2QW5jaG9yQWJzb2x1dGVQb3NpdGlvbnMoZWRnZSx0eXBlLGluZGV4KVxyXG4gICAgICAgIHZhciBuZXh0UG9pbnRQb3NpdGlvbj1hbmNob3JQb2ludFV0aWxpdGllcy5vYnRhaW5OZXh0QW5jaG9yQWJzb2x1dGVQb3NpdGlvbnMoZWRnZSx0eXBlLGluZGV4KVxyXG4gICAgICAgIHZhciBtb3VzZVBvc2l0aW9uID0gcG9zaXRpb247XHJcblxyXG4gICAgICAgIC8vY2FsY3VhbHRlIHRoZSBjb3N0KG9yIG9mZnNldCBkaXN0YW5jZSkgdG8gZnVsZmlsbCBwZXJmZWN0IDAsIG9yIDQ1IG9yIDkwIGRlZ3JlZSBwb3NpdGlvbnMgYWNjb3JkaW5nIHRvIHByZXYgYW5kIG5leHQgcG9zaXRpb25cclxuICAgICAgICB2YXIganVkZ2VQcmV2PV9jYWxjQ29zdFRvUHJlZmVycmVkUG9zaXRpb24ocHJldlBvaW50UG9zaXRpb24sbW91c2VQb3NpdGlvbilcclxuICAgICAgICB2YXIganVkZ2VOZXh0PV9jYWxjQ29zdFRvUHJlZmVycmVkUG9zaXRpb24obmV4dFBvaW50UG9zaXRpb24sbW91c2VQb3NpdGlvbilcclxuICAgICAgICB2YXIgZGVjaXNpb25PYmo9bnVsbFxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB6b29tTGV2ZWw9Y3kuem9vbSgpXHJcblxyXG4gICAgICAgIGlmIChqdWRnZVByZXYuY29zdERpc3RhbmNlICogem9vbUxldmVsIDwgb3B0cy5zdGlja3lBbmNob3JUb2xlcmVuY2VcclxuICAgICAgICAgICYmIGp1ZGdlTmV4dC5jb3N0RGlzdGFuY2UgKiB6b29tTGV2ZWwgPiBvcHRzLnN0aWNreUFuY2hvclRvbGVyZW5jZSkge1xyXG4gICAgICAgICAgLy9jaG9vc2UgdGhlIHBlcmZlY3QgYW5nbGUgcG9pbnQgZnJvbSBwcmV2IGFuY2hvclxyXG4gICAgICAgICAgcG9zaXRpb24ueCA9IGp1ZGdlUHJldi54XHJcbiAgICAgICAgICBwb3NpdGlvbi55ID0ganVkZ2VQcmV2LnlcclxuICAgICAgICB9ZWxzZSBpZihqdWRnZVByZXYuY29zdERpc3RhbmNlICogem9vbUxldmVsID4gb3B0cy5zdGlja3lBbmNob3JUb2xlcmVuY2VcclxuICAgICAgICAgICYmIGp1ZGdlTmV4dC5jb3N0RGlzdGFuY2UgKiB6b29tTGV2ZWwgPCBvcHRzLnN0aWNreUFuY2hvclRvbGVyZW5jZSl7XHJcbiAgICAgICAgICAgIC8vY2hvb3NlIHRoZSBwZXJmZWN0IGFuZ2xlIHBvaW50IGZyb20gbmV4dCBhbmNob3JcclxuICAgICAgICAgICAgcG9zaXRpb24ueCA9IGp1ZGdlTmV4dC54XHJcbiAgICAgICAgICAgIHBvc2l0aW9uLnkgPSBqdWRnZU5leHQueVxyXG4gICAgICAgIH1lbHNlIGlmKGp1ZGdlUHJldi5jb3N0RGlzdGFuY2UgKiB6b29tTGV2ZWwgPCBvcHRzLnN0aWNreUFuY2hvclRvbGVyZW5jZVxyXG4gICAgICAgICAgJiYganVkZ2VOZXh0LmNvc3REaXN0YW5jZSAqIHpvb21MZXZlbCA8IG9wdHMuc3RpY2t5QW5jaG9yVG9sZXJlbmNlKXtcclxuICAgICAgICAgICAgLy9jaGVjayBpZiB0aGUgdHdvIGFuZ2xlIGxpbmVzIGFyZSBwYXJhbGxlbCBvciBub3RcclxuICAgICAgICAgICAgdmFyIGFuZ2xlMT1qdWRnZVByZXYuYW5nbGVcclxuICAgICAgICAgICAgdmFyIGFuZ2xlMj1qdWRnZU5leHQuYW5nbGVcclxuICAgICAgICAgICAgaWYoYW5nbGUxPT1hbmdsZTIgfHwgTWF0aC5hYnMoYW5nbGUxLWFuZ2xlMik9PU1hdGguUEkpe1xyXG4gICAgICAgICAgICAgIC8vdGhlcmUgd2lsbCBiZSBubyBpbnRlcnNlY3Rpb24sIHNvIGp1c3QgY2hvb3NlIHRoZSBwZXJmZWN0IGFuZ2xlIHBvaW50IGZyb20gcHJldiBhbmNob3JcclxuICAgICAgICAgICAgICBwb3NpdGlvbi54ID0ganVkZ2VQcmV2LnhcclxuICAgICAgICAgICAgICBwb3NpdGlvbi55ID0ganVkZ2VQcmV2LnlcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgLy9jYWxjdWxhdGUgdGhlIGludGVyc2VjdGlvbiBhcyBwZXJmZWN0IGFuY2hvciBwb2ludFxyXG4gICAgICAgICAgICAgIHZhciBwcmV2WCA9IHByZXZQb2ludFBvc2l0aW9uLnhcclxuICAgICAgICAgICAgICB2YXIgcHJldlkgPSBwcmV2UG9pbnRQb3NpdGlvbi55XHJcbiAgICAgICAgICAgICAgdmFyIG5leFggPSBuZXh0UG9pbnRQb3NpdGlvbi54XHJcbiAgICAgICAgICAgICAgdmFyIG5leFkgPSBuZXh0UG9pbnRQb3NpdGlvbi55XHJcbiAgICAgICAgICAgICAgdmFyIGZ4PSBqdWRnZVByZXYueFxyXG4gICAgICAgICAgICAgIHZhciBmeSA9IGp1ZGdlUHJldi55XHJcbiAgICAgICAgICAgICAgdmFyIHN4ID0ganVkZ2VOZXh0LnhcclxuICAgICAgICAgICAgICB2YXIgc3kgPSBqdWRnZU5leHQueVxyXG5cclxuICAgICAgICAgICAgICBpZihmeT09cHJldlkpe1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb24ueT1wcmV2WVxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb24ueD0oc3gtbmV4WCkvKHN5LW5leFkpKihwb3NpdGlvbi55LW5leFkpK25leFhcclxuICAgICAgICAgICAgICB9ZWxzZSBpZihzeT09bmV4WSl7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbi55PW5leFlcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uLng9KGZ4LXByZXZYKS8oZnktcHJldlkpKihwb3NpdGlvbi55LXByZXZZKStwcmV2WFxyXG4gICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSAoZngtcHJldlgpLyhmeS1wcmV2WSlcclxuICAgICAgICAgICAgICAgIHZhciBiID0gKHN4LW5leFgpLyhzeS1uZXhZKVxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb24ueSA9IChhKnByZXZZLXByZXZYLWIqbmV4WStuZXhYKS8oYS1iKVxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb24ueCA9IGEqKHBvc2l0aW9uLnktcHJldlkpK3ByZXZYXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB3ZWlnaHRzID0gZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10pO1xyXG4gICAgICAgIHZhciBkaXN0YW5jZXMgPSBlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddKTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgcmVsYXRpdmVBbmNob3JQb3NpdGlvbiA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb24oZWRnZSwgcG9zaXRpb24pO1xyXG4gICAgICAgIHdlaWdodHNbaW5kZXhdID0gcmVsYXRpdmVBbmNob3JQb3NpdGlvbi53ZWlnaHQ7XHJcbiAgICAgICAgZGlzdGFuY2VzW2luZGV4XSA9IHJlbGF0aXZlQW5jaG9yUG9zaXRpb24uZGlzdGFuY2U7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10sIHdlaWdodHMpO1xyXG4gICAgICAgIGVkZ2UuZGF0YShhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ10sIGRpc3RhbmNlcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGRlYm91bmNlZCBkdWUgdG8gbGFyZ2UgYW1vdXQgb2YgY2FsbHMgdG8gdGFwZHJhZ1xyXG4gICAgICB2YXIgX21vdmVBbmNob3JPbkRyYWcgPSBkZWJvdW5jZSggbW92ZUFuY2hvck9uRHJhZywgNSk7XHJcblxyXG4gICAgICB7ICBcclxuICAgICAgICBsYXN0UGFubmluZ0VuYWJsZWQgPSBjeS5wYW5uaW5nRW5hYmxlZCgpO1xyXG4gICAgICAgIGxhc3Rab29taW5nRW5hYmxlZCA9IGN5Lnpvb21pbmdFbmFibGVkKCk7XHJcbiAgICAgICAgbGFzdEJveFNlbGVjdGlvbkVuYWJsZWQgPSBjeS5ib3hTZWxlY3Rpb25FbmFibGVkKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSW5pdGlsaXplIHRoZSBlZGdlVG9IaWdobGlnaHRCZW5kcyBhbmQgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdmFyIHNlbGVjdGVkRWRnZXMgPSBjeS5lZGdlcygnOnNlbGVjdGVkJyk7XHJcbiAgICAgICAgICB2YXIgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID0gc2VsZWN0ZWRFZGdlcy5sZW5ndGg7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmICggbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID09PSAxICkge1xyXG4gICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSBzZWxlY3RlZEVkZ2VzWzBdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjeS5iaW5kKCd6b29tIHBhbicsIGVab29tID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCAhZWRnZVRvSGlnaGxpZ2h0ICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBjeS5vZmYgaXMgbmV2ZXIgY2FsbGVkIG9uIHRoaXMgbGlzdGVuZXJcclxuICAgICAgICBjeS5vbignZGF0YScsICdlZGdlJywgIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmICggIWVkZ2VUb0hpZ2hsaWdodCApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZWZyZXNoRHJhd3MoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3kub24oJ3N0eWxlJywgJ2VkZ2UuZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHM6c2VsZWN0ZWQsIGVkZ2UuZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHM6c2VsZWN0ZWQnLCBlU3R5bGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7cmVmcmVzaERyYXdzKCl9LCA1MCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGN5Lm9uKCdyZW1vdmUnLCAnZWRnZScsIGVSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgZWRnZSA9IHRoaXM7XHJcbiAgICAgICAgICBpZiAoZWRnZS5zZWxlY3RlZCgpKSB7XHJcbiAgICAgICAgICAgIG51bWJlck9mU2VsZWN0ZWRFZGdlcyA9IG51bWJlck9mU2VsZWN0ZWRFZGdlcyAtIDE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoZWRnZVRvSGlnaGxpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0LnJlbW92ZUNsYXNzKCdjeS1lZGdlLWVkaXRpbmctaGlnaGxpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChudW1iZXJPZlNlbGVjdGVkRWRnZXMgPT09IDEpIHtcclxuICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRFZGdlcyA9IGN5LmVkZ2VzKCc6c2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAvLyBJZiB1c2VyIHJlbW92ZXMgYWxsIHNlbGVjdGVkIGVkZ2VzIGF0IGEgc2luZ2xlIG9wZXJhdGlvbiB0aGVuIG91ciAnbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzJ1xyXG4gICAgICAgICAgICAgIC8vIG1heSBiZSBtaXNsZWFkaW5nLiBUaGVyZWZvcmUgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgbnVtYmVyIG9mIGVkZ2VzIHRvIGhpZ2hsaWdodCBpcyByZWFseSAxIGhlcmUuXHJcbiAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkRWRnZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSBzZWxlY3RlZEVkZ2VzWzBdO1xyXG4gICAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0LmFkZENsYXNzKCdjeS1lZGdlLWVkaXRpbmctaGlnaGxpZ2h0Jyk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGN5LmVuZEJhdGNoKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZWZyZXNoRHJhd3MoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAgY3kub24oJ2FkZCcsICdlZGdlJywgZUFkZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBlZGdlID0gdGhpcztcclxuICAgICAgICAgIGlmIChlZGdlLnNlbGVjdGVkKCkpIHtcclxuICAgICAgICAgICAgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID0gbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzICsgMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGN5LnN0YXJ0QmF0Y2goKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChlZGdlVG9IaWdobGlnaHQpIHtcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQucmVtb3ZlQ2xhc3MoJ2N5LWVkZ2UtZWRpdGluZy1oaWdobGlnaHQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKG51bWJlck9mU2VsZWN0ZWRFZGdlcyA9PT0gMSkge1xyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IGVkZ2U7XHJcbiAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0LmFkZENsYXNzKCdjeS1lZGdlLWVkaXRpbmctaGlnaGxpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjeS5lbmRCYXRjaCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVmcmVzaERyYXdzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY3kub24oJ3NlbGVjdCcsICdlZGdlJywgZVNlbGVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBlZGdlID0gdGhpcztcclxuXHJcbiAgICAgICAgICBpZihlZGdlLnRhcmdldCgpLmNvbm5lY3RlZEVkZ2VzKCkubGVuZ3RoID09IDAgfHwgZWRnZS5zb3VyY2UoKS5jb25uZWN0ZWRFZGdlcygpLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgXHJcbiAgICAgICAgICBudW1iZXJPZlNlbGVjdGVkRWRnZXMgPSBudW1iZXJPZlNlbGVjdGVkRWRnZXMgKyAxO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKGVkZ2VUb0hpZ2hsaWdodCkge1xyXG4gICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQucmVtb3ZlQ2xhc3MoJ2N5LWVkZ2UtZWRpdGluZy1oaWdobGlnaHQnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICBpZiAobnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID09PSAxKSB7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IGVkZ2U7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodC5hZGRDbGFzcygnY3ktZWRnZS1lZGl0aW5nLWhpZ2hsaWdodCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY3kuZW5kQmF0Y2goKTtcclxuICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGN5Lm9uKCd1bnNlbGVjdCcsICdlZGdlJywgZVVuc2VsZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID0gbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzIC0gMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKGVkZ2VUb0hpZ2hsaWdodCkge1xyXG4gICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQucmVtb3ZlQ2xhc3MoJ2N5LWVkZ2UtZWRpdGluZy1oaWdobGlnaHQnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICBpZiAobnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID09PSAxKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZEVkZ2VzID0gY3kuZWRnZXMoJzpzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSWYgdXNlciB1bnNlbGVjdHMgYWxsIGVkZ2VzIGJ5IHRhcHBpbmcgdG8gdGhlIGNvcmUgZXRjLiB0aGVuIG91ciAnbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzJ1xyXG4gICAgICAgICAgICAvLyBtYXkgYmUgbWlzbGVhZGluZy4gVGhlcmVmb3JlIHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIG51bWJlciBvZiBlZGdlcyB0byBoaWdobGlnaHQgaXMgcmVhbHkgMSBoZXJlLlxyXG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWRFZGdlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSBzZWxlY3RlZEVkZ2VzWzBdO1xyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodC5hZGRDbGFzcygnY3ktZWRnZS1lZGl0aW5nLWhpZ2hsaWdodCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY3kuZW5kQmF0Y2goKTtcclxuICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBtb3ZlZEFuY2hvckluZGV4O1xyXG4gICAgICAgIHZhciB0YXBTdGFydFBvcztcclxuICAgICAgICB2YXIgbW92ZWRFZGdlO1xyXG4gICAgICAgIHZhciBtb3ZlQW5jaG9yUGFyYW07XHJcbiAgICAgICAgdmFyIGNyZWF0ZUFuY2hvck9uRHJhZztcclxuICAgICAgICB2YXIgbW92ZWRFbmRQb2ludDtcclxuICAgICAgICB2YXIgZHVtbXlOb2RlO1xyXG4gICAgICAgIHZhciBkZXRhY2hlZE5vZGU7XHJcbiAgICAgICAgdmFyIG5vZGVUb0F0dGFjaDtcclxuICAgICAgICB2YXIgYW5jaG9yQ3JlYXRlZEJ5RHJhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjeS5vbigndGFwc3RhcnQnLCBlVGFwU3RhcnQgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgdGFwU3RhcnRQb3MgPSBldmVudC5wb3NpdGlvbiB8fCBldmVudC5jeVBvc2l0aW9uO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjeS5vbigndGFwc3RhcnQnLCAnZWRnZScsIGVUYXBTdGFydE9uRWRnZSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgdmFyIGVkZ2UgPSB0aGlzO1xyXG5cclxuICAgICAgICAgIGlmICghZWRnZVRvSGlnaGxpZ2h0IHx8IGVkZ2VUb0hpZ2hsaWdodC5pZCgpICE9PSBlZGdlLmlkKCkpIHtcclxuICAgICAgICAgICAgY3JlYXRlQW5jaG9yT25EcmFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgbW92ZWRFZGdlID0gZWRnZTtcclxuXHJcbiAgICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgICAgICAgIC8vIHRvIGF2b2lkIGVycm9yc1xyXG4gICAgICAgICAgaWYodHlwZSA9PT0gJ2luY29uY2x1c2l2ZScpXHJcbiAgICAgICAgICAgIHR5cGUgPSAnYmVuZCc7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHZhciBjeVBvc1ggPSB0YXBTdGFydFBvcy54O1xyXG4gICAgICAgICAgdmFyIGN5UG9zWSA9IHRhcFN0YXJ0UG9zLnk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEdldCB3aGljaCBlbmQgcG9pbnQgaGFzIGJlZW4gY2xpY2tlZCAoU291cmNlOjAsIFRhcmdldDoxLCBOb25lOi0xKVxyXG4gICAgICAgICAgdmFyIGVuZFBvaW50ID0gZ2V0Q29udGFpbmluZ0VuZFBvaW50KGN5UG9zWCwgY3lQb3NZLCBlZGdlKTtcclxuXHJcbiAgICAgICAgICBpZihlbmRQb2ludCA9PSAwIHx8IGVuZFBvaW50ID09IDEpe1xyXG4gICAgICAgICAgICBlZGdlLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIG1vdmVkRW5kUG9pbnQgPSBlbmRQb2ludDtcclxuICAgICAgICAgICAgZGV0YWNoZWROb2RlID0gKGVuZFBvaW50ID09IDApID8gbW92ZWRFZGdlLnNvdXJjZSgpIDogbW92ZWRFZGdlLnRhcmdldCgpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRpc2Nvbm5lY3RlZEVuZCA9IChlbmRQb2ludCA9PSAwKSA/ICdzb3VyY2UnIDogJ3RhcmdldCc7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSByZWNvbm5lY3Rpb25VdGlsaXRpZXMuZGlzY29ubmVjdEVkZ2UobW92ZWRFZGdlLCBjeSwgZXZlbnQucmVuZGVyZWRQb3NpdGlvbiwgZGlzY29ubmVjdGVkRW5kKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGR1bW15Tm9kZSA9IHJlc3VsdC5kdW1teU5vZGU7XHJcbiAgICAgICAgICAgIG1vdmVkRWRnZSA9IHJlc3VsdC5lZGdlO1xyXG5cclxuICAgICAgICAgICAgZGlzYWJsZUdlc3R1cmVzKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbW92ZWRBbmNob3JJbmRleCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgY3JlYXRlQW5jaG9yT25EcmFnID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBjeS5vbignZHJhZycsICdub2RlJywgZURyYWcgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgIHZhciBub2RlID0gdGhpcztcclxuICAgICAgICAgIGN5LmVkZ2VzKCkudW5zZWxlY3QoKTtcclxuICAgICAgICAgIGlmKCFub2RlLnNlbGVjdGVkKCkpe1xyXG4gICAgICAgICAgICBjeS5ub2RlcygpLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgICB9ICAgICAgICAgXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY3kub24oJ3RhcGRyYWcnLCBlVGFwRHJhZyA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgLyoqIFxyXG4gICAgICAgICAgICogaWYgdGhlcmUgaXMgYSBzZWxlY3RlZCBlZGdlIHNldCBhdXRvdW5zZWxlY3RpZnkgZmFsc2VcclxuICAgICAgICAgICAqIGZpeGVzIHRoZSBub2RlLWVkaXRpbmcgcHJvYmxlbSB3aGVyZSBub2RlcyB3b3VsZCBnZXRcclxuICAgICAgICAgICAqIHVuc2VsZWN0ZWQgYWZ0ZXIgcmVzaXplIGRyYWdcclxuICAgICAgICAgICovXHJcbiAgICAgICAgICBpZiAoY3kuZWRnZXMoJzpzZWxlY3RlZCcpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHZhciBlZGdlID0gbW92ZWRFZGdlO1xyXG5cclxuICAgICAgICAgIGlmKG1vdmVkRWRnZSAhPT0gdW5kZWZpbmVkICYmIGFuY2hvclBvaW50VXRpbGl0aWVzLmlzSWdub3JlZEVkZ2UoZWRnZSkgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgICAgICAgIGlmKGNyZWF0ZUFuY2hvck9uRHJhZyAmJiBvcHRzLmVuYWJsZUNyZWF0ZUFuY2hvck9uRHJhZyAmJiAhYW5jaG9yVG91Y2hlZCAmJiB0eXBlICE9PSAnaW5jb25jbHVzaXZlJykge1xyXG4gICAgICAgICAgICAvLyByZW1lbWJlciBzdGF0ZSBiZWZvcmUgY3JlYXRpbmcgYW5jaG9yXHJcbiAgICAgICAgICAgIHZhciB3ZWlnaHRTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddO1xyXG4gICAgICAgICAgICB2YXIgZGlzdGFuY2VTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ107XHJcblxyXG4gICAgICAgICAgICBtb3ZlQW5jaG9yUGFyYW0gPSB7XHJcbiAgICAgICAgICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgICAgICAgIHdlaWdodHM6IGVkZ2UuZGF0YSh3ZWlnaHRTdHIpID8gW10uY29uY2F0KGVkZ2UuZGF0YSh3ZWlnaHRTdHIpKSA6IFtdLFxyXG4gICAgICAgICAgICAgIGRpc3RhbmNlczogZWRnZS5kYXRhKGRpc3RhbmNlU3RyKSA/IFtdLmNvbmNhdChlZGdlLmRhdGEoZGlzdGFuY2VTdHIpKSA6IFtdXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBlZGdlLnVuc2VsZWN0KCk7XHJcblxyXG4gICAgICAgICAgICAvLyB1c2luZyB0YXBzdGFydCBwb3NpdGlvbiBmaXhlcyBidWcgb24gcXVpY2sgZHJhZ3NcclxuICAgICAgICAgICAgLy8gLS0tIFxyXG4gICAgICAgICAgICAvLyBhbHNvIG1vZGlmaWVkIGFkZEFuY2hvclBvaW50IHRvIHJldHVybiB0aGUgaW5kZXggYmVjYXVzZVxyXG4gICAgICAgICAgICAvLyBnZXRDb250YWluaW5nU2hhcGVJbmRleCBmYWlsZWQgdG8gZmluZCB0aGUgY3JlYXRlZCBhbmNob3Igb24gcXVpY2sgZHJhZ3NcclxuICAgICAgICAgICAgbW92ZWRBbmNob3JJbmRleCA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmFkZEFuY2hvclBvaW50KGVkZ2UsIHRhcFN0YXJ0UG9zKTtcclxuICAgICAgICAgICAgbW92ZWRFZGdlID0gZWRnZTtcclxuICAgICAgICAgICAgY3JlYXRlQW5jaG9yT25EcmFnID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBhbmNob3JDcmVhdGVkQnlEcmFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgZGlzYWJsZUdlc3R1cmVzKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gaWYgdGhlIHRhcHN0YXJ0IGRpZCBub3QgaGl0IGFuIGVkZ2UgYW5kIGl0IGRpZCBub3QgaGl0IGFuIGFuY2hvclxyXG4gICAgICAgICAgaWYgKCFhbmNob3JUb3VjaGVkICYmIChtb3ZlZEVkZ2UgPT09IHVuZGVmaW5lZCB8fCBcclxuICAgICAgICAgICAgKG1vdmVkQW5jaG9ySW5kZXggPT09IHVuZGVmaW5lZCAmJiBtb3ZlZEVuZFBvaW50ID09PSB1bmRlZmluZWQpKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIGV2ZW50UG9zID0gZXZlbnQucG9zaXRpb24gfHwgZXZlbnQuY3lQb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAvLyBVcGRhdGUgZW5kIHBvaW50IGxvY2F0aW9uIChTb3VyY2U6MCwgVGFyZ2V0OjEpXHJcbiAgICAgICAgICBpZihtb3ZlZEVuZFBvaW50ICE9IC0xICYmIGR1bW15Tm9kZSl7XHJcbiAgICAgICAgICAgIGR1bW15Tm9kZS5wb3NpdGlvbihldmVudFBvcyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBjaGFuZ2UgbG9jYXRpb24gb2YgYW5jaG9yIGNyZWF0ZWQgYnkgZHJhZ1xyXG4gICAgICAgICAgZWxzZSBpZihtb3ZlZEFuY2hvckluZGV4ICE9IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIF9tb3ZlQW5jaG9yT25EcmFnKGVkZ2UsIHR5cGUsIG1vdmVkQW5jaG9ySW5kZXgsIGV2ZW50UG9zKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGNoYW5nZSBsb2NhdGlvbiBvZiBkcmFnIGFuZCBkcm9wcGVkIGFuY2hvclxyXG4gICAgICAgICAgZWxzZSBpZihhbmNob3JUb3VjaGVkKXtcclxuXHJcbiAgICAgICAgICAgIC8vIHRoZSB0YXBTdGFydFBvcyBjaGVjayBpcyBuZWNlc3Nhcnkgd2hlbiByaWdoIGNsaWNraW5nIGFuY2hvciBwb2ludHNcclxuICAgICAgICAgICAgLy8gcmlnaHQgY2xpY2tpbmcgYW5jaG9yIHBvaW50cyB0cmlnZ2VycyBNb3VzZURvd24gZm9yIEtvbnZhLCBidXQgbm90IHRhcHN0YXJ0IGZvciBjeVxyXG4gICAgICAgICAgICAvLyB3aGVuIHRoYXQgaGFwcGVucyB0YXBTdGFydFBvcyBpcyB1bmRlZmluZWRcclxuICAgICAgICAgICAgaWYoYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXggPT09IHVuZGVmaW5lZCAmJiB0YXBTdGFydFBvcyl7XHJcbiAgICAgICAgICAgICAgYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXggPSBnZXRDb250YWluaW5nU2hhcGVJbmRleChcclxuICAgICAgICAgICAgICAgIHRhcFN0YXJ0UG9zLngsIFxyXG4gICAgICAgICAgICAgICAgdGFwU3RhcnRQb3MueSxcclxuICAgICAgICAgICAgICAgIGFuY2hvck1hbmFnZXIuZWRnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKGFuY2hvck1hbmFnZXIudG91Y2hlZEFuY2hvckluZGV4ICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICAgIF9tb3ZlQW5jaG9yT25EcmFnKFxyXG4gICAgICAgICAgICAgICAgYW5jaG9yTWFuYWdlci5lZGdlLFxyXG4gICAgICAgICAgICAgICAgYW5jaG9yTWFuYWdlci5lZGdlVHlwZSxcclxuICAgICAgICAgICAgICAgIGFuY2hvck1hbmFnZXIudG91Y2hlZEFuY2hvckluZGV4LFxyXG4gICAgICAgICAgICAgICAgZXZlbnRQb3NcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmKGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXRbMF0gJiYgZXZlbnQudGFyZ2V0LmlzTm9kZSgpKXtcclxuICAgICAgICAgICAgbm9kZVRvQXR0YWNoID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBjeS5vbigndGFwZW5kJywgZVRhcEVuZCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG5cclxuICAgICAgICAgIGlmKG1vdXNlT3V0KXtcclxuICAgICAgICAgICAgY2FudmFzLmdldFN0YWdlKCkuZmlyZShcImNvbnRlbnRNb3VzZXVwXCIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBlZGdlID0gbW92ZWRFZGdlIHx8IGFuY2hvck1hbmFnZXIuZWRnZTsgXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmKCBlZGdlICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGFuY2hvck1hbmFnZXIudG91Y2hlZEFuY2hvckluZGV4O1xyXG4gICAgICAgICAgICBpZiggaW5kZXggIT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgIHZhciBzdGFydFggPSBlZGdlLnNvdXJjZSgpLnBvc2l0aW9uKCd4Jyk7XHJcbiAgICAgICAgICAgICAgdmFyIHN0YXJ0WSA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oJ3knKTtcclxuICAgICAgICAgICAgICB2YXIgZW5kWCA9IGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oJ3gnKTtcclxuICAgICAgICAgICAgICB2YXIgZW5kWSA9IGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oJ3knKTtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICB2YXIgYW5jaG9yTGlzdCA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpO1xyXG4gICAgICAgICAgICAgIHZhciBhbGxBbmNob3JzID0gW3N0YXJ0WCwgc3RhcnRZXS5jb25jYXQoYW5jaG9yTGlzdCkuY29uY2F0KFtlbmRYLCBlbmRZXSk7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgdmFyIGFuY2hvckluZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgICAgICAgIHZhciBwcmVJbmRleCA9IGFuY2hvckluZGV4IC0gMTtcclxuICAgICAgICAgICAgICB2YXIgcG9zSW5kZXggPSBhbmNob3JJbmRleCArIDE7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgdmFyIGFuY2hvciA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGFsbEFuY2hvcnNbMiAqIGFuY2hvckluZGV4XSxcclxuICAgICAgICAgICAgICAgIHk6IGFsbEFuY2hvcnNbMiAqIGFuY2hvckluZGV4ICsgMV1cclxuICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciBwcmVBbmNob3JQb2ludCA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGFsbEFuY2hvcnNbMiAqIHByZUluZGV4XSxcclxuICAgICAgICAgICAgICAgIHk6IGFsbEFuY2hvcnNbMiAqIHByZUluZGV4ICsgMV1cclxuICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciBwb3NBbmNob3JQb2ludCA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGFsbEFuY2hvcnNbMiAqIHBvc0luZGV4XSxcclxuICAgICAgICAgICAgICAgIHk6IGFsbEFuY2hvcnNbMiAqIHBvc0luZGV4ICsgMV1cclxuICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciBuZWFyVG9MaW5lO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIGlmKCAoIGFuY2hvci54ID09PSBwcmVBbmNob3JQb2ludC54ICYmIGFuY2hvci55ID09PSBwcmVBbmNob3JQb2ludC55ICkgfHwgKCBhbmNob3IueCA9PT0gcHJlQW5jaG9yUG9pbnQueCAmJiBhbmNob3IueSA9PT0gcHJlQW5jaG9yUG9pbnQueSApICkge1xyXG4gICAgICAgICAgICAgICAgbmVhclRvTGluZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIG0xID0gKCBwcmVBbmNob3JQb2ludC55IC0gcG9zQW5jaG9yUG9pbnQueSApIC8gKCBwcmVBbmNob3JQb2ludC54IC0gcG9zQW5jaG9yUG9pbnQueCApO1xyXG4gICAgICAgICAgICAgICAgdmFyIG0yID0gLTEgLyBtMTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgIHNyY1BvaW50OiBwcmVBbmNob3JQb2ludCxcclxuICAgICAgICAgICAgICAgICAgdGd0UG9pbnQ6IHBvc0FuY2hvclBvaW50LFxyXG4gICAgICAgICAgICAgICAgICBtMTogbTEsXHJcbiAgICAgICAgICAgICAgICAgIG0yOiBtMlxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEludGVyc2VjdGlvbiA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEludGVyc2VjdGlvbihlZGdlLCBhbmNob3IsIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzKTtcclxuICAgICAgICAgICAgICAgIHZhciBkaXN0ID0gTWF0aC5zcXJ0KCBNYXRoLnBvdyggKGFuY2hvci54IC0gY3VycmVudEludGVyc2VjdGlvbi54KSwgMiApIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICArIE1hdGgucG93KCAoYW5jaG9yLnkgLSBjdXJyZW50SW50ZXJzZWN0aW9uLnkpLCAyICkpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGJlbmQgcG9pbnQgaWYgc2VnbWVudCBlZGdlIGJlY29tZXMgc3RyYWlnaHRcclxuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcbiAgICAgICAgICAgICAgICBpZiggKHR5cGUgPT09ICdiZW5kJyAmJiBkaXN0ICA8IG9wdGlvbnMoKS5iZW5kUmVtb3ZhbFNlbnNpdGl2aXR5KSkge1xyXG4gICAgICAgICAgICAgICAgICBuZWFyVG9MaW5lID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICBpZihvcHRzLmVuYWJsZVJlbW92ZUFuY2hvck1pZE9mTmVhckxpbmUgJiYgbmVhclRvTGluZSApXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMucmVtb3ZlQW5jaG9yKGVkZ2UsIGluZGV4KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZihkdW1teU5vZGUgIT0gdW5kZWZpbmVkICYmIChtb3ZlZEVuZFBvaW50ID09IDAgfHwgbW92ZWRFbmRQb2ludCA9PSAxKSApe1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciBuZXdOb2RlID0gZGV0YWNoZWROb2RlO1xyXG4gICAgICAgICAgICAgIHZhciBpc1ZhbGlkID0gJ3ZhbGlkJztcclxuICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSAobW92ZWRFbmRQb2ludCA9PSAwKSA/ICdzb3VyY2UnIDogJ3RhcmdldCc7XHJcblxyXG4gICAgICAgICAgICAgIC8vIHZhbGlkYXRlIGVkZ2UgcmVjb25uZWN0aW9uXHJcbiAgICAgICAgICAgICAgaWYobm9kZVRvQXR0YWNoKXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdTb3VyY2UgPSAobW92ZWRFbmRQb2ludCA9PSAwKSA/IG5vZGVUb0F0dGFjaCA6IGVkZ2Uuc291cmNlKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3VGFyZ2V0ID0gKG1vdmVkRW5kUG9pbnQgPT0gMSkgPyBub2RlVG9BdHRhY2ggOiBlZGdlLnRhcmdldCgpO1xyXG4gICAgICAgICAgICAgICAgaWYodHlwZW9mIHZhbGlkYXRlRWRnZSA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdmFsaWRhdGVFZGdlKGVkZ2UsIG5ld1NvdXJjZSwgbmV3VGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIG5ld05vZGUgPSAoaXNWYWxpZCA9PT0gJ3ZhbGlkJykgPyBub2RlVG9BdHRhY2ggOiBkZXRhY2hlZE5vZGU7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICB2YXIgbmV3U291cmNlID0gKG1vdmVkRW5kUG9pbnQgPT0gMCkgPyBuZXdOb2RlIDogZWRnZS5zb3VyY2UoKTtcclxuICAgICAgICAgICAgICB2YXIgbmV3VGFyZ2V0ID0gKG1vdmVkRW5kUG9pbnQgPT0gMSkgPyBuZXdOb2RlIDogZWRnZS50YXJnZXQoKTtcclxuICAgICAgICAgICAgICBlZGdlID0gcmVjb25uZWN0aW9uVXRpbGl0aWVzLmNvbm5lY3RFZGdlKGVkZ2UsIGRldGFjaGVkTm9kZSwgbG9jYXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICBpZihkZXRhY2hlZE5vZGUuaWQoKSAhPT0gbmV3Tm9kZS5pZCgpKXtcclxuICAgICAgICAgICAgICAgIC8vIHVzZSBnaXZlbiBoYW5kbGVSZWNvbm5lY3RFZGdlIGZ1bmN0aW9uIFxyXG4gICAgICAgICAgICAgICAgaWYodHlwZW9mIGhhbmRsZVJlY29ubmVjdEVkZ2UgPT09ICdmdW5jdGlvbicpe1xyXG4gICAgICAgICAgICAgICAgICB2YXIgcmVjb25uZWN0ZWRFZGdlID0gaGFuZGxlUmVjb25uZWN0RWRnZShuZXdTb3VyY2UuaWQoKSwgbmV3VGFyZ2V0LmlkKCksIGVkZ2UuZGF0YSgpKTtcclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIGlmKHJlY29ubmVjdGVkRWRnZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVjb25uZWN0aW9uVXRpbGl0aWVzLmNvcHlFZGdlKGVkZ2UsIHJlY29ubmVjdGVkRWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaW5pdEFuY2hvclBvaW50cyhvcHRpb25zKCkuYmVuZFBvc2l0aW9uc0Z1bmN0aW9uLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMoKS5jb250cm9sUG9zaXRpb25zRnVuY3Rpb24sIFtyZWNvbm5lY3RlZEVkZ2VdKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgaWYocmVjb25uZWN0ZWRFZGdlICYmIG9wdGlvbnMoKS51bmRvYWJsZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgIG5ld0VkZ2U6IHJlY29ubmVjdGVkRWRnZSxcclxuICAgICAgICAgICAgICAgICAgICAgIG9sZEVkZ2U6IGVkZ2VcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGN5LnVuZG9SZWRvKCkuZG8oJ3JlbW92ZVJlY29ubmVjdGVkRWRnZScsIHBhcmFtcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHJlY29ubmVjdGVkRWRnZTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBlbHNlIGlmKHJlY29ubmVjdGVkRWRnZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgY3kucmVtb3ZlKGVkZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVkZ2UgPSByZWNvbm5lY3RlZEVkZ2U7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIHZhciBsb2MgPSAobW92ZWRFbmRQb2ludCA9PSAwKSA/IHtzb3VyY2U6IG5ld05vZGUuaWQoKX0gOiB7dGFyZ2V0OiBuZXdOb2RlLmlkKCl9O1xyXG4gICAgICAgICAgICAgICAgICB2YXIgb2xkTG9jID0gKG1vdmVkRW5kUG9pbnQgPT0gMCkgPyB7c291cmNlOiBkZXRhY2hlZE5vZGUuaWQoKX0gOiB7dGFyZ2V0OiBkZXRhY2hlZE5vZGUuaWQoKX07XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zKCkudW5kb2FibGUgJiYgbmV3Tm9kZS5pZCgpICE9PSBkZXRhY2hlZE5vZGUuaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJhbSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGVkZ2U6IGVkZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogbG9jLFxyXG4gICAgICAgICAgICAgICAgICAgICAgb2xkTG9jOiBvbGRMb2NcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBjeS51bmRvUmVkbygpLmRvKCdyZWNvbm5lY3RFZGdlJywgcGFyYW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGVkZ2UgPSByZXN1bHQuZWRnZTtcclxuICAgICAgICAgICAgICAgICAgICAvL2VkZ2Uuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgLy8gaW52YWxpZCBlZGdlIHJlY29ubmVjdGlvbiBjYWxsYmFja1xyXG4gICAgICAgICAgICAgIGlmKGlzVmFsaWQgIT09ICd2YWxpZCcgJiYgdHlwZW9mIGFjdE9uVW5zdWNjZXNzZnVsUmVjb25uZWN0aW9uID09PSAnZnVuY3Rpb24nKXtcclxuICAgICAgICAgICAgICAgIGFjdE9uVW5zdWNjZXNzZnVsUmVjb25uZWN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVkZ2Uuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgY3kucmVtb3ZlKGR1bW15Tm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHZhciB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgICAgICAgLy8gdG8gYXZvaWQgZXJyb3JzXHJcbiAgICAgICAgICBpZih0eXBlID09PSAnaW5jb25jbHVzaXZlJyl7XHJcbiAgICAgICAgICAgIHR5cGUgPSAnYmVuZCc7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYoYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXggPT09IHVuZGVmaW5lZCAmJiAhYW5jaG9yQ3JlYXRlZEJ5RHJhZyl7XHJcbiAgICAgICAgICAgIG1vdmVBbmNob3JQYXJhbSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgd2VpZ2h0U3RyID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXTtcclxuICAgICAgICAgIGlmIChlZGdlICE9PSB1bmRlZmluZWQgJiYgbW92ZUFuY2hvclBhcmFtICE9PSB1bmRlZmluZWQgJiYgXHJcbiAgICAgICAgICAgIChlZGdlLmRhdGEod2VpZ2h0U3RyKSA/IGVkZ2UuZGF0YSh3ZWlnaHRTdHIpLnRvU3RyaW5nKCkgOiBudWxsKSAhPSBtb3ZlQW5jaG9yUGFyYW0ud2VpZ2h0cy50b1N0cmluZygpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBhbmNob3IgY3JlYXRlZCBmcm9tIGRyYWdcclxuICAgICAgICAgICAgaWYoYW5jaG9yQ3JlYXRlZEJ5RHJhZyl7XHJcbiAgICAgICAgICAgIGVkZ2Uuc2VsZWN0KCk7IFxyXG5cclxuICAgICAgICAgICAgLy8gc3RvcHMgdGhlIHVuYnVuZGxlZCBiZXppZXIgZWRnZXMgZnJvbSBiZWluZyB1bnNlbGVjdGVkXHJcbiAgICAgICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYob3B0aW9ucygpLnVuZG9hYmxlKSB7XHJcbiAgICAgICAgICAgICAgY3kudW5kb1JlZG8oKS5kbygnY2hhbmdlQW5jaG9yUG9pbnRzJywgbW92ZUFuY2hvclBhcmFtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBtb3ZlZEFuY2hvckluZGV4ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgbW92ZWRFZGdlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgbW92ZUFuY2hvclBhcmFtID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgY3JlYXRlQW5jaG9yT25EcmFnID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgbW92ZWRFbmRQb2ludCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIGR1bW15Tm9kZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIGRldGFjaGVkTm9kZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIG5vZGVUb0F0dGFjaCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIHRhcFN0YXJ0UG9zID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgYW5jaG9yQ3JlYXRlZEJ5RHJhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIGFuY2hvck1hbmFnZXIudG91Y2hlZEFuY2hvckluZGV4ID0gdW5kZWZpbmVkOyBcclxuXHJcbiAgICAgICAgICByZXNldEdlc3R1cmVzKCk7XHJcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7cmVmcmVzaERyYXdzKCl9LCA1MCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vVmFyaWFibGVzIHVzZWQgZm9yIHN0YXJ0aW5nIGFuZCBlbmRpbmcgdGhlIG1vdmVtZW50IG9mIGFuY2hvciBwb2ludHMgd2l0aCBhcnJvd3NcclxuICAgICAgICB2YXIgbW92ZWFuY2hvcnBhcmFtO1xyXG4gICAgICAgIHZhciBmaXJzdEFuY2hvcjtcclxuICAgICAgICB2YXIgZWRnZUNvbnRhaW5pbmdGaXJzdEFuY2hvcjtcclxuICAgICAgICB2YXIgZmlyc3RBbmNob3JQb2ludEZvdW5kO1xyXG4gICAgICAgIGN5Lm9uKFwiZWRnZWVkaXRpbmcubW92ZXN0YXJ0XCIsIGZ1bmN0aW9uIChlLCBlZGdlcykge1xyXG4gICAgICAgICAgICBmaXJzdEFuY2hvclBvaW50Rm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKGVkZ2VzWzBdICE9IHVuZGVmaW5lZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiggZWRnZSApe1xyXG4gICAgICAgICAgICAgICAgICBpZiAoYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSkgIT0gdW5kZWZpbmVkICYmICFmaXJzdEFuY2hvclBvaW50Rm91bmQpXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGZpcnN0QW5jaG9yID0geyB4OiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRBbmNob3JzQXNBcnJheShlZGdlKVswXSwgeTogYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSlbMV19O1xyXG4gICAgICAgICAgICAgICAgICAgICAgbW92ZWFuY2hvcnBhcmFtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0VGltZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdEFuY2hvclBvc2l0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGZpcnN0QW5jaG9yLngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGZpcnN0QW5jaG9yLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2VzOiBlZGdlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgIGVkZ2VDb250YWluaW5nRmlyc3RBbmNob3IgPSBlZGdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgZmlyc3RBbmNob3JQb2ludEZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3kub24oXCJlZGdlZWRpdGluZy5tb3ZlZW5kXCIsIGZ1bmN0aW9uIChlLCBlZGdlcykge1xyXG4gICAgICAgICAgICBpZiAobW92ZWFuY2hvcnBhcmFtICE9IHVuZGVmaW5lZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluaXRpYWxQb3MgPSBtb3ZlYW5jaG9ycGFyYW0uZmlyc3RBbmNob3JQb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIHZhciBtb3ZlZEZpcnN0QW5jaG9yID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHg6IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2VDb250YWluaW5nRmlyc3RBbmNob3IpWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHk6IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2VDb250YWluaW5nRmlyc3RBbmNob3IpWzFdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBtb3ZlYW5jaG9ycGFyYW0ucG9zaXRpb25EaWZmID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHg6IC1tb3ZlZEZpcnN0QW5jaG9yLnggKyBpbml0aWFsUG9zLngsXHJcbiAgICAgICAgICAgICAgICAgICAgeTogLW1vdmVkRmlyc3RBbmNob3IueSArIGluaXRpYWxQb3MueVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBtb3ZlYW5jaG9ycGFyYW0uZmlyc3RBbmNob3JQb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihvcHRpb25zKCkudW5kb2FibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjeS51bmRvUmVkbygpLmRvKFwibW92ZUFuY2hvclBvaW50c1wiLCBtb3ZlYW5jaG9ycGFyYW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIG1vdmVhbmNob3JwYXJhbSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjeS5vbignY3h0dGFwJywgZUN4dFRhcCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgIHZhciB0YXJnZXRJc0VkZ2UgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHRhcmdldElzRWRnZSA9IHRhcmdldC5pc0VkZ2UoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNhdGNoKGVycil7XHJcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgaGVyZSBqdXN0IHRvIHN1cHByZXNzIHRoZSBlcnJvclxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBlZGdlLCB0eXBlO1xyXG4gICAgICAgICAgaWYodGFyZ2V0SXNFZGdlKXtcclxuICAgICAgICAgICAgZWRnZSA9IHRhcmdldDtcclxuICAgICAgICAgICAgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgZWRnZSA9IGFuY2hvck1hbmFnZXIuZWRnZTsgICAgICAgICAgXHJcbiAgICAgICAgICAgIHR5cGUgPSBhbmNob3JNYW5hZ2VyLmVkZ2VUeXBlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBtZW51cyA9IGN5LmNvbnRleHRNZW51cygnZ2V0Jyk7IC8vIGdldCBjb250ZXh0IG1lbnVzIGluc3RhbmNlXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmKCFlZGdlVG9IaWdobGlnaHQgfHwgZWRnZVRvSGlnaGxpZ2h0LmlkKCkgIT0gZWRnZS5pZCgpIHx8IGFuY2hvclBvaW50VXRpbGl0aWVzLmlzSWdub3JlZEVkZ2UoZWRnZSkgfHxcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgIT09IGVkZ2UpIHtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShhZGRCZW5kUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgY3lQb3MgPSBldmVudC5wb3NpdGlvbiB8fCBldmVudC5jeVBvc2l0aW9uO1xyXG4gICAgICAgICAgdmFyIHNlbGVjdGVkSW5kZXggPSBnZXRDb250YWluaW5nU2hhcGVJbmRleChjeVBvcy54LCBjeVBvcy55LCBlZGdlKTtcclxuICAgICAgICAgIC8vIG5vdCBjbGlja2VkIG9uIGFuIGFuY2hvclxyXG4gICAgICAgICAgaWYgKHNlbGVjdGVkSW5kZXggPT0gLTEpIHtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShyZW1vdmVDb250cm9sUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICBpZih0eXBlID09PSAnY29udHJvbCcgJiYgdGFyZ2V0SXNFZGdlKXtcclxuICAgICAgICAgICAgICBtZW51cy5zaG93TWVudUl0ZW0oYWRkQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0oYWRkQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHR5cGUgPT09ICdiZW5kJyAmJiB0YXJnZXRJc0VkZ2Upe1xyXG4gICAgICAgICAgICAgIG1lbnVzLnNob3dNZW51SXRlbShhZGRCZW5kUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShhZGRDb250cm9sUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRhcmdldElzRWRnZSl7XHJcbiAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKGFkZEJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZEJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuY3VycmVudEN0eFBvcyA9IGN5UG9zO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gY2xpY2tlZCBvbiBhbiBhbmNob3JcclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0oYWRkQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIGlmKHR5cGUgPT09ICdjb250cm9sJyl7XHJcbiAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKHJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgaWYgKG9wdHMuZW5hYmxlTXVsdGlwbGVBbmNob3JSZW1vdmFsT3B0aW9uICYmIFxyXG4gICAgICAgICAgICAgICAgICBlZGdlLmhhc0NsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzbXVsdGlwbGVjb250cm9scG9pbnRzJykpIHtcclxuICAgICAgICAgICAgICAgIG1lbnVzLnNob3dNZW51SXRlbShyZW1vdmVBbGxDb250cm9sUG9pbnRDdHhNZW51SWQpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHR5cGUgPT09ICdiZW5kJyl7XHJcbiAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKHJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQWxsQ29udHJvbFBvaW50Q3R4TWVudUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhbmNob3JQb2ludFV0aWxpdGllcy5jdXJyZW50QW5jaG9ySW5kZXggPSBzZWxlY3RlZEluZGV4O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLmN1cnJlbnRDdHhFZGdlID0gZWRnZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBjeS5vbignY3llZGdlZWRpdGluZy5jaGFuZ2VBbmNob3JQb2ludHMnLCAnZWRnZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgdmFyIGVkZ2UgPSB0aGlzO1xyXG4gICAgICAgICAgY3kuc3RhcnRCYXRjaCgpO1xyXG4gICAgICAgICAgY3kuZWRnZXMoKS51bnNlbGVjdCgpOyBcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgIC8vIExpc3RlbmVyIGRlZmluZWQgaW4gb3RoZXIgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAvLyBNaWdodCBoYXZlIGNvbXBhdGliaWxpdHkgaXNzdWVzIGFmdGVyIHRoZSB1bmJ1bmRsZWQgYmV6aWVyICAgIFxyXG4gICAgICAgICAgY3kudHJpZ2dlcignYmVuZFBvaW50TW92ZW1lbnQnKTsgICAgXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGN5LmVuZEJhdGNoKCk7ICAgICAgICAgIFxyXG4gICAgICAgICAgcmVmcmVzaERyYXdzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICBcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHNlbGVjdGVkRWRnZXM7XHJcbiAgICAgIHZhciBhbmNob3JzTW92aW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAvLyB0cmFjayBhcnJvdyBrZXkgcHJlc3NlcywgZGVmYXVsdCBmYWxzZVxyXG4gICAgICAvLyBldmVudC5rZXlDb2RlIG5vcm1hbGx5IHJldHVybnMgbnVtYmVyXHJcbiAgICAgIC8vIGJ1dCBKUyB3aWxsIGNvbnZlcnQgdG8gc3RyaW5nIGFueXdheVxyXG4gICAgICB2YXIga2V5cyA9IHtcclxuICAgICAgICAnMzcnOiBmYWxzZSxcclxuICAgICAgICAnMzgnOiBmYWxzZSxcclxuICAgICAgICAnMzknOiBmYWxzZSxcclxuICAgICAgICAnNDAnOiBmYWxzZVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgZnVuY3Rpb24ga2V5RG93bihlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHNob3VsZE1vdmUgPSB0eXBlb2Ygb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cyA9PT0gJ2Z1bmN0aW9uJ1xyXG4gICAgICAgICAgICAgID8gb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cygpIDogb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cztcclxuXHJcbiAgICAgICAgICBpZiAoIXNob3VsZE1vdmUpIHtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy9DaGVja3MgaWYgdGhlIHRhZ25hbWUgaXMgdGV4dGFyZWEgb3IgaW5wdXRcclxuICAgICAgICAgIHZhciB0biA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQudGFnTmFtZTtcclxuICAgICAgICAgIGlmICh0biAhPSBcIlRFWFRBUkVBXCIgJiYgdG4gIT0gXCJJTlBVVFwiKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHN3aXRjaChlLmtleUNvZGUpe1xyXG4gICAgICAgICAgICAgICAgICBjYXNlIDM3OiBjYXNlIDM5OiBjYXNlIDM4OiAgY2FzZSA0MDogLy8gQXJyb3cga2V5c1xyXG4gICAgICAgICAgICAgICAgICBjYXNlIDMyOiBlLnByZXZlbnREZWZhdWx0KCk7IGJyZWFrOyAvLyBTcGFjZVxyXG4gICAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhazsgLy8gZG8gbm90IGJsb2NrIG90aGVyIGtleXNcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA8ICczNycgfHwgZS5rZXlDb2RlID4gJzQwJykge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGtleXNbZS5rZXlDb2RlXSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgIC8vQ2hlY2tzIGlmIG9ubHkgZWRnZXMgYXJlIHNlbGVjdGVkIChub3QgYW55IG5vZGUpIGFuZCBpZiBvbmx5IDEgZWRnZSBpcyBzZWxlY3RlZFxyXG4gICAgICAgICAgICAgIC8vSWYgdGhlIHNlY29uZCBjaGVja2luZyBpcyByZW1vdmVkIHRoZSBhbmNob3JzIG9mIG11bHRpcGxlIGVkZ2VzIHdvdWxkIG1vdmVcclxuICAgICAgICAgICAgICBpZiAoY3kuZWRnZXMoXCI6c2VsZWN0ZWRcIikubGVuZ3RoICE9IGN5LmVsZW1lbnRzKFwiOnNlbGVjdGVkXCIpLmxlbmd0aCB8fCBjeS5lZGdlcyhcIjpzZWxlY3RlZFwiKS5sZW5ndGggIT0gMSlcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmICghYW5jaG9yc01vdmluZylcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRWRnZXMgPSBjeS5lZGdlcygnOnNlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgIGN5LnRyaWdnZXIoXCJlZGdlZWRpdGluZy5tb3Zlc3RhcnRcIiwgW3NlbGVjdGVkRWRnZXNdKTtcclxuICAgICAgICAgICAgICAgICAgYW5jaG9yc01vdmluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHZhciBtb3ZlU3BlZWQgPSAzO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIC8vIGRvZXNuJ3QgbWFrZSBzZW5zZSBpZiBhbHQgYW5kIHNoaWZ0IGJvdGggcHJlc3NlZFxyXG4gICAgICAgICAgICAgIGlmKGUuYWx0S2V5ICYmIGUuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSBpZiAoZS5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgIG1vdmVTcGVlZCA9IDE7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGUuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAgICAgIG1vdmVTcGVlZCA9IDEwO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgdmFyIHVwQXJyb3dDb2RlID0gMzg7XHJcbiAgICAgICAgICAgICAgdmFyIGRvd25BcnJvd0NvZGUgPSA0MDtcclxuICAgICAgICAgICAgICB2YXIgbGVmdEFycm93Q29kZSA9IDM3O1xyXG4gICAgICAgICAgICAgIHZhciByaWdodEFycm93Q29kZSA9IDM5O1xyXG5cclxuICAgICAgICAgICAgICB2YXIgZHggPSAwO1xyXG4gICAgICAgICAgICAgIHZhciBkeSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgIGR4ICs9IGtleXNbcmlnaHRBcnJvd0NvZGVdID8gbW92ZVNwZWVkIDogMDtcclxuICAgICAgICAgICAgICBkeCAtPSBrZXlzW2xlZnRBcnJvd0NvZGVdID8gbW92ZVNwZWVkIDogMDtcclxuICAgICAgICAgICAgICBkeSArPSBrZXlzW2Rvd25BcnJvd0NvZGVdID8gbW92ZVNwZWVkIDogMDtcclxuICAgICAgICAgICAgICBkeSAtPSBrZXlzW3VwQXJyb3dDb2RlXSA/IG1vdmVTcGVlZCA6IDA7XHJcblxyXG4gICAgICAgICAgICAgIG1vdmVBbmNob3JQb2ludHMoe3g6ZHgsIHk6ZHl9LCBzZWxlY3RlZEVkZ2VzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBmdW5jdGlvbiBrZXlVcChlKSB7XHJcblxyXG4gICAgICAgICAgaWYgKGUua2V5Q29kZSA8ICczNycgfHwgZS5rZXlDb2RlID4gJzQwJykge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIGtleXNbZS5rZXlDb2RlXSA9IGZhbHNlO1xyXG4gICAgICAgICAgdmFyIHNob3VsZE1vdmUgPSB0eXBlb2Ygb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cyA9PT0gJ2Z1bmN0aW9uJ1xyXG4gICAgICAgICAgICAgID8gb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cygpIDogb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cztcclxuXHJcbiAgICAgICAgICBpZiAoIXNob3VsZE1vdmUpIHtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY3kudHJpZ2dlcihcImVkZ2VlZGl0aW5nLm1vdmVlbmRcIiwgW3NlbGVjdGVkRWRnZXNdKTtcclxuICAgICAgICAgIHNlbGVjdGVkRWRnZXMgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBhbmNob3JzTW92aW5nID0gZmFsc2U7XHJcblxyXG4gICAgICB9XHJcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsa2V5RG93biwgdHJ1ZSk7XHJcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLGtleVVwLCB0cnVlKTtcclxuXHJcbiAgICAgICRjb250YWluZXIuZGF0YSgnY3llZGdlZWRpdGluZycsIGRhdGEpO1xyXG4gICAgfSxcclxuICAgIHVuYmluZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN5Lm9mZigncmVtb3ZlJywgJ25vZGUnLCBlUmVtb3ZlKVxyXG4gICAgICAgICAgLm9mZignYWRkJywgJ25vZGUnLCBlQWRkKVxyXG4gICAgICAgICAgLm9mZignc3R5bGUnLCAnZWRnZS5lZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50czpzZWxlY3RlZCwgZWRnZS5lZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50czpzZWxlY3RlZCcsIGVTdHlsZSlcclxuICAgICAgICAgIC5vZmYoJ3NlbGVjdCcsICdlZGdlJywgZVNlbGVjdClcclxuICAgICAgICAgIC5vZmYoJ3Vuc2VsZWN0JywgJ2VkZ2UnLCBlVW5zZWxlY3QpXHJcbiAgICAgICAgICAub2ZmKCd0YXBzdGFydCcsIGVUYXBTdGFydClcclxuICAgICAgICAgIC5vZmYoJ3RhcHN0YXJ0JywgJ2VkZ2UnLCBlVGFwU3RhcnRPbkVkZ2UpXHJcbiAgICAgICAgICAub2ZmKCd0YXBkcmFnJywgZVRhcERyYWcpXHJcbiAgICAgICAgICAub2ZmKCd0YXBlbmQnLCBlVGFwRW5kKVxyXG4gICAgICAgICAgLm9mZignY3h0dGFwJywgZUN4dFRhcClcclxuICAgICAgICAgIC5vZmYoJ2RyYWcnLCAnbm9kZScsZURyYWcpO1xyXG5cclxuICAgICAgICBjeS51bmJpbmQoXCJ6b29tIHBhblwiLCBlWm9vbSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaWYgKGZ1bmN0aW9uc1tmbl0pIHtcclxuICAgIHJldHVybiBmdW5jdGlvbnNbZm5dLmFwcGx5KCQoY3kuY29udGFpbmVyKCkpLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBmbiA9PSAnb2JqZWN0JyB8fCAhZm4pIHtcclxuICAgIHJldHVybiBmdW5jdGlvbnMuaW5pdC5hcHBseSgkKGN5LmNvbnRhaW5lcigpKSwgYXJndW1lbnRzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgJC5lcnJvcignTm8gc3VjaCBmdW5jdGlvbiBgJyArIGZuICsgJ2AgZm9yIGN5dG9zY2FwZS5qcy1lZGdlLWVkaXRpbmcnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiAkKHRoaXMpO1xyXG59O1xyXG4iLCJ2YXIgZGVib3VuY2UgPSAoZnVuY3Rpb24gKCkge1xyXG4gIC8qKlxyXG4gICAqIGxvZGFzaCAzLjEuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cclxuICAgKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXHJcbiAgICogQ29weXJpZ2h0IDIwMTItMjAxNSBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cclxuICAgKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxyXG4gICAqIENvcHlyaWdodCAyMDA5LTIwMTUgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcclxuICAgKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxyXG4gICAqL1xyXG4gIC8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXHJcbiAgdmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcclxuXHJcbiAgLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cclxuICB2YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXHJcbiAgICAgICAgICBuYXRpdmVOb3cgPSBEYXRlLm5vdztcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgVW5peCBlcG9jaFxyXG4gICAqICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxyXG4gICAqXHJcbiAgICogQHN0YXRpY1xyXG4gICAqIEBtZW1iZXJPZiBfXHJcbiAgICogQGNhdGVnb3J5IERhdGVcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqXHJcbiAgICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xyXG4gICAqICAgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTtcclxuICAgKiB9LCBfLm5vdygpKTtcclxuICAgKiAvLyA9PiBsb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBmdW5jdGlvbiB0byBiZSBpbnZva2VkXHJcbiAgICovXHJcbiAgdmFyIG5vdyA9IG5hdGl2ZU5vdyB8fCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXHJcbiAgICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXHJcbiAgICogaW52b2tlZC4gVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGAgbWV0aG9kIHRvIGNhbmNlbFxyXG4gICAqIGRlbGF5ZWQgaW52b2NhdGlvbnMuIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG8gaW5kaWNhdGUgdGhhdCBgZnVuY2BcclxuICAgKiBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuXHJcbiAgICogU3Vic2VxdWVudCBjYWxscyB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0XHJcbiAgICogYGZ1bmNgIGludm9jYXRpb24uXHJcbiAgICpcclxuICAgKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzIGludm9rZWRcclxuICAgKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIGlzXHJcbiAgICogaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxyXG4gICAqXHJcbiAgICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHA6Ly9kcnVwYWxtb3Rpb24uY29tL2FydGljbGUvZGVib3VuY2UtYW5kLXRocm90dGxlLXZpc3VhbC1leHBsYW5hdGlvbilcclxuICAgKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxyXG4gICAqXHJcbiAgICogQHN0YXRpY1xyXG4gICAqIEBtZW1iZXJPZiBfXHJcbiAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV0gU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZ1xyXG4gICAqICBlZGdlIG9mIHRoZSB0aW1lb3V0LlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XSBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlXHJcbiAgICogIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nXHJcbiAgICogIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXHJcbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICpcclxuICAgKiAvLyBhdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4XHJcbiAgICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcclxuICAgKlxyXG4gICAqIC8vIGludm9rZSBgc2VuZE1haWxgIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHNcclxuICAgKiBqUXVlcnkoJyNwb3N0Ym94Jykub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XHJcbiAgICogICAnbGVhZGluZyc6IHRydWUsXHJcbiAgICogICAndHJhaWxpbmcnOiBmYWxzZVxyXG4gICAqIH0pKTtcclxuICAgKlxyXG4gICAqIC8vIGVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHNcclxuICAgKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XHJcbiAgICogalF1ZXJ5KHNvdXJjZSkub24oJ21lc3NhZ2UnLCBfLmRlYm91bmNlKGJhdGNoTG9nLCAyNTAsIHtcclxuICAgKiAgICdtYXhXYWl0JzogMTAwMFxyXG4gICAqIH0pKTtcclxuICAgKlxyXG4gICAqIC8vIGNhbmNlbCBhIGRlYm91bmNlZCBjYWxsXHJcbiAgICogdmFyIHRvZG9DaGFuZ2VzID0gXy5kZWJvdW5jZShiYXRjaExvZywgMTAwMCk7XHJcbiAgICogT2JqZWN0Lm9ic2VydmUobW9kZWxzLnRvZG8sIHRvZG9DaGFuZ2VzKTtcclxuICAgKlxyXG4gICAqIE9iamVjdC5vYnNlcnZlKG1vZGVscywgZnVuY3Rpb24oY2hhbmdlcykge1xyXG4gICAqICAgaWYgKF8uZmluZChjaGFuZ2VzLCB7ICd1c2VyJzogJ3RvZG8nLCAndHlwZSc6ICdkZWxldGUnfSkpIHtcclxuICAgKiAgICAgdG9kb0NoYW5nZXMuY2FuY2VsKCk7XHJcbiAgICogICB9XHJcbiAgICogfSwgWydkZWxldGUnXSk7XHJcbiAgICpcclxuICAgKiAvLyAuLi5hdCBzb21lIHBvaW50IGBtb2RlbHMudG9kb2AgaXMgY2hhbmdlZFxyXG4gICAqIG1vZGVscy50b2RvLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICpcclxuICAgKiAvLyAuLi5iZWZvcmUgMSBzZWNvbmQgaGFzIHBhc3NlZCBgbW9kZWxzLnRvZG9gIGlzIGRlbGV0ZWRcclxuICAgKiAvLyB3aGljaCBjYW5jZWxzIHRoZSBkZWJvdW5jZWQgYHRvZG9DaGFuZ2VzYCBjYWxsXHJcbiAgICogZGVsZXRlIG1vZGVscy50b2RvO1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBhcmdzLFxyXG4gICAgICAgICAgICBtYXhUaW1lb3V0SWQsXHJcbiAgICAgICAgICAgIHJlc3VsdCxcclxuICAgICAgICAgICAgc3RhbXAsXHJcbiAgICAgICAgICAgIHRoaXNBcmcsXHJcbiAgICAgICAgICAgIHRpbWVvdXRJZCxcclxuICAgICAgICAgICAgdHJhaWxpbmdDYWxsLFxyXG4gICAgICAgICAgICBsYXN0Q2FsbGVkID0gMCxcclxuICAgICAgICAgICAgbWF4V2FpdCA9IGZhbHNlLFxyXG4gICAgICAgICAgICB0cmFpbGluZyA9IHRydWU7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xyXG4gICAgfVxyXG4gICAgd2FpdCA9IHdhaXQgPCAwID8gMCA6ICgrd2FpdCB8fCAwKTtcclxuICAgIGlmIChvcHRpb25zID09PSB0cnVlKSB7XHJcbiAgICAgIHZhciBsZWFkaW5nID0gdHJ1ZTtcclxuICAgICAgdHJhaWxpbmcgPSBmYWxzZTtcclxuICAgIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcclxuICAgICAgbGVhZGluZyA9ICEhb3B0aW9ucy5sZWFkaW5nO1xyXG4gICAgICBtYXhXYWl0ID0gJ21heFdhaXQnIGluIG9wdGlvbnMgJiYgbmF0aXZlTWF4KCtvcHRpb25zLm1heFdhaXQgfHwgMCwgd2FpdCk7XHJcbiAgICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICBpZiAodGltZW91dElkKSB7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG1heFRpbWVvdXRJZCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xyXG4gICAgICB9XHJcbiAgICAgIGxhc3RDYWxsZWQgPSAwO1xyXG4gICAgICBtYXhUaW1lb3V0SWQgPSB0aW1lb3V0SWQgPSB0cmFpbGluZ0NhbGwgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY29tcGxldGUoaXNDYWxsZWQsIGlkKSB7XHJcbiAgICAgIGlmIChpZCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dChpZCk7XHJcbiAgICAgIH1cclxuICAgICAgbWF4VGltZW91dElkID0gdGltZW91dElkID0gdHJhaWxpbmdDYWxsID0gdW5kZWZpbmVkO1xyXG4gICAgICBpZiAoaXNDYWxsZWQpIHtcclxuICAgICAgICBsYXN0Q2FsbGVkID0gbm93KCk7XHJcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcclxuICAgICAgICBpZiAoIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgICBhcmdzID0gdGhpc0FyZyA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWxheWVkKCkge1xyXG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3coKSAtIHN0YW1wKTtcclxuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcclxuICAgICAgICBjb21wbGV0ZSh0cmFpbGluZ0NhbGwsIG1heFRpbWVvdXRJZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCByZW1haW5pbmcpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWF4RGVsYXllZCgpIHtcclxuICAgICAgY29tcGxldGUodHJhaWxpbmcsIHRpbWVvdXRJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVib3VuY2VkKCkge1xyXG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICBzdGFtcCA9IG5vdygpO1xyXG4gICAgICB0aGlzQXJnID0gdGhpcztcclxuICAgICAgdHJhaWxpbmdDYWxsID0gdHJhaWxpbmcgJiYgKHRpbWVvdXRJZCB8fCAhbGVhZGluZyk7XHJcblxyXG4gICAgICBpZiAobWF4V2FpdCA9PT0gZmFsc2UpIHtcclxuICAgICAgICB2YXIgbGVhZGluZ0NhbGwgPSBsZWFkaW5nICYmICF0aW1lb3V0SWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKCFtYXhUaW1lb3V0SWQgJiYgIWxlYWRpbmcpIHtcclxuICAgICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IG1heFdhaXQgLSAoc3RhbXAgLSBsYXN0Q2FsbGVkKSxcclxuICAgICAgICAgICAgICAgIGlzQ2FsbGVkID0gcmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gbWF4V2FpdDtcclxuXHJcbiAgICAgICAgaWYgKGlzQ2FsbGVkKSB7XHJcbiAgICAgICAgICBpZiAobWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgICAgIG1heFRpbWVvdXRJZCA9IGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbGFzdENhbGxlZCA9IHN0YW1wO1xyXG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIW1heFRpbWVvdXRJZCkge1xyXG4gICAgICAgICAgbWF4VGltZW91dElkID0gc2V0VGltZW91dChtYXhEZWxheWVkLCByZW1haW5pbmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAoaXNDYWxsZWQgJiYgdGltZW91dElkKSB7XHJcbiAgICAgICAgdGltZW91dElkID0gY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIXRpbWVvdXRJZCAmJiB3YWl0ICE9PSBtYXhXYWl0KSB7XHJcbiAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCB3YWl0KTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobGVhZGluZ0NhbGwpIHtcclxuICAgICAgICBpc0NhbGxlZCA9IHRydWU7XHJcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoaXNDYWxsZWQgJiYgIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgYXJncyA9IHRoaXNBcmcgPSB1bmRlZmluZWQ7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBkZWJvdW5jZWQuY2FuY2VsID0gY2FuY2VsO1xyXG4gICAgcmV0dXJuIGRlYm91bmNlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBbbGFuZ3VhZ2UgdHlwZV0oaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OCkgb2YgYE9iamVjdGAuXHJcbiAgICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXHJcbiAgICpcclxuICAgKiBAc3RhdGljXHJcbiAgICogQG1lbWJlck9mIF9cclxuICAgKiBAY2F0ZWdvcnkgTGFuZ1xyXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICpcclxuICAgKiBfLmlzT2JqZWN0KHt9KTtcclxuICAgKiAvLyA9PiB0cnVlXHJcbiAgICpcclxuICAgKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XHJcbiAgICogLy8gPT4gdHJ1ZVxyXG4gICAqXHJcbiAgICogXy5pc09iamVjdCgxKTtcclxuICAgKiAvLyA9PiBmYWxzZVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XHJcbiAgICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxyXG4gICAgLy8gU2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxIGZvciBtb3JlIGRldGFpbHMuXHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcclxuICAgIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGVib3VuY2U7XHJcblxyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZTsiLCI7KGZ1bmN0aW9uKCl7ICd1c2Ugc3RyaWN0JztcclxuICBcclxuICB2YXIgYW5jaG9yUG9pbnRVdGlsaXRpZXMgPSByZXF1aXJlKCcuL0FuY2hvclBvaW50VXRpbGl0aWVzJyk7XHJcbiAgdmFyIGRlYm91bmNlID0gcmVxdWlyZShcIi4vZGVib3VuY2VcIik7XHJcbiAgXHJcbiAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxyXG4gIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uKCBjeXRvc2NhcGUsICQsIEtvbnZhKXtcclxuICAgIHZhciB1aVV0aWxpdGllcyA9IHJlcXVpcmUoJy4vVUlVdGlsaXRpZXMnKTtcclxuICAgIFxyXG4gICAgaWYoICFjeXRvc2NhcGUgfHwgISQgfHwgIUtvbnZhKXsgcmV0dXJuOyB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIHJlcXVpcmVkIGxpYnJhcmllcyB1bnNwZWNpZmllZFxyXG5cclxuICAgIHZhciBkZWZhdWx0cyA9IHtcclxuICAgICAgLy8gdGhpcyBmdW5jdGlvbiBzcGVjaWZpZXMgdGhlIHBvaXRpb25zIG9mIGJlbmQgcG9pbnRzXHJcbiAgICAgIC8vIHN0cmljdGx5IG5hbWUgdGhlIHByb3BlcnR5ICdiZW5kUG9pbnRQb3NpdGlvbnMnIGZvciB0aGUgZWRnZSB0byBiZSBkZXRlY3RlZCBmb3IgYmVuZCBwb2ludCBlZGl0aXRuZ1xyXG4gICAgICBiZW5kUG9zaXRpb25zRnVuY3Rpb246IGZ1bmN0aW9uKGVsZSkge1xyXG4gICAgICAgIHJldHVybiBlbGUuZGF0YSgnYmVuZFBvaW50UG9zaXRpb25zJyk7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIHRoaXMgZnVuY3Rpb24gc3BlY2lmaWVzIHRoZSBwb2l0aW9ucyBvZiBjb250cm9sIHBvaW50c1xyXG4gICAgICAvLyBzdHJpY3RseSBuYW1lIHRoZSBwcm9wZXJ0eSAnY29udHJvbFBvaW50UG9zaXRpb25zJyBmb3IgdGhlIGVkZ2UgdG8gYmUgZGV0ZWN0ZWQgZm9yIGNvbnRyb2wgcG9pbnQgZWRpdGl0bmdcclxuICAgICAgY29udHJvbFBvc2l0aW9uc0Z1bmN0aW9uOiBmdW5jdGlvbihlbGUpIHtcclxuICAgICAgICByZXR1cm4gZWxlLmRhdGEoJ2NvbnRyb2xQb2ludFBvc2l0aW9ucycpO1xyXG4gICAgICB9LFxyXG4gICAgICAvLyB3aGV0aGVyIHRvIGluaXRpbGl6ZSBiZW5kIGFuZCBjb250cm9sIHBvaW50cyBvbiBjcmVhdGlvbiBvZiB0aGlzIGV4dGVuc2lvbiBhdXRvbWF0aWNhbGx5XHJcbiAgICAgIGluaXRBbmNob3JzQXV0b21hdGljYWxseTogdHJ1ZSxcclxuICAgICAgLy8gdGhlIGNsYXNzZXMgb2YgdGhvc2UgZWRnZXMgdGhhdCBzaG91bGQgYmUgaWdub3JlZFxyXG4gICAgICBpZ25vcmVkQ2xhc3NlczogW10sXHJcbiAgICAgIC8vIHdoZXRoZXIgdGhlIGJlbmQgYW5kIGNvbnRyb2wgZWRpdGluZyBvcGVyYXRpb25zIGFyZSB1bmRvYWJsZSAocmVxdWlyZXMgY3l0b3NjYXBlLXVuZG8tcmVkby5qcylcclxuICAgICAgdW5kb2FibGU6IGZhbHNlLFxyXG4gICAgICAvLyB0aGUgc2l6ZSBvZiBiZW5kIGFuZCBjb250cm9sIHBvaW50IHNoYXBlIGlzIG9idGFpbmVkIGJ5IG11bHRpcGxpbmcgd2lkdGggb2YgZWRnZSB3aXRoIHRoaXMgcGFyYW1ldGVyXHJcbiAgICAgIGFuY2hvclNoYXBlU2l6ZUZhY3RvcjogMyxcclxuICAgICAgLy9zaXplIG9mIGFuY2hvcnBvaW50IGNhbiBiZSBhdXRvIGNoYW5nZWQgdG8gY29tcGVuc2F0ZSB0aGUgaW1wYWN0IG9mIGN5IHpvb21pbmcgbGV2ZWxcclxuICAgICAgZW5hYmxlQW5jaG9yU2l6ZU5vdEltcGFjdEJ5Wm9vbTogZmFsc2UsXHJcbiAgICAgIC8vIHotaW5kZXggdmFsdWUgb2YgdGhlIGNhbnZhcyBpbiB3aGljaCBiZW5kIGFuZCBjb250cm9sIHBvaW50cyBhcmUgZHJhd25cclxuICAgICAgekluZGV4OiA5OTksICAgICAgXHJcbiAgICAgIC8vIHdoZXRoZXIgdG8gc3RhcnQgdGhlIHBsdWdpbiBpbiB0aGUgZW5hYmxlZCBzdGF0ZVxyXG4gICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAvL0FuIG9wdGlvbiB0aGF0IGNvbnRyb2xzIHRoZSBkaXN0YW5jZSB3aXRoaW4gd2hpY2ggYSBiZW5kIHBvaW50IGlzIGNvbnNpZGVyZWQgXCJuZWFyXCIgdGhlIGxpbmUgc2VnbWVudCBiZXR3ZWVuIGl0cyB0d28gbmVpZ2hib3JzIGFuZCB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZFxyXG4gICAgICBiZW5kUmVtb3ZhbFNlbnNpdGl2aXR5IDogOCxcclxuICAgICAgLy8gdGl0bGUgb2YgYWRkIGJlbmQgcG9pbnQgbWVudSBpdGVtIChVc2VyIG1heSBuZWVkIHRvIGFkanVzdCB3aWR0aCBvZiBtZW51IGl0ZW1zIGFjY29yZGluZyB0byBsZW5ndGggb2YgdGhpcyBvcHRpb24pXHJcbiAgICAgIGFkZEJlbmRNZW51SXRlbVRpdGxlOiBcIkFkZCBCZW5kIFBvaW50XCIsXHJcbiAgICAgIC8vIHRpdGxlIG9mIHJlbW92ZSBiZW5kIHBvaW50IG1lbnUgaXRlbSAoVXNlciBtYXkgbmVlZCB0byBhZGp1c3Qgd2lkdGggb2YgbWVudSBpdGVtcyBhY2NvcmRpbmcgdG8gbGVuZ3RoIG9mIHRoaXMgb3B0aW9uKVxyXG4gICAgICByZW1vdmVCZW5kTWVudUl0ZW1UaXRsZTogXCJSZW1vdmUgQmVuZCBQb2ludFwiLFxyXG4gICAgICAvLyB0aXRsZSBvZiByZW1vdmUgYWxsIGJlbmQgcG9pbnRzIG1lbnUgaXRlbVxyXG4gICAgICByZW1vdmVBbGxCZW5kTWVudUl0ZW1UaXRsZTogXCJSZW1vdmUgQWxsIEJlbmQgUG9pbnRzXCIsXHJcbiAgICAgIC8vIHRpdGxlIG9mIGFkZCBjb250cm9sIHBvaW50IG1lbnUgaXRlbSAoVXNlciBtYXkgbmVlZCB0byBhZGp1c3Qgd2lkdGggb2YgbWVudSBpdGVtcyBhY2NvcmRpbmcgdG8gbGVuZ3RoIG9mIHRoaXMgb3B0aW9uKVxyXG4gICAgICBhZGRDb250cm9sTWVudUl0ZW1UaXRsZTogXCJBZGQgQ29udHJvbCBQb2ludFwiLFxyXG4gICAgICAvLyB0aXRsZSBvZiByZW1vdmUgY29udHJvbCBwb2ludCBtZW51IGl0ZW0gKFVzZXIgbWF5IG5lZWQgdG8gYWRqdXN0IHdpZHRoIG9mIG1lbnUgaXRlbXMgYWNjb3JkaW5nIHRvIGxlbmd0aCBvZiB0aGlzIG9wdGlvbilcclxuICAgICAgcmVtb3ZlQ29udHJvbE1lbnVJdGVtVGl0bGU6IFwiUmVtb3ZlIENvbnRyb2wgUG9pbnRcIixcclxuICAgICAgLy8gdGl0bGUgb2YgcmVtb3ZlIGFsbCBjb250cm9sIHBvaW50cyBtZW51IGl0ZW1cclxuICAgICAgcmVtb3ZlQWxsQ29udHJvbE1lbnVJdGVtVGl0bGU6IFwiUmVtb3ZlIEFsbCBDb250cm9sIFBvaW50c1wiLFxyXG4gICAgICAvLyB3aGV0aGVyIHRoZSBiZW5kIGFuZCBjb250cm9sIHBvaW50cyBjYW4gYmUgbW92ZWQgYnkgYXJyb3dzXHJcbiAgICAgIG1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIHdoZXRoZXIgJ1JlbW92ZSBhbGwgYmVuZCBwb2ludHMnIGFuZCAnUmVtb3ZlIGFsbCBjb250cm9sIHBvaW50cycgb3B0aW9ucyBzaG91bGQgYmUgcHJlc2VudGVkXHJcbiAgICAgIGVuYWJsZU11bHRpcGxlQW5jaG9yUmVtb3ZhbE9wdGlvbjogZmFsc2UsXHJcbiAgICAgIC8vIHdoZXRoZXIgYWxsb3dzIGFkZGluZyBiZW5kaW5nIHBvaW50IGJ5IGRyYWdpbmcgZWRnZSB3aXRob3V0IHVzZWluZyBjdHhtZW51LCBkZWZhdWx0IGlzIHRydWVcclxuICAgICAgZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnOnRydWUsXHJcbiAgICAgIC8vIGhvdyB0byBzbWFydGx5IG1vdmUgdGhlIGFuY2hvciBwb2ludCB0byBwZXJmZWN0IDAgNDUgb3IgOTAgZGVncmVlIHBvc2l0aW9uLCB1bml0IGlzIHB4XHJcbiAgICAgIHN0aWNreUFuY2hvclRvbGVyZW5jZTogLTEsICAvLy0xIGFjdHVhbGx5IGRpc2FibGUgdGhpcyBmZWF0dXJlLCBjaGFuZ2UgaXQgdG8gMjAgdG8gdGVzdCB0aGUgZmVhdHVyZVxyXG4gICAgICAvL2F1dG9tYXRpY2FsbHkgcmVtb3ZlIGFuY2hvciBpZiBpdHMgcHJldiBzZWdlbWVudCBhbmQgbmV4dCBzZWdtZW50IGlzIGFsbW9zdCBpbiBhIHNhbWUgbGluZVxyXG4gICAgICBlbmFibGVSZW1vdmVBbmNob3JNaWRPZk5lYXJMaW5lOnRydWVcclxuICAgIH07XHJcbiAgICBcclxuICAgIHZhciBvcHRpb25zO1xyXG4gICAgdmFyIGluaXRpYWxpemVkID0gZmFsc2U7XHJcbiAgICBcclxuICAgIC8vIE1lcmdlIGRlZmF1bHQgb3B0aW9ucyB3aXRoIHRoZSBvbmVzIGNvbWluZyBmcm9tIHBhcmFtZXRlclxyXG4gICAgZnVuY3Rpb24gZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKSB7XHJcbiAgICAgIHZhciBvYmogPSB7fTtcclxuXHJcbiAgICAgIGZvciAodmFyIGkgaW4gZGVmYXVsdHMpIHtcclxuICAgICAgICBvYmpbaV0gPSBkZWZhdWx0c1tpXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gU1BMSVQgRlVOQ1RJT05BTElUWT9cclxuICAgICAgICBpZihpID09IFwiYmVuZFJlbW92YWxTZW5zaXRpdml0eVwiKXtcclxuICAgICAgICAgIHZhciB2YWx1ZSA9IG9wdGlvbnNbaV07XHJcbiAgICAgICAgICAgaWYoIWlzTmFOKHZhbHVlKSlcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaWYodmFsdWUgPj0gMCAmJiB2YWx1ZSA8PSAyMCl7XHJcbiAgICAgICAgICAgICAgICBvYmpbaV0gPSBvcHRpb25zW2ldO1xyXG4gICAgICAgICAgICAgIH1lbHNlIGlmKHZhbHVlIDwgMCl7XHJcbiAgICAgICAgICAgICAgICBvYmpbaV0gPSAwXHJcbiAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBvYmpbaV0gPSAyMFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBvYmpbaV0gPSBvcHRpb25zW2ldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBjeXRvc2NhcGUoICdjb3JlJywgJ2VkZ2VFZGl0aW5nJywgZnVuY3Rpb24ob3B0cyl7XHJcbiAgICAgIHZhciBjeSA9IHRoaXM7XHJcbiAgICAgIFxyXG4gICAgICBpZiggb3B0cyA9PT0gJ2luaXRpYWxpemVkJyApIHtcclxuICAgICAgICByZXR1cm4gaW5pdGlhbGl6ZWQ7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGlmKCBvcHRzICE9PSAnZ2V0JyApIHtcclxuICAgICAgICAvLyBtZXJnZSB0aGUgb3B0aW9ucyB3aXRoIGRlZmF1bHQgb25lc1xyXG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoZGVmYXVsdHMsIG9wdHMpO1xyXG4gICAgICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIGVkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzIGNzcyBjbGFzc1xyXG4gICAgICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJy5lZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpLmNzcyh7XHJcbiAgICAgICAgICAnY3VydmUtc3R5bGUnOiAnc2VnbWVudHMnLFxyXG4gICAgICAgICAgJ3NlZ21lbnQtZGlzdGFuY2VzJzogZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RGlzdGFuY2VzU3RyaW5nKGVsZSwgJ2JlbmQnKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAnc2VnbWVudC13ZWlnaHRzJzogZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0V2VpZ2h0c1N0cmluZyhlbGUsICdiZW5kJyk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgJ2VkZ2UtZGlzdGFuY2VzJzogJ25vZGUtcG9zaXRpb24nXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGRlZmluZSBlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cyBjc3MgY2xhc3NcclxuICAgICAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCcuZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKS5jc3Moe1xyXG4gICAgICAgICAgJ2N1cnZlLXN0eWxlJzogJ3VuYnVuZGxlZC1iZXppZXInLFxyXG4gICAgICAgICAgJ2NvbnRyb2wtcG9pbnQtZGlzdGFuY2VzJzogZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RGlzdGFuY2VzU3RyaW5nKGVsZSwgJ2NvbnRyb2wnKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAnY29udHJvbC1wb2ludC13ZWlnaHRzJzogZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0V2VpZ2h0c1N0cmluZyhlbGUsICdjb250cm9sJyk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgJ2VkZ2UtZGlzdGFuY2VzJzogJ25vZGUtcG9zaXRpb24nXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLnNldElnbm9yZWRDbGFzc2VzKG9wdGlvbnMuaWdub3JlZENsYXNzZXMpO1xyXG5cclxuICAgICAgICAvLyBpbml0IGJlbmQgcG9zaXRpb25zIGNvbmRpdGlvbmFsbHlcclxuICAgICAgICBpZiAob3B0aW9ucy5pbml0QW5jaG9yc0F1dG9tYXRpY2FsbHkpIHtcclxuICAgICAgICAgIC8vIENIRUNLIFRISVMsIG9wdGlvbnMuaWdub3JlZENsYXNzZXMgVU5VU0VEXHJcbiAgICAgICAgICBhbmNob3JQb2ludFV0aWxpdGllcy5pbml0QW5jaG9yUG9pbnRzKG9wdGlvbnMuYmVuZFBvc2l0aW9uc0Z1bmN0aW9uLCBvcHRpb25zLmNvbnRyb2xQb3NpdGlvbnNGdW5jdGlvbiwgY3kuZWRnZXMoKSwgb3B0aW9ucy5pZ25vcmVkQ2xhc3Nlcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihvcHRpb25zLmVuYWJsZWQpIFxyXG4gICAgICAgICAgdWlVdGlsaXRpZXMob3B0aW9ucywgY3kpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHVpVXRpbGl0aWVzKFwidW5iaW5kXCIsIGN5KTtcclxuICAgICAgfVxyXG4gICAgXHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IGluaXRpYWxpemVkID8ge1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgKiBnZXQgYmVuZCBvciBjb250cm9sIHBvaW50cyBvZiB0aGUgZ2l2ZW4gZWRnZSBpbiBhbiBhcnJheSBBLFxyXG4gICAgICAgICogQVsyICogaV0gaXMgdGhlIHggY29vcmRpbmF0ZSBhbmQgQVsyICogaSArIDFdIGlzIHRoZSB5IGNvb3JkaW5hdGVcclxuICAgICAgICAqIG9mIHRoZSBpdGggYmVuZCBwb2ludC4gKFJldHVybnMgdW5kZWZpbmVkIGlmIHRoZSBjdXJ2ZSBzdHlsZSBpcyBub3Qgc2VnbWVudHMgbm9yIHVuYnVuZGxlZCBiZXppZXIpXHJcbiAgICAgICAgKi9cclxuICAgICAgICBnZXRBbmNob3JzQXNBcnJheTogZnVuY3Rpb24oZWxlKSB7XHJcbiAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWxlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIEluaXRpbGl6ZSBwb2ludHMgZm9yIHRoZSBnaXZlbiBlZGdlcyB1c2luZyAnb3B0aW9ucy5iZW5kUG9zaXRpb25zRnVuY3Rpb24nXHJcbiAgICAgICAgaW5pdEFuY2hvclBvaW50czogZnVuY3Rpb24oZWxlcykge1xyXG4gICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaW5pdEFuY2hvclBvaW50cyhvcHRpb25zLmJlbmRQb3NpdGlvbnNGdW5jdGlvbiwgb3B0aW9ucy5jb250cm9sUG9zaXRpb25zRnVuY3Rpb24sIGVsZXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGVsZXRlU2VsZWN0ZWRBbmNob3I6IGZ1bmN0aW9uKGVsZSwgaW5kZXgpIHtcclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLnJlbW92ZUFuY2hvcihlbGUsIGluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7IC8vIGNoYWluYWJpbGl0eVxyXG4gICAgfSApO1xyXG5cclxuICB9O1xyXG5cclxuICBpZiggdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMgKXsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xyXG4gIH1cclxuXHJcbiAgaWYoIHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQgKXsgLy8gZXhwb3NlIGFzIGFuIGFtZC9yZXF1aXJlanMgbW9kdWxlXHJcbiAgICBkZWZpbmUoJ2N5dG9zY2FwZS1lZGdlLWVkaXRpbmcnLCBmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4gcmVnaXN0ZXI7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmKCB0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJyAmJiAkICYmIEtvbnZhKXsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcclxuICAgIHJlZ2lzdGVyKCBjeXRvc2NhcGUsICQsIEtvbnZhICk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuIiwidmFyIHJlY29ubmVjdGlvblV0aWxpdGllcyA9IHtcclxuXHJcbiAgICAvLyBjcmVhdGVzIGFuZCByZXR1cm5zIGEgZHVtbXkgbm9kZSB3aGljaCBpcyBjb25uZWN0ZWQgdG8gdGhlIGRpc2Nvbm5lY3RlZCBlZGdlXHJcbiAgICBkaXNjb25uZWN0RWRnZTogZnVuY3Rpb24gKGVkZ2UsIGN5LCBwb3NpdGlvbiwgZGlzY29ubmVjdGVkRW5kKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGR1bW15Tm9kZSA9IHtcclxuICAgICAgICAgICAgZGF0YTogeyBcclxuICAgICAgICAgICAgICBpZDogJ253dF9yZWNvbm5lY3RFZGdlX2R1bW15JyxcclxuICAgICAgICAgICAgICBwb3J0czogW10sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgd2lkdGg6IDEsXHJcbiAgICAgICAgICAgICAgaGVpZ2h0OiAxLFxyXG4gICAgICAgICAgICAgICd2aXNpYmlsaXR5JzogJ2hpZGRlbidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVuZGVyZWRQb3NpdGlvbjogcG9zaXRpb25cclxuICAgICAgICB9O1xyXG4gICAgICAgIGN5LmFkZChkdW1teU5vZGUpO1xyXG5cclxuICAgICAgICB2YXIgbG9jID0gKGRpc2Nvbm5lY3RlZEVuZCA9PT0gJ3NvdXJjZScpID8gXHJcbiAgICAgICAgICAgIHtzb3VyY2U6IGR1bW15Tm9kZS5kYXRhLmlkfSA6IFxyXG4gICAgICAgICAgICB7dGFyZ2V0OiBkdW1teU5vZGUuZGF0YS5pZH07XHJcblxyXG4gICAgICAgIGVkZ2UgPSBlZGdlLm1vdmUobG9jKVswXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZHVtbXlOb2RlOiBjeS5ub2RlcyhcIiNcIiArIGR1bW15Tm9kZS5kYXRhLmlkKVswXSxcclxuICAgICAgICAgICAgZWRnZTogZWRnZVxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbm5lY3RFZGdlOiBmdW5jdGlvbiAoZWRnZSwgbm9kZSwgbG9jYXRpb24pIHtcclxuICAgICAgICBpZighZWRnZS5pc0VkZ2UoKSB8fCAhbm9kZS5pc05vZGUoKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgbG9jID0ge307XHJcbiAgICAgICAgaWYobG9jYXRpb24gPT09ICdzb3VyY2UnKVxyXG4gICAgICAgICAgICBsb2Muc291cmNlID0gbm9kZS5pZCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYobG9jYXRpb24gPT09ICd0YXJnZXQnKVxyXG4gICAgICAgICAgICBsb2MudGFyZ2V0ID0gbm9kZS5pZCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICByZXR1cm4gZWRnZS5tb3ZlKGxvYylbMF07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHlFZGdlOiBmdW5jdGlvbiAob2xkRWRnZSwgbmV3RWRnZSkge1xyXG4gICAgICAgIHRoaXMuY29weUFuY2hvcnMob2xkRWRnZSwgbmV3RWRnZSk7XHJcbiAgICAgICAgdGhpcy5jb3B5U3R5bGUob2xkRWRnZSwgbmV3RWRnZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHlTdHlsZTogZnVuY3Rpb24gKG9sZEVkZ2UsIG5ld0VkZ2UpIHtcclxuICAgICAgICBpZihvbGRFZGdlICYmIG5ld0VkZ2Upe1xyXG4gICAgICAgICAgICBuZXdFZGdlLmRhdGEoJ2xpbmUtY29sb3InLCBvbGRFZGdlLmRhdGEoJ2xpbmUtY29sb3InKSk7XHJcbiAgICAgICAgICAgIG5ld0VkZ2UuZGF0YSgnd2lkdGgnLCBvbGRFZGdlLmRhdGEoJ3dpZHRoJykpO1xyXG4gICAgICAgICAgICBuZXdFZGdlLmRhdGEoJ2NhcmRpbmFsaXR5Jywgb2xkRWRnZS5kYXRhKCdjYXJkaW5hbGl0eScpKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHlBbmNob3JzOiBmdW5jdGlvbiAob2xkRWRnZSwgbmV3RWRnZSkge1xyXG4gICAgICAgIGlmKG9sZEVkZ2UuaGFzQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJykpe1xyXG4gICAgICAgICAgICB2YXIgYnBEaXN0YW5jZXMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzJyk7XHJcbiAgICAgICAgICAgIHZhciBicFdlaWdodHMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cycpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcycsIGJwRGlzdGFuY2VzKTtcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMnLCBicFdlaWdodHMpO1xyXG4gICAgICAgICAgICBuZXdFZGdlLmFkZENsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKG9sZEVkZ2UuaGFzQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJykpe1xyXG4gICAgICAgICAgICB2YXIgYnBEaXN0YW5jZXMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzJyk7XHJcbiAgICAgICAgICAgIHZhciBicFdlaWdodHMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cycpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcycsIGJwRGlzdGFuY2VzKTtcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMnLCBicFdlaWdodHMpO1xyXG4gICAgICAgICAgICBuZXdFZGdlLmFkZENsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob2xkRWRnZS5oYXNDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc211bHRpcGxlYmVuZHBvaW50cycpKSB7XHJcbiAgICAgICAgICAgIG5ld0VkZ2UuYWRkQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNtdWx0aXBsZWJlbmRwb2ludHMnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob2xkRWRnZS5oYXNDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc211bHRpcGxlY29udHJvbHBvaW50cycpKSB7XHJcbiAgICAgICAgICAgIG5ld0VkZ2UuYWRkQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNtdWx0aXBsZWNvbnRyb2xwb2ludHMnKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG59O1xyXG4gIFxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlY29ubmVjdGlvblV0aWxpdGllcztcclxuICAiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeSwgYW5jaG9yUG9pbnRVdGlsaXRpZXMsIHBhcmFtcykge1xyXG4gIGlmIChjeS51bmRvUmVkbyA9PSBudWxsKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdXIgPSBjeS51bmRvUmVkbyh7XHJcbiAgICBkZWZhdWx0QWN0aW9uczogZmFsc2UsXHJcbiAgICBpc0RlYnVnOiB0cnVlXHJcbiAgfSk7XHJcblxyXG4gIGZ1bmN0aW9uIGNoYW5nZUFuY2hvclBvaW50cyhwYXJhbSkge1xyXG4gICAgdmFyIGVkZ2UgPSBjeS5nZXRFbGVtZW50QnlJZChwYXJhbS5lZGdlLmlkKCkpO1xyXG4gICAgdmFyIHR5cGUgPSBwYXJhbS50eXBlICE9PSAnaW5jb25jbHVzaXZlJyA/IHBhcmFtLnR5cGUgOiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgIFxyXG4gICAgdmFyIHdlaWdodHMsIGRpc3RhbmNlcywgd2VpZ2h0U3RyLCBkaXN0YW5jZVN0cjtcclxuXHJcbiAgICBpZihwYXJhbS50eXBlID09PSAnaW5jb25jbHVzaXZlJyAmJiAhcGFyYW0uc2V0KXtcclxuICAgICAgd2VpZ2h0cyA9IFtdO1xyXG4gICAgICBkaXN0YW5jZXMgPSBbXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB3ZWlnaHRTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddO1xyXG4gICAgICBkaXN0YW5jZVN0ciA9IGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXTtcclxuXHJcbiAgICAgIHdlaWdodHMgPSBwYXJhbS5zZXQgPyBlZGdlLmRhdGEod2VpZ2h0U3RyKSA6IHBhcmFtLndlaWdodHM7XHJcbiAgICAgIGRpc3RhbmNlcyA9IHBhcmFtLnNldCA/IGVkZ2UuZGF0YShkaXN0YW5jZVN0cikgOiBwYXJhbS5kaXN0YW5jZXM7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgd2VpZ2h0czogd2VpZ2h0cyxcclxuICAgICAgZGlzdGFuY2VzOiBkaXN0YW5jZXMsXHJcbiAgICAgIC8vQXMgdGhlIHJlc3VsdCB3aWxsIG5vdCBiZSB1c2VkIGZvciB0aGUgZmlyc3QgZnVuY3Rpb24gY2FsbCBwYXJhbXMgc2hvdWxkIGJlIHVzZWQgdG8gc2V0IHRoZSBkYXRhXHJcbiAgICAgIHNldDogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICAvL0NoZWNrIGlmIHdlIG5lZWQgdG8gc2V0IHRoZSB3ZWlnaHRzIGFuZCBkaXN0YW5jZXMgYnkgdGhlIHBhcmFtIHZhbHVlc1xyXG4gICAgaWYgKHBhcmFtLnNldCkge1xyXG4gICAgICB2YXIgaGFkQW5jaG9yUG9pbnQgPSBwYXJhbS53ZWlnaHRzICYmIHBhcmFtLndlaWdodHMubGVuZ3RoID4gMDtcclxuICAgICAgdmFyIGhhZE11bHRpcGxlQW5jaG9yUG9pbnRzID0gaGFkQW5jaG9yUG9pbnQgJiYgcGFyYW0ud2VpZ2h0cy5sZW5ndGggPiAxO1xyXG5cclxuICAgICAgaGFkQW5jaG9yUG9pbnQgPyBlZGdlLmRhdGEod2VpZ2h0U3RyLCBwYXJhbS53ZWlnaHRzKSA6IGVkZ2UucmVtb3ZlRGF0YSh3ZWlnaHRTdHIpO1xyXG4gICAgICBoYWRBbmNob3JQb2ludCA/IGVkZ2UuZGF0YShkaXN0YW5jZVN0ciwgcGFyYW0uZGlzdGFuY2VzKSA6IGVkZ2UucmVtb3ZlRGF0YShkaXN0YW5jZVN0cik7XHJcblxyXG4gICAgICB2YXIgc2luZ2xlQ2xhc3NOYW1lID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWydjbGFzcyddO1xyXG4gICAgICB2YXIgbXVsdGlDbGFzc05hbWUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ211bHRpQ2xhc3MnXTtcclxuXHJcbiAgICAgIC8vIFJlZnJlc2ggdGhlIGN1cnZlIHN0eWxlIGFzIHRoZSBudW1iZXIgb2YgYW5jaG9yIHBvaW50IHdvdWxkIGJlIGNoYW5nZWQgYnkgdGhlIHByZXZpb3VzIG9wZXJhdGlvblxyXG4gICAgICAvLyBBZGRpbmcgb3IgcmVtb3ZpbmcgbXVsdGkgY2xhc3NlcyBhdCBvbmNlIGNhbiBjYXVzZSBlcnJvcnMuIElmIG11bHRpcGxlIGNsYXNzZXMgYXJlIHRvIGJlIGFkZGVkLFxyXG4gICAgICAvLyBqdXN0IGFkZCB0aGVtIHRvZ2V0aGVyIGluIHNwYWNlIGRlbGltZXRlZCBjbGFzcyBuYW1lcyBmb3JtYXQuXHJcbiAgICAgIGlmICghaGFkQW5jaG9yUG9pbnQgJiYgIWhhZE11bHRpcGxlQW5jaG9yUG9pbnRzKSB7XHJcbiAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGNsYXNzZXMgZnJvbSBlZGdlIHdpdGggc3BhY2UgZGVsaW1ldGVkIHN0cmluZyBvZiBjbGFzcyBuYW1lcyBcclxuICAgICAgICBlZGdlLnJlbW92ZUNsYXNzKHNpbmdsZUNsYXNzTmFtZSArIFwiIFwiICsgbXVsdGlDbGFzc05hbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGhhZEFuY2hvclBvaW50ICYmICFoYWRNdWx0aXBsZUFuY2hvclBvaW50cykgeyAvLyBIYWQgc2luZ2xlIGFuY2hvclxyXG4gICAgICAgIGVkZ2UuYWRkQ2xhc3Moc2luZ2xlQ2xhc3NOYW1lKTtcclxuICAgICAgICBlZGdlLnJlbW92ZUNsYXNzKG11bHRpQ2xhc3NOYW1lKTsgICBcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBIYWQgbXVsdGlwbGUgYW5jaG9ycy4gQWRkIG11bHRpcGxlIGNsYXNzZXMgd2l0aCBzcGFjZSBkZWxpbWV0ZWQgc3RyaW5nIG9mIGNsYXNzIG5hbWVzXHJcbiAgICAgICAgZWRnZS5hZGRDbGFzcyhzaW5nbGVDbGFzc05hbWUgKyBcIiBcIiArIG11bHRpQ2xhc3NOYW1lKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIWVkZ2Uuc2VsZWN0ZWQoKSlcclxuICAgICAgICBlZGdlLnNlbGVjdCgpO1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBlZGdlLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgZWRnZS5zZWxlY3QoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBlZGdlLnRyaWdnZXIoJ2N5ZWRnZWVkaXRpbmcuY2hhbmdlQW5jaG9yUG9pbnRzJyk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG1vdmVEbyhhcmcpIHtcclxuICAgICAgaWYgKGFyZy5maXJzdFRpbWUpIHtcclxuICAgICAgICAgIGRlbGV0ZSBhcmcuZmlyc3RUaW1lO1xyXG4gICAgICAgICAgcmV0dXJuIGFyZztcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGVkZ2VzID0gYXJnLmVkZ2VzO1xyXG4gICAgICB2YXIgcG9zaXRpb25EaWZmID0gYXJnLnBvc2l0aW9uRGlmZjtcclxuICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICAgIGVkZ2VzOiBlZGdlcyxcclxuICAgICAgICAgIHBvc2l0aW9uRGlmZjoge1xyXG4gICAgICAgICAgICAgIHg6IC1wb3NpdGlvbkRpZmYueCxcclxuICAgICAgICAgICAgICB5OiAtcG9zaXRpb25EaWZmLnlcclxuICAgICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgbW92ZUFuY2hvcnNVbmRvYWJsZShwb3NpdGlvbkRpZmYsIGVkZ2VzKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtb3ZlQW5jaG9yc1VuZG9hYmxlKHBvc2l0aW9uRGlmZiwgZWRnZXMpIHtcclxuICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiggZWRnZSApe1xyXG4gICAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgICAgICAgIHZhciBwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpO1xyXG4gICAgICAgICAgdmFyIG5leHRBbmNob3JzUG9zaXRpb24gPSBbXTtcclxuICAgICAgICAgIGlmIChwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiAhPSB1bmRlZmluZWQpXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uLmxlbmd0aDsgaSs9MilcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIG5leHRBbmNob3JzUG9zaXRpb24ucHVzaCh7eDogcHJldmlvdXNBbmNob3JzUG9zaXRpb25baV0rcG9zaXRpb25EaWZmLngsIHk6IHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uW2krMV0rcG9zaXRpb25EaWZmLnl9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsncG9pbnRQb3MnXSwgbmV4dEFuY2hvcnNQb3NpdGlvbik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaW5pdEFuY2hvclBvaW50cyhwYXJhbXMuYmVuZFBvc2l0aW9uc0Z1bmN0aW9uLCBwYXJhbXMuY29udHJvbFBvc2l0aW9uc0Z1bmN0aW9uLCBlZGdlcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByZWNvbm5lY3RFZGdlKHBhcmFtKXtcclxuICAgIHZhciBlZGdlICAgICAgPSBwYXJhbS5lZGdlO1xyXG4gICAgdmFyIGxvY2F0aW9uICA9IHBhcmFtLmxvY2F0aW9uO1xyXG4gICAgdmFyIG9sZExvYyAgICA9IHBhcmFtLm9sZExvYztcclxuXHJcbiAgICBlZGdlID0gZWRnZS5tb3ZlKGxvY2F0aW9uKVswXTtcclxuXHJcbiAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICBlZGdlOiAgICAgZWRnZSxcclxuICAgICAgbG9jYXRpb246IG9sZExvYyxcclxuICAgICAgb2xkTG9jOiAgIGxvY2F0aW9uXHJcbiAgICB9XHJcbiAgICBlZGdlLnVuc2VsZWN0KCk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcmVtb3ZlUmVjb25uZWN0ZWRFZGdlKHBhcmFtKXtcclxuICAgIHZhciBvbGRFZGdlID0gcGFyYW0ub2xkRWRnZTtcclxuICAgIHZhciB0bXAgPSBjeS5nZXRFbGVtZW50QnlJZChvbGRFZGdlLmRhdGEoJ2lkJykpO1xyXG4gICAgaWYodG1wICYmIHRtcC5sZW5ndGggPiAwKVxyXG4gICAgICBvbGRFZGdlID0gdG1wO1xyXG5cclxuICAgIHZhciBuZXdFZGdlID0gcGFyYW0ubmV3RWRnZTtcclxuICAgIHZhciB0bXAgPSBjeS5nZXRFbGVtZW50QnlJZChuZXdFZGdlLmRhdGEoJ2lkJykpO1xyXG4gICAgaWYodG1wICYmIHRtcC5sZW5ndGggPiAwKVxyXG4gICAgICBuZXdFZGdlID0gdG1wO1xyXG5cclxuICAgIGlmKG9sZEVkZ2UuaW5zaWRlKCkpe1xyXG4gICAgICBvbGRFZGdlID0gb2xkRWRnZS5yZW1vdmUoKVswXTtcclxuICAgIH0gXHJcbiAgICAgIFxyXG4gICAgaWYobmV3RWRnZS5yZW1vdmVkKCkpe1xyXG4gICAgICBuZXdFZGdlID0gbmV3RWRnZS5yZXN0b3JlKCk7XHJcbiAgICAgIG5ld0VkZ2UudW5zZWxlY3QoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgb2xkRWRnZTogbmV3RWRnZSxcclxuICAgICAgbmV3RWRnZTogb2xkRWRnZVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHVyLmFjdGlvbignY2hhbmdlQW5jaG9yUG9pbnRzJywgY2hhbmdlQW5jaG9yUG9pbnRzLCBjaGFuZ2VBbmNob3JQb2ludHMpO1xyXG4gIHVyLmFjdGlvbignbW92ZUFuY2hvclBvaW50cycsIG1vdmVEbywgbW92ZURvKTtcclxuICB1ci5hY3Rpb24oJ3JlY29ubmVjdEVkZ2UnLCByZWNvbm5lY3RFZGdlLCByZWNvbm5lY3RFZGdlKTtcclxuICB1ci5hY3Rpb24oJ3JlbW92ZVJlY29ubmVjdGVkRWRnZScsIHJlbW92ZVJlY29ubmVjdGVkRWRnZSwgcmVtb3ZlUmVjb25uZWN0ZWRFZGdlKTtcclxufTtcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyg1NzkpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==