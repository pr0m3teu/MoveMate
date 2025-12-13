Appendix C: Transfer Functions | The Move Book






[Skip to main content](#__docusaurus_skipToContent_fallback)

On this page

# Appendix C: Transfer Functions

## Transfer Functions Comparison[​](#transfer-functions-comparison "Direct link to Transfer Functions Comparison")

| Function | Public Function | End State | Permissions |
| --- | --- | --- | --- |
| [transfer](https://docs.sui.io/references/framework/sui_sui/transfer#sui_transfer_transfer) | public\_transfer | Address Owned | Full |
| [share\_object](https://docs.sui.io/references/framework/sui_sui/transfer#sui_transfer_share_object) | public\_share\_object | Shared | Ref, Mut Ref, Delete |
| [freeze\_object](https://docs.sui.io/references/framework/sui_sui/transfer#sui_transfer_freeze_object) | public\_freeze\_object | Frozen | Ref |
| [party\_transfer](https://docs.sui.io/references/framework/sui_sui/transfer#sui_transfer_party_transfer) | public\_party\_transfer | Party | [See Party table](#party) |

## States Comparison[​](#states-comparison "Direct link to States Comparison")

| State | Description |
| --- | --- |
| Address Owned | Object can be accessed fully by an address (or an object) |
| Shared | Object can be referenced and deleted by anyone |
| Frozen | Object can be accessed via immutable reference |
| Party | Depends on the Party settings ([see Party table](#party)) |

## Party[​](#party "Direct link to Party")

| Function | Description |
| --- | --- |
| single\_owner | Object has same permissions as Address Owned |

* [Transfer Functions Comparison](#transfer-functions-comparison)
* [States Comparison](#states-comparison)
* [Party](#party)