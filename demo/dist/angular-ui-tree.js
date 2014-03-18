/**
 * @license Angular UI Tree v2.0.0
 * (c) 2010-2014. https://github.com/JimLiu/angular-ui-tree
 * License: MIT
 */
(function () {
  'use strict';

  angular.module('ui.tree', [])
    .constant('treeConfig', {
      treeClass: 'angular-ui-tree',
      hiddenClass: 'angular-ui-tree-hidden',
      nodesClass: 'angular-ui-tree-nodes',
      nodeClass: 'angular-ui-tree-node',
      handleClass: 'angular-ui-tree-handle',
      placeHolderClass: 'angular-ui-tree-placeholder',
      dragClass: 'angular-ui-tree-drag',
      dragThreshold: 3,
      levelThreshold: 30
    });

})();

(function () {
  'use strict';

  angular.module('ui.tree')

   /**
    * @ngdoc service
    * @name ui.tree.service:$helper
    * @requires ng.$document
    * @requires ng.$window
    *
    * @description
    * angular-ui-tree.
    */
    .factory('$helper', ['$document', '$window',
      function ($document, $window) {
        return {

          /**
           * @ngdoc method
           * @methodOf ui.tree.service:$nodrag
           * @param  {Object} angular element
           * @return {Bool} check if the node can be dragged.
           */
          nodrag: function (targetElm) {
            return (typeof targetElm.attr('data-nodrag')) != "undefined";
          },

          /**
           * get the event object for touchs
           * @param  {[type]} e [description]
           * @return {[type]}   [description]
           */
          eventObj: function(e) {
            var obj = e;
            if (e.targetTouches !== undefined) {
              obj = e.targetTouches.item(0);
            } else if (e.originalEvent !== undefined && e.originalEvent.targetTouches !== undefined) {
              obj = e.originalEvent.targetTouches.item(0);
            }
            return obj;
          },

          dragInfo: function(node) {
            return {
              source: node,
              index: node.$index,
              siblings: node.$parentNodesScope.$nodes.slice(0),
              parent: node.$parentNodesScope,
              
              moveTo: function(parent, siblings, index) { // Move the node to a new position
                this.parent = parent;
                this.siblings = siblings.slice(0);
                var i = this.siblings.indexOf(this.source); // If source node is in the target nodes
                if (i > -1) {
                  this.siblings.splice(i, 1);
                  if (this.source.$index < index) {
                    index--;
                  }
                }
                this.siblings.splice(index, 0, this.source);
                this.index = index;
              },

              parentNode: function() {
                return this.parent.$nodeScope;
              },

              prev: function() {
                if (this.index > 0) {
                  return this.siblings[this.index - 1];
                }
                return null;
              },

              next: function() {
                if (this.index < this.siblings.length - 1) {
                  return this.siblings[this.index + 1];
                }
                return null;
              },

              isDirty: function() {
                return this.source.$parentNodesScope != this.parent ||
                        this.source.$index != this.index;
              },

              apply: function() {
                this.source.remove();
                this.parent.insertNode(this.index, this.source);
              },
            };
          },

          /**
          * @ngdoc method
          * @name hippo.theme#height
          * @methodOf ui.tree.service:$helper
          *
          * @description
          * Get the height of an element.
          *
          * @param {Object} element Angular element.
          * @returns {String} Height
          */
          height: function (element) {
            return element.prop('scrollHeight');
          },

          /**
          * @ngdoc method
          * @name hippo.theme#width
          * @methodOf ui.tree.service:$helper
          *
          * @description
          * Get the width of an element.
          *
          * @param {Object} element Angular element.
          * @returns {String} Width
          */
          width: function (element) {
            return element.prop('scrollWidth');
          },

          /**
          * @ngdoc method
          * @name hippo.theme#offset
          * @methodOf ui.nestedSortable.service:$helper
          *
          * @description
          * Get the offset values of an element.
          *
          * @param {Object} element Angular element.
          * @returns {Object} Object with properties width, height, top and left
          */
          offset: function (element) {
            var boundingClientRect = element[0].getBoundingClientRect();

            return {
                width: element.prop('offsetWidth'),
                height: element.prop('offsetHeight'),
                top: boundingClientRect.top + ($window.pageYOffset || $document[0].body.scrollTop || $document[0].documentElement.scrollTop),
                left: boundingClientRect.left + ($window.pageXOffset || $document[0].body.scrollLeft  || $document[0].documentElement.scrollLeft)
              };
          },

          /**
          * @ngdoc method
          * @name hippo.theme#positionStarted
          * @methodOf ui.tree.service:$helper
          *
          * @description
          * Get the start position of the target element according to the provided event properties.
          *
          * @param {Object} e Event
          * @param {Object} target Target element
          * @returns {Object} Object with properties offsetX, offsetY, startX, startY, nowX and dirX.
          */
          positionStarted: function (e, target) {
            var pos = {};
            pos.offsetX = e.pageX - this.offset(target).left;
            pos.offsetY = e.pageY - this.offset(target).top;
            pos.startX = pos.lastX = e.pageX;
            pos.startY = pos.lastY = e.pageY;
            pos.nowX = pos.nowY = pos.distX = pos.distY = pos.dirAx = 0;
            pos.dirX = pos.dirY = pos.lastDirX = pos.lastDirY = pos.distAxX = pos.distAxY = 0;
            return pos;
          },

          positionMoved: function (e, pos, firstMoving) {
            // mouse position last events
            pos.lastX = pos.nowX;
            pos.lastY = pos.nowY;

            // mouse position this events
            pos.nowX  = e.pageX;
            pos.nowY  = e.pageY;

            // distance mouse moved between events
            pos.distX = pos.nowX - pos.lastX;
            pos.distY = pos.nowY - pos.lastY;

            // direction mouse was moving
            pos.lastDirX = pos.dirX;
            pos.lastDirY = pos.dirY;

            // direction mouse is now moving (on both axis)
            pos.dirX = pos.distX === 0 ? 0 : pos.distX > 0 ? 1 : -1;
            pos.dirY = pos.distY === 0 ? 0 : pos.distY > 0 ? 1 : -1;

            // axis mouse is now moving on
            var newAx   = Math.abs(pos.distX) > Math.abs(pos.distY) ? 1 : 0;

            // do nothing on first move
            if (firstMoving) {
              pos.dirAx  = newAx;
              pos.moving = true;
              return;
            }

            // calc distance moved on this axis (and direction)
            if (pos.dirAx !== newAx) {
              pos.distAxX = 0;
              pos.distAxY = 0;
            } else {
              pos.distAxX += Math.abs(pos.distX);
              if (pos.dirX !== 0 && pos.dirX !== pos.lastDirX) {
                pos.distAxX = 0;
              }

              pos.distAxY += Math.abs(pos.distY);
              if (pos.dirY !== 0 && pos.dirY !== pos.lastDirY) {
                pos.distAxY = 0;
              }
            }

            pos.dirAx = newAx;
          }
        };
      }
    ]);

})();
(function () {
  'use strict';
  
  angular.module('ui.tree')

    .controller('TreeNodesController', ['$scope', '$element', 'treeConfig',
      function ($scope, $element, treeConfig) {
        this.scope = $scope;

        $scope.$element = $element;
        $scope.$modelValue = null;
        $scope.$nodes = []; // sub nodes
        $scope.$nodeScope = null; // the scope of node which the nodes belongs to 
        $scope.$callbacks = null;
        $scope.$type = 'uiTreeNodes';

        $scope.initSubNode = function(subNode) {
          $scope.$nodes.splice(subNode.$index, 0, subNode);
        };

        $scope.accept = function(sourceNode, destIndex) {
          return $scope.$callbacks.accept(sourceNode, $scope, destIndex);
        };

        $scope.apply = function() {
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
          }
        };

        $scope.removeNode = function(node) {
          var index = $scope.$nodes.indexOf(node);
          if (index > -1) {
            $scope.$modelValue.splice(index, 1)[0];
            $scope.$nodes.splice(index, 1)[0];
            $scope.apply();
            return node;
          }
          return null;
        };

        $scope.insertNode = function(index, node) {
          $scope.$modelValue.splice(index, 0, node.$modelValue);
          $scope.apply();
        };

      }
    ]);
})();
(function () {
  'use strict';

  angular.module('ui.tree')

    .controller('TreeNodeController', ['$scope', '$element', '$attrs', 'treeConfig',
      function ($scope, $element, $attrs, treeConfig) {
        this.scope = $scope;

        $scope.$element = $element;
        $scope.$modelValue = null; // Model value for node;
        $scope.$parentNodeScope = null; // uiTreeNode Scope of parent node;
        $scope.$childNodesScope = null; // uiTreeNodes Scope of child nodes.
        $scope.$parentNodesScope = null; // uiTreeNodes Scope of parent nodes.
        $scope.$type = 'uiTreeNode';

        $scope.collapsed = false;

        $scope.isSibling = function(targetNode) {
          return $scope.$parentNodeScope == targetNode.$parentNodeScope;
        };

        $scope.isChild = function(node) {
          var nodes = $scope.childNodes();
          return nodes.indexOf(node) > -1;
        };

        $scope.prev = function() {
          if ($scope.$index > 0) {
            return $scope.siblings()[$scope.$index - 1];
          }
          return null;
        };

        $scope.siblings = function() {
          return $scope.$parentNodesScope.$nodes;
        };

        $scope.childNodesCount = function() {
          return $scope.childNodes().length;
        };

        $scope.childNodes = function() {
          return $scope.$childNodesScope.$nodes;
        };

        $scope.accept = function(sourceNode, destIndex) {
          return $scope.$childNodesScope.accept(sourceNode, destIndex);
        };

        $scope.remove = function() {
          return $scope.$parentNodesScope.removeNode($scope);
        };

        $scope.insertNode = function(index, node) {
          $scope.$childNodesScope.insertNode(index, node);
        };

      }
    ]);
})();

(function () {
  'use strict';

  angular.module('ui.tree')
  .directive('uiTreeNodes', [ 'treeConfig', '$window',
    function(treeConfig) {
      return {
        require: ['ngModel', '?^uiTreeNode'],
        restrict: 'A',
        scope: true,
        controller: 'TreeNodesController',
        link: function(scope, element, attrs, controllersArr) {
          var callbacks = {
            accept: null
          };

          var config = {};
          angular.extend(config, treeConfig);
          if (config.nodesClass) {
            element.addClass(config.nodesClass);
          }

          var ngModel = controllersArr[0];
          var treeNodeCtrl = controllersArr[1];
          if (treeNodeCtrl) {
            treeNodeCtrl.scope.$childNodesScope = scope;
            scope.$nodeScope = treeNodeCtrl.scope;
          }

          if (ngModel) {
            ngModel.$render = function() {
              scope.$modelValue = ngModel.$modelValue;
            };
          }

          // check if the dest node can accept the dragging node
          // by default, we check the 'data-nodrop' attribute in `ui-tree-nodes`.
          // the method can be overrided
          callbacks.accept = function(sourceNode, destNodes, destIndex) {
            return (typeof destNodes.$element.attr('data-nodrop')) == "undefined";
          };

          scope.$watch(attrs.uiTreeNodes, function(newVal, oldVal){
            angular.forEach(newVal, function(value, key){
              if (callbacks[key]) {
                if (typeof value === "function") {
                  callbacks[key] = value;
                }
              }
            });

            scope.$callbacks = callbacks;
          }, true);

        }
      };
    }
  ]);
})();

(function () {
  'use strict';

  angular.module('ui.tree')

    .directive('uiTreeNode', ['treeConfig', '$helper', '$window', '$document',
      function (treeConfig, $helper, $window, $document) {
        return {
          require: '^uiTreeNodes',
          restrict: 'A',
          controller: 'TreeNodeController',
          link: function(scope, element, attrs, treeNodesCtrl) {
            var config = {};
            angular.extend(config, treeConfig);
            if (config.nodeClass) {
              element.addClass(config.nodeClass);
            }

            // find the scope of it's parent node
            scope.$parentNodeScope = treeNodesCtrl.scope.$nodeScope;
            // modelValue for current node
            scope.$modelValue = treeNodesCtrl.scope.$modelValue[scope.$index];
            scope.$parentNodesScope = treeNodesCtrl.scope;
            treeNodesCtrl.scope.initSubNode(scope); // init sub nodes

            element.on('$destroy', function() {
              
            });


            var hasTouch = 'ontouchstart' in window;
            var startPos, firstMoving, dragInfo, pos;
            var placeElm, hiddenPlaceElm, dragElm;

            var dragStartEvent = function(e) {
              if (!hasTouch && (e.button == 2 || e.which == 3)) {
                // disable right click
                return;
              }
              if (e.uiTreeDragging) { // event has already fired in other scope.
                return;
              }
              // the element which is clicked.
              var eventElm = angular.element(e.target);
              // check if it or it's parents has a 'data-nodrag' attribute
              while (eventElm && eventElm[0] && eventElm[0] != element) {
                if ($helper.nodrag(eventElm)) { // if the node mark as `nodrag`, DONOT drag it.
                  return;
                }
                eventElm = eventElm.parent();
              }

              e.uiTreeDragging = scope; // stop event bubbling
              e.preventDefault();
              var eventObj = $helper.eventObj(e);

              firstMoving = true;
              dragInfo = $helper.dragInfo(scope);

              var tagName = scope.$element.prop('tagName');
              if (tagName.toLowerCase() === 'tr') {
                placeElm = angular.element($window.document.createElement(tagName));
                var tdElm = angular.element($window.document.createElement('td'))
                              .addClass(config.placeHolderClass);
                placeElm.append(tdElm);
              } else {
                placeElm = angular.element($window.document.createElement(tagName))
                              .addClass(config.placeHolderClass);
              }
              hiddenPlaceElm = angular.element($window.document.createElement(tagName));
              if (config.hiddenClass) {
                hiddenPlaceElm.addClass(config.hiddenClass);
              }
              pos = $helper.positionStarted(eventObj, scope.$element);
              placeElm.css('height', $helper.height(scope.$element) + 'px');
              dragElm = angular.element($window.document.createElement(scope.$parentNodesScope.$element.prop('tagName')))
                        .addClass(scope.$parentNodesScope.$element.attr('class')).addClass(config.dragClass);
              dragElm.css('width', $helper.width(scope.$element) + 'px');
              dragElm.css('z-index', 9999);

              scope.$element.after(placeElm);
              scope.$element.after(hiddenPlaceElm);
              dragElm.append(scope.$element);
              $document.find('body').append(dragElm);
              dragElm.css({
                'left' : eventObj.pageX - pos.offsetX + 'px',
                'top'  : eventObj.pageY - pos.offsetY + 'px'
              });

              if (hasTouch) { // Mobile
                angular.element($document).bind('touchend', dragEndEvent);
                angular.element($document).bind('touchcancel', dragEndEvent);
                angular.element($document).bind('touchmove', dragMoveEvent);
              } else {
                angular.element($document).bind('mouseup', dragEndEvent);
                angular.element($document).bind('mousemove', dragMoveEvent);
                angular.element($window.document.body).bind('mouseleave', dragEndEvent);
              }
            };

            var dragMoveEvent = function(e) {
              var eventObj = $helper.eventObj(e);
              var prev, currentAccept, childAccept;
              if (dragElm) {
                e.preventDefault();

                dragElm.css({
                  'left' : eventObj.pageX - pos.offsetX + 'px',
                  'top'  : eventObj.pageY - pos.offsetY + 'px'
                });

                $helper.positionMoved(e, pos, firstMoving);
                if (firstMoving) {
                  firstMoving = false;
                  return;
                }

                // move horizontal
                if (pos.dirAx && pos.distAxX >= config.levelThreshold) {
                  pos.distAxX = 0;

                  // increase horizontal level if previous sibling exists and is not collapsed
                  if (pos.distX > 0) {
                    prev = dragInfo.prev();
                    if (prev && !prev.collapsed
                      && prev.accept(scope, prev.childNodesCount())) {
                      prev.$childNodesScope.$element.append(placeElm);
                      dragInfo.moveTo(prev.$childNodesScope, prev.childNodes(), prev.childNodesCount());
                    }
                  }

                  // decrease horizontal level
                  if (pos.distX < 0) {
                    // we can't decrease a level if an item preceeds the current one
                    var next = dragInfo.next();
                    if (!next) {
                      var target = dragInfo.parentNode(); // As a sibling of it's parent node
                      if (target
                        && target.$parentNodesScope.accept(scope, target.$index + 1)) {
                        target.$element.after(placeElm);
                        dragInfo.moveTo(target.$parentNodesScope, target.siblings(), target.$index + 1);
                      }
                    }
                  }
                }

                // check if add it as a child node first
                var decrease = ($helper.offset(dragElm).left - $helper.offset(placeElm).left) >= config.threshold;
                var targetX = eventObj.pageX - $window.document.body.scrollLeft;
                var targetY = eventObj.pageY - (window.pageYOffset || $window.document.documentElement.scrollTop);
                //var dirUp = $helper.offset(placeElm).top > $helper.offset(dragElm).top; // If the movement direction is up?
                
                // Select the drag target. Because IE does not support CSS 'pointer-events: none', it will always
                // pick the drag element itself as the target. To prevent this, we hide the drag element while
                // selecting the target.
                if (angular.isFunction(dragElm.hide)) {
                  dragElm.hide();
                }

                // when using elementFromPoint() inside an iframe, you have to call
                // elementFromPoint() twice to make sure IE8 returns the correct value
                $window.document.elementFromPoint(targetX, targetY);

                var targetElm = angular.element($window.document.elementFromPoint(targetX, targetY));
                if (angular.isFunction(dragElm.show)) {
                  dragElm.show();
                }

                // move vertical
                if (!pos.dirAx) {
                  var targetBefore, targetNode;
                  // check it's new position
                  targetNode = targetElm.scope();
                  if (targetNode.$type != 'uiTreeNode') { // Check if it is a uiTreeNode
                    return;
                  }
                  targetElm = targetNode.$element; // Get the element of ui-tree-node
                  
                  var targetOffset = $helper.offset(targetElm);
                  targetBefore = eventObj.pageY < (targetOffset.top + $helper.height(targetElm) / 2);
        
                  if (targetNode.$parentNodesScope.accept(scope, targetNode.$index)) {
                    if (targetBefore) {
                      targetElm[0].parentNode.insertBefore(placeElm[0], targetElm[0]);
                      dragInfo.moveTo(targetNode.$parentNodesScope, targetNode.siblings(), targetNode.$index);
                    } else {
                      targetElm.after(placeElm);
                      dragInfo.moveTo(targetNode.$parentNodesScope, targetNode.siblings(), targetNode.$index + 1);
                    }
                  }
                }
              }
            };

            var dragEndEvent = function(e) {
              e.preventDefault();

              if (dragElm) {
                // roll back elements changed
                scope.$element.remove();
                hiddenPlaceElm.replaceWith(scope.$element);
                placeElm.remove();

                dragElm.remove();
                dragElm = null;
                
                console.log(dragInfo);

                dragInfo.apply();
                dragInfo = null;

              }


              if (hasTouch) {
                angular.element($document).unbind('touchend', dragEndEvent); // Mobile
                angular.element($document).unbind('touchcancel', dragEndEvent); // Mobile
                angular.element($document).unbind('touchmove', dragMoveEvent); // Mobile
              }
              else {
                angular.element($document).unbind('mouseup', dragEndEvent);
                angular.element($document).unbind('mousemove', dragMoveEvent);
                angular.element($window.document.body).unbind('mouseleave', dragEndEvent);
              }
            };

            if (hasTouch) { // Mobile
              element.bind('touchstart', dragStartEvent);
            } else {
              element.bind('mousedown', dragStartEvent);
            }



          }
        };
      }
    ]);

})();