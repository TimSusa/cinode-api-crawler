import { load } from "std/dotenv/mod.ts";

let sessionCookie: string | undefined;

async function initializeConfig() {
  const env = await load();

  return {
    email: env["EMAIL"], // Changed from EMAIL to match your existing .env
    password: env["PASSWORD"],
    url: "https://app.cinode.com/_app/login/password",
  } as const;
}

export async function downloadResumePdf({
  username,
  resumeId = "259876",
}: {
  username: string;
  resumeId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await initializeConfig();
    if (!sessionCookie) {
      const cookieResult = await fetchAndSetCookie({
        config,
      });
      if (!cookieResult.success) {
        return { success: false, error: cookieResult.error };
      }
    }
    if (sessionCookie) {
      const downloadResult = await downloadPdf({
        cookie: sessionCookie,
        resumeId,
        username,
      });
      return downloadResult;
    }
    return { success: false, error: "Failed to establish session" };
  } catch (error) {
    return {
      success: false,
      error: `Error downloading resume: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

async function fetchAndSetCookie({
  config,
}: {
  config: Awaited<ReturnType<typeof initializeConfig>>;
}): Promise<{ success: boolean; error?: string }> {
  const options: RequestInit = {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-GB,en;q=0.7",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium"v="130","Brave"v="130","Not?A_Brand"v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      Referer: config.url,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: JSON.stringify({
      password: config.password,
      email: config.email,
      rememberMe: false,
      returnUrl: null,
    }),
  };

  if (!sessionCookie) {
    try {
      const response = await fetch(config.url, options);

      if (!response.ok) {
        return {
          success: false,
          error: `Login failed with status: ${response.status}`,
        };
      }

      const cookie = response.headers.get("set-cookie");
      if (cookie) {
        sessionCookie = cookie;
        await Deno.writeTextFile("./cookie.txt", cookie);
        return { success: true };
      }
      return { success: false, error: "No cookie received from server" };
    } catch (error) {
      return {
        success: false,
        error: `Login request failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
  return { success: true };
}

async function downloadPdf({
  username,
  cookie,
  resumeId = "259876",
}: {
  username: string;
  cookie: string;
  resumeId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!cookie) {
      return { success: false, error: "No cookie provided" };
    }

    const options: RequestInit = {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en;q=0.7",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="130", "Brave";v="130", "Not?A_Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        cookie: cookie,
        Referer: "https://app.cinode.com/teamit-group-oy/resumes",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    };

    const response = await fetch(
      `https://app.cinode.com/resumes/${resumeId}/teamit-cv/pdf`,
      options
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download PDF: ${response.statusText}`,
      };
    }
    console.log(
      "downloading pdf",
      `./downloads/Resume-${username}-${resumeId}.pdf`
    );
    const pdfData = await response.arrayBuffer();
    await Deno.writeFile(
      `./downloads/Resume-${username}-${resumeId}.pdf`,
      new Uint8Array(pdfData)
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `PDF download failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
