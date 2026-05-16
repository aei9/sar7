import { useGetCareerDashboard, getGetCareerDashboardQueryKey, useGetSkillGaps, getGetSkillGapsQueryKey, useGetCourses, getGetCoursesQueryKey, useGetJobs, getGetJobsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { BookOpen, Briefcase, Award, Zap, TrendingUp, ArrowLeft, ExternalLink } from "lucide-react";

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-black text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboard, isLoading: dashLoading } = useGetCareerDashboard({ query: { queryKey: getGetCareerDashboardQueryKey() } });
  const { data: gaps, isLoading: gapsLoading } = useGetSkillGaps({ query: { queryKey: getGetSkillGapsQueryKey() } });
  const { data: courses, isLoading: coursesLoading } = useGetCourses({ limit: 3 }, { query: { queryKey: getGetCoursesQueryKey({ limit: 3 }) } });
  const { data: jobs, isLoading: jobsLoading } = useGetJobs({ limit: 3 }, { query: { queryKey: getGetJobsQueryKey({ limit: 3 }) } });

  const d = dashboard as { profileScore: number; skillsCount: number; badgesCount: number; jobMatchCount: number; careerReadiness: number; topSkillGaps: string[]; recentActivity: { type: string; title: string; date: string }[] } | undefined;
  const g = gaps as { overallReadiness: number; missingSkills: { name: string; priority: string }[] } | undefined;

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Welcome header */}
        <div className="bg-gradient-to-l from-[hsl(222,47%,11%)] to-[hsl(222,38%,20%)] rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-black mb-1">مرحباً، {user?.fullName} 👋</h1>
          <p className="text-white/70 text-sm">تابع تقدمك المهني واكتشف فرصك الجديدة</p>
          {!dashLoading && d && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div
                  className="bg-accent rounded-full h-2 transition-all duration-700"
                  style={{ width: `${d.careerReadiness}%` }}
                />
              </div>
              <span className="text-accent font-bold text-sm">{d.careerReadiness}% جاهزية مهنية</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dashLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />) : (
            <>
              <StatCard title="نقاط الملف" value={d?.profileScore ?? 0} icon={TrendingUp} color="bg-primary/10 text-primary" />
              <StatCard title="مهاراتي" value={d?.skillsCount ?? 0} icon={Zap} color="bg-accent/15 text-[hsl(35,85%,40%)]" />
              <StatCard title="أوسمتي" value={d?.badgesCount ?? 0} icon={Award} color="bg-green-100 text-green-700" />
              <StatCard title="وظائف مناسبة" value={d?.jobMatchCount ?? 0} icon={Briefcase} color="bg-blue-100 text-blue-700" />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Skill gaps */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">الفجوات المهارية</CardTitle>
                <Link href="/skills" className="text-xs text-accent hover:underline flex items-center gap-1">
                  عرض الكل <ArrowLeft className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {gapsLoading ? <Skeleton className="h-32" /> : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">الجاهزية الإجمالية</span>
                    <span className="font-black text-primary text-lg">{g?.overallReadiness ?? 0}%</span>
                  </div>
                  {(g?.missingSkills ?? []).slice(0, 4).map((s: { name: string; priority: string }) => (
                    <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <span className="text-sm font-medium">{s.name}</span>
                      <Badge variant={s.priority === "high" ? "destructive" : s.priority === "medium" ? "secondary" : "outline"} className="text-xs">
                        {s.priority === "high" ? "عالية" : s.priority === "medium" ? "متوسطة" : "منخفضة"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended courses */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">الدورات المقترحة</CardTitle>
                <Link href="/courses" className="text-xs text-accent hover:underline flex items-center gap-1">
                  عرض الكل <ArrowLeft className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? <Skeleton className="h-40" /> : (
                <div className="space-y-3">
                  {(courses as { id: number; titleAr: string; provider: string; isFree: boolean; url: string }[] | undefined ?? []).map((c) => (
                    <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{c.titleAr}</p>
                        <p className="text-xs text-muted-foreground">{c.provider}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.isFree && <Badge variant="outline" className="text-xs text-green-700 border-green-300">مجاني</Badge>}
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-accent" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Jobs preview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">الوظائف المناسبة لك</CardTitle>
              <Link href="/jobs" className="text-xs text-accent hover:underline flex items-center gap-1">
                عرض الكل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {jobsLoading ? <Skeleton className="h-24" /> : (
              <div className="grid sm:grid-cols-3 gap-3">
                {(jobs as { id: number; titleAr: string; organization: string; matchPercentage: number; salaryMin?: number; salaryMax?: number; canApply: boolean }[] | undefined ?? []).map((j) => (
                  <div key={j.id} className="p-3 rounded-xl border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold">{j.titleAr}</p>
                      <span className={`text-xs font-bold ${j.canApply ? "text-green-600" : "text-orange-500"}`}>{j.matchPercentage}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{j.organization}</p>
                    {j.salaryMin && (
                      <p className="text-xs text-primary font-medium">{j.salaryMin.toLocaleString()} - {j.salaryMax?.toLocaleString()} ريال</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
