import styles from "../styles/SizeLabel.module.css";

const FRACTION_RE = /^(\d+)\s+(\d+\/\d+)$/;

export default function SizeLabel({ value }: { value: string }) {
  const match = value.match(FRACTION_RE);
  if (!match) return <>{value}</>;
  const [, whole, fraction] = match;
  return (
    <>
      {whole}
      <span className={styles.fraction}>{fraction}</span>
    </>
  );
}
