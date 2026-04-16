import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const filePath = path.join(process.cwd(), "data", "users.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const users = JSON.parse(fileContents);

  const { username, password, role } = req.body;

  const user = users[username];
  if (!user || user.password !== password || user.role !== role) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.status(200).json({
    username,
    role,
    message: "Login successful",
  });
}
