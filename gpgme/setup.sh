wget https://www.gnupg.org/ftp/gcrypt/gpgme/gpgme-1.9.0.tar.bz2
tar -xzf gpgme-1.9.0.tar.bz2
mkdir gpgme-1.9.0
cd gpgme-1.9.0
./configure --prefix=/usr && make
cd ..