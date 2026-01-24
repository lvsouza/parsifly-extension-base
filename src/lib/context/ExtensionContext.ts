import { PlatformActionManager } from './managers/PlatformActionManager';
import { CompletionManager } from './managers/CompletionManager';
import { DiagnosticManager } from './managers/DiagnosticManager';
import { StatusBarManager } from './managers/StatusBarManager';
import { QuickPickManager } from './managers/QuickPickManager';
import { SelectionManager } from './managers/SelectionManager';
import { DownloadManager } from './managers/DownloadManager';
import { FeedbackManager } from './managers/FeedbackManager';
import { EditionManager } from './managers/EditionManager';
import { ProjectManager } from './managers/ProjectManager';
import { ParserManager } from './managers/ParserManager';
import { TExtensionContext } from './TExtensionContext';
import { FieldManager } from './managers/FieldManager';
import { DataManager } from './managers/DataManager';
import { ViewManager } from './managers/ViewManager';


export const defineExtensionContext = (): TExtensionContext => {


  const context: TExtensionContext = {
    data: new DataManager(),
    views: new ViewManager(),
    fields: new FieldManager(),
    parsers: new ParserManager(),
    edition: new EditionManager(),
    projects: new ProjectManager(),
    download: new DownloadManager(),
    feedback: new FeedbackManager(),
    selection: new SelectionManager(),
    quickPick: new QuickPickManager(),
    completions: new CompletionManager(),
    statusBarItems: new StatusBarManager(),
    platformActions: new PlatformActionManager(),
    diagnostics: new DiagnosticManager(() => context),
  };


  return context;
}
