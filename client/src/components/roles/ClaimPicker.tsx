import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cn";
import type { ClaimDefinition } from "@/lib/api";

interface ClaimPickerProps {
  claims: ClaimDefinition[];
  selected: Set<string>;
  disabled?: boolean;
  onToggle: (key: string) => void;
}

export default function ClaimPicker({
  claims,
  selected,
  disabled = false,
  onToggle,
}: ClaimPickerProps) {
  const groups = new Map<string, ClaimDefinition[]>();
  for (const claim of claims) {
    const list = groups.get(claim.module);
    if (list) list.push(claim);
    else groups.set(claim.module, [claim]);
  }

  const labelFor = (key: string) =>
    claims.find((claim) => claim.key === key)?.label ?? key;

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([module, items]) => (
        <fieldset key={module} disabled={disabled}>
          <legend className="v-label mb-2">{module}</legend>
          <div className="space-y-1">
            {items.map((claim) => {
              const requiredBy = claims.filter(
                (c) =>
                  c.dependsOn?.includes(claim.key) && selected.has(c.key),
              );
              const locked = requiredBy.length > 0;
              return (
                <label
                  key={claim.key}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors duration-150",
                    (disabled || locked)
                      ? "cursor-not-allowed opacity-60"
                      : "hover:bg-surface-2",
                  )}
                >
                  <Checkbox
                    checked={selected.has(claim.key)}
                    onCheckedChange={() => onToggle(claim.key)}
                    disabled={disabled || locked}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink-1">
                      {claim.label}
                    </span>
                    <span className="block text-[12px] text-ink-3">
                      {claim.description}
                    </span>
                    {(claim.dependsOn?.length ?? 0) > 0 && (
                      <span className="block text-[11px] text-brand">
                        Also grants:{" "}
                        {claim.dependsOn!.map(labelFor).join(", ")}
                      </span>
                    )}
                    {locked && (
                      <span className="block text-[11px] text-ink-3">
                        Required by: {requiredBy.map((c) => c.label).join(", ")}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
