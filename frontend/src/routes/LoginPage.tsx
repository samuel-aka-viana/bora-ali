import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorMessage } from "../components/ui/ErrorMessage";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await login(username, password);
          nav("/places");
        } catch {
          setErr("Invalid credentials");
        }
      }}
      className="max-w-sm mx-auto p-6 space-y-4 mt-16"
    >
      <h1 className="text-2xl font-bold text-center">Bora Ali</h1>
      <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {err && <ErrorMessage message={err} />}
      <Button type="submit" className="w-full">
        Sign in
      </Button>
      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link to="/register" className="text-primary font-medium">
          Register
        </Link>
      </p>
    </form>
  );
}
