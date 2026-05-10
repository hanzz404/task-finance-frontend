import { getFinance, addFinance, deleteFinance } from './api.js';
import { renderFinance, setStatusMessage, showNotification } from './ui.js';

const financeForm = document.getElementById('finance-form');
const financeAmountInput = document.getElementById('finance-amount');
const financeDateInput = document.getElementById('finance-date');
const financeTypeSelect = document.getElementById('finance-type');
const financeCategorySelect = document.getElementById('finance-category');
const financeCategoryCustomInput = document.getElementById('finance-category-custom');
const financeList = document.getElementById('finance-list');
const totalBalance = document.getElementById('total-balance');
const statusMessage = document.getElementById('status-message');
let chartUpdater = null;

const FINANCE_CACHE_KEY = 'keepnote-cached-finance';

function saveCachedFinance(items) {
  try {
    localStorage.setItem(FINANCE_CACHE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Gagal menyimpan cache finance', error);
  }
}

function loadCachedFinance() {
  try {
    const raw = localStorage.getItem(FINANCE_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Gagal memuat cache finance', error);
    return [];
  }
}

async function loadFinance() {
  try {
    setStatusMessage(statusMessage, 'Memuat finance...', 'success');
    let items = [];

    if (navigator.onLine) {
      items = await getFinance();
      saveCachedFinance(items);
    } else {
      items = loadCachedFinance();
      setStatusMessage(statusMessage, 'Offline: Menampilkan data finance terakhir dari cache.', 'success');
    }

    financeList.innerHTML = '';
    financeList.appendChild(renderFinance(items, handleDeleteFinance));
    updateTotalBalance(items);
    if (chartUpdater) {
      chartUpdater(items);
    }
    setStatusMessage(statusMessage, 'Data finance berhasil dimuat.', 'success');
  } catch (error) {
    const cached = loadCachedFinance();
    if (cached.length) {
      financeList.innerHTML = '';
      financeList.appendChild(renderFinance(cached, handleDeleteFinance));
      updateTotalBalance(cached);
      if (chartUpdater) {
        chartUpdater(cached);
      }
      setStatusMessage(statusMessage, 'Gagal memuat data terbaru, menampilkan cache.', 'error');
    } else {
      setStatusMessage(statusMessage, error.message, 'error');
      financeList.innerHTML = '';
    }
  }
}

function updateTotalBalance(items) {
  let total = 0;
  items.forEach(item => {
    if (item.type === 'income') {
      total += item.amount || 0;
    } else if (item.type === 'expense') {
      total -= item.amount || 0;
    }
  });
  totalBalance.textContent = `Total Saldo: Rp ${total.toLocaleString('id-ID')}`;
}

async function handleAddFinance(event) {
  event.preventDefault();

  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;

  const amount = parseFloat(financeAmountInput.value);
  const date = financeDateInput.value;
  const type = financeTypeSelect.value;
  let category = financeCategorySelect.value;

  if (category === 'Lainnya') {
    category = financeCategoryCustomInput.value.trim();
  }

  if (isNaN(amount) || amount <= 0 || !date || !type || !category) {
    showNotification('Masukkan jumlah valid, tanggal, tipe, dan kategori.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Loading...';

  try {
    setStatusMessage(statusMessage, 'Menambahkan transaksi...', 'success');
    await addFinance({ amount, date, type, category });
    financeAmountInput.value = '';
    financeDateInput.value = '';
    financeTypeSelect.value = '';
    financeCategorySelect.value = '';
    financeCategoryCustomInput.value = '';
    financeCategoryCustomInput.classList.remove('visible');
    await loadFinance();
    showNotification('Transaksi berhasil ditambahkan.', 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

function setChartUpdater(updater) {
  chartUpdater = updater;
}

async function handleDeleteFinance(financeId) {
  try {
    setStatusMessage(statusMessage, 'Menghapus transaksi...', 'success');
    await deleteFinance(financeId);
    await loadFinance();
    showNotification('Transaksi berhasil dihapus.', 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

function initFinance() {
  financeCategorySelect.addEventListener('change', () => {
    if (financeCategorySelect.value === 'Lainnya') {
      financeCategoryCustomInput.classList.add('visible');
      financeCategoryCustomInput.required = true;
    } else {
      financeCategoryCustomInput.classList.remove('visible');
      financeCategoryCustomInput.required = false;
      financeCategoryCustomInput.value = '';
    }
  });

  financeForm.addEventListener('submit', handleAddFinance);
  loadFinance();
}

export { initFinance, loadFinance, setChartUpdater };
