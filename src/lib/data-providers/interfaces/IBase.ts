

export interface IBase<GType extends string> {
  /**
   * Uuid used as identifier
   */
  id: string
  /**
   * Used for tree it helps to know what type of item is this
   */
  type: GType
  /**
   * Used to identify a record more simply.
   * 
   *  * Can't have space
   *  * Cannot have special characters
   *  * It cannot be empty
   */
  name: string
  /**
   * Used to describe some more specific detail
   */
  description: string | null
}
