import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Send, Sparkles, ChevronDown, Loader2 } from 'lucide-react';

const bloggersData = [
  {
    id: 1,
    name: 'Макс',
    niche: 'Спорт / Біохакінг',
    shortBio: 'Експерт з фітнесу, біохакінгу та здорового способу життя. Динамічний та енергійний.',
    imageSrc: '/assets/b1.png',
    idleVideoSrc: '/assets/max_idle.mp4',
    color: 'from-orange-500 to-red-500',
    greeting: 'Привіт! Я Макс, готовий відповісти на твої запитання про біохакінг.'
  },
  {
    id: 2,
    name: 'Лео',
    niche: 'Крипта / Бізнес',
    shortBio: 'Інвестор, аналітик та візіонер. Розповідає про технології майбутнього та Web3.',
    imageSrc: '/assets/b2.png',
    color: 'from-blue-500 to-cyan-500',
    greeting: 'Вітаю! Я Лео. Запитуй мене про тренди у Web3 та інвестиції.'
  },
  {
    id: 3,
    name: 'Єва',
    niche: 'Fashion / Beauty',
    shortBio: 'Цифрова модель та інфлюенсер. Задає тренди у світі кібер-моди та стилю.',
    imageSrc: '/assets/b3.png',
    color: 'from-pink-500 to-purple-500',
    greeting: 'Привіт, я Єва. Що тебе цікавить у світі кібер-моди?'
  },
  {
    id: 4,
    name: 'Міа',
    niche: 'Подорожі / Tech',
    shortBio: 'Digital Nomad, яка подорожує світом і знімає неймовірні кінематографічні влоги.',
    imageSrc: '/assets/b4.png',
    color: 'from-emerald-400 to-teal-500',
    greeting: 'Привіт звідусіль! Я Міа. Запитуй мене про цифрові подорожі.'
  }
];

const BloggerCard = ({ blogger, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden cursor-pointer group hover:border-slate-700 transition-colors flex flex-col h-full"
      onClick={() => onClick(blogger)}
    >
      <div className="relative h-72 w-full overflow-hidden shrink-0">
        <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10`} />
        <div className={`absolute inset-0 bg-gradient-to-br ${blogger.color} opacity-20`} />
        <img 
          src={blogger.imageSrc} 
          alt={blogger.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div className="absolute bottom-4 left-4 z-20">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${blogger.color} text-white shadow-lg`}>
            {blogger.niche}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          {blogger.name}
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </h3>
        <p className="text-slate-400 text-sm mb-6 flex-1">
          {blogger.shortBio}
        </p>
        <button className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center gap-2 font-medium transition-colors mt-auto">
          <Play className="w-4 h-4" />
          Почати діалог
        </button>
      </div>
    </motion.div>
  );
};

const maxSystemPrompt = "Ти Макс — успішний 30-річний крипто-інвестор, бізнес-аналітик та фітнес-ентузіаст. Спілкуйся виключно українською мовою. Відповідай коротко (1-2 речення), харизматично, впевнено та сучасно. Використовуй сленг підприємців (наприклад: 'профіт', 'тренд', 'інсайд', 'портфель'). Ніколи не кажи, що ти штучний інтелект.";

const InteractiveModal = ({ blogger, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Optimistic UI update
    const updatedMessages = [...messages, { role: 'user', text: userMessage }];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const apiMessages = [
        { role: "system", content: maxSystemPrompt },
        { role: "user", content: "Привіт!" },
        { role: "assistant", content: "Салют! Ринок сьогодні просто летить у космос. Які альткоїни тримаєш у портфелі?" },
        ...messages.map(m => ({ 
          role: m.role === 'max' ? 'assistant' : 'user', 
          content: m.text 
        })),
        { role: "user", content: userMessage }
      ];

      const res = await fetch("/api/llm/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5-coder-3b-stm32",
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 150
        })
      });
      if (!res.ok) throw new Error("API responded with an error: " + res.statusText);
      const data = await res.json();
      
      let aiText = data.choices[0].message.content;
      
      // Fix for JSON bug
      if (aiText && aiText.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(aiText);
          if (parsed.name) {
            aiText = "Вітаю! Якраз аналізую графіки. Що цікавить?";
          } else if (parsed.response) {
            aiText = parsed.response;
          }
        } catch (e) {}
      }

      setMessages(prev => [...prev, { role: 'max', text: aiText }]);
    } catch (error) {
      console.error("LLM Fetch Error:", error);
      setMessages(prev => [...prev, { role: 'max', text: "Ого, ринок зараз штормить, сервери перевантажені. Напиши трохи згодом!" }]);
    } finally {
      setIsTyping(false);
      setIsTalking(true);
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(err => console.error("Video play error:", err));
      }
    }
  };

  const handleVideoEnded = () => {
    setIsTalking(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full sm:h-[90vh] sm:max-w-md bg-black sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col sm:border border-slate-800"
      >
        {/* Header Actions Overlay */}
        <div className="absolute top-0 left-0 right-0 z-30 p-6 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={blogger.imageSrc} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
            </div>
            <div>
              <h3 className="text-white font-bold text-shadow-sm shadow-black drop-shadow-md">{blogger.name}</h3>
              <p className="text-white/80 text-xs font-medium flex items-center gap-1 drop-shadow-md">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                Наживо
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Video Feed Area (70%) */}
        <div className="relative h-[70%] w-full bg-slate-900 shrink-0">
          {blogger.id === 1 ? (
            isTalking ? (
              <video 
                ref={videoRef}
                src="/assets/max_talking.mp4"
                autoPlay 
                playsInline
                onEnded={handleVideoEnded}
                onError={handleVideoEnded}
                className="w-full h-full object-cover" 
              />
            ) : (
              <video 
                src={blogger.idleVideoSrc} 
                autoPlay 
                loop
                muted
                playsInline
                className="w-full h-full object-cover" 
              />
            )
          ) : (
            // Static offline state for others
            <img 
              src={blogger.imageSrc} 
              alt={blogger.name} 
              className="w-full h-full object-cover grayscale opacity-80" 
            />
          )}
          
          {/* Gradient overlay to blend with chat */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Chat Interface Area (30%) */}
        <div className="relative flex-1 flex flex-col bg-black z-20">
          
          {blogger.id === 1 ? (
            <>
              {/* Messages History */}
              <div className="absolute bottom-[80px] left-0 right-0 max-h-[250px] overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3 mask-image-b">
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
                  >
                    <div className={`px-4 py-2.5 rounded-2xl backdrop-blur-md text-sm leading-relaxed shadow-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-600/90 text-white rounded-br-sm' 
                        : 'bg-white/10 text-white rounded-bl-sm border border-white/5'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="self-start px-4 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl rounded-bl-sm text-sm text-white/70 flex items-center gap-2 shadow-lg border border-white/5"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Макс друкує...</span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Написати коментар..."
                    disabled={isTyping}
                    className="w-full bg-white/10 backdrop-blur-xl border border-white/10 text-white placeholder:text-white/50 rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-full transition-colors"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-30">
              <h3 className="text-2xl font-bold text-white mb-2">Блогер офлайн</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                Зараз {blogger.name} не на зв'язку. Перейдіть у Telegram, щоб не пропустити наступний стрім!
              </p>
              <a 
                href="#" 
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                onClick={(e) => e.preventDefault()}
              >
                Перейти в Telegram
              </a>
            </div>
          )}
          
        </div>
      </motion.div>
    </motion.div>
  );
};

function App() {
  const [selectedBlogger, setSelectedBlogger] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 flex flex-col">
      {/* Navbar */}
      <nav className="w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-white">AI<span className="text-blue-500">.Connect</span></span>
          </div>
          <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Увійти
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-20 pb-12 px-6 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Твій персональний <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              AI-блогер
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Живе спілкування з віртуальними інфлюенсерами. Напиши повідомлення та отримай персоналізовану відео-відповідь!
          </p>
        </motion.div>
      </header>

      {/* Grid Section */}
      <main className="max-w-6xl mx-auto px-6 pb-20 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bloggersData.map((blogger, index) => (
            <motion.div
              key={blogger.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <BloggerCard 
                blogger={blogger} 
                onClick={setSelectedBlogger} 
              />
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center shrink-0">
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} AI.Connect Showcase. Developed by <span className="font-semibold text-blue-400">Hopeok code studio</span>. Усі права захищено.
        </p>
      </footer>

      {/* Modal */}
      <AnimatePresence>
        {selectedBlogger && (
          <InteractiveModal 
            blogger={selectedBlogger} 
            onClose={() => setSelectedBlogger(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
