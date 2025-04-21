import React, { useState, useEffect } from 'react';
import './Member.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { DroppableContainer } from './DroppableContainer';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import dayjs from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const initialTasks = {
  todo: [],
  inprogress: [],
  done: [],
};

const Member = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignee: '',
    priority: 'Low',
  });

  const [overdueTasks, setOverdueTasks] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const today = dayjs();
    const allTasks = [...tasks.todo, ...tasks.inprogress, ...tasks.done];
    const overdue = allTasks.filter(task => dayjs(task.dueDate).isBefore(today, 'day'));
    setOverdueTasks(overdue);
  }, [tasks]);

  const handleCreateTask = () => {
    if (newTask.title && newTask.description) {
      const task = { ...newTask, id: `task-${Date.now().toString()}` };
      setTasks(prev => ({
        ...prev,
        todo: [...prev.todo, task],
      }));
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        assignee: '',
        priority: 'Low'
      });
    }
  };

  const findContainer = (id) => {
    if (id in tasks) {
      return id;
    }

    for (const [containerId, containerItems] of Object.entries(tasks)) {
      const item = containerItems.find((item) => item.id === id);
      if (item) {
        return containerId;
      }
    }

    return null;
  };

  const getTaskById = (id) => {
    for (const column of Object.values(tasks)) {
      const task = column.find(item => item.id === id);
      if (task) {
        return task;
      }
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    
    if (
      !activeContainer || 
      !overContainer || 
      activeContainer === overContainer
    ) {
      return;
    }

    setTasks(prev => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      
      const activeIndex = activeItems.findIndex(item => item.id === active.id);
      const overIndex = overItems.length;
      
      return {
        ...prev,
        [activeContainer]: [
          ...prev[activeContainer].filter(item => item.id !== active.id)
        ],
        [overContainer]: [
          ...prev[overContainer],
          prev[activeContainer][activeIndex]
        ]
      };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!active || !over) {
      setActiveId(null);
      return;
    }
    
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    
    if (
      !activeContainer || 
      !overContainer || 
      activeContainer !== overContainer
    ) {
      // This case is handled in handleDragOver
      setActiveId(null);
      return;
    }
    
    const activeIndex = tasks[activeContainer].findIndex(
      task => task.id === active.id
    );
    const overIndex = tasks[overContainer].findIndex(
      task => task.id === over.id
    );
    
    if (activeIndex !== overIndex) {
      setTasks(prev => ({
        ...prev,
        [overContainer]: arrayMove(
          prev[overContainer],
          activeIndex,
          overIndex
        )
      }));
    }
    
    setActiveId(null);
  };

  const priorityCounts = ['Low', 'Medium', 'High'].map(
    level => [...tasks.todo, ...tasks.inprogress, ...tasks.done].filter(task => task.priority === level).length
  );

  const priorityData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [
      {
        data: priorityCounts,
        backgroundColor: ['#4caf50', '#ffeb3b', '#f44336'],
        hoverBackgroundColor: ['#388e3c', '#fbc02d', '#e53935'],
      },
    ],
  };

  const deadlineData = {
    labels: tasks.todo.map(task => task.title),
    datasets: [
      {
        label: 'Days Remaining',
        data: tasks.todo.map(task => dayjs(task.dueDate).diff(dayjs(), 'day')),
        backgroundColor: '#1976d2',
      },
    ],
  };

  return (
    <div className="member-container">
      <header className="member-header">
        <div className="member-name">👤 Member Name</div>
        <div className="member-info">Member | 🧑‍💻</div>
      </header>

      <div className="member-content">
        {/* Create Task Section */}
        <section className="create-task-section">
          <h3>Create Task</h3>
          <input
            type="text"
            placeholder="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          
          <input
            type="date"
            value={newTask.dueDate}
            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
            onChange={(e) =>
              setNewTask({ ...newTask, dueDate: e.target.value })
            }
          />

          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select
            value={newTask.assignee}
            onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
          >
            <option value="assignee1">assignee1</option>
            <option value="assignee2">assignee2</option>
            <option value="assignee3">assignee3</option>
          </select>
          <button onClick={handleCreateTask}>Create Task</button>
        </section>

        {/* Charts Section */}
        <section className="visualization-section">
          <h3>Task Distribution</h3>
          <div className="charts">
            <div className="chart">
              <h4>Priority Distribution</h4>
              <Doughnut data={priorityData} />
            </div>
            <div className="chart">
              <h4>Task Deadlines</h4>
              <Bar data={deadlineData} />
            </div>
          </div>
        </section>

        {/* Kanban Section */}
        <section className="kanban-section">
          <h3>Kanban Board</h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="kanban-columns">
              {Object.keys(tasks).map((columnId) => (
                <DroppableContainer
                  key={columnId}
                  id={columnId}
                  title={columnId.toUpperCase()}
                >
                  <SortableContext
                    items={tasks[columnId].map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasks[columnId].map(task => (
                      <SortableItem
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        description={task.description}
                        dueDate={task.dueDate}
                        priority={task.priority}
                      />
                    ))}
                  </SortableContext>
                </DroppableContainer>
              ))}
              <DragOverlay>
                {activeId ? (
                  <div className="task-card">
                    <h5>{getTaskById(activeId)?.title}</h5>
                    <p>{getTaskById(activeId)?.description}</p>
                    <p>📅 {getTaskById(activeId)?.dueDate}</p>
                    <p>🔥 {getTaskById(activeId)?.priority}</p>
                    <button>Edit</button>
                  </div>
                ) : null}
              </DragOverlay>
            </div>
          </DndContext>
        </section>

        {/* Overdue Section */}
        <section className="overdue-section">
          <h3>⚠️ Overdue Tasks</h3>
          {overdueTasks.length > 0 ? (
            <ul>
              {overdueTasks.map(task => (
                <li key={task.id}>
                  {task.title} (Due: {task.dueDate})
                </li>
              ))}
            </ul>
          ) : (
            <p>No overdue tasks! 🎉</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Member;