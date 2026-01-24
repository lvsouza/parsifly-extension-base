import { EventLink } from '../../shared/services/EventLink';


export class FeedbackManager {
  /**
   * Displays an informational message.
   * @param message The text content of the message.
   */
  public async info(message: string): Promise<void> {
    return await EventLink.sendEvent('feedback:show', message, 'info');
  }

  /**
   * Displays a warning message.
   * @param message The text content of the message.
   */
  public async warning(message: string): Promise<void> {
    return await EventLink.sendEvent('feedback:show', message, 'warning');
  }

  /**
   * Displays a success message.
   * @param message The text content of the message.
   */
  public async success(message: string): Promise<void> {
    return await EventLink.sendEvent('feedback:show', message, 'success');
  }

  /**
   * Displays an error message.
   * @param message The text content of the message.
   */
  public async error(message: string): Promise<void> {
    return await EventLink.sendEvent('feedback:show', message, 'error');
  }
}
