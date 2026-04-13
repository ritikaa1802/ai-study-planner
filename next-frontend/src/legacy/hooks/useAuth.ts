import { useAuthContext } from "../context/AuthContext";

export function useAuth() {
  const { user, dark, setDark } = useAuthContext();
  return { user, dark, setDark };
}
