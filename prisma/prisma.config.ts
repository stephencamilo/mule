import { defineConfig } from 'prisma/config'

export default defineConfig({
  database: {
    url: "file:./dev.db"
  }
})