import { useState } from "react";
import { useGetJobs, getGetJobsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, Building2, ExternalLink, CheckCircle2, XCircle, Filter } from "lucide-react";

type Job = {
  id: number; title: string; titleAr: string; organization: string; salaryMin?: number | null; salaryMax?: number | null;
  platform: string; applyUrl: string; requiredSkills: string[]; matchedSkills: string[]; missingSkills: string[];
  matchPercentage: number; canApply: boolean; location?: string | null; jobType?: string | null;
};

const platformColors: Record<string, string> = {
  "جدارة": "bg-green-100 text-green-700",
  "LinkedIn": "bg-sky-100 text-sky-700",
  "Bayt": "bg-orange-100 text-orange-700",
};

export default function JobsPage() {
  const [readyOnly, setReadyOnly] = useState(false);
  const { data, isLoading } = useGetJobs({ limit: 20, readyOnly }, { query: { queryKey: getGetJobsQueryKey({ limit: 20, readyOnly }) } });
  const jobs = (data as Job[] | undefined) ?? [];

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground">الوظائف المناسبة</h1>
            <p className="text-muted-foreground text-sm mt-0.5">وظائف مقترحة بناءً على مهاراتك وهدفك المهني</p>
          </div>
          <div className="flex gap-2">
            <Button variant={!readyOnly ? "default" : "outline"} size="sm" onClick={() => setReadyOnly(false)} data-testid="filter-all-jobs">
              كل الوظائف
            </Button>
            <Button variant={readyOnly ? "default" : "outline"} size="sm" onClick={() => setReadyOnly(true)} data-testid="filter-ready-jobs">
              <Filter className="w-3.5 h-3.5 ml-1" /> جاهز للتقديم
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((j) => (
              <Card key={j.id} className={`hover:shadow-md transition-all duration-200 ${j.canApply ? "border-green-200" : ""}`} data-testid={`job-card-${j.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-foreground">{j.titleAr}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5" />{j.organization}
                          </span>
                          {j.location && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />{j.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <div className={`text-2xl font-black mb-0.5 ${j.matchPercentage >= 70 ? "text-green-600" : j.matchPercentage >= 40 ? "text-orange-500" : "text-red-500"}`}>
                        {j.matchPercentage}%
                      </div>
                      <p className="text-xs text-muted-foreground">تطابق</p>
                    </div>
                  </div>

                  {/* Match bar */}
                  <div className="h-1.5 bg-muted rounded-full mb-4">
                    <div className={`h-1.5 rounded-full transition-all ${j.matchPercentage >= 70 ? "bg-green-500" : j.matchPercentage >= 40 ? "bg-orange-400" : "bg-red-400"}`}
                      style={{ width: `${j.matchPercentage}%` }} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    {/* Matched skills */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">المهارات المطابقة</p>
                      <div className="flex flex-wrap gap-1.5">
                        {j.matchedSkills.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                            <CheckCircle2 className="w-2.5 h-2.5" />{s}
                          </span>
                        ))}
                        {j.matchedSkills.length === 0 && <span className="text-xs text-muted-foreground">لا يوجد</span>}
                      </div>
                    </div>
                    {/* Missing skills */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">المهارات الناقصة</p>
                      <div className="flex flex-wrap gap-1.5">
                        {j.missingSkills.slice(0, 3).map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                            <XCircle className="w-2.5 h-2.5" />{s}
                          </span>
                        ))}
                        {j.missingSkills.length === 0 && <span className="text-xs text-green-600 font-medium">لديك كل المهارات</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${platformColors[j.platform] ?? "bg-gray-100 text-gray-700"}`}>{j.platform}</span>
                      {j.salaryMin && (
                        <span className="text-sm font-bold text-primary">{j.salaryMin.toLocaleString()} - {j.salaryMax?.toLocaleString()} ريال</span>
                      )}
                    </div>
                    <a href={j.applyUrl} target="_blank" rel="noopener noreferrer" data-testid={`apply-job-${j.id}`}>
                      <Button size="sm" variant={j.canApply ? "default" : "outline"} disabled={!j.canApply} className={j.canApply ? "" : "opacity-60"}>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        {j.canApply ? "تقديم الآن" : "أكمل مهاراتك للتقديم"}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {jobs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد وظائف مناسبة حالياً</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
