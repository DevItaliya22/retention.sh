import { prisma } from "@reelo/db";
import cors from "cors";
import express, { type Express, type Request, type Response } from "express";

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

const app: Express = express();
const PORT = process.env.PORT ?? 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Express server is running!" });
});

app.get("/api/hello", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({});

  res.json({ message: "Hello, world!", users });
});

app.get("/api/users", async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json({ users, count: users.length });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/new-user", async (_req: Request, res: Response) => {
  const { email, password } = _req.body;
  const user = await prisma.user.create({
    data: { email, password },
  });
  console.log(user);
  res.json({ message: "User created", user });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
