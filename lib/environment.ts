import fs from "fs";
import invariant from "ts-invariant";

const maskToken = (token: string) =>
  "*".repeat(Math.max(token.length - 4, 0)) + token.slice(-4);

export const getAuthToken = () => {
  let token;
  if (process.env.VERCEL === "1") {
    token = process.env.SALEOR_AUTH_TOKEN || "";
  } else {
    token = fs.readFileSync(".auth_token", "utf8");
  }

  console.log("Using authToken: ", maskToken(token));
  return token;
};

export const setAuthToken = async (token: string) => {
  console.log("Setting authToken: ", maskToken(token));

  if (process.env.VERCEL === "1") {
    invariant(
      process.env.SALEOR_MARKETPLACE_REGISTER_URL,
      "Env var SALEOR_MARKETPLACE_REGISTER_URL is not configured."
    );
    await fetch(process.env.SALEOR_MARKETPLACE_REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        marketplace_token: process.env.SALEOR_MARKETPLACE_TOKEN,
      }),
    });
  } else {
    fs.writeFileSync(".auth_token", token);
  }
};
