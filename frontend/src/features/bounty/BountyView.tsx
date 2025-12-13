import { useState } from "react"
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit" // <-- NUME NOU
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { BountyList } from "./BountyList";

// --- CONSTANTELE TALE ---
const PACKAGE_ID = "0xf6c77018c394a3dec36f41f92075b12a50e68cc9d32a24ede2f83f6a471bfcb1"; 
const MODULE_NAME = "bounty_board";
// ------------------------

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
        const txb = new Transaction();
        
        const amountInMist = parseFloat(amount) * 1_000_000_000;

        const [coin] = txb.splitCoins(txb.gas, [amountInMist]);

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