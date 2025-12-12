import { FileCode, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function ScannerView() {
  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center hover:bg-slate-900/50 hover:border-blue-500/50 transition-all cursor-pointer group">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
          <FileCode className="h-8 w-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
        </div>
        <h3 className="text-lg font-semibold text-white">Upload fișier .move</h3>
        <p className="text-slate-500 text-sm mt-2">Sau trage fișierele aici. Suportă multiple module.</p>
        <Button variant="outline" className="mt-6">Selectează din Computer</Button>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
            Rezultate Scanare Anterioară
          </h3>
          <div className="flex space-x-2">
            <Badge variant="destructive">2 Critice</Badge>
            <Badge variant="warning">1 Medie</Badge>
          </div>
        </div>

        {/* Vulnerability Card */}
        <Card className="border-l-4 border-l-red-500 bg-slate-900/40 overflow-hidden">
          <div className="p-4 bg-red-500/5 border-b border-slate-800">
            <div className="flex justify-between items-start mb-2">
              <span className="text-red-400 font-mono text-xs font-bold px-2 py-0.5 bg-red-500/10 rounded">CRITICAL-001</span>
              <span className="text-slate-500 text-xs font-mono">my_coin.move:41</span>
            </div>
            <h4 className="font-semibold text-slate-200">Lipsă Verificare Ownership</h4>
            <p className="text-slate-400 text-sm mt-1">Funcția `mint` permite oricui să creeze monede fără a verifica `TreasuryCap`.</p>
          </div>
          
          <div className="bg-[#0d1117] p-4 font-mono text-xs overflow-x-auto">
            <div className="text-slate-600 select-none">40 |     // ...</div>
            <div className="text-red-400/50 bg-red-900/10 -mx-4 px-4 py-1 block">
              - public fun mint(amount: u64, ctx: &mut TxContext)
            </div>
            <div className="text-emerald-400/50 bg-emerald-900/10 -mx-4 px-4 py-1 block">
              + public fun mint(cap: &mut TreasuryCap, amount: u64, ctx: &mut TxContext)
            </div>
          </div>
          
          <CardContent className="p-3 bg-slate-950/50 border-t border-slate-800 flex justify-end space-x-3">
            <Button size="sm" variant="ghost">Ignoră</Button>
            <Button size="sm">Aplică Fix Automat</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}