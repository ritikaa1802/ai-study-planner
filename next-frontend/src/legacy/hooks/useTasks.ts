import { useState } from "react";
import { Task } from "../types";

const INITIAL_TASKS: Task[] = [
  { id: 1, text: "Complete Calculus Assignment", done: false },
  { id: 2, text: "Review Chemistry Notes", done: true },
  { id: 3, text: "Read History Chapter 5", done: false },
  { id: 4, text: "Practice Python Coding", done: false },
  { id: 5, text: "Prepare Physics Lab Report", done: false },
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const toggleTask = (id: number) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const addTask = (text: string) => {
    setTasks((ts) => [...ts, { id: Date.now(), text, done: false }]);
  };

  const done = tasks.filter((t) => t.done).length;
  const completionRate = tasks.length ? done / tasks.length : 0;

  return { tasks, toggleTask, addTask, done, completionRate };
}
