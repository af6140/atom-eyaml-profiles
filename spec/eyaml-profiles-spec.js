'use babel';

import EyamlProfiles from '../lib/eyaml-profiles';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('EyamlProfiles', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('eyaml-profiles');
  });

  describe('when the eyaml-profiles:toggle event is triggered', () => {
    it('enable the plugin', () => {

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'eyaml-profiles:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        
      });
    });
  });

});
