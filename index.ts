import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";
import {
  getUserResume,
  getUsersWithResumeId,
  getResumes,
} from "./client/client.ts";

async function initializeConfig() {
  const env = await load();

  return {
    appId: env["CINODE_APP_ID"],
    appSecret: env["CINODE_APP_SECRET"],
    companyId: env["CINODE_COMPANY_ID"],
    tokenEndpoint: env["CINODE_TOKEN_ENDPOINT"],
    apiEndpoint: env["CINODE_API_ENDPOINT"],
  } as const;
}

export const getConfig = () => initializeConfig();

const env = await load();
const API_DELAY_MS = parseInt(env["API_DELAY_MS"] || "1000"); // Default: 1000 ms

const kv = await Deno.openKv("./db");

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface EmployeeDetail {
  userId: number;
  resumeId: number;
  resumes: any[]; // Replace 'any' with proper resume type if available
  name?: string;
}

async function fetchEmployeeDetails() {
  try {
    const employeesWithResumes = await getUsersWithResumeId();

    for (const employee of employeesWithResumes) {
      await delay(API_DELAY_MS);
      const resumes = await getUserResume(employee.userId, employee.resumeId);
      const employeeDetail = { ...employee, resumes };

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

async function readEmployeeData() {
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

async function getStats() {
  const employeeIds = await kv.get(["employeeIds"]);
  if (!employeeIds.value) {
    console.log("No employees found");
    return;
  }

  // Get all resumes first
  const allResumes = await getResumes();

  let totalResumes = 0;
  const users: {
    userId: number;
    name: string;
    resumeId: number;
  }[] = [];

  for (const userId of employeeIds.value as number[]) {
    const employeeData = await kv.get(["employee", userId.toString()]);
    const employee = employeeData.value as EmployeeDetail;

    if (employee) {
      // Find all resumes for this user
      const userResumes = allResumes.filter(
        (resume) => resume.companyUserId === employee.userId
      );

      userResumes.forEach((resume) => {
        // Check if this combination of userId and resumeId already exists
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

  // Calculate unique users count
  const uniqueUserCount = new Set(users.map((u) => u.userId)).size;

  console.log(
    `Found ${uniqueUserCount} users with ${totalResumes} total resumes`
  );
  console.log(
    `Average resumes per user: ${(totalResumes / uniqueUserCount).toFixed(2)}`
  );

  users.sort((a, b) => a.userId - b.userId);
  console.table(users);
}

await fetchEmployeeDetails();
await readEmployeeData();
await getStats();
