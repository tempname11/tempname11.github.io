rm -rf 1 2 3
cp -r ~/Dropbox/shri/1/dist 1
cp -r ~/Dropbox/shri/2/ 2
cp -r ~/Dropbox/shri/3/dist 3
rm -rf 2/.git
git add 1 2 3
git commit -a --amend -m"."
git push -f
