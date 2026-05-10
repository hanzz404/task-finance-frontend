import { getTasks, addTask, deleteTask } from './api.js';
import { renderTasks, setStatusMessage, showNotification } from './ui.js';
import { initFinance, setChartUpdater } from './finance.js';

const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title-input');
const taskDeadlineInput = document.getElementById('task-deadline');
const taskPrioritySelect = document.getElementById('task-priority');
const taskList = document.getElementById('task-list');
const statusMessage = document.getElementById('status-message');
const navButtons = document.querySelectorAll('.nav-button');
const financeChartCanvas = document.getElementById('financeChart');
const financeFilterSelect = document.getElementById('finance-filter');
let financeChart = null;
let currentFinanceItems = [];

async function loadTasks() {
  try {
    setStatusMessage(statusMessage, 'Memuat task...', 'success');
    const tasks = await getTasks();
    taskList.innerHTML = '';
    taskList.appendChild(renderTasks(tasks, handleDelete));
    setStatusMessage(statusMessage, 'Daftar task berhasil dimuat.', 'success');
  } catch (error) {
    setStatusMessage(statusMessage, error.message, 'error');
    taskList.innerHTML = '';
  }
}

function switchPanel(targetId) {
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('panel-active', panel.id === targetId);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === targetId);
  });
}

function setupNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => switchPanel(button.dataset.target));
  });
  switchPanel('task-panel');
}

function getRangeStart(range) {
  const now = new Date();
  const start = new Date(now);

  switch (range) {
    case '1D':
      start.setDate(now.getDate() - 1);
      break;
    case '1W':
      start.setDate(now.getDate() - 7);
      break;
    case '1M':
      start.setMonth(now.getMonth() - 1);
      break;
    case '1Y':
      start.setFullYear(now.getFullYear() - 1);
      start.setDate(1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  start.setHours(0, 0, 0, 0);
  return start;
}

function formatLabel(date, range) {
  if (range === '1Y') {
    return date.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
  }
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function buildChartData(finances, range) {
  const now = new Date();
  const start = getRangeStart(range);
  const labels = [];
  const incomeMap = new Map();
  const expenseMap = new Map();

  if (range === '1Y') {
    const cursor = new Date(start);
    while (cursor <= now) {
      const label = formatLabel(cursor, range);
      labels.push(label);
      incomeMap.set(label, 0);
      expenseMap.set(label, 0);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const cursor = new Date(start);
    while (cursor <= now) {
      const label = formatLabel(cursor, range);
      labels.push(label);
      incomeMap.set(label, 0);
      expenseMap.set(label, 0);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  finances.forEach((item) => {
    if (!item.date) return;
    const date = new Date(item.date);
    if (date < start || date > now) return;

    const label = formatLabel(date, range);
    if (!incomeMap.has(label)) return;

    const amount = Number(item.amount) || 0;
    if (item.type === 'income') {
      incomeMap.set(label, incomeMap.get(label) + amount);
    } else if (item.type === 'expense') {
      expenseMap.set(label, expenseMap.get(label) + amount);
    }
  });

  return {
    labels,
    datasets: [
      {
        label: 'Income',
        data: labels.map((label) => incomeMap.get(label)),
        backgroundColor: '#16a34a',
      },
      {
        label: 'Expense',
        data: labels.map((label) => expenseMap.get(label)),
        backgroundColor: '#dc2626',
      },
    ],
  };
}

function updateChart(finances) {
  if (!financeChartCanvas) {
    return;
  }

  currentFinanceItems = finances;
  const range = financeFilterSelect?.value || '1M';
  const chartData = buildChartData(finances, range);

  if (financeChart) {
    financeChart.destroy();
    financeChart = null;
  }

  financeChart = new Chart(financeChartCanvas.getContext('2d'), {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#334155', maxRotation: 0, minRotation: 0 },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: '#334155',
            callback: (value) => `Rp ${Number(value).toLocaleString('id-ID')}`,
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.16)',
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#334155',
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y || 0;
              return `${context.dataset.label}: Rp ${value.toLocaleString('id-ID')}`;
            },
          },
        },
      },
    },
  });
}

async function handleSubmit(event) {
  event.preventDefault();

  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;

  const title = taskTitleInput.value.trim();
  const deadline = taskDeadlineInput.value;
  const priority = taskPrioritySelect.value;

  if (!title || !deadline || !priority) {
    setStatusMessage(statusMessage, 'Masukkan judul, deadline, dan prioritas task.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Loading...';

  try {
    setStatusMessage(statusMessage, 'Menambahkan task...', 'success');
    await addTask({ title, deadline, priority });
    taskTitleInput.value = '';
    taskDeadlineInput.value = '';
    taskPrioritySelect.value = '';
    await loadTasks();
    showNotification('Task berhasil ditambahkan.', 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

async function handleDelete(taskId) {
  try {
    setStatusMessage(statusMessage, 'Menghapus task...', 'success');
    await deleteTask(taskId);
    await loadTasks();
    showNotification('Task berhasil dihapus.', 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

taskForm.addEventListener('submit', handleSubmit);
setupNavigation();
setChartUpdater(updateChart);
financeFilterSelect?.addEventListener('change', () => updateChart(currentFinanceItems));
loadTasks();
initFinance();
