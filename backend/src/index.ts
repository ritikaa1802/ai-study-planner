import app from "./app";
import { startGoalLifecycleCron } from "./jobs/goalLifecycle.job";

const PORT = process.env.PORT || 5000;

startGoalLifecycleCron();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});