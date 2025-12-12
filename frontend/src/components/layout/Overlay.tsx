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
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          isOpen ? "block" : "hidden"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 h-full w-full border-l border-border bg-background p-0 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out sm:max-w-3xl",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}