export type CinodeUser = {
  name: string;
  resumeId: number;
  userId: number;
};

export type CinodeCompanyUser = {
  companyUserId: number;
  firstName: string;
  lastName: string;
};

export type CinodeResumeResponse = {
  resume: {
    presentation?: {
      description: string;
    };
    skills?: {
      data: Array<{
        name: string;
        level: number;
        numberOfDaysWorkExperience: number;
        disabled?: boolean;
      }>;
    };
  };
};

export type CinodeEducation = {
  startDate: string;
  endDate: string;
  translations: Array<{
    programName: string;
    schoolName: string;
    degree: string;
  }>;
};

export type CinodeLanguage = {
  language: {
    culture: string;
  };
};

export type UserSkill = {
  companyUserId: number;
  numberOfDaysWorkExperience: number;
  level: number;
};

export type SkillSearchHit = {
  companyUserId: number;
  firstname: string;
  lastName: string;
  skills: Array<{
    keywordId: number;
    keywordSynonymName: string;
  }>;
};

export type UserResumeEntry = {
  userId: number;
  name: string;
  resumeId: number;
};

export type CinodeCandidate = {
  id: number;
  firstname: string;
  lastname: string;
  companyId: string;
  seoId: string;
  companyUserType: string;
  //links: Array<{ href: string; rel: string; methods: string[] }>;
};

export type Attachment = {
  fileName: string;
};

export enum State {
  Open = 0,
  Won = 10,
  Paused = 20,
  RejectedByCandidate = 30,
  RejectedByUs = 40,
}

export type CinodeCandidateDetails = {
  id: string | number;
  firstName: string;
  lastName: string;
  companyId: string | number;
  seoId: string | number;
  companyUserType: string;
  email?: string;
  phone?: string;
  attachments?: Attachment[];
  availableFromDate?: string;
  birthYear?: number;
  campaignCode?: string;
  currencyId?: string | number;
  currentEmployer?: string;
  createdDateTime?: string;
  description?: string;
  events?: CinodeEvent[];
  gender?: string;
  internalId?: string | number;
  isMobile?: boolean;
  lastTouchDateTime?: string;
  linkedInUrl?: string;
  offeredSalary?: number;
  periodOfNoticeDays?: number;
  pipeline?: Pipeline;
  pipelineId?: string | number;
  pipelineStageId?: string | number;
  rating?: number;
  recruitmentManager?: RecruitmentManager;
  salaryRequirement?: number;
  state?: keyof typeof State | State;
  title?: string;
  updatedDateTime?: string;
  recruitmentSourceId?: number;
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

export type EmployeeDetail = {
  userId: number;
  name: string;
  employeeDetail: string;
};

export type RecruitmentManager = {
  name: string;
};

export type RecruitmentSource = {
  id: number;
  name: string;
};

export type PipelineResponse = {
  id: number;
  title: string;
  description: string;
  stages: Stage[];
};

export type Pipeline = {
  title: string;
  description: string;
  stage: Stage | undefined;
};

export type Stage = {
  id: number;
  title: string;
  description: string;
  order: number;
  probability: number | null;
};
