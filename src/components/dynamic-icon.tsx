import {
  Brain,
  Container,
  Database,
  Globe,
  Image,
  Layout,
  Monitor,
  MoreHorizontal,
  Palette,
  PenTool,
  Server,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

// 카테고리에서 사용하는 아이콘만 정적 import — 전체 icons 객체 import 방지
const iconMap: Record<string, LucideIcon> = {
  Brain,
  Container,
  Database,
  Figma: PenTool, // Figma 아이콘이 lucide에서 제거됨, PenTool로 대체
  Globe,
  Image,
  Layout,
  Monitor,
  MoreHorizontal,
  Palette,
  PenTool,
  Server,
  Smartphone,
};

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
