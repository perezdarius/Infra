import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PublicResolution } from "@/lib/resolutions";

export function ResolutionReplies({ replies }: { replies: PublicResolution[] }) {
  const [enlarged, setEnlarged] = useState<string | null>(null);
  if (!replies.length) return null;
  return <div className="mt-4 space-y-4 border-t pt-4">
    {replies.map((reply) => <div key={reply.id}>
      <p className="text-sm font-semibold text-success">Resolution reply · Staff / Admin</p>
      <time dateTime={reply.createdAt} className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleString()}</time>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{reply.reply}</p>
      <div className="mt-3 flex flex-wrap gap-2">{reply.photos.map((photo) => <Button key={photo.url} variant="ghost" className="h-20 w-20 overflow-hidden rounded-lg border p-0" aria-label={`Enlarge resolution proof ${photo.name}`} onClick={() => setEnlarged(photo.url)}>
        <img src={photo.url} alt="Resolution proof" loading="lazy" className="h-full w-full object-cover" />
      </Button>)}</div>
    </div>)}
    <Dialog open={enlarged !== null} onOpenChange={(open) => !open && setEnlarged(null)}>
      <DialogContent className="max-w-3xl p-2"><DialogTitle className="sr-only">Resolution proof photo</DialogTitle>
        {enlarged && <img src={enlarged} alt="Resolution proof enlarged" className="max-h-[80vh] w-full rounded-lg object-contain" />}
      </DialogContent>
    </Dialog>
  </div>;
}