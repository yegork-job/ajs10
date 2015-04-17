'use strict';

angular.module('myModal', [])

  .controller('mainCtrl', function ($scope, myModalService) {
    $scope.popupVisible = false;
    $scope.value = null;

    $scope.showPopup = function () {
      $scope.popupVisible = true;

      myModalService.open({
        templateUrl: '/template/test.html',
        controller: 'myPopupCtrl',
        resolve: {
          id: function () {
            return Math.random();
          }
        }
      }).then(
        function (value) {
          $scope.popupVisible = false;
          $scope.value = value;
        },
        function () {
          $scope.popupVisible = false;
        }
      );
    };
  })

  .factory('myModalService', function (
    $q,
    $rootScope,
    $controller,
    $templateRequest,
    $templateCache,
    $document,
    $compile,
    $injector
  ) {
      var modalInstance;
      var domElem;
      var myScope;

      var freeResources = function () {
        domElem.remove();
        myScope.$destroy();
      };

      return {
        open: function (params) {
          // Создаем промис, который вернет функция open
          var deferred = $q.defer();
          modalInstance = deferred;

          // Обработка секции resolve
          var getResolve = function () {
            var resArray = [];

            angular.forEach(params.resolve, function (value) {
              resArray.push($q.when($injector.invoke(value)));
            });

            return resArray;
          };

          // Объединяем промисы из resolve и получения шаблона
          var promises = [$templateRequest(params.templateUrl)].concat(getResolve());

          // Вспомогательная функция
          var addTemplate = function (scope, template) {
            // Создаем элемент с шаблоном
            var htmlElem = $document[0].createElement('div');
            htmlElem.innerHTML = template;
            // Вставляем его в DOM
            domElem = $compile(htmlElem)(scope);
            $document.find('#myPopupBody').append(domElem);
          };

          // Решаем секцию resolve и получаем шаблон
          $q.all(promises).then(
            function (resValues) {
              // Создаем новый scope
              myScope = $rootScope.$new(true);
              myScope.retVal = '';

              // Добавляем шаблон
              addTemplate(myScope, resValues[0]);

              var locals = {
                $scope: myScope
              };
              var index = 1;
              angular.forEach(params.resolve, function (value, key) {
                locals[key] = resValues[index++];
              });

              // Создаем новый контроллер
              $controller(params.controller, locals);
            },
            function () {
              deferred.reject();
            }
          );

          // Возвращаем промис
          return deferred.promise;
        },
        close: function () {
          var retVal = myScope.retVal;
          freeResources();
          modalInstance.resolve(retVal);
        },
        dismiss: function () {
          freeResources();
          modalInstance.reject();
        }
      };
    })

  .directive('myPopup', function () {
    return {
      restrict: 'AE',
      template: '<div class="black_overlay"></div>' +
                '<div class="white_content">' +
                  '<div id="myPopupTitle">My popup</div>' +
                  '<div id="myPopupBody"></div>' +
                  '<div id="myPopupFooter">' +
                    '<button ng-click="close()">OK</button>' +
                    '<button ng-click="dismiss()">Cancel</button>' +
                  '</div>' +
                '</div>',
      scope: {},
      controller: 'myPopupCtrl'
    };
  })

  .controller('myPopupCtrl', function ($scope, myModalService) {
    // Нажатие OK
    $scope.close = function () {
      myModalService.close();
    };

    // Нажатие Cancel
    $scope.dismiss = function () {
      myModalService.dismiss();
    };
  })
;
