import { useState } from "react";
import { useLocation } from "wouter";
import { useUpdateProfile, useAnalyzeCv, getGetProfileQueryKey, LanguageLevel } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Loader2, Plus, X } from "lucide-react";

const careerGoals = [
  "مهندس برمجيات", "محلل بيانات", "مدير مشاريع", "مصمم", "محلل أعمال",
  "أمن معلومات", "ذكاء اصطناعي", "ريادة أعمال",
];

const languageOptions = ["العربية", "الإنجليزية", "الفرنسية", "الألمانية", "الصينية", "اليابانية"];
const levelLabels: Record<string, string> = { native: "لغة أم", advanced: "متقدم", intermediate: "متوسط", beginner: "مبتدئ" };

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const analyzeCv = useAnalyzeCv();

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvDone, setCvDone] = useState(false);
  const [careerGoal, setCareerGoal] = useState("");
  const [desiredSkills, setDesiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [languages, setLanguages] = useState<{ name: string; level: typeof LanguageLevel[keyof typeof LanguageLevel] }[]>([]);

  async function handleCvUpload(file: File) {
    setCvUploading(true);
    setCvFile(file);
    try {
      const fd = new FormData();
      fd.append("file", file);
      analyzeCv.mutate({ data: { fileName: file.name, fileContent: "" } }, {
        onSuccess: () => { setCvDone(true); setCvUploading(false); },
        onError: () => { setCvUploading(false); toast({ title: "خطأ في تحليل الملف", variant: "destructive" }); },
      });
    } catch {
      setCvUploading(false);
    }
  }

  function addTag(list: string[], setter: (v: string[]) => void, value: string) {
    const v = value.trim();
    if (v && !list.includes(v)) setter([...list, v]);
  }

  function removeTag(list: string[], setter: (v: string[]) => void, value: string) {
    setter(list.filter((i) => i !== value));
  }

  function addLanguage() {
    if (!languages.find((l) => l.name === "العربية")) {
      setLanguages([...languages, { name: "العربية", level: "native" }]);
    }
  }

  function finish() {
    updateProfile.mutate(
      { data: { careerGoal, desiredSkills, interests, hobbies, languages } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          toast({ title: "اكتمل إعداد ملفك الشخصي!", description: "مرحباً في صرح" });
          setLocation("/dashboard");
        },
        onError: () => toast({ title: "خطأ في الحفظ", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,11%)] to-[hsl(222,38%,18%)] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent mb-3">
            <span className="text-2xl font-black text-accent-foreground">ص</span>
          </div>
          <h1 className="text-white font-black text-2xl">إعداد ملفك المهني</h1>
          <p className="text-white/60 text-sm mt-1">خطوة {step} من 3</p>
          {/* Progress */}
          <div className="flex gap-2 justify-center mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-12 bg-accent" : s < step ? "w-6 bg-accent/60" : "w-6 bg-white/20"}`} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-7">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">السيرة الذاتية والهدف المهني</h2>

              {/* CV Upload */}
              <div>
                <Label className="mb-2 block">رفع السيرة الذاتية (PDF / Word)</Label>
                <label
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${cvDone ? "border-green-400 bg-green-50" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                  data-testid="dropzone-cv"
                >
                  {cvUploading ? (
                    <><Loader2 className="w-8 h-8 text-primary animate-spin mb-2" /><span className="text-sm text-muted-foreground">جارٍ التحليل...</span></>
                  ) : cvDone ? (
                    <><CheckCircle2 className="w-8 h-8 text-green-600 mb-2" /><span className="text-sm font-semibold text-green-700">تم تحليل السيرة الذاتية</span><span className="text-xs text-muted-foreground">{cvFile?.name}</span></>
                  ) : (
                    <><Upload className="w-8 h-8 text-muted-foreground mb-2" /><span className="text-sm font-medium text-foreground">اضغط لرفع ملفك</span><span className="text-xs text-muted-foreground">PDF, DOC, DOCX</span></>
                  )}
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => { if (e.target.files?.[0]) handleCvUpload(e.target.files[0]); }} data-testid="input-cv-file" />
                </label>
              </div>

              {/* Career goal */}
              <div>
                <Label className="mb-2 block">ما هو هدفك المهني؟</Label>
                <div className="grid grid-cols-2 gap-2">
                  {careerGoals.map((g) => (
                    <button
                      key={g} type="button"
                      onClick={() => setCareerGoal(g)}
                      data-testid={`goal-${g}`}
                      className={`p-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${careerGoal === g ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desired skills */}
              <div>
                <Label className="mb-2 block">المهارات التي تسعى لاكتسابها</Label>
                <div className="flex gap-2 mb-2">
                  <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="أضف مهارة..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(desiredSkills, setDesiredSkills, skillInput); setSkillInput(""); } }} data-testid="input-desired-skill" />
                  <Button type="button" size="icon" variant="outline" onClick={() => { addTag(desiredSkills, setDesiredSkills, skillInput); setSkillInput(""); }}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {desiredSkills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {s} <button onClick={() => removeTag(desiredSkills, setDesiredSkills, s)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={() => setStep(2)} disabled={!careerGoal} data-testid="button-step1-next">التالي</Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">الاهتمامات والهوايات واللغات</h2>

              <div>
                <Label className="mb-2 block">الاهتمامات</Label>
                <div className="flex gap-2 mb-2">
                  <Input value={interestInput} onChange={(e) => setInterestInput(e.target.value)} placeholder="أضف اهتماماً..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(interests, setInterests, interestInput); setInterestInput(""); } }} data-testid="input-interest" />
                  <Button type="button" size="icon" variant="outline" onClick={() => { addTag(interests, setInterests, interestInput); setInterestInput(""); }}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((s) => <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{s} <button onClick={() => removeTag(interests, setInterests, s)}><X className="w-3 h-3" /></button></span>)}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">الهوايات</Label>
                <div className="flex gap-2 mb-2">
                  <Input value={hobbyInput} onChange={(e) => setHobbyInput(e.target.value)} placeholder="أضف هواية..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(hobbies, setHobbies, hobbyInput); setHobbyInput(""); } }} data-testid="input-hobby" />
                  <Button type="button" size="icon" variant="outline" onClick={() => { addTag(hobbies, setHobbies, hobbyInput); setHobbyInput(""); }}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hobbies.map((s) => <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{s} <button onClick={() => removeTag(hobbies, setHobbies, s)}><X className="w-3 h-3" /></button></span>)}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">اللغات</Label>
                <div className="space-y-2">
                  {languages.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                      <select value={l.name} onChange={(e) => { const updated = [...languages]; updated[i].name = e.target.value; setLanguages(updated); }} className="flex-1 text-sm bg-transparent outline-none">
                        {languageOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <select value={l.level} onChange={(e) => { const updated = [...languages]; updated[i].level = e.target.value as typeof LanguageLevel[keyof typeof LanguageLevel]; setLanguages(updated); }} className="text-sm bg-transparent outline-none">
                        {Object.entries(levelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <button onClick={() => setLanguages(languages.filter((_, j) => j !== i))}><X className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setLanguages([...languages, { name: "الإنجليزية", level: LanguageLevel.intermediate }])} className="w-full"><Plus className="w-4 h-4 ml-1" />إضافة لغة</Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>السابق</Button>
                <Button className="flex-1" onClick={() => setStep(3)} data-testid="button-step2-next">التالي</Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">مراجعة وإتمام الملف</h2>
              <div className="space-y-3">
                {[
                  { label: "الهدف المهني", value: careerGoal, color: "bg-primary/10 text-primary" },
                  { label: "السيرة الذاتية", value: cvDone ? "تم الرفع والتحليل" : "لم يتم الرفع", color: cvDone ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600" },
                  { label: "المهارات المطلوبة", value: desiredSkills.length > 0 ? desiredSkills.join("، ") : "لم تُضف", color: "bg-blue-100 text-blue-700" },
                  { label: "الاهتمامات", value: interests.length > 0 ? interests.join("، ") : "لم تُضف", color: "bg-purple-100 text-purple-700" },
                  { label: "اللغات", value: languages.length > 0 ? languages.map(l => `${l.name} (${levelLabels[l.level]})`).join("، ") : "لم تُضف", color: "bg-yellow-100 text-yellow-700" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-sm font-medium mt-0.5 inline-flex px-2 py-0.5 rounded-lg ${color}`}>{value}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>السابق</Button>
                <Button className="flex-1 bg-[hsl(222,47%,22%)]" onClick={finish} disabled={updateProfile.isPending || !careerGoal} data-testid="button-finish">
                  {updateProfile.isPending ? <><Loader2 className="w-4 h-4 ml-1 animate-spin" />جارٍ الحفظ</> : "إتمام وبدء الرحلة"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
