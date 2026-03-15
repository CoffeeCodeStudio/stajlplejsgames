/** Publish modal for klotter drawings - both mobile (bottom sheet) and desktop (centered modal) */
import { X, Send } from "lucide-react";
import { Button } from "../ui/button";

interface KlotterPublishModalProps {
  isMobile: boolean;
  isPublishing: boolean;
  canPublish: boolean;
  comment: string;
  onCommentChange: (value: string) => void;
  onPublish: () => void;
  onClose: () => void;
  previewDataUrl?: string;
}

export function KlotterPublishModal({
  isMobile, isPublishing, canPublish, comment, onCommentChange, onPublish, onClose, previewDataUrl,
}: KlotterPublishModalProps) {
  const buttonLabel = isPublishing ? "Publicerar..." : !canPublish ? "Logga in först" : "Publicera";

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
        <div className="bg-card w-full rounded-t-2xl p-4 animate-slide-in-bottom">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Publicera klotter</h3>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Lägg till en kommentar..."
            className="w-full p-3 rounded-lg bg-muted border border-border text-sm resize-none"
            rows={2}
          />
          <Button onClick={onPublish} disabled={isPublishing || !canPublish} className="w-full mt-3 bg-primary">
            <Send className="w-4 h-4 mr-2" />{buttonLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-bold text-lg">Publicera klotter</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-4">
          {previewDataUrl && (
            <div className="aspect-video bg-[#1e2540] rounded-lg overflow-hidden mb-4">
              <img src={previewDataUrl} alt="Preview" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Lägg till en kommentar (valfritt)</label>
            <textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Skriv något om ditt klotter..."
              rows={2}
              maxLength={200}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{comment.length}/200</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Avbryt</Button>
            <Button className="flex-1 gap-1.5" onClick={onPublish} disabled={isPublishing || !canPublish}>
              <Send className="w-4 h-4" />{buttonLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
