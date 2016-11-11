'use strict';
angular.module('app').controller('pdfDownloadController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModalInstance', 'growl', 'students', 'room',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModalInstance, growl, students, room) {
    var self = this;

    self.formatText = '';
    self.pdfTitle = '';
    self.formats = [
        {
            text: 'Last Name Sorted',
            val: 'ln'
        },
        {
            text: 'Column Sorted',
            val: 'col'
        },
        {
            text: 'Row Sorted',
            val: 'row'
        }
    ];

    self.predicate = self.formats[0];

    
/*    self.flatten = function(seats) {
        var flattened = [];
        for (var i = 0; i < seats.length; i++) {
            for (var j = 0; j < seats[i].length; j++) {
                flattened.push(seats[i][j]);
            }
        }

        return flattened;
    }

    var flat_seats = self.flatten(seats);*/

    //console.log(students);
    self.download = function(predicate) {
        //console.log(students);
        var container = []
        var empty = [];
        self.docDefinition = {
            content: [
                {
                    text: [
                        {text: self.pdfTitle + ' -- ', style: 'header'},
                        {text: self.predicate.text + "\n\n", style: 'predicate'}
                    ]
                },{
                    columns: []
                }
            ],
            styles: {
                header: { fontSize: 14 },
                predicate: {fontSize: 14, bold: true, italics: true},
                student: {fontSize: 10}
            }
        }

        self.docDefinition.content[1].columns = [];

        switch(predicate) {
            case 'ln':
                container = students.sort(self.sortByName);
                self.formatText = 'Last Name Sorted';
                break;

            case 'row':
                container = students.sort(self.sortByRow);
                self.formatText = 'Row Sorted';
                break;
            
            case 'col':
                container = students.sort(self.sortByColumns);
                self.formatText = 'Column Sorted';
                break

        }

        var text = {text: '', style: 'student'};
        var maxPerCol = 56;
        var tracker = 1;
        var totalStudents = 0;
        for (var i = 0; i < container.length; i++) {
            
            if (tracker == maxPerCol) {
                self.docDefinition.content[1].columns.push(text);
                text = {text: '', style: 'student'};
                tracker = 1;
            }

            if (container[i].email) {
                text.text += self.toString(container[i]);
                tracker++;
                totalStudents++;
            } else {
                empty.push(self.toString(container[i]));
            }
        }

        var totalStudents = "\n\nTotal Students: " + totalStudents.toString() + "\n";
        var totalSeats = "Total Seats: " + room.totalSeats.toString() + "\n";
        var actualPresent = "# of Students Absent: _____\n"
        var extraInfo = [totalStudents, totalSeats, actualPresent];
        if (maxPerCol - tracker < 5) {
            self.docDefinition.content[1].columns.push(text);
            text = {text: '', style: 'student'};
        }

        for (var i = 0; i < extraInfo.length; i++) {
            text.text += extraInfo[i];
        }

        self.docDefinition.content[1].columns.push(text);
        console.log(self.docDefinition);
        pdfMake.createPdf(self.docDefinition).open();
        pdfMake.createPdf(self.docDefinition).download(self.pdfName + self.formatText);


    }

    self.toString = function(student) {
        //console.log(student);
        var seatId = student.seat.id.toString();
        var firstname = student.firstName;
        var lastname = student.lastName;
        var studentId = student.studentID.toString();

        if (seatId.length < 3 ) seatId += "  ";
        /*  ID Seat Last Name, First Name */
        return self.padZero(studentId,3) + " _____ " + seatId + 
                " " + lastname.substring(0,7) + ", " + 
                firstname.substring(0,7) + "\n";
    }

    self.padZero = function(str, maxPad) {
        for (var i = str.length; i < maxPad; i++) {
            str = "0" + str;
        }

        return str;
    }



    self.close = function() {
        $uibModalInstance.close();
    };

    /* Comparison functions to sort by lastname */
    self.sortByName = function(stud1, stud2) {
        if (stud1.lastName < stud2.lastName)
            return -1;
        if (stud1.lastName > stud2.lastName)
            return 1;
        if (stud1.lastName == stud2.lastName) {
            if (stud1.firstName < stud2.firstName)
                return -1
            else
                return 1
        }
        
        return 0;
    }

    /* Comparison function to sort by row */
    self.sortByRow = function (stud1, stud2) {
        var seatPos1 = stud1.seat.id;
        var seatPos2 = stud2.seat.id;
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

    self.sortByColumns = function(stud1, stud2) {
        var seatPos1 = stud1.seat.id;
        var seatPos2 = stud2.seat.id;
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

        if(int_pos1 == int_pos2) {
            if (row1 < row2)
                return -1;
            else
                return 1;
        }
        else if(int_pos1 < int_pos2)
            return -1;
        else
            return 1;
    }

}]);