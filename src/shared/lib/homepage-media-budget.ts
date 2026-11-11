type QueueTask = {
  id: string;
  run: () => void;
};

function createQueue(maxConcurrent: number) {
  let active = 0;
  const pending: QueueTask[] = [];

  return {
    enqueue(task: QueueTask) {
      if (active < maxConcurrent) {
        active += 1;
        task.run();
        return;
      }

      pending.push(task);
    },
    remove(taskId: string) {
      const index = pending.findIndex((task) => task.id === taskId);
      if (index >= 0) {
        pending.splice(index, 1);
      }
    },
    release() {
      active = Math.max(0, active - 1);
      const nextTask = pending.shift();
      if (nextTask) {
        active += 1;
        nextTask.run();
      }
    },
  };
}

const homepageVideoQueue = createQueue(2);
