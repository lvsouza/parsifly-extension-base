
export type TOnDidUnmountEvent = () => Promise<void> | void

export type TOnDidMount<GContext extends Record<string, any> = {}> = (context: GContext) => Promise<TOnDidUnmountEvent | void> | TOnDidUnmountEvent | void
