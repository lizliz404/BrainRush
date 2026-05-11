type Env = {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};

type FeedbackPayload = {
  app?: string;
  message?: string;
  locale?: string;
  gameState?: string;
  subjectMode?: string;
  playMode?: string;
  difficulty?: string;
  url?: string;
  userAgent?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: FeedbackPayload;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const message = payload.message?.trim();
  if (!message) {
    return json({ ok: false, error: "Feedback message is required" }, 400);
  }

  const app = payload.app || "brain-rush";
  const title = `[${app}] ${message.slice(0, 72).replace(/\s+/g, " ")}`;
  const body = [
    message,
    "",
    "---",
    `URL: ${payload.url || "unknown"}`,
    `Locale: ${payload.locale || "unknown"}`,
    `Game state: ${payload.gameState || "unknown"}`,
    `Subject: ${payload.subjectMode || "unknown"}`,
    `Play mode: ${payload.playMode || "unknown"}`,
    `Difficulty: ${payload.difficulty || "unknown"}`,
    `User-Agent: ${payload.userAgent || request.headers.get("user-agent") || "unknown"}`,
  ].join("\n");

  const results: string[] = [];

  const hasGitHubDelivery = Boolean(env.GITHUB_TOKEN && env.GITHUB_REPO);
  const hasTelegramDelivery = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);

  if (!hasGitHubDelivery && !hasTelegramDelivery) {
    return json({ ok: false, error: "No feedback delivery channel configured" }, 503);
  }

  if (hasGitHubDelivery) {
    const issueResponse = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "brain-rush-feedback",
      },
      body: JSON.stringify({ title, body, labels: ["feedback"] }),
    });

    if (!issueResponse.ok) {
      return json({ ok: false, error: "GitHub issue creation failed" }, 502);
    }

    results.push("github");
  }

  if (hasTelegramDelivery) {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `${title}

${body}` }),
    });

    if (!telegramResponse.ok) {
      return json({ ok: false, error: "Telegram delivery failed" }, 502);
    }

    results.push("telegram");
  }

  return json({ ok: true, deliveredTo: results });
};
