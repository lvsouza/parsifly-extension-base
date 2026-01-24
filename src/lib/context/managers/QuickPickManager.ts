import { EventLink } from '../../shared/services/EventLink';
import { TQuickPick } from '../../types/TQuickPick';


export class QuickPickManager {


  /**
   * Displays a Quick Pick interface to the user, allowing them to select an option or enter text.
   * @template T The expected type of the returned value.
   * @param props Configuration properties for the Quick Pick.
   * @returns A promise that resolves to the selected item or value.
   */
  public async show<T = unknown>(props: TQuickPick): Promise<T> {
    await EventLink.sendEvent(`quickPick:show`, props);

    return new Promise(resolve => {
      EventLink.addEventListener('quickPick:onConfirm', async (result: T) => {
        EventLink.removeEventListener('quickPick:onConfirm');
        EventLink.removeEventListener('quickPick:onCancel');
        resolve(result);
        return;
      });
      EventLink.addEventListener('quickPick:onCancel', async (result: T) => {
        EventLink.removeEventListener('quickPick:onConfirm');
        EventLink.removeEventListener('quickPick:onCancel');
        resolve(result);
        return;
      });
    });
  }
}
