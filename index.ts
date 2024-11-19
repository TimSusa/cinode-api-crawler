import type {
  CinodeCandidateDetails,
  CinodeCandidate,
} from "@/client/types.ts";
import { exists } from "std/fs/exists.ts";
import { parse } from "std/dotenv/mod.ts";
import { Input } from "@cliffy/prompt/mod.ts";
import { Select } from "@cliffy/prompt/select.ts";
import { Confirm } from "@cliffy/prompt/confirm.ts";
import {
  fetchEmployeeDetails,
  readEmployeeData,
  getStats,
} from "@/client/index.ts";
import {
  //getCompanyCandidates,
  getCandidatesWithDetails,
} from "@/client/candidates.ts";
import { writeCandidatesToDb, readCandidatesFromDb } from "@/client/db.ts";
import { downloadResumePdf } from "@/client/pdf.ts";
import * as XLSX from "npm:xlsx";

async function main() {
  // Check for .env file
  if (!(await exists(".env"))) {
    await setupEnv();
  }

  // Load env variables
  const env = await parse(await Deno.readTextFile(".env"));
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  // Check if database exists
  const hasDatabase = await exists("./db");

  while (true) {
    const action = await Select.prompt({
      message: "What would you like to do?",
      options: [
        { name: "Update Database", value: "update" },
        { name: "Read Employee Data", value: "read" },
        { name: "Show Statistics", value: "stats" },
        { name: "Download Resume PDF", value: "pdf" },
        // { name: "Update Candidates Database", value: "updateCandidate" },
        { name: "Read Candidates Database", value: "readCandidates" },
        { name: "Show Company Candidates", value: "candidates" },
        {
          name: "Show Detailed Company Candidates",
          value: "detailedCandidates",
        },
        { name: "Export Candidates to Excel", value: "exportExcel" },
        { name: "Exit", value: "exit" },
      ],
    });

    switch (action) {
      case "update":
        if (hasDatabase) {
          console.log("Note: Database file already exists");
        } else {
          console.log(
            "Note: Database file does not exist, so you should create one!"
          );
        }
        await fetchEmployeeDetails();
        console.log("Database updated successfully");
        break;

      // case "updateCandidate": {
      //   console.log("Updating candidates database...");
      //   const candidates = await Promise.resolve(getCompanyCandidates());
      //   const candidateUpdates = candidates.map((candidate) => ({
      //     id: candidate.id,
      //     updates: {
      //       // Map relevant fields from CinodeCandidate to CinodeCandidateDetails
      //       // Omitting id since it's provided separately
      //       ...candidate,
      //     },
      //   }));
      //   const cinodeCandidates: CinodeCandidate[] = candidateUpdates.map(
      //     (update) => ({
      //       id: update.id,
      //       firstName: update.updates.firstname,
      //       lastName: update.updates.lastName,
      //       companyId: update.updates.companyId,
      //       seoId: update.updates.seoId,
      //       companyUserType: update.updates.companyUserType,
      //       links: update.updates.links,
      //     })
      //   );
      //   await writeCandidatesToDb(cinodeCandidates);
      //   console.log("Candidates database updated successfully");
      //   break;
      // }

      case "readCandidates": {
        console.log("Reading candidates from database...");
        await readOutCandidatesFromDb();
        break;
      }

      case "read":
        await readEmployeeData();
        break;

      case "stats": {
        const stats = await getStats();
        console.log(
          `Found ${stats.uniqueUserCount} users with ${stats.totalResumes} total resumes`
        );
        console.log(
          `Average resumes per user: ${(
            stats.totalResumes / stats.uniqueUserCount
          ).toFixed(2)}`
        );
        console.table(stats.users);
        break;
      }

      case "pdf": {
        const stats = await getStats();
        let failedDownloads = 0;

        for (const user of stats.users) {
          const result = await downloadResumePdf({
            username: user.name,
            resumeId: user.resumeId.toString(),
          });

          if (result.success) {
            console.log(`✅ Downloaded resume for ${user.name}`);
          } else {
            console.error(
              `❌ Failed to download resume for ${user.name}: ${result.error}`
            );
            failedDownloads++;
          }

          await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
        }

        if (failedDownloads > 0) {
          console.warn(`⚠️ Failed to download ${failedDownloads} resume(s)`);
        } else {
          console.log("✨ All resumes downloaded successfully!");
        }
        break;
      }

      case "candidates": {
        const candidates = await readCandidatesFromDb();
        console.table(candidates);
        break;
      }

      case "detailedCandidates": {
        const detailedCandidates = await getCandidatesWithDetails();
        await writeCandidatesToDb(detailedCandidates);
        exportCandidatesToExcel(detailedCandidates);
        break;
      }

      case "exportExcel": {
        const candidates = await readCandidatesFromDb();

        exportCandidatesToExcel(candidates);
        console.log("✨ Excel file created successfully!");
        break;
      }

      case "exit":
        return;
    }
  }
}

if (import.meta.main) {
  main().catch(console.error);
}

async function setupEnv() {
  console.log("No .env file found. Let's create one!");

  const useDefault = await Confirm.prompt(
    "Use dummy values? Otherwise you will be prompted for giving your values in"
  );

  const defaultEnv = {
    CINODE_TOKEN_ENDPOINT: "https://api.cinode.com/token",
    CINODE_API_ENDPOINT: "https://api.cinode.com/v0.1",
  };

  if (useDefault) {
    const envContent = `
CINODE_APP_ID=dummy
CINODE_APP_SECRET=dummy123
CINODE_COMPANY_ID=dummy456
CINODE_TOKEN_ENDPOINT=${defaultEnv.CINODE_TOKEN_ENDPOINT}
CINODE_API_ENDPOINT=${defaultEnv.CINODE_API_ENDPOINT}
USERNAME=dummy
PASSWORD=dummy123
`.trim();
    await Deno.writeTextFile(".env", envContent);
    console.log("Created .env with dummy values");
    return;
  }

  const username = await Input.prompt("Enter username");
  const password = await Input.prompt({
    message: "Enter password",
  });

  // Prompt for required values
  const appId = await Input.prompt({
    message: "Enter CINODE_APP_ID",
    minLength: 1,
  });

  const appSecret = await Input.prompt({
    message: "Enter CINODE_APP_SECRET",
    minLength: 1,
  });

  const companyId = await Input.prompt({
    message: "Enter CINODE_COMPANY_ID",
    minLength: 1,
  });

  const env = {
    ...defaultEnv,
    USERNAME: username,
    PASSWORD: password,
    CINODE_APP_ID: appId,
    CINODE_APP_SECRET: appSecret,
    CINODE_COMPANY_ID: companyId,
  };

  const envContent = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  await Deno.writeTextFile(".env", envContent);
  console.log("Created .env file successfully");
}

async function readOutCandidatesFromDb() {
  console.log("Reading candidates from database...");
  const candidates = await readCandidatesFromDb();
  console.table(candidates);
  return candidates;
}

async function exportCandidatesToExcel() {
  const candidates = await readCandidatesFromDb();

  if (candidates.length === 0) {
    console.error("No candidates found");
    return;
  }

  const formattedCandidates = candidates.map((candidate) => ({
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
    phone: candidate.phone,
    title: candidate.title,
    availableFromDate: candidate.availableFromDate,
    birthYear: candidate.birthYear,
    campaignCode: candidate.campaignCode,
    companyId: candidate.companyId,
    createdDateTime: candidate.createdDateTime,
    currencyId: candidate.currencyId,
    currentEmployer: candidate.currentEmployer,
    description: candidate.description,
    events:
      candidate.events?.map((event) => JSON.stringify(event)).join(" | ") || "",
    gender: candidate.gender,
    id: candidate.id,
    internalId: candidate.internalId,
    isMobile: candidate.isMobile,
    lastTouchDateTime: candidate.lastTouchDateTime,
    linkedInUrl: candidate.linkedInUrl,
    offeredSalary: candidate.offeredSalary,
    periodOfNoticeDays: candidate.periodOfNoticeDays,
    pipelineId: candidate.pipelineId,
    pipelineStageId: candidate.pipelineStageId,
    rating: candidate.rating,
    recruitmentManager: JSON.stringify(candidate.recruitmentManager),
    salaryRequirement: candidate.salaryRequirement,
    seoId: candidate.seoId,
    state: candidate.state,
    updatedDateTime: candidate.updatedDateTime,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(formattedCandidates);

  // Adjust column width for events
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const eventsColIndex = Object.keys(formattedCandidates[0]).indexOf("events");
  worksheet["!cols"] = Array(range.e.c + 1).fill({ wch: 15 });
  worksheet["!cols"][eventsColIndex] = { wch: 100 }; // wider column for events

  XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
  XLSX.writeFile(workbook, "candidates.xlsx");
}
