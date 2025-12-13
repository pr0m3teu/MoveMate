/**
 * MoveCall Sandbox / TxLab
 * 
 * This component allows users to:
 * - Load Move package ABI from chain (modules + entry functions + parameters)
 * - Select module/function, enter args + type args
 * - Simulate (devInspectTransactionBlock) WITHOUT wallet popup
 * - Execute (useSignAndExecuteTransaction) WITH wallet popup
 * - Display results: status, error, gas used, effects/events/object changes JSON
 * 
 * MVP TEST PRESET:
 * Click "Send 0.001 SUI to myself (simulate)" button to autofill:
 * - packageId = "0x2"
 * - module = "pay"
 * - function = "split_and_transfer"
 * - typeArguments = ["0x2::sui::SUI"]
 * - args: c = Use Gas Coin, amount = 1000000, recipient = account.address
 * 
 * This matches Sui framework docs for testing coin transfers.
 */

import { useState, useEffect } from "react"
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { bcs } from "@mysten/sui/bcs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Info } from "lucide-react"

// Quick fill package IDs
const QUICK_FILL_PACKAGES = [
  { name: "Bounty Protocol", id: "0x79ced3a91d839298bd1c052cfbbf454cc103c5d80d8b3607dd7480fe721fb208" },
  // Add more known packages here
]

// Sui normalized Move type (can be string or structured object)
type SuiMoveNormalizedType =
  | string
  | { Vector: SuiMoveNormalizedType }
  | { Struct: { address: string; module: string; name: string; typeArguments: SuiMoveNormalizedType[] } }
  | { Reference: SuiMoveNormalizedType }
  | { MutableReference: SuiMoveNormalizedType }
  | { TypeParameter: number }

// Recursively convert Sui normalized Move type to string
const moveTypeToString = (t: SuiMoveNormalizedType | unknown): string => {
  if (typeof t === "string") {
    return t
  }
  if (t && typeof t === "object") {
    if ("Vector" in t) {
      return `vector<${moveTypeToString((t as { Vector: SuiMoveNormalizedType }).Vector)}>`
    }
    if ("Struct" in t) {
      const struct = (t as { Struct: { address: string; module: string; name: string; typeArguments: SuiMoveNormalizedType[] } }).Struct
      const typeArgs = struct.typeArguments.length > 0
        ? `<${struct.typeArguments.map(moveTypeToString).join(", ")}>`
        : ""
      return `${struct.address}::${struct.module}::${struct.name}${typeArgs}`
    }
    if ("Reference" in t) {
      return `&${moveTypeToString((t as { Reference: SuiMoveNormalizedType }).Reference)}`
    }
    if ("MutableReference" in t) {
      return `&mut ${moveTypeToString((t as { MutableReference: SuiMoveNormalizedType }).MutableReference)}`
    }
    if ("TypeParameter" in t) {
      return `T${(t as { TypeParameter: number }).TypeParameter}`
    }
  }
  // Fallback for unexpected shapes
  try {
    return JSON.stringify(t)
  } catch {
    return String(t)
  }
}

type NormalizedMoveFunction = {
  name: string
  visibility: string
  isEntry: boolean
  typeParameters: any[]
  parameters: SuiMoveNormalizedType[]
  return: string[] | null
}

type ExposedFunctionsRaw =
  | Record<string, Omit<NormalizedMoveFunction, "name">>
  | NormalizedMoveFunction[]
  | null
  | undefined

type NormalizedMoveModule = {
  fileFormatVersion: string
  address: string
  name: string
  friends: string[]
  structs: any[]
  exposedFunctions: ExposedFunctionsRaw
}

type NormalizedMoveModules = Record<string, NormalizedMoveModule>

type ArgInputMode = "auto" | "value" | "gas-coin" | "object" | "bcs-bytes"

type ArgInput = {
  value: string
  mode: ArgInputMode
}

type ParamClassification = {
  kind: "coin" | "pure" | "vector" | "option" | "object" | "unknownPureBytes"
  innerType?: string
  pureType?: "bool" | "u8" | "u16" | "u32" | "u64" | "u128" | "u256" | "address" | "string" | "id"
}

export function TxLabView() {
  const client = useSuiClient()
  const account = useCurrentAccount()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  const [packageId, setPackageId] = useState("")
  const [modules, setModules] = useState<NormalizedMoveModules | null>(null)
  const [selectedModule, setSelectedModule] = useState<string>("")
  const [selectedFunction, setSelectedFunction] = useState<string>("")
  const [typeArguments, setTypeArguments] = useState<string>("")
  const [argInputs, setArgInputs] = useState<Record<number, ArgInput>>({})
  const [isLoadingABI, setIsLoadingABI] = useState(false)
  const [isLoadingDevInspect, setIsLoadingDevInspect] = useState(false)
  const [isLoadingExecute, setIsLoadingExecute] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [devInspectSkipChecks, setDevInspectSkipChecks] = useState(false)
  const [devInspectGasBudgetMist, setDevInspectGasBudgetMist] = useState<string>("")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // Auto-select first module with entry functions after ABI load
  useEffect(() => {
    if (modules && !selectedModule && Object.keys(modules).length > 0) {
      const withEntry = Object.keys(modules).find((m) =>
        normalizeExposedFunctionsFrom(modules, m).some((fn) => fn.isEntry)
      )
      setSelectedModule(withEntry ?? Object.keys(modules)[0])
    }
  }, [modules, selectedModule])

  // Auto-select first entry function when module is selected (only if not already set)
  useEffect(() => {
    if (selectedModule && !selectedFunction && modules) {
      const entryFunctions = normalizeExposedFunctions(selectedModule).filter((fn) => fn.isEntry === true)
      if (entryFunctions.length > 0) {
        setSelectedFunction(entryFunctions[0].name)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModule, modules])

  // Pure helper that works with any modules object (not just state)
  const normalizeExposedFunctionsFrom = (all: NormalizedMoveModules | null, moduleName: string): NormalizedMoveFunction[] => {
    if (!all) return []
    const mod = all[moduleName]
    if (!mod) return []
    const raw = mod.exposedFunctions as ExposedFunctionsRaw
    if (Array.isArray(raw)) {
      return raw.filter(Boolean) as NormalizedMoveFunction[]
    }
    if (raw && typeof raw === "object") {
      return Object.entries(raw).map(([name, def]) => ({
        name,
        ...(def as Omit<NormalizedMoveFunction, "name">),
      }))
    }
    return []
  }

  // Wrapper that uses current modules state
  const normalizeExposedFunctions = (moduleName: string): NormalizedMoveFunction[] => {
    return normalizeExposedFunctionsFrom(modules, moduleName)
  }

  const loadModules = async () => {
    if (!packageId.trim()) {
      setError("Please enter a package ID")
      return
    }

    setIsLoadingABI(true)
    setError(null)
    setModules(null)
    setResult(null)

    try {
      const normalizedModules = await client.getNormalizedMoveModulesByPackage({
        package: packageId.trim(),
      })
      setModules(normalizedModules as unknown as NormalizedMoveModules)
      // Explicit reset after ABI load
      setSelectedModule("")
      setSelectedFunction("")
      setArgInputs({})
      setTypeArguments("")
      setResult(null)
      setError(null)
    } catch (err: any) {
      setError(`Failed to load modules: ${err.message || String(err)}`)
      setModules(null)
    } finally {
      setIsLoadingABI(false)
    }
  }

  const getEntryFunctions = (moduleName: string): NormalizedMoveFunction[] => {
    return normalizeExposedFunctions(moduleName).filter((fn) => fn.isEntry === true)
  }

  const getFunctionParams = (moduleName: string, fnName: string): string[] => {
    const fn = normalizeExposedFunctions(moduleName).find((f) => f.name === fnName && f.isEntry)
    if (!fn) return []
    // Convert parameters to strings first, then filter out TxContext
    const params = (fn.parameters ?? []).map(moveTypeToString)
    return params.filter(
      (param) => !param.includes("tx_context::TxContext") && !param.includes("TxContext")
    )
  }

  // Normalize type string (strip leading &mut / &)
  const normalizeType = (typeStr: string): string => {
    return typeStr.replace(/^&mut\s+/, "").replace(/^&\s+/, "")
  }

  // Classify parameter type
  const classifyParam = (typeStr: string): ParamClassification => {
    const normalized = normalizeType(typeStr)

    // Coin type
    if (normalized.includes("coin::Coin<") || normalized.includes("Coin<")) {
      return { kind: "coin" }
    }

    // Pure primitives
    if (normalized === "bool" || normalized === "Bool") {
      return { kind: "pure", pureType: "bool" }
    }
    if (normalized === "u8" || normalized === "U8") {
      return { kind: "pure", pureType: "u8" }
    }
    if (normalized === "u16" || normalized === "U16") {
      return { kind: "pure", pureType: "u16" }
    }
    if (normalized === "u32" || normalized === "U32") {
      return { kind: "pure", pureType: "u32" }
    }
    if (normalized === "u64" || normalized === "U64" || normalized.startsWith("u64")) {
      return { kind: "pure", pureType: "u64" }
    }
    if (normalized === "u128" || normalized === "U128" || normalized.startsWith("u128")) {
      return { kind: "pure", pureType: "u128" }
    }
    if (normalized === "u256" || normalized === "U256" || normalized.startsWith("u256")) {
      return { kind: "pure", pureType: "u256" }
    }
    if (normalized === "address" || normalized === "Address") {
      return { kind: "pure", pureType: "address" }
    }

    // Pure string
    if (normalized === "string" || normalized === "String" || normalized.includes("string::String")) {
      return { kind: "pure", pureType: "string" }
    }

    // Pure ID
    if (normalized === "0x2::object::ID" || normalized.endsWith("::object::ID")) {
      return { kind: "pure", pureType: "id" }
    }

    // Vector
    const vectorMatch = normalized.match(/^vector<(.+)>$/i)
    if (vectorMatch) {
      return { kind: "vector", innerType: vectorMatch[1] }
    }

    // Option
    const optionMatch = normalized.match(/(?:0x1::)?option::Option<(.+)>/i)
    if (optionMatch) {
      return { kind: "option", innerType: optionMatch[1] }
    }

    // Object (default for struct types)
    if (normalized.includes("::") && !normalized.startsWith("std::") && !normalized.startsWith("0x1::")) {
      return { kind: "object" }
    }

    // Fallback: treat as pure (will use string fallback)
    return { kind: "pure", pureType: "string" }
  }


  // Parse vector input (supports JSON array, comma list, or hex for vector<u8>)
  const parseVectorInput = (input: string, innerType: string): any[] => {
    const trimmed = input.trim()
    
    // Try JSON array first
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        return JSON.parse(trimmed)
      } catch {
        // Fall through to comma parsing
      }
    }

    // For vector<u8>, try hex parsing
    if (innerType === "u8" && trimmed.startsWith("0x")) {
      try {
        const hex = trimmed.slice(2)
        if (hex.length % 2 === 0) {
          const bytes: number[] = []
          for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substring(i, i + 2), 16))
          }
          return bytes
        }
      } catch {
        // Fall through
      }
    }

    // Comma-separated list
    if (trimmed.includes(",")) {
      return trimmed.split(",").map(s => s.trim()).filter(s => s.length > 0)
    }

    // Single value
    return trimmed ? [trimmed] : []
  }

  // Parse pure value based on type
  const parsePureValue = (value: string, pureType: ParamClassification["pureType"]): any => {
    const trimmed = value.trim()
    
    switch (pureType) {
      case "bool":
        return trimmed === "true" || trimmed === "1"
      case "u8":
        return Number(trimmed)
      case "u16":
        return Number(trimmed)
      case "u32":
        return Number(trimmed)
      case "u64":
        return BigInt(trimmed)
      case "u128":
        return BigInt(trimmed)
      case "u256":
        return BigInt(trimmed)
      case "address":
        return trimmed
      case "string":
        return trimmed
      case "id":
        return trimmed
      default:
        return trimmed
    }
  }

  const buildTransaction = (): Transaction | null => {
    try {
      if (!selectedModule || !selectedFunction || !packageId) return null
      if (!account) return null

      const params = getFunctionParams(selectedModule, selectedFunction)
      const tx = new Transaction()
      const args: any[] = []

      // Parse type arguments
      const typeArgs = typeArguments
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0)

      for (let index = 0; index < params.length; index++) {
        const paramType = params[index]
        const argInput = argInputs[index] || { value: "", mode: "auto" as ArgInputMode }
        const classification = classifyParam(paramType)
        const mode = argInput.mode === "auto" ? (classification.kind === "coin" ? "gas-coin" : classification.kind === "object" ? "object" : "value") : argInput.mode

        try {
          if (mode === "gas-coin") {
            if (classification.kind !== "coin") {
              throw new Error(`Parameter #${index} is not a Coin type, cannot use gas coin`)
            }
            args.push(tx.gas)
          } else if (mode === "object" || (argInput.mode === "auto" && classification.kind === "object")) {
            if (!argInput.value.trim()) {
              throw new Error(`Missing object ID for parameter #${index} (${paramType})`)
            }
            args.push(tx.object(argInput.value.trim()))
          } else if (mode === "bcs-bytes") {
            let bytes: Uint8Array
            const value = argInput.value.trim()
            if (value.startsWith("0x")) {
              const hex = value.slice(2)
              if (hex.length % 2 !== 0) {
                throw new Error(`Invalid hex string for parameter #${index}`)
              }
              const byteArray: number[] = []
              for (let i = 0; i < hex.length; i += 2) {
                byteArray.push(parseInt(hex.substring(i, i + 2), 16))
              }
              bytes = new Uint8Array(byteArray)
            } else if (value.startsWith("base64:")) {
              const base64 = value.slice(7)
              const binaryString = atob(base64)
              bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
            } else {
              throw new Error(`Invalid BCS bytes format for parameter #${index}. Use 0x... or base64:...`)
            }
            args.push(tx.pure(bytes))
          } else {
            // Pure, vector, or option
            if (!argInput.value.trim() && classification.kind !== "option") {
              throw new Error(`Missing value for parameter #${index} (${paramType})`)
            }

            if (classification.kind === "pure") {
              const parsed = parsePureValue(argInput.value, classification.pureType)
              switch (classification.pureType) {
                case "bool":
                  args.push(tx.pure.bool(parsed))
                  break
                case "u8":
                  args.push(tx.pure.u8(parsed))
                  break
                case "u16":
                  args.push(tx.pure.u16(parsed))
                  break
                case "u32":
                  args.push(tx.pure.u32(parsed))
                  break
                case "u64":
                  args.push(tx.pure.u64(parsed))
                  break
                case "u128":
                  args.push(tx.pure.u128(parsed))
                  break
                case "u256":
                  args.push(tx.pure.u256(parsed))
                  break
                case "address":
                  args.push(tx.pure.address(parsed))
                  break
                case "id":
                  args.push(tx.pure.id(parsed))
                  break
                case "string":
                default:
                  args.push(tx.pure.string(parsed))
                  break
              }
            } else if (classification.kind === "vector" && classification.innerType) {
              const innerClass = classifyParam(classification.innerType)
              const array = parseVectorInput(argInput.value, classification.innerType)
              
              try {
                let serialized: any
                
                if (innerClass.kind === "pure" && innerClass.pureType) {
                  const parsedArray = array.map(v => parsePureValue(String(v), innerClass.pureType))
                  
                  // BCS serialize based on inner type
                  switch (innerClass.pureType) {
                    case "u8": {
                      const u8Array = parsedArray.map(v => Number(v))
                      serialized = bcs.vector(bcs.U8).serialize(u8Array)
                      break
                    }
                    case "u16": {
                      const u16Array = parsedArray.map(v => Number(v))
                      serialized = bcs.vector(bcs.U16).serialize(u16Array)
                      break
                    }
                    case "u32": {
                      const u32Array = parsedArray.map(v => Number(v))
                      serialized = bcs.vector(bcs.U32).serialize(u32Array)
                      break
                    }
                    case "u64": {
                      const u64Array = parsedArray.map(v => BigInt(v))
                      serialized = bcs.vector(bcs.U64).serialize(u64Array)
                      break
                    }
                    case "u128": {
                      const u128Array = parsedArray.map(v => BigInt(v))
                      serialized = bcs.vector(bcs.U128).serialize(u128Array)
                      break
                    }
                    case "u256": {
                      const u256Array = parsedArray.map(v => BigInt(v))
                      serialized = bcs.vector(bcs.U256).serialize(u256Array)
                      break
                    }
                    case "address": {
                      const addrArray = parsedArray.map(v => String(v))
                      serialized = bcs.vector(bcs.Address).serialize(addrArray)
                      break
                    }
                    case "bool": {
                      const boolArray = parsedArray.map(v => Boolean(v))
                      serialized = bcs.vector(bcs.Bool).serialize(boolArray)
                      break
                    }
                    case "string":
                    default: {
                      const strArray = parsedArray.map(v => String(v))
                      serialized = bcs.vector(bcs.String).serialize(strArray)
                      break
                    }
                  }
                } else {
                  // For unknown inner types, try to serialize as vector<string>
                  const strArray = array.map(v => String(v))
                  serialized = bcs.vector(bcs.String).serialize(strArray)
                }
                
                // Convert SerializedBcs to Uint8Array
                // SerializedBcs may have toBytes() method or be directly usable
                let bytes: Uint8Array
                if (serialized instanceof Uint8Array) {
                  bytes = serialized
                } else if (typeof (serialized as any)?.toBytes === 'function') {
                  bytes = (serialized as any).toBytes()
                } else if ((serialized as any)?.bytes) {
                  bytes = (serialized as any).bytes
                } else {
                  // Fallback: try to use SerializedBcs directly (tx.pure may accept it)
                  // If that fails, convert via ArrayBuffer
                  try {
                    args.push(tx.pure(serialized as any))
                    continue // Skip the rest of this iteration
                  } catch {
                    throw new Error(`Unable to convert SerializedBcs to bytes for vector parameter #${index}`)
                  }
                }
                
                args.push(tx.pure(bytes))
              } catch (err: any) {
                throw new Error(`Failed to serialize vector: ${err.message || String(err)}`)
              }
            } else if (classification.kind === "option" && classification.innerType) {
              const value = argInput.value.trim()
              if (!value || value === "null") {
                args.push(tx.pure.option("string", null))
              } else {
                const innerClass = classifyParam(classification.innerType)
                if (innerClass.kind === "pure" && innerClass.pureType) {
                  const parsed = parsePureValue(value, innerClass.pureType)
                  switch (innerClass.pureType) {
                    case "u64":
                      args.push(tx.pure.option("u64", parsed))
                      break
                    case "u128":
                      args.push(tx.pure.option("u128", parsed))
                      break
                    case "address":
                      args.push(tx.pure.option("address", parsed))
                      break
                    default:
                      args.push(tx.pure.option("string", String(parsed)))
                      break
                  }
                } else {
                  args.push(tx.pure.option("string", value))
                }
              }
            } else {
              // Fallback: treat as string
              args.push(tx.pure.string(argInput.value.trim()))
            }
          }
        } catch (err: any) {
          throw new Error(`Parameter #${index} (${paramType}): ${err.message}`)
        }
      }

      tx.moveCall({
        target: `${packageId}::${selectedModule}::${selectedFunction}`,
        arguments: args,
        typeArguments: typeArgs.length > 0 ? typeArgs : undefined,
      })

      return tx
    } catch (err: any) {
      console.error("Error building transaction:", err)
      throw err
    }
  }

  const handleDevInspect = async () => {
    if (!account) {
      setError("Please connect your wallet")
      return
    }

    setIsLoadingDevInspect(true)
    setError(null)
    setResult(null)

    try {
      const tx = buildTransaction()
      if (!tx) {
        throw new Error("Failed to build transaction")
      }

      const additionalArgs: any = {}
      if (devInspectSkipChecks) {
        additionalArgs.skip_checks = true
      }
      if (devInspectGasBudgetMist && devInspectGasBudgetMist.trim()) {
        const budget = BigInt(devInspectGasBudgetMist.trim())
        if (budget > 0n) {
          additionalArgs.gas_budget = budget.toString()
        }
      }

      const response = await client.devInspectTransactionBlock({
        sender: account.address,
        transactionBlock: tx,
        ...(Object.keys(additionalArgs).length > 0 ? { additionalArgs } : {}),
      })

      const gasUsed = response.effects?.gasUsed
      const status = response.effects?.status

      setResult({
        type: "devInspect",
        data: response,
        summary: {
          error: status?.status === "failure" ? (status as any).error || "Execution failed" : null,
          status: status?.status || "unknown",
          gasUsed: gasUsed ? {
            computationCost: gasUsed.computationCost,
            storageCost: gasUsed.storageCost,
            storageRebate: gasUsed.storageRebate,
            total: gasUsed.computationCost ? 
              (BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost || "0") - BigInt(gasUsed.storageRebate || "0")).toString() 
              : null,
          } : null,
          eventsCount: response.events?.length || 0,
          events: response.events || [],
          effects: response.effects || null,
        },
      })
    } catch (err: any) {
      setError(`Dev-Inspect failed: ${err.message || String(err)}`)
      setResult({ type: "error", error: err.message || String(err) })
    } finally {
      setIsLoadingDevInspect(false)
    }
  }

  const handleExecute = async () => {
    if (!account) {
      setError("Please connect your wallet")
      return
    }

    setIsLoadingExecute(true)
    setError(null)
    setResult(null)

    try {
      const tx = buildTransaction()
      if (!tx) {
        throw new Error("Failed to build transaction")
      }

      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: async (response) => {
            try {
              // Fetch full transaction details with all options
              const fullTx = await client.getTransactionBlock({
                digest: response.digest,
                options: {
                  showEffects: true,
                  showEvents: true,
                  showObjectChanges: true,
                  showBalanceChanges: true,
                },
              })

              const effects = fullTx.effects
              const gasUsed = effects?.gasUsed
              const status = effects?.status
              setResult({
                type: "execution",
                data: fullTx,
                summary: {
                  digest: response.digest,
                  status: status?.status || (typeof status === "string" ? status : "unknown"),
                  gasUsed: gasUsed ? {
                    computationCost: gasUsed.computationCost,
                    storageCost: gasUsed.storageCost,
                    storageRebate: gasUsed.storageRebate,
                    total: gasUsed.computationCost ? 
                      (BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost || "0") - BigInt(gasUsed.storageRebate || "0")).toString() 
                      : null,
                  } : null,
                  eventsCount: fullTx.events?.length || 0,
                  events: fullTx.events || [],
                  effects: effects || null,
                  objectChanges: fullTx.objectChanges || [],
                  balanceChanges: fullTx.balanceChanges || [],
                },
              })
            } catch (fetchErr: any) {
              // Fallback to response if fetch fails
              const effects = (response as any).effects
              const gasUsed = effects?.gasUsed
              const status = effects?.status
              setResult({
                type: "execution",
                data: response,
                summary: {
                  digest: response.digest,
                  status: status?.status || (typeof status === "string" ? status : "unknown"),
                  gasUsed: gasUsed ? {
                    computationCost: gasUsed.computationCost,
                    storageCost: gasUsed.storageCost,
                    storageRebate: gasUsed.storageRebate,
                    total: gasUsed.computationCost ? 
                      (BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost || "0") - BigInt(gasUsed.storageRebate || "0")).toString() 
                      : null,
                  } : null,
                  eventsCount: (response as any).events?.length || 0,
                  events: (response as any).events || [],
                  effects: effects || null,
                  objectChanges: (response as any).objectChanges || [],
                  balanceChanges: (response as any).balanceChanges || [],
                },
              })
            }
            setIsLoadingExecute(false)
          },
          onError: (err: any) => {
            setError(`Execution failed: ${err.message || String(err)}`)
            setResult({ type: "error", error: err.message || String(err) })
            setIsLoadingExecute(false)
          },
        }
      )
    } catch (err: any) {
      setError(`Execution failed: ${err.message || String(err)}`)
      setResult({ type: "error", error: err.message || String(err) })
      setIsLoadingExecute(false)
    }
  }

  const applyMvpPreset = async () => {
    if (!account) {
      setError("Please connect your wallet first")
      return
    }

    setPackageId("0x2")
    setTypeArguments("0x2::sui::SUI")
    
    // Load modules for 0x2 package
    setIsLoadingABI(true)
    setError(null)
    try {
      const normalizedModules = await client.getNormalizedMoveModulesByPackage({
        package: "0x2",
      })
      const loadedModules = normalizedModules as unknown as NormalizedMoveModules
      setModules(loadedModules)
      
      // Get params from the loaded module using the pure helper
      const functions = normalizeExposedFunctionsFrom(loadedModules, "pay")
      const fn = functions.find((f) => f.name === "split_and_transfer" && f.isEntry)
      if (fn) {
        // Convert parameters to strings first, then filter out TxContext
        const params = (fn.parameters ?? []).map(moveTypeToString).filter(
          (param) => !param.includes("tx_context::TxContext") && !param.includes("TxContext")
        )
        const newArgInputs: Record<number, ArgInput> = {}
        
        params.forEach((paramType, index) => {
          const classification = classifyParam(paramType)
          if (classification.kind === "coin") {
            // First Coin parameter - use gas coin
            newArgInputs[index] = { value: "", mode: "gas-coin" }
          } else if (paramType.includes("u64")) {
            // Amount parameter
            newArgInputs[index] = { value: "1000000", mode: "auto" }
          } else if (paramType === "address" || paramType === "Address") {
            // Recipient parameter
            newArgInputs[index] = { value: account.address, mode: "auto" }
          } else {
            newArgInputs[index] = { value: "", mode: "auto" }
          }
        })
        
        setArgInputs(newArgInputs)
      }
      
      setSelectedModule("pay")
      setSelectedFunction("split_and_transfer")
    } catch (err: any) {
      setError(`Failed to load preset: ${err.message || String(err)}`)
    } finally {
      setIsLoadingABI(false)
    }
  }

  const entryFunctions = selectedModule ? getEntryFunctions(selectedModule) : []
  const functionParams = selectedModule && selectedFunction ? getFunctionParams(selectedModule, selectedFunction) : []
  const target = packageId && selectedModule && selectedFunction
    ? `${packageId}::${selectedModule}::${selectedFunction}`
    : ""

  const canExecute = account && selectedModule && selectedFunction && functionParams.every((paramType, i) => {
    const argInput = argInputs[i] || { value: "", mode: "auto" as ArgInputMode }
    const classification = classifyParam(paramType)
    const effectiveMode = argInput.mode === "auto" 
      ? (classification.kind === "coin" ? "gas-coin" : classification.kind === "object" ? "object" : "value")
      : argInput.mode
    
    if (effectiveMode === "gas-coin") return true
    if (effectiveMode === "object") return argInput.value.trim().length > 0
    if (classification.kind === "option") return true // Option can be null/empty
    return argInput.value.trim().length > 0
  })

  return (
    <div className="space-y-6">
      {/* How to Use Panel */}
      <Card className="bg-slate-900/50 border-slate-800 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-400" />
            How to Use MoveCall Sandbox
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-300">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-white mb-2">Step-by-Step:</h4>
              <ol className="list-decimal list-inside space-y-1.5 ml-2 text-slate-300">
                <li><strong className="text-white">Connect wallet</strong> (top right) - Required for Dev-Inspect and Execute</li>
                <li><strong className="text-white">Enter Package ID</strong> (or click quick preset button) - The on-chain package address (e.g., <code className="bg-slate-800 px-1 rounded">0x2</code>)</li>
                <li><strong className="text-white">Click "Load Modules"</strong> - Fetches the package ABI from chain</li>
                <li><strong className="text-white">Choose Module + Entry Function</strong> - Select from dropdowns</li>
                <li><strong className="text-white">Fill Type Args</strong> (optional) - Comma-separated fully-qualified types like <code className="bg-slate-800 px-1 rounded">0x2::sui::SUI</code></li>
                <li><strong className="text-white">Fill Arguments:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><strong className="text-emerald-400">"Use Gas Coin"</strong> - Passes the transaction's gas object as the <code className="bg-slate-800 px-1 rounded">Coin&lt;T&gt;</code> argument</li>
                    <li><strong className="text-blue-400">"Object ID"</strong> - Pass an on-chain object ID (for object parameters)</li>
                    <li><strong className="text-slate-400">"Value"</strong> - Enter a pure value like <code className="bg-slate-800 px-1 rounded">u64</code>, <code className="bg-slate-800 px-1 rounded">address</code>, <code className="bg-slate-800 px-1 rounded">string</code></li>
                  </ul>
                </li>
                <li><strong className="text-white">Press:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><strong className="text-emerald-400">Dev-Inspect</strong> - Simulation, no wallet popup, no state changes</li>
                    <li><strong className="text-blue-400">Execute</strong> - Real transaction, wallet popup, on-chain execution</li>
                  </ul>
                </li>
              </ol>
            </div>
            
            <div className="pt-2 border-t border-slate-700">
              <h4 className="font-semibold text-white mb-2">MVP Preset:</h4>
              <p className="text-slate-300">
                The <strong className="text-emerald-400">"Send 0.001 SUI to myself (simulate)"</strong> button loads <code className="bg-slate-800 px-1 rounded">0x2::pay::split_and_transfer</code> and sends 0.001 SUI (1,000,000 MIST) to your own address via simulation. Perfect for testing!
              </p>
            </div>

            <div className="pt-2 border-t border-slate-700">
              <h4 className="font-semibold text-white mb-2">Common Pitfalls:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2 text-slate-300">
                <li><strong className="text-amber-400">Wrong network</strong> - App runs on Testnet; <code className="bg-slate-800 px-1 rounded">0x2</code> exists on all networks but your custom packages might not</li>
                <li><strong className="text-amber-400">Missing args / wrong object IDs</strong> - Ensure all required arguments are filled correctly</li>
                <li><strong className="text-amber-400">Type args formatting</strong> - Must be comma-separated fully-qualified types (e.g., <code className="bg-slate-800 px-1 rounded">0x2::sui::SUI, 0x2::coin::Coin</code>)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 1: On-chain ABI Loader */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">On-chain ABI Loader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Package ID</label>
            <Input
              placeholder="0x..."
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={loadModules}
              disabled={isLoadingABI || !packageId.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoadingABI ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : (
                "Load Modules"
              )}
            </Button>
            <Button
              onClick={applyMvpPreset}
              disabled={isLoadingABI || !account}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Autofill: 0x2::pay::split_and_transfer with 0.001 SUI to self"
            >
              Send 0.001 SUI to myself (simulate)
            </Button>
            {QUICK_FILL_PACKAGES.map((pkg) => (
              <Button
                key={pkg.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  setPackageId(pkg.id)
                  setModules(null)
                  setSelectedModule("")
                  setSelectedFunction("")
                  setArgInputs({})
                  setTypeArguments("")
                  setResult(null)
                  setError(null)
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                {pkg.name}
              </Button>
            ))}
          </div>
          {modules && (
            <div className="mt-2">
              <Badge variant="success" className="text-xs">
                Loaded {Object.keys(modules).length} module(s)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2: MoveCall Builder */}
      {modules && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">MoveCall Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Module Selection */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => {
                  const newModule = e.target.value
                  setSelectedModule(newModule)
                  // Explicit reset when user manually changes module
                  setSelectedFunction("")
                  setArgInputs({})
                  setTypeArguments("")
                  setResult(null)
                  setError(null)
                }}
                className="w-full h-9 rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select module...</option>
                {Object.keys(modules).map((modName) => (
                  <option key={modName} value={modName}>
                    {modName}
                  </option>
                ))}
              </select>
            </div>

            {/* Function Selection */}
            {selectedModule && (
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Entry Function</label>
                <select
                  value={selectedFunction}
                  onChange={(e) => {
                    const newFunction = e.target.value
                    setSelectedFunction(newFunction)
                    // Explicit reset when user manually changes function
                    setArgInputs({})
                    setResult(null)
                    setError(null)
                  }}
                  disabled={entryFunctions.length === 0}
                  className="w-full h-9 rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {entryFunctions.length === 0 ? (
                    <option value="">No entry functions in this module — pick another module</option>
                  ) : (
                    <>
                      <option value="">Select function...</option>
                      {entryFunctions.map((fn) => (
                        <option key={fn.name} value={fn.name}>
                          {fn.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {entryFunctions.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1">
                    This module has no entry functions. Please choose a different module.
                  </p>
                )}
              </div>
            )}

            {/* Type Arguments */}
            {selectedFunction && (
              <div>
                <label className="text-xs text-slate-400 mb-2 block">
                  Type Arguments (comma-separated, e.g., "0x2::sui::SUI")
                </label>
                <Input
                  placeholder="0x2::sui::SUI, 0x2::coin::Coin"
                  value={typeArguments}
                  onChange={(e) => setTypeArguments(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white font-mono text-sm"
                />
              </div>
            )}

            {/* Function Signature Preview */}
            {selectedFunction && target && (
              <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-md">
                <div className="text-xs text-slate-400 mb-1">Target:</div>
                <div className="text-sm text-blue-400 font-mono break-all">{target}</div>
                {functionParams.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-slate-400 mb-1">Parameters:</div>
                    <div className="space-y-1">
                      {functionParams.map((param, idx) => (
                        <div key={idx} className="text-xs text-slate-300 font-mono">
                          #{idx} — {param}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Argument Inputs */}
            {functionParams.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400">Arguments:</div>
                {functionParams.map((paramType, idx) => {
                  const classification = classifyParam(paramType)
                  const argInput = argInputs[idx] || { value: "", mode: "auto" as ArgInputMode }
                  const effectiveMode = argInput.mode === "auto" 
                    ? (classification.kind === "coin" ? "gas-coin" : classification.kind === "object" ? "object" : "value")
                    : argInput.mode

                  const updateArgInput = (updates: Partial<ArgInput>) => {
                    setArgInputs({
                      ...argInputs,
                      [idx]: { ...argInput, ...updates },
                    })
                  }

                  // Classification chip label
                  const chipLabel = classification.kind === "coin" ? "COIN" 
                    : classification.kind === "pure" ? "PURE"
                    : classification.kind === "vector" ? "VECTOR"
                    : classification.kind === "option" ? "OPTION"
                    : classification.kind === "object" ? "OBJECT"
                    : "UNKNOWN"

                  const chipColor = classification.kind === "coin" ? "bg-emerald-500/20 text-emerald-400"
                    : classification.kind === "pure" ? "bg-blue-500/20 text-blue-400"
                    : classification.kind === "vector" ? "bg-purple-500/20 text-purple-400"
                    : classification.kind === "option" ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-slate-500/20 text-slate-400"

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 mb-1 block">
                          #{idx} — <span className="font-mono text-slate-300">{paramType}</span>
                        </label>
                        <Badge className={`text-[10px] px-1.5 py-0 ${chipColor}`}>
                          {chipLabel}
                        </Badge>
                      </div>
                      
                      {classification.kind === "coin" && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={effectiveMode === "gas-coin" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateArgInput({ mode: "gas-coin", value: "" })}
                            className={effectiveMode === "gas-coin" ? "bg-blue-600" : "border-slate-700"}
                          >
                            Use Gas Coin
                          </Button>
                          <span className="text-xs text-slate-500">or</span>
                          <Button
                            type="button"
                            variant={effectiveMode === "object" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateArgInput({ mode: "object", value: "" })}
                            className={effectiveMode === "object" ? "bg-blue-600" : "border-slate-700"}
                          >
                            Object ID
                          </Button>
                        </div>
                      )}

                      {classification.kind === "coin" && effectiveMode === "gas-coin" && (
                        <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800 px-2 py-1 rounded">
                          ⚠️ Use Gas Coin only works for SUI Coin
                        </div>
                      )}

                      {effectiveMode !== "gas-coin" && (
                        <Input
                          placeholder={
                            effectiveMode === "object" ? "Object ID (0x...)" 
                            : classification.kind === "vector" ? "JSON array [1,2,3] or comma list 1,2,3"
                            : classification.kind === "option" ? "Value or 'null'"
                            : classification.kind === "pure" && classification.pureType === "address" ? "Address (0x...)"
                            : classification.kind === "pure" && classification.pureType === "id" ? "Object ID (0x...)"
                            : "Value"
                          }
                          value={argInput.value}
                          onChange={(e) => updateArgInput({ value: e.target.value })}
                          className="bg-slate-950 border-slate-700 text-white font-mono text-sm"
                        />
                      )}

                      {effectiveMode === "gas-coin" && classification.kind === "coin" && (
                        <div className="text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800 px-2 py-1 rounded">
                          ✓ Will use transaction gas coin
                        </div>
                      )}

                      {effectiveMode === "object" && classification.kind === "object" && (
                        <div className="text-xs text-blue-400 bg-blue-900/20 border border-blue-800 px-2 py-1 rounded">
                          ℹ️ This is an object argument - enter the object ID
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Advanced Dev-Inspect Options */}
            {selectedFunction && (
              <div className="border-t border-slate-800 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  {showAdvancedOptions ? "▼" : "▶"} Advanced Dev-Inspect Options
                </Button>
                {showAdvancedOptions && (
                  <div className="mt-2 space-y-3 p-3 bg-slate-950/50 border border-slate-800 rounded-md">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={devInspectSkipChecks}
                          onChange={(e) => setDevInspectSkipChecks(e.target.checked)}
                          className="rounded"
                        />
                        Skip checks
                      </label>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Gas Budget (MIST)</label>
                      <Input
                        type="text"
                        placeholder="Optional (e.g., 10000000)"
                        value={devInspectGasBudgetMist}
                        onChange={(e) => setDevInspectGasBudgetMist(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white font-mono text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleDevInspect}
                disabled={!canExecute || isLoadingDevInspect || isLoadingExecute}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
              >
                {isLoadingDevInspect ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Dev-Inspect...
                  </>
                ) : (
                  "Dev-Inspect"
                )}
              </Button>
              <Button
                onClick={handleExecute}
                disabled={!canExecute || isLoadingDevInspect || isLoadingExecute}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                {isLoadingExecute ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Executing...
                  </>
                ) : (
                  "Execute"
                )}
              </Button>
            </div>
            {!account && (
              <div className="text-amber-500 text-sm border border-amber-900/50 bg-amber-900/20 px-4 py-2 rounded">
                Connect wallet to use Dev-Inspect or Execute
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card 3: Result */}
      {(result || error) && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-md">
                <div className="text-sm text-red-400 font-semibold mb-1">Error:</div>
                <div className="text-sm text-red-300">{error}</div>
              </div>
            )}
            {result && result.summary && (
              <div className="mb-4 p-3 bg-slate-950/50 border border-slate-800 rounded-md space-y-2">
                <div className="text-xs text-slate-400 mb-2 font-semibold">Summary:</div>
                {result.type === "devInspect" && (
                  <div className="space-y-1 text-sm">
                    {result.summary.error ? (
                      <div className="text-red-400">❌ Error: {JSON.stringify(result.summary.error)}</div>
                    ) : (
                      <div className="text-green-400">✓ No errors</div>
                    )}
                    <div className="text-slate-300">Status: <span className="font-mono">{result.summary.status}</span></div>
                    {result.summary.gasUsed && (
                      <div className="text-slate-300">
                        Gas Used: {result.summary.gasUsed.total ? `${result.summary.gasUsed.total} MIST` : "N/A"}
                        {result.summary.gasUsed.computationCost && (
                          <span className="text-xs text-slate-500 ml-2">
                            (computation: {result.summary.gasUsed.computationCost}, storage: {result.summary.gasUsed.storageCost || "0"}, rebate: {result.summary.gasUsed.storageRebate || "0"})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-slate-300">Events: {result.summary.eventsCount}</div>
                  </div>
                )}
                {result.type === "execution" && (
                  <div className="space-y-1 text-sm">
                    <div className="text-green-400">✓ Transaction executed</div>
                    <div className="text-slate-300 font-mono text-xs break-all">Digest: {result.summary.digest}</div>
                    <div className="text-slate-300">Status: <span className="font-mono">{result.summary.status}</span></div>
                    {result.summary.gasUsed && (
                      <div className="text-slate-300">
                        Gas Used: {result.summary.gasUsed.total ? `${result.summary.gasUsed.total} MIST` : "N/A"}
                        {result.summary.gasUsed.computationCost && (
                          <span className="text-xs text-slate-500 ml-2">
                            (computation: {result.summary.gasUsed.computationCost}, storage: {result.summary.gasUsed.storageCost || "0"}, rebate: {result.summary.gasUsed.storageRebate || "0"})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-slate-300">Events: {result.summary.eventsCount}</div>
                    {result.summary.objectChanges && result.summary.objectChanges.length > 0 && (
                      <div className="text-slate-300">Object Changes: {result.summary.objectChanges.length}</div>
                    )}
                    {result.summary.balanceChanges && result.summary.balanceChanges.length > 0 && (
                      <div className="text-slate-300">Balance Changes: {result.summary.balanceChanges.length}</div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="bg-slate-950 border border-slate-800 rounded-md p-4 overflow-auto max-h-[500px]">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                {JSON.stringify(result || { error }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
