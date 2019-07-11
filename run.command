#! /bin/bash

here="`dirname \"$0\"`"
echo "cd-ing to $here"
cd "$here" || exit 1
cd ./Frontend
npm install  
npm audit fix  
npm start  &
cd ../Backend/
npm install  
npm audit fix  
npm start  
