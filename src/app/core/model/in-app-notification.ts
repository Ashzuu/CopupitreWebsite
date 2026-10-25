export interface InAppNotification {
  id: number;
  type: string;
  title: string;
  content: string;
  link?: string;
  contextType?: string;
  contextId?: number;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
}
