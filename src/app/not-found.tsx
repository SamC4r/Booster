import { redirect } from 'next/navigation'

export default function NotFound() {
  // Immediately redirect server-side to home to avoid exposing 404 pages
  // This keeps crawlers from indexing not-found pages and sends users home.
  redirect('/')
}
