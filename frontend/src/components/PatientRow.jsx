export default function PatientRow({ patient }) {
  return (
    <div>
      <strong>{patient?.name ?? 'Patient'}</strong>
      <span>{patient?.status ?? 'stable'}</span>
    </div>
  );
}
