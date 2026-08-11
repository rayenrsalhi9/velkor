import { useRef, useState, type FormEvent } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import CategoryCombobox from "@/components/documents/CategoryCombobox";
import RoleMultiCombobox from "@/components/documents/RoleMultiCombobox";
import { uploadDocument, ApiError } from "@/lib/api";

interface UploadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function UploadDrawer({
  open,
  onOpenChange,
  onSaved,
}: UploadDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="w-full sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>Upload document</DrawerTitle>
          <DrawerDescription>
            Upload a file and assign it to a category and roles.
          </DrawerDescription>
        </DrawerHeader>
        <UploadForm
          key={`upload:${open}`}
          onSaved={onSaved}
          onOpenChange={onOpenChange}
        />
      </DrawerContent>
    </Drawer>
  );
}

function minifyFileSize(bytes: number): string {
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i++) {
    value /= 1024;
    unit = units[i]!;
  }
  const rounded = value.toFixed(value >= 10 ? 0 : 1);
  return `${rounded.replace(/\.0$/, "")} ${unit}`;
}

function UploadForm({
  onSaved,
  onOpenChange,
}: Omit<UploadDrawerProps, "open">) {
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [assignAllRoles, setAssignAllRoles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (next: File | null) => {
    setFile(next);
    if (next && !displayName) {
      setDisplayName(next.name.replace(/\.[^.]+$/, ""));
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    if (!categoryId) {
      setError("Select a category.");
      return;
    }
    if (roleIds.length === 0 && !assignAllRoles) {
      setError("Assign at least one role, or choose to assign to all roles.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await uploadDocument({
        file,
        displayName: displayName.trim() || undefined,
        categoryId,
        roleIds: assignAllRoles ? [] : roleIds,
        assignAllRoles,
      });
      toast.success("Document uploaded", { description: file.name });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <div>
          <input
            ref={inputRef}
            type="file"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            className="sr-only"
            aria-label="Choose file"
          />
          <Label className="v-label mb-1.5 block">File</Label>
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink-1">
                  {file.name}
                </p>
                <p className="text-[11px] text-ink-3">
                  {minifyFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-md border border-dashed border-line bg-surface px-3 py-8 text-ink-3 transition-colors hover:border-brand hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <FileUp size={20} />
              <span className="text-[13px] font-medium">
                Click to choose a file
              </span>
              <span className="text-[11px]">
                PDF, images, Office docs, TXT, CSV
              </span>
            </button>
          )}
        </div>

        <div>
          <Label htmlFor="upload-displayName" className="v-label mb-1.5 block">
            Display name
          </Label>
          <Input
            id="upload-displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Defaults to the file name"
          />
        </div>

        <div>
          <Label className="v-label mb-1.5 block">Category</Label>
          <CategoryCombobox value={categoryId} onChange={setCategoryId} />
        </div>

        <div>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
            <Checkbox
              checked={assignAllRoles}
              onCheckedChange={() => setAssignAllRoles((v) => !v)}
              aria-label="Assign to all roles"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-ink-1">
                Assign to all roles
              </span>
              <span className="block text-[12px] text-ink-3">
                Every current and future role can see this document.
              </span>
            </span>
          </label>
        </div>

        {!assignAllRoles && (
          <div>
            <Label className="v-label mb-1.5 block">Assign to roles</Label>
            <RoleMultiCombobox value={roleIds} onChange={setRoleIds} />
          </div>
        )}

        {error && (
          <div role="alert">
            <p className="rounded-md border border-danger/25 bg-danger/5 px-3 py-2 text-[12px] font-medium text-danger">
              {error}
            </p>
          </div>
        )}
      </div>

      <DrawerFooter className="flex-row justify-end">
        <DrawerClose
          render={<Button type="button" variant="outline" disabled={submitting} />}
        >
          Cancel
        </DrawerClose>
        <Button
          type="submit"
          disabled={submitting}
          className="v-brand-gradient text-white"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Upload document"
          )}
        </Button>
      </DrawerFooter>
    </form>
  );
}