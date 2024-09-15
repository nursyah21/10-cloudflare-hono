import { Context, Hono } from "hono";
import bcrypt from "bcryptjs";
import { env } from "hono/adapter";
import jwt from "@tsndr/cloudflare-worker-jwt";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

type PropsLogin = {
  username: string;
  password: string;
};

const generateToken = async (c: Context, username: string) => {
  const { JWT_SECRET } = env<{ JWT_SECRET: string }>(c);
  const exp = Math.floor(Date.now() / 1000 + 3600 * 24 * 7);
  const refresh_token = await jwt.sign({ username, exp }, JWT_SECRET, {
    algorithm: "HS256",
  });
  const exp2 = Math.floor(Date.now() / 1000 + 3600);
  const access_token = await jwt.sign({ username, exp: exp2 }, JWT_SECRET, {
    algorithm: "HS256",
  });

  c.header("x-token-refresh", refresh_token);
  c.header("x-token-acccess", access_token);
};

const getEnv = (c: Context) => {
  const { DB, JWT_SECRET } = env<{ DB: D1Database; JWT_SECRET: string }>(c);
  const x_refresh_token = c.req.header("x-refresh-token") ?? "";
  return { DB, JWT_SECRET, x_refresh_token };
};

app.get("/refresh-token", async (c) => {
  const { JWT_SECRET, x_refresh_token } = getEnv(c);

  const isValid = await jwt.verify(x_refresh_token, JWT_SECRET);
  if (!isValid) {
    return c.text("not valid", 400);
  }

  const data = jwt.decode(x_refresh_token);

  // @ts-ignore username is exist in payload
  const username = data.payload.username;

  await generateToken(c, username);

  return c.text("new token retrieve");
});

app.post("/login", async (c) => {
  const { DB } = getEnv(c);
  const { username, password }: PropsLogin = await c.req.json();

  const res = await DB.prepare("SELECT password FROM users where username = ?")
    .bind(username)
    .first();

  if (!res) {
    return c.text("user not exist", 400);
  }

  // @ts-ignore res is return password
  const isValid = bcrypt.compareSync(password, res.password);
  if (!isValid) {
    return c.text("username and password not match", 400);
  }

  await generateToken(c, username);

  return c.text("login success");
});

app.post("/register", async (c) => {
  const { DB } = getEnv(c);
  const { username, password }: PropsLogin = await c.req.json();

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    await DB.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .bind(username, hashedPassword)
      .run();
    // .all();
  } catch (error: any) {
    console.debug(error.message);
    return c.text("user already exist", 400);
  }

  return c.text("success create user");
});

export default app;
