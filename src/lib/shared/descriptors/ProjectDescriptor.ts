import { TImage } from '../../types/TImage';
import { TQuery } from '../../types/TQuery';


export type TModelProperty = {
  name: string;
  required?: boolean;
  description?: string;
  type: 'string' | 'number' | 'boolean' | (string & {});
}

export type TModel = {
  name: string;
  description?: string;
  properties: TModelProperty[];
}

export type TMigration = {
  id: string;
  order: number;
  description: string;
  upQuery: () => TQuery;
}

export type TSerializableMigration = {
  id: string;
  sql: string;
  order: number;
  description: string;
  parameters: unknown[];
}

export type TSerializableProjectDescriptor = {
  key: string;
  name: string;
  type: string;
  version: number;
  models: TModel[];
  icon: TImage | undefined;
  color: string | undefined;
  thumbnail: TImage | undefined;
  description: string | undefined;
  migrations: TSerializableMigration[];
}

export interface IProjectDescriptorProps {
  key: string;
  name: string;
  type: string;
  icon?: TImage;
  color?: string;
  version: number;
  thumbnail?: TImage;
  description?: string;
  models: () => TModel[];
  migrations: () => TMigration[];
}
export class ProjectDescriptor {
  public readonly key: IProjectDescriptorProps['key'];
  public readonly name: IProjectDescriptorProps['name'];
  public readonly type: IProjectDescriptorProps['type'];
  public readonly icon: IProjectDescriptorProps['icon'];
  public readonly color: IProjectDescriptorProps['color'];
  public readonly version: IProjectDescriptorProps['version'];
  public readonly thumbnail: IProjectDescriptorProps['thumbnail'];
  public readonly description: IProjectDescriptorProps['description'];

  public readonly migrations: () => TMigration[];
  public readonly models: () => TModel[];

  #registered: Set<void> = new Set();

  constructor(props: IProjectDescriptorProps) {
    this.key = props.key;
    this.name = props.name;
    this.type = props.type;
    this.icon = props.icon;
    this.color = props.color;
    this.version = props.version;
    this.thumbnail = props.thumbnail;
    this.description = props.description;
    this.models = props.models;
    this.unregister = this.unregister;
    this.migrations = props.migrations;
  }

  public unregister() {
    this.#registered.clear();
  }

  public serialize(): TSerializableProjectDescriptor {
    return {
      key: this.key,
      name: this.name,
      type: this.type,
      icon: this.icon,
      color: this.color,
      version: this.version,
      thumbnail: this.thumbnail,
      description: this.description,
      models: this.models(),
      migrations: this.migrations().map(migration => {
        const query = migration.upQuery();
        return {
          id: migration.id,
          order: migration.order,
          description: migration.description,
          sql: query.sql,
          mode: query.mode,
          parameters: query.parameters as [],
        };
      }),
    };
  }
}
