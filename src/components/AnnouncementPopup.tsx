import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  active: boolean;
  created_at: string;
}

const AnnouncementPopup = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for new announcements
    const channel = supabase
      .channel('announcement-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
          filter: 'active=eq.true'
        },
        (payload) => {
          const newAnnouncement = payload.new as Announcement;
          setAnnouncement(newAnnouncement);
          setIsVisible(true);
        }
      )
      .subscribe();

    // Fetch any recent announcements on component mount
    const fetchRecentAnnouncement = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && !error) {
        const recentAnnouncement = data[0];
        // Only show if it's very recent (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const announcementTime = new Date(recentAnnouncement.created_at);
        
        if (announcementTime > fiveMinutesAgo) {
          setAnnouncement(recentAnnouncement);
          setIsVisible(true);
        }
      }
    };

    fetchRecentAnnouncement();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setAnnouncement(null), 300);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (!announcement || !isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card 
        className={`max-w-md w-full bg-card border shadow-3d transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-card-foreground">
                  New Announcement
                </h3>
                <Badge variant={getPriorityColor(announcement.priority)}>
                  {announcement.priority}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h4 className="text-xl font-bold text-card-foreground">
              {announcement.title}
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              {announcement.content}
            </p>
            <p className="text-xs text-muted-foreground">
              Posted: {new Date(announcement.created_at).toLocaleString()}
            </p>
          </div>

          {/* Action */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleClose} className="bg-gradient-primary">
              Got it!
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnnouncementPopup;