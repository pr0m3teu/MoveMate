import { useState, useEffect } from "react"
import { Shield, MessageSquare, Search, CheckCircle, ArrowUpRight, LayoutTemplate, Wallet, Code2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

import { Overlay } from "@/components/layout/Overlay"

import { ChatView } from "@/features/chat/ChatView"
import { BountyView } from "@/features/bounty/BountyView"
import { TxLabView } from "@/features/txlab/TxLabView"
import { ConnectButton } from '@mysten/dapp-kit';

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
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-8 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-2xl cursor-pointer h-full"
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && setActiveOverlay(null)
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#020617] font-sans text-slate-200 selection:bg-blue-500/30 overflow-hidden">
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
            <div className="flex items-center gap-4">
               <ConnectButton />
            </div>
          </div>
        </header>

        <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
          {/* HERO SECTION */}
          <div className="mb-16 text-center space-y-4">
             <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
              Consult. Interact. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Reward.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto pt-4 leading-relaxed">
              The all-in-one hub. Get instant documentation answers, build transactions visually, and get complex issues solved by the community via secure escrow.
            </p>
          </div>

          {/* CARDS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <DashboardCard 
              title="Architect Assistant" 
              description="RAG-powered AI trained strictly on official Sui documentation. Get accurate answers on syntax and patterns."
              icon={MessageSquare} 
              color="emerald" 
              onClick={() => setActiveOverlay('chat')} 
            />

            <DashboardCard 
              title="Interaction Lab" 
              description="Visual transaction builder. Manually execute entry functions and test smart contracts directly from the UI."
              icon={Play} 
              color="blue" 
              onClick={() => setActiveOverlay('txlab')} 
            />
            
            <DashboardCard 
              title="Bounty & Escrow" 
              description="Stuck on a bug? Post a bounty and let skilled developers solve it for you. Funds are secured on-chain."
              icon={Wallet} 
              color="yellow" 
              onClick={() => setActiveOverlay('bounty')} 
            />
          </div>

          {/* STATS SECTION */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Docs Indexed" value="1,403 Pages" icon={Search} />
            <StatCard label="Bounties Paid" value="45,200 SUI" icon={CheckCircle} />
            <StatCard label="Active Users" value="842" icon={ArrowUpRight} />
            <div className="md:col-span-1 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 flex items-center justify-center text-slate-500 text-sm hover:border-slate-700 hover:text-slate-300 cursor-pointer transition-colors p-4 group">
              <LayoutTemplate className="w-4 h-4 mr-2 group-hover:text-blue-400 transition-colors" /> View Platform Stats
            </div>
          </div>
        </main>
      </div>

      {/* OVERLAY LAYERS */}
      <Overlay isOpen={activeOverlay === 'txlab'} onClose={() => setActiveOverlay(null)} title="Contract Interaction Lab">
        <TxLabView />
      </Overlay>

      <Overlay isOpen={activeOverlay === 'chat'} onClose={() => setActiveOverlay(null)} title="Move Architect">
        <ChatView />
      </Overlay>

      <Overlay isOpen={activeOverlay === 'bounty'} onClose={() => setActiveOverlay(null)} title="Bounty Protocol">
        <BountyView />
      </Overlay>

    </div>
  )
}