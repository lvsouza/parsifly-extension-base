

export interface IBase<GType extends string> {
  /**
   * Uuid used as identifier
   */
  readonly id: string
  /**
   * Used for tree it helps to know what type of item is this
   */
  readonly type: GType
  /**
   * Used to identify a record more simply.
   * 
   *  * Can't have space
   *  * Cannot have special characters
   *  * It cannot be empty
   */
  readonly name: string
  /**
   * Used to describe some more specific detail
   */
  readonly description: string | null
  /**
  * Used to store all properties of an item
  */
  readonly properties: Map<string, unknown>
  /**
   * Return a list of used names to do not use in new records
   */
  getProperty<GInitialValue>(fieldType: string, initialValue: GInitialValue): GInitialValue
  /**
   * Used to transform in a object without observables.
   */
  toObject(): Record<string, unknown>;
}
