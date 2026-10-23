import { handleAskRequest } from "./ai";
import { handleCommunityRequest } from "./community";
import { handlePushRequest } from "./push";
import { handleFeedbackRequest } from "./feedback";

export async function routeApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/api/ask") {
    return handleAskRequest(req);
  }

  if (path === "/api/feedback" || path.startsWith("/api/feedback/")) {
    return handleFeedbackRequest(req);
  }

  if (path.startsWith("/api/community/")) {
    return handleCommunityRequest(req);
  }

  if (path.startsWith("/api/push/")) {
    return handlePushRequest(req);
  }

  return null;
}
