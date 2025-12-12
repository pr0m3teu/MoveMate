import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = {
  // --- SCANNER VIEW ---
  'src/features/scanner/ScannerView.tsx': `
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
            <p className="text-slate-400 text-sm mt-1">Funcția \`mint\` permite oricui să creeze monede fără a verifica \`TreasuryCap\`.</p>
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
`,

  // --- CHAT VIEW ---
  'src/features/chat/ChatView.tsx': `
import { ArrowUpRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export function ChatView() {
  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex-1 space-y-6 pr-2 mb-4 overflow-y-auto">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-800/80 border border-slate-700 p-4 text-sm text-slate-300 shadow-sm">
            <p>Salut! Sunt <strong>MoveMate</strong>.</p>
            <p className="mt-2">Am acces indexat la:</p>
            <ul className="list-disc list-inside mt-1 text-slate-400 space-y-1">
              <li>Sui Framework Docs</li>
              <li>Move Book (2024)</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 text-white p-4 text-sm shadow-md shadow-blue-900/20">
            <p>Dă-mi un exemplu de Dynamic Fields în Sui.</p>
          </div>
        </div>

         <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-slate-800/80 border border-slate-700 p-4 text-sm text-slate-300 shadow-sm">
              <p>Pentru a adăuga un câmp dinamic, folosești \`sui::dynamic_field\`.</p>
              <div className="mt-3 rounded-lg bg-[#0d1117] border border-slate-700 p-3 font-mono text-xs text-blue-300 overflow-x-auto">
                <span className="text-purple-400">use</span> sui::dynamic_field as df;<br/>
                df::add(&mut parent.id, b"name", child);
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <Badge variant="success" className="cursor-pointer hover:bg-emerald-900/20">
                  <CheckCircle className="w-3 h-3 mr-1" /> Sursa: sui::dynamic_field
                </Badge>
              </div>
            </div>
         </div>
      </div>

      <div className="pt-4 border-t border-slate-800 mt-auto">
        <div className="relative">
          <Input 
            placeholder="Întreabă despre Move..." 
            className="pr-12 bg-slate-900 border-slate-700 focus-visible:ring-blue-500 h-12" 
          />
          <Button size="icon" className="absolute right-1 top-1 bottom-1 w-10 h-10 bg-transparent text-blue-500 hover:text-white hover:bg-blue-600 rounded">
            <ArrowUpRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
`,

  // --- GAS VIEW ---
  'src/features/gas/GasView.tsx': `
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
`,

  // --- APP.TSX (MAIN) ---
  'src/App.tsx': `
import { useState, useEffect } from "react"
import { Shield, MessageSquare, Zap, Search, CheckCircle, ArrowUpRight, LayoutTemplate, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Overlay } from "@/components/layout/Overlay"

import { ScannerView } from "@/features/scanner/ScannerView"
import { ChatView } from "@/features/chat/ChatView"
import { GasView } from "@/features/gas/GasView"

// Componentă UI Locală (Dashboard Card)
const DashboardCard = ({ title, description, icon: Icon, color, onClick }: any) => {
  const colorStyles: any = {
    blue: "text-blue-400 group-hover:text-blue-300 bg-blue-500/10 group-hover:bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]",
    emerald: "text-emerald-400 group-hover:text-emerald-300 bg-emerald-500/10 group-hover:bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
    yellow: "text-yellow-400 group-hover:text-yellow-300 bg-yellow-500/10 group-hover:bg-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]",
  }
  return (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-8 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-2xl cursor-pointer"
    >
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-3xl transition-all group-hover:from-white/10" />
      <div className={cn("mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300", colorStyles[color])}>
        <Icon size={24} />
      </div>
      <h3 className="mb-2 text-xl font-bold text-white group-hover:text-blue-100 transition-colors">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
    </div>
  )
}

const StatCard = ({ label, value, icon: Icon }: any) => (
  <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4 flex items-center space-x-4 hover:bg-slate-900/50 transition-colors">
    <div className="p-2.5 bg-slate-800 rounded-lg text-slate-400">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</p>
      <p className="text-lg font-bold text-white font-mono">{value}</p>
    </div>
  </div>
)

export default function App() {
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && setActiveOverlay(null)
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#020617] font-sans text-slate-200 selection:bg-blue-500/30 overflow-hidden">
      
      {/* BACKGROUND LAYER (Dashboard) */}
      <div 
        className={cn(
          "min-h-screen transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          activeOverlay ? "scale-[0.95] opacity-50 blur-[2px] pointer-events-none grayscale-[0.5]" : "scale-100 opacity-100"
        )}
      >
        <header className="fixed top-0 w-full z-10 border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                <Shield className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-white">MoveMate</span>
            </div>
            <Button 
              variant={isWalletConnected ? "secondary" : "default"}
              onClick={() => setIsWalletConnected(!isWalletConnected)}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              {isWalletConnected ? "0x7A...F92B" : "Conectează Wallet"}
            </Button>
          </div>
        </header>

        <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
          <div className="mb-16 text-center space-y-4">
             <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
              Securitate pentru <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Move Smart Contracts</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto pt-4 leading-relaxed">
              Platforma completă de audit AI. Detectează vulnerabilități, simulează costurile de gaz și oferă consultanță tehnică bazată pe documentația oficială Sui.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard 
              title="Scanner Vulnerabilități" 
              description="Analiză statică pentru re-entrancy, overflow, și ownership leaks."
              icon={Shield} 
              color="blue" 
              onClick={() => setActiveOverlay('scanner')} 
            />
            <DashboardCard 
              title="Asistent Arhitect" 
              description="Chatbot antrenat pe documentația Sui Move (RAG)."
              icon={MessageSquare} 
              color="emerald" 
              onClick={() => setActiveOverlay('chat')} 
            />
            <DashboardCard 
              title="Simulator Gas" 
              description="Vizualizează conflictele de obiecte și costurile de execuție."
              icon={Zap} 
              color="yellow" 
              onClick={() => setActiveOverlay('gas')} 
            />
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Scanări Totale" value="12,403" icon={Search} />
            <StatCard label="Bounties Plătite" value="45,200 SUI" icon={CheckCircle} />
            <StatCard label="Gas Salvat (Medie)" value="~15%" icon={ArrowUpRight} />
            <div className="md:col-span-1 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 flex items-center justify-center text-slate-500 text-sm hover:border-slate-700 hover:text-slate-300 cursor-pointer transition-colors p-4 group">
              <LayoutTemplate className="w-4 h-4 mr-2 group-hover:text-blue-400 transition-colors" /> Vezi Istoric Audituri
            </div>
          </div>
        </main>
      </div>

      {/* OVERLAY LAYERS (Conținutul care apare) */}
      <Overlay isOpen={activeOverlay === 'scanner'} onClose={() => setActiveOverlay(null)} title="Audit Securitate">
        <ScannerView />
      </Overlay>

      <Overlay isOpen={activeOverlay === 'chat'} onClose={() => setActiveOverlay(null)} title="Move Architect">
        <ChatView />
      </Overlay>

      <Overlay isOpen={activeOverlay === 'gas'} onClose={() => setActiveOverlay(null)} title="Gas Simulation">
        <GasView />
      </Overlay>

    </div>
  )
}
`,
};

async function createFiles() {
  console.log("🚀 Generăm Aplicația MoveMate...");

  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(__dirname, filePath);
    const dir = path.dirname(absolutePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absolutePath, content.trim());
    console.log(`✅ Creat: ${filePath}`);
  }
  console.log("✨ Aplicația este gata! Rulează 'npm run dev' pentru a o vedea.");
}

createFiles();