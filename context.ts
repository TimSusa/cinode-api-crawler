import type {
  AbsencePeriodModel,
  AbsenceTypeModel,
  CompanyModel,
  CompanyUserModel,
  CompanyCandidateModel,
  CinodeEvent,
  State,
} from "./schema/types.ts";

export type Context = {
  api: {
    getCompany: (companyId: number) => Promise<CompanyModel>;
    getAbsence: (
      companyId: number,
      companyUserId: number,
      id: number
    ) => Promise<AbsencePeriodModel>;
    getAbsences: (
      companyId: number,
      companyUserId: number
    ) => Promise<AbsencePeriodModel[]>;
    getAbsenceTypes: (companyId: number) => Promise<AbsenceTypeModel[]>;
    getCompanyUser: (
      companyId: number,
      companyUserId: number
    ) => Promise<CompanyUserModel>;
    getCandidate: (
      companyId: number,
      id: number
    ) => Promise<CompanyCandidateModel>;
    getCandidates: (
      companyId: number,
      filter?: {
        state?: State;
        pipelineId?: number;
        recruitmentManagerId?: number;
      }
    ) => Promise<CompanyCandidateModel[]>;
    createAbsence: (
      companyId: number,
      companyUserId: number,
      input: Partial<AbsencePeriodModel>
    ) => Promise<AbsencePeriodModel>;
    updateAbsence: (
      companyId: number,
      companyUserId: number,
      id: number,
      input: Partial<AbsencePeriodModel>
    ) => Promise<AbsencePeriodModel>;
    deleteAbsence: (
      companyId: number,
      companyUserId: number,
      id: number
    ) => Promise<void>;
    createCandidate: (
      companyId: number,
      input: Partial<CompanyCandidateModel>
    ) => Promise<CompanyCandidateModel>;
    updateCandidate: (
      companyId: number,
      id: number,
      input: Partial<CompanyCandidateModel>
    ) => Promise<CompanyCandidateModel>;
    deleteCandidate: (companyId: number, id: number) => Promise<void>;
    updateCandidateState: (
      companyId: number,
      id: number,
      state: State
    ) => Promise<CompanyCandidateModel>;
    getCandidateEvents: (
      companyId: number,
      id: number
    ) => Promise<CinodeEvent[]>;
  };
};
