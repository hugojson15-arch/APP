import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = (await searchParams).next ?? "/";
  return <LoginForm next={next} />;
}
