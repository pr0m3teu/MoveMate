import { useState } from "react";
import { useSuiClientQuery, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// 1. IMPORT NOU: Link2
import { Loader2, User, Trophy, GitPullRequest, CheckCircle2, ArrowRight, Clock, Code, ExternalLink, Link2 } from "lucide-react";

function BountyItem({ event, packageId, moduleName }: any) {
  const json = event.parsedJson;
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [solutionLink, setSolutionLink] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: objectData, isLoading } = useSuiClientQuery('getObject', {
    id: json.bounty_id,
    options: { showContent: true }
  });

  if (isLoading) return (
    <div className="h-64 rounded-xl border border-slate-800 bg-[#0B1121] animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent skew-x-12 animate-shimmer"></div>
    </div>
  );
  
  if (!objectData?.data) return null;

  const content = objectData.data.content as any;
  const fields = content?.fields;
  if (!fields) return null;

  const submissions = fields.submissions || [];
  const isCompleted = fields.is_completed;
  const isCreator = account?.address === fields.creator;
  const rewardAmount = (parseInt(json.reward_amount || "0") / 1_000_000_000).toFixed(1);
  
  // 2. EXTRAGEREA LINK-ULUI (ATAȘAMENT)
  // Dacă e Option::none în Move, aici va fi null. Dacă e Option::some, va fi string-ul.
  const attachmentUrl = fields.attachment; 

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
      arguments: [txb.object(json.bounty_id), txb.pure.u64(index)]
    });
    signAndExecuteTransaction({ transaction: txb }, {
      onSuccess: () => { alert("Plătit!"); setIsProcessing(false); },
      onError: (e) => { console.error(e); setIsProcessing(false); }
    });
  };

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 border shadow-xl ${
        isCompleted 
        ? 'bg-[#050a14] border-slate-800 opacity-75 grayscale-[0.3]' 
        : 'bg-[#0B1121] border-slate-700 hover:border-blue-500/40 hover:shadow-blue-900/10'
    }`}>
      
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
          isCompleted ? 'bg-slate-700' : 'bg-gradient-to-b from-blue-500 to-cyan-400'
      }`}></div>

      <div className="p-6 flex flex-col h-full">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-2">
            <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                    {isCompleted ? (
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 tracking-wider font-mono text-[10px]">
                            COMPLETED
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-blue-950/30 text-blue-400 border-blue-500/30 tracking-wider font-mono text-[10px] animate-pulse">
                            ● LIVE
                        </Badge>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">ID: {json.bounty_id.slice(0,6)}</span>
                </div>
                
                <h3 className={`text-lg font-bold leading-tight ${isCompleted ? 'text-slate-500' : 'text-white'}`}>
                    {json.description}
                </h3>
            </div>
            
            <div className="text-right bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                <div className={`text-xl font-mono font-bold ${isCompleted ? 'text-slate-500' : 'text-emerald-400'}`}>
                    {rewardAmount} SUI
                </div>
                <div className="text-[9px] text-slate-400 uppercase tracking-widest text-right">Reward</div>
            </div>
        </div>

        {/* 3. AFISAREA BUTONULUI DE LINK (Doar dacă există attachmentUrl) */}
        {attachmentUrl && (
            <div className="mb-4">
                <a 
                    href={attachmentUrl.startsWith('http') ? attachmentUrl : `https://${attachmentUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1.5 rounded-md border border-blue-500/20 hover:border-blue-500/50 transition-all w-fit"
                >
                    <Link2 className="w-3 h-3" />
                    Vezi Codul Sursă / Context
                </a>
            </div>
        )}

        {/* CREATOR INFO */}
        <div className="flex items-center gap-2 mb-6 text-xs w-fit px-3 py-1.5 rounded-full border border-slate-800 bg-slate-950/50">
            <User className="w-3 h-3 text-slate-300" />
            <span className="text-slate-400">Posted by:</span>
            <span className={`font-mono ${isCreator ? 'text-yellow-400 font-bold' : 'text-slate-200'}`}>
                {isCreator ? "YOU" : fields.creator?.slice(0, 6) + "..." + fields.creator?.slice(-4)}
            </span>
        </div>

        {/* LISTA SOLUȚII */}
        <div className="flex-1 bg-[#02040a] rounded-lg border border-slate-800 overflow-hidden flex flex-col mb-4">
            <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                    <GitPullRequest className="w-3 h-3" /> Submissions ({submissions.length})
                </span>
            </div>
            
            <div className="p-2 space-y-2 overflow-y-auto min-h-[80px] max-h-[150px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {submissions.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic py-4">
                        <Clock className="w-5 h-5 mb-1 opacity-30" />
                        Waiting for hunters...
                    </div>
                )}

                {submissions.map((subItem: any, idx: number) => {
                    const sub = subItem.fields || subItem;
                    const isWinner = fields.winner && fields.winner === sub.solver;
                    
                    return (
                        <div key={idx} className={`p-2 rounded border flex items-center justify-between group/item transition-all ${
                            isWinner 
                            ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                            : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700'
                        }`}>
                            <div className="flex flex-col min-w-0 pr-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-mono text-slate-300">{sub.solver?.slice(0,6)}...</span>
                                    {isWinner && <Badge className="h-3 text-[8px] bg-emerald-500 text-black px-1 leading-none"><Trophy className="w-2 h-2 mr-1"/> WINNER</Badge>}
                                </div>
                                <a href={sub.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline truncate block max-w-[180px] flex items-center gap-1">
                                    <Code className="w-3 h-3 opacity-70"/> {sub.link.replace(/^https?:\/\//, '')}
                                </a>
                            </div>

                            {isCreator && !isCompleted && (
                                <Button 
                                    size="sm" 
                                    className="h-6 text-[10px] px-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 transition-all opacity-0 group-hover/item:opacity-100"
                                    onClick={() => handleApprove(idx)}
                                    disabled={isProcessing}
                                >
                                    Accept <CheckCircle2 className="w-2 h-2 ml-1" />
                                </Button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>

        {!isCreator && !isCompleted && (
            <div className="flex gap-2 mt-auto pt-2">
                <div className="relative flex-1">
                    <Input 
                        placeholder="Paste solution link..." 
                        className="bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 h-9"
                        value={solutionLink}
                        onChange={(e) => setSolutionLink(e.target.value)}
                    />
                </div>
                <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white h-9 w-9 p-0"
                    onClick={handleSubmit}
                    disabled={isProcessing}
                >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
            </div>
        )}
      </div>
    </Card>
  );
}

export function BountyList({ packageId, moduleName }: { packageId: string, moduleName: string }) {
  const { data: events, isPending, error } = useSuiClientQuery('queryEvents', {
    query: { MoveModule: { package: packageId, module: moduleName } },
    order: "descending"
  });

  if (isPending) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {[1,2].map(i => (
            <div key={i} className="h-64 bg-slate-900/30 rounded-xl animate-pulse border border-slate-800/50"></div>
        ))}
    </div>
  );

  if (error) return <div className="text-red-400 p-4 border border-red-900/50 rounded bg-red-900/10 mt-4 text-sm">Conexiune pierdută cu Sui Testnet.</div>;
  
  if (!events || events.data.length === 0) return (
    <div className="text-slate-300 text-center py-12 flex flex-col items-center border border-dashed border-slate-800 rounded-xl mt-8 bg-slate-900/20">
        <Clock className="w-8 h-8 mb-3 opacity-20" />
        <p className="text-sm font-semibold">Niciun bounty activ.</p>
        <p className="text-xs text-slate-500 mt-1">Fii primul care postează o problemă!</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 pb-20">
      {events.data.map((event: any) => (
        <BountyItem key={event.id.txDigest} event={event} packageId={packageId} moduleName={moduleName} />
      ))}
    </div>
  );
}