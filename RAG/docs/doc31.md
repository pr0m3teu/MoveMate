Vector | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Vector

Vectors are a native way to store collections of elements in Move. They are similar to arrays in
other programming languages, but with a few differences. In this section, we introduce the vector
type and its operations.

## Vector syntax[​](#vector-syntax "Direct link to Vector syntax")

The vector type is written using the vector keyword followed by the type of the elements in
angle brackets. The type of the elements can be any valid Move type, including other vectors.

Move has a vector literal syntax that allows you to create vectors using the vector keyword
followed by square brackets containing the elements (or no elements for an empty vector).

```move
// An empty vector of bool elements.  
let empty: vector<bool> = vector[];  
  
// A vector of u8 elements.  
let v: vector<u8> = vector[10, 20, 30];  
  
// A vector of vector<u8> elements.  
let vv: vector<vector<u8>> = vector[  
    vector[10, 20],  
    vector[30, 40]  
];
```

The vector type is a built-in type in Move, and does not need to be imported from a module.
Vector operations are defined in the std::vector module, which is implicitly imported
and can be used directly without explicit use import.

## Vector operations[​](#vector-operations "Direct link to Vector operations")

The standard library provides methods to manipulate vectors. The following are some of the most
commonly used operations:

* push\_back: Adds an element to the end of the vector.
* pop\_back: Removes the last element from the vector.
* length: Returns the number of elements in the vector.
* is\_empty: Returns true if the vector is empty.
* remove: Removes an element at a given index.

```move
let mut v = vector[10u8, 20, 30];  
  
assert_eq!(v.length(), 3);  
assert_eq!(v.is_empty(), false);  
  
v.push_back(40);  
let last_value = v.pop_back();  
  
assert_eq!(last_value, 40);
```

## Destroying a Vector of non-droppable types[​](#destroying-a-vector-of-non-droppable-types "Direct link to Destroying a Vector of non-droppable types")

A vector of non-droppable types cannot be discarded. If you define a vector of types without the
drop ability, the vector value cannot be ignored. If the vector is empty, the compiler requires an
explicit call to the destroy\_empty function.

```move
/// A struct without `drop` ability.  
public struct NoDrop {}  
  
#[test]  
fun test_destroy_empty() {  
    // Initialize a vector of `NoDrop` elements.  
    let v = vector<NoDrop>[];  
  
    // While we know that `v` is empty, we still need to call  
    // the explicit `destroy_empty` function to discard the vector.  
    v.destroy_empty();  
}
```

The destroy\_empty function will fail at runtime if you call it on a non-empty vector.

## Further Reading[​](#further-reading "Direct link to Further Reading")

* [Vector](/reference/primitive-types/vector) in the Move Reference.
* [std::vector](https://docs.sui.io/references/framework/std/vector) module documentation.

* [Vector syntax](#vector-syntax)
* [Vector operations](#vector-operations)
* [Destroying a Vector of non-droppable types](#destroying-a-vector-of-non-droppable-types)
* [Further Reading](#further-reading)