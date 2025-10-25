import fs from "fs";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// JWT Secret - In production, use environment variable
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d"; // Token expires in 7 days

const DB_PATH = path.join(process.cwd(), "data", "users.json");

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // In production, this should be hashed!
  createdAt: string;
}

/**
 * Read all users from the fake database
 */
export function readUsers(): User[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, "[]");
      return [];
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users:", error);
    return [];
  }
}

/**
 * Write users to the fake database
 */
export function writeUsers(users: User[]): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error writing users:", error);
  }
}

/**
 * Find a user by username or email
 */
export function findUser(identifier: string): User | undefined {
  const users = readUsers();
  return users.find(
    (user) => user.username === identifier || user.email === identifier
  );
}

/**
 * Create a new user
 */
export function createUser(
  username: string,
  email: string,
  password: string
): User {
  const users = readUsers();

  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    email,
    password, // WARNING: In production, hash this!
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  return newUser;
}

/**
 * Generate a real JWT token
 */
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error("Token decode failed:", error);
    return null;
  }
}
