import "dotenv/config"; // Load environment variables from .env file
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./middleware/static";
import { createServer } from "http";
import cors from "cors";
import session from "express-session";

const app = express();
const BODY_LIMIT = "10mb";
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// CORS configuration
// Allow both localhost (development) and Vercel frontend (production)
const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:5173", // Vite default port
  "https://prince-and-princess-frontend.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log("[CORS] Request with no origin - allowing");
      return callback(null, true);
    }
    
    console.log(`[CORS] Checking origin: ${origin}`);
    
    // Check if origin is in allowed list (case-insensitive)
    const originLower = origin.toLowerCase();
    const isAllowed = allowedOrigins.some(allowed => allowed.toLowerCase() === originLower);
    
    if (isAllowed) {
      console.log(`[CORS] ✅ Origin allowed: ${origin}`);
      callback(null, true);
    } else if (origin.includes("vercel.app") || origin.includes("localhost")) {
      // Allow any Vercel subdomain or localhost in production
      console.log(`[CORS] ✅ Origin allowed (Vercel/localhost): ${origin}`);
      callback(null, true);
    } else {
      // In development, allow any localhost origin
      if (process.env.NODE_ENV !== "production" && origin.includes("localhost")) {
        console.log(`[CORS] ✅ Origin allowed (dev localhost): ${origin}`);
        callback(null, true);
      } else {
        console.log(`[CORS] ❌ Origin blocked: ${origin}`);
        console.log(`[CORS] Allowed origins: ${allowedOrigins.join(", ")}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

app.use(
  express.json({
    limit: BODY_LIMIT,
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: BODY_LIMIT }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // In separated mode (BACKEND_PORT set), only serve API, not frontend
  // In production or when serving both, serve static files
  // In development with separated frontend, skip frontend serving
  const isSeparatedMode = process.env.BACKEND_PORT !== undefined || process.env.SEPARATED === "true";
  
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else if (!isSeparatedMode) {
    // Development mode with combined server - serve frontend via Vite
    const { setupVite } = await import("./middleware/vite");
    await setupVite(httpServer, app);
  } else {
    // Separated mode - only serve API, return 404 for non-API routes
    app.use("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.status(404).json({ error: "Not found. This is the API server only." });
      }
    });
  }

  // Backend server port - separate from frontend
  // Default to 3000 for backend API server
  const port = parseInt(process.env.PORT || process.env.BACKEND_PORT || "3000", 10);
  httpServer.listen(
    port,
    "0.0.0.0",
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
