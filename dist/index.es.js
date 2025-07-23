import { e as o, w as r } from "./comlink-BsE2Av_T.mjs";
class y {
  constructor(e) {
    this.key = e.key, "action" in e && (this.action = e.action), "actions" in e && (this.actions = e.actions);
  }
  isSingle() {
    return typeof this.action == "function";
  }
  isMulti() {
    return Array.isArray(this.actions);
  }
}
class E {
  constructor(e) {
    this.key = e.key, this.getItems = e.getItems, this.onItemClick = e.onItemClick, this.onItemDoubleClick = e.onItemDoubleClick;
  }
}
class a {
  constructor(e) {
    this.key = e.key, this.tabs = e.tabs, this.actions = e.actions;
  }
}
class h {
  constructor(e) {
    this.key = e.key, this.dataProvider = e.dataProvider;
  }
}
class k {
  constructor(e) {
    this.key = e.key, this.action = e.action;
  }
}
class u {
  constructor(e) {
    this._messageSenderListeners = /* @__PURE__ */ new Map(), this.webView = {
      sendMessage: async (...t) => {
        this._messageSenderListeners.forEach((i) => i(...t));
      }
    }, this.key = e.key, this.actions = e.actions, this.onDidReceiveMessage = e.onDidReceiveMessage;
  }
  __internal_subscribeToSend(e, t) {
    this._messageSenderListeners.set(e, t);
  }
  __internal_removeSubscribeToSend(e) {
    this._messageSenderListeners.delete(e);
  }
}
class m {
  constructor(e) {
    this.key = e.key, this.actions = e.actions, this.dataProvider = e.dataProvider;
  }
}
const c = {
  DEBUG: !1
};
class d {
  constructor() {
    this._events = /* @__PURE__ */ new Map(), o({ callEvent: this._callExtensionEvent.bind(this) }), this._studioWrapper = r(self);
  }
  setExtensionEvent(e, t) {
    this._events.set(e, t);
  }
  removeExtensionEvent(e) {
    this._events.delete(e);
  }
  async callStudioEvent(e, ...t) {
    return this._studioWrapper.callEvent(e, ...t);
  }
  async _callExtensionEvent(e, ...t) {
    const i = this._events.get(e);
    if (c.DEBUG && console.log(this._events.keys()), !i)
      throw new Error(`[EXTENSION] Event with key "${e}" was not found.`);
    return i(...t);
  }
}
const l = (n) => ({
  /**
   * Allow you to call a custom command from application
   * 
   * @param key Name of the command
   * @param args List of arguments to be forwarded to the command call
   */
  callCustomDataProvider: async (e, ...t) => await n.callStudioEvent(e, ...t),
  /**
   * Allow you to get the entire project object or get parts with ...project.pages(), .services(), .components() and more.
   */
  project: Object.assign(
    async () => await n.callStudioEvent("project:get"),
    {
      set: async (e) => await n.callStudioEvent("project:set", e),
      pages: Object.assign(
        async () => await n.callStudioEvent("project.pages:get"),
        async (e) => await n.callStudioEvent("project.pages:get", e),
        {
          set: async (e, t) => await n.callStudioEvent("project.pages:set", e, t),
          add: Object.assign(
            async (e) => await n.callStudioEvent("project.pages:add", e),
            async (e, t) => await n.callStudioEvent("project.pages:add", e, t)
          ),
          del: Object.assign(
            async () => await n.callStudioEvent("project.pages:del"),
            async (e) => await n.callStudioEvent("project.pages:del", e)
          )
        }
      ),
      components: Object.assign(
        async () => await n.callStudioEvent("project.components:get"),
        async (e) => await n.callStudioEvent("project.components:get", e),
        {
          set: async (e, t) => await n.callStudioEvent("project.components:set", e, t),
          add: Object.assign(
            async (e) => await n.callStudioEvent("project.components:add", e),
            async (e, t) => await n.callStudioEvent("project.components:add", e, t)
          ),
          del: Object.assign(
            async () => await n.callStudioEvent("project.components:del"),
            async (e) => await n.callStudioEvent("project.components:del", e)
          )
        }
      ),
      services: Object.assign(
        async () => await n.callStudioEvent("project.services:get"),
        async (e) => await n.callStudioEvent("project.services:get", e),
        {
          set: async (e, t) => await n.callStudioEvent("project.services:set", e, t),
          add: Object.assign(
            async (e) => await n.callStudioEvent("project.services:add", e),
            async (e, t) => await n.callStudioEvent("project.services:add", e, t)
          ),
          del: Object.assign(
            async () => await n.callStudioEvent("project.services:del"),
            async (e) => await n.callStudioEvent("project.services:del", e)
          )
        }
      )
    }
  )
});
class _ {
  constructor() {
    this._eventLink = new d(), this.application = {
      platformActions: {
        register: (e) => {
          e.action ? this._eventLink.setExtensionEvent(`platformActions:${e.key}`, e.action) : e.actions && e.actions.forEach((t) => {
            this._eventLink.setExtensionEvent(`platformActions:${e.key}:actions:${t.key}`, t.action);
          });
        },
        unregister: (e) => {
          e.action ? this._eventLink.removeExtensionEvent(`platformActions:${e.key}`) : e.actions && e.actions.forEach((t) => {
            this._eventLink.removeExtensionEvent(`platformActions:${e.key}:actions:${t.key}`);
          });
        }
      },
      parsers: {
        register: (e) => {
          this._eventLink.setExtensionEvent(`parsers:${e.key}`, e.parser);
        },
        unregister: (e) => {
          this._eventLink.removeExtensionEvent(`parsers:${e.key}`);
        }
      },
      views: {
        refresh: async (e) => {
          await this._eventLink.callStudioEvent(`views:${e.key}:refresh`);
        },
        register: (e) => {
          var t, i;
          e instanceof a ? (e.tabs.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`, s.dataProvider.getItems), s.dataProvider.onItemClick && this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${s.key}:onItemClick:${s.dataProvider.key}`, s.dataProvider.onItemClick), s.dataProvider.onItemDoubleClick && this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${s.key}:onItemDoubleClick:${s.dataProvider.key}`, s.dataProvider.onItemDoubleClick);
          }), (t = e.actions) == null || t.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:actions:${s.key}`, s.action);
          })) : (this._eventLink.setExtensionEvent(`views:${e.key}:loadItems:${e.dataProvider.key}`, e.dataProvider.getItems), e.dataProvider.onItemClick && this._eventLink.setExtensionEvent(`views:${e.key}:onItemClick:${e.dataProvider.key}`, e.dataProvider.onItemClick), e.dataProvider.onItemDoubleClick && this._eventLink.setExtensionEvent(`views:${e.key}:onItemDoubleClick:${e.dataProvider.key}`, e.dataProvider.onItemDoubleClick), (i = e.actions) == null || i.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:actions:${s.key}`, s.action);
          }));
        },
        unregister: (e) => {
          var t, i;
          e instanceof a ? (e.tabs.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`), s.dataProvider.onItemClick && this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${s.key}:onItemClick:${s.dataProvider.key}`), s.dataProvider.onItemDoubleClick && this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${s.key}:onItemDoubleClick:${s.dataProvider.key}`);
          }), (t = e.actions) == null || t.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:actions:${s.key}`);
          })) : (this._eventLink.removeExtensionEvent(`views:${e.key}:loadItems:${e.dataProvider.key}`), e.dataProvider.onItemClick && this._eventLink.removeExtensionEvent(`views:${e.key}:onItemClick:${e.dataProvider.key}`), e.dataProvider.onItemDoubleClick && this._eventLink.removeExtensionEvent(`views:${e.key}:onItemDoubleClick:${e.dataProvider.key}`), (i = e.actions) == null || i.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:actions:${s.key}`);
          }));
        }
      },
      editors: {
        /**
         * Allow you to open a item in a editor based on the item type
         * 
         * @param key Identifier of a item to be opened for some editor
         */
        open: async (e) => {
          await this._eventLink.callStudioEvent("editors:open", e);
        },
        register: (e) => {
          var t;
          this._eventLink.setExtensionEvent(`editors:${e.key}:forwardEvents:receive`, async (...i) => {
            var s;
            return (s = e.onDidReceiveMessage) == null ? void 0 : s.call(e, ...i);
          }), e.__internal_subscribeToSend(`editors:${e.key}:forwardEvents:send`, async (...i) => await this._eventLink.callStudioEvent(`editors:${e.key}:forwardEvents:send`, ...i)), (t = e.actions) == null || t.forEach((i) => {
            this._eventLink.setExtensionEvent(`editors:${e.key}:actions:${i.key}`, i.action);
          });
        },
        unregister: (e) => {
          var t;
          this._eventLink.removeExtensionEvent(`editors:${e.key}:forwardEvents:receive`), e.__internal_removeSubscribeToSend(`editors:${e.key}:forwardEvents:send`), (t = e.actions) == null || t.forEach((i) => {
            this._eventLink.removeExtensionEvent(`editors:${e.key}:actions:${i.key}`);
          });
        }
      },
      commands: {
        /**
         * Allow you to call a custom command from application
         * 
         * @param key Name of the command
         * @param args List of arguments to be forwarded to the command call
         */
        callCustomCommand: async (e, ...t) => await this._eventLink.callStudioEvent(e, ...t),
        /**
         * Allow you to download some content in a file
         * 
         * @param fileName Name of the generated file
         * @param fileType extension of the file
         * @param fileContent file content in string
         */
        downloadFile: async (e, t, i) => await this._eventLink.callStudioEvent("download:file", e, t, i),
        /**
         * Allow you to download a lot of files and folders as zip
         * 
         * @param downloadName Name of the download as zip
         * @param files List of files or folders to download
         */
        downloadFiles: async (e, t) => await this._eventLink.callStudioEvent("download:files", e, t),
        /**
         * Grouped methods to editor configuration
         */
        editor: {
          /**
           * Allow to show some feedback to the platform user
           * 
           * @param message Message of the feedback
           * @param type type of the feedback
           */
          feedback: async (e, t) => await this._eventLink.callStudioEvent("editor:feedback", e, t),
          /**
           * Allow to capture user freeform text input
           * 
           * @param props Props to configure the quick pick
           */
          showQuickPick: async (e) => await this._eventLink.callStudioEvent("editor:quickPick:show", e),
          /**
           * Allow to set primary side bar view by key
           * 
           * @param key Key to identify the view to show in the side bar
           */
          showPrimarySideBarByKey: async (e) => await this._eventLink.callStudioEvent("editor:primarySideBar:showByKey", e),
          /**
           * Allow to set secondary side bar view by key
           * 
           * @param key Key to identify the view to show in the side bar
           */
          showSecondarySideBarByKey: async (e) => await this._eventLink.callStudioEvent("editor:secondarySideBar:showByKey", e)
        }
      },
      dataProviders: l(this._eventLink)
    }, this._eventLink.setExtensionEvent("activate", this.activate.bind(this)), this._eventLink.setExtensionEvent("deactivate", this.deactivate.bind(this));
  }
  /**
   * Automatically called when the extension start.
   */
  async activate() {
    console.log("Extension activated (base implementation).");
  }
  /**
   * Automatically called when the extension stop.
   */
  async deactivate() {
    console.log("Extension deactivated (base implementation).");
  }
}
class $ {
  constructor(e) {
    if (this.key = e.key, this.icon = e.icon, this.extra = e.extra, this.description = e.description, "title" in e && e.title !== void 0 && (this.title = e.title), "label" in e && e.label !== void 0 && (this.label = e.label), "children" in e && e.children !== void 0 && (this.children = e.children), this.title && this.label || !this.title && !this.label)
      throw new Error("ListViewItem must have either a `title` or a `label`, but not both.");
  }
}
class S {
  constructor(e) {
    this.key = e.key, this.parser = e.parser;
  }
}
export {
  k as Action,
  u as Editor,
  c as Envs,
  _ as ExtensionBase,
  E as ListProvider,
  $ as ListViewItem,
  S as Parser,
  y as PlatformAction,
  h as TabView,
  a as TabsView,
  m as View
};
//# sourceMappingURL=index.es.js.map
