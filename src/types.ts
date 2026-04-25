export type NoteColor = 'default' | 'yellow' | 'green' | 'blue' | 'pink' | 'orange' | 'purple' | 'teal';

export interface Tag {
  id: string;
  name: string;
  isAI: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  isVoiceNote: boolean;
  voiceDuration?: number;
  audioUrl?: string | null;
  reminderAt?: string | null;
  summary?: string | null;
}
