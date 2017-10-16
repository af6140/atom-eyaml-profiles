'use babel';

import EyamlProfilesActiveProfileView from './eyaml-profiles-active-view';
import EyamlProfilesStatusView from './eyaml-profiles-status-view';
import { CompositeDisposable } from 'atom';
import packageConfig from './config-schema.json'
import Util from './util'

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

  activate(state) {
    console.log("Activating plugin");

    this.profiles = {}

    //parsing config
    let raw_config = atom.config.get('eyaml-profiles.encryptionKeys');
    let defaultProfile = atom.config.get('eyaml-profiles.defaultProfile');
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
      } catch(e) {
          console.log('Error:', e.stack);
      }

    }
    console.log("default profile: "+ defaultProfile);
    this.currentProfile=defaultProfile;
    console.log(this.profiles);
    if(! this.profiles[this.currentProfile]) {
        atom.notifications.addError('Key profile does not exist: '+this.currentProfile);
    }
    this.eyamlProfilesActiveProfileView = new EyamlProfilesActiveProfileView(
      {
        defaultText: defaultProfile||'default',
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
    this.statusBar = statusBar;
    this.statusBarView.update(this.currentProfile);
    this.statusBarTile = this.statusBar.addLeftTile({
      item: this.statusBarView.getElement(), priority: 0
    });
  }
};
