'use babel';

export default class AtomEyamlProfilesStatusView {
  constructor() {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('atom-eyaml-profiles');

    // Create message element
    const message = document.createElement('div');
    message.textContent = 'eyaml-profiles';
    message.classList.add('message');
    this.element.appendChild(message);
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
}
