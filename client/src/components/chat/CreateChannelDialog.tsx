import { useState, type FormEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LoadingIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createChannel, ApiError } from "@/lib/api";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (channelId: string) => void;
}

export default function CreateChannelDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateChannelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Enter a channel name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const channel = await createChannel({
        name: trimmed,
        description: description.trim() || null,
      });
      toast.success("Channel created", { description: channel.name });
      setName("");
      setDescription("");
      onOpenChange(false);
      onCreated(channel.id);
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        err.message.toLowerCase().includes("name")
      ) {
        setNameError(err.message);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="w-full sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>New channel</DrawerTitle>
        </DrawerHeader>
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div>
              <Label htmlFor="channel-name" className="v-label mb-1.5 block">
                Channel name
              </Label>
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                placeholder="e.g. Operations"
                aria-invalid={!!nameError}
                className={nameError ? "border-danger" : ""}
              />
              {nameError && (
                <p role="alert" className="mt-1.5 text-[12px] text-danger">
                  {nameError}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="channel-description"
                className="v-label mb-1.5 block"
              >
                Description
              </Label>
              <Textarea
                id="channel-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this channel for?"
                rows={2}
              />
            </div>

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
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <HugeiconsIcon icon={LoadingIcon} size={16} className="animate-spin" />
              ) : (
                "Create channel"
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}