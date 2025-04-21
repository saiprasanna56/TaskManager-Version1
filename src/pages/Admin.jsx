import React, { useState } from 'react';
import './Admin.css';
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

// Define column IDs as constants to avoid any typos
const COLUMN_TODO = 'todo';
const COLUMN_IN_PROGRESS = 'inprogress';
const COLUMN_DONE = 'done';

const initialTasks = {
  [COLUMN_TODO]: [],
  [COLUMN_IN_PROGRESS]: [],
  [COLUMN_DONE]: [],
};

const Admin = () => {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignee: '',
    priority: 'Low',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddMember = () => {
    if (name.trim()) {
      setMembers([...members, name]);
      setName('');
    }
  };

  const handleDeleteMember = (index) => {
    const updated = [...members];
    updated.splice(index, 1);
    setMembers(updated);
  };

  const handleCreateTask = () => {
    if (newTask.title && newTask.description) {
      // Ensure task ID is truly unique with a prefix
      const task = { ...newTask, id: `task-${Date.now().toString()}` };
      setTasks((prev) => ({
        ...prev,
        [COLUMN_TODO]: [...prev[COLUMN_TODO], task],
      }));
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        assignee: '',
        priority: 'Low',
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

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="team-name">🚀 Project Phoenix</div>
        <div className="admin-info">Admin | 🧑‍💼</div>
      </header>

      <div className="admin-content">
        <section className="members-section">
          <h3>Manage Members</h3>
          <input
            type="text"
            value={name}
            placeholder="Member name"
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={handleAddMember}>Add</button>
          <ul>
            {members.map((member, idx) => (
              <li key={idx}>
                {member}{' '}
                <button onClick={() => handleDeleteMember(idx)}>Delete</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="create-task-section">
          <h3>Create Task</h3>
          <input
            type="text"
            placeholder="Title"
            value={newTask.title}
            onChange={(e) =>
              setNewTask({ ...newTask, title: e.target.value })
            }
          />
          <textarea
            placeholder="Description"
            value={newTask.description}
            onChange={(e) =>
              setNewTask({ ...newTask, description: e.target.value })
            }
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
            onChange={(e) =>
              setNewTask({ ...newTask, priority: e.target.value })
            }
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select
            value={newTask.assignee}
            onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
          >
            <option value="">Select Assignee</option>
            {members.map((member, idx) => (
              <option key={idx} value={member}>{member}</option>
            ))}
          </select>
          
          <button onClick={handleCreateTask}>Create Task</button>
        </section>
        
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
                  title={
                    columnId === COLUMN_TODO 
                      ? 'TODO' 
                      : columnId === COLUMN_IN_PROGRESS 
                        ? 'IN PROGRESS' 
                        : 'DONE'
                  }
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
      </div>
    </div>
  );
};

export default Admin;