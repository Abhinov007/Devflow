import { createHmac, timingSafeEqual } from "crypto";
import { addChangelogEntry } from "../mcp/changelogDb.js";
import { logger } from "../utils/logger.js";

function verifySignature(rawBody, signature) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification if no secret set (dev mode)
  if (!signature) return false;

  const expected = "sha256=" + createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function prStatusFromAction(action, merged) {
  if (action === "closed" && merged) return "Merged";
  if (action === "closed") return "Closed";
  return "Opened";
}

export async function handleGithubWebhook(req, res) {
  const event = req.headers["x-github-event"];
  const signature = req.headers["x-hub-signature-256"];
  const rawBody = req.rawBody;

  // Only care about pull_request events
  if (event !== "pull_request") {
    return res.status(200).json({ ignored: true, event });
  }

  if (!verifySignature(rawBody, signature)) {
    logger.warn("GitHub webhook signature mismatch");
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { action, pull_request: pr, repository } = req.body;

  // Only track: opened, closed (merged or not)
  if (!["opened", "closed"].includes(action)) {
    return res.status(200).json({ ignored: true, action });
  }

  const status = prStatusFromAction(action, pr.merged);
  const title = `#${pr.number} ${pr.title}`;

  logger.info(`GitHub PR ${status}`, { repo: repository.full_name, pr: pr.number });

  try {
    await addChangelogEntry({
      title,
      status,
      author: pr.user.login,
      repo: repository.full_name,
      prUrl: pr.html_url,
      date: new Date(pr.updated_at),
    });
    logger.success("Changelog entry added", { title });
    res.json({ success: true, status, title });
  } catch (err) {
    logger.error("Failed to write changelog", { error: err.message });
    res.status(500).json({ error: err.message });
  }
}
