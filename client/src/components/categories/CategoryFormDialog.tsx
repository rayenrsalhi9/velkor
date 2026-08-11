import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCategory, updateCategory, ApiError } from "@/lib/api";
import type { Category } from "@/lib/api";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSaved: () => void;
}

export default function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit category" : "New category"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Update the category's name or description."
              : "Create a category to organize documents."}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          key={`${category?.id ?? "new"}:${open}`}
          category={category}
          onSaved={onSaved}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  category,
  onSaved,
  onOpenChange,
}: Omit<CategoryFormDialogProps, "open">) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Enter a name for the category.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setNameError(null);
    try {
      const input = {
        name: trimmedName,
        description: description.trim() || null,
      };
      if (category) await updateCategory(category.id, input);
      else await createCategory(input);
      toast.success(category ? "Category updated" : "Category created", {
        description: input.name,
      });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        err.message.includes("name")
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
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <Label htmlFor="category-name" className="v-label mb-1.5 block">
          Category name
        </Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          placeholder="e.g. Policies"
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
        <Label htmlFor="category-description" className="v-label mb-1.5 block">
          Description
        </Label>
        <Textarea
          id="category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this category for?"
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

      <DialogFooter>
        <DialogClose
          render={
            <Button type="button" variant="outline" disabled={submitting} />
          }
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={submitting}
          className="v-brand-gradient text-white"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : category ? (
            "Save changes"
          ) : (
            "Create category"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
