import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGetProfile, getGetProfileQueryKey, useUpdateProfile, useGetProfileCompletion, getGetProfileCompletionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, GraduationCap, Target, CheckCircle2, Loader2 } from "lucide-react";

type ProfileData = {
  email?: string | null; phone?: string | null; careerGoal?: string | null; currentRole?: string | null;
  educationLevel?: string | null; university?: string | null; major?: string | null; gpa?: number | null;
};

const completionColors = (pct: number) =>
  pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-accent" : "bg-orange-400";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profile, isLoading } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const { data: completion } = useGetProfileCompletion({ query: { queryKey: getGetProfileCompletionQueryKey() } });
  const updateProfile = useUpdateProfile();

  type FormData = {
    email: string; phone: string; careerGoal: string; currentRole: string;
    educationLevel: string; university: string; major: string; gpa: string;
  };

  const form = useForm<FormData>({
    defaultValues: { email: "", phone: "", careerGoal: "", currentRole: "", educationLevel: "", university: "", major: "", gpa: "" },
  });

  const p = profile as (ProfileData & { id: number; nationalId: string; fullName: string; cvFileName?: string | null; cvAnalyzed?: boolean; profileCompleteness?: number; interests?: string[]; hobbies?: string[] }) | undefined;
  const c = completion as { percentage: number; completedItems: string[]; missingItems: string[] } | undefined;

  useEffect(() => {
    if (p) {
      form.reset({
        email: p.email ?? "",
        phone: p.phone ?? "",
        careerGoal: p.careerGoal ?? "",
        currentRole: p.currentRole ?? "",
        educationLevel: p.educationLevel ?? "",
        university: p.university ?? "",
        major: p.major ?? "",
        gpa: p.gpa != null ? String(p.gpa) : "",
      });
    }
  }, [p, form]);

  function onSubmit(values: FormData) {
    updateProfile.mutate(
      { data: { ...values, gpa: values.gpa ? parseFloat(values.gpa) : undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProfileCompletionQueryKey() });
          toast({ title: "تم تحديث الملف الشخصي بنجاح" });
        },
        onError: () => toast({ title: "خطأ في الحفظ", variant: "destructive" }),
      }
    );
  }

  if (isLoading) return (
    <Layout>
      <div className="p-6 space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">ملفي الشخصي</h1>
          <p className="text-muted-foreground text-sm mt-0.5">بياناتك الشخصية ومعلوماتك الأكاديمية</p>
        </div>

        {/* Profile header */}
        <Card className="overflow-hidden">
          <div className="h-16 bg-gradient-to-l from-[hsl(222,47%,11%)] to-[hsl(222,38%,22%)]" />
          <CardContent className="pt-0 pb-5 px-5">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-accent border-4 border-card flex items-center justify-center text-2xl font-black text-accent-foreground shadow-md">
                {p?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="pb-1">
                <h2 className="text-lg font-black text-foreground">{p?.fullName}</h2>
                <p className="text-sm text-muted-foreground">{p?.nationalId}</p>
              </div>
            </div>

            {/* Completion meter */}
            {c && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">اكتمال الملف</span>
                  <span className="text-sm font-black text-primary">{c.percentage}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full">
                  <div className={`h-2.5 rounded-full transition-all duration-700 ${completionColors(c.percentage)}`}
                    style={{ width: `${c.percentage}%` }} />
                </div>
                {c.missingItems.length > 0 && (
                  <p className="text-xs text-muted-foreground">مفقود: {c.missingItems.join("، ")}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">معلومات الملف الشخصي</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm"><Mail className="w-3.5 h-3.5" />البريد الإلكتروني</Label>
                  <Input {...form.register("email")} placeholder="example@email.com" data-testid="input-email" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm"><Phone className="w-3.5 h-3.5" />رقم الجوال</Label>
                  <Input {...form.register("phone")} placeholder="05xxxxxxxx" data-testid="input-phone" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm"><Target className="w-3.5 h-3.5" />الهدف المهني</Label>
                  <Input {...form.register("careerGoal")} placeholder="مهندس برمجيات..." data-testid="input-career-goal" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm"><User className="w-3.5 h-3.5" />المسمى الحالي</Label>
                  <Input {...form.register("currentRole")} placeholder="طالب، متدرب..." data-testid="input-current-role" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm"><GraduationCap className="w-3.5 h-3.5" />المرحلة الدراسية</Label>
                  <select {...form.register("educationLevel")} className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background" data-testid="select-education">
                    <option value="">اختر...</option>
                    <option value="ثانوي">ثانوي</option>
                    <option value="دبلوم">دبلوم</option>
                    <option value="بكالوريوس">بكالوريوس</option>
                    <option value="ماجستير">ماجستير</option>
                    <option value="دكتوراه">دكتوراه</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">الجامعة</Label>
                  <Input {...form.register("university")} placeholder="جامعة الملك..." data-testid="input-university" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">التخصص</Label>
                  <Input {...form.register("major")} placeholder="علوم الحاسب..." data-testid="input-major" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">المعدل التراكمي (GPA)</Label>
                  <Input {...form.register("gpa")} placeholder="4.50" type="number" step="0.01" min="0" max="5" data-testid="input-gpa" />
                </div>
              </div>

              <Button type="submit" className="w-full sm:w-auto" disabled={updateProfile.isPending} data-testid="button-save-profile">
                {updateProfile.isPending ? (
                  <><Loader2 className="w-4 h-4 ml-1 animate-spin" />جارٍ الحفظ</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 ml-1" />حفظ التغييرات</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CV status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">السيرة الذاتية</CardTitle>
          </CardHeader>
          <CardContent>
            {p?.cvFileName ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">{p.cvFileName}</p>
                  <p className="text-xs text-green-600">{p.cvAnalyzed ? "تم التحليل والاستخراج بنجاح" : "تم الرفع، جارٍ التحليل"}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">لم يتم رفع السيرة الذاتية بعد</p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/onboarding"}>رفع السيرة الذاتية</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
