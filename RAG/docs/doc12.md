Hello, World! | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Hello, World!

In this chapter, you will learn how to create a new package, write a simple module, compile it, and
run tests with the Move CLI. Make sure you have [installed Sui](/before-we-begin/install-sui)
and set up your [IDE environment](/before-we-begin/ide-support). Run the command below to test
if Sui has been installed correctly.

```move
# It should print the client version. E.g. sui-client 1.22.0-036299745.  
sui client --version
```

> Move CLI is a command-line interface for the Move language; it is built into the Sui binary and
> provides a set of commands to manage packages, compile and test code.

The structure of the chapter is as follows:

* [Create a New Package](#create-a-new-package)
* [Directory Structure](#directory-structure)
* [Compiling the Package](#compiling-the-package)
* [Running Tests](#running-tests)

## Create a New Package[​](#create-a-new-package "Direct link to Create a New Package")

To create a new program, we will use the sui move new command followed by the name of the
application. Our first program will be called hello\_world.

> Note: In this and other chapters, if you see code blocks with lines starting with $ (dollar
> sign), it means that the following command should be run in a terminal. The sign should not be
> included. It's a common way of showing commands in terminal environments.

```move
$ sui move new hello_world
```

The sui move command gives access to the Move CLI - a built-in compiler, test runner and a utility
for all things Move. The new command followed by the name of the package will create a new package
in a new folder. In our case, the folder name is "hello\_world".

We can view the contents of the folder to see that the package was created successfully.

```move
$ ls -l hello_world  
Move.toml  
sources  
tests
```

## Directory Structure[​](#directory-structure "Direct link to Directory Structure")

Move CLI will create a scaffold of the application and pre-create the directory structure and all
necessary files. Let's see what's inside.

```move
hello_world  
├── Move.toml  
├── sources  
│   └── hello_world.move  
└── tests  
    └── hello_world_tests.move
```

### Manifest[​](#manifest "Direct link to Manifest")

The Move.toml file, known as the [package manifest](/concepts/manifest), contains definitions
and configuration settings for the package. It is used by the Move Compiler to manage package
metadata, fetch dependencies, and register named addresses. We will explain it in detail in the
[Concepts](/concepts/) chapter.

> By default, the package features one named address - the name of the package.

```move
[addresses]  
hello_world = "0x0"
```

### Sources[​](#sources "Direct link to Sources")

The sources/ directory contains the source files. Move source files have *.move* extension, and
are typically named after the module defined in the file. For example, in our case, the file name is
*hello\_world.move* and the Move CLI has already placed commented out code inside:

```move
/*  
/// Module: hello_world  
module hello_world::hello_world;  
*/
```

> The /\* and \*/ are the comment delimiters in Move. Everything in between is ignored by the
> compiler and can be used for documentation or notes. We explain all ways to comment the code in
> the [Basic Syntax](/move-basics/comments).

The commented out code is a module definition, it starts with the keyword module followed by a
named address (or an address literal), and the module name. The module name is a unique identifier
for the module and has to be unique within the package. The module name is used to reference the
module from other modules or transactions.

### Tests[​](#tests "Direct link to Tests")

The tests/ directory contains package tests. The compiler excludes these files in the regular
build process but uses them in *test* and *dev* modes. The tests are written in Move and are marked
with the #[test] attribute. Tests can be grouped in a separate module (then it's usually called
*module\_name\_tests.move*), or inside the module they're testing.

Modules, imports, constants and functions can be annotated with #[test\_only]. This attribute is
used to exclude modules, functions or imports from the build process. This is useful when you want
to add helpers for your tests without including them in the code that will be published on chain.

The *hello\_world\_tests.move* file contains a commented out test module template:

```move
/*  
#[test_only]  
module hello_world::hello_world_tests;  
// uncomment this line to import the module  
// use hello_world::hello_world;  
  
const ENotImplemented: u64 = 0;  
  
#[test]  
fun test_hello_world() {  
    // pass  
}  
  
#[test, expected_failure(abort_code = hello_world::hello_world_tests::ENotImplemented)]  
fun test_hello_world_fail() {  
    abort ENotImplemented  
}  
*/
```

### Other Folders[​](#other-folders "Direct link to Other Folders")

Additionally, Move CLI supports the examples/ folder. The files there are treated similarly to the
ones placed under the tests/ folder - they're only built in the *test* and *dev* modes. They are
to be examples of how to use the package or how to integrate it with other packages. The most
popular use case is for documentation purposes and library packages.

## Compiling the Package[​](#compiling-the-package "Direct link to Compiling the Package")

Move is a compiled language, and as such, it requires the compilation of source files into Move
Bytecode. It contains only necessary information about the module, its members, and types, and
excludes comments and some identifiers (for example, for constants).

To demonstrate these features, let's replace the contents of the *sources/hello\_world.move* file
with the following:

```move
/// The module `hello_world` under named address `hello_world`.  
/// The named address is set in the `Move.toml`.  
module hello_world::hello_world;  
  
// Imports the `String` type from the Standard Library  
use std::string::String;  
  
/// Returns the "Hello World!" as a `String`.  
public fun hello_world(): String {  
    b"Hello, World!".to_string()  
}
```

During compilation, the code is built, but not run. A compiled package only includes functions that
can be called by other modules or in a transaction. We will explain these concepts in the
[Concepts](/concepts/) chapter. But now, let's see what happens when we run the *sui move build*.

```move
# run from the `hello_world` folder  
$ sui move build  
  
# alternatively, if you didn't `cd` into it  
$ sui move build --path hello_world
```

It should output the following message on your console.

```move
UPDATING GIT DEPENDENCY https://github.com/MystenLabs/sui.git  
INCLUDING DEPENDENCY Bridge  
INCLUDING DEPENDENCY DeepBook  
INCLUDING DEPENDENCY SuiSystem  
INCLUDING DEPENDENCY Sui  
INCLUDING DEPENDENCY MoveStdlib  
BUILDING hello_world
```

During the compilation, Move Compiler automatically creates a build folder where it places all
fetched and compiled dependencies as well as the bytecode for the modules of the current package.

> If you're using a versioning system, such as Git, build folder should be ignored. For example, you
> should use a .gitignore file and add build to it.

## Running Tests[​](#running-tests "Direct link to Running Tests")

Before we get to testing, we should add a test. Move Compiler supports tests written in Move and
provides the execution environment. The tests can be placed in both the source files and in the
tests/ folder. Tests are marked with the #[test] attribute and are automatically discovered by
the compiler. We explain tests in depth in the [Testing](/move-basics/testing) section.

Replace the contents of the tests/hello\_world\_tests.move with the following content:

```move
#[test_only]  
module hello_world::hello_world_tests;  
  
use std::unit_test::assert_eq;  
  
use hello_world::hello_world;  
  
#[test]  
fun test_hello_world() {  
    assert_eq!(hello_world::hello_world(), b"Hello, World!".to_string());  
}
```

Here we import the hello\_world module, and call its hello\_world function to test that the output
is indeed the string "Hello, World!". Now, that we have tests in place, let's compile the package in
the test mode and run tests. Move CLI has the test command for this:

```move
$ sui move test
```

The output should be similar to the following:

```move
INCLUDING DEPENDENCY Bridge  
INCLUDING DEPENDENCY DeepBook  
INCLUDING DEPENDENCY SuiSystem  
INCLUDING DEPENDENCY Sui  
INCLUDING DEPENDENCY MoveStdlib  
BUILDING hello_world  
Running Move unit tests  
[ PASS    ] 0x0::hello_world_tests::test_hello_world  
Test result: OK. Total tests: 1; passed: 1; failed: 0
```

If you're running the tests outside of the package folder, you can specify the path to the package:

```move
$ sui move test --path hello_world
```

You can also run a single or multiple tests at once by specifying a string. All the tests names
containing the string will be run:

```move
$ sui move test test_hello
```

## Next Steps[​](#next-steps "Direct link to Next Steps")

In this section, we explained the basics of a Move package: its structure, the manifest, the build,
and test flows. [On the next page](/your-first-move/hello-sui), we will write an application and see how the code
is structured and what the language can do.

## Further Reading[​](#further-reading "Direct link to Further Reading")

* [Package Manifest](/concepts/manifest) section
* Package in [The Move Reference](/reference/packages)

* [Create a New Package](#create-a-new-package)
* [Directory Structure](#directory-structure)
  + [Manifest](#manifest)
  + [Sources](#sources)
  + [Tests](#tests)
  + [Other Folders](#other-folders)
* [Compiling the Package](#compiling-the-package)
* [Running Tests](#running-tests)
* [Next Steps](#next-steps)
* [Further Reading](#further-reading)