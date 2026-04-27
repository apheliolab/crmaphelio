"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createLeadId,
  leadStatusOptions,
  mockLeads,
  type Lead,
  type LeadInput,
  type LeadMeeting,
  type LeadStatus,
  type LeadTimelineItem,
} from "@/lib/crm";

const STORAGE_KEY = "aphelio-crm-leads";

type CrmContextValue = {
  hydrated: boolean;
  leads: Lead[];
  addLead: (input: LeadInput) => string;
  updateLead: (id: string, updates: Partial<LeadInput>) => void;
  deleteLead: (id: string) => void;
  getLeadById: (id: string) => Lead | undefined;
  setLeadStatus: (id: string, status: LeadStatus, note?: string) => void;
  addLeadNote: (id: string, note: string) => void;
  scheduleLeadMeeting: (id: string, meeting: LeadMeeting) => void;
};

const CrmContext = createContext<CrmContextValue | null>(null);

function createTimelineItem(item: Omit<LeadTimelineItem, "id">): LeadTimelineItem {
  return {
    id: `timeline-${Math.random().toString(36).slice(2, 10)}`,
    ...item,
  };
}

function readLeads() {
  if (typeof window === "undefined") return mockLeads;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return mockLeads;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return mockLeads;
    return parsed as Lead[];
  } catch {
    return mockLeads;
  }
}

function appendTimeline(lead: Lead, item: Omit<LeadTimelineItem, "id">) {
  return {
    ...lead,
    updatedAt: item.createdAt,
    timeline: [createTimelineItem(item), ...lead.timeline],
  };
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLeads(readLeads());
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [hydrated, leads]);

  const value = useMemo<CrmContextValue>(() => {
    function addLead(input: LeadInput) {
      const createdAt = new Date().toISOString();
      const id = createLeadId();
      const lead: Lead = {
        ...input,
        id,
        createdAt,
        updatedAt: createdAt,
        nextMeeting: null,
        timeline: [
          createTimelineItem({
            type: "lead_created",
            title: "Lead criado",
            description: `Lead cadastrado com interesse em ${input.interest}.`,
            createdAt,
          }),
        ],
      };

      setLeads((current) => [lead, ...current]);
      return id;
    }

    function updateLead(id: string, updates: Partial<LeadInput>) {
      setLeads((current) =>
        current.map((lead) => {
          if (lead.id !== id) return lead;

          const nextStatus = updates.status;
          const currentTime = new Date().toISOString();
          let nextLead: Lead = {
            ...lead,
            ...updates,
            updatedAt: currentTime,
          };

          if (nextStatus && nextStatus !== lead.status && leadStatusOptions.includes(nextStatus)) {
            nextLead = appendTimeline(nextLead, {
              type: "status_changed",
              title: "Status alterado",
              description: `Lead movido de ${lead.status} para ${nextStatus}.`,
              createdAt: currentTime,
            });
          }

          return nextLead;
        }),
      );
    }

    function deleteLead(id: string) {
      setLeads((current) => current.filter((lead) => lead.id !== id));
    }

    function getLeadById(id: string) {
      return leads.find((lead) => lead.id === id);
    }

    function setLeadStatus(id: string, status: LeadStatus, note?: string) {
      setLeads((current) =>
        current.map((lead) => {
          if (lead.id !== id || lead.status === status) return lead;

          const changedAt = new Date().toISOString();
          const nextLead = appendTimeline(
            {
              ...lead,
              status,
            },
            {
              type: "status_changed",
              title: "Status alterado",
              description: note?.trim() || `Lead movido de ${lead.status} para ${status}.`,
              createdAt: changedAt,
            },
          );

          return nextLead;
        }),
      );
    }

    function addLeadNote(id: string, note: string) {
      const trimmed = note.trim();
      if (!trimmed) return;

      setLeads((current) =>
        current.map((lead) => {
          if (lead.id !== id) return lead;

          return appendTimeline(lead, {
            type: "note_added",
            title: "Observacao adicionada",
            description: trimmed,
            createdAt: new Date().toISOString(),
          });
        }),
      );
    }

    function scheduleLeadMeeting(id: string, meeting: LeadMeeting) {
      setLeads((current) =>
        current.map((lead) => {
          if (lead.id !== id) return lead;

          const scheduledAt = new Date().toISOString();
          const nextStatus = lead.status === "Ganho" || lead.status === "Perdido" ? lead.status : "Call agendada";
          let nextLead: Lead = {
            ...lead,
            nextMeeting: meeting,
            status: nextStatus,
            updatedAt: scheduledAt,
          };

          nextLead = appendTimeline(nextLead, {
            type: "meeting_scheduled",
            title: "Reuniao agendada",
            description: `Reuniao marcada para ${meeting.channel} em ${meeting.location} com ${meeting.owner}.`,
            createdAt: scheduledAt,
          });

          if (lead.status !== nextStatus) {
            nextLead = appendTimeline(nextLead, {
              type: "status_changed",
              title: "Status alterado",
              description: `Lead movido de ${lead.status} para ${nextStatus}.`,
              createdAt: scheduledAt,
            });
          }

          return nextLead;
        }),
      );
    }

    return {
      hydrated,
      leads,
      addLead,
      updateLead,
      deleteLead,
      getLeadById,
      setLeadStatus,
      addLeadNote,
      scheduleLeadMeeting,
    };
  }, [hydrated, leads]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrmStore() {
  const context = useContext(CrmContext);

  if (!context) {
    throw new Error("useCrmStore must be used within CrmProvider");
  }

  return context;
}
