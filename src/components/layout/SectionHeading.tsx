import styles from '../components.module.css';

interface SectionHeadingProps {
  title: string;
  description?: string;
}

export function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <div>
      <h1 className={styles.heading}>{title}</h1>
      {description && <p className={styles.headingDescription}>{description}</p>}
    </div>
  );
}
