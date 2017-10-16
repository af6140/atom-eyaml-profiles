'use babel';

import AtomEyamlProfilesView from './atom-eyaml-profiles-view';
import AtomEyamlProfilesActiveProfileView from './atom-eyaml-profiles-active-view';
import AtomEyamlProfilesStatusView from './atom-eyaml-profiles-status-view';
import { CompositeDisposable } from 'atom';
import packageConfig from './config-schema.json'
import InputDialog from './input_dialog'

import Util from './util'

var fs = require('fs');
export default {

  atomEyamlProfilesView: null,
  modalPanel: null,
  subscriptions: null,
  config: packageConfig,
  profiles: null,
  util: null,
  currentProfile: null,
  statusBarTile: null,
  statusBarView: null,
  statusBar: null,

  activate(state) {
    console.log("Activating##################");
    this.atomEyamlProfilesView = new AtomEyamlProfilesView(state.atomEyamlProfilesViewState);

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomEyamlProfilesView.getElement(),
      visible: true
    });

    this.profiles = {}

    //parsing config
    let raw_config = atom.config.get('atom-eyaml-profiles.encryptionKeys');
    let defaultProfile = atom.config.get('atom-eyaml-profiles.defaultProfile');
    console.log(raw_config);
    let configJson = JSON.parse(raw_config);
    this.util = new Util();
    for (var profile in configJson) {
      let keys = configJson[profile]
      if(defaultProfile==null) {
        console.log("Using first profile as default profile: "+profile);
        defaultProfile = profile;
      }
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
          console.log(publicKey);
          // var encryptedStr = this.util.encrypt(publicKey, "AKIAIVQKW3XBK3V6A3RA");
          // var wrapped = this.util.wrap(this.util.strip(encryptedStr))
          // // var pemMsg = this.util.unwrap(wrapped);
          // console.log(pemMsg);
          // console.log("#####################")
          // var decryptedStr= this.util.decrypt(privateKey, pemMsg);
          // console.log(decryptedStr);
      } catch(e) {
          console.log('Error:', e.stack);
      }

    }
    console.log("default profile: "+ defaultProfile);
    this.currentProfile=defaultProfile;
    console.log(this.profiles);
    this.atomEyamlProfilesActiveProfileView = new AtomEyamlProfilesActiveProfileView(
      {
        defaultText: defaultProfile||'default',
        labelText: 'Set active profile'
      },
      state.atomEyamlProfilesViewState);

    this.profilePanel = atom.workspace.addModalPanel({
      item: this.atomEyamlProfilesActiveProfileView,
      visible: false
    });

    this.statusBarView = new AtomEyamlProfilesStatusView();

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-eyaml-profiles:toggle': () => this.toggle()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-eyaml-profiles:profile': () => this.showprofile()
    }));

    this.subscriptions.add(atom.commands.add(this.profilePanel.getElement(), {
      'core:confirm': () => this.setprofile(),
      'core:cancel': () => this.hideprofile(),
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor',{
      'atom-eyaml-profiles:encrypt-selection': () => this.docrypt('encrypt'),
      'atom-eyaml-profiles:decrypt-selection': ()=> this.docrypt('decrypt'),
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomEyamlProfilesView.destroy();
    this.profilePanel.destroy();
    this.statusBarView.destroy();
    if(this.statusBarTile!=null){
      this.statusBarTile.destroy();
      this.statusBarTile=null;
    }
  },

  serialize() {
    return {
      atomEyamlProfilesViewState: this.atomEyamlProfilesView.serialize(),
      atomEyamlProfilesActiveProfileViewState: this.atomEyamlProfilesActiveProfileView.serialize()
    };
  },

  toggle() {
    console.log('AtomEyamlProfiles was toggled!');
    this.modalPanel.isVisible()?this.modalPanel.hide():this.modalPanel.show();
  },

  setprofile(active) {
    console.log('Set active profile');
    this.currentProfile = this.atomEyamlProfilesActiveProfileView.getUserInput();
    console.log('Set active profile4, current= '+this.currentProfile);
    atom.config.set('atom-eyaml-profiles.defaultProfile',this.currentProfile);
    this.hideprofile();
    this.statusBarView.update(this.currentProfile);
  },

  showprofile() {
    this.profilePanel.show();
    this.atomEyamlProfilesActiveProfileView.focus();
  },

  hideprofile() {
    console.log("Hide profile panel");
    return(
      this.profilePanel.hide()
    );
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
    console.log("ecrypt use profile "+this.currentProfile);
    let keys= this.profiles[this.currentProfile];
    let encryptedStr = this.util.encrypt(keys['publicKey'], text);
    let wrapped = this.util.wrap(encryptedStr);
    return wrapped;
  },

  decrypt(text){
    console.log("ecrypt use profile "+this.currentProfile);
    let keys= this.profiles[this.currentProfile];
    let unwrappedPEM = this.util.unwrap(text);
    let decryptedStr = this.util.decrypt(keys['privateKey'], unwrappedPEM);
    return decryptedStr;
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
    console.log("set status bar");
    this.statusBar = statusBar;
    this.statusBarView.update(this.currentProfile);
    this.statusBarTile = this.statusBar.addLeftTile({
      item: this.statusBarView.getElement(), priority: 0
    });
    console.log(this.statusBar);
  }
};
