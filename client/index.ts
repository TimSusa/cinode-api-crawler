import { Logger } from "./logger.ts";
import { getHeaders } from "./auth.ts";
import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";
import { getConfig } from "./config.ts";
import type {
  CinodeUser,
  CinodeCompanyUser,
  CinodeResumeResponse,
  CinodeEducation,
  CinodeLanguage,
  UserSkill,
  SkillSearchHit,
  UserResumeEntry,
  EmployeeDetail,
} from "./types.ts";
import { insertEmployee, readEmployeesFromDb } from "./db.ts";

// Replace axios with native fetch
type AxiosResponse<T> = {
  data: T;
};

const logger = new Logger("Cinode Client");

async function axiosGet<T>(
  url: string,
  options: RequestInit
): Promise<AxiosResponse<T>> {
  const response = await fetch(url, {
    method: "GET",
    ...options,
  });
  const data = await response.json();
  return { data };
}

async function axiosPost<T>(
  url: string,
  body: unknown,
  options: RequestInit
): Promise<AxiosResponse<T>> {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    ...options,
  });
  const data = await response.json();
  return { data };
}

export async function getUsers(): Promise<CinodeCompanyUser[]> {
  try {
    const { data } = await axiosGet<CinodeCompanyUser[]>(
      `${(await getConfig()).apiEndpoint}/companies/${
        (
          await getConfig()
        ).companyId
      }/users`,
      {
        headers: await getHeaders(),
      }
    );
    return data;
  } catch (error) {
    logError("Error getting users ", error);
    return [];
  }
}

type CinodeResume = {
  id: number;
  companyUserId: number;
};

const env = await load();
const API_DELAY_MS = parseInt(env["API_DELAY_MS"] || "1000"); // Default: 1000 ms

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchEmployeeDetails() {
  try {
    const employeesWithResumes = await getUsersWithResumeId();

    for (const employee of employeesWithResumes) {
      await delay(API_DELAY_MS);
      const resumes = await getUserResume(employee.userId, employee.resumeId);
      const employeeDetail = { ...employee, resumes: JSON.parse(resumes) };
      // Store employee using the db module
      const employeeDetailForDb = {
        ...employeeDetail,
        employeeDetail: JSON.stringify(employeeDetail),
      };
      insertEmployee(employeeDetailForDb);
    }

    console.log(`Successfully stored all employee data and CVs.`);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

export function readEmployeeData() {
  try {
    const employees = readEmployeesFromDb();
    if (employees === undefined) return;

    (employees as Array<Error | EmployeeDetail>).forEach((employee) => {
      if (employee instanceof Error) {
        console.error("Error reading data:", employee.message);
      } else {
        console.log(
          `Employee ${employee.userId}:`,
          typeof employee.employeeDetail === "string"
            ? (JSON.parse(employee.employeeDetail) as Record<string, unknown>)
            : {}
        );
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error reading data:", error.message);
    } else {
      console.error("Error reading data:", String(error));
    }
  }
}

export async function getResumes(): Promise<CinodeResume[]> {
  try {
    const { data } = await axiosGet<CinodeResume[]>(
      `${(await getConfig()).apiEndpoint}/companies/${
        (
          await getConfig()
        ).companyId
      }/resumes`,
      {
        headers: await getHeaders(),
      }
    );
    return data;
  } catch (error) {
    logError("Error getting resumes ", error);
    return [];
  }
}

export async function getUsersWithResumeId(): Promise<CinodeUser[]> {
  const users = await getUsers();
  const resumes = await getResumes();
  return Promise.all(
    resumes
      .map(({ id, companyUserId }) => {
        const companyUser = users.find(
          (user: CinodeCompanyUser) => user.companyUserId === companyUserId
        );
        if (companyUser) {
          const { firstname, lastName } = companyUser;
          return {
            name: `${firstname} ${lastName}`,
            resumeId: id,
            userId: companyUserId,
          };
        }
        return null;
      })
      .filter((user): user is CinodeUser => user !== null)
  );
}

export async function getUserResume(userId: number, resumeId: number) {
  try {
    const { data } = await axiosGet<CinodeResumeResponse>(
      `${(await getConfig()).apiEndpoint}/companies/${
        (
          await getConfig()
        ).companyId
      }/users/${userId}/resumes/${resumeId}`,
      {
        headers: await getHeaders(),
      }
    );
    return JSON.stringify({
      userId,
      resumeId,
      publicUrl: `https://app.cinode.com/resumes/${resumeId}/teamit-cv`,
      ...getResumeData(data.resume),
    });
  } catch (error) {
    return logError("Error getting user resume ", error);
  }
}

export async function getUserEducation(userId: number) {
  try {
    const { data } = await axiosGet<{
      education: CinodeEducation[];
      languages: CinodeLanguage[];
    }>(
      `${(await getConfig()).apiEndpoint}/companies/${
        (
          await getConfig()
        ).companyId
      }/users/${userId}/profile`,
      {
        headers: await getHeaders(),
      }
    );

    const { education, languages } = data;
    return JSON.stringify({
      education: getEducationFrom(education),
      languages: getLangsFrom(languages),
      userId,
    });
  } catch (error) {
    return logError("Error getting user profile ", error);
  }
}

export async function getUserSkills(userId: number) {
  try {
    const { data } = await axiosGet<
      Array<{
        numberOfDaysWorkExperience: number;
        level: number;
        keyword: {
          masterSynonym: string;
          synonyms: string[];
        };
      }>
    >(
      `${(await getConfig()).apiEndpoint}/companies/${
        (
          await getConfig()
        ).companyId
      }/users/${userId}/skills`,
      {
        headers: await getHeaders(),
      }
    );
    return JSON.stringify(getSkillsFrom(data));
  } catch (error) {
    logError("Error getting user skills ", error);
  }
}

export async function getUserSkillById(
  userId: number,
  skillId: number
): Promise<UserSkill> {
  try {
    const { data } = await axiosGet<UserSkill>(
      `${(await getConfig()).apiEndpoint}/companies/${
        (
          await getConfig()
        ).companyId
      }/users/${userId}/skills/${skillId}`,
      {
        headers: await getHeaders(),
      }
    );
    return data;
  } catch (error) {
    logError("Error getting user skill by id ", error);
    throw error; // Add this to satisfy TypeScript return type
  }
}

export async function getUsersBySkillSearchTerm(term: string) {
  try {
    const headers = await getHeaders();
    const { data } = await axiosPost<{ hits: SkillSearchHit[] }>(
      `${(await getConfig()).apiEndpoint}/companies/${
        (
          await getConfig()
        ).companyId
      }/skills/search/term`,
      { term, limit: 100 },
      { headers }
    );

    const usersWithSkill = data.hits.map((user) => {
      const { companyUserId, firstname, lastName, skills } = user;
      const skill = skills.find(
        (skill) => skill.keywordSynonymName.toLowerCase() === term.toLowerCase()
      );
      return {
        userId: companyUserId,
        name: `${firstname} ${lastName}`,
        skillId: skill?.keywordId,
      };
    });

    const userSkillPromises = usersWithSkill
      .filter(
        (user): user is { userId: number; name: string; skillId: number } =>
          user.skillId !== undefined
      )
      .map((user) => ({
        name: user.name,
        promise: getUserSkillById(user.userId, user.skillId),
      }));

    const usersWithSkillDetails = [];
    for (const nameAndSkillPromise of userSkillPromises) {
      const skillData = await nameAndSkillPromise.promise;
      if (skillData.numberOfDaysWorkExperience > 0) {
        usersWithSkillDetails.push({
          userId: skillData.companyUserId,
          name: nameAndSkillPromise.name,
          skill: term,
          skillLevel: skillData.level,
          skillExperienceInDays: skillData.numberOfDaysWorkExperience,
        });
      }
    }

    return JSON.stringify(usersWithSkillDetails);
  } catch (error) {
    return logError("Error getting users by skill search term ", error);
  }
}

function getSkillsFrom(
  skills: Array<{
    numberOfDaysWorkExperience: number;
    level: number;
    keyword: {
      masterSynonym: string;
      synonyms: string[];
    };
  }>
) {
  return skills
    .map((skill) => {
      const {
        numberOfDaysWorkExperience,
        level,
        keyword: { masterSynonym, synonyms },
      } = skill;
      return {
        numberOfDaysWorkExperience,
        level,
        masterSynonym,
        synonyms: synonyms.join(", "),
      };
    })
    .filter((skill) => skill.numberOfDaysWorkExperience > 0);
}

function getEducationFrom(
  educations: Array<{
    startDate: string;
    endDate: string;
    translations: Array<{
      programName: string;
      schoolName: string;
      degree: string;
    }>;
  }>
) {
  return educations.map((education) => {
    const { translations, startDate, endDate } = education;
    const { programName, schoolName, degree } = translations[0];
    return {
      schoolName,
      programName,
      degree,
      startDate,
      endDate,
    };
  });
}

function getLangsFrom(
  languages: Array<{
    language: {
      culture: string;
    };
  }>
) {
  return languages.map((language) => language.language.culture).join(", ");
}

function getResumeData(resume: CinodeResumeResponse["resume"]) {
  return {
    presentation: resume?.presentation?.description,
    skills: resume?.skills?.data
      ?.filter((skill) => skill && !skill.disabled)
      .map((skill) => {
        const { name, level, numberOfDaysWorkExperience } = skill;
        return {
          name,
          level,
          numberOfDaysWorkExperience,
        };
      }),
  };
}

function logError(msg: string, err: unknown) {
  if (err instanceof Error) {
    logger.error(err.message);
    throw new Error(msg);
  }
  logger.error("Unexpected error");
  return msg;
}

export async function getStats(): Promise<{
  users: UserResumeEntry[];
  uniqueUserCount: number;
  totalResumes: number;
}> {
  const kv = await Deno.openKv("./db");
  const employeeIds = await kv.get(["employeeIds"]);
  if (!employeeIds.value) {
    console.log("No employees found");
    return { users: [], uniqueUserCount: 0, totalResumes: 0 };
  }

  const allResumes = await getResumes();
  let totalResumes = 0;
  const users: UserResumeEntry[] = [];

  for (const userId of employeeIds.value as number[]) {
    const employeeData = await kv.get(["employee", userId.toString()]);
    const employee = employeeData.value as EmployeeDetail;

    if (employee) {
      const userResumes = allResumes.filter(
        (resume) => resume.companyUserId === employee.userId
      );

      userResumes.forEach((resume) => {
        const exists = users.some(
          (u) => u.userId === employee.userId && u.resumeId === resume.id
        );

        if (!exists) {
          users.push({
            userId: employee.userId,
            name: employee.name || `User ${userId}`,
            resumeId: resume.id,
          });
          totalResumes++;
        }
      });
    }
  }

  const uniqueUserCount = new Set(users.map((u) => u.userId)).size;
  users.sort((a, b) => a.userId - b.userId);

  return { users, uniqueUserCount, totalResumes };
}
