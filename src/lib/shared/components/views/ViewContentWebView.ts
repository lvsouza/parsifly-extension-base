import { TSerializableViewContentWebView, TViewContentWebView, TViewContentWebViewContext } from './TViewContentWebView';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TViewContentWebViewConstructor = {
  key: string;
  initialValue?: Partial<TViewContentWebView>,
  onDidMount?: TOnDidMount<TViewContentWebViewContext>;
}

export class ViewContentWebView {
  public readonly registerId: string;
  public readonly key: TViewContentWebViewConstructor['key'];
  public readonly onDidMount: TViewContentWebViewConstructor['onDidMount'];
  public readonly defaultValue: NonNullable<TViewContentWebViewConstructor['initialValue']>;


  constructor(props: TViewContentWebViewConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.registerId = crypto.randomUUID();
    this.defaultValue = props.initialValue || {};
    this.defaultValue.type = 'viewContentWebView';
  }


  #createContext(internalValue: typeof this.defaultValue, mountId: string): TViewContentWebViewContext {
    return {
      currentValue: internalValue as TViewContentWebView,
      sendMessage: async (...values) => {
        return await EventLink.sendEvent(`viewContentWebView:${mountId}:sendMessage`, ...values);
      },
      reload: async () => {
        return await EventLink.sendEvent(`viewContentWebView:${mountId}:reload`);
      },
      set: async <GKey extends keyof TViewContentWebView>(property: GKey, newValue: TViewContentWebView[GKey]) => {
        switch (property) {
          case 'onDidMessage':
            internalValue[property] = newValue;
            return;

          default:
            internalValue[property] = newValue;
            return await EventLink.sendEvent(`viewContentWebView:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const internalValue = this.defaultValue;

    const context = this.#createContext(internalValue, mountId);


    EventLink.addEventListener(`viewContentWebView:${mountId}:onDidMessage`, async (...values) => {
      return await internalValue?.onDidMessage?.(context, ...values);
    });


    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`viewContentWebView:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      EventLink.removeEventListener(`viewContentWebView:${mountId}:onDidMessage`);
      EventLink.removeEventListener(`viewContentWebView:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`viewContentWebView:${this.registerId}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`viewContentWebView:${this.registerId}:onDidMount`);
  }

  public serialize(): TSerializableViewContentWebView {
    if (!this.defaultValue.entryPoint) throw new Error(`Entry point not defined for "${this.key}" view content web view`);

    return {
      key: this.key,
      type: 'viewContentWebView',
      registerId: this.registerId,
      entryPoint: this.defaultValue.entryPoint,
      backgroundTransparent: this.defaultValue.backgroundTransparent,
    };
  }
}
