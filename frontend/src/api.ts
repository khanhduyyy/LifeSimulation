import { Character, Event, SelectResult } from './types';

const API_BASE = '/api/v1';
const ADMIN_BASE = '/api/admin';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // === Game API ===

  async createCharacter(): Promise<Character> {
    const res = await fetch(`${API_BASE}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Character>(res);
  },

  async getCharacter(id: number): Promise<Character> {
    const res = await fetch(`${API_BASE}/characters/${id}`);
    return handleResponse<Character>(res);
  },

  async getEvent(characterId: number, nextEventId?: number): Promise<Event> {
    let url = `${API_BASE}/events?character_id=${characterId}`;
    if (nextEventId) url += `&next_event_id=${nextEventId}`;
    const res = await fetch(url);
    return handleResponse<Event>(res);
  },

  async selectChoice(choiceId: number, characterId: number): Promise<SelectResult> {
    const res = await fetch(`${API_BASE}/choices/${choiceId}/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: characterId }),
    });
    return handleResponse<SelectResult>(res);
  },

  async updateCharacter(id: number, updates: Partial<Character>): Promise<Character> {
    const res = await fetch(`${API_BASE}/characters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: updates }),
    });
    return handleResponse<Character>(res);
  },

  // === Admin API ===

  async getEvents(): Promise<Event[]> {
    const res = await fetch(`${ADMIN_BASE}/events`);
    return handleResponse<Event[]>(res);
  },

  async createEvent(data: Partial<Event>): Promise<Event> {
    const res = await fetch(`${ADMIN_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: data }),
    });
    return handleResponse<Event>(res);
  },

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const res = await fetch(`${ADMIN_BASE}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: data }),
    });
    return handleResponse<Event>(res);
  },

  async deleteEvent(id: number): Promise<void> {
    const res = await fetch(`${ADMIN_BASE}/events/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete event');
  },

  async createChoice(eventId: number, data: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${ADMIN_BASE}/events/${eventId}/choices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice: data }),
    });
    return handleResponse(res);
  },

  async updateChoice(eventId: number, choiceId: number, data: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${ADMIN_BASE}/events/${eventId}/choices/${choiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice: data }),
    });
    return handleResponse(res);
  },

  async deleteChoice(eventId: number, choiceId: number): Promise<void> {
    const res = await fetch(`${ADMIN_BASE}/events/${eventId}/choices/${choiceId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete choice');
  },

  async createOutcome(eventId: number, choiceId: number, data: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${ADMIN_BASE}/events/${eventId}/choices/${choiceId}/outcomes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: data }),
    });
    return handleResponse(res);
  },

  async updateOutcome(eventId: number, choiceId: number, outcomeId: number, data: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${ADMIN_BASE}/events/${eventId}/choices/${choiceId}/outcomes/${outcomeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: data }),
    });
    return handleResponse(res);
  },

  async deleteOutcome(eventId: number, choiceId: number, outcomeId: number): Promise<void> {
    const res = await fetch(`${ADMIN_BASE}/events/${eventId}/choices/${choiceId}/outcomes/${outcomeId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete outcome');
  },
};
