import cron from "node-cron";
import { runNotificationJobs } from "./notification.job";

// Schedule to run every day at 8:00 AM server time
cron.schedule("0 8 * * *", async () => {
  console.log("[Auto Notification] Running notification jobs...");
  await runNotificationJobs();
  console.log("[Auto Notification] Notification jobs completed.");
});

console.log("[Auto Notification] Scheduler started. Notifications will run daily at 8:00 AM.");
