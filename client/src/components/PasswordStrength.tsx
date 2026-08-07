import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export default function PasswordStrength({ password }: { password: string }) {
  const hasLength = password.length >= 8;
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return (
    <ul className="mt-2 flex flex-col gap-1 text-[12px]">
      {[
        { ok: hasLength, label: "At least 8 characters" },
        { ok: hasDigit, label: "Contains a number" },
        { ok: hasSpecial, label: "Contains a special character" },
      ].map((item) => (
        <li
          key={item.label}
          className={cn(
            "flex items-center gap-1.5",
            item.ok ? "text-ink-1" : "text-ink-3",
          )}
        >
          {item.ok ? (
            <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-brand text-white">
              <Check size={9} strokeWidth={3} />
            </span>
          ) : (
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-ink-3/50" />
          )}
          {item.label}
        </li>
      ))}
    </ul>
  );
}
