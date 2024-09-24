import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY', // Replace with your Firebase API key
  authDomain: 'your-app.firebaseapp.com', // Replace with your auth domain
  projectId: 'your-project-id', // Replace with your project ID
  // ...other Firebase config options
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    let unsubscribeTodos;
    if (user) {
      const q = query(
        collection(db, 'todos'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      unsubscribeTodos = onSnapshot(q, (querySnapshot) => {
        const todosData = [];
        querySnapshot.forEach((doc) => {
          todosData.push({ id: doc.id, ...doc.data() });
        });
        setTodos(todosData);
      });
    } else {
      setTodos([]);
    }

    return () => {
      if (unsubscribeTodos) {
        unsubscribeTodos();
      }
    };
  }, [user]);

  const signIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
      console.error('Error signing in:', error.message);
    });
  };

  const signOutUser = () => {
    signOut(auth)
      .then(() => {
        setTodos([]);
      })
      .catch((error) => {
        console.error('Error signing out:', error.message);
      });
  };

  const fetchTodos = () => {
    // Not needed as we're using real-time listeners with onSnapshot
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (newTodo.trim() === '') return;
    try {
      await addDoc(collection(db, 'todos'), {
        title: newTodo,
        completed: false,
        user_id: user.uid,
        created_at: new Date(),
      });
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error.message);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await deleteDoc(doc(db, 'todos', id));
    } catch (error) {
      console.error('Error deleting todo:', error.message);
    }
  };

  return (
    <div className="App">
      <h1>Firebase Todo App</h1>
      {user ? (
        <>
          <p>Welcome, {user.email}!</p>
          <button onClick={signOutUser}>Sign Out</button>
          <form onSubmit={addTodo}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo"
            />
            <button type="submit">Add Todo</button>
          </form>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id}>
                {todo.title}
                <button onClick={() => deleteTodo(todo.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button onClick={signIn}>Sign In with Google</button>
      )}
    </div>
  );
}

export default App;
