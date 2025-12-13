Sui Concepts Overview | Sui Documentation






[Skip to main content](#__docusaurus_skipToContent_fallback)

🗳️Book Office Hours→[💬Join Discord→](https://discord.gg/sui)

On this page

# Sui Concepts Overview

Sui introduces innovative approaches to blockchain architecture and development. The concepts explored in this section provide comprehensive coverage of Sui's design, from core architecture to advanced features.

## Architecture[​](#architecture "Direct link to Architecture")

## Networks

Sui operates multiple networks including Mainnet for production, Testnet for staging, Devnet for developing new features, and Localnet for local development.

## Storage

Historical data and storage pricing provide insights into the cost of operations on the Sui network.

## Consensus

Overview of the Sui consensus mechanism.

## Epochs and Reconfiguration

Epochs define time periods on Sui where the validator set remains unchanged. Equivocation occurs when objects are used incorrectly across transactions. Reconfiguration adjusts network parameters at epoch boundaries.

## Security

Assets on Sui, including coins and tokens, are types of objects, and can only be used by their owners unless otherwise defined according to predefined logic in a smart contract.

## Protocol Upgrades

The Sui protocol, framework, and execution engine are frequently extended to include new functionality and bug fixes. The upgrade process ensures all clients use the same source.

## Transactions[​](#transactions "Direct link to Transactions")

## Life of a Transaction

The life of a transaction on the Sui network has some differences compared to those from other blockchains.

## Programmable Transaction Blocks

Programmable transaction blocks are a group of commands that complete a transaction on Sui.

## Sponsored Transactions

A sponsored transaction is when one Sui address pays the gas fee for a transaction submitted by another address. Sponsored transactions can help facilitate user onboarding and simplified asset management.

## Gas Smashing

Sui optimizes coin management by combining multiple coins into a single object to pay for gas fees.

## Transaction Authentication

## Tokenomics[​](#tokenomics "Direct link to Tokenomics")

## SUI Tokenomics

Sui's tokenomics is designed to support the long-term financial needs of Web3. It uses the native SUI token as the currency of the network and to pay for the network's gas fees.

## Staking and Unstaking

Staking and unstaking SUI with validators earns a percentage of rewards they receive from gas fees.

## Gas Fees

A Sui transaction must pay for both the computational cost of execution and the long-term cost of storing the objects a transaction creates or mutates.

## SUI Bridging

Moving tokens from one blockchain to another is called bridging. To bridge tokens from another blockchain to Sui, you can use the Sui Bridge, Wormhole Connect, Wormhole Portal Bridge, or ZetaChain.

## Vesting Strategies

If you plan to launch a token on Sui, then you might consider implementing a vesting strategy to strengthen the long-term outlook of your token.

## Object Model[​](#object-model "Direct link to Object Model")

## Object Ownership

On Sui, object ownership can be represented in different ways. Weigh the benefits of each to decide the best approach for your project.

## Transfers

Everything on Sui is an object. To use objects, they must be transferred between owners, which can be an address or another object.

## Object and Package Versioning

Versioning provides the ability to upgrade packages and objects on the Sui network.

## Move[​](#move "Direct link to Move")

## Move Concepts

Move is an open source language for writing safe packages to manipulate on-chain objects.

## Packages

A Move package on Sui includes one or more modules that define that package's interaction with on-chain objects. Upgrading packages lets you improve code or add features without breaking packages that depend on them.

## Dynamic Fields

Dynamic fields and dynamic object fields on Sui are added and removed dynamically, affect gas only when accessed, and store heterogeneous values.

## Move Conventions

Recommended Move 2024 best practices for Sui development.

## Data Access[​](#data-access "Direct link to Data Access")

## gRPC Overview

Overview of the gRPC API to access Sui network data.

## GraphQL

The GraphQL RPC Beta service offers a structured way for your clients to interact with data on the Sui blockchain. It accesses data processed by a general-purpose indexer and can connect to an archival store for historical network state.

## Archival Store and Service

Overview of the Archival Store and Service to access historical Sui network data.

## Cryptography[​](#cryptography "Direct link to Cryptography")

## zkLogin

zkLogin is a Sui primitive that enables you to send transactions from a Sui address using an OAuth credential without publicly linking the two.

## Passkey

Sui supports the passkey signature scheme that enables you to sign in to apps and sign transactions using a private key stored securely on a passkey authenticator. It uses the WebAuthn standard.

## Nautilus

Overview of the design aspects of Nautilus, including its trust model.

## Checkpoint Verification

On the Sui network, checkpoints define the history of the blockchain. Checkpoint verification is how full nodes and other clients guarantee their state is exactly the same as the Sui network.

## Additional Resources[​](#additional-resources "Direct link to Additional Resources")

## Ethereum to Sui

Build your first dApp on Sui if you have EVM experience

## Gaming on Sui

Sui offers features like dynamic NFTs, kiosks, soulbound assets, and on-chain randomness, to provide builders with the tools to create immersive, transparent, and fair gaming experiences.

## Research Papers

Research papers that are relevant to Sui and that one or more Sui team members have co-authored.

* [Architecture](#architecture)
* [Transactions](#transactions)
* [Tokenomics](#tokenomics)
* [Object Model](#object-model)
* [Move](#move)
* [Data Access](#data-access)
* [Cryptography](#cryptography)
* [Additional Resources](#additional-resources)