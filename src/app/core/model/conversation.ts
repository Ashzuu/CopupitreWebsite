export interface Conversation {
  id: string;
  contextType: string;
  contextId: number;
  title: string;
  subtitle?: string;
  otherPartyName: string;
  otherPartyRole: string;
  lastMessage?: string;
  lastMessageAt?: string;
  messageCount: number;
  status?: string;
}
