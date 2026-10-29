type Described = { description?: string }

type StringProperty = Described & {
  type: "string"
  enum?: readonly string[]
  minLength?: number
  maxLength?: number
  pattern?: string
}

type NumberProperty = Described & {
  type: "number" | "integer"
  minimum?: number
  maximum?: number
}

type BooleanProperty = Described & { type: "boolean" }

type NullProperty = Described & { type: "null" }

type ArrayProperty = Described & {
  type: "array"
  items: Property
  minItems?: number
  maxItems?: number
}

export type ObjectSchema<
  Required extends string = string,
  Properties extends Record<Required, Property> = Record<string, Property>,
> = {
  type: "object"
  properties: Properties
  required: readonly Required[]
}

type ObjectProperty = Described & {
  type: "object"
  properties: Record<string, Property>
  required: readonly string[]
}

export type Property =
  | StringProperty
  | NumberProperty
  | BooleanProperty
  | NullProperty
  | ArrayProperty
  | ObjectProperty

export type Tool<
  Name extends string = string,
  Required extends string = string,
  Properties extends Record<Required, Property> = Record<string, Property>,
> = {
  name: Name
  description: string
  input_schema: ObjectSchema<Required, Properties>
}

type ValueOf<P extends Property> = P extends {
  type: "string"
  enum: infer Choices extends readonly string[]
}
  ? Choices[number]
  : P extends { type: "string" }
    ? string
    : P extends { type: "number" | "integer" }
      ? number
      : P extends { type: "boolean" }
        ? boolean
        : P extends { type: "null" }
          ? null
          : P extends { type: "array"; items: infer Items extends Property }
            ? ValueOf<Items>[]
            : P extends {
                  type: "object"
                  properties: infer Nested extends Record<string, Property>
                }
              ? { [Key in keyof Nested]?: ValueOf<Nested[Key]> }
              : never

export type InputOf<
  Required extends string,
  Properties extends Record<Required, Property>,
> = { [Key in Required]: ValueOf<Properties[Key]> } & {
  [Key in Exclude<keyof Properties, Required>]?: ValueOf<Properties[Key]>
}
