import { Router, type Request, type Response } from 'express';
import type { TaskEntity } from '../../types.js';
import { ai, generateWithFallback } from '../gemini.js';
import { broadcastWorldUpdate } from '../sse.js';
import { getWorldState, mutateWorldState } from '../state.js';
import { aiRateLimiter, requireApiKey } from '../security.js';
import { createTaskSchema, updateTaskSchema, validateBody, validateIdParam } from '../validation.js';

export const tasksRouter = Router();

// POST create task
tasksRouter.post('/tasks', requireApiKey, validateBody(createTaskSchema), (req: Request, res: Response) => {
  const { title, description, category, priority, linkedLoreId, linkedLoreName } = req.body;

  const newTask: TaskEntity = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title,
    description,
    category,
    priority,
    status: 'todo',
    linkedLoreId,
    linkedLoreName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  mutateWorldState(state => {
    state.tasks.unshift(newTask);
  });

  broadcastWorldUpdate('TASK_CREATED', `New task created: "${title}"`, req.headers['x-device-id']?.toString());
  res.json({ success: true, task: newTask, worldState: getWorldState() });
});

// PUT update task
tasksRouter.put('/tasks/:id', requireApiKey, validateIdParam('id'), validateBody(updateTaskSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const worldState = getWorldState();
  const index = worldState.tasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const current = worldState.tasks[index];
  const updated: TaskEntity = {
    ...current,
    ...req.body,
    id: current.id,
    updatedAt: Date.now(),
  };

  mutateWorldState(state => {
    state.tasks[index] = updated;
  });

  broadcastWorldUpdate('TASK_UPDATED', `Task updated: "${updated.title}" (${updated.status})`, req.headers['x-device-id']?.toString());
  res.json({ success: true, task: updated, worldState: getWorldState() });
});

// DELETE task
tasksRouter.delete('/tasks/:id', requireApiKey, validateIdParam('id'), (req: Request, res: Response) => {
  const { id } = req.params;
  const worldState = getWorldState();
  const task = worldState.tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  mutateWorldState(state => {
    state.tasks = state.tasks.filter(t => t.id !== id);
  });

  broadcastWorldUpdate('TASK_DELETED', `Task deleted: "${task.title}"`, req.headers['x-device-id']?.toString());
  res.json({ success: true, worldState: getWorldState() });
});

// POST AI Task Suggester
tasksRouter.post('/tasks/ai-suggest', requireApiKey, aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const worldState = getWorldState();
    let suggestedTasks: Array<{ title: string; description: string; category: string; priority: string; linkedLoreId?: string; linkedLoreName?: string }> = [];

    if (ai) {
      const summaryList = worldState.entities.map(e => ({ id: e.id, name: e.name, type: e.type, summary: e.summary }));
      const prompt = `You are an assistant for a Fantasy Author and Tabletop RPG Game Master.
Based on the current world:
World Name: ${worldState.seed.worldName}
Genre: ${worldState.seed.genre}
Existing Elements:
${JSON.stringify(summaryList, null, 2)}

Suggest 3 to 4 actionable, exciting worldbuilding, quest preparation, or lore expansion tasks that the creator should work on next.
Return JSON format:
[
  {
    "title": string (action-oriented),
    "description": string (clear instructions),
    "category": "worldbuilding" | "quest" | "campaign_prep" | "lore_expansion",
    "priority": "high" | "medium" | "low",
    "linkedLoreId": string (or null if general),
    "linkedLoreName": string (or null)
  }
]`;

      const responseText = await generateWithFallback({ contents: prompt, config: { responseMimeType: 'application/json' } });

      if (responseText) {
        try {
          suggestedTasks = JSON.parse(responseText);
        } catch {
          suggestedTasks = [];
        }
      }
    }

    if (!suggestedTasks || suggestedTasks.length === 0) {
      suggestedTasks = [
        {
          title: `Draft local flora and fauna of ${worldState.entities[0]?.name || 'the realm'}`,
          description: 'Detail 3 dangerous beasts and 2 medicinal herbs for wilderness encounters.',
          category: 'worldbuilding',
          priority: 'medium',
          linkedLoreId: worldState.entities[0]?.id,
          linkedLoreName: worldState.entities[0]?.name,
        },
        {
          title: 'Design Session 1 Boss Encounter',
          description: 'Prepare stat blocks, battlemap terrain hazards, and phase transitions.',
          category: 'campaign_prep',
          priority: 'high',
        },
      ];
    }

    const created: TaskEntity[] = suggestedTasks.map((t, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      title: t.title,
      description: t.description,
      category: (t.category as any) || 'worldbuilding',
      priority: (t.priority as any) || 'medium',
      status: 'todo',
      linkedLoreId: t.linkedLoreId || undefined,
      linkedLoreName: t.linkedLoreName || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    mutateWorldState(state => {
      state.tasks.unshift(...created);
    });

    broadcastWorldUpdate('TASKS_SUGGESTED', `AI suggested ${created.length} new creative tasks!`, req.headers['x-device-id']?.toString());
    res.json({ success: true, newTasks: created, worldState: getWorldState() });
  } catch (err: any) {
    console.error('Error suggesting tasks:', err);
    res.status(500).json({ error: err.message || 'Failed to suggest tasks' });
  }
});
