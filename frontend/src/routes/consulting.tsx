import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Icon } from "../components/common/Icon";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";

const DEFAULT_UNIVERSITIES = [
  { uniId: 1, name: "Massachusetts Institute of Technology", country: "USA", city: "Cambridge, MA", ranking: 1, acceptRate: 4, minGPA: 3.9, avgSAT: 1550, minIELTS: 7.0, minTOEFL: 100, tuition: 60000, scholarships: "Need-based aid covers full need", programs: ["Engineering","Computer Science","Physics","Mathematics","Biology"], deadline: "Jan 1", type: "Private", logo: "🇺🇸" },
  { uniId: 2, name: "Stanford University", country: "USA", city: "Stanford, CA", ranking: 5, acceptRate: 4, minGPA: 3.9, avgSAT: 1540, minIELTS: 7.0, minTOEFL: 100, tuition: 62000, scholarships: "Need-blind for all; full need met", programs: ["Computer Science","Engineering","Business","Biology","Psychology"], deadline: "Jan 5", type: "Private", logo: "🇺🇸" },
  { uniId: 3, name: "Harvard University", country: "USA", city: "Cambridge, MA", ranking: 4, acceptRate: 3, minGPA: 3.9, avgSAT: 1550, minIELTS: 7.0, minTOEFL: 100, tuition: 59000, scholarships: "Need-blind; full need met", programs: ["Economics","Government","Biology","Computer Science","Law"], deadline: "Jan 1", type: "Private", logo: "🇺🇸" },
  { uniId: 4, name: "University of Oxford", country: "UK", city: "Oxford", ranking: 3, acceptRate: 15, minGPA: 3.8, avgSAT: null, minIELTS: 7.0, minTOEFL: null, tuition: 42000, scholarships: "Clarendon, Rhodes, Chevening", programs: ["Law","Medicine","PPE","Sciences","Humanities"], deadline: "Oct 15", type: "Public", logo: "🇬🇧" },
  { uniId: 5, name: "University of Toronto", country: "Canada", city: "Toronto, ON", ranking: 21, acceptRate: 43, minGPA: 3.6, avgSAT: null, minIELTS: 6.5, minTOEFL: 89, tuition: 45000, scholarships: "Lester B. Pearson Scholarship", programs: ["Engineering","Computer Science","Business","Medicine","Arts"], deadline: "Jan 15", type: "Public", logo: "🇨🇦" },
  { uniId: 6, name: "University of Melbourne", country: "Australia", city: "Melbourne, VIC", ranking: 14, acceptRate: 50, minGPA: 3.3, avgSAT: null, minIELTS: 6.5, minTOEFL: 79, tuition: 35000, scholarships: "Melbourne International Scholarship", programs: ["Medicine","Law","Engineering","Arts","Sciences"], deadline: "Oct 31", type: "Public", logo: "🇦🇺" }
];

export const Route = createFileRoute("/consulting")({
  component: ConsultingMatcher,
});

const COUNTRIES_LIST = ["Pakistan","India","Bangladesh","Sri Lanka","Nepal","Philippines","Indonesia","Malaysia","Vietnam","Myanmar","Thailand","Cambodia","Other"];
const STUDY_FIELDS = ["Computer Science","Engineering","Business","Medicine","Law","Sciences","Mathematics","Arts","Psychology","Economics","Architecture","Agriculture","Communication","Education","Design"];
const GRADING_SYSTEMS = ["GPA (4.0 scale)","Percentage (100)","A-Levels (A*-E)","IB (45 points)"];

// Matcher Algorithm
function scoreUniversity(uni: any, profile: any) {
  let score = 0;
  let reasons = [];
  let warnings = [];

  const normalizedGPA = normalizeGPA(profile.gpa, profile.gradingSystem);
  if (normalizedGPA >= uni.minGPA) {
    const gpaBonus = Math.min((normalizedGPA - uni.minGPA) * 20, 15);
    score += 15 + gpaBonus;
    reasons.push("Your grades meet the requirement");
  } else {
    const gap = uni.minGPA - normalizedGPA;
    if (gap <= 0.2) {
      score += 8;
      warnings.push("Your GPA is slightly below average — still possible with strong extras");
    } else {
      score -= 5;
      warnings.push("Your GPA is below the typical range for admitted students");
    }
  }

  // Map budget range string to a numeric max value for calculation
  let budgetVal = 30000;
  if (profile.budget === "Under $20,000") budgetVal = 20000;
  else if (profile.budget === "$20,000 - $40,000") budgetVal = 40000;
  else if (profile.budget === "$40,000 - $60,000") budgetVal = 60000;
  else if (profile.budget === "Over $60,000") budgetVal = 100000;

  if (budgetVal >= uni.tuition) {
    score += 25;
    reasons.push("Within your budget");
  } else if (profile.needsScholarship && uni.scholarships.toLowerCase().includes("full")) {
    score += 18;
    reasons.push("Full scholarships available — could bridge the gap");
  } else if (budgetVal >= uni.tuition * 0.7) {
    score += 12;
    reasons.push("Partial scholarships could make this affordable");
  } else {
    score += 3;
    warnings.push("Tuition exceeds your budget — scholarships would be essential");
  }

  if (uni.avgSAT && profile.sat) {
    if (profile.sat >= uni.avgSAT) { score += 15; reasons.push("SAT score is competitive"); }
    else if (profile.sat >= uni.avgSAT - 80) { score += 8; }
    else { score -= 3; warnings.push("SAT score is below the typical range"); }
  }
  if (uni.minIELTS && profile.ielts) {
    if (profile.ielts >= uni.minIELTS) { score += 10; reasons.push("IELTS score meets requirement"); }
    else { score -= 5; warnings.push("IELTS score below minimum — consider retaking"); }
  }
  if (uni.minTOEFL && profile.toefl) {
    if (profile.toefl >= uni.minTOEFL) { score += 10; reasons.push("TOEFL score meets requirement"); }
    else { score -= 5; warnings.push("TOEFL score below minimum"); }
  }

  const matchedPrograms = profile.fields.filter((f: string) => uni.programs.includes(f));
  if (matchedPrograms.length > 0) {
    score += Math.min(matchedPrograms.length * 10, 20);
    reasons.push(`Offers ${matchedPrograms.join(", ")}`);
  }

  if (uni.acceptRate >= 40) { score += 10; reasons.push("Good acceptance rate"); }
  else if (uni.acceptRate >= 15) { score += 5; }
  else { warnings.push(`Very competitive (${uni.acceptRate}% acceptance rate)`); }

  let matchType = "Safety";
  if (score >= 60) matchType = "Strong Match";
  else if (score >= 40) matchType = "Good Match";
  else if (score >= 25) matchType = "Reach";
  else matchType = "High Reach";

  return { uni, score: Math.max(score, 0), reasons, warnings, matchType, matchedPrograms };
}

function normalizeGPA(value: any, system: string) {
  if (!value) return 0;
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  
  switch (system) {
    case "Percentage (100)": return (num / 100) * 4;
    case "A-Levels (A*-E)": return Math.min(num * 0.8, 4.0);
    case "IB (45 points)": return (num / 45) * 4;
    default: return num;
  }
}

function ConsultingMatcher() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: user?.name || "", 
    country: user?.country || "", 
    gpa: "", 
    gradingSystem: "GPA (4.0 scale)",
    sat: "", 
    ielts: "", 
    toefl: "",
    preferredCountries: [] as string[], 
    fields: [] as string[],
    budget: "$40,000 - $60,000", 
    needsScholarship: false, 
    extracurriculars: "", 
    careerGoal: "",
  });
  const [showResults, setShowResults] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch universities from DB
  const { data: dbUniversities = [] } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const res = await api.get("/api/universities");
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const universities = dbUniversities.length > 0 ? dbUniversities : DEFAULT_UNIVERSITIES;

  const update = (key: string, val: any) => setProfile(p => ({ ...p, [key]: val }));

  const results = useMemo(() => {
    if (!showResults) return [];
    const filtered = universities.filter((u: any) => profile.preferredCountries.includes(u.country));
    return filtered.map((u: any) => scoreUniversity(u, profile))
      .sort((a: any, b: any) => b.score - a.score);
  }, [showResults, profile, universities]);

  const canProceed = () => {
    if (step === 0) return profile.name && profile.country;
    if (step === 1) return profile.gpa && profile.gradingSystem;
    if (step === 2) return profile.preferredCountries.length > 0 && profile.fields.length > 0;
    if (step === 3) return profile.budget;
    return true;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        level: "UNDERGRADUATE",
        secondaryType: "",
        higherType: "",
        gpa: profile.gpa,
        satScore: parseInt(profile.sat) || 0,
        gradeYear: "2024",
        targetUniversities: results.filter(r => selectedMatches.includes(r.uni.uniId || r.uni._id)).map((r: any) => r.uni.name),
        extracurriculars: profile.extracurriculars || "None provided",
        budgetRange: profile.budget.toString(),
      };
      const res = await api.post("/api/consulting/submit", payload);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (err: any) => {
      alert("Submission failed: " + err.message);
    }
  });

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 mb-8 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${i <= step ? "bg-accent text-on-primary shadow-[0_0_16px_rgba(99,102,241,0.3)]" : "bg-surface-container border border-outline-variant/30 text-on-surface-variant"}`}>
            {i + 1}
          </div>
          {i < 3 && <div className={`w-10 h-0.5 ${i < step ? "bg-accent" : "bg-outline-variant/30"}`} />}
        </div>
      ))}
    </div>
  );

  const toggleMulti = (arr: string[], val: string, max: number, key: string) => {
    if (arr.includes(val)) {
      update(key, arr.filter(item => item !== val));
    } else if (arr.length < max) {
      update(key, [...arr, val]);
    }
  };

  const steps = [
    // Step 0: About You
    <motion.div key="0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-2xl font-display font-bold text-on-surface mb-1">Tell us about yourself</h2>
      <p className="text-on-surface-variant text-sm mb-6">We'll use this to find universities that fit you best.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">Full Name</label>
          <Input value={profile.name} onChange={e => update("name", e.target.value)} placeholder="E.g. Ahmed Khan" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">Country of Residence</label>
          <select 
            value={profile.country} 
            onChange={e => update("country", e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface text-sm focus:border-accent outline-none appearance-none"
          >
            <option value="">Select...</option>
            {COUNTRIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </motion.div>,
    // Step 1: Academics
    <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <h2 className="text-2xl font-display font-bold text-on-surface mb-1">Your academics</h2>
      <p className="text-on-surface-variant text-sm mb-6">Enter your grades and test scores.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">Grading System</label>
          <select 
            value={profile.gradingSystem} 
            onChange={e => update("gradingSystem", e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface text-sm focus:border-accent outline-none appearance-none"
          >
            {GRADING_SYSTEMS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
            {profile.gradingSystem === "GPA (4.0 scale)" ? "GPA (out of 4.0)" : profile.gradingSystem === "Percentage (100)" ? "Percentage" : "Score"}
          </label>
          <Input type="number" value={profile.gpa} onChange={e => update("gpa", e.target.value)} placeholder="E.g. 3.7 or 85" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">SAT Score</label>
            <Input type="number" value={profile.sat} onChange={e => update("sat", e.target.value)} placeholder="1400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">IELTS Score</label>
            <Input type="number" value={profile.ielts} onChange={e => update("ielts", e.target.value)} placeholder="7.0" />
          </div>
        </div>
      </div>
    </motion.div>,
    // Step 2: Preferences
    <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <h2 className="text-2xl font-display font-bold text-on-surface mb-1">Where & what?</h2>
      <p className="text-on-surface-variant text-sm mb-6">Pick your preferred countries and fields of interest.</p>
      
      <div className="mb-6">
        <label className="block text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Preferred Countries (max 4)</label>
        <div className="flex flex-wrap gap-2">
          {["USA","UK","Canada","Australia"].map(opt => (
            <button key={opt} onClick={() => toggleMulti(profile.preferredCountries, opt, 4, "preferredCountries")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                profile.preferredCountries.includes(opt) ? "bg-accent/20 text-accent border border-accent/50" : "bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:border-outline-variant"
              }`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Fields of Interest (max 3)</label>
        <div className="flex flex-wrap gap-2">
          {STUDY_FIELDS.map(opt => (
            <button key={opt} onClick={() => toggleMulti(profile.fields, opt, 3, "fields")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                profile.fields.includes(opt) ? "bg-primary/20 text-primary border border-primary/50" : "bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:border-outline-variant"
              }`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </motion.div>,
    // Step 3: Budget
    <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <h2 className="text-2xl font-display font-bold text-on-surface mb-1">Budget & goals</h2>
      <p className="text-on-surface-variant text-sm mb-6">Help us find universities you can afford.</p>
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">Annual Budget Range (USD)</label>
          <select 
            value={profile.budget} 
            onChange={e => update("budget", e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface text-sm focus:border-accent outline-none appearance-none"
          >
            <option value="Under $20,000">Under $20,000</option>
            <option value="$20,000 - $40,000">$20,000 - $40,000</option>
            <option value="$40,000 - $60,000">$40,000 - $60,000</option>
            <option value="Over $60,000">Over $60,000</option>
          </select>
        </div>
        <label className="flex items-center gap-3 cursor-pointer group" onClick={() => update("needsScholarship", !profile.needsScholarship)}>
          <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${profile.needsScholarship ? "bg-accent" : "bg-surface-container-highest"}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${profile.needsScholarship ? "translate-x-6" : "translate-x-0"}`} />
          </div>
          <span className="text-sm font-medium text-on-surface">I need a scholarship to attend</span>
        </label>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">Extracurricular Activities</label>
          <Input value={profile.extracurriculars} onChange={e => update("extracurriculars", e.target.value)} placeholder="Debate, Coding club..." />
        </div>
      </div>
    </motion.div>
  ];

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-6">
        
        {isSubmitted ? (
          <div className="w-full max-w-[500px] text-center animate-fade-up bg-surface border border-outline-variant/30 rounded-3xl p-12 shark-shadow">
            <div className="w-24 h-24 bg-green-400/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="check" className="text-5xl" />
            </div>
            <h1 className="text-3xl font-display font-bold text-primary mb-4">Application Submitted!</h1>
            <p className="text-on-surface-variant mb-8">
              Your profile and selected universities have been successfully sent to our expert counselors. We are reviewing your choices and will reach out to you shortly to discuss your strategy.
            </p>
            <Button onClick={() => window.location.href = "/dashboard"} className="w-full py-3">
              Go to Dashboard
            </Button>
          </div>
        ) : showResults ? (
          <div className="w-full max-w-[800px] animate-fade-up">
            <button onClick={() => { setShowResults(false); setStep(3); }} className="text-accent text-sm font-semibold hover:underline mb-6 flex items-center gap-1">
              <Icon name="arrow_back" className="text-[16px]" /> Edit profile
            </button>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">Your Matches 🎓</h1>
            <p className="text-on-surface-variant mb-8">
              {results.length} universities found based on your profile.
            </p>

            <div className="space-y-4">
              {results.map((r: any, i: number) => {
                const scoreColor = r.score >= 60 ? "text-green-400" : r.score >= 40 ? "text-accent" : r.score >= 25 ? "text-yellow-400" : "text-orange-400";
                
                return (
                  <div 
                    key={r.uni.uniId || r.uni._id} 
                    className={`bg-surface border-2 rounded-2xl p-6 shark-shadow transition-colors relative cursor-pointer ${selectedMatches.includes(r.uni.uniId || r.uni._id) ? "border-accent bg-accent/5" : "border-outline-variant/30 hover:border-accent/50"}`}
                    onClick={() => {
                      const id = r.uni.uniId || r.uni._id;
                      if (selectedMatches.includes(id)) {
                        setSelectedMatches(selectedMatches.filter(x => x !== id));
                      } else {
                        setSelectedMatches([...selectedMatches, id]);
                      }
                    }}
                  >
                    {selectedMatches.includes(r.uni.uniId || r.uni._id) && (
                      <div className="absolute top-4 right-4 text-accent">
                        <Icon name="check_circle" className="text-[24px]" />
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-on-surface-variant w-8">#{i + 1}</div>
                        <div className="text-4xl">{r.uni.logo}</div>
                        <div>
                          <h3 className="text-xl font-bold text-on-surface">{r.uni.name}</h3>
                          <div className="text-sm text-on-surface-variant">{r.uni.city}, {r.uni.country} · QS #{r.uni.ranking}</div>
                        </div>
                      </div>
                      <div className="text-right pr-8 md:pr-0">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${
                          r.matchType === "Strong Match" || r.matchType === "Safety" ? "bg-green-400/10 text-green-400" :
                          r.matchType === "Good Match" ? "bg-accent/10 text-accent" : "bg-yellow-400/10 text-yellow-400"
                        }`}>{r.matchType}</div>
                        <div className={`text-3xl font-display font-bold mt-2 ${scoreColor}`}>{r.score}</div>
                        <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">Match Score</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-surface-container rounded-lg p-3">
                        <div className="text-[10px] uppercase text-on-surface-variant font-bold">Tuition</div>
                        <div className="font-mono text-sm mt-1">${(r.uni.tuition / 1000).toFixed(0)}k/yr</div>
                      </div>
                      <div className="bg-surface-container rounded-lg p-3">
                        <div className="text-[10px] uppercase text-on-surface-variant font-bold">Acceptance</div>
                        <div className="font-mono text-sm mt-1">{r.uni.acceptRate}%</div>
                      </div>
                      <div className="bg-surface-container rounded-lg p-3">
                        <div className="text-[10px] uppercase text-on-surface-variant font-bold">Min IELTS</div>
                        <div className="font-mono text-sm mt-1">{r.uni.minIELTS || "N/A"}</div>
                      </div>
                      <div className="bg-surface-container rounded-lg p-3">
                        <div className="text-[10px] uppercase text-on-surface-variant font-bold">Deadline</div>
                        <div className="font-mono text-sm mt-1">{r.uni.deadline}</div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-outline-variant/20 space-y-2">
                      {r.reasons.map((reason: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-green-400">
                          <Icon name="check_circle" className="text-[16px]" /> {reason}
                        </div>
                      ))}
                      {r.warnings.map((warning: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-yellow-400">
                          <Icon name="warning" className="text-[16px]" /> {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {results.length === 0 && (
                <div className="text-center py-20 bg-surface rounded-2xl border border-outline-variant/30">
                  <Icon name="search_off" className="text-6xl text-on-surface-variant/50 mb-4 mx-auto" />
                  <p className="text-on-surface-variant">No universities matched your preferences. Try broadening your criteria.</p>
                </div>
              )}
            </div>

            <div className="mt-12 text-center bg-primary-fixed/5 rounded-2xl p-8 border border-primary/20">
              <h3 className="text-xl font-bold text-primary mb-2">Ready to apply?</h3>
              <p className="text-sm text-on-surface-variant mb-6 max-w-md mx-auto">
                Select the universities you want to apply to by clicking on them above, then submit this profile to our expert counselors. We'll review your choices and reach out to discuss strategy.
              </p>
              {user ? (
                <Button 
                  onClick={() => submitMutation.mutate()} 
                  isLoading={submitMutation.isPending}
                  disabled={selectedMatches.length === 0}
                  className="px-8"
                >
                  Submit {selectedMatches.length > 0 ? selectedMatches.length : ""} Selected to Counselor
                </Button>
              ) : (
                <div className="text-sm text-error font-bold">Please log in to submit your profile to a counselor.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[500px] animate-fade-up">
            <div className="text-center mb-10">
              <div className="text-4xl mb-4">🎓</div>
              <h1 className="text-3xl font-display font-bold text-primary mb-2">University Matcher</h1>
              <p className="text-on-surface-variant text-sm">Discover your best-fit universities abroad.</p>
            </div>
            
            {renderStepIndicator()}
            
            <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shark-shadow min-h-[380px] flex flex-col justify-between">
              <div>{steps[step]}</div>
              
              <div className="flex gap-4 mt-8 pt-6 border-t border-outline-variant/20">
                {step > 0 && (
                  <button 
                    onClick={() => setStep(s => s - 1)}
                    className="flex-1 py-3 rounded-xl border border-outline-variant/50 text-on-surface font-semibold hover:bg-surface-container transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => { if (step < 3) setStep(s => s + 1); else setShowResults(true); }}
                  disabled={!canProceed()}
                  className={`flex-[2] py-3 rounded-xl font-bold transition-all duration-300 ${
                    canProceed() 
                      ? "bg-accent text-on-primary shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:bg-accent/90" 
                      : "bg-surface-container text-on-surface-variant/50 cursor-not-allowed"
                  }`}
                >
                  {step < 3 ? "Continue" : "Find My Universities"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
