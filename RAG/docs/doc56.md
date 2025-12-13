Ability: Store | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Ability: Store

The [key ability](/storage/key-ability) requires all fields to have store, which defines what the store
ability means: it is the ability to serve as a field of an Object. A struct with
[copy](/move-basics/copy-ability) or [drop](/move-basics/drop-ability) but without store can never be *stored*. A type
with key but without store cannot be wrapped - used as a field—in another object, and is
constrained to always remain at the top level.

## Definition[​](#definition "Direct link to Definition")

The store ability allows a type to be used as a field in a struct with the key ability.

```move
use std::string::String;  
  
/// Extra metadata with `store`; all fields must have `store` as well!  
public struct Metadata has store {  
    bio: String,  
}  
  
/// An object for a single user record.  
public struct User has key {  
    id: UID,  
    name: String,       // String has `store`  
    age: u8,            // All integers have `store`  
    metadata: Metadata, // Another type with the `store` ability  
}
```

## Relation to copy and drop[​](#relation-to-copy-and-drop "Direct link to relation-to-copy-and-drop")

All three non-key abilities can be used in any combination.

## Relation to key[​](#relation-to-key "Direct link to relation-to-key")

An object with the store ability can be *stored* in other objects.

> While not a language or verifier feature, store acts as a *public* modifier on a struct,
> allowing calling *public* [transfer functions](/storage/storage-functions) which do not have an
> [internal constraint](/storage/internal-constraint).

## Types with the store Ability[​](#types-with-the-store-ability "Direct link to types-with-the-store-ability")

All native types (except references) in Move have the store ability. This includes:

* [bool](/move-basics/primitive-types#booleans)
* [unsigned integers](/move-basics/primitive-types#integer-types)
* [vector](/move-basics/vector)
* [address](/move-basics/address)

All of the types defined in the standard library have the store ability as well. This includes:

* [Option](/move-basics/option)
* [String](/move-basics/string) and [ASCII String](/move-basics/string)
* [TypeName](/move-basics/type-reflection)

## Further Reading[​](#further-reading "Direct link to Further Reading")

* [Type Abilities](/reference/abilities) in the Move Reference.

* [Definition](#definition)
* [Relation to `copy` and `drop`](#relation-to-copy-and-drop)
* [Relation to `key`](#relation-to-key)
* [Types with the `store` Ability](#types-with-the-store-ability)
* [Further Reading](#further-reading)