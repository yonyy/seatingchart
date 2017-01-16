'use strict';
angular.module('app').controller('pdfDownloadController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModalInstance', 'growl', 'students', 'event', 'room',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModalInstance, growl, students, event, room) {
    var self = this;
    var titleCase = function (str) {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(function(word) {
            return word.replace(word[0], word[0].toUpperCase());
        }).join(' ');
    };

    self.formatText = '';
    self.pdfTitle = event.name;
    self.dateStr = $filter('date')(event.date, 'mediumDate');
    self.timeStr = $filter('date')(event.date, 'shortTime');
    self.pdfName = titleCase(event.name) + " " + titleCase(event.section) + " " + self.dateStr + " " + self.timeStr + " " + room.name; 
    // CSE 12 Quiz 5 Thurs 4:30pm - 4:50pm, Center Hall 119
    self.confidential_text = '';
    self.formats = [
        {
            text: 'Last Name Sorted',
            val: 'ln'
        },
        {
            text: 'Last Name Sorted (Grouped By Last Name) [For Finals and Midterms]',
            val: 'lnmdt'
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

    if ($stateParams.lab) {
        self.formats.push({
            text: 'Grid Layout',
            val: 'grd'
        });
    }

    self.predicate = self.formats[0];
    students = students.filter(function(elmt){ return elmt.email != null});

    var generateHeader = function() {
        return {
            alignment: 'right',
            table: {
                body: [
                    [{text: self.pdfTitle + " " + event.section, style: 'header'}]
                ]
            }
        };
    };

    var generateSubHeader = function() {
        return {
            text: self.confidential_text, style: 'secrecy', alignment: 'center'
        }
    };

    var generatePredicate = function() {
        return {
            style: 'label',
            alignment: 'center',
            table: {
                    body: [
                            [self.predicate.text.substring(0,16)],
                    ]
            }
        };
    };

    var generatorMetaData = function() {
        return {
            text: self.dateStr + " at " + self.timeStr + " in " + room.name +  "      Total Students: " + students.length + "\n\n", style: 'header'
        };
    };

    self.generateDoc = function(confidential_text, pdfTitle, predicate) {        
        return {
            content: [generateHeader(),generateSubHeader(),generatePredicate(),generatorMetaData(),{columns: []}],
            styles: {
                header: {fontSize: 14, bold: true},
                predicate: {fontSize: 14, bold: true, italics: true},
                student: {fontSize: 10},
                secrecy: {fontSize: 14, bold: true},
                label: {bold: true},
                grid: {fontSize: 9}
            }
        }
    }

    self.download = function(predicate) {
        //console.log(students);
        var container = [];
        var colIndex = 4;
        var midterm = false;
        var grid = false;
        self.lastNameLength = 9;
        self.firstNameLength = 6;
        
        switch(predicate) {
            case 'grd':
                container = room.pmap;
                self.formatText = 'Grid Layout';
                self.confidential_text = '----------- For Students -----------';
                grid = true;
                break;
            case 'ln':
                container = students.sort(self.sortByName);
                self.formatText = 'Last Name Sorted';
                self.confidential_text = '----------- Seating Chart -----------';
                break;
            case 'lnmdt':
                container = students.sort(self.sortByName);
                self.formatText = 'Last Name Sorted (Into Groups)';
                self.confidential_text = '----------- Exam Turnin -----------';
                midterm = true;
                self.lastNameLength = 30; // max it out
                self.firstNameLength = 30; // max it out
                break;
            case 'row':
                container = students.sort(self.sortByRow);
                self.formatText = 'Row Sorted';
                self.confidential_text = '----------- Attendance Reconciliation -----------';
                break;
            
            case 'col':
                container = students.sort(self.sortByColumns);
                self.formatText = 'Column Sorted';
                self.confidential_text = '----------- For Instructors Only -----------';
                break

        }

        self.docDefinition = self.generateDoc(self.confidential_text, self.pdfTitle, self.predicate.text);

        if (midterm) {
            var containers = self.separateStudents(container);
            self.docDefinition = self.generateDoc(self.confidential_text, self.pdfTitle, self.predicate.text)
            self.docDefinition = self.writeGroupStudents(self.docDefinition, containers);
            pdfMake.createPdf(self.docDefinition).open();
            pdfMake.createPdf(self.docDefinition).download("StudentVersion" + self.formatText + self.pdfName);

        } else if (grid) {
            self.docDefinition.pageOrientation = 'landscape';
            self.docDefinition = self.createGrid(self.docDefinition, container, colIndex);
            pdfMake.createPdf(self.docDefinition).open();
            pdfMake.createPdf(self.docDefinition).download(self.formatText + self.pdfName);
        } else {
            self.docDefinition = self.writeStudents(self.docDefinition, container, colIndex);
            pdfMake.createPdf(self.docDefinition).open();
            pdfMake.createPdf(self.docDefinition).download(self.formatText + self.pdfName);
        }
    }


    self.createGrid = function(docDefinition, container, colIndex) {
        var widths = [];
        var totalStudents = 0;
        for (var i = 0; i < room.width; i++ ) {
            widths.push('*');
        }

        docDefinition.content[colIndex] = {
            table: {
                widths: widths,
                body: []
            }
        };

        var partnerString = function(seat) {
            if (!seat.valid) {
                return 'Unavailable';
            }
            var str = {text: seat.id + '\n\n', style: 'grid'};
            for (var i = 0; i < seat.students.length; i++) {
                if (seat.students[i].email) {
                    totalStudents++;
                }
                var stud = seat.students[i];
                var fName = stud.firstName.substring(0,self.firstNameLength);
                var lName = stud.lastName.substring(0,self.lastNameLength)
                str.text += fName + ' ' + lName + ' ________' + '\n ';
            }

            return str;
        }

        for(var i = 0; i < room.height; i++) {
            var gridRow = [];
            for(var j = 0; j < room.width; j++) {
                gridRow.push(partnerString(container[i][j]));
            }
            docDefinition.content[colIndex].table.body.push(gridRow);
        }

        var totalStudentsStr = "\n\nTotal Students: " + totalStudents.toString() + "\n";
        var totalSeats = "Total Seats: " + room.totalSeats.toString() + "\n";
        var actualPresent = "# of Students Absent: _____\n";
        var tutorInfo = "Tutor taking attendance: _____\n"
        var extraInfo = [totalStudentsStr, totalSeats, actualPresent, tutorInfo];
        var text = {text: '', style: 'student'};
        for (var i = 0; i < extraInfo.length; i++) {
            text.text += extraInfo[i];
        }

        docDefinition.content.push(text);

        return docDefinition;

    }

    self.writeStudents = function (docDefinition, container, colIndex) {
        var text = {text: '', style: 'student'};
        var maxPerCol = 56;
        var tracker = 1;
        var totalStudents = 0;
        var empty = [];
        
        for (var i = 0; i < container.length; i++) {
            
            if (tracker == maxPerCol) {
                docDefinition.content[colIndex].columns.push(text);
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
        var actualPresent = "# of Students Absent: _____\n";
        var tutorInfo = "Tutor taking attendance: _____\n"
        var extraInfo = [totalStudents, totalSeats, actualPresent, tutorInfo];
        if (maxPerCol - tracker < 5) {
            docDefinition.content[colIndex].columns.push(text);
            text = {text: '', style: 'student'};
        }

        for (var i = 0; i < extraInfo.length; i++) {
            text.text += extraInfo[i];
        }

        docDefinition.content[colIndex].columns.push(text);
        return docDefinition;
    }

    self.writeGroupStudents = function(docDefinition, containers) {
        var colIndex = 4;
        var fromStr = "";
        var toStr = "";
        for (var index = 0; index < containers.length; index++) {
            var group = containers[index];
            
            fromStr = group[0].lastName.substring(0,1);
            toStr = group[group.length-1].lastName.substring(0,1);
            var rangeStr = fromStr.toUpperCase() + " to " + toStr.toUpperCase();
            
 //           docDefinition.content[colIndex] = {text: rangeStr, bold: true, fontSize: 20};
            docDefinition = self.writeStudents(docDefinition, group, colIndex);
            docDefinition.content[colIndex].columns.push({text: rangeStr, bold: true, fontSize: 60});

            if (index < containers.length-1) {
                docDefinition.content.push({text: '', pageBreak: 'before'});
                docDefinition.content.push(generateHeader());
                docDefinition.content.push(generateSubHeader());
                docDefinition.content.push(generatePredicate());
                docDefinition.content.push(generatorMetaData());
                docDefinition.content.push({columns: []});
                colIndex += 6;
            }
        }

        return docDefinition;
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
                " " + lastname.split(" ")[0].substring(0,self.lastNameLength) + ", " + 
                firstname.substring(0,self.firstNameLength) + "\n";
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


    self.separateStudents = function (container) {
        var lastnameCounter = [];
        var containers = [];
        var filteredContainer = container.filter(function(elmt){
            return (elmt.email != null);
        });

        var threshold = 40;

        var currentLN = filteredContainer[0].lastName.charAt(0);
        var counter = 0;
        for (var index = 0; index < filteredContainer.length; index++) {
            if (filteredContainer[index].lastName.charAt(0) == currentLN) {
                counter ++;
            } else {
                lastnameCounter.push(counter);
                counter = 1;
                currentLN = filteredContainer[index].lastName.charAt(0);
            }
        }

        lastnameCounter.push(counter);
        
        var generator = function*() {
            var perGroup = 0;
            for (var index = 0; index < lastnameCounter.length; index++) {
                if (perGroup + lastnameCounter[index] <= (threshold*1.20)) {
                    perGroup += lastnameCounter[index];
                } else {
                    yield perGroup;
                    perGroup = lastnameCounter[index];
                }
            }

            yield perGroup;
        }

        var gen = generator();
        var groups = gen.next();
        var tracker = 0;
        while(groups.value) {
            var group = [];
            for (var index = 0; index < groups.value; index++) {
                group.push(filteredContainer[tracker]);
                tracker++;
            }
            containers.push(group);
            groups = gen.next();
        }

        return containers;
    }


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

    self.sortByGrid = function(station1, station2) {
        if (parseInt(station1.id,10) < parseInt(station2.id,10));
           return -1;
        if (parseInt(station1.id,10) > parseInt(station2.id,10));
            return 1;
        return 0;
    }


}]);