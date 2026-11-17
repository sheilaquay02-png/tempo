// QA binary only. Ignores a user's production TEMPO_DESKTOP_URL.
process.env.TEMPO_QA_LOCAL_ONLY="1";
process.env.TEMPO_DEV="1";
process.env.TEMPO_DESKTOP_URL="http://localhost:3000";
require("./main.cjs");
