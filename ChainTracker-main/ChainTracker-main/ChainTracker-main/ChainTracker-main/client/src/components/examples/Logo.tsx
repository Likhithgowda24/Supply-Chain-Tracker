import { Logo } from "../Logo";

export default function LogoExample() {
  return (
    <div className="p-8 space-y-8">
      <Logo size="sm" />
      <Logo size="md" />
      <Logo size="lg" />
      <Logo size="md" showText={false} />
    </div>
  );
}
