interface EngineStatus {
  velocity: number;
  distance: number;
}
export const getData = async () => {
  try {
    const [carsRes, winnersRes] = await Promise.all([
      fetch("http://localhost:3000/garage"),
      fetch("http://localhost:3000/winners"),
    ]);
    if (!carsRes.ok || !winnersRes.ok) throw new Error("Fetch failed");
    const cars = await carsRes.json();
    const winners = await winnersRes.json();
    return { cars, winners };
  } catch {
    return null;
  }
};

export const changeEngineStatus = async (
  id: number,
  status: "started" | "stopped" | "drive"
): Promise<EngineStatus | null> => {
  try {
    const res = await fetch(
      `http://localhost:3000/engine?id=${id}&status=${status}`,
      {
        method: "PATCH",
      }
    );
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch {
    return null;
  }
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

export interface CarDto {
  id: number;
  name: string;
  color: string;
}

const BASE = "http://localhost:3000";

export const createCar = async (car: CarDto): Promise<void> => {
  const r = await fetch(`${BASE}/garage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(car),
  });
  if (!r.ok) throw new Error(await r.text());
};

export const updateCar = async (
  id: number,
  patch: { name: string; color: string }
): Promise<void> => {
  const r = await fetch(`${BASE}/garage/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(await r.text());
};

export const deleteCar = async (id: number): Promise<void> => {
  const r = await fetch(`${BASE}/garage/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
};

export const deleteWinner = async (id: number): Promise<void> => {
  const r = await fetch(`${BASE}/winners/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
};

export const bulkCreateCars = async (cars: CarDto[]): Promise<void> => {
  await Promise.all(cars.map((c) => createCar(c)));
};

export const deleteAll = async (
  cars: Array<{ id: number }>,
  winners: Array<{ id: number }>
): Promise<void> => {
  await Promise.all(
    cars.map(async (c) => {
      try {
        await deleteCar(c.id);
      } catch (e) {
        console.error("Car DELETE failed:", c.id, e);
      }
    })
  );
  await Promise.all(
    winners.map(async (w) => {
      try {
        await deleteWinner(Number(w.id));
      } catch (e) {
        console.error("Winner DELETE failed:", w.id, e);
      }
    })
  );
};
