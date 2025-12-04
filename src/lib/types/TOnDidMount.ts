
export type TOnDidUnmountEvent = () => Promise<void>

export type TOnDidMountProps = {
  onDidUnmount: (didUnmount: TOnDidUnmountEvent) => void;
};

export type TOnDidMount<GContext extends Record<string, any> = {}> = (props: TOnDidMountProps & GContext) => Promise<void>
