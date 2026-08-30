export default function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="card border-dashed">
        <p className="text-neutral-600 dark:text-neutral-400">
          Dieser Bereich entsteht in {phase}. Das Gerüst, die Anmeldung und das Deployment stehen
          bereits.
        </p>
      </div>
    </section>
  )
}
