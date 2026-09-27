import React, { useState, useEffect, useRef } from 'react';
import { api, ChatMessageModel } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Send,
  Truck,
  User as UserIcon,
  Sparkles,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadId: number | null;
  receiverId: number;
  partnerName: string;
  orderContext?: {
    pickup_city: string;
    drop_city: string;
    cargo: string;
    agreed_price: number;
    truck_number?: string;
  } | null;
}

const PRESET_MESSAGES = [
  { icon: Truck, text: 'Truck is en route to pickup location' },
  { icon: MapPin, text: 'Arrived at warehouse gate' },
  { icon: Package, text: 'Cargo safely loaded, starting journey' },
  { icon: Clock, text: 'Estimated arrival in 2 hours' },
  { icon: CheckCircle2, text: 'Delivered and signed with consignee' },
];

export const OrderChatDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  loadId,
  receiverId,
  partnerName,
  orderContext,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageModel[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!loadId) return;
    try {
      const data = await api.getChatMessages(loadId);
      setMessages(data || []);
    } catch {
      // Ignore network errors
    }
  };

  useEffect(() => {
    if (!open || !loadId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [open, loadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !loadId) return;

    setIsSending(true);
    try {
      const targetReceiver = receiverId || 2;
      const sent = await api.sendChatMessage(loadId, {
        receiver_id: targetReceiver,
        message: text,
      });

      setMessages((prev) => [...prev, sent]);
      setInputMessage('');
    } catch (err: any) {
      toast.error('Failed to send message', { description: err.message });
    } finally {
      setIsSending(false);
    }
  };

  if (!loadId) return null;

  const currentUserId = user?.id || 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 rounded-3xl border-border bg-card shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent p-4 border-b border-border/70 shrink-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/20 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-base font-bold text-foreground flex items-center gap-2">
                    <span>{partnerName || 'Partner'}</span>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 px-2 py-0.2 text-[9px] font-bold">
                      Direct Dispatch Chat
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span>Order #RF-{loadId}</span>
                    {orderContext && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-foreground">
                          {orderContext.pickup_city} → {orderContext.drop_city}
                        </span>
                        <span>·</span>
                        <span>₹{Number(orderContext.agreed_price).toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Preset logistics chips */}
        <div className="px-4 py-2 border-b border-border/50 bg-secondary/30 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Quick:
          </span>
          {PRESET_MESSAGES.map((preset, i) => {
            const Icon = preset.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(preset.text)}
                className="text-[11px] font-medium bg-background border border-border/80 rounded-xl px-2.5 py-1 whitespace-nowrap text-foreground hover:bg-secondary hover:border-primary/50 transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <Icon className="h-3 w-3 text-primary shrink-0" />
                <span>{preset.text}</span>
              </button>
            );
          })}
        </div>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-muted-foreground">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="font-bold text-foreground">Direct Order Chat</p>
              <p className="text-[11px] mt-0.5">
                Send real-time updates regarding loading, gate arrivals, and delivery progress.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1 px-1">
                    <span className="font-semibold">
                      {isMe ? 'You' : m.sender?.name || partnerName}
                    </span>
                    <span>·</span>
                    <span className="font-mono">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-br-xs'
                        : 'bg-secondary text-foreground rounded-bl-xs border border-border/60'
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-border/70 bg-card shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type message to carrier/shipper..."
              className="rounded-xl h-10 text-xs bg-background"
            />
            <Button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="rounded-xl h-10 px-4 bg-primary text-primary-foreground font-semibold text-xs gap-1.5 shadow-sm cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
