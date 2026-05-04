import cron from "node-cron";
import { runNotificationJobs } from "./notification.job";

// Schedule to run every 3 hours
cron.schedule("0 */3 * * *", async () => {
  console.log("[Auto Notification] Running notification jobs...");
  await runNotificationJobs();
  console.log("[Auto Notification] Notification jobs completed.");
});

console.log("[Auto Notification] Scheduler started. Notifications will run every 3 hours.");
