import { Terminal, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function GasView() {
  const data = [
    { name: 'Mint', serial: 4000, parallel: 2400 },
    { name: 'Transfer', serial: 3000, parallel: 1398 },
    { name: 'Swap', serial: 2000, parallel: 9800 },
  ]

  return (
    <div className="space-y-8">
      <Card className="bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Terminal className="mr-2 h-4 w-4 text-yellow-400" /> 
            Cost Gaz vs. Paralelizare
          </CardTitle>
          <div className="flex space-x-4 text-xs">
            <span className="flex items-center text-slate-400">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" /> Serial
            </span>
            <span className="flex items-center text-slate-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2" /> Paralel
            </span>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="serial" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="parallel" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Detecție Contenție Obiecte</h4>
        
        <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-800 flex items-start space-x-4 hover:border-slate-600 transition-colors">
          <div className="p-2 bg-red-900/20 rounded text-red-400 mt-1">
            <Layers size={18} />
          </div>
          <div>
            <h5 className="text-sm font-medium text-white">Hotspot: Shared Object 0x4a...9f</h5>
            <p className="text-xs text-slate-400 mt-1">Acest obiect este accesat mutabil de 85% din tranzacții, blocând paralelizarea.</p>
            <div className="mt-3 flex gap-2">
               <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700">Analizează Obiect</Button>
               <Button size="sm" className="h-7 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-transparent">Sugestie Sharding</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}