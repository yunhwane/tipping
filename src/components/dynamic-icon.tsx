import { icons, type LucideIcon } from "lucide-react";

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  const Icon: LucideIcon | undefined = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon className={className} />;
}
