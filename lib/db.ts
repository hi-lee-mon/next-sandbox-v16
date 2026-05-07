import "server-only";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, {
  idle_timeout: 20,   // 20秒借りられなかった接続はプールから削除
  max_lifetime: 60 * 30,  // 30分使った接続は一度切断してプールに作り直す
});

export default sql;
