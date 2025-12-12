import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BountyView() {
  return (
    <div className="space-y-8">
      <Card className="bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Lifecycle Bounty Protocol
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex-1 p-4 rounded-lg border border-slate-800 bg-slate-900/30">
              <div className="text-blue-400 font-semibold mb-1">Open</div>
              <div className="text-slate-400 text-xs">Bounty creat, escrow 10 SUI</div>
            </div>
            <div className="text-slate-600">→</div>
            <div className="flex-1 p-4 rounded-lg border border-slate-800 bg-slate-900/30">
              <div className="text-yellow-400 font-semibold mb-1">Assigned</div>
              <div className="text-slate-400 text-xs">Auditor claim bounty</div>
            </div>
            <div className="text-slate-600">→</div>
            <div className="flex-1 p-4 rounded-lg border border-slate-800 bg-slate-900/30">
              <div className="text-emerald-400 font-semibold mb-1">Resolved</div>
              <div className="text-slate-400 text-xs">Fix proof (IPFS/GitHub)</div>
            </div>
            <div className="text-slate-600">→</div>
            <div className="flex-1 p-4 rounded-lg border border-slate-800 bg-slate-900/30">
              <div className="text-red-400 font-semibold mb-1">Disputed</div>
              <div className="text-slate-400 text-xs">Release/timeout + dispute</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled
        >
          Creează Bounty (10 SUI)
        </Button>
      </div>

      <div className="text-center text-xs text-slate-500">
        Platform Multi-Sig Dispute
      </div>
    </div>
  )
}


