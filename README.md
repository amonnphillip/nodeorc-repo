# nodeorc-repo
A stand alone App Container Image (ACI) repository that uses Git for file management


THIS IS A WORK IN PROGRESS!

Set up:

Download and install GPG for the operating system you are using:
https://gnupg.org/download/
Then reboot your machine

Now create a key as per the guide here: https://coreos.com/rkt/docs/latest/signing-and-verification-guide.html

Edit the config for the service.

Start the service, it will create the git repo. Now place the public key in the git repo that was created and commit. 

You can upload container images via the service UI at the ur;