import { runDailyGoalReset } from "@/server/services/goalLifecycle.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await runDailyGoalReset();
    return Response.json({ success: true, result });
  } catch (error) {
    console.error("Goal reset cron failed", error);
    return Response.json({ error: "Cron failed" }, { status: 500 });
  }
}