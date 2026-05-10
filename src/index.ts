import app from "./app";
import { envVars } from "./app/config/env";

app.listen(envVars.PORT, () => {
  console.log(`Server running on port ${envVars.PORT}`);
});
