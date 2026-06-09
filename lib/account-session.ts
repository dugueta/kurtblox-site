"use client";

export type StoredAccount = {
  id: string;
  name: string;
  email: string;
  provider: "email" | "google";
};

const accountStorageKey = "kurtblox-account";
const accountRemovedEvent = "kurtblox-account-removed";
const accountChangedEvent = "kurtblox-account-changed";

export function readStoredAccount() {
  const savedAccount = localStorage.getItem(accountStorageKey);

  if (!savedAccount) return null;

  try {
    return JSON.parse(savedAccount) as StoredAccount;
  } catch {
    clearStoredAccount();
    return null;
  }
}

export function storeStoredAccount(account: StoredAccount) {
  localStorage.setItem(accountStorageKey, JSON.stringify(account));
  window.dispatchEvent(new Event(accountChangedEvent));
}

export function clearStoredAccount() {
  localStorage.removeItem(accountStorageKey);
  window.dispatchEvent(new Event(accountRemovedEvent));
}

async function verifyStoredAccount() {
  const account = readStoredAccount();

  if (!account?.id) return null;

  try {
    const response = await fetch(`/api/accounts?id=${encodeURIComponent(account.id)}`, {
      cache: "no-store",
    });

    if (response.status === 404) {
      return account;
    }

    if (!response.ok) {
      return account;
    }

    const data = await response.json() as { account?: StoredAccount };

    if (data.account) {
      storeStoredAccount(data.account);
      return data.account;
    }

    return account;
  } catch {
    return account;
  }
}

export function startAccountDeletionWatcher(
  onAccountChange: (account: StoredAccount | null) => void,
  intervalMs = 120000
) {
  let active = true;
  let lastAccountSnapshot = JSON.stringify(readStoredAccount());

  function emitIfChanged(account: StoredAccount | null) {
    const nextSnapshot = JSON.stringify(account);

    if (nextSnapshot === lastAccountSnapshot) return;

    lastAccountSnapshot = nextSnapshot;
    onAccountChange(account);
  }

  async function checkAccount() {
    const account = await verifyStoredAccount();

    if (active) {
      emitIfChanged(account);
    }
  }

  function handleAccountRemoved() {
    emitIfChanged(null);
  }

  function handleAccountChanged() {
    emitIfChanged(readStoredAccount());
  }

  function handleStorageChange(event: StorageEvent) {
    if (event.key === accountStorageKey) {
      emitIfChanged(readStoredAccount());
    }
  }

  void checkAccount();
  const interval = window.setInterval(checkAccount, intervalMs);
  window.addEventListener(accountRemovedEvent, handleAccountRemoved);
  window.addEventListener(accountChangedEvent, handleAccountChanged);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    active = false;
    window.clearInterval(interval);
    window.removeEventListener(accountRemovedEvent, handleAccountRemoved);
    window.removeEventListener(accountChangedEvent, handleAccountChanged);
    window.removeEventListener("storage", handleStorageChange);
  };
}
