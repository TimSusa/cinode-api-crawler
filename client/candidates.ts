import type {
  CinodeCandidate,
  CinodeCandidateDetails,
  CinodeEvent,
  RecruitmentSource,
  PipelineResponse,
  Pipeline,
  Stage,
} from "./types.ts";
import { State } from "./types.ts";
import { Logger } from "./logger.ts";
import { getConfig } from "./config.ts";
import { getHeaders } from "./auth.ts";
const logger = new Logger("Cinode Candidates");
const API_DELAY_MS = parseInt(Deno.env.get("API_DELAY_MS") || "1000");
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getCompanyCandidates(): Promise<CinodeCandidate[]> {
  try {
    const config = await getConfig();
    const headers = await getHeaders();
    const endpoint = `${config.apiEndpoint}/companies/${config.companyId}/candidates`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseJson = await response.json();
    if (!responseJson) {
      throw new Error("Empty response from server");
    }
    return responseJson;
  } catch (error) {
    logError("Error getting candidates ", error);
    return [];
  }
}

export async function getCandidateDetails(
  candidateId: number
): Promise<CinodeCandidateDetails | null> {
  try {
    const config = await getConfig();
    const headers = await getHeaders();
    const endpoint = `${config.apiEndpoint}/companies/${config.companyId}/candidates/${candidateId}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    logError("Error getting candidate details ", error);
    return null;
  }
}

export async function getCandidatesWithDetails(): Promise<
  CinodeCandidateDetails[]
> {
  try {
    const candidates: CinodeCandidate[] = await getCompanyCandidates();
    const recruitmentSources = await getRecruitmentSources();
    const candidateDetails: CinodeCandidateDetails[] = [];
    let index = 0;

    for (const candidate of candidates) {
      await delay(API_DELAY_MS);
      const details = await getCandidateDetails(Number(candidate.id));
      console.log("candidate", details);
      console.log("recruitmentSources", recruitmentSources);

      if (details) {
        const { title, description, stages } = await getPipelineInfo(
          Number(details.pipelineId)
        );
        const stage = getStageInfo(stages, Number(details.pipelineStageId));

        const candidateDetail = {
          ...details,
          firstName: details.firstName,
          lastName: details.lastName,
          id: details.id,
          companyId: details.companyId,
          seoId: details.seoId,
          companyUserType: details.companyUserType,
          pipeline: `${title}: ${description}`,
          stage: `${stage.title}: ${stage.description} `,
          source: "FEAT WILL COME",
          state: getStateKey(Number(details?.state || 0)),
        };

        const events = await getCandidateEvents(Number(details.id));

        const parsedCandidate = {
          ...candidateDetail,
          id: Number(details.id),
          events,
        };

        const candidateWithStringIds = {
          ...parsedCandidate,
          companyId: String(parsedCandidate.companyId),
          seoId: String(parsedCandidate.seoId),
        };
        console.log("candidateDetails", index++);
        candidateDetails.push(candidateWithStringIds);
      }
    }

    return candidateDetails;
  } catch (error) {
    logError("Error getting candidates with details ", error);
    return [];
  }
}

function logError(msg: string, err: unknown) {
  if (err instanceof Error) {
    logger.error(err.message);
    throw new Error(msg);
  }
  logger.error("Unexpected error");
  return msg;
}

export async function getCandidateEvents(
  candidateId: number
): Promise<CinodeEvent[]> {
  try {
    const config = await getConfig();
    const headers = await getHeaders();
    const endpoint = `${config.apiEndpoint}/companies/${config.companyId}/candidates/${candidateId}/events`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.map(
      ({
        companyCandidateId,
        id,
        companyId,
        title,
        description,
      }: CinodeEvent) => {
        return { companyCandidateId, id, companyId, title, description };
      }
    );
  } catch (error) {
    logError("Error getting candidate events ", error);
    return [];
  }
}

// Optional: Function to get a specific event if needed
export async function getCandidateEvent(
  candidateId: number,
  eventId: number
): Promise<CinodeEvent | null> {
  try {
    const config = await getConfig();
    const headers = await getHeaders();
    const endpoint = `${config.apiEndpoint}/companies/${config.companyId}/candidates/${candidateId}/events/${eventId}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logError("Error getting candidate event ", error);
    return null;
  }
}

export async function getRecruitmentSources(): Promise<RecruitmentSource[]> {
  try {
    const config = await getConfig();
    const headers = await getHeaders();
    const endpoint = `${config.apiEndpoint}/companies/${config.companyId}/candidates/recruitment-sources`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logError("Error getting recruitment sources ", error);
    return [];
  }
}

export async function getPipelines(): Promise<PipelineResponse[]> {
  try {
    const config = await getConfig();
    const headers = await getHeaders();
    const endpoint = `${config.apiEndpoint}/companies/${config.companyId}/candidates/pipelines`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logError("Error getting pipelines ", error);
    return [];
  }
}

export async function getPipelineInfo(
  pipelineId: number
): Promise<Omit<Pipeline & { stages: Stage[] }, "stage">> {
  const pipelines: PipelineResponse[] = await getPipelines();
  const pipeline = pipelines.find((p) => p.id === pipelineId);

  if (!pipeline) {
    return {
      title: "Unknown Pipeline",
      description: "",
      stages: [],
    };
  }

  return {
    title: pipeline.title,
    description: pipeline.description || "",
    stages: pipeline.stages,
  };
}

export function getStageInfo(stages: Stage[], stageId: number): Stage {
  if (!Array.isArray(stages)) {
    return createDefaultStage();
  }

  const stage = stages.find((s: Stage) => s.id === stageId);
  return stage || createDefaultStage();
}

function createDefaultStage(): Stage {
  return {
    id: -1,
    title: "Unknown Stage",
    description: "",
    order: 0,
    probability: 0,
  };
}

function getStateKey(stateValue: number): keyof typeof State {
  const stateKey = Object.keys(State)[
    Object.values(State).indexOf(stateValue)
  ] as keyof typeof State;
  return stateKey || "Open"; // fallback to 'Open' if not found
}
