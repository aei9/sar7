import { useState, useRef, useEffect } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey, useSendChatMessage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Loader2, MessageCircle, Sparkles } from "lucide-react";

type Msg = { id: number; role: string; content: string; timestamp: string };

const quickReplies = [
  "حلل مهاراتي",
  "اقترح وظائف مناسبة",
  "أرني مساري المهني",
  "ما الدورات المقترحة؟",
  "كيف أحسّن ملفي؟",
];

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: history, isLoading } = useGetChatHistory({ query: { queryKey: getGetChatHistoryQueryKey() } });
  const sendMsg = useSendChatMessage();
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = history ? [...(history as Msg[])] : localMessages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    if (!text.trim() || sendMsg.isPending) return;
    const userMsg: Msg = { id: Date.now(), role: "user", content: text, timestamp: new Date().toISOString() };
    setLocalMessages((prev) => [...(history as Msg[] ?? []), userMsg]);
    setInput("");
    sendMsg.mutate(
      { data: { message: text } },
      {
        onSuccess: (res) => {
          const r = res as { id: number; reply: string; timestamp: string };
          const aiMsg: Msg = { id: r.id, role: "assistant", content: r.reply, timestamp: r.timestamp };
          setLocalMessages((prev) => [...prev.filter((m) => m.id !== userMsg.id), userMsg, aiMsg]);
          queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
        },
        onError: () => {
          setLocalMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        },
      }
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-0px)] lg:h-screen max-h-screen">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(222,47%,35%)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base">المستشار المهني الذكي</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                متاح دائماً
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-bold text-base mb-2">مرحباً، {user?.fullName}</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                أنا مستشارك المهني الذكي. يمكنني مساعدتك في تحليل مهاراتك، اقتراح الدورات والوظائف، وتخطيط مسارك المهني.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {quickReplies.map((r) => (
                  <button key={r} onClick={() => send(r)} data-testid={`quick-reply-${r}`}
                    className="px-4 py-2 rounded-full text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium border border-primary/20">
                    {r}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-xs sm:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm shadow-sm"
                  }`}>
                    {m.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3 h-3 text-accent" />
                        <span className="text-xs font-semibold text-accent">المستشار الذكي</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className={`text-xs mt-1.5 ${m.role === "user" ? "text-white/50" : "text-muted-foreground"}`}>
                      {new Date(m.timestamp).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {sendMsg.isPending && (
                <div className="flex justify-end">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">يكتب المستشار...</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Quick replies after last AI message */}
              {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !sendMsg.isPending && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {quickReplies.slice(0, 3).map((r) => (
                    <button key={r} onClick={() => send(r)}
                      className="px-3 py-1.5 rounded-full text-xs bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border">
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-card shrink-0">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="اكتب سؤالك هنا..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground text-foreground"
              data-testid="input-chat-message"
            />
            <Button size="icon" className="w-8 h-8 rounded-lg shrink-0" onClick={() => send(input)} disabled={!input.trim() || sendMsg.isPending} data-testid="button-send-message">
              {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
