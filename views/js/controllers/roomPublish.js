'use strict';
angular.module('app').controller('roomPublishController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl) {
    var self = this;
    self.event = null;
    self.room = null;
    self.roster = null;
    self.virtualMap = null;
    self.physicalMap = null;
    self.islands = [];
    self.hasBeenMarkedMarked = [];
    self.sIndex = 0;
    self.seed = 0;
    self.osdNum = 0;
    self.excludeNum = 0;

    resource.events.getByID({id: $stateParams.id},
        function success(event) {
            self.event = event;
            self.seed = self.event.seed;
            resource.rosters.getByID({id: event.rosterID},
                function success(roster) {
                    self.roster = roster;
                    resource.rooms.getByID({id: event.roomID},
                        function success(room) {
                            self.room = room;
                            self.virtualMap = room.vmap;
                            self.physicalMap = room.pmap;
                            self.findIslands();
                            self.beginProcess();
                            self.removeOutsideBorders();

                        }, function error(err) {
                            growl.error('Error retrieving room');
                            console.log(err);
                        }
                    );
                }, function error(err) {
                    growl.error('Error retrieving roster');
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
        self.roster.students = self.shuffle(self.roster.students, self.seed);
        for (var i = 0; i < self.islands.length; i++) {
            var total = self.islands[i].length;
            var info = self.getQuotaAndOffset(total);
            var subClass = self.buildSubClass(self.islands[i]);
            self.applyStudents(subClass, info.quota, info.offset);
        }
    }

    self.removeOutsideBorders = function() {
        for (var i = 0; i < self.virtualMap[0].length; i++) {
            var insideBorder = false;

            for (var j = 0; j < self.virtualMap.length; j++) {
                if ( self.virtualMap[j][i].realCell ) {
                    insideBorder = true;
                    break;
                }
            }

            if ( !insideBorder ) {
                for (var j = 0; j < self.virtualMap.length; j++) {
                    self.virtualMap[j][i].outsideBorder = true;
                }
            } else {
                break;
            }
        }

        for (var i = self.virtualMap[0].length - 1; i >= 0; i--) {
            var insideBorder = false;

            for (var j = 0; j < self.virtualMap.length; j++) {
                if ( self.virtualMap[j][i].realCell ) {
                    insideBorder = true;
                    break;
                }
            }

            if ( !insideBorder ) {
                for (var j = 0; j < self.virtualMap.length; j++) {
                    self.virtualMap[j][i].outsideBorder = true;
                }
            } else {
                break;
            }
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
                // start from bottom row and move upwards left to right
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
                    for (var i = 0; i < subClass.length; i += (offset.row + 1)) {
                        for (var j = 1; j < subClass[i].length; j += (offset.col + 1)) {
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
                        while (self.roster.students[self.sIndex].exclude === true ||
                            self.roster.students[self.sIndex].isOsd === true) {
                            self.roster.students[self.sIndex].seat = { id: '' };
                            if (self.roster.students[self.sIndex].exclude === true) {
                                self.excludeNum++;
                            } else if (self.roster.students[self.sIndex].isOsd === true) {
                                self.osdNum++;
                            }
                            self.sIndex++;
                        }
                        if (self.sIndex >= self.roster.students.length) {
                            var emptyStudent = {
                                firstName: 'EMPTY',
                                lastName: 'EMPTY',
                                email: null,
                                studentID: 0,
                                isLeftHanded: false,
                                exclude: false,
                                seat: {
                                    id: subClass[i][j].id,
                                    x: subClass[i][j].x,
                                    y: subClass[i][j].y
                                }
                            };
                            subClass[i][j].students.push(emptyStudent);
                            self.roster.students.push(emptyStudent);
                        } else {
                            self.roster.students[self.sIndex].seat = {
                                id: subClass[i][j].id,
                                x: subClass[i][j].x,
                                y: subClass[i][j].y
                            }
                            subClass[i][j].students.push(self.roster.students[self.sIndex]);
                            self.sIndex++;
                        }
                    }
                } else {
                    subClass[i][j].students = [];
                    subClass[i][j].isEmpty = true;
                    for (var s = 0; s < self.room.numPerStation; s++) {
                        var emptyStudent = {
                            firstName: 'EMPTY',
                            lastName: 'EMPTY',
                            email: null,
                            studentID: 0,
                            isLeftHanded: false,
                            exclude: false,
                            seat: {
                               id: subClass[i][j].id,
                                x: subClass[i][j].x,
                                y: subClass[i][j].y
                            }
                        };
                        subClass[i][j].students.push(emptyStudent);
                        self.roster.students.push(emptyStudent);
                    }
                }

                self.physicalMap[subClass[i][j].y][subClass[i][j].x] = subClass[i][j];
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
            offset.col = 1;
            offset.row = 0;
        }

        return offset;
    }


    self.applyChange = function(student){
        var target = student.seat.id;   // get id of the targeted seat
        var origin = self.physicalMap[student.seat.y][student.seat.x].id;   // get id of current seat
        console.log(target);

        // get object that should hold the targeted seat
        var targetSeat = null;
        for (var i = 0; i < self.physicalMap.length; i++) {
            for (var j = 0; j < self.physicalMap[i].length; j++) {
                if (self.physicalMap[i][j].id == target)  {
                    targetSeat = self.physicalMap[i][j];
                }
            }
        }


        // if array is empty, targeted seat is nonexistent
        if (targetSeat == null) {
            growl.error('Invalid seat requested');
            return;
        }

        console.log(targetSeat);

        // verifying that there is a spot avaliable if the seat holds more than one
        var targetIndex = -1;
        if (targetSeat.students.length > 1) {
            for (var i = 0; i < targetSeat.students.length; i++) {
                if (targetSeat.students[i].studentID == 0){
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

        // get object should hold the original seat
        var originSeat = self.physicalMap[student.seat.y][student.seat.x];

        // finding the index at which the student is stored in the students array
        var originIndex = 0;
        for (var i = 0; i < originSeat.students.length; i++) {
            if (originSeat.students[i].studentID == student.studentID) {
                originIndex = i;
                break;
            }
        }

        // temp variable to hold the student to swap with
        var holder = targetSeat.students[targetIndex];
        targetSeat.students[targetIndex] = originSeat.students[originIndex];
        originSeat.students[originIndex] = holder;

        // update values of students
        targetSeat.students[targetIndex].seat.id = targetSeat.id;
        targetSeat.students[targetIndex].seat.x = targetSeat.x;
        targetSeat.students[targetIndex].seat.y = targetSeat.y;

        originSeat.students[originIndex].seat.id = originSeat.id;
        originSeat.students[originIndex].seat.x = originSeat.x;
        originSeat.students[originIndex].seat.y = originSeat.y;

        targetSeat.isEmpty = false; // targeted seat is no long empty
        originSeat.isEmpty = true;  // original seat might be empty

        // verifies is original seat is empty
        for (var i = 0; i < originSeat.students.length; i++) {
            if (originSeat.students[i].email != null) {
                originSeat.isEmpty = false;
            }
        }

        growl.success('Swapped seats');

    }

    self.discardChange = function(student) {
        student.seat.id = self.physicalMap[student.seat.y][student.seat.x].id;
    }

    self.openModal = function() {

        /* Modal */
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'partials/modals/modal-download.html',
            controller: 'pdfDownloadController',
            controllerAs: 'pdc',
            size: 'lg',
            resolve: {
                students: function () {
                    return JSON.parse(JSON.stringify(self.roster.students));
                },
                event: function() {
                    return JSON.parse(JSON.stringify(self.event));
                },
                room: function () {
                    return JSON.parse(JSON.stringify(self.room));
                }
            }
        });

        modalInstance.result.then(function () {});
    }

    self.openEmailModal = function() {
        /* Modal */
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'partials/modals/modal-email.html',
            controller: 'emailController',
            controllerAs: 'ec',
            size: 'lg',
            resolve: {
                lab: function() {
                    return $stateParams.lab;
                },
                event: function() {
                    return self.event;
                },
                students: function () {
                    return JSON.parse(JSON.stringify(self.roster.students));
                },
                room: function() {
                    return self.room.name;
                }
            }
        });

        modalInstance.result.then(function () {});
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
