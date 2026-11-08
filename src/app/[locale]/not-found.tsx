import { Link } from "@/i18n/routing";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-md p-8 rounded-2xl glass-panel border border-border/70">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
          <Compass className="w-8 h-8 animate-spin" />
        </div>
        <h1 className="text-4xl font-extrabold text-foreground">404</h1>
        <p className="text-sm text-muted-foreground">
          الصفحة المطلوبة غير موجودة أو تم نقلها.
          <br />
          The page you requested does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan shadow-md hover:scale-105 transition-transform"
        >
          العودة للرئيسية / Return Home
        </Link>
      </div>
    </div>
  );
}
