import { defineExtensionContext } from './context/ExtensionContext';
import { TExtensionDefinition } from './TDefineExtension';
import { EventLink } from './shared/services/EventLink';


let definedExtension: TExtensionDefinition;

export const defineExtension = (definition: TExtensionDefinition) => {
  if (definedExtension) throw new Error("Extension already defined");
  definedExtension = definition;

  EventLink.initialize();


  EventLink.addEventListener('activate', async () => {
    const extensionContext = defineExtensionContext();

    const deactivate = await definedExtension.onDidActivate(extensionContext);

    EventLink.addEventListener('deactivate', async () => {
      if (deactivate) await deactivate();

      EventLink.removeEventListener('deactivate');
    });
  });
}
