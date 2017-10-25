# nodeorc-repo
A stand alone App Container Image (ACI) repository that uses Git for file management


THIS IS A WORK IN PROGRESS!

Set up:

Right now the version of gpg you need is not installed on linux images by default.

Download and install GPG for the operating system you are using:
https://gnupg.org/download/
Then reboot your machine

Now create a key as per the guide here: https://coreos.com/rkt/docs/latest/signing-and-verification-guide.html

Edit the config for the service.

Start the service, it will create the git repo. Now place the public key in the git repo that was created and commit. 

You can upload container images via the service UI at the ur;

killall gpg-agent
vim ~/.gnupg/gpg-agent.conf
# add: allow-loopback-pinentry
gpg-connect-agent reloadagent /bye

sudo apt-get install gnupg2

You need the gpgme >= 1.10.0 in order for the addon to compile.

Just clone the master for now until the we get a release.
sudo apt-get install autoconf
sudo apt-get install texinfo
cd gpgme
git clone https://dev.gnupg.org/source/gpgme.git gpgme-master
cd gpgme-master
./autoconf.sh
./configure --prefix=/usr && make

To build libgpg-error
git clone https://dev.gunpg.org/source/libgpg-error.git libgpg-error-master
cd libgpg-error-master
./configure --prefix=/usr --disable-doc --disable-tests
./autoconf.sh
./configure --prefix=/usr --disable-doc --disable-tests

To build libassuan
git clone https://dev.gnupg.org/source/libassuan.git libassuan-master
cd libassuan-master
./autoconf.sh
./configure --prefix=/usr --disable-doc --disable-tests

Eventually you will use the instructions below.

sudo find / -name "gpgme.h"
Open the found file (/usr/include/gpgme.h for example) and view the version near the top of the header file.

To download and install a version of gpgme type the following in a terminal:

wget https://www.gnupg.org/ftp/gcrypt/gpgme/gpgme-1.10.0.tar.bz2
tar -xzf gpgme-1.10.0.tar.bz2
mkdir gpgme-1.10.0
cd gpgme-1.10.0
./configure --prefix=/usr && make

And when the right binaries finally make it into the OS you wont have to do any of that crap above.
