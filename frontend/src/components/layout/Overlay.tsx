import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface OverlayProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Overlay({ isOpen, onClose, title, children }: OverlayProps) {
  return (
    <>
      {/* Backdrop (Fundalul întunecat din spate) */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel-ul Principal (Aici am schimbat culorile) */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 h-full w-full border-l border-slate-800 bg-[#020617] shadow-2xl transition-transform duration-500 ease-in-out sm:max-w-3xl",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header-ul Overlay-ului */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#020617]">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {title}
            </h2>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Conținutul scrollabil */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#020617] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}