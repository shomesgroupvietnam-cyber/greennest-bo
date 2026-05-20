import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";

export function LogoutForm() {
  return (
    <form action={logoutAction}>
      <Button size="sm" type="submit" variant="outline">
        Đăng xuất
      </Button>
    </form>
  );
}
