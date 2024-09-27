import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, firestore } from './firebaseConfig';
import FileUpload from './FileUpload';

function App() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [todos, setTodos] = useState([]);
    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [editingTodoId, setEditingTodoId] = useState(null);
    const [editingTodoTitle, setEditingTodoTitle] = useState('');

    // Listen for authentication state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
                fetchTodos(user.uid);
            } else {
                setUser(null);
                setTodos([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Handle sign-in
    const handleSignIn = (e) => {
        e.preventDefault();
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('User signed in:', userCredential.user);
                setEmail('');
                setPassword('');
            })
            .catch((error) => {
                console.error('Error signing in:', error.message);
                alert(error.message);
            });
    };

    // Handle sign-out
    const handleSignOut = () => {
        auth.signOut()
            .then(() => {
                console.log('User signed out');
            })
            .catch((error) => {
                console.error('Error signing out:', error.message);
                alert(error.message);
            });
    };

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

    // Add a new todo
    const handleAddTodo = (e) => {
        e.preventDefault();
        if (newTodoTitle.trim() === '') return;

        firestore
            .collection('todos')
            .add({
                title: newTodoTitle,
                user_id: user.uid,
                completed: false,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
            })
            .then(() => {
                setNewTodoTitle('');
                console.log('Todo added');
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
                console.log('Todo updated');
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
            .then(() => {
                console.log('Todo deleted');
            })
            .catch((error) => {
                console.error('Error deleting todo:', error.message);
            });
    };

    return (
        <div className="App">
            {!user ? (
                <form onSubmit={handleSignIn}>
                    <h2>Sign In</h2>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Sign In</button>
                </form>
            ) : (
                <div>
                    <h2>Welcome, {user.email}</h2>
                    <button onClick={handleSignOut}>Sign Out</button>

                    <h3>Todo List</h3>
                    <form onSubmit={handleAddTodo}>
                        <input
                            type="text"
                            placeholder="New Todo"
                            value={newTodoTitle}
                            onChange={(e) => setNewTodoTitle(e.target.value)}
                        />
                        <button type="submit">Add Todo</button>
                    </form>

                    <ul>
                        {todos.map((todo) => (
                            <li key={todo.id}>
                                {editingTodoId === todo.id ? (
                                    <form onSubmit={handleUpdateTodo}>
                                        <input
                                            type="text"
                                            value={editingTodoTitle}
                                            onChange={(e) => setEditingTodoTitle(e.target.value)}
                                        />
                                        <button type="submit">Update</button>
                                    </form>
                                ) : (
                                    <div>
                                        <span>{todo.title}</span>
                                        <button onClick={() => handleEditTodo(todo.id, todo.title)}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeleteTodo(todo.id)}>
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    <FileUpload />
                </div>
            )}
        </div>
    );
}

export default App;
