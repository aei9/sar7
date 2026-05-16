import { useState } from "react";
import { useGetSkills, getGetSkillsQueryKey, useGetSkillGaps, getGetSkillGapsQueryKey, useAddSkill, useDeleteSkill } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Zap, Target, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

const categories = ["برمجة", "تصميم", "إدارة", "تحليل", "تواصل", "عام"];
const levels = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
  { value: "expert", label: "خبير" },
];
const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};
const priorityLabels: Record<string, string> = { high: "أولوية عالية", medium: "أولوية متوسطة", low: "أولوية منخفضة" };

export default function SkillsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: skills, isLoading: skillsLoading } = useGetSkills({ query: { queryKey: getGetSkillsQueryKey() } });
  const { data: gaps, isLoading: gapsLoading } = useGetSkillGaps({ query: { queryKey: getGetSkillGapsQueryKey() } });
  const addSkill = useAddSkill();
  const deleteSkill = useDeleteSkill();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("عام");
  const [type, setType] = useState<"current" | "desired">("current");
  const [level, setLevel] = useState("intermediate");

  type SkillItem = { id: number; name: string; category: string; type: string; proficiencyLevel?: string | null; verified?: boolean };
  type GapSkill = { name: string; priority: string; reason: string };
  type GapData = { careerGoal: string; overallReadiness: number; missingSkills: GapSkill[]; strengthSkills: string[]; recommendations: string[] };

  const allSkills = (skills as SkillItem[] | undefined) ?? [];
  const currentSkills = allSkills.filter((s) => s.type === "current");
  const desiredSkills = allSkills.filter((s) => s.type === "desired");
  const gapData = gaps as GapData | undefined;

  function handleAdd() {
    if (!name.trim()) return;
    addSkill.mutate(
      { data: { name: name.trim(), category, type, proficiencyLevel: level } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSkillsQueryKey() });
          setName(""); setShowForm(false);
          toast({ title: "تمت إضافة المهارة" });
        },
        onError: () => toast({ title: "خطأ في الإضافة", variant: "destructive" }),
      }
    );
  }

  function handleDelete(id: number) {
    deleteSkill.mutate(
      { id },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetSkillsQueryKey() }); toast({ title: "تم حذف المهارة" }); },
        onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
      }
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground">المهارات والفجوات</h1>
            <p className="text-muted-foreground text-sm mt-0.5">تحليل ذكي لمهاراتك وخارطة طريق للتطوير</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-skill">
            <Plus className="w-4 h-4 ml-1" /> إضافة مهارة
          </Button>
        </div>

        {/* Add form */}
        {showForm && (
          <Card className="border-primary/30 shadow-md">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-sm">إضافة مهارة جديدة</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المهارة" data-testid="input-skill-name" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-input px-3 py-2 text-sm bg-background">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2">
                  {["current", "desired"].map((t) => (
                    <button key={t} type="button" onClick={() => setType(t as "current" | "desired")}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${type === t ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                      {t === "current" ? "مهارة حالية" : "مهارة مستهدفة"}
                    </button>
                  ))}
                </div>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-lg border border-input px-3 py-2 text-sm bg-background">
                  {levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={addSkill.isPending} className="flex-1">حفظ</Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">إلغاء</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Skill gap analysis */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />تحليل الجاهزية</CardTitle>
              </CardHeader>
              <CardContent>
                {gapsLoading ? <Skeleton className="h-40" /> : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-3">
                        <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                            strokeDasharray={`${(gapData?.overallReadiness ?? 0) * 1.005} 100.5`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-black text-primary">{gapData?.overallReadiness ?? 0}%</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">جاهزية لـ{gapData?.careerGoal}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">نقاط القوة</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(gapData?.strengthSkills ?? []).map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle2 className="w-2.5 h-2.5" />{s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">التوصيات</p>
                      <ul className="space-y-1">
                        {(gapData?.recommendations ?? []).map((r, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Skills lists */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current skills */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-accent" />مهاراتي الحالية ({currentSkills.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {skillsLoading ? <Skeleton className="h-24" /> : currentSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لم تُضف مهارات بعد</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentSkills.map((s) => (
                      <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 group">
                        <span>{s.name}</span>
                        {s.proficiencyLevel && <span className="text-xs opacity-60">({levels.find(l => l.value === s.proficiencyLevel)?.label})</span>}
                        <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`delete-skill-${s.id}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Desired skills */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-blue-600" />المهارات المستهدفة ({desiredSkills.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {skillsLoading ? <Skeleton className="h-24" /> : desiredSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لم تُحدد مهارات مستهدفة</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {desiredSkills.map((s) => (
                      <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200 group">
                        <span>{s.name}</span>
                        <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`delete-desired-skill-${s.id}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gap skills */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />الفجوات المهارية</CardTitle>
              </CardHeader>
              <CardContent>
                {gapsLoading ? <Skeleton className="h-40" /> : (
                  <div className="space-y-2">
                    {(gapData?.missingSkills ?? []).map((s) => (
                      <div key={s.name} className={`flex items-start gap-3 p-3 rounded-xl border ${priorityColors[s.priority]}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm">{s.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[s.priority]}`}>{priorityLabels[s.priority]}</span>
                          </div>
                          <p className="text-xs opacity-80">{s.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
