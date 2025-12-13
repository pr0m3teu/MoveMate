Sui Framework | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Sui Framework

Sui Framework is a default dependency set in the [Package Manifest](/concepts/manifest). It
depends on the [Standard Library](/move-basics/standard-library) and provides Sui-specific
features, including the interaction with the storage, and Sui-specific native types and modules.

*For convenience, we grouped the modules in the Sui Framework into multiple categories. But they're
still part of the same framework.*

## Core[​](#core "Direct link to Core")

| Module | Description | Chapter |
| --- | --- | --- |
| [sui::address](https://docs.sui.io/references/framework/sui/address) | Adds conversion methods to the [address type](/move-basics/address) | [Address](/move-basics/address) |
| [sui::transfer](https://docs.sui.io/references/framework/sui/transfer) | Implements the storage operations for Objects | [Storage Functions](/storage/storage-functions) |
| [sui::tx\_context](https://docs.sui.io/references/framework/sui/tx_context) | Contains the TxContext struct and methods to read it | [Transaction Context](/programmability/transaction-context) |
| [sui::object](https://docs.sui.io/references/framework/sui/object) | Defines the UID and ID type, required for creating objects | [UID and ID](/storage/uid-and-id) |
| [sui::derived\_object](https://docs.sui.io/references/framework/sui/derived_object) | Allows UID generation through key derivation | [UID Derivation](/storage/uid-and-id#uid-derivation) |
| [sui::clock](https://docs.sui.io/references/framework/sui/clock) | Defines the Clock type and its methods | [Epoch and Time](/programmability/epoch-and-time) |
| [sui::dynamic\_field](https://docs.sui.io/references/framework/sui/dynamic_field) | Implements methods to add, use and remove dynamic fields | [Dynamic Fields](/programmability/dynamic-fields) |
| [sui::dynamic\_object\_field](https://docs.sui.io/references/framework/sui/dynamic_object_field) | Implements methods to add, use and remove dynamic object fields | [Dynamic Object Fields](/programmability/dynamic-object-fields) |
| [sui::event](https://docs.sui.io/references/framework/sui/event) | Allows emitting events for off-chain listeners | [Events](/programmability/events) |
| [sui::package](https://docs.sui.io/references/framework/sui/package) | Defines the Publisher type and package upgrade methods | [Publisher](/programmability/publisher), Package Upgrades |
| [sui::display](https://docs.sui.io/references/framework/sui/display) | Implements the Display object and ways to create and update it | [Display](/programmability/display) |

## Collections[​](#collections "Direct link to Collections")

| Module | Description | Chapter |
| --- | --- | --- |
| [sui::vec\_set](https://docs.sui.io/references/framework/sui/vec_set) | Implements a set type | [Collections](/programmability/collections) |
| [sui::vec\_map](https://docs.sui.io/references/framework/sui/vec_map) | Implements a map with vector keys | [Collections](/programmability/collections) |
| [sui::table](https://docs.sui.io/references/framework/sui/table) | Implements the Table type and methods to interact with it | [Dynamic Collections](/programmability/dynamic-collections) |
| [sui::linked\_table](https://docs.sui.io/references/framework/sui/linked_table) | Implements the LinkedTable type and methods to interact with it | [Dynamic Collections](/programmability/dynamic-collections) |
| [sui::bag](https://docs.sui.io/references/framework/sui/bag) | Implements the Bag type and methods to interact with it | [Dynamic Collections](/programmability/dynamic-collections) |
| [sui::object\_table](https://docs.sui.io/references/framework/sui/object_table) | Implements the ObjectTable type and methods to interact with it | [Dynamic Collections](/programmability/dynamic-collections) |
| [sui::object\_bag](https://docs.sui.io/references/framework/sui/object_bag) | Implements the ObjectBag type and methods to interact with it | [Dynamic Collections](/programmability/dynamic-collections) |

## Utilities[​](#utilities "Direct link to Utilities")

| Module | Description | Chapter |
| --- | --- | --- |
| [sui::bcs](https://docs.sui.io/references/framework/sui/bcs) | Implements the BCS encoding and decoding functions | [Binary Canonical Serialization](/programmability/bcs) |
| [sui::borrow](https://docs.sui.io/references/framework/sui/borrow) | Implements the borrowing mechanic for borrowing by *value* | [Hot Potato](/programmability/hot-potato-pattern) |
| [sui::hex](https://docs.sui.io/references/framework/sui/hex) | Implements the hex encoding and decoding functions | - |
| [sui::types](https://docs.sui.io/references/framework/sui/types) | Provides a way to check if the type is a One-Time-Witness | [One Time Witness](/programmability/one-time-witness) |

## Exported Addresses[​](#exported-addresses "Direct link to Exported Addresses")

Sui Framework exports two named addresses: sui = 0x2 and std = 0x1 from the std dependency.

```move
[addresses]  
sui = "0x2"  
  
# Exported from the MoveStdlib dependency  
std = "0x1"
```

## Implicit Imports[​](#implicit-imports "Direct link to Implicit Imports")

Just like with [Standard Library](/move-basics/standard-library#implicit-imports), some of the
modules and types are imported implicitly in the Sui Framework. This is the list of modules and
types that are available without explicit use import:

* sui::object
* sui::object::ID
* sui::object::UID
* sui::tx\_context
* sui::tx\_context::TxContext
* sui::transfer

## Source Code[​](#source-code "Direct link to Source Code")

The source code of the Sui Framework is available in the
[Sui repository](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/sources).

* [Core](#core)
* [Collections](#collections)
* [Utilities](#utilities)
* [Exported Addresses](#exported-addresses)
* [Implicit Imports](#implicit-imports)
* [Source Code](#source-code)