import { useState } from "react";
import { useSuiClientQuery, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Box, CheckCircle, Code, ExternalLink, User, Trophy } from "lucide-react";

function BountyItem({ event, packageId, moduleName }: any) {
  const json = event.parsedJson;
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [solutionLink, setSolutionLink] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Live Data
  const { data: objectData, isLoading } = useSuiClientQuery('getObject', {
    id: json.bounty_id,
    options: { showContent: true }
  });

  if (isLoading) return <div className="p-4"><Loader2 className="animate-spin text-slate-500"/></div>;
  if (!objectData?.data) return null; // Dacă nu s-a încărcat, nu afișăm nimic încă

  // Accesăm câmpurile în siguranță
  const content = objectData.data.content as any;
  const fields = content?.fields;

  if (!fields) return null; // Protecție extra

  const submissions = fields.submissions || [];
  const isCompleted = fields.is_completed;
  const isCreator = account?.address === fields.creator;

  const handleSubmit = () => {
    if (!solutionLink) return alert("Adaugă un link!");
    setIsProcessing(true);
    const txb = new Transaction();
    txb.moveCall({
      target: `${packageId}::${moduleName}::submit_solution`,
      arguments: [txb.object(json.bounty_id), txb.pure.string(solutionLink)]
    });
    signAndExecuteTransaction({ transaction: txb }, {
      onSuccess: () => { alert("Soluție adăugată!"); setSolutionLink(""); setIsProcessing(false); },
      onError: (e) => { console.error(e); setIsProcessing(false); }
    });
  };

  const handleApprove = (index: number) => {
    if(!confirm("Ești sigur că vrei să premiezi această soluție?")) return;
    setIsProcessing(true);
    const txb = new Transaction();
    txb.moveCall({
      target: `${packageId}::${moduleName}::approve_and_pay`,
      arguments: [
        txb.object(json.bounty_id),
        txb.pure.u64(index)
      ]
    });
    signAndExecuteTransaction({ transaction: txb }, {
      onSuccess: () => { alert("Plătit!"); setIsProcessing(false); },
      onError: (e) => { console.error(e); setIsProcessing(false); }
    });
  };

  return (
    <Card className={`border-slate-700 flex flex-col justify-between transition-all ${isCompleted ? 'bg-slate-900/20 opacity-70' : 'bg-slate-900/40'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant={isCompleted ? "secondary" : "default"} className={isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}>
            {isCompleted ? "COMPLETED" : "OPEN"}
          </Badge>
          <div className="flex items-center text-emerald-400 font-mono text-sm font-bold">
            {/* Folosim ?. și || 0 pentru a preveni crash-ul la matematică */}
            {((parseInt(json.reward_amount || "0") / 1_000_000_000).toFixed(1))} SUI
          </div>
        </div>
        <CardTitle className="text-white text-base mt-2">{json.description}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-xs flex items-center text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 w-fit">
           <Box className="w-3 h-3 mr-1"/> 
           Creator: {isCreator ? <span className="text-yellow-400 font-bold ml-1">(TU)</span> : (json.creator?.slice(0, 6) + "...")}
        </div>

        {/* --- LISTA DE SOLUȚII (FIXED) --- */}
        <div className="space-y-2 mt-4">
            <h4 className="text-xs text-slate-500 font-bold uppercase">Soluții ({submissions.length})</h4>
            
            {submissions.length === 0 && <p className="text-xs text-slate-600 italic">Încă nicio soluție.</p>}

            {submissions.map((subItem: any, idx: number) => {
                // FIX CRITIC: Uneori datele vin în `subItem.fields`, alteori direct în `subItem`
                // Această linie le normalizează
                const sub = subItem.fields || subItem;

                const isWinner = fields.winner && fields.winner === sub.solver;
                
                return (
                    <div key={idx} className={`p-3 rounded border text-sm flex flex-col gap-2 ${isWinner ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-slate-800 bg-slate-950'}`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-slate-300">
                                <User className="w-3 h-3"/> 
                                {/* AICI CRĂPA: Am adăugat optional chaining (?.) */}
                                <span className="font-mono text-xs">{sub.solver?.slice(0,6)}...</span>
                                {isWinner && <Badge className="h-4 text-[10px] bg-emerald-500 text-black px-1"><Trophy className="w-3 h-3 mr-1"/> WINNER</Badge>}
                            </div>
                            <a href={sub.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center text-xs">
                                <ExternalLink className="w-3 h-3 mr-1"/> Vezi Cod
                            </a>
                        </div>

                        {isCreator && !isCompleted && (
                            <Button 
                                size="sm" 
                                className="w-full bg-emerald-600/80 hover:bg-emerald-600 h-7 text-xs mt-1"
                                onClick={() => handleApprove(idx)}
                                disabled={isProcessing}
                            >
                                <CheckCircle className="w-3 h-3 mr-1"/> Premiază această soluție
                            </Button>
                        )}
                    </div>
                )
            })}
        </div>

      </CardContent>

      <CardFooter className="pt-2 border-t border-slate-800/50">
        {!isCreator && !isCompleted && (
           <div className="w-full flex gap-2">
             <Input 
               placeholder="Link soluție..." 
               className="bg-slate-950 border-slate-700 h-9 text-xs text-white placeholder:text-slate-500"
               value={solutionLink}
               onChange={(e) => setSolutionLink(e.target.value)}
             />
             <Button 
               size="sm" 
               className="bg-blue-600 hover:bg-blue-700"
               onClick={handleSubmit}
               disabled={isProcessing}
             >
               {isProcessing ? <Loader2 className="animate-spin"/> : <Code className="w-4 h-4"/>}
             </Button>
           </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function BountyList({ packageId, moduleName }: { packageId: string, moduleName: string }) {
  const { data: events, isPending, error } = useSuiClientQuery('queryEvents', {
    query: { MoveModule: { package: packageId, module: moduleName } },
    order: "descending"
  });

  if (isPending) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-red-400">Eroare: {error.message}</div>;
  if (!events || events.data.length === 0) return <div className="text-slate-500 text-center">Niciun bounty activ.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {events.data.map((event: any) => (
        <BountyItem key={event.id.txDigest} event={event} packageId={packageId} moduleName={moduleName} />
      ))}
    </div>
  );
}