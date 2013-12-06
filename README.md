=============
Readme.md
=============

The Server Stack for Gelfoo

The Gelfoo server is a stack built from:
Node.js - as a rapid, lightweight, javascript app server.
Express - a lightweight webserver running atop Node.
ejs - Enables embedded javascript on web pages served by express, for tighter coding.
socket.io - Atop Node to provide AJAX functionality.

To set these up from scratch

===========
Synopsis
===========
  1) Install Node.
  2) Give the Pi the network address the app expects.
  3) It should be enough from here to git pull the repo down to /var/www.

If that fails, the remaining steps to manually build the stack are:

  4) Use npm (the Node Package Manager) to install express (with ejs) and socket.io.


================
The Commands
================

Setting up Node.js
  1) Download the latest stable version of Node.js to your RPi.
  Browse to: http://nodejs.org/download/
  Right-click and copy the link for the "Source Code" version of Node
  For example: http://nodejs.org/dist/v0.10.22/node-v0.10.22.tar.gz

  2) On the RPi, download that link:
  sudo wget <the copied link address>
  
  3) Unpack that code to a temp directory:
  tar xvzf <the downloaded file>

  4) Move the code to /opt/node:
  sudo cp -r <the unpacked directory> /opt/node

  5) Optional: Link the common node commands into /usr/local/bin to make running them easier in the future:
  sudo ln -s /opt/node/bin/node /usr/local/bin/node
  sudo ln -s /opt/node/bin/npm /usr/local/bin/npm
  Now run: "source ~/ .bashrc" or log out and log in again to have these links in your path.

  6) Confirm the install was successful. Run:
  node -v
  (You should get a version number back in response.)
  and run:
  npm -v
  (Again, you should get a version number back in response.)

Next: Give the Pi the network address the server expects: 192.253.0.253
Edit your /etc/network/interfaces file to give it this address:
iface <wlan0 or eth0> inet static
        address 192.168.0.253
        gateway 192.168.0.1
        netmask 255.255.255.0

You shouldn't have to set up express, ejs, or socket.io yourself: These should be contained in the app. It should be enough from here to:
  1) cd /var
  2) sudo mkdir www
  3) cd www
  4) Pull the git repo to here. (/var/www)
  5) Start the server with:
  sudo node app.js

The following steps aren't needed, I expect. But if the above install fails, here's how you build Express (with EJS enabled) and socket.io inside /var/www. (Wipe the /var/www created above, do this, which will create a fresh www in /var with express, ejm, and socket.io, then pull the repo down.)

========================================
Manually setting up Express, EJS, and socket.io
========================================

  1) Install Express with EJS, using Node's Package Manager.
  Install the master files for express globally. 
  Run:
  sudo npm install -g express

  2) Run:
  cd /var

  3) Have express make npm build instructions for your install, complete with ejs. Run:
  sudo express --ejs www
  
  4) Execute those npm build files. Run:
  cd www
  
  5) Then run:
  sudo npm install

  6) Test your install.
  Run:
  node app.js
  It should start a server on pot 3000. 
  Local computers should be able to browse to it: http://192.168.0.253:3000/

  7) From here, socket.io should be a simple npm call.
  While still inside /var/www, run:
  sudo npm install socket.io

Now you should be ready to pull the git repo (minus conflicting files) back into /var/www/

From /var/www, to start the server, run:
sudo node app.js

You should be able to see the server from a local computer by visiting:
192.168.0.253

=======
Credit
=======
Most of these instructions are a rewrite of Matt Rüedlinger's write-up of how to set up Node.js & Express for RPi:
http://doctorbin.tumblr.com/post/53991508909/how-to-install-the-latest-version-of-nodejs-npm-and
Matt walks you through grabbing the most recent, not the stable, version of Node.js. My version excises this invitation for suffering, but otherwise is largely faithful to his. The added information of setting up the network for gelfoo's expectations and the final manual socket.io setup support gelfoo's current incarnation.
