import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/seed')({
  server: {
    handlers: {
      GET: async () => new Response('ok'),
    },
  },
})
