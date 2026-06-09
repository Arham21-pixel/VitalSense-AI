export default function AlertCard({ alert }) {
  return (
    <article>
      <strong>{alert?.title ?? 'Alert'}</strong>
      <p>{alert?.message ?? 'Alert details'}</p>
    </article>
  );
}
