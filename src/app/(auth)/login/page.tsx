import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/auth/actions";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    loggedOut?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();
  const params = await searchParams;
  const isMockMode = session.mode === "mock";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">GreenNest BuildFlow</h1>
          <p className="mt-2 text-sm text-slate-600">
            {isMockMode
              ? "Đang chạy bằng phiên mô phỏng cục bộ vì chưa có cấu hình Supabase Auth."
              : "Đăng nhập bằng Supabase Auth đã cấu hình cho môi trường hiện tại."}
          </p>
        </div>

        {params?.error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Không thể đăng nhập. Vui lòng kiểm tra email và mật khẩu.
          </p>
        ) : null}
        {params?.loggedOut ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Bạn đã đăng xuất khỏi phiên hiện tại.
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              defaultValue={isMockMode ? session.user.email : ""}
              id="email"
              name="email"
              placeholder="founder@greennest.vn"
              readOnly={isMockMode}
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="password">
              Mật khẩu
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="password"
              name="password"
              placeholder="••••••••"
              readOnly={isMockMode}
              type="password"
            />
          </div>
          <Button className="w-full" type="submit">
            {isMockMode ? "Tiếp tục với phiên mô phỏng" : "Đăng nhập"}
          </Button>
        </form>

        <div className="mt-5 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          <p>Chế độ: {session.mode === "supabase" && !session.isFallback ? "Supabase Auth" : "Mock fallback"}</p>
          <p>Vai trò hiện tại: {session.user.role}</p>
        </div>
      </section>
    </main>
  );
}
