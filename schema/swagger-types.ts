import type { Link } from "./types.ts";

// Enums
export enum Status {
  Inactive = 0,
  Active = 1,
}

export enum StringComparisonOperator {
  Contains = 0,
  StartsWith = 1,
  EndsWith = 2,
  Equals = 3,
}

export enum TemplateAssetType {
  None = 0,
  Primary = 1,
  Classic = 2,
  Dynamic = 3,
  PageFlow = 4,
  BlockWorkExperience = 50,
  BlockSkillsByLevel = 51,
  CinodePremium3PageFlow = 70,
  CinodePremium2PageFlow = 71,
  TemplateType = 100,
}

export enum TrainingType {
  Course = 0,
  Certification = 1,
}

export enum UserGender {
  Other = 0,
  Male = 1,
  Female = 2,
}

export enum WebhookEntityType {
  All = 1,
  CompanyCandidate = 2,
  CompanyEmployee = 3,
  CompanySubcontractor = 4,
  CompanyCustomer = 5,
  CompanyProject = 6,
  Role = 7,
  PublicAnnouncement = 8,
  Absence = 9,
  CompanyCustomerContact = 10,
}

// Models
export type TeamAddEditModel = {
  name?: string;
  description?: string;
  internalIdentification?: string;
  corporateIdentityNumber?: string;
  costCenter?: string;
  parentTeamId?: number;
  locationId?: number;
};

export type TeamBaseModel = {
  id: number;
  companyId?: number;
  name?: string;
  description?: string;
  links?: Link[];
};

export type TeamModel = TeamBaseModel & {
  internalIdentification?: string;
  corporateIdentityNumber?: string;
  costCenter?: string;
  location?: string;
  parentTeamId?: number;
  created?: string;
  updated?: string;
  locationId?: number;
};

export type ValidationModel = {
  errors?: Record<string, string[] | null>;
};

export type WebhookModel = {
  id: string;
  isActive: boolean;
  endpointUrl?: string;
  configurations?: WebhookConfigurationModel[];
  credentials?: WebhookCredentialsModel[];
};

export type WebhookConfigurationModel = {
  entityType: WebhookEntityType;
  actionType: ActionType;
};

export type WebhookCredentialsModel = {
  isBasicAuthentication?: boolean;
  headerName?: string;
};

export type WeeklyUtilizationAndRevenueModel = {
  year: number;
  week: number;
  teamId: number;
  teamName?: string;
  companyUserId: number;
  firstname?: string;
  lastname?: string;
  utilization: number;
  utilizationPreliminary: number;
  assignedHours: number;
  revenue: number;
  currencyCode?: string;
};

// Add more types as needed...
