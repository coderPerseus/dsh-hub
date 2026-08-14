"use server";

import { normalizeGitHubRepositoryUrl } from "@dshhub/contracts";

import { orpc } from "../lib/orpc";

export type SubmissionActionState = {
  repositoryUrl?: string;
  status: "idle" | "accepted" | "duplicate" | "already_indexed" | "invalid" | "error";
};

export async function submitRepository(
  _previousState: SubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  const repositoryUrl = String(formData.get("repositoryUrl") ?? "");
  if (normalizeGitHubRepositoryUrl(repositoryUrl) === null) return { status: "invalid" };
  try {
    return await orpc.submissions.create({ repositoryUrl });
  } catch {
    return { status: "error" };
  }
}
