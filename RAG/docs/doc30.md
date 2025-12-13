Standard Library | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Standard Library

The Move Standard Library provides functionality for native types and operations. It is a standard
collection of modules that do not interact with storage, but provide basic tools for working with
and manipulating data. It is the only dependency of the
[Sui Framework](/programmability/sui-framework), and is imported together with it.

## Most Common Modules[​](#most-common-modules "Direct link to Most Common Modules")

In this book we go into detail about most of the modules in the Standard Library, however, it is
also helpful to give an overview of the features, so that you can get a sense of what is available
and which module implements it.

| Module | Description | Chapter |
| --- | --- | --- |
| [std::string](https://docs.sui.io/references/framework/std/string) | Provides basic string operations | [String](/move-basics/string) |
| [std::ascii](https://docs.sui.io/references/framework/std/ascii) | Provides basic ASCII operations | - |
| [std::option](https://docs.sui.io/references/framework/std/option) | Implements Option<T> | [Option](/move-basics/option) |
| [std::vector](https://docs.sui.io/references/framework/std/vector) | Native operations on the vector type | [Vector](/move-basics/vector) |
| [std::bcs](https://docs.sui.io/references/framework/std/bcs) | Contains the bcs::to\_bytes() function | [BCS](/programmability/bcs) |
| [std::address](https://docs.sui.io/references/framework/std/address) | Contains a single address::length function | [Address](/move-basics/address) |
| [std::type\_name](https://docs.sui.io/references/framework/std/type_name) | Allows runtime *type reflection* | [Type Reflection](/move-basics/type-reflection) |
| [std::hash](https://docs.sui.io/references/framework/std/hash) | Hashing functions: sha2\_256 and sha3\_256 | - |
| [std::debug](https://docs.sui.io/references/framework/std/debug) | Contains debugging functions, which are available in only in **test** mode | - |
| [std::bit\_vector](https://docs.sui.io/references/framework/std/bit_vector) | Provides operations on bit vectors | - |
| [std::fixed\_point32](https://docs.sui.io/references/framework/std/fixed_point32) | Provides the FixedPoint32 type | - |

## Integer Modules[​](#integer-modules "Direct link to Integer Modules")

The Move Standard Library provides a set of functions associated with integer types. These functions
are split into multiple modules, each associated with a specific integer type. The modules should
not be imported directly, as their functions are available on every integer value.

> All of the modules provide the same set of functions. Namely, max, diff,
> divide\_and\_round\_up, sqrt and pow.

| Module | Description |
| --- | --- |
| [std::u8](https://docs.sui.io/references/framework/std/u8) | Functions for the u8 type |
| [std::u16](https://docs.sui.io/references/framework/std/u16) | Functions for the u16 type |
| [std::u32](https://docs.sui.io/references/framework/std/u32) | Functions for the u32 type |
| [std::u64](https://docs.sui.io/references/framework/std/u64) | Functions for the u64 type |
| [std::u128](https://docs.sui.io/references/framework/std/u128) | Functions for the u128 type |
| [std::u256](https://docs.sui.io/references/framework/std/u256) | Functions for the u256 type |

## Exported Addresses[​](#exported-addresses "Direct link to Exported Addresses")

The Standard Library exports a single named address - std = 0x1. Note the alias std is defined
here.

```move
[addresses]  
std = "0x1"
```

## Implicit Imports[​](#implicit-imports "Direct link to Implicit Imports")

Some modules are imported implicitly and are available in the module without the explicit use
import. For the Standard Library, these modules and types include:

* std::vector
* std::option
* std::option::Option

## Importing std without Sui Framework[​](#importing-std-without-sui-framework "Direct link to Importing std without Sui Framework")

The Move Standard Library can be imported to the package directly. However, std alone is not
enough to build a meaningful application, as it does not provide any storage capabilities and can't
interact with the on-chain state.

```move
MoveStdlib = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/move-stdlib", rev = "framework/mainnet" }
```

## Source Code[​](#source-code "Direct link to Source Code")

The source code of the Move Standard Library is available in the
[Sui repository](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/move-stdlib/sources).

* [Most Common Modules](#most-common-modules)
* [Integer Modules](#integer-modules)
* [Exported Addresses](#exported-addresses)
* [Implicit Imports](#implicit-imports)
* [Importing std without Sui Framework](#importing-std-without-sui-framework)
* [Source Code](#source-code)