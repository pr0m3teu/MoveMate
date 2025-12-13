Abilities: Introduction | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Abilities: Introduction

Move has a unique type system which allows customizing *type abilities*.
[In the previous section](/move-basics/struct), we introduced the struct definition and how to use it.
However, the instances of the Artist and Record structs had to be unpacked for the code to
compile. This is default behavior of a struct without *abilities*.

> Throughout the book you will see chapters with name Ability: <name>, where <name> is the name
> of the ability. These chapters will cover the ability in detail, how it works, and how to use it
> in Move.

## What are Abilities?[​](#what-are-abilities "Direct link to What are Abilities?")

Abilities are a way to allow certain behaviors for a type. They are a part of the struct declaration
and define which behaviors are allowed for the instances of the struct.

## Abilities Syntax[​](#abilities-syntax "Direct link to Abilities Syntax")

Abilities are set in the struct definition using the has keyword followed by a list of abilities.
The abilities are separated by commas. Move supports 4 abilities: copy, drop, key, and
store. Each ability defines a specific behavior for the struct instances.

```move
/// This struct has the `copy` and `drop` abilities.  
public struct VeryAble has copy, drop {  
    // field: Type1,  
    // field2: Type2,  
    // ...  
}
```

## Overview[​](#overview "Direct link to Overview")

A quick overview of the abilities:

> All of the built-in types except [references](/move-basics/references) have copy, drop, and store
> abilities. References have copy and drop.

* copy - allows the struct to be *copied*. Explained in the [Ability: Copy](/move-basics/copy-ability)
  chapter.
* drop - allows the struct to be *dropped* or *discarded*. Explained in the
  [Ability: Drop](/move-basics/drop-ability) chapter.
* key - allows the struct to be used as a *key* in a storage. Explained in the
  [Ability: Key](/storage/key-ability) chapter.
* store - allows the struct to be *stored* in structs that have the *key* ability. Explained in
  the [Ability: Store](/storage/store-ability) chapter.

While it is important to briefly mention them here, we will go into more detail about each ability
in the following chapters and give proper context on how to use them.

## No Abilities[​](#no-abilities "Direct link to No Abilities")

A struct without abilities cannot be discarded, copied, or stored in storage. We call such a struct
a *Hot Potato*. A lighthearted name, but it is a good way to remember that a struct without
abilities is like a hot potato - it can only be passed around and requires special handling. The Hot
Potato is one of the most powerful patterns in Move, and we go into more detail about it in the
[Hot Potato Pattern](/programmability/hot-potato-pattern) chapter.

## Further Reading[​](#further-reading "Direct link to Further Reading")

* [Type Abilities](/reference/abilities) in the Move Reference.

* [What are Abilities?](#what-are-abilities)
* [Abilities Syntax](#abilities-syntax)
* [Overview](#overview)
* [No Abilities](#no-abilities)
* [Further Reading](#further-reading)