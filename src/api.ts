const BASE = "http://localhost:3000";

export interface CarDto {
  id: number;
  name: string;
  color: string;
}

export const getData = async () => {
  const [cars, winners] = await Promise.all([
    (await apiFetch(`${BASE}/garage`)).json(),
    (await apiFetch(`${BASE}/winners`)).json(),
  ]);
  return { cars, winners } as {
    cars: Array<{ id: number; name: string; color: string }>;
    winners: Array<{ id: number; userId: number; wins: number; time: number }>;
  };
};

export const changeEngineStatus = async (
  id: number,
  status: "started" | "stopped" | "drive",
  signal?: AbortSignal
) => {
  const r = await apiFetch(`${BASE}/engine?id=${id}&status=${status}`, {
    method: "PATCH",
    signal,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json().catch(() => ({}));
};

export const saveWinner = async (id: number, time: number): Promise<void> => {
  try {
    const res = await fetch(`http://localhost:3000/winners/${id}`);
    if (res.ok) {
      const winner = await res.json();
      await fetch(`http://localhost:3000/winners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          wins: winner.wins + 1,
          time: Math.min(winner.time, time),
        }),
      });
    } else {
      await fetch("http://localhost:3000/winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, wins: 1, time }),
      });
    }
  } catch (e) {
    console.error("Failed to save winner:", e);
  }
};

export const sortByWins = async () => {
  try {
    const [sortAscWins, sortDescWins] = await Promise.all([
      fetch("http://localhost:3000/winners?_sort=wins&_order=asc", {
        method: "GET",
      }),
      fetch("http://localhost:3000/winners?_sort=wins&_order=desc", {
        method: "GET",
      }),
    ]);

    if (!sortAscWins.ok || !sortDescWins.ok) throw new Error("Fetch failed");
    const ascWins = await sortAscWins.json();
    const descWins = await sortDescWins.json();
    return { ascWins, descWins };
  } catch {
    return null;
  }
};

export const sortByTime = async () => {
  try {
    const [sortAscTime, sortDescTime] = await Promise.all([
      fetch("http://localhost:3000/winners?_sort=time&_order=asc", {
        method: "GET",
      }),
      fetch("http://localhost:3000/winners?_sort=time&_order=desc", {
        method: "GET",
      }),
    ]);

    if (!sortAscTime.ok || !sortDescTime.ok) throw new Error("Fetch failed");
    const ascTime = await sortAscTime.json();
    const descTime = await sortDescTime.json();
    return { ascTime, descTime };
  } catch {
    return null;
  }
};

export const createCar = async (car: { name: string; color: string }) => {
  await apiFetch(`${BASE}/garage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(car),
  });
};

export const updateCar = async (
  id: number,
  patch: Partial<{ name: string; color: string }>
) => {
  const r = await apiFetch(`${BASE}/garage/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json().catch(() => undefined);
};

export const deleteCar = async (id: number) => {
  await apiFetch(`${BASE}/garage/${id}`, { method: "DELETE" });
};

export const deleteWinner = async (id: number) => {
  await apiFetch(`${BASE}/winners/${id}`, { method: "DELETE" });
};

export const bulkCreateCars = async (
  cars: Array<{ name: string; color: string }>
) => {
  await Promise.all(cars.map(createCar));
};

export const deleteAll = async (
  cars: Array<{ id: number }>,
  winners: Array<{ id: number }>
) => {
  await Promise.allSettled([
    ...cars.map((c) => deleteCar(c.id)),
    ...winners.map((w) => deleteWinner(w.id)),
  ]);
};

const apiFetch = async (url: string, init?: RequestInit) => {
  const r = await fetch(url, init);
  if (r.status === 401) {
    window.dispatchEvent(new Event("auth:required"));
    throw new Error("Not logged in");
  }
  return r;
};

export const auth = {
  current: async () =>
    (await apiFetch(`${BASE}/auth/current`)).json() as Promise<{
      user: { id: number; username: string } | null;
    }>,

  login: async (username: string, password: string) =>
    (
      await apiFetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
    ).json(),

  signup: async (username: string, password: string) =>
    (
      await apiFetch(`${BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
    ).json(),

  logout: async () =>
    (await apiFetch(`${BASE}/auth/logout`, { method: "POST" })).json(),
};

export const getMyStats = async () =>
  (await apiFetch(`${BASE}/stats/me`)).json() as Promise<{
    wins: number;
    losses: number;
  }>;

export const reportRaceGuess = async (
  chosenCarId: number,
  winnerCarId: number
) =>
  (
    await apiFetch(`${BASE}/stats/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chosenCarId, winnerCarId }),
    })
  ).json() as Promise<{ correct: boolean; wins: number; losses: number }>;
