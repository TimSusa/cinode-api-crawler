import type {
  CinodeCandidate,
  CinodeCandidateDetails,
  EmployeeDetail,
} from "./types.ts";

const DB_PATH = {
  candidates: "./data/candidates.json",
  employees: "./data/employees.json",
};

// Define normalized data structure
type NormalizedCinodeCandidate = Omit<
  CinodeCandidate,
  "raw" | "firstname" | "lastname"
> & {
  firstname: string;
  lastName: string;
  baseInfo: {
    rating: number | null;
    availableFromDate: string | null;
    periodOfNoticeDays: number | null;
    salaryRequirement: number | null;
    offeredSalary: number | null;
    state: number;
    currencyId: number;
    isMobile: boolean;
    pipelineId: number;
    pipelineStageId: number;
    recruitmentManagerId: number;
    title: string;
    email: string | null;
    linkedInUrl: string | null;
    phone: string | null;
    currentEmployer: string | null;
  };
};

export function _readJsonFile<T>(path: string): T {
  try {
    const content = Deno.readTextFileSync(path);
    const data = JSON.parse(content) as T;
    return data;
  } catch {
    return {} as T;
  }
}

function normalizeData(data: any): any {
  if (!data.candidates) return data;

  return {
    ...data,
    candidates: data.candidates.map((c: any) => ({
      id: c.id,
      firstname: c.firstname,
      lastName: c.lastName,
      companyId: c.companyId,
      seoId: c.seoId,
      links: c.links,
      baseInfo: {
        rating: c.candidate.rating,
        availableFromDate: c.candidate.availableFromDate,
        periodOfNoticeDays: c.candidate.periodOfNoticeDays,
        salaryRequirement: c.candidate.salaryRequirement,
        offeredSalary: c.candidate.offeredSalary,
        state: c.candidate.state,
        currencyId: c.candidate.currencyId,
        isMobile: c.candidate.isMobile,
        pipelineId: c.candidate.pipelineId,
        pipelineStageId: c.candidate.pipelineStageId,
        recruitmentManagerId: c.candidate.recruitmentManagerId,
        title: c.candidate.title,
        email: c.candidate.email,
        linkedInUrl: c.candidate.linkedInUrl,
        phone: c.candidate.phone,
        currentEmployer: c.candidate.currentEmployer,
      },
      recruitmentManager: c.candidate.recruitmentManager,
      createdDateTime: c.candidate.createdDateTime,
      lastTouchDateTime: c.candidate.lastTouchDateTime,
      updatedDateTime: c.candidate.updatedDateTime,
    })),
  };
}

export function insertCandidate(candidate: CinodeCandidate): void {
  try {
    const existingData = _readJsonFile<{ candidates: CinodeCandidate[] }>(
      DB_PATH.candidates
    );
    const candidates = existingData.candidates || [];

    candidates.push(candidate);
    Deno.writeTextFileSync(
      DB_PATH.candidates,
      JSON.stringify({ candidates }, null, 2)
    );
  } catch (error) {
    console.error("Failed to insert candidate:", error);
    throw error;
  }
}

export function insertEmployee(employeeDetail: EmployeeDetail): void {
  try {
    const existingData = _readJsonFile<{ employees: EmployeeDetail[] }>(
      DB_PATH.employees
    );
    const employees = existingData.employees || [];

    employees.push(employeeDetail);
    Deno.writeTextFileSync(
      DB_PATH.employees,
      JSON.stringify({ employees }, null, 2)
    );
  } catch (error) {
    console.error("Failed to insert employee:", error);
    throw error;
  }
}

export function readEmployeesFromDb(): EmployeeDetail[] {
  try {
    const data = _readJsonFile<{ employees: EmployeeDetail[] }>(
      DB_PATH.employees
    );
    return data.employees || [];
  } catch (error) {
    console.error("Failed to read employees:", error);
    return [];
  }
}

export function readCandidatesFromDb(): CinodeCandidateDetails[] {
  try {
    const data = _readJsonFile<{ candidates: CinodeCandidateDetails[] }>(
      DB_PATH.candidates
    );
    console.log("Reading candidates from database...");
    return data.candidates || [];
  } catch (error) {
    console.error("Failed to read candidates:", error);
    return [];
  }
}

export function writeCandidatesToDb(
  candidates: CinodeCandidateDetails[]
): void {
  try {
    console.log("writeCandidateToDb");
    Deno.writeTextFileSync(
      DB_PATH.candidates,
      JSON.stringify({ candidates }, null, 2)
    );
  } catch (error) {
    console.error("Failed to update candidates:", error);
    throw error;
  }
}
