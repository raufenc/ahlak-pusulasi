import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { TESTS } from './constants';
import type { Test, TestConcepts, Question as QuestionType, GeminiResult } from './types';

declare const html2canvas: any;

// --- SVG Icons ---
const TestIcons: { [key: string]: React.ReactNode } = {
    kibir: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
    cesaret: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h3.75" /></svg>,
    comertlik: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    zan: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.433-4.433a.93.93 0 011.316 0l4.433 4.433c.39.39.39 1.026 0 1.416l-4.433 4.433a.93.93 0 01-1.316 0l-4.433-4.433z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 4.5l4.433 4.433a.93.93 0 010 1.316l-4.433 4.433a.93.93 0 01-1.316-1.316l4.433-4.433-4.433-4.433a.93.93 0 011.316-1.316z" /></svg>,
    hirs: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.976 5.197m-4.26-4.26l-6.174 6.175" /></svg>,
    vesvese: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
    adalet: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.153.24c-1.355 0-2.693-.44-3.797-1.242-1.409-.992-2.943-2.256-4.596-3.752-.308-.224-.614-.448-.922-.672L7.334 4.97M6.25 18.75c-1.01.143-2.01.317-3 .52m3-.52l-2.62 10.726c-.122.499.106 1.028.589 1.202a5.989 5.989 0 002.153.24c1.355 0 2.693-.44 3.797-1.242 1.409-.992 2.943-2.256 4.596-3.752.308-.224.614-.448.922-.672L16.666 4.97" /></svg>,
    hikmet: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v5.592A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998V14" /></svg>,
    iffet: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    ihlas: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
    hased: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
    sabir: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    hilm: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9.75h.008v.008H9V9.75zm6 0h.008v.008H15V9.75z" /></svg>,
    kanaat: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25v-8.25M12 15v-7.5M12 7.5h-4.5m4.5 0h4.5M3 11.25h18" /></svg>,
    sukur: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>,
    tevekkul: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>,
    haya: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v3.75m10.5 0a2.25 2.25 0 012.25 2.25v3.75a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V12a2.25 2.25 0 012.25-2.25m-6 0a2.25 2.25 0 00-2.25 2.25v3.75a2.25 2.25 0 002.25 2.25h1.5A2.25 2.25 0 009 12V9a2.25 2.25 0 00-2.25-2.25M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

// --- Reusable UI Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; forwardedRef?: React.Ref<HTMLDivElement> }> = ({ children, className = '', onClick, forwardedRef }) => (
    <div
      ref={forwardedRef}
      className={`bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6 transition-all duration-300 ease-in-out ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/50' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
);

const Button: React.FC<{ children: React.ReactNode; onClick: () => void; className?: string, disabled?: boolean, style?: React.CSSProperties }> = ({ children, onClick, className = '', disabled = false, style }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={style}
    className={`bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none ${className}`}
  >
    {children}
  </button>
);

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="sticky top-0 left-0 right-0 w-full bg-gray-700/50 backdrop-blur-md h-2 rounded-full z-10 mb-8">
        <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
    const [currentValue, setCurrentValue] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        const duration = 1200;
        const startValue = currentValue; // Animate from current value for smoother transitions
        const easeOutQuad = (t: number) => t * (2 - t);

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easedProgress = easeOutQuad(progress);
            const animatedValue = Math.floor(easedProgress * (value - startValue) + startValue);
            setCurrentValue(animatedValue);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }, [value]);

    return <span>{currentValue}%</span>;
};


const QuestionBlock: React.FC<{ question: QuestionType; selectedValue: number | undefined; onAnswer: (score: number) => void; hasError: boolean; }> = ({ question, selectedValue, onAnswer, hasError }) => (
    <Card className={hasError ? 'border-2 border-red-500' : ''}>
        <p className="text-xl mb-6 leading-relaxed">{question.soru}</p>
        <div className="space-y-4">
            {question.options.map((option, optionIndex) => (
                <div key={optionIndex}>
                    <input
                        type="radio"
                        name={`question`}
                        value={option.puan}
                        id={`q_o${optionIndex}`}
                        className="sr-only peer"
                        checked={selectedValue === option.puan}
                        onChange={() => onAnswer(option.puan)}
                    />
                    <label
                        htmlFor={`q_o${optionIndex}`}
                        className="block p-4 rounded-lg cursor-pointer border-2 border-gray-600 transition-all duration-200 hover:border-emerald-500 hover:bg-gray-700/50 peer-checked:bg-emerald-500/20 peer-checked:border-emerald-500 peer-checked:ring-2 peer-checked:ring-emerald-400 peer-checked:text-white peer-checked:scale-[1.02]"
                    >
                        {option.text}
                    </label>
                </div>
            ))}
        </div>
    </Card>
);

const ResultSummary: React.FC<{ data: { tefrit: number; fazilet: number; ifrat: number }, concepts: TestConcepts }> = ({ data, concepts }) => {
    const total = data.tefrit + data.fazilet + data.ifrat;
    
    const tefritValue = total > 0 ? Math.round((data.tefrit / total) * 100) : 0;
    const faziletValue = total > 0 ? Math.round((data.fazilet / total) * 100) : 0;
    const ifratValue = total > 0 ? Math.max(0, 100 - tefritValue - faziletValue) : 0;

    const resultData = [
        { label: concepts.tefrit, value: tefritValue, color: 'text-yellow-400' },
        { label: concepts.fazilet, value: faziletValue, color: 'text-emerald-400' },
        { label: concepts.ifrat, value: ifratValue, color: 'text-red-500' },
    ];

    return (
        <div className="flex justify-around items-start text-center my-8 animate-fade-in-up">
            {resultData.map((item) => (
                <div key={item.label} className="px-2 sm:px-4">
                    <p className={`text-base sm:text-lg font-bold ${item.color}`}>{item.label}</p>
                    <p className="text-5xl sm:text-6xl font-bold text-gray-100 tracking-tighter mt-1">
                        <AnimatedNumber value={item.value} />
                    </p>
                </div>
            ))}
        </div>
    );
};


const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center my-4 min-h-[150px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
        <p className="mt-4 text-gray-300">Kalbinizin sesi dinleniyor...</p>
    </div>
);

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
    </svg>
);


// --- Main App Component ---
export default function App() {
    const [screen, setScreen] = useState<'welcome' | 'start' | 'quiz' | 'result' | 'history'>('welcome');
    const [currentTestKey, setCurrentTestKey] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [error, setError] = useState<string>('');
    const [resultScores, setResultScores] = useState<{ tefrit: number; fazilet: number; ifrat: number } | null>(null);
    const [geminiEvaluation, setGeminiEvaluation] = useState<GeminiResult | null>(null);
    const [isLoadingGemini, setIsLoadingGemini] = useState<boolean>(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [testHistory, setTestHistory] = useState<Record<string, { percentages: { tefrit: number; fazilet: number; ifrat: number }; geminiData: GeminiResult }>>({});
    const [expandedHistoryKey, setExpandedHistoryKey] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const resultCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('ahlakPusulasiHistory');
            if (savedHistory) setTestHistory(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Failed to load history from localStorage", e);
        }
    }, []);

    const currentTest: Test | null = useMemo(() => {
        return currentTestKey ? TESTS[currentTestKey] : null;
    }, [currentTestKey]);

    const handleStartTest = (testKey: string) => {
        setCurrentTestKey(testKey);
        setAnswers({});
        setError('');
        setResultScores(null);
        setGeminiEvaluation(null);
        setCurrentQuestionIndex(0);
        setScreen('quiz');
        window.scrollTo(0, 0);
    };

    const handleAnswerChange = (score: number) => {
        const newAnswers = { ...answers, [currentQuestionIndex]: score };
        setAnswers(newAnswers);
        setError('');
        
        setTimeout(() => {
            if (currentTest && currentQuestionIndex < currentTest.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else if (currentTest && currentQuestionIndex === currentTest.questions.length - 1) {
                handleCalculateResults(newAnswers);
            }
        }, 400);
    };

    const handleNavigation = (direction: 'next' | 'prev') => {
        if (!currentTest) return;
        if (direction === 'next' && currentQuestionIndex < currentTest.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else if (direction === 'prev' && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }
    
    const fetchGeminiEvaluation = async (scores: { tefrit: number; fazilet: number; ifrat: number }, test: Test) => {
        setIsLoadingGemini(true);
        setGeminiEvaluation(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const total = scores.tefrit + scores.fazilet + scores.ifrat;
            const tefritPercent = total > 0 ? Math.round((scores.tefrit / total) * 100) : 0;
            const faziletPercent = total > 0 ? Math.round((scores.fazilet / total) * 100) : 0;
            const ifratPercent = total > 0 ? Math.max(0, 100 - tefritPercent - faziletPercent) : 0;

            const prompt = `Sen, kullanıcının kalbine dokunan bilge bir manevi rehbersin. Bir kullanıcı, "${test.title}" başlıklı bir ahlaki öz değerlendirme testini tamamladı. Bu test, İslam ahlakındaki üç temel kavramı ölçer: Tefrit (Eksiklik: ${test.concepts.tefrit}), Fazilet (Denge/Erdem: ${test.concepts.fazilet}), İfrat (Aşırılık: ${test.concepts.ifrat}).
Kullanıcının sonuçları: %${tefritPercent} Tefrit, %${faziletPercent} Fazilet, %${ifratPercent} İfrat.

Lütfen bu sonuçları temel alarak, aşağıdaki JSON formatında, kullanıcıya özel, samimi, şefkatli, bilge ve motive edici bir değerlendirme yaz. Her bölüm kısa ve öz olmalı.
- selamlama: Değerli bir yol arkadaşına seslenir gibi kısa, sıcak bir giriş yap. ('Sevgili yol arkadaşım, sonuçların kalbine ışık tutuyor.' gibi)
- sonuclarinAynasi: Sonuçları basit ve anlaşılır bir dille, yargılamadan özetle. Yüzdelerin ne anlama geldiğini açıkla.
- tefekkurKosesi: Kullanıcıyı derin düşünmeye sevk edecek, durumuyla ilgili bir veya iki kilit soru veya metafor sun.
- ilahiRehberlik: Konuyla ilgili bir Ayet-i Kerime veya Hadis-i Şerif paylaş ve bunun günümüzdeki yansımasını kısaca açıkla.
- pratikAdimlar: Kullanıcının dengeye ulaşmak için atabileceği 1-2 somut, uygulanabilir ve küçük adımlar öner.
- sonraki_test: Kullanıcının bu testteki sonucuna göre manevi yolculuğunda en faydalı olacak bir sonraki testi ve nedenini belirt.

Önerilecek testin anahtarını şu listeden seç: [${Object.keys(TESTS).filter(k => k !== currentTestKey).join(', ')}].
Cevabın SADECE geçerli bir JSON nesnesi olduğundan emin ol. Başka hiçbir metin veya açıklama ekleme.`;
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    selamlama: { type: Type.STRING },
                    sonuclarinAynasi: { type: Type.STRING },
                    tefekkurKosesi: { type: Type.STRING },
                    ilahiRehberlik: { type: Type.STRING },
                    pratikAdimlar: { type: Type.STRING },
                    sonraki_test: {
                        type: Type.OBJECT,
                        properties: {
                            key: { type: Type.STRING },
                            gerekce: { type: Type.STRING },
                        },
                    },
                },
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });

            const resultJson = JSON.parse(response.text);
            setGeminiEvaluation(resultJson);
            
            if (currentTestKey) {
                const newHistory = { ...testHistory, [currentTestKey]: { percentages: scores, geminiData: resultJson } };
                setTestHistory(newHistory);
                try {
                    localStorage.setItem('ahlakPusulasiHistory', JSON.stringify(newHistory));
                } catch (e) {
                    console.error("Failed to save history to localStorage", e);
                }
            }

        } catch (error) {
            console.error("Gemini API error:", error);
            setGeminiEvaluation({
                selamlama: "Değerli dostum,",
                sonuclarinAynasi: "Değerlendirmeniz alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                tefekkurKosesi: "",
                ilahiRehberlik: "",
                pratikAdimlar: "",
                sonraki_test: { key: "", gerekce: "" }
            });
        } finally {
            setIsLoadingGemini(false);
        }
    };

    const handleCalculateResults = (finalAnswers = answers) => {
        if (!currentTest || !currentTestKey) return;
        if (Object.keys(finalAnswers).length !== currentTest.questions.length) {
             setError(`Lütfen tüm soruları yanıtlayın.`);
             const firstUnanswered = currentTest.questions.findIndex((_, index) => finalAnswers[index] === undefined);
             if (firstUnanswered !== -1) setCurrentQuestionIndex(firstUnanswered);
             return;
        }

        let scores = { tefrit: 0, fazilet: 0, ifrat: 0 };
        Object.values(finalAnswers).forEach(score => {
             switch (score) {
                case 1: scores.tefrit += 2; break;
                case 2: scores.tefrit += 1; break;
                case 3: scores.fazilet += 2; break;
                case 4: scores.ifrat += 1; break;
                case 5: scores.ifrat += 2; break;
            }
        });
        
        setResultScores(scores);
        setScreen('result');
        window.scrollTo(0, 0);
        fetchGeminiEvaluation(scores, currentTest);
    };

    const handleReset = () => {
        setScreen('start');
        window.scrollTo(0, 0);
    }
    
    const handleShareAsImage = async () => {
        if (!resultCardRef.current) return;
        setIsSharing(true);
        try {
            const canvas = await html2canvas(resultCardRef.current, {
                scale: 2.5, // Increase scale for higher resolution
                backgroundColor: '#1f2937', // gray-800
                useCORS: true,
                logging: true,
                ignoreElements: (element) => element.id === 'gemini-evaluation-section',
            });
            const image = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = `${currentTest?.concepts.fazilet}-sonuc-karti.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Resim oluşturma hatası:", error);
            alert("Sonuç kartı resmi oluşturulurken bir hata oluştu.");
        } finally {
            setIsSharing(false);
        }
    };

    const renderScreen = () => {
        switch (screen) {
            case 'welcome':
                return (
                    <div key="welcome" className="flex flex-col items-center justify-center min-h-[85vh] text-center animate-fade-in">
                        <h1 className="text-5xl md:text-7xl font-bold text-emerald-400 mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Kalbinin Haritası</h1>
                        <h2 className="text-3xl md:text-5xl font-semibold text-gray-200 mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>Ahlak Pusulası</h2>
                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                            İçindeki uçurumlar ve doruklar... 17 farklı testte kalbine ayna tut!
                        </p>
                        <Button onClick={() => setScreen('start')} className="py-4 px-10 text-xl animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                            Hemen Başla
                        </Button>
                    </div>
                );
            case 'start':
                 return (
                    <div key="start" className="animate-fade-in">
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-bold text-emerald-400 mb-3">Ahlak Pusulası</h1>
                            <p className="text-xl text-gray-400">İçindeki uçurumlar ve doruklar... 17 farklı testte kalbine ayna tut!</p>
                        </div>
                         <div className="text-center mb-12">
                            <Button onClick={() => setScreen('history')} className="bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/30">
                                Ahlak Haritamı Görüntüle
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(TESTS).map(([key, test]) => (
                                <div key={key} onClick={() => handleStartTest(key)} className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg text-center p-8 transition-all duration-300 ease-in-out cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/50 relative group">
                                    <div className="card-glow-border" />
                                    <div className="flex justify-center mb-4">{TestIcons[key]}</div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-emerald-400 mb-2">{test.concepts.fazilet}</h2>
                                        <p className="text-gray-400 text-base mb-6 min-h-[48px]">{test.title}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-semibold mt-4">
                                        <span className="text-yellow-500">{test.concepts.tefrit}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 transition-transform group-hover:scale-125" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <span className="text-red-500">{test.concepts.ifrat}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'history':
                const hasHistory = Object.keys(testHistory).length > 0;
                return (
                    <div key="history" className="animate-fade-in">
                         <div className="flex flex-col sm:flex-row justify-between sm:items-center text-center sm:text-left mb-10">
                            <div>
                                <h1 className="text-5xl font-bold text-emerald-400 mb-3">Ahlak Haritam</h1>
                                <p className="text-xl text-gray-400">Tamamladığın testler ve manevi yolculuğunun izleri.</p>
                                <p className="text-sm text-gray-500 mt-2">Sonuçlarınız, bu tarayıcıda güvenle saklanmaktadır.</p>
                            </div>
                        </div>
                        {hasHistory ? (
                            <div className="space-y-4">
                                {Object.entries(testHistory).map(([key, result]) => {
                                    const test = TESTS[key];
                                    if (!test) return null;
                                    const total = result.percentages.tefrit + result.percentages.fazilet + result.percentages.ifrat;
                                    const tefritValue = total > 0 ? Math.round((result.percentages.tefrit / total) * 100) : 0;
                                    const faziletValue = total > 0 ? Math.round((result.percentages.fazilet / total) * 100) : 0;
                                    const ifratValue = total > 0 ? Math.max(0, 100 - tefritValue - faziletValue) : 0;
                                    const isExpanded = expandedHistoryKey === key;
                                    const geminiData = result.geminiData;

                                    return (
                                        <div key={key}>
                                            <Card onClick={() => setExpandedHistoryKey(isExpanded ? null : key)} className={`!p-4 ${isExpanded ? 'rounded-b-none' : ''}`}>
                                                <div className="flex flex-col sm:flex-row items-center justify-between">
                                                    <div className="flex items-center text-center sm:text-left mb-4 sm:mb-0">
                                                        <div className="hidden sm:block mr-4">{TestIcons[key]}</div>
                                                        <div>
                                                            <h2 className="text-2xl font-bold text-emerald-400">{test.concepts.fazilet}</h2>
                                                            <p className="text-gray-400">{test.title}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 font-semibold text-center">
                                                        <div className="w-24"><p className="text-yellow-500 text-sm">{test.concepts.tefrit}</p><p className="text-2xl">{tefritValue}%</p></div>
                                                        <div className="w-24"><p className="text-emerald-500 text-sm">{test.concepts.fazilet}</p><p className="text-2xl">{faziletValue}%</p></div>
                                                        <div className="w-24"><p className="text-red-500 text-sm">{test.concepts.ifrat}</p><p className="text-2xl">{ifratValue}%</p></div>
                                                    </div>
                                                </div>
                                            </Card>
                                            {isExpanded && geminiData && (
                                                <div className="p-6 bg-gray-900/70 rounded-b-lg animate-fade-in border border-t-0 border-gray-700 space-y-4">
                                                    <h3 className="text-xl font-bold text-emerald-300">Sonuçların Aynası</h3><p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{geminiData.sonuclarinAynasi}</p>
                                                    <h3 className="text-xl font-bold text-emerald-300">Tefekkür Köşesi</h3><p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{geminiData.tefekkurKosesi}</p>
                                                    <h3 className="text-xl font-bold text-emerald-300">İlahi Rehberlik ve Pratik Adımlar</h3><p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{geminiData.ilahiRehberlik}{"\n\n"}{geminiData.pratikAdimlar}</p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <Card className="text-center !p-10"><p className="text-gray-400 text-lg">Henüz hiç test tamamlamadın. Manevi yolculuğuna başlamak için bir test seç!</p></Card>
                        )}
                        <div className="text-center mt-10"><Button onClick={() => setScreen('start')}>Test Seçimine Geri Dön</Button></div>
                    </div>
                );
            case 'quiz':
                return currentTest && (
                    <div key="quiz" className="animate-fade-in">
                        <ProgressBar progress={((currentQuestionIndex + 1) / currentTest.questions.length) * 100} />
                        <div className="text-center mb-8"><h1 className="text-4xl font-bold text-emerald-400 mb-2">{currentTest.concepts.fazilet}</h1><p className="text-lg text-gray-400">{currentTest.title}</p><p className="text-md text-gray-500 mt-2">Soru {currentQuestionIndex + 1} / {currentTest.questions.length}</p></div>
                        <div key={currentQuestionIndex} className="animate-fade-in"><QuestionBlock question={currentTest.questions[currentQuestionIndex]} selectedValue={answers[currentQuestionIndex]} onAnswer={handleAnswerChange} hasError={!!error && answers[currentQuestionIndex] === undefined}/></div>
                        {error && <p className="text-red-500 text-center mt-6 font-semibold">{error}</p>}
                        <div className="flex justify-between items-center gap-4 mt-10"><Button onClick={() => handleNavigation('prev')} disabled={currentQuestionIndex === 0} className="bg-gray-700 hover:bg-gray-600">Geri</Button>{currentQuestionIndex < currentTest.questions.length - 1 && (<Button onClick={() => handleNavigation('next')} disabled={answers[currentQuestionIndex] === undefined}>İleri</Button>)}</div>
                        <div className="text-center mt-6"><button onClick={() => setScreen('start')} className="text-gray-400 hover:text-emerald-400 transition-colors">Test Seçimine Geri Dön</button></div>
                    </div>
                );
            case 'result':
                const evaluationContent = geminiEvaluation && [
                    { title: "Sonuçların Bir Aynası", text: geminiEvaluation.sonuclarinAynasi },
                    { title: "Tefekkür Köşesi", text: geminiEvaluation.tefekkurKosesi },
                    { title: "İlahi Rehberlik", text: geminiEvaluation.ilahiRehberlik },
                    { title: "Pratik Adımlar", text: geminiEvaluation.pratikAdimlar },
                ];
                
                return currentTest && resultScores && (
                    <div key="result" className="animate-fade-in">
                        <Card forwardedRef={resultCardRef}>
                             {/* Shareable part */}
                            <div className="text-center pb-6">
                                <p className="font-semibold text-emerald-500 mb-4">Ahlak Pusulası Sonuç Kartı</p>
                                <h1 className="text-4xl font-bold text-emerald-400 mb-2">{currentTest.concepts.fazilet}</h1>
                                <p className="text-lg text-gray-400 mb-6">{currentTest.title}</p>
                                <ResultSummary data={resultScores} concepts={currentTest.concepts} />
                            </div>

                             {/* Non-shareable part */}
                            <div id="gemini-evaluation-section">
                                <hr className="border-gray-700" />
                                <div className="my-8 text-left space-y-6">
                                    <h2 className="text-2xl font-bold text-emerald-400 text-center">Size Özel Değerlendirmeniz</h2>
                                    <div className="p-4 bg-gray-900/50 rounded-lg min-h-[150px]">
                                        {isLoadingGemini && <LoadingSpinner />}
                                        {geminiEvaluation && (
                                            <div className="space-y-4 animate-fade-in">
                                               <p className="text-gray-300 whitespace-pre-wrap leading-relaxed italic">{geminiEvaluation.selamlama}</p>
                                                {evaluationContent?.map((item, index) => (
                                                    <div key={index}>
                                                        <h3 className="font-bold text-emerald-300 block my-3 text-lg">{item.title}</h3>
                                                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{item.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        
                        {geminiEvaluation?.sonraki_test?.key && TESTS[geminiEvaluation.sonraki_test.key] && (
                             <div className="mt-8 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                                <Card className="!p-6">
                                    <h3 className="text-xl font-bold text-emerald-300 mb-3 text-center">Sıradaki Adım</h3>
                                    <p className="text-center text-gray-400 mb-4">{geminiEvaluation.sonraki_test.gerekce}</p>
                                    <div className="flex justify-center">
                                        <Button onClick={() => handleStartTest(geminiEvaluation.sonraki_test.key)} className="bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/30">
                                            {`Başla: ${TESTS[geminiEvaluation.sonraki_test.key].concepts.fazilet} Testi`}
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
                             <Button onClick={handleShareAsImage} disabled={isSharing || isLoadingGemini || !geminiEvaluation} className="bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30 w-full sm:w-auto flex items-center justify-center">
                                {isSharing ? 'Oluşturuluyor...' : <><ShareIcon /> Sonucu Resim Olarak Paylaş</>}
                            </Button>
                            <Button onClick={handleReset} className="bg-gray-700 hover:bg-gray-600 w-full sm:w-auto">Yeni Test Seç</Button>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <main className="container mx-auto max-w-3xl p-4 sm:p-6 md:p-8 py-10">
           {renderScreen()}
        </main>
    );
}