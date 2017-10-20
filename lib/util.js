var forge = require('node-forge');

function Util() {

}

Util.prototype.encrypt = function(certString , plain) {
  var cert = forge.pki.certificateFromPem(certString);
  // create envelop data
  var p7 = forge.pkcs7.createEnvelopedData();
  // add certificate as recipient
  p7.addRecipient(cert);
  // set content
  p7.content = forge.util.createBuffer(plain);
  // encrypt
  p7.encrypt();

  // obtain encrypted data with DER format
  // var bytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
  // var str = Buffer.from(bytes, 'binary').toString();
  // console.log(str);
  var str = forge.pkcs7.messageToPem(p7);
  console.log(str);
  return str;
};

Util.prototype.decrypt = function(keyString, pemMsg) {
  var p7 = forge.pkcs7.messageFromPem(pemMsg);
  var pk = forge.pki.privateKeyFromPem(keyString)
  p7.decrypt(p7.recipients[0], pk);
  var str = p7.content.data;
  console.log(str);
  return str;
};

//strip -----BEGIN PKCS7----- and -----END PKCS7-----
Util.prototype.strip = function(encrypted) {
  var splitted = encrypted.split(/\r?\n/g);
  //var splitted = encrypted.split("\n");
  return splitted.slice(1,splitted.length-2).join('');
};
// enclosing ecrypted pem encoded str with wrapper
Util.prototype.wrap = function(str){
  let stripped  = this.strip(str); //remove -----BEGIN and -----END line
  return "ENC[PKCS7,"+stripped+"]";
}
Util.prototype.unwrap = function(str){
  var tmp = str.replace("ENC[PKCS7,","").replace("]", "");
  return "-----BEGIN PKCS7-----\n"+tmp+"\n-----END PKCS7-----";
}

Util.prototype.is_encrypted_text=function (str){
  if(str) {
    if (str.startsWith('ENC[PKCS7') && str.endsWith(']')) {
      return true;
    }
  }
  return false;
}

module.exports = Util;
