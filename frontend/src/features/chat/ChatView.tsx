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
              <p>Pentru a adăuga un câmp dinamic, folosești `sui::dynamic_field`.</p>
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