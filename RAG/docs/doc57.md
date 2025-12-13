Storage Functions | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Storage Functions

The module that defines main storage operations is sui::transfer. It is implicitly imported in all
packages that depend on the [Sui Framework](/programmability/sui-framework), so, like other
implicitly imported modules (e.g. std::option or std::vector), it does not require adding a use
statement.

> For quick reference, [Appendix C: Transfer Functions](/appendix/transfer-functions)
> contains a list of all storage functions and object states.

## Overview[​](#overview "Direct link to Overview")

The transfer module provides functions to perform storage operations for each of the
[ownership types](/object/ownership).

1. [Transfer](#transfer) - send an object to an address, put it into *address owned* state;
2. [Freeze](#freeze) - put an object into *immutable* state, so it becomes a *public constant* and
   can never change.
3. [Share](#share) - put an object into a *shared* state, so it is available to everyone;

The transfer module is a go-to for most of the storage operations, except a special case with
[Dynamic Fields](/programmability/dynamic-fields) which are covered in the next chapter.

## Ownership and References: a Quick Recap[​](#ownership-and-references-a-quick-recap "Direct link to Ownership and References: a Quick Recap")

In the [Ownership and Scope](/move-basics/ownership-and-scope) and
[References](/move-basics/references) chapters, we covered the basics of ownership and
references in Move. It is important that you understand these concepts when using storage functions.
Here is a quick recap of the most important points:

* The *move* semantics in Move means that the value is *moved* from one scope to another. In other
  words, if an instance of a type is passed to a function *by value*, it is *moved* to the function
  scope and can't be accessed in the caller scope anymore.
* To maintain the ownership of the value, you can pass it *by reference*. Either by *immutable
  reference* &T or *mutable reference* &mut T. Then the value is *borrowed* and can be accessed
  in the callee scope, however the owner stays the same.

```move
/// Moved by value  
public fun take<T>(value: T) { /* value is moved here! */ abort }  
  
/// For immutable reference, value stays in parent scope.  
public fun borrow<T>(value: &T) { /* value is borrowed here! can be read */ abort }  
  
/// For mutable reference, value stays in parent scope but can be mutated.  
public fun borrow_mut<T>(value: &mut T) { /* value is mutably borrowed here! */ abort }
```

## Internal Rule in Transfer Functions[​](#internal-rule-in-transfer-functions "Direct link to Internal Rule in Transfer Functions")

Storage operations can only be performed on objects, and come in two forms: *internal* and *public*.
Internal, or sometimes called *restricted*, transfer functions can be performed on [key](/storage/key-ability)-only
types, and - comes with the name - enforce [internal constraint](/storage/internal-constraint). Public
versions can be called on any object that has key and [store](/storage/store-ability). Hence, key-only types'
storage is fully governed by their defining module, and store allows calling public transfer
functions in other modules.

```move
/// T: internal, can be called only in the module which defines the `T`.  
public fun transfer<T: key>(obj: T, recipient: address);  
  
/// No requirement for `T` to be internal to the caller, but requires `store`.  
public fun public_transfer<T: key + store>(obj: T, recipient: address);
```

In the example above, the transfer function can only be called from the module that defines the
T, and has a type constraint T: key. While public\_transfer - clearly indicated in the name -
can be called from any module, but requires T to have key and store.

Knowing this rule is critical for understanding application design in Move. Choice between making
object publicly transferable (key and store) and keeping it internal (key-only) may
drastically affect application logic and further development.

## Transfer[​](#transfer "Direct link to Transfer")

The transfer::transfer function is a function used to transfer an object to an address. Its
signature is as follows, only accepts a type with the [key ability](/storage/key-ability) and an
[address](/move-basics/address) of the recipient. Note that the object is passed into the
function *by value*, therefore it is *moved* to the function scope and then moved to the recipient
address.

```move
module sui::transfer;  
  
// Transfer `obj` to `recipient`.  
public fun transfer<T: key>(obj: T, recipient: address);  
  
// Public version of the `transfer` function.  
public fun public_transfer<T: key + store>(obj: T, recipient: address);
```

### Transfer Example[​](#transfer-example "Direct link to Transfer Example")

In the following example, you can see how it can be used in a module that defines and sends an
object to the transaction sender.

```move
module book::transfer_to_sender;  
  
/// A struct with `key` is an object. The first field is `id: UID`!  
public struct AdminCap has key { id: UID }  
  
/// `init` function is a special function that is called when the module  
/// is published. It is a good place to do a setup for an application.  
fun init(ctx: &mut TxContext) {  
    // Create a new `AdminCap` object, in this scope.  
    let admin_cap = AdminCap { id: object::new(ctx) };  
  
    // Transfer the object to the transaction sender.  
    transfer::transfer(admin_cap, ctx.sender());  
}  
  
/// Transfers the `AdminCap` object to the `recipient`. Thus, the recipient  
/// becomes the owner of the object, and only they can access it.  
public fun transfer_admin_cap(cap: AdminCap, recipient: address) {  
    transfer::transfer(cap, recipient);  
}
```

When the module is published, the init function will get called, and the AdminCap object which
we created in it will be *transferred* to the transaction sender. The ctx.sender() function
returns the sender address for the current transaction.

Once the AdminCap has been transferred to the sender, for example, to 0xa11ce, the sender, and
only the sender, will be able to access the object. This type of ownership is called *address
ownership*.

> Address owned objects are a subject to *true ownership* - only owner address can access them. This
> is a fundamental concept in the Sui storage model.

### Public Transfer[​](#public-transfer "Direct link to Public Transfer")

Let's extend the example with a function that uses AdminCap to authorize a mint of a new object
and its transfer to an address:

```move
/// Some `Gift` object that the admin can `mint_and_transfer` to an address.  
public struct Gift has key, store { id: UID }  
  
/// Creates a new `Gift` object and transfers it to the `recipient`.  
public fun mint_and_transfer(  
    _: &AdminCap, recipient: address, ctx: &mut TxContext  
) {  
    let gift = Gift { id: object::new(ctx) };  
    transfer::public_transfer(gift, recipient);  
}
```

The mint\_and\_transfer function is a *public* function that "could" be called by anyone, but it
requires a reference to an AdminCap as the first argument. Without it, the function will not be
callable. This is a simple and very explicit way to restrict access to privileged functions called
*[Capability](/programmability/capability)*. Because the AdminCap object is *address owned*,
only 0xa11ce will be able to call the mint\_and\_transfer function.

Unlike AdminCap where we restricted transferability as well as usability by adding only key
ability, Gift has a key and store combination, which means, that whoever owns a Gift can
freely call transfer::public\_transfer and send it to anyone else. Without store, in our current
implementation, Gift would've been *"soulbound"* meaning that the happy owner of the Gift would
not be able to do anything with it.

### Quick Recap[​](#quick-recap "Direct link to Quick Recap")

* transfer function is used to send an object to an address;
* The object becomes *address owned* and can only be accessed by the recipient;
* *Address owned* object can be used by reference or by value, including being transferred to
  another address;
* *Public* version of it is public\_transfer and requires store
* Functions can be gated by requiring an object to be passed as an argument, creating a
  *capability*.

## Freeze[​](#freeze "Direct link to Freeze")

The transfer::freeze\_object function is a function that is used to put an object into an
*immutable* state. Once an object is *frozen*, it can never change, and it can be accessed by anyone
by immutable reference.

The function signature is as follows, only accepts a type with the [key ability](/storage/key-ability).
Just like all other storage functions, it takes the object *by value*. The public version of this
function is public\_freeze\_object, and requires T to have store.

```move
module sui::transfer;  
  
// Make object immutable and allow anyone to read it.  
public fun freeze_object<T: key>(obj: T);  
  
// Public version of the `freeze_object` function.  
public fun public_freeze_object<T: key + store>(obj: T);
```

Let's extend the previous example and add a function that allows the admin to create a Config
object and freeze it:

```move
/// Some `Config` object that the admin can `create_and_freeze`.  
public struct Config has key {  
    id: UID,  
    message: String  
}  
  
/// Creates a new `Config` object and freezes it.  
public fun create_and_freeze(  
    _: &AdminCap,  
    message: String,  
    ctx: &mut TxContext  
) {  
    let config = Config {  
        id: object::new(ctx),  
        message  
    };  
  
    // Freeze the object so it becomes immutable.  
    transfer::freeze_object(config);  
}  
  
/// Returns the message from the `Config` object.  
/// Can access the object by immutable reference!  
public fun message(c: &Config): String { c.message }
```

Config is an object that has a message field, and the create\_and\_freeze function creates a new
Config and freezes it. Once the object is frozen, it can be accessed by anyone by immutable
reference. The message function is a public function that returns the message from the Config
object. Config is now publicly available by its ID, and the message can be read by anyone.

> Function definitions are not connected to object's state. It is possible to define a function that
> takes a mutable reference to a type that is always frozen. However, it will not be callable on a
> frozen object.

The message function in the example above can be called on an immutable Config object. However,
two functions shown below are not callable on a frozen object:

```move
// === These can't be called on a frozen object! ===  
  
/// The function can be defined, but it won't be callable on a frozen object.  
/// Only immutable references are allowed.  
public fun message_mut(c: &mut Config): &mut String { &mut c.message }  
  
/// Deletes the `Config` object, takes it by value.  
/// Can't be called on a frozen object!  
public fun delete_config(c: Config) {  
    let Config { id, message: _ } = c;  
    id.delete()  
}
```

To summarize:

* transfer::freeze\_object function is used to put an object into an *immutable* state;
* Once an object is *frozen*, it can never be changed, deleted or transferred, and it can be
  accessed by anyone by immutable reference;
* *Public* version of the freeze\_object function is public\_freeze\_object and requires the T to
  have store.

## Owned -> Frozen[​](#owned---frozen "Direct link to Owned -> Frozen")

Since the transfer::freeze\_object signature accepts any type with the key ability, it can take
an object that was created in the same scope, but it can also take an object that was owned by an
account. This means that the freeze\_object function can be used to *freeze* an object that was
*transferred* to the sender. For security concerns, we would not want to freeze the AdminCap
object - it would be a security risk, since anyone would be able to access it. However, we can
freeze the Gift object that was minted and transferred to the recipient:

> Single Owner -> Immutable conversion is possible!

```move
/// Freezes the `Gift` object so it becomes immutable.  
/// Gift has `key` and `store`, so `public_freeze_object` can be used!  
public fun freeze_gift(gift: Gift) {  
    transfer::public_freeze_object(gift);  
}
```

## Share[​](#share "Direct link to Share")

The transfer::share\_object function is a function used to put an object into a *shared* state.
Once an object is *shared*, it can be accessed by anyone by a mutable reference (hence, immutable
too). The function signature is as follows, only accepts a type with the
[key ability](/storage/key-ability):

```move
module sui::transfer;  
  
/// Put an object to a Shared state - can be accessed mutably and immutably.  
public fun share_object<T: key>(obj: T);  
  
/// Public version of `share_object` function.  
public fun public_share_object<T: key + store>(obj: T);
```

Like other transfer functions, share\_object has its *public* version which requires T to have
store.

Once an object is *shared*, it is publicly available as a mutable reference.

## Special Case: Shared Object Deletion[​](#special-case-shared-object-deletion "Direct link to Special Case: Shared Object Deletion")

While the shared object can't normally be taken by value, there is one special case where it can -
if the function that takes it deletes the object. This is a special case in the Sui storage model,
and it is used to allow the deletion of shared objects. To show how it works, we will create a
function that creates and shares a Config object and then another one that deletes it:

```move
/// Creates a new `Config` object and shares it.  
public fun create_and_share(message: String, ctx: &mut TxContext) {  
    let config = Config {  
        id: object::new(ctx),  
        message  
    };  
  
    // Share the object so it becomes shared.  
    transfer::share_object(config);  
}
```

The create\_and\_share function creates a new Config object and shares it. The object is now
publicly available as a mutable reference. Let's create a function that deletes the shared object:

```move
/// Deletes the `Config` object, takes it by value.  
/// Can be called on a shared object!  
public fun delete_config(c: Config) {  
    let Config { id, message: _ } = c;  
    id.delete()  
}
```

The delete\_config function takes the Config object by value and deletes it, and the Sui Verifier
would allow this call. However, if the function returned the Config object back or attempted to
freeze or transfer it, the Sui Verifier would reject the transaction.

```move
// Won't work!  
public fun transfer_shared(c: Config, to: address) {  
    transfer::transfer(c, to);  
}
```

To summarize:

* share\_object function is used to put an object into a *shared* state;
* Once an object is *shared*, it can be accessed by anyone by a mutable reference;
* Shared objects can be deleted, but they can't be transferred or frozen;
* *Public* version of the share\_object function is public\_share\_object and requires the T to
  have store.

## Next Steps[​](#next-steps "Direct link to Next Steps")

Now that you know main features of the transfer module, you can start building more complex
applications on Sui that involve storage operations. In the next chapter, we will cover the
[Store Ability](/storage/store-ability) which allows storing data inside objects and relaxes transfer
restrictions which we barely touched on here. And after that we will cover the
[UID and ID](/storage/uid-and-id) types which are the most important types in the Sui storage model.

* [Overview](#overview)
* [Ownership and References: a Quick Recap](#ownership-and-references-a-quick-recap)
* [Internal Rule in Transfer Functions](#internal-rule-in-transfer-functions)
* [Transfer](#transfer)
  + [Transfer Example](#transfer-example)
  + [Public Transfer](#public-transfer)
  + [Quick Recap](#quick-recap)
* [Freeze](#freeze)
* [Owned -> Frozen](#owned---frozen)
* [Share](#share)
* [Special Case: Shared Object Deletion](#special-case-shared-object-deletion)
* [Next Steps](#next-steps)