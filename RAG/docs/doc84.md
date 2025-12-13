Code Quality Checklist | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Code Quality Checklist

The rapid evolution of the Move language and its ecosystem has rendered many older practices
outdated. This guide serves as a checklist for developers to review their code and ensure it aligns
with current best practices in Move development. Please read carefully and apply as many
recommendations as possible to your code.

## Code Organization[​](#code-organization "Direct link to Code Organization")

Some of the issues mentioned in this guide can be fixed by using
[Move Formatter](https://www.npmjs.com/package/@mysten/prettier-plugin-move) either as a CLI tool,
or [as a CI check](https://github.com/marketplace/actions/move-formatter), or
[as a plugin for VSCode (Cursor)](https://marketplace.visualstudio.com/items?itemName=mysten.prettier-move).

## Package Manifest[​](#package-manifest "Direct link to Package Manifest")

### Use Right Edition[​](#use-right-edition "Direct link to Use Right Edition")

All of the features in this guide require Move 2024 Edition, and it has to be specified in the
package manifest.

```move
[package]  
name = "my_package"  
edition = "2024.beta" # or (just) "2024"
```

### Implicit Framework Dependency[​](#implicit-framework-dependency "Direct link to Implicit Framework Dependency")

Starting with Sui 1.45 you no longer need to specify framework dependency in the Move.toml:

```move
# old, pre 1.45  
[dependencies]  
Sui = { ... }  
  
# modern day, Sui, Bridge, MoveStdlib and SuiSystem are imported implicitly!  
[dependencies]
```

### Prefix Named Addresses[​](#prefix-named-addresses "Direct link to Prefix Named Addresses")

If your package has a generic name (e.g., token) – especially if your project includes multiple
packages – make sure to add a prefix to the named address:

```move
# bad! not indicative of anything, and can conflict  
[addresses]  
math = "0x0"  
  
# good! clearly states project, unlikely to conflict  
[addresses]  
my_protocol_math = "0x0"
```

## Imports, Module and Constants[​](#imports-module-and-constants "Direct link to Imports, Module and Constants")

### Using Module Label[​](#using-module-label "Direct link to Using Module Label")

```move
// bad: increases indentation, legacy style  
module my_package::my_module {  
    public struct A {}  
}  
  
// good!  
module my_package::my_module;  
  
public struct A {}
```

### No Single Self in use Statements[​](#no-single-self-in-use-statements "Direct link to no-single-self-in-use-statements")

```move
// correct, member + self import  
use my_package::other::{Self, OtherMember};  
  
// bad! `{Self}` is redundant  
use my_package::my_module::{Self};  
  
// good!  
use my_package::my_module;
```

### Group use Statements with Self[​](#group-use-statements-with-self "Direct link to group-use-statements-with-self")

```move
// bad!  
use my_package::my_module;  
use my_package::my_module::OtherMember;  
  
// good!  
use my_package::my_module::{Self, OtherMember};
```

### Error Constants are in EPascalCase[​](#error-constants-are-in-epascalcase "Direct link to error-constants-are-in-epascalcase")

```move
// bad! all-caps are used for regular constants  
const NOT_AUTHORIZED: u64 = 0;  
  
// good! clear indication it's an error constant  
const ENotAuthorized: u64 = 0;
```

### Regular Constant are ALL\_CAPS[​](#regular-constant-are-all_caps "Direct link to regular-constant-are-all_caps")

```move
// bad! PascalCase is associated with error consts  
const MyConstant: vector<u8> = b"my const";  
  
// good! clear indication that it's a constant value  
const MY_CONSTANT: vector<u8> = b"my const";
```

## Structs[​](#structs "Direct link to Structs")

### Capabilities are Suffixed with Cap[​](#capabilities-are-suffixed-with-cap "Direct link to capabilities-are-suffixed-with-cap")

```move
// bad! if it's a capability, add a `Cap` suffix  
public struct Admin has key, store {  
    id: UID,  
}  
  
// good! reviewer knows what to expect from type  
public struct AdminCap has key, store {  
    id: UID,  
}
```

### No Potato in Names[​](#no-potato-in-names "Direct link to no-potato-in-names")

```move
// bad! it has no abilities, we already know it's a Hot-Potato type  
public struct PromisePotato {}  
  
// good!  
public struct Promise {}
```

### Events Should Be Named in Past Tense[​](#events-should-be-named-in-past-tense "Direct link to Events Should Be Named in Past Tense")

```move
// bad! not clear what this struct does  
public struct RegisterUser has copy, drop { user: address }  
  
// good! clear, it's an event  
public struct UserRegistered has copy, drop { user: address }
```

### Use Positional Structs for Dynamic Field Keys + Key Suffix[​](#use-positional-structs-for-dynamic-field-keys--key-suffix "Direct link to use-positional-structs-for-dynamic-field-keys--key-suffix")

```move
// not as bad, but goes against canonical style  
public struct DynamicField has copy, drop, store {}  
  
// good! canonical style, Key suffix  
public struct DynamicFieldKey() has copy, drop, store;
```

## Functions[​](#functions "Direct link to Functions")

### No public entry, Only public or entry[​](#no-public-entry-only-public-or-entry "Direct link to no-public-entry-only-public-or-entry")

```move
// bad! entry is not required for a function to be callable in a transaction  
public entry fun do_something() { /* ... */ }  
  
// good! public functions are more permissive, can return value  
public fun do_something_2(): T { /* ... */ }
```

### Write Composable Functions for PTBs[​](#write-composable-functions-for-ptbs "Direct link to Write Composable Functions for PTBs")

```move
// bad! not composable, harder to test!  
public fun mint_and_transfer(ctx: &mut TxContext) {  
    /* ... */  
    transfer::transfer(nft, ctx.sender());  
}  
  
// good! composable!  
public fun mint(ctx: &mut TxContext): NFT { /* ... */ }  
  
// good! intentionally not composable  
entry fun mint_and_keep(ctx: &mut TxContext) { /* ... */ }
```

### Objects Go First (Except for Clock)[​](#objects-go-first-except-for-clock "Direct link to Objects Go First (Except for Clock)")

```move
// bad! hard to read!  
public fun call_app(  
    value: u8,  
    app: &mut App,  
    is_smth: bool,  
    cap: &AppCap,  
    clock: &Clock,  
    ctx: &mut TxContext,  
) { /* ... */ }  
  
// good!  
public fun call_app(  
    app: &mut App,  
    cap: &AppCap,  
    value: u8,  
    is_smth: bool,  
    clock: &Clock,  
    ctx: &mut TxContext,  
) { /* ... */ }
```

### Capabilities Go Second[​](#capabilities-go-second "Direct link to Capabilities Go Second")

```move
// bad! breaks method associativity  
public fun authorize_action(cap: &AdminCap, app: &mut App) { /* ... */ }  
  
// good! keeps Cap visible in the signature and maintains `.calls()`  
public fun authorize_action(app: &mut App, cap: &AdminCap) { /* ... */ }
```

### Getters Named After Field + \_mut[​](#getters-named-after-field--_mut "Direct link to getters-named-after-field--_mut")

```move
// bad! unnecessary `get_`  
public fun get_name(u: &User): String { /* ... */ }  
  
// good! clear that it accesses field `name`  
public fun name(u: &User): String { /* ... */ }  
  
// good! for mutable references use `_mut`  
public fun details_mut(u: &mut User): &mut Details { /* ... */ }
```

## Function Body: Struct Methods[​](#function-body-struct-methods "Direct link to Function Body: Struct Methods")

### Common Coin Operations[​](#common-coin-operations "Direct link to Common Coin Operations")

```move
// bad! legacy code, hard to read!  
let paid = coin::split(&mut payment, amount, ctx);  
let balance = coin::into_balance(paid);  
  
// good! struct methods make it easier!  
let balance = payment.split(amount, ctx).into_balance();  
  
// even better (in this example - no need to create temporary coin)  
let balance = payment.balance_mut().split(amount);  
  
// also can do this!  
let coin = balance.into_coin(ctx);
```

### Do Not Import std::string::utf8[​](#do-not-import-stdstringutf8 "Direct link to do-not-import-stdstringutf8")

```move
// bad! unfortunately, very common!  
use std::string::utf8;  
  
let str = utf8(b"hello, world!");  
  
// good!  
let str = b"hello, world!".to_string();  
  
// also, for ASCII string  
let ascii = b"hello, world!".to_ascii_string();
```

### UID has delete[​](#uid-has-delete "Direct link to uid-has-delete")

```move
// bad!  
object::delete(id);  
  
// good!  
id.delete();
```

### ctx has sender()[​](#ctx-has-sender "Direct link to ctx-has-sender")

```move
// bad!  
tx_context::sender(ctx);  
  
// good!  
ctx.sender()
```

### Vector Has a Literal. And Associated Functions[​](#vector-has-a-literal-and-associated-functions "Direct link to Vector Has a Literal. And Associated Functions")

```move
// bad!  
let mut my_vec = vector::empty();  
vector::push_back(&mut my_vec, 10);  
let first_el = vector::borrow(&my_vec);  
assert!(vector::length(&my_vec) == 1);  
  
// good!  
let mut my_vec = vector[10];  
let first_el = my_vec[0];  
assert!(my_vec.length() == 1);
```

### Collections Support Index Syntax[​](#collections-support-index-syntax "Direct link to Collections Support Index Syntax")

```move
let x: VecMap<u8, String> = /* ... */;  
  
// bad!  
x.get(&10);  
x.get_mut(&10);  
  
// good!  
&x[&10];  
&mut x[&10];
```

## Option -> Macros[​](#option---macros "Direct link to Option -> Macros")

### Destroy And Call Function[​](#destroy-and-call-function "Direct link to Destroy And Call Function")

```move
// bad!  
if (opt.is_some()) {  
    let inner = opt.destroy_some();  
    call_function(inner);  
};  
  
// good! there's a macro for it!  
opt.do!(|value| call_function(value));
```

### Destroy Some With Default[​](#destroy-some-with-default "Direct link to Destroy Some With Default")

```move
let opt = option::none();  
  
// bad!  
let value = if (opt.is_some()) {  
    opt.destroy_some()  
} else {  
    abort EError  
};  
  
// good! there's a macro!  
let value = opt.destroy_or!(default_value);  
  
// you can even do abort on `none`  
let value = opt.destroy_or!(abort ECannotBeEmpty);
```

## Loops -> Macros[​](#loops---macros "Direct link to Loops -> Macros")

### Do Operation N Times[​](#do-operation-n-times "Direct link to Do Operation N Times")

```move
// bad! hard to read!  
let mut i = 0;  
while (i < 32) {  
    do_action();  
    i = i + 1;  
};  
  
// good! any uint has this macro!  
32u8.do!(|_| do_action());
```

### New Vector From Iteration[​](#new-vector-from-iteration "Direct link to New Vector From Iteration")

```move
// harder to read!  
let mut i = 0;  
let mut elements = vector[];  
while (i < 32) {  
    elements.push_back(i);  
    i = i + 1;  
};  
  
// easy to read!  
vector::tabulate!(32, |i| i);
```

### Do Operation on Every Element of a Vector[​](#do-operation-on-every-element-of-a-vector "Direct link to Do Operation on Every Element of a Vector")

```move
// bad!  
let mut i = 0;  
while (i < vec.length()) {  
    call_function(&vec[i]);  
    i = i + 1;  
};  
  
// good!  
vec.do_ref!(|e| call_function(e));
```

### Destroy a Vector and Call a Function on Each Element[​](#destroy-a-vector-and-call-a-function-on-each-element "Direct link to Destroy a Vector and Call a Function on Each Element")

```move
// bad!  
while (!vec.is_empty()) {  
    call(vec.pop_back());  
};  
  
// good!  
vec.destroy!(|e| call(e));
```

### Fold Vector Into a Single Value[​](#fold-vector-into-a-single-value "Direct link to Fold Vector Into a Single Value")

```move
// bad!  
let mut aggregate = 0;  
let mut i = 0;  
  
while (i < source.length()) {  
    aggregate = aggregate + source[i];  
    i = i + 1;  
};  
  
// good!  
let aggregate = source.fold!(0, |acc, v| {  
    acc + v  
});
```

### Filter Elements of the Vector[​](#filter-elements-of-the-vector "Direct link to Filter Elements of the Vector")

> Note: T: drop in the source vector

```move
// bad!  
let mut filtered = [];  
let mut i = 0;  
while (i < source.length()) {  
    if (source[i] > 10) {  
        filtered.push_back(source[i]);  
    };  
    i = i + 1;  
};  
  
// good!  
let filtered = source.filter!(|e| e > 10);
```

## Other[​](#other "Direct link to Other")

### Ignored Values In Unpack Can Be Ignored Altogether[​](#ignored-values-in-unpack-can-be-ignored-altogether "Direct link to Ignored Values In Unpack Can Be Ignored Altogether")

```move
// bad! very sparse!  
let MyStruct { id, field_1: _, field_2: _, field_3: _ } = value;  
id.delete();  
  
// good! 2024 syntax  
let MyStruct { id, .. } = value;  
id.delete();
```

## Testing[​](#testing "Direct link to Testing")

### Merge #[test] and #[expected\_failure(...)][​](#merge-test-and-expected_failure "Direct link to merge-test-and-expected_failure")

```move
// bad!  
#[test]  
#[expected_failure]  
fun value_passes_check() {  
    abort  
}  
  
// good!  
#[test, expected_failure]  
fun value_passes_check() {  
    abort  
}
```

### Do Not Clean Up expected\_failure Tests[​](#do-not-clean-up-expected_failure-tests "Direct link to do-not-clean-up-expected_failure-tests")

```move
// bad! clean up is not necessary  
#[test, expected_failure(abort_code = my_app::EIncorrectValue)]  
fun try_take_missing_object_fail() {  
    let mut test = test_scenario::begin(@0);  
    my_app::call_function(test.ctx());  
    test.end();  
}  
  
// good! easy to see where test is expected to fail  
#[test, expected_failure(abort_code = my_app::EIncorrectValue)]  
fun try_take_missing_object_fail() {  
    let mut test = test_scenario::begin(@0);  
    my_app::call_function(test.ctx());  
  
    abort // will differ from EIncorrectValue  
}
```

### Do Not Prefix Tests With test\_ in Testing Modules[​](#do-not-prefix-tests-with-test_-in-testing-modules "Direct link to do-not-prefix-tests-with-test_-in-testing-modules")

```move
// bad! the module is already called _tests  
module my_package::my_module_tests;  
  
#[test]  
fun test_this_feature() { /* ... */ }  
  
// good! better function name as the result  
#[test]  
fun this_feature_works() { /* ... */ }
```

### Do Not Use TestScenario Where Not Necessary[​](#do-not-use-testscenario-where-not-necessary "Direct link to do-not-use-testscenario-where-not-necessary")

```move
// bad! no need, only using ctx  
let mut test = test_scenario::begin(@0);  
let nft = app::mint(test.ctx());  
app::destroy(nft);  
test.end();  
  
// good! there's a dummy context for simple cases  
let ctx = &mut tx_context::dummy();  
app::mint(ctx).destroy();
```

### Do Not Use Abort Codes in assert! in Tests[​](#do-not-use-abort-codes-in-assert-in-tests "Direct link to do-not-use-abort-codes-in-assert-in-tests")

```move
// bad! may match application error codes by accident  
assert!(is_success, 0);  
  
// good!  
assert!(is_success);
```

### Use assert\_eq! Whenever Possible[​](#use-assert_eq-whenever-possible "Direct link to use-assert_eq-whenever-possible")

```move
// bad! old-style code  
assert!(result == b"expected_value", 0);  
  
// good! will print both values if fails  
use std::unit_test::assert_eq;  
  
assert_eq!(result, expected_value);
```

### Use "Black Hole" destroy Function[​](#use-black-hole-destroy-function "Direct link to use-black-hole-destroy-function")

```move
// bad!  
nft.destroy_for_testing();  
app.destroy_for_testing();  
  
// good! - no need to define special functions for cleanup  
use sui::test_utils::destroy;  
  
destroy(nft);  
destroy(app);
```

## Comments[​](#comments "Direct link to Comments")

### Doc Comments Start With ///[​](#doc-comments-start-with- "Direct link to doc-comments-start-with-")

```move
// bad! tooling doesn't support JavaDoc-style comments  
/**  
 * Cool method  
 * @param ...  
 */  
public fun do_something() { /* ... */ }  
  
// good! will be rendered as a doc comment in docgen and IDE's  
/// Cool method!  
public fun do_something() { /* ... */ }
```

### Complex Logic? Leave a Comment //[​](#complex-logic-leave-a-comment- "Direct link to complex-logic-leave-a-comment-")

Being friendly and helping reviewers understand the code!

```move
// good!  
// Note: can underflow if a value is smaller than 10.  
// TODO: add an `assert!` here  
let value = external_call(value, ctx);
```

* [Code Organization](#code-organization)
* [Package Manifest](#package-manifest)
  + [Use Right Edition](#use-right-edition)
  + [Implicit Framework Dependency](#implicit-framework-dependency)
  + [Prefix Named Addresses](#prefix-named-addresses)
* [Imports, Module and Constants](#imports-module-and-constants)
  + [Using Module Label](#using-module-label)
  + [No Single `Self` in `use` Statements](#no-single-self-in-use-statements)
  + [Group `use` Statements with `Self`](#group-use-statements-with-self)
  + [Error Constants are in `EPascalCase`](#error-constants-are-in-epascalcase)
  + [Regular Constant are `ALL_CAPS`](#regular-constant-are-all_caps)
* [Structs](#structs)
  + [Capabilities are Suffixed with `Cap`](#capabilities-are-suffixed-with-cap)
  + [No `Potato` in Names](#no-potato-in-names)
  + [Events Should Be Named in Past Tense](#events-should-be-named-in-past-tense)
  + [Use Positional Structs for Dynamic Field Keys + `Key` Suffix](#use-positional-structs-for-dynamic-field-keys--key-suffix)
* [Functions](#functions)
  + [No `public entry`, Only `public` or `entry`](#no-public-entry-only-public-or-entry)
  + [Write Composable Functions for PTBs](#write-composable-functions-for-ptbs)
  + [Objects Go First (Except for Clock)](#objects-go-first-except-for-clock)
  + [Capabilities Go Second](#capabilities-go-second)
  + [Getters Named After Field + `_mut`](#getters-named-after-field--_mut)
* [Function Body: Struct Methods](#function-body-struct-methods)
  + [Common Coin Operations](#common-coin-operations)
  + [Do Not Import `std::string::utf8`](#do-not-import-stdstringutf8)
  + [UID has `delete`](#uid-has-delete)
  + [`ctx` has `sender()`](#ctx-has-sender)
  + [Vector Has a Literal. And Associated Functions](#vector-has-a-literal-and-associated-functions)
  + [Collections Support Index Syntax](#collections-support-index-syntax)
* [Option -> Macros](#option---macros)
  + [Destroy And Call Function](#destroy-and-call-function)
  + [Destroy Some With Default](#destroy-some-with-default)
* [Loops -> Macros](#loops---macros)
  + [Do Operation N Times](#do-operation-n-times)
  + [New Vector From Iteration](#new-vector-from-iteration)
  + [Do Operation on Every Element of a Vector](#do-operation-on-every-element-of-a-vector)
  + [Destroy a Vector and Call a Function on Each Element](#destroy-a-vector-and-call-a-function-on-each-element)
  + [Fold Vector Into a Single Value](#fold-vector-into-a-single-value)
  + [Filter Elements of the Vector](#filter-elements-of-the-vector)
* [Other](#other)
  + [Ignored Values In Unpack Can Be Ignored Altogether](#ignored-values-in-unpack-can-be-ignored-altogether)
* [Testing](#testing)
  + [Merge `#[test]` and `#[expected_failure(...)]`](#merge-test-and-expected_failure)
  + [Do Not Clean Up `expected_failure` Tests](#do-not-clean-up-expected_failure-tests)
  + [Do Not Prefix Tests With `test_` in Testing Modules](#do-not-prefix-tests-with-test_-in-testing-modules)
  + [Do Not Use `TestScenario` Where Not Necessary](#do-not-use-testscenario-where-not-necessary)
  + [Do Not Use Abort Codes in `assert!` in Tests](#do-not-use-abort-codes-in-assert-in-tests)
  + [Use `assert_eq!` Whenever Possible](#use-assert_eq-whenever-possible)
  + [Use "Black Hole" `destroy` Function](#use-black-hole-destroy-function)
* [Comments](#comments)
  + [Doc Comments Start With `///`](#doc-comments-start-with-)
  + [Complex Logic? Leave a Comment `//`](#complex-logic-leave-a-comment-)