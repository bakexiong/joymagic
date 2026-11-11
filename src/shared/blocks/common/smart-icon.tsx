import type { ComponentType } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  Ban,
  Briefcase,
  Camera,
  CheckCircle2,
  Clapperboard,
  Coins,
  Cpu,
  CreditCard,
  Crosshair,
  Eraser,
  Expand,
  FileUp,
  Film,
  FolderOpen,
  Frame,
  GalleryHorizontal,
  Gamepad2,
  Globe,
  Grid2x2,
  Highlighter,
  House,
  Image,
  ImageIcon,
  Images,
  Languages,
  Layers,
  LayoutDashboard,
  LayoutPanelTop,
  Lightbulb,
  Maximize2,
  Menu,
  MessageCircleMore,
  Move,
  Music,
  Newspaper,
  Orbit,
  Paintbrush,
  Palette,
  Pencil,
  PencilLine,
  Plus,
  Repeat2,
  ScanFace,
  ScanSearch,
  ScissorsLineDashed,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Shuffle,
  Sliders,
  Smile,
  Sparkles,
  Target,
  TimerReset,
  Type,
  User,
  Users,
  Video,
  Volume2,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiLockPasswordLine,
  RiQuestionLine,
  RiRefreshLine,
} from "react-icons/ri";

type IconComponent = ComponentType<{
  size?: number;
  className?: string;
  [key: string]: any;
}>;

function detectIconLibrary(name: string): "ri" | "lucide" {
  if (name && name.startsWith("Ri")) {
    return "ri";
  }

  return "lucide";
}

const lucideIcons: Record<string, IconComponent> = {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  Ban,
  Briefcase,
  Camera,
  CheckCircle2,
  Clapperboard,
  Coins,
  Cpu,
  CreditCard,
  Crosshair,
  Eraser,
  Expand,
  FileUp,
  Film,
  FolderOpen,
  Frame,
  GalleryHorizontal,
  Gamepad2,
  Globe,
  Grid2x2,
  Highlighter,
  House,
  Image,
  ImageIcon,
  Images,
  Languages,
  Layers,
  LayoutDashboard,
  LayoutPanelTop,
  Lightbulb,
  Maximize2,
  Menu,
  MessageCircleMore,
  Move,
  Music,
  Newspaper,
  Orbit,
  Paintbrush,
  Palette,
  Pencil,
  PencilLine,
  Plus,
  Repeat2,
  ScanFace,
  ScanSearch,
  ScissorsLineDashed,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Shuffle,
  Sliders,
  Smile,
  Sparkles,
  Target,
  TimerReset,
  Type,
  User,
  Users,
  Video,
  Volume2,
  Wand2,
  Workflow,
  Zap,
};

const remixIcons: Record<string, IconComponent> = {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiLockPasswordLine,
  RiQuestionLine,
  RiRefreshLine,
};

export function SmartIcon({
  name,
  size = 24,
  className,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
  [key: string]: any;
}) {
  const library = detectIconLibrary(name);

  let IconComponent: IconComponent | undefined;

  if (library === "ri") {
    IconComponent = remixIcons[name];

    if (!IconComponent) {
      console.warn(
        `Icon "${name}" not found in react-icons/ri, using fallback`,
      );
      IconComponent = RiQuestionLine;
    }
  } else {
    IconComponent = lucideIcons[name];

    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in lucide-react, using fallback`);
      IconComponent = Search;
    }
  }

  return <IconComponent size={size} className={className} {...props} />;
}
