(function(){
	var __helper = new Helper();
	var calendar = angular.module('ngCalendar', ['ngDraggable', 'ngDialog'])

	.service('$cal', function(){
		var _on = {
			event: {
				create: [],
				cancel: [],
				save: []
			}
		}

		this.on = function(name, callback){
			var t = name.split('.');
			var object = t[0];
			var event = t[1];
			_on[object][event].push(callback);
		}

		this.un = function(name, callback){
			var t = name.split('.');
			var object = t[0];
			var event = t[1];
			var i = _on[object][event].indexOf(callback);
			if (i > -1) _on[object][event].splice(i, 1);
		}

		this.trigger = function(name, arguments){
			var t = name.split('.');
			var object = t[0];
			var event = t[1];
			for (var i = 0; i < _on[object][event].length; i++) {
				_on[object][event][i](arguments);
			};
		}
	})

	.controller('CalendarController', function($scope, $element, $attrs, $cal){
		$element.addClass('col-xs-12');

		var _self = this;
		this.select = function(selectedDate){
			this.selected = {
				date: selectedDate.getDate(),
				week: selectedDate.getWeek(),
				month: selectedDate.getMonth(),
				year: selectedDate.getFullYear(),
			}
		};

		this.addNewEvent = function(event){
			console.log(event);
		}

		$cal.on('event.save', this.addNewEvent);

		// ########## CONSTRUCTOR
		this.selected	= {};
		this.days 		= __helper.getDays();
		this.hours 		= __helper.getHours();
		this.type 		= __helper.getCalendarType($attrs.calType);

		this.select(new Date());
		// ########## END CONSTRUCTOR
	})

	.controller('CreateNewEventController', function($cal){
		this.eventName = 'New Event';
		this.date = 'THE SELECTED DATE';
		this.from = '10:00';
		this.to = '11:00';

		this.submit = function(){
			var newEvent = {
				name: newEventForm.eventName.value,
				time: {
					from: newEventForm.timeFrom.value,
					to: newEventForm.timeTo.value
				}
			};

			$cal.trigger('event.save', newEvent);					
		}
	})

	.directive('calendar', function(){
		return {
			restrict: 'E',
			templateUrl: __helper.getTemplateUrl('calendar.html'),
			controller: 'CalendarController',
			controllerAs: 'calendarCtrl'
		}
	})

	.directive('weeklyColumn', function(){
		return {
			restrict: 'A',
			template: '<weekly-cell ng-repeat="hour in weeklyColumnCtrl.hours"><div></div></weekly-cell>',
			controller: function($scope, $element, $attrs, $compile, $cal){
				var _recentEventCard; // The most recent (newly created) event card

				this.hours = __helper.getHours();

				this.showNewEventCard = function(e){
					var y = angular.element(e.target).position().top + e.offsetY;

					_recentEventCard = angular.element('<event-card y-pos="'+y+'"></event-card>');

					$element.prepend(_recentEventCard);
					$compile(_recentEventCard)($scope);

					$scope.$on('ngDialog.closing', function(e, $dialog){
						_recentEventCard.remove();
					})
				};

				$element.on('dblclick', this.showNewEventCard);
			},
			controllerAs: 'weeklyColumnCtrl'
		}
	})

	.directive('eventCard', function(){
		return {
			restrict: 'E',
			templateUrl: __helper.getTemplateUrl('event-card.html'),
			controller: function($scope, $element, $attrs){
				var yPos = $attrs.yPos;
				$element.css({
					position: 'absolute', display: 'block',
					width: '13.475%', height: '10%',
					padding: '0px 0px 0px 4px',
					top: yPos + 'px'
				})
			},
			controllerAs: 'eventCardCtrl'
		}
	})

	.directive('weeklyCell', function(){
		return {
			restrict: 'E',
			controller: function($scope, $element, $attrs, $cal, ngDialog){
				// Represents clicked position within the element
				var _clickedPosition = {
					x: null,
					y: null
				}

				this.showCreateEventForm = function(e){
					ngDialog.close();

					_clickedPosition.x = e.pageX;
					_clickedPosition.y = e.pageY;

					// Open new event form dialog
					ngDialog.open({
						template: __helper.getTemplateUrl('create-event-form.html'),
						controller: function($scope, $element, $compile){
							$element.css({
								position: 'absolute',
								top: _clickedPosition.y+'px',
								left: _clickedPosition.x+'px',
								width: 300,
								padding: 0
							});
						}
					});
				};

				$element.on('dblclick', this.showCreateEventForm);
			},
			controllerAs: 'weeklyCellCtrl'
		}
	})

	/**
	 * Helper function to calculate certains things
	 * to avoid polluting the controllers.
	 */
	function Helper() {
		var _path = null;
		var _lastPart = null;

		var s = document.getElementsByTagName("script");
		var _path = s[s.length-1].src;
		var t = _path.split('/');
		var _lastPart = t[t.length - 1];


		this.getTemplateUrl = function(templateName){
			return _path.replace(_lastPart, templateName);
		}

		this.getCalendarType = function(calTypeString){
			var type;
			if (typeof calTypeString === 'undefined' || calTypeString.trim() === '') {
				// 0 = Daily
				// 1 = Weekly
				// 2 = Monthly
				// 3 = Yearly
				type = 1;
			} else {
				if (calTypeString === 'daily') 		type = 0;
				if (calTypeString === 'weekly') 	type = 1;
				if (calTypeString === 'monthly') 	type = 2;
				if (calTypeString === 'yearly') 	type = 3;

				if (typeof type === 'undefined')
					type = 1;
			}

			return type;
		}

		this.getDays = function(){
			return [
				{ name: 'Sun' },
				{ name: 'Mon' },
				{ name: 'Tue' },
				{ name: 'Wed' },
				{ name: 'Thu' },
				{ name: 'Fri' },
				{ name: 'Sat' },
			];
		}

		this.getHours = function(){
			var hours = [];
			var hourText = '';
			for (var i = 0; i < 25; i++) {
				if (i == 24) {
					hourText = ' ';
				} else {
					if (i.toString().length == 1) {
						hourText = '0' + i + ':00';
					} else {
						hourText = i + ':00';
					}
				}

				hours.push(hourText);
			};

			return hours;
		}
	};

	Date.prototype.getWeek = function(weekStart) {
	    var januaryFirst = new Date(this.getFullYear(), 0, 1);
	    if(weekStart !== undefined && (typeof weekStart !== 'number' || weekStart % 1 !== 0 || weekStart < 0 || weekStart > 6)) {
	      throw new Error('Wrong argument. Must be an integer between 0 and 6.');
	    }
	    weekStart = weekStart || 0;
	    return Math.ceil((((this - januaryFirst) / 86400000) + januaryFirst.getDay() - weekStart) / 7);
	};
})();