function renderTasks(tasks, onDelete, onToggle) {
  const fragment = document.createDocumentFragment();

  if (!Array.isArray(tasks) || tasks.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'Belum ada data';
    fragment.appendChild(emptyItem);
    return fragment;
  }

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = 'item-card';
    const completed = Boolean(task.completed);
    if (completed) {
      item.classList.add('completed');
    }

    const taskInfo = document.createElement('div');
    taskInfo.className = 'item-info';

    const title = document.createElement('span');
    title.className = 'item-title';
    title.textContent = task.title || 'Tanpa judul';

    const priority = document.createElement('span');
    priority.className = 'item-meta';
    priority.textContent = `Prioritas: ${task.priority ?? 'normal'}`;

    const deadline = document.createElement('span');
    deadline.className = 'item-meta';
    deadline.textContent = `Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString('id-ID') : 'Belum diatur'}`;

    const statusLabel = document.createElement('span');
    statusLabel.className = `item-status ${completed ? 'done' : 'not-done'}`;
    statusLabel.textContent = completed ? 'Sudah dikerjakan' : 'Belum dikerjakan';

    taskInfo.append(title, priority, deadline, statusLabel);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'button-complete';
    toggleButton.textContent = completed ? 'Batalkan' : 'Selesai';
    toggleButton.addEventListener('click', () => onToggle(task._id || task.id, !completed));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Hapus';
    deleteButton.addEventListener('click', () => onDelete(task._id || task.id));

    actions.append(toggleButton, deleteButton);
    item.append(taskInfo, actions);
    fragment.appendChild(item);
  });

  return fragment;
}

function renderFinance(items, onDelete) {
  const fragment = document.createDocumentFragment();

  if (!Array.isArray(items) || items.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'Belum ada data';
    fragment.appendChild(emptyItem);
    return fragment;
  }

  items.forEach((item) => {
    const card = document.createElement('li');
    card.className = 'finance-card';

    const header = document.createElement('div');
    header.className = 'finance-card-header';

    const amount = document.createElement('span');
    amount.className = 'finance-amount';
    amount.textContent = `Rp ${item.amount?.toLocaleString('id-ID') ?? 0}`;

    const typeBadge = document.createElement('span');
    typeBadge.className = `finance-type-badge ${item.type === 'income' ? 'income' : 'expense'}`;
    typeBadge.textContent = (item.type ?? 'unknown').toUpperCase();

    header.append(amount, typeBadge);

    const body = document.createElement('div');
    body.className = 'finance-card-body';

    const category = document.createElement('span');
    category.className = 'finance-meta';
    category.textContent = `Kategori: ${item.category ?? '-'}`;

    const date = document.createElement('span');
    date.className = 'finance-meta';
    date.textContent = `Tanggal: ${item.date ? new Date(item.date).toLocaleDateString('id-ID') : 'Belum diatur'}`;

    body.append(category, date);

    const actions = document.createElement('div');
    actions.className = 'finance-card-actions';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'button-delete';
    deleteButton.textContent = 'Hapus';
    deleteButton.addEventListener('click', () => onDelete(item._id || item.id));

    actions.appendChild(deleteButton);
    card.append(header, body, actions);
    fragment.appendChild(card);
  });

  return fragment;
}

function setStatusMessage(element, message, type = 'success') {
  element.textContent = message;
  element.className = `status-message ${type}`;
}

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (!notification) return;

  // Set message and type
  notification.textContent = message;
  notification.className = `notification ${type}`;

  // Show notification
  notification.classList.add('show');

  // Auto hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

export { renderTasks, renderFinance, setStatusMessage, showNotification };
