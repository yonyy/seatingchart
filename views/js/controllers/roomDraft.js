'use strict';
angular.module('app').controller('roomDraftController',
['$rootScope', '$scope', '$state','$stateParams', '$filter', 'resource', '$uibModal', 'growl',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl) {
	var self = this;
	self.room = null;
	self.virtualMap = [];
	self.physicalMap = [];
	self.maxWidth = 42; // on extra for display
	self.maxHeight = 16;
	self.rowStrOffset = 0;
	self.rowStrings = [];

    resource.events.getByID({id: $stateParams.id},
        function success(event) {
            self.event = event;
            resource.rooms.getByID({id: event.roomID},
                function success(room) {
                    self.room = room;
                    if (self.maxHeight > room.height) 
                    	self.maxHeight = room.height;
                    
                    console.log(room.map);
                    if (room.map.length > 0) {
                    	self.virtualMap = room.map[0];
                    	self.physicalMap = room.map[1]
                    }
                    else self.generateVMap();
                }, function error(err) {
                    console.log(err);
                }
            );
        }, function error(err) {
            console.log(err);
        }
    );

    self.generateVMap = function() {

    	for (var i = 0; i < self.maxHeight; i++) {
    		self.virtualMap.push([]);
			for(var j = 0; j < self.maxWidth; j++) {
				self.virtualMap[i].push({
					vX: j,
					vY: i,
					realCell: null
				});
			}
		}

		var coffset = Math.floor((self.maxWidth - (self.room.width+1))/2);
		var roffset = Math.floor((self.maxHeight - (self.room.height))/2);

		for(var i = 0; i < self.maxHeight; i++) {
			self.physicalMap.push([]);
		}

		self.generateRowStr();
		for(var i = self.maxHeight - 1; i >= 0; i--) {
			for(var j = 0; j < self.room.width + 1; j++) {
				var cell = {
					students: null,
					id: "",
					str: "",
					leftHanded: false,
					ghostSeat: false,
					valid: true, 	// to distinguish between viable cells and cells that just for display
					x: j,
					y: i
				};

				// last column should be letters
				if (j == self.room.width) {
/*					console.log(i);
					console.log(self.rowStrings[self.rowStrings.length-i]);	*/
					cell.str = self.rowStrings[self.rowStrings.length-i-1];
					cell.valid = false;

				// any valid seat in between
				} else if (j < self.room.width) {
					cell.str = (j+1).toString();
					cell.id = self.rowStrings[i] + j.toString();
				}

				self.physicalMap[i].push(cell);
				//console.log("("+(i+roffset)+","+(j+coffset)+") ---> " + "("+(i)+","+(j)+")");
				self.virtualMap[(i+roffset)][(j+coffset)].realCell = self.physicalMap[i][j];
			}
		}
    }

    self.generateRowStr = function() {
    	var ascii_a = 65;
    	var ascii_i = 73;
    	var ascii_o = 79;
    	var ascii_q = 81;
    	var rowStrOffset = 0;

    	for(var i = 0; i < self.room.height; i++) {
    		var id = ascii_a + i + rowStrOffset;
    		if (id == ascii_i || id == ascii_o || id == ascii_q) {
    			rowStrOffset++;
    			id++;
    		}

    		self.rowStrings.push(String.fromCharCode(id));
    	}
    }

    self.cellClass = function(cell) {
    	if (!cell.realCell || !cell.realCell.valid) return 'dead';
    	if (cell.realCell && cell.realCell.leftHanded) return 'left';
    	return 'right';
    }

    self.toggleLeft = function(cell) {
    	if (cell.realCell)
    		cell.realCell.leftHanded = !cell.realCell.leftHanded;
    }

    self.toggleGhost = function(cell) {
    	if (cell.realCell) {
    		cell.realCell.ghostSeat = true;
    		self.room.totalSeats--;
    		cell.realCell.valid = false;

    		var j = cell.vX;
    		var i = cell.vY;
    		var x = cell.realCell.x;
    		j += 1;
	    	for (; j < self.maxWidth; j++) {
	    		if (self.virtualMap[i][j].realCell && self.virtualMap[i][j].realCell.valid) {
	    			self.virtualMap[i][j].realCell = self.physicalMap[i][x];
	    			self.virtualMap[i][j].realCell.valid = true;
	    			self.virtualMap[i][j].realCell.ghostSeat = false;
	    			x += 1;
	    		}
	    	}

	    	cell.realCell = null;

    	}
    }

    self.placeSeat = function(cell) {
    	// verify that placing a seat will not exceed with
    	var j = cell.vX;
    	var i = cell.vY;
    	var fromBack = false;
    	var counter = 0;
    	for(var k = 0; k < self.maxWidth; k++) {
    		if (self.virtualMap[i][k].realCell && self.virtualMap[i][k].realCell.valid)
    			counter++;
    	}

    	console.log(counter);
    	if (counter >= self.room.width) {
    		growl.error('Can not place a seat. It will exceed the width');
    		return;
    	}

    	// get nearest valid cell
    	var nearestCell = null;
    	for (var k = j; k >= 0; k--) {
    		if (self.virtualMap[i][k].realCell) {
    			nearestCell = self.virtualMap[i][k].realCell;
    			fromBack = true;
    			break;
    		}
    	}

    	// nothing from the back. check forward
    	if (nearestCell == null) {
    		for(var k = j; k < self.maxWidth; k++) {
    			if (self.virtualMap[i][k].realCell) {
    				nearestCell = self.virtualMap[i][k].realCell;
    				fromBack = false;
    				break;
    			}
    		}
    	}

    	// value of nearest cell;
    	var x = nearestCell.x;
    	if (fromBack) x += 1;
    	var nearestCell = self.physicalMap[i][x];
    	self.virtualMap[i][j].realCell = nearestCell;
    	self.virtualMap[i][j].realCell.valid = true;
   		self.virtualMap[i][j].realCell.ghostSeat = false;    	
    	x += 1;
    	j += 1;
    	for (; j < self.maxWidth; j++) {
    		if (self.virtualMap[i][j].realCell && self.virtualMap[i][j].realCell.valid) {
    			self.virtualMap[i][j].realCell = self.physicalMap[i][x];
    			self.virtualMap[i][j].realCell.valid = true;
    			self.virtualMap[i][j].realCell.ghostSeat = false;
    			x += 1;
    		}
    	}
    	self.room.totalSeats++;
    }

    self.separateSeats = function(cell) {
    	if (cell.realCell) {
    		var i = cell.vY;
    		var j = cell.vX;

    		if (self.separateSeatsHelper(i,j))
    			growl.success('Shifted');
    		else
    			growl.error('Not enough room to shift');
    			
    	}
    }

    self.separateSeatsHelper = function(i,j) {
    	if (!self.virtualMap[i][j].realCell || !self.virtualMap[i][j].realCell.valid) 
    		return true;
    	
    	if (self.shiftLeft) {
    		if (j-1 >= 0) { 
    			if (self.separateSeatsHelper(i,j-1)) {
    				self.virtualMap[i][j-1].realCell = self.virtualMap[i][j].realCell;
    				self.virtualMap[i][j].realCell = null;
    			} else {
    				return false;
    			}
    		} else return false;
    	} else {
    		if (j+1 < self.maxWidth) { 
    			if (self.separateSeatsHelper(i,j+1)) {
    				self.virtualMap[i][j+1].realCell = self.virtualMap[i][j].realCell;
    				self.virtualMap[i][j].realCell = null;
    			} else {
    				return false;
    			}
    		} else return false;
    	}

    	return true;
    }

    self.doNothing = function(cell) {
    	return;
    }

	self.options = [
		{
			val: self.doNothing,
			text: 'Apply Nothing'
		},
		{
			val: self.toggleLeft,
			text: 'Assign Left'
		},
		{
			val: self.toggleGhost,
			text: 'Assign Ghost'
		},
		{
			val: self.separateSeats,
			text: 'Separate Seats'
		},
		{
			val: self.placeSeat,
			text: 'Place Seat'
		}
	];
	self.handleClick = self.options[0].val;
	self.directions = [
		{
			val: true,
			text: 'Left'
		},
		{
			val: false,
			text: 'Right'
		}
	];
	self.shiftLeft = self.directions[0].val;

	self.saveMapping = function() {
		var map = [];
		map.push(self.virtualMap);
		map.push(self.physicalMap);
		self.room.map = map;
		console.log(self.room.map);
		resource.rooms.updateRoom({id: self.room._id, room: self.room},
			function success(room) {
				console.log(room);
				growl.success('Room Updated');
			}, function error(err){
				growl.error('Error updating the room');
			}
		);
	}

	self.next = function() {
		$state.go('dashboard.publish', {id: $stateParams.id});
	}
}]);