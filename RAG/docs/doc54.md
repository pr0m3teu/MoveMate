Sui Verifier: Internal Constraint | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

# Sui Verifier: Internal Constraint

The Sui Bytecode Verifier enforces a set of rules on Move bytecode to ensure the safety of critical
storage operations. One of these rules is the *internal constraint*. It requires that the caller of
a function with a type parameter T must be the *defining module* of that type. In other words, T
must be *internal* to the module making the call.

This rule is not (yet) part of the Move language itself, which can make it feel opaque. Still, it’s
an important rule to understand, especially when working with storage-related operations on Sui.

Let’s look at an example from the [Sui Framework](/programmability/sui-framework). The emit function in the
[sui::event](/programmability/events) module requires its type parameter T to be *internal* to the caller:

```move
// An actual example of a function that enforces `internal` on `T`.  
module sui::event;  
  
// Sui Verifier will emit an error at compilation if this function is  
// called from a module that does not define `T`.  
public native fun emit<T: copy + drop>(event: T);
```

Here’s a correct call to emit. The type A is defined inside the module exercise\_internal, so
it’s internal and valid:

```move
// Defines type `A`.  
module book::exercise_internal;  
  
use sui::event;  
  
/// Type defined in this module, so it's internal here.  
public struct A has copy, drop {}  
  
// This works because `A` is defined locally.  
public fun call_internal() {  
    event::emit(A {})  
}
```

But if you try to call emit with a type defined elsewhere, the verifier rejects it. For example,
this function, when added to the same module, fails because it tries to use the TypeName type from
the [Standard Library](/move-basics/standard-library):

```move
// This one fails!  
public fun call_foreign_fail() {  
    use std::type_name;  
  
    event::emit(type_name::get<A>());  
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Invalid event.  
    // Error: `sui::event::emit` must be called with a type  
    // defined in the current module.  
}
```

Internal constraints only apply to certain functions in the [Sui Framework](/programmability/sui-framework). We’ll
return to this concept several times throughout the book.