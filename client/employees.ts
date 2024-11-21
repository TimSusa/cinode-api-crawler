import type {
  CinodeUser,
  CinodeCompanyUser,
  EmployeeDetail,
  UserResumeEntry,
} from "./types.ts";
import { insertEmployee, readEmployeesFromDb, _readJsonFile } from "./db.ts";
import { getUsers, getResumes, getUserResume } from "./index.ts";
import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";

const env = await load();
const API_DELAY_MS = parseInt(env["API_DELAY_MS"] || "1000");

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchEmployeeDetails() {
  try {
    const employeesWithResumes = await getUsersWithResumeId();

    for (const employee of employeesWithResumes) {
      await delay(API_DELAY_MS);
      const resumes = await getUserResume(employee.userId, employee.resumeId);
      if (!resumes) continue;
      const employeeDetail = { ...employee, resumes: JSON.parse(resumes) };
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

export async function getStats(): Promise<{
  users: UserResumeEntry[];
  uniqueUserCount: number;
  totalResumes: number;
}> {
  const data = _readJsonFile<{ employees: EmployeeDetail[] }>(
    "./data/employees.json"
  );
  const employees = data?.employees || [];

  if (!Array.isArray(employees)) {
    console.error("Error: employees data is not an array or is undefined.");
    return { users: [], uniqueUserCount: 0, totalResumes: 0 };
  }

  const allResumes = await getResumes();
  let totalResumes = 0;
  const users: UserResumeEntry[] = [];

  for (const employee of employees) {
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
          name: employee.name || `User ${employee.userId}`,
          resumeId: resume.id,
        });
        totalResumes++;
      }
    });
  }

  const uniqueUserCount = new Set(users.map((u) => u.userId)).size;
  users.sort((a, b) => a.userId - b.userId);

  return { users, uniqueUserCount, totalResumes };
}
