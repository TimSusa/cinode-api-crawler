// API Response Types
export type AbsencePeriodModel = {
  id: number;
  companyId: number;
  companyUserId: number;
  startDate: string;
  endDate: string;
  type: AbsenceTypeModel;
  description?: string;
  created: string;
  updated?: string;
};

export type AbsenceTypeModel = {
  id: number;
  companyId: number;
  name?: string;
};

export type CompanyModel = {
  id: number;
  name?: string;
  description?: string;
  corporateIdentityNumber?: string;
  status: Status;
  created?: string;
  updated?: string;
  links?: Link[];
};

export type CompanyUserModel = {
  id: number;
  companyId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  status: Status;
  created?: string;
  updated?: string;
  links?: Link[];
};

// Common Types
export type Status = "Inactive" | "Active";

export type Link = {
  href: string;
  rel: string;
  method: string;
};

// Enums
export enum State {
  Open = 0,
  Won = 10,
  Paused = 20,
  RejectedByCandidate = 30,
  RejectedByUs = 40,
}

// Core candidate types
export type CompanyCandidateModel = {
  id: number;
  firstName: string;
  lastName: string;
  companyId: number;
  seoId: string;
  companyUserType: string;
  email?: string;
  phone?: string;
  availableFromDate?: string;
  birthYear?: number;
  campaignCode?: string;
  currencyId?: number;
  currentEmployer?: string;
  createdDateTime?: string;
  description?: string;
  events?: CinodeEvent[];
  gender?: string;
  internalId?: string | number;
  lastTouchDateTime?: string;
  linkedInUrl?: string;
  offeredSalary?: number;
  periodOfNoticeDays?: number;
  pipeline?: Pipeline;
  pipelineId?: number;
  pipelineStageId?: number;
  rating?: number;
  recruitmentManager?: RecruitmentManager;
  salaryRequirement?: number;
  state?: keyof typeof State | State;
  title?: string;
  updatedDateTime?: string;
  recruitmentSourceId?: number;
  links?: Link[];
};

export type Pipeline = {
  id: number;
  title: string;
  description: string;
  stages: Stage[];
};

export type Stage = {
  id: number;
  title: string;
  description: string;
  order: number;
  probability: number | null;
};

export type RecruitmentManager = {
  name: string;
};

export type CinodeEvent = {
  type?: string;
  createdDateTime?: string;
  companyCandidateId: number;
  id: number;
  companyId: number;
  title: string;
  description: string;
};
