// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css'; // Import the updated CSS file
import { auth, firestore } from './firebaseConfig'; // Import Firebase services

function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState('');

  // Authentication state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchTodos(currentUser.uid);
      } else {
        setUser(null);
        setTodos([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch todos from Firestore
  const fetchTodos = (userId) => {
    firestore
      .collection('todos')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .onSnapshot((snapshot) => {
        const todosData = [];
        snapshot.forEach((doc) => {
          todosData.push({ id: doc.id, ...doc.data() });
        });
        setTodos(todosData);
      });
  };

  // Handle sign in
  const handleSignIn = (e) => {
    e.preventDefault();
    auth
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        setEmail('');
        setPassword('');
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  // Handle sign out
  const handleSignOut = () => {
    auth.signOut().catch((error) => {
      alert(error.message);
    });
  };

  // Add a new todo
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (newTodoTitle.trim() === '') return;
    firestore
      .collection('todos')
      .add({
        title: newTodoTitle,
        user_id: user.uid,
        created_at: new Date(),
      })
      .then(() => {
        setNewTodoTitle('');
      })
      .catch((error) => {
        console.error('Error adding todo:', error.message);
      });
  };

  // Edit a todo
  const handleEditTodo = (id, title) => {
    setEditingTodoId(id);
    setEditingTodoTitle(title);
  };

  // Update a todo
  const handleUpdateTodo = (e) => {
    e.preventDefault();
    if (editingTodoTitle.trim() === '') return;
    firestore
      .collection('todos')
      .doc(editingTodoId)
      .update({ title: editingTodoTitle })
      .then(() => {
        setEditingTodoId(null);
        setEditingTodoTitle('');
      })
      .catch((error) => {
        console.error('Error updating todo:', error.message);
      });
  };

  // Delete a todo
  const handleDeleteTodo = (id) => {
    firestore
      .collection('todos')
      .doc(id)
      .delete()
      .catch((error) => {
        console.error('Error deleting todo:', error.message);
      });
  };

  return (
    <div className="app-container">
      <h1>📝 Vultr's To do app</h1>
      {user ? (
        <div>
          <div className="header">
            <p>Welcome, {user.email}</p>
            <button className="sign-out-button" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>

          <form onSubmit={handleAddTodo} className="todo-form">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>

          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id}>
                {editingTodoId === todo.id ? (
                  <form onSubmit={handleUpdateTodo} className="edit-form">
                    <input
                      type="text"
                      value={editingTodoTitle}
                      onChange={(e) => setEditingTodoTitle(e.target.value)}
                    />
                    <button type="submit">Save</button>
                    <button
                      type="button"
                      onClick={() => setEditingTodoId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="todo-item">
                    <span>{todo.title}</span>
                    <div className="todo-actions">
                      <button
                        onClick={() => handleEditTodo(todo.id, todo.title)}
                      >
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteTodo(todo.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="auth-container">
          <form onSubmit={handleSignIn} className="auth-form">
            <h2>Sign In</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Sign In</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
