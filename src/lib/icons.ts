import {
  Zap, UserCheck, RefreshCw, PauseCircle, XCircle, FileText, Send, FileCheck,
  CreditCard, CheckCircle, FolderCheck, AlertTriangle, Phone, Award, Clock,
  Mail, MessageSquare, ShieldCheck, Star, Archive, Circle, Gavel, Scale, ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  "zap": Zap, "user-check": UserCheck, "refresh-cw": RefreshCw,
  "pause-circle": PauseCircle, "x-circle": XCircle, "file-text": FileText,
  "send": Send, "file-check": FileCheck, "credit-card": CreditCard,
  "check-circle": CheckCircle, "folder-check": FolderCheck,
  "alert-triangle": AlertTriangle, "phone": Phone, "award": Award,
  "clock": Clock, "mail": Mail, "message-square": MessageSquare,
  "shield-check": ShieldCheck, "star": Star, "archive": Archive,
  "circle": Circle, "gavel": Gavel, "scale": Scale, "shield-alert": ShieldAlert,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function getStatusIcon(iconName?: string | null): LucideIcon {
  return ICON_MAP[iconName || "circle"] || Circle;
}
