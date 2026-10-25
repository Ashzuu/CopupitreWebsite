export interface ChatMessage {
  id: number;
  contextType: string;
  contextId: number;
  senderUsername: string;
  senderFullName: string;
  senderRole: string;
  isMe: boolean;
  content: string;
  createdAt: string;
}
