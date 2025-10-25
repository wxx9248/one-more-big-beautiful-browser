"use client";

import { logoutAction } from "@/controller/auth-actions";
import { Button } from "@heroui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" color="danger" variant="flat" size="sm">
        Logout
      </Button>
    </form>
  );
}
