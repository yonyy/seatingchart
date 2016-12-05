'use strict';
angular.module('app').controller('pdfDownloadController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModalInstance', 'growl', 'students', 'event', 'room',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModalInstance, growl, students, event, room) {
    var self = this;

    self.formatText = '';
    self.pdfTitle = event.name;
    self.pdfName = event.name.toLowerCase();
    self.dateStr = $filter('date')(event.date, 'mediumDate');
    self.timeStr = $filter('date')(event.time, 'shortTime');
    self.confidential_text = ''
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

    self.predicate = self.formats[0];
    students = students.filter(function(elmt){ return elmt.email != null});

    self.generateDoc = function(confidential_text, pdfTitle, predicate) {
        return {
            content: [
                {
                    text: confidential_text, style: 'secrecy', alignment: 'center'
                },
                {
                        style: 'label',
                        alignment: 'right',
                        table: {
                                body: [
                                        [predicate.substring(0,16)],
                                ]
                        }
                },
                {
                    text: event.section + " " + pdfTitle + " in " + room.name, style: 'header'
                },
                {
                    text: self.dateStr + " at " + self.timeStr + "      Total Students: " + students.length + "\n\n", style: 'header'
                },
                {
                    columns: []
                }
            ],
            styles: {
                header: {fontSize: 14},
                predicate: {fontSize: 14, bold: true, italics: true},
                student: {fontSize: 10},
                secrecy: {fontSize: 14, bold: true},
                label: {bold: true}
            }
        }
    }

    self.download = function(predicate) {
        //console.log(students);
        var container = [];
        var colIndex = 4;
        var midterm = false;

        switch(predicate) {
            case 'ln':
                container = students.sort(self.sortByName);
                self.formatText = 'Last Name Sorted';
                self.confidential_text = '';
                break;

            case 'lnmdt':
                container = students.sort(self.sortByName);
                self.formatText = 'Last Name Sorted';
                self.confidential_text = '----------- For Students Only -----------';
                midterm = true;
                break;
            case 'row':
                container = students.sort(self.sortByRow);
                self.formatText = 'Row Sorted';
                self.confidential_text = '----------- For Instructors Only -----------';
                break;
            
            case 'col':
                container = students.sort(self.sortByColumns);
                self.formatText = 'Column Sorted';
                self.confidential_text = '----------- For Instructors Only -----------';
                break

        }

        self.docDefinition = self.generateDoc(self.confidential_text, self.pdfTitle, self.predicate.text);

        if (midterm) {
/*            self.docDefinition = self.writeStudents(self.docDefinition, container, colIndex);
            pdfMake.createPdf(self.docDefinition).open();
            pdfMake.createPdf(self.docDefinition).download(self.formatText + self.pdfName);*/
            
            self.confidential_text = '----------- For Students Only -----------';
            var containers = self.separateStudents(container);
            self.docDefinition = self.generateDoc(self.confidential_text, self.pdfTitle, self.predicate.text)
            self.docDefinition = self.writeGroupStudents(self.docDefinition, containers);
            pdfMake.createPdf(self.docDefinition).open();
            pdfMake.createPdf(self.docDefinition).download("StudentVersion" + self.formatText + self.pdfName);

        } else {
            self.docDefinition = self.writeStudents(self.docDefinition, container, colIndex);
            pdfMake.createPdf(self.docDefinition).open();
            pdfMake.createPdf(self.docDefinition).download(self.formatText + self.pdfName);
        }
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
            var rangeStr = fromStr + " to " + toStr;
            
            docDefinition.content[colIndex] = {text: rangeStr, bold: true, fontSize: 15};
            docDefinition.content.push({columns: []});
            colIndex++;

            docDefinition = self.writeStudents(docDefinition, group, colIndex);
            if (index < containers.length-1) {
                docDefinition.content.push({text: '', pageBreak: 'after'});
                docDefinition.content.push({text: ''});
                colIndex += 2;
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
                " " + lastname.split(" ")[0].substring(0,9) + ", " + 
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
            console.log(groups.value);
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

}]);