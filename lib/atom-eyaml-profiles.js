'use babel';

import AtomEyamlProfilesView from './atom-eyaml-profiles-view';
import AtomEyamlProfilesActiveProfileView from './atom-eyaml-profiles-active-view';
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

  activate(state) {
    this.atomEyamlProfilesView = new AtomEyamlProfilesView(state.atomEyamlProfilesViewState);

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomEyamlProfilesView.getElement(),
      visible: true
    });


    this.profiles = {}

    //parsing config
    let raw_config = atom.config.get('atom-eyaml-profiles.encryptionKeys')
    console.log(raw_config)
    let configJson = JSON.parse(raw_config)
    let defaultProfile = null;
    this.util = new Util();
    for (var profile in configJson) {
      let keys = configJson[profile]
      if(defaultProfile==null) {
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
  },

  serialize() {
    return {
      atomEyamlProfilesViewState: this.atomEyamlProfilesView.serialize(),
      atomEyamlProfilesActiveProfileViewState: this.atomEyamlProfilesActiveProfileView.serialize()
    };
  },

  toggle() {
    console.log('AtomEyamlProfiles was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  },

  setprofile(active) {
    console.log('Set active profile');
    this.currentProfile = this.atomEyamlProfilesActiveProfileView.getUserInput();
    console.log('Set active profile4, current= '+this.currentProfile);
    this.hideprofile();
  },

  showprofile() {
    return (
      this.profilePanel.show()
    );
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
      rangeIndex++;
    }
    this.bufferSetText(ranges, startPoints, returnBuffer, editor);

  },

  encrypt(text){
    console.log("ecrypt use profile "+this.currentProfile);
    let keys= this.profiles[this.currentProfile];
    let encryptedStr = this.util.encrypt(keys['publicKey'], text);
    let wrapped = this.util.wrap(this.util.strip(encryptedStr));
    return wrapped;
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
  }
};
