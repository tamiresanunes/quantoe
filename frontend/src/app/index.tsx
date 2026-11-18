import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/auth-context';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? '/home' : '/auth/login'} />;
}
