export default function PatientPage({ params }) {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Patient {params.id}</h1>
      <p>Patient detail placeholder.</p>
    </main>
  );
}
