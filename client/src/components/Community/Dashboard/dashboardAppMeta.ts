import type { LucideIcon } from 'lucide-react';
import {
  MessagesSquare,
  GraduationCap,
  FileText,
  FolderOpen,
  Megaphone,
  Calendar,
} from 'lucide-react';
import { COMMUNITY_APP_IDS } from '../../../constants/communityApps';

export function getDashboardAppLabel(appId: string, t: (key: string) => string): string {
  switch (appId) {
    case COMMUNITY_APP_IDS.CHAT:
      return t('community.appKindChat');
    case COMMUNITY_APP_IDS.COURSES:
      return t('community.appKindCourses');
    case COMMUNITY_APP_IDS.CONTENT:
      return t('community.appKindContent');
    case COMMUNITY_APP_IDS.FILES:
      return t('community.appKindFiles');
    case COMMUNITY_APP_IDS.ANNOUNCEMENTS:
      return t('community.appKindAnnouncements');
    case COMMUNITY_APP_IDS.EVENTS:
      return t('community.appKindEvents');
    default:
      return appId;
  }
}

/** @deprecated Use getDashboardAppLabel(appId, t) */
export function dashboardAppLabel(appId: string): string {
  switch (appId) {
    case COMMUNITY_APP_IDS.CHAT:
      return 'Chat';
    case COMMUNITY_APP_IDS.COURSES:
      return 'Courses';
    case COMMUNITY_APP_IDS.CONTENT:
      return 'Content';
    case COMMUNITY_APP_IDS.FILES:
      return 'Files';
    case COMMUNITY_APP_IDS.ANNOUNCEMENTS:
      return 'Announcements';
    case COMMUNITY_APP_IDS.EVENTS:
      return 'Events';
    default:
      return appId;
  }
}

export function dashboardAppIcon(appId: string): LucideIcon {
  switch (appId) {
    case COMMUNITY_APP_IDS.CHAT:
      return MessagesSquare;
    case COMMUNITY_APP_IDS.COURSES:
      return GraduationCap;
    case COMMUNITY_APP_IDS.CONTENT:
      return FileText;
    case COMMUNITY_APP_IDS.FILES:
      return FolderOpen;
    case COMMUNITY_APP_IDS.ANNOUNCEMENTS:
      return Megaphone;
    case COMMUNITY_APP_IDS.EVENTS:
      return Calendar;
    default:
      return FileText;
  }
}
