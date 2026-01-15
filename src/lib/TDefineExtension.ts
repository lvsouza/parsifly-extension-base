import { TExtensionContext } from './context/TExtensionContext';


export type TOnDidDeactivated = () => Promise<void> | void;

export type TExtensionDefinition = {
  name: string;
  description: string;
  onDidActivate(context: TExtensionContext): Promise<TOnDidDeactivated | void> | TOnDidDeactivated | void;
}
