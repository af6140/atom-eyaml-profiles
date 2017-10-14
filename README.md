atom-eyaml-profiles plugin
=======

This is an atom plugin that enable create encrypted yaml(`eyaml`) file.

The `eyaml` files are wildly used with `puppet` as a data backend contains secrets.

`eyaml` files are yaml files with filed value encrypted with PKCS7 message format.

This plugin allows you setup multiple pubilc/private key pairs and change the selected ones on the fly and using selected keys to decrypt/encrypt values.

It's inspired by the `atom-hiera-eyaml` plugin which support create key pairs but do not support multiple key profiles.
