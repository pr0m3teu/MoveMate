import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, ShieldCheck, Wallet } from "lucide-react";
import { BountyList } from "./BountyList";

// --- AICI AM ACTUALIZAT ID-ul ---
const PACKAGE_ID = "0x79ced3a91d839298bd1c052cfbbf454cc103c5d80d8b3607dd7480fe721fb208"; 
const MODULE_NAME = "bounty_board";
// --------------------------------

export function BountyView() {
  const account = useCurrentAccount();
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
          arguments: [coin, txb.pure.string(bountyDesc)],
        });

        signAndExecuteTransaction({ transaction: txb }, {
            onSuccess: (result) => {
              console.log("Bounty Created!", result);
              setIsLoading(false);
              alert(`Succes! Bounty creat.`);
              setBountyDesc(""); 
            },
            onError: (err) => {
              console.error("Transaction failed:", err);
              setIsLoading(false);
              alert("Eroare la tranzacție.");
            }
        });
    } catch (e) {
        console.error(e);
        setIsLoading(false);
        alert("Eroare internă.");
    }
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* --- HERO SECTION (Formularul de Creare) --- */}
      <div className="relative group rounded-2xl mx-auto max-w-4xl">
        {/* Glow Effect din spate */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-[#020617] border border-slate-800 p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Create Security Bounty</h2>
                    <p className="text-slate-400 text-sm">Depune SUI în escrow pentru a recompensa auditorii.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-mono text-blue-300 uppercase tracking-wider ml-1">Descriere Problemă</label>
                    <div className="relative">
                        <Input 
                            placeholder="Ex: Funcția 'mint' permite overflow..." 
                            value={bountyDesc}
                            onChange={(e) => setBountyDesc(e.target.value)}
                            className="bg-slate-900/50 border-slate-700 text-white h-12 pl-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-mono text-emerald-400 uppercase tracking-wider ml-1">Recompensă (SUI)</label>
                    <div className="relative">
                        <Input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-slate-900/50 border-slate-700 text-emerald-400 font-mono font-bold text-lg h-12 pl-4 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                        <div className="absolute right-3 top-3 text-xs text-slate-500 font-bold">SUI</div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                {!account ? (
                  <Button variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 gap-2">
                    <Wallet className="w-4 h-4" /> Conectează Wallet
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-900/20 transition-all"
                    onClick={createBounty}
                    disabled={isLoading || !bountyDesc}
                  >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2 fill-white" />}
                    Blocează Fonduri & Publică
                  </Button>
                )}
            </div>
        </div>
      </div>

      {/* --- LISTA --- */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-white">Active Bounties</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
        </div>
        
        {/* Trimitem noul ID către lista care afișează datele */}
        <BountyList packageId={PACKAGE_ID} moduleName={MODULE_NAME} />
      </div>

    </div>
  )
}