Ability: Key | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Ability: Key

In the [Basic Syntax](/move-basics) chapter, we already covered two out of four abilities:
[Drop](/move-basics/drop-ability) and [Copy](/move-basics/copy-ability). They affect the behavior of a value in a scope and
are not directly related to storage. Now it is time to cover the key ability, which allows a
struct to be *stored*.

Historically, the key ability was created to mark a type as a *key in storage*. A type with the
key ability could be stored at the top level in global storage and could be *owned* by an account
or address. With the introduction of the [Object Model](/object), the key ability became the
defining ability for *objects*.

> Later in the book, we will refer to any struct with the key ability as an Object.

## Object Definition[​](#object-definition "Direct link to Object Definition")

A struct with the key ability is considered *an object* and can be used in storage functions. The
Sui Verifier requires the first field of the struct to be named id and to have the type UID.
Additionally, it requires all fields to have the store ability — we’ll explore it in detail [on
the next page](/storage/store-ability).

```move
/// `User` object definition.  
public struct User has key {  
    id: UID, // required by Sui Bytecode Verifier  
    name: String, // field types must have `store`  
}  
  
/// Creates a new instance of the `User` type.  
/// Uses the special struct `TxContext` to derive a Unique ID (UID).  
public fun new(name: String, ctx: &mut TxContext): User {  
    User {  
        id: object::new(ctx), // creates a new UID  
        name,  
    }  
}
```

## Relation to copy and drop[​](#relation-to-copy-and-drop "Direct link to relation-to-copy-and-drop")

UID is a type that does not have the [drop](/move-basics/drop-ability) or [copy](/move-basics/copy-ability) abilities.
Since it is required as a field of any type with the key ability, this means that types with key
can never have drop or copy.

This property can be leveraged in [ability constraints](/move-basics/generics#constraints-on-type-parameters): requiring drop or copy
automatically excludes key, and conversely, requiring key excludes types with drop or copy.

## Types with the key Ability[​](#types-with-the-key-ability "Direct link to types-with-the-key-ability")

Due to the UID requirement for types with key, none of the native types in Move can have the
key ability, nor can any of the types in the [Standard Library](/move-basics/standard-library). The key
ability is present only in some [Sui Framework](/programmability/sui-framework) types and in custom types.

## Summary[​](#summary "Direct link to Summary")

* The key ability defines an object
* The first field of an object must be id with type UID
* Fields of a key type must the have [store](/storage/store-ability) ability
* Objects cannot have [drop](/move-basics/drop-ability) or [copy](/move-basics/copy-ability)

## Next Steps[​](#next-steps "Direct link to Next Steps")

The key ability defines objects in Move and forces the fields to have store. In the next section
we cover the store ability to later explain how [storage operations](/storage/storage-functions) work.

## Further Reading[​](#further-reading "Direct link to Further Reading")

* [Type Abilities](/reference/abilities) in the Move Reference.

* [Object Definition](#object-definition)
* [Relation to `copy` and `drop`](#relation-to-copy-and-drop)
* [Types with the `key` Ability](#types-with-the-key-ability)
* [Summary](#summary)
* [Next Steps](#next-steps)
* [Further Reading](#further-reading)