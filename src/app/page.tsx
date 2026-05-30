import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Headphones,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const contact = {
  phone: "0832056565",
  phoneDisplay: "0832 056 565",
  email: "s.homes.group.vietnam@gmail.com",
  address: "V5B10, KĐT An Hưng, Dương Nội, Hà Nội",
};

const navItems = [
  { label: "Giới thiệu", href: "#gioi-thieu" },
  { label: "Giải pháp", href: "#giai-phap" },
  { label: "Tính năng", href: "#tinh-nang" },
  { label: "Lợi ích", href: "#tinh-nang" },
  { label: "Tin tức", href: "#tin-tuc" },
  { label: "Liên hệ", href: "#lien-he" },
];

const roleGroups = [
  {
    axis: "Trục 1",
    title: "Dự án | Project Management",
    description: "Quản lý phát triển dự án, danh mục đầu tư, pháp lý, thiết kế và đề xuất nội bộ.",
    href: "/login?entry=1&next=development",
    icon: Building2,
  },
  {
    axis: "Trục 2",
    title: "Kiến tạo | Build Management",
    description: "Quản lý tiến độ, chi phí, chất lượng, hợp đồng, thi công và bàn giao.",
    href: "/login?entry=1&next=delivery",
    icon: ShieldCheck,
  },
  {
    axis: "Trục 3",
    title: "Điều hành | Operations & Analytics",
    description:
      "Vận hành hệ thống, tài chính, nhân sự, báo cáo, phân tích và hỗ trợ ra quyết định.",
    href: "/login?entry=1&next=operations",
    icon: Headphones,
  },
];

const stats = [
  { value: "150+", label: "Dự án đang quản lý", icon: BarChart3 },
  { value: "500+", label: "Người dùng", icon: UsersRound },
  { value: "98%", label: "Tỷ lệ hoàn thành đúng hạn", icon: CheckCircle2 },
  { value: "100%", label: "Dữ liệu tập trung & bảo mật", icon: ShieldCheck },
];

const benefits = [
  {
    title: "Bảo mật tuyệt đối",
    description: "Dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn quốc tế",
    icon: ShieldCheck,
  },
  {
    title: "Tối ưu hiệu suất",
    description:
      "Tự động hóa quy trình, giảm thiểu thời gian và chi phí vận hành",
    icon: ArrowRight,
  },
  {
    title: "Báo cáo thông minh",
    description: "Dashboard trực quan, cập nhật theo thời gian thực",
    icon: BarChart3,
  },
  {
    title: "Kết nối toàn diện",
    description: "Liên kết xuyên suốt các phòng ban và đối tác dự án",
    icon: UsersRound,
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#062f28] text-white lg:h-screen lg:overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(132, 204, 22, 0.12), transparent 28%, rgba(20, 83, 45, 0.24) 62%, transparent 100%), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 86px 86px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-3 sm:px-6 lg:h-screen lg:min-h-0 lg:px-8 xl:px-10">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 grid-cols-2 gap-1 rounded-lg bg-lime-500 p-2 text-[#062f28] shadow-lg shadow-lime-950/25 sm:h-12 sm:w-12">
              <span className="rounded-br-lg rounded-tl-md bg-[#062f28]" />
              <span className="rounded-bl-lg rounded-tr-md bg-[#062f28]" />
              <span className="rounded-bl-md rounded-tr-lg bg-[#062f28]" />
              <span className="rounded-br-md rounded-tl-lg bg-[#062f28]" />
            </div>
            <div>
              <span className="sr-only">GreenNest BuildFlow</span>
              <p className="text-xl font-bold leading-6 tracking-wide sm:text-2xl">
                GreenNest
              </p>
              <p className="text-sm font-semibold text-lime-300">BuildFlow</p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/85 lg:flex">
            {navItems.map((item) => (
              <a
                className="transition hover:text-lime-300"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Button
            asChild
            className="h-10 rounded-lg border border-lime-400/70 bg-white/10 px-4 text-white shadow-sm shadow-lime-950/20 hover:bg-lime-400 hover:text-[#062f28]"
          >
            <Link href="/login?entry=1">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          </Button>
        </header>

        <section
          className="flex min-h-0 flex-1 flex-col justify-center py-4 lg:py-3"
          id="gioi-thieu"
        >
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-3xl font-black uppercase leading-[1.08] text-white sm:text-4xl lg:text-5xl xl:text-6xl">
              CHUYÊN GIA QUẢN LÝ VÒNG ĐỜI
              <span className="block">
                CÁC <span className="text-lime-400">DỰ ÁN XÂY DỰNG</span>
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-white/82 sm:text-base">
              Nền tảng hợp nhất giúp tối ưu quy trình - Minh bạch dữ liệu - Nâng
              cao hiệu suất cho mọi dự án bất động sản và xây dựng.
            </p>
          </div>

          <div
            className="mx-auto mt-4 grid w-full max-w-6xl gap-3 md:grid-cols-3 lg:mt-5"
            id="giai-phap"
          >
            {roleGroups.map((group) => {
              const Icon = group.icon;

              return (
                <Link
                  className="group grid min-h-[112px] grid-cols-[3rem_1fr_2.5rem] items-center gap-3 rounded-lg border border-white/15 bg-white/[0.07] p-4 shadow-lg shadow-black/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-lime-400/80 hover:bg-white/[0.11] focus:outline-none focus:ring-2 focus:ring-lime-300"
                  href={group.href}
                  key={group.title}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/20 text-lime-300 ring-1 ring-lime-300/30">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                      {group.axis}
                    </p>
                    <h2 className="mt-1 text-lg font-black uppercase leading-tight text-white xl:text-xl">
                      {group.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/78">
                      {group.description}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 text-[#062f28] transition group-hover:translate-x-1">
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mx-auto mt-4 w-full max-w-7xl overflow-hidden rounded-lg border border-lime-300/50 bg-slate-950 shadow-2xl shadow-black/25 lg:mt-5">
            <div
              className="relative h-52 bg-cover bg-center sm:h-64 lg:h-[min(25vh,270px)]"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(6, 47, 40, 0.54), rgba(6, 47, 40, 0.08) 45%, rgba(6, 47, 40, 0.2)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')",
              }}
              role="img"
              aria-label="Phối cảnh khu đô thị và công trình xây dựng"
            >
              <div className="hidden h-flex w-64 flex-col justify-center gap-3 border-r border-white/10 bg-[#062f28]/78 p-5 backdrop-blur-sm sm:flex lg:w-72">
                {stats.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div className="flex items-center gap-3" key={item.label}>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-400/18 text-lime-300 ring-1 ring-lime-300/20">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span>
                        <strong className="block text-2xl leading-6 text-white">
                          {item.value}
                        </strong>
                        <span className="text-sm leading-5 text-white/78">
                          {item.label}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="mx-auto mt-3 grid w-full max-w-7xl gap-3 rounded-lg bg-slate-50 p-3 text-slate-900 shadow-xl shadow-black/10 sm:grid-cols-2 lg:grid-cols-4"
            id="tinh-nang"
          >
            {benefits.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="flex min-w-0 items-start gap-3 border-slate-200 px-2 lg:border-r lg:last:border-r-0"
                  key={item.title}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-100 text-emerald-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-sm font-bold leading-5">
                      {item.title}
                    </strong>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">
                      {item.description}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <footer
          className="shrink-0 border-t border-white/10 py-2 text-sm text-slate-100"
          id="lien-he"
        >
          <div className="grid w-full gap-2 md:grid-cols-3">
            <a
              className="flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-center hover:bg-white/10"
              href={`tel:${contact.phone}`}
            >
              <Phone className="h-4 w-4 text-lime-300" aria-hidden="true" />
              <span>{contact.phoneDisplay}</span>
            </a>
            <a
              className="flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-center hover:bg-white/10"
              href={`mailto:${contact.email}`}
            >
              <Mail className="h-4 w-4 text-lime-300" aria-hidden="true" />
              <span className="min-w-0 break-all">{contact.email}</span>
            </a>
            <div className="flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-center">
              <MapPin
                className="h-4 w-4 shrink-0 text-lime-300"
                aria-hidden="true"
              />
              <span className="min-w-0 break-words">{contact.address}</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
