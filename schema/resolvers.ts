import type { Context } from "../context";
import type {
  AbsencePeriodModel,
  CompanyModel,
  CompanyUserModel,
  CompanyCandidateModel,
  Status,
  State,
} from "./types.ts";

export const resolvers = {
  Query: {
    company: async (
      _: any,
      { companyId }: { companyId: number },
      { api }: Context
    ) => {
      return await api.getCompany(companyId);
    },

    absence: async (
      _: any,
      {
        companyId,
        companyUserId,
        id,
      }: { companyId: number; companyUserId: number; id: number },
      { api }: Context
    ) => {
      return await api.getAbsence(companyId, companyUserId, id);
    },

    absences: async (
      _: any,
      {
        companyId,
        companyUserId,
      }: { companyId: number; companyUserId: number },
      { api }: Context
    ) => {
      return await api.getAbsences(companyId, companyUserId);
    },

    absenceTypes: async (
      _: any,
      { companyId }: { companyId: number },
      { api }: Context
    ) => {
      return await api.getAbsenceTypes(companyId);
    },

    companyUser: async (
      _: any,
      {
        companyId,
        companyUserId,
      }: { companyId: number; companyUserId: number },
      { api }: Context
    ) => {
      return await api.getCompanyUser(companyId, companyUserId);
    },

    candidate: async (
      _: any,
      { companyId, id }: { companyId: number; id: number },
      { api }: Context
    ) => {
      return await api.getCandidate(companyId, id);
    },

    candidates: async (
      _: any,
      {
        companyId,
        filter,
      }: {
        companyId: number;
        filter?: {
          state?: State;
          pipelineId?: number;
          recruitmentManagerId?: number;
        };
      },
      { api }: Context
    ) => {
      return await api.getCandidates(companyId, filter);
    },
  },

  Mutation: {
    createAbsence: async (
      _: any,
      {
        companyId,
        companyUserId,
        input,
      }: { companyId: number; companyUserId: number; input: any },
      { api }: Context
    ) => {
      return await api.createAbsence(companyId, companyUserId, input);
    },

    updateAbsence: async (
      _: any,
      {
        companyId,
        companyUserId,
        id,
        input,
      }: { companyId: number; companyUserId: number; id: number; input: any },
      { api }: Context
    ) => {
      return await api.updateAbsence(companyId, companyUserId, id, input);
    },

    deleteAbsence: async (
      _: any,
      {
        companyId,
        companyUserId,
        id,
      }: { companyId: number; companyUserId: number; id: number },
      { api }: Context
    ) => {
      return await api.deleteAbsence(companyId, companyUserId, id);
    },

    createCandidate: async (
      _: any,
      { companyId, input }: { companyId: number; input: any },
      { api }: Context
    ) => {
      return await api.createCandidate(companyId, input);
    },

    updateCandidate: async (
      _: any,
      { companyId, id, input }: { companyId: number; id: number; input: any },
      { api }: Context
    ) => {
      return await api.updateCandidate(companyId, id, input);
    },

    deleteCandidate: async (
      _: any,
      { companyId, id }: { companyId: number; id: number },
      { api }: Context
    ) => {
      return await api.deleteCandidate(companyId, id);
    },

    updateCandidateState: async (
      _: any,
      { companyId, id, state }: { companyId: number; id: number; state: State },
      { api }: Context
    ) => {
      return await api.updateCandidateState(companyId, id, state);
    },
  },

  Status: {
    ACTIVE: "Active" as Status,
    INACTIVE: "Inactive" as Status,
  },

  CandidateState: {
    OPEN: State.Open,
    WON: State.Won,
    PAUSED: State.Paused,
    REJECTED_BY_CANDIDATE: State.RejectedByCandidate,
    REJECTED_BY_US: State.RejectedByUs,
  },

  Company: {
    // Add any needed field resolvers
  },

  CompanyUser: {
    absences: async (parent: CompanyUserModel, _: any, { api }: Context) => {
      return await api.getAbsences(parent.companyId, parent.id);
    },
  },

  Candidate: {
    events: async (parent: CompanyCandidateModel, _: any, { api }: Context) => {
      return await api.getCandidateEvents(parent.companyId, parent.id);
    },
  },
};
