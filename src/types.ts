export type LoreType = 'region' | 'faction' | 'character' | 'event';

export interface LoreRelationship {
  targetId: string;
  targetName: string;
  relation: string;
  type: 'ally' | 'rival' | 'located_in' | 'ruler_of' | 'historical_link' | 'member_of' | 'neutral';
}

export interface LoreEntity {
  id: string;
  type: LoreType;
  name: string;
  summary: string;
  details: string;
  parentId?: string;
  parentName?: string;
  expansionType?: string;
  tags: string[];
  relationships: LoreRelationship[];
  metadata: {
    // For region
    climate?: string;
    terrain?: string;
    hazards?: string;
    landmark?: string;
    // For faction
    ideology?: string;
    leader?: string;
    influenceLevel?: 'Minor' | 'Influential' | 'Dominant' | 'Declining';
    rivalFaction?: string;
    // For character
    role?: string;
    allegiance?: string;
    motivation?: string;
    secretFlaw?: string;
    // For event
    yearOrEra?: string;
    orderIndex?: number;
    impact?: string;
    outcome?: string;
    note?: string;
    notes?: string;
    [key: string]: any;
  };
  createdAt: number;
  updatedAt: number;
}

export type ConsistencyIssueType =
  | 'direct_contradiction'
  | 'timeline_paradox'
  | 'tonal_mismatch'
  | 'geographic_impossibility';

export interface ConsistencyIssue {
  id: string;
  targetEntityId: string;
  targetEntityName: string;
  conflictingEntityId?: string;
  conflictingEntityName?: string;
  type: ConsistencyIssueType;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  suggestedFix: string;
  resolved: boolean;
  detectedAt: number;
}

export interface WorldSeed {
  worldName: string;
  genre: string;
  tone: string;
  startingConcept: string;
  createdAt: number;
}

export type TaskCategory = 'worldbuilding' | 'quest' | 'campaign_prep' | 'consistency_fix' | 'lore_expansion';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface TaskEntity {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  linkedLoreId?: string;
  linkedLoreName?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorldState {
  seed: WorldSeed;
  entities: LoreEntity[];
  consistencyIssues: ConsistencyIssue[];
  tasks: TaskEntity[];
  version: number;
  lastSyncTimestamp: number;
}
