import { useState, useEffect } from 'react';
import { Dumbbell, Plus, Flame, TrendingUp, Check, X, ChevronDown, Trash2 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: { reps: number; weight: number; completed: boolean }[];
}

interface WorkoutDay {
  date: string;
  exercises: Exercise[];
  completed: boolean;
}

const EXERCISE_OPTIONS = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Pull-ups', 'Dips', 'Lunges', 'Leg Press', 'Lat Pulldown',
  'Bicep Curls', 'Tricep Extension', 'Shoulder Lateral Raise', 'Calf Raises'
];

function App() {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutDay[]>(() => {
    const saved = localStorage.getItem('discipline-workouts');
    return saved ? JSON.parse(saved) : [];
  });

  const [todayWorkout, setTodayWorkout] = useState<Exercise[]>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('discipline-workouts');
    if (saved) {
      const history: WorkoutDay[] = JSON.parse(saved);
      const todayEntry = history.find(w => w.date === today);
      return todayEntry ? todayEntry.exercises : [];
    }
    return [];
  });

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [setsCount, setSetsCount] = useState(3);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    localStorage.setItem('discipline-workouts', JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  useEffect(() => {
    const updatedHistory = [...workoutHistory];
    const todayIndex = updatedHistory.findIndex(w => w.date === today);
    const allCompleted = todayWorkout.length > 0 &&
      todayWorkout.every(ex => ex.sets.every(s => s.completed));

    if (todayIndex >= 0) {
      updatedHistory[todayIndex] = {
        date: today,
        exercises: todayWorkout,
        completed: allCompleted
      };
    } else if (todayWorkout.length > 0) {
      updatedHistory.push({
        date: today,
        exercises: todayWorkout,
        completed: allCompleted
      });
    }

    setWorkoutHistory(updatedHistory);
  }, [todayWorkout]);

  const calculateStreak = () => {
    const sortedDays = [...workoutHistory]
      .filter(w => w.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedDays.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check if today or yesterday has a workout (to allow for "still counting" today)
    const todayStr = currentDate.toISOString().split('T')[0];
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const hasTodayWorkout = sortedDays.some(w => w.date === todayStr);
    const hasYesterdayWorkout = sortedDays.some(w => w.date === yesterdayStr);

    if (!hasTodayWorkout && !hasYesterdayWorkout) return 0;

    // Start counting from the most recent workout day
    let checkDate = hasTodayWorkout ? currentDate : yesterday;

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sortedDays.some(w => w.date === dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const addExercise = () => {
    if (!selectedExercise) return;

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: selectedExercise,
      sets: Array(setsCount).fill(null).map(() => ({ reps: 0, weight: 0, completed: false }))
    };

    setTodayWorkout([...todayWorkout, newExercise]);
    setShowAddExercise(false);
    setSelectedExercise('');
    setSetsCount(3);
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setTodayWorkout(todayWorkout.map(ex => {
      if (ex.id === exerciseId) {
        const newSets = [...ex.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        return { ...ex, sets: newSets };
      }
      return ex;
    }));
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    setTodayWorkout(todayWorkout.map(ex => {
      if (ex.id === exerciseId) {
        const newSets = [...ex.sets];
        newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };
        return { ...ex, sets: newSets };
      }
      return ex;
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setTodayWorkout(todayWorkout.filter(ex => ex.id !== exerciseId));
  };

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekWorkouts = workoutHistory.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= oneWeekAgo && w.completed;
    });

    const totalSets = weekWorkouts.reduce((acc, w) =>
      acc + w.exercises.reduce((a, ex) => a + ex.sets.filter(s => s.completed).length, 0), 0);

    const totalVolume = weekWorkouts.reduce((acc, w) =>
      acc + w.exercises.reduce((a, ex) =>
        a + ex.sets.filter(s => s.completed).reduce((v, s) => v + (s.reps * s.weight), 0), 0), 0);

    return { workouts: weekWorkouts.length, totalSets, totalVolume };
  };

  const streak = calculateStreak();
  const weeklyStats = getWeeklyStats();
  const completedSetsToday = todayWorkout.reduce((acc, ex) =>
    acc + ex.sets.filter(s => s.completed).length, 0);
  const totalSetsToday = todayWorkout.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] relative overflow-x-hidden">
      {/* Grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="border-b border-[#222] px-4 md:px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#ff4d00] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl tracking-wider uppercase">Discipline</h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-[#666] uppercase tracking-widest">Today</p>
            <p className="font-mono text-sm md:text-base text-[#999]">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-24">
        {/* Streak Hero */}
        <section className="mb-8 md:mb-12 relative">
          <div className="border border-[#222] bg-[#0f0f0f] p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-[#ff4d00] opacity-5 blur-3xl" />
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-[#666] uppercase tracking-[0.3em] mb-2">Current Streak</p>
                <div className="flex items-baseline gap-3 md:gap-4">
                  <span className="font-display text-7xl md:text-9xl leading-none text-[#ff4d00]">{streak}</span>
                  <span className="font-mono text-lg md:text-xl text-[#666] uppercase">Days</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#ff4d00]">
                <Flame className="w-5 h-5 md:w-6 md:h-6" />
                <span className="font-mono text-sm uppercase tracking-wide">
                  {streak === 0 ? 'Start Today' : streak >= 7 ? 'On Fire' : 'Building'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12">
          <div className="border border-[#222] bg-[#0f0f0f] p-4 md:p-6">
            <p className="font-mono text-[10px] md:text-xs text-[#666] uppercase tracking-widest mb-1 md:mb-2">This Week</p>
            <p className="font-display text-2xl md:text-4xl text-[#e8e8e8]">{weeklyStats.workouts}</p>
            <p className="font-mono text-[10px] md:text-xs text-[#666]">WORKOUTS</p>
          </div>
          <div className="border border-[#222] bg-[#0f0f0f] p-4 md:p-6">
            <p className="font-mono text-[10px] md:text-xs text-[#666] uppercase tracking-widest mb-1 md:mb-2">Total Sets</p>
            <p className="font-display text-2xl md:text-4xl text-[#e8e8e8]">{weeklyStats.totalSets}</p>
            <p className="font-mono text-[10px] md:text-xs text-[#666]">COMPLETED</p>
          </div>
          <div className="border border-[#222] bg-[#0f0f0f] p-4 md:p-6">
            <p className="font-mono text-[10px] md:text-xs text-[#666] uppercase tracking-widest mb-1 md:mb-2">Volume</p>
            <p className="font-display text-2xl md:text-4xl text-[#e8e8e8]">{(weeklyStats.totalVolume / 1000).toFixed(1)}k</p>
            <p className="font-mono text-[10px] md:text-xs text-[#666]">LBS LIFTED</p>
          </div>
        </section>

        {/* Today's Workout */}
        <section className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-4 md:mb-6 border-b border-[#222] pb-3 md:pb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#ff4d00]" />
              <h2 className="font-display text-lg md:text-xl uppercase tracking-wider">Today's Session</h2>
            </div>
            {totalSetsToday > 0 && (
              <span className="font-mono text-xs md:text-sm text-[#666]">
                {completedSetsToday}/{totalSetsToday} sets
              </span>
            )}
          </div>

          {todayWorkout.length === 0 ? (
            <div className="border border-dashed border-[#333] p-8 md:p-12 text-center">
              <p className="font-mono text-sm text-[#666] mb-4">No exercises logged today</p>
              <button
                onClick={() => setShowAddExercise(true)}
                className="inline-flex items-center gap-2 bg-[#ff4d00] text-black px-5 md:px-6 py-3 font-mono text-sm uppercase tracking-wider hover:bg-[#ff6a2a] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Exercise
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {todayWorkout.map((exercise) => (
                <div key={exercise.id} className="border border-[#222] bg-[#0f0f0f]">
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#222]">
                    <h3 className="font-display text-base md:text-lg uppercase tracking-wide">{exercise.name}</h3>
                    <button
                      onClick={() => removeExercise(exercise.id)}
                      className="p-2 text-[#666] hover:text-[#ff4d00] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 md:p-4">
                    <div className="grid grid-cols-4 gap-2 md:gap-3 mb-2 md:mb-3 font-mono text-[10px] md:text-xs text-[#666] uppercase tracking-wider">
                      <span>Set</span>
                      <span>Weight</span>
                      <span>Reps</span>
                      <span className="text-right">Done</span>
                    </div>
                    {exercise.sets.map((set, idx) => (
                      <div key={idx} className={`grid grid-cols-4 gap-2 md:gap-3 items-center py-2 md:py-3 border-t border-[#1a1a1a] ${set.completed ? 'opacity-50' : ''}`}>
                        <span className="font-mono text-sm md:text-base text-[#666]">{idx + 1}</span>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.weight || ''}
                            onChange={(e) => updateSet(exercise.id, idx, 'weight', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#1a1a1a] border border-[#333] px-2 md:px-3 py-2 font-mono text-sm md:text-base text-center focus:border-[#ff4d00] focus:outline-none transition-colors"
                            placeholder="0"
                          />
                          <span className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#666]">lb</span>
                        </div>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps || ''}
                          onChange={(e) => updateSet(exercise.id, idx, 'reps', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#1a1a1a] border border-[#333] px-2 md:px-3 py-2 font-mono text-sm md:text-base text-center focus:border-[#ff4d00] focus:outline-none transition-colors"
                          placeholder="0"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => toggleSetComplete(exercise.id, idx)}
                            className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center border transition-all ${
                              set.completed
                                ? 'bg-[#ff4d00] border-[#ff4d00] text-black'
                                : 'border-[#333] text-[#666] hover:border-[#ff4d00] hover:text-[#ff4d00]'
                            }`}
                          >
                            {set.completed ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <X className="w-4 h-4 md:w-5 md:h-5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowAddExercise(true)}
                className="w-full border border-dashed border-[#333] p-4 font-mono text-sm text-[#666] uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Exercise
              </button>
            </div>
          )}
        </section>

        {/* Add Exercise Modal */}
        {showAddExercise && (
          <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-40 p-4">
            <div className="bg-[#0f0f0f] border border-[#222] w-full max-w-md animate-slide-up">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
                <h3 className="font-display text-xl uppercase tracking-wider">Add Exercise</h3>
                <button
                  onClick={() => setShowAddExercise(false)}
                  className="p-2 text-[#666] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block font-mono text-xs text-[#666] uppercase tracking-widest mb-2">Exercise</label>
                  <div className="relative">
                    <select
                      value={selectedExercise}
                      onChange={(e) => setSelectedExercise(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 font-mono text-base appearance-none focus:border-[#ff4d00] focus:outline-none transition-colors"
                    >
                      <option value="">Select exercise...</option>
                      {EXERCISE_OPTIONS.map(ex => (
                        <option key={ex} value={ex}>{ex}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-xs text-[#666] uppercase tracking-widest mb-2">Number of Sets</label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => setSetsCount(num)}
                        className={`flex-1 py-3 font-mono text-base border transition-colors ${
                          setsCount === num
                            ? 'bg-[#ff4d00] border-[#ff4d00] text-black'
                            : 'border-[#333] text-[#666] hover:border-[#ff4d00]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={addExercise}
                  disabled={!selectedExercise}
                  className="w-full bg-[#ff4d00] text-black py-4 font-mono text-sm uppercase tracking-wider hover:bg-[#ff6a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Workout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] py-3 md:py-4 px-4 z-30">
        <p className="text-center font-mono text-[10px] md:text-xs text-[#444] tracking-wide">
          Requested by <a href="https://twitter.com/realcyprian" target="_blank" rel="noopener noreferrer" className="hover:text-[#666] transition-colors">@realcyprian</a> · Built by <a href="https://twitter.com/clonkbot" target="_blank" rel="noopener noreferrer" className="hover:text-[#666] transition-colors">@clonkbot</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
