import { useState } from "react";
import { useGetCareerPath, getGetCareerPathQueryKey, useGetCertifications, getGetCertificationsQueryKey, useGetActivities, getGetActivitiesQueryKey, useAddCertification, useAddActivity, CertificationInputType, ActivityInputType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Circle, Plus, Award, Activity, X } from "lucide-react";

type Stage = { stage: number; title: string; description: string; skills: string[]; status: "completed" | "in_progress" | "upcoming"; durationMonths: number };
type CareerPath = { goal: string; stages: Stage[]; estimatedMonths: number; currentStage: number; overallProgress: number };
type Cert = { id: number; title: string; issuer: string; type: string; score?: string | null; dateEarned?: string | null; platform?: string | null; verified: boolean };
type Act = { id: number; title: string; organization: string; type: string; role?: string | null; startDate?: string | null; verified: boolean };

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", label: "مكتملة", bar: "bg-green-500" },
  in_progress: { icon: Clock, color: "text-accent", bg: "bg-accent/15", label: "جارية", bar: "bg-accent" },
  upcoming: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted/50", label: "قادمة", bar: "bg-muted" },
};

const certTypeLabels: Record<string, string> = { academic: "أكاديمي", professional: "مهني", language: "لغوي", government: "حكومي" };
const actTypeLabels: Record<string, string> = { university_club: "نادي جامعي", external_center: "مركز خارجي", volunteer: "تطوعي", competition: "مسابقة", internship: "تدريب" };

export default function CareerPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: path, isLoading: pathLoading } = useGetCareerPath({ query: { queryKey: getGetCareerPathQueryKey() } });
  const { data: certs, isLoading: certsLoading } = useGetCertifications({ query: { queryKey: getGetCertificationsQueryKey() } });
  const { data: activities, isLoading: actsLoading } = useGetActivities({ query: { queryKey: getGetActivitiesQueryKey() } });
  const addCert = useAddCertification();
  const addAct = useAddActivity();

  const [showCertForm, setShowCertForm] = useState(false);
  const [showActForm, setShowActForm] = useState(false);
  const [certData, setCertData] = useState<{ title: string; issuer: string; type: typeof CertificationInputType[keyof typeof CertificationInputType]; score: string; platform: string }>({ title: "", issuer: "", type: CertificationInputType.professional, score: "", platform: "" });
  const [actData, setActData] = useState<{ title: string; organization: string; type: typeof ActivityInputType[keyof typeof ActivityInputType]; role: string }>({ title: "", organization: "", type: ActivityInputType.university_club, role: "" });

  const careerPath = path as CareerPath | undefined;
  const certList = (certs as Cert[] | undefined) ?? [];
  const actList = (activities as Act[] | undefined) ?? [];

  function submitCert() {
    if (!certData.title || !certData.issuer) return;
    addCert.mutate({ data: certData }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetCertificationsQueryKey() }); setShowCertForm(false); setCertData({ title: "", issuer: "", type: "professional", score: "", platform: "" }); toast({ title: "تمت إضافة الشهادة" }); },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  }

  function submitAct() {
    if (!actData.title || !actData.organization) return;
    addAct.mutate({ data: actData }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetActivitiesQueryKey() }); setShowActForm(false); setActData({ title: "", organization: "", type: "university_club", role: "" }); toast({ title: "تمت إضافة النشاط" }); },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  }

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">المسار المهني</h1>
          <p className="text-muted-foreground text-sm mt-0.5">خارطة طريق مخصصة لتحقيق هدفك المهني</p>
        </div>

        {/* Career roadmap */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">مسار: {careerPath?.goal}</CardTitle>
              {careerPath && <span className="text-sm font-bold text-primary">{careerPath.overallProgress}% اكتمال</span>}
            </div>
            {careerPath && (
              <div className="h-2 bg-muted rounded-full mt-2">
                <div className="h-2 bg-primary rounded-full transition-all duration-700" style={{ width: `${careerPath.overallProgress}%` }} />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {pathLoading ? <Skeleton className="h-48" /> : (
              <div className="space-y-3">
                {(careerPath?.stages ?? []).map((s, i) => {
                  const cfg = statusConfig[s.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={s.stage} className={`relative flex gap-4 p-4 rounded-xl border-2 ${s.status === "in_progress" ? "border-accent/40 bg-accent/5" : "border-border"}`}>
                      {/* Line connector */}
                      {i < (careerPath?.stages.length ?? 0) - 1 && (
                        <div className="absolute right-7 bottom-0 top-full h-3 w-0.5 bg-border z-10" />
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-sm">{s.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-xs text-muted-foreground">{s.durationMonths} أشهر</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{s.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.skills.map((sk) => <span key={sk} className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs">{sk}</span>)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Certifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4 text-accent" />الشهادات والرخص ({certList.length})</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowCertForm(!showCertForm)} data-testid="button-add-cert">
                  <Plus className="w-3.5 h-3.5 ml-1" />إضافة
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showCertForm && (
                <div className="p-3 border border-border rounded-xl space-y-2 bg-muted/20">
                  <Input placeholder="اسم الشهادة" value={certData.title} onChange={(e) => setCertData({ ...certData, title: e.target.value })} className="text-sm" data-testid="input-cert-title" />
                  <Input placeholder="الجهة المُصدِرة" value={certData.issuer} onChange={(e) => setCertData({ ...certData, issuer: e.target.value })} className="text-sm" data-testid="input-cert-issuer" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={certData.type} onChange={(e) => setCertData({ ...certData, type: e.target.value as typeof CertificationInputType[keyof typeof CertificationInputType] })} className="rounded-lg border border-input px-2 py-1.5 text-sm bg-background">
                      {Object.entries(certTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <Input placeholder="الدرجة / النتيجة" value={certData.score} onChange={(e) => setCertData({ ...certData, score: e.target.value })} className="text-sm" />
                  </div>
                  <Input placeholder="المنصة (STEP, IELTS...)" value={certData.platform} onChange={(e) => setCertData({ ...certData, platform: e.target.value })} className="text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={submitCert} className="flex-1" disabled={addCert.isPending}>حفظ</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowCertForm(false)} className="flex-1">إلغاء</Button>
                  </div>
                </div>
              )}
              {certsLoading ? <Skeleton className="h-24" /> : certList.length === 0 && !showCertForm ? (
                <p className="text-sm text-muted-foreground text-center py-4">لم تُضف شهادات بعد</p>
              ) : (
                certList.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.issuer} {c.score && `• ${c.score}`}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs">{certTypeLabels[c.type]}</Badge>
                      {c.verified && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />الأنشطة والمشاركات ({actList.length})</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowActForm(!showActForm)} data-testid="button-add-activity">
                  <Plus className="w-3.5 h-3.5 ml-1" />إضافة
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showActForm && (
                <div className="p-3 border border-border rounded-xl space-y-2 bg-muted/20">
                  <Input placeholder="اسم النشاط" value={actData.title} onChange={(e) => setActData({ ...actData, title: e.target.value })} className="text-sm" data-testid="input-act-title" />
                  <Input placeholder="الجهة المنظِّمة" value={actData.organization} onChange={(e) => setActData({ ...actData, organization: e.target.value })} className="text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={actData.type} onChange={(e) => setActData({ ...actData, type: e.target.value as typeof ActivityInputType[keyof typeof ActivityInputType] })} className="rounded-lg border border-input px-2 py-1.5 text-sm bg-background">
                      {Object.entries(actTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <Input placeholder="الدور / المسمى" value={actData.role} onChange={(e) => setActData({ ...actData, role: e.target.value })} className="text-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">ملاحظة: يُشترط وجود إثبات للنشاط</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={submitAct} className="flex-1" disabled={addAct.isPending}>حفظ</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowActForm(false)} className="flex-1">إلغاء</Button>
                  </div>
                </div>
              )}
              {actsLoading ? <Skeleton className="h-24" /> : actList.length === 0 && !showActForm ? (
                <p className="text-sm text-muted-foreground text-center py-4">لم تُضف أنشطة بعد</p>
              ) : (
                actList.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.organization} {a.role && `• ${a.role}`}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs">{actTypeLabels[a.type]}</Badge>
                      {a.verified && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
