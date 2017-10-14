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

Util.prototype.strip = function(encrypted) {
  var splitted = encrypted.split('\n')
  return splitted.slice(1,splitted.length-2).join('');
};

Util.prototype.wrap = function(str){
  return "DEC[PKCS7,"+str+"]";
}
Util.prototype.unwrap = function(str){
  var tmp = str.replace("DEC[PKCS7,","").replace("]", "");
  return "-----BEGIN PKCS7-----\n"+tmp+"\n-----END PKCS7-----";
}

module.exports = Util;
