import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorMessage } from "../components/ui/ErrorMessage";

export default function RegisterPage() {
  const nav = useNavigate();
  const [f, setF] = useState({ username: "", email: "", password: "", confirm_password: "" });
  const [err, setErr] = useState("");
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await authService.register(f);
          nav("/login");
        } catch {
          setErr("Could not register. Check your details.");
        }
      }}
      className="max-w-sm mx-auto p-6 space-y-4 mt-16"
    >
      <h1 className="text-2xl font-bold text-center">Create account</h1>
      <Input label="Username" value={f.username} onChange={upd("username")} />
      <Input label="Email" type="email" value={f.email} onChange={upd("email")} />
      <Input label="Password" type="password" value={f.password} onChange={upd("password")} />
      <Input
        label="Confirm password"
        type="password"
        value={f.confirm_password}
        onChange={upd("confirm_password")}
      />
      {err && <ErrorMessage message={err} />}
      <Button type="submit" className="w-full">
        Create account
      </Button>
      <p className="text-center text-sm text-muted">
        Have an account?{" "}
        <Link to="/login" className="text-primary font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}