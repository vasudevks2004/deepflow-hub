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
    X,
    List,
    Sun,
    Moon,
    Github
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    setDoc,
    onSnapshot,
    collection
} from 'firebase/firestore';
import {
    getAuth,
    signInWithCustomToken,
    signInAnonymously,
    onAuthStateChanged
} from 'firebase/auth';

// --- Configuration ---
// UPDATED: Use environment configuration to prevent auth/configuration-not-found errors
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const apiKey = "AIzaSyAU45E-HXxAVhuO_Zbl8Jf8HG1oipB4KjA"; // Set to empty string to use environment key

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
const MatrixBackground = ({ color = "#00ff41", isDarkMode = true }) => {
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
            // Fade effect: Use semi-transparent background to create trails
            // Dark mode: Black fade. Light mode: White fade.
            ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
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
    }, [color, isDarkMode]);
    
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
    const [isDarkMode, setIsDarkMode] = useState(true); // Theme State

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

    // Force Green Theme everywhere (Dynamic based on Light/Dark)
    const currentTheme = { 
        primary: isDarkMode ? "#00ff41" : "#059669", // Bright Green vs Darker Emerald
        bg: isDarkMode ? "bg-[#010502]" : "bg-[#f0fdf4]",
        text: isDarkMode ? "text-emerald-400" : "text-emerald-900",
        cardBg: isDarkMode ? "bg-black/60" : "bg-white/60",
        borderColor: isDarkMode ? "border-white/5" : "border-emerald-900/10",
        navActiveBg: isDarkMode ? "#00ff41" : "#34d399",
        mutedText: isDarkMode ? "text-white/30" : "text-emerald-900/40"
    };

    // --- Effects ---
    // Timer Logic
    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setStudySecondsToday(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

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
                systemInstruction: { parts: [{ text: "Senior Technical Evaluator. Grade strictly. Return JSON: { \"score\": number (0-100), \"feedback\": \"Brief summary of performance.\", \"improvements\": [\"Specific improvement point 1\", \"Specific improvement point 2\", \"Concept to review X\"] }" }] },
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

    const addLeetTask = (category) => {
        const newTask = {
            id: Date.now().toString(),
            title: "New Custom Problem",
            url: "https://leetcode.com/problemset/all/"
        };
        setLeetTasks(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), newTask]
        }));
    };

    const analyzeProjectIdea = async () => {
        if (!projectIdea.trim()) return;
        setIsAnalyzingProject(true);
        try {
            const res = await geminiFetch({
                contents: [{ parts: [{ text: projectIdea }] }],
                systemInstruction: { parts: [{ text: "Senior Software Architect. Provide a highly technical, accurate, step-by-step implementation roadmap including tech stack suggestions. Return JSON: { \"title\": \"Professional Project Name\", \"roadmap\": [\"1. Setup: Initialize project with...\", \"2. Backend: Configure database for...\", \"3. Core: Implement logic for...\"] }" }] },
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
                <button key={`cal-${dKey}`} onClick={() => setSelectedDate(dKey)} className={`h-16 border relative rounded-xl flex flex-col items-center justify-center transition-all ${isSel ? 'border-emerald-400 shadow-md scale-105 z-10' : `${currentTheme.borderColor} hover:border-emerald-500/30`}`} style={{ backgroundColor: entry ? `rgba(16, 185, 129, ${Math.min(0.8, 0.2 + (entry.hours / 8))})` : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}>
                    <span className={`text-[10px] font-black ${isSel ? 'text-white' : currentTheme.mutedText}`}>{d}</span>
                    {entry && <div className={`mt-1 text-[8px] font-black ${isDarkMode ? 'text-white/50' : 'text-emerald-900/50'}`}>{entry.hours.toFixed(1)}H</div>}
                    {entry?.learned?.length > 0 && <div className="absolute bottom-2 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />}
                </button>
            );
        }
        return days;
    };

    return (
        <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} p-4 md:p-6 font-mono flex flex-col relative selection:bg-emerald-500/30 overflow-x-hidden transition-colors duration-500`}>
            <MatrixBackground color={currentTheme.primary} isDarkMode={isDarkMode} />

            <div className="max-w-7xl mx-auto w-full flex-1 z-10 relative">

                {/* Universal Navigation & Header */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 border-2 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-colors duration-1000" style={{ borderColor: currentTheme.primary, color: currentTheme.primary, backgroundColor: `${currentTheme.primary}11` }}>
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h1 className={`text-xl font-black tracking-widest uppercase leading-none ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>DEEPFLOW.SYS</h1>
                            <p className="text-[10px] font-black uppercase opacity-40 mt-1">NODE_BUILD_5.3</p>
                        </div>
                    </div>

                    {!assessment && (
                        <nav className={`${currentTheme.cardBg} p-2 border rounded-full shadow-lg transition-colors duration-1000 no-scrollbar overflow-x-auto max-w-full flex items-center`} style={{ borderColor: currentTheme.borderColor }}>
                            {[
                                { id: 'dashboard', icon: LayoutDashboard, label: 'Mastery' },
                                { id: 'focus', icon: Target, label: 'Goal' },
                                { id: 'projects', icon: Code, label: 'Lab' },
                                { id: 'leetcode', icon: Binary, label: 'LeetCode' },
                                { id: 'archive', icon: CalendarDays, label: 'Archive' }
                            ].map(tab => (
                                <button key={`nav-lnk-fin-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all relative ${activeTab === tab.id ? `${isDarkMode ? 'text-black' : 'text-white'} font-black` : `${currentTheme.mutedText} hover:text-emerald-500`}`} style={{ backgroundColor: activeTab === tab.id ? currentTheme.navActiveBg : 'transparent' }}>
                                    <tab.icon size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                                </button>
                            ))}
                            
                            {/* Theme Toggle Inside Nav */}
                            <div className={`w-px h-6 mx-2 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}></div>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-emerald-500/10 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                        </nav>
                    )}
                </header>

                <main className="pb-32">
                    {/* Mastery Section */}
                    {activeTab === 'dashboard' && !assessment && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in">
                            <div className="lg:col-span-2 space-y-10">
                                <section className={`${currentTheme.cardBg} p-10 border rounded-[3.5rem] shadow-2xl transition-colors duration-1000`} style={{ borderColor: currentTheme.borderColor }}>
                                    <div className="mb-8 border-l-4 pl-8 transition-colors duration-1000" style={{ borderColor: currentTheme.primary }}>
                                        <h2 className={`text-2xl font-black uppercase tracking-widest leading-none ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>SYLLABUS_IO</h2>
                                        <p className="text-[10px] font-black uppercase opacity-20 tracking-widest mt-2">Adaptive Analysis Engine</p>
                                    </div>
                                    <textarea placeholder=">> INPUT_MISSION_TARGETS..." className={`w-full min-h-[140px] p-8 border rounded-[2rem] focus:outline-none text-base font-bold resize-none shadow-inner transition-colors duration-1000 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-emerald-950'}`} style={{ borderColor: `${currentTheme.primary}33` }} value={currentTopic} onChange={(e) => setCurrentTopic(e.target.value)} />
                                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                        <button onClick={generatePlan} disabled={loading || !currentTopic} className="flex-1 py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-2xl" style={{ backgroundColor: currentTheme.primary, color: isDarkMode ? '#000' : '#fff' }}>{loading ? "COMPILING..." : "INIT_MISSION"}</button>
                                        {learningPlan && <button onClick={generateAssessment} className="border px-10 py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest transition-all hover:opacity-70" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>RUN_EVAL</button>}
                                    </div>

                                    {learningPlan && (
                                        <div className="mt-12 space-y-10 animate-in">
                                            <div className={`${currentTheme.cardBg} border rounded-[2.5rem] p-8 shadow-xl transition-colors duration-1000`} style={{ borderColor: currentTheme.borderColor }}>
                                                <div className="flex items-center gap-4 mb-6"><Link2 className="text-emerald-500" size={24} /><h3 className={`text-lg font-black tracking-widest uppercase ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>Reference_Vault</h3></div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(learningPlan.references || []).map((ref, idx) => (
                                                        <a key={`ref-v11-${idx}`} href={String(ref.url || "#")} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-4 border rounded-2xl group transition-all shadow-inner ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'bg-white/40 border-emerald-900/10 hover:border-emerald-500/50 hover:bg-emerald-50'}`}>
                                                            <div className="flex flex-col"><span className="text-[9px] font-black text-emerald-600 mb-1 uppercase tracking-tight">Lookup_Node</span><span className={`text-[12px] font-bold truncate max-w-[150px] uppercase ${isDarkMode ? 'text-white/60 group-hover:text-emerald-400' : 'text-emerald-900/70 group-hover:text-emerald-700'}`}>{String(ref.name || "SOURCE")}</span></div>
                                                            <ExternalLink size={14} className="opacity-20 group-hover:opacity-100 text-emerald-500" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className={`grid gap-6 ${getGridColsClass((learningPlan.days || []).length || 1)}`}>
                                                {(learningPlan.days || []).map((day, dIdx) => (
                                                    <div key={`phase-v11-${dIdx}`} className={`${isDarkMode ? 'bg-white/5' : 'bg-white/40'} p-6 border rounded-[2rem] shadow-inner transition-colors duration-1000`} style={{ borderColor: currentTheme.borderColor }}>
                                                        <span className="text-[10px] font-black uppercase border rounded-lg px-3 py-1.5 block w-fit mb-6 shadow-lg" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>PHASE_0{day.day}</span>
                                                        <div className="space-y-4">
                                                            {(day.concepts || []).map((concept, cIdx) => (
                                                                <button key={`conc-v11-${dIdx}-${cIdx}`} onClick={() => toggleConcept(dIdx, cIdx)} className="flex items-start gap-4 w-full text-left group">
                                                                    {concept.completed ? <CheckCircle2 size={16} style={{ color: currentTheme.primary }} className="shrink-0" /> : <Square size={16} className="shrink-0 opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: currentTheme.primary }} />}
                                                                    <span className={`text-[12px] font-black uppercase leading-tight ${concept.completed ? 'opacity-20 line-through' : `${isDarkMode ? 'text-white/80 group-hover:text-white' : 'text-emerald-900/80 group-hover:text-emerald-950'}`}`}>{String(concept.title || "NODE")}</span>
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
                                <div className={`${currentTheme.cardBg} p-10 border rounded-[3rem] text-center shadow-xl transition-colors duration-1000`} style={{ borderColor: currentTheme.borderColor }}>
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-6 ${currentTheme.mutedText}`}>EFFICIENCY</h3>
                                    <div className="text-[5rem] font-black transition-colors duration-1000 leading-none" style={{ color: currentTheme.primary }}>{studyPercentage}%</div>
                                    <p className="text-[10px] font-black opacity-20 uppercase mt-8 tracking-widest">GOAL: {dailyGoalHours}H</p>
                                </div>

                                {evaluation && (
                                    <div className={`${isDarkMode ? 'bg-[#0c0505] border-emerald-500/30' : 'bg-white border-emerald-200'} border-2 p-10 rounded-[3rem] shadow-3xl animate-in relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 p-4"><button onClick={() => setEvaluation(null)} className="text-emerald-900 hover:text-emerald-500"><X size={14} /></button></div>
                                        <div className="flex items-center gap-4 mb-6"><Trophy className="text-emerald-500 shadow-lg" size={28} /><h3 className={`text-lg font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>EVAL_REPORT</h3></div>
                                        <div className="text-6xl font-black text-emerald-500 mb-8 tabular-nums">{evaluation.score || 0}%</div>
                                        <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl mb-4">
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase mb-3 underline decoration-emerald-900 underline-offset-4 tracking-widest">SUMMARY</h4>
                                            <p className={`text-[11px] leading-relaxed uppercase font-bold ${isDarkMode ? 'text-white/70' : 'text-emerald-900/70'}`}>{String(evaluation.feedback || "ANALYSIS_COMPLETE")}</p>
                                        </div>
                                        {/* UPDATED: Display Improvements/Pendings */}
                                        {evaluation.improvements && evaluation.improvements.length > 0 && (
                                            <div className={`p-5 border rounded-2xl ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-emerald-50 border-emerald-100'}`}>
                                                <h4 className={`text-[10px] font-black uppercase mb-3 underline underline-offset-4 tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-white/50 decoration-white/10' : 'text-emerald-800/50 decoration-emerald-200'}`}><List size={12}/> PENDING_OPTIMIZATIONS</h4>
                                                <ul className="space-y-2">
                                                    {evaluation.improvements.map((point, idx) => (
                                                        <li key={`imp-${idx}`} className={`text-[10px] font-bold uppercase flex items-start gap-2 ${isDarkMode ? 'text-white/60' : 'text-emerald-800/70'}`}>
                                                            <span className="text-emerald-500 mt-1">●</span> {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Assessment Tab */}
                    {assessment && (
                        <div className="max-w-5xl mx-auto space-y-10 py-10 pb-32 animate-in relative">
                            <header className="text-center flex flex-col items-center">
                                <div className="inline-flex items-center gap-4 bg-emerald-500 text-black px-8 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl mb-6">EVALUATION_LOCK</div>
                                <h2 className={`text-3xl font-black uppercase mb-8 ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>{String(learningPlan?.topic || "EXAMINATION")}</h2>
                                <button onClick={generateAssessment} disabled={loading} className="px-6 py-2.5 border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-3 disabled:opacity-20">{loading ? <Activity className="animate-spin" size={12} /> : <RotateCcw size={12} />} REGENERATE</button>
                            </header>

                            <section className={`${currentTheme.cardBg} p-10 rounded-[3rem] border-2 border-emerald-500/10 space-y-16 shadow-2xl`}>
                                {(assessment.mcqs || []).map((q, qIdx) => (
                                    <div key={`mcq-v11-q-${qIdx}`}>
                                        <p className={`text-lg font-bold mb-8 uppercase leading-snug ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}><span className="text-emerald-500 mr-6 font-black tracking-widest">Q_0{qIdx + 1}</span> {String(q.question || "")}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {(q.options || []).map((opt, oIdx) => (
                                                <button key={`mcq-v11-opt-${qIdx}-${oIdx}`} onClick={() => setUserAnswers(p => ({ ...p, mcqs: { ...p.mcqs, [qIdx]: oIdx } }))} className={`p-8 rounded-[2rem] border-2 text-left transition-all font-black text-[12px] group ${userAnswers.mcqs[qIdx] === oIdx ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg' : `${isDarkMode ? 'bg-black border-white/5 text-white/40 hover:text-white' : 'bg-white border-emerald-900/5 text-emerald-900/60 hover:text-emerald-900'} hover:border-emerald-500/50`}`}>
                                                    <div className={`w-6 h-6 rounded-full border-2 mb-4 flex items-center justify-center text-[9px] transition-all ${userAnswers.mcqs[qIdx] === oIdx ? 'bg-black text-emerald-500 border-black shadow-inner' : 'bg-transparent border-white/10'}`}>{String.fromCharCode(65 + oIdx)}</div>{String(opt)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </section>

                            <div className="space-y-12">
                                <section className={`${currentTheme.cardBg} p-10 border-2 border-emerald-500/20 rounded-[3rem] shadow-2xl`}>
                                    <div className="flex items-center gap-5 mb-8"><Terminal className="text-emerald-500" size={24} /><h3 className={`text-xl font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>MISSION_SPEC (PRACTICAL)</h3></div>
                                    <div className={`${isDarkMode ? 'bg-[#080202]' : 'bg-white'} p-8 border border-white/5 rounded-[2rem] mb-10 shadow-inner`}>
                                        <h4 className="text-[9px] font-black uppercase text-emerald-500 mb-4 opacity-40 tracking-[0.6em]">@LOGIC_PROMPT</h4>
                                        <p className={`text-lg font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>{String(assessment?.codingChallenge?.question || "IMPLEMENT_RECOVERY")}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={`${isDarkMode ? 'bg-black' : 'bg-white'} p-6 border border-white/5 rounded-[1.5rem]`}><h5 className="text-[9px] font-black text-emerald-500/50 uppercase mb-4 tracking-widest">INPUT_BUFFER</h5><pre className="text-[10px] text-emerald-500 bg-emerald-500/5 p-5 rounded-xl border border-emerald-500/10 overflow-x-auto">{String(assessment?.codingChallenge?.sampleInput || "VOID")}</pre></div>
                                        <div className={`${isDarkMode ? 'bg-black' : 'bg-white'} p-6 border border-white/5 rounded-[1.5rem]`}><h5 className="text-[9px] font-black text-emerald-500/50 uppercase mb-4 tracking-widest">TARGET_SYNC</h5><pre className={`text-[10px] p-5 rounded-xl border border-white/10 overflow-x-auto ${isDarkMode ? 'text-white bg-white/5' : 'text-emerald-950 bg-emerald-50'}`}>{String(assessment?.codingChallenge?.expectedOutput || "VOID")}</pre></div>
                                    </div>
                                </section>

                                <section className={`bg-black border-4 border-white/5 rounded-[3.5rem] shadow-3xl overflow-hidden`}>
                                    <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">KERNEL_v5.0</span>
                                        <div className="flex gap-3">
                                            <button onClick={optimizeCodeLogic} disabled={isOptimizing || !userAnswers.code} className="bg-emerald-600/10 border border-emerald-500/50 text-emerald-500 px-5 py-2 rounded-2xl font-black uppercase text-[9px] active:scale-95 disabled:opacity-30 flex items-center gap-2">{isOptimizing ? <Activity className="animate-spin" size={12} /> : <Cpu size={12} />} OPTIMIZE</button>
                                            <button onClick={runCode} disabled={isRunning || !userAnswers.code} className="bg-emerald-500 hover:bg-emerald-400 text-black px-10 py-2 rounded-2xl font-black uppercase text-[10px] active:scale-95 flex items-center gap-4 transition-all"><Play size={12} fill="currentColor" /> EXECUTE</button>
                                        </div>
                                    </div>
                                    <textarea className="w-full min-h-[400px] bg-[#0c0c0c] p-10 text-sm focus:outline-none resize-none text-emerald-500 leading-relaxed custom-scrollbar font-bold" value={userAnswers.code} onChange={(e) => setUserAnswers(p => ({ ...p, code: e.target.value }))} spellCheck="false" placeholder=">> RECOVERY_START..." />
                                    <div className="m-6 mt-0 bg-black border border-white/5 rounded-[2rem] p-6 text-[11px] min-h-[120px] max-h-[250px] overflow-y-auto shadow-inner">
                                        {isRunning ? <div className="text-emerald-900 animate-pulse font-black text-center py-4 uppercase">KERNELS_ACTIVE...</div> : terminalOutput ? <div key="term-v11-ready"><div className="text-emerald-500 font-black whitespace-pre-wrap">{String(terminalOutput.output || "")}</div>{terminalOutput.error && <div className="text-white bg-red-500 p-6 rounded-2xl font-black uppercase tracking-widest">{String(terminalOutput.error)}</div>}{!terminalOutput.output && !terminalOutput.error && <div className="text-white/10 font-black text-center py-2 uppercase tracking-widest">TERMINATED_OK</div>}</div> : <div className="text-white/5 uppercase italic font-black text-center py-2">AWAITING_INPUT...</div>}
                                    </div>
                                </section>
                            </div>
                            <div className="flex flex-col items-center pt-10"><button onClick={submitAssessment} disabled={isEvaluating} className="bg-emerald-600 hover:bg-emerald-500 text-black px-24 py-6 rounded-[2.5rem] font-black uppercase text-xl tracking-[0.6em] shadow-3xl transition-all active:scale-95">{isEvaluating ? "SYNCING..." : "UPLOAD_REPORT"}</button></div>
                        </div>
                    )}

                    {/* Goal Tab - UPDATED with Timer */}
                    {activeTab === 'focus' && (
                        <div className="max-w-4xl mx-auto py-10 space-y-12 animate-in">
                            <div className={`${currentTheme.cardBg} p-20 border-2 rounded-[5rem] text-center shadow-2xl backdrop-blur-lg transition-colors duration-1000`} style={{ borderColor: `${currentTheme.primary}22` }}>
                                <Target className="mx-auto mb-10 transition-colors duration-1000" size={80} style={{ color: currentTheme.primary }} />
                                <h2 className={`text-3xl font-black tracking-widest mb-6 uppercase ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>QUOTA_SET</h2>
                                
                                {/* Goal Adjustment Controls */}
                                <div className="flex items-center justify-center gap-16 mb-16">
                                    <button onClick={() => updateGoal(dailyGoalHours - 1)} className={`w-16 h-16 border-2 rounded-3xl flex items-center justify-center text-4xl hover:text-emerald-500 transition-all shadow-xl ${isDarkMode ? 'text-white/10 border-white/10' : 'text-emerald-900/10 border-emerald-900/10'}`}>-</button>
                                    <div className="text-[10rem] font-black tabular-nums transition-colors duration-1000 tracking-tighter" style={{ color: currentTheme.primary }}>{dailyGoalHours}</div>
                                    <button onClick={() => updateGoal(dailyGoalHours + 1)} className={`w-16 h-16 border-2 rounded-3xl flex items-center justify-center text-4xl hover:text-emerald-500 transition-all shadow-xl ${isDarkMode ? 'text-white/10 border-white/10' : 'text-emerald-900/10 border-emerald-900/10'}`}>+</button>
                                </div>

                                {/* Timer Section inside Goal Tab */}
                                <div className={`${isDarkMode ? 'bg-white/5' : 'bg-black/5'} p-10 rounded-[3rem] border border-white/5`}>
                                    <h3 className={`text-[12px] font-black uppercase tracking-widest mb-8 ${currentTheme.mutedText}`}>ACTIVE_SESSION_TIMER</h3>
                                    <div className={`text-6xl font-black tabular-nums mb-8 ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>{formatSeconds(studySecondsToday)}</div>
                                    <div className="flex justify-center gap-6">
                                         <button onClick={() => { if (isTimerRunning) syncState(); setIsTimerRunning(!isTimerRunning); }} className="px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-xl" style={{ backgroundColor: isTimerRunning ? '#ef4444' : currentTheme.primary, color: isDarkMode ? '#000' : '#fff' }}>
                                            {isTimerRunning ? <Pause size={16} fill={isDarkMode ? 'black' : 'white'} /> : <Play size={16} fill={isDarkMode ? 'black' : 'white'} />} {isTimerRunning ? "HALT_SEQUENCE" : "INIT_SEQUENCE"}
                                        </button>
                                        <button onClick={() => { if (window.confirm("RESET SESSION?")) setStudySecondsToday(0); }} className={`px-6 py-4 border rounded-2xl hover:bg-white/5 transition-all hover:text-emerald-500 ${isDarkMode ? 'border-white/10 text-white/30' : 'border-emerald-900/10 text-emerald-900/30'}`}><RotateCcw size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lab Tab */}
                    {activeTab === 'projects' && (
                        <div className="max-w-5xl mx-auto space-y-12 animate-in">
                            <section className={`${currentTheme.cardBg} p-10 border-2 rounded-[3.5rem] relative shadow-2xl transition-colors duration-1000`} style={{ borderColor: `${currentTheme.primary}22` }}>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-6 mb-10">
                                        <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-colors duration-1000" style={{ backgroundColor: currentTheme.primary, color: isDarkMode ? '#000' : '#fff' }}><Code size={32} /></div>
                                        <h2 className={`text-2xl font-black uppercase tracking-widest underline decoration-white/5 underline-offset-8 ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>ARCHITECT_CORE</h2>
                                    </div>
                                    <textarea placeholder=">> DESCRIBE_MISSION..." className={`w-full min-h-[180px] p-8 border rounded-[2rem] focus:outline-none text-sm font-bold resize-none mb-10 shadow-inner transition-colors duration-1000 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-emerald-950'}`} style={{ borderColor: `${currentTheme.primary}33` }} value={projectIdea} onChange={(e) => setProjectIdea(e.target.value)} />
                                    <button onClick={analyzeProjectIdea} disabled={isAnalyzingProject || !projectIdea} className="py-6 px-16 rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all" style={{ backgroundColor: currentTheme.primary, color: isDarkMode ? '#000' : '#fff' }}>RUN_ANALYSIS</button>
                                    {projectAnalysis && (
                                        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className={`${currentTheme.cardBg} p-8 border rounded-[2.5rem] transition-colors duration-1000`} style={{ borderColor: `${currentTheme.primary}22` }}>
                                                <div className="flex justify-between items-center mb-10"><h3 className={`text-xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>{String(projectAnalysis.title)}</h3><span className="px-5 py-2 rounded-full text-[9px] font-black uppercase border" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>READY</span></div>
                                                <p className="text-white/30 font-bold mb-12 italic border-l-4 pl-8 text-xs uppercase tracking-tight">ANALYSIS_COMPLETE</p>
                                                <button onClick={() => { addProject(projectAnalysis.title); setProjectAnalysis(null); setProjectIdea(""); }} className="w-full py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all" style={{ backgroundColor: currentTheme.primary, color: isDarkMode ? '#000' : '#fff' }}>INITIALIZE_REPO</button>
                                            </div>
                                            <div className={`${isDarkMode ? 'bg-white/5' : 'bg-white/60'} p-8 border rounded-[2.5rem] shadow-2xl transition-colors duration-1000`} style={{ borderColor: `${currentTheme.primary}11` }}><h3 className={`text-xl font-black tracking-widest mb-10 opacity-30 underline decoration-white/5 ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>ROADMAP_v1.0</h3><div className="space-y-8">{(projectAnalysis.roadmap || []).map((step, i) => (<div key={`roadmap-step-v11-${i}`} className="flex gap-6 font-bold group hover:translate-x-4 transition-all"><div className="text-xl font-black opacity-10 group-hover:opacity-100 transition-opacity" style={{ color: currentTheme.primary }}>0{i + 1}</div><p className={`text-[12px] leading-snug uppercase tracking-tight ${isDarkMode ? 'text-white/80' : 'text-emerald-900/80'}`}>{String(step)}</p></div>))}</div></div>
                                        </div>
                                    )}
                                </div>
                            </section>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 animate-in">
                                {(projects || []).map((p, idx) => (
                                    <div key={`proj-v11-item-${p.id || idx}`} className={`group p-8 border rounded-[2.5rem] flex flex-col justify-between h-[280px] shadow-2xl hover:translate-y-[-6px] transition-all ${isDarkMode ? 'bg-black/40' : 'bg-white/60'}`} style={{ borderColor: `${currentTheme.primary}22` }}>
                                        <div><div className="flex justify-between items-start mb-8"><div className="p-4 rounded-2xl transition-colors duration-1000" style={{ backgroundColor: currentTheme.primary, color: isDarkMode ? '#000' : '#fff' }}><Code size={24} /></div><span className="text-[8px] px-4 py-2 border rounded-full font-black uppercase tracking-widest opacity-40" style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}44` }}>LIVE_REPO</span></div><h4 className={`font-black text-lg tracking-tighter truncate pr-4 uppercase leading-none ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>{String(p.name || "PROJECT")}</h4></div>
                                        <button onClick={() => removeProject(p.id)} className="text-white/5 hover:text-emerald-500 uppercase text-[8px] font-black tracking-widest py-3 opacity-30 hover:opacity-100 transition-all">TERMINATE</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LeetCode Tab */}
                    {activeTab === 'leetcode' && (
                        <div className="max-w-6xl mx-auto py-10 space-y-12 animate-in">
                            <header className="text-center flex flex-col items-center">
                                {/* Changed from violet to emerald/green theme */}
                                <div className="inline-flex items-center gap-4 bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 rounded-full px-10 py-3 text-[9px] font-black uppercase tracking-widest mb-8 shadow-2xl transition-colors duration-1000" style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}33` }}>LEETCODE_GATEWAY</div>
                                <h2 className={`text-4xl font-black uppercase mb-8 tracking-tighter ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>Algorithm_Lab</h2>
                                <button onClick={generateLeetTasks} disabled={isGeneratingLeet} className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-black rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl disabled:opacity-30 active:scale-95 transition-all">
                                    {isGeneratingLeet ? <Activity className="animate-spin" size={16} /> : <Sparkles size={16} />} GENERATE_TASKS
                                </button>
                            </header>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {['easy', 'hard', 'advanced'].map((cat) => (
                                    <div key={`leet-v11-col-${cat}`} className={`${currentTheme.cardBg} p-10 border border-emerald-500/20 rounded-[3rem] shadow-2xl backdrop-blur-md`}>
                                        <div className="flex justify-between items-center mb-10 border-b border-emerald-500/10 pb-6"><h3 className="text-lg font-black uppercase tracking-widest text-emerald-400">{cat}</h3><button onClick={() => addLeetTask(cat)} className="p-2 border border-emerald-500/30 rounded-xl hover:bg-emerald-500 hover:text-black transition-all"><Plus size={16} /></button></div>
                                        <div className="space-y-6">{(leetTasks[cat] || []).map((task, tidx) => (
                                            <a key={`leet-v11-lnk-${cat}-${task.id || tidx}`} href={String(task.url || "#")} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-6 border rounded-3xl group transition-all shadow-inner ${isDarkMode ? 'bg-white/5 border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'bg-white/40 border-emerald-900/10 hover:border-emerald-500/50 hover:bg-emerald-50'}`}>
                                                <span className={`text-[12px] font-bold uppercase tracking-tight truncate flex-1 mr-4 ${isDarkMode ? 'text-white/70 group-hover:text-emerald-400' : 'text-emerald-900/70 group-hover:text-emerald-700'}`}>{String(task.title || "PROBLEM")}</span><ExternalLink size={14} className="opacity-10 group-hover:opacity-100 group-hover:text-emerald-500 transition-all" />
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
                                {/* Changed from indigo to emerald/green theme */}
                                <div className="inline-flex items-center gap-4 bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 rounded-full px-12 py-4 text-[10px] font-black uppercase tracking-widest mb-8 shadow-2xl">NEURAL_HISTORY_SYNC</div>
                                <h2 className={`text-6xl font-black uppercase leading-none tracking-tighter ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>Mastery_Archive</h2>
                            </header>
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                                <div className="lg:col-span-3">
                                    <section className={`${currentTheme.cardBg} p-12 border border-emerald-500/20 rounded-[3rem] shadow-2xl backdrop-blur-md`}>
                                        <div className="grid grid-cols-7 gap-4 mb-8">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (<div key={`cal-label-day-v11-${i}`} className="text-center text-[10px] font-black text-emerald-900 uppercase">{day}</div>))}
                                            {renderCalendar()}
                                        </div>
                                    </section>
                                </div>
                                <div className="lg:col-span-1 space-y-8">
                                    <section className={`${currentTheme.cardBg} p-10 border border-emerald-500/20 rounded-[2.5rem] shadow-xl`}>
                                        <h3 className="text-sm font-black text-emerald-400 uppercase mb-6 flex items-center gap-3"><History size={16} /> LOG_DETAILS</h3>
                                        <div className="space-y-6">
                                            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-emerald-50 border-emerald-100'}`}><span className="text-[9px] font-black text-emerald-900 uppercase block mb-1">SELECTED_DATE</span><span className={`text-[12px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>{selectedDate}</span></div>
                                            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-emerald-50 border-emerald-100'}`}><span className="text-[9px] font-black text-emerald-900 uppercase block mb-1">INTENSITY</span><span className="text-xl font-black text-emerald-400 tabular-nums">{studyHistory[selectedDate]?.hours?.toFixed(1) || "0.0"}H</span></div>
                                            <div className="space-y-3">
                                                <span className="text-[9px] font-black text-emerald-900 uppercase block mb-2 underline decoration-emerald-500/20 underline-offset-4">PAYLOAD_LOGGED</span>
                                                {(studyHistory[selectedDate]?.learned || []).map((topic, i) => (<div key={`hist-tp-v11-fix-${selectedDate}-${i}`} className={`flex items-center gap-3 text-[10px] font-bold uppercase leading-tight ${isDarkMode ? 'text-white/60' : 'text-emerald-900/60'}`}><div className="w-1 h-1 bg-emerald-500 rounded-full" /> {String(topic)}</div>)) ?? <p className="text-[9px] text-white/10 italic">NO_NODES_RECORDED</p>}
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}

                </main>

                <footer className={`mt-12 py-16 border-t text-center ${isDarkMode ? 'border-white/5 text-white/30' : 'border-emerald-900/10 text-emerald-900/30'}`}>
                    <div className="flex items-center justify-center gap-4 mb-4 uppercase tracking-widest text-[11px] font-black"><Copyright size={14} /> 2025 DEEPFLOW_UNIFIED_NETWORK</div>
                    <p className="text-[12px] font-black uppercase tracking-widest transition-colors duration-1000" style={{ color: currentTheme.primary }}>ALL RIGHTS RESERVED TO VASUDEV KS</p>
                    {/* ADDED: GitHub Link */}
                    <a href="https://github.com/vasudevks2004" target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 mt-4 text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'hover:text-emerald-400' : 'hover:text-emerald-600'}`}>
                        <Github size={14} /> Connect on GitHub
                    </a>
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
        .shadow-3xl { box-shadow: 0 0 50px rgba(0,0,0,1), 0 0 20px rgba(16, 185, 129, 0.05); }
      `}</style>
        </div>
    );
}

