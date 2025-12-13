import { useSuiClientQuery } from "@mysten/dapp-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Box } from "lucide-react";

export function BountyList({ packageId, moduleName }: { packageId: string, moduleName: string }) {
  
  // 1. Căutăm evenimentele de tip "BountyCreated" pe blockchain
  const { data: events, isPending, error } = useSuiClientQuery('queryEvents', {
    query: {
      MoveModule: { 
        package: packageId, 
        module: moduleName 
      }
    },
    order: "descending" // Cele mai recente primele
  });

  if (isPending) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-red-400">Eroare la încărcarea listei: {error.message}</div>;
  if (!events || events.data.length === 0) return <div className="text-slate-500 text-center">Niciun bounty activ momentan.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {events.data.map((event: any) => {
        const json = event.parsedJson;
        
        return (
          <Card key={event.id.txDigest} className="bg-slate-900/40 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10">
                  OPEN
                </Badge>
                <div className="flex items-center text-emerald-400 font-mono text-sm font-bold">
                  {/* Convertim MIST în SUI (împărțim la 1 miliard) */}
                  {(parseInt(json.reward_amount) / 1_000_000_000).toFixed(1)} SUI
                </div>
              </div>
              <CardTitle className="text-white text-base mt-2 line-clamp-2">
                {json.description}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-500 font-mono mb-4 truncate">
                ID: {json.bounty_id}
              </div>
              
              <div className="flex gap-2">
                 <div className="text-xs flex items-center text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    <Box className="w-3 h-3 mr-1"/> 
                    Creator: {json.creator.slice(0, 6)}...{json.creator.slice(-4)}
                 </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}