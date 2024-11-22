@echo off
echo Building the project...
call npm run build

echo Deploying to GitHub Pages...
cd dist

echo Initializing git repository...
git init
git checkout -b main
git add -A
git config --local user.email "your-email@example.com"
git config --local user.name "Your Name"
git commit -m "deploy"

echo Pushing to gh-pages branch...
git push -f https://github.com/zhongs/excel-reader.git main:gh-pages

cd ..
