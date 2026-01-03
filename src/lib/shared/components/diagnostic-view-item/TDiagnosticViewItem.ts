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
  severity: 'error' | 'warning' | 'info' | 'hint'
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

  icon?: TImage | null;
  opened?: boolean | null;
  children?: boolean | null;
  disableSelect?: boolean | null;

  onItemClick?: (context: TDiagnosticViewItemMountContext) => Promise<void>;
  onItemDoubleClick?: (context: TDiagnosticViewItemMountContext) => Promise<void>;
  getActions?: (context: TDiagnosticViewItemMountContext) => Promise<ContextMenuItem[]>;
  getRelated?: (context: TDiagnosticViewItemMountContext) => Promise<DiagnosticViewItem[]>;
};

export type TSerializableDiagnosticViewItem = {
  key: string;

  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'hint'
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

  icon?: TImage | null;
  opened?: boolean | null;
  children?: boolean | null;
  disableSelect?: boolean | null;
};
