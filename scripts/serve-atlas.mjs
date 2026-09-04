import http from "node:http"
import handler from "serve-handler"
import { existsSync } from "node:fs"
import identify from "../api/atlas-identify.js"
import suggestions from "../api/atlas-suggestions.js"

if (existsSync(".env.local")) process.loadEnvFile(".env.local")
const port = Number(process.env.PORT || 4321)
http
  .createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname
    if (pathname === "/api/atlas-identify") {
      void identify(req, res)
    } else if (pathname === "/api/atlas-suggestions") {
      void suggestions(req, res)
    } else {
      void handler(req, res, { public: "public", cleanUrls: true })
    }
  })
  .listen(port, "127.0.0.1", () => console.log(`Atlas local: http://127.0.0.1:${port}`))
