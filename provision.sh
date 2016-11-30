#! /bin/bash

# global env
echo "##################################################";
echo "Env Setup";
echo "##################################################";
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get update --assume-yes;
sudo apt-get -qqf install nodejs --assume-yes;		# Node
sudo apt-get -qqf install npm --assume-yes;			# NPM
