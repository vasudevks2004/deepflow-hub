import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    BookOpen,
    Code,
    CheckCircle2,
    Clock,
    Calendar,
    Plus,
    Trash2,
    Coffee,
    Home,
    MapPin,
    BrainCircuit,
    LayoutDashboard,
    TrendingUp,
    AlertCircle,
    Play,
    Pause,
    RotateCcw,
    Bell,
    CheckSquare,
    Square,
    ListChecks,
    Code2,
    Terminal,
    FileQuestion,
    Send,
    Trophy,
    History,
    ChevronRight,
    Monitor,
    Activity,
    Lightbulb,
    Map,
    Zap,
    ArrowRight,
    RefreshCw,
    Layers,
    HelpCircle,
    Target,
    Timer,
    Copyright,
    ExternalLink,
    Hourglass,
    Link2,
    Database,
    Cpu,
    Binary,
    Wand2,
    Sparkles,
    CalendarDays,
    ChevronLeft,
    X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    setDoc,
    onSnapshot,
} from 'firebase/firestore';
import {
    getAuth,
    signInWithCustomToken,
    signInAnonymously,
    onAuthStateChanged
} from 'firebase/auth';

// --- Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyC8hWzWoq54azt8IFI1NGp6ExuYEOmJFJc",
    authDomain: "deepflow-c6393.firebaseapp.com",
    projectId: "deepflow-c6393",
    storageBucket: "deepflow-c6393.firebasestorage.app",
    messagingSenderId: "762884956286",
    appId: "1:762884956286:web:e15bc408c3885f88c2782f",
    measurementId: "G-56HCPN14QF"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'deepflow-mastery-hub';
const apiKey = "AIzaSyAU45E-HXxAVhuO_Zbl8Jf8HG1oipB4KjA"; // Provided at runtime

// --- Helper Utilities ---
const formatSeconds = (totalSeconds) => {
    const s = parseInt(totalSeconds, 10) || 0;
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getTodayKey = () => new Date().toISOString().split('T')[0];

const getGridColsClass = (count) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-3";
};

// Exponential Backoff API Fetch
const geminiFetch = async (payload) => {
    let delay = 1000;
    for (let i = 0; i < 5; i++) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) return await response.json();
            if (response.status !== 429 && response.status < 500) break;
        } catch (e) { if (i === 4) throw e; }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
    }
    throw new Error("CORE_CONNECTION_LOST");
};

// --- Matrix Visual Core ---
const MatrixBackground = ({ color = "#00ff41" }) => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w = (canvas.width = window.innerWidth);
        let h = (canvas.height = window.innerHeight);
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]";
        const fSize = 14;
        const cols = Math.floor(w / fSize);
        const drops = new Array(cols).fill(1);
        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = color;
            ctx.font = fSize + 'px monospace';
            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fSize, drops[i] * fSize);
                if (drops[i] * fSize > h && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };
        const inst = setInterval(draw, 33);
        const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        return () => { clearInterval(inst); window.removeEventListener('resize', resize); };
    }, [color]);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-20 z-0 transition-colors duration-1000" />;
};

export default function App() {
    // --- State Initialization ---
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentTopic, setCurrentTopic] = useState("");
    const [learningPlan, setLearningPlan] = useState(null);
    const [projects, setProjects] = useState([]);
    const [studyHistory, setStudyHistory] = useState({});
    const [dailyGoalHours, setDailyGoalHours] = useState(8);
    const [studySecondsToday, setStudySecondsToday] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [leetTasks, setLeetTasks] = useState({ easy: [], hard: [], advanced: [] });
    const [isGeneratingLeet, setIsGeneratingLeet] = useState(false);

    const [projectIdea, setProjectIdea] = useState("");
    const [projectAnalysis, setProjectAnalysis] = useState(null);
    const [isAnalyzingProject, setIsAnalyzingProject] = useState(false);

    const [assessment, setAssessment] = useState(null);
    const [userAnswers, setUserAnswers] = useState({ mcqs: {}, code: "" });
    const [evaluation, setEvaluation] = useState(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [terminalOutput, setTerminalOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getTodayKey());

    // --- Derived Values (Scoped) ---
    const studyPercentage = useMemo(() => {
        const goalSecs = (parseInt(dailyGoalHours) || 1) * 3600;
        return Math.min(100, Math.round((studySecondsToday / goalSecs) * 100));
    }, [studySecondsToday, dailyGoalHours]);

    const cycleProgress = useMemo(() => {
        if (!learningPlan?.createdAt) return { current: 1, total: 7 };
        const start = new Date(learningPlan.createdAt);
        const diff = new Date().getTime() - start.getTime();
        const cur = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
        return { current: Math.min(7, cur), total: 7 };
    }, [learningPlan]);

    const currentTheme = assessment ? { primary: "#ef4444" } : {
        dashboard: { primary: "#00ff41" },
        focus: { primary: "#4f46e5" },
        projects: { primary: "#06b6d4" },
        leetcode: { primary: "#a855f7" },
        archive: { primary: "#6366f1" }
    }[activeTab] || { primary: "#00ff41" };

    // --- Core Handlers ---
    const runCode = async () => {
        if (!userAnswers.code.trim()) return;
        setIsRunning(true);
        try {
            const res = await geminiFetch({
                contents: [{ parts: [{ text: userAnswers.code }] }],
                systemInstruction: { parts: [{ text: "Mock Python Interpreter. Return JSON: { \"output\": \"...\", \"error\": \"...\" }" }] },
                generationConfig: { responseMimeType: "application/json" }
            });
            setTerminalOutput(JSON.parse(res.candidates[0].content.parts[0].text));
        } catch (e) { setTerminalOutput({ error: "SIM_KERNEL_FAILURE" }); } finally { setIsRunning(false); }
    };

    const optimizeCodeLogic = async () => {
        if (!userAnswers.code.trim()) return;
        setIsOptimizing(true);
        try {
            const res = await geminiFetch({
                contents: [{ parts: [{ text: userAnswers.code }] }],
                systemInstruction: { parts: [{ text: "Refactor Python logic. Return JSON: { \"optimizedCode\": \"...\" }" }] },
                generationConfig: { responseMimeType: "application/json" }
            });
            const data = JSON.parse(res.candidates[0].content.parts[0].text);
            setUserAnswers(prev => ({ ...prev, code: data.optimizedCode }));
        } catch (e) { setError("REF_OPT_ERR"); } finally { setIsOptimizing(false); }
    };

    const toggleConcept = async (dIdx, cIdx) => {
        if (!learningPlan?.days?.[dIdx]?.concepts?.[cIdx]) return;
        const planCopy = JSON.parse(JSON.stringify(learningPlan));
        const target = planCopy.days[dIdx].concepts[cIdx];
        target.completed = !target.completed;

        const today = getTodayKey();
        const historyCopy = { ...studyHistory };
        if (!historyCopy[today]) historyCopy[today] = { hours: 0, learned: [] };

        if (target.completed) {
            if (!historyCopy[today].learned.includes(String(target.title))) historyCopy[today].learned.push(String(target.title));
        } else {
            historyCopy[today].learned = historyCopy[today].learned.filter(t => t !== String(target.title));
        }

        setLearningPlan(planCopy);
        setStudyHistory(historyCopy);
        if (user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), { learningPlan: planCopy, studyHistory: historyCopy }, { merge: true });
    };

    const updateGoal = async (val) => {
        const newVal = Math.max(1, val);
        setDailyGoalHours(newVal);
        if (user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), { dailyGoalHours: newVal }, { merge: true });
    };

    // --- AI Generation ---
    const generatePlan = async () => {
        if (!currentTopic.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await geminiFetch({
                contents: [{ parts: [{ text: currentTopic }] }],
                systemInstruction: { parts: [{ text: "Design 1-3 day curriculum. MUST include 5 unique reference URLs from different sites. Return JSON: { \"topic\": \"...\", \"days\": [{\"day\": 1, \"concepts\": [{\"title\":\"...\", \"completed\": false}]}], \"references\": [{\"name\":\"...\", \"url\":\"...\"}] }" }] },
                generationConfig: { responseMimeType: "application/json" }
            });
            const data = JSON.parse(res.candidates[0].content.parts[0].text);
            data.createdAt = new Date().toISOString();
            setLearningPlan(data);
            if (user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), { learningPlan: data }, { merge: true });
        } catch (e) { setError("COMPILE_ERR"); } finally { setLoading(false); }
    };

    const generateAssessment = async () => {
        if (!learningPlan) return;
        setLoading(true);
        try {
            const res = await geminiFetch({
                contents: [{ parts: [{ text: `Exam for ${learningPlan.topic}` }] }],
                systemInstruction: { parts: [{ text: "Rigorous technical assessment. Return JSON: { \"mcqs\": [{\"question\":\"...\", \"options\":[]}], \"codingChallenge\": {\"question\":\"...\", \"sampleInput\":\"...\", \"expectedOutput\":\"...\"} }" }] },
                generationConfig: { responseMimeType: "application/json" }
            });
            setAssessment(JSON.parse(res.candidates[0].content.parts[0].text));
            setUserAnswers({ mcqs: {}, code: "" });
        } catch (e) { setError("ASSESS_IO_FAIL"); } finally { setLoading(false); }
    };

    const submitAssessment = async () => {
        setIsEvaluating(true);
        try {
            const res = await geminiFetch({
                contents: [{ parts: [{ text: JSON.stringify({ assessment, userAnswers }) }] }],
                systemInstruction: { parts: [{ text: "Senior ML Evaluator. Return JSON: { \"score\": 85, \"feedback\": \"...\" }" }] },
                generationConfig: { responseMimeType: "application/json" }
            });
            const result = JSON.parse(res.candidates[0].content.parts[0].text);
            setEvaluation(result);
            if (user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), { lastEvaluation: result }, { merge: true });
            setAssessment(null);
        } catch (e) { setError("EVAL_REPORT_FAIL"); } finally { setIsEvaluating(false); }
    };

    const generateLeetTasks = async () => {
        setIsGeneratingLeet(true);
        try {
            const res = await geminiFetch({
                contents: [{ parts: [{ text: `LeetCode problems for ${learningPlan?.topic || "Technical"}` }] }],
                systemInstruction: { parts: [{ text: "Return strictly JSON: { \"easy\": [{\"id\":\"...\", \"title\":\"...\", \"url\":\"...\"}], \"hard\": [], \"advanced\": [] }" }] },
                generationConfig: { responseMimeType: "application/json" }
            });
            setLeetTasks(JSON.parse(res.candidates[0].content.parts[0].text));
        } catch (e) { setError("LEET_SYNC_FAIL"); } finally { setIsGeneratingLeet(false); }
    };

    const analyzeProjectIdea = async () => {
        if (!projectIdea.trim()) return;
        setIsAnalyzingProject(true);
        try {
            const res = await geminiFetch({
                contents: [{ parts: [{ text: projectIdea }] }],
                systemInstruction: { parts: [{ text: "Analyze roadmap. Return JSON: { \"title\": \"...\", \"roadmap\": [] }" }] },
                generationConfig: { responseMimeType: "application/json" }
            });
            setProjectAnalysis(JSON.parse(res.candidates[0].content.parts[0].text));
        } catch (e) { setError("ARCH_LINK_FAIL"); } finally { setIsAnalyzingProject(false); }
    };

    const addProject = (name) => {
        const updated = [...projects, { id: Date.now(), name: String(name) }];
        setProjects(updated);
        if (user) setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), { projects: updated }, { merge: true });
    };

    const removeProject = (id) => {
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        if (user) setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), { projects: updated }, { merge: true });
    };

    // --- Auth & Sync Listeners ---
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else { await signInAnonymously(auth); }
            } catch (err) { console.error("Auth:", err); }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    const syncState = async () => {
        if (!user) return;
        const today = getTodayKey();
        const histCopy = { ...studyHistory };
        if (!histCopy[today]) histCopy[today] = { hours: 0, learned: [] };
        histCopy[today].hours = studySecondsToday / 3600;
        try {
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), {
                studySecondsToday, dailyGoalHours, studyHistory: histCopy, projects
            }, { merge: true });
        } catch (e) { }
    };
    useEffect(() => { if (studySecondsToday > 0 && studySecondsToday % 60 === 0) syncState(); }, [studySecondsToday]);

    const renderCalendar = () => {
        const today = new Date();
        const dInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const startDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
        const days = [];
        for (let i = 0; i < startDay; i++) days.push(<div key={`pad-${i}`} className="h-16 opacity-0" />);
        for (let d = 1; d <= dInMonth; d++) {
            const dKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const entry = studyHistory[dKey];
            const isSel = selectedDate === dKey;
            days.push(
                <button key={`cal-${dKey}`} onClick={() => setSelectedDate(dKey)} className={`h-16 border relative rounded-xl flex flex-col items-center justify-center transition-all ${isSel ? 'border-indigo-400 shadow-md scale-105 z-10' : 'border-white/5 hover:border-white/20'}`} style={{ backgroundColor: entry ? `rgba(99, 102, 241, ${Math.min(0.8, 0.2 + (entry.hours / 8))})` : 'rgba(255,255,255,0.02)' }}>
                    <span className={`text-[10px] font-black ${isSel ? 'text-white' : 'text-white/20'}`}>{d}</span>
                    {entry && <div className="mt-1 text-[8px] font-black text-white/50">{entry.hours.toFixed(1)}H</div>}
                    {entry?.learned?.length > 0 && <div className="absolute bottom-2 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="min-h-screen bg-[#010502] text-emerald-400 p-4 md:p-6 font-mono flex flex-col relative selection:bg-emerald-500/30 overflow-x-hidden">
            <MatrixBackground color={currentTheme.primary} />

            <div className="max-w-7xl mx-auto w-full flex-1 z-10 relative">

                {/* HUD Tracker */}
                <div className="mb-8">
                    <div className="bg-black/80 border-2 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}44` }}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl flex items-center justify-center border transition-colors duration-1000 shadow-inner" style={{ borderColor: `${currentTheme.primary}66`, backgroundColor: `${currentTheme.primary}11` }}>
                                    <Timer className={isTimerRunning ? "animate-pulse" : ""} style={{ color: currentTheme.primary }} size={28} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-30 tracking-widest">CHRONO_STREAM</p>
                                    <h2 className="text-2xl font-black tabular-nums tracking-tighter" style={{ color: currentTheme.primary }}>{formatSeconds(studySecondsToday)}</h2>
                                </div>
                            </div>
                            <div className="flex-1 w-full max-w-lg text-center">
                                <p className="text-[10px] font-black uppercase mb-3 opacity-30 tracking-widest">CAPACITY_GAGE</p>
                                <div className="h-3 bg-black border border-white/10 rounded-full overflow-hidden p-0.5">
                                    <div className="h-full rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${studyPercentage}%`, backgroundColor: currentTheme.primary, boxShadow: `0 0 10px ${currentTheme.primary}` }}></div>
                                </div>
                                <div className="mt-2 text-[12px] font-black tracking-widest uppercase" style={{ color: currentTheme.primary }}>{studyPercentage}% COMPLETE</div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => { if (isTimerRunning) syncState(); setIsTimerRunning(!isTimerRunning); }} className="w-14 h-14 border rounded-3xl active:scale-90 flex items-center justify-center shadow-xl transition-all" style={{ borderColor: isTimerRunning ? '#ef4444' : currentTheme.primary, color: isTimerRunning ? '#ef4444' : currentTheme.primary, backgroundColor: isTimerRunning ? '#ef444411' : `${currentTheme.primary}11` }}>
                                    {isTimerRunning ? <Pause size={24} /> : <Play size={24} />}
                                </button>
                                <button onClick={() => { if (window.confirm("RESET?")) setStudySecondsToday(0); }} className="w-10 h-10 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/5 opacity-20 hover:opacity-100 transition-all"><RotateCcw size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Universal Navigation */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 border-2 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-colors duration-1000" style={{ borderColor: currentTheme.primary, color: currentTheme.primary, backgroundColor: `${currentTheme.primary}11` }}>
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-widest text-white uppercase leading-none">DEEPFLOW.SYS</h1>
                            <p className="text-[10px] font-black uppercase opacity-40 mt-1">NODE_BUILD_5.0</p>
                        </div>
                    </div>
                    {!assessment && (
                        <nav className="flex bg-black/60 p-2 border rounded-full shadow-lg transition-colors duration-1000 no-scrollbar overflow-x-auto max-w-full">
                            {[
                                { id: 'dashboard', icon: LayoutDashboard, label: 'Mastery' },
                                { id: 'focus', icon: Target, label: 'Goal' },
                                { id: 'projects', icon: Code, label: 'Lab' },
                                { id: 'leetcode', icon: Binary, label: 'LeetCode' },
                                { id: 'archive', icon: CalendarDays, label: 'Archive' }
                            ].map(tab => (
                                <button key={`nav-lnk-fin-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all relative ${activeTab === tab.id ? 'text-black font-black' : 'text-white/30 hover:text-white'}`} style={{ backgroundColor: activeTab === tab.id ? currentTheme.primary : 'transparent' }}>
                                    <tab.icon size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    )}
                </header>

                <main className="pb-32">
                    {/* Mastery Section */}
                    {activeTab === 'dashboard' && !assessment && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in">
                            <div className="lg:col-span-2 space-y-10">
                                <section className="bg-black/60 p-10 border rounded-[3.5rem] shadow-2xl transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}22` }}>
                                    <div className="mb-8 border-l-4 pl-8 transition-colors duration-1000" style={{ borderColor: currentTheme.primary }}>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-none">SYLLABUS_IO</h2>
                                        <p className="text-[10px] font-black uppercase opacity-20 tracking-widest mt-2">Adaptive Analysis Engine</p>
                                    </div>
                                    <textarea placeholder=">> INPUT_MISSION_TARGETS..." className="w-full min-h-[140px] p-8 border rounded-[2rem] bg-black text-white focus:outline-none text-base font-bold resize-none shadow-inner transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}33` }} value={currentTopic} onChange={(e) => setCurrentTopic(e.target.value)} />
                                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                        <button onClick={generatePlan} disabled={loading || !currentTopic} className="flex-1 py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-2xl" style={{ backgroundColor: currentTheme.primary, color: '#000' }}>{loading ? "COMPILING..." : "INIT_MISSION"}</button>
                                        {learningPlan && <button onClick={generateAssessment} className="border px-10 py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest transition-all hover:bg-white hover:text-black" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>RUN_EVAL</button>}
                                    </div>

                                    {learningPlan && (
                                        <div className="mt-12 space-y-10 animate-in">
                                            <div className="bg-black/60 border rounded-[2.5rem] p-8 shadow-xl transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}22` }}>
                                                <div className="flex items-center gap-4 mb-6"><Link2 className="text-emerald-500" size={24} /><h3 className="text-lg font-black tracking-widest text-white uppercase">Reference_Vault</h3></div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(learningPlan.references || []).map((ref, idx) => (
                                                        <a key={`ref-v11-${idx}`} href={String(ref.url || "#")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all shadow-inner">
                                                            <div className="flex flex-col"><span className="text-[9px] font-black text-emerald-900 mb-1 uppercase tracking-tight">Lookup_Node</span><span className="text-[12px] font-bold text-white/60 group-hover:text-emerald-400 truncate max-w-[150px] uppercase">{String(ref.name || "SOURCE")}</span></div>
                                                            <ExternalLink size={14} className="text-white/20 group-hover:text-emerald-400" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className={`grid gap-6 ${getGridColsClass((learningPlan.days || []).length || 1)}`}>
                                                {(learningPlan.days || []).map((day, dIdx) => (
                                                    <div key={`phase-v11-${dIdx}`} className="bg-white/5 p-6 border rounded-[2rem] shadow-inner transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}22` }}>
                                                        <span className="text-[10px] font-black uppercase border rounded-lg px-3 py-1.5 block w-fit mb-6 shadow-lg" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>PHASE_0{day.day}</span>
                                                        <div className="space-y-4">
                                                            {(day.concepts || []).map((concept, cIdx) => (
                                                                <button key={`conc-v11-${dIdx}-${cIdx}`} onClick={() => toggleConcept(dIdx, cIdx)} className="flex items-start gap-4 w-full text-left group">
                                                                    {concept.completed ? <CheckCircle2 size={16} style={{ color: currentTheme.primary }} className="shrink-0" /> : <Square size={16} className="shrink-0 opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: currentTheme.primary }} />}
                                                                    <span className={`text-[12px] font-black uppercase leading-tight ${concept.completed ? 'opacity-20 line-through' : 'text-white/80 group-hover:text-white'}`}>{String(concept.title || "NODE")}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>

                            <div className="space-y-10">
                                <div className="bg-black/60 p-10 border rounded-[3rem] text-center shadow-xl transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}22` }}>
                                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-6">EFFICIENCY</h3>
                                    <div className="text-[5rem] font-black transition-colors duration-1000 leading-none" style={{ color: currentTheme.primary }}>{studyPercentage}%</div>
                                    <p className="text-[10px] font-black opacity-20 uppercase mt-8 tracking-widest">GOAL: {dailyGoalHours}H</p>
                                </div>

                                {evaluation && (
                                    <div className="bg-[#0c0505] border-2 border-red-500/30 p-10 rounded-[3rem] shadow-3xl animate-in relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4"><button onClick={() => setEvaluation(null)} className="text-red-900 hover:text-red-500"><X size={14} /></button></div>
                                        <div className="flex items-center gap-4 mb-6"><Trophy className="text-red-500 shadow-lg" size={28} /><h3 className="text-lg font-black text-white uppercase tracking-tighter">EVAL_REPORT</h3></div>
                                        <div className="text-6xl font-black text-red-500 mb-8 tabular-nums">{evaluation.score || 0}%</div>
                                        <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                            <h4 className="text-[10px] font-black text-red-500 uppercase mb-3 underline decoration-red-900 underline-offset-4 tracking-widest">SUMMARY</h4>
                                            <p className="text-[11px] text-white/70 leading-relaxed uppercase font-bold">{String(evaluation.feedback || "ANALYSIS_COMPLETE")}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Assessment Tab */}
                    {assessment && (
                        <div className="max-w-5xl mx-auto space-y-10 py-10 pb-32 animate-in relative">
                            <header className="text-center flex flex-col items-center">
                                <div className="inline-flex items-center gap-4 bg-red-500 text-black px-8 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl mb-6">EVALUATION_LOCK</div>
                                <h2 className="text-3xl font-black text-white uppercase mb-8">{String(learningPlan?.topic || "EXAMINATION")}</h2>
                                <button onClick={generateAssessment} disabled={loading} className="px-6 py-2.5 border border-red-500/40 text-red-500 hover:bg-red-500/10 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-3 disabled:opacity-20">{loading ? <Activity className="animate-spin" size={12} /> : <RotateCcw size={12} />} REGENERATE</button>
                            </header>

                            <section className="bg-white/5 p-10 rounded-[3rem] border-2 border-red-500/10 space-y-16 shadow-2xl">
                                {(assessment.mcqs || []).map((q, qIdx) => (
                                    <div key={`mcq-v11-q-${qIdx}`}>
                                        <p className="text-lg font-bold mb-8 text-white uppercase leading-snug"><span className="text-red-500 mr-6 font-black tracking-widest">Q_0{qIdx + 1}</span> {String(q.question || "")}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {(q.options || []).map((opt, oIdx) => (
                                                <button key={`mcq-v11-opt-${qIdx}-${oIdx}`} onClick={() => setUserAnswers(p => ({ ...p, mcqs: { ...p.mcqs, [qIdx]: oIdx } }))} className={`p-8 rounded-[2rem] border-2 text-left transition-all font-black text-[12px] group ${userAnswers.mcqs[qIdx] === oIdx ? 'bg-red-500 border-red-500 text-black shadow-lg' : 'bg-black border-white/5 text-white/40 hover:border-red-500/50 hover:text-white'}`}>
                                                    <div className={`w-6 h-6 rounded-full border-2 mb-4 flex items-center justify-center text-[9px] transition-all ${userAnswers.mcqs[qIdx] === oIdx ? 'bg-black text-red-500 border-black shadow-inner' : 'bg-transparent border-white/10'}`}>{String.fromCharCode(65 + oIdx)}</div>{String(opt)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </section>

                            <div className="space-y-12">
                                <section className="bg-black/60 p-10 border-2 border-red-500/20 rounded-[3rem] shadow-2xl">
                                    <div className="flex items-center gap-5 mb-8"><Terminal className="text-red-500" size={24} /><h3 className="text-xl font-black text-white uppercase tracking-widest">MISSION_SPEC (PRACTICAL)</h3></div>
                                    <div className="bg-[#080202] p-8 border border-white/5 rounded-[2rem] mb-10 shadow-inner">
                                        <h4 className="text-[9px] font-black uppercase text-red-500 mb-4 opacity-40 tracking-[0.6em]">@LOGIC_PROMPT</h4>
                                        <p className="text-lg font-black text-white uppercase tracking-tighter">{String(assessment?.codingChallenge?.question || "IMPLEMENT_RECOVERY")}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-black p-6 border border-white/5 rounded-[1.5rem]"><h5 className="text-[9px] font-black text-white/20 uppercase mb-4 tracking-widest">INPUT_BUFFER</h5><pre className="text-[10px] text-red-400 bg-red-950/20 p-5 rounded-xl border border-red-950 overflow-x-auto">{String(assessment?.codingChallenge?.sampleInput || "VOID")}</pre></div>
                                        <div className="bg-black p-6 border border-white/5 rounded-[1.5rem]"><h5 className="text-[9px] font-black text-white/20 uppercase mb-4 tracking-widest">TARGET_SYNC</h5><pre className="text-[10px] text-white bg-white/5 p-5 rounded-xl border border-white/10 overflow-x-auto">{String(assessment?.codingChallenge?.expectedOutput || "VOID")}</pre></div>
                                    </div>
                                </section>

                                <section className="bg-black border-4 border-white/5 rounded-[3.5rem] shadow-3xl overflow-hidden">
                                    <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">KERNEL_v5.0</span>
                                        <div className="flex gap-3">
                                            <button onClick={optimizeCodeLogic} disabled={isOptimizing || !userAnswers.code} className="bg-emerald-600/10 border border-emerald-500/50 text-emerald-500 px-5 py-2 rounded-2xl font-black uppercase text-[9px] active:scale-95 disabled:opacity-30 flex items-center gap-2">{isOptimizing ? <Activity className="animate-spin" size={12} /> : <Cpu size={12} />} OPTIMIZE</button>
                                            <button onClick={runCode} disabled={isRunning || !userAnswers.code} className="bg-red-500 hover:bg-red-400 text-black px-10 py-2 rounded-2xl font-black uppercase text-[10px] active:scale-95 flex items-center gap-4 transition-all"><Play size={12} fill="currentColor" /> EXECUTE</button>
                                        </div>
                                    </div>
                                    <textarea className="w-full min-h-[400px] bg-transparent p-10 text-sm focus:outline-none resize-none text-red-500 leading-relaxed custom-scrollbar font-bold" value={userAnswers.code} onChange={(e) => setUserAnswers(p => ({ ...p, code: e.target.value }))} spellCheck="false" placeholder=">> RECOVERY_START..." />
                                    <div className="m-6 mt-0 bg-black border border-white/5 rounded-[2rem] p-6 text-[11px] min-h-[120px] max-h-[250px] overflow-y-auto shadow-inner">
                                        {isRunning ? <div className="text-red-900 animate-pulse font-black text-center py-4 uppercase">KERNELS_ACTIVE...</div> : terminalOutput ? <div key="term-v11-ready"><div className="text-red-500 font-black whitespace-pre-wrap">{String(terminalOutput.output || "")}</div>{terminalOutput.error && <div className="text-white bg-red-500 p-6 rounded-2xl font-black uppercase tracking-widest">{String(terminalOutput.error)}</div>}{!terminalOutput.output && !terminalOutput.error && <div className="text-white/10 font-black text-center py-2 uppercase tracking-widest">TERMINATED_OK</div>}</div> : <div className="text-white/5 uppercase italic font-black text-center py-2">AWAITING_INPUT...</div>}
                                    </div>
                                </section>
                            </div>
                            <div className="flex flex-col items-center pt-10"><button onClick={submitAssessment} disabled={isEvaluating} className="bg-red-600 hover:bg-red-500 text-black px-24 py-6 rounded-[2.5rem] font-black uppercase text-xl tracking-[0.6em] shadow-3xl transition-all active:scale-95">{isEvaluating ? "SYNCING..." : "UPLOAD_REPORT"}</button></div>
                        </div>
                    )}

                    {/* Goal Tab */}
                    {activeTab === 'focus' && (
                        <div className="max-w-4xl mx-auto py-10 space-y-12 animate-in">
                            <div className="bg-black/70 p-20 border-2 rounded-[5rem] text-center shadow-2xl backdrop-blur-lg transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}22` }}>
                                <Target className="mx-auto mb-10 transition-colors duration-1000" size={80} style={{ color: currentTheme.primary }} />
                                <h2 className="text-3xl font-black tracking-widest mb-6 text-white uppercase">QUOTA_SET</h2>
                                <div className="flex items-center justify-center gap-16 mb-16">
                                    <button onClick={() => updateGoal(dailyGoalHours - 1)} className="w-16 h-16 border-2 rounded-3xl flex items-center justify-center text-4xl text-white/10 hover:text-white transition-all shadow-xl">-</button>
                                    <div className="text-[10rem] font-black tabular-nums transition-colors duration-1000 tracking-tighter" style={{ color: currentTheme.primary }}>{dailyGoalHours}</div>
                                    <button onClick={() => updateGoal(dailyGoalHours + 1)} className="w-16 h-16 border-2 rounded-3xl flex items-center justify-center text-4xl text-white/10 hover:text-white transition-all shadow-xl">+</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lab Tab */}
                    {activeTab === 'projects' && (
                        <div className="max-w-5xl mx-auto space-y-12 animate-in">
                            <section className="bg-black/40 p-10 border-2 rounded-[3.5rem] relative shadow-2xl transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}22` }}>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-6 mb-10">
                                        <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-colors duration-1000" style={{ backgroundColor: currentTheme.primary, color: '#000' }}><Code size={32} /></div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-widest underline decoration-white/5 underline-offset-8">ARCHITECT_CORE</h2>
                                    </div>
                                    <textarea placeholder=">> DESCRIBE_MISSION..." className="w-full min-h-[180px] p-8 border rounded-[2rem] bg-black text-white focus:outline-none text-sm font-bold resize-none mb-10 shadow-inner transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}33` }} value={projectIdea} onChange={(e) => setProjectIdea(e.target.value)} />
                                    <button onClick={analyzeProjectIdea} disabled={isAnalyzingProject || !projectIdea} className="py-6 px-16 rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all" style={{ backgroundColor: currentTheme.primary, color: '#000' }}>RUN_ANALYSIS</button>
                                    {projectAnalysis && (
                                        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className="bg-black/60 p-8 border rounded-[2.5rem] transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}22` }}>
                                                <div className="flex justify-between items-center mb-10"><h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{String(projectAnalysis.title)}</h3><span className="px-5 py-2 rounded-full text-[9px] font-black uppercase border" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>READY</span></div>
                                                <p className="text-white/30 font-bold mb-12 italic border-l-4 pl-8 text-xs uppercase tracking-tight">ANALYSIS_COMPLETE</p>
                                                <button onClick={() => { addProject(projectAnalysis.title); setProjectAnalysis(null); setProjectIdea(""); }} className="w-full py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all" style={{ backgroundColor: currentTheme.primary, color: '#000' }}>INITIALIZE_REPO</button>
                                            </div>
                                            <div className="bg-white/5 p-8 border rounded-[2.5rem] shadow-2xl transition-colors duration-1000" style={{ borderColor: `${currentTheme.primary}11` }}><h3 className="text-xl font-black text-white tracking-widest mb-10 opacity-30 underline decoration-white/5">ROADMAP_v1.0</h3><div className="space-y-8">{(projectAnalysis.roadmap || []).map((step, i) => (<div key={`roadmap-step-v11-${i}`} className="flex gap-6 font-bold group hover:translate-x-4 transition-all"><div className="text-xl font-black opacity-10 group-hover:opacity-100 transition-opacity" style={{ color: currentTheme.primary }}>0{i + 1}</div><p className="text-[12px] leading-snug uppercase tracking-tight text-white/80">{String(step)}</p></div>))}</div></div>
                                        </div>
                                    )}
                                </div>
                            </section>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 animate-in">
                                {(projects || []).map((p, idx) => (
                                    <div key={`proj-v11-item-${p.id || idx}`} className="group p-8 border bg-black/40 rounded-[2.5rem] flex flex-col justify-between h-[280px] shadow-2xl hover:translate-y-[-6px] transition-all" style={{ borderColor: `${currentTheme.primary}22` }}>
                                        <div><div className="flex justify-between items-start mb-8"><div className="p-4 rounded-2xl transition-colors duration-1000" style={{ backgroundColor: currentTheme.primary, color: '#000' }}><Code size={24} /></div><span className="text-[8px] px-4 py-2 border rounded-full font-black uppercase tracking-widest opacity-40" style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}44` }}>LIVE_REPO</span></div><h4 className="font-black text-lg tracking-tighter truncate pr-4 text-white uppercase leading-none">{String(p.name || "PROJECT")}</h4></div>
                                        <button onClick={() => removeProject(p.id)} className="text-white/5 hover:text-red-500 uppercase text-[8px] font-black tracking-widest py-3 opacity-30 hover:opacity-100 transition-all">TERMINATE</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LeetCode Tab */}
                    {activeTab === 'leetcode' && (
                        <div className="max-w-6xl mx-auto py-10 space-y-12 animate-in">
                            <header className="text-center flex flex-col items-center">
                                <div className="inline-flex items-center gap-4 bg-violet-900/50 text-violet-400 border border-violet-500/30 rounded-full px-10 py-3 text-[9px] font-black uppercase tracking-widest mb-8 shadow-2xl transition-colors duration-1000" style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}33` }}>LEETCODE_GATEWAY</div>
                                <h2 className="text-4xl font-black text-white uppercase mb-8 tracking-tighter">Algorithm_Lab</h2>
                                <button onClick={generateLeetTasks} disabled={isGeneratingLeet} className="px-10 py-4 bg-violet-600 hover:bg-violet-500 text-black rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl disabled:opacity-30 active:scale-95 transition-all">
                                    {isGeneratingLeet ? <Activity className="animate-spin" size={16} /> : <Sparkles size={16} />} GENERATE_TASKS
                                </button>
                            </header>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {['easy', 'hard', 'advanced'].map((cat) => (
                                    <div key={`leet-v11-col-${cat}`} className="bg-black/60 p-10 border border-violet-500/20 rounded-[3rem] shadow-2xl backdrop-blur-md">
                                        <div className="flex justify-between items-center mb-10 border-b border-violet-500/10 pb-6"><h3 className="text-lg font-black uppercase tracking-widest text-violet-400">{cat}</h3><button onClick={() => addLeetTask(cat)} className="p-2 border border-violet-500/30 rounded-xl hover:bg-violet-500 hover:text-black transition-all"><Plus size={16} /></button></div>
                                        <div className="space-y-6">{(leetTasks[cat] || []).map((task, tidx) => (
                                            <a key={`leet-v11-lnk-${cat}-${task.id || tidx}`} href={String(task.url || "#")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl group hover:border-violet-500/50 hover:bg-violet-500/5 transition-all shadow-inner">
                                                <span className="text-[12px] font-bold text-white/70 group-hover:text-violet-400 uppercase tracking-tight truncate flex-1 mr-4">{String(task.title || "PROBLEM")}</span><ExternalLink size={14} className="text-white/10 group-hover:text-violet-500 transition-colors" />
                                            </a>
                                        )) ?? <p className="text-[9px] opacity-10 uppercase italic text-center">AWAITING_TASKS</p>}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Archive Tab */}
                    {activeTab === 'archive' && (
                        <div className="max-w-6xl mx-auto py-10 space-y-16 animate-in">
                            <header className="text-center flex flex-col items-center">
                                <div className="inline-flex items-center gap-4 bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 rounded-full px-12 py-4 text-[10px] font-black uppercase tracking-widest mb-8 shadow-2xl">NEURAL_HISTORY_SYNC</div>
                                <h2 className="text-6xl font-black text-white uppercase leading-none tracking-tighter">Mastery_Archive</h2>
                            </header>
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                                <div className="lg:col-span-3">
                                    <section className="bg-black/60 p-12 border border-indigo-500/20 rounded-[3rem] shadow-2xl backdrop-blur-md">
                                        <div className="grid grid-cols-7 gap-4 mb-8">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (<div key={`cal-label-day-v11-${i}`} className="text-center text-[10px] font-black text-indigo-900 uppercase">{day}</div>))}
                                            {renderCalendar()}
                                        </div>
                                    </section>
                                </div>
                                <div className="lg:col-span-1 space-y-8">
                                    <section className="bg-black/60 p-10 border border-indigo-500/20 rounded-[2.5rem] shadow-xl">
                                        <h3 className="text-sm font-black text-indigo-400 uppercase mb-6 flex items-center gap-3"><History size={16} /> LOG_DETAILS</h3>
                                        <div className="space-y-6">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><span className="text-[9px] font-black text-indigo-900 uppercase block mb-1">SELECTED_DATE</span><span className="text-[12px] font-black text-white uppercase">{selectedDate}</span></div>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><span className="text-[9px] font-black text-indigo-900 uppercase block mb-1">INTENSITY</span><span className="text-xl font-black text-indigo-400 tabular-nums">{studyHistory[selectedDate]?.hours?.toFixed(1) || "0.0"}H</span></div>
                                            <div className="space-y-3">
                                                <span className="text-[9px] font-black text-indigo-900 uppercase block mb-2 underline decoration-indigo-500/20 underline-offset-4">PAYLOAD_LOGGED</span>
                                                {(studyHistory[selectedDate]?.learned || []).map((topic, i) => (<div key={`hist-tp-v11-fix-${selectedDate}-${i}`} className="flex items-center gap-3 text-[10px] text-white/60 font-bold uppercase leading-tight"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> {String(topic)}</div>)) ?? <p className="text-[9px] text-white/10 italic">NO_NODES_RECORDED</p>}
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}

                </main>

                <footer className="mt-12 py-16 border-t border-white/5 text-center opacity-30">
                    <div className="flex items-center justify-center gap-4 text-white/20 mb-4 uppercase tracking-widest text-[11px] font-black"><Copyright size={14} /> 2025 DEEPFLOW_UNIFIED_NETWORK</div>
                    <p className="text-[12px] font-black uppercase tracking-widest transition-colors duration-1000" style={{ color: currentTheme.primary }}>ALL RIGHTS RESERVED TO VASUDEV KS</p>
                </footer>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Fira Code', monospace !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #0a2512; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #10b981; }
        textarea::placeholder { opacity: 0.1; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        input, textarea, button { transition: all 0.3s ease-out; }
        .animate-spin-slow { animation: spin 15s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .shadow-3xl { box-shadow: 0 0 50px rgba(0,0,0,1), 0 0 20px rgba(239, 68, 68, 0.05); }
      `}</style>
        </div>
    );
}