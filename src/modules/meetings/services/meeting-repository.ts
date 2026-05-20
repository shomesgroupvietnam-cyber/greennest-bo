import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { Decision, DecisionListFilters, Meeting, MeetingListFilters } from "@/modules/meetings/types";

type MeetingStore = {
  meetings: Meeting[];
  decisions: Decision[];
};

const emptyStore: MeetingStore = {
  meetings: [],
  decisions: []
};

export type MeetingRepository = {
  listMeetings(filters?: MeetingListFilters): Promise<Meeting[]>;
  getMeeting(meetingId: string): Promise<Meeting | undefined>;
  createMeeting(meeting: Meeting): Promise<Meeting>;
  updateMeeting(meetingId: string, patch: Partial<Meeting>): Promise<Meeting>;
  listDecisions(filters?: DecisionListFilters): Promise<Decision[]>;
  getDecision(decisionId: string): Promise<Decision | undefined>;
  createDecision(decision: Decision): Promise<Decision>;
  updateDecision(decisionId: string, patch: Partial<Decision>): Promise<Decision>;
};

export class JsonMeetingRepository implements MeetingRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "meetings-decisions.json")) {}

  async listMeetings(filters: MeetingListFilters = {}) {
    const store = await this.readStore();

    return store.meetings
      .filter((meeting) => !filters.projectId || filters.projectId === "all" || meeting.projectId === filters.projectId)
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
  }

  async getMeeting(meetingId: string) {
    const store = await this.readStore();

    return store.meetings.find((meeting) => meeting.id === meetingId);
  }

  async createMeeting(meeting: Meeting) {
    const store = await this.readStore();
    await this.writeStore({ ...store, meetings: [meeting, ...store.meetings] });

    return meeting;
  }

  async updateMeeting(meetingId: string, patch: Partial<Meeting>) {
    const store = await this.readStore();
    const existingMeeting = store.meetings.find((meeting) => meeting.id === meetingId);

    if (!existingMeeting) {
      throw new Error("KhÃ´ng tÃ¬m tháº¥y cuá»™c há»p.");
    }

    const updatedMeeting = {
      ...existingMeeting,
      ...patch,
      id: existingMeeting.id,
      projectId: existingMeeting.projectId,
      createdAt: existingMeeting.createdAt
    };

    await this.writeStore({
      ...store,
      meetings: store.meetings.map((meeting) => (meeting.id === meetingId ? updatedMeeting : meeting))
    });

    return updatedMeeting;
  }

  async listDecisions(filters: DecisionListFilters = {}) {
    const store = await this.readStore();

    return store.decisions
      .filter((decision) => !filters.meetingId || decision.meetingId === filters.meetingId)
      .filter((decision) => !filters.projectId || filters.projectId === "all" || decision.projectId === filters.projectId)
      .filter((decision) => !filters.ownerId || filters.ownerId === "all" || decision.ownerId === filters.ownerId)
      .filter((decision) => !filters.status || filters.status === "all" || decision.status === filters.status)
      .sort((a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"));
  }

  async getDecision(decisionId: string) {
    const store = await this.readStore();

    return store.decisions.find((decision) => decision.id === decisionId);
  }

  async createDecision(decision: Decision) {
    const store = await this.readStore();
    await this.writeStore({ ...store, decisions: [decision, ...store.decisions] });

    return decision;
  }

  async updateDecision(decisionId: string, patch: Partial<Decision>) {
    const store = await this.readStore();
    const existingDecision = store.decisions.find((decision) => decision.id === decisionId);

    if (!existingDecision) {
      throw new Error("KhÃ´ng tÃ¬m tháº¥y quyáº¿t Ä‘á»‹nh/action item.");
    }

    const updatedDecision = {
      ...existingDecision,
      ...patch,
      id: existingDecision.id,
      meetingId: existingDecision.meetingId,
      projectId: existingDecision.projectId,
      createdAt: existingDecision.createdAt
    };

    await this.writeStore({
      ...store,
      decisions: store.decisions.map((decision) => (decision.id === decisionId ? updatedDecision : decision))
    });

    return updatedDecision;
  }

  private async readStore(): Promise<MeetingStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<MeetingStore>;

      return {
        meetings: parsed.meetings ?? [],
        decisions: parsed.decisions ?? []
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: MeetingStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type MeetingRow = {
  id: string;
  project_id: string;
  title: string;
  meeting_date: string;
  summary: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type DecisionRow = {
  id: string;
  meeting_id: string | null;
  project_id: string;
  decision_text: string;
  owner_id: string | null;
  due_date: string | null;
  status: Decision["status"];
  task_id?: string | null;
  created_at: string;
  updated_at: string;
};

function toMeeting(row: MeetingRow): Meeting {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    meetingDate: row.meeting_date,
    summary: row.summary ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toDecision(row: DecisionRow): Decision {
  return {
    id: row.id,
    meetingId: row.meeting_id ?? undefined,
    projectId: row.project_id,
    decisionText: row.decision_text,
    ownerId: row.owner_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    status: row.status,
    taskId: row.task_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function meetingToRow(meeting: Meeting) {
  return {
    id: meeting.id,
    project_id: meeting.projectId,
    title: meeting.title,
    meeting_date: meeting.meetingDate,
    summary: meeting.summary ?? null,
    created_by: meeting.createdBy ?? null,
    created_at: meeting.createdAt,
    updated_at: meeting.updatedAt
  };
}

function decisionToRow(decision: Decision) {
  return {
    id: decision.id,
    meeting_id: decision.meetingId ?? null,
    project_id: decision.projectId,
    decision_text: decision.decisionText,
    owner_id: decision.ownerId ?? null,
    due_date: decision.dueDate ?? null,
    status: decision.status,
    task_id: decision.taskId ?? null,
    created_at: decision.createdAt,
    updated_at: decision.updatedAt
  };
}

function meetingPatchToRow(patch: Partial<Meeting>) {
  return {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.meetingDate !== undefined ? { meeting_date: patch.meetingDate } : {}),
    ...(patch.summary !== undefined ? { summary: patch.summary ?? null } : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {})
  };
}

function decisionPatchToRow(patch: Partial<Decision>) {
  return {
    ...(patch.decisionText !== undefined ? { decision_text: patch.decisionText } : {}),
    ...(patch.ownerId !== undefined ? { owner_id: patch.ownerId ?? null } : {}),
    ...(patch.dueDate !== undefined ? { due_date: patch.dueDate ?? null } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.taskId !== undefined ? { task_id: patch.taskId ?? null } : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {})
  };
}

export class SupabaseMeetingRepository implements MeetingRepository {
  async listMeetings(filters: MeetingListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("meetings").select("*");

    if (filters.projectId && filters.projectId !== "all") {
      query = query.eq("project_id", filters.projectId);
    }

    const { data, error } = await query.order("meeting_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as MeetingRow[]).map(toMeeting);
  }

  async getMeeting(meetingId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("meetings").select("*").eq("id", meetingId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toMeeting(data as MeetingRow) : undefined;
  }

  async createMeeting(meeting: Meeting) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("meetings").insert(meetingToRow(meeting)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toMeeting(data as MeetingRow);
  }

  async updateMeeting(meetingId: string, patch: Partial<Meeting>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("meetings").update(meetingPatchToRow(patch)).eq("id", meetingId).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toMeeting(data as MeetingRow);
  }

  async listDecisions(filters: DecisionListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("decisions").select("*");

    if (filters.meetingId) {
      query = query.eq("meeting_id", filters.meetingId);
    }

    if (filters.projectId && filters.projectId !== "all") {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.ownerId && filters.ownerId !== "all") {
      query = query.eq("owner_id", filters.ownerId);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DecisionRow[]).map(toDecision);
  }

  async getDecision(decisionId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("decisions").select("*").eq("id", decisionId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toDecision(data as DecisionRow) : undefined;
  }

  async createDecision(decision: Decision) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("decisions").insert(decisionToRow(decision)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toDecision(data as DecisionRow);
  }

  async updateDecision(decisionId: string, patch: Partial<Decision>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("decisions").update(decisionPatchToRow(patch)).eq("id", decisionId).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toDecision(data as DecisionRow);
  }
}

export const jsonMeetingRepository = new JsonMeetingRepository();
export const supabaseMeetingRepository = new SupabaseMeetingRepository();
export const meetingRepository = selectRepository<MeetingRepository>({
  mock: jsonMeetingRepository,
  supabase: supabaseMeetingRepository
});
