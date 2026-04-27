import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Check, X, ListChecks } from 'lucide-react';

const parseTasks = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.tasks) ? parsed.tasks : [];
  } catch {
    return [];
  }
};

export default function TaskChecklistWidget({ widget }) {
  const [tasks, setTasks] = useState(() => parseTasks(widget?.data));
  const [newTask, setNewTask] = useState('');
  const saveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(parseTasks(widget?.data)));

  // Sync down when widget changes externally
  useEffect(() => {
    const incoming = parseTasks(widget?.data);
    const incomingStr = JSON.stringify(incoming);
    if (incomingStr !== JSON.stringify(tasks) && incomingStr !== lastSavedRef.current) {
      setTasks(incoming);
      lastSavedRef.current = incomingStr;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget?.data]);

  // Debounced save up
  const persist = (next) => {
    setTasks(next);
    if (!widget?.id) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const payload = JSON.stringify({ tasks: next });
      lastSavedRef.current = payload;
      await base44.entities.UserWidget.update(widget.id, { data: payload });
    }, 350);
  };

  const handleAdd = (e) => {
    e?.preventDefault();
    const text = newTask.trim();
    if (!text) return;
    persist([...tasks, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, done: false }]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    persist(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    persist(tasks.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    persist(tasks.filter(t => !t.done));
  };

  const remaining = useMemo(() => tasks.filter(t => !t.done).length, [tasks]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/60 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ListChecks className="w-4 h-4 text-[#f1889b] flex-shrink-0" />
          <h3 className="font-semibold text-gray-800 text-sm tracking-tight truncate">My Checklist</h3>
          <span className="text-[10px] font-medium text-gray-500 bg-white/70 rounded-full px-2 py-0.5 flex-shrink-0">
            {remaining} left
          </span>
        </div>
        {tasks.some(t => t.done) && (
          <button
            onClick={clearCompleted}
            className="text-[10px] text-gray-500 hover:text-[#f1889b] font-medium transition-colors"
            title="Clear completed"
          >
            Clear done
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
        {tasks.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-600 font-medium">No tasks yet</p>
            <p className="text-xs text-gray-400 mt-1">Add one below to get started</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/60 transition-colors"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-colors ${
                    task.done
                      ? 'bg-[#f1889b] border-[#f1889b]'
                      : 'bg-white/70 border-gray-300 hover:border-[#f1889b]'
                  }`}
                  aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {task.done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
                <span
                  onClick={() => toggleTask(task.id)}
                  className={`flex-1 text-sm cursor-pointer select-none ${
                    task.done ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all flex-shrink-0"
                  aria-label="Delete task"
                >
                  <X className="w-3.5 h-3.5 text-red-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="flex items-center gap-2 px-3 py-2 border-t border-white/60 bg-white/40 flex-shrink-0"
      >
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 bg-transparent text-sm placeholder:text-gray-400 text-gray-800 outline-none"
        />
        <button
          type="submit"
          disabled={!newTask.trim()}
          className="w-7 h-7 rounded-md bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] text-white flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
          aria-label="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}