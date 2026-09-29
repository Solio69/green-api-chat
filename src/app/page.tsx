import styles from './page.module.scss';

export default function HomePage() {
  return (
    <main className={styles.foundation}>
      <h1 className={styles.foundation__title}>GREEN-API Chat</h1>
      <p className={styles.foundation__description}>
        Основа приложения готова. Подключение к Telegram и переписка появятся на
        следующих этапах.
      </p>
    </main>
  );
}
