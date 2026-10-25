import { handleAskRequest } from "./ai";
import { handleCommunityRequest } from "./community";
import { handlePushRequest } from "./push";
import { handleFeedbackRequest } from "./feedback";
import { handleInstinctRequest } from "./instinct";
import { handleDivaRouteRequest } from "./diva";
import { handlePartnerRequest } from "./partner";

export async function routeApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.startsWith("/api/partner/")) {
    return handlePartnerRequest(req);
  }

  if (path === "/api/ask") {
    return handleAskRequest(req);
  }

  if (path.startsWith("/api/diva")) {
    return handleDivaRouteRequest(req);
  }

  if (path.startsWith("/api/instinct")) {
    return handleInstinctRequest(req);
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
