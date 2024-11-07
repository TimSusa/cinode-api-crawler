import { Logger } from "./logger.ts";
import { getHeaders } from "./auth.ts";
import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";

import { getConfig } from "./config.ts";

// Replace axios with native fetch
type AxiosResponse<T> = {
  data: T;
};

export type CinodeUser = {
  userId: number;
  name: string;
  resumeId: number;
};

// Add this type definition near other types at the top
type CinodeCompanyUser = {
  companyUserId: number;
  firstName: string;
  lastName: string;
};

// Add this type near other type definitions at the top
type SkillSearchHit = {
  companyUserId: number;
  firstName: string;
  lastName: string;
  skills: Array<{
    keywordId: number;
    keywordSynonymName: string;
  }>;
};

// Replace the CinodeResumeResponse type
type CinodeResumeResponse = {
  resume: {
    presentation?: {
      description?: string;
    };
    skills?: {
      data?: Array<{
        disabled?: boolean;
        name: string;
        level: number;
        numberOfDaysWorkExperience: number;
      }>;
    };
  };
};

type CinodeEducation = {
  startDate: string;
  endDate: string;
  translations: Array<{
    programName: string;
    schoolName: string;
    degree: string;
  }>;
};

type CinodeLanguage = {
  language: {
    culture: string;
  };
};

// Add this type near other type definitions at the top
type UserSkill = {
  companyUserId: number;
  numberOfDaysWorkExperience: number;
  level: number;
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

export type EmployeeDetail = {
  userId: number;
  name: string;
};

const env = await load();
const API_DELAY_MS = parseInt(env["API_DELAY_MS"] || "1000"); // Default: 1000 ms

const kv = await Deno.openKv("./db");

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchEmployeeDetails() {
  try {
    const employeesWithResumes = await getUsersWithResumeId();

    for (const employee of employeesWithResumes) {
      await delay(API_DELAY_MS);
      const resumes = await getUserResume(employee.userId, employee.resumeId);
      const employeeDetail = { ...employee, resumes: JSON.parse(resumes) };

      // Store each employee individually using their userId as the key
      await kv.set(["employee", employee.userId.toString()], employeeDetail);
    }

    // Store the list of userIds separately
    await kv.set(
      ["employeeIds"],
      employeesWithResumes.map((e) => e.userId)
    );

    console.log(`Successfully stored all employee data and CVs.`);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

export async function readEmployeeData() {
  try {
    // First get the list of employee IDs
    const employeeIds = await kv.get(["employeeIds"]);

    if (!employeeIds.value) {
      console.log("No employee IDs found");
      return;
    }

    // Fetch each employee's data
    for (const userId of employeeIds.value as number[]) {
      const employeeData = await kv.get(["employee", userId.toString()]);
      if (employeeData.value) {
        console.log(`Employee ${userId}:`, employeeData.value);
      }
    }
  } catch (error) {
    console.error("Error reading data:", error);
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
          const { firstName, lastName } = companyUser;
          return {
            name: `${firstName} ${lastName}`,
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
      const { companyUserId, firstName, lastName, skills } = user;
      const skill = skills.find(
        (skill) => skill.keywordSynonymName.toLowerCase() === term.toLowerCase()
      );
      return {
        userId: companyUserId,
        name: `${firstName} ${lastName}`,
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

export interface UserResumeEntry {
  userId: number;
  name: string;
  resumeId: number;
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
