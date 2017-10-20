'use babel';

function EyamlProfilesAtomUtil() {

}

EyamlProfilesAtomUtil.prototype.getEncryptedAtCursor = function() {
  let editor = atom.workspace.getActiveTextEditor();
  let pos = editor.getCursorBufferPosition();
  let editor =  atom.workspace.getActiveTextEditor();
  let rootScopes = editor.getRootScopeDescriptor();
  let scopes = []
  if(rootScopes!=null && rootScopes!='undefined'){
    scopes = rootScopes.getScopesArray();
  }
  if (!scopes.includes('source.yaml')) {
    console.log("Not a yaml file. scope: "+scopes);
    return
  }

  let selectedBufferRanges = editor.getSelectedBufferRanges();

  let realSelectedRanges = selectedBufferRanges.filter(function (range, index, array){
    return !range.start.isEqual(range.end)
  });

  let selectionCount = realSelectedRanges.length;
  console.log("Selection count: "+ selectionCount);
  console.log(realSelectedRanges);
  for (i=0; i< realSelectedRanges.length; i++) {
    let selectionRange = realSelectedRanges[i];
    ranges[rangeIndex] = selectionRange;
    console.log(selectionRange);
    startPoints[selectionRange.start.toString()] = rangeIndex;
    selectedText = this.getSelectedText(editor, selectionRange);
    console.log("selected text: "+ selectedText);
    if (type=='encrypt') {
      let crypted = this.encrypt(selectedText);
      console.log(crypted);
      returnBuffer[rangeIndex] = crypted;
    }
    if (type=='decrypt') {
      let decrypted = this.decrypt(selectedText);
      console.log(decrypted);
      returnBuffer[rangeIndex] = decrypted;
    }
    rangeIndex++;
  }

};
