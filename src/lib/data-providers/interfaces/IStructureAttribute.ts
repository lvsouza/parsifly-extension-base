import { IBase } from './IBase';



/**
 * Represents the shape category of an attribute.
 *
 * - `structure` refers to a named Structure (global, reusable).
 * - `object` refers to an inline anonymous structure.
 * - `array` represents a list whose item type is defined separately.
 * 
 * - Primitive kinds map directly to JSON-compatible types.
 */
export type TKind =
  | 'structure'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'object'
  | 'binary'

  | 'array_structure'
  | 'array_string'
  | 'array_number'
  | 'array_boolean'
  | 'array_null'
  | 'array_object'
  | 'array_binary'
  ;

/**
 * Default values are restricted to JSON-serializable primitives.
 * Complex types (object, array, binary, structure) cannot have defaults.
 */
export type TStructureAttributeDefaultValue =
  | string
  | number
  | boolean
  | null;


export interface IStructureAttribute extends IBase<'structure_attribute'> {
  /**
   * Indicates whether this attribute is required.
   *
   * - `true`  → attribute must be present (cannot be null)
   * - `false` → attribute may be null
   *
   * Note:
   * The platform uses `null` as the only absence value.
   */
  required: boolean;
  /**
   * Defines the shape of this attribute.
   *
   * Examples:
   * - `string`, `number`, `boolean`, `null`
   * - `object`   → inline anonymous structure
   * - `structure`→ reference to a named Structure
   * - `array`    → list whose item shape is defined by `arrayItemKind`
   * - `binary`   → opaque runtime payload (File, Blob, Stream, etc.)
   */
  kind: TKind;
  /**
   * Default value applied at initialization time.
   *
   * Constraints:
   * - Only allowed for primitive kinds
   * - Must be JSON-serializable
   *
   * Not applicable for:
   * - `object`
   * - `array`
   * - `structure`
   * - `binary`
   */
  defaultValue: TStructureAttributeDefaultValue | null;
  /**
   * Identifier of the referenced Structure when `kind === 'structure'`.
   *
   * This links the attribute to a globally defined Structure.
   *
   * Ignored when `kind !== 'structure'`.
   */
  referenceId: string | null;
  /**
   * Child attributes of this node when it represents an object shape.
   *
   * Applies when:
   * - `kind === 'object'`   (inline anonymous structure)
   * - `kind === 'structure'` (resolved structure shape)
   * - `kind === 'array_object'`   (inline anonymous list of structure)
   *
   * Must be empty for:
   * - primitives
   * - `array`
   * - `binary`
   */
  attributes: IStructureAttribute[];
}
