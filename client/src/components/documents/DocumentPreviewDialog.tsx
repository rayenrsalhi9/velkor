import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, File01Icon, LoadingIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { downloadBlob, downloadDocumentBlob } from "@/lib/api";
import type { VelkorDocument } from "@/lib/api";

type PreviewKind = "pdf" | "image" | "text" | "unsupported";

function previewKind(mimeType: string): PreviewKind {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("text/") || mimeType === "application/csv") {
    return "text";
  }
  return "unsupported";
}

interface DocumentPreviewDialogProps {
  document: VelkorDocument | null;
  onOpenChange: (open: boolean) => void;
}

export default function DocumentPreviewDialog({
  document,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const open = document !== null;
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!document) return;
    let cancelled = false;
    let urlToRevoke: string | null = null;
    setLoading(true);
    setError(null);
    setBlob(null);
    setBlobUrl(null);
    setText(null);

    downloadDocumentBlob(document.id)
      .then(async (nextBlob) => {
        if (cancelled) return;
        setBlob(nextBlob);
        const kind = previewKind(document.mimeType);
        if (kind === "pdf" || kind === "image") {
          urlToRevoke = URL.createObjectURL(nextBlob);
          setBlobUrl(urlToRevoke);
        } else if (kind === "text") {
          const text = await nextBlob.text();
          if (cancelled) return;
          setText(text);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load the preview.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [document]);

  const download = () => {
    if (blob && document) downloadBlob(blob, document.fileName);
  };

  const content = () => {
    if (error) {
      return (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      );
    }
    if (loading || !document) {
      return (
        <div className="grid h-[60vh] place-items-center text-ink-3">
          <HugeiconsIcon icon={LoadingIcon} size={22} className="animate-spin" />
        </div>
      );
    }
    const kind = previewKind(document.mimeType);
    if (kind === "unsupported") {
      return (
        <div className="flex flex-col items-center gap-3 rounded-md border border-line bg-surface px-6 py-14 text-center">
          <HugeiconsIcon icon={File01Icon} size={22} className="text-ink-3" />
          <p className="text-[13px] font-medium text-ink-1">
            Preview unavailable
          </p>
          <p className="text-[12px] text-ink-3">
            This file type ({document.mimeType}) can't be previewed in the
            browser. Download it to view it.
          </p>
        </div>
      );
    }
    if (kind === "text") {
      return (
        <pre className="h-[60vh] w-full overflow-auto rounded-md border border-line bg-surface p-4 text-[12px] leading-relaxed whitespace-pre-wrap break-words text-ink-2">
          {text ?? ""}
        </pre>
      );
    }
    return (
      <div className="max-h-[60vh]">
        {kind === "pdf" ? (
          <iframe
            src={blobUrl ?? undefined}
            title={document.displayName}
            className="h-[60vh] w-full rounded-md border border-line bg-surface"
          />
        ) : (
          <img
            src={blobUrl ?? undefined}
            alt={document.displayName}
            className="max-h-[60vh] w-full rounded-md border border-line bg-surface object-contain"
          />
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-12 truncate">
            {document?.displayName}
          </DialogTitle>
          <DialogDescription>{document?.fileName}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={!blob || loading}
            onClick={download}
          >
            <HugeiconsIcon icon={Download01Icon} size={14} />
            Download
          </Button>
        </div>
        <div className="min-h-[60vh]">{content()}</div>
      </DialogContent>
    </Dialog>
  );
}