Guides and Tutorials | Sui Documentation






[Skip to main content](#__docusaurus_skipToContent_fallback)

🗳️Book Office Hours→[💬Join Discord→](https://discord.gg/sui)

On this page

# Guides and Tutorials

This section provides practical, implementation-focused examples designed to accelerate your journey developing on Sui.

Whether you are new to blockchain development or an experienced Sui developer, these resources offer structured guidance for building applications, creating assets, and leveraging Sui's unique technical features effectively.

## Get started developing on Sui[​](#get-started-developing-on-sui "Direct link to Get started developing on Sui")

Install tooling, setup your environment, and deploy a "Hello, World!" Move package to start your Sui developer experience.

## 1. Install Sui

Install the Sui framework and its required prerequisites on your system.

## 2. Configure a Sui Client

The Sui client configuration specifies which network to connect to and which address to send transactions.

## 3. Create a Sui Address

You need an address on the Sui network before you can build packages and own objects.

## 4. Get SUI from Faucet

Use the Sui faucet to obtain free SUI tokens for use on the Sui Devnet and Testnet networks.

## 5. Hello, World!

Create and publish your first Move package using a basic 'Hello, World!' example.

## 6. Next Steps

To continue your journey building on Sui, you can review other documentation, join the community of other Sui builders, or check out the Awesome Sui repo.

## Sui essentials[​](#sui-essentials "Direct link to Sui essentials")

Follow these guides to learn about essential Sui concepts.

## Object Ownership

On Sui, object ownership can be represented in different ways. Weigh the benefits of each to decide the best approach for your project.

## Using Events

Use events to notify on-chain assets of activity your smart contracts initiate and query events from other packages to trigger logic based on emitted events.

## Access Sui Data

Overview of the types of data access mechanisms available in Sui.

## Access On-Chain Time

Access network-based time for your transactions. Sui provides a Clock module to capture near-real time or epoch time in your Sui packages.

## Signing and sending transactions[​](#signing-and-sending-transactions "Direct link to Signing and sending transactions")

Learn about signing and sending transactions.

## Sponsored Transactions

Sponsored transactions are a primitive on the Sui blockchain that enable the execution of a transaction where you pay the gas fee for your users transactions.

## Avoid Equivocation

Epochs define time periods on Sui where the validator set remains unchanged. Equivocation occurs when objects are used incorrectly across transactions. Reconfiguration adjusts network parameters at epoch boundaries.

## Building PTBs

Using the Sui TypeScript SDK, you can create programmable transaction blocks to perform multiple commands in a single transaction.

## Coin Management

Because Sui uses coins as owned objects for transactions, you need to explicitly manage them in your programmable transaction block development.

## Simulating References

Use the borrow module in the Sui framework to include objects by reference in your programmable transaction blocks.

## Coins, tokens, and NFTs[​](#coins-tokens-and-nfts "Direct link to Coins, tokens, and NFTs")

Learn how to mint coins and tokens on Sui.

## Create Currencies and Tokens

Learn how to create currencies and mint coins and tokens on the Sui network using the Coin Registry system.

## Regulated Currency and Deny List

You can create regulated currencies on Sui using the Coin Registry system. These coins include the ability to control access using a deny list.

## In-Game Currency

Use the Sui Closed-Loop Token standard to create tokens that you can use as currency within a game application.

## Loyalty Token

Use the Sui Closed-Loop Token standard to create tokens that are only valid within specific workflows and services. One example of Closed-Loop Tokens is a loyalty token.

## Create an NFT

On Sui, everything is an object. Moreover, everything is a non-fungible token (NFT) as its objects are unique, non-fungible, and owned.

## Soulbound NFT

An example using Sui Move struct abilities and the Sui Framework's `transfer` module to make a NFT soulbound (non-transferable).

## NFT Rental Example

An example using the Kiosk Apps standard that provides the ability for users to rent NFTs according to the rules of a provided policy instead of outright owning them. This approach closely aligns with the ERC-4907 renting standard, making it a suitable choice for Solidity-based use cases intended for implementation on Sui.

## Asset Tokenization

Learn how to tokenize assets on the Sui blockchain. Asset tokenization refers to the process of representing real-world assets, such as real estate, art, commodities, stocks, or other valuable assets, as digital tokens on the blockchain network.

## Cryptography[​](#cryptography "Direct link to Cryptography")

Learn about on-chain signatures, multisig authentication, and zkLogin.

## Sui On-Chain Signatures Verification in Move

Sui supports verification within Move smart contracts through several signature schemes. Signature schemes include Ed25519, Secp256k1 recoverable, Secp256k1 non-recoverable, Secp256r1 non-recoverable, Secp256r1 recoverable, BLS G1, and BLS G2.

## Groth16

Zero-knowledge proofs are used to validate statements without revealing information about the proof's inputs.

## Hashing

Sui supports SHA2-256, SHA3-256, Keccak256, and Blake2b-256 cryptographic hash functions.

## ECVRF

Elliptic curve verifiable random function is a cryptographic algorithm that enables you to generate a random number and provide proof that the number used a secret key for generation.

## Multisig Authentication

Guide on how to create a multisig transaction and then submit it against a local network using the Sui CLI.

## Configure OpenID Providers

zkLogin can be integrated with an application using an OpenID provider's OAuth Client ID and redirect URI.

## zkLogin Example

An example that breaks down the logic behind each step of zkLogin.

## Indexers[​](#indexers "Direct link to Indexers")

Build your own custom indexer, integrate it with your application, and benchmark its performance.

## Build Your First Custom Indexer

Build a custom indexer using the `sui-indexer-alt-framework` module. The example indexer demonstrates a sequential pipeline that extracts transaction digests from Sui checkpoints and stores them in a local PostgreSQL.

## Custom Indexer and Walrus

Walrus is a content-addressable storage protocol, where data is retrieved using a unique identifier derived from the content itself, rather than from a file path or location. Integrating a custom Sui Indexer with Walrus can provide novel user experiences.

## Indexer Data and Integration

Learn how to integrate custom data sources and storage systems with Sui indexers. Covers checkpoint data sources, custom store implementations, and Move event deserialization for building flexible indexing solutions.

## Indexer Runtime and Performance

Learn how to optimize Sui custom indexer performance through runtime configuration, resource monitoring, and debugging tools. Covers ingestion settings, database tuning, Tokio console debugging, Prometheus metrics, and data pruning strategies.

## Example applications[​](#example-applications "Direct link to Example applications")

Try out these example applications to learn more about Sui.

## End-to-End Counter

An app that allows users to create counters that anyone can increment, but only the owner can reset.

## Trustless Swap

An app that performs atomic swaps on Sui. Atomic swaps are similar to escrows but without requiring a trusted third party.

## Coin Flip

Learn Sui through a coin flip dApp that covers the full end-to-end flow of building a Sui Move module and connecting it to a React Sui dApp.

## Review Rating

This example app creates a food rating service that stores all review data and algorithms on-chain.

## Blackjack

Learn Sui using an example implementation of the popular casino game Blackjack.

## Plinko

Learn Sui through an example implementation of the popular casino game, Plinko.

## Tic-Tac-Toe

This example demonstrates how to create three variations of a tic-tac-toe app on Sui.

## Weather oracle

Write a module (smart contract) in Move that fetches the weather data from the OpenWeather API every 10 minutes and updates the weather conditions for over 1,000 locations around the world.

## Validating and operating nodes on Sui[​](#validating-and-operating-nodes-on-sui "Direct link to Validating and operating nodes on Sui")

Processes and guides for validators and node operators on the Sui network.

## Validator Configuration

Learn how to set up, configure, and manage a Sui validator node.

## Run a Sui Full Node

Operate a Sui full node to validate blockchain activities, like transactions, checkpoints, and epoch changes.

## Full Node Data Management

A high-level description of data management on the Sui network that you can use to optimize your Sui full node configuration.

## Sui Bridge Node Configuration

Correct configuration of your node ensures optimal performance and valid metrics data.

* [Get started developing on Sui](#get-started-developing-on-sui)
* [Sui essentials](#sui-essentials)
* [Signing and sending transactions](#signing-and-sending-transactions)
* [Coins, tokens, and NFTs](#coins-tokens-and-nfts)
* [Cryptography](#cryptography)
* [Indexers](#indexers)
* [Example applications](#example-applications)
* [Validating and operating nodes on Sui](#validating-and-operating-nodes-on-sui)