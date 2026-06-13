import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Icon } from "../components/common/Icon";
import { api } from "../services/api";

export const Route = createFileRoute("/success-stories")({
  component: SuccessStories,
});

function SuccessStories() {
  const [stories, setStories] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const defaultTestimonials = [
    {
      name: "Sarah M.",
      score: "Scored 1580 (+210)",
      university: "Harvard University",
      quote: "The personalized study plan was a game-changer.",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      name: "David L.",
      score: "Scored 1550 (+180)",
      university: "Stanford University",
      quote: "The instructors genuinely care about your success.",
      imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    },
    {
      name: "Emily R.",
      score: "Scored 1590 (+150)",
      university: "Yale University",
      quote: "I was struggling to break 700 in the Math section, but the targeted problem walkthroughs helped me achieve a perfect 800.",
      imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&h=256&q=80",
    },
  ];

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await api.get("/api/success-stories");
        if (res.success) {
          setStories(res.stories || []);
        }
      } catch (e) {
        console.error("Failed to fetch stories", e);
      }
    };
    fetchStories();
  }, []);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    
    // YouTube Regex
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }
    
    // Vimeo Regex
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    
    return url;
  };

  const isEmbeddable = (url: string) => {
    const embedUrl = getEmbedUrl(url);
    return embedUrl.includes("youtube.com/embed") || embedUrl.includes("vimeo.com/video");
  };

  const displayStories = stories.length > 0 ? stories : defaultTestimonials;

  return (
    <div className="min-h-screen bg-background text-on-background animate-fade-up flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-surface-container-low py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
                <Icon name="social_leaderboard" className="text-[16px]" /> Our Track Record
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold tracking-[-0.02em] md:text-5xl lg:text-6xl text-on-surface">
                Student <span className="text-primary">Success Stories</span>
              </h1>
              <p className="mt-6 text-lg text-on-surface-variant">
                Join hundreds of students who have achieved their target scores and gained admission to top-tier universities worldwide with SAT Sharks.
              </p>
            </div>
            
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {displayStories.map((item) => (
                <figure
                  key={item._id || item.name}
                  className="hover-lift relative rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40 flex flex-col items-center text-center justify-between min-h-[420px]"
                >
                  <div className="flex flex-col items-center w-full">
                    {/* Centered Large Student Avatar on Top */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 shadow-md mb-4"
                      />
                    ) : (
                      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-primary text-on-primary font-display text-2xl font-bold border-2 border-primary/20 shadow-md mb-4 animate-fade-in">
                        {item.name.charAt(0)}
                      </div>
                    )}
                    
                    {/* Student Info */}
                    <div className="font-semibold text-on-surface text-lg">{item.name}</div>
                    <div className="font-mono text-xs uppercase tracking-[0.08em] text-accent font-bold mt-1">
                      {item.score}
                    </div>
                    <div className="mt-1 text-xs text-on-surface-variant flex items-center justify-center gap-1">
                      <Icon name="school" className="text-[14px]" /> {item.university}
                    </div>

                    {/* Centered Play Button */}
                    {item.videoUrl && (
                      <button
                        onClick={() => setSelectedVideo(item.videoUrl)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-on-primary px-3.5 py-1.5 font-body text-xs font-bold uppercase tracking-wider transition-all duration-300 mt-3 border border-primary/20 cursor-pointer shadow-sm"
                        title="Watch Video Testimonial"
                      >
                        <Icon name="play_arrow" className="text-[14px]" />
                        Watch Video
                      </button>
                    )}
                  </div>

                  <div className="w-full">
                    {/* Divider Line */}
                    <div className="h-[1px] w-full bg-outline-variant/30 my-4" />

                    {/* Testimonial Quote */}
                    <blockquote className="text-on-surface leading-relaxed text-sm italic font-light">
                      "{item.quote}"
                    </blockquote>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Video Lightbox Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/20">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-10 text-white bg-black/40 hover:bg-black/80 p-2 rounded-full transition-colors cursor-pointer"
              aria-label="Close video player"
            >
              <Icon name="close" className="text-2xl" />
            </button>
            
            <div className="w-full aspect-video">
              {isEmbeddable(selectedVideo) ? (
                <iframe
                  src={getEmbedUrl(selectedVideo)}
                  title="Student Video Testimonial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-none"
                />
              ) : (
                <video
                  src={selectedVideo}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
