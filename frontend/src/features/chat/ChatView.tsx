import { useState, useRef, useEffect } from "react"
// AM SCOS 'Bot' și 'User' din import pentru că nu erau folosite
import { ArrowUpRight, Loader2 } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { askMoveMate } from "@/lib/API" 
import ReactMarkdown from "react-markdown"

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export function ChatView() {
  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Referință pentru autoscroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- LOGICA DE TRIMITERE ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput(""); 
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const answer = await askMoveMate(userMessage);

    setMessages(prev => [...prev, { role: 'ai', content: answer }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[70vh]">
      {/* ZONA DE MESAJE */}
      <div className="flex-1 space-y-6 pr-2 mb-4 overflow-y-auto custom-scrollbar">
        
        {messages.length === 0 && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-800/80 border border-slate-700 p-4 text-sm text-slate-300 shadow-sm">
              <p>Hello! I'm <strong>MoveMate</strong>.</p>
              <p className="mt-2">I currently have acces to:</p>
              <ul className="list-disc list-inside mt-1 text-slate-400 space-y-1">
                <li>Sui Framework Docs</li>
                <li>Move Book (2024)</li>
              </ul>
              <p className="mt-4 text-xs text-slate-500">Ask me anything about the Move language and Smart Contracts.</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`
                max-w-[85%] rounded-2xl p-4 text-sm shadow-sm
                ${msg.role === 'user' 
                  ? 'rounded-tr-sm bg-blue-600 text-white shadow-blue-900/20' 
                  : 'rounded-tl-sm bg-slate-800/80 border border-slate-700 text-slate-300'
                }
              `}
            >
              {msg.role === 'ai' ? (
                <ReactMarkdown 
                  components={{
                    // AM SCOS 'node' din parametri și variabila 'match' pentru că nu erau folosite
                    code({className, children, ...props}) {
                      return !className ? (
                        <code className="bg-slate-700 px-1 py-0.5 rounded text-blue-200" {...props}>
                          {children}
                        </code>
                      ) : (
                        <div className="mt-3 rounded-lg bg-[#0d1117] border border-slate-700 p-3 font-mono text-xs text-blue-300 overflow-x-auto my-2">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </div>
                      )
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-slate-800/50 border border-slate-700/50 p-4 text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span>MoveMate is thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* ZONA DE INPUT */}
      <div className="pt-4 border-t border-slate-800 mt-auto">
        <div className="relative">
          <Input 
            placeholder="Ask me anything..." 
            className="pr-12 bg-slate-900 border-slate-700 focus-visible:ring-blue-500 h-12 text-slate-200"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            className="absolute right-1 top-1 bottom-1 w-10 h-10 bg-transparent text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <ArrowUpRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}