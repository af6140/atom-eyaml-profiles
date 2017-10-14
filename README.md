atom-eyaml-profiles plugin
=======

This is an atom plugin that enable create encrypted yaml(`eyaml`) file.

The `eyaml` files are wildly used with `puppet` `hiera` as a data backend containing secrets.

`eyaml` files are yaml files with filed value encrypted with PKCS7 message format.

This plugin allows you setup multiple public/private key pairs and change the selected ones on the fly and using selected keys to decrypt/encrypt values.

It's inspired by the `atom-hiera-eyaml` plugin which support create key pairs but do not support multiple key profiles.

<h3> Configuration

+ encryptionKeys:
The encryption keys available in json format.

```json
{
  "profilename" : {
    "private": "/home/user/.eyaml/profile.key",
    "public": "/home/user/.eyaml/porfile_public.pem"
  }
}
```
Note: the private and public key paths should be full directory path.
