import { useGetBadges, getGetBadgesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, ExternalLink, ShieldCheck } from "lucide-react";

type BadgeItem = {
  id: number; title: string; titleAr: string; description: string;
  earnedAt: string; category: string; icon: string; color: string; verificationUrl?: string | null; issuer: string;
};

const iconMap: Record<string, string> = {
  award: "🏆", star: "⭐", shield: "🛡️", check: "✅", zap: "⚡", book: "📚", briefcase: "💼",
};

export default function BadgesPage() {
  const { data, isLoading } = useGetBadges({ query: { queryKey: getGetBadgesQueryKey() } });
  const badges = (data as BadgeItem[] | undefined) ?? [];

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">الأوسمة الرقمية</h1>
          <p className="text-muted-foreground text-sm mt-0.5">ملفك المهاري الرقمي المدعوم بأوسمة موثوقة</p>
        </div>

        {/* Summary */}
        {!isLoading && badges.length > 0 && (
          <div className="bg-gradient-to-l from-[hsl(222,47%,11%)] to-[hsl(222,38%,20%)] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center">
                <Award className="w-8 h-8 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-black text-accent">{badges.length}</p>
                <p className="text-white/70 text-sm">وسام مكتسب</p>
                <p className="text-white/50 text-xs mt-0.5">جميع أوسمتك موثقة ومعترف بها</p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : badges.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">لم تحصل على أوسمة بعد</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              أكمل ملفك المهاري، وأضف شهاداتك ومهاراتك لتبدأ في اكتساب الأوسمة الرقمية
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((b) => (
              <Card key={b.id} className="hover:shadow-md transition-all duration-200 overflow-hidden" data-testid={`badge-card-${b.id}`}>
                <div className="h-1.5" style={{ backgroundColor: b.color }} />
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: `${b.color}20`, border: `2px solid ${b.color}30` }}>
                      {iconMap[b.icon] ?? "🏅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm leading-tight">{b.titleAr}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.title}</p>
                    </div>
                    {b.verificationUrl && (
                      <a href={b.verificationUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{b.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">المُصدر</p>
                      <p className="text-xs font-semibold">{b.issuer}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">تاريخ الحصول</p>
                      <p className="text-xs font-semibold">{new Date(b.earnedAt).toLocaleDateString("ar-SA")}</p>
                    </div>
                  </div>
                  {b.verificationUrl && (
                    <a href={b.verificationUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 mt-3 text-xs text-accent hover:underline font-medium">
                      <ExternalLink className="w-3 h-3" />التحقق من الوسام
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
