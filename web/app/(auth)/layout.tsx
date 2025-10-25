"use client";

export default function AuthLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {children}
    </div>
  );
}
