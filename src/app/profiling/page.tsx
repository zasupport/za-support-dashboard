// Redirect to the canonical AI Profiling page at /ai-profiling
import { redirect } from 'next/navigation';

export default function ProfilingRedirect() {
  redirect('/ai-profiling');
}
