import React, { useState, useEffect } from 'react';
import { api, NotificationModel } from '@/lib/api';
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  Package,
  Truck,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  onOpenChat?: ((loadId: number, receiverId: number, partnerName: string) => void) | undefined;
  onOpenOrder?: ((loadId: number) => void) | undefined;
}

export const NotificationDropdown: React.FC<Props> = ({ onOpenChat, onOpenOrder }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications().catch(() => ({ success: true, unread_count: 0, data: [] }));
      if (res && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unread_count || res.data.filter((n) => !n.is_read).length);
      }
    } catch {
      // Ignore network errors on background poll
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = async (notif: NotificationModel) => {
    if (!notif.is_read) {
      api.markNotificationAsRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    setOpen(false);

    if (notif.type === 'CHAT_MESSAGE' && notif.data?.load_id) {
      onOpenChat?.(
        notif.data.load_id,
        notif.data.sender_id || 2,
        notif.title.replace('Message from ', '') || 'Partner'
      );
    } else if (notif.data?.load_id) {
      onOpenOrder?.(notif.data.load_id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LOAD_ACCEPTED':
        return <Truck className="h-4 w-4 text-emerald-500" />;
      case 'CHAT_MESSAGE':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'ORDER_STATUS':
        return <Package className="h-4 w-4 text-amber-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-2xl border border-border/80 bg-background/90 text-muted-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-accent/40 hover:text-foreground cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 rounded-3xl border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/70 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-bold text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-semibold">No notifications yet</p>
              <p className="text-[11px] mt-0.5">
                Load acceptance, order alerts, and chat messages will appear here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer text-left hover:bg-secondary/60 ${
                  !n.is_read ? 'bg-primary/5 font-medium' : 'bg-transparent'
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-background border border-border shadow-xs mt-0.5">
                  {getIcon(n.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {n.message}
                  </p>
                  <p className="text-[9px] text-muted-foreground/80 mt-1 font-mono">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
