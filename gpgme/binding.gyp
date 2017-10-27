{
    "targets": [
        {
            "target_name": "gpgme",
            "sources": [
                "src/nodeorcgpgme.cc"
            ],
            "include_dirs": [
                "<!(node -e \"require('nan')\")",
                "<!@(gpgme-config --cflags | sed 's/-I//g')"
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