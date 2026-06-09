import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/seed')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/api/seed"!</div>
}
