'use babel';

import EyamlProfilesActiveProfileView from './eyaml-profiles-active-view';
import EyamlProfilesStatusView from './eyaml-profiles-status-view';
import { CompositeDisposable,  Disposable } from 'atom';
import packageConfig from './config-schema.json'
import Util from './util'

import EyamlRevealOverlay from './reveal-overlay'

var fs = require('fs');
export default {
  subscriptions: null,
  profilePanel: null,
  config: packageConfig,
  profiles: null,
  util: null,
  currentProfile: null,
  statusBarTile: null,
  statusBarView: null,
  statusBar: null,
  toolTip: null,
  editorView: null,
  revealOverlay: null,
  cursorMovedDisposble: null,

  activate(state) {
    console.log("Activating plugin");
    this.util = new Util();
    this.profiles = {}
    //parsing config
    this.load_profile();
    console.log(this.profiles);
    if(! this.profiles[this.currentProfile]) {
        atom.notifications.addError('Key profile does not exist: '+this.currentProfile);
    }
    this.eyamlProfilesActiveProfileView = new EyamlProfilesActiveProfileView(
      {
        defaultText: this.currentProfile||'default',
        labelText: 'Set active profile'
      },
      state.eyamlProfilesActiveProfileView);

    this.profilePanel = atom.workspace.addModalPanel({
      item: this.eyamlProfilesActiveProfileView,
      visible: false
    });

    this.statusBarView = new EyamlProfilesStatusView();

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'eyaml-profiles:toggle': () => this.toggle()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'eyaml-profiles:showprofile': () => this.showprofile()
    }));

    this.subscriptions.add(atom.commands.add(this.profilePanel.getElement(), {
      'core:confirm': () => this.setprofile(),
      'core:cancel': () => this.hideprofile(),
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor',{
      'eyaml-profiles:encrypt-selection': () => this.docrypt('encrypt'),
      'eyaml-profiles:decrypt-selection': ()=> this.docrypt('decrypt'),
    }));

    this.revealOverlay = new EyamlRevealOverlay();

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'eyaml-profiles:reveal': () => this.preview_decrypt()
    }));

  },
  load_profile(){
    let raw_config = atom.config.get('eyaml-profiles.encryptionKeys');
    let defaultProfile = atom.config.get('eyaml-profiles.defaultProfile');
    console.log(raw_config);
    let configJson = JSON.parse(raw_config);
    for (var profile in configJson) {
      let keys = configJson[profile]
      let privatePath = keys['private']
      let publicPath = keys['public']
      console.log(privatePath)
      try {
          let privateKey= fs.readFileSync(privatePath, 'utf8');
          let publicKey = fs.readFileSync(publicPath, 'utf8');
          profileKey = {
            privateKey: privateKey,
            publicKey: publicKey
          }
          this.profiles[profile] = profileKey;
          if(defaultProfile==null) {
            console.log("Using first profile as default profile: "+profile);
            defaultProfile = profile;
          }
          console.log(publicKey);
      } catch(e) {
          console.log('Error:', e.stack);
      }

    }
    console.log("default profile: "+ defaultProfile);
    this.currentProfile=defaultProfile;
  },
  deactivate() {
    this.subscriptions.dispose();
    this.profilePanel.destroy();
    this.eyamlProfilesActiveProfileView.destroy();
    this.statusBarView.destroy();
    if(this.statusBarTile!=null){
      this.statusBarTile.destroy();
      this.statusBarTile=null;
    }
    if(this.cursorMovedDisposble) {
      this.cursorMovedDisposble.dispose();
      this.subscriptions.remove(this.cursorMovedDisposble);
      this.cursorMovedDisposble=null;
    }
    if(this.revealOverlay) {
      this.revealOverlay.destroyOverlay();
    }
  },

  serialize() {
    return {
      eyamlProfilesActiveProfileViewState: this.eyamlProfilesActiveProfileView.serialize()
    };
  },

  toggle() {
    console.log('EyamlProfiles was activated!');
    atom.notifications.addSuccess('eyaml-profiles plugin enabled');
  },

  setprofile(active) {
    console.log('Set active profile');
    let newProfile = this.eyamlProfilesActiveProfileView.getUserInput();
    if(! this.profiles[newProfile]) {
      this.hideprofile();
      atom.notifications.addError('Key profile does not exist: '+this.currentProfile+', profile not changed!');
    }else {
      this.currentProfile = newProfile;
      console.log('Set active profile4, current= '+this.currentProfile);
      atom.config.set('eyaml-profiles.defaultProfile',this.currentProfile);
      this.hideprofile();
      this.statusBarView.update(this.currentProfile);
      atom.notifications.addSuccess('Key profile changed to : '+this.currentProfile);
    }
  },

  showprofile() {
    console.log("show profile");
    this.profilePanel.show();
    this.eyamlProfilesActiveProfileView.focus();
  },

  hideprofile() {
    this.profilePanel.hide();
  },

  getSelectedText(editor, selectionRange) {
    selectedText = editor.getTextInBufferRange(selectionRange)
    return selectedText;
  },

  docrypt(type) {
    let rangeIndex=0;
    let startPoints = {};
    let ranges = [];
    let returnBuffer = {};
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
    this.bufferSetText(ranges, startPoints, returnBuffer, editor);
  },

  encrypt(text){
    let keys= this.profiles[this.currentProfile];
    let encryptedStr = this.util.encrypt(keys['publicKey'], text);
    let wrapped = this.util.wrap(encryptedStr);
    return wrapped;
  },

  decrypt(text){
    let keys= this.profiles[this.currentProfile];
    try {
      let unwrappedPEM = this.util.unwrap(text);
      let decryptedStr = this.util.decrypt(keys['privateKey'], unwrappedPEM);
      return decryptedStr;
    }catch(err){
      throw new Error('decryption error');
    }
  },

  bufferSetText(ranges, startPoints, returnBuffer,editor){
    let sorted_ranges = ranges.sort(function(a,b){
      return a.start.isLessThan(b.start);
    })
    if(ranges.length>0) {
      let cp = editor.getBuffer().createCheckpoint();
      for (i=0; i<sorted_ranges.length; i++){
        let rg = sorted_ranges[i];
        let idx = startPoints[rg.start.toString()];
        editor.setTextInBufferRange(rg, returnBuffer[idx]);
      }
      editor.getBuffer().groupChangesSinceCheckpoint(cp);
    }
  },
  //hook status bar
  consumeStatusBar(statusBar) {
    this.statusBar = statusBar;
    this.statusBarView.update(this.currentProfile);
    this.statusBarTile = this.statusBar.addLeftTile({
      item: this.statusBarView.getElement(), priority: 0
    });
  },

  preview_decrypt(){
    let editor =  atom.workspace.getActiveTextEditor();
    let selection = editor.getLastSelection();
    if(selection) {
      let selectionText = selection.getText();
      let trimmed = selectionText.trim();
      if(this.util.is_encrypted_text(trimmed)) {
        try {
          let decrypted = this.decrypt(trimmed);
          if(decrypted){
            this.cursorMovedDisposble = editor.onDidChangeCursorPosition((e) => { this.cursorMoved(editor, e) });
            this.subscriptions.add(this.cursorMovedDisposble);
            this.revealOverlay.showAtCursorPosition(editor,decrypted);
          }
        }catch(err){
          atom.notifications.addError(err.name+':'+err.message);
        }
      }else {
        console.log("selection is not ecrypted");
        atom.notifications.addInfo("Selection is not valid encrypted text.");
      }
    }
  },
  hide_preview_decrypt(editor){
    console.log("hide")
    //let editor =  atom.workspace.getActiveTextEditor();
    if(this.cursorMovedDisposble) {
      this.cursorMovedDisposble.dispose();
      this.subscriptions.remove(this.cursorMovedDisposble);
      this.cursorMovedDisposble=null;
    }
    this.revealOverlay.hide();
  },
  cursorMoved(editor, e){
    if(this.revealOverlay.isActive()) {
      this.hide_preview_decrypt(editor);
    }
  }
};
