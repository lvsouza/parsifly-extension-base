import { defineExtensionContext } from './context/ExtensionContext';
import { TExtensionDefinition } from './TDefineExtension';
import { EventLink } from './shared/services/EventLink';


let definedExtension: TExtensionDefinition;

export const defineExtension = (definition: TExtensionDefinition) => {
  if (definedExtension) throw new Error("Extension already defined");
  definedExtension = definition;

  EventLink.initialize();


  const extensionContext = defineExtensionContext();


  EventLink.addEventListener('activate', async () => {
    const deactivate = await definedExtension.onDidActivate(extensionContext);

    if (deactivate) {
      EventLink.addEventListener('deactivate', async () => {
        await deactivate();

        EventLink.removeEventListener('deactivate');
      });
    }
  });
}
