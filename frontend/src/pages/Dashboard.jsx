import { useEffect } from 'react';

export default function Dashboard() {
  useEffect(() => {
    window.location.replace('/dashboard/index.html');
  }, []);
  return null;
}
