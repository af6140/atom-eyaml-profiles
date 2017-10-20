'use babel';
const {Emitter, CompositeDisposable} = require('atom')
const OverlayTextViewElement = require('./overlay-text-view')

export default class EyamlRevealOverlay {
  constructor() {
    // Create root element
    this.showAtCursorPosition = this.showAtCursorPosition.bind(this);
    this.hide = this.hide.bind(this);
    this.destroyOverlay = this.destroyOverlay.bind(this);
    this.activeEdotr = null;
    this.lastCursorPoint =null;
    this.overlayTextViewElement = new OverlayTextViewElement();
  }

  isActive () {
    return (this.activeEditor != null)
  }

  showAtCursorPosition(editor, text) {
    if (this.activeEditor === editor || (editor == null)) { return }
    this.destroyOverlay()
    let marker;
    let currentCursor = editor.getLastCursor();

    if(currentCursor) {
      marker = currentCursor.getMarker();
    } else {
      this.destroyOverlay();
      return;
    }
    if(marker) {
      let currentPosition = currentCursor.getBufferPosition().toString();
      if(this.lastCursorPoint==null) {
        this.activeEditor= editor;
        this.overlayTextViewElement.update(text);
        this.overlayDecoration = editor.decorateMarker(marker, {type: 'overlay', item: this.overlayTextViewElement, class:'message'} )
        this.lastCursorPoint = currentPosition;
      }else {
        this.destroy();
      }
    }
  }
  hide() {
    this.destroyOverlay();
    if (this.activeEditor === null) {
      return
    }
    // if (this.bindings && this.bindings.dispose) {
    //   this.bindings.dispose()
    // }
    this.activeEditor = null
    return this.activeEditor
  }

  destroyOverlay () {
   if (this.overlayDecoration && this.overlayDecoration.destroy) {
     this.overlayDecoration.destroy()
   }
   this.overlayDecoration = undefined
   this.lastCursorPoint =null;
   return this.overlayDecoration
  }

  getLastCursorPoint(){
    return this.lastCursorPoint;
  }
}
