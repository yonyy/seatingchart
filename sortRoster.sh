#!/bin/bash

# Sort the roster
sections=(`sort $1 | grep CSE | awk '{print $1}'`)

# Add exam ids based upon last name and line number
sort -k 3,3 $1 | grep -v CSE | sed 's|,||g' > sortedByLastName
lineNum=0
while read line; do
  lineNum=$((lineNum+1))
  lineArray=($line)
  # echo -ne ${lineArray[1]}'\t' 
  echo -ne ${lineArray[2]}'\t' 
  echo -ne ${lineArray[3]}'\t' 
  echo -ne ${lineArray[-1]::-1}'\t' 
  echo -ne ${lineArray[0]}'\t' 
  echo $lineNum
done <sortedByLastName >formattedSorted
rm sortedByLastName

# Sort by section and then output to two separate files with the section name
for section in ${!sections[*]}
do
  filename=`sort $1 | grep CSE | grep ${sections[$section]} | sed 's|[ \t]|-|g'` 
  sort formattedSorted | grep -v CSE | grep ${sections[$section]} \
    > $filename.txt
done


rm formattedSorted
