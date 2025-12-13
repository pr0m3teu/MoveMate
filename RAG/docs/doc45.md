Type Reflection | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Type Reflection

In programming languages, *reflection* is the ability of a program to examine and modify its own
structure and behavior. Move supports a limited form of reflection that lets you inspect the type of
a value at runtime. This is handy when you need to store type information in a homogeneous
collection, or when you want to check if a type comes from a particular package.

Type reflection is implemented in the [Standard Library](/move-basics/standard-library) module
[std::type\_name](https://docs.sui.io/references/framework/std/type_name). It provides a set of functions, main of which are
with\_defining\_ids and with\_original\_ids.

```move
let defining_type_name: TypeName = type_name::with_defining_ids<T>();  
let original_type_name: TypeName = type_name::with_original_ids<T>();  
  
// Returns only "ID" of the package.  
let defining_package: address = type_name::defining_id<T>();  
let original_package: address = type_name::original_id<T>();
```

## Defining IDs vs. Original IDs[​](#defining-ids-vs-original-ids "Direct link to Defining IDs vs. Original IDs")

It is important to understand the difference between *defining ID* and *original ID*.

* Original ID is the first published ID of the package (before the first upgrade).
* Defining ID is the package ID which introduced the reflected type, this property becomes crucial
  when new types are introduced in package upgrades.

For example, suppose the first version of a package was published at 0xA and introduced the type
Version1. Later, in an upgrade, the package moved to address 0xB and introduced a new type
Version2. For Version1, the defining ID and original ID are the same. For Version2, however,
they differ: the original ID is 0xA, while the defining ID is 0xB.

```move
// Note: values `0xA` and `0xB` are used for illustration purposes only!  
// Don't attempt to run this code, as it will inevitably fail.  
module book::upgrade;  
  
// Introduced in initial version.  
// Defining ID: 0xA  
// Original ID: 0xA  
//  
// With Defining IDs: 0xA::upgrade::Version1  
// With Original IDs: 0xA::upgrade::Version1  
public struct Version1 has drop {}  
  
// Introduced in a package upgrade.  
// Defining ID: 0xB  
// Original ID: 0xA  
//  
// With Defining IDs: 0xB::upgrade::Version2  
// With Original IDs: 0xA::upgrade::Version2  
public struct Version2 has drop {}
```

## In practice[​](#in-practice "Direct link to In practice")

The module is straightforward, and operations allowed on the result are limited to getting a string
representation and extracting the module and address of the type.

```move
module book::type_reflection;  
  
use std::ascii::String;  
use std::type_name::{Self, TypeName};  
  
/// A function that returns the name of the type `T` and its module and address.  
public fun do_i_know_you<T>(): (String, String, String) {  
    let type_name: TypeName = type_name::with_defining_ids<T>();  
  
    // there's a way to borrow  
    let str: &String = type_name.as_string();  
  
    let module_name: String = type_name.module_string();  
    let address_str: String = type_name.address_string();  
  
    // and a way to consume the value  
    let str = type_name.into_string();  
  
    (str, module_name, address_str)  
}  
  
#[test_only]  
public struct MyType {}  
  
#[test_only]  
use std::unit_test::assert_eq;  
  
#[test]  
fun test_type_reflection() {  
    let (type_name, module_name, _address_str) = do_i_know_you<MyType>();  
  
    assert_eq!(module_name, b"type_reflection".to_ascii_string());  
}
```

## Further Reading[​](#further-reading "Direct link to Further Reading")

* [std::type\_name](https://docs.sui.io/references/framework/std/type_name) module documentation.

* [Defining IDs vs. Original IDs](#defining-ids-vs-original-ids)
* [In practice](#in-practice)
* [Further Reading](#further-reading)