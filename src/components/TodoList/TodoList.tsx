import React from 'react';
import { Todo } from '../../types/Todo';
import { TodoInfo } from '../TodoInfo/TodoInfo';

interface Props {
  todos: Todo[],
  updatedTodo: (updateTodo: Todo, oldTodo: Todo) => void,
  removeTodo: (todoId: number) => void,
  loadingTodosId: number[]
}

export const TodoList: React.FC<Props> = (props) => {
  const {
    todos, updatedTodo, removeTodo, loadingTodosId,
  } = props;

  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map(todo => (
        <TodoInfo
          key={todo.id}
          todo={todo}
          updatedTodo={updatedTodo}
          removeTodo={removeTodo}
          isLoad={loadingTodosId.includes(todo.id)}
        />
      ))}
    </section>
  );
};
