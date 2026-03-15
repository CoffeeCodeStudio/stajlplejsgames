/** KlotterGallery - Gallery view for published klotter drawings */
import { MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar } from "../Avatar";
import { formatTimeAgo } from "@/lib/format";

interface KlotterItem {
  id: string;
  author_name: string;
  comment: string | null;
  created_at: string;
  image_url: string;
  signed_url?: string;
}

interface KlotterGalleryProps {
  klotter: KlotterItem[];
  loading: boolean;
  isMobile: boolean;
  onSwitchToDraw: () => void;
}

export function KlotterGallery({ klotter, loading, isMobile, onSwitchToDraw }: KlotterGalleryProps) {
  if (klotter.length === 0) {
    return (
      <div className={`text-center ${isMobile ? "py-8" : "py-12"} text-muted-foreground`}>
        <p className={isMobile ? "text-sm" : ""}>{loading ? (isMobile ? "Laddar..." : "Laddar klotter...") : (isMobile ? "Inga klotter än!" : "Inga klotter publicerade än!")}</p>
        {!loading && (
          <Button onClick={onSwitchToDraw} variant="link" className={`text-primary ${isMobile ? "text-sm" : ""}`}>
            Bli först att rita{isMobile ? "" : " något"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={isMobile ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"}>
      {klotter.map((item) => (
        <div key={item.id} className={`bg-card rounded-lg overflow-hidden border border-border ${isMobile ? "" : "hover:border-primary/50 transition-colors"}`}>
          <div className="aspect-video bg-[#1e2540] relative">
            {(item.signed_url || item.image_url) ? (
              <img src={item.signed_url || item.image_url} alt="Klotter" loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={isMobile ? "text-2xl" : "text-4xl"}>🎨</span>
              </div>
            )}
          </div>
          <div className={isMobile ? "p-2" : "p-3"}>
            <div className={`flex items-center gap-${isMobile ? "1" : "2"} ${isMobile ? "" : "mb-2"}`}>
              <Avatar name={item.author_name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-${isMobile ? "xs" : "sm"} truncate`}>{item.author_name}</p>
                {!isMobile && <p className="text-xs text-muted-foreground">{formatTimeAgo(item.created_at)}</p>}
              </div>
            </div>
            {!isMobile && item.comment && (
              <p className="text-sm text-foreground/80 flex items-start gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                {item.comment}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
