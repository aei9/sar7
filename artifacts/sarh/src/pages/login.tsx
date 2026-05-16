import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { setStoredToken } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  nationalId: z.string().min(1, "يرجى إدخال رقم السجل المدني"),
  fullName: z.string().min(1, "يرجى إدخال الاسم الكامل"),
  nafathVerified: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nationalId: "", fullName: "", nafathVerified: false },
  });

  function onSubmit(values: LoginForm) {
    loginMutation.mutate(
      { data: { nationalId: values.nationalId, fullName: values.fullName, nafathVerified: values.nafathVerified } },
      {
        onSuccess: (res) => {
          const r = res as { user: { id: number; nationalId: string; fullName: string; profileComplete: boolean; avatarInitials: string }; token?: string; isNewUser?: boolean };
          if (r.token) setStoredToken(r.token);
          setUser(r.user);
          toast({ title: `مرحباً، ${r.user.fullName}`, description: "تم تسجيل الدخول بنجاح" });
          if (r.isNewUser) {
            setLocation("/onboarding");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: () => {
          toast({ title: "خطأ في تسجيل الدخول", description: "يرجى التحقق من البيانات المدخلة", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,11%)] to-[hsl(222,38%,18%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-white mb-2 shadow-2xl p-3">
            <img src="/sarh-logo.png" alt="صرح" className="w-full h-full object-contain" />
          </div>
          <p className="text-white/60 text-sm mt-2">صرح لبناء مستقبل مهني واعد</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-foreground mb-1">تسجيل الدخول</h2>
          <p className="text-muted-foreground text-sm mb-6">أدخل بياناتك للوصول إلى منصتك المهنية</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم السجل المدني</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل رقم هويتك الوطنية"
                        data-testid="input-national-id"
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل اسمك الكامل"
                        data-testid="input-full-name"
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nafathVerified"
                render={({ field }) => (
                  <FormItem>
                    <div
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        field.value ? "border-accent bg-accent/10" : "border-border bg-muted/30"
                      }`}
                      onClick={() => field.onChange(!field.value)}
                      data-testid="checkbox-nafath"
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${field.value ? "bg-accent" : "border-2 border-muted-foreground"}`}>
                        {field.value && <ShieldCheck className="w-3 h-3 text-accent-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">موثوق نفاذ</p>
                        <p className="text-xs text-muted-foreground">تحقق من هويتك عبر منصة نفاذ الوطنية</p>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-[hsl(222,47%,22%)] hover:bg-[hsl(222,47%,18%)] text-white font-semibold text-base rounded-xl"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ التحقق...</>
                ) : (
                  "دخول"
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            منصة صرح لدعم الطلاب في بناء مساراتهم المهنية
          </p>
        </div>
      </div>
    </div>
  );
}
