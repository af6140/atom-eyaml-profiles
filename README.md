eyaml-profiles plugin
=======

This is an atom plugin that enable create encrypted yaml(`eyaml`) file.

The `eyaml` files are wildly used with `puppet` `hiera` as a data backend containing secrets.

`eyaml` files are yaml files with filed value encrypted with PKCS7 message format.

This plugin allows you setup multiple public/private key pairs(`profiles`). Profile can be changed on the fly and the corresponding keys are used to decrypt/encrypt text.

It's inspired by the `hiera-eyaml` plugin which support create key pairs but do not support multiple key profiles. It does not require you to have `hiera-eyaml` ruby program installed like `hiera-eyaml`. But it does not help you generate encryption keys.

#### Installation #####

After installation, you may have to isntall pakcage dependencies by activate command palette and type `u` `p` `d` `u`.

#### Activtion ####

The plugin is disabled by default, using keymap `ctl-alt-e` to enable. After it's activated, a status message `eyaml-profies:profileName` will be displayed at the left side of the status bar.

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

* defaultProfile:
The default set of keys used, default to `default`.

Note: the private and public key paths should be full directory path.
