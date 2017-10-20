{
    "targets": [
        {
            "target_name": "gpgme",
            "sources": [
                "src/nodeorcgpgme.cc",
                "src/gpgmeasyncworker.cc"],
            "include_dirs": [
                "gpgme-master/src",
                "<!(node -e \"require('nan')\")",
                "<!@(./gpgme-master/src/gpgme-config --cflags | sed 's/-I//g')"
            ],
            "link_settings": {
                "libraries": [
                    "-Wl,-rpath,/usr/lib",
                    "-l gpgme",
                    "-l assuan",
                    "-l gpg-error",
                ],
                "library_dirs": [
                ]

            }
        }
    ]
}