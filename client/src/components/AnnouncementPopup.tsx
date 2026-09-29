import { useState, useEffect } from 'react';
import api from '../lib/api';
import { X, Megaphone } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface Announcement {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    // Check if user dismissed it today
    const today = new Date().toISOString().split('T')[0];
    const dismissedDate = localStorage.getItem('announcement_dismissed_date');
    if (dismissedDate === today) {
      return; // Already dismissed today, don't fetch or show
    }

    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements/active');
        if (res.data && res.data.length > 0) {
          setAnnouncements(res.data);
          setIsVisible(true);
        }
      } catch (err) {
        console.error('Failed to load announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (dontShowToday) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('announcement_dismissed_date', today);
    }
  };

  const nextAnnouncement = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose(); // Auto close after last one
    }
  };

  if (!isVisible || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="bg-gpt-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-slide-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image/Poster Section */}
        {current.imageUrl ? (
          <div className="w-full h-64 sm:h-80 bg-gpt-panel relative shrink-0">
            <img 
              src={current.imageUrl} 
              alt={current.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <span className="px-2.5 py-1 bg-gpt-panel/20 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/30 uppercase tracking-wider mb-2 inline-block">
                Announcement
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {current.title}
              </h2>
            </div>
          </div>
        ) : (
          <div className="w-full pt-10 pb-6 px-6 bg-gradient-to-br from-[#0F172A] to-[#334155] shrink-0 relative">
            <Megaphone className="w-12 h-12 text-white/20 absolute top-6 right-6" />
            <span className="px-2.5 py-1 bg-gpt-panel/20 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/30 uppercase tracking-wider mb-3 inline-block">
              Announcement
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight max-w-[85%]">
              {current.title}
            </h2>
          </div>
        )}

        {/* Content Section */}
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gpt-muted mb-4 font-medium">
            Posted on {formatDate(current.createdAt)}
          </p>
          <div className="prose prose-sm max-w-none text-gpt-muted whitespace-pre-wrap">
            {current.description}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2E8F0] bg-gpt-panel flex items-center justify-between shrink-0">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="w-4 h-4 rounded border-gpt-accent text-[#0F172A] focus:ring-[#0F172A]"
            />
            <span className="text-xs text-gpt-muted font-medium group-hover:text-white transition-colors">
              Don't show again today
            </span>
          </label>
          
          <button 
            onClick={nextAnnouncement}
            className="btn-primary py-2 px-6"
          >
            {currentIndex < announcements.length - 1 ? 'Next' : 'Got it'}
          </button>
        </div>

        {/* Progress indicators if multiple */}
        {announcements.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {announcements.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'w-6 bg-gpt-panel' 
                    : 'w-2 bg-gpt-panel/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
