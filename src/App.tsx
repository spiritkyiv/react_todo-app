import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getTodos, patchTodos, deleteTodo, postTodos,
} from './api/todos';
import { AuthContext } from './components/Auth/AuthContext';
import { ErrorNotification } from './components/Error/ErrorNotification';
import { Footer } from './components/Footer/Footer';
import { TodoHeader } from './components/TodoHeader/TodoHeader';
import { TodoList } from './components/TodoList/TodoList';
import { Todo } from './types/Todo';

export const App: React.FC = () => {
  const user = useContext(AuthContext);
  const newTodoField = useRef<HTMLInputElement>(null);
  const [todos, setTodos] = useState<Todo[] | []>([]);
  const [loadingTodosId, setLoadingTodosId] = useState<number[]>([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [error, setError] = useState('');
  const [todoTitle, setTodoTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadTodos = async () => {
    try {
      const TodosFromServer = await getTodos(user?.id || 0);

      setTodos(TodosFromServer);
    } catch {
      setError('Error to load user todos');
    } finally {
      setError('');
    }
  };

  useEffect(() => {
    if (newTodoField.current) {
      newTodoField.current.focus();
    }

    if (!user) {
      return;
    }

    loadTodos();
  }, []);

  const addTodo = async (newTodo: Todo) => {
    try {
      setIsAdding(true);
      setTodos(currentTodos => [...currentTodos, newTodo]);
    } catch {
      setError('Can`t add todo');
    } finally {
      setError('');
      setIsAdding(false);
    }
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsAdding(true);

    if (!todoTitle.trim()) {
      setError('Can`t add todo with empty title');
    } else {
      const newTodo = await postTodos({
        userId: user?.id || 0,
        title: todoTitle.trim(),
        completed: false,
      });

      setIsAdding(false);
      addTodo(newTodo);
    }

    setTodoTitle('');
  };

  const updateTodo = async (
    updatedTodo: Todo,
    previousTodo: Todo,
    updateAll = true,
  ) => {
    if (JSON.stringify(updatedTodo) !== JSON.stringify(previousTodo)) {
      try {
        setLoadingTodosId((previous) => [...previous, updatedTodo.id]);
        const UpdatTodoFromServer
          = await patchTodos(updatedTodo, updatedTodo.id);
        const updateTodos = todos.map((todo) => (todo.id === updatedTodo.id
          ? UpdatTodoFromServer
          : todo));

        if (updateAll) {
          setTodos(updateTodos);
        }
      } catch {
        setError('Cannot update todos');
      } finally {
        setError('');
        setLoadingTodosId([]);
      }
    }
  };

  const removeTodo = async (todoId: number, updateAll = true) => {
    try {
      setLoadingTodosId(previous => [...previous, todoId]);
      await deleteTodo(todoId);

      if (updateAll) {
        const todosAfterRemove = todos.filter(todo => todo.id !== todoId);

        setTodos(todosAfterRemove);
      }
    } catch {
      setError('Can`t dealete todo');
    } finally {
      setLoadingTodosId([]);
      setError('');
    }
  };

  const selectAll = async () => {
    const unselectTodos = todos.filter(todo => todo.completed === false);

    // const promises: any[] = [];

    if (unselectTodos.length) {
      await Promise.all(unselectTodos
        .map((todo) => updateTodo({ ...todo, completed: true }, todo, false)));
    } else {
      await Promise.all(todos
        .map((todo) => updateTodo({ ...todo, completed: false }, todo, false)));
    }

    await loadTodos();
  };

  const clearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed === true);

    const promises: any[] = [];

    if (completedTodos.length) {
      completedTodos.forEach((todo) => {
        promises.push(removeTodo(todo.id, false));
      });
    }

    await Promise.all(promises);
    await loadTodos();
  };

  const memorizeFilter = useMemo(() => {
    const filterBy = (todoStatus: boolean) => {
      switch (currentFilter) {
        case 'active':
          return !todoStatus;

        case 'completed':
          return todoStatus;

        case 'all':
        default:
          return true;
      }
    };

    const filteredTodos = todos.filter(todo => filterBy(todo.completed));

    return filteredTodos;
  }, [todos, currentFilter]);

  const countLeftItems = () => (todos
    .filter(todo => todo.completed === false).length);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <TodoHeader
          selectAll={selectAll}
          todoTitle={todoTitle}
          setTodoTitle={setTodoTitle}
          handleSubmit={handleSubmit}
        />
        <TodoList
          todos={memorizeFilter}
          updatedTodo={updateTodo}
          removeTodo={removeTodo}
          loadingTodosId={loadingTodosId}
          todoTitle={todoTitle}
          isAdding={isAdding}
        />
        <Footer
          setCurrentFilter={setCurrentFilter}
          itemsLeft={countLeftItems()}
          currentFilter={currentFilter}
          clearCompleted={clearCompleted}
        />
        {error
        && (
          <ErrorNotification
            errorMessage={error}
            updateError={setError}
          />
        )}
      </div>
    </div>
  );
};
