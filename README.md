atom-eyaml-profiles plugin
=======

This is an atom plugin that enable create encrypted yaml(`eyaml`) file.

The `eyaml` files are wildly used with `puppet` `hiera` as a data backend containing secrets.

`eyaml` files are yaml files with filed value encrypted with PKCS7 message format.

This plugin allows you setup multiple public/private key pairs(`profiles`). Profile can be changed on the fly and the corresponding keys are used to decrypt/encrypt text.

It's inspired by the `atom-hiera-eyaml` plugin which support create key pairs but do not support multiple key profiles. It does not require you to have `hiera-eyaml` ruby program installed like `atom-hiera-eyaml`. But it does not help you generate encryption keys.

#### Configuration

* encryptionKeys:
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
