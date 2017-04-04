import sys
from bs4 import BeautifulSoup

section_data = open('sections.xls')

table_data = [table# [cell.parent for cell in row("td")]
    for table in BeautifulSoup(section_data)("table")]

table_index = 0
for table in table_data:
    table_id = table.get('id')

    if ( table_id ):
        if ( "DataList1_DataGrid1" in table_id ):
            section_text = table_data[table_index - 1]("td")[0].text.split('\n')
            student_data = [[cell.text for cell in row("td")]
              for row in table("tr")]
            print( '\n' + section_text[2] + '\n' )
            for data_point in student_data[1:]:
                stu_name = data_point[0].split(' ')
                stu_last = stu_name[1]
                stu_first = stu_name[0]
                stu_email = data_point[2][1:-1]
                stu_section = data_point[3]
                print ( stu_last + '\t' + stu_first + '\t' + stu_email )

    table_index += 1


    # if ( item[0] == "Student Name" ):
    #     print item[0]
