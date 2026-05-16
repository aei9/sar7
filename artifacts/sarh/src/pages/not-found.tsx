import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-black text-primary mb-4">404</h1>
        <p className="text-muted-foreground text-base mb-6">الصفحة المطلوبة غير موجودة</p>
        <Link href="/">
          <Button><Home className="w-4 h-4 ml-2" />العودة للرئيسية</Button>
        </Link>
      </div>
    </div>
  );
}
