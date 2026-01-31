import { PlatformActionManager } from './managers/PlatformActionManager';
import { LocalStorageManager } from './managers/LocalStorageManager';
import { CompletionManager } from './managers/CompletionManager';
import { DiagnosticManager } from './managers/DiagnosticManager';
import { StatusBarManager } from './managers/StatusBarManager';
import { QuickPickManager } from './managers/QuickPickManager';
import { SelectionManager } from './managers/SelectionManager';
import { DownloadManager } from './managers/DownloadManager';
import { FeedbackManager } from './managers/FeedbackManager';
import { ProjectManager } from './managers/ProjectManager';
import { ParserManager } from './managers/ParserManager';
import { FieldManager } from './managers/FieldManager';
import { DataManager } from './managers/DataManager';
import { ViewManager } from './managers/ViewManager';


export type TExtensionContext = {
  data: DataManager;
  views: ViewManager;
  fields: FieldManager;
  parsers: ParserManager;
  projects: ProjectManager;
  download: DownloadManager;
  feedback: FeedbackManager;
  selection: SelectionManager;
  quickPick: QuickPickManager;
  completions: CompletionManager;
  diagnostics: DiagnosticManager;
  statusBarItems: StatusBarManager;
  localStorage: LocalStorageManager;
  platformActions: PlatformActionManager;
};
