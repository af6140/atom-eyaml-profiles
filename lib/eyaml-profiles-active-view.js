'use babel';

const { TextEditor } = require('atom');

const defaultValidator = (text) => {
  if (text.trim().length === 0) {
    return 'required';
  }
  return null;
};

export default class EyamlProfilesActiveProfileView {
  constructor(options, serializedState) {
    // Create root element
    //options[defaultText]= serializedState;
    if(serializedState!=undefined && serializedState!=null) {
      options['defaultText'] = serializedState;
    }
    console.log("set default text: ");
    this.miniEditor = this.buildMiniEditor(options);
    this.message = this.buildMessage();
    if (options.labelText) {
      this.label = this.buildLabel(options);
    }
    this.element = this.buildElement(options);
    this.validator = options.validator ? options.validator : defaultValidator;
    this.miniEditor.onDidChange(() => {
      this.message.textContent = this.validator(this.miniEditor.getText());
    });
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    return this.getUserInput();
  }

  // Tear down any state and detach
  destroy() {
    this.miniEditor.setText('');
  }

  focus(){
    this.miniEditor.element.focus();
  }

  getUserInput() {
    return this.miniEditor.getText();
  }

  confirm() {
    const text = this.miniEditor.getText();
    const error = this.validator(text);
    if (error) {
      this.message.textContent = error;
      return;
    }
    this.close();
  }

  close(){
    if (this.miniEditor.element.hasFocus()) {
      this.restoreFocus();
    }
  }
  buildMiniEditor({ defaultText, textPattern, selectedRange }) {
    const miniEditor = new TextEditor({ mini: true });
    miniEditor.element.addEventListener('blur', this.close.bind(this));

    if (defaultText) {
      miniEditor.setText(defaultText);
      if (selectedRange) {
        miniEditor.setSelectedBufferRange(selectedRange);
      }
    }

    if (textPattern) {
      miniEditor.onWillInsertText(({ cancel, text }) => {
        if (!text.match(textPattern)) {
          cancel();
        }
      });
    }

    return miniEditor;
  }

  buildLabel({ labelText, labelClass }) {
    const label = document.createElement('label');
    label.textContent = labelText;
    if (labelClass) {
      label.classList.add(labelClass);
    }

    return label;
  }

  buildMessage() {
    const message = document.createElement('div');
    message.classList.add('active_profile');
    return message;
  }

  buildElement({ elementClass }) {
    const element = document.createElement('div');
    if (elementClass) {
      element.classList.add(elementClass);
    }
    if (this.label) {
      element.appendChild(this.label);
    }
    element.appendChild(this.miniEditor.element);
    element.appendChild(this.message);

    return element;
  }

  getElement(){
    return this.element;
  }
}
