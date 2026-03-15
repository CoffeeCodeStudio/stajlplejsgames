import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Upload, Loader2, AlertTriangle, Info } from "lucide-react";

interface ProfilePhotoUploadProps {
  onUploadComplete: () => void;
}

export function ProfilePhotoUpload({ onUploadComplete }: ProfilePhotoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({ title: "Fel filtyp", description: "Välj en bildfil (JPG, PNG).", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "För stor fil", description: "Max 5 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get signed URL
      const { data: signedData } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      if (!signedData?.signedUrl) throw new Error("Kunde inte skapa URL");

      // Create avatar_upload record with pending status
      const { error: insertError } = await supabase
        .from("avatar_uploads")
        .insert({
          user_id: user.id,
          image_url: signedData.signedUrl,
          status: "pending_approval",
        });

      if (insertError) throw insertError;

      toast({
        title: "Bild uppladdad!",
        description: "Din bild granskas av en moderator innan den visas för andra.",
      });
      onUploadComplete();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Uppladdning misslyckades", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Info className="w-3 h-3 text-accent shrink-0" />
        Måste vara en <strong>ansiktsbild</strong> – granskas av moderator.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Laddar upp...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Ladda upp ansiktsbild
          </>
        )}
      </Button>
    </div>
  );
}
