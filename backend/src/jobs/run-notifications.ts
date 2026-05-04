import { runNotificationJobs } from "./notification.job";

// Run notification jobs and exit
runNotificationJobs()
  .then(() => {
    console.log("Notification jobs completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Notification jobs failed:", err);
    process.exit(1);
  });