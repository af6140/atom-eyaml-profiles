'use babel';

export default class OverlayTextViewElement {
  constructor() {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('eyaml-tooltip');
    this.element.textContent = 'test';
  }
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  update(text) {
    this.element.textContent = text;
  }
}
