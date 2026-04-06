export type NoteColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange' | 'purple' | 'teal' | 'default';

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
  isDeleted?: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  hasChecklist?: boolean;
  hasCode?: boolean;
  isVoiceNote?: boolean;
  voiceDuration?: number;
}

export const mockNotes: Note[] = [
  {
    id: '1', title: 'Project Architecture Notes',
    content: 'Design the microservices architecture for the new platform. Consider using event-driven patterns with message queues for async communication between services.',
    color: 'blue', isPinned: true, isArchived: false, isDeleted: false,
    tags: [{ id: 't1', name: 'architecture', isAI: true }, { id: 't2', name: 'microservices', isAI: true }],
    createdAt: '2026-04-05T10:00:00Z', updatedAt: '2026-04-05T14:30:00Z',
  },
  {
    id: '2', title: 'Weekly Meeting Agenda',
    content: '1. Sprint review\n2. Roadmap updates\n3. Resource allocation\n4. Q2 planning kickoff\n5. Design system review',
    color: 'yellow', isPinned: true, isArchived: false, isDeleted: false,
    tags: [{ id: 't3', name: 'meetings', isAI: false }, { id: 't4', name: 'planning', isAI: true }],
    createdAt: '2026-04-04T09:00:00Z', updatedAt: '2026-04-04T09:00:00Z', hasChecklist: true,
  },
  {
    id: '3', title: 'API Authentication Flow',
    content: 'Implement OAuth 2.0 with PKCE flow for the mobile app. Use refresh token rotation for enhanced security. Consider adding biometric auth as a second factor.',
    color: 'green', isPinned: false, isArchived: false, isDeleted: false,
    tags: [{ id: 't5', name: 'security', isAI: true }, { id: 't6', name: 'API', isAI: false }, { id: 't7', name: 'authentication', isAI: true }],
    createdAt: '2026-04-03T15:00:00Z', updatedAt: '2026-04-05T11:00:00Z',
  },
  {
    id: '4', title: 'Design Inspiration',
    content: 'Glassmorphism with subtle grain textures. Dark mode first. Fluid animations. Reference: Linear, Raycast, Arc Browser.',
    color: 'purple', isPinned: false, isArchived: false, isDeleted: false,
    tags: [{ id: 't8', name: 'design', isAI: true }, { id: 't9', name: 'UI/UX', isAI: false }],
    createdAt: '2026-04-02T12:00:00Z', updatedAt: '2026-04-02T12:00:00Z',
  },
  {
    id: '5', title: 'Database Schema Draft',
    content: 'CREATE TABLE notes (\n  id UUID PRIMARY KEY,\n  user_id UUID REFERENCES users(id),\n  title TEXT,\n  content JSONB,\n  embedding vector(1536)\n);',
    color: 'teal', isPinned: false, isArchived: false, isDeleted: false,
    tags: [{ id: 't10', name: 'database', isAI: true }, { id: 't11', name: 'SQL', isAI: false }],
    createdAt: '2026-04-01T08:00:00Z', updatedAt: '2026-04-03T16:00:00Z', hasCode: true,
  },
  {
    id: '6', title: 'Reading List',
    content: '- Designing Data-Intensive Applications\n- System Design Interview\n- Clean Architecture\n- The Pragmatic Programmer',
    color: 'orange', isPinned: false, isArchived: false, isDeleted: false,
    tags: [{ id: 't12', name: 'books', isAI: false }, { id: 't13', name: 'learning', isAI: true }],
    createdAt: '2026-03-30T10:00:00Z', updatedAt: '2026-03-30T10:00:00Z', hasChecklist: true,
  },
  {
    id: '7', title: 'Performance Optimization Ideas',
    content: 'Implement virtual scrolling for large note lists. Use Web Workers for embedding generation. Consider edge caching for frequently accessed notes.',
    color: 'pink', isPinned: false, isArchived: false, isDeleted: false,
    tags: [{ id: 't14', name: 'performance', isAI: true }, { id: 't15', name: 'optimization', isAI: true }],
    createdAt: '2026-03-28T14:00:00Z', updatedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: '8', title: 'Quick Thought',
    content: 'What if we added a "thinking" mode where AI continuously suggests connections as you type?',
    color: 'default', isPinned: false, isArchived: false, isDeleted: false,
    tags: [{ id: 't16', name: 'idea', isAI: true }],
    createdAt: '2026-04-05T22:00:00Z', updatedAt: '2026-04-05T22:00:00Z',
  },
  {
    id: '9', title: 'Deployment Checklist',
    content: '- Set up CI/CD pipeline\n- Configure environment variables\n- Run load tests\n- Set up monitoring & alerting\n- Database migration scripts',
    color: 'green', isPinned: false, isArchived: false, isDeleted: false,
    tags: [{ id: 't17', name: 'devops', isAI: true }, { id: 't18', name: 'deployment', isAI: false }],
    createdAt: '2026-03-25T11:00:00Z', updatedAt: '2026-04-04T17:00:00Z', hasChecklist: true,
  },
];
