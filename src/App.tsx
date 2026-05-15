import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Zap, RotateCcw, AlertTriangle, History, Trophy } from 'lucide-react';

/**
 * 遊戲狀態型別定義
 */
type GameState = 'idle' | 'waiting' | 'ready' | 'result' | 'tooEarly';

interface HistoryRecord {
  time: number;
}

export default function App() {
  // 遊戲狀態機
  const [gameState, setGameState] = useState<GameState>('idle');
  // 當次反應時間 (ms)
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  // 歷史紀錄
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  
  // 使用 useRef 儲存計時器與時間戳，避免觸發不必要的重新渲染
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 最佳成績紀錄
  const bestScore = history.length > 0 ? Math.min(...history.map(h => h.time)) : null;

  /**
   * 開始等待狀態
   */
  const startWaiting = useCallback(() => {
    setGameState('waiting');
    setReactionTime(null);
    
    // 隨機等待 1-5 秒
    const delay = Math.floor(Math.random() * 4000) + 1000;
    
    timerRef.current = setTimeout(() => {
      setGameState('ready');
      startTimeRef.current = performance.now();
    }, delay);
  }, []);

  /**
   * 處理互動（點擊或按鍵）
   */
  const handleInteraction = useCallback(() => {
    if (gameState === 'idle' || gameState === 'result' || gameState === 'tooEarly') {
      startWaiting();
    } else if (gameState === 'waiting') {
      // 太早按了
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setGameState('tooEarly');
    } else if (gameState === 'ready') {
      // 成功得分
      const endTime = performance.now();
      const timeElapsed = Math.round(endTime - startTimeRef.current);
      setReactionTime(timeElapsed);
      setGameState('result');
      
      // 更新歷史紀錄
      setHistory(prev => [{ time: timeElapsed }, ...prev].slice(0, 5));
    }
  }, [gameState, startWaiting]);

  // 監聽鍵盤事件（空白鍵）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleInteraction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInteraction]);

  // 清除計時器以防組件卸載時發生遺漏
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /**
   * 根據狀態回傳對應的背景顏色
   */
  const getBgColor = () => {
    switch (gameState) {
      case 'idle': return 'bg-zinc-100';
      case 'waiting': return 'bg-blue-500';
      case 'ready': return 'bg-emerald-500';
      case 'result': return 'bg-zinc-100';
      case 'tooEarly': return 'bg-rose-500';
      default: return 'bg-zinc-100';
    }
  };

  /**
   * 根據狀態回傳提示文字
   */
  const getPrompt = () => {
    switch (gameState) {
      case 'idle': return { title: '反應力測試', sub: '點擊螢幕或按下空白鍵開始' };
      case 'waiting': return { title: '準備...', sub: '看到綠色時立即點擊！' };
      case 'ready': return { title: '現在！', sub: '快按！' };
      case 'result': return { title: `${reactionTime} ms`, sub: '不錯的反應，點擊重試' };
      case 'tooEarly': return { title: '太快了！', sub: '請等綠色出現再按。點擊重試' };
    }
  };

  const prompt = getPrompt();

  return (
    <div className={`min-h-screen transition-colors duration-200 select-none ${getBgColor()} flex flex-col items-center justify-center font-sans overflow-hidden`}>
      
      {/* 互動主區域 */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
        onClick={handleInteraction}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={gameState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="text-center px-4"
          >
            {gameState === 'idle' && (
              <Zap className="w-20 h-20 mx-auto mb-6 text-zinc-900" />
            )}
            {gameState === 'waiting' && (
              <Timer className="w-20 h-20 mx-auto mb-6 text-white animate-pulse" />
            )}
            {gameState === 'ready' && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.2, repeat: Infinity }}
              >
                <Zap className="w-24 h-24 mx-auto mb-6 text-white fill-current" />
              </motion.div>
            )}
            {gameState === 'tooEarly' && (
              <AlertTriangle className="w-20 h-20 mx-auto mb-6 text-white" />
            )}
            {gameState === 'result' && (
              <div>
                <p className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-2">你的反應時間</p>
                <h1 className="text-7xl font-black text-zinc-900 tracking-tighter mb-6">{reactionTime} <span className="text-2xl">ms</span></h1>
                <div className="flex items-center justify-center gap-2 text-zinc-600 bg-zinc-200/50 py-2 px-4 rounded-full inline-flex">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm font-medium">點擊任何地方重試</span>
                </div>
              </div>
            )}

            {gameState !== 'result' && (
              <div>
                <h1 className={`text-5xl font-black tracking-tighter mb-4 ${gameState === 'idle' ? 'text-zinc-900' : 'text-white'}`}>
                  {prompt.title}
                </h1>
                <p className={`text-lg font-medium opacity-80 ${gameState === 'idle' ? 'text-zinc-600' : 'text-white'}`}>
                  {prompt.sub}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部數據與統計 (僅在 idle 或 result 時顯示較清楚) */}
      <AnimatePresence>
        {(gameState === 'idle' || gameState === 'result') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-12 w-full max-w-md px-6 grid grid-cols-2 gap-6 pointer-events-none"
          >
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">最佳成績</span>
              </div>
              <div className="text-xl font-bold text-zinc-900">
                {bestScore ? `${bestScore} ms` : '--'}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <History className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">最近紀錄</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {history.length > 0 ? (
                   history.slice(0, 3).map((h, i) => (
                    <span key={i} className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500">
                      {h.time}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-300 italic">暫無紀錄</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快捷鍵提示 */}
      <div className="absolute top-6 left-6 hidden md:block">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border border-zinc-300 bg-white/50 px-2 py-1 rounded">
          SPACE TO START / CLICK
        </span>
      </div>
    </div>
  );
}

