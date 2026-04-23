import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "revathy_mind_care_secret_2024";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });
  if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: "24h" });
  return NextResponse.json({ token, message: "Login successful" });
}
