'use strict';
angular.module('app').controller('roomPublishController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl) {
	var self = this;
	self.events = null;
	self.room = null;
	self.roster = null;
	self.virtualMap = null;
	self.physicalMap = null;
    self.islands = [];
    self.hasBeenMarkedMarked = [];
    self.sIndex = 0;

    resource.events.getByID({id: $stateParams.id},
        function success(event) {
            self.event = event;
            
            resource.rosters.getByID({id: event.rosterID},
                function success(roster) {
                    self.roster = roster;
                }, function error(err) {
                    growl.error('Error retrieving roster');
                }
            );

            resource.rooms.getByID({id: event.roomID},
                function success(room) {
                    self.room = room;
                    self.virtualMap = room.vmap;
                   	self.physicalMap = room.pmap;
                    self.findIslands();
                    self.beginProcess();

                }, function error(err) {
                    growl.error('Error retrieving room');
                    console.log(err);
                }
            );

        }, function error(err) {
            console.log(err);
        }
    );

    self.cellClass = function(cell) {
    	if (!cell.realCell || !cell.realCell.valid) return 'dead';
    	if (cell.realCell && cell.realCell.leftHanded) return 'left';
        if (cell.realCell && !cell.realCell.isEmpty) return 'assigned';
    	return 'right';
    }

    self.findIslands = function() {
        for (var i = 0; i < self.virtualMap.length; i++) {
            self.hasBeenMarkedMarked.push([]);
            for (var j = 0; j < self.virtualMap[i].length; j++) {
                self.hasBeenMarkedMarked[i].push(false);
            }
        }        

        for (var i = 0; i < self.virtualMap.length; i++) {
            for (var j = 0; j < self.virtualMap[i].length; j++) {
                if (!self.hasBeenMarkedMarked[i][j]) {
                    if (self.virtualMap[i][j].realCell 
                            && self.virtualMap[i][j].realCell.valid) {

                        self.islands.push([]);
                        var index = self.islands.length - 1;
                        self.findIslandsHelper(i,j,index);
                    } else {
                        self.hasBeenMarkedMarked[i][j] = true;
                    }
                }
            }
        }
    }

    self.findIslandsHelper = function(i,j,island) {
        if (i >= self.virtualMap.length || i < 0) return;
        if (j >= self.virtualMap[0].length || j < 0) return;
        if (self.hasBeenMarkedMarked[i][j]) return;

        self.hasBeenMarkedMarked[i][j] = true;
        if (!self.virtualMap[i][j].realCell 
                || !self.virtualMap[i][j].realCell.valid) {
            return;
        }
            
        self.islands[island].push(self.virtualMap[i][j].realCell);

        self.findIslandsHelper(i+1,j,island);
        self.findIslandsHelper(i-1,j,island);
        self.findIslandsHelper(i,j+1,island);
        self.findIslandsHelper(i,j-1,island);

        return;
    }

    self.buildSubClass = function(island) {
        var subClass = [];
        var currentRow = "";
        var index = -1;
        
        for (var i = 0; i < island.length; i++) {
            var rowStr = island[i].id[0];
            
            if (rowStr == currentRow) {
                subClass[index].push(island[i]);
            } else {
                currentRow = rowStr;
                subClass.push([]);
                index++;
                subClass[index].push(island[i]);
            }
        }

        return subClass;

    }

    self.beginProcess = function() {
        self.prepareIslands();
        self.roster.students = self.shuffle(self.roster.students, 0);
        for (var i = 0; i < self.islands.length; i++) {
            var total = self.islands[i].length;
            var info = self.getQuotaAndOffset(total);
            var subClass = self.buildSubClass(self.islands[i]);
            self.applyStudents(subClass, info.quota, info.offset);
        }
    }

    self.getQuotaAndOffset = function(total) {
        var ratio1 = total / self.room.totalSeats;
        var ratio2 = self.roster.totalStudents / self.room.totalSeats;
        var offset = self.getOffsets(ratio2);
        var quota = Math.floor(ratio1 * self.roster.totalStudents) + 1;
        if (quota > (self.roster.totalStudents - self.sIndex))
            quota = self.roster.totalStudents - self.sIndex

        return {quota: quota, offset: offset};
    }

    self.applyStudents = function(subClass, quota, offset) {
        var counter = 0;

        (function() {
            while(counter < quota) {
                for (var i = 0; i < subClass.length; i += (offset.row + 1)) {
                    for (var j = 0; j < subClass[i].length; j += (offset.col + 1)) {
                        if (subClass[i][j].isEmpty) {
                            subClass[i][j].isEmpty = false;
                            counter += self.room.numPerStation;
                            if (counter >= quota) return;
                        }
                    }
                }
                if (counter < quota) {
                    for (var i = 0; i < subClass.length; i -= (offset.row + 1)) {
                        for (var j = 0; j < subClass[i].length; j += 1) {
                            if (subClass[i][j].isEmpty) {
                                subClass[i][j].isEmpty = false;
                                counter += self.room.numPerStation;
                                if (counter >= quota) return;
                            }
                        }
                    }   
                }

            }
        })();

        for (var i = 0; i < subClass.length; i++) {
            for (var j = 0; j < subClass[i].length; j++) {
                if (!subClass[i][j].isEmpty) {
                    subClass[i][j].students = [];
                    for (var s = 0; s < self.room.numPerStation; s++) {
                        if (self.sIndex >= self.roster.students.length) {
                            subClass[i][j].students.push({
                                firstName: 'EMPTY',
                                lastName: 'EMPTY',
                                email: null,
                                studentID: 0,
                                isLeftHanded: false
                            });
                        } else {
                            subClass[i][j].students.push(self.roster.students[self.sIndex]);
                            self.roster.students[self.sIndex].seat = {
                                id: subClass[i][j].id,
                                x: subClass[i][j].x,
                                y: subClass[i][j].y
                            }
                            self.sIndex++;
                        }
                    }
                } else {
                    subClass[i][j].students = [];
                    for (var s = 0; s < self.room.numPerStation; s++) {
                        subClass[i][j].students.push({
                            firstName: 'EMPTY',
                            lastName: 'EMPTY',
                            email: null,
                            studentID: 0,
                            isLeftHanded: false
                        });
                    }
                }
            }
        }
    }

    self.display = function(cell) {
        console.log(cell);
    }
    // prepares the all the islands by sorting them and assigning the seats
    // as empty
    self.prepareIslands = function() {
        for (var i = 0; i < self.islands.length; i++) {
            self.islands[i] = self.prepareIsland(self.islands[i]);
        }
    }

    // prepares a single island
    self.prepareIsland = function(island) {
        return island.sort(self.sortByRow);
    }

    // given ratio returns object instructing how to
    // spread students
    self.getOffsets = function(ratio) {
        var offset = {};
        if (ratio <= .20) {
            offset.col = 2;
            offset.row = 1;
        } else if (ratio <= .50) {
            offset.col = 1;
            offset.row = 1;
        } else if (ratio <= .80) {
            offset.col = 1;
            offset.row = 0;
        } else {
            offset.col = 0;
            offset.row = 0;
        }

        return offset;
    }


    self.applyChange = function(student){
        var target = student.seat.id;   // get id of the targeted seat
        var origin = self.physicalMap[student.seat.y][student.seat.x].id;   // get id of current seat

        // create an array that should hold the targeted seat
        var targetSeat = self.physicalMap.filter(function(seat) {
            return seat.id == target;
        });

        // if array is empty, targeted seat is nonexistent
        if (targetSeat.length == 0) {
            growl.error('Invalid seat requested');
            return;
        }

        // verifying that there is a spot avaliable if the seat holds more than one
        var targetIndex = -1;
        if (targetSeat.students.length > 1) {
            for (var i = 0; i < targetSeat.students.length; i++) {
                if (targetSeat.students[i].id == 0){
                    targetIndex = i;
                    break;
                }
            }
        } else targetIndex = 0; // if the seat only holds one person, then just swap them

        // print error message if no space is available
        if (targetIndex == -1) {
            growl.error('Seat is completely occupied. Please insert an empty seat');
            return;
        }

        // create an array that should hold the original seat
        var originSeat = seat.physicalMap.filter(function(seat) {
            return seat.id == origin;
        });

        // finding the index at which the student is stored in the students array
        var originIndex = 0;
        for (var i = 0; i < originSeat.students.length; i++) {
            if (originSeat.students[i].id == student.id) {
                originIndex = i;
                break;
            }
        }

        // temp variable to hold the student to swap with
        var holder = targetSeat.students[targetIndex];
        targetSeat.students[targetIndex] = originSeat.students[originIndex];
        originSeat.students[originIndex] = holder;

        // update values of students
        targetSeat.students[targetIndex].id = targetSeat.id;
        targetSeat.students[targetIndex].x = targetSeat.x;
        targetSeat.students[targetIndex].y = targetSeat.y;

        originSeat.students[originIndex].id = originSeat.id;
        originSeat.students[originIndex].x = originSeat.x;
        originSeat.students[originIndex].y = originSeat.y;

        targetSeat.isEmpty = false; // targeted seat is no long empty
        originSeat.isEmpty = true;  // original seat might be empty

        // verifies is original seat is empty
        for (var i = 0; i < originSeat.students.length; i++){
            if (originSeat.students[i].id != 0) {
                originSeat.isEmpty = false;
            }
        }

        growl.success('Swapped seats');

    }

    self.discardChange = function(student) {
        student.seat.id = self.physicalMap[student.seat.y][student.seat.x].id;
    }

    /* Comparison function to sort by row */
    self.sortByRow = function (s1, s2) {
        var seatPos1 = s1.id;
        var seatPos2 = s2.id;
        var row1 = seatPos1[0]
        var row2 = seatPos2[0]
        var pos1 = "";
        var pos2 = "";

        for (var i = 1; i < seatPos1.length; i++) {
            pos1 += seatPos1[i]
        }

        for (var i = 1; i < seatPos2.length; i++) {
            pos2 += seatPos2[i];
        }

        var int_pos1 = parseInt(pos1,10);
        var int_pos2 = parseInt(pos2,10);

        if(row1 == row2) {
            if (int_pos1 < int_pos2)
                return -1;
            else
                return 1;
        }
        else if(row1 < row2)
            return -1;
        else
            return 1;
    }

    // Function that shuffles the array
    self.shuffle = function (array, seed) {
        if (!isNaN(seed))   // If seed is a number
            Math.seedrandom(seed)
        var currentIndex = array.length
        var temporaryValue
        var randomIndex

        // While there remain elements to shuffle...
        while (0 != currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }
}])