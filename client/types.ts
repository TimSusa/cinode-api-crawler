export type CinodeUser = {
  name: string;
  resumeId: number;
  userId: number;
};

export type CinodeCompanyUser = {
  companyUserId: number;
  firstname: string;
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
  lastName: string;
  companyId: string;
  seoId: string;
  companyUserType: string;
  links: Array<{ href: string; rel: string; methods: string[] }>;
};

export type CinodeCandidateDetails = {
  id: string | number;
  firstname: string;
  lastName: string;
  companyId: string | number;
  seoId: string | number;
  companyUserType: string;
  candidate: CinodeCandidate;
  email?: string;
  phone?: string;
  status?: string;
  raw: unknown;
  events?: CinodeEvent[];
  details?: CinodeCandidateDetails;
  links: Array<{
    href: string;
    rel: string;
    methods: string[];
  }>;
};

export type CinodeEvent = {
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
