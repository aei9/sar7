import { useState } from "react";
import { useGetCourses, getGetCoursesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { BookOpen, ExternalLink, Clock, Search, Star } from "lucide-react";

type Course = {
  id: number; title: string; titleAr: string; provider: string; url: string;
  skills: string[]; duration?: string | null; level?: string | null; isFree: boolean; relevanceScore: number; category: string;
};

const providerColors: Record<string, string> = {
  "Coursera": "bg-blue-100 text-blue-700",
  "Udemy": "bg-orange-100 text-orange-700",
  "LinkedIn Learning": "bg-sky-100 text-sky-700",
  "Khan Academy": "bg-green-100 text-green-700",
  "Google": "bg-yellow-100 text-yellow-700",
  "Edraak": "bg-purple-100 text-purple-700",
  "Microsoft Learn": "bg-blue-100 text-blue-700",
  "GitHub Skills": "bg-gray-100 text-gray-700",
};

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetCourses({ limit: 20 }, { query: { queryKey: getGetCoursesQueryKey({ limit: 20 }) } });
  const courses = (data as Course[] | undefined) ?? [];

  const filtered = courses.filter(
    (c) => c.titleAr.includes(search) || c.title.toLowerCase().includes(search.toLowerCase()) || c.provider.includes(search)
  );

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">الدورات التدريبية المقترحة</h1>
          <p className="text-muted-foreground text-sm mt-0.5">دورات مختارة بناءً على مهاراتك وأهدافك المهنية</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن دورة..." className="pr-10" data-testid="input-search-courses" />
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {courses.filter(c => c.isFree).length} دورة مجانية
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {courses.filter(c => !c.isFree).length} دورة مدفوعة
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-accent" />
            {courses.length} دورة إجمالاً
          </div>
        </div>

        {/* Courses grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" data-testid={`course-card-${c.id}`}
                className="block group">
                <Card className="h-full hover:shadow-md hover:border-accent/50 transition-all duration-200 cursor-pointer">
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.isFree && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">مجاني</Badge>}
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-foreground leading-tight mb-1">{c.titleAr}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{c.title}</p>

                    {/* Provider */}
                    <span className={`inline-flex self-start px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${providerColors[c.provider] ?? "bg-gray-100 text-gray-700"}`}>
                      {c.provider}
                    </span>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-3 flex-1">
                      {c.skills.slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs">{s}</span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                      {c.duration && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />{c.duration}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                        <Star className="w-3 h-3 fill-current" />{c.relevanceScore}% ملاءمة
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}

        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد دورات تطابق بحثك</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
