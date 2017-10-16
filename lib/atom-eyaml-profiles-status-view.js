'use babel';

export default class AtomEyamlProfilesStatusView {
  constructor() {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('inline-block');
    this.element.textContent = 'eyaml-profiles';
  }
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    console.log("get statusBar element");
    return this.element;
  }

  update(text) {
    this.element.textContent = 'eyaml-profiles:'+text;
  }
}
