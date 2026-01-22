import { TSerializableViewContentWebView, TViewContentWebView, TViewContentWebViewContext } from './TViewContentWebView';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TViewContentWebViewConstructor = {
  key: string;
  initialValue?: Partial<TViewContentWebView>,
  onDidMount?: TOnDidMount<TViewContentWebViewContext>;
}

export class ViewContentWebView {
  public readonly key: TViewContentWebViewConstructor['key'];
  public readonly onDidMount: TViewContentWebViewConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TViewContentWebViewConstructor['initialValue']>>;


  constructor(props: TViewContentWebViewConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
    this.internalValue.type = 'viewContentWebView';
  }


  #createContext(mountId: string): TViewContentWebViewContext {
    return {
      currentValue: this.internalValue as TViewContentWebView,
      sendMessage: async (...values) => {
        return await EventLink.sendEvent(`viewContentWebView:${mountId}:sendMessage`, ...values);
      },
      reload: async () => {
        return await EventLink.sendEvent(`viewContentWebView:${mountId}:reload`);
      },
      set: async <GKey extends keyof TViewContentWebView>(property: GKey, newValue: TViewContentWebView[GKey]) => {
        switch (property) {
          case 'onDidMessage':
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.sendEvent(`viewContentWebView:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);


    EventLink.addEventListener(`viewContentWebView:${mountId}:onDidMessage`, async (...values) => {
      return await this.internalValue?.onDidMessage?.(context, ...values);
    });


    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`viewContentWebView:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      EventLink.removeEventListener(`viewContentWebView:${mountId}:onDidMessage`);
      EventLink.removeEventListener(`viewContentWebView:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`viewContentWebView:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`viewContentWebView:${this.key}:onDidMount`);
  }

  public serialize(): TSerializableViewContentWebView {
    if (!this.internalValue.entryPoint) throw new Error(`Entry point not defined for "${this.key}" view content web view`);

    return {
      key: this.key,
      type: 'viewContentWebView',
      entryPoint: this.internalValue.entryPoint,
    };
  }
}
