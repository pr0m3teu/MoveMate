Visibility Modifiers | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Visibility Modifiers

Every module member has a visibility. By default, all module members are *private* - meaning they
are only accessible within the module they are defined in. However, you can add a visibility
modifier to make a module member *public* - visible outside the module, or *public(package)* -
visible in the modules within the same package, or *entry* - can be called from a transaction but
can't be called from other modules.

## Internal Visibility[​](#internal-visibility "Direct link to Internal Visibility")

A function or a struct defined in a module which has no visibility modifier is *private* to the
module. It can't be called from other modules.

```move
module book::internal_visibility;  
  
// This function can be called from other functions in the same module  
fun internal() { /* ... */ }  
  
// Same module -> can call internal()  
fun call_internal() {  
    internal();  
}
```

The following code will not compile:

```move
module book::try_calling_internal;  
  
use book::internal_visibility;  
  
// Different module -> can't call internal()  
fun try_calling_internal() {  
    internal_visibility::internal();  
}
```

Note that just because a struct field is not visible from Move does not mean that its value is kept
confidential — it is always possible to read the contents of an on-chain object from outside
of Move. You should never store unencrypted secrets inside of objects.

## Public Visibility[​](#public-visibility "Direct link to Public Visibility")

A struct or a function can be made *public* by adding the public keyword before the fun or
struct keyword.

```move
module book::public_visibility;  
  
// This function can be called from other modules  
public fun public_fun() { /* ... */ }
```

A public function can be imported and called from other modules. The following code will compile:

```move
module book::try_calling_public;  
  
use book::public_visibility;  
  
// Different module -> can call public_fun()  
fun try_calling_public() {  
    public_visibility::public_fun();  
}
```

Unlike some languages, struct fields cannot be made public.

## Package Visibility[​](#package-visibility "Direct link to Package Visibility")

A function with *package* visibility can be called from any module within the same package, but not
from modules in other packages. In other words, it is *internal* to the package.

```move
module book::package_visibility;  
  
public(package) fun package_only() { /* ... */ }
```

A package function can be called from any module within the same package:

```move
module book::try_calling_package;  
  
use book::package_visibility;  
  
// Same package `book` -> can call package_only()  
fun try_calling_package() {  
    package_visibility::package_only();  
}
```

## Native Functions[​](#native-functions "Direct link to Native Functions")

Some functions in the [framework](/programmability/sui-framework) and
[standard library](/move-basics/standard-library) are marked with the native modifier. These functions are
natively provided by the Move VM and do not have a body in Move source code. To learn more about the
native modifier, refer to the
[Move Reference](/reference/functions?highlight=native#native-functions).

```move
module std::type_name;  
  
public native fun get<T>(): TypeName;
```

This is an example from std::type\_name, learn more about this module in the
[reflection chapter](/move-basics/type-reflection).

## Further Reading[​](#further-reading "Direct link to Further Reading")

* [Visibility](/reference/functions#visibility) in the Move Reference.

* [Internal Visibility](#internal-visibility)
* [Public Visibility](#public-visibility)
* [Package Visibility](#package-visibility)
* [Native Functions](#native-functions)
* [Further Reading](#further-reading)