import { LoginForm } from '@/components/LoginForm';
import { LOGIN_COPY } from '@/components/LoginForm/constants';
import styles from './HomePage.module.scss';

const { HEADING } = LOGIN_COPY;

export default function HomePage() {
  return (
    <main className={styles.login}>
      <h1 className={styles.login__title}>{HEADING}</h1>
      <LoginForm />
    </main>
  );
}
