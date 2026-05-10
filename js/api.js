export const BASE_URL = 'https://task-finance-backend-production.up.railway.app';

async function getTasks() {
  const response = await fetch(`${BASE_URL}/tasks`);
  if (!response.ok) {
    throw new Error('Gagal memuat daftar task');
  }
  return response.json();
}

async function addTask(data) {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseBody = await response.json();
  if (!response.ok) {
    throw new Error(responseBody.message || 'Gagal menambahkan task');
  }

  return responseBody;
}

async function deleteTask(id) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Gagal menghapus task');
  }

  return response.json();
}

async function getFinance() {
  const response = await fetch(`${BASE_URL}/finance`);
  if (!response.ok) {
    throw new Error('Gagal memuat data finance');
  }
  return response.json();
}

async function addFinance(data) {
  const response = await fetch(`${BASE_URL}/finance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseBody = await response.json();
  if (!response.ok) {
    throw new Error(responseBody.message || 'Gagal menambahkan data finance');
  }

  return responseBody;
}

async function deleteFinance(id) {
  if (!id) {
    throw new Error('ID finance tidak valid');
  }

  const response = await fetch(`${BASE_URL}/finance/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let message = 'Gagal menghapus data finance';
    try {
      const body = await response.json();
      if (body && body.message) {
        message = body.message;
      }
    } catch (_) {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204 || response.status === 202) {
    return { success: true };
  }

  return response.json();
}

export { getTasks, addTask, deleteTask, getFinance, addFinance, deleteFinance };
