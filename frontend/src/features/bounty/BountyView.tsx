import { useState } from "react"
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit" // <-- NUME NOU
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { BountyList } from "./BountyList";

// --- CONSTANTELE TALE ---
const PACKAGE_ID = "0x79ced3a91d839298bd1c052cfbbf454cc103c5d80d8b3607dd7480fe721fb208"; 
const MODULE_NAME = "bounty_board";
// ------------------------

// BigInt-safe SUI to MIST conversion (supports up to 9 decimals)
const suiToMist = (amount: string): bigint => {
  const trimmed = amount.trim()
  if (!trimmed || trimmed === "") {
    throw new Error("Amount cannot be empty")
  }

  // Check for negative
  if (trimmed.startsWith("-")) {
    throw new Error("Amount cannot be negative")
  }

  // Check for valid format (digits, optional decimal point, optional decimals)
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid amount format: "${trimmed}"`)
  }

  const parts = trimmed.split(".")
  const integerPart = parts[0] || "0"
  const decimalPart = parts[1] || ""

  // Reject if more than 9 decimal places
  if (decimalPart.length > 9) {
    throw new Error(`Amount has too many decimal places (max 9): "${trimmed}"`)
  }

  // Pad decimal part to 9 digits and combine
  const paddedDecimal = decimalPart.padEnd(9, "0")
  const mistString = integerPart + paddedDecimal

  try {
    return BigInt(mistString)
  } catch {
    throw new Error(`Invalid amount: "${trimmed}"`)
  }
}

export function BountyView() {
  const account = useCurrentAccount();
  // 1. Hook-ul are acum un nume mai scurt
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [bountyDesc, setBountyDesc] = useState("");
  const [amount, setAmount] = useState("0.1"); 
  const [isLoading, setIsLoading] = useState(false);

  const createBounty = () => {
    if (!account) return alert("Conectează wallet-ul!");

    setIsLoading(true);
    
    try {
        let mist: bigint
        try {
          mist = suiToMist(amount)
        } catch (err: any) {
          alert(`Eroare la suma: ${err.message}`)
          setIsLoading(false)
          return
        }

        const txb = new Transaction();
        const [coin] = txb.splitCoins(txb.gas, [mist]);

        txb.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::create_bounty`,
          arguments: [
            coin,                   
            txb.pure.string(bountyDesc),
          ],
        });

        // 3. Execute - AICI ESTE SCHIMBAREA CHEIE
        // Parametrul se numește acum 'transaction', nu 'transactionBlock'
        signAndExecuteTransaction(
          { transaction: txb }, 
          {
            onSuccess: (result) => {
              console.log("Bounty Created!", result);
              setIsLoading(false);
              alert(`Succes! Bounty creat. Digest: ${result.digest}`);
              setBountyDesc(""); 
            },
            onError: (err) => {
              console.error("Transaction failed:", err);
              setIsLoading(false);
              alert("Eroare la tranzacție (vezi consola).");
            }
          }
        );
    } catch (e) {
        console.error(e);
        setIsLoading(false);
        alert("Eroare internă.");
    }
  };

  return (
    <div className="space-y-8">
      {/* --- PARTEA DE SUS (FORMULARUL EXISTENT) --- */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Postează o problemă (Escrow)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-slate-400">Descriere Problemă</label>
            <Input 
              placeholder="Ex: Funcția mint dă eroare..." 
              value={bountyDesc}
              onChange={(e) => setBountyDesc(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white mt-2"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Recompensă (SUI)</label>
            <Input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        {!account ? (
          <div className="text-amber-500 text-sm border border-amber-900/50 bg-amber-900/20 px-4 py-2 rounded">
            Conectează Wallet-ul din colțul dreapta-sus pentru a continua
          </div>
        ) : (
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
            onClick={createBounty}
            disabled={isLoading || !bountyDesc}
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Blocează Fonduri & Creează"}
          </Button>
        )}
      </div>

      {/* --- SECȚIUNEA NOUĂ: LISTA DE BOUNTY-URI --- */}
      <div className="pt-8 border-t border-slate-800">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="bg-blue-500 w-2 h-2 rounded-full mr-3 animate-pulse"></span>
          Bounties Active pe Blockchain
        </h3>
        {/* Aici montăm "Antena" care ascultă evenimentele */}
        <BountyList packageId={PACKAGE_ID} moduleName={MODULE_NAME} />
      </div>
      {/* ------------------------------------------- */}

    </div>
  )
}