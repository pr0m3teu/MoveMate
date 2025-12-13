import { useState } from "react";
import { useSuiClientQuery, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Box, CheckCircle, Code } from "lucide-react";

// --- Sub-componenta Inteligentă (Se ocupă de un singur Bounty) ---
function BountyItem({ event, packageId, moduleName }: any) {
  const json = event.parsedJson;
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [solutionLink, setSolutionLink] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Verificăm cine este userul curent
  const isCreator = account?.address === json.creator;

  // ACȚIUNEA 1: Expertul trimite soluția
  const handleSubmit = () => {
    if (!solutionLink) return alert("Adaugă un link!");
    setIsProcessing(true);

    const txb = new Transaction();
    txb.moveCall({
      target: `${packageId}::${moduleName}::submit_solution`,
      arguments: [
        txb.object(json.bounty_id), // ID-ul obiectului Bounty
        txb.pure.string(solutionLink)
      ]
    });

    signAndExecuteTransaction({ transaction: txb }, {
      onSuccess: () => { alert("Soluție trimisă!"); setIsProcessing(false); },
      onError: (e) => { console.error(e); alert("Eroare!"); setIsProcessing(false); }
    });
  };

  // ACȚIUNEA 2: Creatorul aprobă plata
  const handleApprove = () => {
    // Într-o versiune reală, aici ai verifica dacă există o soluție depusă
    // Dar contractul oricum dă eroare dacă nu există, deci e safe.
    setIsProcessing(true);

    const txb = new Transaction();
    txb.moveCall({
      target: `${packageId}::${moduleName}::approve_and_pay`,
      arguments: [
        txb.object(json.bounty_id)
      ]
    });

    signAndExecuteTransaction({ transaction: txb }, {
      onSuccess: () => { alert("Plată efectuată! Bounty închis."); setIsProcessing(false); },
      onError: (e) => { console.error(e); alert("Eroare! (Poate nu există soluție încă?)"); setIsProcessing(false); }
    });
  };

  return (
    <Card className="bg-slate-900/40 border-slate-700 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10">
            OPEN
          </Badge>
          <div className="flex items-center text-emerald-400 font-mono text-sm font-bold">
            {(parseInt(json.reward_amount) / 1_000_000_000).toFixed(1)} SUI
          </div>
        </div>
        <CardTitle className="text-white text-base mt-2">{json.description}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="text-xs text-slate-500 font-mono mb-4">ID: {json.bounty_id.slice(0,10)}...</div>
        <div className="text-xs flex items-center text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 w-fit">
           <Box className="w-3 h-3 mr-1"/> 
           Creator: {isCreator ? <span className="text-yellow-400 font-bold ml-1">(TU)</span> : json.creator.slice(0, 6) + "..."}
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-slate-800/50 flex flex-col gap-2">
        {/* LOGICA CONDIȚIONALĂ */}
        {isCreator ? (
           // Ești Creatorul -> Vezi butonul de Aprobare
           <Button 
             className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
             onClick={handleApprove}
             disabled={isProcessing}
           >
             {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
             Aprobă & Plătește
           </Button>
        ) : (
           // Ești Expertul -> Vezi input pentru Soluție
           <div className="w-full flex gap-2">
             <Input 
               placeholder="Link GitHub / Gist..." 
               // AICI AM ADĂUGAT 'text-white' și 'placeholder:text-slate-500'
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

// --- Componenta Principală (Lista) ---
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
        <BountyItem 
          key={event.id.txDigest} 
          event={event} 
          packageId={packageId} 
          moduleName={moduleName} 
        />
      ))}
    </div>
  );
}