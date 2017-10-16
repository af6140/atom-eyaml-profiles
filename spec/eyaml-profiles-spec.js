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

  describe('when the eyaml-profiles:profile event is triggered', () => {
    it('hides and shows the profile panel', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.eyaml-profiles')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'eyaml-profiles:profile');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.eyaml-profiles')).toExist();

        let eyamlProfilesActiveProfileElement = workspaceElement.querySelector('.active_profiles');
        expect(eyamlProfilesActiveProfileElement).toExist();

        let eyamlProfilesActiveProfilePanel = atom.workspace.panelForItem(eyamlProfilesActiveProfileElement);
        expect(eyamlProfilesActiveProfilePanel.isVisible()).toBe(true);
      });
    });
  });

});
