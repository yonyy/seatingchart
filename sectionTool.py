import sys
import json
import requests

from bs4 import BeautifulSoup

section_data = open('sections.xls')

# Grab every table in the sections file
table_data = [table for table in BeautifulSoup(section_data)("table")]
table_index = 0

# look through every table, filtering out the important, student_info
# sections of the file
for table in table_data:
    table_id = table.get('id')
    if ( table_id ):
        # if it is a student info table, create the roster object
        if ( "DataList1_DataGrid1" in table_id ):
            roster_obj = {}

            # Grab the section name
            section_text = table_data[table_index - 1]("td")[0].text.split('\n')
            roster_obj['name'] = section_text[2].lstrip().rstrip().encode('ascii','ignore')
            roster_obj['students'] = []
            if ( len( sys.argv ) == 1 ):
                print ( roster_obj['name'] )

            # handle the student data for this section
            student_data = [[cell.text for cell in row("td")]
              for row in table("tr")]
            totalStudents = 0
            for data_point in student_data[1:]:
                # Build student object for insertion into array
                stu_obj = {"isLeftHanded": False}
                stu_name = data_point[0].split(' ')
                stu_obj['lastName'] = stu_name[1].encode('ascii','ignore')
                stu_obj['firstName'] = stu_name[0].encode('ascii','ignore')
                stu_obj['email'] = data_point[2][1:-1].encode('ascii','ignore')
                stu_obj['studentID'] = totalStudents + 1
                #stu_section = data_point[3]
                if ( len( sys.argv ) == 1 ):
                    print ( stu_obj['lastName'] + '\t' +
                            stu_obj['firstName'] + '\t'
                            + stu_obj['email'] );

                roster_obj['students'].append( stu_obj )

                totalStudents += 1

            roster_obj['totalStudents'] = totalStudents
            request_obj = {'roster': roster_obj}
            if ( len( sys.argv ) == 2 ):
                if ( sys.argv[1] == "post" ):
                    req = requests.post("http://cseseatingcharts.herokuapp.com/api/rosters",
                            json=request_obj )

    table_index += 1


    # if ( item[0] == "Student Name" ):
    #     print item[0]
