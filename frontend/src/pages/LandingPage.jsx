import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    window.location.replace('/landing/index.html');
  }, []);

  return null;
}
