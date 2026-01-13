import { DiagnosticViewItem } from './DiagnosticViewItem';
import { ContextMenuItem } from '../ContextMenuItem';
import { TImage } from '../../../types/TImage';


export type TDiagnosticViewItemMountContext = {
  refetchChildren(): Promise<void>;
  select(value: boolean): Promise<void>;
  set<GKey extends keyof TDiagnosticViewItem>(property: GKey, value: TDiagnosticViewItem[GKey]): Promise<void>;
}

export type TDiagnosticViewItem = {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info'
  target: {
    resourceType: string;
    resourceId: string;
    property?: string;
  };

  code?: string;      // ex: "duplicate-name"
  category?: string;  // ex: "naming", "structure"
  documentation?: {
    summary?: string;
    url?: string;
  };

  icon?: TImage;
  opened?: boolean;
  children?: boolean;
  disableSelect?: boolean;

  onItemClick?: (context: TDiagnosticViewItemMountContext) => Promise<void>;
  onItemDoubleClick?: (context: TDiagnosticViewItemMountContext) => Promise<void>;
  getActions?: (context: TDiagnosticViewItemMountContext) => Promise<ContextMenuItem[]>;
  getRelated?: (context: TDiagnosticViewItemMountContext) => Promise<DiagnosticViewItem[]>;
};

export type TSerializableDiagnosticViewItem = {
  key: string;

  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info'
  target: {
    resourceType: string;
    resourceId: string;
    property: string | undefined;
  };

  code: string | undefined;      // ex: "duplicate-name"
  category: string | undefined;  // ex: "naming", "structure"
  documentation: undefined | {
    summary: string | undefined;
    url: string | undefined;
  };

  icon: TImage | undefined;
  opened: boolean | undefined;
  children: boolean | undefined;
  disableSelect: boolean | undefined;
};
