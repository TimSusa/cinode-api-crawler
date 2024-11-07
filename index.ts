import { exists } from "@std/fs/exists.ts";
import { parse } from "@std/dotenv/mod.ts";
import { Input } from "@cliffy/prompt/mod.ts";
import { Select } from "@cliffy/prompt/select.ts";
import { Confirm } from "@cliffy/prompt/confirm.ts";
import {
  fetchEmployeeDetails,
  readEmployeeData,
  getStats,
} from "./client/index.ts";

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

  const useDefault = await Confirm.prompt("Use dummy values?");

  if (useDefault) {
    const dummyEnv = `USERNAME=dummy\nPASSWORD=dummy123`;
    await Deno.writeTextFile(".env", dummyEnv);
    console.log("Created .env with dummy values");
    return;
  }

  const username = await Input.prompt("Enter username");
  const password = await Input.prompt({
    message: "Enter password",
  });

  const envContent = `USERNAME=${username}\nPASSWORD=${password}`;
  await Deno.writeTextFile(".env", envContent);
  console.log("Created .env file successfully");
}
