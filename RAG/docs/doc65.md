Epoch and Time | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Epoch and Time

Sui has two ways of accessing the current time: Epoch and Time. The former represents
operational periods in the system and changed roughly every 24 hours. The latter represents the
current time in milliseconds since the Unix Epoch. Both can be accessed freely in the program.

## Epoch[​](#epoch "Direct link to Epoch")

Epochs are used to separate the system into operational periods. During an epoch the validator set
is fixed, however, at the epoch boundary, the validator set can be changed. Epochs play a crucial
role in the consensus algorithm and are used to determine the current validator set. They are also
used as measurement in the staking mechanism.

Epoch can be read from the [transaction context](/programmability/transaction-context):

```move
public fun current_epoch(ctx: &TxContext) {  
    let epoch = ctx.epoch();  
    // ...  
}
```

It is also possible to get the unix timestamp of the epoch start:

```move
public fun current_epoch_start(ctx: &TxContext) {  
    let epoch_start = ctx.epoch_timestamp_ms();  
    // ...  
}
```

Normally, epochs are used in staking and system operations, however, in custom scenarios they can be
used to emulate 24h periods. They are critical if an application relies on the staking logic or
needs to know the current validator set.

## Time[​](#time "Direct link to Time")

For a more precise time measurement, Sui provides the Clock object. It is a system object that is
updated during checkpoints by the system, which stores the current time in milliseconds since the
Unix Epoch. The Clock object is defined in the sui::clock module and has a reserved address
0x6.

Clock is a shared object, but a transaction attempting to access it mutably will fail. This
limitation allows parallel access to the Clock object, which is important for maintaining
performance.

```move
module sui::clock;  
  
/// Singleton shared object that exposes time to Move calls.  This  
/// object is found at address 0x6, and can only be read (accessed  
/// via an immutable reference) by entry functions.  
///  
/// Entry Functions that attempt to accept `Clock` by mutable  
/// reference or value will fail to verify, and honest validators  
/// will not sign or execute transactions that use `Clock` as an  
/// input parameter, unless it is passed by immutable reference.  
public struct Clock has key {  
    id: UID,  
    /// The clock's timestamp, which is set automatically by a  
    /// system transaction every time consensus commits a  
    /// schedule, or by `sui::clock::increment_for_testing` during  
    /// testing.  
    timestamp_ms: u64,  
}
```

There is only one public function available in the Clock module - timestamp\_ms. It returns the
current time in milliseconds since the Unix Epoch.

```move
use sui::clock::Clock;  
  
/// Clock needs to be passed as an immutable reference.  
public fun current_time(clock: &Clock) {  
    let time = clock.timestamp_ms();  
    // ...  
}
```

## Testing[​](#testing "Direct link to Testing")

The Clock module provides a number of methods for use in testing.

```move
#[test_only]  
use sui::clock;  
#[test_only]  
use std::unit_test::assert_eq;  
  
#[test]  
fun use_clock_in_test() {  
    // Get `ctx` and create `Clock` for testing  
    let ctx = &mut tx_context::dummy();  
    let mut clock = clock::create_for_testing(ctx);  
    assert_eq!(clock.timestamp_ms(), 0);  
  
    // Add a value to the timestamp stored in `Clock`  
    clock.increment_for_testing(2_000_000_000);  
    assert_eq!(clock.timestamp_ms(), 2_000_000_000);  
  
    // Set the timestamp, but the time set must be no less than the value stored in `Clock`  
    clock.set_for_testing(3_000_000_000);  
    assert_eq!(clock.timestamp_ms(), 3_000_000_000);  
  
    // The following setting will fail because the time set must be at least the timestamp stored in `Clock`  
    // clock.set_for_testing(1_000_000_000);  
    // assert_eq!(clock.timestamp_ms(), 1_000_000_000);  
  
    // If need a shared `Clock` for testing, you can set it through this function  
    // clock.share_for_testing();  
  
    // `Clock` does not have a `drop` capability, so it needs to be destroyed manually at the end of the test  
    clock.destroy_for_testing();  
}
```

* [Epoch](#epoch)
* [Time](#time)
* [Testing](#testing)