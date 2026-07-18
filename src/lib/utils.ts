// Standard shadcn/ui helper: combines conditional class names (clsx) and
// resolves conflicting Tailwind utility classes (twMerge), e.g.
// cn("p-2", condition && "p-4") correctly keeps only "p-4".
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
